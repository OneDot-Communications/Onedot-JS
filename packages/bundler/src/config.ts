import * as path from 'path';

export interface BundleConfig {
  mode?: 'development' | 'production';
  entry: Record<string, string | string[] | { import: string }>;
  output?: {
    path?: string;
    filename?: string;
    chunkFilename?: string;
    assetFilename?: string;
    publicPath?: string;
  };
  resolve?: {
    extensions?: string[];
    alias?: Record<string, string>;
    modules?: string[];
  };
  optimization?: OptimizationOptions;
  plugins?: Plugin[];
  devtool?: string | false;
}

export interface BundleResult {
  entries: Record<string, BundleEntry>;
  assets: AssetInfo[];
  stats: BundleStats;
  diagnostics: Diagnostic[];
  warnings: Diagnostic[];
  errors: Diagnostic[];
}

export interface BundleEntry {
  path: string;
  size: number;
  map?: any;
}

export interface AssetInfo {
  path: string;
  source: Buffer | string;
  size: number;
}

export interface BundleStats {
  time: number;
  size: number;
  modules: number;
  assets: number;
}

export interface Plugin {
  name: string;
  apply: (bundler: any) => void;
}

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

export interface Diagnostic {
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  file?: string;
  line?: number;
  column?: number;
}

export function createDefaultConfig(): BundleConfig {
  return {
    mode: 'development',
    entry: {
      main: './src/index.ts'
    },
    output: {
      path: path.resolve(process.cwd(), 'dist'),
      filename: '[name].js',
      chunkFilename: '[name].[contenthash].js',
      assetFilename: '[name].[contenthash][ext]',
      publicPath: '/'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      alias: {},
      modules: ['node_modules']
    },
    optimization: {
      minimize: false,
      splitChunks: false,
      treeShaking: false,
      sideEffects: false,
      usedExports: false,
      concatenateModules: false
    },
    plugins: [],
    devtool: 'eval-cheap-module-source-map'
  };
}

export function createProductionConfig(): BundleConfig {
  const config = createDefaultConfig();
  config.mode = 'production';
  config.optimization = {
    minimize: true,
    splitChunks: true,
    treeShaking: true,
    sideEffects: false,
    usedExports: true,
    concatenateModules: true,
    removeAvailableModules: true,
    removeEmptyChunks: true,
    mergeDuplicateChunks: true,
    flagIncludedChunks: true,
    occurrenceOrder: true,
    providedExports: true,
    sideEffects: false
  };
  config.devtool = 'source-map';
  return config;
}

export function mergeConfig(baseConfig: BundleConfig, overrideConfig: Partial<BundleConfig>): BundleConfig {
  return {
    ...baseConfig,
    ...overrideConfig,
    entry: {
      ...baseConfig.entry,
      ...overrideConfig.entry
    },
    output: {
      ...baseConfig.output,
      ...overrideConfig.output
    },
    resolve: {
      ...baseConfig.resolve,
      ...overrideConfig.resolve
    },
    optimization: {
      ...baseConfig.optimization,
      ...overrideConfig.optimization
    },
    plugins: [
      ...(baseConfig.plugins || []),
      ...(overrideConfig.plugins || [])
    ]
  };
}
