// Scroll highlight lifecycle across Play Mode transitions (src/hooks/useScrollHighlight.js).
// Run with `npm test`.
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  observeScrollHighlight,
  readingLineOf,
  scrollCardToLine,
} from '../src/hooks/useScrollHighlight.js';
import { BAR_CLEARANCE } from '../src/hooks/scrollReading.js';

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

function makeItem({ category, title, top, bottom, left = 0, height } = {}) {
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
      height: height ?? bottom - top,
    }),
  };
}

function installDom({
  scrollTop = 0,
  scrollHeight = 4000,
  clientHeight = 900,
  viewTop = 0,
  stageBottom = 600,
  hasTimeline = true,
  hasStage,
  hasScroller = true,
  items = [],
  drawers = [],
  selected = null,
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
  const scrollCalls = [];
  let nextId = 1;

  const state = {
    scrollTop,
    scrollHeight,
    clientHeight,
    viewTop,
    stageBottom,
    hasTimeline,
    hasStage: hasStage ?? hasTimeline,
    hasScroller,
    items,
    drawers,
    selected,
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
      top: state.viewTop,
      bottom: state.viewTop + state.clientHeight,
      height: state.clientHeight,
    }),
    scrollTo: (opts) => {
      scrollCalls.push(opts);
      if (opts && typeof opts.top === 'number') state.scrollTop = opts.top;
    },
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
    getElementById: (id) => {
      if (id === 'selected' && state.selected) {
        return { getBoundingClientRect: () => state.selected };
      }
      return null;
    },
    querySelector: (selector) => {
      if (selector === '.main-content-scroll')
        return state.hasScroller ? scrollContainer : null;
      if (selector === '.spectro__stage')
        return state.hasStage ? stageEl : null;
      if (selector === '.timeline')
        return state.hasTimeline ? timelineEl : null;
      return null;
    },
    querySelectorAll: (selector) => {
      if (selector === '.timeline__item[data-category]') {
        return state.hasTimeline ? state.items : [];
      }
      if (selector === '.tile-drawer') {
        return state.drawers;
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
    scrollContainer,
    scrollCalls,
    observers,
    listeners,
    rafQueue,
    timers,
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

test('scrollCardToLine lands each tile on its share of the row and handles tall or above-top cards', () => {
  const right = makeItem({ category: 'awards', title: 'Right', top: 300, bottom: 500, left: 400 });
  const left = makeItem({ category: 'awards', title: 'Left', top: 301, bottom: 501, left: 0 });
  const middle = makeItem({ category: 'awards', title: 'Middle', top: 300, bottom: 500, left: 200 });
  const zeroHeight = makeItem({ category: 'awards', title: 'Hidden', top: 300, bottom: 300, left: 100, height: 0 });
  const otherRow = makeItem({ category: 'awards', title: 'Below', top: 520, bottom: 720, left: 0 });
  const dom = installDom({ scrollTop: 1500, stageBottom: -100, items: [right, left, middle, zeroHeight, otherRow] });

  assert.equal(readingLineOf(dom.scrollContainer), (BAR_CLEARANCE + 900) / 2);

  scrollCardToLine(middle, dom.scrollContainer);
  assert.equal(dom.scrollCalls.length, 1);
  assert.equal(dom.scrollCalls[0].behavior, 'smooth');
  const delta = dom.scrollCalls[0].top - 1500;

  const shifted = [left, middle, right].map((el) => {
    const r = el.getBoundingClientRect();
    return makeItem({ category: 'awards', title: el.getAttribute('data-title'), top: r.top - delta, bottom: r.bottom - delta, left: r.left });
  });
  dom.state.items = shifted;
  const visible = makeState({ category: 'all', title: null });
  activeCleanup = observeScrollHighlight({ activeFilter: 'all', enabled: true, setVisible: visible.set, lastKeyRef: { current: 'all|' } });
  assert.deepEqual(visible.get(), { category: 'awards', title: 'Middle' });

  scrollCardToLine(shifted[2], dom.scrollContainer, 'auto');
  assert.equal(dom.scrollCalls[1].behavior, 'auto');
  assert.ok(dom.scrollCalls[1].top > dom.scrollCalls[0].top);

  const lab = makeItem({ category: 'lab', title: 'Lab', top: 420, bottom: 1300 });
  dom.state.viewTop = 10;
  dom.state.clientHeight = 800;
  dom.state.scrollTop = 200;
  dom.state.items = [lab];
  scrollCardToLine(lab, dom.scrollContainer, 'auto');
  assert.deepEqual(dom.scrollCalls[2], { top: 200 + 420 - (10 + BAR_CLEARANCE), behavior: 'auto' });

  const above = makeItem({ category: 'experience', title: 'Top', top: -600, bottom: -400 });
  dom.state.scrollTop = 0;
  dom.state.items = [above];
  scrollCardToLine(above, dom.scrollContainer);
  assert.deepEqual(dom.scrollCalls[3], { top: 0, behavior: 'smooth' });
});

test('observeScrollHighlight handles non-all filters, missing scroller, and missing stage', () => {
  const dom = installDom({ scrollTop: 0, hasStage: false, items: [makeItem({ category: 'research', title: 'Paper A', top: 400, bottom: 600 })] });
  const visible = makeState({ category: 'all', title: null });
  const lastKeyRef = { current: 'all|' };

  assert.equal(observeScrollHighlight({ activeFilter: 'research', enabled: true, setVisible: visible.set, lastKeyRef }), undefined);
  assert.deepEqual(visible.get(), { category: 'research', title: null });
  assert.equal(dom.listeners.scroll.size, 0);
  assert.equal(dom.observers.length, 0);

  activeCleanup = observeScrollHighlight({ activeFilter: 'all', enabled: true, setVisible: visible.set, lastKeyRef });
  assert.deepEqual(visible.get(), { category: 'all', title: null });

  dom.state.scrollTop = 41;
  for (const fn of dom.listeners.scroll) fn();
  dom.flushRaf();
  assert.deepEqual(visible.get(), { category: 'research', title: 'Paper A' });

  activeCleanup();
  activeCleanup = null;
  dom.state.hasScroller = false;
  assert.equal(observeScrollHighlight({ activeFilter: 'all', enabled: true, setVisible: visible.set, lastKeyRef }), undefined);
});

test('observeScrollHighlight tracks open drawers, Selected work, and bottom glide', () => {
  const orphanDrawer = { getBoundingClientRect: () => ({ top: 400, bottom: 700 }), parentElement: { querySelector: () => null } };
  const openDrawer = {
    getBoundingClientRect: () => ({ top: 450, bottom: 800 }),
    parentElement: {
      querySelector: (sel) =>
        sel === '.timeline__item.is-open[data-category]' ? makeItem({ category: 'awards', title: 'Open Award', top: 100, bottom: 200 }) : null,
    },
  };
  const dom = installDom({
    scrollTop: 500,
    scrollHeight: 2000,
    clientHeight: 900,
    stageBottom: -100,
    items: [
      makeItem({ category: 'awards', title: 'Tile', top: 100, bottom: 200 }),
      makeItem({ category: 'projects', title: 'Last Card', top: 680, bottom: 820 }),
    ],
    drawers: [orphanDrawer, openDrawer],
  });
  const visible = makeState({ category: 'all', title: null });
  const lastKeyRef = { current: 'all|' };

  activeCleanup = observeScrollHighlight({ activeFilter: 'all', enabled: true, setVisible: visible.set, lastKeyRef });
  assert.deepEqual(visible.get(), { category: 'projects', title: 'Last Card' });

  dom.state.drawers = [openDrawer];
  for (const fn of dom.listeners.scroll) fn();
  dom.flushRaf();
  assert.deepEqual(visible.get(), { category: 'awards', title: 'Open Award' });

  dom.state.drawers = [];
  dom.state.selected = { top: 220, bottom: 750 };
  dom.state.items = [
    makeItem({ category: 'selected', title: 'Find My Zoox', top: 230, bottom: 380 }),
    makeItem({ category: 'media', title: 'Press', top: 50, bottom: 120 }),
  ];
  for (const fn of dom.listeners.scroll) fn();
  dom.flushRaf();
  assert.deepEqual(visible.get(), { category: 'selected', title: 'Find My Zoox' });

  dom.state.selected = null;
  dom.state.scrollTop = 1090;
  dom.state.items = [makeItem({ category: 'projects', title: 'Last Card', top: 700, bottom: 840 })];
  for (const fn of dom.listeners.scroll) fn();
  dom.flushRaf();
  assert.deepEqual(visible.get(), { category: 'projects', title: 'Last Card' });
});

test('observeScrollHighlight avoids duplicate updates and cancels pending work on cleanup', () => {
  const dom = installDom({
    scrollTop: 500,
    stageBottom: -100,
    items: [makeItem({ category: 'career', title: 'Role A', top: 400, bottom: 620 })],
  });
  let sets = 0;
  const visible = makeState({ category: 'all', title: null });
  const setVisible = (next) => {
    sets += 1;
    visible.set(next);
  };

  const cleanup = observeScrollHighlight({ activeFilter: 'all', enabled: true, setVisible, lastKeyRef: { current: 'all|' } });
  assert.equal(sets, 1);
  assert.equal(dom.timers.size, 2);

  for (const fn of dom.listeners.scroll) fn();
  assert.equal(dom.rafQueue.size, 1);
  dom.flushRaf();
  assert.equal(sets, 1);

  for (const fn of dom.listeners.scroll) fn();
  assert.equal(dom.rafQueue.size, 1);
  cleanup();
  assert.equal(dom.rafQueue.size, 0);
  assert.equal(dom.timers.size, 0);
  assert.equal(dom.listeners.scroll.size, 0);
  assert.equal(dom.listeners.resize.size, 0);
  assert.equal(dom.observers[0].disconnected, true);
});


