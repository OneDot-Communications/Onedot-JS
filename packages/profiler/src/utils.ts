/**
 * Utility functions for the profiler package
 */

import { ProfilerEvent, ProfilerMetric, ProfilerSnapshot } from './types';

/**
 * Profiler utility functions
 */
export const ProfilerUtils = {
  /**
   * Generate a unique ID
   */
  generateId(prefix: string = 'id'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

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
   * Get memory usage
   */
  getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      return {
        heapUsed: memory.heapUsed / 1024 / 1024, // MB
        heapTotal: memory.heapTotal / 1024 / 1024, // MB
        external: memory.external / 1024 / 1024, // MB
        rss: memory.rss / 1024 / 1024 // MB
      };
    }

    // Fallback for browser environments
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        heapUsed: memory.usedJSHeapSize / 1024 / 1024, // MB
        heapTotal: memory.totalJSHeapSize / 1024 / 1024, // MB
        external: 0, // Not available in browser
        rss: 0 // Not available in browser
      };
    }

    // Default fallback
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0
    };
  },

  /**
   * Get CPU usage
   */
  getCPUUsage(): {
    user: number;
    system: number;
  } {
    if (typeof process !== 'undefined' && process.cpuUsage) {
      const cpu = process.cpuUsage();
      return {
        user: cpu.user / 1000 / 1000, // seconds
        system: cpu.system / 1000 / 1000 // seconds
      };
    }

    // Default fallback
    return {
      user: 0,
      system: 0
    };
  },

  /**
   * Measure event loop delay
   */
  measureEventLoopDelay(): number {
    const start = Date.now();

    setImmediate(() => {
      const delay = Date.now() - start;
      return delay;
    });

    // Fallback if setImmediate is not available
    return 0;
  },

  /**
   * Measure frame time
   */
  measureFrameTime(): number {
    if (typeof requestAnimationFrame === 'undefined') {
      return 0;
    }

    return new Promise<number>((resolve) => {
      const start = performance.now();

      requestAnimationFrame(() => {
        const end = performance.now();
        resolve(end - start);
      });
    });
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
      return `${ms.toFixed(2)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = (ms % 60000) / 1000;
      return `${minutes}m ${seconds.toFixed(2)}s`;
    }
  },

  /**
   * Format a timestamp to a readable date string
   */
  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toISOString();
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
  },

  /**
   * Group metrics by name
   */
  groupMetricsByName(metrics: ProfilerMetric[]): Map<string, ProfilerMetric[]> {
    const grouped = new Map<string, ProfilerMetric[]>();

    metrics.forEach(metric => {
      if (!grouped.has(metric.name)) {
        grouped.set(metric.name, []);
      }

      grouped.get(metric.name)!.push(metric);
    });

    return grouped;
  },

  /**
   * Group events by type
   */
  groupEventsByType(events: ProfilerEvent[]): Map<string, ProfilerEvent[]> {
    const grouped = new Map<string, ProfilerEvent[]>();

    events.forEach(event => {
      if (!grouped.has(event.type)) {
        grouped.set(event.type, []);
      }

      grouped.get(event.type)!.push(event);
    });

    return grouped;
  },

  /**
   * Find metrics in a time range
   */
  findMetricsInRange(metrics: ProfilerMetric[], startTime: number, endTime: number): ProfilerMetric[] {
    return metrics.filter(metric =>
      metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  },

  /**
   * Find events in a time range
   */
  findEventsInRange(events: ProfilerEvent[], startTime: number, endTime: number): ProfilerEvent[] {
    return events.filter(event =>
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  },

  /**
   * Find snapshots in a time range
   */
  findSnapshotsInRange(snapshots: ProfilerSnapshot[], startTime: number, endTime: number): ProfilerSnapshot[] {
    return snapshots.filter(snapshot =>
      snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
    );
  },

  /**
   * Calculate the duration between two timestamps
   */
  calculateDuration(startTime: number, endTime: number): number {
    return endTime - startTime;
  },

  /**
   * Calculate the percentage change between two values
   */
  calculatePercentageChange(initial: number, final: number): number {
    if (initial === 0) return 0;
    return ((final - initial) / initial) * 100;
  }
};

// Export all utility modules

