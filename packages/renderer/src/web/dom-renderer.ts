import { VNode } from '../../../core/src/vdom';
import { Component } from '../../../core/src/component';

export class DOMRenderer {
  private rootElement: HTMLElement;
  private currentVNode: VNode | null = null;

  constructor(rootElement: HTMLElement) {
    this.rootElement = rootElement;
  }

  render(vNode: VNode): void {
    this.currentVNode = vNode;
    this.rootElement.innerHTML = '';
    this.rootElement.appendChild(this.renderElement(vNode));
  }

  private renderElement(vNode: VNode): Node {
    if (typeof vNode.type === 'string') {
      return this.renderDOMElement(vNode);
    } else {
      return this.renderComponent(vNode);
    }
  }

  private renderDOMElement(vNode: VNode): Node {
    if (vNode.type === '#text') {
      const textChild = vNode.children[0];
      const text = typeof textChild === 'string' ? textChild : (textChild as any).props?.value || '';
      return document.createTextNode(text);
    }
    const element = document.createElement(vNode.type as string);
    this.applyProps(element, vNode.props);
    vNode.children.forEach(child => {
      element.appendChild(this.renderElement(child));
    });
    return element;
  }

  private renderComponent(vNode: VNode): Node {
    const component = vNode.type as Component;
    const renderedVNode = component.render();
    return this.renderElement(renderedVNode);
  }

  private applyProps(element: HTMLElement, props: Record<string, any>): void {
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'children') return;
      if (key.startsWith('on')) {
        const eventName = key.substring(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    });
  }
}
