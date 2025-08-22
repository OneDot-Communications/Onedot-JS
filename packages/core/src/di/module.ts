import 'reflect-metadata';
import { Injector, Provider } from './injector';

export class Module {
  private providers: Provider[] = [];
  private imports: Module[] = [];
  private declarations: any[] = [];

  constructor(private injector: Injector) {}

  static create(options: {
    providers?: Provider[];
    imports?: Module[];
    declarations?: any[];
  }): Module {
    const injector = new Injector(options.providers || []);
    const module = new Module(injector);
    if (options.imports) {
      module.imports = options.imports;
    }
    if (options.declarations) {
      module.declarations = options.declarations;
    }
    return module;
  }

  get<T>(token: string | (new (...args: any[]) => T)): T {
    return this.injector.get(token);
  }

  createInjector(): Injector {
    return this.injector;
  }
}
