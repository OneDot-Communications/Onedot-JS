// Security policy generation and sandbox management for ONEDOT-JS

export interface SecurityPolicy {
  csp: ContentSecurityPolicy;
  sandbox: SandboxPolicy;
  permissions: PermissionsPolicy;
  integrity: IntegrityPolicy;
}

export interface ContentSecurityPolicy {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  fontSrc: string[];
  connectSrc: string[];
  mediaSrc: string[];
  objectSrc: string[];
  frameSrc: string[];
  childSrc: string[];
  formAction: string[];
  frameAncestors: string[];
  baseUri: string[];
  upgradeInsecureRequests: boolean;
  blockAllMixedContent: boolean;
  requireSriFor: string[];
  reportUri?: string[];
  reportTo?: string;
}

export interface SandboxPolicy {
  allowScripts: boolean;
  allowSameOrigin: boolean;
  allowForms: boolean;
  allowPopups: boolean;
  allowPointerLock: boolean;
  allowOrientationLock: boolean;
  allowPresentation: boolean;
  allowTopNavigation: boolean;
  allowTopNavigationByUserActivation: boolean;
  allowModals: boolean;
  allowDownloads: boolean;
  allowStorageAccessByUserActivation: boolean;
}

export interface PermissionsPolicy {
  accelerometer: PermissionDirective;
  ambientLightSensor: PermissionDirective;
  autoplay: PermissionDirective;
  battery: PermissionDirective;
  camera: PermissionDirective;
  displayCapture: PermissionDirective;
  documentDomain: PermissionDirective;
  encryptedMedia: PermissionDirective;
  executionWhileNotRendered: PermissionDirective;
  executionWhileOutOfViewport: PermissionDirective;
  fullscreen: PermissionDirective;
  gamepad: PermissionDirective;
  geolocation: PermissionDirective;
  gyroscope: PermissionDirective;
  hid: PermissionDirective;
  identityCredentialsGet: PermissionDirective;
  idleDetection: PermissionDirective;
  localFonts: PermissionDirective;
  magnetometer: PermissionDirective;
  microphone: PermissionDirective;
  midi: PermissionDirective;
  otpCredentials: PermissionDirective;
  payment: PermissionDirective;
  pictureInPicture: PermissionDirective;
  publickeyCredentialsGet: PermissionDirective;
  screenWakeLock: PermissionDirective;
  serial: PermissionDirective;
  speakerSelection: PermissionDirective;
  usb: PermissionDirective;
  webShare: PermissionDirective;
  xrSpatialTracking: PermissionDirective;
}

export type PermissionDirective = 'self' | 'none' | '*' | string[];

export interface IntegrityPolicy {
  enableSRI: boolean;
  hashAlgorithm: 'sha256' | 'sha384' | 'sha512';
  enforceIntegrity: boolean;
  trustedOrigins: string[];
}

export interface NonceManager {
  generateNonce(): string;
  validateNonce(nonce: string): boolean;
  rotateNonces(): void;
  getCurrentNonce(): string;
}

export interface SandboxExecutor {
  execute<T>(code: string, context: SandboxContext): Promise<T>;
  evaluateModule(moduleCode: string, context: SandboxContext): Promise<any>;
  createContext(policy: SandboxPolicy): SandboxContext;
  destroyContext(context: SandboxContext): void;
}

export interface SandboxContext {
  id: string;
  policy: SandboxPolicy;
  globals: Record<string, any>;
  modules: Map<string, any>;
  cleanup: (() => void)[];
}

