import { Injector } from './injector';
import { Injectable, Inject } from './decorators';

// Minimal test runner globals for standalone testing
function describe(name: string, fn: () => void) { console.log(name); fn(); }
function it(name: string, fn: () => void) { try { fn(); console.log('  ✔', name); } catch (e) { console.error('  ✖', name, e); } }
function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
    }
  };
}

describe('Dependency Injection', () => {
  it('should resolve simple dependency', () => {
    @Injectable()
    class ServiceA {
      getValue() {
        return 'A';
      }
    }
    const injector = new Injector([ServiceA]);
    const service = injector.get(ServiceA);
    expect(service.getValue()).toBe('A');
  });

  it('should resolve hierarchical dependencies', () => {
    @Injectable()
    class ServiceA {
      getValue() {
        return 'A';
      }
    }
    @Injectable()
    class ServiceB {
      constructor(private serviceA: ServiceA) {}
      getValue() {
        return `B:${this.serviceA.getValue()}`;
      }
    }
    const injector = new Injector([ServiceA, ServiceB]);
    const service = injector.get(ServiceB);
    expect(service.getValue()).toBe('B:A');
  });
});
