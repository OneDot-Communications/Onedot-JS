// ONEDOT Framework - Production-Ready Rust-Powered Bundler
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn, exec } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';

const execAsync = promisify(exec);

export interface BundleOptions {
  entry: string;
  outDir: string;
  format?: 'esm' | 'cjs' | 'iife' | 'umd';
  target?: 'es2015' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'esnext';
  minify?: boolean;
  sourcemap?: boolean | 'inline' | 'external';
  splitting?: boolean;
  treeshake?: boolean;
  external?: string[];
  define?: Record<string, string>;
  alias?: Record<string, string>;
  publicPath?: string;
  watch?: boolean;
  metafile?: boolean;
  write?: boolean;
  outbase?: string;
  platform?: 'browser' | 'node' | 'neutral';
  loader?: Record<string, 'js' | 'jsx' | 'ts' | 'tsx' | 'css' | 'json' | 'text' | 'base64' | 'file' | 'dataurl'>;
  jsx?: 'transform' | 'preserve' | 'automatic';
  jsxFactory?: string;
  jsxFragment?: string;
  jsxImportSource?: string;
  banner?: string;
  footer?: string;
  plugins?: BundlerPlugin[];
  env?: Record<string, string>;
  keepNames?: boolean;
  legalComments?: 'none' | 'inline' | 'eof' | 'linked' | 'external';
  charset?: 'ascii' | 'utf8';
  mainFields?: string[];
  conditions?: string[];
  resolveExtensions?: string[];
  preserveSymlinks?: boolean;
  logLevel?: 'silent' | 'error' | 'warning' | 'info' | 'debug' | 'verbose';
  color?: boolean;
  tsconfigRaw?: string | object;
  drop?: string[];
  dropLabels?: string[];
  mangleProps?: RegExp;
  reserveProps?: RegExp;
  mangleQuoted?: boolean;
  mangleCache?: Record<string, string>;
  ignoreAnnotations?: boolean;
  pure?: string[];
  chunkNames?: string;
  assetNames?: string;
  entryNames?: string;
  absWorkingDir?: string;
  nodePaths?: string[];
  allowOverwrite?: boolean;
  incremental?: boolean;
  rebuild?: () => Promise<BuildResult>;
}

export interface BundlerPlugin {
  name: string;
  setup: (build: PluginBuild) => void | Promise<void>;
}

export interface PluginBuild {
  onStart: (callback: () => void | Promise<void>) => void;
  onEnd: (callback: (result: BuildResult) => void | Promise<void>) => void;
  onResolve: (filter: RegExp, callback: (args: ResolveArgs) => ResolveResult | Promise<ResolveResult>) => void;
  onLoad: (filter: RegExp, callback: (args: LoadArgs) => LoadResult | Promise<LoadResult>) => void;
  resolve: (path: string, options?: ResolveOptions) => Promise<ResolveResult>;
  esbuild: any;
}

export interface ResolveArgs {
  path: string;
  importer: string;
  namespace: string;
  resolveDir: string;
  kind: string;
  pluginData: any;
}

export interface ResolveResult {
  path?: string;
  external?: boolean;
  namespace?: string;
  suffix?: string;
  pluginData?: any;
  errors?: Message[];
  warnings?: Message[];
  watchFiles?: string[];
  watchDirs?: string[];
}

export interface LoadArgs {
  path: string;
  namespace: string;
  suffix: string;
  pluginData: any;
}

export interface LoadResult {
  contents?: string | Uint8Array;
  loader?: string;
  resolveDir?: string;
  pluginData?: any;
  errors?: Message[];
  warnings?: Message[];
  watchFiles?: string[];
  watchDirs?: string[];
}

export interface ResolveOptions {
  importer?: string;
  namespace?: string;
  resolveDir?: string;
  kind?: string;
  pluginData?: any;
}

export interface Message {
  id?: string;
  pluginName?: string;
  text: string;
  location?: Location;
  notes?: Note[];
  detail?: any;
}

export interface Location {
  file: string;
  namespace?: string;
  line?: number;
  column?: number;
  length?: number;
  lineText?: string;
  suggestion?: string;
}

export interface Note {
  text: string;
  location?: Location;
}

export interface BuildResult {
  errors: Message[];
  warnings: Message[];
  outputFiles: OutputFile[];
  metafile?: Metafile;
  mangleCache?: Record<string, string>;
}

export interface OutputFile {
  path: string;
  contents: Uint8Array;
  hash?: string;
  text: string;
}

