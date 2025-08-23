// Reactive system implementation
type Effect = () => void;
type Dep = Set<Effect>;
type KeyToDepMap = Map<any, Dep>;
type TargetMap = WeakMap<object, KeyToDepMap>;

// Global state for reactivity system
const targetMap: TargetMap = new WeakMap();
const activeEffect: Effect | null = null;
const effectStack: Effect[] = [];
const batchDepth = 0;
const batchedEffects: Effect[] = [];

// Track dependencies
export function track(target: object, key: any): void {
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  dep.add(activeEffect);
}

// Trigger effects
export function trigger(target: object, key: any, newValue?: any, oldValue?: any): void {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(key);
  if (!dep) return;

  // Run effects
  if (batchDepth > 0) {
    // Batch effects
    dep.forEach(effect => {
      if (!batchedEffects.includes(effect)) {
        batchedEffects.push(effect);
      }
    });
  } else {
    // Run effects immediately
    dep.forEach(effect => {
      if (effect !== activeEffect) {
        effect();
      }
    });
  }
}

// Reactive base handler
const baseHandler: ProxyHandler<object> = {
  get(target: object, key: any, receiver: any) {
    track(target, key);
    return Reflect.get(target, key, receiver);
  },
  set(target: object, key: any, value: any, receiver: any) {
    const oldValue = Reflect.get(target, key, receiver);
    const result = Reflect.set(target, key, value, receiver);

    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }

    return result;
  }
};

// Create reactive object
export function reactive<T extends object>(target: T): T {
  return new Proxy(target, baseHandler);
}

// Create ref
export interface Ref<T> {
  value: T;
}

export function ref<T>(value: T): Ref<T> {
  const refObject: Ref<T> = {
    get value() {
      track(refObject, 'value');
      return value;
    },
    set value(newValue) {
      if (newValue !== value) {
        value = newValue;
        trigger(refObject, 'value', newValue);
      }
    }
  };

  return refObject;
}

// Create computed
export function computed<T>(getter: () => T): () => T {
  let dirty = true;
  let value: T;
  const effect = () => {
    dirty = true;
  };

  return () => {
    if (dirty) {
      dirty = false;
      value = runWithEffect(getter, effect);
    }
    return value;
  };
}

// Run effect
export function runWithEffect<T>(fn: () => T, effect: Effect): T {
  try {
    effectStack.push(effect);
    activeEffect = effect;
    return fn();
  } finally {
    effectStack.pop();
    activeEffect = effectStack.length > 0 ? effectStack[effectStack.length - 1] : null;
  }
}

// Watch effect
export function watchEffect(effect: Effect, options: { flush?: 'pre' | 'post' | 'sync' } = {}): () => void {
  const { flush = 'pre' } = options;

  const runner = () => {
    try {
      activeEffect = runner;
      return effect();
    } finally {
      activeEffect = null;
    }
  };

  runner();

  return () => {
    // Cleanup logic would go here
  };
}

// Lifecycle hooks
const lifecycleHooks: Record<string, Function[]> = {
  mounted: [],
  updated: [],
  unmounted: []
};

export function onMounted(hook: Function): void {
  lifecycleHooks.mounted.push(hook);
}

export function onUpdated(hook: Function): void {
  lifecycleHooks.updated.push(hook);
}

export function onUnmounted(hook: Function): void {
  lifecycleHooks.unmounted.push(hook);
}

// Trigger lifecycle hooks
export function callLifecycleHook(hookName: string): void {
  const hooks = lifecycleHooks[hookName];
  if (hooks) {
    hooks.forEach(hook => hook());
  }
}

// Batch updates
export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const effects = [...batchedEffects];
      batchedEffects.length = 0;
      effects.forEach(effect => effect());
    }
  }
}

// Next tick
export function nextTick(callback?: Function): Promise<void> {
  return new Promise(resolve => {
    if (callback) {
      Promise.resolve().then(() => {
        callback();
        resolve();
      });
    } else {
      Promise.resolve().then(resolve);
    }
  });
}

// Unwrap refs
export function unref<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? ref.value : ref;
}

// Check if ref
export function isRef<T>(r: any): r is Ref<T> {
  return !!(r && r.__v_isRef === true);
}
