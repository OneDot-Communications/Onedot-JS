import http from 'node:http';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import { buildCommand } from './build.js';

interface ModuleCache { [id: string]: { code: string; hash: string; timestamp: number; }; }
const moduleCache: ModuleCache = {};
let clients: Set<any> = new Set();

interface HMRMessage {
  type: 'reload' | 'update' | 'error';
  path?: string;
  code?: string;
  error?: string;
  timestamp?: number;
}

function transformCode(code: string, id: string): string {
  // Add HMR runtime for client-side hot module replacement
  const hmrRuntime = `
    if (typeof window !== 'undefined' && window.__ONEDOT_HMR) {
      window.__ONEDOT_HMR.accept('${id}', () => {
        console.log('[HMR] Hot updating ${id}');
      });
    }
  `;
  
  // Transform TypeScript-style imports to browser-compatible
  let transformed = code
    .replace(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g, 
      (match, imports, source) => {
        if (source.startsWith('@onedot/')) {
          const pkg = source.replace('@onedot/', '');
          return `import { ${imports} } from '/__onedot_pkg/${pkg}.js'`;
        }
        return match;
      })
    .replace(/import\s+([^{]\w+)\s+from\s+['"]([^'"]+)['"]/g,
      (match, defaultImport, source) => {
        if (source.startsWith('@onedot/')) {
          const pkg = source.replace('@onedot/', '');
          return `import ${defaultImport} from '/__onedot_pkg/${pkg}.js'`;
        }
        return match;
      });
  
  return transformed + hmrRuntime;
}

function bundleEntry(entry: string): string {
  const stat = fs.statSync(entry);
  const cached = moduleCache[entry];
  
  if (cached && cached.timestamp >= stat.mtimeMs) {
    return cached.code;
  }
  
  const raw = fs.readFileSync(entry, 'utf8');
  const transformed = transformCode(raw, entry);
  const hash = createHash('sha1').update(transformed).digest('hex').slice(0,8);
  
  const bundled = `
    // ONEDOT DEV BUNDLE - ${path.basename(entry)} - hash:${hash}
    window.__ONEDOT_HMR = window.__ONEDOT_HMR || {
      modules: new Map(),
      accept(id, callback) {
        this.modules.set(id, callback);
      },
      update(id) {
        const callback = this.modules.get(id);
        if (callback) callback();
      }
    };
    
    ${transformed}
  `;
  
  moduleCache[entry] = {
    code: bundled,
    hash,
    timestamp: stat.mtimeMs
  };
  
  return bundled;
}

function servePackage(pkg: string): string {
  const packagePath = path.join(process.cwd(), 'packages', pkg, 'src', 'index.ts');
  
  if (!fs.existsSync(packagePath)) {
    return `export const __missing__ = true; console.warn('Package ${pkg} not found');`;
  }
  
  return bundleEntry(packagePath);
}

function generateDevHTML(): string {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ONEDOT Development Server</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; 
            background: #f8fafc;
        }
        #app { 
            min-height: 100vh; 
            padding: 20px;
        }
        .dev-info {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-family: monospace;
            z-index: 10000;
        }
        .dev-info.connected { background: rgba(34,197,94,0.8); }
        .dev-info.error { background: rgba(239,68,68,0.8); }
    </style>
</head>
<body>
    <div class="dev-info" id="dev-status">Starting...</div>
    <div id="app"></div>
    
    <script type="module">
        const devStatus = document.getElementById('dev-status');
        const ws = new WebSocket('ws://' + location.host + '/__onedot_hmr');
        
        ws.onopen = () => {
            devStatus.textContent = 'ONEDOT DEV';
            devStatus.className = 'dev-info connected';
        };
        
        ws.onclose = () => {
            devStatus.textContent = 'Disconnected';
            devStatus.className = 'dev-info error';
        };
        
        ws.onerror = () => {
            devStatus.textContent = 'WebSocket Error';
            devStatus.className = 'dev-info error';
        };
        
        ws.onmessage = async (event) => {
            const msg = JSON.parse(event.data);
            
            switch (msg.type) {
                case 'reload':
                    console.info('[HMR] Full reload requested');
                    location.reload();
                    break;
                    
                case 'update':
                    console.info('[HMR] Hot update:', msg.path);
                    if (window.__ONEDOT_HMR) {
                        window.__ONEDOT_HMR.update(msg.path);
                    }
                    break;
                    
                case 'error':
                    console.error('[HMR] Build error:', msg.error);
                    devStatus.textContent = 'Build Error';
                    devStatus.className = 'dev-info error';
                    break;
            }
        };
        
        // Load the main application
        try {
            await import('/__onedot_entry.js?t=' + Date.now());
            devStatus.textContent = 'ONEDOT DEV - Ready';
        } catch (error) {
            console.error('[DEV] Failed to load app:', error);
            devStatus.textContent = 'Load Error';
            devStatus.className = 'dev-info error';
        }
    </script>
