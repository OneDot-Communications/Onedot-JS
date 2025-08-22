import { Store, State } from './store';
import { Action } from './hooks';

export interface Middleware {
  (store: Store<any>): (next: (action: Action) => void) => (action: Action) => void;
}

export function applyMiddleware<T extends State>(
  store: Store<T>,
  ...middlewares: Middleware[]
): Store<T> {
  const dispatch = (action: Action) => {
    store.dispatch(action);
  };
  const middlewareAPI: Store<T> = store;
  const chain = middlewares.map(middleware => middleware(middlewareAPI));
  return {
    ...store,
    dispatch: chain.reduce((acc, curr) => curr(acc), dispatch)
  } as Store<T>;
}
