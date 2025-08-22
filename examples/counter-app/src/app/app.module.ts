import { Module } from '@onedotjs/core';
import { CounterComponent } from './counter.component';

export function reducer(state: { count: number } = { count: 0 }, action: any) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    default:
      return state;
  }
}

export const AppModule = Module.create({
  declarations: [CounterComponent],
  providers: [
    { provide: 'REDUCER', useValue: reducer }
  ]
});
