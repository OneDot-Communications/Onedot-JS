/**
 * Skia rendering backend implementation
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
 * SkiaRenderer - Skia rendering backend
 */
export class SkiaRenderer extends EventEmitter {
  public static id: RenderingBackend = RenderingBackend.SKIA;

  private options: RenderingOptions;
  private context: RenderingContext | null = null;
  private initialized: boolean = false;
  private stats: RenderStats;
  private skiaCanvas: any = null;
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
  public async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Dynamically import Skia
      const skia = await import('canvaskit-wasm').then(mod => mod.CanvasKit || mod);

      // Create a canvas element if needed
      let canvas: HTMLCanvasElement | undefined;

      if (typeof document !== 'undefined') {
        canvas = document.createElement('canvas');
        canvas.width = this.options.width || 800;
        canvas.height = this.options.height || 600;
      }

      // Create the Skia canvas
      if (canvas) {
        this.skiaCanvas = skia.MakeCanvas(canvas.width, canvas.height);
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
      console.error('Failed to initialize Skia renderer:', error);
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

    if (this.skiaCanvas) {
      // Recreate the canvas with new dimensions
      this.skiaCanvas = this.skiaCanvas.MakeCanvas(
        this.options.width || 800,
        this.options.height || 600
      );
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

    if (this.skiaCanvas) {
      // Recreate the canvas with new dimensions
      this.skiaCanvas = this.skiaCanvas.MakeCanvas(width, height);
    }
  }

  /**
   * Render a frame
   */
  public render(tree: RenderTree, context: RenderingContext): void {
    if (!this.initialized || !this.skiaCanvas) return;

    const startTime = performance.now();

    // Reset stats
    this.stats.drawCalls = 0;
    this.stats.triangles = 0;

    // Clear the canvas
    this.skiaCanvas.clear([0, 0, 0, 1]); // RGBA

    // Process render commands
    tree.commands.forEach(command => {
      this.executeCommand(command);
    });

    // Flush the canvas
    this.skiaCanvas.flush();

    // Update stats
    this.stats.frameTime = performance.now() - startTime;
    this.stats.fps = 1000 / this.stats.frameTime;
  }

  /**
   * Execute a render command
   */
  private executeCommand(command: any): void {
    if (!this.skiaCanvas) return;

    switch (command.type) {
      case 'clear':
        this.skiaCanvas.clear(command.color || [0, 0, 0, 1]);
        break;

      case 'drawRect':
        this.drawRect(command);
        break;

      case 'drawCircle':
        this.drawCircle(command);
        break;

      case 'drawImage':
        this.drawImage(command);
        break;

      case 'drawText':
        this.drawText(command);
        break;

      default:
        console.warn(`Unknown command type: ${command.type}`);
    }
  }

  /**
   * Draw a rectangle
   */
  private drawRect(options: any): void {
    if (!this.skiaCanvas) return;

    const paint = new this.skiaCanvas.Paint();

    // Set fill color
    if (options.color) {
      paint.setColor(this.skiaCanvas.Color4f(
        options.color[0],
        options.color[1],
        options.color[2],
        options.color[3] || 1
      ));
    }

    // Set stroke
    if (options.borderColor) {
      paint.setStyle(this.skiaCanvas.PaintStyle.Stroke);
      paint.setStrokeWidth(options.borderWidth || 1);
      paint.setColor(this.skiaCanvas.Color4f(
        options.borderColor[0],
        options.borderColor[1],
        options.borderColor[2],
        options.borderColor[3] || 1
      ));
    } else {
      paint.setStyle(this.skiaCanvas.PaintStyle.Fill);
    }

    // Draw the rectangle
    this.skiaCanvas.drawRect(
      options.x,
      options.y,
      options.x + options.width,
      options.y + options.height,
      paint
    );

    this.stats.drawCalls++;
  }

  /**
   * Draw a circle
   */
  private drawCircle(options: any): void {
    if (!this.skiaCanvas) return;

    const paint = new this.skiaCanvas.Paint();

    // Set fill color
    if (options.color) {
      paint.setColor(this.skiaCanvas.Color4f(
        options.color[0],
        options.color[1],
        options.color[2],
        options.color[3] || 1
      ));
    }

    // Set stroke
    if (options.borderColor) {
      paint.setStyle(this.skiaCanvas.PaintStyle.Stroke);
      paint.setStrokeWidth(options.borderWidth || 1);
      paint.setColor(this.skiaCanvas.Color4f(
        options.borderColor[0],
        options.borderColor[1],
        options.borderColor[2],
        options.borderColor[3] || 1
      ));
    } else {
      paint.setStyle(this.skiaCanvas.PaintStyle.Fill);
    }

    // Draw the circle
    this.skiaCanvas.drawCircle(
      options.x,
      options.y,
      options.radius,
      paint
    );

    this.stats.drawCalls++;
  }

  /**
   * Draw an image
   */
  private drawImage(options: any): void {
    if (!this.skiaCanvas) return;

    // Create an image from the source
    const image = this.skiaCanvas.MakeImageFromEncoded(options.src);
    if (!image) return;

    // Draw the image
    this.skiaCanvas.drawImage(
      image,
      options.x,
      options.y,
      this.skiaCanvas.Paint()
    );

    this.stats.drawCalls++;
  }

  /**
   * Draw text
   */
  private drawText(options: any): void {
    if (!this.skiaCanvas) return;

    // Create a font
    const font = new this.skiaCanvas.Font(
      null, // Use default font family
      options.fontSize || 16
    );

    // Create a paint
    const paint = new this.skiaCanvas.Paint();

    // Set color
    if (options.color) {
      paint.setColor(this.skiaCanvas.Color4f(
        options.color[0],
        options.color[1],
        options.color[2],
        options.color[3] || 1
      ));
    }

    // Draw the text
    this.skiaCanvas.drawText(
      options.text,
      options.x,
      options.y,
      font,
      paint
    );

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
