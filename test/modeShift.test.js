// The prism to bubbles switch (src/hooks/modeShift.js): easing, the wipe circle, and
// how the page fades while the scene plays. Run with `npm test`.
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  CENTRE,
  SHATTER,
  VORTEX,
  ZOOM,
  easeInOut3,
  easeOut3,
  easeOutBack,
  endShift,
  modeShift,
  shiftTime,
  smooth,
  switchMode,
  wipeAt,
} from '../src/hooks/modeShift.js';

const resetShift = () => {
  modeShift.kind = null;
  modeShift.t0 = null;
  modeShift.maxR = 30;
  modeShift.core = 0;
  modeShift.spawns = [];
};

// Canvas 200x100 at the origin, window 800x600. The circle is centred on the prism
// (scene y grows up, screen y grows down) and must clear the far corner by 40px.
const SCREEN = { width: 800, height: 600 };
const CANVAS = { left: 0, top: 0, width: 200, height: 100 };

const prismOnScreen = () => {
  const cx = CANVAS.left + CANVAS.width / 2 + CENTRE.x * ZOOM;
  const cy = CANVAS.top + CANVAS.height / 2 - CENTRE.y * ZOOM;
  const farthest = Math.max(
    Math.hypot(cx, cy),
    Math.hypot(SCREEN.width - cx, cy),
    Math.hypot(cx, SCREEN.height - cy),
    Math.hypot(SCREEN.width - cx, SCREEN.height - cy)
  );
  return { cx, cy, farthest };
};

let active = null;

const restoreDom = () => {
  active?.restore();
  active = null;
  resetShift();
};

afterEach(restoreDom);

function installDom({
  reduce = false,
  canvas = true,
  failAnimations = false,
} = {}) {
  restoreDom();
  const animations = [];
  const marks = [];
  const events = [];
  const classes = new Set();
  const timeouts = [];
  const saved = {
    window: globalThis.window,
    document: globalThis.document,
    now: performance.now,
    mark: performance.mark,
    setTimeout: globalThis.setTimeout,
  };
  let now = 10_000;

  const layout = [0, 1].map(() => ({
    animate(keyframes, options) {
      const finished = failAnimations
        ? Promise.reject(new Error('animation cancelled'))
        : Promise.resolve();
      if (failAnimations) finished.catch(() => {});
      const anim = {
        keyframes,
        options,
        cancelled: false,
        finished,
        cancel() {
          this.cancelled = true;
        },
      };
      animations.push(anim);
      return anim;
    },
  }));

  const canvasEl = {
    getBoundingClientRect: () => ({
      ...CANVAS,
      right: CANVAS.left + CANVAS.width,
      bottom: CANVAS.top + CANVAS.height,
    }),
  };

  globalThis.window = {
    matchMedia: (query) => ({
      matches: reduce && query === '(prefers-reduced-motion: reduce)',
    }),
    innerWidth: SCREEN.width,
    innerHeight: SCREEN.height,
    dispatchEvent: (event) => {
      events.push({ type: event.type, kind: modeShift.kind });
      return true;
    },
  };
  globalThis.document = {
    documentElement: {
      classList: {
        add: (name) => classes.add(name),
        remove: (name) => classes.delete(name),
        contains: (name) => classes.has(name),
      },
    },
    querySelector: (sel) => (canvas && sel === '.scene3d' ? canvasEl : null),
    querySelectorAll: (sel) =>
      sel === '.layout > :not(.scene3d)' ? layout : [],
  };
  performance.now = () => now;
  performance.mark = (name, options) => {
    marks.push({ name, detail: options?.detail });
  };
  globalThis.setTimeout = (fn, delay = 0) => {
    timeouts.push({ fn, delay });
    return timeouts.length;
  };

  active = {
    animations,
    marks,
    events,
    classes,
    timeouts,
    setNow: (t) => {
      now = t;
    },
    restore() {
      if (saved.window === undefined) delete globalThis.window;
      else globalThis.window = saved.window;
      if (saved.document === undefined) delete globalThis.document;
      else globalThis.document = saved.document;
      performance.now = saved.now;
      performance.mark = saved.mark;
      globalThis.setTimeout = saved.setTimeout;
    },
  };
  resetShift();
  return active;
}

async function flush() {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
}

