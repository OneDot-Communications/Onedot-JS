/**
 * Utility functions for the testing package
 */

import { AssertionResult, TestCase, TestContext, TestResult } from './types';

/**
 * Testing utility functions
 */
export const TestingUtils = {
  /**
   * Generate a unique ID
   */
  generateId(prefix: string = 'test'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Create a test context
   */
  createTestContext(name: string, type: 'unit' | 'integration' | 'e2e' = 'unit'): TestContext {
    return {
      id: this.generateId('context'),
      name,
      type,
      startTime: performance.now()
    };
  },

  /**
   * Create a test case
   */
  createTestCase(
    name: string,
    suite: string,
    fn: (context: TestContext) => Promise<void> | void,
    options: {
      timeout?: number;
      skip?: boolean;
      only?: boolean;
    } = {}
  ): TestCase {
    return {
      id: this.generateId('test'),
      name,
      suite,
      fn,
      timeout: options.timeout,
      skip: options.skip,
      only: options.only
    };
  },

  /**
   * Create a successful test result
   */
  createSuccessResult(
    test: TestCase,
    assertions: AssertionResult[],
    duration: number,
    context?: TestContext
  ): TestResult {
    return {
      test,
      status: 'passed',
      assertions,
      duration,
      context
    };
  },

  /**
   * Create a failed test result
   */
  createFailedResult(
    test: TestCase,
    error: Error,
    assertions: AssertionResult[],
    duration: number,
    context?: TestContext
  ): TestResult {
    return {
      test,
      status: 'failed',
      error,
      assertions,
      duration,
      context
    };
  },

  /**
   * Create a skipped test result
   */
  createSkippedResult(
    test: TestCase,
    duration: number,
    context?: TestContext
  ): TestResult {
    return {
      test,
      status: 'skipped',
      assertions: [],
      duration,
      context
    };
  },

  /**
   * Create a successful assertion result
   */
  createSuccessAssertion(
    actual: any,
    expected: any,
    message: string = ''
  ): AssertionResult {
    return {
      passed: true,
      actual,
      expected,
      message
    };
  },

  /**
   * Create a failed assertion result
   */
  createFailedAssertion(
    actual: any,
    expected: any,
    message: string = ''
  ): AssertionResult {
    return {
      passed: false,
      actual,
      expected,
      message
    };
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
   * Deep compare two objects
   */
  deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (typeof a !== typeof b) return false;

    if (typeof a !== 'object' || a === null || b === null) {
      return a === b;
    }

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this.deepEqual(a[key], b[key])) return false;
    }

    return true;
  },

  /**
   * Get a diff between two objects
   */
  getDiff(a: any, b: any): string {
    const jsonA = JSON.stringify(a, null, 2);
    const jsonB = JSON.stringify(b, null, 2);

    const linesA = jsonA.split('\n');
    const linesB = jsonB.split('\n');

    let diff = '';

    const maxLines = Math.max(linesA.length, linesB.length);

    for (let i = 0; i < maxLines; i++) {
      const lineA = linesA[i];
      const lineB = linesB[i];

      if (lineA === lineB) {
        diff += `  ${lineA}\n`;
      } else {
        if (lineA) {
          diff += `- ${lineA}\n`;
        }
        if (lineB) {
          diff += `+ ${lineB}\n`;
        }
      }
    }

    return diff;
  },

  /**
   * Create a timeout error
   */
  createTimeoutError(timeout: number): Error {
    return new Error(`Test timed out after ${timeout}ms`);
  },

  /**
   * Retry a function with a delay
   */
  async retry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  },

  /**
   * Wait for a condition to be true
   */
  async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  },

  /**
   * Create a mock function
   */
  createMock<T = any>(implementation?: (...args: any[]) => T): any {
    const mockFn = function(this: any, ...args: any[]): T {
      mockFn.calls.all.push({ args, returnValue: implementation ? implementation.apply(this, args) : undefined as any });
      mockFn.calls.count++;
      mockFn.calls.this.push(this);

      if (implementation) {
        return implementation.apply(this, args);
      }

      return undefined as any;
    };

    mockFn.calls = {
      all: [],
      count: 0,
      this: []
    };

    mockFn.mockClear = function() {
      mockFn.calls.all = [];
      mockFn.calls.count = 0;
      mockFn.calls.this = [];
      return mockFn;
    };

    mockFn.mockReset = function() {
      mockFn.mockClear();
      implementation = undefined;
      return mockFn;
    };

    mockFn.mockRestore = function() {
      mockFn.mockReset();
      return mockFn;
    };

    mockFn.mockImplementation = function(fn: (...args: any[]) => T) {
      implementation = fn;
      return mockFn;
    };

    mockFn.mockImplementationOnce = function(fn: (...args: any[]) => T) {
      const originalImplementation = implementation;
      implementation = function(this: any, ...args: any[]) {
        implementation = originalImplementation;
        return fn.apply(this, args);
      };
      return mockFn;
    };

    mockFn.mockReturnThis = function() {
      return mockFn.mockImplementation(function(this: any) {
        return this;
      });
    };

    mockFn.mockReturnValue = function(value: T) {
      return mockFn.mockImplementation(() => value);
    };

    mockFn.mockReturnValueOnce = function(value: T) {
      return mockFn.mockImplementationOnce(() => value);
    };

    mockFn.mockResolvedValue = function(value: T) {
      return mockFn.mockImplementation(() => Promise.resolve(value));
    };

    mockFn.mockResolvedValueOnce = function(value: T) {
      return mockFn.mockImplementationOnce(() => Promise.resolve(value));
    };

    mockFn.mockRejectedValue = function(value: any) {
      return mockFn.mockImplementation(() => Promise.reject(value));
    };

    mockFn.mockRejectedValueOnce = function(value: any) {
      return mockFn.mockImplementationOnce(() => Promise.reject(value));
    };

    return mockFn;
  },

  /**
   * Create a spy function
   */
  createSpy(originalFn?: Function): any {
    const spyFn = function(this: any, ...args: any[]): any {
      spyFn.calls.all.push({ args, returnValue: originalFn ? originalFn.apply(this, args) : undefined });
      spyFn.calls.count++;
      spyFn.calls.this.push(this);

      if (originalFn) {
        return originalFn.apply(this, args);
      }

      return undefined;
    };

    spyFn.calls = {
      all: [],
      count: 0,
      this: []
    };

    spyFn.restore = function() {
      if (originalFn) {
        // This is a simplified implementation
        // In a real implementation, we would restore the original function
      }
      return spyFn;
    };

    return spyFn;
  },

  /**
   * Create a stub function
   */
  createStub(): any {
    const stubFn = function(this: any, ...args: any[]): any {
      stubFn.calls.all.push({ args, returnValue: stubFn.returnValue });
      stubFn.calls.count++;
      stubFn.calls.this.push(this);

      if (stubFn.throwsError) {
        throw stubFn.throwsError;
      }

      if (stubFn.callsArgIndex >= 0) {
        const callback = args[stubFn.callsArgIndex];
        if (typeof callback === 'function') {
          return callback.apply(this, stubFn.callsArgArgs);
        }
      }

      if (stubFn.fakeFn) {
        return stubFn.fakeFn.apply(this, args);
      }

      return stubFn.returnValue;
    };

    stubFn.calls = {
      all: [],
      count: 0,
      this: []
    };

    stubFn.returnValue = undefined;
    stubFn.throwsError = undefined;
    stubFn.callsArgIndex = -1;
    stubFn.callsArgArgs = [];
    stubFn.fakeFn = undefined;

    stubFn.returns = function(value: any) {
      stubFn.returnValue = value;
      return stubFn;
    };

    stubFn.throws = function(error: Error) {
      stubFn.throwsError = error;
      return stubFn;
    };

    stubFn.resolves = function(value: any) {
      return stubFn.returns(Promise.resolve(value));
    };

    stubFn.rejects = function(error: Error) {
      return stubFn.throws(error);
    };

    stubFn.callsArg = function(index: number) {
      stubFn.callsArgIndex = index;
      stubFn.callsArgArgs = [];
      return stubFn;
    };

    stubFn.callsArgWith = function(index: number, ...args: any[]) {
      stubFn.callsArgIndex = index;
      stubFn.callsArgArgs = args;
      return stubFn;
    };

    stubFn.callsFake = function(fn: Function) {
      stubFn.fakeFn = fn;
      return stubFn;
    };

    stubFn.reset = function() {
      stubFn.calls.all = [];
      stubFn.calls.count = 0;
      stubFn.calls.this = [];
      stubFn.returnValue = undefined;
      stubFn.throwsError = undefined;
      stubFn.callsArgIndex = -1;
      stubFn.callsArgArgs = [];
      stubFn.fakeFn = undefined;
      return stubFn;
    };

    stubFn.restore = function() {
      stubFn.reset();
      return stubFn;
    };

    return stubFn;
  }
};

// Export all utility modules

