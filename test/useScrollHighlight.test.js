// Scroll highlight lifecycle across Play Mode transitions (src/hooks/useScrollHighlight.js).
// Run with `npm test`.
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { observeScrollHighlight } from '../src/hooks/useScrollHighlight.js';

let active = null;
let activeCleanup = null;

const restoreEnv = () => {
  if (activeCleanup) {
    activeCleanup();
    activeCleanup = null;
  }
  active?.restore();
  active = null;
};

afterEach(restoreEnv);

function makeItem({ category, title, top, bottom, left = 0 }) {
  return {
    getAttribute: (name) => {
      if (name === 'data-category') return category;
      if (name === 'data-title') return title;
      return null;
    },
    getBoundingClientRect: () => ({
      top,
      bottom,
      left,
      height: bottom - top,
    }),
  };
}

function installDom({
  scrollTop = 0,
  scrollHeight = 4000,
  clientHeight = 900,
  stageBottom = 600,
  hasTimeline = true,
  items = [],
} = {}) {
  restoreEnv();

  const saved = {
    window: globalThis.window,
    document: globalThis.document,
    getComputedStyle: globalThis.getComputedStyle,
    ResizeObserver: globalThis.ResizeObserver,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };

  const listeners = { scroll: new Set(), resize: new Set() };
  const rafQueue = new Map();
  const timers = new Map();
  const observers = [];
  let nextId = 1;

  const state = {
    scrollTop,
    scrollHeight,
    clientHeight,
    stageBottom,
    hasTimeline,
    items,
  };

  const timelineEl = { id: 'timeline' };
  const stageEl = {
    getBoundingClientRect: () => ({ bottom: state.stageBottom }),
  };

  const scrollContainer = {
    get scrollTop() {
      return state.scrollTop;
    },
    set scrollTop(v) {
      state.scrollTop = v;
    },
    get scrollHeight() {
      return state.scrollHeight;
    },
    get clientHeight() {
      return state.clientHeight;
    },
    getBoundingClientRect: () => ({
      top: 0,
      bottom: state.clientHeight,
      height: state.clientHeight,
    }),
    addEventListener: (type, fn) => {
      if (listeners[type]) listeners[type].add(fn);
    },
    removeEventListener: (type, fn) => {
      if (listeners[type]) listeners[type].delete(fn);
    },
  };

  globalThis.window = {
    addEventListener: (type, fn) => {
      if (listeners[type]) listeners[type].add(fn);
    },
    removeEventListener: (type, fn) => {
      if (listeners[type]) listeners[type].delete(fn);
    },
  };

  globalThis.document = {
    getElementById: () => null,
    querySelector: (selector) => {
      if (selector === '.main-content-scroll') return scrollContainer;
      if (selector === '.spectro__stage')
        return state.hasTimeline ? stageEl : null;
      if (selector === '.timeline')
        return state.hasTimeline ? timelineEl : null;
      return null;
    },
    querySelectorAll: (selector) => {
      if (selector === '.timeline__item[data-category]') {
        return state.hasTimeline ? state.items : [];
      }
      return [];
    },
  };

  globalThis.getComputedStyle = () => ({
    getPropertyValue: () => '46px',
  });

  globalThis.ResizeObserver = class MockResizeObserver {
    constructor(cb) {
      this.cb = cb;
      this.observed = [];
      this.disconnected = false;
      observers.push(this);
    }
    observe(target) {
      this.observed.push(target);
    }
    disconnect() {
      this.disconnected = true;
    }
    trigger() {
      if (!this.disconnected) this.cb();
    }
  };

  globalThis.requestAnimationFrame = (fn) => {
    const id = nextId++;
    rafQueue.set(id, fn);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => {
    rafQueue.delete(id);
  };
  globalThis.setTimeout = (fn) => {
    const id = nextId++;
    timers.set(id, fn);
    return id;
  };
  globalThis.clearTimeout = (id) => {
    timers.delete(id);
  };

  active = {
    state,
    timelineEl,
    observers,
    listeners,
    flushRaf() {
      const pending = [...rafQueue.values()];
      rafQueue.clear();
      for (const fn of pending) fn();
    },
    restore() {
      for (const [key, val] of Object.entries(saved)) {
        if (val === undefined) delete globalThis[key];
        else globalThis[key] = val;
      }
    },
  };
  return active;
}

function makeState(initial) {
  let current = initial;
  return {
    get: () => current,
    set: (next) => {
      current = typeof next === 'function' ? next(current) : next;
    },
  };
}

test('returning from play mode after scrolling resets visible highlight to hero at scrollTop 0', () => {
  const dom = installDom({
    scrollTop: 1800,
    stageBottom: -120,
    hasTimeline: true,
    items: [
      makeItem({
        category: 'career',
        title: 'Engineering Intern',
        top: 400,
        bottom: 620,
      }),
    ],
  });

  const visible = makeState({ category: 'all', title: null });
  const lastKeyRef = { current: 'all|' };

  activeCleanup = observeScrollHighlight({
    activeFilter: 'all',
    enabled: true,
    setVisible: visible.set,
    lastKeyRef,
  });

  assert.deepEqual(visible.get(), {
    category: 'career',
    title: 'Engineering Intern',
  });

  // Enter Play Mode: timeline unmounts and scroller resets to 0.
  activeCleanup();
  dom.state.hasTimeline = false;
  dom.state.items = [];
  dom.state.scrollTop = 0;

  activeCleanup = observeScrollHighlight({
    activeFilter: 'all',
    enabled: false,
    setVisible: visible.set,
    lastKeyRef,
  });

  assert.deepEqual(visible.get(), { category: 'all', title: null });
  assert.equal(lastKeyRef.current, 'all|');

  // Exit Play Mode back to reading mode at scrollTop 0 (no scroll event fires).
  if (activeCleanup) activeCleanup();
  dom.state.hasTimeline = true;
  dom.state.stageBottom = 600;
  dom.state.items = [
    makeItem({
      category: 'career',
      title: 'Engineering Intern',
      top: 900,
      bottom: 1120,
    }),
  ];

  activeCleanup = observeScrollHighlight({
    activeFilter: 'all',
    enabled: true,
    setVisible: visible.set,
    lastKeyRef,
  });

  assert.deepEqual(visible.get(), { category: 'all', title: null });
  assert.equal(dom.observers.at(-1)?.observed[0], dom.timelineEl);
  assert.equal(dom.observers.at(-1)?.disconnected, false);
});

test('starting in play mode and entering reading mode attaches ResizeObserver to timeline', () => {
  const dom = installDom({
    scrollTop: 0,
    hasTimeline: false,
    items: [],
  });

  const visible = makeState({ category: 'all', title: null });
  const lastKeyRef = { current: 'all|' };

  // Initial mount in Play Mode: timeline is not in DOM yet.
  activeCleanup = observeScrollHighlight({
    activeFilter: 'all',
    enabled: false,
    setVisible: visible.set,
    lastKeyRef,
  });
  assert.equal(dom.observers.length, 0);
  assert.equal(dom.listeners.scroll.size, 0);
  assert.equal(dom.listeners.resize.size, 0);

  // User leaves Play Mode: timeline mounts and effect re-runs with enabled: true.
  if (activeCleanup) activeCleanup();
  dom.state.hasTimeline = true;
  dom.state.stageBottom = 600;
  dom.state.items = [
    makeItem({
      category: 'career',
      title: 'Engineering Intern',
      top: 400,
      bottom: 620,
    }),
  ];

  activeCleanup = observeScrollHighlight({
    activeFilter: 'all',
    enabled: true,
    setVisible: visible.set,
    lastKeyRef,
  });

  assert.equal(dom.observers.length, 1);
  assert.deepEqual(dom.observers[0].observed, [dom.timelineEl]);

  // Scrolling down and triggering a timeline resize updates the highlight.
  dom.state.scrollTop = 1000;
  dom.state.stageBottom = -100;
  dom.observers[0].trigger();
  dom.flushRaf();

  assert.deepEqual(visible.get(), {
    category: 'career',
    title: 'Engineering Intern',
  });
});

test('empty timeline while active resets stale reading highlight instead of keeping it stuck', () => {
  const dom = installDom({
    scrollTop: 1200,
    stageBottom: -100,
    hasTimeline: true,
    items: [
      makeItem({
        category: 'career',
        title: 'Engineering Intern',
        top: 400,
        bottom: 620,
      }),
    ],
  });

  const visible = makeState({ category: 'all', title: null });
  const lastKeyRef = { current: 'all|' };

  activeCleanup = observeScrollHighlight({
    activeFilter: 'all',
    enabled: true,
    setVisible: visible.set,
    lastKeyRef,
  });
  assert.deepEqual(visible.get(), {
    category: 'career',
    title: 'Engineering Intern',
  });

  // Items disappear before a resize/scroll measurement runs.
  dom.state.items = [];
  for (const fn of dom.listeners.resize) fn();
  dom.flushRaf();

  assert.deepEqual(visible.get(), { category: 'all', title: null });
  assert.equal(lastKeyRef.current, 'all|');
});

test('App gates useScrollHighlight with !isPlayMode', () => {
  const appSource = readFileSync(
    new URL('../src/App.jsx', import.meta.url),
    'utf8'
  );
  assert.match(
    appSource,
    /useScrollHighlight\(\s*['"]all['"]\s*,\s*!isPlayMode\s*\)/
  );
});
