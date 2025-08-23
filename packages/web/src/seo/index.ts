/**
 * SEO (Search Engine Optimization) implementation
 */

import { EventEmitter } from 'events';

import {
  SEOConfig,
  SEOContext,
  WebPage
} from '../types';
import { WebUtils } from '../utils';

/**
 * SEOManager - Handles SEO functionality
 */
export class SEOManager extends EventEmitter {
  private config: SEOConfig;
  private context: SEOContext;
  private enabled: boolean = true;

  constructor(config: SEOConfig = {}) {
    super();
    this.config = {
      enabled: true,
      title: '',
      description: '',
      keywords: '',
      image: '',
      url: '',
      siteName: '',
      twitter: {
        card: 'summary',
        site: '',
        creator: ''
      },
      og: {
        type: 'website',
        title: '',
        description: '',
        image: '',
        url: '',
        site_name: ''
      },
      ...config
    };

    this.context = {
      enabled: this.config.enabled !== false,
      title: this.config.title || '',
      description: this.config.description || '',
      keywords: this.config.keywords || '',
      image: this.config.image || '',
      url: this.config.url || '',
      siteName: this.config.siteName || '',
      twitter: {
        card: this.config.twitter?.card || 'summary',
        site: this.config.twitter?.site || '',
        creator: this.config.twitter?.creator || ''
      },
      og: {
        type: this.config.og?.type || 'website',
        title: this.config.og?.title || '',
        description: this.config.og?.description || '',
        image: this.config.og?.image || '',
        url: this.config.og?.url || '',
        site_name: this.config.og?.site_name || ''
      }
    };

    this.initialize();
  }

  /**
   * Initialize the SEO manager
   */
  private initialize(): void {
    if (!this.context.enabled) {
      return;
    }

    // Set up initial SEO tags if in a browser environment
    if (typeof document !== 'undefined') {
      this.updateSEOTags();
    }

    this.emit('initialized');
  }

  /**
   * Enable or disable the SEO manager
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Check if the SEO manager is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the SEO configuration
   */
  public getConfig(): SEOConfig {
    return { ...this.config };
  }

  /**
   * Update the SEO configuration
   */
  public updateConfig(config: Partial<SEOConfig>): void {
    this.config = { ...this.config, ...config };
    this.context = { ...this.context, ...config };
    this.emit('configUpdated', this.config);
  }

  /**
   * Get the SEO context
   */
  public getContext(): SEOContext {
    return { ...this.context };
  }

  /**
   * Optimize SEO for a page
   */
  public async optimize(page: WebPage, options: {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
  } = {}): Promise<void> {
    if (!this.enabled || !this.context.enabled) {
      return;
    }

    // Update the context with page-specific values
    this.context.title = options.title || page.title || this.config.title || '';
    this.context.description = options.description || page.description || this.config.description || '';
    this.context.keywords = options.keywords || page.keywords || this.config.keywords || '';
    this.context.image = options.image || page.image || this.config.image || '';
    this.context.url = options.url || WebUtils.formatUrl(page.path, this.config.baseUrl);

    // Update Open Graph tags
    this.context.og.title = options.title || page.title || this.config.og?.title || this.context.title;
    this.context.og.description = options.description || page.description || this.config.og?.description || this.context.description;
    this.context.og.image = options.image || page.image || this.config.og?.image || this.context.image;
    this.context.og.url = options.url || WebUtils.formatUrl(page.path, this.config.baseUrl);
    this.context.og.site_name = this.config.og?.site_name || this.config.siteName || '';

    // Update Twitter Card tags
    this.context.twitter.card = this.config.twitter?.card || 'summary';
    this.context.twitter.site = this.config.twitter?.site || '';
    this.context.twitter.creator = this.config.twitter?.creator || '';

    // Update SEO tags if in a browser environment
    if (typeof document !== 'undefined') {
      this.updateSEOTags();
    }

    // Create structured data
    this.createStructuredData(page);

    // Emit optimization event
    this.emit('optimized', {
      page,
      options,
      context: this.context
    });
  }

