import { NativeRenderer } from '../native-renderer';
import { AndroidBridge } from './android-bridge';

const androidBridge = new AndroidBridge();

export class AndroidNativeRenderer extends NativeRenderer {
  constructor() {
    super(androidBridge.getPlatform());
  }
}

export const AndroidRenderer = new AndroidNativeRenderer();
