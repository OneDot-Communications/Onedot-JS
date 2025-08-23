/**
 * Utility functions for the native package
 */

import { NativeEvent, NativePlatform } from './types';

/**
 * Platform detection utilities
 */
export const PlatformUtils = {
  /**
   * Get the current platform
   */
  getPlatform(): NativePlatform {
    if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
      return NativePlatform.ELECTRON;
    }

    if (typeof window !== 'undefined') {
      return NativePlatform.WEB;
    }

    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      const platform = process.platform;
      if (platform === 'win32') return NativePlatform.WINDOWS;
      if (platform === 'darwin') return NativePlatform.MACOS;
      if (platform === 'linux') return NativePlatform.LINUX;
    }

    // Default to web if platform cannot be determined
    return NativePlatform.WEB;
  },

  /**
   * Check if the current platform is mobile
   */
  isMobile(): boolean {
    const platform = this.getPlatform();
    return platform === NativePlatform.IOS || platform === NativePlatform.ANDROID;
  },

  /**
   * Check if the current platform is desktop
   */
  isDesktop(): boolean {
    const platform = this.getPlatform();
    return platform === NativePlatform.WINDOWS ||
           platform === NativePlatform.MACOS ||
           platform === NativePlatform.LINUX ||
           platform === NativePlatform.ELECTRON;
  },

  /**
   * Check if the current platform is web
   */
  isWeb(): boolean {
    return this.getPlatform() === NativePlatform.WEB;
  }
};

/**
 * Event utilities
 */
export const EventUtils = {
  /**
   * Create a native event
   */
  createEvent(type: string, target: string, data: any): NativeEvent {
    return {
      type,
      target,
      timestamp: Date.now(),
      data
    };
  },

  /**
   * Normalize a native event
   */
  normalizeEvent(event: any): NativeEvent {
    if (typeof event === 'object' && event.type && event.target) {
      return event as NativeEvent;
    }

    // Convert a DOM event to a native event
    if (event instanceof Event) {
      return {
        type: event.type,
        target: (event.target as any).id || (event.target as any).className || 'unknown',
        timestamp: event.timeStamp || Date.now(),
        data: {
          bubbles: event.bubbles,
          cancelable: event.cancelable,
          defaultPrevented: event.defaultPrevented
        }
      };
    }

    // Create a generic event
    return {
      type: 'unknown',
      target: 'unknown',
      timestamp: Date.now(),
      data: event
    };
  }
};

/**
 * Component utilities
 */
export const ComponentUtils = {
  /**
   * Generate a unique component ID
   */
  generateId(prefix: string = 'component'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Flatten a component tree
   */
  flattenTree(root: any, result: any[] = []): any[] {
    if (!root) return result;

    result.push(root);

    if (root.children && Array.isArray(root.children)) {
      root.children.forEach((child: any) => {
        this.flattenTree(child, result);
      });
    }

    return result;
  },

  /**
   * Find a component by ID in a tree
   */
  findById(root: any, id: string): any | null {
    if (!root) return null;

    if (root.id === id) {
      return root;
    }

    if (root.children && Array.isArray(root.children)) {
      for (const child of root.children) {
        const found = this.findById(child, id);
        if (found) return found;
      }
    }

    return null;
  },

  /**
   * Find components by type in a tree
   */
  findByType(root: any, type: string, result: any[] = []): any[] {
    if (!root) return result;

    if (root.type === type) {
      result.push(root);
    }

    if (root.children && Array.isArray(root.children)) {
      root.children.forEach((child: any) => {
        this.findByType(child, type, result);
      });
    }

    return result;
  }
};

/**
 * Animation utilities
 */
export const AnimationUtils = {
  /**
   * Linear easing function
   */
  linear: (t: number): number => t,

  /**
   * Ease in quad easing function
   */
  easeInQuad: (t: number): number => t * t,

  /**
   * Ease out quad easing function
   */
  easeOutQuad: (t: number): number => t * (2 - t),

  /**
   * Ease in-out quad easing function
   */
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  /**
   * Ease in cubic easing function
   */
  easeInCubic: (t: number): number => t * t * t,

  /**
   * Ease out cubic easing function
   */
  easeOutCubic: (t: number): number => (--t) * t * t + 1,

  /**
   * Ease in-out cubic easing function
   */
  easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  /**
   * Spring physics animation
   */
  spring: (
    time: number,
    initialValue: number,
    destinationValue: number,
    velocity: number,
    damping: number,
    stiffness: number
  ): number => {
    const dampingRatio = damping / (2 * Math.sqrt(stiffness));
    const undampedAngularFreq = Math.sqrt(stiffness);

    if (dampingRatio < 1) {
      // Under-damped
      const dampedAngularFreq = undampedAngularFreq * Math.sqrt(1 - dampingRatio * dampingRatio);
      const a = initialValue - destinationValue;
      const b = (velocity + dampingRatio * undampedAngularFreq * a) / dampedAngularFreq;

      return destinationValue + Math.exp(-dampingRatio * undampedAngularFreq * time) *
             (a * Math.cos(dampedAngularFreq * time) + b * Math.sin(dampedAngularFreq * time));
    } else if (dampingRatio === 1) {
      // Critically-damped
      const a = initialValue - destinationValue;
      const b = velocity + undampedAngularFreq * a;

      return destinationValue + Math.exp(-undampedAngularFreq * time) * (a + b * time);
    } else {
      // Over-damped
      const s1 = -undampedAngularFreq * (dampingRatio - Math.sqrt(dampingRatio * dampingRatio - 1));
      const s2 = -undampedAngularFreq * (dampingRatio + Math.sqrt(dampingRatio * dampingRatio - 1));

      const a = (velocity - s2 * (initialValue - destinationValue)) / (s1 - s2);
      const b = (s1 * (initialValue - destinationValue) - velocity) / (s1 - s2);

      return destinationValue + a * Math.exp(s1 * time) + b * Math.exp(s2 * time);
    }
  }
};

/**
 * Layout utilities
 */
export const LayoutUtils = {
  /**
   * Calculate the intersection of two rectangles
   */
  intersectRect(rect1: { x: number; y: number; width: number; height: number },
               rect2: { x: number; y: number; width: number; height: number }): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  },

  /**
   * Calculate the bounding rectangle of a component
   */
  getBoundingRect(component: any): { x: number; y: number; width: number; height: number } {
    if (!component) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    if (component.getBoundingClientRect) {
      return component.getBoundingClientRect();
    }

    // Default implementation
    return {
      x: component.x || 0,
      y: component.y || 0,
      width: component.width || 0,
      height: component.height || 0
    };
  },

  /**
   * Calculate the distance between two points
   */
  distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  },

  /**
   * Calculate the angle between two points
   */
  angle(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  }
};

// Export all utility modules
export {
  AnimationUtils, ComponentUtils, EventUtils, LayoutUtils, PlatformUtils
};
