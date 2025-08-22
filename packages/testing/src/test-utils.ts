// Test utilities for browser environment only
export function createTestEnvironment(renderFn: (component: any, root: HTMLElement) => void): {
  render: (component: any) => HTMLElement;
  cleanup: () => void;
} {
  const rootElement = document.createElement('div');
  rootElement.id = 'root';
  document.body.appendChild(rootElement);
  return {
    render: (component: any) => {
      renderFn(component, rootElement);
      return rootElement;
    },
    cleanup: () => {
      document.body.removeChild(rootElement);
    }
  };
}

export function createMockComponent(props: any = {}): any {
  return {
    render: () => ({
      type: 'div',
      props: {},
      children: []
    })
  };
}
