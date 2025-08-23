import { reactive } from '../reactivity';

export interface RouteConfig {
  path: string;
  component: any;
  name?: string;
  props?: boolean | object | Function;
  meta?: any;
  children?: RouteConfig[];
  beforeEnter?: (to: Route, from: Route, next: Function) => void;
}

export interface Route {
  path: string;
  params: { [key: string]: string };
  query: { [key: string]: string };
  hash: string;
  name?: string;
  meta: any;
  matched: RouteConfig[];
  fullPath: string;
}

export interface RouterOptions {
  mode?: 'hash' | 'history' | 'abstract';
  base?: string;
  routes: RouteConfig[];
  fallback?: boolean;
}

export class Router {
  private currentRoute: Route;
  private routes: RouteConfig[];
  private mode: 'hash' | 'history' | 'abstract';
  private base: string;
  private fallback: boolean;
  private ready = false;
  private readyCbs: Function[] = [];
  private errorCbs: Function[] = [];
  private history: any;

  constructor(options: RouterOptions) {
    this.mode = options.mode || 'hash';
    this.base = options.base || '';
    this.routes = options.routes;
    this.fallback = options.fallback !== undefined ? options.fallback : true;

    this.currentRoute = reactive({
      path: '/',
      params: {},
      query: {},
      hash: '',
      matched: [],
      fullPath: '/'
    } as Route);

    this.initializeRouter();
  }

  private initializeRouter(): void {
    // Initialize history based on mode
    switch (this.mode) {
      case 'history':
        this.history = new HTML5History(this);
        break;
      case 'hash':
        this.history = new HashHistory(this);
        break;
      case 'abstract':
        this.history = new AbstractHistory(this);
        break;
      default:
        this.history = new HashHistory(this);
    }

    // Setup initial route
    this.history.setupListeners();

    // Transition to initial route
    this.transitionTo(this.history.getCurrentLocation(), () => {
      this.ready = true;
      this.readyCbs.forEach(cb => cb());
    });
  }

  public initialize(): void {
    // Additional initialization logic if needed
  }

  public push(location: string | Route, onComplete?: Function, onAbort?: Function): void {
    this.history.push(location, onComplete, onAbort);
  }

  public replace(location: string | Route, onComplete?: Function, onAbort?: Function): void {
    this.history.replace(location, onComplete, onAbort);
  }

  public go(n: number): void {
    this.history.go(n);
  }

  public back(): void {
    this.go(-1);
  }

  public forward(): void {
    this.go(1);
  }

  public get current(): Route {
    return this.currentRoute;
  }

  public get route(): Route {
    return this.currentRoute;
  }

  public beforeEach(fn: Function): void {
    this.history.beforeEach(fn);
  }

  public beforeResolve(fn: Function): void {
    this.history.beforeResolve(fn);
  }

  public afterEach(fn: Function): void {
    this.history.afterEach(fn);
  }

  public onReady(cb: Function, errorCb?: Function): void {
    if (this.ready) {
      cb();
    } else {
      this.readyCbs.push(cb);
      if (errorCb) {
        this.errorCbs.push(errorCb);
      }
    }
  }

  public onError(cb: Function): void {
    this.errorCbs.push(cb);
  }

  public addRoutes(routes: RouteConfig[]): void {
    this.routes.push(...routes);
    // Refresh current route to match new routes
    this.history.refreshRoute();
  }

  public resolve(to: string | Route, current?: Route): {
    location: Route;
    route: RouteConfig;
    href: string;
    normalizedTo: Route;
    resolved: RouteConfig;
  } {
    const location = normalizeLocation(to, current || this.currentRoute, this.mode);
    const route = this.match(location, this.currentRoute);
    const fullPath = location.path;
    const href = createHref(this.mode, this.base, fullPath);

    return {
      location,
      route,
      href,
      normalizedTo: location,
      resolved: route
    };
  }

  private match(raw: Route, currentRoute?: Route): RouteConfig {
    const location = normalizeLocation(raw, currentRoute, this.mode);
    const { path } = location;

    // Find matching route
    const matched = this.routes.find(route => {
      return matchPath(route.path, path);
    });

    if (!matched) {
      // Handle 404 or fallback
      return this.routes.find(route => route.path === '*') || this.routes[0];
    }

    return matched;
  }

  private transitionTo(location: string, onComplete?: Function, onAbort?: Function): void {
    const route = this.match(location, this.currentRoute);

    // Confirm transition
    this.confirmTransition(route, () => {
      this.updateRoute(route);
      onComplete && onComplete();
    }, err => {
      onAbort && onAbort(err);
    });
  }

