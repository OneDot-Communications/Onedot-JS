/**
 * Bridge rendering backend implementation
 */

import { EventEmitter } from 'events';
import {
  Buffer,
  Framebuffer,
  RenderingBackend,
  RenderingContext,
  RenderingOptions,
  RenderStats,
  RenderTree,
  Shader,
  Texture
} from '../types';
import { RenderingUtils } from '../utils';

/**
 * RenderingBridge - Bridge rendering backend
 */
export class RenderingBridge extends EventEmitter {
  public static id: RenderingBackend = RenderingBackend.BRIDGE;

  private options: RenderingOptions;
  private context: RenderingContext | null = null;
  private initialized: boolean = false;
  private stats: RenderStats;
  private shaders: Map<string, Shader> = new Map();
  private textures: Map<string, Texture> = new Map();
  private buffers: Map<string, Buffer> = new Map();
  private framebuffers: Map<string, Framebuffer> = new Map();

  constructor(options: RenderingOptions) {
    super();
    this.options = options;

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
  }

  /**
   * Initialize the backend
   */
  public initialize(): boolean {
    if (this.initialized) return true;

    try {
      // Create a canvas element if needed
      let canvas: HTMLCanvasElement | undefined;

      if (typeof document !== 'undefined') {
        canvas = document.createElement('canvas');
        canvas.width = this.options.width || 800;
        canvas.height = this.options.height || 600;
      }

      // Create the rendering context
      this.context = {
        width: this.options.width || 800,
        height: this.options.height || 600,
        pixelRatio: this.options.pixelRatio || 1,
        canvas
      };

      this.initialized = true;
      this.emit('initialized');

      return true;
    } catch (error) {
      console.error('Failed to initialize Bridge renderer:', error);
      return false;
    }
  }

  /**
   * Check if the backend is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Create a rendering context
   */
  public createContext(): RenderingContext | null {
    if (!this.initialized) {
      this.initialize();
    }

    return this.context;
  }

  /**
   * Update rendering options
   */
  public updateOptions(options: Partial<RenderingOptions>): void {
    this.options = { ...this.options, ...options };

    if (this.context) {
      this.context.width = this.options.width || 800;
      this.context.height = this.options.height || 600;
      this.context.pixelRatio = this.options.pixelRatio || 1;
    }
  }

  /**
   * Resize the rendering context
   */
  public resize(width: number, height: number): void {
    if (this.context) {
      this.context.width = width;
      this.context.height = height;

      if (this.context.canvas) {
        this.context.canvas.width = width;
        this.context.canvas.height = height;
      }
    }
  }

  /**
   * Render a frame
   */
  public render(tree: RenderTree, context: RenderingContext): void {
    if (!this.initialized) return;

    const startTime = performance.now();

    // Reset stats
    this.stats.drawCalls = 0;
    this.stats.triangles = 0;

    // Optimize commands
    const commands = RenderingUtils.optimizeCommands(tree.commands);

    // Execute commands
    commands.forEach(command => {
      this.executeCommand(command, context);
    });

    // Update stats
    this.stats.frameTime = performance.now() - startTime;
    this.stats.fps = 1000 / this.stats.frameTime;
  }

  /**
   * Execute a render command
   */
  private executeCommand(command: any, context: RenderingContext): void {
    switch (command.type) {
      case 'clear':
        this.clear(context, command.color);
        break;

      case 'drawRect':
        this.drawRect(context, command);
        break;

      case 'drawImage':
        this.drawImage(context, command);
        break;

      case 'drawText':
        this.drawText(context, command);
        break;

      default:
        console.warn(`Unknown command type: ${command.type}`);
    }
  }

  /**
   * Clear the rendering context
   */
  private clear(context: RenderingContext, color: number[] = [0, 0, 0, 1]): void {
    if (!context.canvas) return;

    const ctx = context.canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, context.width, context.height);

    if (color[3] > 0) {
      ctx.fillStyle = `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${color[3]})`;
      ctx.fillRect(0, 0, context.width, context.height);
    }

