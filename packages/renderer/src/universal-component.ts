// UniversalComponent API for OneDotJS
import {
  NativePlatform,
  ViewConfig,
  TextConfig,
  ImageConfig,
  TextInputConfig,
  ButtonConfig,
  ScrollViewConfig,
  NativeView,
  NativeText,
  NativeImage,
  NativeTextInput,
  NativeButton,
  NativeScrollView
} from './native/platform-abstract';

export class UniversalComponent {
  static createView(config: ViewConfig, platform: NativePlatform): NativeView {
    return platform.createView(config);
  }
  static createText(config: TextConfig, platform: NativePlatform): NativeText {
    return platform.createText(config);
  }
  static createImage(config: ImageConfig, platform: NativePlatform): NativeImage {
    return platform.createImage(config);
  }
  static createTextInput(config: TextInputConfig, platform: NativePlatform): NativeTextInput {
    return platform.createTextInput(config);
  }
  static createButton(config: ButtonConfig, platform: NativePlatform): NativeButton {
    return platform.createButton(config);
  }
  static createScrollView(config: ScrollViewConfig, platform: NativePlatform): NativeScrollView {
    return platform.createScrollView(config);
  }
  static updateView(view: NativeView, props: Record<string, any>, platform: NativePlatform): void {
    platform.updateView(view, props);
  }
  static updateText(view: NativeText, props: Record<string, any>, platform: NativePlatform): void {
    platform.updateText(view, props);
  }
  static updateImage(view: NativeImage, props: Record<string, any>, platform: NativePlatform): void {
    platform.updateImage(view, props);
  }
  static updateTextInput(view: NativeTextInput, props: Record<string, any>, platform: NativePlatform): void {
    platform.updateTextInput(view, props);
  }
  static updateButton(view: NativeButton, props: Record<string, any>, platform: NativePlatform): void {
    platform.updateButton(view, props);
  }
  static updateScrollView(view: NativeScrollView, props: Record<string, any>, platform: NativePlatform): void {
    platform.updateScrollView(view, props);
  }
  static addView(parent: NativeView, child: NativeView, platform: NativePlatform): void {
    platform.addView(parent, child);
  }
  static removeView(parent: NativeView, child: NativeView, platform: NativePlatform): void {
    platform.removeView(parent, child);
  }
  static setLayout(view: NativeView, layout: any, platform: NativePlatform): void {
    platform.setLayout(view, layout);
  }
  static measureView(view: NativeView, platform: NativePlatform): Promise<any> {
    return platform.measureView(view);
  }
}
