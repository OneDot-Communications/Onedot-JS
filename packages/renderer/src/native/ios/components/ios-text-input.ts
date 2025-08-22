import { TextInputConfig, NativeView, Layout } from '../../platform-abstract';

export class IOSTextInput {
  public frame: Layout = { x: 0, y: 0, width: 0, height: 0 };
  public value: string = '';
  public placeholder: string = '';
  public keyboardType: string = 'default';
  public secureTextEntry: boolean = false;
  constructor(public config: TextInputConfig) {
    this.value = config.value || '';
    this.placeholder = config.placeholder || '';
    this.keyboardType = config.keyboardType || 'default';
    this.secureTextEntry = config.secureTextEntry || false;
  }
}

export function createIOSTextInput(config: TextInputConfig): NativeView {
  const input = new IOSTextInput(config);
  return {
    id: config.id || Math.random().toString(36).substring(2, 15),
    handle: input,
    type: 'TextInput'
  };
}
