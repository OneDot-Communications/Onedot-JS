/**
 * ONEDOT-JS Rendering Core Implementation
 *
 * This module provides the core functionality for the rendering system,
 * including renderer management and backend abstraction.
 */

import { Component } from '@onedot/core';
import { EventEmitter } from 'events';

// Import rendering backends
import { RenderingBridge } from './bridge';
import { FabricRenderer } from './fabric';
import { GPURenderer } from './gpu';
import { SkiaRenderer } from './skia';

// Import types
import {
  Buffer,
  Framebuffer,
  RenderingBackend,
  RenderingContext,
  RenderingOptions,
  RenderNode,
  RenderStats,
  RenderTree,
  Shader,
  Texture
} from './types';

// Import utilities
import * as RenderingUtils from './utils';

/**
 * RendererManager - Manages rendering backends and operations
 */
export class RendererManager extends EventEmitter {
  private static instance: RendererManager;
  private currentBackend: RenderingBackend;
  private backends: Map<RenderingBackend, any> = new Map();
  private context: RenderingContext | null = null;
  private options: RenderingOptions;
  private stats: RenderStats;
  private enabled: boolean = true;

  private constructor(options: RenderingOptions = {}) {
    super();
    this.options = {
      backend: RenderingBridge.id,
      width: 800,
      height: 600,
      pixelRatio: 1,
      antialias: true,
      ...options
    };

    this.stats = {
      frameTime: 0,
      fps: 0,
      drawCalls: 0,
      triangles: 0,
      textures: 0,
      buffers: 0,
      shaders: 0,
      framebuffers: 0,
      memory: 0
    };

    this.initializeBackends();
    this.setBackend(this.options.backend || RenderingBridge.id);
  }

  /**
   * Get the singleton instance of RendererManager
   */
  public static getInstance(options?: RenderingOptions): RendererManager {
    if (!RendererManager.instance) {
      RendererManager.instance = new RendererManager(options);
    }
    return RendererManager.instance;
  }

  /**
   * Initialize rendering backends
   */
  private initializeBackends(): void {
    // Initialize Bridge backend
    this.backends.set(RenderingBridge.id, new RenderingBridge(this.options));

    // Initialize Fabric backend
    this.backends.set(FabricRenderer.id, new FabricRenderer(this.options));

    // Initialize GPU backend
    this.backends.set(GPURenderer.id, new GPURenderer(this.options));

    // Initialize Skia backend
    this.backends.set(SkiaRenderer.id, new SkiaRenderer(this.options));
  }

  /**
   * Set the rendering backend
   */
  public setBackend(backend: RenderingBackend): boolean {
    if (this.backends.has(backend)) {
      this.currentBackend = backend;

      // Get the backend instance
      const backendInstance = this.backends.get(backend);

      // Initialize the backend if needed
      if (backendInstance && !backendInstance.isInitialized()) {
        backendInstance.initialize();
      }

      // Create context if needed
      if (!this.context) {
        this.context = backendInstance.createContext();
      }

      this.emit('backendChanged', backend);
      return true;
    }

    console.error(`Rendering backend '${backend}' not found`);
    return false;
  }

  /**
   * Get the current rendering backend
   */
  public getBackend(): RenderingBackend {
    return this.currentBackend;
  }

  /**
   * Get the current rendering context
   */
  public getContext(): RenderingContext | null {
    return this.context;
  }

  /**
   * Get a backend by name
   */
  public getBackendInstance(backend: RenderingBackend): any {
    return this.backends.get(backend);
  }

  /**
   * Get all available backends
   */
  public getAvailableBackends(): RenderingBackend[] {
    return Array.from(this.backends.keys());
  }

  /**
   * Enable or disable rendering
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Check if rendering is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get rendering statistics
   */
  public getStats(): RenderStats {
    return { ...this.stats };
  }

  /**
   * Update rendering options
   */
  public updateOptions(options: Partial<RenderingOptions>): void {
    this.options = { ...this.options, ...options };

    // Update all backends
    this.backends.forEach(backend => {
      if (backend.updateOptions) {
        backend.updateOptions(this.options);
      }
    });

    this.emit('optionsUpdated', this.options);
  }

  /**
   * Create a render tree from components
   */
  public createRenderTree(components: Component[]): RenderTree {
    const tree: RenderTree = {
      root: this.createRenderNode(components),
      nodes: [],
      commands: []
    };

    // Collect all nodes
    this.collectNodes(tree.root, tree.nodes);

    // Generate render commands
    this.generateCommands(tree);

    return tree;
  }

  /**
   * Create a render node from components
   */
  private createRenderNode(components: Component[]): RenderNode {
    // This is a simplified implementation
    // In a real implementation, we would traverse the component tree and create render nodes

    return {
      id: RenderingUtils.generateId('node'),
      type: 'container',
      x: 0,
      y: 0,
      width: this.options.width || 800,
      height: this.options.height || 600,
      children: components.map(component => ({
        id: RenderingUtils.generateId('node'),
        type: 'component',
        component,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        children: []
      }))
    };
  }

