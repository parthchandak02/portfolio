// The band bar's choice of card (src/hooks/scrollReading.js) and the scroll that lands a jump on it.
// Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STICK_AT,
  BAR_CLEARANCE,
  readingLineFromRect,
  glideReadingLine,
  rowHeightOf,
  barIsStuck,
  cardOnLine,
  scrollTopForCard,
} from '../src/hooks/scrollReading.js';

const view = { top: 0, bottom: 900, height: 900 };
const line = readingLineFromRect(view); // 505

const card = (over = {}) => ({
  category: 'research',
  title: 'Paper',
  top: 400,
  bottom: 600,
  left: 0,
  height: 200,
  ...over,
});

const named = (items, extra = {}) =>
  cardOnLine({
    items,
    scroll: { top: view.top, bottom: view.bottom },
    line,
    ...extra,
  });

test('the reading line sits between the band bar and the bottom of the screen', () => {
  assert.equal(
    readingLineFromRect({ top: 0, bottom: 900 }),
    (0 + BAR_CLEARANCE + 900) / 2
  );
  assert.equal(
    readingLineFromRect({ top: 80, bottom: 880 }),
    (80 + BAR_CLEARANCE + 880) / 2
  );
});

test('over the final stretch the reading line glides down to the last card', () => {
  // Plenty of scroll left: the line stays put.
  assert.equal(glideReadingLine(505, 400, 800), 505);

  // The last card's bottom cannot reach 505. remaining 20, last bottom 700.
  // target = 700 - 20 - 12 = 668, and 668 - 20 = 648 is where the line moves.
  assert.equal(glideReadingLine(505, 20, 700), 648);

  // Equal on either comparison leaves the line where it is.
  const target = 700 - 20 - 12;
  assert.equal(glideReadingLine(target, 20, 700), target);
  assert.equal(glideReadingLine(505, target - 505, 700), 505);
});

test('the bar takes over only once the hero strip has handed off', () => {
  assert.equal(barIsStuck({ scrollTop: 40, stage: null }), false);
  assert.equal(barIsStuck({ scrollTop: 41, stage: null }), true);

  assert.equal(rowHeightOf('46px'), 46);
  assert.equal(rowHeightOf('12.5px'), 12.5);
  assert.equal(rowHeightOf(''), 46);
  assert.equal(rowHeightOf('0'), 46);
  assert.equal(rowHeightOf(undefined), 46);

  // The strip's last lane reaches the hand-off when its bottom, minus one row, is at STICK_AT.
  const stage = (bottom) => ({ bottom, rowH: 46, containerTop: 0 });
  assert.equal(barIsStuck({ scrollTop: 0, stage: stage(46 + STICK_AT) }), true);
  assert.equal(
    barIsStuck({ scrollTop: 500, stage: stage(46 + STICK_AT + 1) }),
    false
  );
});

test('the card the reading line crosses is the one named', () => {
  const hit = card({ category: 'awards', title: 'Merit' });
  assert.deepEqual(named([card({ top: 0, bottom: 100, height: 100 }), hit]), {
    category: 'awards',
    title: 'Merit',
  });
});

test('a row of tiles shares the line from left to right', () => {
  const tiles = ['Left', 'Middle', 'Right'].map((title, i) =>
    card({ title, left: i * 120, top: 400, bottom: 600, height: 200 })
  );
  // progress 0 names the first tile; progress 1 names the last.
  assert.equal(named(tiles, { line: 400 }).title, 'Left');
  assert.equal(named(tiles, { line: 600 }).title, 'Right');
  // The hand-off is at each third of the row.
  assert.equal(named(tiles, { line: 400 + 200 / 3 - 0.01 }).title, 'Left');
  assert.equal(named(tiles, { line: 400 + 200 / 3 }).title, 'Middle');
  assert.equal(named(tiles, { line: 400 + (200 * 2) / 3 }).title, 'Right');
});

test('a gap names the closest card that is actually on screen', () => {
  const above = card({
    title: 'Above',
    top: 100,
    bottom: 200,
    height: 100,
  });
  const below = card({
    title: 'Below',
    top: 700,
    bottom: 820,
    height: 120,
  });
  assert.equal(named([above, below]).title, 'Below');

  // The same distance keeps the earlier card.
  const twin = card({ title: 'Twin', top: 810, bottom: 910, height: 100 });
  const first = card({ title: 'First', top: 100, bottom: 200, height: 100 });
  assert.equal(named([first, twin]).title, 'First');

  // 15% of the card on screen is not enough; just over 15% is.
  const peek = (visible) =>
    card({
      title: 'Peek',
      top: view.bottom - visible,
      bottom: view.bottom - visible + 200,
      height: 200,
    });
  assert.equal(named([peek(30)], { line: 100 }).title, null);
  assert.equal(named([peek(31)], { line: 100 }).title, 'Peek');
});

