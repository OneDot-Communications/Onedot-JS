import { DOMRenderer } from './dom-renderer';
import { Component } from '../../../core/src/component';

export function render(component: Component, rootElement: HTMLElement): void {
  const renderer = new DOMRenderer(rootElement);
  renderer.render(component.render());
}
