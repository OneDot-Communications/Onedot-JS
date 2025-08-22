// Reactive system with fine-grained dependency tracking
export type CleanupFn = () => void;

let activeEffect: ReactiveEffect | null = null;
const effectStack: ReactiveEffect[] = [];

export class ReactiveEffect<T = any> {
  private readonly fn: () => T;
  deps: Set<Set<ReactiveEffect>> = new Set();
  active = true;
  constructor(fn: () => T) { this.fn = fn; }
  run(): T {
    if (!this.active) return this.fn();
    try {
      effectStack.push(this);
      activeEffect = this;
      return this.fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1] || null;
    }
  }
  stop() {
    if (this.active) {
      this.deps.forEach(dep => dep.delete(this));
      this.deps.clear();
      this.active = false;
    }
  }
}

const targetMap = new WeakMap<object, Map<PropertyKey, Set<ReactiveEffect>>>();

function track(target: object, key: PropertyKey) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) targetMap.set(target, depsMap = new Map());
  let dep = depsMap.get(key);
  if (!dep) depsMap.set(key, dep = new Set());
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.add(dep);
  }
}

function trigger(target: object, key: PropertyKey) {
  const depsMap = targetMap.get(target); if (!depsMap) return;
  const dep = depsMap.get(key); if (!dep) return;
  [...dep].forEach(e => e.run());
}

export function signal<T>(value: T) {
  const box = { value };
  return {
    get value() { track(box, 'value'); return box.value; },
    set value(v: T) { if (v !== box.value) { box.value = v; trigger(box, 'value'); } }
  };
}

export function computed<T>(getter: () => T) {
  let cached: T; let dirty = true;
  const runner = new ReactiveEffect(() => { dirty = true; return getter(); });
  return {
    get value() {
      if (dirty) { cached = runner.run(); dirty = false; }
      track(runner as any, 'value');
      return cached;
    }
  };
}

export function effect(fn: () => void): () => void {
  const runner = new ReactiveEffect(fn);
  runner.run();
  return () => runner.stop();
}

export function batch(fn: () => void) { fn(); }
