/**
 * Type definitions for the performance package
 */

/**
 * Interface for metric data
 */
export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * Interface for metric options
 */
export interface MetricOptions {
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
  sampleRate?: number;
  aggregate?: boolean;
}

/**
 * Interface for optimization strategy
 */
export interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  category: 'rendering' | 'memory' | 'cpu' | 'network' | 'general';
  impact: number; // 1-10 scale
  enabled: boolean;
  apply: () => Promise<boolean>;
  rollback: () => Promise<boolean>;
  isActive: () => boolean;
}

/**
 * Interface for optimization result
 */
export interface OptimizationResult {
  strategyId: string;
  success: boolean;
  message: string;
  metricsBefore?: MetricData[];
  metricsAfter?: MetricData[];
  timestamp: number;
}

/**
 * Interface for profiling data
 */
export interface ProfilingData {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  samples: ProfilingSample[];
  summary: {
    totalSamples: number;
    averageFrameTime: number;
    worstFrameTime: number;
    memoryUsage: {
      initial: number;
      peak: number;
      final: number;
    };
    cpuUsage: {
      average: number;
      peak: number;
    };
  };
}

/**
 * Interface for profiling sample
 */
export interface ProfilingSample {
  timestamp: number;
  frameTime: number;
  memoryUsage: number;
  cpuUsage: number;
  event?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for profiling options
 */
export interface ProfilingOptions {
  duration?: number; // in milliseconds
  sampleRate?: number; // samples per second
  includeMemory?: boolean;
  includeCPU?: boolean;
  includeEvents?: boolean;
  customMetrics?: string[];
}

/**
 * Interface for performance report
 */
export interface PerformanceReport {
  timestamp: number;
  metrics: MetricData[];
  optimizations: OptimizationResult[];
  profiling: ProfilingData;
  summary: {
    totalMetrics: number;
    activeOptimizations: number;
    profilingDuration: number;
  };
}

/**
 * Interface for performance threshold
 */
export interface PerformanceThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  severity: 'warning' | 'error';
  message: string;
}

/**
 * Interface for performance alert
 */
export interface PerformanceAlert {
  id: string;
  threshold: PerformanceThreshold;
  actualValue: number;
  timestamp: number;
  acknowledged: boolean;
}
