export interface PluginContext {
  addTransform(transform: CodeTransform): void;
  registerHook<T extends keyof LifecycleHooks>(hook: T, fn: LifecycleHooks[T]): void;
}

export interface CodeTransform { name: string; enforce?: 'pre' | 'post'; test: (id: string) => boolean; transform(code: string, id: string): string | Promise<string>; }

export interface LifecycleHooks {
  resolveId: (id: string, importer: string | null) => string | null | Promise<string | null>;
  load: (id: string) => string | null | Promise<string | null>;
  bundleStart: () => void | Promise<void>;
  bundleEnd: (result: { modules: number; bytes: number }) => void | Promise<void>;
}

export interface PluginDefinition {
  name: string;
  setup(ctx: PluginContext): void | Promise<void>;
}

type HookMap = { [K in keyof LifecycleHooks]?: Array<LifecycleHooks[K]> };

export class PluginContainer implements PluginContext {
  private transforms: CodeTransform[] = [];
  private hooks: HookMap = {};
  addTransform(t: CodeTransform): void { this.transforms.push(t); }
  registerHook<T extends keyof LifecycleHooks>(hook: T, fn: LifecycleHooks[T]): void {
    const arr = (this.hooks[hook] ||= [] as any);
    (arr as Array<LifecycleHooks[T]>).push(fn);
  }
  async runTransforms(id: string, code: string): Promise<string> {
    const ordered = [
      ...this.transforms.filter(t=>t.enforce==='pre'),
      ...this.transforms.filter(t=>!t.enforce),
      ...this.transforms.filter(t=>t.enforce==='post')
    ];
    let out = code;
    for (const t of ordered) if (t.test(id)) { out = await t.transform(out, id); }
    return out;
  }
  async call<K extends keyof LifecycleHooks>(hook: K, ...args: any[]): Promise<any[]> {
    const handlers = this.hooks[hook] || [];
    const results: any[] = [];
    for (const h of handlers) results.push(await (h as any)(...args));
    return results;
  }
}

export function definePlugin(def: PluginDefinition): PluginDefinition { return def; }