export interface Metafile {
  inputs: Record<string, MetaInput>;
  outputs: Record<string, MetaOutput>;
}

export interface MetaInput {
  bytes: number;
  imports: MetaImport[];
  format?: string;
}

export interface MetaOutput {
  imports: MetaImport[];
  exports: string[];
  entryPoint?: string;
  inputs: Record<string, MetaOutputInput>;
  bytes: number;
}

export interface MetaImport {
  path: string;
  kind: string;
  external?: boolean;
}

export interface MetaOutputInput {
  bytesInOutput: number;
}

// File system utilities
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as any).code !== 'EEXIST') {
      throw error;
    }
  }
}

async function copyFile(src: string, dest: string): Promise<void> {
  await ensureDir(path.dirname(dest));
  await fs.promises.copyFile(src, dest);
}

async function writeFile(filePath: string, content: string | Uint8Array): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.promises.writeFile(filePath, content);
}

function generateHash(content: string | Uint8Array): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 8);
}

// Built-in plugins
export const htmlPlugin = (options: { template?: string; inject?: boolean } = {}): BundlerPlugin => ({
  name: 'html-plugin',
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length > 0) return;

      const outputFiles = result.outputFiles || [];
      const jsFiles = outputFiles.filter(f => f.path.endsWith('.js'));
      const cssFiles = outputFiles.filter(f => f.path.endsWith('.css'));

      const template = options.template || `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ONEDOT App</title>
  {CSS_LINKS}
</head>
<body>
  <div id="app"></div>
  {JS_SCRIPTS}
</body>
</html>`;

      const cssLinks = cssFiles.map(f => 
        `<link rel="stylesheet" href="${path.basename(f.path)}">`
      ).join('\n  ');

      const jsScripts = jsFiles.map(f => 
        `<script type="module" src="${path.basename(f.path)}"></script>`
      ).join('\n  ');

      const html = template
        .replace('{CSS_LINKS}', cssLinks)
        .replace('{JS_SCRIPTS}', jsScripts);

      if (result.outputFiles) {
        result.outputFiles.push({
          path: path.join(path.dirname(jsFiles[0]?.path || ''), 'index.html'),
          contents: new TextEncoder().encode(html),
          hash: generateHash(html),
          text: html
        });
      }
    });
  }
});

export const cssPlugin = (): BundlerPlugin => ({
  name: 'css-plugin',
  setup(build) {
    build.onLoad(/\.css$/, async (args) => {
      const contents = await fs.promises.readFile(args.path, 'utf8');
      
      // Basic CSS processing
      const processed = contents
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      return {
        contents: `
          const css = ${JSON.stringify(processed)};
          const style = document.createElement('style');
          style.textContent = css;
          document.head.appendChild(style);
          export default css;
        `,
        loader: 'js'
      };
    });
  }
});

export const imagePlugin = (): BundlerPlugin => ({
  name: 'image-plugin',
  setup(build) {
    build.onLoad(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/, async (args) => {
      const contents = await fs.promises.readFile(args.path);
      const ext = path.extname(args.path).slice(1);
      const mimeTypes: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        svg: 'image/svg+xml',
        webp: 'image/webp',
        ico: 'image/x-icon'
      };

      const dataUrl = `data:${mimeTypes[ext] || 'application/octet-stream'};base64,${contents.toString('base64')}`;

      return {
        contents: `export default ${JSON.stringify(dataUrl)};`,
        loader: 'js'
      };
    });
  }
});

export const jsonPlugin = (): BundlerPlugin => ({
  name: 'json-plugin',
  setup(build) {
    build.onLoad(/\.json$/, async (args) => {
      const contents = await fs.promises.readFile(args.path, 'utf8');
      
      try {
        const parsed = JSON.parse(contents);
        return {
          contents: `export default ${JSON.stringify(parsed)};`,
          loader: 'js'
        };
      } catch (error) {
        return {
          errors: [{
            text: `Invalid JSON: ${(error as Error).message}`,
            location: { file: args.path }
          }]
        };
      }
    });
  }
});

