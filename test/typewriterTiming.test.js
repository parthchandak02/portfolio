// UITypewriter highlight hold timing (src/components/typewriterTiming.js). Run with `npm test`.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  BACK_DELAY_MS,
  HIGHLIGHT_CLEAR_LEAD_MS,
  HIGHLIGHT_SETTLE_MS,
  clearHighlightTimers,
  highlightHoldMs,
  scheduleRoleHighlight,
} from '../src/components/typewriterTiming.js';

const typewriterPath = fileURLToPath(
  new URL('../src/components/UITypewriter.jsx', import.meta.url)
);

// node:test mock timers print an ExperimentalWarning on the Node 22 pin CI uses.
// This clock only replaces setTimeout for the assertion, then puts the originals back.
const withFakeTimers = (run) => {
  const realSet = globalThis.setTimeout;
  const realClear = globalThis.clearTimeout;
  let now = 0;
  let nextId = 1;
  const queue = [];

  globalThis.setTimeout = (fn, ms = 0) => {
    const id = nextId++;
    const at = now + Number(ms);
    const entry = { id, at, fn };
    const index = queue.findIndex((timer) => timer.at > at);
    if (index === -1) queue.push(entry);
    else queue.splice(index, 0, entry);
    return id;
  };

  globalThis.clearTimeout = (id) => {
    const index = queue.findIndex((timer) => timer.id === id);
    if (index !== -1) queue.splice(index, 1);
  };

  const tick = (ms) => {
    const target = now + ms;
    while (queue.length > 0 && queue[0].at <= target) {
      const timer = queue.shift();
      now = timer.at;
      timer.fn();
    }
    now = target;
  };

  try {
    run(tick);
  } finally {
    globalThis.setTimeout = realSet;
    globalThis.clearTimeout = realClear;
  }
};

test('highlight hold tracks backDelay minus the lead time', () => {
  assert.equal(BACK_DELAY_MS, 24000);
  assert.equal(HIGHLIGHT_CLEAR_LEAD_MS, 300);
  assert.equal(highlightHoldMs(), 23700);
  assert.equal(
    highlightHoldMs(BACK_DELAY_MS, HIGHLIGHT_CLEAR_LEAD_MS),
    BACK_DELAY_MS - HIGHLIGHT_CLEAR_LEAD_MS
  );
  assert.notEqual(highlightHoldMs(), 2200);
  assert.equal(highlightHoldMs(200, 300), 0);
});

test('role highlight stays active until 300 ms before backDelay ends', () => {
  withFakeTimers((tick) => {
    const calls = [];
    const highlightTimerRef = { current: null };
    const clearTimerRef = { current: null };

    scheduleRoleHighlight({
      title: 'Creative Technologist',
      updateCurrentPhrase: (phrase) => calls.push(phrase),
      highlightTimerRef,
      clearTimerRef,
    });

    tick(HIGHLIGHT_SETTLE_MS - 1);
    assert.deepEqual(calls, []);

    tick(1);
    assert.deepEqual(calls, ['Creative Technologist']);

    // Must still be highlighted well past the old 2200 ms cutoff and up to 23699 ms.
    tick(2200 - HIGHLIGHT_SETTLE_MS);
    assert.deepEqual(calls, ['Creative Technologist']);

    tick(highlightHoldMs() - 2200 - 1);
    assert.deepEqual(calls, ['Creative Technologist']);

    // Clears at 23700 ms (300 ms before backDelay 24000 ms ends).
    tick(1);
    assert.deepEqual(calls, ['Creative Technologist', '']);
    assert.equal(highlightTimerRef.current, null);
    assert.equal(clearTimerRef.current, null);
  });
});

test('clearing or rescheduling cancels pending highlight timers', () => {
  withFakeTimers((tick) => {
    const calls = [];
    const highlightTimerRef = { current: null };
    const clearTimerRef = { current: null };

    scheduleRoleHighlight({
      title: 'Manufacturing Engineer',
      updateCurrentPhrase: (phrase) => calls.push(phrase),
      highlightTimerRef,
      clearTimerRef,
    });

    tick(HIGHLIGHT_SETTLE_MS);
    assert.deepEqual(calls, ['Manufacturing Engineer']);

    // Starting a new role before the previous hold ends cancels the old clear timer.
    tick(5000);
    scheduleRoleHighlight({
      title: 'Senior Creative Technologist',
      updateCurrentPhrase: (phrase) => calls.push(phrase),
      highlightTimerRef,
      clearTimerRef,
    });

    tick(HIGHLIGHT_SETTLE_MS);
    assert.deepEqual(calls, [
      'Manufacturing Engineer',
      'Senior Creative Technologist',
    ]);

    // Advancing to when the first role would have cleared must not clear the second role.
    tick(highlightHoldMs() - 5000 - HIGHLIGHT_SETTLE_MS);
    assert.deepEqual(calls, [
      'Manufacturing Engineer',
      'Senior Creative Technologist',
    ]);

    // Explicit teardown prevents any pending timer from firing later.
    clearHighlightTimers(highlightTimerRef, clearTimerRef);
    tick(BACK_DELAY_MS);
    assert.deepEqual(calls, [
      'Manufacturing Engineer',
      'Senior Creative Technologist',
    ]);
  });
});

test('clearing immediately on tiny backDelay cancels any pending settle timer', () => {
  withFakeTimers((tick) => {
    const calls = [];
    const highlightTimerRef = { current: null };
    const clearTimerRef = { current: null };

    scheduleRoleHighlight({
      title: 'Creative Technologist',
      updateCurrentPhrase: (phrase) => calls.push(phrase),
      highlightTimerRef,
      clearTimerRef,
      settleMs: 300,
      backDelayMs: 200,
      clearLeadMs: 300,
    });

    tick(500);
    assert.deepEqual(calls, ['']);
  });
});

test('UITypewriter uses the shared backDelay and hold timing with no 2200 ms literal', () => {
  const source = fs.readFileSync(typewriterPath, 'utf8');
  assert.match(source, /from ['"]\.\/typewriterTiming['"]/);
  assert.match(source, /backDelay=\{BACK_DELAY_MS\}/);
  assert.match(source, /scheduleRoleHighlight\(/);
  assert.match(source, /clearHighlightTimers\(/);
  assert.doesNotMatch(source, /\b2200\b/);
});
