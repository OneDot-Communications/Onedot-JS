/**
 * Static Site Generation (SSG) implementation
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

import {
  SSGConfig,
  SSGContext,
  WebPage
} from '../types';
import { WebUtils } from '../utils';

/**
 * SSGRenderer - Handles static site generation
 */
export class SSGRenderer extends EventEmitter {
  private config: SSGConfig;
  private context: SSGContext;
  private enabled: boolean = true;

  constructor(config: SSGConfig = {}) {
    super();
    this.config = {
      baseUrl: '/',
      publicPath: '/',
      outputDir: 'dist',
      assetsDir: 'assets',
      trailingSlash: false,
      ...config
    };

    this.context = {
      baseUrl: this.config.baseUrl || '/',
      publicPath: this.config.publicPath || '/',
      outputDir: this.config.outputDir || 'dist',
      assetsDir: this.config.assetsDir || 'assets',
      trailingSlash: this.config.trailingSlash !== false
    };

    this.initialize();
  }

  /**
   * Initialize the SSG renderer
   */
  private initialize(): void {
    // Ensure output directory exists
    if (!fs.existsSync(this.context.outputDir)) {
      fs.mkdirSync(this.context.outputDir, { recursive: true });
    }

    this.emit('initialized');
  }

  /**
   * Enable or disable the SSG renderer
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Check if the SSG renderer is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the SSG configuration
   */
  public getConfig(): SSGConfig {
    return { ...this.config };
  }

  /**
   * Update the SSG configuration
   */
  public updateConfig(config: Partial<SSGConfig>): void {
    this.config = { ...this.config, ...config };
    this.context = { ...this.context, ...config };
    this.emit('configUpdated', this.config);
  }

  /**
   * Get the SSG context
   */
  public getContext(): SSGContext {
    return { ...this.context };
  }

  /**
   * Generate a static page
   */
  public async generate(page: WebPage): Promise<void> {
    if (!this.enabled) {
      throw new Error('SSG renderer is disabled');
    }

    try {
      // Render the page
      const html = await this.renderPage(page);

      // Determine the output path
      let outputPath = path.join(this.context.outputDir, page.path);

      // Add trailing slash if needed
      if (this.context.trailingSlash && !outputPath.endsWith(path.sep)) {
        outputPath += path.sep;
      }

      // Add index.html if the path is a directory
      if (outputPath.endsWith(path.sep) || !path.extname(outputPath)) {
        outputPath = path.join(outputPath, 'index.html');
      }

      // Ensure the directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write the HTML file
      fs.writeFileSync(outputPath, html);

      // Emit generation event
      this.emit('generated', {
        page,
        outputPath,
        html
      });
    } catch (error) {
      console.error(`Error generating page ${page.path}:`, error);
      this.emit('error', {
        page,
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  /**
   * Generate all static pages
   */
  public async generateAll(pages: WebPage[]): Promise<void> {
    if (!this.enabled) {
      throw new Error('SSG renderer is disabled');
    }

    // Generate each page
    for (const page of pages) {
      await this.generate(page);
    }

    // Emit completion event
    this.emit('completed', { pages });
  }

  /**
   * Render a page to HTML
   */
  private async renderPage(page: WebPage): Promise<string> {
    // This is a simplified implementation
    // In a real implementation, we would use a proper renderer

    // Render the component
    const element = page.component();

    // Convert the element to HTML
    const content = this.elementToHTML(element);

    // Create the HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title || 'ONEDOT-JS App'}</title>
  <meta name="description" content="${page.description || ''}">
  <meta name="keywords" content="${page.keywords || ''}">
  <meta property="og:title" content="${page.title || ''}">
  <meta property="og:description" content="${page.description || ''}">
  <meta property="og:image" content="${page.image || ''}">
  <meta property="og:url" content="${WebUtils.formatUrl(page.path, this.config.baseUrl)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${page.title || ''}">
  <meta name="twitter:description" content="${page.description || ''}">
  <meta name="twitter:image" content="${page.image || ''}">
  <link rel="canonical" href="${WebUtils.formatUrl(page.path, this.config.baseUrl)}">
  <link rel="stylesheet" href="${this.context.publicPath}assets/main.css">
</head>
<body>
  <div id="root">${content}</div>
  <script src="${this.context.publicPath}assets/main.js"></script>
</body>
</html>`;

    return html;
  }

  /**
   * Convert an element to HTML
   */
  private elementToHTML(element: any): string {
    if (typeof element === 'string') {
      return element;
    }

    if (!element || !element.type) {
      return '';
    }

    const tagName = element.type;
    const props = element.props || {};
    const children = element.children || [];

    // Build attributes
    let attributes = '';
    for (const [key, value] of Object.entries(props)) {
      if (key === 'children' || key === 'key') {
        continue;
      }

      if (key === 'className') {
        attributes += ` class="${value}"`;
      } else if (key === 'style' && typeof value === 'object') {
        const styles = Object.entries(value)
          .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
          .join(';');
        attributes += ` style="${styles}"`;
      } else if (typeof value === 'string' || typeof value === 'number') {
        attributes += ` ${key}="${value}"`;
      } else if (typeof value === 'boolean') {
        if (value) {
          attributes += ` ${key}`;
        }
      }
    }

    // Build children HTML
    let childrenHTML = '';
    if (children.length > 0) {
      childrenHTML = children.map(child => this.elementToHTML(child)).join('');
    }

    // Build the element HTML
    if (this.isVoidElement(tagName)) {
      return `<${tagName}${attributes}>`;
    } else {
      return `<${tagName}${attributes}>${childrenHTML}</${tagName}>`;
    }
  }

  /**
   * Check if an element is a void element
   */
  private isVoidElement(tagName: string): boolean {
    const voidElements = [
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
      'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
    ];

    return voidElements.includes(tagName);
  }

  /**
   * Copy assets to the output directory
   */
  public copyAssets(assetsDir: string = './public'): void {
    if (!this.enabled) {
      return;
    }

    if (!fs.existsSync(assetsDir)) {
      console.warn(`Assets directory '${assetsDir}' does not exist`);
      return;
    }

    const outputAssetsDir = path.join(this.context.outputDir, this.context.assetsDir);

    // Ensure the output directory exists
    if (!fs.existsSync(outputAssetsDir)) {
      fs.mkdirSync(outputAssetsDir, { recursive: true });
    }

    // Copy all files from the assets directory
    this.copyDirectory(assetsDir, outputAssetsDir);

    this.emit('assetsCopied', {
      assetsDir,
      outputAssetsDir
    });
  }

  /**
   * Copy a directory recursively
   */
  private copyDirectory(src: string, dest: string): void {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}
