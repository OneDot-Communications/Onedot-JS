# Migrating from React

## Components

### React
```jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <span>Count: {count}</span>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### OneDotJS
```typescript
import { BaseComponent, createElement } from '@onedotjs/core';

class Counter extends BaseComponent {
  constructor() {
    super({});
    this.state = { count: 0 };
  }
  render() {
    return createElement('div', {},
      createElement('span', {}, `Count: ${this.state.count}`),
      createElement('button', {
        onClick: () => this.setState({ count: this.state.count + 1 })
      }, 'Increment')
    );
  }
}
```

## State Management

### React + Redux
```jsx
import { useSelector, useDispatch } from 'react-redux';

function Counter() {
  const count = useSelector(state => state.count);
  const dispatch = useDispatch();
  return (
    <div>
      <span>Count: {count}</span>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>
        Increment
      </button>
    </div>
  );
}
```

### OneDotJS
```typescript
import { BaseComponent, createElement, useSelector, useDispatch } from '@onedotjs/core';

class Counter extends BaseComponent {
  render() {
    const count = useSelector(this, state => state.count);
    const dispatch = useDispatch(this);
    return createElement('div', {},
      createElement('span', {}, `Count: ${count}`),
      createElement('button', {
        onClick: () => dispatch({ type: 'INCREMENT' })
      }, 'Increment')
    );
  }
}
```
