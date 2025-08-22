// Cross-platform testing utilities for OneDotJS
export class TestRunner {
  private tests: Array<() => Promise<void>> = [];
  addTest(test: () => Promise<void>) {
    this.tests.push(test);
  }
  async runAll() {
    for (const test of this.tests) {
      try {
        await test();
        console.log('Test passed');
      } catch (e) {
        console.error('Test failed', e);
      }
    }
  }
}

export function assertEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

export function assertTrue(value: boolean, message?: string) {
  if (!value) {
    throw new Error(message || 'Expected true');
  }
}
