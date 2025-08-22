import { TextConfig, NativeView, Layout } from '../../platform-abstract';

export class IOSText {
  public frame: Layout = { x: 0, y: 0, width: 0, height: 0 };
  public text: string = '';
  public font: any = { size: 16 };
  public textColor: string = '#000';
  constructor(public config: TextConfig) {
    this.text = config.text || '';
    this.font = config.font || { size: 16 };
    this.textColor = config.color || '#000';
  }
}

export function createIOSText(config: TextConfig): NativeView {
  const label = new IOSText(config);
  return {
    id: config.id || Math.random().toString(36).substring(2, 15),
    handle: label,
    type: 'Text'
  };
}
