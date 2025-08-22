import type { RenderHost } from '../../core/src/component.js';

export const webHost: RenderHost = {
  createElement(tag, props) {
    if (tag === 'text') return document.createTextNode('');
    return document.createElement(tag);
  },
  setText(node, text) { node.textContent = text; },
  append(parent, child) { parent.appendChild(child); },
  replace(oldNode, newNode) { oldNode.replaceWith(newNode); },
  setProp(node, key, value) {
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.substring(2).toLowerCase(), value);
    } else if (value == null) {
      node.removeAttribute(key);
    } else {
      node.setAttribute(key, String(value));
    }
  },
  clear(node) { while(node.firstChild) node.removeChild(node.firstChild); }
};
