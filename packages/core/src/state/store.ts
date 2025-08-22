import { Observable, Subject } from '../reactive/observable';
import { Injector } from '../di/injector';
import { map } from '../reactive/operators';

export interface State {
  [key: string]: any;
}

export interface Action {
  type: string;
  payload?: any;
}

export interface Reducer<T extends State> {
  (state: T, action: Action): T;
}

export class Store<T extends State> {
  private state: T;
  private reducer: Reducer<T>;
  private state$ = new Subject<T>();
  private dispatcher = new Subject<Action>();

  constructor(
    initialState: T,
    reducer: Reducer<T>,
    private injector: Injector
  ) {
    this.state = initialState;
    this.reducer = reducer;
    this.dispatcher.subscribe({
      next: (action: Action) => {
        this.state = this.reducer(this.state, action);
        this.state$.next(this.state);
      }
    });
  }

  getState(): T {
    return { ...this.state };
  }

  dispatch(action: Action): void {
    this.dispatcher.next(action);
  }

  select<K extends keyof T>(key: K): Observable<T[K]> {
    return this.state$.pipe(
      map((state: T) => state[key])
    );
  }

  createEffect(effectFn: (actions: Observable<Action>) => Observable<Action>): void {
    effectFn(this.dispatcher).subscribe({
      next: (action: Action) => {
        this.dispatch(action);
      }
    });
  }
}
