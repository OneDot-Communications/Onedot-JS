import { ImageConfig, NativeView } from '../platform-abstract';

export class AndroidImageComponent {
  private view: NativeView;
  constructor(config: ImageConfig, platform: any) {
    this.view = platform.createImage(config);
  }
  setProps(props: Record<string, any>, platform: any) {
    platform.updateImage(this.view, props);
  }
  getNativeView() {
    return this.view;
  }
}
