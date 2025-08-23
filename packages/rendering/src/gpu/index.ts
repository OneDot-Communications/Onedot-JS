/**
 * GPU rendering backend implementation
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
 * GPURenderer - GPU rendering backend
 */
export class GPURenderer extends EventEmitter {
  public static id: RenderingBackend = RenderingBackend.GPU;

  private options: RenderingOptions;
  private context: RenderingContext | null = null;
  private initialized: boolean = false;
  private stats: RenderStats;
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private shaders: Map<string, Shader> = new Map();
  private textures: Map<string, Texture> = new Map();
  private buffers: Map<string, Buffer> = new Map();
  private framebuffers: Map<string, Framebuffer> = new Map();
  private programCache: Map<string, WebGLProgram> = new Map();

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

      if (!canvas) {
        throw new Error('Canvas element not available');
      }

      // Get WebGL context
      const gl = canvas.getContext('webgl2', this.options) ||
                 canvas.getContext('webgl', this.options);

      if (!gl) {
        throw new Error('WebGL not supported');
      }

      this.gl = gl;

      // Set viewport
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

      // Create the rendering context
      this.context = {
        width: this.options.width || 800,
        height: this.options.height || 600,
        pixelRatio: this.options.pixelRatio || 1,
        canvas,
        gl
      };

      this.initialized = true;
      this.emit('initialized');

