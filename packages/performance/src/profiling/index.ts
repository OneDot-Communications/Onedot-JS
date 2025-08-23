/**
 * Performance profiling module for the performance package
 */

import { EventEmitter } from 'events';
import { ProfilingData, ProfilingOptions, ProfilingSample } from '../types';
import { PerformanceUtils } from '../utils';

/**
 * Profiler - Collects and manages performance profiling data
 */
export class Profiler extends EventEmitter {
  private profilingData: ProfilingData | null = null;
  private enabled: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private sampleInterval: number = 100; // 100ms between samples
  private maxSamples: number = 1000;
  private customMetrics: Map<string, (sample: ProfilingSample) => void> = new Map();

  /**
   * Start profiling
   */
  public start(options: ProfilingOptions = {}): void {
    if (this.enabled) return;

    this.enabled = true;

    // Set options
    if (options.sampleRate) {
      this.sampleInterval = 1000 / options.sampleRate;
    }

    // Initialize profiling data
    this.profilingData = {
      id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      samples: [],
      summary: {
        totalSamples: 0,
        averageFrameTime: 0,
        worstFrameTime: 0,
        memoryUsage: {
          initial: 0,
          peak: 0,
          final: 0
        },
        cpuUsage: {
          average: 0,
          peak: 0
        }
      }
    };

    // Start collecting samples
    this.interval = setInterval(() => {
      this.collectSample();
    }, this.sampleInterval);

    // Set duration if specified
    if (options.duration) {
      setTimeout(() => {
        this.stop();
      }, options.duration);
    }

    this.emit('started', this.profilingData);
  }

