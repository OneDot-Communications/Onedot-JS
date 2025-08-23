import { OneDot } from '@onedot/core';
import { AIAssistant } from './ai-assistant';
import { ErrorOverlay } from './error-overlay';

export interface DebuggerOptions {
  aiAssistant?: boolean;
  errorOverlay?: boolean;
  sourceMaps?: boolean;
  breakOnError?: boolean;
  consoleOverrides?: boolean;
  trackPerformance?: boolean;
  trackStateChanges?: boolean;
  trackComponentUpdates?: boolean;
  trackRouterChanges?: boolean;
  trackNetworkRequests?: boolean;
  trackUserActions?: boolean;
  maxLogEntries?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  remoteDebugging?: boolean;
  remoteDebuggingUrl?: string;
}

export class Debugger {
  private aiAssistant: AIAssistant | null = null;
  private errorOverlay: ErrorOverlay | null = null;
  private options: DebuggerOptions;
  private logEntries: any[] = [];
  private performanceMetrics: any = {};
  private stateChangeLog: any[] = [];
  private componentUpdateLog: any[] = [];
  private routerChangeLog: any[] = [];
  private networkRequestLog: any[] = [];
  private userActionLog: any[] = [];
  private initialized = false;
  private originalConsole: any = {};
  private socket: any = null;
  private errorListeners: Function[] = [];
  private warningListeners: Function[] = [];
  private infoListeners: Function[] = [];

  constructor(options: DebuggerOptions = {}) {
    this.options = {
      aiAssistant: true,
      errorOverlay: true,
      sourceMaps: true,
      breakOnError: false,
      consoleOverrides: true,
      trackPerformance: true,
      trackStateChanges: true,
      trackComponentUpdates: true,
      trackRouterChanges: true,
      trackNetworkRequests: true,
      trackUserActions: true,
      maxLogEntries: 1000,
      logLevel: 'debug',
      remoteDebugging: false,
      ...options
    };
  }

