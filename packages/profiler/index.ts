/**
 * ONEDOT-JS Profiler Package
 *
 * This package provides advanced performance profiling tools for the ONEDOT-JS framework,
 * enabling detailed analysis of application performance and resource usage.
 */

// Core exports
export * from './src';

// Re-export commonly used types and interfaces
export type {
  ProfilerConfig, ProfilerEvent, ProfilerMetric, ProfilerNode, ProfilerReport, ProfilerSession, ProfilerSnapshot,
  ProfilerTimeline
} from './src/types';

// Default export for the profiler package
export default {
  // Profiler instance
  Profiler: require('./src').Profiler,

  // Profiling utilities
  utils: require('./src/utils'),

  // Version information
  version: require('./package.json').version
};
