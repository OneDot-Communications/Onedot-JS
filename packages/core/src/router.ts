// File-based router with dynamic params and nested layouts
export interface RouteMatch { params: Record<string,string>; component: any; path: string; }

export interface RouteNode { name: string; segment: string; dynamic?: boolean; children: RouteNode[]; component?: any; layout?: any; }

export class Router {
  private root: RouteNode = { name: '', segment: '', children: [] };
  private listeners: ((path:string)=>void)[] = [];
  private currentPath: string = '/';
  register(path: string, component: any) {
    const parts = path.replace(/(^\/|\/$)/g,'').split('/').filter(Boolean);
    let node = this.root;
    for (const p of parts) {
      const dynamic = p.startsWith('[') && p.endsWith(']');
      const segment = dynamic ? p.slice(1,-1) : p;
      let child = node.children.find(c=>c.name===p);
      if (!child) { child = { name: p, segment, dynamic, children: [] }; node.children.push(child); }
      node = child;
    }
    node.component = component;
  }
  navigate(path: string) { this.currentPath = path; this.listeners.forEach(l=>l(path)); }
  get path() { return this.currentPath; }
  onChange(cb:(path:string)=>void) { this.listeners.push(cb); }
  match(path: string): RouteMatch | null {
    const parts = path.replace(/(^\/|\/$)/g,'').split('/').filter(Boolean);
    let params: Record<string,string> = {};
    let node: RouteNode = this.root;
    for (const part of parts) {
      let exact = node.children.find(c=>!c.dynamic && c.segment===part);
      if (exact) { node = exact; continue; }
      let dyn = node.children.find(c=>c.dynamic);
      if (dyn) { params[dyn.segment] = part; node = dyn; continue; }
      return null;
    }
    if (node.component) return { params, component: node.component, path };
    return null;
  }
}
