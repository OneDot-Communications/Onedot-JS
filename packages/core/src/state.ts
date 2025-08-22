// Integrated global state store with slices and reactive selectors
import { signal, computed, effect } from './reactivity.js';

export interface Slice<T> { name: string; state: ReturnType<typeof signal<T>>; }

export class Store {
  private slices = new Map<string, Slice<any>>();
  createSlice<T>(name: string, initial: T) {
    if (this.slices.has(name)) throw new Error('Slice exists');
    const s: Slice<T> = { name, state: signal(initial) };
    this.slices.set(name, s);
    return {
      get: () => s.state.value as T,
      set: (v: T) => (s.state.value = v),
      update: (fn: (v: T) => T) => (s.state.value = fn(s.state.value)),
      select: <R>(sel: (v: T) => R) => computed(() => sel(s.state.value))
    };
  }
  getState<T>(name: string): T { return this.slices.get(name)!.state.value; }
}

export const globalStore = new Store();

export function observe<T>(selector: () => T, cb: (value: T) => void) {
  let prev: T;
  effect(()=>{ const v = selector(); if (v !== prev) { prev = v; cb(v); } });
}
