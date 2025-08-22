import { ButtonConfig, NativeView, Layout } from '../../platform-abstract';

export class IOSButton {
  public frame: Layout = { x: 0, y: 0, width: 0, height: 0 };
  public title: string = '';
  public onPress?: () => void;
  public disabled: boolean = false;
  constructor(public config: ButtonConfig) {
    this.title = config.title;
    this.onPress = config.onPress;
    this.disabled = config.disabled || false;
  }
}

export function createIOSButton(config: ButtonConfig): NativeView {
  const button = new IOSButton(config);
  return {
    id: config.id || Math.random().toString(36).substring(2, 15),
    handle: button,
    type: 'Button'
  };
}
