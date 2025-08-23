import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { MobileAppOptions } from '../index';

export interface AndroidBuildOptions {
  variant?: 'debug' | 'release';
  bundle?: boolean;
  aab?: boolean;
  apk?: boolean;
  tasks?: string[];
  extraArgs?: string[];
}

export interface AndroidRunOptions {
  variant?: 'debug' | 'release';
  deviceId?: string;
  install?: boolean;
  extraArgs?: string[];
}

export interface AndroidTestOptions {
  variant?: 'debug' | 'release';
  deviceId?: string;
  testRunner?: 'junit' | 'instrumentation';
  extraArgs?: string[];
}

export class AndroidPlatform {
  private options: MobileAppOptions;
  private projectDir: string;
  private initialized = false;

  constructor(options: MobileAppOptions) {
    this.options = options;
    this.projectDir = path.join(process.cwd(), 'android');
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create Android project directory if it doesn't exist
      await fs.ensureDir(this.projectDir);

      // Initialize Android project based on framework
      switch (this.options.framework) {
        case 'react-native':
          await this.initializeReactNativeProject();
          break;
        case 'cordova':
          await this.initializeCordovaProject();
          break;
        case 'capacitor':
          await this.initializeCapacitorProject();
          break;
        case 'expo':
          await this.initializeExpoProject();
          break;
        default:
          throw new Error(`Unsupported framework: ${this.options.framework}`);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing Android platform:', error);
      throw error;
    }
  }

  private async initializeReactNativeProject(): Promise<void> {
    // Check if React Native project already exists
    const androidExists = await fs.pathExists(path.join(this.projectDir, 'app'));

    if (!androidExists) {
      // Initialize React Native Android project
      await this.executeCommand('npx', ['react-native', 'android']);
    }

    // Configure Android project
    await this.configureReactNativeProject();
  }

  private async configureReactNativeProject(): Promise<void> {
    // Configure Android manifest
    await this.configureAndroidManifest();

    // Configure build.gradle
    await this.configureBuildGradle();

    // Configure settings.gradle
    await this.configureSettingsGradle();

    // Configure proguard-rules.pro
    await this.configureProguardRules();

    // Configure strings.xml
    await this.configureStringsXml();

    // Configure colors.xml
    await this.configureColorsXml();

    // Configure styles.xml
    await this.configureStylesXml();
  }

  private async configureAndroidManifest(): Promise<void> {
    const manifestPath = path.join(this.projectDir, 'app', 'src', 'main', 'AndroidManifest.xml');
    let manifestContent = await fs.readFile(manifestPath, 'utf8');

    // Update package name
    if (this.options.android?.packageName) {
      manifestContent = manifestContent.replace(/package="[^"]*"/, `package="${this.options.android.packageName}"`);
    }

    // Update version code
    if (this.options.android?.versionCode !== undefined) {
      manifestContent = manifestContent.replace(/android:versionCode="[^"]*"/, `android:versionCode="${this.options.android.versionCode}"`);
    }

    // Update version name
    if (this.options.android?.versionName) {
      manifestContent = manifestContent.replace(/android:versionName="[^"]*"/, `android:versionName="${this.options.android.versionName}"`);
    }

    // Add permissions
    if (this.options.android?.permissions && this.options.android.permissions.length > 0) {
      const permissionsSection = this.options.android.permissions
        .map(permission => `<uses-permission android:name="${permission}" />`)
        .join('\n    ');

      manifestContent = manifestContent.replace(
        /(<manifest[^>]*>)/,
        `$1\n    ${permissionsSection}`
      );
    }

    // Add features
    if (this.options.android?.features && this.options.android.features.length > 0) {
      const featuresSection = this.options.android.features
        .map(feature => `<uses-feature android:name="${feature}" />`)
        .join('\n    ');

      manifestContent = manifestContent.replace(
        /(<manifest[^>]*>)/,
        `$1\n    ${featuresSection}`
      );
    }

    await fs.writeFile(manifestPath, manifestContent);
  }

