import { NativePlatform, NativeView, ViewConfig, TextConfig, ImageConfig, TextInputConfig, ButtonConfig, ScrollViewConfig, Layout } from '../platform-abstract';

class UIView {
  public subviews: UIView[] = [];
  public frame: Layout = { x: 0, y: 0, width: 0, height: 0 };
  public backgroundColor: string = '#fff';
  public layer: any = { borderWidth: 0, borderColor: '#000', cornerRadius: 0 };
  constructor(public config: ViewConfig) {}
}

class UILabel extends UIView {
  public text: string = '';
  public font: any = { size: 16 };
  public textColor: string = '#000';
  constructor(config: TextConfig) {
    super(config);
    this.text = config.text || '';
    this.font = config.font || { size: 16 };
    this.textColor = config.color || '#000';
  }
}

export class IOSPlatform implements NativePlatform {
  private viewRegistry = new Map<string, NativeView>();

  createView(config: ViewConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: new UIView(config),
      type: 'View'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createText(config: TextConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: new UILabel(config),
      type: 'Text'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createImage(config: ImageConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: { type: 'UIImageView', config },
      type: 'Image'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createTextInput(config: TextInputConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: { type: 'UITextField', config },
      type: 'TextInput'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createButton(config: ButtonConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: { type: 'UIButton', config },
      type: 'Button'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createScrollView(config: ScrollViewConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: { type: 'UIScrollView', config },
      type: 'ScrollView'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  updateView(view: NativeView, props: Record<string, any>): void {
    const handle = view.handle as UIView;
    if (props.style) {
      handle.backgroundColor = props.style.backgroundColor || handle.backgroundColor;
      handle.layer.borderWidth = props.style.borderWidth || handle.layer.borderWidth;
      handle.layer.borderColor = props.style.borderColor || handle.layer.borderColor;
      handle.layer.cornerRadius = props.style.borderRadius || handle.layer.cornerRadius;
    }
    // ...other property updates
  }

  updateText(text: NativeView, props: Record<string, any>): void {
    const handle = text.handle as UILabel;
    if (props.text) handle.text = props.text;
    if (props.font) handle.font = props.font;
    if (props.color) handle.textColor = props.color;
  }

  updateImage(image: NativeView, props: Record<string, any>): void {
    // Update UIImageView properties
    Object.assign(image.handle.config, props);
  }

  updateTextInput(input: NativeView, props: Record<string, any>): void {
    Object.assign(input.handle.config, props);
  }

  updateButton(button: NativeView, props: Record<string, any>): void {
    Object.assign(button.handle.config, props);
  }

  updateScrollView(scroll: NativeView, props: Record<string, any>): void {
    Object.assign(scroll.handle.config, props);
  }

  setLayout(view: NativeView, layout: Layout): void {
    (view.handle as UIView).frame = layout;
  }

  addView(parent: NativeView, child: NativeView): void {
    (parent.handle as UIView).subviews.push(child.handle as UIView);
  }

  removeView(parent: NativeView, child: NativeView): void {
    const subviews = (parent.handle as UIView).subviews;
    const idx = subviews.indexOf(child.handle as UIView);
    if (idx !== -1) subviews.splice(idx, 1);
  }

  measureView(view: NativeView): Promise<Layout> {
    return Promise.resolve((view.handle as UIView).frame);
  }

  requestAnimationFrame(callback: () => void): void {
    setTimeout(callback, 16);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
