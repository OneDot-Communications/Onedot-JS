import { computed, reactive, watchEffect } from '../reactivity';

export interface Action<T = any> {
  type: string;
  payload?: T;
}

export interface Reducer<S = any, A extends Action = Action> {
  (state: S, action: A): S;
}

export interface MiddlewareAPI<S = any> {
  getState: () => S;
  dispatch: <A extends Action>(action: A) => A;
}

export interface Middleware<S = any> {
  (api: MiddlewareAPI<S>): (next: (action: Action) => Action) => (action: Action) => any;
}

export interface StoreOptions<S = any> {
  state: S;
  reducers?: { [key: string]: Reducer<S> };
  actions?: { [key: string]: (payload?: any) => Action };
  middleware?: Middleware<S>[];
  devtools?: boolean;
}

export class StateManager {
  private store: any;
  private state: any;
  private reducers: { [key: string]: Reducer } = {};
  private actions: { [key: string]: Function } = {};
  private middleware: Middleware[] = [];
  private subscribers: Function[] = [];
  private devtools: any;
  private initialized = false;

  constructor() {
    this.state = reactive({});
    this.store = {
      getState: this.getState.bind(this),
      dispatch: this.dispatch.bind(this),
      subscribe: this.subscribe.bind(this)
    };
  }

  public initialize(): void {
    if (this.initialized) return;

    // Initialize devtools if available
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      this.devtools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect();
      this.devtools.init(this.state);
    }

    this.initialized = true;
  }

  public createStore<S>(options: StoreOptions<S>): void {
    // Set initial state
    this.state = reactive(options.state);

    // Set reducers
    if (options.reducers) {
      this.reducers = { ...this.reducers, ...options.reducers };
    }

    // Set actions
    if (options.actions) {
      this.actions = { ...this.actions, ...options.actions };
    }

    // Set middleware
    if (options.middleware) {
      this.middleware = [...this.middleware, ...options.middleware];
    }

    // Initialize store with middleware
    this.initializeStore();
  }

  private initializeStore(): void {
    // Create dispatch chain with middleware
    let dispatch = this.dispatch.bind(this);

    if (this.middleware.length > 0) {
      const middlewareAPI: MiddlewareAPI = {
        getState: this.getState.bind(this),
        dispatch: (action) => dispatch(action)
      };

      const chain = this.middleware.map(middleware => middleware(middlewareAPI));
      dispatch = chain.reduce((a, b) => (next: any) => a(b(next)), (action: Action) => action);

      this.store.dispatch = dispatch;
    }
  }

  public getState<S>(): S {
    return this.state as S;
  }

  public dispatch<A extends Action>(action: A): A {
    try {
      // Apply middleware
      if (this.middleware.length > 0) {
        return this.store.dispatch(action);
      }

      // Apply reducers
      if (this.reducers[action.type]) {
        const newState = this.reducers[action.type](this.state, action);
        Object.assign(this.state, newState);
      }

      // Notify subscribers
      this.notifySubscribers();

      // Notify devtools
      if (this.devtools) {
        this.devtools.send(action, this.state);
      }

      return action;
    } catch (error) {
      console.error('Error dispatching action:', error);
      throw error;
    }
  }

  public subscribe(listener: Function): () => void {
    this.subscribers.push(listener);

    return () => {
      const index = this.subscribers.indexOf(listener);
      if (index !== -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(listener => listener());
  }

  public createAction<T>(type: string): (payload?: T) => Action<T> {
    return (payload?: T) => ({ type, payload });
  }

  public createReducer<S>(initialState: S, handlers: { [key: string]: (state: S, action: Action) => S }): Reducer<S> {
    return (state = initialState, action) => {
      const handler = handlers[action.type];
      return handler ? handler(state, action) : state;
    };
  }

  public createSelector<S, R>(selector: (state: S) => R): () => R {
    return computed(() => selector(this.state));
  }

  public connect<S, P>(mapStateToProps?: (state: S) => any, mapDispatchToProps?: any): (component: any) => any {
    return (component: any) => {
      // This would be implemented to connect components to state
      return component;
    };
  }

  // Observable state implementation
  public observable<T>(initialValue: T): { value: T } {
    const observable = {
      value: initialValue,
      subscribers: new Set<Function>()
    };

    return new Proxy(observable, {
      get(target, prop) {
        if (prop === 'value') {
          return target.value;
        }
        return target[prop];
      },
      set(target, prop, value) {
        if (prop === 'value') {
          target.value = value;
          target.subscribers.forEach((subscriber: Function) => subscriber());
          return true;
        }
        return false;
      }
    });
  }

  public computed<T>(getter: () => T): () => T {
    return computed(getter);
  }

  public autorun(effect: () => void): () => void {
    return watchEffect(effect);
  }

  public transaction<T>(fn: () => T): T {
    // Batch state updates
    return fn();
  }
}
