/**
 * Progressive Web App (PWA) implementation
 */

import { EventEmitter } from 'events';

import {
  PWAConfig,
  PWAContext
} from '../types';

/**
 * PWAManager - Handles PWA functionality
 */
export class PWAManager extends EventEmitter {
  private config: PWAConfig;
  private context: PWAContext;
  private registration: ServiceWorkerRegistration | null = null;
  private enabled: boolean = true;

  constructor(config: PWAConfig = {}) {
    super();
    this.config = {
      enabled: true,
      swPath: '/sw.js',
      swScope: '/',
      offlineStrategy: 'stale-while-revalidate',
      cacheName: 'onedot-cache',
      precache: [],
      runtimeCache: [],
      ...config
    };

    this.context = {
      enabled: this.config.enabled !== false,
      swPath: this.config.swPath || '/sw.js',
      swScope: this.config.swScope || '/',
      offlineStrategy: this.config.offlineStrategy || 'stale-while-revalidate',
      cacheName: this.config.cacheName || 'onedot-cache',
      precache: this.config.precache || [],
      runtimeCache: this.config.runtimeCache || []
    };

    this.initialize();
  }

  /**
   * Initialize the PWA manager
   */
  private initialize(): void {
    if (!this.context.enabled) {
      return;
    }

    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      // Register the service worker when the page loads
      if (typeof window !== 'undefined') {
        window.addEventListener('load', () => {
          this.registerServiceWorker();
        });
      }
    } else {
      console.warn('Service workers are not supported in this browser');
    }

    this.emit('initialized');
  }

  /**
   * Enable or disable the PWA manager
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Check if the PWA manager is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the PWA configuration
   */
  public getConfig(): PWAConfig {
    return { ...this.config };
  }

  /**
   * Update the PWA configuration
   */
  public updateConfig(config: Partial<PWAConfig>): void {
    this.config = { ...this.config, ...config };
    this.context = { ...this.context, ...config };
    this.emit('configUpdated', this.config);
  }

  /**
   * Get the PWA context
   */
  public getContext(): PWAContext {
    return { ...this.context };
  }

  /**
   * Get the service worker registration
   */
  public getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Register a service worker
   */
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.enabled || !this.context.enabled) {
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported in this browser');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(this.context.swPath, {
        scope: this.context.swScope
      });

      this.registration = registration;

      // Set up update handling
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;

        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              this.emit('updated', registration);
            }
          });
        }
      });

      // Set up controller change handling
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // The controller has changed, probably due to a new service worker
        this.emit('controllerChanged', registration);
      });

      this.emit('registered', registration);

      return registration;
    } catch (error) {
      console.error('Error registering service worker:', error);
      this.emit('registrationError', error);
      return null;
    }
  }

  /**
   * Unregister the service worker
   */
  public async unregisterServiceWorker(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();

      if (result) {
        this.registration = null;
        this.emit('unregistered');
      }

      return result;
    } catch (error) {
      console.error('Error unregistering service worker:', error);
      this.emit('unregistrationError', error);
      return false;
    }
  }

  /**
   * Check for updates
   */
  public async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }

  /**
   * Skip waiting and activate the new service worker
   */
  public async skipWaiting(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      const worker = this.registration.waiting || this.registration.installing;

      if (worker) {
        worker.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (error) {
      console.error('Error skipping waiting:', error);
    }
  }

  /**
   * Create a manifest file
   */
  public createManifest(options: {
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
  } = {}): string {
    const manifest = {
      name: options.name || 'ONEDOT-JS App',
      short_name: options.shortName || options.name || 'App',
      description: options.description || '',
      theme_color: options.themeColor || '#000000',
      background_color: options.backgroundColor || '#ffffff',
      display: options.display || 'standalone',
      orientation: options.orientation || 'any',
      start_url: options.startUrl || '/',
      icons: options.icons || []
    };

    return JSON.stringify(manifest, null, 2);
  }

  /**
   * Create a service worker file
   */
  public createServiceWorker(): string {
    // This is a simplified implementation
    // In a real implementation, we would use a library like Workbox

    return `
      const CACHE_NAME = '${this.context.cacheName}';
      const PRECACHE_URLS = ${JSON.stringify(this.context.precache)};
      const RUNTIME_CACHE = ${JSON.stringify(this.context.runtimeCache)};

      // Install event - precache assets
      self.addEventListener('install', event => {
        event.waitUntil(
          caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
        );
      });

      // Activate event - clean up old caches
      self.addEventListener('activate', event => {
        const currentCaches = [CACHE_NAME];
        event.waitUntil(
          caches.keys().then(cacheNames => {
            return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
          }).then(cachesToDelete => {
            return Promise.all(cachesToDelete.map(cacheToDelete => {
              return caches.delete(cacheToDelete);
            }));
          }).then(() => self.clients.claim())
        );
      });

      // Fetch event - serve from cache or network
      self.addEventListener('fetch', event => {
        const url = new URL(event.request.url);

        // Check if the request matches any runtime cache patterns
        for (const cacheConfig of RUNTIME_CACHE) {
          if (this.matchesPattern(url.pathname, cacheConfig.urlPattern)) {
            event.respondWith(
              this.handleRequest(event.request, cacheConfig.handler)
            );
            return;
          }
        }

        // Default strategy
        event.respondWith(
          this.handleRequest(event.request, '${this.context.offlineStrategy}')
        );
      });

      // Handle messages from the client
      self.addEventListener('message', event => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          self.skipWaiting();
        }
      });

      // Check if a URL matches a pattern
      this.matchesPattern = (url, pattern) => {
        if (typeof pattern === 'string') {
          return url.startsWith(pattern);
        } else if (pattern instanceof RegExp) {
          return pattern.test(url);
        }
        return false;
      };

      // Handle a request with the specified strategy
      this.handleRequest = (request, strategy) => {
        if (strategy === 'cache-first') {
          return caches.match(request)
            .then(response => {
              return response || fetch(request);
            });
        } else if (strategy === 'network-first') {
          return fetch(request)
            .then(response => {
              // Cache the response for future use
              if (response.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, response.clone());
                });
              }
              return response;
            })
            .catch(() => {
              return caches.match(request);
            });
        } else if (strategy === 'stale-while-revalidate') {
          return caches.match(request)
            .then(response => {
              const fetchPromise = fetch(request).then(networkResponse => {
                // Update the cache with the network response
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, networkResponse.clone());
                });
                return networkResponse;
              });

              return response || fetchPromise;
            });
        } else {
          return fetch(request);
        }
      };
    `;
  }
}
