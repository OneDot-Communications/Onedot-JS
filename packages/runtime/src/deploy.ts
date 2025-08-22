// Production deployment adapters for serverless platforms
import { renderDocument, renderToStream, type RenderStreamOptions } from './ssr.js';
import { createStreamRenderer, type StreamingOptions } from './streaming.js';
import { VNode } from '../../core/src/component.js';

export interface DeployHandler {
  (req: Request): Promise<Response> | Response;
}

export interface DeploymentOptions {
  title?: string;
  assets?: string[];
  streaming?: boolean;
  maxAge?: number;
  compression?: boolean;
  environmentVars?: Record<string, string>;
}

export interface CloudflareLikeHandler { 
  fetch(req: Request, env: any, ctx: any): Promise<Response> | Response;
}

export interface VercelLikeHandler {
  (req: any, res: any): Promise<void> | void;
}

export interface LambdaLikeHandler {
  (event: any, context: any): Promise<any> | any;
}

export interface DenoLikeHandler {
  (req: Request): Promise<Response> | Response;
}

// Enhanced Cloudflare Workers adapter
export function createCloudflareHandler(
  app: () => VNode, 
  options: DeploymentOptions = {}
): CloudflareLikeHandler {
  const {
    title = 'ONEDOT App',
    assets = ['/bundle.js'],
    streaming = false,
    maxAge = 3600,
    compression = true
  } = options;

  return {
    async fetch(req: Request, env: any, ctx: any): Promise<Response> {
      try {
        const url = new URL(req.url);
        
        // Handle static assets
        if (assets.some(asset => url.pathname.endsWith(asset))) {
          // In production, these would be served from KV storage or R2
          return new Response('Asset not found', { status: 404 });
        }

        if (streaming) {
          // Streaming SSR for Cloudflare Workers
          const { readable, writable } = new TransformStream();
          const writer = writable.getWriter();
          
          const streamRenderer = createStreamRenderer({
            onChunk: (chunk) => {
              writer.write(new TextEncoder().encode(chunk.html));
            },
            onEnd: () => {
              writer.close();
            },
            onError: (error) => {
              console.error('Streaming error:', error);
              writer.abort(error);
            },
            enableSuspense: true,
            maxConcurrency: 3,
            priorityThreshold: 50,
            chunkSize: 8192
          });

          // Start streaming in background
          ctx.waitUntil(streamRenderer.renderToStream(app()));

          return new Response(readable, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': `public, max-age=${maxAge}`,
              'Transfer-Encoding': 'chunked'
            }
          });
        } else {
          // Standard SSR
          const html = renderDocument(app(), { title, assets });
          
          const headers: Record<string, string> = {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': `public, max-age=${maxAge}`
          };

          if (compression) {
            headers['Content-Encoding'] = 'gzip';
            // Note: Actual compression would be handled by Cloudflare automatically
          }

          return new Response(html, { headers });
        }
      } catch (error) {
        console.error('Cloudflare handler error:', error);
        return new Response('Internal Server Error', { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }
  };
}

// Enhanced Vercel adapter
export function createVercelHandler(
  app: () => VNode, 
  options: DeploymentOptions = {}
): VercelLikeHandler {
  const {
    title = 'ONEDOT App',
    assets = ['/bundle.js'],
    streaming = false,
    maxAge = 3600
  } = options;

  return async function vercel(req: any, res: any): Promise<void> {
    try {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);

      if (streaming) {
        // Streaming response for Vercel
        let chunks: string[] = [];
        
        const streamOptions: RenderStreamOptions = {
          onChunk: (chunk) => {
            chunks.push(chunk.html);
            if (chunk.flush || chunks.length >= 10) {
              res.write(chunks.join(''));
              chunks = [];
            }
          },
          onEnd: () => {
            if (chunks.length > 0) {
              res.write(chunks.join(''));
            }
            res.end();
          },
          highWaterMark: 8192
        };

        renderToStream(app(), streamOptions);
      } else {
        const html = renderDocument(app(), { title, assets });
        res.end(html);
      }
    } catch (error) {
      console.error('Vercel handler error:', error);
      res.status(500).end('Internal Server Error');
    }
  };
}

// Enhanced AWS Lambda adapter  
export function createLambdaHandler(
  app: () => VNode, 
  options: DeploymentOptions = {}
): LambdaLikeHandler {
  const {
    title = 'ONEDOT App',
    assets = ['/bundle.js'],
    maxAge = 3600,
    compression = true
  } = options;

  return async function lambda(event: any, context: any): Promise<any> {
    try {
      // Parse request from Lambda event
      const path = event.requestContext?.http?.path || event.path || '/';
      const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
      
      console.log(`Lambda request: ${method} ${path}`);

      const html = renderDocument(app(), { title, assets });
      
      const headers: Record<string, string> = {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': `public, max-age=${maxAge}`
      };

      if (compression && html.length > 1024) {
        headers['Content-Encoding'] = 'gzip';
        // Note: Actual compression would be applied here
      }

      // AWS Lambda response format
      return {
        statusCode: 200,
        headers,
        body: html,
        isBase64Encoded: false
      };
    } catch (error) {
      console.error('Lambda handler error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Internal Server Error',
        isBase64Encoded: false
      };
    }
  };
}

