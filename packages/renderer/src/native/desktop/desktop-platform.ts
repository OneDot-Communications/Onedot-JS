import { NativePlatform, NativeView, ViewConfig, TextConfig, ImageConfig, TextInputConfig, ButtonConfig, ScrollViewConfig, Layout } from '../platform-abstract';

class DesktopView {
  public children: DesktopView[] = [];
  public layoutParams: { width: number; height: number; left: number; top: number } = { width: 0, height: 0, left: 0, top: 0 };
  public backgroundColor: string = '#fff';
  constructor(public config: ViewConfig) {}
}

class DesktopTextView extends DesktopView {
  public text: string = '';
  public textSize: number = 16;
  public textColor: string = '#000';
  constructor(config: TextConfig) {
    super(config);
    this.text = config.text || '';
    this.textSize = config.font?.size || 16;
    this.textColor = config.color || '#000';
  }
}

export class DesktopPlatform implements NativePlatform {
  private viewRegistry = new Map<string, NativeView>();

  createView(config: ViewConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: new DesktopView(config),
      type: 'View'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createText(config: TextConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: new DesktopTextView(config),
      type: 'Text'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createImage(config: ImageConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: { type: 'desktop.ImageView', config },
      type: 'Image'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createTextInput(config: TextInputConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: { type: 'desktop.TextInput', config },
      type: 'TextInput'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createButton(config: ButtonConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: { type: 'desktop.Button', config },
      type: 'Button'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createScrollView(config: ScrollViewConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: { type: 'desktop.ScrollView', config },
      type: 'ScrollView'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  updateView(view: NativeView, props: Record<string, any>): void {
    const handle = view.handle as DesktopView;
    if (props.style) {
      handle.backgroundColor = props.style.backgroundColor || handle.backgroundColor;
      handle.layoutParams.width = typeof props.style.width === 'number' ? props.style.width : handle.layoutParams.width;
      handle.layoutParams.height = typeof props.style.height === 'number' ? props.style.height : handle.layoutParams.height;
    }
  }

  updateText(text: NativeView, props: Record<string, any>): void {
    const handle = text.handle as DesktopTextView;
    if (props.text) handle.text = props.text;
    if (props.font?.size) handle.textSize = props.font.size;
    if (props.color) handle.textColor = props.color;
  }

  updateImage(image: NativeView, props: Record<string, any>): void {
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
    (view.handle as DesktopView).layoutParams = {
      width: layout.width,
      height: layout.height,
      left: layout.x,
      top: layout.y
    };
  }

  addView(parent: NativeView, child: NativeView): void {
    (parent.handle as DesktopView).children.push(child.handle as DesktopView);
  }

  removeView(parent: NativeView, child: NativeView): void {
    const children = (parent.handle as DesktopView).children;
    const idx = children.indexOf(child.handle as DesktopView);
    if (idx !== -1) children.splice(idx, 1);
  }

  measureView(view: NativeView): Promise<Layout> {
    const lp = (view.handle as DesktopView).layoutParams;
    return Promise.resolve({ x: lp.left, y: lp.top, width: lp.width, height: lp.height });
  }

  requestAnimationFrame(callback: () => void): void {
    setTimeout(callback, 16);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
