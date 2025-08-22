import { h, VNode } from '../../core/src/component.js';

export function renderToString(vnode: VNode): string {
  function walk(v: any): string {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    if (typeof v.type === 'function') {
      const compId = 'c' + Math.random().toString(36).slice(2,8);
      const out = (v.type as any)(v.props, { hooks: [], hookIndex: 0, state: {}, cleanup: [] });
      return `<onedot-frag data-od-comp="${compId}">${walk(out)}</onedot-frag>`;
    }
    const tag = v.type;
    const attrs = Object.entries(v.props||{}).map(([k,v])=>` ${k}="${escapeHtml(String(v))}"`).join('');
    const children = (v.children||[]).map((c:any)=>walk(c)).join('');
    return `<${tag}${attrs}>${children}</${tag}>`;
  }
  return walk(vnode);
}

  // Streaming SSR API
  export interface StreamChunk {
    id: number;
    html: string;
    flush: boolean;
  }

  export interface RenderStreamOptions {
    onChunk: (chunk: StreamChunk) => void;
    onEnd?: () => void;
    highWaterMark?: number; // number of buffered chars before forced flush
  }

  export function renderToStream(node: any, opts: RenderStreamOptions) {
    let chunkId = 0;
    let buffer = '';
    const hwm = opts.highWaterMark ?? 8192;
    function emit(flush: boolean) {
      if (!buffer) return;
      opts.onChunk({ id: chunkId++, html: buffer, flush });
      buffer = '';
    }
    function walk(n: any) {
      if (n == null || n === false) return;
      if (typeof n === 'string' || typeof n === 'number') {
        buffer += escapeHtml(String(n));
        if (buffer.length >= hwm) emit(false);
        return;
      }
      if (Array.isArray(n)) { n.forEach(walk); return; }
      if (typeof n.type === 'function') {
        const rendered = (n.type as any)({ ...(n.props||{}), children: n.children });
        walk(rendered);
        return;
      }
      if (typeof n.type === 'string') {
        buffer += `<${n.type}>`;
        if (n.children) n.children.forEach(walk);
        buffer += `</${n.type}>`;
        if (buffer.length >= hwm) emit(false);
        return;
      }
    }
    walk(node);
    emit(true);
    opts.onEnd && opts.onEnd();
  }

export function renderDocument(app: VNode, { title = 'ONEDOT App', hydrationId = 'od-root', assets = [] as string[] } = {}): string {
  const html = renderToString(app);
  const assetTags = assets.map(a=>`<script type="module" src="${a}" defer></script>`).join('');
  const hydrateScript = `<script type=module>
  (function(){
    const rootId='${hydrationId}';
    const root=document.getElementById(rootId);
    if(!root) return;
    // Future: selective component hydration; currently tags are markers
    const frags=[...root.querySelectorAll('onedot-frag[data-od-comp]')];
    frags.forEach(f=>{f.setAttribute('data-od-hydrated','1');});
  })();
  </script>`;
  return `<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>${title}</title></head><body><div id="${hydrationId}" data-od-hydrate="1">${html}</div>${assetTags}${hydrateScript}</body></html>`;
}

export interface StaticRoute { path: string; component: VNode; }
export function generateStaticSite(routes: StaticRoute[], outDir: string, writeFile: (file: string, content: string)=>void): void {
  for (const r of routes) {
    const doc = renderDocument(r.component, { title: 'ONEDOT ' + r.path, assets: ['/bundle.js'] });
  const file = r.path === '/' ? 'index.html' : r.path.replace(/\/$/, '') + '/index.html';
  const full = outDir ? (outDir.replace(/\/$/,'') + '/' + file) : file;
  writeFile(full, doc);
  }
}

function escapeHtml(s: string) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
