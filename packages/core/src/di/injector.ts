export class Injector {
  private static rootInjector: Injector | null = null;
  private dependencies = new Map<string, any>();
  private parent: Injector | null = null;

  constructor(providers: Provider[] = [], parent: Injector | null = null) {
    this.parent = parent;
    this.registerProviders(providers);
  }

  static getRootInjector(): Injector {
    if (!Injector.rootInjector) {
      Injector.rootInjector = new Injector();
    }
    return Injector.rootInjector;
  }

  static setRootInjector(injector: Injector): void {
    Injector.rootInjector = injector;
  }

  registerProviders(providers: Provider[]): void {
    providers.forEach(provider => {
      if (typeof provider === 'function') {
        this.dependencies.set(provider.name, provider);
      } else {
        this.dependencies.set(provider.provide, provider.useValue);
      }
    });
  }

  get<T>(token: string | (new (...args: any[]) => T)): T {
    const key = typeof token === 'string' ? token : token.name;
    if (this.dependencies.has(key)) {
      const dependency = this.dependencies.get(key);
      if (typeof dependency === 'function') {
        return this.instantiateClass(dependency);
      } else {
        return dependency;
      }
    }
    if (this.parent) {
      return this.parent.get(token);
    }
    throw new Error(`Dependency not found: ${key}`);
  }

  private instantiateClass<T>(clazz: new (...args: any[]) => T): T {
    const paramTypes = (Reflect as any).getMetadata?.('design:paramtypes', clazz) || [];
    const params = paramTypes.map((paramType: any) => this.get(paramType));
    return new clazz(...params);
  }

  createChild(providers: Provider[]): Injector {
    return new Injector(providers, this);
  }
}

export type Provider = 
  | { provide: string; useValue: any }
  | (new (...args: any[]) => any);
