/**
 * Client-Side Rendering (CSR) implementation
 */

import { RendererManager } from '@onedot/rendering';
import { EventEmitter } from 'events';

import {
  CSRConfig,
  CSRContext,
  WebComponent
} from '../types';
import { WebUtils } from '../utils';

/**
 * CSRRenderer - Handles client-side rendering
 */
export class CSRRenderer extends EventEmitter {
  private config: CSRConfig;
  private context: CSRContext;
  private rendererManager: RendererManager;
  private rootElement: HTMLElement | null = null;
  private currentComponent: WebComponent | null = null;
  private currentProps: any = null;
  private enabled: boolean = true;

  constructor(config: CSRConfig = {}) {
    super();
    this.config = {
      baseUrl: '/',
      publicPath: '/',
      outputDir: 'dist',
      assetsDir: 'assets',
      hydrate: true,
      ...config
    };

    this.context = {
      baseUrl: this.config.baseUrl || '/',
      publicPath: this.config.publicPath || '/',
      outputDir: this.config.outputDir || 'dist',
      assetsDir: this.config.assetsDir || 'assets',
      hydrate: this.config.hydrate !== false
    };

    this.rendererManager = RendererManager.getInstance();

    this.initialize();
  }

  /**
   * Initialize the CSR renderer
   */
  private initialize(): void {
    // Set up the root element
    if (typeof document !== 'undefined') {
      this.rootElement = document.getElementById('root');

      if (!this.rootElement) {
        this.rootElement = document.createElement('div');
        this.rootElement.id = 'root';
        document.body.appendChild(this.rootElement);
      }
    }

    // Set up history navigation
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePopState.bind(this));
    }

    this.emit('initialized');
  }

  /**
   * Enable or disable the CSR renderer
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Check if the CSR renderer is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the CSR configuration
   */
  public getConfig(): CSRConfig {
    return { ...this.config };
  }

  /**
   * Update the CSR configuration
   */
  public updateConfig(config: Partial<CSRConfig>): void {
    this.config = { ...this.config, ...config };
    this.context = { ...this.context, ...config };
    this.emit('configUpdated', this.config);
  }

  /**
   * Get the CSR context
   */
  public getContext(): CSRContext {
    return { ...this.context };
  }

  /**
   * Get the renderer manager
   */
  public getRendererManager(): RendererManager {
    return this.rendererManager;
  }

  /**
   * Get the root element
   */
  public getRootElement(): HTMLElement | null {
    return this.rootElement;
  }

  /**
   * Set the root element
   */
  public setRootElement(element: HTMLElement): void {
    this.rootElement = element;
    this.emit('rootElementChanged', element);
  }

  /**
   * Render a component
   */
  public async render(component: WebComponent, props: any = {}): Promise<string> {
    if (!this.enabled) {
      throw new Error('CSR renderer is disabled');
    }

    if (!this.rootElement) {
      throw new Error('Root element not found');
    }

    const startTime = performance.now();

    try {
      // Update current component and props
      this.currentComponent = component;
      this.currentProps = props;

      // Render the component
      const element = component(props);

      // Create a render tree
      const tree = this.rendererManager.createRenderTree([element]);

      // Render the tree
      this.rendererManager.render(tree);

      // Calculate duration
      const duration = performance.now() - startTime;

      // Create result
      const result = {
        component,
        props,
        duration,
        element,
        tree
      };

      // Emit event
      this.emit('rendered', result);

      return this.rootElement.innerHTML;
    } catch (error) {
      // Calculate duration
      const duration = performance.now() - startTime;

      // Create result
      const result = {
        component,
        props,
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };

      // Emit event
      this.emit('error', result);

      throw error;
    }
  }

  /**
   * Hydrate the application
   */
  public async hydrate(): Promise<void> {
    if (!this.enabled) {
      throw new Error('CSR renderer is disabled');
    }

    if (!this.context.hydrate) {
      return;
    }

    if (!this.rootElement) {
      throw new Error('Root element not found');
    }

    try {
      // Find the initial component and props
      const script = document.getElementById('__ONEDOT_DATA__');

      if (!script) {
        throw new Error('Initial data not found');
      }

      const data = JSON.parse(script.textContent || '{}');

      // Render the component
      await this.render(data.component, data.props);

      // Remove the script
      script.remove();

      this.emit('hydrated');
    } catch (error) {
      console.error('Error hydrating application:', error);
      this.emit('hydrationError', error);
    }
  }

  /**
   * Navigate to a new path
   */
  public async navigate(path: string, props: any = {}): Promise<void> {
    if (!this.enabled) {
      throw new Error('CSR renderer is disabled');
    }

    // Update the URL
    WebUtils.navigate(path);

    // Emit navigation event
    this.emit('navigate', { path, props });
  }

  /**
   * Handle popstate events
   */
  private handlePopState(event: PopStateEvent): void {
    if (!this.enabled) {
      return;
    }

    // Get the current path
    const path = WebUtils.getCurrentPath();

    // Emit navigation event
    this.emit('navigate', { path, state: event.state });
  }
}
