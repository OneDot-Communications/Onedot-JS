export * from './reactivity.js';
export * from './component.js';
export * from './router.js';
export * from './state.js';
export * from './di.js';
// Memory pool utility
export class ObjectPool<T extends object> {
	private free: T[] = [];
	private createFn: () => T;
	constructor(create: () => T, private max = 1000) { this.createFn = create; }
	acquire(): T { return this.free.pop() || this.createFn(); }
	release(obj: T): void { if (this.free.length < this.max) this.free.push(obj); }
	size(): number { return this.free.length; }
}
