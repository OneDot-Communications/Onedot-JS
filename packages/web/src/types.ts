/**
 * Type definitions for the web package
 */

/**
 * Interface for web configuration
 */
export interface WebConfig {
  mode?: 'csr' | 'ssr' | 'ssg' | 'universal';
  baseUrl?: string;
  publicPath?: string;
  outputDir?: string;
  assetsDir?: string;
  [key: string]: any;
}

/**
 * Interface for web context
 */
export interface WebContext {
  mode: 'csr' | 'ssr' | 'ssg' | 'universal';
  baseUrl: string;
  publicPath: string;
  outputDir: string;
  assetsDir: string;
  [key: string]: any;
}

/**
 * Interface for web route
 */
export interface WebRoute {
  path: string;
  component: WebComponent;
  exact?: boolean;
  sensitive?: boolean;
  strict?: boolean;
}

/**
 * Interface for web component
 */
export interface WebComponent {
  (props?: any): any;
  [key: string]: any;
}

/**
 * Interface for web page
 */
export interface WebPage {
  path: string;
  component: WebComponent;
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
}

/**
 * Interface for web app
 */
export interface WebApp {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
  orientation: 'any' | 'natural' | 'landscape' | 'portrait';
  startUrl: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
}

/**
 * Interface for CSR configuration
 */
export interface CSRConfig {
  baseUrl?: string;
  publicPath?: string;
  outputDir?: string;
  assetsDir?: string;
  hydrate?: boolean;
  [key: string]: any;
}

/**
 * Interface for CSR context
 */
export interface CSRContext {
  baseUrl: string;
  publicPath: string;
  outputDir: string;
  assetsDir: string;
  hydrate: boolean;
  [key: string]: any;
}

/**
 * Interface for PWA configuration
 */
export interface PWAConfig {
  enabled?: boolean;
  swPath?: string;
  swScope?: string;
  offlineStrategy?: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  cacheName?: string;
  precache?: string[];
  runtimeCache?: Array<{
    urlPattern: string | RegExp;
    handler: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    options?: any;
  }>;
  [key: string]: any;
}

/**
 * Interface for PWA context
 */
export interface PWAContext {
  enabled: boolean;
  swPath: string;
  swScope: string;
  offlineStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  cacheName: string;
  precache: string[];
  runtimeCache: Array<{
    urlPattern: string | RegExp;
    handler: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    options?: any;
  }>;
  [key: string]: any;
}

/**
 * Interface for SEO configuration
 */
export interface SEOConfig {
  enabled?: boolean;
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  siteName?: string;
  twitter?: {
    card?: 'summary' | 'summary_large_image';
    site?: string;
    creator?: string;
  };
  og?: {
    type?: 'website' | 'article';
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    site_name?: string;
  };
  [key: string]: any;
}

/**
 * Interface for SEO context
 */
export interface SEOContext {
  enabled: boolean;
  title: string;
  description: string;
  keywords: string;
  image: string;
  url: string;
  siteName: string;
  twitter: {
    card: 'summary' | 'summary_large_image';
    site: string;
    creator: string;
  };
  og: {
    type: 'website' | 'article';
    title: string;
    description: string;
    image: string;
    url: string;
    site_name: string;
  };
  [key: string]: any;
}

/**
 * Interface for SSG configuration
 */
export interface SSGConfig {
  baseUrl?: string;
  publicPath?: string;
  outputDir?: string;
  assetsDir?: string;
  trailingSlash?: boolean;
  [key: string]: any;
}

/**
 * Interface for SSG context
 */
export interface SSGContext {
  baseUrl: string;
  publicPath: string;
  outputDir: string;
  assetsDir: string;
  trailingSlash: boolean;
  [key: string]: any;
}

/**
 * Interface for SSR configuration
 */
export interface SSRConfig {
  baseUrl?: string;
  publicPath?: string;
  outputDir?: string;
  assetsDir?: string;
  [key: string]: any;
}

/**
 * Interface for SSR context
 */
export interface SSRContext {
  baseUrl: string;
  publicPath: string;
  outputDir: string;
  assetsDir: string;
  [key: string]: any;
}
