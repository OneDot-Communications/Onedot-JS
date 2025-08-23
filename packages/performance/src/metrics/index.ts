/**
 * Metrics collection module for the performance package
 */

import { EventEmitter } from 'events';
import { MetricData, MetricOptions, PerformanceAlert, PerformanceThreshold } from '../types';
import { PerformanceUtils } from '../utils';

/**
 * MetricsCollector - Collects and manages performance metrics
 */
export class MetricsCollector extends EventEmitter {
  private metrics: Map<string, MetricData[]> = new Map();
  private thresholds: Map<string, PerformanceThreshold[]> = new Map();
  private alerts: PerformanceAlert[] = [];
  private interval: NodeJS.Timeout | null = null;
  private collectionInterval: number = 1000; // 1 second
  private enabled: boolean = false;
  private maxSamplesPerMetric: number = 100;

  /**
   * Start collecting metrics
   */
  public start(): void {
    if (this.enabled) return;

    this.enabled = true;
    this.interval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.collectionInterval);

    this.emit('started');
  }

  /**
   * Stop collecting metrics
   */
  public stop(): void {
    if (!this.enabled) return;

    this.enabled = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.emit('stopped');
  }

  /**
   * Check if metrics collection is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set the collection interval
   */
  public setCollectionInterval(interval: number): void {
    this.collectionInterval = interval;

    if (this.enabled) {
      this.stop();
      this.start();
    }
  }

  /**
   * Set the maximum number of samples per metric
   */
  public setMaxSamplesPerMetric(max: number): void {
    this.maxSamplesPerMetric = max;
  }

  /**
   * Collect a metric
   */
  public collect(name: string, value: number, options: MetricOptions = {}): void {
    if (!this.enabled) return;

    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags: options.tags || {},
      metadata: options.metadata || {}
    };

    // Add to metrics collection
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricList = this.metrics.get(name)!;
    metricList.push(metric);

    // Enforce maximum samples
    if (metricList.length > this.maxSamplesPerMetric) {
      metricList.shift();
    }

    // Check thresholds
    this.checkThresholds(name, value);

    // Emit event
    this.emit('metric', metric);
  }

  /**
   * Get metrics for a specific name
   */
  public getMetrics(name: string): MetricData[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): Map<string, MetricData[]> {
    return new Map(this.metrics);
  }

  /**
   * Get aggregated metrics
   */
  public getAggregatedMetrics(): Record<string, {
    count: number;
    min: number;
    max: number;
    avg: number;
    median: number;
    p95: number;
    p99: number;
    stdDev: number;
  }> {
    const result: Record<string, any> = {};

    this.metrics.forEach((metricList, name) => {
      if (metricList.length === 0) return;

      const values = metricList.map(m => m.value);

      result[name] = {
        count: metricList.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: PerformanceUtils.average(values),
        median: PerformanceUtils.median(values),
        p95: PerformanceUtils.percentile(values, 95),
        p99: PerformanceUtils.percentile(values, 99),
        stdDev: PerformanceUtils.standardDeviation(values)
      };
    });

    return result;
  }

  /**
   * Get metrics within a time range
   */
  public getMetricsInRange(name: string, startTime: number, endTime: number): MetricData[] {
    const metricList = this.metrics.get(name) || [];
    return metricList.filter(metric =>
      metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Clear metrics for a specific name
   */
  public clearMetrics(name: string): void {
    this.metrics.delete(name);
    this.emit('cleared', name);
  }

  /**
   * Clear all metrics
   */
  public clearAllMetrics(): void {
    this.metrics.clear();
    this.emit('clearedAll');
  }

  /**
   * Add a performance threshold
   */
  public addThreshold(metricName: string, threshold: PerformanceThreshold): void {
    if (!this.thresholds.has(metricName)) {
      this.thresholds.set(metricName, []);
    }

    this.thresholds.get(metricName)!.push(threshold);
    this.emit('thresholdAdded', metricName, threshold);
  }

  /**
   * Remove a performance threshold
   */
  public removeThreshold(metricName: string, thresholdId: string): boolean {
    const thresholdList = this.thresholds.get(metricName);
    if (!thresholdList) return false;

    const index = thresholdList.findIndex(t => t.metric === thresholdId);
    if (index === -1) return false;

    thresholdList.splice(index, 1);

    if (thresholdList.length === 0) {
      this.thresholds.delete(metricName);
    }

    this.emit('thresholdRemoved', metricName, thresholdId);
    return true;
  }

  /**
   * Get thresholds for a metric
   */
  public getThresholds(metricName: string): PerformanceThreshold[] {
    return this.thresholds.get(metricName) || [];
  }

  /**
   * Get all thresholds
   */
  public getAllThresholds(): Map<string, PerformanceThreshold[]> {
    return new Map(this.thresholds);
  }

  /**
   * Get alerts
   */
  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Get unacknowledged alerts
   */
  public getUnacknowledgedAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    this.emit('alertAcknowledged', alert);
    return true;
  }

  /**
   * Clear alerts
   */
  public clearAlerts(): void {
    this.alerts = [];
    this.emit('alertsCleared');
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    // Memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memoryUsage = process.memoryUsage();
      this.collect('memoryUsage', memoryUsage.heapUsed / 1024 / 1024, {
        metadata: {
          unit: 'MB',
          heapTotal: memoryUsage.heapTotal / 1024 / 1024,
          external: memoryUsage.external / 1024 / 1024,
          rss: memoryUsage.rss / 1024 / 1024
        }
      });
    }

    // CPU usage (simplified)
    if (typeof process !== 'undefined' && process.cpuUsage) {
      const cpuUsage = process.cpuUsage();
      this.collect('cpuUsage', cpuUsage.user / 1000 / 1000, {
        metadata: {
          unit: 'ms',
          system: cpuUsage.system / 1000 / 1000
        }
      });
    }

    // Event loop delay
    const start = Date.now();
    setImmediate(() => {
      const delay = Date.now() - start;
      this.collect('eventLoopDelay', delay, {
        metadata: {
          unit: 'ms'
        }
      });
    });
  }

  /**
   * Check thresholds for a metric
   */
  private checkThresholds(metricName: string, value: number): void {
    const thresholdList = this.thresholds.get(metricName);
    if (!thresholdList) return;

    thresholdList.forEach(threshold => {
      if (PerformanceUtils.checkThreshold(value, threshold)) {
        const alert = PerformanceUtils.createAlert(threshold, value);
        this.alerts.push(alert);
        this.emit('alert', alert);
      }
    });
  }
}

// Export the MetricsCollector class
export { MetricsCollector };
