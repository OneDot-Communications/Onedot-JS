/**
 * Utility functions for the web package
 */


/**
 * Web utility functions
 */
export const WebUtils = {
  /**
   * Generate a unique ID
   */
  generateId(prefix: string = 'id'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Match a path against a pattern
   */
  matchPath(
    pattern: string,
    pathname: string,
    options: {
      exact?: boolean;
      sensitive?: boolean;
      strict?: boolean;
    } = {}
  ): { path: string; url: string; isExact: boolean; params: Record<string, string> } | null {
    const { exact = false, strict = false, sensitive = false } = options;

    // Parse the pattern into tokens
    const tokens = this.parsePath(pattern);

    // Try to match the pathname against the tokens
    const match = this.matchTokens(tokens, pathname, {
      exact,
      strict,
      sensitive
    });

    return match;
  },

  /**
   * Parse a path pattern into tokens
   */
  parsePath(pattern: string): Array<string | { name: string; repeatable: boolean; optional: boolean }> {
    const tokens: Array<string | { name: string; repeatable: boolean; optional: boolean }> = [];
    const segments = pattern.split('/');

    for (const segment of segments) {
      if (segment === '') continue;

      if (segment.startsWith(':')) {
        const name = segment.substring(1);
        const optional = name.endsWith('?');
        const repeatable = name.endsWith('*');

        tokens.push({
          name: optional ? name.substring(0, name.length - 1) :
                  repeatable ? name.substring(0, name.length - 1) : name,
          optional,
          repeatable
        });
      } else {
        tokens.push(segment);
      }
    }

    return tokens;
  },

  /**
   * Match tokens against a pathname
   */
  matchTokens(
    tokens: Array<string | { name: string; repeatable: boolean; optional: boolean }>,
    pathname: string,
    options: {
      exact: boolean;
      strict: boolean;
      sensitive: boolean;
    }
  ): { path: string; url: string; isExact: boolean; params: Record<string, string> } | null {
    const { exact, strict, sensitive } = options;

    // Normalize the pathname
    const normalizedPathname = sensitive ? pathname : pathname.toLowerCase();

    // Build the regex from the tokens
    let regexStr = '^';
    const params: Record<string, string> = {};
    const paramNames: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (typeof token === 'string') {
        regexStr += this.escapeRegExp(token);
      } else {
        regexStr += token.repeatable ? '(.*)' : '([^/]+)';
        paramNames.push(token.name);
      }

      if (i < tokens.length - 1) {
        regexStr += '/';
      }
    }

    if (!strict) {
      regexStr += '/?';
    }

    if (!exact) {
      regexStr += '(?:\\b|$)';
    }

    regexStr += '$';

    // Create the regex
    const regex = new RegExp(regexStr, sensitive ? '' : 'i');

    // Try to match the pathname
    const match = normalizedPathname.match(regex);

    if (!match) {
      return null;
    }

    // Extract the params
    for (let i = 0; i < paramNames.length; i++) {
      params[paramNames[i]] = match[i + 1];
    }

    // Build the path
    let path = '';
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (typeof token === 'string') {
        path += token;
      } else {
        path += `:${token.name}`;
        if (token.optional) {
          path += '?';
        } else if (token.repeatable) {
          path += '*';
        }
      }

      if (i < tokens.length - 1) {
        path += '/';
      }
    }

    // Build the URL
    let url = '';
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (typeof token === 'string') {
        url += token;
      } else {
        url += params[token.name];
      }

      if (i < tokens.length - 1) {
        url += '/';
      }
    }

    // Check if the match is exact
    const isExact = exact ? url === normalizedPathname : true;

    return {
      path,
      url,
      isExact,
      params
    };
  },

  /**
   * Escape special characters in a string for use in a regex
   */
  escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * Format a URL with the base URL
   */
  formatUrl(path: string, baseUrl: string = '/'): string {
    // Remove leading slash from path if baseUrl ends with slash
    if (baseUrl.endsWith('/') && path.startsWith('/')) {
      path = path.substring(1);
    }

    // Add leading slash to path if baseUrl doesn't end with slash and path doesn't start with slash
    if (!baseUrl.endsWith('/') && !path.startsWith('/')) {
      path = '/' + path;
    }

    return baseUrl + path;
  },

  /**
   * Get the current URL
   */
  getCurrentUrl(): string {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }

    return '/';
  },

  /**
   * Get the current path
   */
  getCurrentPath(): string {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }

    return '/';
  },

  /**
   * Navigate to a URL
   */
  navigate(url: string, options: {
    replace?: boolean;
    state?: any;
  } = {}): void {
    if (typeof window !== 'undefined') {
      if (options.replace) {
        window.history.replaceState(options.state, '', url);
      } else {
        window.history.pushState(options.state, '', url);
      }

      // Dispatch a popstate event to notify of the change
      window.dispatchEvent(new PopStateEvent('popstate', { state: options.state }));
    }
  },

  /**
   * Go back in history
   */
  goBack(): void {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  },

  /**
   * Go forward in history
   */
  goForward(): void {
    if (typeof window !== 'undefined') {
      window.history.forward();
    }
  },

  /**
   * Go to a specific point in history
   */
  go(delta: number): void {
    if (typeof window !== 'undefined') {
      window.history.go(delta);
    }
  },

  /**
   * Create a link element
   */
  createLink(href: string, rel: string, as?: string): HTMLLinkElement {
    const link = document.createElement('link');
    link.href = href;
    link.rel = rel;

    if (as) {
      link.as = as;
    }

    return link;
  },

  /**
   * Preload a resource
   */
  preload(href: string, as: string): void {
    const link = this.createLink(href, 'preload', as);
    document.head.appendChild(link);
  },

  /**
   * Prefetch a resource
   */
  prefetch(href: string): void {
    const link = this.createLink(href, 'prefetch');
    document.head.appendChild(link);
  },

  /**
   * Preconnect to a domain
   */
  preconnect(href: string): void {
    const link = this.createLink(href, 'preconnect');
    document.head.appendChild(link);
  },

  /**
   * DNS-prefetch a domain
   */
  dnsPrefetch(href: string): void {
    const link = this.createLink(href, 'dns-prefetch');
    document.head.appendChild(link);
  },

  /**
   * Create a script element
   */
  createScript(src: string, options: {
    async?: boolean;
    defer?: boolean;
    crossOrigin?: string;
    integrity?: string;
  } = {}): HTMLScriptElement {
    const script = document.createElement('script');
    script.src = src;

    if (options.async) {
      script.async = true;
    }

    if (options.defer) {
      script.defer = true;
    }

    if (options.crossOrigin) {
      script.crossOrigin = options.crossOrigin;
    }

    if (options.integrity) {
      script.integrity = options.integrity;
    }

    return script;
  },

  /**
   * Load a script
   */
  loadScript(src: string, options: {
    async?: boolean;
    defer?: boolean;
    crossOrigin?: string;
    integrity?: string;
  } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = this.createScript(src, options);

      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });
  },

  /**
   * Create a style element
   */
  createStyle(href: string, options: {
    crossOrigin?: string;
    integrity?: string;
  } = {}): HTMLLinkElement {
    const link = document.createElement('link');
    link.href = href;
    link.rel = 'stylesheet';

    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin;
    }

    if (options.integrity) {
      link.integrity = options.integrity;
    }

    return link;
  },

  /**
   * Load a stylesheet
   */
  loadStyle(href: string, options: {
    crossOrigin?: string;
    integrity?: string;
  } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = this.createStyle(href, options);

      link.onload = () => {
        resolve();
      };

      link.onerror = () => {
        reject(new Error(`Failed to load stylesheet: ${href}`));
      };

      document.head.appendChild(link);
    });
  },

  /**
   * Check if a URL is external
   */
  isExternalUrl(url: string): boolean {
    if (typeof window === 'undefined') return false;

    const domain = window.location.hostname;
    const link = document.createElement('a');
    link.href = url;

    return link.hostname !== domain && link.hostname !== '';
  },

  /**
   * Check if the current environment is a browser
   */
  isBrowser(): boolean {
    return typeof window !== 'undefined';
  },

  /**
   * Check if the current environment is a server
   */
  isServer(): boolean {
    return typeof window === 'undefined';
  },

  /**
   * Check if the current environment is in development mode
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  },

  /**
   * Check if the current environment is in production mode
   */
  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  },

  /**
   * Debounce a function
   */
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  },

  /**
   * Throttle a function
   */
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }
};

// Export all utility modules


