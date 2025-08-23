/**
 * Type definitions for the native package
 */

/**
 * Enumeration of supported native platforms
 */
export enum NativePlatform {
  WINDOWS = 'windows',
  MACOS = 'macos',
  LINUX = 'linux',
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
  ELECTRON = 'electron'
}

/**
 * Interface for a native widget
 */
export interface NativeWidget {
  name: string;
  displayName: string;
  platform: NativePlatform[];
  properties: Record<string, any>;
  events: string[];
  createComponent: (props: any) => NativeComponent;
}

/**
 * Interface for a native component instance
 */
export interface NativeComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  children: NativeComponent[];
  nativeHandle: any;
  parent?: NativeComponent;
  setProps: (props: Record<string, any>) => void;
  addChild: (child: NativeComponent) => void;
  removeChild: (child: NativeComponent) => void;
  measure: () => Promise<NativeLayoutMetrics>;
  animate: (config: NativeAnimationConfig) => Promise<void>;
  destroy: () => void;
}

/**
 * Interface for a native event
 */
export interface NativeEvent {
  type: string;
  target: string;
  timestamp: number;
  data: any;
}

/**
 * Interface for the native bridge
 */
export interface NativeBridge {
  callNative: (module: string, method: string, ...args: any[]) => any;
  registerModule: (name: string, module: NativeModule) => void;
  unregisterModule: (name: string) => void;
}

/**
 * Interface for a native module
 */
export interface NativeModule {
  name: string;
  methods: Record<string, (...args: any[]) => any>;
  constants?: Record<string, any>;
}

/**
 * Interface for layout metrics
 */
export interface NativeLayoutMetrics {
  x: number;
  y: number;
  width: number;
  height: number;
  measured: boolean;
}

/**
 * Interface for animation configuration
 */
export interface NativeAnimationConfig {
  type: 'spring' | 'timing' | 'decay';
  duration?: number;
  toValue: number | Record<string, number>;
  fromValue?: number | Record<string, number>;
  velocity?: number | Record<string, number>;
  bounciness?: number;
  speed?: number;
  tension?: number;
  friction?: number;
  useNativeDriver?: boolean;
  delay?: number;
  easing?: (value: number) => number;
  isInteraction?: boolean;
  iterations?: number;
}