  public initialize(): void {
    if (this.initialized) return;

    // Initialize AI assistant if enabled
    if (this.options.aiAssistant) {
      this.aiAssistant = new AIAssistant();
      this.aiAssistant.initialize();
    }

    // Initialize error overlay if enabled
    if (this.options.errorOverlay) {
      this.errorOverlay = new ErrorOverlay();
      this.errorOverlay.initialize();
    }

    // Override console methods if enabled
    if (this.options.consoleOverrides) {
      this.overrideConsole();
    }

    // Set up error handling
    this.setupErrorHandling();

    // Set up performance tracking if enabled
    if (this.options.trackPerformance) {
      this.setupPerformanceTracking();
    }

    // Set up state change tracking if enabled
    if (this.options.trackStateChanges) {
      this.setupStateChangeTracking();
    }

    // Set up component update tracking if enabled
    if (this.options.trackComponentUpdates) {
      this.setupComponentUpdateTracking();
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

    // Set up remote debugging if enabled
    if (this.options.remoteDebugging) {
      this.setupRemoteDebugging();
    }

    this.initialized = true;
  }

  public destroy(): void {
    if (!this.initialized) return;

    // Destroy AI assistant if it exists
    if (this.aiAssistant) {
      this.aiAssistant.destroy();
    }

    // Destroy error overlay if it exists
    if (this.errorOverlay) {
      this.errorOverlay.destroy();
    }

    // Restore original console methods
    this.restoreConsole();

    // Clean up error handling
    this.cleanupErrorHandling();

    // Clean up performance tracking
    this.cleanupPerformanceTracking();

    // Clean up state change tracking
    this.cleanupStateChangeTracking();

    // Clean up component update tracking
    this.cleanupComponentUpdateTracking();

    // Clean up router change tracking
    this.cleanupRouterChangeTracking();

    // Clean up network request tracking
    this.cleanupNetworkRequestTracking();

    // Clean up user action tracking
    this.cleanupUserActionTracking();

    // Clean up remote debugging
    this.cleanupRemoteDebugging();

    this.initialized = false;
  }

  private overrideConsole(): void {
    const originalConsole = { ...console };
    this.originalConsole = originalConsole;

    // Override console.log
    console.log = (...args: any[]) => {
      this.addLogEntry('log', args);
      originalConsole.log(...args);
    };

    // Override console.info
    console.info = (...args: any[]) => {
      this.addLogEntry('info', args);
      originalConsole.info(...args);
      this.notifyInfoListeners(args);
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      this.addLogEntry('warn', args);
      originalConsole.warn(...args);
      this.notifyWarningListeners(args);
    };

    // Override console.error
    console.error = (...args: any[]) => {
      this.addLogEntry('error', args);
      originalConsole.error(...args);
      this.notifyErrorListeners(args);

      // Show error overlay if enabled
      if (this.errorOverlay) {
        this.errorOverlay.showError(args);
      }

      // Break on error if enabled
      if (this.options.breakOnError) {
        debugger; // eslint-disable-line no-debugger
      }
    };

    // Override console.debug
    console.debug = (...args: any[]) => {
      this.addLogEntry('debug', args);
      originalConsole.debug(...args);
    };
  }

  private restoreConsole(): void {
    Object.keys(this.originalConsole).forEach(key => {
      console[key] = this.originalConsole[key];
    });
  }

  private addLogEntry(level: string, args: any[]): void {
    if (this.options.logLevel === 'silent') return;

    const logLevels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = logLevels.indexOf(this.options.logLevel!);
    const entryLevelIndex = logLevels.indexOf(level);

    if (entryLevelIndex < currentLevelIndex) return;

    const entry = {
      level,
      timestamp: new Date(),
      args: args.map(arg => {
        if (arg instanceof Error) {
          return {
            name: arg.name,
            message: arg.message,
            stack: arg.stack
          };
        }
        return arg;
      })
    };

    this.logEntries.push(entry);

    // Limit log entries
    if (this.logEntries.length > this.options.maxLogEntries!) {
      this.logEntries.shift();
    }

    // Send to remote debugger if enabled
    if (this.socket && this.options.remoteDebugging) {
      this.socket.send(JSON.stringify({
        type: 'log',
        data: entry
      }));
    }
  }

  private setupErrorHandling(): void {
    window.addEventListener('error', (event) => {
      this.addLogEntry('error', [event.error]);
      this.notifyErrorListeners([event.error]);

      // Show error overlay if enabled
      if (this.errorOverlay) {
        this.errorOverlay.showError([event.error]);
      }

      // Break on error if enabled
      if (this.options.breakOnError) {
        debugger; // eslint-disable-line no-debugger
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.addLogEntry('error', [event.reason]);
      this.notifyErrorListeners([event.reason]);

      // Show error overlay if enabled
      if (this.errorOverlay) {
        this.errorOverlay.showError([event.reason]);
      }

      // Break on error if enabled
      if (this.options.breakOnError) {
        debugger; // eslint-disable-line no-debugger
      }
    });
  }

  private cleanupErrorHandling(): void {
    // Error listeners are automatically removed when the debugger is destroyed
  }

  private setupPerformanceTracking(): void {
    // Track page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.performanceMetrics.pageLoad = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint(),
          largestContentfulPaint: this.getLargestContentfulPaint(),
          cumulativeLayoutShift: this.getCumulativeLayoutShift(),
          timeToInteractive: this.getTimeToInteractive()
        };
      }
    });

    // Track resource loading performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!this.performanceMetrics.resources) {
          this.performanceMetrics.resources = [];
        }
        this.performanceMetrics.resources.push(entry);
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    // Track long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!this.performanceMetrics.longTasks) {
          this.performanceMetrics.longTasks = [];
        }
        this.performanceMetrics.longTasks.push(entry);
      });
    });

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long tasks might not be supported in all browsers
    }
  }

  private cleanupPerformanceTracking(): void {
    // Performance observers are automatically disconnected when the debugger is destroyed
  }

  private getFirstPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  private getFirstContentfulPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : null;
  }

  private getLargestContentfulPaint(): number | null {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      return lcpEntries[lcpEntries.length - 1].startTime;
    }
    return null;
  }

  private getCumulativeLayoutShift(): number | null {
    // This would require a more complex implementation with a PerformanceObserver
    return null;
  }

  private getTimeToInteractive(): number | null {
    // This would require a more complex implementation
    return null;
  }

  private setupStateChangeTracking(): void {
    const stateManager = OneDot.getStateManager();
    if (stateManager) {
      const originalDispatch = stateManager.dispatch;
      stateManager.dispatch = (action: any) => {
        const result = originalDispatch.call(stateManager, action);

        this.stateChangeLog.push({
          action,
          timestamp: new Date(),
          state: stateManager.getState()
        });

        // Limit state change log entries
        if (this.stateChangeLog.length > 100) {
          this.stateChangeLog.shift();
        }

        return result;
      };
    }
  }

  private cleanupStateChangeTracking(): void {
    // Restore original dispatch method
    const stateManager = OneDot.getStateManager();
    if (stateManager) {
      stateManager.dispatch = this.originalConsole.dispatch;
    }
  }

  private setupComponentUpdateTracking(): void {
    // This would require integration with the component system
    // For now, we'll track component updates through a custom event
    window.addEventListener('onedot-component-updated', (event: any) => {
      this.componentUpdateLog.push({
        component: event.detail.component,
        timestamp: new Date(),
        duration: event.detail.duration
      });

      // Limit component update log entries
      if (this.componentUpdateLog.length > 100) {
        this.componentUpdateLog.shift();
      }
    });
  }

  private cleanupComponentUpdateTracking(): void {
    // Component update listeners are automatically removed when the debugger is destroyed
  }

  private setupRouterChangeTracking(): void {
    const router = OneDot.getRouter();
    if (router) {
      const originalPush = router.push;
      const originalReplace = router.replace;

      router.push = (location: any) => {
        const result = originalPush.call(router, location);

        this.routerChangeLog.push({
          type: 'push',
          location,
          timestamp: new Date(),
          route: router.current
        });

        // Limit router change log entries
        if (this.routerChangeLog.length > 100) {
          this.routerChangeLog.shift();
        }

        return result;
      };

      router.replace = (location: any) => {
        const result = originalReplace.call(router, location);

        this.routerChangeLog.push({
          type: 'replace',
          location,
          timestamp: new Date(),
          route: router.current
        });

        // Limit router change log entries
        if (this.routerChangeLog.length > 100) {
          this.routerChangeLog.shift();
        }

        return result;
      };
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

  private setupNetworkRequestTracking(): void {
    // Override fetch to track network requests
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = performance.now();
      let response: Response;

      try {
        response = await originalFetch(input, init);
        const endTime = performance.now();

        this.networkRequestLog.push({
          url: typeof input === 'string' ? input : input.url,
          method: init?.method || 'GET',
          status: response.status,
          duration: endTime - startTime,
          timestamp: new Date(),
          success: response.ok
        });

        // Limit network request log entries
        if (this.networkRequestLog.length > 100) {
          this.networkRequestLog.shift();
        }

        return response;
      } catch (error) {
        const endTime = performance.now();

        this.networkRequestLog.push({
          url: typeof input === 'string' ? input : input.url,
          method: init?.method || 'GET',
          status: 0,
          duration: endTime - startTime,
          timestamp: new Date(),
          success: false,
          error
        });

        // Limit network request log entries
        if (this.networkRequestLog.length > 100) {
          this.networkRequestLog.shift();
        }

        throw error;
      }
    };

    // Override XMLHttpRequest to track network requests
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL) {
      this._url = url.toString();
      this._method = method;
      return originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(data) {
      const xhr = this;
      const startTime = performance.now();

      const onLoad = function() {
        const endTime = performance.now();

        // This would need to be added to the network request log
        // but we don't have access to the debugger instance here
        // This is a limitation of this approach
      };

      const onError = function() {
        const endTime = performance.now();

        // Same issue as above
      };

      xhr.addEventListener('load', onLoad);
      xhr.addEventListener('error', onError);

      return originalXHRSend.apply(this, arguments);
    };
  }

  private cleanupNetworkRequestTracking(): void {
    // Restore original fetch and XMLHttpRequest methods
    window.fetch = this.originalConsole.fetch;
    XMLHttpRequest.prototype.open = this.originalConsole.xhrOpen;
    XMLHttpRequest.prototype.send = this.originalConsole.xhrSend;
  }

  private setupUserActionTracking(): void {
    // Track click events
    document.addEventListener('click', (event) => {
      this.userActionLog.push({
        type: 'click',
        target: event.target,
        timestamp: new Date()
      });

      // Limit user action log entries
      if (this.userActionLog.length > 100) {
        this.userActionLog.shift();
      }
    });

    // Track key events
    document.addEventListener('keydown', (event) => {
      this.userActionLog.push({
        type: 'keydown',
        key: event.key,
        target: event.target,
        timestamp: new Date()
      });

      // Limit user action log entries
      if (this.userActionLog.length > 100) {
        this.userActionLog.shift();
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      this.userActionLog.push({
        type: 'submit',
        target: event.target,
        timestamp: new Date()
      });

      // Limit user action log entries
      if (this.userActionLog.length > 100) {
        this.userActionLog.shift();
      }
    });
  }

  private cleanupUserActionTracking(): void {
    // User action listeners are automatically removed when the debugger is destroyed
  }

  private setupRemoteDebugging(): void {
    if (typeof WebSocket !== 'undefined') {
      this.socket = new WebSocket(this.options.remoteDebuggingUrl || 'ws://localhost:8080');

      this.socket.onopen = () => {
        this.addLogEntry('info', ['Remote debugging connected']);
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'command':
              this.executeRemoteCommand(message.command);
              break;
            case 'request':
              this.handleRemoteRequest(message.request);
              break;
            default:
              this.addLogEntry('warn', ['Unknown remote message type:', message.type]);
          }
        } catch (error) {
          this.addLogEntry('error', ['Error parsing remote message:', error]);
        }
      };

      this.socket.onclose = () => {
        this.addLogEntry('info', ['Remote debugging disconnected']);
      };

      this.socket.onerror = (error) => {
        this.addLogEntry('error', ['Remote debugging error:', error]);
      };
    }
  }

  private cleanupRemoteDebugging(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private executeRemoteCommand(command: any): void {
    switch (command.name) {
      case 'clearLogs':
        this.logEntries = [];
        break;
      case 'getLogs':
        this.socket?.send(JSON.stringify({
          type: 'response',
          data: this.logEntries
        }));
        break;
      case 'getPerformanceMetrics':
        this.socket?.send(JSON.stringify({
          type: 'response',
          data: this.performanceMetrics
        }));
        break;
      case 'getStateChanges':
        this.socket?.send(JSON.stringify({
          type: 'response',
          data: this.stateChangeLog
        }));
        break;
      case 'getComponentUpdates':
        this.socket?.send(JSON.stringify({
          type: 'response',
          data: this.componentUpdateLog
        }));
        break;
      case 'getRouterChanges':
        this.socket?.send(JSON.stringify({
          type: 'response',
          data: this.routerChangeLog
        }));
        break;
      case 'getNetworkRequests':
        this.socket?.send(JSON.stringify({
          type: 'response',
          data: this.networkRequestLog
        }));
        break;
      case 'getUserActions':
        this.socket?.send(JSON.stringify({
          type: 'response',
          data: this.userActionLog
        }));
        break;
      case 'evaluate':
        try {
          const result = eval(command.expression);
          this.socket?.send(JSON.stringify({
            type: 'response',
            data: result
          }));
        } catch (error) {
          this.socket?.send(JSON.stringify({
            type: 'response',
            data: { error: error.message }
          }));
        }
        break;
      default:
        this.addLogEntry('warn', ['Unknown remote command:', command.name]);
    }
  }

  private handleRemoteRequest(request: any): void {
    switch (request.name) {
      case 'getState':
        const stateManager = OneDot.getStateManager();
        const state = stateManager ? stateManager.getState() : null;
        this.socket?.send(JSON.stringify({
          type: 'response',
          data: state
        }));
        break;
      case 'getRoute':
        const router = OneDot.getRouter();
        const route = router ? router.current : null;
        this.socket?.send(JSON.stringify({
          type: 'response',
          data: route
        }));
        break;
      default:
        this.addLogEntry('warn', ['Unknown remote request:', request.name]);
    }
  }

  private notifyErrorListeners(args: any[]): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(args);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }

  private notifyWarningListeners(args: any[]): void {
    this.warningListeners.forEach(listener => {
      try {
        listener(args);
      } catch (error) {
        console.error('Error in warning listener:', error);
      }
    });
  }

  private notifyInfoListeners(args: any[]): void {
    this.infoListeners.forEach(listener => {
      try {
        listener(args);
      } catch (error) {
        console.error('Error in info listener:', error);
      }
    });
  }

  public onError(listener: Function): () => void {
    this.errorListeners.push(listener);

    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index !== -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  public onWarning(listener: Function): () => void {
    this.warningListeners.push(listener);

    return () => {
      const index = this.warningListeners.indexOf(listener);
      if (index !== -1) {
        this.warningListeners.splice(index, 1);
      }
    };
  }

  public onInfo(listener: Function): () => void {
    this.infoListeners.push(listener);

    return () => {
      const index = this.infoListeners.indexOf(listener);
      if (index !== -1) {
        this.infoListeners.splice(index, 1);
      }
    };
  }

  public getLogs(): any[] {
    return [...this.logEntries];
  }

  public getPerformanceMetrics(): any {
    return { ...this.performanceMetrics };
  }

  public getStateChanges(): any[] {
    return [...this.stateChangeLog];
  }

  public getComponentUpdates(): any[] {
    return [...this.componentUpdateLog];
  }

  public getRouterChanges(): any[] {
    return [...this.routerChangeLog];
  }

  public getNetworkRequests(): any[] {
    return [...this.networkRequestLog];
  }

  public getUserActions(): any[] {
    return [...this.userActionLog];
  }

  public clearLogs(): void {
    this.logEntries = [];
  }

  public clearPerformanceMetrics(): void {
    this.performanceMetrics = {};
  }

  public clearStateChanges(): void {
    this.stateChangeLog = [];
  }

  public clearComponentUpdates(): void {
    this.componentUpdateLog = [];
  }

  public clearRouterChanges(): void {
    this.routerChangeLog = [];
  }

  public clearNetworkRequests(): void {
    this.networkRequestLog = [];
  }

  public clearUserActions(): void {
    this.userActionLog = [];
  }

  public clearAll(): void {
    this.clearLogs();
    this.clearPerformanceMetrics();
    this.clearStateChanges();
    this.clearComponentUpdates();
    this.clearRouterChanges();
    this.clearNetworkRequests();
    this.clearUserActions();
  }

  public exportLogs(): string {
    return JSON.stringify({
      logs: this.logEntries,
      performanceMetrics: this.performanceMetrics,
      stateChanges: this.stateChangeLog,
      componentUpdates: this.componentUpdateLog,
      routerChanges: this.routerChangeLog,
      networkRequests: this.networkRequestLog,
      userActions: this.userActionLog,
      timestamp: new Date()
    }, null, 2);
  }

  public importLogs(logsJson: string): void {
    try {
      const logs = JSON.parse(logsJson);

      if (logs.logs) {
        this.logEntries = logs.logs;
      }

      if (logs.performanceMetrics) {
        this.performanceMetrics = logs.performanceMetrics;
      }

      if (logs.stateChanges) {
        this.stateChangeLog = logs.stateChanges;
      }

      if (logs.componentUpdates) {
        this.componentUpdateLog = logs.componentUpdates;
      }

      if (logs.routerChanges) {
        this.routerChangeLog = logs.routerChanges;
      }

      if (logs.networkRequests) {
        this.networkRequestLog = logs.networkRequests;
      }

      if (logs.userActions) {
        this.userActionLog = logs.userActions;
      }
    } catch (error) {
      this.addLogEntry('error', ['Error importing logs:', error]);
    }
  }
}