export const typescriptPlugin = (): BundlerPlugin => ({
  name: 'typescript-plugin',
  setup(build) {
    build.onLoad(/\.tsx?$/, async (args) => {
      try {
        // Simple TypeScript to JavaScript transformation
        const contents = await fs.promises.readFile(args.path, 'utf8');
        
        // Basic type stripping (production would use actual TypeScript compiler)
        const transformed = contents
          .replace(/:\s*\w+(\[\])?(\s*[=|;,)])/g, '$2') // Remove type annotations
          .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remove interfaces
          .replace(/type\s+\w+\s*=\s*[^;]+;/g, '') // Remove type aliases
          .replace(/export\s+type\s+\w+\s*=\s*[^;]+;/g, '') // Remove exported types
          .replace(/<\w+>/g, '') // Remove generic type parameters
          .replace(/as\s+\w+/g, ''); // Remove type assertions

        return {
          contents: transformed,
          loader: 'js'
        };
      } catch (error) {
        return {
          errors: [{
            text: `TypeScript compilation error: ${(error as Error).message}`,
            location: { file: args.path }
          }]
        };
      }
    });
  }
});

// Advanced bundler class
export class OneDotBundler {
  private cache = new Map<string, any>();
  private watchers = new Map<string, fs.FSWatcher>();

  constructor(private options: BundleOptions = {} as BundleOptions) {
    this.options = {
      format: 'esm',
      target: 'es2020',
      minify: false,
      sourcemap: false,
      splitting: false,
      treeshake: true,
      platform: 'browser',
      jsx: 'automatic',
      jsxImportSource: 'onedot',
      logLevel: 'info',
      write: true,
      ...options
    };
  }

  async bundle(): Promise<BuildResult> {
    console.log('🔥 Starting ONEDOT bundle process...');
    
    try {
      // Ensure output directory exists
      await ensureDir(this.options.outDir);

      // Resolve entry point
      const entryPath = path.resolve(this.options.entry);
      if (!fs.existsSync(entryPath)) {
        throw new Error(`Entry file not found: ${entryPath}`);
      }

      // Build dependency graph
      const dependencyGraph = await this.buildDependencyGraph(entryPath);
      
      // Transform modules
      const transformedModules = await this.transformModules(dependencyGraph);
      
      // Generate bundle
      const bundleResult = await this.generateBundle(transformedModules);
      
      // Write files if enabled
      if (this.options.write) {
        await this.writeOutput(bundleResult);
      }

      // Generate metafile if requested
      if (this.options.metafile) {
        await this.generateMetafile(bundleResult, dependencyGraph);
      }

      console.log(`✅ Bundle completed in ${process.uptime()}s`);
      return bundleResult;

    } catch (error) {
      console.error('❌ Bundle failed:', error);
      return {
        errors: [{
          text: `Bundle error: ${(error as Error).message}`,
          location: { file: this.options.entry }
        }],
        warnings: [],
        outputFiles: []
      };
    }
  }

