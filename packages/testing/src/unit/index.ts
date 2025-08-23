/**
 * Unit testing implementation
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

import {
  Assertion,
  AssertionResult,
  TestCase,
  TestConfig,
  TestContext,
  TestResult,
  TestRunner,
  TestSuite
} from '../types';
import { TestingUtils } from '../utils';

/**
 * UnitTester - Runs unit tests
 */
export class UnitTester extends EventEmitter implements TestRunner {
  private config: TestConfig;
  private suites: Map<string, TestSuite> = new Map();
  private tests: TestCase[] = [];
  private assertion: Assertion;

  constructor(config: TestConfig = {}) {
    super();
    this.config = {
      timeout: 5000,
      verbose: false,
      bail: false,
      reporters: ['console'],
      ...config
    };

    this.assertion = this.createAssertion();
  }

  /**
   * Update the test configuration
   */
  public updateConfig(config: Partial<TestConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  /**
   * Discover and load test files
   */
  public async discoverTests(testDir: string = './tests/unit'): Promise<void> {
    if (!fs.existsSync(testDir)) {
      console.warn(`Test directory '${testDir}' does not exist`);
      return;
    }

    // Recursively find all test files
    const testFiles = this.findTestFiles(testDir);

    // Load each test file
    for (const file of testFiles) {
      await this.loadTestFile(file);
    }
  }

  /**
   * Find all test files in a directory
   */
  private findTestFiles(dir: string): string[] {
    const files: string[] = [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...this.findTestFiles(fullPath));
      } else if (entry.isFile() && this.isTestFile(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Check if a file is a test file
   */
  private isTestFile(filename: string): boolean {
    return (
      filename.endsWith('.test.ts') ||
      filename.endsWith('.test.js') ||
      filename.endsWith('.spec.ts') ||
      filename.endsWith('.spec.js') ||
      filename.startsWith('test.') ||
      filename.startsWith('spec.')
    );
  }

  /**
   * Load a test file
   */
  private async loadTestFile(filePath: string): Promise<void> {
    try {
      // Clear require cache to ensure fresh imports
      delete require.cache[require.resolve(filePath)];

      // Load the test file
      const testModule = require(filePath);

      // Extract test suites
      for (const key in testModule) {
        if (typeof testModule[key] === 'object' && testModule[key].tests) {
          const suite: TestSuite = testModule[key];
          suite.name = suite.name || key;

          // Add the suite
          this.suites.set(suite.name, suite);

          // Add tests
          suite.tests.forEach(test => {
            test.suite = suite.name;
            this.tests.push(test);
          });
        }
      }
    } catch (error) {
      console.error(`Error loading test file '${filePath}':`, error);
    }
  }

  /**
   * Run unit tests
   */
  public async run(testFiles?: string[]): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // If specific test files are provided, load them
    if (testFiles && testFiles.length > 0) {
      for (const file of testFiles) {
        await this.loadTestFile(file);
      }
    } else {
      // Otherwise, discover tests
      await this.discoverTests();
    }

    // Filter tests to run only those marked with 'only' if any
    let testsToRun = this.tests;
    const onlyTests = this.tests.filter(test => test.only);

    if (onlyTests.length > 0) {
      testsToRun = onlyTests;
    }

    // Skip tests marked with 'skip'
    testsToRun = testsToRun.filter(test => !test.skip);

    // Run tests for each suite
    for (const [suiteName, suite] of this.suites) {
      // Skip suites that don't have tests to run
      const suiteTests = testsToRun.filter(test => test.suite === suiteName);
      if (suiteTests.length === 0) continue;

      // Emit suite start event
      this.emit('suiteStart', suite);

      // Run beforeAll hook
      if (suite.beforeAll) {
        try {
          await suite.beforeAll();
        } catch (error) {
          console.error(`Error in beforeAll hook for suite '${suiteName}':`, error);
        }
      }

      // Run tests
      for (const test of suiteTests) {
        // Emit test start event
        this.emit('testStart', test);

        // Create test context
        const context = TestingUtils.createTestContext(test.name, 'unit');

        // Run beforeEach hook
        if (suite.beforeEach) {
          try {
            await suite.beforeEach();
          } catch (error) {
            console.error(`Error in beforeEach hook for test '${test.name}':`, error);
          }
        }

        // Run the test
        const result = await this.runTest(test, context);

        // Run afterEach hook
        if (suite.afterEach) {
          try {
            await suite.afterEach();
          } catch (error) {
            console.error(`Error in afterEach hook for test '${test.name}':`, error);
          }
        }

        // Add result
        results.push(result);

        // Emit test end event
        this.emit('testEnd', result);

        // Bail on failure if configured
        if (!result.passed && this.config.bail) {
          break;
        }
      }

      // Run afterAll hook
      if (suite.afterAll) {
        try {
          await suite.afterAll();
        } catch (error) {
          console.error(`Error in afterAll hook for suite '${suiteName}':`, error);
        }
      }

      // Emit suite end event
      this.emit('suiteEnd', suite);
    }

    return results;
  }

  /**
   * Run a single test
   */
  private async runTest(test: TestCase, context: TestContext): Promise<TestResult> {
    const startTime = performance.now();
    const assertions: AssertionResult[] = [];

    try {
      // Set up assertion tracking
      const originalAssert = global.assert;
      global.assert = (actual: any, expected?: any, message?: string) => {
        const result = this.assertion(actual, expected, message);
        assertions.push(result);
        return result;
      };

      // Set up timeout
      const timeout = test.timeout || this.config.timeout || 5000;
      let timeoutId: NodeJS.Timeout | null = null;

      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          throw TestingUtils.createTimeoutError(timeout);
        }, timeout);
      }

      // Run the test
      await test.fn(context);

      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Restore original assert
      global.assert = originalAssert;

      // Calculate duration
      const duration = performance.now() - startTime;

      // Update context
      context.endTime = performance.now();
      context.duration = duration;

      // Return result
      return TestingUtils.createSuccessResult(test, assertions, duration, context);
    } catch (error) {
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Restore original assert
      if (typeof global.assert !== 'undefined') {
        global.assert = originalAssert;
      }

      // Calculate duration
      const duration = performance.now() - startTime;

      // Update context
      context.endTime = performance.now();
      context.duration = duration;

      // Return result
      return TestingUtils.createFailedResult(
        test,
        error instanceof Error ? error : new Error(String(error)),
        assertions,
        duration,
        context
      );
    }
  }

  /**
   * Create an assertion function
   */
  private createAssertion(): Assertion {
    const assert = (actual: any, expected?: any, message?: string): AssertionResult => {
      if (expected === undefined) {
        // Truthy assertion
        const passed = !!actual;
        return {
          passed,
          actual,
          expected: true,
          message: message || `Expected ${TestingUtils.inspect(actual)} to be truthy`
        };
      } else {
        // Equality assertion
        const passed = TestingUtils.deepEqual(actual, expected);
        return {
          passed,
          actual,
          expected,
          message: message || `Expected ${TestingUtils.inspect(actual)} to equal ${TestingUtils.inspect(expected)}`
        };
      }
    };

    // Add not property
    assert.not = (actual: any, expected?: any, message?: string): AssertionResult => {
      if (expected === undefined) {
        // Falsy assertion
        const passed = !actual;
        return {
          passed,
          actual,
          expected: false,
          message: message || `Expected ${TestingUtils.inspect(actual)} to be falsy`
        };
      } else {
        // Inequality assertion
        const passed = !TestingUtils.deepEqual(actual, expected);
        return {
          passed,
          actual,
          expected,
          message: message || `Expected ${TestingUtils.inspect(actual)} to not equal ${TestingUtils.inspect(expected)}`
        };
      }
    };

    // Add other assertion methods
    assert.strictEqual = (actual: any, expected: any, message?: string): AssertionResult => {
      const passed = actual === expected;
      return {
        passed,
        actual,
        expected,
        message: message || `Expected ${TestingUtils.inspect(actual)} to strictly equal ${TestingUtils.inspect(expected)}`
      };
    };

    assert.notStrictEqual = (actual: any, expected: any, message?: string): AssertionResult => {
      const passed = actual !== expected;
      return {
        passed,
        actual,
        expected,
        message: message || `Expected ${TestingUtils.inspect(actual)} to not strictly equal ${TestingUtils.inspect(expected)}`
      };
    };

    assert.deepEqual = (actual: any, expected: any, message?: string): AssertionResult => {
      const passed = TestingUtils.deepEqual(actual, expected);
      return {
        passed,
        actual,
        expected,
        message: message || `Expected ${TestingUtils.inspect(actual)} to deeply equal ${TestingUtils.inspect(expected)}`
      };
    };

    assert.notDeepEqual = (actual: any, expected: any, message?: string): AssertionResult => {
      const passed = !TestingUtils.deepEqual(actual, expected);
      return {
        passed,
        actual,
        expected,
        message: message || `Expected ${TestingUtils.inspect(actual)} to not deeply equal ${TestingUtils.inspect(expected)}`
      };
    };

    assert.throws = (fn: Function, expected?: Error | RegExp | Function, message?: string): AssertionResult => {
      let threw = false;
      let error: Error | null = null;

      try {
        fn();
      } catch (e) {
        threw = true;
        error = e instanceof Error ? e : new Error(String(e));
      }

      if (!threw) {
        return {
          passed: false,
          actual: null,
          expected: expected,
          message: message || 'Expected function to throw'
        };
      }

      if (expected === undefined) {
        return {
          passed: true,
          actual: error,
          expected: 'any error',
          message: message || 'Expected function to throw'
        };
      }

      if (expected instanceof RegExp) {
        const passed = expected.test(error!.message);
        return {
          passed,
          actual: error!.message,
          expected: expected.toString(),
          message: message || `Expected error message to match ${expected.toString()}`
        };
      }

      if (typeof expected === 'function') {
        const passed = error instanceof expected;
        return {
          passed,
          actual: error!.constructor.name,
          expected: expected.name,
          message: message || `Expected error to be instance of ${expected.name}`
        };
      }

      if (expected instanceof Error) {
        const passed = error!.message === expected.message;
        return {
          passed,
          actual: error!.message,
          expected: expected.message,
          message: message || `Expected error message to be '${expected.message}'`
        };
      }

      return {
        passed: true,
        actual: error,
        expected,
        message: message || 'Expected function to throw'
      };
    };

    assert.doesNotThrow = (fn: Function, message?: string): AssertionResult => {
      let threw = false;
      let error: Error | null = null;

      try {
        fn();
      } catch (e) {
        threw = true;
        error = e instanceof Error ? e : new Error(String(e));
      }

      if (threw) {
        return {
          passed: false,
          actual: error,
          expected: 'no error',
          message: message || `Expected function not to throw, but threw ${error!.message}`
        };
      }

      return {
        passed: true,
        actual: null,
        expected: 'no error',
        message: message || 'Expected function not to throw'
      };
    };

    return assert;
  }

  /**
   * Get all test suites
   */
  public getSuites(): Map<string, TestSuite> {
    return new Map(this.suites);
  }

  /**
   * Get all tests
   */
  public getTests(): TestCase[] {
    return [...this.tests];
  }

  /**
   * Get the assertion function
   */
  public getAssertion(): Assertion {
    return this.assertion;
  }
}
