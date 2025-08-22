// Native renderer interfaces for ONEDOT-JS
// JSI-compatible bridge with Fabric-style concurrent rendering

export interface NativeRenderer {
  initialize(config: RendererConfig): Promise<void>;
  createSurface(width: number, height: number): NativeSurface;
  render(surface: NativeSurface, vnode: any): Promise<void>;
  cleanup(): void;
}

export interface RendererConfig {
  enableGPU: boolean;
  vsync: boolean;
  msaa: number;
  colorSpace: 'srgb' | 'displayP3' | 'rec2020';
  threadPoolSize?: number;
}

export interface NativeSurface {
  id: string;
  width: number;
  height: number;
  scale: number;
  flush(): Promise<void>;
  resize(width: number, height: number): void;
  screenshot(): Promise<Uint8Array>;
}

export interface JSIBridge {
  invokeNative(module: string, method: string, args: any[]): Promise<any>;
  registerCallback(name: string, callback: (...args: any[]) => any): void;
  installTurboModule(name: string, spec: TurboModuleSpec): void;
}

export interface TurboModuleSpec {
  methods: Record<string, {
    signature: string;
    sync: boolean;
    threadSafe: boolean;
  }>;
}

export interface FabricRenderer {
  createNode(type: string, props: any): NativeNode;
  updateNode(node: NativeNode, props: any): void;
  deleteNode(node: NativeNode): void;
  appendChild(parent: NativeNode, child: NativeNode): void;
  insertBefore(parent: NativeNode, child: NativeNode, before: NativeNode): void;
  removeChild(parent: NativeNode, child: NativeNode): void;
  commitRoot(root: NativeNode): Promise<void>;
}

export interface NativeNode {
  id: number;
  type: string;
  props: any;
  children: NativeNode[];
  parent?: NativeNode;
  shadow?: ShadowNode;
}

export interface ShadowNode {
  layoutMetrics: LayoutMetrics;
  transform: Transform;
  opacity: number;
  hitTest(x: number, y: number): boolean;
}

export interface LayoutMetrics {
  x: number;
  y: number;
  width: number;
  height: number;
  contentInsets: Insets;
  borderWidth: BorderWidths;
}

export interface Insets {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface BorderWidths extends Insets {}

export interface Transform {
  matrix: number[]; // 4x4 matrix
  perspective: number;
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  skewX: number;
  skewY: number;
}

export interface AccessibilityInfo {
  label?: string;
  hint?: string;
  role?: AccessibilityRole;
  state?: AccessibilityState;
  actions?: AccessibilityAction[];
  value?: AccessibilityValue;
}

export type AccessibilityRole = 
  | 'button' | 'link' | 'search' | 'image' | 'keyboardkey'
  | 'text' | 'adjustable' | 'imagebutton' | 'header'
  | 'summary' | 'alert' | 'checkbox' | 'combobox'
  | 'menu' | 'menubar' | 'menuitem' | 'progressbar'
  | 'radio' | 'radiogroup' | 'scrollbar' | 'spinbutton'
  | 'switch' | 'tab' | 'tablist' | 'timer' | 'toolbar'
  | 'none';

export interface AccessibilityState {
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean | 'mixed';
  busy?: boolean;
  expanded?: boolean;
}

export interface AccessibilityAction {
  name: string;
  label?: string;
}

export interface AccessibilityValue {
  min?: number;
  max?: number;
  now?: number;
  text?: string;
}

// Platform-specific implementations
export interface PlatformRenderer {
  web: () => Promise<NativeRenderer>;
  ios: () => Promise<NativeRenderer>;
  android: () => Promise<NativeRenderer>;
  windows: () => Promise<NativeRenderer>;
  macos: () => Promise<NativeRenderer>;
  linux: () => Promise<NativeRenderer>;
}

// Animation system
export interface AnimationDriver {
  startAnimation(config: AnimationConfig): Promise<void>;
  stopAnimation(id: string): void;
  pauseAnimation(id: string): void;
  resumeAnimation(id: string): void;
}

export interface AnimationConfig {
  id: string;
  duration: number;
  easing: EasingFunction;
  properties: AnimatedProperty[];
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

export interface AnimatedProperty {
  property: string;
  from: any;
  to: any;
  interpolation: InterpolationType;
}

export type EasingFunction = 
  | 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  | 'cubic-bezier' | 'spring' | 'bounce';

export type InterpolationType = 
  | 'number' | 'color' | 'transform' | 'string';

// Gesture recognition
export interface GestureRecognizer {
  onTap(callback: (event: TapEvent) => void): void;
  onPan(callback: (event: PanEvent) => void): void;
  onPinch(callback: (event: PinchEvent) => void): void;
  onRotation(callback: (event: RotationEvent) => void): void;
  onLongPress(callback: (event: LongPressEvent) => void): void;
}

export interface TapEvent {
  x: number;
  y: number;
  timestamp: number;
}

export interface PanEvent extends TapEvent {
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
  state: 'began' | 'changed' | 'ended' | 'cancelled';
}

export interface PinchEvent extends TapEvent {
  scale: number;
  velocity: number;
  state: 'began' | 'changed' | 'ended' | 'cancelled';
}

export interface RotationEvent extends TapEvent {
  rotation: number;
  velocity: number;
  state: 'began' | 'changed' | 'ended' | 'cancelled';
}

export interface LongPressEvent extends TapEvent {
  duration: number;
  state: 'began' | 'ended' | 'cancelled';
}

// Performance profiling
export interface NativeProfiler {
  startFrame(): void;
  endFrame(): FrameMetrics;
  markOperation(name: string, start: boolean): void;
  getMetrics(): PerformanceMetrics;
}

export interface FrameMetrics {
  frameId: number;
  duration: number;
  layout: number;
  paint: number;
  composite: number;
  gpu: number;
  dropped: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  gpuMemory: number;
  renderCalls: number;
  textureUploads: number;
}

// Export factory function
export declare function createNativeRenderer(platform: keyof PlatformRenderer): Promise<NativeRenderer>;
export declare function createJSIBridge(): JSIBridge;
export declare function createFabricRenderer(): FabricRenderer;
export declare function createAnimationDriver(): AnimationDriver;
export declare function createGestureRecognizer(surface: NativeSurface): GestureRecognizer;
export declare function createNativeProfiler(): NativeProfiler;