  private async configureBuildGradle(): Promise<void> {
    const buildGradlePath = path.join(this.projectDir, 'app', 'build.gradle');
    let buildGradleContent = await fs.readFile(buildGradlePath, 'utf8');

    // Update min SDK version
    if (this.options.android?.minSdkVersion !== undefined) {
      buildGradleContent = buildGradleContent.replace(/minSdkVersion\s+\d+/, `minSdkVersion ${this.options.android.minSdkVersion}`);
    }

    // Update target SDK version
    if (this.options.android?.targetSdkVersion !== undefined) {
      buildGradleContent = buildGradleContent.replace(/targetSdkVersion\s+\d+/, `targetSdkVersion ${this.options.android.targetSdkVersion}`);
    }

    // Add dependencies
    const dependenciesSection = `
dependencies {
    implementation "com.facebook.react:react-native:+"
    implementation "androidx.swiperefreshlayout:swiperefreshlayout:1.0.0"
    debugImplementation "com.facebook.flipper:flipper:${FLIPPER_VERSION}"
    debugImplementation "com.facebook.flipper:flipper-network-plugin:${FLIPPER_VERSION}"
    debugImplementation "com.facebook.flipper:flipper-fresco-plugin:${FLIPPER_VERSION}"
}`;

    buildGradleContent = buildGradleContent.replace(
      /dependencies\s*{[^}]*}/,
      dependenciesSection
    );

