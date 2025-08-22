import fs from 'node:fs';
import path from 'node:path';

export async function createCommand(args: string[]) {
  const name = args[0] || 'my-onedot-app';
  const root = process.cwd();
  const appDir = path.join(root, name);
  if (fs.existsSync(appDir)) throw new Error('Directory exists');
  fs.mkdirSync(path.join(appDir,'app'), { recursive: true });
  fs.writeFileSync(path.join(appDir,'package.json'), JSON.stringify({ name, private: true, scripts: { dev: 'onedot dev', build: 'onedot build' } }, null, 2));
  fs.writeFileSync(path.join(appDir,'app','index.ts'), `import { h, render, useState } from '@onedot/core';\nfunction Counter(){ const [n,setN]=useState(0); return h('div',{}, h('h1',{},'Counter ', n), h('button',{onClick:()=>setN(n+1)},'Inc')); }\nrender(h(Counter,{}), { createElement: (t:any)=>document.createElement(t==='text'?'span':t), setText:(n:any,txt:string)=>n.textContent=txt, append:(p:any,c:any)=>p.appendChild(c), replace:(o:any,n:any)=>o.replaceWith(n), setProp:(n:any,k:string,v:any)=>{ if(k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(),v); else n.setAttribute(k,v); }, clear:(n:any)=>{ while(n.firstChild) n.removeChild(n.firstChild);} }, document.getElementById('app'));`);
  console.log('Created app', name);
}
