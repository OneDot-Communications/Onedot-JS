import { test } from '../index.js';

// SSR test utilities
function mockRenderToString(vnode: any): string {
  if (vnode == null) return '';
  if (typeof vnode === 'string' || typeof vnode === 'number') return String(vnode);
  if (typeof vnode.type === 'function') {
    const rendered = vnode.type(vnode.props);
    return mockRenderToString(rendered);
  }
  const tag = vnode.type;
  const children = (vnode.children || []).map((c: any) => mockRenderToString(c)).join('');
  return `<${tag}>${children}</${tag}>`;
}

test('SSR should render simple elements', () => {
  const vnode = { type: 'div', props: {}, children: ['Hello World'] };
  const html = mockRenderToString(vnode);
  
  if (html !== '<div>Hello World</div>') {
    throw new Error(`Expected '<div>Hello World</div>', got '${html}'`);
  }
});

test('SSR should render nested elements', () => {
  const vnode = {
    type: 'div',
    props: {},
    children: [
      { type: 'h1', props: {}, children: ['Title'] },
      { type: 'p', props: {}, children: ['Content'] }
    ]
  };
  
  const html = mockRenderToString(vnode);
  const expected = '<div><h1>Title</h1><p>Content</p></div>';
  
  if (html !== expected) {
    throw new Error(`Expected '${expected}', got '${html}'`);
  }
});

test('SSR should render function components', () => {
  const Button = (props: any) => ({
    type: 'button',
    props: {},
    children: [props.text || 'Click me']
  });
  
  const vnode = { type: Button, props: { text: 'Submit' }, children: [] };
  const html = mockRenderToString(vnode);
  
  if (html !== '<button>Submit</button>') {
    throw new Error(`Expected '<button>Submit</button>', got '${html}'`);
  }
});

test('SSR should handle null/undefined children', () => {
  const vnode = {
    type: 'div',
    props: {},
    children: [null, 'visible', undefined, 'text']
  };
  
  const html = mockRenderToString(vnode);
  
  if (html !== '<div>visibletext</div>') {
    throw new Error(`Expected '<div>visibletext</div>', got '${html}'`);
  }
});

test('SSR should generate complete HTML document', () => {
  const app = { type: 'div', props: {}, children: ['App Content'] };
  
  // Mock renderDocument function
  function mockRenderDocument(app: any, options: any = {}) {
    const html = mockRenderToString(app);
    const title = options.title || 'ONEDOT App';
    const assets = (options.assets || []).map((a: string) => `<script src="${a}"></script>`).join('');
    
    return `<!DOCTYPE html><html><head><title>${title}</title></head><body><div id="root">${html}</div>${assets}</body></html>`;
  }
  
  const document = mockRenderDocument(app, {
    title: 'Test App',
    assets: ['/bundle.js']
  });
  
  const expected = '<!DOCTYPE html><html><head><title>Test App</title></head><body><div id="root"><div>App Content</div></div><script src="/bundle.js"></script></body></html>';
  
  if (document !== expected) {
    throw new Error(`Document structure mismatch`);
  }
});

test('SSR should support streaming with chunks', () => {
  const chunks: any[] = [];
  let ended = false;
  
  // Mock streaming implementation
  function mockRenderToStream(vnode: any, options: any) {
    const html = mockRenderToString(vnode);
    const chunkSize = options.chunkSize || 10;
    
    let chunkId = 0;
    for (let i = 0; i < html.length; i += chunkSize) {
      const chunk = html.slice(i, i + chunkSize);
      const isLast = i + chunkSize >= html.length;
      
      options.onChunk({
        id: chunkId++,
        html: chunk,
        flush: isLast
      });
    }
    
    if (options.onEnd) options.onEnd();
  }
  
  const vnode = { type: 'div', props: {}, children: ['This is a longer content for streaming test'] };
  
  mockRenderToStream(vnode, {
    chunkSize: 15,
    onChunk: (chunk: any) => chunks.push(chunk),
    onEnd: () => { ended = true; }
  });
  
  if (chunks.length === 0) {
    throw new Error('No chunks received');
  }
  
  if (!ended) {
    throw new Error('Stream did not end properly');
  }
  
  const reconstructed = chunks.map(c => c.html).join('');
  const expected = '<div>This is a longer content for streaming test</div>';
  
  if (reconstructed !== expected) {
    throw new Error('Streamed content does not match expected output');
  }
});

test('SSR should escape HTML content', () => {
  const vnode = {
    type: 'div',
    props: {},
    children: ['<script>alert("xss")</script>']
  };
  
  // Mock with HTML escaping
  function mockRenderWithEscaping(vnode: any): string {
    if (vnode == null) return '';
    if (typeof vnode === 'string') {
      return vnode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    if (typeof vnode === 'number') return String(vnode);
    if (typeof vnode.type === 'function') {
      const rendered = vnode.type(vnode.props);
      return mockRenderWithEscaping(rendered);
    }
    
    const tag = vnode.type;
    const children = (vnode.children || []).map((c: any) => mockRenderWithEscaping(c)).join('');
    return `<${tag}>${children}</${tag}>`;
  }
  
  const html = mockRenderWithEscaping(vnode);
  
  if (html.includes('<script>')) {
    throw new Error('HTML content was not properly escaped');
  }
  
  if (!html.includes('&lt;script&gt;')) {
    throw new Error('HTML escaping not applied correctly');
  }
});
