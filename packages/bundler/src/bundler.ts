import chalk from 'chalk';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Compiler } from './compiler';
import { BundleConfig, BundleResult } from './config';
import { Optimizer } from './optimizer';
import { PluginManager } from './plugin-manager';
import { Resolver } from './resolver';
import { createSourceMap, generateHash } from './utils';

export class Bundler extends EventEmitter {
  private config: BundleConfig;
  private resolver: Resolver;
  private compiler: Compiler;
  private optimizer: Optimizer;
  private pluginManager: PluginManager;
  private rustBundlerPath: string;
  private isProduction: boolean;

  constructor(config: BundleConfig) {
    super();
    this.config = this.normalizeConfig(config);
    this.resolver = new Resolver(this.config);
    this.compiler = new Compiler(this.config);
    this.optimizer = new Optimizer(this.config.optimization);
    this.pluginManager = new PluginManager(this.config.plugins || []);
    this.isProduction = this.config.mode === 'production';
    this.rustBundlerPath = this.getRustBundlerPath();
  }

  async bundle(): Promise<BundleResult> {
    const startTime = Date.now();
    const result: BundleResult = {
      entries: {},
      assets: [],
      stats: {
        time: 0,
        size: 0,
        modules: 0,
        assets: 0
      },
      diagnostics: [],
      warnings: [],
      errors: []
    };

    try {
      // Initialize bundling process
      this.emit('start', this.config);

      // Resolve entry points
      const entryModules = await this.resolveEntries();

      // Build module graph
      const moduleGraph = await this.buildModuleGraph(entryModules);

      // Compile modules
      const compilationResult = await this.compiler.compile(moduleGraph);

      // Apply plugins
      await this.pluginManager.processCompilation(compilationResult);

      // Optimize bundle
      const optimizedResult = await this.optimizer.optimize(compilationResult);

      // Generate final bundle
      const bundleResult = await this.generateBundle(optimizedResult);

      // Process assets
      await this.processAssets(bundleResult);

      // Generate stats
      result.stats = this.generateStats(bundleResult, startTime);

      // Set result entries
      for (const [name, entry] of Object.entries(bundleResult.entries)) {
        result.entries[name] = {
          path: entry.path,
          size: entry.size,
          map: entry.map
        };
      }

      // Set result assets
      result.assets = bundleResult.assets;

      // Set diagnostics
      result.diagnostics = [...compilationResult.diagnostics, ...optimizedResult.diagnostics];
      result.warnings = result.diagnostics.filter(d => d.severity === 'warning');
      result.errors = result.diagnostics.filter(d => d.severity === 'error');

      // Emit result
      this.emit('end', result);

      return result;
    } catch (error) {
      result.errors.push({
        message: error.message,
        severity: 'error',
        code: 'BUNDLE_ERROR',
        file: error.file,
        line: error.line,
        column: error.column
      });

      this.emit('error', error);
      throw error;
    }
  }

  private normalizeConfig(config: BundleConfig): BundleConfig {
    return {
      ...config,
      mode: config.mode || 'development',
      entry: config.entry || {},
      output: {
        path: path.resolve(config.output?.path || 'dist'),
        filename: config.output?.filename || '[name].js',
        chunkFilename: config.output?.chunkFilename || '[name].[contenthash].js',
        assetFilename: config.output?.assetFilename || '[name].[contenthash][ext]',
        publicPath: config.output?.publicPath || '/',
        ...config.output
      },
      resolve: {
        extensions: config.resolve?.extensions || ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: config.resolve?.alias || {},
        modules: config.resolve?.modules || ['node_modules'],
        ...config.resolve
      },
      optimization: {
        minimize: config.optimization?.minimize ?? this.isProduction,
        splitChunks: config.optimization?.splitChunks ?? this.isProduction,
        treeShaking: config.optimization?.treeShaking ?? this.isProduction,
        sideEffects: config.optimization?.sideEffects ?? false,
        usedExports: config.optimization?.usedExports ?? this.isProduction,
        concatenateModules: config.optimization?.concatenateModules ?? this.isProduction,
        ...config.optimization
      },
      plugins: config.plugins || [],
      devtool: config.devtool ?? (this.isProduction ? 'source-map' : 'eval-cheap-module-source-map')
    };
  }

