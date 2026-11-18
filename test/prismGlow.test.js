// Prism glow bus (src/hooks/prismGlow.js): the strip and contact button ask the
// 3D scene for a pulse of light when the reader picks something. Run with `npm test`.
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { glowPrism, onPrismGlow } from '../src/hooks/prismGlow.js';

let active = null;

const restoreDom = () => {
  active?.restore();
  active = null;
};

afterEach(restoreDom);

function installWindow() {
  active?.restore();
  const listeners = new Map();
  const previous = globalThis.window;
  globalThis.window = {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    dispatchEvent(event) {
      const list = [...(listeners.get(event.type) || [])];
      list.forEach((fn) => fn(event));
      return true;
    },
  };
  active = {
    listeners,
    restore() {
      if (previous === undefined) delete globalThis.window;
      else globalThis.window = previous;
    },
  };
  return active;
}

test('glowPrism sends the wave, and a missing wave means the whole spectrum', () => {
  installWindow();
  const waves = [];
  const stop = onPrismGlow((wave) => waves.push(wave));

  glowPrism(0.42);
  glowPrism();
  glowPrism(0);

  assert.deepEqual(waves, [0.42, 0, 0]);
  stop();
});

test('onPrismGlow stops after unsubscribe, and a bare detail defaults to 0', () => {
  const { listeners } = installWindow();
  const waves = [];
  const stop = onPrismGlow((wave) => waves.push(wave));

  assert.equal(listeners.get('prism-glow')?.size, 1);
  window.dispatchEvent(new CustomEvent('prism-glow', { detail: {} }));
  window.dispatchEvent(new CustomEvent('prism-glow'));
  assert.deepEqual(waves, [0, 0]);

  stop();
  assert.equal(listeners.get('prism-glow')?.size, 0);
  glowPrism(0.9);
  assert.deepEqual(waves, [0, 0]);
});

test('glowPrism is a no-op when window is missing (SSR / Node)', () => {
  const previous = globalThis.window;
  delete globalThis.window;
  active = {
    restore() {
      if (previous === undefined) delete globalThis.window;
      else globalThis.window = previous;
    },
  };
  assert.doesNotThrow(() => glowPrism(0.5));
});
