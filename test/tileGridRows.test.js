import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveShownRows, syncShownRows } from '../src/components/tileGridRows.js';

const makeEntries = (keys) => keys.map((key) => ({ key }));

describe('tileGridRows', () => {
  it('clears stale row and keeps identity when entries expand and shift the open tile to a new row', () => {
    const preview = makeEntries([
      'ar-telemedicine',
      'ucd-robotics',
      'paper-3',
      'paper-4',
      'paper-5',
      'paper-6',
    ]);

    // User opens "ucd-robotics" at index 1 (row 0 in a 3-column grid).
    const first = syncShownRows({
      shown: {},
      entries: preview,
      openKey: 'ucd-robotics',
      cols: 3,
      prevCols: 3,
    });
    assert.equal(first.openRow, 0);

    // Clicking "Show all" inserts earlier items so "ucd-robotics" moves to index 3 (row 1).
    const expanded = makeEntries([
      'ar-telemedicine',
      'ethical-governance',
      'hidden-early',
      'ucd-robotics',
      'paper-3',
      'paper-4',
      'paper-5',
      'paper-6',
    ]);

    const second = syncShownRows({
      shown: first.shown,
      entries: expanded,
      openKey: 'ucd-robotics',
      cols: 3,
      prevCols: 3,
    });
    assert.equal(second.openIndex, 3);
    assert.equal(second.openRow, 1);

    const { rows, byRow } = resolveShownRows(second.shown, expanded);
    assert.equal(byRow[0], undefined);
    assert.deepEqual(
      rows.map((r) => ({ row: r.row, index: r.index, key: r.entry.key })),
      [{ row: 1, index: 3, key: 'ucd-robotics' }]
    );
  });

  it('keeps the closing card identity when earlier expansion keeps it on the same row', () => {
    const preview = makeEntries(['a', 'b', 'c', 'd']);
    const opened = syncShownRows({
      shown: {},
      entries: preview,
      openKey: 'b',
      cols: 3,
      prevCols: 3,
    });

    // While 'b' is closing (openKey = null), 'x' is inserted before 'b' so 'b' shifts from index 1 to 2 (still row 0).
    const expanded = makeEntries(['a', 'x', 'b', 'c', 'd']);
    const closing = syncShownRows({
      shown: opened.shown,
      entries: expanded,
      openKey: null,
      cols: 3,
      prevCols: 3,
    });
    const { byRow } = resolveShownRows(closing.shown, expanded);
    assert.equal(byRow[0]?.entry.key, 'b');
    assert.equal(byRow[0]?.index, 2);
  });

  it('drops a closing card whose row changed on expansion instead of rendering under an unrelated row', () => {
    const preview = makeEntries(['a', 'b', 'c', 'd']);
    const opened = syncShownRows({
      shown: {},
      entries: preview,
      openKey: 'c',
      cols: 3,
      prevCols: 3,
    });

    // While 'c' is closing, expansion pushes 'c' from index 2 (row 0) to index 3 (row 1).
    const expanded = makeEntries(['a', 'x', 'b', 'c', 'd']);
    const closing = syncShownRows({
      shown: opened.shown,
      entries: expanded,
      openKey: null,
      cols: 3,
      prevCols: 3,
    });
    const { rows } = resolveShownRows(closing.shown, expanded);
    assert.deepEqual(rows, []);
  });

  it('resets tracked rows when column count changes', () => {
    const entries = makeEntries(['a', 'b', 'c', 'd']);
    const opened = syncShownRows({
      shown: {},
      entries,
      openKey: 'b',
      cols: 3,
      prevCols: 3,
    });
    const resized = syncShownRows({
      shown: opened.shown,
      entries,
      openKey: null,
      cols: 2,
      prevCols: 3,
    });
    assert.deepEqual(resized.shown, {});
  });
});
