// Advanced benchmark harness with statistical analysis
export interface BenchResult { 
  name: string; 
  iterations: number; 
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  nsPerOp: number; 
  opsPerSecond: number;
  percentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
}

export interface BenchOptions {
  iterations?: number;
  warmupIterations?: number;
  minDuration?: number; // Minimum duration in ms
  maxDuration?: number; // Maximum duration in ms
  gc?: boolean; // Force garbage collection between runs
}

export interface BenchSuite {
  name: string;
  setup?: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
  benchmarks: Array<{
    name: string;
    fn: () => void | Promise<void>;
    options?: BenchOptions;
  }>;
}

export class BenchmarkRunner {
  private results: BenchResult[] = [];

  async bench(
    name: string, 
    fn: () => void | Promise<void>, 
    options: BenchOptions = {}
  ): Promise<BenchResult> {
    const {
      iterations = 10000,
      warmupIterations = 100,
      minDuration = 1000,
      maxDuration = 10000,
      gc = false
    } = options;

    console.log(`🏃 Running benchmark: ${name}`);

    // Warmup phase
    console.log(`  Warming up (${warmupIterations} iterations)...`);
    for (let i = 0; i < warmupIterations; i++) {
      await fn();
    }

    // Force garbage collection if requested
    if (gc && global.gc) {
      global.gc();
    }

    // Measurement phase
    const times: number[] = [];
    let totalIterations = 0;
    const startTime = performance.now();

    console.log(`  Measuring...`);

    while (totalIterations < iterations) {
      const iterStart = performance.now();
      await fn();
      const iterEnd = performance.now();
      
      times.push(iterEnd - iterStart);
      totalIterations++;

      // Check if we've exceeded max duration
      if (performance.now() - startTime > maxDuration) {
        console.log(`  Stopped early due to max duration (${totalIterations} iterations)`);
        break;
      }

      // Check if we've met minimum requirements
      if (totalIterations >= iterations && performance.now() - startTime >= minDuration) {
        break;
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Statistical analysis
    const sortedTimes = times.slice().sort((a, b) => a - b);
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    // Standard deviation
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);

    // Percentiles
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    const nsPerOp = (avgTime * 1e6); // Convert ms to ns
    const opsPerSecond = 1000 / avgTime; // Operations per second

    const result: BenchResult = {
      name,
      iterations: totalIterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      standardDeviation,
      nsPerOp,
      opsPerSecond,
      percentiles: { p50, p95, p99 }
    };

    this.results.push(result);
    console.log(`  ✅ ${name}: ${opsPerSecond.toFixed(0)} ops/sec (${avgTime.toFixed(3)}ms avg)`);

    return result;
  }

  async runSuite(suite: BenchSuite): Promise<BenchResult[]> {
    console.log(`\n📊 Running benchmark suite: ${suite.name}`);
    
    if (suite.setup) {
      console.log('  Setting up...');
      await suite.setup();
    }

    const suiteResults: BenchResult[] = [];

    try {
      for (const benchmark of suite.benchmarks) {
        const result = await this.bench(
          `${suite.name}/${benchmark.name}`,
          benchmark.fn,
          benchmark.options
        );
        suiteResults.push(result);
      }
    } finally {
      if (suite.teardown) {
        console.log('  Tearing down...');
        await suite.teardown();
      }
    }

    return suiteResults;
  }

  getResults(): BenchResult[] {
    return [...this.results];
  }

  generateReport(): string {
    if (this.results.length === 0) {
      return 'No benchmark results available.';
    }

    const sorted = this.results.slice().sort((a, b) => b.opsPerSecond - a.opsPerSecond);
    
    let report = '\n📈 BENCHMARK REPORT\n';
    report += '='.repeat(80) + '\n\n';

    // Summary table
    report += 'PERFORMANCE SUMMARY\n';
    report += '-'.repeat(80) + '\n';
    report += sprintf('%-40s %12s %12s %12s\n', 'Benchmark', 'Ops/Sec', 'Avg Time', 'Std Dev');
    report += '-'.repeat(80) + '\n';

    for (const result of sorted) {
      report += sprintf(
        '%-40s %12s %12s %12s\n',
        result.name.length > 40 ? result.name.slice(0, 37) + '...' : result.name,
        result.opsPerSecond.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        `${result.avgTime.toFixed(3)}ms`,
        `${result.standardDeviation.toFixed(3)}ms`
      );
    }

    report += '\n';

    // Detailed results
    report += 'DETAILED RESULTS\n';
    report += '-'.repeat(80) + '\n';

    for (const result of sorted) {
      report += `\n${result.name}\n`;
      report += '  ' + '-'.repeat(60) + '\n';
      report += `  Iterations:      ${result.iterations.toLocaleString()}\n`;
      report += `  Total Time:      ${result.totalTime.toFixed(2)}ms\n`;
      report += `  Average Time:    ${result.avgTime.toFixed(3)}ms\n`;
      report += `  Min Time:        ${result.minTime.toFixed(3)}ms\n`;
      report += `  Max Time:        ${result.maxTime.toFixed(3)}ms\n`;
      report += `  Std Deviation:   ${result.standardDeviation.toFixed(3)}ms\n`;
      report += `  Ops/Second:      ${result.opsPerSecond.toLocaleString(undefined, { maximumFractionDigits: 0 })}\n`;
      report += `  Nanosecs/Op:     ${result.nsPerOp.toFixed(0)}\n`;
      report += '  Percentiles:\n';
      report += `    50th:          ${result.percentiles.p50.toFixed(3)}ms\n`;
      report += `    95th:          ${result.percentiles.p95.toFixed(3)}ms\n`;
      report += `    99th:          ${result.percentiles.p99.toFixed(3)}ms\n`;
    }

    return report;
  }

  exportJSON(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      platform: this.getPlatformInfo(),
      results: this.results
    }, null, 2);
  }

  private getPlatformInfo(): any {
    const info: any = {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
    };

    if (typeof process !== 'undefined') {
      info.node = (process as any).version;
      info.platform = (process as any).platform;
      info.arch = (process as any).arch;
    }

    if (typeof Deno !== 'undefined') {
      info.deno = (Deno as any).version;
    }

    return info;
  }

  clear(): void {
    this.results = [];
  }
}

