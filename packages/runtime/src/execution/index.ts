/**
 * Runtime execution environment implementation
 */

import { EventEmitter } from 'events';
import { Module } from 'module';
import path from 'path';
import { vm } from 'vm';

import {
  ExecutionOptions,
  ExecutionResult,
  ModuleResolver,
  RuntimeConfig,
  RuntimeContext,
  SandboxOptions
} from '../types';
import { RuntimeUtils } from '../utils';

/**
 * RuntimeEnvironment - Provides a sandboxed execution environment
 */
export class RuntimeEnvironment extends EventEmitter {
  private config: RuntimeConfig;
  private context: RuntimeContext | null = null;
  private moduleResolver: ModuleResolver | null = null;
  private enabled: boolean = true;
  private modules: Map<string, any> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: RuntimeConfig = {}) {
    super();
    this.config = {
      sandbox: true,
      timeout: 5000,
      maxMemory: 100 * 1024 * 1024, // 100MB
      ...config
    };
  }

  /**
   * Enable or disable the runtime environment
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Check if the runtime environment is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the runtime configuration
   */
  public getConfig(): RuntimeConfig {
    return { ...this.config };
  }

  /**
   * Update the runtime configuration
   */
  public updateConfig(config: Partial<RuntimeConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  /**
   * Set the module resolver
   */
  public setModuleResolver(resolver: ModuleResolver): void {
    this.moduleResolver = resolver;
    this.emit('moduleResolverSet', resolver);
  }

  /**
   * Get the module resolver
   */
  public getModuleResolver(): ModuleResolver | null {
    return this.moduleResolver;
  }

  /**
   * Register a module
   */
  public registerModule(name: string, module: any): void {
    this.modules.set(name, module);
    this.emit('moduleRegistered', name, module);
  }

  /**
   * Unregister a module
   */
  public unregisterModule(name: string): boolean {
    const removed = this.modules.delete(name);
    if (removed) {
      this.emit('moduleUnregistered', name);
    }
    return removed;
  }

  /**
   * Get a registered module
   */
  public getModule(name: string): any {
    return this.modules.get(name);
  }

  /**
   * Get all registered modules
   */
  public getAllModules(): Map<string, any> {
    return new Map(this.modules);
  }

  /**
   * Execute code in the runtime environment
   */
  public async execute(code: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    if (!this.enabled) {
      return RuntimeUtils.createErrorResult(
        new Error('Runtime environment is disabled'),
        0
      );
    }

    const startTime = performance.now();

    try {
      // Sanitize code
      const sanitizedCode = RuntimeUtils.sanitizeCode(code);

      // Create execution context
      const context = options.context || RuntimeUtils.createSafeContext(options.globals);

      // Register modules in the context
      this.modules.forEach((module, name) => {
        context.modules.set(name, module);
      });

      // Emit execution started event
      this.emit('executionStarted', context);

      // Create VM context
      const vmContext = this.createVMContext(context, options);

      // Set up timeout if specified
      let timeoutId: NodeJS.Timeout | null = null;
      const timeout = options.timeout || this.config.timeout;

      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          if (this.context === context) {
            this.cleanupContext(context.id);
            this.emit('executionError', RuntimeUtils.createTimeoutError(timeout));
          }
        }, timeout);

        if (timeoutId) {
          this.timeouts.set(context.id, timeoutId);
        }
      }

      // Set up memory limit if specified
      const maxMemory = options.maxMemory || this.config.maxMemory;
      let memoryCheckInterval: NodeJS.Timeout | null = null;

      if (maxMemory > 0) {
        memoryCheckInterval = setInterval(() => {
          RuntimeUtils.updateMemoryUsage(context);

          if (RuntimeUtils.isMemoryLimitExceeded(context)) {
            if (this.context === context) {
              this.cleanupContext(context.id);
              this.emit('executionError', RuntimeUtils.createMemoryLimitError(maxMemory));
            }
          }
        }, 100);
      }

      // Set current context
      this.context = context;

      // Execute the code
      let result: any;

      if (this.config.sandbox || options.sandbox) {
        // Execute in VM sandbox
        const script = new vm.Script(sanitizedCode, {
          filename: options.filename || 'script.js',
          timeout: timeout > 0 ? timeout : undefined
        });

        result = script.runInContext(vmContext);

        // Handle promises
        if (result && typeof result.then === 'function') {
          result = await result;
        }
      } else {
        // Execute in global context
        // This is less secure but allows access to global objects
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const asyncFunction = new AsyncFunction(sanitizedCode);
        result = await asyncFunction();
      }

      // Clean up
      this.cleanupContext(context.id);

      // Update context
      context.endTime = performance.now();
      context.duration = context.endTime - context.startTime;
      RuntimeUtils.updateMemoryUsage(context);

      // Clear timeout and memory check
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (memoryCheckInterval) {
        clearInterval(memoryCheckInterval);
      }

      // Create result
      const executionResult = RuntimeUtils.createSuccessResult(
        result,
        context.duration,
        context
      );

      // Emit execution completed event
      this.emit('executionCompleted', executionResult);

      return executionResult;
    } catch (error) {
      // Clean up
      if (this.context) {
        this.cleanupContext(this.context.id);
      }

      // Create result
      const executionResult = RuntimeUtils.createErrorResult(
        error instanceof Error ? error : new Error(String(error)),
        performance.now() - startTime,
        this.context || undefined
      );

      // Emit execution error event
      this.emit('executionError', error);

      return executionResult;
    }
  }

  /**
   * Create a VM context
   */
  private createVMContext(runtimeContext: RuntimeContext, options: ExecutionOptions): any {
    // Create base context
    const vmContext: any = {
      console: {
        log: (...args: any[]) => {
          console.log(...args);
        },
        error: (...args: any[]) => {
          console.error(...args);
        },
        warn: (...args: any[]) => {
          console.warn(...args);
        },
        info: (...args: any[]) => {
          console.info(...args);
        },
        debug: (...args: any[]) => {
          console.debug(...args);
        }
      },
      require: this.createRequireFunction(runtimeContext, options),
      exports: {},
      module: {
        exports: {}
      },
      global: runtimeContext.globals,
      process: typeof process !== 'undefined' ? process : undefined,
      Buffer: typeof Buffer !== 'undefined' ? Buffer : undefined,
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      setImmediate: typeof setImmediate !== 'undefined' ? setImmediate : undefined,
      clearImmediate: typeof clearImmediate !== 'undefined' ? clearImmediate : undefined,
      __dirname: options.filename ? path.dirname(options.filename) : undefined,
      __filename: options.filename
    };

    // Add globals
    if (runtimeContext.globals) {
      Object.assign(vmContext, runtimeContext.globals);
    }

    // Add modules
    runtimeContext.modules.forEach((module, name) => {
      vmContext[name] = module;
    });

    // Create VM context
    const context = vm.createContext(vmContext);

    return context;
  }

  /**
   * Create a require function
   */
  private createRequireFunction(runtimeContext: RuntimeContext, options: ExecutionOptions): any {
    const parentModule = new Module(options.filename || '.', null);
    parentModule.filename = options.filename || 'script.js';
    parentModule.paths = Module._nodeModulePaths(path.dirname(options.filename || '.'));

    const requireFunc = (modulePath: string) => {
      // Check if module is already registered
      if (runtimeContext.modules.has(modulePath)) {
        return runtimeContext.modules.get(modulePath);
      }

      // Try to resolve the module
      let resolvedPath: string | null = null;

      if (this.moduleResolver) {
        resolvedPath = this.moduleResolver.resolve(modulePath, options.filename || '.');
      }

      if (!resolvedPath) {
        try {
          resolvedPath = Module._resolveFilename(modulePath, parentModule);
        } catch (e) {
          // Module not found
        }
      }

      if (resolvedPath) {
        try {
          // Try to require the module
          return require(resolvedPath);
        } catch (e) {
          throw new Error(`Module '${modulePath}' not found or could not be loaded`);
        }
      }

      throw new Error(`Module '${modulePath}' not found`);
    };

    // Add require properties
    requireFunc.resolve = (request: string) => {
      if (this.moduleResolver) {
        const resolved = this.moduleResolver.resolve(request, options.filename || '.');
        if (resolved) {
          return resolved;
        }
      }

      return Module._resolveFilename(request, parentModule);
    };

    requireFunc.cache = Module._cache;
    requireFunc.extensions = Module._extensions;

    return requireFunc;
  }

  /**
   * Clean up a context
   */
  private cleanupContext(contextId: string): void {
    // Clear timeout
    const timeoutId = this.timeouts.get(contextId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(contextId);
    }

    // Clear current context if it matches
    if (this.context && this.context.id === contextId) {
      this.context = null;
    }
  }

  /**
   * Create a sandbox
   */
  public createSandbox(options: SandboxOptions = {}): RuntimeEnvironment {
    const sandboxConfig = {
      ...this.config,
      sandbox: true,
      timeout: options.timeout || this.config.timeout,
      maxMemory: options.maxMemory || this.config.maxMemory
    };

    const sandbox = new RuntimeEnvironment(sandboxConfig);

    // Copy modules to the sandbox
    this.modules.forEach((module, name) => {
      if (!options.blockedModules || !options.blockedModules.includes(name)) {
        sandbox.registerModule(name, module);
      }
    });

    // Set module resolver
    if (this.moduleResolver) {
      sandbox.setModuleResolver(this.moduleResolver);
    }

    return sandbox;
  }
}