test('easing holds the endpoints, and input outside 0 to 1 stays clamped', () => {
  for (const fn of [smooth, easeOut3, easeInOut3, easeOutBack]) {
    assert.equal(fn(0), 0);
    assert.equal(fn(1), 1);
    assert.equal(fn(-0.4), 0);
    assert.equal(fn(1.4), 1);
  }

  // Flat at the ends, halfway at the middle: the beam overload eases instead of jumping.
  assert.equal(smooth(0.5), 0.5);
  assert.equal(smooth(0.25), 0.15625);

  // Ahead of linear, so the wipe covers most of its radius early.
  assert.equal(easeOut3(0.5), 0.875);
  assert.ok(easeOut3(0.25) > 0.25);

  // Bubbles round off on this curve. It mirrors around the middle.
  assert.equal(easeInOut3(0.5), 0.5);
  assert.equal(easeInOut3(0.25), 0.0625);
  assert.equal(easeInOut3(0.25) + easeInOut3(0.75), 1);

  // Overshoot: the prism pops into place, and a bubble settles past its rest size.
  assert.ok(easeOutBack(0.8) > 1);
  let peak = 0;
  for (let i = 0; i <= 20; i += 1) peak = Math.max(peak, easeOutBack(i / 20));
  assert.ok(peak > 1);
});

test('the shatter wipe finishes while the shift is still running', () => {
  assert.ok(SHATTER.BREAK > 0);
  assert.ok(SHATTER.BREAK + SHATTER.WIPE < SHATTER.END);
});

test('the vortex iris closes before the prism forms', () => {
  assert.ok(VORTEX.IRIS_AT > 0);
  assert.ok(VORTEX.IRIS_AT + VORTEX.IRIS < VORTEX.FORM);
  assert.ok(VORTEX.FORM < VORTEX.END);
});

test('going to light, the circle stays shut until the prism breaks, then grows to full reach', () => {
  modeShift.maxR = 30;
  const at = (t) => wipeAt('shatter', t).r;
  assert.equal(at(0), 0);
  assert.equal(at(SHATTER.BREAK), 0);
  assert.equal(at(SHATTER.BREAK + SHATTER.WIPE / 2), 26.25);
  assert.equal(at(SHATTER.BREAK + SHATTER.WIPE), 30);
  assert.equal(at(SHATTER.END), 30);

  let prev = -1;
  for (let i = 0; i <= 8; i += 1) {
    const r = at(SHATTER.BREAK + (SHATTER.WIPE * i) / 8);
    assert.ok(r >= prev);
    prev = r;
  }
});

test('going to dark, the circle stays open until the iris, then closes and stays shut', () => {
  modeShift.maxR = 30;
  const at = (t) => wipeAt('vortex', t).r;
  assert.equal(at(0), 30);
  assert.equal(at(VORTEX.IRIS_AT), 30);
  assert.equal(at(VORTEX.IRIS_AT + VORTEX.IRIS / 2), 15);
  assert.equal(at(VORTEX.IRIS_AT + VORTEX.IRIS), 0);
  assert.equal(at(VORTEX.END), 0);
  // Any kind other than shatter uses the closing circle, so a typo cannot grow the light.
  assert.equal(wipeAt('dark', VORTEX.IRIS_AT + VORTEX.IRIS).r, 0);

  let prev = 31;
  for (let i = 0; i <= 8; i += 1) {
    const r = at(VORTEX.IRIS_AT + (VORTEX.IRIS * i) / 8);
    assert.ok(r <= prev);
    prev = r;
  }
});

test('the circle uses the reach the switch measured', () => {
  modeShift.maxR = 12;
  assert.equal(wipeAt('shatter', SHATTER.BREAK + SHATTER.WIPE).r, 12);
  assert.equal(wipeAt('vortex', 0).r, 12);
});

test('shiftTime is 0 until a switch has a start, then seconds since that start', () => {
  const now = performance.now;
  try {
    let t = 4000;
    performance.now = () => t;
    modeShift.t0 = null;
    assert.equal(shiftTime(), 0);
    modeShift.t0 = 2500;
    assert.equal(shiftTime(), 1.5);
    t = 2500;
    assert.equal(shiftTime(), 0);
  } finally {
    performance.now = now;
    resetShift();
  }
});

test('a switch already running is left alone, including when motion is reduced', () => {
  const dom = installDom({ reduce: true, canvas: true });
  modeShift.kind = 'vortex';
  modeShift.t0 = 50;
  modeShift.maxR = 8;
  let applied = 0;
  switchMode(true, () => {
    applied += 1;
  });
  assert.equal(applied, 0);
  assert.equal(modeShift.kind, 'vortex');
  assert.equal(modeShift.t0, 50);
  assert.equal(modeShift.maxR, 8);
  assert.equal(dom.events.length, 0);
  assert.equal(dom.classes.has('is-shifting'), false);

  endShift();
  assert.equal(modeShift.kind, null);
  assert.equal(modeShift.t0, null);
  assert.equal(shiftTime(), 0);
  assert.deepEqual(
    dom.marks.map((mark) => mark.name),
    ['shift:end']
  );

  switchMode(true, () => {
    applied += 1;
  });
  assert.equal(applied, 1);
  assert.equal(modeShift.kind, null);
});

