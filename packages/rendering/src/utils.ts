/**
 * Utility functions for the rendering package
 */

import { RenderCommand, RenderNode } from './types';

/**
 * Rendering utility functions
 */
export const RenderingUtils = {
  /**
   * Generate a unique ID
   */
  generateId(prefix: string = 'id'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Clamp a value between min and max
   */
  clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * Linear interpolation
   */
  lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  },

  /**
   * Convert degrees to radians
   */
  degToRad(deg: number): number {
    return deg * Math.PI / 180;
  },

  /**
   * Convert radians to degrees
   */
  radToDeg(rad: number): number {
    return rad * 180 / Math.PI;
  },

  /**
   * Create a transformation matrix
   */
  createTransform(
    x: number = 0,
    y: number = 0,
    scaleX: number = 1,
    scaleY: number = 1,
    rotation: number = 0,
    skewX: number = 0,
    skewY: number = 0
  ): number[] {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    return [
      scaleX * cos,
      scaleX * sin,
      scaleY * (skewX * cos - sin),
      scaleY * (skewX * sin + cos),
      x,
      y
    ];
  },

  /**
   * Multiply two transformation matrices
   */
  multiplyTransform(a: number[], b: number[]): number[] {
    return [
      a[0] * b[0] + a[2] * b[1],
      a[1] * b[0] + a[3] * b[1],
      a[0] * b[2] + a[2] * b[3],
      a[1] * b[2] + a[3] * b[3],
      a[0] * b[4] + a[2] * b[5] + a[4],
      a[1] * b[4] + a[3] * b[5] + a[5]
    ];
  },

  /**
   * Invert a transformation matrix
   */
  invertTransform(matrix: number[]): number[] {
    const a = matrix[0];
    const b = matrix[1];
    const c = matrix[2];
    const d = matrix[3];
    const e = matrix[4];
    const f = matrix[5];

    const determinant = a * d - b * c;

    if (determinant === 0) {
      return [1, 0, 0, 1, 0, 0]; // Identity matrix
    }

    return [
      d / determinant,
      -b / determinant,
      -c / determinant,
      a / determinant,
      (c * f - d * e) / determinant,
      (b * e - a * f) / determinant
    ];
  },

  /**
   * Apply a transformation matrix to a point
   */
  transformPoint(matrix: number[], x: number, y: number): { x: number; y: number } {
    return {
      x: matrix[0] * x + matrix[2] * y + matrix[4],
      y: matrix[1] * x + matrix[3] * y + matrix[5]
    };
  },

  /**
   * Create a color from RGBA values
   */
  createColor(r: number, g: number, b: number, a: number = 1): number[] {
    return [
      this.clamp(r, 0, 1),
      this.clamp(g, 0, 1),
      this.clamp(b, 0, 1),
      this.clamp(a, 0, 1)
    ];
  },

  /**
   * Convert a hex color to RGBA
   */
  hexToRgba(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    if (!result) {
      return [0, 0, 0, 1];
    }

    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
      1
    ];
  },

  /**
   * Convert RGBA to a hex color
   */
  rgbaToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255)).toString(16).slice(1);
  },

  /**
   * Optimize render commands
   */
  optimizeCommands(commands: RenderCommand[]): RenderCommand[] {
    const optimized: RenderCommand[] = [];

    // This is a simplified implementation
    // In a real implementation, we would perform more sophisticated optimizations

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      // Skip redundant clear commands
      if (command.type === 'clear' && i > 0 && commands[i - 1].type === 'clear') {
        continue;
      }

      // Merge consecutive draw commands with the same properties
      if (command.type === 'drawRect' && i > 0 && commands[i - 1].type === 'drawRect') {
        const prev = commands[i - 1];

        if (
          command.color === prev.color &&
          command.opacity === prev.opacity &&
          command.transform === prev.transform
        ) {
          // Merge the commands
          optimized[optimized.length - 1] = {
            ...prev,
            width: Math.max(prev.width, command.width),
            height: Math.max(prev.height, command.height)
          };

          continue;
        }
      }

      optimized.push(command);
    }

    return optimized;
  },

  /**
   * Flatten a render tree into a list of nodes
   */
  flattenTree(root: RenderNode): RenderNode[] {
    const nodes: RenderNode[] = [];

    const traverse = (node: RenderNode) => {
      nodes.push(node);

      node.children.forEach(child => {
        traverse(child);
      });
    };

    traverse(root);

    return nodes;
  },

  /**
   * Calculate the bounding box of a render node
   */
  calculateBoundingBox(node: RenderNode): { x: number; y: number; width: number; height: number } {
    let minX = node.x;
    let minY = node.y;
    let maxX = node.x + node.width;
    let maxY = node.y + node.height;

    const traverse = (n: RenderNode) => {
      const transform = n.transform || [1, 0, 0, 1, n.x, n.y];

      // Calculate the four corners of the node
      const corners = [
        this.transformPoint(transform, 0, 0),
        this.transformPoint(transform, n.width, 0),
        this.transformPoint(transform, 0, n.height),
        this.transformPoint(transform, n.width, n.height)
      ];

      // Update the bounding box
      corners.forEach(corner => {
        minX = Math.min(minX, corner.x);
        minY = Math.min(minY, corner.y);
        maxX = Math.max(maxX, corner.x);
        maxY = Math.max(maxY, corner.y);
      });

      // Traverse children
      n.children.forEach(child => {
        traverse(child);
      });
    };

    traverse(node);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
};

// Export all utility modules
export { RenderingUtils };