export class SecurityPolicyGenerator {
  private static readonly DEFAULT_CSP: ContentSecurityPolicy = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'blob:'],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    mediaSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    childSrc: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    upgradeInsecureRequests: true,
    blockAllMixedContent: true,
    requireSriFor: ['script', 'style'],
  };

  private static readonly DEFAULT_SANDBOX: SandboxPolicy = {
    allowScripts: true,
    allowSameOrigin: false,
    allowForms: false,
    allowPopups: false,
    allowPointerLock: false,
    allowOrientationLock: false,
    allowPresentation: false,
    allowTopNavigation: false,
    allowTopNavigationByUserActivation: false,
    allowModals: false,
    allowDownloads: false,
    allowStorageAccessByUserActivation: false,
  };

  private static readonly DEFAULT_PERMISSIONS: PermissionsPolicy = {
    accelerometer: 'none',
    ambientLightSensor: 'none',
    autoplay: 'self',
    battery: 'none',
    camera: 'none',
    displayCapture: 'none',
    documentDomain: 'none',
    encryptedMedia: 'self',
    executionWhileNotRendered: 'self',
    executionWhileOutOfViewport: 'self',
    fullscreen: 'self',
    gamepad: 'none',
    geolocation: 'none',
    gyroscope: 'none',
    hid: 'none',
    identityCredentialsGet: 'none',
    idleDetection: 'none',
    localFonts: 'none',
    magnetometer: 'none',
    microphone: 'none',
    midi: 'none',
    otpCredentials: 'none',
    payment: 'none',
    pictureInPicture: 'self',
    publickeyCredentialsGet: 'none',
    screenWakeLock: 'none',
    serial: 'none',
    speakerSelection: 'none',
    usb: 'none',
    webShare: 'none',
    xrSpatialTracking: 'none',
  };

  private static readonly DEFAULT_INTEGRITY: IntegrityPolicy = {
    enableSRI: true,
    hashAlgorithm: 'sha384',
    enforceIntegrity: true,
    trustedOrigins: [],
  };

  static generatePolicy(options: Partial<SecurityPolicy> = {}): SecurityPolicy {
    return {
      csp: { ...this.DEFAULT_CSP, ...options.csp },
      sandbox: { ...this.DEFAULT_SANDBOX, ...options.sandbox },
      permissions: { ...this.DEFAULT_PERMISSIONS, ...options.permissions },
      integrity: { ...this.DEFAULT_INTEGRITY, ...options.integrity },
    };
  }

  static generateCSPHeader(csp: ContentSecurityPolicy, nonce?: string): string {
    const directives: string[] = [];

    const addDirective = (name: string, values: string[]) => {
      if (values.length > 0) {
        let directive = `${name} ${values.join(' ')}`;
        if (nonce && (name === 'script-src' || name === 'style-src')) {
          directive += ` 'nonce-${nonce}'`;
        }
        directives.push(directive);
      }
    };

    addDirective('default-src', csp.defaultSrc);
    addDirective('script-src', csp.scriptSrc);
    addDirective('style-src', csp.styleSrc);
    addDirective('img-src', csp.imgSrc);
    addDirective('font-src', csp.fontSrc);
    addDirective('connect-src', csp.connectSrc);
    addDirective('media-src', csp.mediaSrc);
    addDirective('object-src', csp.objectSrc);
    addDirective('frame-src', csp.frameSrc);
    addDirective('child-src', csp.childSrc);
    addDirective('form-action', csp.formAction);
    addDirective('frame-ancestors', csp.frameAncestors);
    addDirective('base-uri', csp.baseUri);

    if (csp.upgradeInsecureRequests) {
      directives.push('upgrade-insecure-requests');
    }

    if (csp.blockAllMixedContent) {
      directives.push('block-all-mixed-content');
    }

    if (csp.requireSriFor.length > 0) {
      directives.push(`require-sri-for ${csp.requireSriFor.join(' ')}`);
    }

    if (csp.reportUri && csp.reportUri.length > 0) {
      addDirective('report-uri', csp.reportUri);
    }

    if (csp.reportTo) {
      directives.push(`report-to ${csp.reportTo}`);
    }

    return directives.join('; ');
  }

  static generateSandboxHeader(sandbox: SandboxPolicy): string {
    const flags: string[] = [];

    if (sandbox.allowScripts) flags.push('allow-scripts');
    if (sandbox.allowSameOrigin) flags.push('allow-same-origin');
    if (sandbox.allowForms) flags.push('allow-forms');
    if (sandbox.allowPopups) flags.push('allow-popups');
    if (sandbox.allowPointerLock) flags.push('allow-pointer-lock');
    if (sandbox.allowOrientationLock) flags.push('allow-orientation-lock');
    if (sandbox.allowPresentation) flags.push('allow-presentation');
    if (sandbox.allowTopNavigation) flags.push('allow-top-navigation');
    if (sandbox.allowTopNavigationByUserActivation) flags.push('allow-top-navigation-by-user-activation');
    if (sandbox.allowModals) flags.push('allow-modals');
    if (sandbox.allowDownloads) flags.push('allow-downloads');
    if (sandbox.allowStorageAccessByUserActivation) flags.push('allow-storage-access-by-user-activation');

    return flags.join(' ');
  }

  static generatePermissionsHeader(permissions: PermissionsPolicy): string {
    const directives: string[] = [];

    for (const [feature, directive] of Object.entries(permissions)) {
      if (directive === 'none') {
        directives.push(`${feature}=()`);
      } else if (directive === 'self') {
        directives.push(`${feature}=(self)`);
      } else if (directive === '*') {
        directives.push(`${feature}=*`);
      } else if (Array.isArray(directive)) {
        directives.push(`${feature}=(${directive.map(origin => `"${origin}"`).join(' ')})`);
      }
    }

    return directives.join(', ');
  }

  static async generateIntegrityHash(content: string, algorithm: 'sha256' | 'sha384' | 'sha512'): Promise<string> {
    if (globalThis.crypto && globalThis.crypto.subtle) {
      // Browser environment
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hash = await globalThis.crypto.subtle.digest(algorithm.toUpperCase(), data);
      const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
      return `${algorithm}-${base64}`;
    } else {
      // Node.js environment - simplified hash generation
      let simpleHash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        simpleHash = ((simpleHash << 5) - simpleHash) + char;
        simpleHash = simpleHash & simpleHash; // Convert to 32-bit integer
      }
      const base64 = btoa(Math.abs(simpleHash).toString(16));
      return `${algorithm}-${base64}`;
    }
  }
}

