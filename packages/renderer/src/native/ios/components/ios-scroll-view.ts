import { ScrollViewConfig, NativeView, Layout } from '../../platform-abstract';

export class IOSScrollView {
  public frame: Layout = { x: 0, y: 0, width: 0, height: 0 };
  public horizontal: boolean = false;
  public showsHorizontalScrollIndicator: boolean = true;
  public showsVerticalScrollIndicator: boolean = true;
  constructor(public config: ScrollViewConfig) {
    this.horizontal = config.horizontal || false;
    this.showsHorizontalScrollIndicator = config.showsHorizontalScrollIndicator !== false;
    this.showsVerticalScrollIndicator = config.showsVerticalScrollIndicator !== false;
  }
}

export function createIOSScrollView(config: ScrollViewConfig): NativeView {
  const scrollView = new IOSScrollView(config);
  return {
    id: config.id || Math.random().toString(36).substring(2, 15),
    handle: scrollView,
    type: 'ScrollView'
  };
}
