/**
 * ONEDOT-JS Profiler Core Implementation
 *
 * This module provides the core functionality for performance profiling,
 * including session management, metrics collection, and report generation.
 */

import { PerformanceManager } from '@onedot/performance';
import { EventEmitter } from 'events';

// Import types
import {
  ProfilerConfig,
  ProfilerEvent,
  ProfilerMetric,
  ProfilerNode,
  ProfilerReport,
  ProfilerSession,
  ProfilerSnapshot,
  ProfilerTimeline
} from './types';

// Import utilities
import * as ProfilerUtils from './utils';

/**
 * Profiler - Advanced performance profiling tool
 */
export class Profiler extends EventEmitter {
  private config: ProfilerConfig;
  private session: ProfilerSession | null = null;
  private performanceManager: PerformanceManager;
  private metrics: Map<string, ProfilerMetric[]> = new Map();
  private events: ProfilerEvent[] = [];
  private snapshots: ProfilerSnapshot[] = [];
  private timeline: ProfilerTimeline | null = null;
  private enabled: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private samplingRate: number = 100; // milliseconds

  /**
   * Create a new Profiler instance
   */
  constructor(config: ProfilerConfig = {}) {
    super();
    this.config = {
      enabled: true,
      samplingRate: 100,
      maxMetrics: 1000,
      maxEvents: 5000,
      maxSnapshots: 100,
      autoStart: false,
      ...config
    };

    this.performanceManager = PerformanceManager.getInstance();
    this.samplingRate = this.config.samplingRate || 100;

    if (this.config.autoStart) {
      this.start();
    }
  }

  /**
   * Start a profiling session
   */
  public start(config?: Partial<ProfilerConfig>): ProfilerSession {
    if (this.enabled && this.session) {
      console.warn('Profiler session already in progress');
      return this.session;
    }

    // Update config if provided
    if (config) {
      this.config = { ...this.config, ...config };
      this.samplingRate = this.config.samplingRate || 100;
    }

    // Create new session
    this.session = {
      id: ProfilerUtils.generateId('session'),
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      config: { ...this.config },
      active: true
    };

    // Reset data
    this.metrics.clear();
    this.events = [];
    this.snapshots = [];
    this.timeline = null;

    // Enable profiler
    this.enabled = true;

    // Start sampling
    this.startSampling();

    // Emit event
    this.emit('sessionStarted', this.session);

    return this.session;
  }

  /**
   * Stop the current profiling session
   */
  public stop(): ProfilerSession | null {
    if (!this.enabled || !this.session) {
      console.warn('No active profiler session');
      return null;
    }

    // Stop sampling
    this.stopSampling();

    // Finalize session
    this.session.endTime = performance.now();
    this.session.duration = this.session.endTime - this.session.startTime;
    this.session.active = false;

    // Generate timeline
    this.generateTimeline();

    // Disable profiler
    this.enabled = false;

    // Emit event
    this.emit('sessionStopped', this.session);

    return this.session;
  }

  /**
   * Check if a profiling session is active
   */
  public isActive(): boolean {
    return this.enabled && this.session !== null && this.session.active;
  }

  /**
   * Get the current session
   */
  public getCurrentSession(): ProfilerSession | null {
    return this.session;
  }

