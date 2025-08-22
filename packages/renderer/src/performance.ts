// Performance optimization utilities for OneDotJS
export class Profiler {
  private marks: Record<string, number> = {};
  mark(label: string) {
    this.marks[label] = performance.now();
  }
  measure(label: string, startLabel: string) {
    if (this.marks[startLabel] !== undefined) {
      return performance.now() - this.marks[startLabel];
    }
    return -1;
  }
}

export class Scheduler {
  static schedule(callback: () => void, delay: number = 0) {
    setTimeout(callback, delay);
  }
}

export class MemoryManager {
  static getMemoryUsage(): number {
  // Platform-agnostic stub, replace with real logic per platform
  return 0;
  }
}
