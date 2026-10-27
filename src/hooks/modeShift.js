// The switch between the dark mode's prism and the light mode's bubbles, played as one piece. Going to light,
// the beam overloads the prism and it shatters, the white floods out from where it stood and its shards round
// off into bubbles. Going to dark, the bubbles burst from the outside in, their droplets spiral into the centre
// as the dark closes behind them, and the prism forms from the flash. The 3D, the page's colour and its text
// all follow the one circle described here, so they change along the same edge at the same moment.

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
// The same curves for the page's half, in CSS
const CSS_EASE = { out3: 'cubic-bezier(0.33, 1, 0.68, 1)', inOut3: 'cubic-bezier(0.65, 0, 0.35, 1)' };

// kind: 'shatter' (to light) or 'vortex' (to dark); t0: when it began, set once the page's half is ready;
// maxR: the circle's reach, to the far corner of the screen; core: droplets gathered at the centre
export const modeShift = { kind: null, t0: null, maxR: 30, core: 0, spawns: [] };

export const shiftTime = () => (modeShift.t0 == null ? 0 : (performance.now() - modeShift.t0) / 1000);

// The circle's radius at time t. Light is inside it: going to light it grows, going to dark it closes
export const wipeAt = (kind, t) => {
  if (kind === 'shatter') return { r: modeShift.maxR * easeOut3((t - SHATTER.BREAK) / SHATTER.WIPE) };
  return { r: modeShift.maxR * (1 - easeInOut3((t - VORTEX.IRIS_AT) / VORTEX.IRIS)) };
};

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Switch modes. `apply` flips the app's state; it runs inside the browser's view transition, which captures
 * the page before and after so a circle can sweep the new colours in. The 3D canvas is kept out of those
 * captures and shown live beneath them, so the scene keeps moving through the sweep.
 */
export const switchMode = (toLight, apply) => {
  if (modeShift.kind) return; // one switch at a time
  if (reduceMotion()) { apply(); return; }

  const kind = toLight ? 'shatter' : 'vortex';
  const canvas = document.querySelector('.scene3d');
  if (!canvas) { apply(); return; } // the scene hasn't loaded yet: nothing to animate
  const box = canvas.getBoundingClientRect();
  const cx = box.left + box.width / 2 + CENTRE.x * ZOOM;
  const cy = box.top + box.height / 2 - CENTRE.y * ZOOM;
  const far = Math.max(...[[0, 0], [window.innerWidth, 0], [0, window.innerHeight], [window.innerWidth, window.innerHeight]].map(([x, y]) => Math.hypot(x - cx, y - cy))) + 40;
  Object.assign(modeShift, { kind, t0: null, maxR: far / ZOOM, core: 0, spawns: [] });

  const root = document.documentElement;
  const begin = () => { modeShift.t0 = performance.now(); };
  if (!document.startViewTransition) { apply(); begin(); return; }

  root.style.setProperty('--shift-x', `${cx}px`);
  root.style.setProperty('--shift-y', `${cy}px`);
  root.classList.add('is-shifting', `is-shifting--${kind}`);
  const vt = document.startViewTransition(apply);
  vt.ready.then(() => {
    begin();
    const [from, to, delay, dur, easing] = kind === 'shatter'
      ? [0, far, SHATTER.BREAK, SHATTER.WIPE, CSS_EASE.out3]
      : [far, 0, VORTEX.IRIS_AT, VORTEX.IRIS, CSS_EASE.inOut3];
    // The radius lives on the pair of captures, so the old and new pages both read it (a registered property,
    // so it animates); the transition lasts as long as this animation does
    root.animate({ '--shift-r': [`${from}px`, `${to}px`] }, {
      duration: dur * 1000, delay: delay * 1000, easing, fill: 'both', pseudoElement: '::view-transition-image-pair(page)'
    });
  }).catch(begin);
  vt.finished.finally(() => {
    root.classList.remove('is-shifting', `is-shifting--${kind}`);
    // if the sweep was skipped (the tab hidden, say), the scene still plays its half
    if (modeShift.kind === kind && modeShift.t0 == null) begin();
  });
};

// The scene calls this when its half is done
export const endShift = () => { modeShift.kind = null; modeShift.t0 = null; };
