/**
 * ONEDOT-JS Testing Core Implementation
 *
 * This module provides the core functionality for the testing framework,
 * including test discovery, execution, and reporting.
 */

import { RuntimeManager } from '@onedot/runtime';
import { EventEmitter } from 'events';

// Import modules
import { E2ETester } from './e2e';
import { IntegrationTester } from './integration';
import { UnitTester } from './unit';

// Import types
import {
  TestConfig,
  TestHook,
  TestReporter,
  TestResult
} from './types';

// Import utilities

/**
 * TestManager - Manages all testing operations
 */
export class TestManager extends EventEmitter {
  private static instance: TestManager;
  private config: TestConfig;
  private unitTester: UnitTester;
  private integrationTester: IntegrationTester;
  private e2eTester: E2ETester;
  private runtimeManager: RuntimeManager;
  private enabled: boolean = true;
  private reporters: TestReporter[] = [];
  private hooks: Map<string, TestHook[]> = new Map();
  private results: TestResult[] = [];

  private constructor(config: TestConfig = {}) {
    super();
    this.config = {
      timeout: 5000,
      verbose: false,
      bail: false,
      reporters: ['console'],
      ...config
    };

    this.unitTester = new UnitTester(this.config);
    this.integrationTester = new IntegrationTester(this.config);
    this.e2eTester = new E2ETester(this.config);
    this.runtimeManager = RuntimeManager.getInstance();

    this.initialize();
  }

  /**
   * Get the singleton instance of TestManager
   */
  public static getInstance(config?: TestConfig): TestManager {
    if (!TestManager.instance) {
      TestManager.instance = new TestManager(config);
    }
    return TestManager.instance;
  }

  /**
   * Initialize the test manager
   */
  private initialize(): void {
    // Set up event listeners
    this.unitTester.on('testStarted', (test) => {
      this.emit('testStarted', test);
      this.runHooks('beforeEach', test);
    });

    this.unitTester.on('testCompleted', (result) => {
      this.runHooks('afterEach', result.test);
      this.results.push(result);
      this.emit('testCompleted', result);
    });

    this.integrationTester.on('testStarted', (test) => {
      this.emit('testStarted', test);
      this.runHooks('beforeEach', test);
    });

    this.integrationTester.on('testCompleted', (result) => {
      this.runHooks('afterEach', result.test);
      this.results.push(result);
      this.emit('testCompleted', result);
    });

    this.e2eTester.on('testStarted', (test) => {
      this.emit('testStarted', test);
      this.runHooks('beforeEach', test);
    });

    this.e2eTester.on('testCompleted', (result) => {
      this.runHooks('afterEach', result.test);
      this.results.push(result);
      this.emit('testCompleted', result);
    });

    // Set up default reporters
    this.setupDefaultReporters();

    this.emit('initialized');
  }

  /**
   * Enable or disable the test manager
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Check if the test manager is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the test configuration
   */
  public getConfig(): TestConfig {
    return { ...this.config };
  }

  /**
   * Update the test configuration
   */
  public updateConfig(config: Partial<TestConfig>): void {
    this.config = { ...this.config, ...config };

    // Update testers
    this.unitTester.updateConfig(config);
    this.integrationTester.updateConfig(config);
    this.e2eTester.updateConfig(config);

    this.emit('configUpdated', this.config);
  }

  /**
   * Get the unit tester
   */
  public getUnitTester(): UnitTester {
    return this.unitTester;
  }

  /**
   * Get the integration tester
   */
  public getIntegrationTester(): IntegrationTester {
    return this.integrationTester;
  }

  /**
   * Get the E2E tester
   */
  public getE2ETester(): E2ETester {
    return this.e2eTester;
  }

  /**
   * Get the runtime manager
   */
  public getRuntimeManager(): RuntimeManager {
    return this.runtimeManager;
  }

  /**
   * Add a test reporter
   */
  public addReporter(reporter: TestReporter): void {
    this.reporters.push(reporter);
    this.emit('reporterAdded', reporter);
  }

  /**
   * Remove a test reporter
   */
  public removeReporter(reporter: TestReporter): boolean {
    const index = this.reporters.indexOf(reporter);
    if (index !== -1) {
      this.reporters.splice(index, 1);
      this.emit('reporterRemoved', reporter);
      return true;
    }
    return false;
  }

  /**
   * Get all test reporters
   */
  public getReporters(): TestReporter[] {
    return [...this.reporters];
  }