    await fs.writeFile(buildGradlePath, buildGradleContent);
  }

  private async configureSettingsGradle(): Promise<void> {
    const settingsGradlePath = path.join(this.projectDir, 'settings.gradle');
    let settingsGradleContent = await fs.readFile(settingsGradlePath, 'utf8');

    // Add React Native Gradle plugin
    if (!settingsGradleContent.includes('apply from: "../node_modules/react-native/react.gradle"')) {
      settingsGradleContent += '\napply from: "../node_modules/react-native/react.gradle"';
    }

    await fs.writeFile(settingsGradlePath, settingsGradleContent);
  }

  private async configureProguardRules(): Promise<void> {
    const proguardPath = path.join(this.projectDir, 'app', 'proguard-rules.pro');
    let proguardContent = await fs.readFile(proguardPath, 'utf8');

    // Add React Native ProGuard rules
    const reactNativeRules = `
# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.modules.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.views.** { *; }
`;

    proguardContent += reactNativeRules;

    await fs.writeFile(proguardPath, proguardContent);
  }

  private async configureStringsXml(): Promise<void> {
    const stringsPath = path.join(this.projectDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
    let stringsContent = await fs.readFile(stringsPath, 'utf8');

    // Add app name
    if (!stringsContent.includes('<string name="app_name">')) {
      stringsContent = stringsContent.replace(
        /(<resources>)/,
        '$1\n    <string name="app_name">ONEDOT App</string>'
      );
    }

    await fs.writeFile(stringsPath, stringsContent);
  }

  private async configureColorsXml(): Promise<void> {
    const colorsPath = path.join(this.projectDir, 'app', 'src', 'main', 'res', 'values', 'colors.xml');
    let colorsContent = await fs.readFile(colorsPath, 'utf8');

    // Add primary color
    if (!colorsContent.includes('<color name="primary">')) {
      colorsContent = colorsContent.replace(
        /(<resources>)/,
        '$1\n    <color name="primary">#6200EE</color>'
      );
    }

    // Add primary dark color
    if (!colorsContent.includes('<color name="primary_dark">')) {
      colorsContent = colorsContent.replace(
        /(<resources>)/,
        '$1\n    <color name="primary_dark">#3700B3</color>'
      );
    }

    // Add accent color
    if (!colorsContent.includes('<color name="accent">')) {
      colorsContent = colorsContent.replace(
        /(<resources>)/,
        '$1\n    <color name="accent">#03DAC5</color>'
      );
    }

    await fs.writeFile(colorsPath, colorsContent);
  }

  private async configureStylesXml(): Promise<void> {
    const stylesPath = path.join(this.projectDir, 'app', 'src', 'main', 'res', 'values', 'styles.xml');
    let stylesContent = await fs.readFile(stylesPath, 'utf8');

    // Add app theme
    if (!stylesContent.includes('<style name="AppTheme"')) {
      const appTheme = `
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="colorPrimary">@color/primary</item>
        <item name="colorPrimaryDark">@color/primary_dark</item>
        <item name="colorAccent">@color/accent</item>
    </style>`;

      stylesContent = stylesContent.replace(
        /(<resources>)/,
        `$1${appTheme}`
      );
    }

    await fs.writeFile(stylesPath, stylesContent);
  }

  private async initializeCordovaProject(): Promise<void> {
    // Check if Cordova project already exists
    const cordovaExists = await fs.pathExists(path.join(this.projectDir, 'config.xml'));

    if (!cordovaExists) {
      // Initialize Cordova Android project
      await this.executeCommand('npx', ['cordova', 'platform', 'add', 'android']);
    }

    // Configure Cordova project
    await this.configureCordovaProject();
  }

  private async configureCordovaProject(): Promise<void> {
    // Configure config.xml
    await this.configureCordovaConfigXml();

    // Configure Android manifest
    await this.configureCordovaAndroidManifest();
  }

  private async configureCordovaConfigXml(): Promise<void> {
    const configPath = path.join(process.cwd(), 'config.xml');
    let configContent = await fs.readFile(configPath, 'utf8');

    // Update app name
    if (this.options.cordova?.name) {
      configContent = configContent.replace(/<name>[^<]*<\/name>/, `<name>${this.options.cordova.name}</name>`);
    }

    // Update app id
    if (this.options.cordova?.id) {
      configContent = configContent.replace(/id="[^"]*"/, `id="${this.options.cordova.id}"`);
    }

    // Update app version
    if (this.options.cordova?.version) {
      configContent = configContent.replace(/version="[^"]*"/, `version="${this.options.cordova.version}"`);
    }

    // Update app description
    if (this.options.cordova?.description) {
      configContent = configContent.replace(/<description>[^<]*<\/description>/, `<description>${this.options.cordova.description}</description>`);
    }

    // Update author
    if (this.options.cordova?.author) {
      const author = this.options.cordova.author;
      const authorString = `<author email="${author.email || ''}" href="${author.link || ''}">${author.name || ''}</author>`;
      configContent = configContent.replace(/<author[^>]*>[^<]*<\/author>/, authorString);
    }

    // Add preferences
    if (this.options.cordova?.preferences) {
      const preferencesSection = Object.entries(this.options.cordova.preferences)
        .map(([name, value]) => `<preference name="${name}" value="${value}" />`)
        .join('\n    ');

      configContent = configContent.replace(
        /(<widget[^>]*>)/,
        `$1\n    ${preferencesSection}`
      );
    }

    await fs.writeFile(configPath, configContent);
  }

  private async configureCordovaAndroidManifest(): Promise<void> {
    const manifestPath = path.join(this.projectDir, 'app', 'src', 'main', 'AndroidManifest.xml');
    let manifestContent = await fs.readFile(manifestPath, 'utf8');

    // Update package name
    if (this.options.cordova?.id) {
      manifestContent = manifestContent.replace(/package="[^"]*"/, `package="${this.options.cordova.id}"`);
    }

    // Update version code
    if (this.options.android?.versionCode !== undefined) {
      manifestContent = manifestContent.replace(/android:versionCode="[^"]*"/, `android:versionCode="${this.options.android.versionCode}"`);
    }

    // Update version name
    if (this.options.android?.versionName) {
      manifestContent = manifestContent.replace(/android:versionName="[^"]*"/, `android:versionName="${this.options.android.versionName}"`);
    }

    // Add permissions
    if (this.options.android?.permissions && this.options.android.permissions.length > 0) {
      const permissionsSection = this.options.android.permissions
        .map(permission => `<uses-permission android:name="${permission}" />`)
        .join('\n    ');

      manifestContent = manifestContent.replace(
        /(<manifest[^>]*>)/,
        `$1\n    ${permissionsSection}`
      );
    }

    // Add features
    if (this.options.android?.features && this.options.android.features.length > 0) {
      const featuresSection = this.options.android.features
        .map(feature => `<uses-feature android:name="${feature}" />`)
        .join('\n    ');

      manifestContent = manifestContent.replace(
        /(<manifest[^>]*>)/,
        `$1\n    ${featuresSection}`
      );
    }

    await fs.writeFile(manifestPath, manifestContent);
  }

  private async initializeCapacitorProject(): Promise<void> {
    // Check if Capacitor project already exists
    const capacitorExists = await fs.pathExists(path.join(this.projectDir, 'capacitor.config.json'));

    if (!capacitorExists) {
      // Initialize Capacitor Android project
      await this.executeCommand('npx', ['cap', 'add', 'android']);
    }

    // Configure Capacitor project
    await this.configureCapacitorProject();
  }

  private async configureCapacitorProject(): Promise<void> {
    // Configure capacitor.config.json
    await this.configureCapacitorConfig();

    // Configure Android manifest
    await this.configureCapacitorAndroidManifest();
  }

  private async configureCapacitorConfig(): Promise<void> {
    const configPath = path.join(process.cwd(), 'capacitor.config.json');
    let configContent = await fs.readFile(configPath, 'utf8');

    // Parse config
    const config = JSON.parse(configContent);

    // Update app name
    if (this.options.capacitor?.appName) {
      config.appName = this.options.capacitor.appName;
    }

    // Update app id
    if (this.options.capacitor?.appId) {
      config.appId = this.options.capacitor.appId;
    }

    // Update web dir
    if (this.options.capacitor?.webDir) {
      config.webDir = this.options.capacitor.webDir;
    }

    // Update server config
    if (this.options.capacitor?.server) {
      config.server = {
        ...config.server,
        ...this.options.capacitor.server
      };
    }

    // Update Android config
    if (this.options.capacitor?.android) {
      config.android = {
        ...config.android,
        ...this.options.capacitor.android
      };
    }

    // Update iOS config
    if (this.options.capacitor?.ios) {
      config.ios = {
        ...config.ios,
        ...this.options.capacitor.ios
      };
    }

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  }

  private async configureCapacitorAndroidManifest(): Promise<void> {
    const manifestPath = path.join(this.projectDir, 'app', 'src', 'main', 'AndroidManifest.xml');
    let manifestContent = await fs.readFile(manifestPath, 'utf8');

    // Update package name
    if (this.options.capacitor?.appId) {
      manifestContent = manifestContent.replace(/package="[^"]*"/, `package="${this.options.capacitor.appId}"`);
    }

    // Update version code
    if (this.options.android?.versionCode !== undefined) {
      manifestContent = manifestContent.replace(/android:versionCode="[^"]*"/, `android:versionCode="${this.options.android.versionCode}"`);
    }

    // Update version name
    if (this.options.android?.versionName) {
      manifestContent = manifestContent.replace(/android:versionName="[^"]*"/, `android:versionName="${this.options.android.versionName}"`);
    }

    // Add permissions
    if (this.options.android?.permissions && this.options.android.permissions.length > 0) {
      const permissionsSection = this.options.android.permissions
        .map(permission => `<uses-permission android:name="${permission}" />`)
        .join('\n    ');

      manifestContent = manifestContent.replace(
        /(<manifest[^>]*>)/,
        `$1\n    ${permissionsSection}`
      );
    }

    // Add features
    if (this.options.android?.features && this.options.android.features.length > 0) {
      const featuresSection = this.options.android.features
        .map(feature => `<uses-feature android:name="${feature}" />`)
        .join('\n    ');

      manifestContent = manifestContent.replace(
        /(<manifest[^>]*>)/,
        `$1\n    ${featuresSection}`
      );
    }

    await fs.writeFile(manifestPath, manifestContent);
  }

  private async initializeExpoProject(): Promise<void> {
    // Check if Expo project already exists
    const expoExists = await fs.pathExists(path.join(process.cwd(), 'app.json'));

    if (!expoExists) {
      // Initialize Expo Android project
      await this.executeCommand('npx', ['expo', 'install:expo']);
    }

    // Configure Expo project
    await this.configureExpoProject();
  }

  private async configureExpoProject(): Promise<void> {
    // Configure app.json
    await this.configureExpoAppJson();
  }

  private async configureExpoAppJson(): Promise<void> {
    const appJsonPath = path.join(process.cwd(), 'app.json');
    let appJsonContent = await fs.readFile(appJsonPath, 'utf8');

    // Parse app.json
    const appJson = JSON.parse(appJsonContent);

    // Update expo config
    if (this.options.expo) {
      appJson.expo = {
        ...appJson.expo,
        ...this.options.expo
      };
    }

    // Update Android config
    if (this.options.expo?.android) {
      appJson.expo.android = {
        ...appJson.expo.android,
        ...this.options.expo.android
      };
    }

    await fs.writeFile(appJsonPath, JSON.stringify(appJson, null, 2));
  }

  public async build(options: AndroidBuildOptions = {}): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const buildOptions: AndroidBuildOptions = {
        variant: 'debug',
        ...options
      };

      switch (this.options.framework) {
        case 'react-native':
          await this.buildReactNative(buildOptions);
          break;
        case 'cordova':
          await this.buildCordova(buildOptions);
          break;
        case 'capacitor':
          await this.buildCapacitor(buildOptions);
          break;
        case 'expo':
          await this.buildExpo(buildOptions);
          break;
        default:
          throw new Error(`Unsupported framework: ${this.options.framework}`);
      }
    } catch (error) {
      console.error('Error building Android app:', error);
      throw error;
    }
  }

  private async buildReactNative(options: AndroidBuildOptions): Promise<void> {
    const args = ['run-android', `--variant=${options.variant}`];

    if (options.bundle) {
      args.push('--bundle');
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['react-native', ...args]);
  }

  private async buildCordova(options: AndroidBuildOptions): Promise<void> {
    const args = ['build', 'android'];

    if (options.variant === 'release') {
      args.push('--release');
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['cordova', ...args]);
  }

  private async buildCapacitor(options: AndroidBuildOptions): Promise<void> {
    // Sync web assets
    await this.executeCommand('npx', ['cap', 'sync', 'android']);

    const args = ['open', 'android'];

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['cap', ...args]);
  }

  private async buildExpo(options: AndroidBuildOptions): Promise<void> {
    const args = ['build:android'];

    if (options.variant === 'release') {
      args.push('--release');
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['expo', ...args]);
  }

  public async run(options: AndroidRunOptions = {}): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const runOptions: AndroidRunOptions = {
        variant: 'debug',
        ...options
      };

      switch (this.options.framework) {
        case 'react-native':
          await this.runReactNative(runOptions);
          break;
        case 'cordova':
          await this.runCordova(runOptions);
          break;
        case 'capacitor':
          await this.runCapacitor(runOptions);
          break;
        case 'expo':
          await this.runExpo(runOptions);
          break;
        default:
          throw new Error(`Unsupported framework: ${this.options.framework}`);
      }
    } catch (error) {
      console.error('Error running Android app:', error);
      throw error;
    }
  }

  private async runReactNative(options: AndroidRunOptions): Promise<void> {
    const args = ['run-android', `--variant=${options.variant}`];

    if (options.deviceId) {
      args.push(`--deviceId=${options.deviceId}`);
    }

    if (options.install !== false) {
      args.push('--install');
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['react-native', ...args]);
  }

  private async runCordova(options: AndroidRunOptions): Promise<void> {
    const args = ['run', 'android'];

    if (options.variant === 'release') {
      args.push('--release');
    }

    if (options.deviceId) {
      args.push(`--target=${options.deviceId}`);
    }

    if (options.install !== false) {
      args.push('--device');
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['cordova', ...args]);
  }

  private async runCapacitor(options: AndroidRunOptions): Promise<void> {
    // Sync web assets
    await this.executeCommand('npx', ['cap', 'sync', 'android']);

    const args = ['run', 'android'];

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['cap', ...args]);
  }

  private async runExpo(options: AndroidRunOptions): Promise<void> {
    const args = ['start', '--android'];

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['expo', ...args]);
  }

  public async test(options: AndroidTestOptions = {}): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const testOptions: AndroidTestOptions = {
        variant: 'debug',
        testRunner: 'instrumentation',
        ...options
      };

      switch (this.options.framework) {
        case 'react-native':
          await this.testReactNative(testOptions);
          break;
        case 'cordova':
          await this.testCordova(testOptions);
          break;
        case 'capacitor':
          await this.testCapacitor(testOptions);
          break;
        case 'expo':
          await this.testExpo(testOptions);
          break;
        default:
          throw new Error(`Unsupported framework: ${this.options.framework}`);
      }
    } catch (error) {
      console.error('Error testing Android app:', error);
      throw error;
    }
  }

  private async testReactNative(options: AndroidTestOptions): Promise<void> {
    const args = ['test'];

    if (options.variant === 'release') {
      args.push('--variant=release');
    }

    if (options.deviceId) {
      args.push(`--deviceId=${options.deviceId}`);
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['react-native', ...args]);
  }

  private async testCordova(options: AndroidTestOptions): Promise<void> {
    const args = ['test', 'android'];

    if (options.variant === 'release') {
      args.push('--release');
    }

    if (options.deviceId) {
      args.push(`--target=${options.deviceId}`);
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['cordova', ...args]);
  }

  private async testCapacitor(options: AndroidTestOptions): Promise<void> {
    const args = ['test', 'android'];

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['cap', ...args]);
  }

  private async testExpo(options: AndroidTestOptions): Promise<void> {
    const args = ['test', '--android'];

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['expo', ...args]);
  }

  private async executeCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = childProcess.spawn(command, args, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }
}
