// A frame recorder for checking the site on a real device. Open the site with ?perf and it logs how long every
// frame took, the long ones Chrome can explain (what script, style or layout held them up), and when each mode
// switch began and reached each step. A small panel shows the frame rate and copies a text report to paste.
// Nothing here loads without ?perf.

import { QUALITY } from './quality';

const MAX = 20000; // frames kept: about five minutes at 60 a second
const GAP = 25; // ms: a frame longer than this is a visible hitch at 60 a second

const r1 = (x) => Math.round(x * 10) / 10;
const sec = (ms) => `${(ms / 1000).toFixed(2)}s`;
const rel = (ms) => `${ms < 0 ? '-' : '+'}${sec(Math.abs(ms))}`;
const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;

export const startPerfLog = () => {
  const times = new Float64Array(MAX); const gaps = new Float32Array(MAX); let n = 0; let last = performance.now();
  const tick = (t) => { times[n % MAX] = t; gaps[n % MAX] = t - last; last = t; n += 1; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  const frames = (from, to) => {
    const out = [];
    for (let i = Math.max(0, n - MAX); i < n; i += 1) { const t = times[i % MAX]; if (t >= from && t < to) out.push([t, gaps[i % MAX]]); }
    return out;
  };

  const loafs = [];
  try {
    new PerformanceObserver((list) => { loafs.push(...list.getEntries()); if (loafs.length > 600) loafs.splice(0, loafs.length - 600); })
      .observe({ type: 'long-animation-frame', buffered: true });
  } catch { /* only Chrome reports these */ }

  const events = [];
  document.addEventListener('visibilitychange', () => events.push([performance.now(), `tab ${document.visibilityState}`]));
  document.addEventListener('webglcontextlost', () => events.push([performance.now(), 'WebGL context lost']), true);

  const device = () => {
    let gpu = 'unknown';
    try {
      const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch { /* no WebGL */ }
    const c = document.querySelector('.scene3d canvas');
    return [
      navigator.userAgent,
      `screen ${window.screen.width}x${window.screen.height} @${window.devicePixelRatio}x, window ${window.innerWidth}x${window.innerHeight}, canvas ${c ? `${c.width}x${c.height}` : 'none'}`,
      `gpu ${gpu}; quality ${JSON.stringify(QUALITY)}`
    ].join('\n');
  };

  const summary = (list) => {
    const d = list.map(([, g]) => g).sort((a, b) => a - b);
    return `${list.length} frames, median ${r1(pct(d, 0.5))}ms, p95 ${r1(pct(d, 0.95))}ms, worst ${r1(d.at(-1) ?? 0)}ms`;
  };

  const report = () => {
    const now = performance.now();
    const marks = performance.getEntriesByType('mark').filter((m) => m.name.startsWith('shift:'));
    const starts = marks.filter((m) => m.name === 'shift:start');
    const lines = ['portfolio perf log', device(), `recorded ${sec(now)} since load, ${n} frames`, ''];
    const firstSwitch = starts[0]?.startTime ?? now;
    lines.push(`idle, 5s before the first switch: ${summary(frames(Math.max(0, firstSwitch - 5000), firstSwitch))}`);
    starts.forEach((s, i) => {
      const t0 = s.startTime; const t1 = starts[i + 1]?.startTime ?? now; const end = Math.min(t1, t0 + 3000);
      const list = frames(t0, end);
      lines.push('', `switch ${i + 1}, ${s.detail} at ${sec(t0)}: ${summary(list)}`);
      const steps = marks.filter((m) => m.startTime >= t0 && m.startTime < t1 && m !== s).map((m) => `${m.name.slice(6)} ${rel(m.startTime - t0)}`);
      if (steps.length) lines.push(`  steps: ${steps.join(', ')}`);
      const slow = list.filter(([, g]) => g > GAP);
      lines.push(`  hitches over ${GAP}ms: ${slow.length ? slow.map(([t, g]) => `${rel(t - t0)} ${Math.round(g)}ms`).join(', ') : 'none'}`);
      loafs.filter((l) => l.startTime >= t0 - 100 && l.startTime < end).forEach((l) => {
        const scripts = (l.scripts || []).filter((x) => x.duration > 5).sort((a, b) => b.duration - a.duration).slice(0, 3)
          .map((x) => `${x.invoker || x.invokerType} ${(x.sourceURL || '').split('/').pop()}:${x.sourceFunctionName || '?'} ${Math.round(x.duration)}ms`);
        const style = l.styleAndLayoutStart ? Math.round(l.startTime + l.duration - l.styleAndLayoutStart) : 0;
        lines.push(`  long frame ${rel(l.startTime - t0)} ${Math.round(l.duration)}ms (blocking ${Math.round(l.blockingDuration)}ms, style+layout ${style}ms)${scripts.length ? `: ${scripts.join('; ')}` : ''}`);
      });
    });
    if (events.length) lines.push('', `events: ${events.map(([t, e]) => `${sec(t)} ${e}`).join(', ')}`);
    return lines.join('\n');
  };

  // The panel: frame rate over the last second, and the copy button
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;left:max(8px,env(safe-area-inset-left));bottom:max(8px,env(safe-area-inset-bottom));z-index:99999;font:12px/1.4 ui-monospace,monospace;background:rgba(20,20,24,.88);color:#fff;padding:8px 10px;border-radius:10px;display:flex;gap:10px;align-items:center;pointer-events:auto';
  const fps = document.createElement('span');
  const copy = document.createElement('button');
  copy.textContent = 'Copy log';
  copy.style.cssText = 'font:inherit;color:#111;background:#ffb38a;border:0;border-radius:6px;padding:4px 8px;cursor:pointer';
  panel.append(fps, copy);
  document.body.append(panel);
  setInterval(() => {
    const now = performance.now(); const list = frames(now - 1000, now);
    fps.textContent = `${list.length} fps · worst ${Math.round(Math.max(0, ...list.map(([, g]) => g)))}ms`;
  }, 500);

  copy.addEventListener('click', () => {
    const text = report();
    const shown = () => {
      // where the clipboard is refused, show the report to select by hand
      const box = document.createElement('textarea');
      box.value = text; box.readOnly = true;
      box.style.cssText = 'position:fixed;inset:10% 5%;z-index:100000;font:11px ui-monospace,monospace;background:#fff;color:#111;padding:10px';
      box.addEventListener('blur', () => box.remove());
      document.body.append(box); box.focus(); box.select();
    };
    navigator.clipboard?.writeText(text).then(() => { copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy log'; }, 1500); }, shown) ?? shown();
  });
};
