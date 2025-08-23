export * from './components';
export * from './di';
export * from './reactivity';
export * from './router';
export * from './state';

// Core framework initialization
import { DIContainer } from './di';
import { Router } from './router';
import { StateManager } from './state';

export class OneDotCore {
  private static instance: OneDotCore;
  private diContainer: DIContainer;
  private stateManager: StateManager;
  private router: Router;

  private constructor() {
    this.diContainer = new DIContainer();
    this.stateManager = new StateManager();
    this.router = new Router();

    // Initialize core services
    this.initializeCoreServices();
  }

  public static getInstance(): OneDotCore {
    if (!OneDotCore.instance) {
      OneDotCore.instance = new OneDotCore();
    }
    return OneDotCore.instance;
  }

  private initializeCoreServices(): void {
    // Register core services with DI container
    this.diContainer.registerSingleton('StateManager', this.stateManager);
    this.diContainer.registerSingleton('Router', this.router);

    // Initialize state management
    this.stateManager.initialize();

    // Initialize router
    this.router.initialize();
  }

  public getDIContainer(): DIContainer {
    return this.diContainer;
  }

  public getStateManager(): StateManager {
    return this.stateManager;
  }

  public getRouter(): Router {
    return this.router;
  }
}

// Global framework instance
export const OneDot = OneDotCore.getInstance();
