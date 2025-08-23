/**
 * ONEDOT-JS Runtime Package
 *
 * This package provides the runtime execution environment for the ONEDOT-JS framework,
 * including TypeScript compilation, execution sandboxing, and module management.
 */

// Core exports
export * from './src';

// Module-specific exports
export { RuntimeEnvironment } from './src/execution';
export { TypeScriptCompiler } from './src/typescript';

// Re-export commonly used types and interfaces
export type {
  CompilationResult,
  Diagnostic, ExecutionOptions,
  ExecutionResult,
  ModuleResolver, RuntimeConfig,
  RuntimeContext, SandboxOptions,
  TypeScriptOptions
} from './src/types';

// Default export for the runtime package
export default {
  // Runtime environment
  environment: require('./src/execution').RuntimeEnvironment,

  // TypeScript compiler
  compiler: require('./src/typescript').TypeScriptCompiler,

  // Version information
  version: require('./package.json').version
};
