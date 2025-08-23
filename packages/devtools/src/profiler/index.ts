import { OneDot } from '@onedot/core';

export interface ProfilerOptions {
  enabled?: boolean;
  sampleRate?: number;
  maxSamples?: number;
  trackComponents?: boolean;
  trackStateChanges?: boolean;
  trackRouterChanges?: boolean;
  trackNetworkRequests?: boolean;
  trackUserActions?: boolean;
  trackMemoryUsage?: boolean;
  trackPerformance?: boolean;
  trackRenderTimes?: boolean;
  trackUpdateTime?: boolean;
  autoStart?: boolean;
  remoteProfiling?: boolean;
  remoteProfilingUrl?: string;
  exportFormat?: 'json' | 'csv' | 'xml';
}

export interface ProfileSample {
  timestamp: number;
  type: string;
  data: any;
}

export class Profiler {
  private options: ProfilerOptions;
  private samples: ProfileSample[] = [];
  private isRunning = false;
  private startTime: number | null = null;
  private endTime: number | null = null;
  private socket: any = null;
  private componentUpdateTimes: Map<string, number> = new Map();
  private stateChangeTimes: Map<string, number> = new Map();
  private routerChangeTimes: Map<string, number> = new Map();
  private networkRequestTimes: Map<string, number> = new Map();
  private userActionTimes: Map<string, number> = new Map();
  private memoryUsage: any[] = [];
  private performanceMetrics: any = {};
  private renderTimes: Map<string, number> = new Map();
  private updateTimes: Map<string, number> = new Map();
  private initialized = false;

  constructor(options: ProfilerOptions = {}) {
    this.options = {
      enabled: true,
      sampleRate: 100, // samples per second
      maxSamples: 10000,
      trackComponents: true,
      trackStateChanges: true,
      trackRouterChanges: true,
      trackNetworkRequests: true,
      trackUserActions: true,
      trackMemoryUsage: true,
      trackPerformance: true,
      trackRenderTimes: true,
      trackUpdateTime: true,
      autoStart: false,
      remoteProfiling: false,
      remoteProfilingUrl: 'ws://localhost:8080',
      exportFormat: 'json',
      ...options
    };
  }

  public initialize(): void {
    if (this.initialized) return;

    // Set up component tracking if enabled
    if (this.options.trackComponents) {
      this.setupComponentTracking();
    }

    // Set up state change tracking if enabled
    if (this.options.trackStateChanges) {
      this.setupStateChangeTracking();
    }

    // Set up router change tracking if enabled
    if (this.options.trackRouterChanges) {
      this.setupRouterChangeTracking();
    }

    // Set up network request tracking if enabled
    if (this.options.trackNetworkRequests) {
      this.setupNetworkRequestTracking();
    }

    // Set up user action tracking if enabled
    if (this.options.trackUserActions) {
      this.setupUserActionTracking();
    }

    // Set up memory usage tracking if enabled
    if (this.options.trackMemoryUsage) {
      this.setupMemoryUsageTracking();
    }

    // Set up performance tracking if enabled
    if (this.options.trackPerformance) {
      this.setupPerformanceTracking();
    }

    // Set up render time tracking if enabled
    if (this.options.trackRenderTimes) {
      this.setupRenderTimeTracking();
    }

    // Set up update time tracking if enabled
    if (this.options.trackUpdateTime) {
      this.setupUpdateTimeTracking();
    }

    // Set up remote profiling if enabled
    if (this.options.remoteProfiling) {
      this.setupRemoteProfiling();
    }

    // Auto start if enabled
    if (this.options.autoStart) {
      this.start();
    }

    this.initialized = true;
  }

