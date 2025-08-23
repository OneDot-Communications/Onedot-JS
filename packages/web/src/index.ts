/**
 * ONEDOT-JS Web Core Implementation
 *
 * This module provides the core functionality for web platform implementations,
 * including client-side rendering, server-side rendering, static site generation,
 * PWA capabilities, and SEO optimizations.
 */

import { RendererManager } from '@onedot/rendering';
import { EventEmitter } from 'events';

// Import modules
import { CSRRenderer } from './csr';
import { PWAManager } from './pwa';
import { SEOManager } from './seo';
import { SSGRenderer } from './ssg';
import { SSRRenderer } from './ssr';

// Import types
import {
  CSRConfig,
  PWAConfig,
  SEOConfig,
  SSGConfig,
  SSRConfig,
  WebApp,
  WebComponent,
  WebConfig,
  WebContext,
  WebPage,
  WebRoute
} from './types';

// Import utilities
import * as WebUtils from './utils';

/**
 * WebManager - Manages all web platform operations
 */
export class WebManager extends EventEmitter {
  private static instance: WebManager;
  private config: WebConfig;
  private context: WebContext;
  private csrRenderer: CSRRenderer;
  private pwaManager: PWAManager;
  private seoManager: SEOManager;
  private ssgRenderer: SSGRenderer;
  private ssrRenderer: SSRRenderer;
  private rendererManager: RendererManager;
  private routes: Map<string, WebRoute> = new Map();
  private pages: Map<string, WebPage> = new Map();
  private enabled: boolean = true;

  private constructor(config: WebConfig = {}) {
    super();
    this.config = {
      mode: 'csr',
      baseUrl: '/',
      publicPath: '/',
      outputDir: 'dist',
      assetsDir: 'assets',
      ...config
    };

    this.context = {
      mode: this.config.mode || 'csr',
      baseUrl: this.config.baseUrl || '/',
      publicPath: this.config.publicPath || '/',
      outputDir: this.config.outputDir || 'dist',
      assetsDir: this.config.assetsDir || 'assets'
    };

    this.rendererManager = RendererManager.getInstance();
    this.csrRenderer = new CSRRenderer(this.config as CSRConfig);
    this.pwaManager = new PWAManager(this.config as PWAConfig);
    this.seoManager = new SEOManager(this.config as SEOConfig);
    this.ssgRenderer = new SSGRenderer(this.config as SSGConfig);
    this.ssrRenderer = new SSRRenderer(this.config as SSRConfig);

    this.initialize();
  }

  /**
   * Get the singleton instance of WebManager
   */
  public static getInstance(config?: WebConfig): WebManager {
    if (!WebManager.instance) {
      WebManager.instance = new WebManager(config);
    }
    return WebManager.instance;
  }

  /**
   * Initialize the web manager
   */
  private initialize(): void {
    // Set up event listeners
    this.csrRenderer.on('rendered', (result) => {
      this.emit('csrRendered', result);
    });

    this.pwaManager.on('registered', (registration) => {
      this.emit('pwaRegistered', registration);
    });

    this.pwaManager.on('updated', (registration) => {
      this.emit('pwaUpdated', registration);
    });

    this.seoManager.on('optimized', (result) => {
      this.emit('seoOptimized', result);
    });

    this.ssgRenderer.on('generated', (page) => {
      this.emit('ssgGenerated', page);
    });

    this.ssrRenderer.on('rendered', (result) => {
      this.emit('ssrRendered', result);
    });

    // Set up default routes
    this.setupDefaultRoutes();

    this.emit('initialized');
  }

  /**
   * Enable or disable the web manager
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Check if the web manager is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the web configuration
   */
  public getConfig(): WebConfig {
    return { ...this.config };
  }

  /**
   * Update the web configuration
   */
  public updateConfig(config: Partial<WebConfig>): void {
    this.config = { ...this.config, ...config };
    this.context = { ...this.context, ...config };

    // Update sub-managers
    this.csrRenderer.updateConfig(config);
    this.pwaManager.updateConfig(config);
    this.seoManager.updateConfig(config);
    this.ssgRenderer.updateConfig(config);
    this.ssrRenderer.updateConfig(config);

    this.emit('configUpdated', this.config);
  }

  /**
   * Get the web context
   */
  public getContext(): WebContext {
    return { ...this.context };
  }

  /**
   * Get the CSR renderer
   */
  public getCSRRenderer(): CSRRenderer {
    return this.csrRenderer;
  }

  /**
   * Get the PWA manager
   */
  public getPWAManager(): PWAManager {
    return this.pwaManager;
  }

  /**
   * Get the SEO manager
   */
  public getSEOManager(): SEOManager {
    return this.seoManager;
  }

  /**
   * Get the SSG renderer
   */
  public getSSGRenderer(): SSGRenderer {
    return this.ssgRenderer;
  }

  /**
   * Get the SSR renderer
   */
  public getSSRRenderer(): SSRRenderer {
    return this.ssrRenderer;
  }

  /**
   * Get the renderer manager
   */
  public getRendererManager(): RendererManager {
    return this.rendererManager;
  }

