// The switch between the dark mode's prism and the light mode's bubbles, played as one piece. Going to light,
// the beam overloads the prism and it shatters, the white floods out from where it stood and its shards round
// off into bubbles. Going to dark, the bubbles burst from the outside in, their droplets spiral into the centre
// as the dark closes behind them, and the prism forms from the flash. The page's colour sweeps in along the
// one circle described here, drawn by the scene itself.

export const SHATTER = { BREAK: 0.34, WIPE: 1.15, END: 2.05 };
export const VORTEX = { IRIS_AT: 0.28, IRIS: 1.05, FORM: 1.42, END: 2.4 };

// Where the prism stands (the middle of its triangle, in scene units), and the triangle itself
export const CENTRE = { x: 0, y: -0.32 };
export const TRIANGLE = [[0, 1.57], [-1.63, -1.27], [1.63, -1.27]];
export const ZOOM = 60; // the camera's: px per scene unit

const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
export const easeOut3 = (x) => 1 - (1 - clamp01(x)) ** 3;
export const easeInOut3 = (x) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2; };
export const easeOutBack = (x) => { x = clamp01(x); const c = 1.9; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };

// kind: 'shatter' (to light) or 'vortex' (to dark); t0: when it began;
// maxR: the circle's reach, to the far corner of the screen; core: droplets gathered at the centre
export const modeShift = { kind: null, t0: null, maxR: 30, core: 0, spawns: [] };

export const shiftTime = () => (modeShift.t0 == null ? 0 : (performance.now() - modeShift.t0) / 1000);

// The circle's radius at time t. Light is inside it: going to light it grows, going to dark it closes
export const wipeAt = (kind, t) => {
  if (kind === 'shatter') return { r: modeShift.maxR * easeOut3((t - SHATTER.BREAK) / SHATTER.WIPE) };
  return { r: modeShift.maxR * (1 - easeInOut3((t - VORTEX.IRIS_AT) / VORTEX.IRIS)) };
};

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The page's text and buttons fade out, change colour unseen, and fade back in once the new colour has
// reached them. Only opacity animates, which the browser does off the main thread; the 3D draws the sweep.
// (The browser's view transitions were tried for this: they freeze every frame, the scene's included, while
// the page swaps, repaint a full-screen mask each frame, and flash white in Safari, on iPhones in any browser.)
const FADE = { shatter: { out: 0.22, back: 0.62, dur: 0.5 }, vortex: { out: 0.22, back: 0.95, dur: 0.5 } };
const ui = () => [...document.querySelectorAll('.layout > :not(.scene3d)')];

/**
 * Switch modes. `apply` flips the app's state. The scene starts its half at once; the page changes colour
 * while it is faded out, so the change itself is never seen.
 */
export const switchMode = (toLight, apply) => {
  if (modeShift.kind) return; // one switch at a time
  const canvas = document.querySelector('.scene3d');
  if (reduceMotion() || !canvas) { apply(); return; } // no scene yet: nothing to animate

  const kind = toLight ? 'shatter' : 'vortex';
  const box = canvas.getBoundingClientRect();
  const cx = box.left + box.width / 2 + CENTRE.x * ZOOM;
  const cy = box.top + box.height / 2 - CENTRE.y * ZOOM;
  const far = Math.max(...[[0, 0], [window.innerWidth, 0], [0, window.innerHeight], [window.innerWidth, window.innerHeight]].map(([x, y]) => Math.hypot(x - cx, y - cy))) + 40;
  Object.assign(modeShift, { kind, t0: performance.now(), maxR: far / ZOOM, core: 0, spawns: [] });
  performance.mark('shift:start', { detail: kind }); // for the ?perf frame log
  window.dispatchEvent(new Event('modeshift'));

  const root = document.documentElement;
  const f = FADE[kind];
  // colour changes snap while the page is hidden, rather than easing (and repainting) as it comes back
  root.classList.add('is-shifting');
  const els = ui();
  const out = els.map((el) => el.animate({ opacity: [1, 0] }, { duration: f.out * 1000, easing: 'ease-in', fill: 'forwards' }));
  Promise.all(out.map((a) => a.finished)).catch(() => {}).then(() => {
    performance.mark('shift:page-changed');
    apply();
    const wait = Math.max(0, f.back * 1000 - (performance.now() - modeShift.t0));
    setTimeout(() => {
      performance.mark('shift:page-back');
      root.classList.remove('is-shifting');
      els.forEach((el, i) => {
        out[i].cancel();
        el.animate({ opacity: [0, 1] }, { duration: f.dur * 1000, easing: 'ease-out' });
      });
    }, wait);
  });
};

// The scene calls this when its half is done
export const endShift = () => { performance.mark('shift:end'); modeShift.kind = null; modeShift.t0 = null; };
