
// Define missing types
export type State = Record<string, any>;
export interface Action {
  type: string;
  payload?: any;
}

import { Store } from './store';
import { BaseComponent } from '../base-component';
import { Observable } from '../reactive/observable';

export function useStore<T extends State>(component: BaseComponent): Store<T> {
  // Implementation to inject store into component
  return (component as any)['injector'].get(Store);
}

export function useSelector<T extends State, K extends keyof T>(
  component: BaseComponent,
  selector: (state: T) => T[K]
): T[K] {
  const store = useStore<T>(component);
  const state = store.getState();
  return selector(state);
}

export function useDispatch<T extends State>(
  component: BaseComponent
): (action: Action) => void {
  const store = useStore<T>(component);
  return store.dispatch.bind(store);
}
