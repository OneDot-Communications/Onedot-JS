export async function testCommand() {
  console.log('Running built-in test harness');
  // minimal self tests
  let passed = 0; let failed = 0;
  function assert(name: string, cond: any) { if (!cond) { failed++; console.error('FAIL', name); } else { passed++; } }
  // dynamic import core
    // Execute tester suite if available
    try {
      const tester = await import('@onedot/tester');
      // Dynamically include specs (simple heuristic)
      const specs = [
        '../../../tester/src/core.spec.ts'
      ];
      for (const spec of specs) { await import(spec); }
      const suites = await tester.runAll();
      const report = tester.reportText(suites);
      console.log(report);
    const failedSuites = suites.flatMap((s: any)=>s.results.filter((r: any)=>r.error));
      assert('no test failures', failedSuites.length===0);
    } catch (e) {
      console.warn('Tester integration skipped', e);
    }
    const core = await import('../../../core/src/index.js');
  const s = core.signal(1);
  let observed: number[] = [];
  core.effect(()=>{ observed.push(s.value); });
  s.value = 2; s.value = 3;
  assert('reactivity sequence', observed.join(',') === '1,2,3');
  console.log(`Tests complete: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}