  private async resolveEntries(): Promise<Map<string, string>> {
    const entries = new Map<string, string>();

    for (const [name, entry] of Object.entries(this.config.entry)) {
      if (typeof entry === 'string') {
        const resolvedPath = await this.resolver.resolve(entry);
        entries.set(name, resolvedPath);
      } else if (Array.isArray(entry)) {
        // Handle array of entry points
        const resolvedPaths = await Promise.all(
          entry.map(e => this.resolver.resolve(e))
        );
        entries.set(name, resolvedPaths[0]); // Use first as main entry
      } else {
        // Handle object with import/require
        if (entry.import) {
          const resolvedPath = await this.resolver.resolve(entry.import);
          entries.set(name, resolvedPath);
        }
      }
    }

    return entries;
  }

  private async buildModuleGraph(entries: Map<string, string>): Promise<ModuleGraph> {
    const moduleGraph = new ModuleGraph();
    const visited = new Set<string>();

    for (const [name, path] of entries) {
      await this.buildModuleGraphRecursive(path, moduleGraph, visited, name);
    }

    return moduleGraph;
  }

  private async buildModuleGraphRecursive(
    modulePath: string,
    moduleGraph: ModuleGraph,
    visited: Set<string>,
    entryName?: string
  ): Promise<void> {
    if (visited.has(modulePath)) {
      return;
    }

    visited.add(modulePath);

    const moduleInfo = await this.resolver.resolveModule(modulePath);
    moduleGraph.addModule(moduleInfo);

    if (entryName) {
      moduleGraph.addEntry(entryName, moduleInfo.id);
    }

    // Process dependencies
    for (const dep of moduleInfo.dependencies) {
      const depPath = await this.resolver.resolve(dep.request, modulePath);
      await this.buildModuleGraphRecursive(depPath, moduleGraph, visited);
      moduleGraph.addDependency(moduleInfo.id, depPath);
    }
  }

  private async generateBundle(compilationResult: CompilationResult): Promise<BundleResult> {
    const result: BundleResult = {
      entries: {},
      assets: [],
      stats: {
        time: 0,
        size: 0,
        modules: 0,
        assets: 0
      },
      diagnostics: [],
      warnings: [],
      errors: []
    };

    // Use Rust bundler for optimal performance
    if (this.rustBundlerPath && fs.existsSync(this.rustBundlerPath)) {
      try {
        return await this.bundleWithRust(compilationResult);
      } catch (error) {
        console.warn(chalk.yellow('Rust bundler failed, falling back to JavaScript bundler:'), error.message);
      }
    }

    // Fallback to JavaScript bundler
    return this.bundleWithJavaScript(compilationResult);
  }

