/**
 * Utility functions for the performance package
 */

import { MetricData, PerformanceAlert, PerformanceThreshold } from './types';

/**
 * Performance utility functions
 */
export const PerformanceUtils = {
  /**
   * Calculate the average of an array of numbers
   */
  average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  },

  /**
   * Calculate the median of an array of numbers
   */
  median(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  },

  /**
   * Calculate the percentile of an array of numbers
   */
  percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;

    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  },

  /**
   * Calculate the standard deviation of an array of numbers
   */
  standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const avg = this.average(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.average(squareDiffs);

    return Math.sqrt(avgSquareDiff);
  },

  /**
   * Format bytes to a human-readable string
   */
  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Format milliseconds to a human-readable string
   */
  formatMilliseconds(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = (ms % 60000) / 1000;
      return `${minutes}m ${seconds.toFixed(2)}s`;
    }
  },

  /**
   * Check if a value meets a threshold condition
   */
  checkThreshold(value: number, threshold: PerformanceThreshold): boolean {
    switch (threshold.operator) {
      case 'gt':
        return value > threshold.value;
      case 'lt':
        return value < threshold.value;
      case 'eq':
        return value === threshold.value;
      case 'gte':
        return value >= threshold.value;
      case 'lte':
        return value <= threshold.value;
      default:
        return false;
    }
  },

  /**
   * Create a performance alert
   */
  createAlert(threshold: PerformanceThreshold, actualValue: number): PerformanceAlert {
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      threshold,
      actualValue,
      timestamp: Date.now(),
      acknowledged: false
    };
  },

  /**
   * Calculate a performance score based on metrics
   */
  calculatePerformanceScore(metrics: MetricData[]): number {
    let score = 100; // Start with a perfect score

    metrics.forEach(metric => {
      switch (metric.name) {
        case 'frameTime':
          if (metric.value > 16) {
            score -= Math.min(20, (metric.value - 16) / 2);
          }
          break;
        case 'memoryUsage':
          if (metric.value > 100) {
            score -= Math.min(15, (metric.value - 100) / 10);
          }
          break;
        case 'cpuUsage':
          if (metric.value > 50) {
            score -= Math.min(15, (metric.value - 50) / 5);
          }
          break;
        case 'bundleSize':
          if (metric.value > 1000) {
            score -= Math.min(10, (metric.value - 1000) / 100);
          }
          break;
        case 'loadTime':
          if (metric.value > 3000) {
            score -= Math.min(20, (metric.value - 3000) / 200);
          }
          break;
      }
    });

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  },

  /**
   * Debounce a function
   */
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  },

  /**
   * Throttle a function
   */
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }
};

// Export all utility modules

