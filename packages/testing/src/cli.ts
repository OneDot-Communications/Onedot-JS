import { TestRunner } from './test-runner';

export async function runTests(testModules: any[]): Promise<void> {
  const runner = new TestRunner();
  const results = await runner.run(testModules);
  console.log(`Tests: ${results.passed} passed, ${results.failed} failed`);
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(error => {
      console.log(`- ${error.file}: ${error.error}`);
    });
  }
}
