import { createElement } from './vdom';
import { BaseComponent } from './base-component';

// Minimal test runner globals for standalone testing
function describe(name: string, fn: () => void) { console.log(name); fn(); }
function it(name: string, fn: () => void) { try { fn(); console.log('  ✔', name); } catch (e) { console.error('  ✖', name, e); } }
function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
    }
  };
}

describe('Component System', () => {
  it('should create VNode for element', () => {
    const vnode = createElement('div', { className: 'container' }, 'Hello');
    expect(vnode.type).toBe('div');
    expect(vnode.props.className).toBe('container');
    expect(vnode.children[0].type).toBe('#text');
  });

  it('should handle component state updates', () => {
    class TestComponent extends BaseComponent {
      render() {
        return createElement('div', {}, this.state.count);
      }
    }
    const component = new TestComponent({});
    component.setState({ count: 1 });
    expect(component.state.count).toBe(1);
  });
});