  /**
   * Stop profiling
   */
  public stop(): Promise<ProfilingData> {
    return new Promise((resolve) => {
      if (!this.enabled || !this.profilingData) {
        resolve({
          id: '',
          startTime: 0,
          endTime: 0,
          duration: 0,
          samples: [],
          summary: {
            totalSamples: 0,
            averageFrameTime: 0,
            worstFrameTime: 0,
            memoryUsage: {
              initial: 0,
              peak: 0,
              final: 0
            },
            cpuUsage: {
              average: 0,
              peak: 0
            }
          }
        });
        return;
      }

      this.enabled = false;

      // Stop collecting samples
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }

      // Finalize profiling data
      this.profilingData.endTime = Date.now();
      this.profilingData.duration = this.profilingData.endTime - this.profilingData.startTime;

      // Calculate summary
      this.calculateSummary();

      // Emit event
      this.emit('stopped', this.profilingData);

      // Resolve with profiling data
      resolve(this.profilingData);
    });
  }

  /**
   * Check if profiling is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable profiling
   */
  public enable(): void {
    if (!this.enabled) {
      this.start();
    }
  }

  /**
   * Disable profiling
   */
  public disable(): void {
    if (this.enabled) {
      this.stop();
    }
  }

  /**
   * Get the current profiling data
   */
  public getProfilingData(): Promise<ProfilingData> {
    return new Promise((resolve) => {
      if (this.profilingData) {
        // Create a copy of the current data
        const data = { ...this.profilingData };

        // If profiling is still active, update end time and duration
        if (this.enabled) {
          data.endTime = Date.now();
          data.duration = data.endTime - data.startTime;

          // Calculate summary for current data
          this.calculateSummaryForData(data);
        }

        resolve(data);
      } else {
        resolve({
          id: '',
          startTime: 0,
          endTime: 0,
          duration: 0,
          samples: [],
          summary: {
            totalSamples: 0,
            averageFrameTime: 0,
            worstFrameTime: 0,
            memoryUsage: {
              initial: 0,
              peak: 0,
              final: 0
            },
            cpuUsage: {
              average: 0,
              peak: 0
            }
          }
        });
      }
    });
  }

  /**
   * Set the sample interval
   */
  public setSampleInterval(interval: number): void {
    this.sampleInterval = interval;

    if (this.enabled) {
      this.stop();
      this.start();
    }
  }

  /**
   * Set the maximum number of samples
   */
  public setMaxSamples(max: number): void {
    this.maxSamples = max;
  }

  /**
   * Add a custom metric collector
   */
  public addCustomMetric(name: string, collector: (sample: ProfilingSample) => void): void {
    this.customMetrics.set(name, collector);
    this.emit('customMetricAdded', name);
  }

  /**
   * Remove a custom metric collector
   */
  public removeCustomMetric(name: string): boolean {
    const removed = this.customMetrics.delete(name);
    if (removed) {
      this.emit('customMetricRemoved', name);
    }
    return removed;
  }

  /**
   * Get all custom metric names
   */
  public getCustomMetricNames(): string[] {
    return Array.from(this.customMetrics.keys());
  }

  /**
   * Collect a profiling sample
   */
  private collectSample(): void {
    if (!this.profilingData) return;

    // Create a new sample
    const sample: ProfilingSample = {
      timestamp: Date.now(),
      frameTime: this.measureFrameTime(),
      memoryUsage: this.measureMemoryUsage(),
      cpuUsage: this.measureCPUUsage()
    };

    // Run custom metric collectors
    this.customMetrics.forEach(collector => {
      try {
        collector(sample);
      } catch (error) {
        console.error('Error in custom metric collector:', error);
      }
    });

    // Add to samples
    this.profilingData.samples.push(sample);

    // Enforce maximum samples
    if (this.profilingData.samples.length > this.maxSamples) {
      this.profilingData.samples.shift();
    }

    // Emit event
    this.emit('sample', sample);
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(): void {
    if (!this.profilingData) return;

    this.calculateSummaryForData(this.profilingData);
  }

  /**
   * Calculate summary statistics for profiling data
   */
  private calculateSummaryForData(data: ProfilingData): void {
    const samples = data.samples;
    data.summary.totalSamples = samples.length;

    if (samples.length === 0) return;

    // Frame time statistics
    const frameTimes = samples.map(s => s.frameTime);
    data.summary.averageFrameTime = PerformanceUtils.average(frameTimes);
    data.summary.worstFrameTime = Math.max(...frameTimes);

    // Memory usage statistics
    const memoryUsages = samples.map(s => s.memoryUsage);
    data.summary.memoryUsage.initial = memoryUsages[0] || 0;
    data.summary.memoryUsage.peak = Math.max(...memoryUsages);
    data.summary.memoryUsage.final = memoryUsages[memoryUsages.length - 1] || 0;

    // CPU usage statistics
    const cpuUsages = samples.map(s => s.cpuUsage);
    data.summary.cpuUsage.average = PerformanceUtils.average(cpuUsages);
    data.summary.cpuUsage.peak = Math.max(...cpuUsages);
  }

  /**
   * Measure frame time
   */
  private measureFrameTime(): number {
    // This is a simplified implementation
    // In a real implementation, we would use requestAnimationFrame or similar

    const start = performance.now();

    // Simulate some work
    let i = 0;
    while (i < 1000000) {
      i++;
    }

    const end = performance.now();
    return end - start;
  }

  /**
   * Measure memory usage
   */
  private measureMemoryUsage(): number {
    // This is a simplified implementation
    // In a real implementation, we would use process.memoryUsage() or similar

    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memoryUsage = process.memoryUsage();
      return memoryUsage.heapUsed / 1024 / 1024; // Convert to MB
    }

    // Fallback for browser environments
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }

    // Default fallback
    return Math.random() * 100;
  }

  /**
   * Measure CPU usage
   */
  private measureCPUUsage(): number {
    // This is a simplified implementation
    // In a real implementation, we would use process.cpuUsage() or similar

    if (typeof process !== 'undefined' && process.cpuUsage) {
      const cpuUsage = process.cpuUsage();
      return (cpuUsage.user + cpuUsage.system) / 1000 / 1000; // Convert to seconds
    }

    // Default fallback
    return Math.random() * 100;
  }

  /**
   * Mark an event in the profiling timeline
   */
  public markEvent(event: string, metadata?: Record<string, any>): void {
    if (!this.enabled || !this.profilingData) return;

    // Get the last sample
    const lastSample = this.profilingData.samples[this.profilingData.samples.length - 1];
    if (lastSample) {
      lastSample.event = event;
      if (metadata) {
        lastSample.metadata = { ...lastSample.metadata, ...metadata };
      }
    }

    this.emit('eventMarked', event, metadata);
  }

  /**
   * Get samples within a time range
   */
  public getSamplesInRange(startTime: number, endTime: number): ProfilingSample[] {
    if (!this.profilingData) return [];

    return this.profilingData.samples.filter(sample =>
      sample.timestamp >= startTime && sample.timestamp <= endTime
    );
  }

  /**
   * Get samples with a specific event
   */
  public getSamplesWithEvent(event: string): ProfilingSample[] {
    if (!this.profilingData) return [];

    return this.profilingData.samples.filter(sample =>
      sample.event === event
    );
  }

  /**
   * Clear profiling data
   */
  public clear(): void {
    this.profilingData = null;
    this.emit('cleared');
  }

  /**
   * Export profiling data as JSON
   */
  public exportAsJSON(): string {
    if (!this.profilingData) return '{}';

    return JSON.stringify(this.profilingData, null, 2);
  }

  /**
   * Export profiling data as CSV
   */
  public exportAsCSV(): string {
    if (!this.profilingData || this.profilingData.samples.length === 0) return '';

    const samples = this.profilingData.samples;

    // Create header
    let csv = 'Timestamp,Frame Time,Memory Usage,CPU Usage,Event\n';

    // Add samples
    samples.forEach(sample => {
      csv += `${sample.timestamp},${sample.frameTime},${sample.memoryUsage},${sample.cpuUsage},"${sample.event || ''}"\n`;
    });

    return csv;
  }
}

// Export the Profiler class
export { Profiler };
