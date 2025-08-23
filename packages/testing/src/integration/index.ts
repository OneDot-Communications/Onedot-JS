/**
 * Integration testing implementation
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

import {
  IntegrationConfig,
  TestCase,
  TestConfig,
  TestResult,
  TestRunner,
  TestSuite
} from '../types';
import { UnitTester } from '../unit';

/**
 * IntegrationTester - Runs integration tests
 */
export class IntegrationTester extends EventEmitter implements TestRunner {
  private config: IntegrationConfig & TestConfig;
  private suites: Map<string, TestSuite> = new Map();
  private tests: TestCase[] = [];
  private unitTester: UnitTester;

  constructor(config: TestConfig = {}) {
    super();
    this.config = {
      timeout: 10000,
      verbose: false,
      bail: false,
      reporters: ['console'],
      ...config
    };

    this.unitTester = new UnitTester(this.config);
  }

  /**
   * Update the test configuration
   */
  public updateConfig(config: Partial<IntegrationConfig & TestConfig>): void {
    this.config = { ...this.config, ...config };
    this.unitTester.updateConfig(config);
    this.emit('configUpdated', this.config);
  }

  /**
   * Discover and load test files
   */
  public async discoverTests(testDir: string = './tests/integration'): Promise<void> {
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
      filename.endsWith('.integration.test.ts') ||
      filename.endsWith('.integration.test.js') ||
      filename.endsWith('.integration.spec.ts') ||
      filename.endsWith('.integration.spec.js') ||
      filename.includes('.integration.')
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
   * Run integration tests
   */
  public async run(testFiles?: string[]): Promise<TestResult[]> {
    // Run setup function if provided
    if (this.config.setup) {
      try {
        await this.config.setup();
      } catch (error) {
        console.error('Error in integration test setup:', error);
        return [];
      }
    }

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

    // Run tests using the unit tester
    const results = await this.unitTester.run();

    // Run teardown function if provided
    if (this.config.teardown) {
      try {
        await this.config.teardown();
      } catch (error) {
        console.error('Error in integration test teardown:', error);
      }
    }

    return results;
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
}
