import 'reflect-metadata';

export class DIContainer {
  private providers = new Map<string, any>();

  register(token: string, provider: any) {
    this.providers.set(token, provider);
  }

  resolve<T>(token: string): T {
    const provider = this.providers.get(token);
    if (!provider) {
      throw new Error(`No provider found for token: ${token}`);
    }
    if (typeof provider === 'function') {
      return new provider();
    }
    return provider;
  }
}
