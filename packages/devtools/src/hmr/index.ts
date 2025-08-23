import { OneDot } from '@onedot/core';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import * as WebSocket from 'ws';

export interface HMROptions {
  enabled?: boolean;
  port?: number;
  host?: string;
  watchPaths?: string[];
  ignored?: string[];
  pollInterval?: number;
  overlay?: boolean;
  overlayStyles?: string;
  clientUrl?: string;
  serverUrl?: string;
  hot?: boolean;
  live?: boolean;
  injectClient?: boolean;
  reloadDelay?: number;
  quiet?: boolean;
  logLevel?: 'info' | 'warn' | 'error' | 'debug' | 'silent';
  headers?: Record<string, string>;
  https?: boolean;
  key?: string;
  cert?: string;
  ca?: string;
  pfx?: string;
  passphrase?: string;
  requestCert?: boolean;
  rejectUnauthorized?: boolean;
}

export class HMR {
  private options: HMROptions;
  private server: WebSocket.Server | null = null;
  private watcher: chokidar.FSWatcher | null = null;
  private clients: Set<WebSocket> = new Set();
  private fileHashes: Map<string, string> = new Map();
  private initialized = false;

  constructor(options: HMROptions = {}) {
    this.options = {
      enabled: true,
      port: 8080,
      host: 'localhost',
      watchPaths: [process.cwd()],
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      pollInterval: 100,
      overlay: true,
      overlayStyles: '',
      clientUrl: '/__onedot_hmr_client',
      serverUrl: 'ws://localhost:8080',
      hot: true,
      live: false,
      injectClient: true,
      reloadDelay: 0,
      quiet: false,
      logLevel: 'info',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      https: false,
      requestCert: false,
      rejectUnauthorized: false,
      ...options
    };
  }

  public initialize(): void {
    if (this.initialized) return;

    // Set up WebSocket server
    this.setupWebSocketServer();

    // Set up file watcher
    this.setupFileWatcher();

    this.initialized = true;
  }

  public destroy(): void {
    if (!this.initialized) return;

    // Close WebSocket server
    if (this.server) {
      this.server.close();
      this.server = null;
    }

    // Close file watcher
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    // Clear clients
    this.clients.clear();

    // Clear file hashes
    this.fileHashes.clear();

    this.initialized = false;
  }

  private setupWebSocketServer(): void {
    const serverOptions: WebSocket.ServerOptions = {
      port: this.options.port,
      host: this.options.host
    };

    if (this.options.https) {
      const https = require('https');
      const fs = require('fs');

      let serverConfig: any = {};

      if (this.options.key && this.options.cert) {
        serverConfig.key = fs.readFileSync(this.options.key);
        serverConfig.cert = fs.readFileSync(this.options.cert);
      } else if (this.options.pfx) {
        serverConfig.pfx = fs.readFileSync(this.options.pfx);
        if (this.options.passphrase) {
          serverConfig.passphrase = this.options.passphrase;
        }
      }

      if (this.options.ca) {
        serverConfig.ca = Array.isArray(this.options.ca)
          ? this.options.ca.map(ca => fs.readFileSync(ca))
          : fs.readFileSync(this.options.ca);
      }

      serverConfig.requestCert = this.options.requestCert;
      serverConfig.rejectUnauthorized = this.options.rejectUnauthorized;

      const httpsServer = https.createServer(serverConfig);
      this.server = new WebSocket.Server({ server: httpsServer });

      httpsServer.listen(this.options.port, this.options.host);
    } else {
      this.server = new WebSocket.Server(serverOptions);
    }

    this.server.on('connection', (ws: WebSocket) => {
      this.log('debug', 'Client connected');

      // Add client to set
      this.clients.add(ws);

      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'connected',
        data: {
          timestamp: new Date()
        }
      }));

