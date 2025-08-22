// Edge runtime compatibility for serverless and edge environments
export interface EdgeRequest { 
  path: string; 
  method: string; 
  headers: Record<string,string>; 
  body?: Uint8Array; 
  query?: Record<string, string>;
  cookies?: Record<string, string>;
  url?: string;
}

export interface EdgeResponse { 
  status: number; 
  headers: Record<string,string>; 
  body: string | Uint8Array; 
}

export type EdgeHandler = (req: EdgeRequest) => Promise<EdgeResponse> | EdgeResponse;

export interface RouteConfig {
  path: RegExp | string;
  method?: string | string[];
  handler: EdgeHandler;
  middleware?: EdgeMiddleware[];
}

export type EdgeMiddleware = (req: EdgeRequest, next: () => Promise<EdgeResponse>) => Promise<EdgeResponse>;

export interface EdgeAppOptions {
  cors?: boolean | CorsOptions;
  compression?: boolean;
  timeout?: number;
  maxBodySize?: number;
}

export interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

export class EdgeApp {
  private routes: RouteConfig[] = [];
  private globalMiddleware: EdgeMiddleware[] = [];
  private options: EdgeAppOptions;

  constructor(options: EdgeAppOptions = {}) {
    this.options = {
      cors: options.cors || false,
      compression: options.compression || false,
      timeout: options.timeout || 30000,
      maxBodySize: options.maxBodySize || 1024 * 1024 * 10 // 10MB
    };
  }

  use(middleware: EdgeMiddleware): this {
    this.globalMiddleware.push(middleware);
    return this;
  }

  route(config: RouteConfig): this {
    this.routes.push(config);
    return this;
  }

  get(path: string | RegExp, handler: EdgeHandler, middleware?: EdgeMiddleware[]): this {
    return this.route({ path, method: 'GET', handler, middleware });
  }

  post(path: string | RegExp, handler: EdgeHandler, middleware?: EdgeMiddleware[]): this {
    return this.route({ path, method: 'POST', handler, middleware });
  }

  put(path: string | RegExp, handler: EdgeHandler, middleware?: EdgeMiddleware[]): this {
    return this.route({ path, method: 'PUT', handler, middleware });
  }

  delete(path: string | RegExp, handler: EdgeHandler, middleware?: EdgeMiddleware[]): this {
    return this.route({ path, method: 'DELETE', handler, middleware });
  }

  async handle(req: EdgeRequest): Promise<EdgeResponse> {
    // Enhance request with parsed data
    const enhancedReq = this.enhanceRequest(req);
    
    // Find matching route
    const route = this.findRoute(enhancedReq);
    
    if (!route) {
      return this.createResponse(404, 'Not Found');
    }

    try {
      // Build middleware chain
      const middlewareChain = [
        ...this.globalMiddleware,
        ...(route.middleware || [])
      ];

      // Execute middleware chain
      let index = 0;
      const next = async (): Promise<EdgeResponse> => {
        if (index < middlewareChain.length) {
          const middleware = middlewareChain[index++];
          return middleware(enhancedReq, next);
        } else {
          return route.handler(enhancedReq);
        }
      };

      // Apply timeout
      const timeoutPromise = new Promise<EdgeResponse>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.options.timeout);
      });

      const response = await Promise.race([next(), timeoutPromise]);
      
      // Apply response processing
      return this.processResponse(response, enhancedReq);
      
    } catch (error) {
      console.error('Edge handler error:', error);
      return this.createResponse(500, 'Internal Server Error');
    }
  }

  private enhanceRequest(req: EdgeRequest): EdgeRequest {
    const enhanced = { ...req };
    
    // Parse query parameters
    if (req.url) {
      const url = new URL(req.url, 'http://localhost');
      enhanced.query = Object.fromEntries(url.searchParams.entries());
      enhanced.path = url.pathname;
    } else if (req.path.includes('?')) {
      const [pathname, queryString] = req.path.split('?');
      enhanced.path = pathname;
      enhanced.query = this.parseQuery(queryString);
    }

    // Parse cookies
    if (req.headers.cookie) {
      enhanced.cookies = this.parseCookies(req.headers.cookie);
    }

    return enhanced;
  }

  private findRoute(req: EdgeRequest): RouteConfig | null {
    for (const route of this.routes) {
      // Check method match
      if (route.method) {
        const methods = Array.isArray(route.method) ? route.method : [route.method];
        if (!methods.includes(req.method)) {
          continue;
        }
      }

      // Check path match
      if (typeof route.path === 'string') {
        if (req.path === route.path) {
          return route;
        }
      } else if (route.path instanceof RegExp) {
        if (route.path.test(req.path)) {
          return route;
        }
      }
    }

    return null;
  }

  private processResponse(response: EdgeResponse, req: EdgeRequest): EdgeResponse {
    const processed = { ...response };

    // Apply CORS headers
    if (this.options.cors) {
      const corsHeaders = this.getCorsHeaders(req);
      processed.headers = { ...processed.headers, ...corsHeaders };
    }

    // Apply compression (simplified - would use actual compression in real implementation)
    if (this.options.compression && typeof response.body === 'string' && response.body.length > 1024) {
      processed.headers['content-encoding'] = 'gzip';
      // Note: Actual gzip compression would be applied here
    }

    return processed;
  }

  private getCorsHeaders(req: EdgeRequest): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (typeof this.options.cors === 'boolean') {
      if (this.options.cors) {
        headers['Access-Control-Allow-Origin'] = '*';
        headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      }
    } else if (this.options.cors) {
      const corsOptions = this.options.cors as CorsOptions;
      
      // Handle origin
      if (corsOptions.origin) {
        const origin = req.headers.origin || '';
        if (typeof corsOptions.origin === 'string') {
          headers['Access-Control-Allow-Origin'] = corsOptions.origin;
        } else if (Array.isArray(corsOptions.origin)) {
          if (corsOptions.origin.includes(origin)) {
            headers['Access-Control-Allow-Origin'] = origin;
          }
        } else if (typeof corsOptions.origin === 'function') {
          if (corsOptions.origin(origin)) {
            headers['Access-Control-Allow-Origin'] = origin;
          }
        }
      }

      // Handle methods
      if (corsOptions.methods) {
        headers['Access-Control-Allow-Methods'] = corsOptions.methods.join(', ');
      }

      // Handle headers
      if (corsOptions.allowedHeaders) {
        headers['Access-Control-Allow-Headers'] = corsOptions.allowedHeaders.join(', ');
      }

      // Handle credentials
      if (corsOptions.credentials) {
        headers['Access-Control-Allow-Credentials'] = 'true';
      }
    }

    return headers;
  }

  private parseQuery(queryString: string): Record<string, string> {
    const params = new URLSearchParams(queryString);
    return Object.fromEntries(params.entries());
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });

    return cookies;
  }

  private createResponse(status: number, body: string, headers: Record<string, string> = {}): EdgeResponse {
    return {
      status,
      headers: {
        'content-type': 'text/plain',
        ...headers
      },
      body
    };
  }
}

