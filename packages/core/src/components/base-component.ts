import { DIContainer } from '../di';
import { computed, reactive, watchEffect } from '../reactivity';
import { StateManager } from '../state';

export interface ComponentLifecycle {
  onBeforeMount?(): void;
  onMounted?(): void;
  onBeforeUpdate?(): void;
  onUpdated?(): void;
  onBeforeUnmount?(): void;
  onUnmounted?(): void;
  onErrorCaptured?(err: Error, instance: any, info: string): boolean | void;
}

export interface ComponentProps {
  [key: string]: any;
}

export interface ComponentOptions {
  props?: ComponentProps;
  state?: any;
  computed?: { [key: string]: () => any };
  methods?: { [key: string]: Function };
  watch?: { [key: string]: Function | { handler: Function; immediate?: boolean; deep?: boolean } };
  lifecycle?: ComponentLifecycle;
  render?(): any;
  template?: string;
  styles?: string | string[];
}

export class BaseComponent {
  private _props: ComponentProps = {};
  private _state: any = {};
  private _computed: { [key: string]: any } = {};
  private _methods: { [key: string]: Function } = {};
  private _watchers: Function[] = [];
  private _lifecycle: ComponentLifecycle = {};
  private _isMounted = false;
  private _isUnmounted = false;
  private _element: any = null;
  private _diContainer: DIContainer;
  private _stateManager: StateManager;
  private _children: BaseComponent[] = [];
  private _parent: BaseComponent | null = null;

  constructor(private options: ComponentOptions = {}) {
    this._diContainer = DIContainer.getInstance();
    this._stateManager = this._diContainer.resolve<StateManager>('StateManager');

    this.initializeComponent();
  }

  private initializeComponent(): void {
    // Initialize props
    if (this.options.props) {
      this._props = reactive(this.options.props);
    }

    // Initialize state
    if (this.options.state) {
      this._state = reactive(this.options.state);
    }

    // Initialize computed properties
    if (this.options.computed) {
      Object.keys(this.options.computed).forEach(key => {
        this._computed[key] = computed(this.options.computed![key]);
      });
    }

    // Initialize methods
    if (this.options.methods) {
      this._methods = { ...this.options.methods };
    }

    // Initialize lifecycle hooks
    if (this.options.lifecycle) {
      this._lifecycle = { ...this.options.lifecycle };
    }

    // Setup watchers
    if (this.options.watch) {
      this.setupWatchers();
    }
  }

  private setupWatchers(): void {
    Object.keys(this.options.watch!).forEach(key => {
      const watcher = this.options.watch![key];
      const handler = typeof watcher === 'function' ? watcher : watcher.handler;
      const immediate = typeof watcher === 'object' ? watcher.immediate : false;
      const deep = typeof watcher === 'object' ? watcher.deep : false;

      const stopWatch = watchEffect(() => {
        const value = this.getNestedValue(key);
        handler.call(this, value, this.getNestedValue(key, true), immediate);
      }, { deep });

      this._watchers.push(stopWatch);
    });
  }

  private getNestedValue(path: string, oldValue = false): any {
    const keys = path.split('.');
    let target: any = oldValue ? this._state : this._props;

    for (const key of keys) {
      if (target && typeof target === 'object' && key in target) {
        target = target[key];
      } else {
        return undefined;
      }
    }

    return target;
  }

  public get props(): ComponentProps {
    return this._props;
  }

  public get state(): any {
    return this._state;
  }

  public get computed(): { [key: string]: any } {
    return this._computed;
  }

  public get methods(): { [key: string]: Function } {
    return this._methods;
  }

  public get element(): any {
    return this._element;
  }

  public get isMounted(): boolean {
    return this._isMounted;
  }

  public get isUnmounted(): boolean {
    return this._isUnmounted;
  }

  public get children(): BaseComponent[] {
    return this._children;
  }

  public get parent(): BaseComponent | null {
    return this._parent;
  }

  public setElement(element: any): void {
    this._element = element;
  }

  public setParent(parent: BaseComponent): void {
    this._parent = parent;
    parent.addChild(this);
  }

  public addChild(child: BaseComponent): void {
    if (!this._children.includes(child)) {
      this._children.push(child);
    }
  }

  public removeChild(child: BaseComponent): void {
    const index = this._children.indexOf(child);
    if (index !== -1) {
      this._children.splice(index, 1);
    }
  }

  public mount(): void {
    if (this._isMounted) return;

    try {
      // Call beforeMount lifecycle hook
      if (this._lifecycle.onBeforeMount) {
        this._lifecycle.onBeforeMount.call(this);
      }

      // Render component
      this.render();

      // Mount children
      this._children.forEach(child => child.mount());

      // Mark as mounted
      this._isMounted = true;

      // Call mounted lifecycle hook
      if (this._lifecycle.onMounted) {
        this._lifecycle.onMounted.call(this);
      }
    } catch (error) {
      this.handleError(error as Error, 'mount');
    }
  }

  public unmount(): void {
    if (this._isUnmounted) return;

    try {
      // Call beforeUnmount lifecycle hook
      if (this._lifecycle.onBeforeUnmount) {
        this._lifecycle.onBeforeUnmount.call(this);
      }

      // Unmount children
      this._children.forEach(child => child.unmount());

      // Stop watchers
      this._watchers.forEach(stop => stop());

      // Mark as unmounted
      this._isUnmounted = true;
      this._isMounted = false;

      // Call unmounted lifecycle hook
      if (this._lifecycle.onUnmounted) {
        this._lifecycle.onUnmounted.call(this);
      }
    } catch (error) {
      this.handleError(error as Error, 'unmount');
    }
  }

  public update(): void {
    if (!this._isMounted || this._isUnmounted) return;

    try {
      // Call beforeUpdate lifecycle hook
      if (this._lifecycle.onBeforeUpdate) {
        this._lifecycle.onBeforeUpdate.call(this);
      }

      // Re-render component
      this.render();

      // Update children
      this._children.forEach(child => child.update());

      // Call updated lifecycle hook
      if (this._lifecycle.onUpdated) {
        this._lifecycle.onUpdated.call(this);
      }
    } catch (error) {
      this.handleError(error as Error, 'update');
    }
  }

  public render(): any {
    if (this.options.render) {
      return this.options.render.call(this);
    }

    // Default render implementation
    return this.createDefaultRender();
  }

  private createDefaultRender(): any {
    // This would be implemented by platform-specific renderers
    return null;
  }

  private handleError(error: Error, info: string): void {
    // Call errorCaptured lifecycle hook if available
    if (this._lifecycle.onErrorCaptured) {
      const result = this._lifecycle.onErrorCaptured.call(this, error, this, info);
      if (result === false) {
        return; // Error was handled
      }
    }

    // Re-throw error if not handled
    throw error;
  }

  public forceUpdate(): void {
    this.update();
  }

  public $emit(eventName: string, ...args: any[]): void {
    // Event emission logic would be implemented here
    // This would integrate with the reactivity system
  }

  public $on(eventName: string, handler: Function): void {
    // Event listening logic would be implemented here
  }

  public $off(eventName: string, handler?: Function): void {
    // Event removal logic would be implemented here
  }

  public $nextTick(callback: Function): void {
    // Next tick implementation would use the reactivity scheduler
    Promise.resolve().then(callback);
  }

  public $refs: { [key: string]: any } = {};
}