  /**
   * Record a metric
   */
  public recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.enabled || !this.session) return;

    const metric: ProfilerMetric = {
      id: ProfilerUtils.generateId('metric'),
      sessionId: this.session.id,
      name,
      value,
      timestamp: performance.now(),
      tags: tags || {}
    };

    // Add to metrics collection
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Enforce maximum metrics
    if (metrics.length > (this.config.maxMetrics || 1000)) {
      metrics.shift();
    }

    // Emit event
    this.emit('metricRecorded', metric);
  }

  /**
   * Record an event
   */
  public recordEvent(type: string, data?: any, tags?: Record<string, string>): void {
    if (!this.enabled || !this.session) return;

    const event: ProfilerEvent = {
      id: ProfilerUtils.generateId('event'),
      sessionId: this.session.id,
      type,
      timestamp: performance.now(),
      data: data || {},
      tags: tags || {}
    };

    // Add to events collection
    this.events.push(event);

    // Enforce maximum events
    if (this.events.length > (this.config.maxEvents || 5000)) {
      this.events.shift();
    }

    // Emit event
    this.emit('eventRecorded', event);
  }

  /**
   * Take a snapshot of the current state
   */
  public takeSnapshot(name?: string): ProfilerSnapshot {
    if (!this.enabled || !this.session) {
      throw new Error('No active profiler session');
    }

    const snapshot: ProfilerSnapshot = {
      id: ProfilerUtils.generateId('snapshot'),
      sessionId: this.session.id,
      name: name || `Snapshot ${this.snapshots.length + 1}`,
      timestamp: performance.now(),
      metrics: new Map(),
      memory: ProfilerUtils.getMemoryUsage(),
      cpu: ProfilerUtils.getCPUUsage()
    };

    // Collect current metrics
    this.metrics.forEach((metrics, name) => {
      if (metrics.length > 0) {
        const latest = metrics[metrics.length - 1];
        snapshot.metrics.set(name, latest);
      }
    });

    // Add to snapshots collection
    this.snapshots.push(snapshot);

    // Enforce maximum snapshots
    if (this.snapshots.length > (this.config.maxSnapshots || 100)) {
      this.snapshots.shift();
    }

    // Emit event
    this.emit('snapshotTaken', snapshot);

    return snapshot;
  }

  /**
   * Get metrics for a specific name
   */
  public getMetrics(name: string): ProfilerMetric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): Map<string, ProfilerMetric[]> {
    return new Map(this.metrics);
  }

  /**
   * Get events
   */
  public getEvents(): ProfilerEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  public getEventsByType(type: string): ProfilerEvent[] {
    return this.events.filter(event => event.type === type);
  }

  /**
   * Get snapshots
   */
  public getSnapshots(): ProfilerSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get timeline
   */
  public getTimeline(): ProfilerTimeline | null {
    return this.timeline;
  }

  /**
   * Generate a report
   */
  public generateReport(): ProfilerReport {
    if (!this.session) {
      throw new Error('No profiling session available');
    }

    const report: ProfilerReport = {
      sessionId: this.session.id,
      startTime: this.session.startTime,
      endTime: this.session.endTime || performance.now(),
      duration: this.session.duration || (performance.now() - this.session.startTime),
      summary: this.generateSummary(),
      metrics: this.aggregateMetrics(),
      events: this.events,
      snapshots: this.snapshots,
      timeline: this.timeline || undefined,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  /**
   * Export data as JSON
   */
  public exportAsJSON(): string {
    const data = {
      session: this.session,
      metrics: Array.from(this.metrics.entries()).map(([name, metrics]) => ({
        name,
        metrics
      })),
      events: this.events,
      snapshots: this.snapshots,
      timeline: this.timeline
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Start sampling metrics
   */
  private startSampling(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.sampleMetrics();
    }, this.samplingRate);
  }

  /**
   * Stop sampling metrics
   */
  private stopSampling(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Sample system metrics
   */
  private sampleMetrics(): void {
    if (!this.session) return;

    // Memory usage
    const memory = ProfilerUtils.getMemoryUsage();
    this.recordMetric('memory.heapUsed', memory.heapUsed);
    this.recordMetric('memory.heapTotal', memory.heapTotal);
    this.recordMetric('memory.external', memory.external);
    this.recordMetric('memory.rss', memory.rss);

    // CPU usage
    const cpu = ProfilerUtils.getCPUUsage();
    this.recordMetric('cpu.user', cpu.user);
    this.recordMetric('cpu.system', cpu.system);

    // Event loop delay
    this.recordMetric('eventLoopDelay', ProfilerUtils.measureEventLoopDelay());

    // Frame time (if available)
    const frameTime = ProfilerUtils.measureFrameTime();
    if (frameTime > 0) {
      this.recordMetric('frameTime', frameTime);
    }
  }

  /**
   * Generate timeline
   */
  private generateTimeline(): void {
    if (!this.session) return;

    const nodes: ProfilerNode[] = [];

    // Add metrics to timeline
    this.metrics.forEach((metrics, name) => {
      metrics.forEach(metric => {
        nodes.push({
          id: metric.id,
          type: 'metric',
          name,
          startTime: metric.timestamp,
          endTime: metric.timestamp,
          data: {
            value: metric.value,
            tags: metric.tags
          }
        });
      });
    });

    // Add events to timeline
    this.events.forEach(event => {
      nodes.push({
        id: event.id,
        type: 'event',
        name: event.type,
        startTime: event.timestamp,
        endTime: event.timestamp,
        data: {
          ...event.data,
          tags: event.tags
        }
      });
    });

    // Add snapshots to timeline
    this.snapshots.forEach(snapshot => {
      nodes.push({
        id: snapshot.id,
        type: 'snapshot',
        name: snapshot.name,
        startTime: snapshot.timestamp,
        endTime: snapshot.timestamp,
        data: {
          memory: snapshot.memory,
          cpu: snapshot.cpu
        }
      });
    });

    // Sort nodes by start time
    nodes.sort((a, b) => a.startTime - b.startTime);

    this.timeline = {
      sessionId: this.session.id,
      startTime: this.session.startTime,
      endTime: this.session.endTime || performance.now(),
      nodes
    };
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(): ProfilerReport['summary'] {
    const summary: ProfilerReport['summary'] = {
      totalMetrics: 0,
      totalEvents: 0,
      totalSnapshots: 0,
      metrics: {},
      memory: {
        initial: 0,
        peak: 0,
        final: 0
      },
      cpu: {
        average: 0,
        peak: 0
      },
      eventLoop: {
        average: 0,
        worst: 0
      },
      frameTime: {
        average: 0,
        worst: 0
      }
    };

    // Count metrics and events
    this.metrics.forEach(metrics => {
      summary.totalMetrics += metrics.length;
    });
    summary.totalEvents = this.events.length;
    summary.totalSnapshots = this.snapshots.length;

    // Calculate metric statistics
    this.metrics.forEach((metrics, name) => {
      const values = metrics.map(m => m.value);
      if (values.length > 0) {
        summary.metrics[name] = {
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          average: ProfilerUtils.average(values),
          median: ProfilerUtils.median(values),
          p95: ProfilerUtils.percentile(values, 95),
          p99: ProfilerUtils.percentile(values, 99)
        };
      }
    });

    // Memory statistics
    const memoryMetrics = this.metrics.get('memory.heapUsed') || [];
    if (memoryMetrics.length > 0) {
      const values = memoryMetrics.map(m => m.value);
      summary.memory.initial = values[0];
      summary.memory.peak = Math.max(...values);
      summary.memory.final = values[values.length - 1];
    }

    // CPU statistics
    const cpuUserMetrics = this.metrics.get('cpu.user') || [];
    if (cpuUserMetrics.length > 0) {
      const values = cpuUserMetrics.map(m => m.value);
      summary.cpu.average = ProfilerUtils.average(values);
      summary.cpu.peak = Math.max(...values);
    }

    // Event loop statistics
    const eventLoopMetrics = this.metrics.get('eventLoopDelay') || [];
    if (eventLoopMetrics.length > 0) {
      const values = eventLoopMetrics.map(m => m.value);
      summary.eventLoop.average = ProfilerUtils.average(values);
      summary.eventLoop.worst = Math.max(...values);
    }

    // Frame time statistics
    const frameTimeMetrics = this.metrics.get('frameTime') || [];
    if (frameTimeMetrics.length > 0) {
      const values = frameTimeMetrics.map(m => m.value);
      summary.frameTime.average = ProfilerUtils.average(values);
      summary.frameTime.worst = Math.max(...values);
    }

    return summary;
  }

  /**
   * Aggregate metrics by name
   */
  private aggregateMetrics(): ProfilerReport['metrics'] {
    const aggregated: ProfilerReport['metrics'] = {};

    this.metrics.forEach((metrics, name) => {
      aggregated[name] = {
        count: metrics.length,
        min: Math.min(...metrics.map(m => m.value)),
        max: Math.max(...metrics.map(m => m.value)),
        average: ProfilerUtils.average(metrics.map(m => m.value)),
        median: ProfilerUtils.median(metrics.map(m => m.value)),
        p95: ProfilerUtils.percentile(metrics.map(m => m.value), 95),
        p99: ProfilerUtils.percentile(metrics.map(m => m.value), 99)
      };
    });

    return aggregated;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check memory usage
    const memoryMetrics = this.metrics.get('memory.heapUsed') || [];
    if (memoryMetrics.length > 0) {
      const values = memoryMetrics.map(m => m.value);
      const peakMemory = Math.max(...values);

      if (peakMemory > 500) {
        recommendations.push(`High memory usage detected (${peakMemory.toFixed(2)}MB). Consider optimizing memory usage.`);
      }
    }

    // Check CPU usage
    const cpuMetrics = this.metrics.get('cpu.user') || [];
    if (cpuMetrics.length > 0) {
      const values = cpuMetrics.map(m => m.value);
      const avgCpu = ProfilerUtils.average(values);

      if (avgCpu > 70) {
        recommendations.push(`High CPU usage detected (${avgCpu.toFixed(2)}%). Consider optimizing CPU-intensive operations.`);
      }
    }

    // Check event loop delay
    const eventLoopMetrics = this.metrics.get('eventLoopDelay') || [];
    if (eventLoopMetrics.length > 0) {
      const values = eventLoopMetrics.map(m => m.value);
      const worstDelay = Math.max(...values);

      if (worstDelay > 50) {
        recommendations.push(`High event loop delay detected (${worstDelay.toFixed(2)}ms). Consider breaking up long-running operations.`);
      }
    }

    // Check frame time
    const frameTimeMetrics = this.metrics.get('frameTime') || [];
    if (frameTimeMetrics.length > 0) {
      const values = frameTimeMetrics.map(m => m.value);
      const worstFrameTime = Math.max(...values);

      if (worstFrameTime > 33) { // Below 30fps
        recommendations.push(`Poor frame performance detected (${worstFrameTime.toFixed(2)}ms). Consider optimizing rendering operations.`);
      }
    }

    return recommendations;
  }
}

// Export the Profiler class
export { Profiler };

// Export utility functions
  export * from './utils';

// Export types
export * from './types';

// Default export
export default Profiler;
