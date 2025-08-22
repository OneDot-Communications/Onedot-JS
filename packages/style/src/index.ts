export interface StyleObject { [k: string]: string | number | StyleObject | undefined; }

function kebab(prop: string): string { return prop.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()); }
function serialize(obj: StyleObject, path: string[] = [], out: string[] = []): string {
  const body: string[] = [];
  for (const [k,v] of Object.entries(obj)) {
    if (v && typeof v === 'object') {
      const selector = k.startsWith('&') ? path.join(' ').replace(/&/g,'') + k.slice(1) : [...path, k].join(' ');
      out.push(serialize(v as StyleObject, [selector], out));
    } else if (v !== undefined) {
      body.push(`${kebab(k)}:${v}`);
    }
  }
  if (body.length) out.push(`${path.join(' ')}{${body.join(';')}}`);
  return out.filter(Boolean).join('\n');
}

let styleEl: HTMLStyleElement | null = null;
const cache = new Map<string,string>();
export function css(styles: StyleObject): string {
  const key = JSON.stringify(styles);
  if (cache.has(key)) return cache.get(key)!;
  const text = serialize(styles);
  if (!styleEl) { styleEl = document.createElement('style'); document.head.appendChild(styleEl); }
  styleEl.appendChild(document.createTextNode(text));
  const className = 'od-' + (cache.size+1).toString(36);
  cache.set(key, className);
  return className;
}
