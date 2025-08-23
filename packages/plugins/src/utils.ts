/**
 * Utility functions for the plugins package
 */

import { Plugin, PluginContext, PluginManifest, PluginResult } from './types';

/**
 * Plugin utility functions
 */
export const PluginUtils = {
  /**
   * Validate a plugin manifest
   */
  validateManifest(manifest: PluginManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push('Plugin name is required and must be a string');
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push('Plugin version is required and must be a string');
    }

    if (!manifest.description || typeof manifest.description !== 'string') {
      errors.push('Plugin description is required and must be a string');
    }

    if (!manifest.main || typeof manifest.main !== 'function') {
      errors.push('Plugin main is required and must be a function');
    }

    if (!manifest.hooks || typeof manifest.hooks !== 'object') {
      errors.push('Plugin hooks are required and must be an object');
    } else {
      for (const [hook, method] of Object.entries(manifest.hooks)) {
        if (typeof method !== 'string') {
          errors.push(`Hook '${hook}' method must be a string`);
        }
      }
    }

    if (!manifest.config || typeof manifest.config !== 'object') {
      errors.push('Plugin config is required and must be an object');
    }

    if (manifest.dependencies && !Array.isArray(manifest.dependencies)) {
      errors.push('Plugin dependencies must be an array');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Create a plugin from a manifest
   */
  createPlugin(manifest: PluginManifest): Plugin {
    const validation = this.validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid plugin manifest: ${validation.errors.join(', ')}`);
    }

    let instance: any = null;

    return {
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      enabled: false,
      main: manifest.main,
      hooks: manifest.hooks,
      config: manifest.config,
      dependencies: manifest.dependencies || [],

      async load(): Promise<boolean> {
        try {
          // Create plugin instance
          instance = new manifest.main(manifest.config);

          // Check if the plugin has a load method
          if (typeof instance.load === 'function') {
            await instance.load();
          }

          return true;
        } catch (error) {
          console.error(`Failed to load plugin '${manifest.name}':`, error);
          return false;
        }
      },

      async unload(): Promise<boolean> {
        try {
          if (instance && typeof instance.unload === 'function') {
            await instance.unload();
          }
          instance = null;
          return true;
        } catch (error) {
          console.error(`Failed to unload plugin '${manifest.name}':`, error);
          return false;
        }
      },

      async enable(): Promise<boolean> {
        try {
          if (instance && typeof instance.enable === 'function') {
            await instance.enable();
          }
          this.enabled = true;
          return true;
        } catch (error) {
          console.error(`Failed to enable plugin '${manifest.name}':`, error);
          return false;
        }
      },

      async disable(): Promise<boolean> {
        try {
          if (instance && typeof instance.disable === 'function') {
            await instance.disable();
          }
          this.enabled = false;
          return true;
        } catch (error) {
          console.error(`Failed to disable plugin '${manifest.name}':`, error);
          return false;
        }
      },

      async executeHook(hook: string, context: PluginContext): Promise<PluginResult> {
        const startTime = performance.now();

        try {
          if (!this.enabled || !instance) {
            return {
              pluginName: this.name,
              success: false,
              error: 'Plugin is not enabled',
              executionTime: performance.now() - startTime
            };
          }

          const methodName = this.hooks[hook];
          if (!methodName || typeof instance[methodName] !== 'function') {
            return {
              pluginName: this.name,
              success: false,
              error: `Hook '${hook}' is not implemented`,
              executionTime: performance.now() - startTime
            };
          }

          const data = await instance[methodName](context);

          return {
            pluginName: this.name,
            success: true,
            data,
            executionTime: performance.now() - startTime
          };
        } catch (error) {
          return {
            pluginName: this.name,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            executionTime: performance.now() - startTime
          };
        }
      }
    };
  },

  /**
   * Sort plugin results by priority
   */
  sortResults(results: PluginResult[]): PluginResult[] {
    return results.sort((a, b) => {
      // Failed results go to the end
      if (a.success && !b.success) return -1;
      if (!a.success && b.success) return 1;

      // Both succeeded, sort by execution time (fastest first)
      if (a.success && b.success) {
        return a.executionTime - b.executionTime;
      }

      // Both failed, no particular order
      return 0;
    });
  },

  /**
   * Merge plugin results
   */
  mergeResults(results: PluginResult[]): PluginResult {
    const success = results.every(r => r.success);
    const executionTime = results.reduce((sum, r) => sum + r.executionTime, 0);

    if (success) {
      return {
        pluginName: 'merged',
        success: true,
        data: results.map(r => r.data),
        executionTime
      };
    } else {
      return {
        pluginName: 'merged',
        success: false,
        error: results.filter(r => !r.success).map(r => r.error).join('; '),
        executionTime
      };
    }
  },

  /**
   * Check if a plugin has a specific hook
   */
  hasHook(plugin: Plugin, hook: string): boolean {
    return hook in plugin.hooks;
  },

  /**
   * Get plugin dependencies
   */
  getDependencies(plugin: Plugin): string[] {
    return plugin.dependencies || [];
  },

  /**
   * Check if a plugin depends on another plugin
   */
  dependsOn(plugin: Plugin, dependency: string): boolean {
    return this.getDependencies(plugin).includes(dependency);
  }
};

// Export all utility modules
export { PluginUtils };