  /**
   * Add a route
   */
  public addRoute(path: string, component: WebComponent, options: {
    exact?: boolean;
    sensitive?: boolean;
    strict?: boolean;
  } = {}): void {
    const route: WebRoute = {
      path,
      component,
      exact: options.exact !== false,
      sensitive: options.sensitive !== false,
      strict: options.strict !== false
    };

    this.routes.set(path, route);
    this.emit('routeAdded', route);
  }

  /**
   * Remove a route
   */
  public removeRoute(path: string): boolean {
    const route = this.routes.get(path);
    if (!route) return false;

    this.routes.delete(path);
    this.emit('routeRemoved', route);

    return true;
  }

  /**
   * Get a route by path
   */
  public getRoute(path: string): WebRoute | undefined {
    return this.routes.get(path);
  }

  /**
   * Get all routes
   */
  public getRoutes(): WebRoute[] {
    return Array.from(this.routes.values());
  }

  /**
   * Match a route for a given path
   */
  public matchRoute(path: string): { route: WebRoute; params: Record<string, string> } | null {
    for (const route of this.routes.values()) {
      const match = WebUtils.matchPath(route.path, path, {
        exact: route.exact,
        sensitive: route.sensitive,
        strict: route.strict
      });

      if (match) {
        return { route, params: match.params };
      }
    }

    return null;
  }

  /**
   * Add a page
   */
  public addPage(path: string, component: WebComponent, options: {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
  } = {}): void {
    const page: WebPage = {
      path,
      component,
      title: options.title,
      description: options.description,
      keywords: options.keywords,
      image: options.image
    };

    this.pages.set(path, page);
    this.emit('pageAdded', page);
  }

  /**
   * Remove a page
   */
  public removePage(path: string): boolean {
    const page = this.pages.get(path);
    if (!page) return false;

    this.pages.delete(path);
    this.emit('pageRemoved', page);

    return true;
  }

  /**
   * Get a page by path
   */
  public getPage(path: string): WebPage | undefined {
    return this.pages.get(path);
  }

  /**
   * Get all pages
   */
  public getPages(): WebPage[] {
    return Array.from(this.pages.values());
  }

  /**
   * Render a page with CSR
   */
  public async renderCSR(path: string, props?: any): Promise<string> {
    if (!this.enabled) {
      throw new Error('Web manager is disabled');
    }

    const match = this.matchRoute(path);
    if (!match) {
      throw new Error(`No route found for path: ${path}`);
    }

    return this.csrRenderer.render(match.route.component, {
      path,
      params: match.params,
      ...props
    });
  }

  /**
   * Render a page with SSR
   */
  public async renderSSR(path: string, props?: any): Promise<string> {
    if (!this.enabled) {
      throw new Error('Web manager is disabled');
    }

    const match = this.matchRoute(path);
    if (!match) {
      throw new Error(`No route found for path: ${path}`);
    }

    return this.ssrRenderer.render(match.route.component, {
      path,
      params: match.params,
      ...props
    });
  }

  /**
   * Generate static pages with SSG
   */
  public async generateSSG(): Promise<void> {
    if (!this.enabled) {
      throw new Error('Web manager is disabled');
    }

    const pages = this.getPages();

    for (const page of pages) {
      await this.ssgRenderer.generate(page);
    }
  }

  /**
   * Register a service worker for PWA
   */
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.enabled) {
      throw new Error('Web manager is disabled');
    }

    return this.pwaManager.registerServiceWorker();
  }

  /**
   * Optimize SEO for a page
   */
  public async optimizeSEO(path: string, options: {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
  } = {}): Promise<void> {
    if (!this.enabled) {
      throw new Error('Web manager is disabled');
    }

    const page = this.getPage(path);
    if (!page) {
      throw new Error(`No page found for path: ${path}`);
    }

    return this.seoManager.optimize(page, options);
  }

  /**
   * Create a web app
   */
  public createApp(options: {
    name?: string;
    shortName?: string;
    description?: string;
    themeColor?: string;
    backgroundColor?: string;
    display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
    orientation?: 'any' | 'natural' | 'landscape' | 'portrait';
    startUrl?: string;
    icons?: Array<{
      src: string;
      sizes: string;
      type: string;
    }>;
  } = {}): WebApp {
    const app: WebApp = {
      name: options.name || 'ONEDOT-JS App',
      shortName: options.shortName || options.name || 'App',
      description: options.description || '',
      themeColor: options.themeColor || '#000000',
      backgroundColor: options.backgroundColor || '#ffffff',
      display: options.display || 'standalone',
      orientation: options.orientation || 'any',
      startUrl: options.startUrl || '/',
      icons: options.icons || []
    };

    this.emit('appCreated', app);

    return app;
  }

  /**
   * Set up default routes
   */
  private setupDefaultRoutes(): void {
    // Add a default home route
    this.addRoute('/', () => {
      return {
        type: 'div',
        children: 'Welcome to ONEDOT-JS Web'
      };
    });

    // Add a 404 route
    this.addRoute('*', () => {
      return {
        type: 'div',
        children: 'Page not found'
      };
    });
  }
}

// Export the WebManager class


// Export utility functions
  export * from './utils';

// Export types
export * from './types';

// Export a default instance of the WebManager
export default WebManager.getInstance();
