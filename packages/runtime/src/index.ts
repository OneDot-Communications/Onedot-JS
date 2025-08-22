export * from './webHost.js';
export * from './ssr.js';
export * from './sandbox.js';
export * from './edge.js';
export * from './deploy.js';

// Streaming re-export types
export type { StreamChunk, RenderStreamOptions } from './ssr.js';

// Service worker registration utility
export function registerServiceWorker(path: string) {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register(path).catch(()=>{});
  }
}

// Dynamic chunk loader (simple manifest-driven)
const loaded: Record<string, Promise<any>> = {};
export async function loadChunk(src: string) {
  if (Object.prototype.hasOwnProperty.call(loaded, src)) return loaded[src];
  loaded[src] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => res(true);
    s.onerror = (e) => rej(e);
    document.head.appendChild(s);
  });
  return loaded[src];
}
