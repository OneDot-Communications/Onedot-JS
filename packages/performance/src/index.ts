/**
 * ONEDOT-JS Performance Core Implementation
 *
 * This module provides the core functionality for performance optimization and monitoring,
 * including metrics collection, optimization strategies, and profiling capabilities.
 */

// Import modules
import { MetricsCollector } from './metrics';
import { PerformanceOptimizer } from './optimizer';
import { Profiler } from './profiling';

// Import types
import {
  MetricOptions,
  OptimizationResult,
  PerformanceReport,
  ProfilingData,
  ProfilingOptions
} from './types';

/**
 * PerformanceManager - Manages all performance-related operations
 */
export class PerformanceManager {
  private static instance: PerformanceManager;
  private metricsCollector: MetricsCollector;
  private optimizer: PerformanceOptimizer;
  private profiler: Profiler;
  private enabled: boolean = true;

  private constructor() {
    this.metricsCollector = new MetricsCollector();
    this.optimizer = new PerformanceOptimizer();
    this.profiler = new Profiler();
  }

  /**
   * Get the singleton instance of PerformanceManager
   */
  public static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  /**
   * Enable or disable performance monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.metricsCollector.start();
      this.profiler.enable();
    } else {
      this.metricsCollector.stop();
      this.profiler.disable();
    }
  }

  /**
   * Check if performance monitoring is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the metrics collector
   */
  public getMetricsCollector(): MetricsCollector {
    return this.metricsCollector;
  }

  /**
   * Get the optimizer
   */
  public getOptimizer(): PerformanceOptimizer {
    return this.optimizer;
  }

  /**
   * Get the profiler
   */
  public getProfiler(): Profiler {
    return this.profiler;
  }

  /**
   * Generate a comprehensive performance report
   */
  public generateReport(): Promise<PerformanceReport> {
    return new Promise(async (resolve) => {
      const metrics = await this.metricsCollector.getMetrics();
      const optimizations = await this.optimizer.getOptimizations();
      const profiling = await this.profiler.getProfilingData();

      resolve({
        timestamp: Date.now(),
        metrics,
        optimizations,
        profiling,
        summary: {
          totalMetrics: metrics.length,
          activeOptimizations: optimizations.filter(opt => opt.active).length,
          profilingDuration: profiling.duration
        }
      });
    });
  }

  /**
   * Apply all recommended optimizations
   */
  public applyOptimizations(): Promise<OptimizationResult[]> {
    return this.optimizer.applyAllOptimizations();
  }

  /**
   * Start a profiling session
   */
  public startProfiling(options?: ProfilingOptions): void {
    this.profiler.start(options);
  }

  /**
   * Stop the current profiling session
   */
  public stopProfiling(): Promise<ProfilingData> {
    return this.profiler.stop();
  }

  /**
   * Collect a specific metric
   */
  public collectMetric(name: string, value: number, options?: MetricOptions): void {
    if (this.enabled) {
      this.metricsCollector.collect(name, value, options);
    }
  }

  /**
   * Get the current performance score
   */
  public getPerformanceScore(): Promise<number> {
    return new Promise(async (resolve) => {
      const metrics = await this.metricsCollector.getMetrics();
      const optimizations = await this.optimizer.getOptimizations();

      // Calculate a performance score based on metrics and optimizations
      let score = 100; // Start with a perfect score

      // Deduct points for poor metrics
      metrics.forEach(metric => {
        if (metric.name === 'frameTime' && metric.value > 16) {
          score -= Math.min(20, (metric.value - 16) / 2);
        }
        if (metric.name === 'memoryUsage' && metric.value > 100) {
          score -= Math.min(15, (metric.value - 100) / 10);
        }
        if (metric.name === 'cpuUsage' && metric.value > 50) {
          score -= Math.min(15, (metric.value - 50) / 5);
        }
      });

      // Add points for active optimizations
      optimizations.forEach(opt => {
        if (opt.active) {
          score += opt.impact * 5;
        }
      });

      // Ensure score is between 0 and 100
      score = Math.max(0, Math.min(100, score));

      resolve(Math.round(score));
    });
  }
}

// Export the PerformanceManager class
export { PerformanceManager };

// Export utility functions
  export * from './utils';

// Export types
export * from './types';

// Export a default instance of the PerformanceManager
export default PerformanceManager.getInstance();
