/**
 * Fabric rendering backend implementation
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
 * FabricRenderer - Fabric rendering backend
 */
export class FabricRenderer extends EventEmitter {
  public static id: RenderingBackend = RenderingBackend.FABRIC;

  private options: RenderingOptions;
  private context: RenderingContext | null = null;
  private initialized: boolean = false;
  private stats: RenderStats;
  private fabricCanvas: any = null;
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
      // Dynamically import Fabric.js
      const fabric = await import('fabric').then(mod => mod.fabric || mod);

      // Create a canvas element if needed
      let canvas: HTMLCanvasElement | undefined;

      if (typeof document !== 'undefined') {
        canvas = document.createElement('canvas');
        canvas.width = this.options.width || 800;
        canvas.height = this.options.height || 600;
      }

      // Create the Fabric canvas
      if (canvas) {
        this.fabricCanvas = new fabric.Canvas(canvas, {
          width: this.options.width || 800,
          height: this.options.height || 600,
          backgroundColor: this.options.backgroundColor || 'transparent',
          renderOnAddRemove: false
        });
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
      console.error('Failed to initialize Fabric renderer:', error);
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

    if (this.fabricCanvas) {
      this.fabricCanvas.setWidth(this.options.width || 800);
      this.fabricCanvas.setHeight(this.options.height || 600);

      if (this.options.backgroundColor) {
        this.fabricCanvas.setBackgroundColor(this.options.backgroundColor, this.fabricCanvas.renderAll.bind(this.fabricCanvas));
      }
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

    if (this.fabricCanvas) {
      this.fabricCanvas.setWidth(width);
      this.fabricCanvas.setHeight(height);
    }
  }

  /**
   * Render a frame
   */
  public render(tree: RenderTree, context: RenderingContext): void {
    if (!this.initialized || !this.fabricCanvas) return;

    const startTime = performance.now();

    // Reset stats
    this.stats.drawCalls = 0;
    this.stats.triangles = 0;

    // Clear the canvas
    this.fabricCanvas.clear();

    // Process render commands
    tree.commands.forEach(command => {
      this.executeCommand(command);
    });

    // Render the canvas
    this.fabricCanvas.renderAll();

    // Update stats
    this.stats.frameTime = performance.now() - startTime;
    this.stats.fps = 1000 / this.stats.frameTime;
  }

  /**
   * Execute a render command
   */
  private executeCommand(command: any): void {
    switch (command.type) {
      case 'clear':
        // Already handled by fabricCanvas.clear()
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
    if (!this.fabricCanvas) return;

    const rect = new (this.fabricCanvas as any).Rect({
      left: options.x,
      top: options.y,
      width: options.width,
      height: options.height,
      fill: options.color ? this.colorToString(options.color) : 'transparent',
      stroke: options.borderColor ? this.colorToString(options.borderColor) : undefined,
      strokeWidth: options.borderWidth || 0,
      opacity: options.opacity !== undefined ? options.opacity : 1,
      angle: options.rotation || 0,
      scaleX: options.scaleX || 1,
      scaleY: options.scaleY || 1
    });

    this.fabricCanvas.add(rect);
    this.stats.drawCalls++;
  }

  /**
   * Draw a circle
   */
  private drawCircle(options: any): void {
    if (!this.fabricCanvas) return;

    const circle = new (this.fabricCanvas as any).Circle({
      left: options.x,
      top: options.y,
      radius: options.radius,
      fill: options.color ? this.colorToString(options.color) : 'transparent',
      stroke: options.borderColor ? this.colorToString(options.borderColor) : undefined,
      strokeWidth: options.borderWidth || 0,
      opacity: options.opacity !== undefined ? options.opacity : 1,
      angle: options.rotation || 0,
      scaleX: options.scaleX || 1,
      scaleY: options.scaleY || 1
    });

    this.fabricCanvas.add(circle);
    this.stats.drawCalls++;
  }

  /**
   * Draw an image
   */
  private drawImage(options: any): void {
    if (!this.fabricCanvas) return;

    (this.fabricCanvas as any).Image.fromURL(options.src, (img: any) => {
      img.set({
        left: options.x,
        top: options.y,
        width: options.width,
        height: options.height,
        opacity: options.opacity !== undefined ? options.opacity : 1,
        angle: options.rotation || 0,
        scaleX: options.scaleX || 1,
        scaleY: options.scaleY || 1
      });

      this.fabricCanvas.add(img);
      this.stats.drawCalls++;
    });
  }

  /**
   * Draw text
   */
  private drawText(options: any): void {
    if (!this.fabricCanvas) return;

    const text = new (this.fabricCanvas as any).Text(options.text, {
      left: options.x,
      top: options.y,
      fontSize: options.fontSize || 16,
      fontFamily: options.fontFamily || 'Arial',
      fill: options.color ? this.colorToString(options.color) : '#000000',
      opacity: options.opacity !== undefined ? options.opacity : 1,
      angle: options.rotation || 0,
      scaleX: options.scaleX || 1,
      scaleY: options.scaleY || 1
    });

    this.fabricCanvas.add(text);
    this.stats.drawCalls++;
  }

  /**
   * Convert a color array to a CSS color string
   */
  private colorToString(color: number[]): string {
    if (color.length >= 3) {
      const r = Math.floor(color[0] * 255);
      const g = Math.floor(color[1] * 255);
      const b = Math.floor(color[2] * 255);
      const a = color.length > 3 ? color[3] : 1;

      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    return '#000000';
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
