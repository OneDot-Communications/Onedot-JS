// Secure JavaScript execution sandbox with CSP and isolation
export interface SandboxOptions {
  allowedGlobals?: string[];
  maxExecutionTime?: number;
  allowHttpRequests?: boolean;
  allowLocalStorage?: boolean;
  allowConsole?: boolean;
  cspNonce?: string;
  timeoutMs?: number;
  globals?: Record<string, any>;
}

export interface SandboxResult<T = any> {
  result?: T;
  error?: Error;
  executionTime: number;
  memoryUsage?: number;
}

export class SecureSandbox {
  private options: Required<SandboxOptions>;
  private iframe: HTMLIFrameElement | null = null;
  private worker: Worker | null = null;

  constructor(options: SandboxOptions = {}) {
    this.options = {
      allowedGlobals: options.allowedGlobals || [],
      maxExecutionTime: options.maxExecutionTime || options.timeoutMs || 5000,
      allowHttpRequests: options.allowHttpRequests || false,
      allowLocalStorage: options.allowLocalStorage || false,
      allowConsole: options.allowConsole || true,
      cspNonce: options.cspNonce || this.generateNonce(),
      timeoutMs: options.timeoutMs || 5000,
      globals: options.globals || {}
    };
  }

  async executeCode<T = any>(code: string): Promise<SandboxResult<T>> {
    const startTime = performance.now();
    
    try {
      const result = await this.executeInIframe<T>(code);
      const executionTime = performance.now() - startTime;
      
      return {
        result,
        executionTime,
        memoryUsage: this.getMemoryUsage()
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      return {
        error: error as Error,
        executionTime
      };
    }
  }

  async executeInWorker<T = any>(code: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const workerCode = this.buildWorkerCode(code);
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      const worker = new Worker(workerUrl);
      const timeoutId = setTimeout(() => {
        worker.terminate();
        reject(new Error('Execution timeout'));
      }, this.options.maxExecutionTime);

      worker.onmessage = (event) => {
        clearTimeout(timeoutId);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.result);
        }
      };

      worker.onerror = (error) => {
        clearTimeout(timeoutId);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        reject(error);
      };

