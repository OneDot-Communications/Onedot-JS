import { timeline, reset } from './index.js';

export function attachProfilerOverlay(intervalMs = 1000): void {
  if (typeof document === 'undefined') return;
  let panel = document.getElementById('onedot-profiler');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'onedot-profiler';
    Object.assign(panel.style, { position:'fixed', bottom:'0', right:'0', background:'rgba(0,0,0,0.7)', color:'#0f0', font:'12px monospace', padding:'6px', zIndex:'99999', maxWidth:'320px', maxHeight:'40vh', overflow:'auto' });
    document.body.appendChild(panel);
  }
  setInterval(()=>{
    const data = timeline().slice(-50);
    panel!.innerHTML = '<b>ONEDOT PROFILER</b><br>' + data.map(m=>`${m.name} @${m.time.toFixed(1)}`).join('<br>');
  }, intervalMs);
}