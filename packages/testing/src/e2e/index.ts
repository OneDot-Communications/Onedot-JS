/**
 * End-to-end testing implementation
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

import {
  E2EBrowser,
  E2EConfig,
  E2EElement,
  E2EPage,
  TestCase,
  TestConfig,
  TestContext,
  TestResult,
  TestRunner,
  TestSuite
} from '../types';
import { UnitTester } from '../unit';
import { TestingUtils } from '../utils';

/**
 * E2ETester - Runs end-to-end tests
 */
export class E2ETester extends EventEmitter implements TestRunner {
  private config: E2EConfig & TestConfig;
  private suites: Map<string, TestSuite> = new Map();
  private tests: TestCase[] = [];
  private unitTester: UnitTester;
  private browser: E2EBrowser | null = null;

  constructor(config: TestConfig = {}) {
    super();
    this.config = {
      timeout: 30000,
      verbose: false,
      bail: false,
      reporters: ['console'],
      browser: 'chromium',
      headless: true,
      slowMo: 0,
      ...config
    };

    this.unitTester = new UnitTester(this.config);
  }

  /**
   * Update the test configuration
   */
  public updateConfig(config: Partial<E2EConfig & TestConfig>): void {
    this.config = { ...this.config, ...config };
    this.unitTester.updateConfig(config);
    this.emit('configUpdated', this.config);
  }

  /**
   * Discover and load test files
   */
  public async discoverTests(testDir: string = './tests/e2e'): Promise<void> {
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
      filename.endsWith('.e2e.test.ts') ||
      filename.endsWith('.e2e.test.js') ||
      filename.endsWith('.e2e.spec.ts') ||
      filename.endsWith('.e2e.spec.js') ||
      filename.includes('.e2e.')
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
   * Launch the browser
   */
  private async launchBrowser(): Promise<E2EBrowser> {
    if (this.browser) {
      return this.browser;
    }

    const options: puppeteer.LaunchOptions = {
      headless: this.config.headless,
      slowMo: this.config.slowMo
    };

    if (this.config.browser === 'chromium') {
      options.product = 'chrome';
    } else if (this.config.browser === 'firefox') {
      options.product = 'firefox';
    } else if (this.config.browser === 'webkit') {
      options.product = 'webkit';
    }

    const browser = await puppeteer.launch(options);

    // Create a wrapper that implements our E2EBrowser interface
    const browserWrapper: E2EBrowser = {
      newPage: async (): Promise<E2EPage> => {
        const page = await browser.newPage();

        // Create a wrapper that implements our E2EPage interface
        const pageWrapper: E2EPage = {
          goto: async (url: string): Promise<void> => {
            await page.goto(url);
          },

          screenshot: async (options?: any): Promise<Buffer> => {
            return await page.screenshot(options);
          },

          $: async (selector: string): Promise<E2EElement> => {
            const element = await page.$(selector);

            // Create a wrapper that implements our E2EElement interface
            const elementWrapper: E2EElement = {
              click: async (): Promise<void> => {
                await element.click();
              },

              fill: async (value: string): Promise<void> => {
                await element.fill(value);
              },

              text: async (): Promise<string> => {
                return await element.evaluate(el => el.textContent || '');
              },

              innerText: async (): Promise<string> => {
                return await element.evaluate(el => el.innerText || '');
              },

              innerHTML: async (): Promise<string> => {
                return await element.evaluate(el => el.innerHTML || '');
              },

              attribute: async (name: string): Promise<string | null> => {
                return await element.evaluate((el, name) => el.getAttribute(name), name);
              },

              boundingBox: async (): Promise<{ x: number; y: number; width: number; height: number }> => {
                return await element.boundingBox() || { x: 0, y: 0, width: 0, height: 0 };
              },

              screenshot: async (options?: any): Promise<Buffer> => {
                return await element.screenshot(options);
              }
            };

            return elementWrapper;
          },

          $$: async (selector: string): Promise<E2EElement[]> => {
            const elements = await page.$$(selector);

            // Create wrappers that implement our E2EElement interface
            return elements.map(element => ({
              click: async (): Promise<void> => {
                await element.click();
              },

              fill: async (value: string): Promise<void> => {
                await element.fill(value);
              },

              text: async (): Promise<string> => {
                return await element.evaluate(el => el.textContent || '');
              },

              innerText: async (): Promise<string> => {
                return await element.evaluate(el => el.innerText || '');
              },

              innerHTML: async (): Promise<string> => {
                return await element.evaluate(el => el.innerHTML || '');
              },

              attribute: async (name: string): Promise<string | null> => {
                return await element.evaluate((el, name) => el.getAttribute(name), name);
              },

              boundingBox: async (): Promise<{ x: number; y: number; width: number; height: number }> => {
                return await element.boundingBox() || { x: 0, y: 0, width: 0, height: 0 };
              },

              screenshot: async (options?: any): Promise<Buffer> => {
                return await element.screenshot(options);
              }
            }));
          },

          click: async (selector: string): Promise<void> => {
            await page.click(selector);
          },

          fill: async (selector: string, value: string): Promise<void> => {
            await page.fill(selector, value);
          },

          waitForSelector: async (selector: string, options?: any): Promise<void> => {
            await page.waitForSelector(selector, options);
          },

          waitForNavigation: async (options?: any): Promise<void> => {
            await page.waitForNavigation(options);
          },

          evaluate: async (fn: Function, ...args: any[]): Promise<any> => {
            return await page.evaluate(fn, ...args);
          },

          close: async (): Promise<void> => {
            await page.close();
          }
        };

        return pageWrapper;
      },

      close: async (): Promise<void> => {
        await browser.close();
        this.browser = null;
      }
    };

    this.browser = browserWrapper;
    return browserWrapper;
  }

  /**
   * Close the browser
   */
  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Run E2E tests
   */
  public async run(testFiles?: string[]): Promise<TestResult[]> {
    // Launch the browser
    await this.launchBrowser();

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
    const results: TestResult[] = [];

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
        const context = TestingUtils.createTestContext(test.name, 'e2e');

        // Add browser to context
        context.browser = this.browser;

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

    // Close the browser
    await this.closeBrowser();

    return results;
  }

  /**
   * Run a single test
   */
  private async runTest(test: TestCase, context: TestContext): Promise<TestResult> {
    const startTime = performance.now();

    try {
      // Set up timeout
      const timeout = test.timeout || this.config.timeout || 30000;
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

      // Calculate duration
      const duration = performance.now() - startTime;

      // Update context
      context.endTime = performance.now();
      context.duration = duration;

      // Return result
      return TestingUtils.createSuccessResult(test, [], duration, context);
    } catch (error) {
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
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
        [],
        duration,
        context
      );
    }
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
   * Get the browser
   */
  public getBrowser(): E2EBrowser | null {
    return this.browser;
  }
}
