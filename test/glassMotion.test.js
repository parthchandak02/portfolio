// Shared glass open/close motion (src/hooks/glassMotion.js): timings, ease
// curves, condense frames, and the reduced-motion gate every card uses.
// Run with `npm test`.
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLOSE_MS,
  CONDENSE,
  GLASS_CLOSE_EASE,
  GLASS_EASE,
  GLASS_EASE_ARRAY,
  OPEN_MS,
  reducedMotion,
} from '../src/hooks/glassMotion.js';

let active = null;

const restoreDom = () => {
  active?.restore();
  active = null;
};

afterEach(restoreDom);

function installMatchMedia(matches) {
  active?.restore();
  const previous = globalThis.window;
  globalThis.window = {
    matchMedia(query) {
      assert.equal(query, '(prefers-reduced-motion: reduce)');
      return { matches: !!matches };
    },
  };
  active = {
    restore() {
      if (previous === undefined) delete globalThis.window;
      else globalThis.window = previous;
    },
  };
}

test('open lasts longer than close, and both stay in a soft human range', () => {
  assert.equal(OPEN_MS, 640);
  assert.equal(CLOSE_MS, 380);
  assert.ok(OPEN_MS > CLOSE_MS);
  assert.ok(OPEN_MS >= 400 && OPEN_MS <= 1000);
  assert.ok(CLOSE_MS >= 200 && CLOSE_MS <= 600);
});

test('CSS ease strings match the motion array and the close curve', () => {
  assert.equal(GLASS_EASE, 'cubic-bezier(0.32, 0.72, 0, 1)');
  assert.deepEqual(GLASS_EASE_ARRAY, [0.32, 0.72, 0, 1]);
  assert.equal(
    GLASS_EASE,
    `cubic-bezier(${GLASS_EASE_ARRAY.join(', ')})`
  );
  assert.equal(GLASS_CLOSE_EASE, 'cubic-bezier(0.4, 0, 0.2, 1)');
});

test('condense runs from a light blur into sharp focus, then reverses for close', () => {
  assert.equal(CONDENSE.length, 2);
  const [from, to] = CONDENSE;
  assert.equal(from.opacity, 0);
  assert.equal(to.opacity, 1);
  assert.match(from.filter, /blur\(/);
  assert.equal(to.filter, 'blur(0px)');
  assert.equal(to.transform, 'none');
  assert.match(from.transform, /scale\(/);

  const reverse = CONDENSE.slice().reverse();
  assert.deepEqual(reverse[0], to);
  assert.deepEqual(reverse[1], from);
});

test('reducedMotion follows prefers-reduced-motion', () => {
  installMatchMedia(true);
  assert.equal(reducedMotion(), true);
  installMatchMedia(false);
  assert.equal(reducedMotion(), false);
});