export class NonceManagerImpl implements NonceManager {
  private currentNonce: string = '';
  private validNonces: Set<string> = new Set();
  private rotationInterval: number | null = null;

  constructor(private rotationIntervalMs: number = 300000) { // 5 minutes
    this.rotateNonces();
    this.startRotation();
  }

  generateNonce(): string {
    const array = new Uint8Array(32);
    if (globalThis.crypto && globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues(array);
    } else {
      // Fallback random generation
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    
    const nonce = btoa(String.fromCharCode(...array)).replace(/[+/=]/g, '');
    this.validNonces.add(nonce);
    return nonce;
  }

  validateNonce(nonce: string): boolean {
    return this.validNonces.has(nonce);
  }

  rotateNonces(): void {
    this.currentNonce = this.generateNonce();
    // Keep last 3 nonces valid for race conditions
    if (this.validNonces.size > 3) {
      const nonces = Array.from(this.validNonces);
      this.validNonces.clear();
      nonces.slice(-3).forEach(n => this.validNonces.add(n));
    }
  }

  getCurrentNonce(): string {
    return this.currentNonce;
  }

  private startRotation(): void {
    this.rotationInterval = setInterval(() => {
      this.rotateNonces();
    }, this.rotationIntervalMs) as any;
  }

  destroy(): void {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
    this.validNonces.clear();
  }
}

export class SandboxExecutorImpl implements SandboxExecutor {
  private contexts: Map<string, SandboxContext> = new Map();
  private contextCounter = 0;

  async execute<T>(code: string, context: SandboxContext): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        // Create isolated execution environment
        const iframe = this.createSandboxIframe(context);
        
        const messageHandler = (event: MessageEvent) => {
          if (event.source === iframe.contentWindow) {
            window.removeEventListener('message', messageHandler);
            document.body.removeChild(iframe);
            
            if (event.data.type === 'execution-result') {
              resolve(event.data.result);
            } else if (event.data.type === 'execution-error') {
              reject(new Error(event.data.error));
            }
          }
        };

        window.addEventListener('message', messageHandler);

        // Send code for execution
        iframe.onload = () => {
          iframe.contentWindow?.postMessage({
            type: 'execute',
            code,
            context: this.serializeContext(context)
          }, '*');
        };

