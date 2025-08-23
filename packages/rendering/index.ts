/**
 * ONEDOT-JS Rendering Package
 *
 * This package provides advanced rendering capabilities for the ONEDOT-JS framework,
 * including multiple rendering backends and GPU acceleration.
 */

// Core exports
export * from './src';

// Module-specific exports
export { RenderingBridge } from './src/bridge';
export { FabricRenderer } from './src/fabric';
export { GPURenderer } from './src/gpu';
export { SkiaRenderer } from './src/skia';

// Re-export commonly used types and interfaces
export type {
  Buffer,
  Framebuffer, RenderCommand, RenderingBackend,
  RenderingContext,
  RenderingOptions,
  RenderNode, RenderStats, RenderTree, Shader,
  Texture
} from './src/types';

// Default export for the rendering package
export default {
  // Rendering backends
  backends: {
    bridge: require('./src/bridge').RenderingBridge,
    fabric: require('./src/fabric').FabricRenderer,
    gpu: require('./src/gpu').GPURenderer,
    skia: require('./src/skia').SkiaRenderer
  },

  // Version information
  version: require('./package.json').version
};
