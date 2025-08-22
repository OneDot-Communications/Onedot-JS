import { TextConfig, NativeView } from '../platform-abstract';

export class DesktopTextComponent {
  private view: NativeView;
  constructor(config: TextConfig, platform: any) {
    this.view = platform.createText(config);
  }
  setProps(props: Record<string, any>, platform: any) {
    platform.updateText(this.view, props);
  }
  getNativeView() {
    return this.view;
  }
}
