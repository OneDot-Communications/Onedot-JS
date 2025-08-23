/**
 * Type definitions for the testing package
 */

/**
 * Interface for test configuration
 */
export interface TestConfig {
  timeout?: number;
  verbose?: boolean;
  bail?: boolean;
  reporters?: string[];
  [key: string]: any;
}

/**
 * Interface for test context
 */
export interface TestContext {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'e2e';
  startTime: number;
  endTime?: number;
  duration?: number;
  data?: Record<string, any>;
  [key: string]: any;
}

/**
 * Interface for test result
 */
export interface TestResult {
  test: TestCase;
  status: 'passed' | 'failed' | 'skipped';
  error?: Error;
  assertions: AssertionResult[];
  duration: number;
  context?: TestContext;
  [key: string]: any;
}

/**
 * Interface for test suite
 */
export interface TestSuite {
  name: string;
  tests: TestCase[];
  beforeAll?: () => Promise<void> | void;
  afterAll?: () => Promise<void> | void;
  beforeEach?: () => Promise<void> | void;
  afterEach?: () => Promise<void> | void;
  [key: string]: any;
}

/**
 * Interface for test case
 */
export interface TestCase {
  id: string;
  name: string;
  suite: string;
  fn: (context: TestContext) => Promise<void> | void;
  timeout?: number;
  skip?: boolean;
  only?: boolean;
  [key: string]: any;
}

/**
 * Interface for test hook
 */
export interface TestHook {
  (context?: any): Promise<void> | void;
}

/**
 * Interface for test reporter
 */
export interface TestReporter {
  reportSuiteStart?: (suite: TestSuite) => void;
  reportSuiteEnd?: (suite: TestSuite) => void;
  reportTestStart?: (test: TestCase) => void;
  reportTestEnd?: (result: TestResult) => void;
  reportRunStart?: () => void;
  reportRunEnd?: (results: TestResult[]) => void;
  [key: string]: any;
}

/**
 * Interface for test runner
 */
export interface TestRunner {
  run: (testFiles?: string[]) => Promise<TestResult[]>;
  updateConfig: (config: Partial<TestConfig>) => void;
  [key: string]: any;
}

/**
 * Interface for assertion
 */
export interface Assertion {
  (actual: any, expected?: any, message?: string): AssertionResult;
  not: Assertion;
  [key: string]: any;
}

/**
 * Interface for assertion result
 */
export interface AssertionResult {
  passed: boolean;
  actual: any;
  expected: any;
  message: string;
  [key: string]: any;
}

/**
 * Interface for E2E configuration
 */
export interface E2EConfig {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
  [key: string]: any;
}

/**
 * Interface for E2E browser
 */
export interface E2EBrowser {
  newPage: () => Promise<E2EPage>;
  close: () => Promise<void>;
  [key: string]: any;
}

/**
 * Interface for E2E page
 */
export interface E2EPage {
  goto: (url: string) => Promise<void>;
  screenshot: (options?: any) => Promise<Buffer>;
  $: (selector: string) => Promise<E2EElement>;
  $$: (selector: string) => Promise<E2EElement[]>;
  click: (selector: string) => Promise<void>;
  fill: (selector: string, value: string) => Promise<void>;
  waitForSelector: (selector: string, options?: any) => Promise<void>;
  waitForNavigation: (options?: any) => Promise<void>;
  evaluate: (fn: Function, ...args: any[]) => Promise<any>;
  close: () => Promise<void>;
  [key: string]: any;
}

/**
 * Interface for E2E element
 */
export interface E2EElement {
  click: () => Promise<void>;
  fill: (value: string) => Promise<void>;
  text: () => Promise<string>;
  innerText: () => Promise<string>;
  innerHTML: () => Promise<string>;
  attribute: (name: string) => Promise<string | null>;
  boundingBox: () => Promise<{ x: number; y: number; width: number; height: number }>;
  screenshot: (options?: any) => Promise<Buffer>;
  [key: string]: any;
}

/**
 * Interface for integration configuration
 */
export interface IntegrationConfig {
  timeout?: number;
  setup?: () => Promise<void> | void;
  teardown?: () => Promise<void> | void;
  [key: string]: any;
}

/**
 * Interface for mock
 */
export interface Mock<T = any> {
  (...args: any[]): T;
  mockClear: () => void;
  mockReset: () => void;
  mockRestore: () => void;
  mockImplementation: (fn: (...args: any[]) => T) => Mock<T>;
  mockImplementationOnce: (fn: (...args: any[]) => T) => Mock<T>;
  mockReturnThis: () => Mock<T>;
  mockReturnValue: (value: T) => Mock<T>;
  mockReturnValueOnce: (value: T) => Mock<T>;
  mockResolvedValue: (value: T) => Mock<T>;
  mockResolvedValueOnce: (value: T) => Mock<T>;
  mockRejectedValue: (value: any) => Mock<T>;
  mockRejectedValueOnce: (value: any) => Mock<T>;
  calls: {
    all: Array<{ args: any[]; returnValue: T }>;
    count: number;
    this: any[];
  };
}

/**
 * Interface for spy
 */
export interface Spy {
  (...args: any[]): any;
  calls: {
    all: Array<{ args: any[]; returnValue: any }>;
    count: number;
    this: any[];
  };
  restore: () => void;
}

/**
 * Interface for stub
 */
export interface Stub {
  (...args: any[]): any;
  returns: (value: any) => Stub;
  throws: (error: Error) => Stub;
  resolves: (value: any) => Stub;
  rejects: (error: Error) => Stub;
  callsArg: (index: number) => Stub;
  callsFake: (fn: Function) => Stub;
  reset: () => Stub;
  restore: () => void;
}
