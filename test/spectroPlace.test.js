// The spectrograph's line placement (src/components/spectroPlace.js). Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EDGE, MIN_GAP, place, warp } from '../src/components/spectroPlace.js';

// `n` dated entries spread evenly over the record's years, in the shape place() takes
const entries = (n, from = 2015, to = 2026.8) =>
  Array.from({ length: n }, (_, i) => ({
    item: { t: n === 1 ? from : from + ((to - from) * i) / (n - 1), title: `item ${i}` }
  }));

const inside = (placed, width) =>
  placed.filter(({ x }) => x < EDGE - 0.001 || x > width - EDGE + 0.001);

test('every line stays on a track with room to spare', () => {
  const width = 880; // the strip on a desktop
  assert.deepEqual(inside(place(entries(99), width), width), []);
});

test('every line stays on a track too narrow to hold them all', () => {
  // The record is 99 lines; on a 320 px phone the strip measures 280 px, which is less than the
  // 99 x 3.5 px the full gap would need. The lines used to be pushed off the left end of the strip.
  const width = 280;
  const off = inside(place(entries(99), width), width);
  assert.deepEqual(off.map(({ x }) => Math.round(x)), [], `${off.length} of 99 lines are off the track`);
});

test('lines keep their date order, whatever the width', () => {
  [280, 360, 880].forEach((width) => {
    const placed = place(entries(99), width);
    assert.deepEqual(placed.map((p) => p.item.title), entries(99).map((e) => e.item.title));
    placed.forEach((p, i) => {
      if (i > 0) assert.ok(p.x >= placed[i - 1].x, `line ${i} is left of line ${i - 1} at width ${width}`);
    });
  });
});

test('neighbours keep the full gap when the track has room for it', () => {
  const placed = place(entries(12, 2026, 2026.1), 880); // a dozen items within weeks of each other
  placed.forEach((p, i) => {
    if (i > 0) assert.ok(p.x - placed[i - 1].x >= MIN_GAP - 0.001, `gap ${p.x - placed[i - 1].x} at line ${i}`);
  });
});

test('a line is placed by its own date, not just spread out', () => {
  const placed = place(entries(3, 2015, 2027), 1000);
  assert.equal(Math.round(placed[0].x), EDGE); // 2015, the start of the record
  assert.equal(Math.round(placed[2].x), 1000 - EDGE); // 2027, the end of it
  assert.equal(Math.round(placed[1].x), Math.round(EDGE + warp(2021) * (1000 - EDGE * 2)));
});

test('one line, or none, is no trouble', () => {
  assert.deepEqual(place([], 280), []);
  assert.deepEqual(inside(place(entries(1, 2015), 280), 280), []);
});