// Netlify Functions adapter
export function createNetlifyHandler(
  app: () => VNode, 
  options: DeploymentOptions = {}
): any {
  const {
    title = 'ONEDOT App',
    assets = ['/bundle.js'],
    maxAge = 3600
  } = options;

  return async function netlify(event: any, context: any): Promise<any> {
    try {
      const html = renderDocument(app(), { title, assets });
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': `public, max-age=${maxAge}`
        },
        body: html
      };
    } catch (error) {
      console.error('Netlify handler error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Internal Server Error'
      };
    }
  };
}

// Deno Deploy adapter
export function createDenoHandler(
  app: () => VNode, 
  options: DeploymentOptions = {}
): DenoLikeHandler {
  const {
    title = 'ONEDOT App',
    assets = ['/bundle.js'],
    maxAge = 3600,
    streaming = false
  } = options;

  return async function deno(req: Request): Promise<Response> {
    try {
      if (streaming) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        
        const streamOptions: RenderStreamOptions = {
          onChunk: (chunk) => {
            writer.write(new TextEncoder().encode(chunk.html));
          },
          onEnd: () => {
            writer.close();
          }
        };

        // Start streaming
        renderToStream(app(), streamOptions);

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': `public, max-age=${maxAge}`
          }
        });
      } else {
        const html = renderDocument(app(), { title, assets });
        
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': `public, max-age=${maxAge}`
          }
        });
      }
    } catch (error) {
      console.error('Deno handler error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  };
}

// Docker/Node.js adapter
export function createNodeHandler(
  app: () => VNode, 
  options: DeploymentOptions = {}
) {
  const {
    title = 'ONEDOT App',
    assets = ['/bundle.js'],
    maxAge = 3600,
    streaming = false
  } = options;

  return function nodeHandler(req: any, res: any): void {
    try {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);

      if (streaming) {
        const streamOptions: RenderStreamOptions = {
          onChunk: (chunk) => {
            res.write(chunk.html);
          },
          onEnd: () => {
            res.end();
          }
        };

        renderToStream(app(), streamOptions);
      } else {
        const html = renderDocument(app(), { title, assets });
        res.end(html);
      }
    } catch (error) {
      console.error('Node handler error:', error);
      res.status(500).end('Internal Server Error');
    }
  };
}

// Platform detection utility
export function detectPlatform(): string {
  if (typeof Deno !== 'undefined') return 'deno';
  if (typeof EdgeRuntime !== 'undefined') return 'edge';
  if (typeof process !== 'undefined') {
    const env = (process as any).env;
    if (env.VERCEL) return 'vercel';
    if (env.NETLIFY) return 'netlify';
    if (env.AWS_LAMBDA_FUNCTION_NAME) return 'lambda';
    if (env.FUNCTIONS_WORKER_RUNTIME) return 'azure';
    return 'node';
  }
  return 'unknown';
}

// Auto-detect and create appropriate handler
export function createDeploymentHandler(
  app: () => VNode, 
  options: DeploymentOptions = {}
): any {
  const platform = detectPlatform();
  
  switch (platform) {
    case 'vercel':
      return createVercelHandler(app, options);
    case 'netlify':
      return createNetlifyHandler(app, options);
    case 'lambda':
      return createLambdaHandler(app, options);
    case 'deno':
      return createDenoHandler(app, options);
    case 'node':
      return createNodeHandler(app, options);
    default:
      console.warn(`Unknown platform: ${platform}, using Node.js handler`);
      return createNodeHandler(app, options);
  }
}

// Static site generation helper
export interface StaticGenerationOptions {
  routes: Array<{ path: string; component: () => VNode; }>;
  outputDir: string;
  baseUrl?: string;
  sitemap?: boolean;
  robotsTxt?: boolean;
}

export async function generateStaticSite(options: StaticGenerationOptions): Promise<void> {
  const { routes, outputDir, baseUrl = '', sitemap = true, robotsTxt = true } = options;
  
  // Ensure output directory exists
  try {
    await Deno.mkdir(outputDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  const generatedFiles: string[] = [];

  // Generate pages
  for (const route of routes) {
    const html = renderDocument(route.component(), {
      title: `ONEDOT - ${route.path}`,
      assets: ['/bundle.js']
    });

    const fileName = route.path === '/' ? 'index.html' : `${route.path.replace(/^\//, '')}/index.html`;
    const filePath = `${outputDir}/${fileName}`;
    
    // Ensure directory exists
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    try {
      await Deno.mkdir(dir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    await Deno.writeTextFile(filePath, html);
    generatedFiles.push(fileName);
    console.log(`Generated: ${fileName}`);
  }

  // Generate sitemap.xml
  if (sitemap && baseUrl) {
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route.path === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

    await Deno.writeTextFile(`${outputDir}/sitemap.xml`, sitemapXml);
    console.log('Generated: sitemap.xml');
  }

  // Generate robots.txt
  if (robotsTxt) {
    const robotsTxtContent = `User-agent: *
Allow: /
${sitemap && baseUrl ? `Sitemap: ${baseUrl}/sitemap.xml` : ''}`;

    await Deno.writeTextFile(`${outputDir}/robots.txt`, robotsTxtContent);
    console.log('Generated: robots.txt');
  }

  console.log(`Static site generation complete: ${generatedFiles.length} pages generated`);
}

export default {
  createCloudflareHandler,
  createVercelHandler,
  createLambdaHandler,
  createNetlifyHandler,
  createDenoHandler,
  createNodeHandler,
  createDeploymentHandler,
  generateStaticSite,
  detectPlatform
};