    this.stats.drawCalls++;
  }

  /**
   * Draw a rectangle
   */
  private drawRect(context: RenderingContext, options: any): void {
    if (!context.canvas) return;

    const ctx = context.canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // Apply transform if provided
    if (options.transform) {
      const matrix = options.transform;
      ctx.transform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
    } else {
      ctx.translate(options.x, options.y);
    }

    // Set fill style
    if (options.color) {
      const color = options.color;
      ctx.fillStyle = `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${color[3] || 1})`;
    }

    // Draw rectangle
    ctx.fillRect(0, 0, options.width, options.height);

    ctx.restore();

    this.stats.drawCalls++;
  }

  /**
   * Draw an image
   */
  private drawImage(context: RenderingContext, options: any): void {
    if (!context.canvas) return;

    const ctx = context.canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // Apply transform if provided
    if (options.transform) {
      const matrix = options.transform;
      ctx.transform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
    } else {
      ctx.translate(options.x, options.y);
    }

    // Draw image
    ctx.drawImage(options.image, 0, 0, options.width, options.height);

    ctx.restore();

    this.stats.drawCalls++;
  }

  /**
   * Draw text
   */
  private drawText(context: RenderingContext, options: any): void {
    if (!context.canvas) return;

    const ctx = context.canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // Apply transform if provided
    if (options.transform) {
      const matrix = options.transform;
      ctx.transform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
    } else {
      ctx.translate(options.x, options.y);
    }

    // Set font
    if (options.font) {
      ctx.font = options.font;
    }

    // Set fill style
    if (options.color) {
      const color = options.color;
      ctx.fillStyle = `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${color[3] || 1})`;
    }

    // Draw text
    ctx.fillText(options.text, 0, 0);

    ctx.restore();

    this.stats.drawCalls++;
  }

  /**
   * Create a shader
   */
  public createShader(type: 'vertex' | 'fragment', source: string): Shader | null {
    const id = RenderingUtils.generateId('shader');

    const shader: Shader = {
      id,
      type,
      source,
      compiled: true
    };

    this.shaders.set(id, shader);

    return shader;
  }

  /**
   * Create a texture
   */
  public createTexture(source: HTMLImageElement | HTMLCanvasElement | ImageData): Texture | null {
    const id = RenderingUtils.generateId('texture');

    let width: number;
    let height: number;

    if (source instanceof HTMLImageElement) {
      width = source.width;
      height = source.height;
    } else if (source instanceof HTMLCanvasElement) {
      width = source.width;
      height = source.height;
    } else {
      width = source.width;
      height = source.height;
    }

    const texture: Texture = {
      id,
      width,
      height,
      format: 0, // RGBA
      type: 0   // UNSIGNED_BYTE
    };

    this.textures.set(id, texture);

    return texture;
  }

  /**
   * Create a buffer
   */
  public createBuffer(data: ArrayBuffer | ArrayBufferView, usage: number): Buffer | null {
    const id = RenderingUtils.generateId('buffer');

    const buffer: Buffer = {
      id,
      size: data.byteLength,
      usage
    };

    this.buffers.set(id, buffer);

    return buffer;
  }

  /**
   * Create a framebuffer
   */
  public createFramebuffer(textures: Texture[]): Framebuffer | null {
    const id = RenderingUtils.generateId('framebuffer');

    let width = 0;
    let height = 0;

    if (textures.length > 0) {
      width = textures[0].width;
      height = textures[0].height;
    }

    const framebuffer: Framebuffer = {
      id,
      width,
      height,
      textures
    };

    this.framebuffers.set(id, framebuffer);

    return framebuffer;
  }

  /**
   * Destroy a shader
   */
  public destroyShader(shader: Shader): void {
    this.shaders.delete(shader.id);
  }

  /**
   * Destroy a texture
   */
  public destroyTexture(texture: Texture): void {
    this.textures.delete(texture.id);
  }

  /**
   * Destroy a buffer
   */
  public destroyBuffer(buffer: Buffer): void {
    this.buffers.delete(buffer.id);
  }

  /**
   * Destroy a framebuffer
   */
  public destroyFramebuffer(framebuffer: Framebuffer): void {
    this.framebuffers.delete(framebuffer.id);
  }

  /**
   * Take a screenshot
   */
  public screenshot(): HTMLCanvasElement | null {
    if (!this.context || !this.context.canvas) return null;

    return this.context.canvas;
  }

  /**
   * Get rendering statistics
   */
  public getStats(): RenderStats {
    return { ...this.stats };
  }
}
