import { effect, signal } from './reactivity.js';

export interface VNode {
  type: string | Component<any> | FunctionComponent<any>;
  props: any;
  children: VNode[] | string | number | null;
  key?: string | number;
}

export interface ComponentContext {
  hooks: any[];
  hookIndex: number;
  state: Record<string, any>;
  cleanup: (()=>void)[];
}

export type FunctionComponent<P> = (props: P, ctx: ComponentContext) => VNode | string | number | null;
export interface Component<P> { new (props: P, ctx: ComponentContext): { render(): VNode | string | number | null }; }

export function h(type: VNode['type'], props: any, ...children: any[]): VNode {
  return { type, props: props || {}, children };
}

const currentStack: ComponentContext[] = [];
// Simple context object pool to reduce GC churn during heavy renders
const ctxPool: ComponentContext[] = [];
function acquireCtx(): ComponentContext { return ctxPool.pop() || { hooks: [], hookIndex: 0, state: {}, cleanup: [] }; }
function releaseCtx(ctx: ComponentContext) { ctx.hookIndex = 0; ctx.cleanup.forEach(fn=>fn()); ctx.cleanup.length = 0; ctxPool.push(ctx); }

export function useState<T>(initial: T): [T, (v: T) => void] {
  const ctx = currentStack[currentStack.length - 1];
  const idx = ctx.hookIndex++;
  if (!(idx in ctx.hooks)) ctx.hooks[idx] = signal(initial);
  const box = ctx.hooks[idx];
  return [box.value, (v: T) => (box.value = v)];
}

export function useEffect(fn: () => void) {
  const ctx = currentStack[currentStack.length - 1];
  const idx = ctx.hookIndex++;
  if (ctx.hooks[idx]) ctx.cleanup.push(ctx.hooks[idx]);
  const stop = effect(fn);
  ctx.hooks[idx] = stop;
}

export interface RenderHost {
  createElement(tag: string, props: any): any;
  setText(node: any, text: string): void;
  append(parent: any, child: any): void;
  replace(oldNode: any, newNode: any): void;
  setProp(node: any, key: string, value: any): void;
  clear(node: any): void;
}

export function render(vnode: VNode | string | number | null, host: RenderHost, container: any) {
  host.clear(container);
  mount(vnode, host, container);
}

function mount(v: any, host: RenderHost, parent: any) {
  if (v == null) return;
  if (typeof v === 'string' || typeof v === 'number') {
    const textNode = host.createElement('text', {});
    host.setText(textNode, String(v));
    host.append(parent, textNode);
    return;
  }
  if (typeof v.type === 'function') {
  const ctx: ComponentContext = acquireCtx();
    currentStack.push(ctx);
    let out: any;
    if (isClassComponent(v.type)) {
      const inst = new (v.type as any)(v.props, ctx);
      out = inst.render();
    } else {
      out = (v.type as FunctionComponent<any>)(v.props, ctx);
    }
  currentStack.pop();
  releaseCtx(ctx);
    mount(out, host, parent);
    return;
  }
  const node = host.createElement(v.type as string, v.props);
  Object.entries(v.props || {}).forEach(([k, val]) => host.setProp(node, k, val));
  (v.children as any[]).forEach(c => mount(c, host, node));
  host.append(parent, node);
}

function isClassComponent(fn: any): fn is Component<any> { return fn.prototype && typeof fn.prototype.render === 'function'; }
