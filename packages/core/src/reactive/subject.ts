import { Observable, Observer, TeardownLogic } from './observable';

export class Subject<T> extends Observable<T> implements Observer<T> {
  private observers: Observer<T>[] = [];
  private closed = false;

  constructor() {
    super((observer) => {
      this.observers.push(observer);
      return () => {
        this.observers = this.observers.filter(obs => obs !== observer);
      };
    });
  }

  next(value: T): void {
    if (this.closed) return;
    this.observers.forEach(observer => {
      observer.next(value);
    });
  }

  error(err: any): void {
    if (this.closed) return;
    this.observers.forEach(observer => {
      observer.error?.(err);
    });
    this.complete();
  }

  complete(): void {
    if (this.closed) return;
    this.observers.forEach(observer => {
      observer.complete?.();
    });
    this.closed = true;
  }
}
