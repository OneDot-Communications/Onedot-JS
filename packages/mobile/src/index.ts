export * from './android';
export * from './common';
export * from './deployment';
export * from './ios';

import { AndroidPlatform } from './android';
import { IOSPlatform } from './ios';
import { CommonPlatform } from './common';
import { DeploymentService } from './deployment';

export interface MobileAppOptions {
  entryPoint: string;
  platform: 'android' | 'ios' | 'both';
  framework: 'react-native' | 'cordova' | 'capacitor' | 'expo';
  outputDir?: string;
  assetsDir?: string;
  devServer?: {
    port: number;
    host: string;
  };
  android?: {
    packageName?: string;
    versionCode?: number;
    versionName?: string;
    minSdkVersion?: number;
    targetSdkVersion?: number;
    permissions?: string[];
    features?: string[];
  };
  ios?: {
    bundleIdentifier?: string;
    version?: string;
    buildNumber?: number;
    deploymentTarget?: string;
    capabilities?: string[];
    infoPlist?: Record<string, any>;
  };
  capacitor?: {
    appName?: string;
    appId?: string;
    webDir?: string;
    server?: {
      url?: string;
      cleartext?: boolean;
    };
    android?: {
      allowMixedContent?: boolean;
      captureInput?: boolean;
    };
    ios?: {
      contentInset?: string;
      scrollEnabled?: boolean;
    };
  };
  expo?: {
    name?: string;
    slug?: string;
    version?: string;
    orientation?: 'portrait' | 'landscape' | 'default';
    icon?: string;
    splash?: {
      image?: string;
      resizeMode?: 'contain' | 'cover' | 'native';
      backgroundColor?: string;
    };
    updates?: {
      fallbackToCacheTimeout?: number;
      enabled?: boolean;
      checkAutomatically?: 'ON_LOAD' | 'ON_ERROR_RECOVERY' | 'ON_ERROR' | 'NEVER';
    };
    assetBundlePatterns?: string[];
    ios?: {
      bundleIdentifier?: string;
      supportsTablet?: boolean;
    };
    android?: {
      package?: string;
      versionCode?: number;
      adaptiveIcon?: {
        foregroundImage?: string;
        backgroundColor?: string;
      };
      permissions?: string[];
    };
  };
  cordova?: {
    id?: string;
    name?: string;
    version?: string;
    description?: string;
    author?: {
      name?: string;
      email?: string;
      link?: string;
    };
    preferences?: Record<string, string>;
    platforms?: string[];
    plugins?: {
      [key: string]: any;
    };
  };
}

export class MobileApp {
  private options: MobileAppOptions;
  private androidPlatform: AndroidPlatform | null = null;
  private iosPlatform: IOSPlatform | null = null;
  private commonPlatform: CommonPlatform | null = null;
  private deploymentService: DeploymentService | null = null;
  private initialized = false;

  constructor(options: MobileAppOptions) {
    this.options = {
      outputDir: 'dist-mobile',
      assetsDir: 'assets',
      devServer: {
        port: 8081,
        host: 'localhost'
      },
      ...options
    };

    // Initialize platforms
    this.initializePlatforms();
  }

  private initializePlatforms(): void {
    // Initialize common platform
    this.commonPlatform = new CommonPlatform(this.options);

    // Initialize Android platform if needed
    if (this.options.platform === 'android' || this.options.platform === 'both') {
      this.androidPlatform = new AndroidPlatform(this.options);
    }

    // Initialize iOS platform if needed
    if (this.options.platform === 'ios' || this.options.platform === 'both') {
      this.iosPlatform = new IOSPlatform(this.options);
    }

    // Initialize deployment service
    this.deploymentService = new DeploymentService(this.options);
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize common platform
      if (this.commonPlatform) {
        await this.commonPlatform.initialize();
      }

      // Initialize Android platform if needed
      if (this.androidPlatform) {
        await this.androidPlatform.initialize();
      }

      // Initialize iOS platform if needed
      if (this.iosPlatform) {
        await this.iosPlatform.initialize();
      }

      // Initialize deployment service
      if (this.deploymentService) {
        await this.deploymentService.initialize();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing mobile app:', error);
      throw error;
    }
  }

  public async build(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Build common platform
      if (this.commonPlatform) {
        await this.commonPlatform.build();
      }

      // Build Android platform if needed
      if (this.androidPlatform) {
        await this.androidPlatform.build();
      }

      // Build iOS platform if needed
      if (this.iosPlatform) {
        await this.iosPlatform.build();
      }
    } catch (error) {
      console.error('Error building mobile app:', error);
      throw error;
    }
  }

  public async run(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Run on Android if needed
      if (this.androidPlatform && (this.options.platform === 'android' || this.options.platform === 'both')) {
        await this.androidPlatform.run();
      }

      // Run on iOS if needed
      if (this.iosPlatform && (this.options.platform === 'ios' || this.options.platform === 'both')) {
        await this.iosPlatform.run();
      }
    } catch (error) {
      console.error('Error running mobile app:', error);
      throw error;
    }
  }

  public async test(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Test on Android if needed
      if (this.androidPlatform && (this.options.platform === 'android' || this.options.platform === 'both')) {
        await this.androidPlatform.test();
      }

      // Test on iOS if needed
      if (this.iosPlatform && (this.options.platform === 'ios' || this.options.platform === 'both')) {
        await this.iosPlatform.test();
      }
    } catch (error) {
      console.error('Error testing mobile app:', error);
      throw error;
    }
  }

  public async deploy(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Deploy using deployment service
      if (this.deploymentService) {
        await this.deploymentService.deploy();
      }
    } catch (error) {
      console.error('Error deploying mobile app:', error);
      throw error;
    }
  }

  public getAndroidPlatform(): AndroidPlatform | null {
    return this.androidPlatform;
  }

  public getIOSPlatform(): IOSPlatform | null {
    return this.iosPlatform;
  }

  public getCommonPlatform(): CommonPlatform | null {
    return this.commonPlatform;
  }

  public getDeploymentService(): DeploymentService | null {
    return this.deploymentService;
  }
}

// Factory function to create a mobile app
export function createMobileApp(options: MobileAppOptions): MobileApp {
  return new MobileApp(options);
}
