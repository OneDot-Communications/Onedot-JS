/**
 * ONEDOT-JS Performance Package
 *
 * This package provides performance optimization and monitoring tools for the ONEDOT-JS framework,
 * including metrics collection, optimization strategies, and profiling capabilities.
 */

// Core exports
export * from './src';

// Module-specific exports
export { MetricsCollector } from './src/metrics';
export { PerformanceOptimizer } from './src/optimizer';
export { Profiler } from './src/profiling';

// Re-export commonly used types and interfaces
export type {
  MetricData,
  MetricOptions, OptimizationResult, OptimizationStrategy, PerformanceReport, ProfilingData,
  ProfilingOptions
} from './src/types';

// Default export for the performance package
export default {
  // Performance monitoring
  metrics: require('./src/metrics').MetricsCollector,

  // Performance optimization
  optimizer: require('./src/optimizer').PerformanceOptimizer,

  // Performance profiling
  profiler: require('./src/profiling').Profiler,

  // Version information
  version: require('./package.json').version
};
