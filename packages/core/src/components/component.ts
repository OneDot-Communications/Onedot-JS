import { computed, onMounted, onUnmounted, ref, watchEffect } from '../reactivity';
import { BaseComponent, ComponentOptions } from './base-component';

export interface ComponentProps {
  [key: string]: any;
}

export class Component extends BaseComponent {
  constructor(options: ComponentOptions = {}) {
    super(options);
    this.setupComponent();
  }

  private setupComponent(): void {
    // Setup reactivity for component
    this.setupReactivity();

    // Setup lifecycle hooks
    this.setupLifecycleHooks();
  }

  private setupReactivity(): void {
    // Make props reactive
    if (this.props) {
      Object.keys(this.props).forEach(key => {
        Object.defineProperty(this, key, {
          get: () => this.props[key],
          set: (value) => { this.props[key] = value; },
          enumerable: true,
          configurable: true
        });
      });
    }

    // Make state reactive
    if (this.state) {
      Object.keys(this.state).forEach(key => {
        Object.defineProperty(this, key, {
          get: () => this.state[key],
          set: (value) => { this.state[key] = value; },
          enumerable: true,
          configurable: true
        });
      });
    }

    // Make computed properties available
    if (this.computed) {
      Object.keys(this.computed).forEach(key => {
        Object.defineProperty(this, key, {
          get: () => this.computed[key],
          enumerable: true,
          configurable: true
        });
      });
    }

    // Bind methods to component instance
    if (this.methods) {
      Object.keys(this.methods).forEach(key => {
        this[key] = this.methods[key].bind(this);
      });
    }
  }

  private setupLifecycleHooks(): void {
    // Convert lifecycle hooks to use composition API
    if (this.options.lifecycle?.onMounted) {
      onMounted(this.options.lifecycle.onMounted.bind(this));
    }

    if (this.options.lifecycle?.onUnmounted) {
      onUnmounted(this.options.lifecycle.onUnmounted.bind(this));
    }
  }

  // Composition API helpers
  public useState<T>(initialValue: T): [() => T, (value: T) => void] {
    const state = ref<T>(initialValue);
    return [
      () => state.value,
      (value: T) => { state.value = value; }
    ];
  }

  public useComputed<T>(getter: () => T): () => T {
    return computed(getter);
  }

  public useEffect(effect: () => void | (() => void), deps?: any[]): void {
    watchEffect(effect, { flush: 'post' });
  }

  public useWatch<T>(source: () => T, callback: (value: T, oldValue: T) => void, options?: { immediate?: boolean; deep?: boolean }): void {
    watchEffect(() => {
      const value = source();
      callback(value, undefined as any);
    }, { immediate: options?.immediate, deep: options?.deep });
  }

  public useRef<T>(initialValue: T): { current: T } {
    return { current: initialValue };
  }

  public provide<T>(key: string | symbol, value: T): void {
    // Implementation would integrate with DI system
  }

  public inject<T>(key: string | symbol): T | undefined {
    // Implementation would integrate with DI system
    return undefined;
  }
}
