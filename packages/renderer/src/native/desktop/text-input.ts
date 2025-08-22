import { TextInputConfig, NativeView } from '../platform-abstract';

export class DesktopTextInputComponent {
  private view: NativeView;
  constructor(config: TextInputConfig, platform: any) {
    this.view = platform.createTextInput(config);
  }
  setProps(props: Record<string, any>, platform: any) {
    platform.updateTextInput(this.view, props);
  }
  getNativeView() {
    return this.view;
  }
}
