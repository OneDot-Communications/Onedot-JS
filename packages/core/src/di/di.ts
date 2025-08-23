export interface InjectableOptions {
  singleton?: boolean;
  eager?: boolean;
}

export type Constructor<T = any> = new (...args: any[]) => T;

export class DIContainer {
  private static instance: DIContainer;
  private services: Map<string | symbol, { instance: any; constructor: Constructor; options: InjectableOptions }> = new Map();
  private dependencies: Map<Constructor, (string | symbol)[]> = new Map();
  private resolving: Set<Constructor> = new Set();

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  public register<T>(key: string | symbol, constructor: Constructor<T>, options: InjectableOptions = {}): void {
    this.services.set(key, {
      instance: null,
      constructor,
      options: { singleton: true, ...options }
    });
  }

  public registerSingleton<T>(key: string | symbol, constructor: Constructor<T>): void {
    this.register(key, constructor, { singleton: true, eager: false });
  }

  public registerTransient<T>(key: string | symbol, constructor: Constructor<T>): void {
    this.register(key, constructor, { singleton: false });
  }

  public resolve<T>(key: string | symbol): T {
    const service = this.services.get(key);

    if (!service) {
      throw new Error(`Service with key '${String(key)}' not registered`);
    }

    if (service.options.singleton && service.instance) {
      return service.instance as T;
    }

    if (this.resolving.has(service.constructor)) {
      throw new Error(`Circular dependency detected for '${String(key)}'`);
    }

    this.resolving.add(service.constructor);

    try {
      const instance = this.createInstance(service.constructor);

      if (service.options.singleton) {
        service.instance = instance;
      }

      return instance as T;
    } finally {
      this.resolving.delete(service.constructor);
    }
  }

  public resolveType<T>(constructor: Constructor<T>): T {
    return this.createInstance(constructor);
  }

  private createInstance<T>(constructor: Constructor<T>): T {
    // Get constructor parameters
    const paramTypes = Reflect.getMetadata('design:paramtypes', constructor) || [];
    const dependencies = paramTypes.map((paramType: Constructor) => {
      // Find the key for this dependency type
      for (const [key, service] of this.services.entries()) {
        if (service.constructor === paramType) {
          return this.resolve(key);
        }
      }
      throw new Error(`Dependency of type '${paramType.name}' not registered`);
    });

    // Create new instance with dependencies
    return new constructor(...dependencies);
  }

  public initializeEagerServices(): void {
    for (const [key, service] of this.services.entries()) {
      if (service.options.eager) {
        this.resolve(key);
      }
    }
  }

  public isRegistered(key: string | symbol): boolean {
    return this.services.has(key);
  }

  public clear(): void {
    this.services.clear();
    this.dependencies.clear();
    this.resolving.clear();
  }
}

// Decorator for injectable classes
export function Injectable(options: InjectableOptions = {}): ClassDecorator {
  return (target: any) => {
    const constructor = target as Constructor;
    DIContainer.getInstance().register(constructor.name, constructor, options);
  };
}

// Decorator for injecting dependencies
export function Inject(key?: string | symbol): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const actualKey = key || propertyKey;
    Object.defineProperty(target, propertyKey, {
      get() {
        return DIContainer.getInstance().resolve(actualKey);
      },
      enumerable: true,
      configurable: true
    });
  };
}

// Decorator for constructor parameter injection
export function InjectParam(key?: string | symbol): ParameterDecorator {
  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const actualKey = key || propertyKey;
    const constructor = target as Constructor;

    if (!DIContainer.getInstance().dependencies.has(constructor)) {
      DIContainer.getInstance().dependencies.set(constructor, []);
    }

    const dependencies = DIContainer.getInstance().dependencies.get(constructor)!;
    dependencies[parameterIndex] = actualKey as string | symbol;
  };
}
