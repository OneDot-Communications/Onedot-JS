import { ImageConfig, NativeView, Layout } from '../../platform-abstract';

export class IOSImage {
  public frame: Layout = { x: 0, y: 0, width: 0, height: 0 };
  public source: string | { uri: string };
  public resizeMode: string = 'cover';
  constructor(public config: ImageConfig) {
    this.source = config.source;
    this.resizeMode = config.resizeMode || 'cover';
  }
}

export function createIOSImage(config: ImageConfig): NativeView {
  const image = new IOSImage(config);
  return {
    id: config.id || Math.random().toString(36).substring(2, 15),
    handle: image,
    type: 'Image'
  };
}
