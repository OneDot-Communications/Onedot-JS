export { Bundler } from './bundler';
export { createBundler } from './factory';
export { BundleConfig } from './src/config';
export { Plugin } from './src/plugin';
export { BundleResult } from './src/result';
export { OptimizationOptions } from './src/types';

// Re-export commonly used types
export type {
  AssetInfo, BundleConfig,
  BundleResult, BundleStats,
  Diagnostic, ModuleInfo, OptimizationOptions, Plugin, Severity
} from './types';

// Re-export utilities
export {
  createSourceMap, generateHash, getExtension, isAbsolutePath, mergeSourceMaps, normalizePath, parseQuery, resolvePath
} from './utils';

// Re-export plugins
export {
  AssetPlugin, CssPlugin, DefinePlugin, JsonPlugin, ProvidePlugin, TypeScriptPlugin
} from './plugins';

// Default export
export { createBundler as default } from './factory';

