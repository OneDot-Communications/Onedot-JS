export interface NativePlatform {
  createView(config: ViewConfig): NativeView;
  createText(config: TextConfig): NativeText;
  createImage(config: ImageConfig): NativeImage;
  createTextInput(config: TextInputConfig): NativeTextInput;
  createButton(config: ButtonConfig): NativeButton;
  createScrollView(config: ScrollViewConfig): NativeScrollView;

  updateView(view: NativeView, props: Record<string, any>): void;
  updateText(text: NativeText, props: Record<string, any>): void;
  updateImage(image: NativeImage, props: Record<string, any>): void;
  updateTextInput(input: NativeTextInput, props: Record<string, any>): void;
  updateButton(button: NativeButton, props: Record<string, any>): void;
  updateScrollView(scroll: NativeScrollView, props: Record<string, any>): void;

  setLayout(view: NativeView, layout: Layout): void;
  addView(parent: NativeView, child: NativeView): void;
  removeView(parent: NativeView, child: NativeView): void;

  measureView(view: NativeView): Promise<MeasureResult>;
  requestAnimationFrame(callback: () => void): void;
}

export interface NativeView {
  id: string;
  handle: any;
  type: string;
}

export type NativeText = NativeView;
export type NativeImage = NativeView;
export type NativeTextInput = NativeView;
export type NativeButton = NativeView;
export type NativeScrollView = NativeView;

export interface ViewConfig {
  id?: string;
  style?: StyleProps;
  accessibilityLabel?: string;
  testID?: string;
  onClick?: () => void;
  onLayout?: (layout: Layout) => void;
}

export interface TextConfig extends ViewConfig {
  text?: string;
  font?: { size?: number; weight?: string };
  color?: string;
}

export interface ImageConfig extends ViewConfig {
  source: string | { uri: string };
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
}

export interface TextInputConfig extends ViewConfig {
  value?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: () => void;
}

export interface ButtonConfig extends ViewConfig {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}

export interface ScrollViewConfig extends ViewConfig {
  horizontal?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  onScroll?: (event: any) => void;
}

export interface Layout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MeasureResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StyleProps {
  width?: number | string;
  height?: number | string;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  padding?: number | string;
  margin?: number | string;
  flex?: number;
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
  position?: 'relative' | 'absolute';
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
}
