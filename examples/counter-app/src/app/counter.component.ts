import { Component, BaseComponent } from '@onedotjs/core';
import { useSelector, useDispatch } from '@onedotjs/core';
import { createElement } from '@onedotjs/core';

interface CounterState {
  count: number;
}

@Component({
  selector: 'app-counter'
})
export class CounterComponent extends BaseComponent {
  constructor() {
    super({});
  }

  render() {
    const count = useSelector<CounterState, number>(this, state => state.count);
    const dispatch = useDispatch<CounterState>(this);
    return createElement('div', { className: 'counter' },
      createElement('h1', {}, `Count: ${count}`),
      createElement('button', {
        onClick: () => dispatch({ type: 'INCREMENT' })
      }, 'Increment'),
      createElement('button', {
        onClick: () => dispatch({ type: 'DECREMENT' })
      }, 'Decrement')
    );
  }
}
