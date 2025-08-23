/**
 * Performance optimization module for the performance package
 */

import { EventEmitter } from 'events';
import {
  MetricData,
  OptimizationResult,
  OptimizationStrategy,
  PerformanceThreshold
} from '../types';
import { PerformanceUtils } from '../utils';

/**
 * PerformanceOptimizer - Manages and applies performance optimizations
 */
export class PerformanceOptimizer extends EventEmitter {
  private strategies: Map<string, OptimizationStrategy> = new Map();
  private results: OptimizationResult[] = new Map();
  private enabled: boolean = true;
  private autoApply: boolean = false;
  private thresholds: Map<string, PerformanceThreshold[]> = new Map();

  /**
   * Enable or disable the optimizer
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Check if the optimizer is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set whether to automatically apply optimizations
   */
  public setAutoApply(autoApply: boolean): void {
    this.autoApply = autoApply;
    this.emit('autoApplyChanged', autoApply);
  }

  /**
   * Check if auto-apply is enabled
   */
  public isAutoApplyEnabled(): boolean {
    return this.autoApply;
  }

  /**
   * Register an optimization strategy
   */
  public registerStrategy(strategy: OptimizationStrategy): void {
    this.strategies.set(strategy.id, strategy);
    this.emit('strategyRegistered', strategy);
  }

  /**
   * Unregister an optimization strategy
   */
  public unregisterStrategy(strategyId: string): boolean {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return false;

    this.strategies.delete(strategyId);
    this.emit('strategyUnregistered', strategy);
    return true;
  }

  /**
   * Get a strategy by ID
   */
  public getStrategy(strategyId: string): OptimizationStrategy | undefined {
    return this.strategies.get(strategyId);
  }

  /**
   * Get all strategies
   */
  public getAllStrategies(): OptimizationStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get strategies by category
   */
  public getStrategiesByCategory(category: string): OptimizationStrategy[] {
    return Array.from(this.strategies.values()).filter(
      strategy => strategy.category === category
    );
  }

  /**
   * Apply a specific optimization strategy
   */
  public async applyOptimization(strategyId: string): Promise<OptimizationResult> {
    if (!this.enabled) {
      return {
        strategyId,
        success: false,
        message: 'Optimizer is disabled',
        timestamp: Date.now()
      };
    }

    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      return {
        strategyId,
        success: false,
        message: `Strategy '${strategyId}' not found`,
        timestamp: Date.now()
      };
    }

    if (!strategy.enabled) {
      return {
        strategyId,
        success: false,
        message: `Strategy '${strategyId}' is disabled`,
        timestamp: Date.now()
      };
    }

