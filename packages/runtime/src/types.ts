/**
 * Type definitions for the runtime package
 */

/**
 * Interface for runtime configuration
 */
export interface RuntimeConfig {
  sandbox?: boolean;
  timeout?: number;
  maxMemory?: number;
  typescript?: TypeScriptOptions;
  [key: string]: any;
}

/**
 * Interface for runtime context
 */
export interface RuntimeContext {
  id: string;
  globals: Record<string, any>;
  modules: Map<string, any>;
  startTime: number;
  endTime?: number;
  duration?: number;
  memory?: {
    used: number;
    limit: number;
  };
  [key: string]: any;
}

/**
 * Interface for execution options
 */
export interface ExecutionOptions {
  filename?: string;
  timeout?: number;
  maxMemory?: number;
  sandbox?: boolean;
  context?: RuntimeContext;
  globals?: Record<string, any>;
  [key: string]: any;
}

/**
 * Interface for execution result
 */
export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: Error;
  diagnostics?: Diagnostic[];
  executionTime: number;
  context?: RuntimeContext;
  [key: string]: any;
}

/**
 * Interface for module resolver
 */
export interface ModuleResolver {
  resolve: (moduleName: string, context: string) => string | null;
  [key: string]: any;
}

/**
 * Interface for sandbox options
 */
export interface SandboxOptions {
  timeout?: number;
  maxMemory?: number;
  globals?: Record<string, any>;
  allowedModules?: string[];
  blockedModules?: string[];
  [key: string]: any;
}

/**
 * Interface for TypeScript options
 */
export interface TypeScriptOptions {
  target?: string;
  module?: string;
  moduleResolution?: string;
  esModuleInterop?: boolean;
  allowSyntheticDefaultImports?: boolean;
  strict?: boolean;
  skipLibCheck?: boolean;
  forceConsistentCasingInFileNames?: boolean;
  resolveJsonModule?: boolean;
  [key: string]: any;
}

/**
 * Interface for compilation result
 */
export interface CompilationResult {
  success: boolean;
  code?: string;
  sourceMap?: any;
  diagnostics: Diagnostic[];
  compilationTime: number;
  [key: string]: any;
}

/**
 * Interface for diagnostic
 */
export interface Diagnostic {
  file?: string;
  start?: number;
  length?: number;
  message: string;
  category: 'error' | 'warning' | 'info' | 'hint';
  code?: number;
  [key: string]: any;
}
