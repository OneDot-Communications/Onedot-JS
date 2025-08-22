import { OneDotJSRuntime } from './runtime';

// Minimal test runner globals for standalone testing
function describe(name: string, fn: () => void) { console.log(name); fn(); }
function it(name: string, fn: () => void) { try { fn(); console.log('  ✔', name); } catch (e) { console.error('  ✖', name, e); } }
function expect(fn: () => void) {
  return {
    toThrow(msg: string) {
      let threw = false;
      try { fn(); } catch (e) { threw = e.message.includes(msg); }
      if (!threw) throw new Error('Expected to throw: ' + msg);
    },
    not: {
      toThrow() {
        try { fn(); } catch (e) { throw new Error('Expected not to throw'); }
      }
    }
  };
}

describe('OneDotJSRuntime', () => {
  it('should enforce strict TypeScript mode', () => {
    const config = { compilerOptions: {} };
    expect(() => {
      OneDotJSRuntime.getInstance(config);
    }).toThrow('requires TypeScript strict mode');
  });

  it('should accept strict TypeScript config', () => {
    const config = { compilerOptions: { strict: true } };
    expect(() => {
      OneDotJSRuntime.getInstance(config);
    }).not.toThrow();
  });
});