  private async bundleWithRust(compilationResult: CompilationResult): Promise<BundleResult> {
    return new Promise((resolve, reject) => {
      const rustProcess = spawn(this.rustBundlerPath, [
        '--mode', this.config.mode,
        '--output-dir', this.config.output.path,
        '--public-path', this.config.output.publicPath
      ]);

      let stdout = '';
      let stderr = '';

      rustProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      rustProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      rustProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse Rust bundler output: ${error.message}`));
          }
        } else {
          reject(new Error(`Rust bundler failed with code ${code}: ${stderr}`));
        }
      });

      rustProcess.on('error', (error) => {
        reject(new Error(`Failed to start Rust bundler: ${error.message}`));
      });

      // Send compilation result to Rust process
      rustProcess.stdin.write(JSON.stringify(compilationResult));
      rustProcess.stdin.end();
    });
  }

  private async bundleWithJavaScript(compilationResult: CompilationResult): Promise<BundleResult> {
    const result: BundleResult = {
      entries: {},
      assets: [],
      stats: {
        time: 0,
        size: 0,
        modules: 0,
        assets: 0
      },
      diagnostics: [],
      warnings: [],
      errors: []
    };

    // Process each entry point
    for (const [entryName, entryModule] of compilationResult.entries) {
      const bundle = await this.generateEntryBundle(entryName, entryModule, compilationResult);
      result.entries[entryName] = bundle;
    }

    // Process chunks
    for (const chunk of compilationResult.chunks) {
      const chunkBundle = await this.generateChunkBundle(chunk, compilationResult);
      result.entries[chunk.name] = chunkBundle;
    }

    return result;
  }

  private async generateEntryBundle(
    entryName: string,
    entryModule: ModuleInfo,
    compilationResult: CompilationResult
  ): Promise<BundleEntry> {
    const modules = this.collectModulesForEntry(entryModule.id, compilationResult);
    const bundleCode = this.generateBundleCode(modules, compilationResult);
    const bundlePath = this.getOutputPath(entryName, 'js');

    // Generate source map if enabled
    let sourceMap: any = null;
    if (this.config.devtool && this.config.devtool !== 'false') {
      sourceMap = createSourceMap(bundleCode, modules);
    }

    // Write bundle to disk
    await fs.ensureDir(path.dirname(bundlePath));
    await fs.writeFile(bundlePath, bundleCode);

    if (sourceMap) {
      await fs.writeFile(`${bundlePath}.map`, JSON.stringify(sourceMap));
    }

    return {
      path: bundlePath,
      size: Buffer.byteLength(bundleCode, 'utf8'),
      map: sourceMap
    };
  }

  private async generateChunkBundle(
    chunk: ChunkInfo,
    compilationResult: CompilationResult
  ): Promise<BundleEntry> {
    const modules = chunk.modules.map(id => compilationResult.modules.get(id)).filter(Boolean);
    const bundleCode = this.generateBundleCode(modules, compilationResult);
    const bundlePath = this.getOutputPath(chunk.name, 'js', true);

    // Generate source map if enabled
    let sourceMap: any = null;
    if (this.config.devtool && this.config.devtool !== 'false') {
      sourceMap = createSourceMap(bundleCode, modules);
    }

    // Write bundle to disk
    await fs.ensureDir(path.dirname(bundlePath));
    await fs.writeFile(bundlePath, bundleCode);

    if (sourceMap) {
      await fs.writeFile(`${bundlePath}.map`, JSON.stringify(sourceMap));
    }

    return {
      path: bundlePath,
      size: Buffer.byteLength(bundleCode, 'utf8'),
      map: sourceMap
    };
  }

  private collectModulesForEntry(entryId: string, compilationResult: CompilationResult): ModuleInfo[] {
    const modules: ModuleInfo[] = [];
    const visited = new Set<string>();

    const collect = (moduleId: string) => {
      if (visited.has(moduleId)) {
        return;
      }

      visited.add(moduleId);
      const module = compilationResult.modules.get(moduleId);
      if (module) {
        modules.push(module);

        for (const dep of module.dependencies) {
          collect(dep.moduleId);
        }
      }
    };

    collect(entryId);
    return modules;
  }

  private generateBundleCode(modules: ModuleInfo[], compilationResult: CompilationResult): string {
    let code = '';

    // Add runtime code
    code += this.generateRuntimeCode();

    // Add module code
    for (const module of modules) {
      code += `// Module: ${module.id}\n`;
      code += `${module.code}\n\n`;
    }

    // Add entry point code
    code += this.generateEntryPointCode(modules);

    return code;
  }

  private generateRuntimeCode(): string {
    return `
// ONEDOT-JS Runtime
(function() {
  var modules = {};
  var installedModules = {};

  function __onedot_require__(moduleId) {
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }

    var module = installedModules[moduleId] = {
      exports: {},
      id: moduleId,
      loaded: false
    };

    modules[moduleId].call(module.exports, module, module.exports, __onedot_require__);

    module.loaded = true;

    return module.exports;
  }

  // Expose modules
  __onedot_require__.m = modules;
  __onedot_require__.c = installedModules;

  // Public API
  window.__onedot_require__ = __onedot_require__;
})();
`;
  }

  private generateEntryPointCode(modules: ModuleInfo[]): string {
    const entryModule = modules[0];
    if (!entryModule) {
      return '';
    }

    return `
// Entry point
__onedot_require__(${JSON.stringify(entryModule.id)});
`;
  }

  private async processAssets(result: BundleResult): Promise<void> {
    for (const asset of result.assets) {
      const assetPath = path.join(this.config.output.path, asset.path);
      await fs.ensureDir(path.dirname(assetPath));
      await fs.writeFile(assetPath, asset.source);
    }
  }

  private generateStats(result: BundleResult, startTime: number): BundleStats {
    return {
      time: Date.now() - startTime,
      size: Object.values(result.entries).reduce((sum, entry) => sum + entry.size, 0),
      modules: Object.keys(result.entries).length,
      assets: result.assets.length
    };
  }

  private getOutputPath(name: string, extension: string, isChunk = false): string {
    const filename = isChunk
      ? this.config.output.chunkFilename
        .replace('[name]', name)
        .replace('[contenthash]', generateHash(name + Date.now()))
      : this.config.output.filename
        .replace('[name]', name);

    return path.join(this.config.output.path, `${filename}.${extension}`);
  }

  private getRustBundlerPath(): string {
    const platform = process.platform === 'win32' ? 'windows' :
                    process.platform === 'darwin' ? 'macos' : 'linux';
    const extension = process.platform === 'win32' ? '.exe' : '';

    return path.join(
      __dirname,
      'rust',
      'target',
      'release',
      `onedot_bundler_${platform}${extension}`
    );
  }
}

// Module graph representation
class ModuleGraph {
  private modules: Map<string, ModuleInfo> = new Map();
  private dependencies: Map<string, Set<string>> = new Map();
  private entries: Map<string, string> = new Map();

