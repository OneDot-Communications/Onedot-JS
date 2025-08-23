/**
 * ONEDOT-JS Web Package
 *
 * This package provides web platform implementations for the ONEDOT-JS framework,
 * including client-side rendering, server-side rendering, static site generation,
 * PWA capabilities, and SEO optimizations.
 */

// Core exports
export * from './src';

// Module-specific exports
export { CSRRenderer } from './src/csr';
export { PWAManager } from './src/pwa';
export { SEOManager } from './src/seo';
export { SSGRenderer } from './src/ssg';
export { SSRRenderer } from './src/ssr';

// Re-export commonly used types and interfaces
export type {
  CSRConfig,
  CSRContext,
  PWAConfig,
  PWAContext,
  SEOConfig,
  SEOContext,
  SSGConfig,
  SSGContext,
  SSRConfig,
  SSRContext, WebApp, WebComponent, WebConfig,
  WebContext, WebPage, WebRoute
} from './src/types';

// Default export for the web package
export default {
  // Rendering strategies
  renderers: {
    csr: require('./src/csr').CSRRenderer,
    ssr: require('./src/ssr').SSRRenderer,
    ssg: require('./src/ssg').SSGRenderer
  },

  // PWA management
  pwa: require('./src/pwa').PWAManager,

  // SEO management
  seo: require('./src/seo').SEOManager,

  // Version information
  version: require('./package.json').version
};