</body>
</html>`;
}

export async function devCommand() {
  const port = parseInt(process.env.PORT || '5173');
  const root = process.cwd();
  const entry = path.join(root, 'app', 'index.ts');
  
  if (!fs.existsSync(entry)) {
    console.error('Entry file not found:', entry);
    console.info('Create an app/index.ts file or run: onedot create <project-name>');
    process.exit(1);
  }

  const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = req.url || '/';
    
    // CORS headers for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    try {
      if (url === '/') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(generateDevHTML());
        return;
      }
      
      if (url === '/__onedot_entry.js' || url.startsWith('/__onedot_entry.js?')) {
        res.writeHead(200, { 
          'content-type': 'application/javascript; charset=utf-8',
          'cache-control': 'no-cache'
        });
        res.end(bundleEntry(entry));
        return;
      }
      
      if (url.startsWith('/__onedot_pkg/')) {
        const pkg = url.replace('/__onedot_pkg/', '').replace('.js', '');
        res.writeHead(200, { 
          'content-type': 'application/javascript; charset=utf-8',
          'cache-control': 'no-cache'
        });
        res.end(servePackage(pkg));
        return;
      }
      
      // Serve static files from public directory
      const publicPath = path.join(root, 'public', url);
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        const ext = path.extname(publicPath);
        const contentType = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon'
        }[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'content-type': contentType });
        fs.createReadStream(publicPath).pipe(res);
        return;
      }
      
      res.writeHead(404);
      res.end('Not found');
    } catch (error) {
      console.error('[DEV] Server error:', error);
      res.writeHead(500);
      res.end('Internal server error');
    }
  });

  const wss = new WebSocketServer({ server, path: '/__onedot_hmr' });
  
  wss.on('connection', (ws: any) => {
    clients.add(ws);
    console.info('[HMR] Client connected');
    
    ws.on('close', () => {
      clients.delete(ws);
      console.info('[HMR] Client disconnected');
    });
    
    ws.on('error', (error: Error) => {
      console.warn('[HMR] WebSocket error:', error.message);
      clients.delete(ws);
    });
  });

  server.listen(port, () => {
    console.log(`🚀 ONEDOT dev server running at http://localhost:${port}`);
    console.log(`📁 Entry: ${path.relative(root, entry)}`);
    console.log(`🔥 Hot Module Replacement enabled`);
  });

  // Enhanced file watcher with debouncing
  const watchPaths = [
    path.join(root, 'app'),
    path.join(root, 'packages')
  ].filter(p => fs.existsSync(p));
  
  let debounceTimer: NodeJS.Timeout | null = null;
  const changedFiles = new Set<string>();
  
  function notifyClients() {
    if (changedFiles.size === 0) return;
    
    const files = Array.from(changedFiles);
    changedFiles.clear();
    
    console.info('[HMR] Files changed:', files.map(f => path.relative(root, f)).join(', '));
    
    // Determine if full reload or hot update
    const needsFullReload = files.some(file => 
      file.includes('package.json') || 
      file.includes('.config.') ||
      file.endsWith('.rs')
    );
    
    const message: HMRMessage = needsFullReload 
      ? { type: 'reload', timestamp: Date.now() }
      : { type: 'update', path: files[0], timestamp: Date.now() };
    
    // Clear module cache for changed files
    files.forEach(file => delete moduleCache[file]);
    
    for (const ws of clients) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.warn('[HMR] Failed to send to client:', error);
        clients.delete(ws);
      }
    }
  }
  
  const watcher = chokidar.watch(watchPaths, {
    ignored: [
      '**/node_modules/**',
      '**/target/**',
      '**/dist/**',
      '**/.git/**',
      '**/*.log'
    ],
    ignoreInitial: true
  });
  
  watcher.on('change', (file: string) => {
    changedFiles.add(file);
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(notifyClients, 100);
  });
  
  watcher.on('add', (file: string) => {
    console.info('[HMR] File added:', path.relative(root, file));
  });
  
  watcher.on('unlink', (file: string) => {
    console.info('[HMR] File removed:', path.relative(root, file));
    delete moduleCache[file];
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down dev server...');
    watcher.close();
    server.close();
    process.exit(0);
  });
}
