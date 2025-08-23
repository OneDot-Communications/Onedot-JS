export interface OptimizationOptions {
  minimize?: boolean;
  splitChunks?: boolean;
  treeShaking?: boolean;
  sideEffects?: boolean;
  usedExports?: boolean;
  concatenateModules?: boolean;
  removeAvailableModules?: boolean;
  removeEmptyChunks?: boolean;
  mergeDuplicateChunks?: boolean;
  flagIncludedChunks?: boolean;
  occurrenceOrder?: boolean;
  providedExports?: boolean;
  usedExports?: boolean;
  concatenateModules?: boolean;
  sideEffects?: boolean;
}

export interface ModuleInfo {
  id: string;
  path: string;
  code: string;
  dependencies: DependencyInfo[];
  map?: any;
  size?: number;
  chunks?: string[];
  reasons?: string[];
  issuer?: string;
}

export interface DependencyInfo {
  request: string;
  moduleId: string;
  type: 'import' | 'require' | 'dynamic' | 'entry';
  userRequest?: string;
  context?: string;
}

export interface AssetInfo {
  path: string;
  source: Buffer | string;
  size: number;
  info?: {
    immutable?: boolean;
    maximizedSize?: number;
    chunkNames?: string[];
  };
}

export interface ChunkInfo {
  id: string;
  name: string;
  files: string[];
  hash?: string;
  contentHash?: string;
  size?: number;
  modules: string[];
  reasons?: string[];
  parents?: string[];
  children?: string[];
}

export interface Diagnostic {
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  file?: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  stack?: string;
}

export type Severity = 'error' | 'warning' | 'info';

export interface SourceMap {
  version: number;
  sources: string[];
  names: string[];
  sourceRoot?: string;
  sourcesContent?: string[];
  mappings: string;
  file: string;
}

export interface ResolverOptions {
  extensions: string[];
  alias: Record<string, string>;
  modules: string[];
  preferRelative?: boolean;
  mainFields?: string[];
  conditionNames?: string[];
}

export interface CompilerOptions {
  target: string;
  module: string;
  strict: boolean;
  jsx: 'preserve' | 'react' | 'react-jsx' | 'react-jsxdev';
  declaration: boolean;
  sourceMap: boolean;
  removeComments: boolean;
  noImplicitAny: boolean;
  strictNullChecks: boolean;
  strictFunctionTypes: boolean;
  noImplicitReturns: boolean;
  noFallthroughCasesInSwitch: boolean;
  moduleResolution: 'classic' | 'node';
  allowSyntheticDefaultImports: boolean;
  esModuleInterop: boolean;
  experimentalDecorators: boolean;
  emitDecoratorMetadata: boolean;
}

export interface BundlerOptions {
  mode: 'development' | 'production';
  entry: Record<string, string | string[] | { import: string }>;
  output: {
    path: string;
    filename: string;
    chunkFilename: string;
    assetFilename: string;
    publicPath: string;
  };
  resolve: ResolverOptions;
  optimization: OptimizationOptions;
  plugins: Plugin[];
  devtool: string | false;
  cache?: boolean;
  context?: string;
  target?: string;
  externals?: Record<string, string>;
  stats?: boolean | 'minimal' | 'normal' | 'verbose';
  bail?: boolean;
  profile?: boolean;
  parallelism?: number;
}

export interface Plugin {
  name: string;
  apply: (bundler: any) => void;
}

export interface Compilation {
  modules: Map<string, ModuleInfo>;
  chunks: Map<string, ChunkInfo>;
  assets: Map<string, AssetInfo>;
  entries: Map<string, string>;
  diagnostics: Diagnostic[];
  options: CompilerOptions;
  context: string;
  hash: string;
}

export interface Stats {
  time: number;
  size: number;
  modules: number;
  assets: number;
  chunks: number;
  entries: number;
  warnings: number;
  errors: number;
  hash: string;
  version: string;
}

export interface NormalizedStats {
  errors: string[];
  warnings: string[];
  modules: ModuleStats[];
  chunks: ChunkStats[];
  assets: AssetStats[];
  entrypoints: EntryPointStats[];
  timing: TimingStats;
  builtAt: number;
  hash: string;
  version: string;
}

export interface ModuleStats {
  id: string;
  name: string;
  size: number;
  chunks: string[];
  reasons: string[];
  issuer?: string;
  profile?: ModuleProfile;
}

export interface ChunkStats {
  id: string;
  name: string;
  size: number;
  files: string[];
  hash: string;
  entry: boolean;
  initial: boolean;
  rendered: boolean;
  modules: ModuleStats[];
  parents: string[];
  children: string[];
}

export interface AssetStats {
  name: string;
  size: number;
  chunks: string[];
  emitted: boolean;
  info: {
    immutable?: boolean;
    maximizedSize?: number;
    chunkNames?: string[];
  };
}

export interface EntryPointStats {
  name: string;
  chunks: string[];
  assets: string[];
  filter?: boolean;
}

export interface TimingStats {
  build: number;
}

export interface ModuleProfile {
  factory: number;
  building: number;
  dependencies: number;
}

export interface FileSystem {
  readFile(path: string): Promise<Buffer>;
  writeFile(path: string, content: Buffer | string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<{
    isFile(): boolean;
    isDirectory(): boolean;
    size: number;
    mtime: Date;
  }>;
  mkdirp(path: string): Promise<void>;
  rm(path: string): Promise<void>;
  symlink(target: string, path: string): Promise<void>;
  readlink(path: string): Promise<string>;
}

export interface Cache {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  has(key: string): Promise<boolean>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
}
