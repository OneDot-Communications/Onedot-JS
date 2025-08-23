/**
 * ONEDOT-JS Native Package
 *
 * This package provides native platform integration for the ONEDOT-JS framework,
 * enabling cross-platform development for web, mobile, and desktop applications.
 */

// Core exports
export * from './src';

// Platform-specific exports
export { AndroidNative } from './src/android';
export { IOSNative } from './src/ios';
export { LinuxNative } from './src/linux';
export { MacOSNative } from './src/macos';
export { WindowsNative } from './src/windows';

// Re-export commonly used types and interfaces
export type {
  NativeAnimationConfig, NativeBridge, NativeComponent, NativeEvent, NativeLayoutMetrics, NativeModule, NativePlatform,
  NativeWidget
} from './src/types';

// Default export for the native package
export default {
  // Platform detection
  getPlatform: () => require('./src/platform').getPlatform(),

  // Platform-specific implementations
  Windows: require('./src/windows').WindowsNative,
  MacOS: require('./src/macos').MacOSNative,
  Linux: require('./src/linux').LinuxNative,
  IOS: require('./src/ios').IOSNative,
  Android: require('./src/android').AndroidNative,

  // Common native utilities
  utils: require('./src/utils'),

  // Version information
  version: require('./package.json').version
};
