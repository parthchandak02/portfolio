// Molten open/close animation lifecycle (src/components/moltenMotion.js). Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelMoltenClose,
  startMoltenClose,
} from '../src/components/moltenMotion.js';
import { CONDENSE, GLASS_EASE, OPEN_MS } from '../src/hooks/glassMotion.js';

// Minimal element stub tracking WAAPI animations and fill modes ('forwards' vs 'backwards').
function makeElement(rectHeight = () => 0) {
  const animations = [];
  return {
    animations,
    getBoundingClientRect() {
      return { height: rectHeight() };
    },
    animate(keyframes, options = {}) {
      const anim = {
        keyframes,
        options,
        cancelled: false,
        finished: false,
        onfinish: null,
        cancel() {
          this.cancelled = true;
        },
        complete() {
          this.finished = true;
          this.onfinish?.();
        },
      };
      animations.push(anim);
      return anim;
    },
  };
}

// Mirrors WAAPI cascade: running animations and uncanceled fill:'forwards' animations remain active.
function activeEffects(el) {
  return el.animations.filter(
    (a) =>
      !a.cancelled && (!a.finished || a.options.fill === 'forwards')
  );
}

test('reopening mid-close cancels inner fill-forwards close animation so content stays visible', () => {
  let currentHeight = 120;
  const outer = makeElement(() => currentHeight);
  const inner = makeElement();
  const closing = { current: null };

  // Start closing: outer shrinks from 120 -> 0 and inner melts out with fill: 'forwards'.
  startMoltenClose(closing, outer, inner, 120, () => {});
  currentHeight = 72;

  // Mid-close reopen before CLOSE_MS completes: cancel close and start CONDENSE (fill: 'backwards').
  const resumedFrom = cancelMoltenClose(closing, outer);
  currentHeight = 120;

  const reopenInner = inner.animate(CONDENSE, {
    duration: OPEN_MS + 80,
    delay: 40,
    easing: GLASS_EASE,
    fill: 'backwards',
  });

  // Simulate animations finishing in order: closing anim (380ms) finishes, then CONDENSE (760ms) finishes.
  for (const a of inner.animations) {
    if (!a.cancelled && a !== reopenInner) a.complete();
  }
  reopenInner.complete();

  assert.equal(
    activeEffects(inner).length,
    0,
    'cancelled closing inner animation must not linger with fill:forwards after CONDENSE completes'
  );
  assert.equal(resumedFrom, 72);
});

test('cancelMoltenClose measures mid-close outer height before cancelling outer animation', () => {
  const outer = makeElement(() => {
    // Once outer's closing animation is cancelled, its rect returns settled height (120) instead of 68.
    const activeClose = activeEffects(outer).length > 0;
    return activeClose ? 68 : 120;
  });
  const inner = makeElement();
  const closing = { current: null };

  startMoltenClose(closing, outer, inner, 120, () => {});
  const resumedFrom = cancelMoltenClose(closing, outer);

  assert.equal(resumedFrom, 68);
  assert.equal(activeEffects(outer).length, 0);
});

test('cancelMoltenClose returns null when not currently closing', () => {
  const outer = makeElement(() => 0);
  const closing = { current: null };
  assert.equal(cancelMoltenClose(closing, outer), null);
});
