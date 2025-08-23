/**
 * Type definitions for the plugins package
 */

/**
 * Interface for a plugin
 */
export interface Plugin {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  main: any;
  hooks: Record<string, string>;
  config: PluginConfig;
  dependencies?: string[];
  load: () => Promise<boolean>;
  unload: () => Promise<boolean>;
  enable: () => Promise<boolean>;
  disable: () => Promise<boolean>;
  executeHook: (hook: string, context: PluginContext) => Promise<PluginResult>;
}

/**
 * Interface for plugin configuration
 */
export interface PluginConfig {
  [key: string]: any;
}

/**
 * Interface for plugin context
 */
export interface PluginContext {
  [key: string]: any;
}

/**
 * Interface for a plugin hook
 */
export interface PluginHook {
  name: string;
  priority?: number;
  context: PluginContext;
}

/**
 * Interface for plugin execution result
 */
export interface PluginResult {
  pluginName: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

/**
 * Interface for plugin manifest
 */
export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  main: any;
  hooks: Record<string, string>;
  config: PluginConfig;
  dependencies?: string[];
}

/**
 * Interface for marketplace plugin
 */
export interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage: string;
  downloads: number;
  rating: number;
  tags: string[];
  manifest: PluginManifest;
  publishedAt: Date;
  updatedAt: Date;
}

/**
 * Interface for marketplace query
 */
export interface MarketplaceQuery {
  query?: string;
  tags?: string[];
  author?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'downloads' | 'rating' | 'updated';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Interface for marketplace response
 */
export interface MarketplaceResponse {
  plugins: MarketplacePlugin[];
  total: number;
  limit: number;
  offset: number;
  query: MarketplaceQuery;
}
