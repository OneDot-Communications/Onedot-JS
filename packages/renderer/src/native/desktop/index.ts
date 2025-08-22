import { NativeRenderer } from '../native-renderer';
import { DesktopBridge } from './desktop-bridge';

const desktopBridge = new DesktopBridge();

export class DesktopNativeRenderer extends NativeRenderer {
  constructor() {
    super(desktopBridge.getPlatform());
  }
}

export const DesktopRenderer = new DesktopNativeRenderer();
