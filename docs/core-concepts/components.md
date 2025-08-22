# Components

## Class Components

```typescript
import { BaseComponent, createElement } from '@onedotjs/core';

class MyComponent extends BaseComponent {
  render() {
    return createElement('div', {}, 'Hello World');
  }
}
```

## Functional Components

```typescript
import { createElement } from '@onedotjs/core';

const MyComponent = () => {
  return createElement('div', {}, 'Hello World');
};
```

## Props

```typescript
class Greeting extends BaseComponent {
  render() {
    return createElement('div', {}, `Hello ${this.props.name}`);
  }
}

// Usage
createElement(Greeting, { name: 'OneDotJS' });
```

## State

```typescript
class Counter extends BaseComponent {
  constructor() {
    super({});
    this.state = { count: 0 };
  }
  render() {
    return createElement('div', {},
      createElement('button', {
        onClick: () => this.setState({ count: this.state.count + 1 })
      }, 'Increment'),
      createElement('span', {}, `Count: ${this.state.count}`)
    );
  }
}
```
