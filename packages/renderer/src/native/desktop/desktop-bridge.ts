import { NativePlatform } from '../platform-abstract';
import { DesktopPlatform } from './desktop-platform';

export class DesktopBridge {
  private platform: NativePlatform;
  constructor() {
    this.platform = new DesktopPlatform();
  }
  getPlatform(): NativePlatform {
    return this.platform;
  }
  // Native module bridge methods for desktop (file system, notifications, etc.)
  async getDeviceInfo(): Promise<{ model: string; os: string }> {
  return { model: 'Desktop', os: 'DesktopOS' };
  }
}
