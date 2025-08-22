export class TestRunner {
  async run(testModules: any[]): Promise<TestResults> {
    const results: TestResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
    for (const testModule of testModules) {
      await this.runTestFile(testModule, results);
    }
    return results;
  }

  private async runTestFile(
    testModule: any,
    results: TestResults
  ): Promise<void> {
    const tests = Object.keys(testModule)
      .filter(key => typeof testModule[key] === 'function' && key.startsWith('test'));
    for (const testName of tests) {
      try {
        await testModule[testName]();
        results.passed++;
      } catch (error) {
        results.errors.push({
          file: 'unknown',
          error: `${testName}: ${error instanceof Error ? error.message : String(error)}`
        });
        results.failed++;
      }
    }
  }
}

interface TestResults {
  passed: number;
  failed: number;
  errors: TestError[];
}

interface TestError {
  file: string;
  error: string;
}