  /**
   * Collect all nodes in a render tree
   */
  private collectNodes(node: RenderNode, nodes: RenderNode[]): void {
    nodes.push(node);

    node.children.forEach(child => {
      this.collectNodes(child, nodes);
    });
  }

  /**
   * Generate render commands from a render tree
   */
  private generateCommands(tree: RenderTree): void {
    // This is a simplified implementation
    // In a real implementation, we would traverse the render tree and generate optimized render commands

    tree.commands.push({
      type: 'clear',
      color: [0, 0, 0, 1]
    });

    tree.nodes.forEach(node => {
      if (node.type === 'component') {
        tree.commands.push({
          type: 'drawRect',
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          color: [0.5, 0.5, 0.5, 1]
        });
      }
    });
  }

  /**
   * Render a frame
   */
  public render(tree: RenderTree): void {
    if (!this.enabled || !this.context) return;

    const startTime = performance.now();

    // Get the current backend
    const backend = this.backends.get(this.currentBackend);
    if (!backend) return;

    // Reset stats
    this.stats.drawCalls = 0;
    this.stats.triangles = 0;

    // Render the tree
    backend.render(tree, this.context);

    // Update stats
    this.stats.frameTime = performance.now() - startTime;
    this.stats.fps = 1000 / this.stats.frameTime;

    // Emit event
    this.emit('frameRendered', this.stats);
  }

  /**
   * Resize the rendering context
   */
  public resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;

    if (this.context) {
      this.context.width = width;
      this.context.height = height;
    }

    // Update all backends
    this.backends.forEach(backend => {
      if (backend.resize) {
        backend.resize(width, height);
      }
    });

    this.emit('resized', { width, height });
  }

  /**
   * Create a shader
   */
  public createShader(type: 'vertex' | 'fragment', source: string): Shader | null {
    const backend = this.backends.get(this.currentBackend);
    if (!backend || !backend.createShader) return null;

    const shader = backend.createShader(type, source);
    if (shader) {
      this.stats.shaders++;
      this.emit('shaderCreated', shader);
    }

    return shader;
  }

  /**
   * Create a texture
   */
  public createTexture(source: HTMLImageElement | HTMLCanvasElement | ImageData): Texture | null {
    const backend = this.backends.get(this.currentBackend);
    if (!backend || !backend.createTexture) return null;

    const texture = backend.createTexture(source);
    if (texture) {
      this.stats.textures++;
      this.emit('textureCreated', texture);
    }

    return texture;
  }

  /**
   * Create a buffer
   */
  public createBuffer(data: ArrayBuffer | ArrayBufferView, usage: number): Buffer | null {
    const backend = this.backends.get(this.currentBackend);
    if (!backend || !backend.createBuffer) return null;

    const buffer = backend.createBuffer(data, usage);
    if (buffer) {
      this.stats.buffers++;
      this.emit('bufferCreated', buffer);
    }

    return buffer;
  }

  /**
   * Create a framebuffer
   */
  public createFramebuffer(textures: Texture[]): Framebuffer | null {
    const backend = this.backends.get(this.currentBackend);
    if (!backend || !backend.createFramebuffer) return null;

    const framebuffer = backend.createFramebuffer(textures);
    if (framebuffer) {
      this.stats.framebuffers++;
      this.emit('framebufferCreated', framebuffer);
    }

    return framebuffer;
  }

  /**
   * Destroy a shader
   */
  public destroyShader(shader: Shader): void {
    const backend = this.backends.get(this.currentBackend);
    if (backend && backend.destroyShader) {
      backend.destroyShader(shader);
      this.stats.shaders--;
      this.emit('shaderDestroyed', shader);
    }
  }

  /**
   * Destroy a texture
   */
  public destroyTexture(texture: Texture): void {
    const backend = this.backends.get(this.currentBackend);
    if (backend && backend.destroyTexture) {
      backend.destroyTexture(texture);
      this.stats.textures--;
      this.emit('textureDestroyed', texture);
    }
  }

  /**
   * Destroy a buffer
   */
  public destroyBuffer(buffer: Buffer): void {
    const backend = this.backends.get(this.currentBackend);
    if (backend && backend.destroyBuffer) {
      backend.destroyBuffer(buffer);
      this.stats.buffers--;
      this.emit('bufferDestroyed', buffer);
    }
  }

  /**
   * Destroy a framebuffer
   */
  public destroyFramebuffer(framebuffer: Framebuffer): void {
    const backend = this.backends.get(this.currentBackend);
    if (backend && backend.destroyFramebuffer) {
      backend.destroyFramebuffer(framebuffer);
      this.stats.framebuffers--;
      this.emit('framebufferDestroyed', framebuffer);
    }
  }

  /**
   * Take a screenshot
   */
  public screenshot(): HTMLCanvasElement | null {
    const backend = this.backends.get(this.currentBackend);
    if (!backend || !backend.screenshot) return null;

    return backend.screenshot();
  }
}

// Export the RendererManager class
export { RendererManager };

// Export utility functions
  export * from './utils';

// Export types
export * from './types';

// Export a default instance of the RendererManager
export default RendererManager.getInstance();