// Legacy compatibility function
export async function bench(
  name: string, 
  fn: () => void | Promise<void>, 
  iterations = 10000
): Promise<BenchResult> {
  const runner = new BenchmarkRunner();
  return runner.bench(name, fn, { iterations });
}

export async function runBenches(suites: (()=>Promise<BenchResult>)[]): Promise<string> {
  const results: BenchResult[] = [];
  for (const s of suites) {
    results.push(await s());
  }
  
  results.sort((a,b) => a.nsPerOp - b.nsPerOp);
  const lines = results.map(r => 
    `${r.name}\t${r.iterations}\t${r.totalTime.toFixed(2)}ms\t${r.nsPerOp.toFixed(1)} ns/op`
  );
  
  return lines.join('\n');
}

// Simple sprintf implementation for formatting
function sprintf(format: string, ...args: any[]): string {
  let i = 0;
  return format.replace(/%[-#+ 0]*\d*(?:\.\d*)?[sdj%]/g, (match) => {
    if (match === '%%') return '%';
    if (i >= args.length) return match;
    
    const arg = args[i++];
    
    if (match.includes('s')) {
      return String(arg);
    } else if (match.includes('d')) {
      return String(Number(arg));
    } else if (match.includes('j')) {
      return JSON.stringify(arg);
    }
    
    return match;
  });
}

// Common benchmarks for framework components
export const frameworkBenchmarks = {
  reactivity: {
    name: 'Reactivity System',
    benchmarks: [
      {
        name: 'signal creation',
        fn: async () => {
          const { signal } = await import('../../core/src/reactivity.js');
          signal(42);
        }
      },
      {
        name: 'signal read',
        fn: async () => {
          const { signal } = await import('../../core/src/reactivity.js');
          const s = signal(42);
          s.value;
        }
      },
      {
        name: 'signal write',
        fn: async () => {
          const { signal } = await import('../../core/src/reactivity.js');
          const s = signal(42);
          s.value = 43;
        }
      }
    ]
  },
  
  component: {
    name: 'Component System',
    benchmarks: [
      {
        name: 'component creation',
        fn: async () => {
          const { h } = await import('../../core/src/component.js');
          h('div', {}, 'hello');
        }
      },
      {
        name: 'component render',
        fn: async () => {
          const { h, render } = await import('../../core/src/component.js');
          const { webHost } = await import('../../runtime/src/webHost.js');
          const div = document.createElement('div');
          render(h('span', {}, 'test'), webHost, div);
        }
      }
    ]
  }
};

export default BenchmarkRunner;