  /**
   * Update SEO tags in the document
   */
  private updateSEOTags(): void {
    if (typeof document === 'undefined') {
      return;
    }

    // Update title
    if (this.context.title) {
      document.title = this.context.title;
    }

    // Update meta tags
    this.updateMetaTag('description', this.context.description);
    this.updateMetaTag('keywords', this.context.keywords);

    // Update Open Graph tags
    this.updateMetaTag('og:title', this.context.og.title, 'property');
    this.updateMetaTag('og:description', this.context.og.description, 'property');
    this.updateMetaTag('og:image', this.context.og.image, 'property');
    this.updateMetaTag('og:url', this.context.og.url, 'property');
    this.updateMetaTag('og:site_name', this.context.og.site_name, 'property');
    this.updateMetaTag('og:type', this.context.og.type, 'property');

    // Update Twitter Card tags
    this.updateMetaTag('twitter:card', this.context.twitter.card, 'name');
    this.updateMetaTag('twitter:site', this.context.twitter.site, 'name');
    this.updateMetaTag('twitter:creator', this.context.twitter.creator, 'name');
    this.updateMetaTag('twitter:title', this.context.title, 'name');
    this.updateMetaTag('twitter:description', this.context.description, 'name');
    this.updateMetaTag('twitter:image', this.context.image, 'name');

    // Update canonical URL
    this.updateLinkTag('canonical', this.context.url);
  }

  /**
   * Update a meta tag
   */
  private updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name'): void {
    if (typeof document === 'undefined' || !content) {
      return;
    }

    // Find existing meta tag
    let metaTag = document.querySelector(`meta[${attribute}="${name}"]`);

    // Create new meta tag if it doesn't exist
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute(attribute, name);
      document.head.appendChild(metaTag);
    }

    // Update content
    metaTag.setAttribute('content', content);
  }

  /**
   * Update a link tag
   */
  private updateLinkTag(rel: string, href: string): void {
    if (typeof document === 'undefined' || !href) {
      return;
    }

    // Find existing link tag
    let linkTag = document.querySelector(`link[rel="${rel}"]`);

    // Create new link tag if it doesn't exist
    if (!linkTag) {
      linkTag = document.createElement('link');
      linkTag.setAttribute('rel', rel);
      document.head.appendChild(linkTag);
    }

    // Update href
    linkTag.setAttribute('href', href);
  }

  /**
   * Create structured data
   */
  private createStructuredData(page: WebPage): void {
    if (typeof document === 'undefined') {
      return;
    }

    // Create JSON-LD structured data
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: this.context.title,
      description: this.context.description,
      url: this.context.url,
      image: this.context.image,
      keywords: this.context.keywords,
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      publisher: {
        '@type': 'Organization',
        name: this.context.siteName,
        logo: {
          '@type': 'ImageObject',
          url: this.context.image
        }
      }
    };

    // Find existing structured data script
    let scriptTag = document.getElementById('structured-data');

    // Create new script tag if it doesn't exist
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'structured-data';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    // Update content
    scriptTag.textContent = JSON.stringify(structuredData, null, 2);
  }

  /**
   * Generate a sitemap
   */
  public generateSitemap(pages: WebPage[]): string {
    const urls = pages.map(page => {
      return `
        <url>
          <loc>${WebUtils.formatUrl(page.path, this.config.baseUrl)}</loc>
          <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  }

  /**
   * Generate a robots.txt file
   */
  public generateRobotsTxt(options: {
    disallow?: string[];
    allow?: string[];
    sitemap?: string;
  } = {}): string {
    const disallow = options.disallow || [];
    const allow = options.allow || [];
    const sitemap = options.sitemap || WebUtils.formatUrl('/sitemap.xml', this.config.baseUrl);

    let content = 'User-agent: *\n';

    // Add disallow rules
    disallow.forEach(path => {
      content += `Disallow: ${path}\n`;
    });

    // Add allow rules
    allow.forEach(path => {
      content += `Allow: ${path}\n`;
    });

    // Add sitemap
    content += `\nSitemap: ${sitemap}\n`;

    return content;
  }
}