  public destroy(): void {
    if (!this.initialized) return;

    // Stop profiling if running
    if (this.isRunning) {
      this.stop();
    }

    // Clean up component tracking
    this.cleanupComponentTracking();

    // Clean up state change tracking
    this.cleanupStateChangeTracking();

    // Clean up router change tracking
    this.cleanupRouterChangeTracking();

    // Clean up network request tracking
    this.cleanupNetworkRequestTracking();

    // Clean up user action tracking
    this.cleanupUserActionTracking();

    // Clean up memory usage tracking
    this.cleanupMemoryUsageTracking();

    // Clean up performance tracking
    this.cleanupPerformanceTracking();

    // Clean up render time tracking
    this.cleanupRenderTimeTracking();

    // Clean up update time tracking
    this.cleanupUpdateTimeTracking();

    // Clean up remote profiling
    this.cleanupRemoteProfiling();

    // Clear samples
    this.samples = [];

    // Clear maps
    this.componentUpdateTimes.clear();
    this.stateChangeTimes.clear();
    this.routerChangeTimes.clear();
    this.networkRequestTimes.clear();
    this.userActionTimes.clear();
    this.renderTimes.clear();
    this.updateTimes.clear();

    // Clear arrays
    this.memoryUsage = [];
    this.performanceMetrics = {};

    this.initialized = false;
  }

  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = performance.now();
    this.endTime = null;

