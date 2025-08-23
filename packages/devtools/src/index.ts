export * from './debugger';
export * from './hmr';
export * from './profiler';
export * from './testing';

import { Debugger } from './debugger';
import { HMR } from './hmr';
import { Profiler } from './profiler';
import { Testing } from './testing';

export class DevTools {
  private debugger: Debugger;
  private hmr: HMR;
  private profiler: Profiler;
  private testing: Testing;
  private initialized = false;

  constructor() {
    this.debugger = new Debugger();
    this.hmr = new HMR();
    this.profiler = new Profiler();
    this.testing = new Testing();
  }

  public initialize(): void {
    if (this.initialized) return;

    this.debugger.initialize();
    this.hmr.initialize();
    this.profiler.initialize();
    this.testing.initialize();

    this.initialized = true;
  }

  public getDebugger(): Debugger {
    return this.debugger;
  }

  public getHMR(): HMR {
    return this.hmr;
  }

  public getProfiler(): Profiler {
    return this.profiler;
  }

  public getTesting(): Testing {
    return this.testing;
  }

  public destroy(): void {
    if (!this.initialized) return;

    this.debugger.destroy();
    this.hmr.destroy();
    this.profiler.destroy();
    this.testing.destroy();

    this.initialized = false;
  }
}

// Factory function to create devtools
export function createDevTools(): DevTools {
  return new DevTools();
}
