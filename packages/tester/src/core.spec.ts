import { test } from './index.js';
import { signal, computed } from '@onedot/core';

test('signal basic set/get', () => {
  const s = signal(1);
  if (s.value !== 1) throw new Error('initial');
  s.value = 2;
  if (s.value !== 2) throw new Error('mutate');
});

test('computed derives', () => {
  const s = signal(2);
  const d = computed(()=>s.value * 3);
  if (d.value !== 6) throw new Error('bad compute');
  s.value = 3;
  if (d.value !== 9) throw new Error('bad recompute');
});