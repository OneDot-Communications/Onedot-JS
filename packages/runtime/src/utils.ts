/**
 * Utility functions for the runtime package
 */

import { Diagnostic, ExecutionResult, RuntimeContext } from './types';

/**
 * Runtime utility functions
 */
export const RuntimeUtils = {
  /**
   * Generate a unique ID
   */
  generateId(prefix: string = 'id'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Format bytes to a human-readable string
   */
  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Format milliseconds to a human-readable string
   */
  formatMilliseconds(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(2)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = (ms % 60000) / 1000;
      return `${minutes}m ${seconds.toFixed(2)}s`;
    }
  },

  /**
   * Create a successful execution result
   */
  createSuccessResult(result: any, executionTime: number, context?: RuntimeContext): ExecutionResult {
    return {
      success: true,
      result,
      executionTime,
      context
    };
  },

  /**
   * Create a failed execution result
   */
  createErrorResult(error: Error, executionTime: number, context?: RuntimeContext): ExecutionResult {
    return {
      success: false,
      error,
      executionTime,
      context
    };
  },

  /**
   * Create a diagnostic
   */
  createDiagnostic(
    message: string,
    category: 'error' | 'warning' | 'info' | 'hint',
    file?: string,
    start?: number,
    length?: number,
    code?: number
  ): Diagnostic {
    return {
      file,
      start,
      length,
      message,
      category,
      code
    };
  },

  /**
   * Create an error diagnostic
   */
  createErrorDiagnostic(message: string, file?: string, start?: number, length?: number, code?: number): Diagnostic {
    return this.createDiagnostic(message, 'error', file, start, length, code);
  },

  /**
   * Create a warning diagnostic
   */
  createWarningDiagnostic(message: string, file?: string, start?: number, length?: number, code?: number): Diagnostic {
    return this.createDiagnostic(message, 'warning', file, start, length, code);
  },

  /**
   * Create an info diagnostic
   */
  createInfoDiagnostic(message: string, file?: string, start?: number, length?: number, code?: number): Diagnostic {
    return this.createDiagnostic(message, 'info', file, start, length, code);
  },

  /**
   * Create a hint diagnostic
   */
  createHintDiagnostic(message: string, file?: string, start?: number, length?: number, code?: number): Diagnostic {
    return this.createDiagnostic(message, 'hint', file, start, length, code);
  },

  /**
   * Filter diagnostics by category
   */
  filterDiagnostics(diagnostics: Diagnostic[], category: 'error' | 'warning' | 'info' | 'hint'): Diagnostic[] {
    return diagnostics.filter(d => d.category === category);
  },

  /**
   * Get error diagnostics
   */
  getErrorDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
    return this.filterDiagnostics(diagnostics, 'error');
  },

  /**
   * Get warning diagnostics
   */
  getWarningDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
    return this.filterDiagnostics(diagnostics, 'warning');
  },

  /**
   * Get info diagnostics
   */
  getInfoDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
    return this.filterDiagnostics(diagnostics, 'info');
  },

  /**
   * Get hint diagnostics
   */
  getHintDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
    return this.filterDiagnostics(diagnostics, 'hint');
  },

  /**
   * Check if diagnostics contain errors
   */
  hasErrors(diagnostics: Diagnostic[]): boolean {
    return diagnostics.some(d => d.category === 'error');
  },

  /**
   * Check if diagnostics contain warnings
   */
  hasWarnings(diagnostics: Diagnostic[]): boolean {
    return diagnostics.some(d => d.category === 'warning');
  },

  /**
   * Sanitize code for execution
   */
  sanitizeCode(code: string): string {
    // Remove shebang lines
    code = code.replace(/^#!.*\n/, '');

    // Remove source map comments
    code = code.replace(/\/\/# sourceMappingURL=.*\n?/g, '');

    return code;
  },

  /**
   * Wrap code in a try-catch block
   */
  wrapInTryCatch(code: string, catchVar: string = 'error'): string {
    return `
try {
  ${code}
} catch (${catchVar}) {
  throw ${catchVar};
}`;
  },

  /**
   * Wrap code in an async function
   */
  wrapInAsyncFunction(code: string, args: string[] = []): string {
    const argsStr = args.join(', ');
    return `
(async function(${argsStr}) {
  ${code}
})`;
  },

  /**
   * Create a safe execution context
   */
  createSafeContext(globals: Record<string, any> = {}): RuntimeContext {
    return {
      id: RuntimeUtils.generateId('context'),
      globals,
      modules: new Map(),
      startTime: performance.now(),
      memory: {
        used: 0,
        limit: 100 * 1024 * 1024 // 100MB default
      }
    };
  },

  /**
   * Update memory usage in a context
   */
  updateMemoryUsage(context: RuntimeContext): void {
    if (context.memory && typeof process !== 'undefined' && process.memoryUsage) {
      const memoryUsage = process.memoryUsage();
      context.memory.used = memoryUsage.heapUsed;
    }
  },

  /**
   * Check if memory limit is exceeded
   */
  isMemoryLimitExceeded(context: RuntimeContext): boolean {
    if (!context.memory) return false;
    return context.memory.used > context.memory.limit;
  },

  /**
   * Create a timeout error
   */
  createTimeoutError(timeout: number): Error {
    return new Error(`Execution timed out after ${timeout}ms`);
  },

  /**
   * Create a memory limit error
   */
  createMemoryLimitError(limit: number): Error {
    return new Error(`Memory limit exceeded (${RuntimeUtils.formatBytes(limit)})`);
  },

  /**
   * Debounce a function
   */
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  },

  /**
   * Throttle a function
   */
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }
};

// Export all utility modules

