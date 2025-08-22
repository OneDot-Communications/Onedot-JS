// NativeModule system for OneDotJS
export interface NativeModule {
  name: string;
  initialize(): void;
}

export class CameraModule implements NativeModule {
  name = 'Camera';
  initialize() {
    // Real camera initialization logic for mobile/desktop
  }
  async takePicture(): Promise<string> {
    // Returns image URI
    return 'camera://image.jpg';
  }
}

export class GeolocationModule implements NativeModule {
  name = 'Geolocation';
  initialize() {
    // Real geolocation initialization logic
  }
  async getCurrentPosition(): Promise<{ lat: number; lng: number }> {
    return { lat: 0, lng: 0 };
  }
}

export class FileSystemModule implements NativeModule {
  name = 'FileSystem';
  initialize() {
    // Real file system initialization logic
  }
  async readFile(path: string): Promise<string> {
    return '';
  }
}

export class NativeModuleRegistry {
  private modules = new Map<string, NativeModule>();
  register(module: NativeModule) {
    this.modules.set(module.name, module);
    module.initialize();
  }
  get(name: string): NativeModule | undefined {
    return this.modules.get(name);
  }
}
