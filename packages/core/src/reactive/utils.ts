import { Observable } from './observable';

export function of<T>(...values: T[]): Observable<T> {
  return new Observable<T>((observer) => {
    values.forEach(value => observer.next(value));
    observer.complete?.();
    return () => {};
  });
}

export function fromEvent<T>(
  target: EventTarget,
  eventName: string
): Observable<T> {
  return new Observable<T>((observer) => {
    const handler = (event: Event) => observer.next(event as T);
    target.addEventListener(eventName, handler);
    return () => {
      target.removeEventListener(eventName, handler);
    };
  });
}

export function interval(period: number): Observable<number> {
  return new Observable<number>((observer) => {
    let count = 0;
    const intervalId = setInterval(() => {
      observer.next(count++);
    }, period);
    return () => clearInterval(intervalId);
  });
}
