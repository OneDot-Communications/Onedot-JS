/**
 * ONEDOT-JS Framework
 * A full-stack, multi-platform framework for building applications
 */

// Core exports
export * from '@onedot/core';

// Runtime exports
export * from '@onedot/runtime';

// Rendering exports
export * from '@onedot/rendering';

// Platform exports
export * from '@onedot/desktop';
export * from '@onedot/mobile';
export * from '@onedot/web';

// Toolchain exports
export * from '@onedot/bundler';
export * from '@onedot/cli';

// Development tools
export * from '@onedot/devtools';
export * from '@onedot/testing';

// Performance optimization
export * from '@onedot/performance';

// Migration tools
export * from '@onedot/migration';

// Documentation generator
export * from '@onedot/docs';

// Version information
export const version = '1.0.0';

// Framework initialization function
export function initializeOneDot(config?: OneDotConfig): void {
  // Initialize the framework with optional configuration
  console.log(`Initializing ONEDOT-JS Framework v${version}`);

  if (config) {
    // Apply configuration
    if (config.strictMode) {
      console.log('Strict mode enabled');
    }

    if (config.performanceMode) {
      console.log('Performance mode enabled');
    }

    if (config.devTools) {
      console.log('Developer tools enabled');
    }
  }

  // Initialize core systems
  // This would typically initialize the runtime, rendering engine, etc.
}

// Configuration interface
export interface OneDotConfig {
  strictMode?: boolean;
  performanceMode?: boolean;
  devTools?: boolean;
  platform?: 'web' | 'mobile' | 'desktop' | 'all';
  plugins?: string[];
}