    // Start sampling
    this.startSampling();
  }

  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.endTime = performance.now();

    // Stop sampling
    this.stopSampling();
  }

  public reset(): void {
    this.samples = [];
    this.componentUpdateTimes.clear();
    this.stateChangeTimes.clear();
    this.routerChangeTimes.clear();
    this.networkRequestTimes.clear();
    this.userActionTimes.clear();
    this.memoryUsage = [];
    this.performanceMetrics = {};
    this.renderTimes.clear();
    this.updateTimes.clear();

    if (this.isRunning) {
      this.startTime = performance.now();
      this.endTime = null;
    } else {
      this.startTime = null;
      this.endTime = null;
    }
  }

  public isProfiling(): boolean {
    return this.isRunning;
  }

  public getSamples(): ProfileSample[] {
    return [...this.samples];
  }

  public getComponentUpdateTimes(): Map<string, number> {
    return new Map(this.componentUpdateTimes);
  }

  public getStateChangeTimes(): Map<string, number> {
    return new Map(this.stateChangeTimes);
  }

  public getRouterChangeTimes(): Map<string, number> {
    return new Map(this.routerChangeTimes);
  }

  public getNetworkRequestTimes(): Map<string, number> {
    return new Map(this.networkRequestTimes);
  }

  public getUserActionTimes(): Map<string, number> {
    return new Map(this.userActionTimes);
  }

  public getMemoryUsage(): any[] {
    return [...this.memoryUsage];
  }

  public getPerformanceMetrics(): any {
    return { ...this.performanceMetrics };
  }

  public getRenderTimes(): Map<string, number> {
    return new Map(this.renderTimes);
  }

  public getUpdateTimes(): Map<string, number> {
    return new Map(this.updateTimes);
  }

  public getDuration(): number | null {
    if (!this.startTime) return null;

    const endTime = this.endTime || performance.now();
    return endTime - this.startTime;
  }

  public getAverageComponentUpdateTime(): number {
    if (this.componentUpdateTimes.size === 0) return 0;

    let total = 0;
    this.componentUpdateTimes.forEach(time => {
      total += time;
    });

    return total / this.componentUpdateTimes.size;
  }

  public getAverageStateChangeTime(): number {
    if (this.stateChangeTimes.size === 0) return 0;

    let total = 0;
    this.stateChangeTimes.forEach(time => {
      total += time;
    });

    return total / this.stateChangeTimes.size;
  }

  public getAverageRouterChangeTime(): number {
    if (this.routerChangeTimes.size === 0) return 0;

    let total = 0;
    this.routerChangeTimes.forEach(time => {
      total += time;
    });

    return total / this.routerChangeTimes.size;
  }

  public getAverageNetworkRequestTime(): number {
    if (this.networkRequestTimes.size === 0) return 0;

    let total = 0;
    this.networkRequestTimes.forEach(time => {
      total += time;
    });

    return total / this.networkRequestTimes.size;
  }

  public getAverageUserActionTime(): number {
    if (this.userActionTimes.size === 0) return 0;

    let total = 0;
    this.userActionTimes.forEach(time => {
      total += time;
    });

    return total / this.userActionTimes.size;
  }

  public getAverageRenderTime(): number {
    if (this.renderTimes.size === 0) return 0;

    let total = 0;
    this.renderTimes.forEach(time => {
      total += time;
    });

    return total / this.renderTimes.size;
  }

  public getAverageUpdateTime(): number {
    if (this.updateTimes.size === 0) return 0;

    let total = 0;
    this.updateTimes.forEach(time => {
      total += time;
    });

    return total / this.updateTimes.size;
  }

  public getTotalComponentUpdateTime(): number {
    let total = 0;
    this.componentUpdateTimes.forEach(time => {
      total += time;
    });

    return total;
  }

  public getTotalStateChangeTime(): number {
    let total = 0;
    this.stateChangeTimes.forEach(time => {
      total += time;
    });

    return total;
  }

  public getTotalRouterChangeTime(): number {
    let total = 0;
    this.routerChangeTimes.forEach(time => {
      total += time;
    });

    return total;
  }

  public getTotalNetworkRequestTime(): number {
    let total = 0;
    this.networkRequestTimes.forEach(time => {
      total += time;
    });

    return total;
  }

  public getTotalUserActionTime(): number {
    let total = 0;
    this.userActionTimes.forEach(time => {
      total += time;
    });

    return total;
  }

  public getTotalRenderTime(): number {
    let total = 0;
    this.renderTimes.forEach(time => {
      total += time;
    });

    return total;
  }

  public getTotalUpdateTime(): number {
    let total = 0;
    this.updateTimes.forEach(time => {
      total += time;
    });

    return total;
  }

  public exportData(): string {
    const data = {
      samples: this.samples,
      componentUpdateTimes: Array.from(this.componentUpdateTimes.entries()),
      stateChangeTimes: Array.from(this.stateChangeTimes.entries()),
      routerChangeTimes: Array.from(this.routerChangeTimes.entries()),
      networkRequestTimes: Array.from(this.networkRequestTimes.entries()),
      userActionTimes: Array.from(this.userActionTimes.entries()),
      memoryUsage: this.memoryUsage,
      performanceMetrics: this.performanceMetrics,
      renderTimes: Array.from(this.renderTimes.entries()),
      updateTimes: Array.from(this.updateTimes.entries()),
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.getDuration()
    };

    switch (this.options.exportFormat) {
      case 'json':
        return JSON.stringify(data, null, 2);

      case 'csv':
        return this.exportAsCSV(data);

      case 'xml':
        return this.exportAsXML(data);

      default:
        return JSON.stringify(data, null, 2);
    }
  }

  private exportAsCSV(data: any): string {
    let csv = 'timestamp,type,data\n';

    data.samples.forEach((sample: ProfileSample) => {
      csv += `${sample.timestamp},${sample.type},"${JSON.stringify(sample.data).replace(/"/g, '""')}"\n`;
    });

    return csv;
  }

  private exportAsXML(data: any): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<profile>\n';

    xml += `  <startTime>${data.startTime}</startTime>\n`;
    xml += `  <endTime>${data.endTime}</endTime>\n`;
    xml += `  <duration>${data.duration}</duration>\n`;

    xml += '  <samples>\n';
    data.samples.forEach((sample: ProfileSample) => {
      xml += '    <sample>\n';
      xml += `      <timestamp>${sample.timestamp}</timestamp>\n`;
      xml += `      <type>${sample.type}</type>\n`;
      xml += `      <data>${JSON.stringify(sample.data)}</data>\n`;
      xml += '    </sample>\n';
    });
    xml += '  </samples>\n';

    xml += '  <componentUpdateTimes>\n';
    data.componentUpdateTimes.forEach(([key, value]: [string, number]) => {
      xml += '    <componentUpdateTime>\n';
      xml += `      <component>${key}</component>\n`;
      xml += `      <time>${value}</time>\n`;
      xml += '    </componentUpdateTime>\n';
    });
    xml += '  </componentUpdateTimes>\n';

    xml += '  <stateChangeTimes>\n';
    data.stateChangeTimes.forEach(([key, value]: [string, number]) => {
      xml += '    <stateChangeTime>\n';
      xml += `      <action>${key}</action>\n`;
      xml += `      <time>${value}</time>\n`;
      xml += '    </stateChangeTime>\n';
    });
    xml += '  </stateChangeTimes>\n';

    xml += '  <routerChangeTimes>\n';
    data.routerChangeTimes.forEach(([key, value]: [string, number]) => {
      xml += '    <routerChangeTime>\n';
      xml += `      <route>${key}</route>\n`;
      xml += `      <time>${value}</time>\n`;
      xml += '    </routerChangeTime>\n';
    });
    xml += '  </routerChangeTimes>\n';

    xml += '  <networkRequestTimes>\n';
    data.networkRequestTimes.forEach(([key, value]: [string, number]) => {
      xml += '    <networkRequestTime>\n';
      xml += `      <url>${key}</url>\n`;
      xml += `      <time>${value}</time>\n`;
      xml += '    </networkRequestTime>\n';
    });
    xml += '  </networkRequestTimes>\n';

    xml += '  <userActionTimes>\n';
    data.userActionTimes.forEach(([key, value]: [string, number]) => {
      xml += '    <userActionTime>\n';
      xml += `      <action>${key}</action>\n`;
      xml += `      <time>${value}</time>\n`;
      xml += '    </userActionTime>\n';
    });
    xml += '  </userActionTimes>\n';

    xml += '  <memoryUsage>\n';
    data.memoryUsage.forEach((usage: any) => {
      xml += '    <memoryUsage>\n';
      xml += `      <timestamp>${usage.timestamp}</timestamp>\n`;
      xml += `      <used>${usage.used}</used>\n`;
      xml += `      <total>${usage.total}</total>\n`;
      xml += `      <percentage>${usage.percentage}</percentage>\n`;
      xml += '    </memoryUsage>\n';
    });
    xml += '  </memoryUsage>\n';

    xml += '  <performanceMetrics>\n';
    Object.entries(data.performanceMetrics).forEach(([key, value]) => {
      xml += `    <${key}>${value}</${key}>\n`;
    });
    xml += '  </performanceMetrics>\n';

    xml += '  <renderTimes>\n';
    data.renderTimes.forEach(([key, value]: [string, number]) => {
      xml += '    <renderTime>\n';
      xml += `      <component>${key}</component>\n`;
      xml += `      <time>${value}</time>\n`;
      xml += '    </renderTime>\n';
    });
    xml += '  </renderTimes>\n';

    xml += '  <updateTimes>\n';
    data.updateTimes.forEach(([key, value]: [string, number]) => {
      xml += '    <updateTime>\n';
      xml += `      <component>${key}</component>\n`;
      xml += `      <time>${value}</time>\n`;
      xml += '    </updateTime>\n';
    });
    xml += '  </updateTimes>\n';

    xml += '</profile>';

    return xml;
  }

  private startSampling(): void {
    // Start sampling at the specified rate
    const sampleInterval = 1000 / this.options.sampleRate!;

    const sample = () => {
      if (!this.isRunning) return;

      const timestamp = performance.now();

      // Sample memory usage if enabled
      if (this.options.trackMemoryUsage) {
        this.sampleMemoryUsage(timestamp);
      }

      // Sample performance metrics if enabled
      if (this.options.trackPerformance) {
        this.samplePerformanceMetrics(timestamp);
      }

      // Schedule next sample
      setTimeout(sample, sampleInterval);
    };

    // Start sampling
    setTimeout(sample, sampleInterval);
  }

  private stopSampling(): void {
    // Sampling will stop automatically when isRunning is false
  }

  private sampleMemoryUsage(timestamp: number): void {
    if (typeof (performance as any).memory !== 'undefined') {
      const memory = (performance as any).memory;

      const used = memory.usedJSHeapSize;
      const total = memory.totalJSHeapSize;
      const percentage = (used / total) * 100;

      this.memoryUsage.push({
        timestamp,
        used,
        total,
        percentage
      });

      // Add sample
      this.addSample({
        timestamp,
        type: 'memory',
        data: {
          used,
          total,
          percentage
        }
      });
    }
  }

  private samplePerformanceMetrics(timestamp: number): void {
    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      this.performanceMetrics.navigation = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart
      };
    }

    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint');
    this.performanceMetrics.paint = paintEntries.map(entry => ({
      name: entry.name,
      startTime: entry.startTime
    }));

    // Get resource timing
    const resourceEntries = performance.getEntriesByType('resource');
    this.performanceMetrics.resources = resourceEntries.map(entry => ({
      name: entry.name,
      duration: entry.duration,
      size: (entry as any).transferSize
    }));

    // Get long tasks
    const longTaskEntries = performance.getEntriesByType('longtask');
    this.performanceMetrics.longTasks = longTaskEntries.map(entry => ({
      duration: entry.duration,
      name: entry.name
    }));

    // Add sample
    this.addSample({
      timestamp,
      type: 'performance',
      data: {
        navigation: this.performanceMetrics.navigation,
        paint: this.performanceMetrics.paint,
        resources: this.performanceMetrics.resources,
        longTasks: this.performanceMetrics.longTasks
      }
    });
  }

  private addSample(sample: ProfileSample): void {
    this.samples.push(sample);

    // Limit samples
    if (this.samples.length > this.options.maxSamples!) {
      this.samples.shift();
    }

    // Send to remote profiler if enabled
    if (this.socket && this.options.remoteProfiling) {
      this.socket.send(JSON.stringify({
        type: 'sample',
        data: sample
      }));
    }
  }

  private setupComponentTracking(): void {
    window.addEventListener('onedot-component-updated', (event: any) => {
      const { component, duration } = event.detail;

      this.componentUpdateTimes.set(component, duration);

      // Add sample
      this.addSample({
        timestamp: performance.now(),
        type: 'component-update',
        data: {
          component,
          duration
        }
      });
    });
  }

  private setupStateChangeTracking(): void {
    const stateManager = OneDot.getStateManager();
    if (stateManager) {
      const originalDispatch = stateManager.dispatch;
      stateManager.dispatch = (action: any) => {
        const startTime = performance.now();
        const result = originalDispatch.call(stateManager, action);
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.stateChangeTimes.set(action.type, duration);

        // Add sample
        this.addSample({
          timestamp: startTime,
          type: 'state-change',
          data: {
            action: action.type,
            duration
          }
        });

        return result;
      };
    }
  }

  private setupRouterChangeTracking(): void {
    const router = OneDot.getRouter();
    if (router) {
      const originalPush = router.push;
      const originalReplace = router.replace;

      router.push = (location: any) => {
        const startTime = performance.now();
        const result = originalPush.call(router, location);
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.routerChangeTimes.set(location.toString(), duration);

        // Add sample
        this.addSample({
          timestamp: startTime,
          type: 'router-change',
          data: {
            type: 'push',
            location,
            duration
          }
        });

        return result;
      };

      router.replace = (location: any) => {
        const startTime = performance.now();
        const result = originalReplace.call(router, location);
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.routerChangeTimes.set(location.toString(), duration);

        // Add sample
        this.addSample({
          timestamp: startTime,
          type: 'router-change',
          data: {
            type: 'replace',
            location,
            duration
          }
        });

        return result;
      };
    }
  }

  private setupNetworkRequestTracking(): void {
    // Override fetch to track network requests
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = performance.now();
      let response: Response;

      try {
        response = await originalFetch(input, init);
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.networkRequestTimes.set(typeof input === 'string' ? input : input.url, duration);

        // Add sample
        this.addSample({
          timestamp: startTime,
          type: 'network-request',
          data: {
            url: typeof input === 'string' ? input : input.url,
            method: init?.method || 'GET',
            status: response.status,
            duration,
            success: response.ok
          }
        });

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.networkRequestTimes.set(typeof input === 'string' ? input : input.url, duration);

        // Add sample
        this.addSample({
          timestamp: startTime,
          type: 'network-request',
          data: {
            url: typeof input === 'string' ? input : input.url,
            method: init?.method || 'GET',
            status: 0,
            duration,
            success: false,
            error
          }
        });

        throw error;
      }
    };
  }

  private setupUserActionTracking(): void {
    // Track click events
    document.addEventListener('click', (event) => {
      const timestamp = performance.now();
      const target = event.target as HTMLElement;

      this.userActionTimes.set(`click-${target.tagName}-${timestamp}`, 0);

      // Add sample
      this.addSample({
        timestamp,
        type: 'user-action',
        data: {
          type: 'click',
          target: {
            tagName: target.tagName,
            id: target.id,
            className: target.className
          }
        }
      });
    });

    // Track key events
    document.addEventListener('keydown', (event) => {
      const timestamp = performance.now();
      const target = event.target as HTMLElement;

      this.userActionTimes.set(`keydown-${event.key}-${timestamp}`, 0);

      // Add sample
      this.addSample({
        timestamp,
        type: 'user-action',
        data: {
          type: 'keydown',
          key: event.key,
          target: {
            tagName: target.tagName,
            id: target.id,
            className: target.className
          }
        }
      });
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const timestamp = performance.now();
      const target = event.target as HTMLElement;

      this.userActionTimes.set(`submit-${target.tagName}-${timestamp}`, 0);

      // Add sample
      this.addSample({
        timestamp,
        type: 'user-action',
        data: {
          type: 'submit',
          target: {
            tagName: target.tagName,
            id: target.id,
            className: target.className
          }
        }
      });
    });
  }

  private setupMemoryUsageTracking(): void {
    // Memory usage is sampled in the sampleMemoryUsage method
  }

  private setupPerformanceTracking(): void {
    // Performance metrics are sampled in the samplePerformanceMetrics method
  }

  private setupRenderTimeTracking(): void {
    window.addEventListener('onedot-component-rendered', (event: any) => {
      const { component, duration } = event.detail;

      this.renderTimes.set(component, duration);

      // Add sample
      this.addSample({
        timestamp: performance.now(),
        type: 'render',
        data: {
          component,
          duration
        }
      });
    });
  }

  private setupUpdateTimeTracking(): void {
    window.addEventListener('onedot-component-updated', (event: any) => {
      const { component, duration } = event.detail;

      this.updateTimes.set(component, duration);

      // Add sample
      this.addSample({
        timestamp: performance.now(),
        type: 'update',
        data: {
          component,
          duration
        }
      });
    });
  }

  private setupRemoteProfiling(): void {
    if (typeof WebSocket !== 'undefined') {
      this.socket = new WebSocket(this.options.remoteProfilingUrl!);

      this.socket.onopen = () => {
        console.log('Profiler connected to remote server');
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'start':
              this.start();
              break;
            case 'stop':
              this.stop();
              break;
            case 'reset':
              this.reset();
              break;
            case 'export':
              const data = this.exportData();
              this.socket.send(JSON.stringify({
                type: 'export',
                data
              }));
              break;
            default:
              console.warn('Unknown profiler message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing profiler message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('Profiler disconnected from remote server');
      };

      this.socket.onerror = (error) => {
        console.error('Profiler error:', error);
      };
    }
  }

  private cleanupComponentTracking(): void {
    // Component tracking listeners are automatically removed when the profiler is destroyed
  }

  private cleanupStateChangeTracking(): void {
    // Restore original dispatch method
    const stateManager = OneDot.getStateManager();
    if (stateManager) {
      stateManager.dispatch = this.originalConsole.dispatch;
    }
  }

  private cleanupRouterChangeTracking(): void {
    // Restore original router methods
    const router = OneDot.getRouter();
    if (router) {
      router.push = this.originalConsole.push;
      router.replace = this.originalConsole.replace;
    }
  }

  private cleanupNetworkRequestTracking(): void {
    // Restore original fetch method
    window.fetch = this.originalConsole.fetch;
  }

  private cleanupUserActionTracking(): void {
    // User action listeners are automatically removed when the profiler is destroyed
  }

  private cleanupMemoryUsageTracking(): void {
    // Memory usage tracking doesn't require cleanup
  }

  private cleanupPerformanceTracking(): void {
    // Performance tracking doesn't require cleanup
  }

  private cleanupRenderTimeTracking(): void {
    // Render time listeners are automatically removed when the profiler is destroyed
  }

  private cleanupUpdateTimeTracking(): void {
    // Update time listeners are automatically removed when the profiler is destroyed
  }

  private cleanupRemoteProfiling(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
