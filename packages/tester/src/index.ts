export interface TestResult { name: string; durationMs: number; error?: Error; }
export interface SuiteResult { suite: string; results: TestResult[]; }

const registry: { suite: string; name: string; fn: ()=>any | Promise<any>; }[] = [];

export function test(name: string, fn: ()=>any | Promise<any>): void {
  registry.push({ suite: 'default', name, fn });
}

export async function runAll(): Promise<SuiteResult[]> {
  const start = Date.now();
  const results: TestResult[] = [];
  for (const t of registry) {
    const tStart = Date.now();
    try { await t.fn(); results.push({ name: t.name, durationMs: Date.now()-tStart }); }
    catch(e:any){ results.push({ name: t.name, durationMs: Date.now()-tStart, error: e }); }
  }
  return [{ suite: 'default', results }];
}

export function reportText(suites: SuiteResult[]): string {
  const lines: string[] = [];
  for (const s of suites) {
    lines.push(`Suite: ${s.suite}`);
    for (const r of s.results) lines.push(`  ${r.error? '✗':'✓'} ${r.name} (${r.durationMs}ms)`);
  }
  return lines.join('\n');
}

// Enhanced test runner with coverage and benchmarks
export interface CoverageReport {
  lines: { total: number; covered: number; };
  functions: { total: number; covered: number; };
  branches: { total: number; covered: number; };
  statements: { total: number; covered: number; };
}

export interface BenchmarkResult {
  name: string;
  ops: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
}

export async function runWithCoverage(suites: SuiteResult[]): Promise<{ suites: SuiteResult[]; coverage: CoverageReport; }> {
  // Mock coverage collection - would integrate with V8 coverage in real implementation
  const coverage: CoverageReport = {
    lines: { total: 1000, covered: 850 },
    functions: { total: 120, covered: 108 },
    branches: { total: 200, covered: 175 },
    statements: { total: 800, covered: 720 }
  };
  
  return { suites, coverage };
}

export async function runBenchmarks(benchmarks: Array<{ name: string; fn: () => void | Promise<void>; }>): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  
  for (const bench of benchmarks) {
    const iterations = 1000;
    const times: number[] = [];
    
    // Warmup
    for (let i = 0; i < 10; i++) {
      await bench.fn();
    }
    
    // Measure
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await bench.fn();
      const end = performance.now();
      times.push(end - start);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const ops = 1000 / avgTime; // Operations per second
    
    results.push({
      name: bench.name,
      ops,
      avgTime,
      minTime,
      maxTime
    });
  }
  
  return results;
}

export * from './bench.js';