      // Set up message handler
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          this.log('error', 'Error parsing client message:', error);
        }
      });

      // Set up close handler
      ws.on('close', () => {
        this.log('debug', 'Client disconnected');
        this.clients.delete(ws);
      });

      // Set up error handler
      ws.on('error', (error) => {
        this.log('error', 'WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    this.server.on('error', (error) => {
      this.log('error', 'WebSocket server error:', error);
    });
  }

  private setupFileWatcher(): void {
    this.watcher = chokidar.watch(this.options.watchPaths!, {
      ignored: this.options.ignored,
      persistent: true,
      ignoreInitial: true,
      usePolling: true,
      interval: this.options.pollInterval
    });

    this.watcher.on('change', (filePath: string) => {
      this.handleFileChange(filePath);
    });

    this.watcher.on('add', (filePath: string) => {
      this.handleFileAdd(filePath);
    });

    this.watcher.on('unlink', (filePath: string) => {
      this.handleFileRemove(filePath);
    });

    this.watcher.on('error', (error) => {
      this.log('error', 'File watcher error:', error);
    });
  }

  private handleClientMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'sync':
        this.handleSyncRequest(ws);
        break;
      case 'reload':
        this.handleReloadRequest(ws);
        break;
      case 'update':
        this.handleUpdateRequest(ws, data.data);
        break;
      case 'error':
        this.handleClientError(ws, data.data);
        break;
      default:
        this.log('warn', 'Unknown client message type:', data.type);
    }
  }

  private handleSyncRequest(ws: WebSocket): void {
    // Send current state to client
    ws.send(JSON.stringify({
      type: 'sync',
      data: {
        timestamp: new Date(),
        state: this.getCurrentState()
      }
    }));
  }

  private handleReloadRequest(ws: WebSocket): void {
    // Send reload message to all clients
    this.broadcast({
      type: 'reload',
      data: {
        timestamp: new Date(),
        delay: this.options.reloadDelay
      }
    });
  }

  private handleUpdateRequest(ws: WebSocket, data: any): void {
    // Handle update request from client
    this.log('debug', 'Update request:', data);

    // Send update message to all clients
    this.broadcast({
      type: 'update',
      data: {
        timestamp: new Date(),
        ...data
      }
    });
  }

  private handleClientError(ws: WebSocket, data: any): void {
    // Handle error from client
    this.log('error', 'Client error:', data);

    // Broadcast error to all clients
    this.broadcast({
      type: 'error',
      data: {
        timestamp: new Date(),
        ...data
      }
    });
  }

  private handleFileChange(filePath: string): void {
    this.log('debug', 'File changed:', filePath);

    // Get file hash
    const hash = this.getFileHash(filePath);
    const previousHash = this.fileHashes.get(filePath);

    // Check if file actually changed
    if (hash === previousHash) {
      return;
    }

    // Update file hash
    this.fileHashes.set(filePath, hash);

    // Determine file type
    const ext = path.extname(filePath);

    // Handle different file types
    if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
      this.handleScriptFileChange(filePath);
    } else if (ext === '.css' || ext === '.scss' || ext === '.less') {
      this.handleStyleFileChange(filePath);
    } else if (ext === '.html' || ext === '.htm') {
      this.handleHTMLFileChange(filePath);
    } else {
      this.handleOtherFileChange(filePath);
    }
  }

  private handleFileAdd(filePath: string): void {
    this.log('debug', 'File added:', filePath);

    // Get file hash
    const hash = this.getFileHash(filePath);

    // Update file hash
    this.fileHashes.set(filePath, hash);

    // Determine file type
    const ext = path.extname(filePath);

    // Handle different file types
    if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
      this.handleScriptFileAdd(filePath);
    } else if (ext === '.css' || ext === '.scss' || ext === '.less') {
      this.handleStyleFileAdd(filePath);
    } else if (ext === '.html' || ext === '.htm') {
      this.handleHTMLFileAdd(filePath);
    } else {
      this.handleOtherFileAdd(filePath);
    }
  }

  private handleFileRemove(filePath: string): void {
    this.log('debug', 'File removed:', filePath);

    // Remove file hash
    this.fileHashes.delete(filePath);

    // Determine file type
    const ext = path.extname(filePath);

    // Handle different file types
    if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
      this.handleScriptFileRemove(filePath);
    } else if (ext === '.css' || ext === '.scss' || ext === '.less') {
      this.handleStyleFileRemove(filePath);
    } else if (ext === '.html' || ext === '.htm') {
      this.handleHTMLFileRemove(filePath);
    } else {
      this.handleOtherFileRemove(filePath);
    }
  }

  private handleScriptFileChange(filePath: string): void {
    // Get relative path
    const relativePath = path.relative(process.cwd(), filePath);

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');

    // Broadcast update message
    this.broadcast({
      type: 'script-update',
      data: {
        timestamp: new Date(),
        path: relativePath,
        content,
        hot: this.options.hot
      }
    });
  }

  private handleStyleFileChange(filePath: string): void {
    // Get relative path
    const relativePath = path.relative(process.cwd(), filePath);

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');

    // Broadcast update message
    this.broadcast({
      type: 'style-update',
      data: {
        timestamp: new Date(),
        path: relativePath,
        content
      }
    });
  }

  private handleHTMLFileChange(filePath: string): void {
    // Get relative path
    const relativePath = path.relative(process.cwd(), filePath);

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');

    // Broadcast update message
    this.broadcast({
      type: 'html-update',
      data: {
        timestamp: new Date(),
        path: relativePath,
        content,
        live: this.options.live
      }
    });
  }

  private handleOtherFileChange(filePath: string): void {
    // Get relative path
    const relativePath = path.relative(process.cwd(), filePath);

    // Broadcast update message
    this.broadcast({
      type: 'file-update',
      data: {
        timestamp: new Date(),
        path: relativePath
      }
    });
  }

  private handleScriptFileAdd(filePath: string): void {
    // Get relative path
    const relativePath = path.relative(process.cwd(), filePath);

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');

    // Broadcast update message
    this.broadcast({
      type: 'script-add',
      data: {
        timestamp: new Date(),
        path: relativePath,
        content
      }
    });
  }

  private handleStyleFileAdd(filePath: string): void {
    // Get relative path
    const relativePath = path.relative(process.cwd(), filePath);

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');

    // Broadcast update message
    this.broadcast({
      type: 'style-add',
      data: {
        timestamp: new Date(),
        path: relativePath,
        content
      }
    });
  }

  private handleHTMLFileAdd(filePath: string): void {
    // Get relative path
    const relativePath = path.relative(process.cwd(), filePath);

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');

    // Broadcast update message
    this.broadcast({
      type: 'html-add',
      data: {
        timestamp: new Date(),
        path: relativePath,
        content
      }
    });
  }

  private handleOtherFileAdd(filePath: string): void {
    // Get relative path
    const relativePath = path.relative(process.cwd(), filePath);

    // Broadcast update message
    this.broadcast({
      type: 'file-add',
      data: {
        timestamp: new Date(),
        path: relativePath
      }
    });
  }

  private handleScriptFileRemove(filePath: string): void {
    // Get relative path
    const relativePath = path.relative(process.cwd(), filePath);

    // Broadcast update message
    this.broadcast({
      type: 'script-remove',
      data: {
        timestamp: new Date(),
        path: relativePath
      }
    });
  }

  private handleStyleFileRemove(filePath: string): void {
    // Get relative path
    const relativePath = path.relative(process.cwd(), filePath);

    // Broadcast update message
    this.broadcast({
      type: 'style-remove',
      data: {
        timestamp: new Date(),
        path: relativePath
      }
    });
  }

  private handleHTMLFileRemove(filePath: string): void {
    // Get relative path
    const relativePath = path.relative(process.cwd(), filePath);

    // Broadcast update message
    this.broadcast({
      type: 'html-remove',
      data: {
        timestamp: new Date(),
        path: relativePath
      }
    });
  }

  private handleOtherFileRemove(filePath: string): void {
    // Get relative path
    const relativePath = path.relative(process.cwd(), filePath);

    // Broadcast update message
    this.broadcast({
      type: 'file-remove',
      data: {
        timestamp: new Date(),
        path: relativePath
      }
    });
  }

  private getFileHash(filePath: string): string {
    const crypto = require('crypto');
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private getCurrentState(): any {
    // Get current state of the application
    const stateManager = OneDot.getStateManager();
    const router = OneDot.getRouter();

    return {
      state: stateManager ? stateManager.getState() : null,
      route: router ? router.current : null,
      timestamp: new Date()
    };
  }

  private broadcast(message: any): void {
    const messageString = JSON.stringify(message);

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  }

  private log(level: string, ...args: any[]): void {
    if (this.options.quiet) return;

    const logLevels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = logLevels.indexOf(this.options.logLevel!);
    const messageLevelIndex = logLevels.indexOf(level);

    if (messageLevelIndex < currentLevelIndex) return;

    console[level]('[HMR]', ...args);
  }

  public getClientScript(): string {
    return `
      (function() {
        'use strict';

        // HMR client script
        const socket = new WebSocket('${this.options.serverUrl}');

        socket.onmessage = function(event) {
          try {
            const message = JSON.parse(event.data);

            switch (message.type) {
              case 'connected':
                console.log('[HMR] Connected to server');
                break;

              case 'reload':
                console.log('[HMR] Reloading page...');
                setTimeout(function() {
                  window.location.reload();
                }, message.data.delay || 0);
                break;

              case 'update':
                console.log('[HMR] Update received:', message.data);
                // Handle update
                break;

              case 'script-update':
                console.log('[HMR] Script updated:', message.data.path);
                // Handle script update
                break;

              case 'style-update':
                console.log('[HMR] Style updated:', message.data.path);
                // Handle style update
                break;

              case 'html-update':
                console.log('[HMR] HTML updated:', message.data.path);
                // Handle HTML update
                break;

              case 'file-update':
                console.log('[HMR] File updated:', message.data.path);
                // Handle file update
                break;

              case 'error':
                console.error('[HMR] Error:', message.data);
                // Handle error
                break;

              default:
                console.warn('[HMR] Unknown message type:', message.type);
            }
          } catch (error) {
            console.error('[HMR] Error parsing message:', error);
          }
        };

        socket.onopen = function() {
          console.log('[HMR] Connected to server');
        };

        socket.onclose = function() {
          console.log('[HMR] Disconnected from server');
        };

        socket.onerror = function(error) {
          console.error('[HMR] WebSocket error:', error);
        };

        // Expose HMR API
        window.__ONEDOT_HMR__ = {
          socket: socket,
          reload: function() {
            socket.send(JSON.stringify({
              type: 'reload'
            }));
          },
          update: function(data) {
            socket.send(JSON.stringify({
              type: 'update',
              data: data
            }));
          },
          sync: function() {
            socket.send(JSON.stringify({
              type: 'sync'
            }));
          }
        };
      })();
    `;
  }

  public getOverlayStyles(): string {
    return this.options.overlayStyles || `
      #onedot-hmr-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        padding: 10px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        font-family: monospace;
        font-size: 14px;
        z-index: 9999;
        text-align: center;
      }

      #onedot-hmr-overlay button {
        margin-left: 10px;
        padding: 5px 10px;
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      #onedot-hmr-overlay button:hover {
        background-color: #45a049;
      }
    `;
  }

  public injectClient(html: string): string {
    if (!this.options.injectClient) return html;

    // Inject client script
    const clientScript = this.getClientScript();
    const injectedHtml = html.replace(
      '</head>',
      `<script>${clientScript}</script></head>`
    );

    // Inject overlay styles if enabled
    if (this.options.overlay) {
      const overlayStyles = this.getOverlayStyles();
      return injectedHtml.replace(
        '</head>',
        `<style>${overlayStyles}</style></head>`
      );
    }

    return injectedHtml;
  }
}