      return true;
    } catch (error) {
      console.error('Failed to initialize GPU renderer:', error);
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

    if (this.context && this.context.canvas) {
      this.context.canvas.width = this.options.width || 800;
      this.context.canvas.height = this.options.height || 600;

      if (this.gl) {
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
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

    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }

  /**
   * Render a frame
   */
  public render(tree: RenderTree, context: RenderingContext): void {
    if (!this.initialized || !this.gl) return;

    const startTime = performance.now();

    // Reset stats
    this.stats.drawCalls = 0;
    this.stats.triangles = 0;

    // Execute commands
    tree.commands.forEach(command => {
      this.executeCommand(command);
    });

    // Update stats
    this.stats.frameTime = performance.now() - startTime;
    this.stats.fps = 1000 / this.stats.frameTime;
  }

  /**
   * Execute a render command
   */
  private executeCommand(command: any): void {
    if (!this.gl) return;

    switch (command.type) {
      case 'clear':
        this.clear(command.color);
        break;

      case 'drawRect':
        this.drawRect(command);
        break;

      case 'drawImage':
        this.drawImage(command);
        break;

      default:
        console.warn(`Unknown command type: ${command.type}`);
    }
  }

  /**
   * Clear the rendering context
   */
  private clear(color: number[] = [0, 0, 0, 1]): void {
    if (!this.gl) return;

    this.gl.clearColor(color[0], color[1], color[2], color[3]);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.stats.drawCalls++;
  }

  /**
   * Draw a rectangle
   */
  private drawRect(options: any): void {
    if (!this.gl) return;

    // Create or get the shader program
    const program = this.getProgram('rect');
    if (!program) return;

    // Use the program
    this.gl.useProgram(program);

    // Set up the vertices
    const vertices = new Float32Array([
      options.x, options.y,
      options.x + options.width, options.y,
      options.x, options.y + options.height,
      options.x + options.width, options.y + options.height
    ]);

    // Create or get the buffer
    const buffer = this.getBuffer('rect-vertices', vertices);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);

    // Set up the attributes
    const positionLocation = this.gl.getAttribLocation(program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Set the color uniform
    const colorLocation = this.gl.getUniformLocation(program, 'u_color');
    this.gl.uniform4fv(colorLocation, options.color || [0.5, 0.5, 0.5, 1]);

    // Draw the rectangle
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.stats.drawCalls++;
    this.stats.triangles += 2;
  }

  /**
   * Draw an image
   */
  private drawImage(options: any): void {
    if (!this.gl) return;

    // Create or get the shader program
    const program = this.getProgram('image');
    if (!program) return;

    // Use the program
    this.gl.useProgram(program);

    // Set up the vertices
    const vertices = new Float32Array([
      options.x, options.y,
      options.x + options.width, options.y,
      options.x, options.y + options.height,
      options.x + options.width, options.y + options.height
    ]);

    // Create or get the buffer
    const buffer = this.getBuffer('image-vertices', vertices);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);

    // Set up the attributes
    const positionLocation = this.gl.getAttribLocation(program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Set up the texture coordinates
    const texCoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1
    ]);

    const texCoordBuffer = this.getBuffer('image-texCoords', texCoords);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);

    const texCoordLocation = this.gl.getAttribLocation(program, 'a_texCoord');
    this.gl.enableVertexAttribArray(texCoordLocation);
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Create or get the texture
    const texture = this.createTexture(options.image);
    if (!texture) return;

    // Bind the texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.getWebGLTexture(texture));

    // Set the texture uniform
    const textureLocation = this.gl.getUniformLocation(program, 'u_texture');
    this.gl.uniform1i(textureLocation, 0);

    // Draw the image
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.stats.drawCalls++;
    this.stats.triangles += 2;
  }

  /**
   * Get or create a shader program
   */
  private getProgram(name: string): WebGLProgram | null {
    if (!this.gl) return null;

    // Check if program is already cached
    if (this.programCache.has(name)) {
      return this.programCache.get(name) || null;
    }

    // Create vertex and fragment shaders based on the name
    let vertexSource: string;
    let fragmentSource: string;

    switch (name) {
      case 'rect':
        vertexSource = `
          attribute vec2 a_position;
          uniform vec4 u_color;
          varying vec4 v_color;

          void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_color = u_color;
          }
        `;

        fragmentSource = `
          precision mediump float;
          varying vec4 v_color;

          void main() {
            gl_FragColor = v_color;
          }
        `;
        break;

      case 'image':
        vertexSource = `
          attribute vec2 a_position;
          attribute vec2 a_texCoord;
          varying vec2 v_texCoord;

          void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
          }
        `;

        fragmentSource = `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_texture;

          void main() {
            gl_FragColor = texture2D(u_texture, v_texCoord);
          }
        `;
        break;

      default:
        return null;
    }

    // Create the shaders
    const vertexShader = this.createShaderObject(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShaderObject(this.gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    // Create the program
    const program = this.gl.createProgram();
    if (!program) {
      return null;
    }

    // Attach the shaders
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);

    // Link the program
    this.gl.linkProgram(program);

    // Check if linking was successful
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Failed to link program:', this.gl.getProgramInfoLog(program));
      return null;
    }

    // Cache the program
    this.programCache.set(name, program);

    return program;
  }

  /**
   * Create a shader object
   */
  private createShaderObject(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) {
      return null;
    }

    // Set the shader source
    this.gl.shaderSource(shader, source);

    // Compile the shader
    this.gl.compileShader(shader);

    // Check if compilation was successful
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Failed to compile shader:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Get or create a buffer
   */
  private getBuffer(name: string, data: Float32Array): WebGLBuffer | null {
    if (!this.gl) return null;

    const bufferName = `${name}-${data.byteLength}`;

    // Check if buffer is already cached
    if (this.buffers.has(bufferName)) {
      const buffer = this.buffers.get(bufferName);
      if (buffer) {
        return this.getWebGLBuffer(buffer);
      }
    }

    // Create a new buffer
    const buffer = this.createBuffer(data, this.gl.STATIC_DRAW);
    if (!buffer) {
      return null;
    }

    // Cache the buffer
    this.buffers.set(bufferName, buffer);

    return this.getWebGLBuffer(buffer);
  }

  /**
   * Get the WebGL buffer object
   */
  private getWebGLBuffer(buffer: Buffer): WebGLBuffer | null {
    if (!this.gl) return null;

    // This is a simplified implementation
    // In a real implementation, we would store the WebGL buffer in the Buffer object

    const glBuffer = this.gl.createBuffer();
    if (!glBuffer) {
      return null;
    }

    // This is a placeholder - in a real implementation, we would have stored the data
    // For now, we'll just return the buffer
    return glBuffer;
  }

  /**
   * Get the WebGL texture object
   */
  private getWebGLTexture(texture: Texture): WebGLTexture | null {
    if (!this.gl) return null;

    // This is a simplified implementation
    // In a real implementation, we would store the WebGL texture in the Texture object

    const glTexture = this.gl.createTexture();
    if (!glTexture) {
      return null;
    }

    // This is a placeholder - in a real implementation, we would have stored the image data
    // For now, we'll just return the texture
    return glTexture;
  }

  /**
   * Create a shader
   */
  public createShader(type: 'vertex' | 'fragment', source: string): Shader | null {
    if (!this.gl) return null;

    const id = RenderingUtils.generateId('shader');

    const glType = type === 'vertex' ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER;
    const glShader = this.createShaderObject(glType, source);

    if (!glShader) {
      return null;
    }

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
    if (!this.gl) return null;

    const id = RenderingUtils.generateId('texture');

    let width: number;
    let height: number;
    let glTexture: WebGLTexture | null = null;

    // Create the WebGL texture
    glTexture = this.gl.createTexture();
    if (!glTexture) {
      return null;
    }

    // Bind the texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, glTexture);

    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    // Upload the image data
    if (source instanceof HTMLImageElement) {
      width = source.width;
      height = source.height;
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, source);
    } else if (source instanceof HTMLCanvasElement) {
      width = source.width;
      height = source.height;
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, source);
    } else {
      width = source.width;
      height = source.height;
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, source.data);
    }

    const texture: Texture = {
      id,
      width,
      height,
      format: this.gl.RGBA,
      type: this.gl.UNSIGNED_BYTE
    };

    this.textures.set(id, texture);

    return texture;
  }

  /**
   * Create a buffer
   */
  public createBuffer(data: ArrayBuffer | ArrayBufferView, usage: number): Buffer | null {
    if (!this.gl) return null;

    const id = RenderingUtils.generateId('buffer');

    const glBuffer = this.gl.createBuffer();
    if (!glBuffer) {
      return null;
    }

    // Bind the buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, glBuffer);

    // Upload the data
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, usage);

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
    if (!this.gl) return null;

    const id = RenderingUtils.generateId('framebuffer');

    let width = 0;
    let height = 0;

    if (textures.length > 0) {
      width = textures[0].width;
      height = textures[0].height;
    }

    const glFramebuffer = this.gl.createFramebuffer();
    if (!glFramebuffer) {
      return null;
    }

    // Bind the framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, glFramebuffer);

    // Attach textures
    textures.forEach((texture, index) => {
      const glTexture = this.getWebGLTexture(texture);
      if (glTexture) {
        this.gl.framebufferTexture2D(
          this.gl.FRAMEBUFFER,
          this.gl.COLOR_ATTACHMENT0 + index,
          this.gl.TEXTURE_2D,
          glTexture,
          0
        );
      }
    });

    // Check if framebuffer is complete
    if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer is not complete');
      this.gl.deleteFramebuffer(glFramebuffer);
      return null;
    }

    // Unbind the framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

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

    // Remove any programs that use this shader
    // This is a simplified implementation
    // In a real implementation, we would track which programs use which shaders
    this.programCache.clear();
  }

  /**
   * Destroy a texture
   */
  public destroyTexture(texture: Texture): void {
    this.textures.delete(texture.id);

    // This is a simplified implementation
    // In a real implementation, we would delete the WebGL texture
  }

  /**
   * Destroy a buffer
   */
  public destroyBuffer(buffer: Buffer): void {
    this.buffers.delete(buffer.id);

    // This is a simplified implementation
    // In a real implementation, we would delete the WebGL buffer
  }

  /**
   * Destroy a framebuffer
   */
  public destroyFramebuffer(framebuffer: Framebuffer): void {
    this.framebuffers.delete(framebuffer.id);

    // This is a simplified implementation
    // In a real implementation, we would delete the WebGL framebuffer
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