        // Timeout protection
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          reject(new Error('Execution timeout'));
        }, 30000); // 30 second timeout

      } catch (error) {
        reject(error);
      }
    });
  }

  async evaluateModule(moduleCode: string, context: SandboxContext): Promise<any> {
    const wrappedCode = `
      (function() {
        const module = { exports: {} };
        const exports = module.exports;
        ${moduleCode}
        return module.exports;
      })()
    `;
    
    return this.execute(wrappedCode, context);
  }

  createContext(policy: SandboxPolicy): SandboxContext {
    const id = `sandbox_${++this.contextCounter}_${Date.now()}`;
    const context: SandboxContext = {
      id,
      policy,
      globals: this.createSafeGlobals(),
      modules: new Map(),
      cleanup: []
    };

    this.contexts.set(id, context);
    return context;
  }

  destroyContext(context: SandboxContext): void {
    context.cleanup.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    });

    this.contexts.delete(context.id);
  }

  private createSandboxIframe(context: SandboxContext): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox = this.generateSandboxFlags(context.policy);
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body>
          <script>
            window.addEventListener('message', function(event) {
              if (event.data.type === 'execute') {
                try {
                  const globals = event.data.context.globals;
                  const code = event.data.code;
                  
                  // Create execution environment
                  const sandbox = {
                    console: {
                      log: function() { /* restricted */ },
                      error: function() { /* restricted */ },
                      warn: function() { /* restricted */ }
                    },
                    setTimeout: function() { throw new Error('setTimeout not allowed'); },
                    setInterval: function() { throw new Error('setInterval not allowed'); },
                    fetch: function() { throw new Error('fetch not allowed'); },
                    XMLHttpRequest: function() { throw new Error('XMLHttpRequest not allowed'); }
                  };
                  
                  // Merge with allowed globals
                  Object.assign(sandbox, globals);
                  
                  // Execute in restricted environment
                  const fn = new Function('sandbox', 'with(sandbox) { return (' + code + '); }');
                  const result = fn(sandbox);
                  
                  parent.postMessage({
                    type: 'execution-result',
                    result: result
                  }, '*');
                  
                } catch (error) {
                  parent.postMessage({
                    type: 'execution-error',
                    error: error.message
                  }, '*');
                }
              }
            });
          </script>
        </body>
      </html>
    `;

    iframe.srcdoc = html;
    document.body.appendChild(iframe);
    return iframe;
  }

  private generateSandboxFlags(policy: SandboxPolicy): string {
    const flags: string[] = [];

    if (policy.allowScripts) flags.push('allow-scripts');
    if (policy.allowSameOrigin) flags.push('allow-same-origin');
    if (policy.allowForms) flags.push('allow-forms');
    if (policy.allowPopups) flags.push('allow-popups');
    if (policy.allowPointerLock) flags.push('allow-pointer-lock');
    if (policy.allowOrientationLock) flags.push('allow-orientation-lock');
    if (policy.allowPresentation) flags.push('allow-presentation');
    if (policy.allowTopNavigation) flags.push('allow-top-navigation');
    if (policy.allowTopNavigationByUserActivation) flags.push('allow-top-navigation-by-user-activation');
    if (policy.allowModals) flags.push('allow-modals');
    if (policy.allowDownloads) flags.push('allow-downloads');
    if (policy.allowStorageAccessByUserActivation) flags.push('allow-storage-access-by-user-activation');

    return flags.join(' ');
  }

  private createSafeGlobals(): Record<string, any> {
    return {
      Array, Object, String, Number, Boolean, Date, Math, JSON,
      Promise, Error, TypeError, ReferenceError, SyntaxError,
      parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent
    };
  }

  private serializeContext(context: SandboxContext): any {
    return {
      id: context.id,
      policy: context.policy,
      globals: context.globals
    };
  }
}

// Utility functions for security headers
export function generateSecurityHeaders(policy: SecurityPolicy, nonce?: string): Record<string, string> {
  const headers: Record<string, string> = {};

  headers['Content-Security-Policy'] = SecurityPolicyGenerator.generateCSPHeader(policy.csp, nonce);
  headers['X-Frame-Options'] = 'DENY';
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-XSS-Protection'] = '1; mode=block';
  headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
  headers['Permissions-Policy'] = SecurityPolicyGenerator.generatePermissionsHeader(policy.permissions);
  
  const sandboxHeader = SecurityPolicyGenerator.generateSandboxHeader(policy.sandbox);
  if (sandboxHeader) {
    headers['Content-Security-Policy'] += `; sandbox ${sandboxHeader}`;
  }

  return headers;
}

export function injectSecurityMeta(html: string, policy: SecurityPolicy, nonce?: string): string {
  const metaTags: string[] = [];

  // CSP meta tag
  const cspHeader = SecurityPolicyGenerator.generateCSPHeader(policy.csp, nonce);
  metaTags.push(`<meta http-equiv="Content-Security-Policy" content="${cspHeader}">`);

  // Other security meta tags
  metaTags.push('<meta http-equiv="X-Content-Type-Options" content="nosniff">');
  metaTags.push('<meta http-equiv="X-Frame-Options" content="DENY">');
  metaTags.push('<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">');

  // Inject meta tags into head
  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch) {
    const insertPosition = headMatch.index! + headMatch[0].length;
    return html.slice(0, insertPosition) + '\n' + metaTags.join('\n') + html.slice(insertPosition);
  }

  return html;
}

// Default exports
export const defaultNonceManager = new NonceManagerImpl();
export const defaultSandboxExecutor = new SandboxExecutorImpl();
export const defaultSecurityPolicy = SecurityPolicyGenerator.generatePolicy();
