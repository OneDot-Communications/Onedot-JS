import { Component } from '../component';
import { Store } from './store';
import { VNode } from '../vdom';
import { State } from './hooks';

export class StoreProvider<T extends State> implements Component {
  constructor(
    private store: Store<T>,
    private childComponent: Component
  ) {}

  render(): VNode {
    // Make store available to child components
    return this.childComponent.render();
  }
}
