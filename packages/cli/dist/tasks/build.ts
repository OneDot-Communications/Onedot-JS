import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PluginContainer } from '@onedot/plugins';

// Minimal process declaration if Node types absent
// @ts-ignore
declare const process: any;

interface BuildOptions { entry?: string; outDir?: string; production?: boolean; }

function ensureBundlerBuilt(root: string): string {
  const bundlerDir = path.join(root, 'packages', 'bundler');
  const target = path.join(bundlerDir, 'target', 'release');
  const bin = path.join(target, 'onedot_bundler');
  if (!fs.existsSync(bin)) {
    console.info('[bundler] building Rust bundler (release)...');
    const r = spawnSync('cargo', ['build','--release'], { cwd: bundlerDir, stdio: 'inherit', shell: true });
    if (r.status !== 0) throw new Error('Rust bundler build failed');
  }
  return bin;
}

export async function buildCommand(opts: BuildOptions = {}) {
  const root = process.cwd();
  const entry = opts.entry || path.join(root,'app','index.ts');
  if (!fs.existsSync(entry)) throw new Error('Missing entry: '+entry);
  const outDir = opts.outDir || path.join(root,'dist');
  fs.mkdirSync(outDir, { recursive: true });

  // Build TS sources first (core/runtime) for path resolution when app imports packages.
  // (Assumes user ran root build already in monorepo scenario.)

  // Invoke Rust bundler to collect graph (currently outputs nothing; we hash sources for cache key)
  const bin = ensureBundlerBuilt(root);
  // Future: pass JSON output path; for now just ensure binary is available.
  const graphJson = execFileSync(bin, [entry], { encoding: 'utf8' });
  interface GraphOut { modules: { id: string; exports: string[]; imports: string[] }[] }
  const graph: GraphOut = JSON.parse(graphJson);
  // Persist graph cache
  const cacheDir = path.join(outDir, '.onedot-cache');
  fs.mkdirSync(cacheDir, { recursive: true });
  const graphCacheFile = path.join(cacheDir, 'graph.json');
  let previous: GraphOut | null = null;
  if (fs.existsSync(graphCacheFile)) {
    try { previous = JSON.parse(fs.readFileSync(graphCacheFile,'utf8')); } catch {}
  }
  fs.writeFileSync(graphCacheFile, graphJson);
  if (previous) {
    const prevSet = new Set(previous.modules.map(m=>m.id));
    const curSet = new Set(graph.modules.map(m=>m.id));
    const added = [...curSet].filter(x=>!prevSet.has(x));
    const removed = [...prevSet].filter(x=>!curSet.has(x));
    console.info('[bundler] diff added:', added.length, 'removed:', removed.length);
  }
  const pluginContainer = new PluginContainer();
  // Plugin discovery: look for onedot.config.(js|mjs|cjs) exporting plugins array
  const configCandidates = ['onedot.config.js','onedot.config.mjs','onedot.config.cjs'].map(f=>path.join(root,f));
  for (const cfg of configCandidates) {
    if (fs.existsSync(cfg)) {
      try {
        const mod = await import(cfg + '?cachebust=' + Date.now());
        if (Array.isArray(mod.plugins)) {
          for (const p of mod.plugins) pluginContainer.register(p);
        }
      } catch (e) {
        console.warn('[build] failed loading config', cfg, e);
      }
    }
  }
  // Environment variable appended plugins (comma separated module paths)
  const envPlugins = (typeof process !== 'undefined' && (process as any).env && (process as any).env.ONEDOT_PLUGINS) ? (process as any).env.ONEDOT_PLUGINS : '';
  const pluginList = envPlugins.split(',').map((s: string)=>s.trim()).filter(Boolean);
  for (const pth of pluginList) {
    try {
      const mod = await import(pth);
      if (mod.default) pluginContainer.register(mod.default); else if (mod.plugin) pluginContainer.register(mod.plugin);
    } catch (e) {
      console.warn('[build] failed to import plugin', pth, e);
    }
  }
  // Build registry mapping short module ids to code (read file contents)
  const modulesCode: string[] = [];
  for (const m of graph.modules) {
    if (!fs.existsSync(m.id)) continue;
  let code = fs.readFileSync(m.id,'utf8');
  code = await pluginContainer.runTransforms(m.id, code);
    const shortId = path.relative(root, m.id).replace(/\\/g,'/');
  modulesCode.push(`  ${JSON.stringify(shortId)}: (module, exports, require) => {\n${code}\n  }`);
  }
  const registry = modulesCode.join(',\n');
  const entryRel = path.relative(root, entry).replace(/\\/g,'/');
  const hash = crypto.createHash('sha1').update(registry).digest('hex').slice(0,12);
  const bootstrap = `/* ONEDOT bundle hash:${hash} mode:${opts.production?'prod':'dev'} modules:${graph.modules.length} */\n`+
`const __onedot_modules = {\n${registry}\n};\n`+
`const __onedot_cache = {};\nfunction __onedot_require(id){ if(__onedot_cache[id]) return __onedot_cache[id].exports; const mod={exports:{}}; __onedot_cache[id]=mod; const fn=__onedot_modules[id]; if(!fn) throw new Error('Module '+id+' not found'); fn(mod, mod.exports, __onedot_require); return mod.exports;}\n`+
`(globalThis.__ONEDOT = globalThis.__ONEDOT || {}); globalThis.__ONEDOT.modules = __onedot_modules; globalThis.__ONEDOT.require = __onedot_require;\n`+
`// Entry\n__onedot_require(${JSON.stringify(entryRel)});\n`;
  const outFile = path.join(outDir,'bundle.js');
  fs.writeFileSync(outFile, bootstrap);
  // Simple code splitting: write out each non-entry module over size threshold as a separate raw chunk (future: dynamic loading map)
  const sizeThreshold = 8_000; // bytes
  const manifest: Record<string, any> = { entry: 'bundle.js', chunks: {} };
  for (const m of graph.modules) {
    if (m.id === entry) continue;
    if (!fs.existsSync(m.id)) continue;
    const code = fs.readFileSync(m.id,'utf8');
    if (code.length >= sizeThreshold) {
      const chunkName = 'chunk-' + crypto.createHash('sha1').update(m.id).digest('hex').slice(0,8) + '.js';
      const shortId = path.relative(root, m.id).replace(/\\/g,'/');
      const wrapped = `// CHUNK for ${shortId}\n(globalThis.__ONEDOT = globalThis.__ONEDOT || {});(globalThis.__ONEDOT.modules=globalThis.__ONEDOT.modules||{});\nglobalThis.__ONEDOT.modules[${JSON.stringify(shortId)}] = (module, exports, require) => {\n${code}\n};`;
      fs.writeFileSync(path.join(outDir, chunkName), wrapped);
      manifest.chunks[m.id] = chunkName;
    }
  }
  fs.writeFileSync(path.join(outDir,'manifest.json'), JSON.stringify(manifest,null,2));
  console.info('Bundle written', outFile, `(modules=${graph.modules.length})`);
}