  private confirmTransition(route: RouteConfig, onComplete: Function, onAbort: Function): void {
    const queue = Array.from(this.history.queue);

    const iterator = (hook: Function, next: Function) => {
      try {
        hook(route, this.currentRoute, (to: any) => {
          if (to === false || typeof to === 'string') {
            this.ensureURL(true);
            onAbort(to);
          } else {
            next(to);
          }
        });
      } catch (error) {
        onAbort(error);
      }
    };

    runQueue(queue, iterator, () => {
      const postEnterCbs = [];
      const enterGuards = extractEnterGuards(this.routes, route, postEnterCbs);

      runQueue(enterGuards, iterator, () => {
        onComplete();
      });
    });
  }

  private updateRoute(route: RouteConfig): void {
    const prev = this.currentRoute;
    this.currentRoute = {
      path: route.path,
      params: {},
      query: {},
      hash: '',
      name: route.name,
      meta: route.meta || {},
      matched: [route],
      fullPath: route.path
    } as Route;

    this.history.cb && this.history.cb(this.currentRoute);
    this.history.afterEachHooks.forEach(hook => {
      hook && hook(this.currentRoute, prev);
    });
  }

  private ensureURL(push?: boolean): void {
    if (this.mode === 'hash') {
      const base = this.base || '/';
      const current = this.history.getCurrentLocation();
      if (current !== base + this.currentRoute.fullPath) {
        this.history.push(this.currentRoute.fullPath);
      }
    } else {
      // Handle other modes
    }
  }
}

// History implementations
class HTML5History {
  constructor(private router: Router) {}

  push(location: any, onComplete?: Function, onAbort?: Function): void {
    // Implementation for HTML5 history push
  }

  replace(location: any, onComplete?: Function, onAbort?: Function): void {
    // Implementation for HTML5 history replace
  }

  go(n: number): void {
    window.history.go(n);
  }

  setupListeners(): void {
    // Setup popstate listener
  }

  getCurrentLocation(): string {
    return window.location.pathname;
  }

  beforeEach(fn: Function): void {
    // Register before each hook
  }

  beforeResolve(fn: Function): void {
    // Register before resolve hook
  }

  afterEach(fn: Function): void {
    // Register after each hook
  }

  refreshRoute(): void {
    // Refresh current route
  }
}

class HashHistory {
  constructor(private router: Router) {}

  push(location: any, onComplete?: Function, onAbort?: Function): void {
    // Implementation for hash history push
  }

  replace(location: any, onComplete?: Function, onAbort?: Function): void {
    // Implementation for hash history replace
  }

  go(n: number): void {
    window.location.hash = window.location.hash;
  }

  setupListeners(): void {
    // Setup hashchange listener
  }

  getCurrentLocation(): string {
    return window.location.hash.slice(1);
  }

  beforeEach(fn: Function): void {
    // Register before each hook
  }

  beforeResolve(fn: Function): void {
    // Register before resolve hook
  }

  afterEach(fn: Function): void {
    // Register after each hook
  }

  refreshRoute(): void {
    // Refresh current route
  }
}

class AbstractHistory {
  constructor(private router: Router) {}

  push(location: any, onComplete?: Function, onAbort?: Function): void {
    // Implementation for abstract history push
  }

  replace(location: any, onComplete?: Function, onAbort?: Function): void {
    // Implementation for abstract history replace
  }

  go(n: number): void {
    // Implementation for abstract history go
  }

  setupListeners(): void {
    // Setup listeners for abstract history
  }

  getCurrentLocation(): string {
    return '/';
  }

  beforeEach(fn: Function): void {
    // Register before each hook
  }

  beforeResolve(fn: Function): void {
    // Register before resolve hook
  }

  afterEach(fn: Function): void {
    // Register after each hook
  }

  refreshRoute(): void {
    // Refresh current route
  }
}

// Helper functions
function normalizeLocation(raw: string | Route, current: Route, mode: string): Route {
  // Normalize location to Route object
  return {
    path: typeof raw === 'string' ? raw : raw.path,
    params: {},
    query: {},
    hash: '',
    matched: [],
    fullPath: typeof raw === 'string' ? raw : raw.fullPath
  };
}

function matchPath(pattern: string, path: string): boolean {
  // Simple path matching logic
  return pattern === path || pattern === '*';
}

function createHref(mode: string, base: string, path: string): string {
  if (mode === 'hash') {
    return base + '#' + path;
  }
  return base + path;
}

function runQueue(queue: any[], iterator: Function, cb: Function): void {
  const step = (index: number) => {
    if (index >= queue.length) {
      cb();
    } else {
      iterator(queue[index], () => step(index + 1));
    }
  };
  step(0);
}

function extractEnterGuards(routes: RouteConfig[], route: Route, postEnterCbs: Function[]): Function[] {
  // Extract enter guards from routes
  return [];
}
