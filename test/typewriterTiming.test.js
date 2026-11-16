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

test('role highlight stays active until 300 ms before backDelay ends', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const calls = [];
  const highlightTimerRef = { current: null };
  const clearTimerRef = { current: null };

  scheduleRoleHighlight({
    title: 'Creative Technologist',
    updateCurrentPhrase: (phrase) => calls.push(phrase),
    highlightTimerRef,
    clearTimerRef,
  });

  t.mock.timers.tick(HIGHLIGHT_SETTLE_MS - 1);
  assert.deepEqual(calls, []);

  t.mock.timers.tick(1);
  assert.deepEqual(calls, ['Creative Technologist']);

  // Must still be highlighted well past the old 2200 ms cutoff and up to 23699 ms.
  t.mock.timers.tick(2200 - HIGHLIGHT_SETTLE_MS);
  assert.deepEqual(calls, ['Creative Technologist']);

  t.mock.timers.tick(highlightHoldMs() - 2200 - 1);
  assert.deepEqual(calls, ['Creative Technologist']);

  // Clears at 23700 ms (300 ms before backDelay 24000 ms ends).
  t.mock.timers.tick(1);
  assert.deepEqual(calls, ['Creative Technologist', '']);
  assert.equal(highlightTimerRef.current, null);
  assert.equal(clearTimerRef.current, null);
});

test('clearing or rescheduling cancels pending highlight timers', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const calls = [];
  const highlightTimerRef = { current: null };
  const clearTimerRef = { current: null };

  scheduleRoleHighlight({
    title: 'Manufacturing Engineer',
    updateCurrentPhrase: (phrase) => calls.push(phrase),
    highlightTimerRef,
    clearTimerRef,
  });

  t.mock.timers.tick(HIGHLIGHT_SETTLE_MS);
  assert.deepEqual(calls, ['Manufacturing Engineer']);

  // Starting a new role before the previous hold ends cancels the old clear timer.
  t.mock.timers.tick(5000);
  scheduleRoleHighlight({
    title: 'Senior Creative Technologist',
    updateCurrentPhrase: (phrase) => calls.push(phrase),
    highlightTimerRef,
    clearTimerRef,
  });

  t.mock.timers.tick(HIGHLIGHT_SETTLE_MS);
  assert.deepEqual(calls, [
    'Manufacturing Engineer',
    'Senior Creative Technologist',
  ]);

  // Advancing to when the first role would have cleared must not clear the second role.
  t.mock.timers.tick(highlightHoldMs() - 5000 - HIGHLIGHT_SETTLE_MS);
  assert.deepEqual(calls, [
    'Manufacturing Engineer',
    'Senior Creative Technologist',
  ]);

  // Explicit teardown prevents any pending timer from firing later.
  clearHighlightTimers(highlightTimerRef, clearTimerRef);
  t.mock.timers.tick(BACK_DELAY_MS);
  assert.deepEqual(calls, [
    'Manufacturing Engineer',
    'Senior Creative Technologist',
  ]);
});

test('clearing immediately on tiny backDelay cancels any pending settle timer', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

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

  t.mock.timers.tick(500);
  assert.deepEqual(calls, ['']);
});

test('UITypewriter uses the shared backDelay and hold timing with no 2200 ms literal', () => {
  const source = fs.readFileSync(typewriterPath, 'utf8');
  assert.match(source, /from ['"]\.\/typewriterTiming['"]/);
  assert.match(source, /backDelay=\{BACK_DELAY_MS\}/);
  assert.match(source, /scheduleRoleHighlight\(/);
  assert.match(source, /clearHighlightTimers\(/);
  assert.doesNotMatch(source, /\b2200\b/);
});
