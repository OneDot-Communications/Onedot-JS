import 'reflect-metadata';

// Define Provider type
export type Provider = { provide: string; useClass: any };

export function Injectable(): ClassDecorator {
  return (target: any) => {
    (Reflect as any).defineMetadata('injectable', true, target);
  };
}

export function Inject(token: string): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const dependencies = (Reflect as any).getMetadata('dependencies', target) || [];
    dependencies.push({ token, propertyKey });
    (Reflect as any).defineMetadata('dependencies', dependencies, target);
  };
}

export function Component(options: { selector: string; providers?: Provider[] }): ClassDecorator {
  return (target: any) => {
    (Reflect as any).defineMetadata('component', options, target);
    Injectable()(target);
  };
}