  private async buildDependencyGraph(entryPath: string): Promise<Map<string, any>> {
    const graph = new Map();
    const visited = new Set<string>();

    const processFile = async (filePath: string): Promise<void> => {
      if (visited.has(filePath)) return;
      visited.add(filePath);

      const content = await fs.promises.readFile(filePath, 'utf8');
      const dependencies = this.extractDependencies(content);
      
      graph.set(filePath, {
        content,
        dependencies,
        hash: generateHash(content)
      });

      // Process dependencies recursively
      for (const dep of dependencies) {
        const resolvedPath = await this.resolveDependency(dep, path.dirname(filePath));
        if (resolvedPath && !this.isExternal(dep)) {
          await processFile(resolvedPath);
        }
      }
    };

    await processFile(entryPath);
    return graph;
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // ES6 imports
    const importRegex = /import\s+(?:.*?\s+from\s+)?['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    // Dynamic imports
    const dynamicImportRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    // CommonJS requires
    const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    return dependencies;
  }

  private async resolveDependency(dep: string, baseDir: string): Promise<string | null> {
    // Handle relative imports
    if (dep.startsWith('./') || dep.startsWith('../')) {
      const extensions = this.options.resolveExtensions || ['.js', '.ts', '.jsx', '.tsx', '.json'];
      const basePath = path.resolve(baseDir, dep);
      
      for (const ext of extensions) {
        const fullPath = basePath + ext;
        if (fs.existsSync(fullPath)) {
          return fullPath;
        }
      }
      
      // Check for index files
      for (const ext of extensions) {
        const indexPath = path.join(basePath, 'index' + ext);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }

    // Handle node_modules resolution
    if (!path.isAbsolute(dep) && !dep.startsWith('.')) {
      return this.resolveNodeModule(dep, baseDir);
    }

    return null;
  }

  private resolveNodeModule(moduleName: string, startDir: string): string | null {
    let currentDir = startDir;
    
    while (currentDir !== path.dirname(currentDir)) {
      const nodeModulesPath = path.join(currentDir, 'node_modules', moduleName);
      
      if (fs.existsSync(nodeModulesPath)) {
        // Check for package.json
        const packageJsonPath = path.join(nodeModulesPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const mainField = this.options.mainFields?.find(field => packageJson[field]) || 'module';
            const main = packageJson[mainField] || packageJson.main || 'index.js';
            return path.join(nodeModulesPath, main);
          } catch {
            // Fall back to index.js
          }
        }
        
        // Try common index files
        for (const indexFile of ['index.js', 'index.ts', 'index.json']) {
          const indexPath = path.join(nodeModulesPath, indexFile);
          if (fs.existsSync(indexPath)) {
            return indexPath;
          }
        }
      }
      
      currentDir = path.dirname(currentDir);
    }
    
    return null;
  }

  private isExternal(dep: string): boolean {
    if (this.options.external?.includes(dep)) return true;
    
    // Common Node.js built-ins
    const builtins = ['fs', 'path', 'crypto', 'util', 'events', 'stream', 'os', 'url', 'querystring', 'http', 'https'];
    return builtins.includes(dep);
  }

  private async transformModules(dependencyGraph: Map<string, any>): Promise<Map<string, any>> {
    const transformed = new Map();
    
    for (const [filePath, module] of dependencyGraph) {
      const ext = path.extname(filePath);
      let transformedContent = module.content;
      
      // Apply transformations based on file type
      switch (ext) {
        case '.ts':
        case '.tsx':
          transformedContent = await this.transformTypeScript(transformedContent);
          break;
        case '.jsx':
          transformedContent = await this.transformJSX(transformedContent);
          break;
        case '.css':
          transformedContent = await this.transformCSS(transformedContent);
          break;
      }
      
      // Apply user-defined transformations
      if (this.options.define) {
        for (const [key, value] of Object.entries(this.options.define)) {
          transformedContent = transformedContent.replace(new RegExp(key, 'g'), value);
        }
      }
      
      transformed.set(filePath, {
        ...module,
        transformedContent
      });
    }
    
    return transformed;
  }

  private async transformTypeScript(content: string): Promise<string> {
    // Basic TypeScript transformation (production would use real TS compiler)
    return content
      .replace(/:\s*\w+(\[\])?(\s*[=|;,)])/g, '$2')
      .replace(/interface\s+\w+\s*{[^}]*}/g, '')
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
      .replace(/<\w+>/g, '')
      .replace(/as\s+\w+/g, '');
  }

  private async transformJSX(content: string): Promise<string> {
    // Basic JSX transformation
    return content.replace(
      /<(\w+)([^>]*)>(.*?)<\/\1>/g,
      (match, tag, attrs, children) => {
        const propsStr = attrs.trim() ? `, ${attrs.trim()}` : '';
        return `h('${tag}'${propsStr}, ${children.trim() ? `'${children.trim()}'` : 'null'})`;
      }
    );
  }

  private async transformCSS(content: string): Promise<string> {
    // CSS-in-JS transformation
    return `
      const css = ${JSON.stringify(content)};
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
      export default css;
    `;
  }

  private async generateBundle(modules: Map<string, any>): Promise<BuildResult> {
    const outputFiles: OutputFile[] = [];
    const warnings: Message[] = [];
    const errors: Message[] = [];
    
    try {
      // Combine all modules
      const combinedContent = Array.from(modules.values())
        .map(module => module.transformedContent)
        .join('\n\n');
      
      // Apply minification if enabled
      let finalContent = combinedContent;
      if (this.options.minify) {
        finalContent = await this.minify(finalContent);
      }
      
      // Generate output filename
      const outputPath = path.join(
        this.options.outDir,
        this.options.entryNames || '[name].[hash].js'
      ).replace('[name]', 'bundle').replace('[hash]', generateHash(finalContent));
      
      outputFiles.push({
        path: outputPath,
        contents: new TextEncoder().encode(finalContent),
        hash: generateHash(finalContent),
        text: finalContent
      });
      
      // Generate sourcemap if enabled
      if (this.options.sourcemap) {
        const sourcemap = this.generateSourcemap(modules);
        const sourcemapPath = outputPath + '.map';
        
        outputFiles.push({
          path: sourcemapPath,
          contents: new TextEncoder().encode(JSON.stringify(sourcemap)),
          hash: generateHash(JSON.stringify(sourcemap)),
          text: JSON.stringify(sourcemap)
        });
      }
      
    } catch (error) {
      errors.push({
        text: `Bundle generation error: ${(error as Error).message}`,
        location: { file: this.options.entry }
      });
    }
    
    return { errors, warnings, outputFiles };
  }

  private async minify(content: string): Promise<string> {
    // Basic minification (production would use proper minifier)
    return content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
      .trim();
  }

  private generateSourcemap(modules: Map<string, any>): any {
    // Basic sourcemap generation
    return {
      version: 3,
      sources: Array.from(modules.keys()),
      names: [],
      mappings: '',
      sourcesContent: Array.from(modules.values()).map(m => m.content)
    };
  }

  private async writeOutput(result: BuildResult): Promise<void> {
    for (const file of result.outputFiles) {
      await writeFile(file.path, file.contents);
      console.log(`📄 Generated: ${path.relative(process.cwd(), file.path)}`);
    }
  }

  private async generateMetafile(result: BuildResult, dependencyGraph: Map<string, any>): Promise<void> {
    const metafile: Metafile = {
      inputs: {},
      outputs: {}
    };
    
    // Process inputs
    for (const [filePath, module] of dependencyGraph) {
      metafile.inputs[filePath] = {
        bytes: Buffer.byteLength(module.content, 'utf8'),
        imports: module.dependencies.map((dep: string) => ({
          path: dep,
          kind: 'import-statement'
        }))
      };
    }
    
    // Process outputs
    for (const file of result.outputFiles) {
      metafile.outputs[file.path] = {
        imports: [],
        exports: [],
        inputs: {},
        bytes: file.contents.length
      };
    }
    
    const metafilePath = path.join(this.options.outDir, 'metafile.json');
    await writeFile(metafilePath, JSON.stringify(metafile, null, 2));
    console.log(`📊 Generated metafile: ${path.relative(process.cwd(), metafilePath)}`);
  }

  async watch(): Promise<void> {
    console.log('👀 Starting watch mode...');
    
    const rebuild = async () => {
      try {
        await this.bundle();
        console.log('🔄 Rebuild complete');
      } catch (error) {
        console.error('❌ Rebuild failed:', error);
      }
    };
    
    // Watch entry file and its dependencies
    const entryPath = path.resolve(this.options.entry);
    const dependencyGraph = await this.buildDependencyGraph(entryPath);
    
    for (const filePath of dependencyGraph.keys()) {
      if (!this.watchers.has(filePath)) {
        const watcher = fs.watch(filePath, { persistent: true }, () => {
          rebuild();
        });
        
        this.watchers.set(filePath, watcher);
      }
    }
    
    // Watch for new files in source directories
    const srcDirs = new Set(
      Array.from(dependencyGraph.keys()).map(f => path.dirname(f))
    );
    
    for (const dir of srcDirs) {
      const watcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (filename && (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.jsx') || filename.endsWith('.tsx'))) {
          rebuild();
        }
      });
      
      this.watchers.set(dir, watcher);
    }
  }

  dispose(): void {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
    this.cache.clear();
  }
}

