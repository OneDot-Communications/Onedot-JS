// Advanced streaming SSR with partial hydration scheduler
import { VNode } from '../../core/src/component.js';

export interface StreamChunk {
  id: number;
  html: string;
  flush: boolean;
  priority: 'high' | 'normal' | 'low';
  dependencies?: string[];
}

export interface HydrationIsland {
  id: string;
  selector: string;
  component: string;
  props: any;
  priority: number;
  dependencies: string[];
  state: 'pending' | 'loading' | 'hydrated' | 'error';
}

export interface StreamingOptions {
  onChunk: (chunk: StreamChunk) => void;
  onError?: (error: Error) => void;
  onEnd?: () => void;
  enableSuspense: boolean;
  maxConcurrency: number;
  priorityThreshold: number;
  chunkSize: number;
}

export interface HydrationScheduler {
  schedule(island: HydrationIsland): void;
  prioritize(islandId: string, priority: number): void;
  hydrate(islandId: string): Promise<void>;
  getStatus(): HydrationStatus;
}

export interface HydrationStatus {
  total: number;
  pending: number;
  loading: number;
  hydrated: number;
  errors: number;
}

export class AdvancedStreamRenderer {
  private chunkId = 0;
  private islands: Map<string, HydrationIsland> = new Map();
  private scheduler: HydrationSchedulerImpl;
  private suspenseBoundaries: Map<string, SuspenseBoundary> = new Map();

  constructor(private options: StreamingOptions) {
    this.scheduler = new HydrationSchedulerImpl(options.maxConcurrency);
  }

  async renderToStream(vnode: VNode): Promise<void> {
    try {
      await this.renderNode(vnode, { priority: 'high', parentSuspense: null });
      this.options.onEnd?.();
    } catch (error) {
      this.options.onError?.(error as Error);
    }
  }

  private async renderNode(node: any, context: RenderContext): Promise<void> {
    if (node == null) return;

    if (typeof node === 'string' || typeof node === 'number') {
      this.emitChunk(String(node), context.priority);
      return;
    }

    if (Array.isArray(node)) {
      for (const child of node) {
        await this.renderNode(child, context);
      }
      return;
    }

    if (typeof node.type === 'function') {
      await this.renderComponent(node, context);
      return;
    }

    if (typeof node.type === 'string') {
      await this.renderElement(node, context);
      return;
    }
  }

  private async renderComponent(node: any, context: RenderContext): Promise<void> {
    const componentName = node.type.name || 'AnonymousComponent';
    
    // Check if component should be hydrated on client
    const shouldHydrate = this.shouldHydrate(node);
    
    if (shouldHydrate) {
      const islandId = this.generateIslandId();
      const island: HydrationIsland = {
        id: islandId,
        selector: `[data-island="${islandId}"]`,
        component: componentName,
        props: node.props || {},
        priority: this.calculatePriority(node),
        dependencies: this.extractDependencies(node),
        state: 'pending'
      };
      
      this.islands.set(islandId, island);
      this.scheduler.schedule(island);
      
      // Emit island wrapper
      this.emitChunk(`<div data-island="${islandId}" data-component="${componentName}">`, context.priority);
    }

    // Check for Suspense boundary
    if (this.isSuspenseComponent(node)) {
      await this.renderSuspense(node, context);
      return;
    }

    try {
      // Render component
      const rendered = await this.executeComponent(node.type, node.props);
      await this.renderNode(rendered, context);
    } catch (error) {
      if (context.parentSuspense) {
        // Delegate to Suspense boundary
        await this.handleSuspenseError(context.parentSuspense, error as Error);
      } else {
        throw error;
      }
    }

    if (shouldHydrate) {
      this.emitChunk('</div>', context.priority);
    }
  }

  private async renderSuspense(node: any, context: RenderContext): Promise<void> {
    const suspenseId = this.generateSuspenseId();
    const boundary: SuspenseBoundary = {
      id: suspenseId,
      fallback: node.props.fallback,
      promises: [],
      resolved: false
    };
    
    this.suspenseBoundaries.set(suspenseId, boundary);
    
    // Emit suspense wrapper
    this.emitChunk(`<div data-suspense="${suspenseId}">`, context.priority);
    
    try {
      const suspenseContext = { ...context, parentSuspense: suspenseId };
      await this.renderNode(node.children, suspenseContext);
      
      // Wait for all promises in this boundary
      if (boundary.promises.length > 0) {
        await Promise.all(boundary.promises);
      }
      
      boundary.resolved = true;
    } catch (error) {
      // Render fallback UI
      this.emitChunk(`</div><div data-suspense-fallback="${suspenseId}">`, context.priority);
      await this.renderNode(boundary.fallback, context);
      this.emitChunk('</div>', context.priority);
      return;
    }
    
    this.emitChunk('</div>', context.priority);
  }

