interface Mark { name: string; time: number; detail?: any; }
const marks: Mark[] = [];

export function mark(name: string, detail?: any): void { marks.push({ name, time: performance.now(), detail }); }
export function measure(from: string, to: string): number | null {
  const a = findLast(marks, m=>m.name===from);
  const b = findLast(marks, m=>m.name===to);
  if (!a || !b) return null;
  return b.time - a.time;
}
export function timeline(): Mark[] { return [...marks]; }
export function reset(): void { marks.length = 0; }

export function withMeasure<T>(label: string, fn: ()=>T): T {
  const start = performance.now();
  try { return fn(); } finally { marks.push({ name: label, time: performance.now(), detail: { duration: performance.now()-start } }); }
}

function findLast<T>(arr: T[], pred: (v:T)=>boolean): T | undefined {
  for (let i=arr.length-1;i>=0;i--) if (pred(arr[i])) return arr[i];
  return undefined;
}
