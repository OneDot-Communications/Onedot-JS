import * as fs from 'fs-extra';
import * as path from 'path';
import { MobileAppOptions } from '../index';

export interface CommonBuildOptions {
  platform?: 'android' | 'ios';
  environment?: 'development' | 'production' | 'staging';
  sourceMap?: boolean;
  minify?: boolean;
  optimize?: boolean;
}

export interface CommonRunOptions {
  platform?: 'android' | 'ios';
  devServer?: boolean;
  hotReload?: boolean;
  liveReload?: boolean;
}

export interface CommonTestOptions {
  platform?: 'android' | 'ios';
  testRunner?: 'jest' | 'mocha' | 'jasmine';
  coverage?: boolean;
  watch?: boolean;
}

export class CommonPlatform {
  private options: MobileAppOptions;
  private initialized = false;

  constructor(options: MobileAppOptions) {
    this.options = options;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create output directory if it doesn't exist
      await fs.ensureDir(this.options.outputDir!);

      // Create assets directory if it doesn't exist
      await fs.ensureDir(this.options.assetsDir!);

      // Copy common assets
      await this.copyCommonAssets();

      // Generate common configuration files
      await this.generateCommonConfigFiles();

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing common platform:', error);
      throw error;
    }
  }

  private async copyCommonAssets(): Promise<void> {
    // Copy assets from source to output directory
    const assetsSourceDir = path.join(process.cwd(), this.options.assetsDir!);
    const assetsOutputDir = path.join(this.options.outputDir!, 'assets');

    if (await fs.pathExists(assetsSourceDir)) {
      await fs.copy(assetsSourceDir, assetsOutputDir);
    }
  }

  private async generateCommonConfigFiles(): Promise<void> {
    // Generate babel.config.js
    await this.generateBabelConfig();

    // Generate metro.config.js (for React Native)
    await this.generateMetroConfig();

    // Generate webpack.config.js (for Cordova/Capacitor)
    await this.generateWebpackConfig();

    // Generate tsconfig.json
    await this.generateTsConfig();

    // Generate .eslintrc.js
    await this.generateEslintConfig();

    // Generate .prettierrc
    await this.generatePrettierConfig();
  }

  private async generateBabelConfig(): Promise<void> {
    const babelConfigPath = path.join(process.cwd(), 'babel.config.js');

    if (await fs.pathExists(babelConfigPath)) {
      return;
    }

    const babelConfig = `
module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-transform-runtime'
  ]
};
`;

    await fs.writeFile(babelConfigPath, babelConfig);
  }

  private async generateMetroConfig(): Promise<void> {
    const metroConfigPath = path.join(process.cwd(), 'metro.config.js');

    if (await fs.pathExists(metroConfigPath)) {
      return;
    }

    const metroConfig = `
const { getDefaultConfig } = require('@onedot/mobile/metro');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts }
  } = await getDefaultConfig();

  return {
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: false
        }
      })
    },
    resolver: {
      sourceExts: [...sourceExts, 'cjs'],
      assetExts: [...assetExts, 'cjs']
    }
  };
})();
`;

    await fs.writeFile(metroConfigPath, metroConfig);
  }

  private async generateWebpackConfig(): Promise<void> {
    const webpackConfigPath = path.join(process.cwd(), 'webpack.config.js');

    if (await fs.pathExists(webpackConfigPath)) {
      return;
    }

    const webpackConfig = `
const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, '${this.options.entryPoint}'),
  output: {
    path: path.resolve(__dirname, '${this.options.outputDir}'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  module: {
    rules: [
      {
        test: /\\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\\.(png|jpe?g|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'assets/images'
            }
          }
        ]
      },
      {
        test: /\\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'assets/fonts'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      filename: 'index.html'
    })
  ],
  devServer: {
    port: ${this.options.devServer?.port || 8080},
    host: '${this.options.devServer?.host || 'localhost'}',
    hot: true,
    open: true
  }
};
`;

    await fs.writeFile(webpackConfigPath, webpackConfig);
  }

  private async generateTsConfig(): Promise<void> {
    const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');

    if (await fs.pathExists(tsConfigPath)) {
      return;
    }

    const tsConfig = {
      compilerOptions: {
        target: 'esnext',
        module: 'esnext',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        jsx: 'react-jsx',
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        baseUrl: '.',
        paths: {
          '@/*': ['src/*']
        }
      },
      include: ['src'],
      exclude: ['node_modules', 'dist']
    };

    await fs.writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2));
  }

  private async generateEslintConfig(): Promise<void> {
    const eslintConfigPath = path.join(process.cwd(), '.eslintrc.js');

    if (await fs.pathExists(eslintConfigPath)) {
      return;
    }

    const eslintConfig = `
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    '@typescript-eslint',
    'react'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
`;

    await fs.writeFile(eslintConfigPath, eslintConfig);
  }

  private async generatePrettierConfig(): Promise<void> {
    const prettierConfigPath = path.join(process.cwd(), '.prettierrc');

    if (await fs.pathExists(prettierConfigPath)) {
      return;
    }

    const prettierConfig = {
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      printWidth: 100,
      tabWidth: 2,
      useTabs: false
    };

    await fs.writeFile(prettierConfigPath, JSON.stringify(prettierConfig, null, 2));
  }

  public async build(options: CommonBuildOptions = {}): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const buildOptions: CommonBuildOptions = {
        platform: 'android',
        environment: 'production',
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
      console.error('Error building common platform:', error);
      throw error;
    }
  }

  private async buildReactNative(options: CommonBuildOptions): Promise<void> {
    // React Native build is handled by the platform-specific build methods
    console.log('Building React Native bundle...');
  }

  private async buildCordova(options: CommonBuildOptions): Promise<void> {
    // Cordova build is handled by the platform-specific build methods
    console.log('Building Cordova bundle...');
  }

  private async buildCapacitor(options: CommonBuildOptions): Promise<void> {
    // Capacitor build is handled by the platform-specific build methods
    console.log('Building Capacitor bundle...');
  }

  private async buildExpo(options: CommonBuildOptions): Promise<void> {
    // Expo build is handled by the platform-specific build methods
    console.log('Building Expo bundle...');
  }

  public async run(options: CommonRunOptions = {}): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const runOptions: CommonRunOptions = {
        platform: 'android',
        devServer: true,
        hotReload: true,
        liveReload: true,
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
      console.error('Error running common platform:', error);
      throw error;
    }
  }

  private async runReactNative(options: CommonRunOptions): Promise<void> {
    // React Native run is handled by the platform-specific run methods
    console.log('Running React Native app...');
  }

  private async runCordova(options: CommonRunOptions): Promise<void> {
    // Cordova run is handled by the platform-specific run methods
    console.log('Running Cordova app...');
  }

  private async runCapacitor(options: CommonRunOptions): Promise<void> {
    // Capacitor run is handled by the platform-specific run methods
    console.log('Running Capacitor app...');
  }

  private async runExpo(options: CommonRunOptions): Promise<void> {
    // Expo run is handled by the platform-specific run methods
    console.log('Running Expo app...');
  }

  public async test(options: CommonTestOptions = {}): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const testOptions: CommonTestOptions = {
        platform: 'android',
        testRunner: 'jest',
        coverage: false,
        watch: false,
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
      console.error('Error testing common platform:', error);
      throw error;
    }
  }

  private async testReactNative(options: CommonTestOptions): Promise<void> {
    // React Native test is handled by the platform-specific test methods
    console.log('Testing React Native app...');
  }

  private async testCordova(options: CommonTestOptions): Promise<void> {
    // Cordova test is handled by the platform-specific test methods
    console.log('Testing Cordova app...');
  }

  private async testCapacitor(options: CommonTestOptions): Promise<void> {
    // Capacitor test is handled by the platform-specific test methods
    console.log('Testing Capacitor app...');
  }

  private async testExpo(options: CommonTestOptions): Promise<void> {
    // Expo test is handled by the platform-specific test methods
    console.log('Testing Expo app...');
  }
}
