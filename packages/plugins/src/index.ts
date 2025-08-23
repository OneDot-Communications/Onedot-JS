/**
 * ONEDOT-JS Plugins Core Implementation
 *
 * This module provides the core functionality for the plugin system,
 * including plugin loading, execution, and lifecycle management.
 */

// Import modules
import { PluginManager } from './core';
import { EnvReplacePlugin } from './examples';
import { PluginMarketplace } from './marketplace';

// Import types
import {
  MarketplaceQuery,
  MarketplaceResponse,
  Plugin,
  PluginContext,
  PluginHook,
  PluginManifest,
  PluginResult
} from './types';

/**
 * PluginSystem - Manages all plugin-related operations
 */
export class PluginSystem {
  private static instance: PluginSystem;
  private pluginManager: PluginManager;
  private marketplace: PluginMarketplace;
  private enabled: boolean = true;

  private constructor() {
    this.pluginManager = new PluginManager();
    this.marketplace = new PluginMarketplace();
  }

  /**
   * Get the singleton instance of PluginSystem
   */
  public static getInstance(): PluginSystem {
    if (!PluginSystem.instance) {
      PluginSystem.instance = new PluginSystem();
    }
    return PluginSystem.instance;
  }

  /**
   * Enable or disable the plugin system
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.pluginManager.enable();
    } else {
      this.pluginManager.disable();
    }
  }

  /**
   * Check if the plugin system is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the plugin manager
   */
  public getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  /**
   * Get the plugin marketplace
   */
  public getMarketplace(): PluginMarketplace {
    return this.marketplace;
  }

  /**
   * Load a plugin from a manifest
   */
  public async loadPlugin(manifest: PluginManifest): Promise<boolean> {
    if (!this.enabled) return false;
    return this.pluginManager.loadPlugin(manifest);
  }

  /**
   * Unload a plugin by name
   */
  public async unloadPlugin(name: string): Promise<boolean> {
    if (!this.enabled) return false;
    return this.pluginManager.unloadPlugin(name);
  }

  /**
   * Enable a plugin by name
   */
  public async enablePlugin(name: string): Promise<boolean> {
    if (!this.enabled) return false;
    return this.pluginManager.enablePlugin(name);
  }

  /**
   * Disable a plugin by name
   */
  public async disablePlugin(name: string): Promise<boolean> {
    if (!this.enabled) return false;
    return this.pluginManager.disablePlugin(name);
  }

  /**
   * Get a plugin by name
   */
  public getPlugin(name: string): Plugin | undefined {
    return this.pluginManager.getPlugin(name);
  }

  /**
   * Get all loaded plugins
   */
  public getAllPlugins(): Plugin[] {
    return this.pluginManager.getAllPlugins();
  }

  /**
   * Get all enabled plugins
   */
  public getEnabledPlugins(): Plugin[] {
    return this.pluginManager.getEnabledPlugins();
  }

  /**
   * Execute a hook on all enabled plugins
   */
  public async executeHook(hook: PluginHook, context: PluginContext): Promise<PluginResult[]> {
    if (!this.enabled) return [];
    return this.pluginManager.executeHook(hook, context);
  }

  /**
   * Search for plugins in the marketplace
   */
  public async searchPlugins(query: MarketplaceQuery): Promise<MarketplaceResponse> {
    return this.marketplace.search(query);
  }

  /**
   * Install a plugin from the marketplace
   */
  public async installPlugin(pluginId: string): Promise<boolean> {
    if (!this.enabled) return false;
    const plugin = await this.marketplace.getPlugin(pluginId);
    if (!plugin) return false;
    return this.pluginManager.loadPlugin(plugin.manifest);
  }

  /**
   * Load example plugins
   */
  public loadExamplePlugins(): void {
    if (!this.enabled) return;

    // Load the environment variable replacement plugin
    this.pluginManager.loadPlugin({
      name: 'envReplace',
      version: '1.0.0',
      description: 'Replace environment variables in strings',
      main: EnvReplacePlugin,
      hooks: {
        'transform:string': 'transformString'
      },
      config: {
        prefix: '${',
        suffix: '}',
        fallback: ''
      }
    });
  }
}

// Export the PluginSystem class


// Export utility functions
  export * from './utils';

// Export types
export * from './types';

// Export a default instance of the PluginSystem
export default PluginSystem.getInstance();