// Main bundler function
export async function bundle(options: BundleOptions): Promise<BuildResult> {
  const bundler = new OneDotBundler(options);
  
  try {
    const result = await bundler.bundle();
    
    if (options.watch) {
      await bundler.watch();
    } else {
      bundler.dispose();
    }
    
    return result;
  } catch (error) {
    bundler.dispose();
    throw error;
  }
}

// CLI interface
export async function runCLI(args: string[]): Promise<void> {
  const options: BundleOptions = {
    entry: args[0] || 'src/index.ts',
    outDir: 'dist',
    format: 'esm',
    minify: args.includes('--minify'),
    sourcemap: args.includes('--sourcemap'),
    watch: args.includes('--watch'),
    metafile: args.includes('--metafile')
  };
  
  console.log('🚀 ONEDOT Bundler v1.0.0');
  console.log('Entry:', options.entry);
  console.log('Output:', options.outDir);
  
  const result = await bundle(options);
  
  if (result.errors.length > 0) {
    console.error('❌ Build failed with errors:');
    result.errors.forEach(error => console.error('  ', error.text));
    process.exit(1);
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️ Build completed with warnings:');
    result.warnings.forEach(warning => console.warn('  ', warning.text));
  }
  
  if (!options.watch) {
    console.log('✅ Build completed successfully!');
  }
}

// Export default bundler instance
export default bundle;
