/**
 * Type definitions for the rendering package
 */

/**
 * Enumeration of rendering backends
 */
export enum RenderingBackend {
  BRIDGE = 'bridge',
  FABRIC = 'fabric',
  GPU = 'gpu',
  SKIA = 'skia'
}

/**
 * Interface for rendering context
 */
export interface RenderingContext {
  width: number;
  height: number;
  pixelRatio: number;
  canvas?: HTMLCanvasElement;
  gl?: WebGLRenderingContext | WebGL2RenderingContext;
  [key: string]: any;
}

/**
 * Interface for rendering options
 */
export interface RenderingOptions {
  backend?: RenderingBackend;
  width?: number;
  height?: number;
  pixelRatio?: number;
  antialias?: boolean;
  alpha?: boolean;
  depth?: boolean;
  stencil?: boolean;
  premultipliedAlpha?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  [key: string]: any;
}

/**
 * Interface for a render node
 */
export interface RenderNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
  transform?: number[];
  clip?: boolean;
  children: RenderNode[];
  [key: string]: any;
}

/**
 * Interface for a render tree
 */
export interface RenderTree {
  root: RenderNode;
  nodes: RenderNode[];
  commands: RenderCommand[];
}

/**
 * Interface for a render command
 */
export interface RenderCommand {
  type: string;
  [key: string]: any;
}

/**
 * Interface for rendering statistics
 */
export interface RenderStats {
  frameTime: number;
  fps: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  buffers: number;
  shaders: number;
  framebuffers: number;
  memory: number;
}

/**
 * Interface for a shader
 */
export interface Shader {
  id: string;
  type: 'vertex' | 'fragment';
  source: string;
  compiled: boolean;
  [key: string]: any;
}

/**
 * Interface for a texture
 */
export interface Texture {
  id: string;
  width: number;
  height: number;
  format: number;
  type: number;
  [key: string]: any;
}

/**
 * Interface for a buffer
 */
export interface Buffer {
  id: string;
  size: number;
  usage: number;
  [key: string]: any;
}

/**
 * Interface for a framebuffer
 */
export interface Framebuffer {
  id: string;
  width: number;
  height: number;
  textures: Texture[];
  [key: string]: any;
}
