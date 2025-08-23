/**
 * Type definitions for the profiler package
 */

/**
 * Interface for profiler configuration
 */
export interface ProfilerConfig {
  enabled?: boolean;
  samplingRate?: number; // in milliseconds
  maxMetrics?: number;
  maxEvents?: number;
  maxSnapshots?: number;
  autoStart?: boolean;
  [key: string]: any;
}

/**
 * Interface for a profiler session
 */
export interface ProfilerSession {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  config: ProfilerConfig;
  active: boolean;
}

/**
 * Interface for a profiler metric
 */
export interface ProfilerMetric {
  id: string;
  sessionId: string;
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
}

/**
 * Interface for a profiler event
 */
export interface ProfilerEvent {
  id: string;
  sessionId: string;
  type: string;
  timestamp: number;
  data: any;
  tags: Record<string, string>;
}

/**
 * Interface for a profiler snapshot
 */
export interface ProfilerSnapshot {
  id: string;
  sessionId: string;
  name: string;
  timestamp: number;
  metrics: Map<string, ProfilerMetric>;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpu: {
    user: number;
    system: number;
  };
}

/**
 * Interface for a profiler timeline node
 */
export interface ProfilerNode {
  id: string;
  type: 'metric' | 'event' | 'snapshot';
  name: string;
  startTime: number;
  endTime: number;
  data: any;
}

/**
 * Interface for a profiler timeline
 */
export interface ProfilerTimeline {
  sessionId: string;
  startTime: number;
  endTime: number;
  nodes: ProfilerNode[];
}

/**
 * Interface for metric statistics
 */
export interface MetricStats {
  count: number;
  min: number;
  max: number;
  average: number;
  median: number;
  p95: number;
  p99: number;
}

/**
 * Interface for memory statistics
 */
export interface MemoryStats {
  initial: number;
  peak: number;
  final: number;
}

/**
 * Interface for CPU statistics
 */
export interface CPUStats {
  average: number;
  peak: number;
}

/**
 * Interface for event loop statistics
 */
export interface EventLoopStats {
  average: number;
  worst: number;
}

/**
 * Interface for frame time statistics
 */
export interface FrameTimeStats {
  average: number;
  worst: number;
}

/**
 * Interface for profiler report summary
 */
export interface ProfilerReportSummary {
  totalMetrics: number;
  totalEvents: number;
  totalSnapshots: number;
  metrics: Record<string, MetricStats>;
  memory: MemoryStats;
  cpu: CPUStats;
  eventLoop: EventLoopStats;
  frameTime: FrameTimeStats;
}

/**
 * Interface for a profiler report
 */
export interface ProfilerReport {
  sessionId: string;
  startTime: number;
  endTime: number;
  duration: number;
  summary: ProfilerReportSummary;
  metrics: Record<string, MetricStats>;
  events: ProfilerEvent[];
  snapshots: ProfilerSnapshot[];
  timeline?: ProfilerTimeline;
  recommendations: string[];
}