  addModule(module: ModuleInfo): void {
    this.modules.set(module.id, module);
  }

  addDependency(from: string, to: string): void {
    if (!this.dependencies.has(from)) {
      this.dependencies.set(from, new Set());
    }
    this.dependencies.get(from)!.add(to);
  }

  addEntry(name: string, moduleId: string): void {
    this.entries.set(name, moduleId);
  }

  getModule(id: string): ModuleInfo | undefined {
    return this.modules.get(id);
  }

  getDependencies(id: string): Set<string> {
    return this.dependencies.get(id) || new Set();
  }

  getEntries(): Map<string, string> {
    return this.entries;
  }
}

// Type definitions for internal use
interface ModuleGraph {
  addModule(module: ModuleInfo): void;
  addDependency(from: string, to: string): void;
  addEntry(name: string, moduleId: string): void;
  getModule(id: string): ModuleInfo | undefined;
  getDependencies(id: string): Set<string>;
  getEntries(): Map<string, string>;
}

interface CompilationResult {
  entries: Map<string, ModuleInfo>;
  chunks: ChunkInfo[];
  modules: Map<string, ModuleInfo>;
  assets: AssetInfo[];
  diagnostics: Diagnostic[];
}

interface ChunkInfo {
  name: string;
  modules: string[];
}

interface ModuleInfo {
  id: string;
  path: string;
  code: string;
  dependencies: DependencyInfo[];
  map?: any;
}

interface DependencyInfo {
  request: string;
  moduleId: string;
}

interface AssetInfo {
  path: string;
  source: Buffer | string;
  size: number;
}

interface BundleEntry {
  path: string;
  size: number;
  map?: any;
}

interface BundleStats {
  time: number;
  size: number;
  modules: number;
  assets: number;
}

interface Diagnostic {
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  file?: string;
  line?: number;
  column?: number;
}
