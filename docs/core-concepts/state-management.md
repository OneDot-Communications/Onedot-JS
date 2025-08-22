# State Management

## Creating a Store

```typescript
import { Store } from '@onedotjs/core';

interface AppState {
  count: number;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    default:
      return state;
  }
}

const store = new Store({ count: 0 }, reducer, injector);
```

## Using Store in Components

```typescript
import { useSelector, useDispatch } from '@onedotjs/core';

class CounterComponent extends BaseComponent {
  render() {
    const count = useSelector<AppState, number>(this, state => state.count);
    const dispatch = useDispatch<AppState>(this);
    return createElement('div', {},
      createElement('span', {}, `Count: ${count}`),
      createElement('button', {
        onClick: () => dispatch({ type: 'INCREMENT' })
      }, 'Increment')
    );
  }
}
```

## Effects

```typescript
store.createEffect(actions$ => 
  actions$.pipe(
    filter(action => action.type === 'INCREMENT'),
    map(() => ({ type: 'LOG', payload: 'Incremented' }))
  )
);
```
