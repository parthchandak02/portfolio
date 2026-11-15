// The band bar's tick placement (src/components/bandPlace.js). Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EDGE, MIN_GAP, layout } from '../src/components/bandPlace.js';

// The Projects band: 27 lab projects plus 7 project cards. Most of them share
// 2026, so the gap pass, not the dates, decides where the early ones sit.
const projectsBand = () => [
  ...[2017.1, 2017.7, 2018.2, 2024.7, 2024.9, 2025.1, 2025.2].map((t, i) => ({
    t,
    title: `early ${i}`,
  })),
  ...Array.from({ length: 27 }, (_, i) => ({
    t: 2026 + i / 100,
    title: `lab ${i}`,
  })),
];

const inside = (placed, width) =>
  placed.filter(({ x }) => x < EDGE - 0.001 || x > width - EDGE + 0.001);

test('every tick of the Projects band stays on a narrow track', () => {
  // 34 ticks at 6 px need 210 px. A zoomed phone, or a window near 280 px,
  // gives the bar about 180. The earliest ticks used to be pushed off the left.
  const width = 180;
  const placed = layout(projectsBand(), width);
  const off = inside(placed, width);
  assert.equal(placed.length, 34);
  assert.deepEqual(
    off.map(({ x }) => Math.round(x)),
    [],
    `${off.length} ticks are off the track, first at ${placed[0].x}`
  );
});

test('ticks keep date order, and a wide track still uses the full gap', () => {
  const items = projectsBand();
  [180, 244, 760].forEach((width) => {
    const placed = layout(items, width);
    assert.deepEqual(
      placed.map((p) => p.item.title),
      [...items].sort((a, b) => a.t - b.t).map((item) => item.title)
    );
    placed.forEach((p, i) => {
      if (i > 0) assert.ok(p.x >= placed[i - 1].x - 0.001);
    });
  });

  const tight = layout(
    Array.from({ length: 8 }, (_, i) => ({ t: 2026 + i / 100, title: `${i}` })),
    760
  );
  tight.forEach((p, i) => {
    if (i > 0) {
      assert.ok(p.x - tight[i - 1].x >= MIN_GAP - 0.001);
    }
  });
});

test('a tick is placed by its own date when the neighbours are years apart', () => {
  const placed = layout(
    [
      { t: 2015, title: 'start' },
      { t: 2021, title: 'mid' },
      { t: 2027, title: 'end' },
    ],
    1000
  );
  assert.equal(Math.round(placed[0].x), EDGE);
  assert.equal(Math.round(placed[2].x), 1000 - EDGE);
  assert.equal(
    Math.round(placed[1].x),
    Math.round(EDGE + 0.5 * (1000 - EDGE * 2))
  );
});

test('one tick, or none, is no trouble', () => {
  assert.deepEqual(layout([], 180), []);
  assert.deepEqual(inside(layout([{ t: 2020, title: 'only' }], 180), 180), []);
});
