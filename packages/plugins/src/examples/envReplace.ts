/**
 * Environment Variable Replacement Plugin
 *
 * This plugin replaces environment variable placeholders in strings
 * with their actual values.
 */

import { PluginConfig } from '../types';

/**
 * Environment Variable Replacement Plugin
 */
export class EnvReplacePlugin {
  private config: PluginConfig;

  constructor(config: PluginConfig) {
    this.config = config;
  }

  /**
   * Initialize the plugin
   */
  public async load(): Promise<void> {
    console.log('Environment Variable Replacement Plugin loaded');
  }

  /**
   * Cleanup the plugin
   */
  public async unload(): Promise<void> {
    console.log('Environment Variable Replacement Plugin unloaded');
  }

  /**
   * Enable the plugin
   */
  public async enable(): Promise<void> {
    console.log('Environment Variable Replacement Plugin enabled');
  }

  /**
   * Disable the plugin
   */
  public async disable(): Promise<void> {
    console.log('Environment Variable Replacement Plugin disabled');
  }

  /**
   * Transform a string by replacing environment variables
   */
  public transformString(context: { value: string }): { value: string } {
    const { value } = context;
    const prefix = this.config.prefix || '${';
    const suffix = this.config.suffix || '}';
    const fallback = this.config.fallback || '';

    // Regular expression to match environment variable placeholders
    const regex = new RegExp(`${prefix}([^${suffix}]+)${suffix}`, 'g');

    // Replace placeholders with environment variable values
    const transformed = value.replace(regex, (match, varName) => {
      // Try to get the environment variable
      const envValue = process.env[varName];

      // Return the environment variable value or fallback
      return envValue !== undefined ? envValue : fallback;
    });

    return { value: transformed };
  }

  /**
   * Get plugin configuration
   */
  public getConfig(): PluginConfig {
    return { ...this.config };
  }

  /**
   * Update plugin configuration
   */
  public updateConfig(config: Partial<PluginConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
