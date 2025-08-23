/**
 * ONEDOT-JS Native Core Implementation
 *
 * This module provides the core functionality for native platform integration,
 * including native widget mapping, JSI bridge, and rendering system integration.
 */

import { Renderer } from '@onedot/rendering';
import { EventEmitter } from 'events';

// Import platform-specific implementations
import { AndroidNative } from './android';
import { IOSNative } from './ios';
import { LinuxNative } from './linux';
import { MacOSNative } from './macos';
import { WindowsNative } from './windows';

// Import utility functions
import * as utils from './utils';

// Import types
import {
  NativeAnimationConfig,
  NativeBridge,
  NativeComponent,
  NativeEvent,
  NativeLayoutMetrics,
  NativeModule,
  NativePlatform,
  NativeWidget
} from './types';

/**
 * NativePlatformManager - Manages native platform integrations
 */
export class NativePlatformManager extends EventEmitter {
  private static instance: NativePlatformManager;
  private currentPlatform: NativePlatform;
  private platformImpl: any;
  private bridge: NativeBridge;
  private renderer: Renderer;
  private widgetRegistry: Map<string, NativeWidget> = new Map();

  private constructor() {
    super();
    this.currentPlatform = this.detectPlatform();
    this.platformImpl = this.getPlatformImplementation();
    this.bridge = this.createBridge();
    this.renderer = this.createRenderer();
    this.initializePlatform();
  }

  /**
   * Get the singleton instance of NativePlatformManager
   */
  public static getInstance(): NativePlatformManager {
    if (!NativePlatformManager.instance) {
      NativePlatformManager.instance = new NativePlatformManager();
    }
    return NativePlatformManager.instance;
  }

  /**
   * Detect the current platform
   */
  private detectPlatform(): NativePlatform {
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
  }

  /**
   * Get the platform-specific implementation
   */
  private getPlatformImplementation() {
    switch (this.currentPlatform) {
      case NativePlatform.WINDOWS:
        return new WindowsNative();
      case NativePlatform.MACOS:
        return new MacOSNative();
      case NativePlatform.LINUX:
        return new LinuxNative();
      case NativePlatform.IOS:
        return new IOSNative();
      case NativePlatform.ANDROID:
        return new AndroidNative();
      case NativePlatform.WEB:
      case NativePlatform.ELECTRON:
      default:
        return null; // Web platform doesn't need a specific native implementation
    }
  }

  /**
   * Create the native bridge
   */
  private createBridge(): NativeBridge {
    if (this.platformImpl && this.platformImpl.createBridge) {
      return this.platformImpl.createBridge();
    }

    // Default bridge implementation
    return {
      callNative: (module: string, method: string, ...args: any[]): any => {
        console.warn(`Native bridge not implemented for platform ${this.currentPlatform}`);
        return null;
      },
      registerModule: (name: string, module: NativeModule): void => {
        console.warn(`Native bridge not implemented for platform ${this.currentPlatform}`);
      },
      unregisterModule: (name: string): void => {
        console.warn(`Native bridge not implemented for platform ${this.currentPlatform}`);
      }
    };
  }

  /**
   * Create the renderer
   */
  private createRenderer(): Renderer {
    if (this.platformImpl && this.platformImpl.createRenderer) {
      return this.platformImpl.createRenderer();
    }

    // Default renderer implementation
    return new Renderer();
  }

  /**
   * Initialize the platform
   */
  private initializePlatform(): void {
    if (this.platformImpl && this.platformImpl.initialize) {
      this.platformImpl.initialize();
    }

    // Register platform-specific widgets
    this.registerPlatformWidgets();

    // Set up event listeners
    this.setupEventListeners();

    this.emit('platform:initialized', this.currentPlatform);
  }

  /**
   * Register platform-specific widgets
   */
  private registerPlatformWidgets(): void {
    if (this.platformImpl && this.platformImpl.getWidgets) {
      const widgets = this.platformImpl.getWidgets();
      widgets.forEach((widget: NativeWidget) => {
        this.widgetRegistry.set(widget.name, widget);
      });
    }
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    if (this.platformImpl && this.platformImpl.on) {
      this.platformImpl.on('nativeEvent', (event: NativeEvent) => {
        this.emit('nativeEvent', event);
      });
    }
  }

  /**
   * Get the current platform
   */
  public getPlatform(): NativePlatform {
    return this.currentPlatform;
  }

  /**
   * Get the native bridge
   */
  public getBridge(): NativeBridge {
    return this.bridge;
  }

  /**
   * Get the renderer
   */
  public getRenderer(): Renderer {
    return this.renderer;
  }

  /**
   * Get a widget by name
   */
  public getWidget(name: string): NativeWidget | undefined {
    return this.widgetRegistry.get(name);
  }

  /**
   * Register a custom widget
   */
  public registerWidget(widget: NativeWidget): void {
    this.widgetRegistry.set(widget.name, widget);
    this.emit('widget:registered', widget);
  }

  /**
   * Unregister a widget
   */
  public unregisterWidget(name: string): boolean {
    const widget = this.widgetRegistry.get(name);
    if (widget) {
      this.widgetRegistry.delete(name);
      this.emit('widget:unregistered', widget);
      return true;
    }
    return false;
  }

  /**
   * Get all registered widgets
   */
  public getAllWidgets(): NativeWidget[] {
    return Array.from(this.widgetRegistry.values());
  }

  /**
   * Create a native component
   */
  public createNativeComponent(type: string, props: any): NativeComponent {
    const widget = this.getWidget(type);
    if (!widget) {
      throw new Error(`Widget type '${type}' not found`);
    }

    return widget.createComponent(props);
  }

  /**
   * Measure layout metrics for a component
   */
  public measureLayout(component: NativeComponent): Promise<NativeLayoutMetrics> {
    if (this.platformImpl && this.platformImpl.measureLayout) {
      return this.platformImpl.measureLayout(component);
    }

    // Default implementation
    return Promise.resolve({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      measured: false
    });
  }

  /**
   * Perform an animation
   */
  public animate(
    component: NativeComponent,
    config: NativeAnimationConfig
  ): Promise<void> {
    if (this.platformImpl && this.platformImpl.animate) {
      return this.platformImpl.animate(component, config);
    }

    // Default implementation
    return new Promise((resolve) => {
      setTimeout(resolve, config.duration || 300);
    });
  }

  /**
   * Call a native module method
   */
  public callNative(module: string, method: string, ...args: any[]): any {
    return this.bridge.callNative(module, method, ...args);
  }

  /**
   * Register a native module
   */
  public registerNativeModule(name: string, module: NativeModule): void {
    this.bridge.registerModule(name, module);
  }

  /**
   * Unregister a native module
   */
  public unregisterNativeModule(name: string): void {
    this.bridge.unregisterModule(name);
  }
}

// Export the NativePlatformManager class
export { NativePlatformManager };

// Export utility functions
  export { utils };

// Export platform-specific classes
  export { AndroidNative } from './android';
  export { IOSNative } from './ios';
  export { LinuxNative } from './linux';
  export { MacOSNative } from './macos';
  export { WindowsNative } from './windows';

// Export types
export type {
  NativeAnimationConfig, NativeBridge, NativeComponent, NativeEvent, NativeLayoutMetrics, NativeModule, NativePlatform,
  NativeWidget
} from './types';

// Export a default instance of the NativePlatformManager
export default NativePlatformManager.getInstance(); 
