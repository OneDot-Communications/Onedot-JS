/**
 * Plugin marketplace implementation
 */

import { EventEmitter } from 'events';
import {
  MarketplacePlugin,
  MarketplaceQuery,
  MarketplaceResponse,
  PluginManifest
} from '../types';

/**
 * PluginMarketplace - Manages plugin discovery and installation
 */
export class PluginMarketplace extends EventEmitter {
  private plugins: Map<string, MarketplacePlugin> = new Map();
  private enabled: boolean = true;
  private apiUrl: string = 'https://api.onedot-js.dev/plugins';

  /**
   * Enable the marketplace
   */
  public enable(): void {
    this.enabled = true;
    this.emit('enabled');
  }

  /**
   * Disable the marketplace
   */
  public disable(): void {
    this.enabled = false;
    this.emit('disabled');
  }

  /**
   * Check if the marketplace is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set the API URL
   */
  public setApiUrl(url: string): void {
    this.apiUrl = url;
    this.emit('apiUrlChanged', url);
  }

  /**
   * Get the API URL
   */
  public getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Search for plugins
   */
  public async search(query: MarketplaceQuery): Promise<MarketplaceResponse> {
    if (!this.enabled) {
      return {
        plugins: [],
        total: 0,
        limit: query.limit || 10,
        offset: query.offset || 0,
        query
      };
    }

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (query.query) params.append('q', query.query);
      if (query.tags) query.tags.forEach(tag => params.append('tags', tag));
      if (query.author) params.append('author', query.author);
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.offset) params.append('offset', query.offset.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);

      // Make API request
      const response = await fetch(`${this.apiUrl}/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Convert API response to marketplace plugins
      const plugins: MarketplacePlugin[] = data.plugins.map((plugin: any) => ({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        homepage: plugin.homepage,
        downloads: plugin.downloads,
        rating: plugin.rating,
        tags: plugin.tags,
        manifest: plugin.manifest,
        publishedAt: new Date(plugin.publishedAt),
        updatedAt: new Date(plugin.updatedAt)
      }));

      return {
        plugins,
        total: data.total,
        limit: data.limit,
        offset: data.offset,
        query
      };
    } catch (error) {
      console.error('Error searching plugins:', error);

      // Return empty response on error
      return {
        plugins: [],
        total: 0,
        limit: query.limit || 10,
        offset: query.offset || 0,
        query
      };
    }
  }

  /**
   * Get a plugin by ID
   */
  public async getPlugin(id: string): Promise<MarketplacePlugin | null> {
    if (!this.enabled) return null;

    try {
      // Check if plugin is already cached
      if (this.plugins.has(id)) {
        return this.plugins.get(id)!;
      }

      // Make API request
      const response = await fetch(`${this.apiUrl}/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Convert API response to marketplace plugin
      const plugin: MarketplacePlugin = {
        id: data.id,
        name: data.name,
        version: data.version,
        description: data.description,
        author: data.author,
        homepage: data.homepage,
        downloads: data.downloads,
        rating: data.rating,
        tags: data.tags,
        manifest: data.manifest,
        publishedAt: new Date(data.publishedAt),
        updatedAt: new Date(data.updatedAt)
      };

      // Cache the plugin
      this.plugins.set(id, plugin);

      return plugin;
    } catch (error) {
      console.error(`Error getting plugin '${id}':`, error);
      return null;
    }
  }

  /**
   * Get popular plugins
   */
  public async getPopularPlugins(limit: number = 10): Promise<MarketplacePlugin[]> {
    const query: MarketplaceQuery = {
      limit,
      sortBy: 'downloads',
      sortOrder: 'desc'
    };

    const response = await this.search(query);
    return response.plugins;
  }

  /**
   * Get top-rated plugins
   */
  public async getTopRatedPlugins(limit: number = 10): Promise<MarketplacePlugin[]> {
    const query: MarketplaceQuery = {
      limit,
      sortBy: 'rating',
      sortOrder: 'desc'
    };

    const response = await this.search(query);
    return response.plugins;
  }

  /**
   * Get recently updated plugins
   */
  public async getRecentlyUpdatedPlugins(limit: number = 10): Promise<MarketplacePlugin[]> {
    const query: MarketplaceQuery = {
      limit,
      sortBy: 'updated',
      sortOrder: 'desc'
    };

    const response = await this.search(query);
    return response.plugins;
  }

  /**
   * Get plugins by author
   */
  public async getPluginsByAuthor(author: string, limit: number = 10): Promise<MarketplacePlugin[]> {
    const query: MarketplaceQuery = {
      author,
      limit
    };

    const response = await this.search(query);
    return response.plugins;
  }

  /**
   * Get plugins by tag
   */
  public async getPluginsByTag(tag: string, limit: number = 10): Promise<MarketplacePlugin[]> {
    const query: MarketplaceQuery = {
      tags: [tag],
      limit
    };

    const response = await this.search(query);
    return response.plugins;
  }

  /**
   * Install a plugin
   */
  public async installPlugin(id: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const plugin = await this.getPlugin(id);
      if (!plugin) {
        console.error(`Plugin '${id}' not found`);
        return false;
      }

      // Emit event before installation
      this.emit('installing', plugin);

      // In a real implementation, this would download and install the plugin
      // For now, we'll just simulate the installation
      console.log(`Installing plugin '${plugin.name}'...`);

      // Simulate installation delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Emit event after successful installation
      this.emit('installed', plugin);

      return true;
    } catch (error) {
      console.error(`Error installing plugin '${id}':`, error);
      return false;
    }
  }

  /**
   * Rate a plugin
   */
  public async ratePlugin(id: string, rating: number): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        console.error('Rating must be between 1 and 5');
        return false;
      }

      // Make API request
      const response = await fetch(`${this.apiUrl}/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      // Clear cached plugin to force refresh
      this.plugins.delete(id);

      return true;
    } catch (error) {
      console.error(`Error rating plugin '${id}':`, error);
      return false;
    }
  }

  /**
   * Report a plugin
   */
  public async reportPlugin(id: string, reason: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      // Make API request
      const response = await fetch(`${this.apiUrl}/${id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error(`Error reporting plugin '${id}':`, error);
      return false;
    }
  }

  /**
   * Submit a plugin to the marketplace
   */
  public async submitPlugin(manifest: PluginManifest): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      // Make API request
      const response = await fetch(`${this.apiUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ manifest })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error submitting plugin:', error);
      return false;
    }
  }

  /**
   * Clear the plugin cache
   */
  public clearCache(): void {
    this.plugins.clear();
    this.emit('cacheCleared');
  }
}

// Export the PluginMarketplace class
export { PluginMarketplace };