// Legacy compatibility function
export function createEdgeApp(routes: { path: RegExp; handler: EdgeHandler }[]): EdgeHandler {
  const app = new EdgeApp();
  
  routes.forEach(route => {
    app.route({ path: route.path, handler: route.handler });
  });

  return (req: EdgeRequest) => app.handle(req);
}

// Utility middleware
export const jsonMiddleware: EdgeMiddleware = async (req, next) => {
  if (req.headers['content-type']?.includes('application/json') && req.body) {
    try {
      const text = new TextDecoder().decode(req.body);
      (req as any).json = JSON.parse(text);
    } catch (error) {
      return {
        status: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON' })
      };
    }
  }
  
  return next();
};

export const loggerMiddleware: EdgeMiddleware = async (req, next) => {
  const start = Date.now();
  const response = await next();
  const duration = Date.now() - start;
  
  console.log(`${req.method} ${req.path} ${response.status} ${duration}ms`);
  
  return response;
};

export const securityHeadersMiddleware: EdgeMiddleware = async (req, next) => {
  const response = await next();
  
  response.headers['X-Content-Type-Options'] = 'nosniff';
  response.headers['X-Frame-Options'] = 'DENY';
  response.headers['X-XSS-Protection'] = '1; mode=block';
  response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  
  return response;
};

// Platform-specific adapters
export function adaptToCloudflareWorkers(app: EdgeApp) {
  return {
    async fetch(request: Request): Promise<Response> {
      const req: EdgeRequest = {
        path: new URL(request.url).pathname,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: request.body ? new Uint8Array(await request.arrayBuffer()) : undefined,
        url: request.url
      };

      const response = await app.handle(req);
      
      return new Response(response.body, {
        status: response.status,
        headers: response.headers
      });
    }
  };
}

export function adaptToVercelEdge(app: EdgeApp) {
  return async (request: Request): Promise<Response> => {
    const req: EdgeRequest = {
      path: new URL(request.url).pathname,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.body ? new Uint8Array(await request.arrayBuffer()) : undefined,
      url: request.url
    };

    const response = await app.handle(req);
    
    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  };
}

export function adaptToDenoFresh(app: EdgeApp) {
  return async (req: Request): Promise<Response> => {
    const edgeReq: EdgeRequest = {
      path: new URL(req.url).pathname,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      body: req.body ? new Uint8Array(await req.arrayBuffer()) : undefined,
      url: req.url
    };

    const response = await app.handle(edgeReq);
    
    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  };
}

export default EdgeApp;