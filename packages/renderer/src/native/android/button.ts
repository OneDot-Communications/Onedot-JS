import { ButtonConfig, NativeView } from '../platform-abstract';

export class AndroidButtonComponent {
  private view: NativeView;
  constructor(config: ButtonConfig, platform: any) {
    this.view = platform.createButton(config);
  }
  setProps(props: Record<string, any>, platform: any) {
    platform.updateButton(this.view, props);
  }
  getNativeView() {
    return this.view;
  }
}
