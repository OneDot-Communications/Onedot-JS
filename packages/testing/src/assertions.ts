export function expect(actual: any): Assertion {
  return new Assertion(actual);
}

class Assertion {
  constructor(private actual: any) {}

  toEqual(expected: any): void {
    if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)} but received ${JSON.stringify(this.actual)}`);
    }
  }

  toBe(expected: any): void {
    if (this.actual !== expected) {
      throw new Error(`Expected ${expected} but received ${this.actual}`);
    }
  }

  toContain(expected: any): void {
    if (!this.actual.includes(expected)) {
      throw new Error(`Expected ${this.actual} to contain ${expected}`);
    }
  }

  toHaveBeenCalled(): void {
    if (typeof this.actual !== 'function' || !this.actual.mock) {
      throw new Error('Value is not a mock function');
    }
    if (this.actual.mock.calls.length === 0) {
      throw new Error('Expected function to have been called');
    }
  }
}

export function mockFn<T extends (...args: any[]) => any>(): any {
  const fn = ((...args: any[]) => {
    fn.mock.calls.push(args);
    return fn.mock.results[fn.mock.calls.length - 1];
  }) as any;
  fn.mock = {
    calls: [],
    results: []
  };
  return fn;
}