    try {
      // Collect metrics before optimization
      const metricsBefore = this.collectMetricsForStrategy(strategy);

      // Apply the optimization
      const success = await strategy.apply();

      // Collect metrics after optimization
      const metricsAfter = this.collectMetricsForStrategy(strategy);

      const result: OptimizationResult = {
        strategyId,
        success,
        message: success ? 'Optimization applied successfully' : 'Failed to apply optimization',
        metricsBefore,
        metricsAfter,
        timestamp: Date.now()
      };

      // Store the result
      this.results.set(strategyId, result);

      // Emit events
      this.emit('optimizationApplied', result);

      if (success) {
        this.emit('optimizationSucceeded', result);
      } else {
        this.emit('optimizationFailed', result);
      }

      return result;
    } catch (error) {
      const result: OptimizationResult = {
        strategyId,
        success: false,
        message: `Error applying optimization: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now()
      };

      this.results.set(strategyId, result);
      this.emit('optimizationFailed', result);

      return result;
    }
  }

  /**
   * Rollback a specific optimization strategy
   */
  public async rollbackOptimization(strategyId: string): Promise<OptimizationResult> {
    if (!this.enabled) {
      return {
        strategyId,
        success: false,
        message: 'Optimizer is disabled',
        timestamp: Date.now()
      };
    }

    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      return {
        strategyId,
        success: false,
        message: `Strategy '${strategyId}' not found`,
        timestamp: Date.now()
      };
    }

    try {
      // Collect metrics before rollback
      const metricsBefore = this.collectMetricsForStrategy(strategy);

      // Rollback the optimization
      const success = await strategy.rollback();

      // Collect metrics after rollback
      const metricsAfter = this.collectMetricsForStrategy(strategy);

      const result: OptimizationResult = {
        strategyId,
        success,
        message: success ? 'Optimization rolled back successfully' : 'Failed to rollback optimization',
        metricsBefore,
        metricsAfter,
        timestamp: Date.now()
      };

      // Store the result
      this.results.set(`${strategyId}-rollback`, result);

      // Emit events
      this.emit('optimizationRolledBack', result);

      if (success) {
        this.emit('rollbackSucceeded', result);
      } else {
        this.emit('rollbackFailed', result);
      }

      return result;
    } catch (error) {
      const result: OptimizationResult = {
        strategyId,
        success: false,
        message: `Error rolling back optimization: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now()
      };

      this.results.set(`${strategyId}-rollback`, result);
      this.emit('rollbackFailed', result);

      return result;
    }
  }

  /**
   * Apply all enabled optimizations
   */
  public async applyAllOptimizations(): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];

    for (const strategy of this.strategies.values()) {
      if (strategy.enabled) {
        const result = await this.applyOptimization(strategy.id);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get optimization results
   */
  public getOptimizationResults(): OptimizationResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get optimization result for a specific strategy
   */
  public getOptimizationResult(strategyId: string): OptimizationResult | undefined {
    return this.results.get(strategyId);
  }

  /**
   * Clear optimization results
   */
  public clearOptimizationResults(): void {
    this.results.clear();
    this.emit('resultsCleared');
  }

  /**
   * Check if a strategy is active
   */
  public isStrategyActive(strategyId: string): boolean {
    const strategy = this.strategies.get(strategyId);
    return strategy ? strategy.isActive() : false;
  }

  /**
   * Get active optimizations
   */
  public getActiveOptimizations(): OptimizationStrategy[] {
    return Array.from(this.strategies.values()).filter(strategy =>
      strategy.enabled && strategy.isActive()
    );
  }

  /**
   * Add a performance threshold for auto-optimization
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
   * Evaluate metrics against thresholds and trigger optimizations if needed
   */
  public evaluateMetrics(metrics: MetricData[]): void {
    if (!this.enabled || !this.autoApply) return;

    // Group metrics by name
    const metricsByName = new Map<string, MetricData[]>();
    metrics.forEach(metric => {
      if (!metricsByName.has(metric.name)) {
        metricsByName.set(metric.name, []);
      }
      metricsByName.get(metric.name)!.push(metric);
    });

    // Check each metric against thresholds
    metricsByName.forEach((metricList, metricName) => {
      const thresholdList = this.thresholds.get(metricName);
      if (!thresholdList) return;

      // Get the latest metric value
      const latestMetric = metricList[metricList.length - 1];
      if (!latestMetric) return;

      // Check each threshold
      thresholdList.forEach(threshold => {
        if (PerformanceUtils.checkThreshold(latestMetric.value, threshold)) {
          // Find strategies that can help with this metric
          const relevantStrategies = this.findStrategiesForMetric(metricName);

          // Apply the highest impact strategy
          if (relevantStrategies.length > 0) {
            const strategy = relevantStrategies.reduce((prev, current) =>
              prev.impact > current.impact ? prev : current
            );

            if (strategy.enabled && !strategy.isActive()) {
              this.applyOptimization(strategy.id);
            }
          }
        }
      });
    });
  }

  /**
   * Find strategies that can help with a specific metric
   */
  private findStrategiesForMetric(metricName: string): OptimizationStrategy[] {
    // This is a simplified implementation
    // In a real implementation, we would have a mapping between metrics and strategies

    return Array.from(this.strategies.values()).filter(strategy => {
      // For now, we'll use a simple heuristic based on the metric name and strategy category
      if (metricName.includes('memory') && strategy.category === 'memory') return true;
      if (metricName.includes('cpu') && strategy.category === 'cpu') return true;
      if (metricName.includes('render') && strategy.category === 'rendering') return true;
      if (metricName.includes('network') && strategy.category === 'network') return true;

      return false;
    });
  }

  /**
   * Collect metrics relevant to a strategy
   */
  private collectMetricsForStrategy(strategy: OptimizationStrategy): MetricData[] {
    // This is a simplified implementation
    // In a real implementation, we would collect actual metrics

    return [
      {
        name: 'memoryUsage',
        value: Math.random() * 100,
        timestamp: Date.now(),
        metadata: { unit: 'MB' }
      },
      {
        name: 'cpuUsage',
        value: Math.random() * 100,
        timestamp: Date.now(),
        metadata: { unit: '%' }
      }
    ];
  }
}

// Export the PerformanceOptimizer class
export { PerformanceOptimizer };