  private async renderElement(node: any, context: RenderContext): Promise<void> {
    const tag = node.type;
    const props = node.props || {};
    
    // Build attributes
    const attrs = Object.entries(props)
      .filter(([key]) => key !== 'children')
      .map(([key, value]) => `${key}="${this.escapeHtml(String(value))}"`)
      .join(' ');
    
    this.emitChunk(`<${tag}${attrs ? ' ' + attrs : ''}>`, context.priority);
    
    if (node.children) {
      await this.renderNode(node.children, context);
    }
    
    this.emitChunk(`</${tag}>`, context.priority);
  }

  private async executeComponent(Component: any, props: any): Promise<any> {
    // Simulate async component execution
    if (Component.async) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(Component(props));
        }, Math.random() * 100); // Simulate variable render time
      });
    }
    
    return Component(props);
  }

  private shouldHydrate(node: any): boolean {
    // Determine if component needs client-side hydration
    const props = node.props || {};
    return !!(props.onClick || props.onSubmit || props.onChange || node.type.interactive);
  }

  private isSuspenseComponent(node: any): boolean {
    return node.type && (node.type.name === 'Suspense' || node.type.displayName === 'Suspense');
  }

  private calculatePriority(node: any): number {
    // Calculate hydration priority based on component type and position
    const props = node.props || {};
    
    if (props['data-priority']) {
      return parseInt(props['data-priority'], 10);
    }
    
    // Above-the-fold components get higher priority
    if (props.className?.includes('above-fold')) return 100;
    if (node.type.name?.includes('Critical')) return 90;
    if (props.onClick) return 80; // Interactive elements
    
    return 50; // Default priority
  }

  private extractDependencies(node: any): string[] {
    // Extract module dependencies for this component
    const dependencies: string[] = [];
    
    if (node.type.dependencies) {
      dependencies.push(...node.type.dependencies);
    }
    
    // Analyze props for dynamic imports or references
    const props = node.props || {};
    Object.values(props).forEach(value => {
      if (typeof value === 'string' && value.startsWith('import:')) {
        dependencies.push(value.slice(7));
      }
    });
    
    return dependencies;
  }

  private async handleSuspenseError(suspenseId: string, error: Error): Promise<void> {
    const boundary = this.suspenseBoundaries.get(suspenseId);
    if (boundary && !boundary.resolved) {
      // Add error handling promise
      boundary.promises.push(Promise.reject(error));
    }
  }

  private emitChunk(html: string, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    const chunk: StreamChunk = {
      id: this.chunkId++,
      html,
      flush: false,
      priority
    };
    
    this.options.onChunk(chunk);
  }

  private generateIslandId(): string {
    return `island_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private generateSuspenseId(): string {
    return `suspense_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

class HydrationSchedulerImpl implements HydrationScheduler {
  private queue: HydrationIsland[] = [];
  private running: Set<string> = new Set();
  private completed: Set<string> = new Set();
  private errors: Map<string, Error> = new Map();

  constructor(private maxConcurrency: number) {}

  schedule(island: HydrationIsland): void {
    this.queue.push(island);
    this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first
    this.processQueue();
  }

  prioritize(islandId: string, priority: number): void {
    const island = this.queue.find(i => i.id === islandId);
    if (island) {
      island.priority = priority;
      this.queue.sort((a, b) => b.priority - a.priority);
    }
  }

  async hydrate(islandId: string): Promise<void> {
    const island = this.queue.find(i => i.id === islandId);
    if (!island) throw new Error(`Island ${islandId} not found`);

    try {
      island.state = 'loading';
      this.running.add(islandId);

      // Wait for dependencies
      await this.waitForDependencies(island.dependencies);

      // Perform hydration
      await this.performHydration(island);

      island.state = 'hydrated';
      this.completed.add(islandId);
    } catch (error) {
      island.state = 'error';
      this.errors.set(islandId, error as Error);
    } finally {
      this.running.delete(islandId);
      this.processQueue();
    }
  }

  getStatus(): HydrationStatus {
    const total = this.queue.length;
    const pending = this.queue.filter(i => i.state === 'pending').length;
    const loading = this.running.size;
    const hydrated = this.completed.size;
    const errors = this.errors.size;

    return { total, pending, loading, hydrated, errors };
  }

  private async processQueue(): Promise<void> {
    while (this.running.size < this.maxConcurrency && this.queue.length > 0) {
      const island = this.queue.find(i => i.state === 'pending');
      if (!island) break;

      this.hydrate(island.id).catch(() => {
        // Error handling is done in hydrate method
      });
    }
  }

  private async waitForDependencies(dependencies: string[]): Promise<void> {
    const promises = dependencies.map(dep => this.loadDependency(dep));
    await Promise.all(promises);
  }

  private async loadDependency(dependency: string): Promise<void> {
    // Mock dependency loading
    return new Promise(resolve => {
      setTimeout(resolve, Math.random() * 100);
    });
  }

  private async performHydration(island: HydrationIsland): Promise<void> {
    // Mock hydration process
    return new Promise(resolve => {
      setTimeout(resolve, Math.random() * 200);
    });
  }
}

interface RenderContext {
  priority: 'high' | 'normal' | 'low';
  parentSuspense: string | null;
}

interface SuspenseBoundary {
  id: string;
  fallback: any;
  promises: Promise<any>[];
  resolved: boolean;
}

// Event replay system for hydration
export class EventReplaySystem {
  private events: Array<{ type: string; target: string; data: any; timestamp: number; }> = [];
  private isReplaying = false;

  startRecording(): void {
    if (typeof window === 'undefined') return;

    const eventTypes = ['click', 'input', 'change', 'submit', 'focus', 'blur'];
    
    eventTypes.forEach(type => {
      document.addEventListener(type, this.recordEvent.bind(this), {
        capture: true,
        passive: true
      });
    });
  }

  async replay(): Promise<void> {
    if (this.isReplaying) return;
    this.isReplaying = true;

    try {
      for (const event of this.events) {
        await this.replayEvent(event);
        // Small delay between events to maintain timing
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } finally {
      this.isReplaying = false;
      this.events = []; // Clear replayed events
    }
  }

  private recordEvent(event: Event): void {
    if (this.isReplaying) return;

    const target = event.target as Element;
    const selector = this.generateSelector(target);
    
    this.events.push({
      type: event.type,
      target: selector,
      data: this.extractEventData(event),
      timestamp: Date.now()
    });
  }

  private async replayEvent(eventRecord: { type: string; target: string; data: any; }): Promise<void> {
    const element = document.querySelector(eventRecord.target);
    if (!element) return;

    const event = new Event(eventRecord.type, { bubbles: true });
    Object.assign(event, eventRecord.data);
    
    element.dispatchEvent(event);
  }

  private generateSelector(element: Element): string {
    // Generate a unique selector for the element
    if (element.id) return `#${element.id}`;
    
    const path: string[] = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        selector += `.${current.className.split(' ').join('.')}`;
      }
      
      // Add position if needed for uniqueness
      const siblings = Array.from(current.parentElement?.children || []);
      const index = siblings.indexOf(current);
      if (siblings.filter(s => s.tagName === current.tagName).length > 1) {
        selector += `:nth-of-type(${index + 1})`;
      }
      
      path.unshift(selector);
      current = current.parentElement!;
    }
    
    return path.join(' > ');
  }

  private extractEventData(event: Event): any {
    const data: any = {};
    
    if (event instanceof MouseEvent) {
      data.clientX = event.clientX;
      data.clientY = event.clientY;
      data.button = event.button;
    }
    
    if (event instanceof KeyboardEvent) {
      data.key = event.key;
      data.code = event.code;
      data.ctrlKey = event.ctrlKey;
      data.shiftKey = event.shiftKey;
      data.altKey = event.altKey;
    }
    
    if (event.target instanceof HTMLInputElement) {
      data.value = event.target.value;
      data.checked = event.target.checked;
    }
    
    return data;
  }
}

// Export main streaming renderer
export function createStreamRenderer(options: StreamingOptions): AdvancedStreamRenderer {
  return new AdvancedStreamRenderer(options);
}

export function createEventReplay(): EventReplaySystem {
  return new EventReplaySystem();
}