      worker.postMessage({ code });
    });
  }

  private async executeInIframe<T = any>(code: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      
      // Enhanced security attributes
      iframe.setAttribute('sandbox', this.buildSandboxPolicy());
      iframe.setAttribute('csp', this.buildCSP());
      
      const timeoutId = setTimeout(() => {
        document.body.removeChild(iframe);
        reject(new Error('Execution timeout'));
      }, this.options.maxExecutionTime);

      iframe.onload = () => {
        try {
          const iframeWindow = iframe.contentWindow;
          if (!iframeWindow) {
            throw new Error('Cannot access iframe window');
          }

          // Set up secure execution environment
          this.setupSecureEnvironment(iframeWindow);
          
          // Execute code with timeout
          const result = iframeWindow.eval(`
            (function() {
              "use strict";
              ${code}
            })()
          `);

          clearTimeout(timeoutId);
          document.body.removeChild(iframe);
          resolve(result);
        } catch (error) {
          clearTimeout(timeoutId);
          document.body.removeChild(iframe);
          reject(error);
        }
      };

      // Create secure iframe document
      const secureHTML = this.buildSecureHTML(code);
      iframe.srcdoc = secureHTML;
      document.body.appendChild(iframe);
    });
  }

  private buildWorkerCode(userCode: string): string {
    const allowedGlobals = this.options.allowedGlobals.join(',');
    
    return `
      // Secure worker execution environment
      const secureGlobals = new Set([${allowedGlobals.split(',').map(g => `'${g}'`).join(',')}]);
      
      // Override global access
      const originalPostMessage = self.postMessage;
      const secureConsole = ${this.options.allowConsole ? 'console' : 'undefined'};
      
      // Whitelist approach for globals
      const secureGlobalHandler = {
        get(target, prop) {
          if (secureGlobals.has(prop) || prop in target) {
            return target[prop];
          }
          throw new Error(\`Access to global '\${prop}' is not allowed\`);
        },
        set(target, prop, value) {
          if (secureGlobals.has(prop)) {
            target[prop] = value;
            return true;
          }
          throw new Error(\`Cannot set global '\${prop}'\`);
        }
      };
      
      self.onmessage = async function(event) {
        try {
          const startTime = performance.now();
          
          // Execute user code in restricted environment
          const result = await (function() {
            "use strict";
            const console = secureConsole;
            ${userCode}
          })();
          
          const executionTime = performance.now() - startTime;
          
          originalPostMessage.call(self, {
            result,
            executionTime
          });
        } catch (error) {
          originalPostMessage.call(self, {
            error: error.message
          });
        }
      };
    `;
  }

  private buildSecureHTML(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="Content-Security-Policy" content="${this.buildCSP()}">
        <meta charset="utf-8">
      </head>
      <body>
        <script nonce="${this.options.cspNonce}">
          // Secure execution wrapper
          (function() {
            "use strict";
            
            // Remove dangerous globals
            ${!this.options.allowHttpRequests ? 'delete window.fetch; delete window.XMLHttpRequest;' : ''}
            ${!this.options.allowLocalStorage ? 'delete window.localStorage; delete window.sessionStorage;' : ''}
            ${!this.options.allowConsole ? 'delete window.console;' : ''}
            
            // Override eval and Function constructor
            window.eval = function() {
              throw new Error('eval is not allowed in sandbox');
            };
            window.Function = function() {
              throw new Error('Function constructor is not allowed in sandbox');
            };
            
            // Restrict access to parent window
            delete window.parent;
            delete window.top;
            delete window.frameElement;
            
            // Execute user code
            try {
              ${code}
            } catch (error) {
              throw error;
            }
          })();
        </script>
      </body>
      </html>
    `;
  }

  private buildSandboxPolicy(): string {
    const policies = ['allow-scripts'];
    
    if (this.options.allowHttpRequests) {
      policies.push('allow-same-origin');
    }
    
    return policies.join(' ');
  }

  private buildCSP(): string {
    const directives = [
      `default-src 'none'`,
      `script-src 'nonce-${this.options.cspNonce}'`,
      `style-src 'unsafe-inline'`
    ];
    
    if (this.options.allowHttpRequests) {
      directives.push(`connect-src 'self'`);
    }
    
    return directives.join('; ');
  }

  private setupSecureEnvironment(iframeWindow: Window): void {
    // Remove or restrict dangerous APIs
    if (!this.options.allowHttpRequests) {
      delete (iframeWindow as any).fetch;
      delete (iframeWindow as any).XMLHttpRequest;
    }
    
    if (!this.options.allowLocalStorage) {
      delete (iframeWindow as any).localStorage;
      delete (iframeWindow as any).sessionStorage;
    }
    
    if (!this.options.allowConsole) {
      delete (iframeWindow as any).console;
    }
    
    // Override dangerous functions
    (iframeWindow as any).eval = function() {
      throw new Error('eval is not allowed in sandbox');
    };
    
    (iframeWindow as any).Function = function() {
      throw new Error('Function constructor is not allowed in sandbox');
    };
  }

  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  dispose(): void {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Legacy compatibility sandbox (simpler API)
export class Sandbox {
  private iframe: HTMLIFrameElement;
  private ready = false;
  private queue: (()=>void)[] = [];
  
  constructor(private opts: SandboxOptions = {}) {
    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute('sandbox', 'allow-scripts');
    this.iframe.style.display = 'none';
    document.body.appendChild(this.iframe);
    
    const doc = this.iframe.contentDocument!;
    doc.open();
    doc.write(`<script>
      window.__ONEDOT_CHANNEL__=[];
      window.addEventListener('message',e=>{
        if(e.data&&e.data.type==='exec'){
          try{
            const r=eval(e.data.code);
            parent.postMessage({type:'result',id:e.data.id,result:r},'*')
          }catch(err){
            parent.postMessage({type:'error',id:e.data.id,error:String(err)},'*')
          }
        }
      });
    </script>`);
    doc.close();
    
    window.addEventListener('message', (e)=>{
      // Channel management handled by promise resolution
    });
    
    this.ready = true;
    this.queue.forEach(fn=>fn());
    this.queue.length = 0;
  }
  
  exec(code: string): Promise<any> {
    return new Promise((resolve,reject)=>{
      const id = Math.random().toString(36).slice(2);
      const listener = (e: MessageEvent): void => {
        if (e.data && e.data.id === id) {
          window.removeEventListener('message', listener);
          if (e.data.type === 'result') resolve(e.data.result);
          else reject(new Error(e.data.error));
        }
      };
      window.addEventListener('message', listener);
      const send = () => this.iframe.contentWindow!.postMessage({ type:'exec', code, id }, '*');
      if (this.ready) send(); else this.queue.push(send);
    });
  }
}

// Utility function for quick sandboxed execution
export async function executeSafely<T = any>(
  code: string, 
  options?: SandboxOptions
): Promise<SandboxResult<T>> {
  const sandbox = new SecureSandbox(options);
  try {
    return await sandbox.executeCode<T>(code);
  } finally {
    sandbox.dispose();
  }
}

// Template literal sandbox for safe string interpolation
export function safeTpl(strings: TemplateStringsArray, ...values: any[]): string {
  let result = strings[0];
  
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    
    // Sanitize values to prevent injection
    const sanitized = typeof value === 'string' 
      ? value.replace(/[<>&"']/g, char => ({
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#39;'
        }[char] || char))
      : String(value);
    
    result += sanitized + strings[i + 1];
  }
  
  return result;
}

export default SecureSandbox;