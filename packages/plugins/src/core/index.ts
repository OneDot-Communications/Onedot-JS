/**
 * Core plugin system implementation
 */

import { EventEmitter } from 'events';
import {
  Plugin,
  PluginContext,
  PluginManifest,
  PluginResult
} from '../types';
import { PluginUtils } from '../utils';

/**
 * PluginManager - Manages plugin loading, execution, and lifecycle
 */
export class PluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();
  private enabled: boolean = true;
  private hookRegistry: Map<string, Plugin[]> = new Map();

  /**
   * Enable the plugin manager
   */
  public enable(): void {
    this.enabled = true;
    this.emit('enabled');
  }

  /**
   * Disable the plugin manager
   */
  public disable(): void {
    this.enabled = false;
    this.emit('disabled');
  }

  /**
   * Check if the plugin manager is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Load a plugin from a manifest
   */
  public async loadPlugin(manifest: PluginManifest): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      // Check if plugin is already loaded
      if (this.plugins.has(manifest.name)) {
        console.warn(`Plugin '${manifest.name}' is already loaded`);
        return false;
      }

      // Check dependencies
      if (manifest.dependencies) {
        for (const dependency of manifest.dependencies) {
          if (!this.plugins.has(dependency)) {
            console.error(`Plugin '${manifest.name}' depends on '${dependency}' which is not loaded`);
            return false;
          }
        }
      }

      // Create plugin instance
      const plugin = PluginUtils.createPlugin(manifest);

      // Load the plugin
      const loaded = await plugin.load();
      if (!loaded) {
        console.error(`Failed to load plugin '${manifest.name}'`);
        return false;
      }

      // Add to plugins map
      this.plugins.set(manifest.name, plugin);

      // Register hooks
      this.registerHooks(plugin);

      // Emit event
      this.emit('pluginLoaded', plugin);

      return true;
    } catch (error) {
      console.error(`Error loading plugin '${manifest.name}':`, error);
      return false;
    }
  }

  /**
   * Unload a plugin by name
   */
  public async unloadPlugin(name: string): Promise<boolean> {
    if (!this.enabled) return false;

    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`Plugin '${name}' is not loaded`);
      return false;
    }

    try {
      // Check if other plugins depend on this one
      for (const [otherName, otherPlugin] of this.plugins) {
        if (otherName !== name && PluginUtils.dependsOn(otherPlugin, name)) {
          console.error(`Cannot unload plugin '${name}' because plugin '${otherName}' depends on it`);
          return false;
        }
      }

      // Disable the plugin if it's enabled
      if (plugin.enabled) {
        await plugin.disable();
      }

      // Unload the plugin
      const unloaded = await plugin.unload();
      if (!unloaded) {
        console.error(`Failed to unload plugin '${name}'`);
        return false;
      }

      // Unregister hooks
      this.unregisterHooks(plugin);

      // Remove from plugins map
      this.plugins.delete(name);

      // Emit event
      this.emit('pluginUnloaded', plugin);

      return true;
    } catch (error) {
      console.error(`Error unloading plugin '${name}':`, error);
      return false;
    }
  }

  /**
   * Enable a plugin by name
   */
  public async enablePlugin(name: string): Promise<boolean> {
    if (!this.enabled) return false;

    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`Plugin '${name}' is not loaded`);
      return false;
    }

    if (plugin.enabled) {
      console.warn(`Plugin '${name}' is already enabled`);
      return true;
    }

    try {
      // Check dependencies
      if (plugin.dependencies) {
        for (const dependency of plugin.dependencies) {
          const depPlugin = this.plugins.get(dependency);
          if (!depPlugin || !depPlugin.enabled) {
            console.error(`Cannot enable plugin '${name}' because dependency '${dependency}' is not enabled`);
            return false;
          }
        }
      }

      // Enable the plugin
      const enabled = await plugin.enable();
      if (!enabled) {
        console.error(`Failed to enable plugin '${name}'`);
        return false;
      }

      // Register hooks
      this.registerHooks(plugin);

      // Emit event
      this.emit('pluginEnabled', plugin);

      return true;
    } catch (error) {
      console.error(`Error enabling plugin '${name}':`, error);
      return false;
    }
  }

  /**
   * Disable a plugin by name
   */
  public async disablePlugin(name: string): Promise<boolean> {
    if (!this.enabled) return false;

    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`Plugin '${name}' is not loaded`);
      return false;
    }

    if (!plugin.enabled) {
      console.warn(`Plugin '${name}' is already disabled`);
      return true;
    }

    try {
      // Check if other plugins depend on this one
      for (const [otherName, otherPlugin] of this.plugins) {
        if (otherName !== name && otherPlugin.enabled && PluginUtils.dependsOn(otherPlugin, name)) {
          console.error(`Cannot disable plugin '${name}' because plugin '${otherName}' depends on it`);
          return false;
        }
      }

      // Disable the plugin
      const disabled = await plugin.disable();
      if (!disabled) {
        console.error(`Failed to disable plugin '${name}'`);
        return false;
      }

      // Unregister hooks
      this.unregisterHooks(plugin);

      // Emit event
      this.emit('pluginDisabled', plugin);

      return true;
    } catch (error) {
      console.error(`Error disabling plugin '${name}':`, error);
      return false;
    }
  }

  /**
   * Get a plugin by name
   */
  public getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all loaded plugins
   */
  public getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all enabled plugins
   */
  public getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.enabled);
  }

  /**
   * Execute a hook on all enabled plugins
   */
  public async executeHook(hook: string, context: PluginContext): Promise<PluginResult[]> {
    if (!this.enabled) return [];

    const plugins = this.hookRegistry.get(hook) || [];
    const results: PluginResult[] = [];

    for (const plugin of plugins) {
      if (plugin.enabled) {
        const result = await plugin.executeHook(hook, context);
        results.push(result);
      }
    }

    // Sort results by priority
    return PluginUtils.sortResults(results);
  }

  /**
   * Register hooks for a plugin
   */
  private registerHooks(plugin: Plugin): void {
    for (const hook of Object.keys(plugin.hooks)) {
      if (!this.hookRegistry.has(hook)) {
        this.hookRegistry.set(hook, []);
      }

      const hookPlugins = this.hookRegistry.get(hook)!;

      // Add plugin if not already registered
      if (!hookPlugins.includes(plugin)) {
        hookPlugins.push(plugin);
      }
    }
  }

  /**
   * Unregister hooks for a plugin
   */
  private unregisterHooks(plugin: Plugin): void {
    for (const hook of Object.keys(plugin.hooks)) {
      const hookPlugins = this.hookRegistry.get(hook);
      if (hookPlugins) {
        const index = hookPlugins.indexOf(plugin);
        if (index !== -1) {
          hookPlugins.splice(index, 1);
        }

        // Remove hook registry if no plugins left
        if (hookPlugins.length === 0) {
          this.hookRegistry.delete(hook);
        }
      }
    }
  }

  /**
   * Get all registered hooks
   */
  public getRegisteredHooks(): string[] {
    return Array.from(this.hookRegistry.keys());
  }

  /**
   * Get plugins for a specific hook
   */
  public getPluginsForHook(hook: string): Plugin[] {
    return this.hookRegistry.get(hook) || [];
  }

  /**
   * Check if a hook is registered
   */
  public isHookRegistered(hook: string): boolean {
    return this.hookRegistry.has(hook);
  }

  /**
   * Reload a plugin
   */
  public async reloadPlugin(name: string): Promise<boolean> {
    if (!this.enabled) return false;

    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`Plugin '${name}' is not loaded`);
      return false;
    }

    // Get the manifest
    const manifest: PluginManifest = {
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      main: plugin.main,
      hooks: plugin.hooks,
      config: plugin.config,
      dependencies: plugin.dependencies
    };

    // Unload the plugin
    const unloaded = await this.unloadPlugin(name);
    if (!unloaded) {
      return false;
    }

    // Load the plugin again
    return this.loadPlugin(manifest);
  }

  /**
   * Load multiple plugins
   */
  public async loadPlugins(manifests: PluginManifest[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const manifest of manifests) {
      const loaded = await this.loadPlugin(manifest);
      if (loaded) {
        success.push(manifest.name);
      } else {
        failed.push(manifest.name);
      }
    }

    return { success, failed };
  }

  /**
   * Unload multiple plugins
   */
  public async unloadPlugins(names: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const name of names) {
      const unloaded = await this.unloadPlugin(name);
      if (unloaded) {
        success.push(name);
      } else {
        failed.push(name);
      }
    }

    return { success, failed };
  }

  /**
   * Enable multiple plugins
   */
  public async enablePlugins(names: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const name of names) {
      const enabled = await this.enablePlugin(name);
      if (enabled) {
        success.push(name);
      } else {
        failed.push(name);
      }
    }

    return { success, failed };
  }

  /**
   * Disable multiple plugins
   */
  public async disablePlugins(names: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const name of names) {
      const disabled = await this.disablePlugin(name);
      if (disabled) {
        success.push(name);
      } else {
        failed.push(name);
      }
    }

    return { success, failed };
  }
}

// Export the PluginManager class
export { PluginManager };
