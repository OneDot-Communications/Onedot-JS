import { NativePlatform } from '../platform-abstract';
import { AndroidPlatform } from './android-platform';

export class AndroidBridge {
  private platform: NativePlatform;
  constructor() {
    this.platform = new AndroidPlatform();
  }
  getPlatform(): NativePlatform {
    return this.platform;
  }
  // Native module bridge methods (camera, geolocation, etc.) will be implemented here
  // Example:
  async getDeviceInfo(): Promise<{ model: string; os: string }> {
    // In a real implementation, this would call Android native APIs
    return { model: 'Android Emulator', os: 'Android' };
  }
}
