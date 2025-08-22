import { NativePlatform, NativeView, ViewConfig, TextConfig, ImageConfig, TextInputConfig, ButtonConfig, ScrollViewConfig, Layout } from '../platform-abstract';

class AndroidView {
  public children: AndroidView[] = [];
  public layoutParams: { width: number | string; height: number | string; left: number; top: number } = { width: 'wrap_content', height: 'wrap_content', left: 0, top: 0 };
  public backgroundColor: string = '#fff';
  constructor(public config: ViewConfig) {}
}

class AndroidTextView extends AndroidView {
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

export class AndroidPlatform implements NativePlatform {
  private viewRegistry = new Map<string, NativeView>();

  createView(config: ViewConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: new AndroidView(config),
      type: 'View'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createText(config: TextConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: new AndroidTextView(config),
      type: 'Text'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createImage(config: ImageConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: { type: 'android.widget.ImageView', config },
      type: 'Image'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createTextInput(config: TextInputConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: { type: 'android.widget.EditText', config },
      type: 'TextInput'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createButton(config: ButtonConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: { type: 'android.widget.Button', config },
      type: 'Button'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  createScrollView(config: ScrollViewConfig): NativeView {
    const id = config.id || this.generateId();
    const view = {
      id,
      handle: { type: 'android.widget.ScrollView', config },
      type: 'ScrollView'
    };
    this.viewRegistry.set(id, view);
    return view;
  }

  updateView(view: NativeView, props: Record<string, any>): void {
    const handle = view.handle as AndroidView;
    if (props.style) {
      handle.backgroundColor = props.style.backgroundColor || handle.backgroundColor;
      handle.layoutParams.width = props.style.width || handle.layoutParams.width;
      handle.layoutParams.height = props.style.height || handle.layoutParams.height;
    }
    // ...other property updates
  }

  updateText(text: NativeView, props: Record<string, any>): void {
    const handle = text.handle as AndroidTextView;
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
    (view.handle as AndroidView).layoutParams = {
      width: layout.width,
      height: layout.height,
      left: layout.x,
      top: layout.y
    };
  }

  addView(parent: NativeView, child: NativeView): void {
    (parent.handle as AndroidView).children.push(child.handle as AndroidView);
  }

  removeView(parent: NativeView, child: NativeView): void {
    const children = (parent.handle as AndroidView).children;
    const idx = children.indexOf(child.handle as AndroidView);
    if (idx !== -1) children.splice(idx, 1);
  }

  measureView(view: NativeView): Promise<Layout> {
  const lp = (view.handle as AndroidView).layoutParams;
  // Ensure width and height are numbers for Layout type
  const width = typeof lp.width === 'number' ? lp.width : 0;
  const height = typeof lp.height === 'number' ? lp.height : 0;
  return Promise.resolve({ x: lp.left, y: lp.top, width, height });
  }

  requestAnimationFrame(callback: () => void): void {
    setTimeout(callback, 16);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
