import { ScrollViewConfig, NativeView } from '../platform-abstract';

export class AndroidScrollViewComponent {
  private view: NativeView;
  constructor(config: ScrollViewConfig, platform: any) {
    this.view = platform.createScrollView(config);
  }
  setProps(props: Record<string, any>, platform: any) {
    platform.updateScrollView(this.view, props);
  }
  appendChild(child: NativeView, platform: any) {
    platform.addView(this.view, child);
  }
  removeChild(child: NativeView, platform: any) {
    platform.removeView(this.view, child);
  }
  getNativeView() {
    return this.view;
  }
}