test('above the record the bar names the first section, and below it keeps the last card', () => {
  const first = card({
    category: 'experience',
    title: 'First job',
    top: 880,
    bottom: 1080,
    height: 200,
  });
  // 20px of a 200px card is on screen, under the 15% that counts, so the hero still names the section.
  assert.deepEqual(named([first], { line: 200 }), {
    category: 'experience',
    title: null,
  });

  const last = card({
    category: 'projects',
    title: 'Last project',
    top: -400,
    bottom: -200,
    height: 200,
  });
  assert.deepEqual(named([last], { line: 505 }), {
    category: 'projects',
    title: 'Last project',
  });
});

test('an open tile stays named while its details cross the line', () => {
  const tile = card({ title: 'Closed', top: 100, bottom: 200, height: 100 });
  const drawers = [
    {
      top: 400,
      bottom: 700,
      owner: false,
      category: 'research',
      title: 'Skip',
    },
    { top: 450, bottom: 800, owner: true, category: 'awards', title: 'Open' },
  ];
  // The first drawer the line crosses has no tile, so a later one does not take its place.
  assert.equal(named([tile], { drawers }).title, 'Closed');

  const open = [
    { top: 450, bottom: 800, owner: true, category: 'awards', title: 'Open' },
  ];
  assert.deepEqual(named([tile], { drawers: open }), {
    category: 'awards',
    title: 'Open',
  });
  // Drawers are only consulted when the line is in a gap. A card on the line wins.
  assert.equal(
    named([card({ title: 'On the line' })], { drawers: open }).title,
    'On the line'
  );
});

test('Selected work keeps the bar in the gaps around its cards', () => {
  const elsewhere = card({
    category: 'media',
    title: 'A clipping',
    top: 100,
    bottom: 180,
    height: 80,
  });
  const selected = { top: 200, bottom: 800 };
  assert.deepEqual(named([elsewhere], { selected }), {
    category: 'selected',
    title: null,
  });

  // A card that has reached the line is named, even inside that block.
  assert.equal(
    named([card({ category: 'projects', title: 'Find My Zoox' })], { selected })
      .title,
    'Find My Zoox'
  );

  // The block has to reach past the bar. Sitting exactly on that line does not count.
  const threshold = view.top + BAR_CLEARANCE + 60;
  assert.equal(
    named([elsewhere], { selected: { top: 200, bottom: threshold } }).title,
    'A clipping'
  );
  assert.equal(
    named([elsewhere], { selected: { top: line, bottom: 800 } }).category,
    'media'
  );
});

test('a jump lands each tile on the share of the row the bar will name', () => {
  const tiles = ['Left', 'Middle', 'Right'].map((title, i) =>
    card({ title, left: i * 120, top: 300, bottom: 500, height: 200 })
  );
  const scrollTop = 2400;
  tiles.forEach((tile) => {
    const next = scrollTopForCard({
      rect: { top: tile.top, bottom: tile.bottom },
      row: tiles.map((t) => ({
        top: t.top,
        bottom: t.bottom,
        isTarget: t === tile,
      })),
      view,
      scrollTop,
      line,
    });
    const delta = next - scrollTop;
    const moved = tiles.map((t) => ({
      ...t,
      top: t.top - delta,
      bottom: t.bottom - delta,
    }));
    assert.equal(named(moved).title, tile.title);
  });
});

test('a block taller than most of the screen is brought in by its top', () => {
  const tallView = { top: 10, bottom: 810, height: 800 };
  const rect = { top: 400, bottom: 1200 };
  const top = scrollTopForCard({
    rect,
    row: [{ top: rect.top, bottom: rect.bottom, isTarget: true }],
    view: tallView,
    scrollTop: 100,
    line: readingLineFromRect(tallView),
  });
  assert.equal(top, 100 + rect.top - (tallView.top + BAR_CLEARANCE));
});

test('a jump never scrolls above the page', () => {
  const rect = { top: -500, bottom: -400 };
  assert.equal(
    scrollTopForCard({
      rect,
      row: [{ top: rect.top, bottom: rect.bottom, isTarget: true }],
      view,
      scrollTop: 0,
      line,
    }),
    0
  );
});