test('reduced motion or a missing scene applies the new mode with no animation', () => {
  for (const options of [
    { reduce: true, canvas: true },
    { reduce: false, canvas: false },
  ]) {
    const dom = installDom(options);
    let applied = 0;
    switchMode(false, () => {
      applied += 1;
    });
    assert.equal(applied, 1);
    assert.equal(modeShift.kind, null);
    assert.equal(modeShift.t0, null);
    assert.equal(dom.events.length, 0);
    assert.equal(dom.animations.length, 0);
    assert.equal(dom.timeouts.length, 0);
    assert.equal(dom.classes.has('is-shifting'), false);
  }
});

test('a shatter switch covers the screen, then fades the page out and back during the wipe', async () => {
  const dom = installDom();
  modeShift.core = 40;
  modeShift.spawns = [{ when: 1 }];
  let applied = null;
  switchMode(true, () => {
    applied = {
      shifting: dom.classes.has('is-shifting'),
      marked: dom.marks.some((mark) => mark.name === 'shift:page-changed'),
    };
  });

  assert.equal(applied, null);
  assert.equal(modeShift.kind, 'shatter');
  assert.equal(modeShift.t0, 10_000);
  assert.equal(modeShift.core, 0);
  assert.deepEqual(modeShift.spawns, []);
  assert.equal(shiftTime(), 0);
  const { farthest } = prismOnScreen();
  assert.equal(modeShift.maxR * ZOOM, farthest + 40);
  assert.deepEqual(dom.events, [{ type: 'modeshift', kind: 'shatter' }]);
  assert.deepEqual(dom.marks[0], { name: 'shift:start', detail: 'shatter' });
  assert.equal(dom.classes.has('is-shifting'), true);
  assert.equal(dom.animations.length, 2);
  for (const anim of dom.animations) {
    assert.deepEqual(anim.keyframes, { opacity: [1, 0] });
    assert.deepEqual(anim.options, {
      duration: 220,
      easing: 'ease-in',
      fill: 'forwards',
    });
  }

  dom.setNow(10_100);
  await flush();
  assert.deepEqual(applied, { shifting: true, marked: true });
  // 0.62s return, minus the 0.1s already elapsed. Still after the break, still inside the wipe.
  assert.equal(dom.timeouts.length, 1);
  assert.equal(dom.timeouts[0].delay, 520);
  assert.ok(0.62 > SHATTER.BREAK);
  assert.ok(0.62 < SHATTER.BREAK + SHATTER.WIPE);

  dom.timeouts[0].fn();
  assert.equal(dom.classes.has('is-shifting'), false);
  assert.equal(dom.marks.at(-1).name, 'shift:page-back');
  assert.equal(dom.animations[0].cancelled, true);
  assert.equal(dom.animations[1].cancelled, true);
  assert.equal(dom.animations.length, 4);
  for (const anim of dom.animations.slice(2)) {
    assert.deepEqual(anim.keyframes, { opacity: [0, 1] });
    assert.deepEqual(anim.options, { duration: 500, easing: 'ease-out' });
  }
});

test('a vortex switch brings the page back while the iris is closing', async () => {
  const dom = installDom();
  let applied = 0;
  switchMode(false, () => {
    applied += 1;
  });
  assert.equal(modeShift.kind, 'vortex');
  assert.deepEqual(dom.marks[0], { name: 'shift:start', detail: 'vortex' });
  const { farthest } = prismOnScreen();
  assert.equal(modeShift.maxR * ZOOM, farthest + 40);

  await flush();
  assert.equal(applied, 1);
  assert.equal(dom.timeouts.length, 1);
  assert.equal(dom.timeouts[0].delay, 950);
  assert.ok(0.95 > VORTEX.IRIS_AT);
  assert.ok(0.95 < VORTEX.IRIS_AT + VORTEX.IRIS);
});

test('a cancelled fade-out still changes the page', async () => {
  const dom = installDom({ failAnimations: true });
  let applied = 0;
  switchMode(true, () => {
    applied += 1;
  });
  await flush();
  assert.equal(applied, 1);
  assert.equal(modeShift.kind, 'shatter');
  assert.equal(dom.timeouts.length, 1);
  assert.equal(dom.timeouts[0].delay, 620);
});
