/**
 * ONEDOT-JS Plugins Package
 *
 * This package provides a plugin system for the ONEDOT-JS framework,
 * enabling extensibility and third-party integrations.
 */

// Core exports
export * from './src';

// Module-specific exports
export { PluginManager } from './src/core';
export { EnvReplacePlugin } from './src/examples';
export { PluginMarketplace } from './src/marketplace';

// Re-export commonly used types and interfaces
export type {
  MarketplacePlugin,
  MarketplaceQuery,
  MarketplaceResponse, Plugin,
  PluginConfig,
  PluginContext,
  PluginHook, PluginManifest, PluginResult
} from './src/types';

// Default export for the plugins package
export default {
  // Plugin management
  manager: require('./src/core').PluginManager,

  // Example plugins
  examples: {
    envReplace: require('./src/examples').EnvReplacePlugin
  },

  // Plugin marketplace
  marketplace: require('./src/marketplace').PluginMarketplace,

  // Version information
  version: require('./package.json').version
};
