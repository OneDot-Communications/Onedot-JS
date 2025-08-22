export class OneDotJSRuntime {
  private static instance: OneDotJSRuntime;
  private strictMode: boolean = true;
  private config: any;

  private constructor(config?: any) {
    this.config = config || { compilerOptions: { strict: true } };
    this.validateTypeScriptConfig();
  }

  static getInstance(config?: any): OneDotJSRuntime {
    if (!OneDotJSRuntime.instance) {
      OneDotJSRuntime.instance = new OneDotJSRuntime(config);
    }
    return OneDotJSRuntime.instance;
  }

  private validateTypeScriptConfig(): void {
    const tsConfig = this.config;
    if (!tsConfig.compilerOptions?.strict) {
      throw new Error(
        'OneDotJS requires TypeScript strict mode. ' +
        'Set "strict": true in your tsconfig.json'
      );
    }
  }

  public enforceStrictMode(): void {
    if (!this.strictMode) {
      throw new Error('Strict mode violation detected');
    }
  }
}
