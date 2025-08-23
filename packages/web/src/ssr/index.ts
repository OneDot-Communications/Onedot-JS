/**
 * Server-Side Rendering (SSR) implementation
 */

import { RendererManager } from '@onedot/rendering';
import { EventEmitter } from 'events';

import {
  SSRConfig,
  SSRContext,
  WebComponent
} from '../types';
import { WebUtils } from '../utils';

/**
 * SSRRenderer - Handles server-side rendering
 */
export class SSRRenderer extends EventEmitter {
  private config: SSRConfig;
  private context: SSRContext;
  private rendererManager: RendererManager;
  private enabled: boolean = true;

  constructor(config: SSRConfig = {}) {
    super();
    this.config = {
      baseUrl: '/',
      publicPath: '/',
      outputDir: 'dist',
      assetsDir: 'assets',
      ...config
    };

    this.context = {
      baseUrl: this.config.baseUrl || '/',
      publicPath: this.config.publicPath || '/',
      outputDir: this.config.outputDir || 'dist',
      assetsDir: this.config.assetsDir || 'assets'
    };

    this.rendererManager = RendererManager.getInstance();

    this.initialize();
  }

  /**
   * Initialize the SSR renderer
   */
  private initialize(): void {
    // Set up the renderer for server-side rendering
    this.rendererManager.updateConfig({
      backend: 'bridge'
    });

    this.emit('initialized');
  }

  /**
   * Enable or disable the SSR renderer
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Check if the SSR renderer is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the SSR configuration
   */
  public getConfig(): SSRConfig {
    return { ...this.config };
  }

  /**
   * Update the SSR configuration
   */
  public updateConfig(config: Partial<SSRConfig>): void {
    this.config = { ...this.config, ...config };
    this.context = { ...this.context, ...config };
    this.emit('configUpdated', this.config);
  }

  /**
   * Get the SSR context
   */
  public getContext(): SSRContext {
    return { ...this.context };
  }

  /**
   * Get the renderer manager
   */
  public getRendererManager(): RendererManager {
    return this.rendererManager;
  }

  /**
   * Render a component to HTML
   */
  public async render(component: WebComponent, props: any = {}, options: {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
  } = {}): Promise<string> {
    if (!this.enabled) {
      throw new Error('SSR renderer is disabled');
    }

    const startTime = performance.now();

    try {
      // Render the component
      const element = component(props);

      // Create a render tree
      const tree = this.rendererManager.createRenderTree([element]);

      // Render the tree to HTML
      const content = this.renderTree(tree);

      // Create the HTML document
      const html = this.createHTMLDocument(content, {
        title: options.title || 'ONEDOT-JS App',
        description: options.description || '',
        keywords: options.keywords || '',
        image: options.image || '',
        url: options.url || '/'
      });

      // Calculate duration
      const duration = performance.now() - startTime;

      // Create result
      const result = {
        component,
        props,
        duration,
        html,
        tree
      };

      // Emit event
      this.emit('rendered', result);

      return html;
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
   * Render a render tree to HTML
   */
  private renderTree(tree: any): string {
    // This is a simplified implementation
    // In a real implementation, we would use a proper renderer

    // Execute render commands
    let html = '';

    for (const command of tree.commands) {
      switch (command.type) {
        case 'clear':
          // Ignore clear command for HTML generation
          break;

        case 'drawRect':
          // Convert to div
          html += `<div style="position: absolute; left: ${command.x}px; top: ${command.y}px; width: ${command.width}px; height: ${command.height}px; background-color: ${this.colorToCSS(command.color)};"></div>`;
          break;

        case 'drawText':
          // Convert to div with text
          html += `<div style="position: absolute; left: ${command.x}px; top: ${command.y}px; color: ${this.colorToCSS(command.color)}; font-size: ${command.fontSize}px;">${command.text}</div>`;
          break;

        case 'drawImage':
          // Convert to img
          html += `<img src="${command.src}" style="position: absolute; left: ${command.x}px; top: ${command.y}px; width: ${command.width}px; height: ${command.height}px;" alt="">`;
          break;

        default:
          console.warn(`Unknown command type: ${command.type}`);
      }
    }

    return html;
  }

  /**
   * Convert a color array to CSS color string
   */
  private colorToCSS(color: number[]): string {
    if (color.length >= 3) {
      const r = Math.floor(color[0] * 255);
      const g = Math.floor(color[1] * 255);
      const b = Math.floor(color[2] * 255);
      const a = color.length > 3 ? color[3] : 1;

      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    return '#000000';
  }

  /**
   * Create an HTML document
   */
  private createHTMLDocument(content: string, options: {
    title: string;
    description: string;
    keywords: string;
    image: string;
    url: string;
  }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <meta name="description" content="${options.description}">
  <meta name="keywords" content="${options.keywords}">
  <meta property="og:title" content="${options.title}">
  <meta property="og:description" content="${options.description}">
  <meta property="og:image" content="${options.image}">
  <meta property="og:url" content="${WebUtils.formatUrl(options.url, this.config.baseUrl)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${options.title}">
  <meta name="twitter:description" content="${options.description}">
  <meta name="twitter:image" content="${options.image}">
  <link rel="canonical" href="${WebUtils.formatUrl(options.url, this.config.baseUrl)}">
  <link rel="stylesheet" href="${this.context.publicPath}${this.context.assetsDir}/main.css">
</head>
<body>
  <div id="root">${content}</div>
  <script src="${this.context.publicPath}${this.context.assetsDir}/main.js"></script>
</body>
</html>`;
  }

  /**
   * Create a server request handler
   */
  public createRequestHandler(): (req: any, res: any) => void {
    return async (req: any, res: any) => {
      try {
        // Get the path from the request
        const path = req.path || '/';

        // Render the page
        const html = await this.render(() => {
          return {
            type: 'div',
            children: `Server-side rendered content for ${path}`
          };
        }, {}, {
          url: path
        });

        // Send the response
        res.send(html);
      } catch (error) {
        console.error('Error rendering page:', error);

        // Send error response
        res.status(500).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Internal Server Error</title>
          </head>
          <body>
            <h1>Internal Server Error</h1>
            <p>Sorry, something went wrong.</p>
          </body>
          </html>
        `);
      }
    };
  }

  /**
   * Create an Express middleware
   */
  public createExpressMiddleware(): (req: any, res: any, next: any) => void {
    return async (req: any, res: any, next: any) => {
      try {
        // Get the path from the request
        const path = req.path || '/';

        // Render the page
        const html = await this.render(() => {
          return {
            type: 'div',
            children: `Server-side rendered content for ${path}`
          };
        }, {}, {
          url: path
        });

        // Send the response
        res.send(html);
      } catch (error) {
        console.error('Error rendering page:', error);
        next(error);
      }
    };
  }
}
