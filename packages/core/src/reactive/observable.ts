export type Operator<T, R> = (source: Observable<T>) => Observable<R>;

export class Observable<T> {
  private subscribeFn: (observer: Observer<T>) => TeardownLogic;

  constructor(subscribeFn: (observer: Observer<T>) => TeardownLogic) {
    this.subscribeFn = subscribeFn;
  }

  subscribe(observer: Observer<T>): Subscription {
    const teardown = this.subscribeFn(observer);
    return new Subscription(teardown ?? (() => {}));
  }

  pipe(...operators: Operator<any, any>[]): Observable<any> {
    return operators.reduce<Observable<any>>(
      (source, operator) => operator(source),
      this
    );
  }
}

export class Subject<T> extends Observable<T> {
  private observers: Array<(value: T) => void> = [];
  constructor() {
    super((observer) => {
      this.observers.push(observer.next);
      return () => {
        this.observers = this.observers.filter(fn => fn !== observer.next);
      };
    });
  }
  next(value: T) {
    this.observers.forEach(fn => fn(value));
  }
}

export interface Observer<T> {
  next: (value: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
}

export type TeardownLogic = () => void;

export class Subscription {
  private unsubscribed = false;
  constructor(private teardown: TeardownLogic) {}

  unsubscribe(): void {
    if (!this.unsubscribed) {
      this.unsubscribed = true;
      this.teardown();
    }
  }
}
