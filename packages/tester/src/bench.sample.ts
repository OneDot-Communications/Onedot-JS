import { signal } from '@onedot/core';
import { bench, runBenches } from './bench.js';

async function benchSignalSet() {
  return bench('signal_set', () => {
    const s = signal(0);
    for (let i=0;i<100;i++) s.value++;
  }, 500);
}

async function main(){
  console.log(await runBenches([benchSignalSet]));
}

main();
