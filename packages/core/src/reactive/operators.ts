import { Observable, Observer } from './observable';

export interface Operator<T, R> {
  (source: Observable<T>): Observable<R>;
}

export function map<T, R>(project: (value: T) => R): Operator<T, R> {
  return (source: Observable<T>) => {
    return new Observable<R>((observer: Observer<R>) => {
      const subscription = source.subscribe({
        next: (value: T) => observer.next(project(value)),
        error: (err: any) => observer.error?.(err),
        complete: () => observer.complete?.()
      });
      return () => subscription.unsubscribe();
    });
  };
}

export function filter<T>(predicate: (value: T) => boolean): Operator<T, T> {
  return (source: Observable<T>) => {
    return new Observable<T>((observer: Observer<T>) => {
      const subscription = source.subscribe({
        next: (value: T) => {
          if (predicate(value)) {
            observer.next(value);
          }
        },
        error: (err: any) => observer.error?.(err),
        complete: () => observer.complete?.()
      });
      return () => subscription.unsubscribe();
    });
  };
}

export function debounceTime<T>(dueTime: number): Operator<T, T> {
  return (source: Observable<T>) => {
    return new Observable<T>((observer: Observer<T>) => {
      let timeoutId: number | null = null;
      let lastValue: T | null = null;
      const subscription = source.subscribe({
        next: (value: T) => {
          lastValue = value;
          if (timeoutId) {
            window.clearTimeout(timeoutId);
          }
          timeoutId = window.setTimeout(() => {
            observer.next(lastValue as T);
            timeoutId = null;
          }, dueTime);
        },
        error: (err: any) => observer.error?.(err),
        complete: () => {
          if (timeoutId) {
            window.clearTimeout(timeoutId);
            observer.next(lastValue as T);
          }
          observer.complete?.();
        }
      });
      return () => {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        subscription.unsubscribe();
      };
    });
  };
}
