// Simple dependency injection container with scopes
export type Token<T> = symbol & { __type?: T };
export interface Provider<T=any> { token: Token<T>; useClass?: new (...args:any[])=>T; useValue?: T; useFactory?: (...a:any[])=>T; deps?: Token<any>[]; singleton?: boolean; }

interface RecordEntry { factory: ()=>any; value?: any; singleton: boolean; }

export class Container {
  private records = new Map<Token<any>, RecordEntry>();
  private parent: Container | undefined;
  constructor(parent: Container | undefined) { this.parent = parent; }
  register<T>(provider: Provider<T>) {
    if (this.records.has(provider.token)) throw new Error('Provider already registered');
    let rec: RecordEntry;
    if (provider.useValue !== undefined) {
      rec = { factory: () => provider.useValue, value: provider.useValue, singleton: true };
    } else if (provider.useFactory) {
      rec = { factory: () => provider.useFactory!(...(provider.deps||[]).map(d=>this.get(d))), singleton: provider.singleton!==false };
    } else if (provider.useClass) {
      rec = { factory: () => {
        const args = (provider.deps||[]).map(d=>this.get(d));
        return new provider.useClass!(...args);
      }, singleton: provider.singleton!==false };
    } else throw new Error('Invalid provider');
    this.records.set(provider.token, rec);
  }
  get<T>(token: Token<T>): T {
    if (this.records.has(token)) {
      const rec = this.records.get(token)!;
      if (rec.singleton) {
        if (rec.value === undefined) rec.value = rec.factory();
        return rec.value;
      }
      return rec.factory();
    }
    if (this.parent) return this.parent.get(token);
    throw new Error('No provider for token');
  }
  createChild() { return new Container(this); }
}

export function createToken<T>(description: string): Token<T> { return Symbol(description) as Token<T>; }
