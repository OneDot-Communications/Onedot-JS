import { Component, ComponentProps } from './component';
import { VNode } from './vdom';

export abstract class BaseComponent implements Component {
  props: ComponentProps;
  state: Record<string, any> = {};
  private _pendingState: Record<string, any> | null = null;
  componentDidUpdate?(prevState: Record<string, any>): void;

  constructor(props: ComponentProps) {
    this.props = props;
  }

  abstract render(): VNode;

  setState(partialState: Record<string, any>, callback?: () => void): void {
    this._pendingState = { ...this.state, ...partialState };
    scheduleUpdate(this, callback);
  }

  updateState(callback?: () => void): void {
    if (this._pendingState) {
      const prevState = { ...this.state };
      this.state = this._pendingState;
      this._pendingState = null;
      if (this.componentDidUpdate) {
        this.componentDidUpdate(prevState);
      }
      if (callback) {
        callback();
      }
    }
  }
}

const updateQueue = new Set<BaseComponent>();

function scheduleUpdate(component: BaseComponent, callback?: () => void): void {
  updateQueue.add(component);

  if (updateQueue.size === 1) {
    Promise.resolve().then(flushUpdates);
  }
}

function flushUpdates(): void {
  updateQueue.forEach(component => {
    component.updateState();
    // Re-render will be handled by the renderer
  });
  updateQueue.clear();
}
