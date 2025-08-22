import { ViewConfig, NativeView, Layout } from '../../platform-abstract';

export class IOSView {
  public subviews: IOSView[] = [];
  public frame: Layout = { x: 0, y: 0, width: 0, height: 0 };
  public backgroundColor: string = '#fff';
  public layer: any = { borderWidth: 0, borderColor: '#000', cornerRadius: 0 };
  constructor(public config: ViewConfig) {}
}

export function createIOSView(config: ViewConfig): NativeView {
  const view = new IOSView(config);
  return {
    id: config.id || Math.random().toString(36).substring(2, 15),
    handle: view,
    type: 'View'
  };
}
