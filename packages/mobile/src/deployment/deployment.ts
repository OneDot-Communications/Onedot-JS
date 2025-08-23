import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { MobileAppOptions } from '../index';

export interface DeploymentOptions {
  platform: 'android' | 'ios' | 'both';
  environment: 'development' | 'staging' | 'production';
  type: 'test' | 'beta' | 'production';
  service?: 'google-play' | 'app-store' | 'firebase-app-distribution' | 'appcenter';
  track?: string;
  releaseNotes?: string;
  releaseNotesFile?: string;
  changelog?: string;
  changelogFile?: string;
  notify?: boolean;
  groups?: string[];
  testers?: string[];
  credentials?: {
    serviceAccountFile?: string;
    apiKey?: string;
    token?: string;
    username?: string;
    password?: string;
  };
}

export interface DeploymentResult {
  success: boolean;
  message: string;
  url?: string;
  version?: string;
  buildNumber?: string;
  error?: string;
}

export class DeploymentService {
  private options: MobileAppOptions;
  private initialized = false;

  constructor(options: MobileAppOptions) {
    this.options = options;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create deployment directory if it doesn't exist
      const deploymentDir = path.join(this.options.outputDir!, 'deployment');
      await fs.ensureDir(deploymentDir);

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing deployment service:', error);
      throw error;
    }
  }

  public async deploy(options: DeploymentOptions): Promise<DeploymentResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      let result: DeploymentResult;

      switch (options.service) {
        case 'google-play':
          result = await this.deployToGooglePlay(options);
          break;
        case 'app-store':
          result = await this.deployToAppStore(options);
          break;
        case 'firebase-app-distribution':
          result = await this.deployToFirebaseAppDistribution(options);
          break;
        case 'appcenter':
          result = await this.deployToAppCenter(options);
          break;
        default:
          throw new Error(`Unsupported deployment service: ${options.service}`);
      }

      return result;
    } catch (error) {
      console.error('Error deploying app:', error);

      return {
        success: false,
        message: `Deployment failed: ${error}`,
        error: error.message
      };
    }
  }

  private async deployToGooglePlay(options: DeploymentOptions): Promise<DeploymentResult> {
    console.log('Deploying to Google Play...');

    try {
      // Check if fastlane is installed
      try {
        await this.executeCommand('fastlane', ['--version']);
      } catch (error) {
        throw new Error('fastlane is not installed. Please install fastlane to deploy to Google Play.');
      }

      // Create fastlane configuration
      await this.createFastlaneConfig(options);

      // Get release notes
      const releaseNotes = await this.getReleaseNotes(options);

      // Deploy to Google Play
      const args = ['android', 'deploy'];

      if (options.type === 'test') {
        args.push('track:internal');
      } else if (options.type === 'beta') {
        args.push('track:beta');
      } else if (options.type === 'production') {
        args.push('track:production');
      }

      if (releaseNotes) {
        args.push(`changelog:"${releaseNotes}"`);
      }

      await this.executeCommand('fastlane', args);

      return {
        success: true,
        message: 'Successfully deployed to Google Play'
      };
    } catch (error) {
      console.error('Error deploying to Google Play:', error);

      return {
        success: false,
        message: `Failed to deploy to Google Play: ${error}`,
        error: error.message
      };
    }
  }

  private async createFastlaneConfig(options: DeploymentOptions): Promise<void> {
    const fastlaneDir = path.join(process.cwd(), 'fastlane');
    await fs.ensureDir(fastlaneDir);

    const fastfilePath = path.join(fastlaneDir, 'Fastfile');

    if (await fs.pathExists(fastfilePath)) {
      return;
    }

    const fastfileContent = `
default_platform(:android)

platform :android do
  desc "Deploy to Google Play"
  lane :deploy do
    upload_to_play_store(
      track: '${options.type === 'test' ? 'internal' : options.type === 'beta' ? 'beta' : 'production'}',
      release_status: '${options.type === 'test' ? 'draft' : 'completed'}',
      changelog: '${await this.getReleaseNotes(options) || ''}'
    )
  end
end
`;

    await fs.writeFile(fastfilePath, fastfileContent);

    // Create Appfile
    const appfilePath = path.join(fastlaneDir, 'Appfile');

    if (await fs.pathExists(appfilePath)) {
      return;
    }

    const appfileContent = `
json_key_file("${options.credentials?.serviceAccountFile || ''}")

package_name("${this.options.android?.packageName || ''}")
`;

    await fs.writeFile(appfilePath, appfileContent);
  }

  private async deployToAppStore(options: DeploymentOptions): Promise<DeploymentResult> {
    console.log('Deploying to App Store...');

    try {
      // Check if fastlane is installed
      try {
        await this.executeCommand('fastlane', ['--version']);
      } catch (error) {
        throw new Error('fastlane is not installed. Please install fastlane to deploy to App Store.');
      }

      // Create fastlane configuration
      await this.createFastlaneConfig(options);

      // Get release notes
      const releaseNotes = await this.getReleaseNotes(options);

      // Deploy to App Store
      const args = ['ios', 'deploy'];

      if (options.type === 'test') {
        args.push('testflight');
      } else if (options.type === 'beta') {
        args.push('testflight');
      } else if (options.type === 'production') {
        args.push('appstore');
      }

      if (releaseNotes) {
        args.push(`changelog:"${releaseNotes}"`);
      }

      await this.executeCommand('fastlane', args);

      return {
        success: true,
        message: 'Successfully deployed to App Store'
      };
    } catch (error) {
      console.error('Error deploying to App Store:', error);

      return {
        success: false,
        message: `Failed to deploy to App Store: ${error}`,
        error: error.message
      };
    }
  }

  private async deployToFirebaseAppDistribution(options: DeploymentOptions): Promise<DeploymentResult> {
    console.log('Deploying to Firebase App Distribution...');

    try {
      // Check if Firebase CLI is installed
      try {
        await this.executeCommand('firebase', ['--version']);
      } catch (error) {
        throw new Error('Firebase CLI is not installed. Please install Firebase CLI to deploy to Firebase App Distribution.');
      }

      // Login to Firebase if not already logged in
      try {
        await this.executeCommand('firebase', ['projects:list']);
      } catch (error) {
        console.log('Logging in to Firebase...');
        await this.executeCommand('firebase', ['login:ci', '--no-localhost']);
      }

      // Get app ID
      const appId = await this.getFirebaseAppId(options);

      // Get release notes
      const releaseNotes = await this.getReleaseNotes(options);

      // Deploy to Firebase App Distribution
      const args = ['appdistribution:distribute', appId];

      if (options.type === 'test') {
        args.push('--testers', options.testers?.join(',') || '');
      } else if (options.type === 'beta') {
        args.push('--testers', options.testers?.join(',') || '');
        args.push('--release-notes', releaseNotes || '');
      } else if (options.type === 'production') {
        args.push('--release-notes', releaseNotes || '');
      }

      if (options.groups && options.groups.length > 0) {
        args.push('--groups', options.groups.join(','));
      }

      if (options.credentials?.token) {
        args.push('--token', options.credentials.token);
      }

      await this.executeCommand('firebase', args);

      return {
        success: true,
        message: 'Successfully deployed to Firebase App Distribution'
      };
    } catch (error) {
      console.error('Error deploying to Firebase App Distribution:', error);

      return {
        success: false,
        message: `Failed to deploy to Firebase App Distribution: ${error}`,
        error: error.message
      };
    }
  }

  private async getFirebaseAppId(options: DeploymentOptions): Promise<string> {
    // Try to get app ID from firebase.json
    const firebaseConfigPath = path.join(process.cwd(), 'firebase.json');

    if (await fs.pathExists(firebaseConfigPath)) {
      const firebaseConfig = JSON.parse(await fs.readFile(firebaseConfigPath, 'utf8'));

      if (firebaseConfig.appdistribution && firebaseConfig.appdistribution.appId) {
        return firebaseConfig.appdistribution.appId;
      }
    }

    // Try to get app ID from app.json
    const appConfigPath = path.join(process.cwd(), 'app.json');

    if (await fs.pathExists(appConfigPath)) {
      const appConfig = JSON.parse(await fs.readFile(appConfigPath, 'utf8'));

      if (appConfig.expo && appConfig.expo.android && appConfig.expo.android.package) {
        return appConfig.expo.android.package;
      }
    }

    // Try to get app ID from Capacitor config
    const capacitorConfigPath = path.join(process.cwd(), 'capacitor.config.json');

    if (await fs.pathExists(capacitorConfigPath)) {
      const capacitorConfig = JSON.parse(await fs.readFile(capacitorConfigPath, 'utf8'));

      if (capacitorConfig.appId) {
        return capacitorConfig.appId;
      }
    }

    // Try to get app ID from Cordova config
    const cordovaConfigPath = path.join(process.cwd(), 'config.xml');

    if (await fs.pathExists(cordovaConfigPath)) {
      const cordovaConfig = await fs.readFile(cordovaConfigPath, 'utf8');
      const idMatch = cordovaConfig.match(/id="([^"]*)"/);

      if (idMatch) {
        return idMatch[1];
      }
    }

    throw new Error('Could not determine Firebase App ID. Please specify it in firebase.json, app.json, capacitor.config.json, or config.xml.');
  }

  private async deployToAppCenter(options: DeploymentOptions): Promise<DeploymentResult> {
    console.log('Deploying to App Center...');

    try {
      // Check if App Center CLI is installed
      try {
        await this.executeCommand('appcenter', ['--version']);
      } catch (error) {
        throw new Error('App Center CLI is not installed. Please install App Center CLI to deploy to App Center.');
      }

      // Login to App Center if not already logged in
      try {
        await this.executeCommand('appcenter', ['apps', 'list']);
      } catch (error) {
        console.log('Logging in to App Center...');

        if (options.credentials?.token) {
          await this.executeCommand('appcenter', ['login', '--token', options.credentials.token]);
        } else if (options.credentials?.username && options.credentials?.password) {
          await this.executeCommand('appcenter', ['login', '--username', options.credentials.username, '--password', options.credentials.password]);
        } else {
          throw new Error('App Center credentials are required. Please provide token or username and password.');
        }
      }

      // Get app name
      const appName = await this.getAppCenterAppName(options);

      // Get release notes
      const releaseNotes = await this.getReleaseNotes(options);

      // Deploy to App Center
      const args = ['distribute', 'release', '-a', appName, '-f', path.join(this.options.outputDir!, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'), '-g', options.groups?.join(',') || 'Collaborators'];

      if (releaseNotes) {
        args.push('-r', releaseNotes);
      }

      if (options.notify !== false) {
        args.push('--notify');
      }

      await this.executeCommand('appcenter', args);

      return {
        success: true,
        message: 'Successfully deployed to App Center'
      };
    } catch (error) {
      console.error('Error deploying to App Center:', error);

      return {
        success: false,
        message: `Failed to deploy to App Center: ${error}`,
        error: error.message
      };
    }
  }

  private async getAppCenterAppName(options: DeploymentOptions): Promise<string> {
    // Try to get app name from appcenter.json
    const appcenterConfigPath = path.join(process.cwd(), 'appcenter.json');

    if (await fs.pathExists(appcenterConfigPath)) {
      const appcenterConfig = JSON.parse(await fs.readFile(appcenterConfigPath, 'utf8'));

      if (appcenterConfig.apps && appcenterConfig.apps.android) {
        return appcenterConfig.apps.android;
      }
    }

    // Try to get app name from app.json
    const appConfigPath = path.join(process.cwd(), 'app.json');

    if (await fs.pathExists(appConfigPath)) {
      const appConfig = JSON.parse(await fs.readFile(appConfigPath, 'utf8'));

      if (appConfig.expo && appConfig.expo.name) {
        return `${appConfig.expo.name}-Android`;
      }
    }

    // Try to get app name from Capacitor config
    const capacitorConfigPath = path.join(process.cwd(), 'capacitor.config.json');

    if (await fs.pathExists(capacitorConfigPath)) {
      const capacitorConfig = JSON.parse(await fs.readFile(capacitorConfigPath, 'utf8'));

      if (capacitorConfig.appName) {
        return `${capacitorConfig.appName}-Android`;
      }
    }

    // Try to get app name from Cordova config
    const cordovaConfigPath = path.join(process.cwd(), 'config.xml');

    if (await fs.pathExists(cordovaConfigPath)) {
      const cordovaConfig = await fs.readFile(cordovaConfigPath, 'utf8');
      const nameMatch = cordovaConfig.match(/<name>([^<]*)<\/name>/);

      if (nameMatch) {
        return `${nameMatch[1]}-Android`;
      }
    }

    throw new Error('Could not determine App Center app name. Please specify it in appcenter.json, app.json, capacitor.config.json, or config.xml.');
  }

  private async getReleaseNotes(options: DeploymentOptions): Promise<string | null> {
    if (options.releaseNotes) {
      return options.releaseNotes;
    }

    if (options.releaseNotesFile) {
      try {
        return await fs.readFile(options.releaseNotesFile, 'utf8');
      } catch (error) {
        console.error('Error reading release notes file:', error);
      }
    }

    if (options.changelog) {
      return options.changelog;
    }

    if (options.changelogFile) {
      try {
        return await fs.readFile(options.changelogFile, 'utf8');
      } catch (error) {
        console.error('Error reading changelog file:', error);
      }
    }

    return null;
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
