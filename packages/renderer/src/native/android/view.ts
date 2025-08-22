import { ViewConfig, NativeView } from '../platform-abstract';

export class AndroidViewComponent {
  private view: NativeView;
  constructor(config: ViewConfig, platform: any) {
    this.view = platform.createView(config);
  }
  setProps(props: Record<string, any>, platform: any) {
    platform.updateView(this.view, props);
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