  /**
   * Add a test hook
   */
  public addHook(name: string, hook: TestHook): void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }

    this.hooks.get(name)!.push(hook);
    this.emit('hookAdded', name, hook);
  }

  /**
   * Remove a test hook
   */
  public removeHook(name: string, hook: TestHook): boolean {
    const hooks = this.hooks.get(name);
    if (!hooks) return false;

    const index = hooks.indexOf(hook);
    if (index !== -1) {
      hooks.splice(index, 1);

      if (hooks.length === 0) {
        this.hooks.delete(name);
      }

      this.emit('hookRemoved', name, hook);
      return true;
    }

    return false;
  }

  /**
   * Get all hooks for a specific name
   */
  public getHooks(name: string): TestHook[] {
    return this.hooks.get(name) || [];
  }

  /**
   * Get all test results
   */
  public getResults(): TestResult[] {
    return [...this.results];
  }

  /**
   * Clear test results
   */
  public clearResults(): void {
    this.results = [];
    this.emit('resultsCleared');
  }

  /**
   * Run unit tests
   */
  public async runUnitTests(testFiles?: string[]): Promise<TestResult[]> {
    if (!this.enabled) {
      throw new Error('Test manager is disabled');
    }

    this.clearResults();
    this.runHooks('beforeAll');

    const results = await this.unitTester.run(testFiles);

    this.runHooks('afterAll');

    return results;
  }

  /**
   * Run integration tests
   */
  public async runIntegrationTests(testFiles?: string[]): Promise<TestResult[]> {
    if (!this.enabled) {
      throw new Error('Test manager is disabled');
    }

    this.clearResults();
    this.runHooks('beforeAll');

    const results = await this.integrationTester.run(testFiles);

    this.runHooks('afterAll');

    return results;
  }

  /**
   * Run E2E tests
   */
  public async runE2ETests(testFiles?: string[]): Promise<TestResult[]> {
    if (!this.enabled) {
      throw new Error('Test manager is disabled');
    }

    this.clearResults();
    this.runHooks('beforeAll');

    const results = await this.e2eTester.run(testFiles);

    this.runHooks('afterAll');

    return results;
  }

  /**
   * Run all tests
   */
  public async runAllTests(testFiles?: { unit?: string[]; integration?: string[]; e2e?: string[] }): Promise<{
    unit: TestResult[];
    integration: TestResult[];
    e2e: TestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
      duration: number;
    };
  }> {
    if (!this.enabled) {
      throw new Error('Test manager is disabled');
    }

    this.clearResults();
    this.runHooks('beforeAll');

    const startTime = performance.now();

    // Run unit tests
    const unitResults = await this.unitTester.run(testFiles?.unit);

    // Run integration tests
    const integrationResults = await this.integrationTester.run(testFiles?.integration);

    // Run E2E tests
    const e2eResults = await this.e2eTester.run(testFiles?.e2e);

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.runHooks('afterAll');

    // Calculate summary
    const allResults = [...unitResults, ...integrationResults, ...e2eResults];
    const summary = {
      total: allResults.length,
      passed: allResults.filter(r => r.status === 'passed').length,
      failed: allResults.filter(r => r.status === 'failed').length,
      skipped: allResults.filter(r => r.status === 'skipped').length,
      duration
    };

    return {
      unit: unitResults,
      integration: integrationResults,
      e2e: e2eResults,
      summary
    };
  }

  /**
   * Run hooks
   */
  private async runHooks(name: string, context?: any): Promise<void> {
    const hooks = this.hooks.get(name);
    if (!hooks) return;

    for (const hook of hooks) {
      try {
        await hook(context);
      } catch (error) {
        console.error(`Error in ${name} hook:`, error);
      }
    }
  }

  /**
   * Set up default reporters
   */
  private setupDefaultReporters(): void {
    // Console reporter
    const consoleReporter: TestReporter = {
      reportSuiteStart: (suite) => {
        if (this.config.verbose) {
          console.log(`\nRunning ${suite.name} tests...`);
        }
      },

      reportSuiteEnd: (suite) => {
        if (this.config.verbose) {
          console.log(`\n${suite.name} tests completed`);
        }
      },

      reportTestStart: (test) => {
        if (this.config.verbose) {
          process.stdout.write(`  ${test.name}...`);
        }
      },

      reportTestEnd: (result) => {
        if (this.config.verbose) {
          if (result.status === 'passed') {
            console.log(' ✓');
          } else if (result.status === 'failed') {
            console.log(' ✗');
            if (result.error) {
              console.log(`    ${result.error.message}`);
            }
          } else if (result.status === 'skipped') {
            console.log(' -');
          }
        }
      },

      reportRunStart: () => {
        console.log('\nRunning tests...');
      },

      reportRunEnd: (results) => {
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        const skipped = results.filter(r => r.status === 'skipped').length;

        console.log(`\nTest Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);

        if (failed > 0) {
          console.log('\nFailed tests:');
          results.filter(r => r.status === 'failed').forEach(result => {
            console.log(`  ${result.test.name}: ${result.error?.message}`);
          });
        }
      }
    };

    this.addReporter(consoleReporter);
  }
}

// Export the TestManager class
export { TestManager };

// Export utility functions
  export * from './utils';

// Export types
export * from './types';

// Export a default instance of the TestManager
export default TestManager.getInstance();
