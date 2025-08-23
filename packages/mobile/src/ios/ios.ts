import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { MobileAppOptions } from '../index';

export interface IOSBuildOptions {
  configuration?: 'Debug' | 'Release';
  scheme?: string;
  team?: string;
  method?: 'development' | 'app-store' | 'ad-hoc' | 'enterprise';
  destination?: string;
  xcargs?: string[];
  extraArgs?: string[];
}

export interface IOSRunOptions {
  configuration?: 'Debug' | 'Release';
  scheme?: string;
  device?: string;
  simulator?: string;
  extraArgs?: string[];
}

export interface IOSTestOptions {
  configuration?: 'Debug' | 'Release';
  scheme?: string;
  device?: string;
  simulator?: string;
  testRunner?: 'xctest' | 'jest';
  extraArgs?: string[];
}

export class IOSPlatform {
  private options: MobileAppOptions;
  private projectDir: string;
  private initialized = false;

  constructor(options: MobileAppOptions) {
    this.options = options;
    this.projectDir = path.join(process.cwd(), 'ios');
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create iOS project directory if it doesn't exist
      await fs.ensureDir(this.projectDir);

      // Initialize iOS project based on framework
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
      console.error('Error initializing iOS platform:', error);
      throw error;
    }
  }

  private async initializeReactNativeProject(): Promise<void> {
    // Check if React Native project already exists
    const iosExists = await fs.pathExists(path.join(this.projectDir, this.getAppName() + '.xcodeproj'));

    if (!iosExists) {
      // Initialize React Native iOS project
      await this.executeCommand('npx', ['react-native', 'ios']);
    }

    // Configure iOS project
    await this.configureReactNativeProject();
  }

  private async configureReactNativeProject(): Promise<void> {
    // Configure Info.plist
    await this.configureInfoPlist();

    // Configure .xcodeproj
    await this.configureXcodeProject();

    // Configure Podfile
    await this.configurePodfile();

    // Install pods
    await this.installPods();
  }

  private async configureInfoPlist(): Promise<void> {
    const infoPlistPath = path.join(this.projectDir, this.getAppName(), 'Info.plist');
    let infoPlistContent = await fs.readFile(infoPlistPath, 'utf8');

    // Update bundle identifier
    if (this.options.ios?.bundleIdentifier) {
      infoPlistContent = infoPlistContent.replace(/<key>CFBundleIdentifier<\/key>\s*<string>[^<]*<\/string>/, `<key>CFBundleIdentifier</key>\n\t<string>${this.options.ios.bundleIdentifier}</string>`);
    }

    // Update version
    if (this.options.ios?.version) {
      infoPlistContent = infoPlistContent.replace(/<key>CFBundleShortVersionString<\/key>\s*<string>[^<]*<\/string>/, `<key>CFBundleShortVersionString</key>\n\t<string>${this.options.ios.version}</string>`);
    }

    // Update build number
    if (this.options.ios?.buildNumber !== undefined) {
      infoPlistContent = infoPlistContent.replace(/<key>CFBundleVersion<\/key>\s*<string>[^<]*<\/string>/, `<key>CFBundleVersion</key>\n\t<string>${this.options.ios.buildNumber}</string>`);
    }

    // Update deployment target
    if (this.options.ios?.deploymentTarget) {
      infoPlistContent = infoPlistContent.replace(/<key>IPHONEOS_DEPLOYMENT_TARGET<\/key>\s*<string>[^<]*<\/string>/, `<key>IPHONEOS_DEPLOYMENT_TARGET</key>\n\t<string>${this.options.ios.deploymentTarget}</string>`);
    }

    // Add capabilities
    if (this.options.ios?.capabilities && this.options.ios.capabilities.length > 0) {
      const capabilitiesSection = this.options.ios.capabilities
        .map(capability => {
          switch (capability) {
            case 'push-notifications':
              return `
    <key>UIBackgroundModes</key>
    <array>
        <string>remote-notification</string>
    </array>`;
            case 'background-fetch':
              return `
    <key>UIBackgroundModes</key>
    <array>
        <string>fetch</string>
    </array>`;
            case 'background-refresh':
              return `
    <key>UIBackgroundModes</key>
    <array>
        <string>background-refresh</string>
    </array>`;
            case 'location':
              return `
    <key>UIBackgroundModes</key>
    <array>
        <string>location</string>
    </array>`;
            case 'bluetooth':
              return `
    <key>UIBackgroundModes</key>
    <array>
        <string>bluetooth-central</string>
    </array>`;
            case 'nfc':
              return `
    <key>com.apple.developer.nfc.readersession.formats</key>
    <array>
        <string>NDEF</string>
        <string>TAG</string>
    </array>`;
            default:
              return '';
          }
        })
        .join('\n');

      infoPlistContent = infoPlistContent.replace(
        /(<\/dict>\s*<\/plist>)/,
        `${capabilitiesSection}\n$1`
      );
    }

    // Add custom Info.plist properties
    if (this.options.ios?.infoPlist) {
      const customProperties = Object.entries(this.options.ios.infoPlist)
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return `
    <key>${key}</key>
    <string>${value}</string>`;
          } else if (typeof value === 'boolean') {
            return `
    <key>${key}</key>
    <${value ? 'true' : 'false'}/>`;
          } else if (typeof value === 'number') {
            return `
    <key>${key}</key>
    <real>${value}</real>`;
          } else if (Array.isArray(value)) {
            return `
    <key>${key}</key>
    <array>
        ${value.map(item => `<string>${item}</string>`).join('\n        ')}
    </array>`;
          } else if (typeof value === 'object') {
            return `
    <key>${key}</key>
    <dict>
        ${Object.entries(value).map(([k, v]) => `
        <key>${k}</key>
        <string>${v}</string>`).join('\n        ')}
    </dict>`;
          } else {
            return '';
          }
        })
        .join('\n');

      infoPlistContent = infoPlistContent.replace(
        /(<\/dict>\s*<\/plist>)/,
        `${customProperties}\n$1`
      );
    }

    await fs.writeFile(infoPlistPath, infoPlistContent);
  }

  private async configureXcodeProject(): Promise<void> {
    const xcodeprojPath = path.join(this.projectDir, this.getAppName() + '.xcodeproj', 'project.pbxproj');
    let xcodeprojContent = await fs.readFile(xcodeprojPath, 'utf8');

    // Update development target
    if (this.options.ios?.deploymentTarget) {
      xcodeprojContent = xcodeprojContent.replace(/IPHONEOS_DEPLOYMENT_TARGET = [^;]+/, `IPHONEOS_DEPLOYMENT_TARGET = ${this.options.ios.deploymentTarget}`);
    }

    // Update team ID
    if (this.options.ios?.team) {
      xcodeprojContent = xcodeprojContent.replace(/DEVELOPMENT_TEAM = [^;]+/, `DEVELOPMENT_TEAM = ${this.options.ios.team}`);
    }

    await fs.writeFile(xcodeprojPath, xcodeprojContent);
  }

  private async configurePodfile(): Promise<void> {
    const podfilePath = path.join(this.projectDir, 'Podfile');
    let podfileContent = await fs.readFile(podfilePath, 'utf8');

    // Update platform version
    if (this.options.ios?.deploymentTarget) {
      podfileContent = podfileContent.replace(/platform :ios, '[^']+'/g, `platform :ios, '${this.options.ios.deploymentTarget}'`);
    }

    // Add custom pods
    if (!podfileContent.includes('pod \'Firebase/Analytics\'')) {
      podfileContent += '\npod \'Firebase/Analytics\'';
    }

    if (!podfileContent.includes('pod \'Firebase/Messaging\'')) {
      podfileContent += '\npod \'Firebase/Messaging\'';
    }

    if (!podfileContent.includes('pod \'GoogleSignIn\'')) {
      podfileContent += '\npod \'GoogleSignIn\'';
    }

    await fs.writeFile(podfilePath, podfileContent);
  }

  private async installPods(): Promise<void> {
    try {
      await this.executeCommand('pod', ['install'], { cwd: this.projectDir });
    } catch (error) {
      console.error('Error installing pods:', error);
      throw error;
    }
  }

  private async initializeCordovaProject(): Promise<void> {
    // Check if Cordova project already exists
    const cordovaExists = await fs.pathExists(path.join(process.cwd(), 'config.xml'));

    if (!cordovaExists) {
      // Initialize Cordova iOS project
      await this.executeCommand('npx', ['cordova', 'platform', 'add', 'ios']);
    }

    // Configure Cordova project
    await this.configureCordovaProject();
  }

  private async configureCordovaProject(): Promise<void> {
    // Configure config.xml
    await this.configureCordovaConfigXml();

    // Configure iOS project
    await this.configureCordovaIosProject();
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

  private async configureCordovaIosProject(): Promise<void> {
    // Configure Info.plist
    await this.configureCordovaInfoPlist();

    // Configure .xcodeproj
    await this.configureCordovaXcodeProject();
  }

  private async configureCordovaInfoPlist(): Promise<void> {
    const infoPlistPath = path.join(this.projectDir, this.getAppName(), 'Info.plist');
    let infoPlistContent = await fs.readFile(infoPlistPath, 'utf8');

    // Update bundle identifier
    if (this.options.cordova?.id) {
      infoPlistContent = infoPlistContent.replace(/<key>CFBundleIdentifier<\/key>\s*<string>[^<]*<\/string>/, `<key>CFBundleIdentifier</key>\n\t<string>${this.options.cordova.id}</string>`);
    }

    // Update version
    if (this.options.ios?.version) {
      infoPlistContent = infoPlistContent.replace(/<key>CFBundleShortVersionString<\/key>\s*<string>[^<]*<\/string>/, `<key>CFBundleShortVersionString</key>\n\t<string>${this.options.ios.version}</string>`);
    }

    // Update build number
    if (this.options.ios?.buildNumber !== undefined) {
      infoPlistContent = infoPlistContent.replace(/<key>CFBundleVersion<\/key>\s*<string>[^<]*<\/string>/, `<key>CFBundleVersion</key>\n\t<string>${this.options.ios.buildNumber}</string>`);
    }

    // Update deployment target
    if (this.options.ios?.deploymentTarget) {
      infoPlistContent = infoPlistContent.replace(/<key>IPHONEOS_DEPLOYMENT_TARGET<\/key>\s*<string>[^<]*<\/string>/, `<key>IPHONEOS_DEPLOYMENT_TARGET</key>\n\t<string>${this.options.ios.deploymentTarget}</string>`);
    }

    await fs.writeFile(infoPlistPath, infoPlistContent);
  }

  private async configureCordovaXcodeProject(): Promise<void> {
    const xcodeprojPath = path.join(this.projectDir, this.getAppName() + '.xcodeproj', 'project.pbxproj');
    let xcodeprojContent = await fs.readFile(xcodeprojPath, 'utf8');

    // Update development target
    if (this.options.ios?.deploymentTarget) {
      xcodeprojContent = xcodeprojContent.replace(/IPHONEOS_DEPLOYMENT_TARGET = [^;]+/, `IPHONEOS_DEPLOYMENT_TARGET = ${this.options.ios.deploymentTarget}`);
    }

    // Update team ID
    if (this.options.ios?.team) {
      xcodeprojContent = xcodeprojContent.replace(/DEVELOPMENT_TEAM = [^;]+/, `DEVELOPMENT_TEAM = ${this.options.ios.team}`);
    }

    await fs.writeFile(xcodeprojPath, xcodeprojContent);
  }

  private async initializeCapacitorProject(): Promise<void> {
    // Check if Capacitor project already exists
    const capacitorExists = await fs.pathExists(path.join(process.cwd(), 'capacitor.config.json'));

    if (!capacitorExists) {
      // Initialize Capacitor iOS project
      await this.executeCommand('npx', ['cap', 'add', 'ios']);
    }

    // Configure Capacitor project
    await this.configureCapacitorProject();
  }

  private async configureCapacitorProject(): Promise<void> {
    // Configure capacitor.config.json
    await this.configureCapacitorConfig();

    // Configure iOS project
    await this.configureCapacitorIosProject();
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

    // Update iOS config
    if (this.options.capacitor?.ios) {
      config.ios = {
        ...config.ios,
        ...this.options.capacitor.ios
      };
    }

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  }

  private async configureCapacitorIosProject(): Promise<void> {
    // Configure Info.plist
    await this.configureCapacitorInfoPlist();

    // Configure .xcodeproj
    await this.configureCapacitorXcodeProject();
  }

  private async configureCapacitorInfoPlist(): Promise<void> {
    const infoPlistPath = path.join(this.projectDir, 'App', 'App', 'Info.plist');
    let infoPlistContent = await fs.readFile(infoPlistPath, 'utf8');

    // Update bundle identifier
    if (this.options.capacitor?.appId) {
      infoPlistContent = infoPlistContent.replace(/<key>CFBundleIdentifier<\/key>\s*<string>[^<]*<\/string>/, `<key>CFBundleIdentifier</key>\n\t<string>${this.options.capacitor.appId}</string>`);
    }

    // Update version
    if (this.options.ios?.version) {
      infoPlistContent = infoPlistContent.replace(/<key>CFBundleShortVersionString<\/key>\s*<string>[^<]*<\/string>/, `<key>CFBundleShortVersionString</key>\n\t<string>${this.options.ios.version}</string>`);
    }

    // Update build number
    if (this.options.ios?.buildNumber !== undefined) {
      infoPlistContent = infoPlistContent.replace(/<key>CFBundleVersion<\/key>\s*<string>[^<]*<\/string>/, `<key>CFBundleVersion</key>\n\t<string>${this.options.ios.buildNumber}</string>`);
    }

    // Update deployment target
    if (this.options.ios?.deploymentTarget) {
      infoPlistContent = infoPlistContent.replace(/<key>IPHONEOS_DEPLOYMENT_TARGET<\/key>\s*<string>[^<]*<\/string>/, `<key>IPHONEOS_DEPLOYMENT_TARGET</key>\n\t<string>${this.options.ios.deploymentTarget}</string>`);
    }

    await fs.writeFile(infoPlistPath, infoPlistContent);
  }

  private async configureCapacitorXcodeProject(): Promise<void> {
    const xcodeprojPath = path.join(this.projectDir, 'App', 'App.xcodeproj', 'project.pbxproj');
    let xcodeprojContent = await fs.readFile(xcodeprojPath, 'utf8');

    // Update development target
    if (this.options.ios?.deploymentTarget) {
      xcodeprojContent = xcodeprojContent.replace(/IPHONEOS_DEPLOYMENT_TARGET = [^;]+/, `IPHONEOS_DEPLOYMENT_TARGET = ${this.options.ios.deploymentTarget}`);
    }

    // Update team ID
    if (this.options.ios?.team) {
      xcodeprojContent = xcodeprojContent.replace(/DEVELOPMENT_TEAM = [^;]+/, `DEVELOPMENT_TEAM = ${this.options.ios.team}`);
    }

    await fs.writeFile(xcodeprojPath, xcodeprojContent);
  }

  private async initializeExpoProject(): Promise<void> {
    // Check if Expo project already exists
    const expoExists = await fs.pathExists(path.join(process.cwd(), 'app.json'));

    if (!expoExists) {
      // Initialize Expo iOS project
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

    // Update iOS config
    if (this.options.expo?.ios) {
      appJson.expo.ios = {
        ...appJson.expo.ios,
        ...this.options.expo.ios
      };
    }

    await fs.writeFile(appJsonPath, JSON.stringify(appJson, null, 2));
  }

  public async build(options: IOSBuildOptions = {}): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const buildOptions: IOSBuildOptions = {
        configuration: 'Debug',
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
      console.error('Error building iOS app:', error);
      throw error;
    }
  }

  private async buildReactNative(options: IOSBuildOptions): Promise<void> {
    const args = ['run-ios', `--configuration=${options.configuration}`];

    if (options.scheme) {
      args.push(`--scheme=${options.scheme}`);
    }

    if (options.team) {
      args.push(`--team=${options.team}`);
    }

    if (options.method) {
      args.push(`--method=${options.method}`);
    }

    if (options.destination) {
      args.push(`--destination=${options.destination}`);
    }

    if (options.xcargs) {
      args.push(...options.xcargs.map(arg => `--xcargs=${arg}`));
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['react-native', ...args]);
  }

  private async buildCordova(options: IOSBuildOptions): Promise<void> {
    const args = ['build', 'ios'];

    if (options.configuration === 'Release') {
      args.push('--release');
    }

    if (options.device) {
      args.push(`--device=${options.device}`);
    }

    if (options.emulator) {
      args.push(`--emulator=${options.emulator}`);
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['cordova', ...args]);
  }

  private async buildCapacitor(options: IOSBuildOptions): Promise<void> {
    // Sync web assets
    await this.executeCommand('npx', ['cap', 'sync', 'ios']);

    const args = ['open', 'ios'];

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['cap', ...args]);
  }

  private async buildExpo(options: IOSBuildOptions): Promise<void> {
    const args = ['build:ios'];

    if (options.configuration === 'Release') {
      args.push('--release');
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['expo', ...args]);
  }

  public async run(options: IOSRunOptions = {}): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const runOptions: IOSRunOptions = {
        configuration: 'Debug',
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
      console.error('Error running iOS app:', error);
      throw error;
    }
  }

  private async runReactNative(options: IOSRunOptions): Promise<void> {
    const args = ['run-ios', `--configuration=${options.configuration}`];

    if (options.scheme) {
      args.push(`--scheme=${options.scheme}`);
    }

    if (options.device) {
      args.push(`--device=${options.device}`);
    }

    if (options.simulator) {
      args.push(`--simulator=${options.simulator}`);
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['react-native', ...args]);
  }

  private async runCordova(options: IOSRunOptions): Promise<void> {
    const args = ['run', 'ios'];

    if (options.configuration === 'Release') {
      args.push('--release');
    }

    if (options.device) {
      args.push(`--target=${options.device}`);
    }

    if (options.emulator) {
      args.push(`--emulator=${options.emulator}`);
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['cordova', ...args]);
  }

  private async runCapacitor(options: IOSRunOptions): Promise<void> {
    // Sync web assets
    await this.executeCommand('npx', ['cap', 'sync', 'ios']);

    const args = ['run', 'ios'];

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['cap', ...args]);
  }

  private async runExpo(options: IOSRunOptions): Promise<void> {
    const args = ['start', '--ios'];

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['expo', ...args]);
  }

  public async test(options: IOSTestOptions = {}): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const testOptions: IOSTestOptions = {
        configuration: 'Debug',
        testRunner: 'xctest',
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
      console.error('Error testing iOS app:', error);
      throw error;
    }
  }

  private async testReactNative(options: IOSTestOptions): Promise<void> {
    const args = ['test'];

    if (options.configuration === 'Release') {
      args.push('--configuration=release');
    }

    if (options.device) {
      args.push(`--device=${options.device}`);
    }

    if (options.simulator) {
      args.push(`--simulator=${options.simulator}`);
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['react-native', ...args]);
  }

  private async testCordova(options: IOSTestOptions): Promise<void> {
    const args = ['test', 'ios'];

    if (options.configuration === 'Release') {
      args.push('--release');
    }

    if (options.device) {
      args.push(`--target=${options.device}`);
    }

    if (options.emulator) {
      args.push(`--emulator=${options.emulator}`);
    }

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['cordova', ...args]);
  }

  private async testCapacitor(options: IOSTestOptions): Promise<void> {
    const args = ['test', 'ios'];

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['cap', ...args]);
  }

  private async testExpo(options: IOSTestOptions): Promise<void> {
    const args = ['test', '--ios'];

    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    await this.executeCommand('npx', ['expo', ...args]);
  }

  private getAppName(): string {
    // Try to get app name from package.json
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
      if (packageJson.name) {
        // Convert kebab-case to PascalCase
        return packageJson.name
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
      }
    } catch (error) {
      // Ignore error
    }

    // Default app name
    return 'ONEDOTApp';
  }

  private async executeCommand(command: string, args: string[], options: { cwd?: string } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = childProcess.spawn(command, args, {
        stdio: 'inherit',
        cwd: options.cwd || process.cwd()
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
