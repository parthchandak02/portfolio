// The glass that joins an open tile to the details under its row (src/components/tileGlassOutline.js).
// The clip is the filled shape; the edge is the same outline with each neck's top left out, because that
// is where the glass runs on into the tile. Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { tileGlassOutline } from '../src/components/tileGlassOutline.js';

// Path commands alternate x y. Z closes the clip and never appears on the edge.
const commands = (d) =>
  d
    .split(/(?=[MLQZ])/)
    .filter(Boolean)
    .map((part) => ({
      cmd: part[0],
      nums: part.slice(1).trim().split(/\s+/).filter(Boolean).map(Number),
    }));

const points = (d) => commands(d).flatMap((c) => c.nums);

const within = (d, { x0, x1, y0, y1 }) => {
  const nums = points(d);
  for (let i = 0; i < nums.length; i += 2) {
    assert.ok(nums[i] >= x0 - 1e-9 && nums[i] <= x1 + 1e-9, `x ${nums[i]}`);
    assert.ok(
      nums[i + 1] >= y0 - 1e-9 && nums[i + 1] <= y1 + 1e-9,
      `y ${nums[i + 1]}`
    );
  }
};

// Subtract dy from every y, leaving the commands and the x values alone.
const shiftY = (d, dy) =>
  commands(d)
    .map((c) => {
      const nums = c.nums.map((n, i) => (i % 2 === 1 ? n + dy : n));
      return c.cmd + nums.join(' ');
    })
    .join(' ');

test('nothing is drawn before the glass clears the tile, or with no neck', () => {
  const neck = [{ x0: 100, x1: 200 }];
  assert.equal(tileGlassOutline([], 100, 112, 400, 0, 800, 0), null);
  assert.equal(tileGlassOutline(neck, 100, 112, 100, 0, 800, 0), null);
  assert.equal(tileGlassOutline(neck, 100, 112, 100.5, 0, 800, 0), null);
});

test('while the details are still in the gap, each neck is its own rounded stub', () => {
  // foot 100, gap ends at 112, details have only reached 112.5, so the full body is not drawn yet.
  const shape = tileGlassOutline(
    [
      { x0: 100, x1: 300 },
      { x0: 400, x1: 460 },
    ],
    100,
    112,
    112.5,
    0,
    800,
    0
  );
  const wide =
    'L300 106.25 Q300 112.5 293.75 112.5 L106.25 112.5 Q100 112.5 100 106.25 L100 100';
  const narrow =
    'L460 106.25 Q460 112.5 453.75 112.5 L406.25 112.5 Q400 112.5 400 106.25 L400 100';
  assert.equal(
    shape.clip,
    `M100 100 L300 100 ${wide} Z M400 100 L460 100 ${narrow} Z`
  );
  // The stroke starts at the right of each neck, so it does not cross the top into the tile.
  assert.equal(shape.edge, `M300 100 ${wide} M460 100 ${narrow}`);
  assert.equal(shape.edge.includes('Z'), false);
  within(shape.clip, { x0: 100, x1: 460, y0: 100, y1: 112.5 });
});

test('once the details clear the gap, one closed clip spans the row and the edge skips each neck', () => {
  const neck = [{ x0: 200, x1: 360 }];
  const shape = tileGlassOutline(neck, 200, 212, 500, 40, 760, 0);
  assert.equal(
    shape.clip,
    [
      'M40 480',
      'L40 232 Q40 212 60 212',
      'L188 212 Q200 212 200 200 L200 200',
      'L360 200',
      'L360 200 Q360 212 372 212',
      'L740 212 Q760 212 760 232',
      'L760 480 Q760 500 740 500 L60 500 Q40 500 40 480',
      'Z',
    ].join(' ')
  );
  // Same route, but the line across the neck's top (200,200 to 360,200) becomes a move.
  assert.equal(
    shape.clip
      .replace('L200 200 L360 200', 'L200 200 M360 200')
      .replace(/ Z$/, ''),
    shape.edge
  );
  assert.equal(shape.edge.endsWith('Z'), false);
  within(shape.clip, { x0: 40, x1: 760, y0: 200, y1: 500 });

  // The box origin only shifts y. x, and the shape, stay put.
  const shifted = tileGlassOutline(neck, 200, 212, 500, 40, 760, 80);
  assert.equal(shifted.clip, shiftY(shape.clip, -80));
  assert.equal(shifted.edge, shiftY(shape.edge, -80));
});

test('the corner radius shrinks for a short drop or a narrow row, and never passes 20', () => {
  const short = tileGlassOutline([{ x0: 50, x1: 100 }], 0, 12, 13, 0, 200, 0);
  // Half a pixel of height is less than the 20px corner, so the radius is 0.5.
  assert.equal(
    short.clip,
    [
      'M0 12.5',
      'L0 12.5 Q0 12 0.5 12',
      'L38 12 Q50 12 50 0 L50 0',
      'L100 0',
      'L100 0 Q100 12 112 12',
      'L199.5 12 Q200 12 200 12.5',
      'L200 12.5 Q200 13 199.5 13 L0.5 13 Q0 13 0 12.5',
      'Z',
    ].join(' ')
  );

  const narrow = tileGlassOutline([{ x0: 10, x1: 20 }], 0, 10, 100, 0, 30, 0);
  // The row is only 30px wide, so the corner is half of that (15) rather than 20.
  assert.equal(narrow.clip.startsWith('M0 85'), true);
  assert.equal(
    narrow.clip,
    [
      'M0 85',
      'L0 15 Q0 10 5 10',
      'L5 10 Q10 10 10 5 L10 0',
      'L20 0',
      'L20 5 Q20 10 25 10',
      'L25 10 Q30 10 30 15',
      'L30 85 Q30 100 15 100 L15 100 Q0 100 0 85',
      'Z',
    ].join(' ')
  );
  within(narrow.clip, { x0: 0, x1: 30, y0: 0, y1: 100 });
});

test('a neck on the left edge goes straight up, and one on the right edge stops at the side', () => {
  const left = tileGlassOutline(
    [{ x0: 40, x1: 200 }],
    200,
    212,
    500,
    40,
    760,
    0
  );
  assert.equal(
    left.clip,
    [
      'M40 480',
      'L40 200',
      'L200 200',
      'L200 200 Q200 212 212 212',
      'L740 212 Q760 212 760 232',
      'L760 480 Q760 500 740 500 L60 500 Q40 500 40 480',
      'Z',
    ].join(' ')
  );
  assert.equal(left.edge.includes('L40 200 M200 200'), true);

  const right = tileGlassOutline(
    [{ x0: 600, x1: 760 }],
    200,
    212,
    500,
    40,
    760,
    0
  );
  assert.equal(
    right.clip,
    [
      'M40 480',
      'L40 232 Q40 212 60 212',
      'L588 212 Q600 212 600 200 L600 200',
      'L760 200',
      'L760 480 Q760 500 740 500 L60 500 Q40 500 40 480',
      'Z',
    ].join(' ')
  );
  assert.equal(right.edge.includes('L600 200 M760 200'), true);
  within(right.clip, { x0: 40, x1: 760, y0: 200, y1: 500 });
});

test('two necks are walked left to right, and the glass between them returns to the row', () => {
  const shape = tileGlassOutline(
    [
      { x0: 100, x1: 180 },
      { x0: 400, x1: 480 },
    ],
    100,
    120,
    400,
    0,
    600,
    0
  );
  assert.equal(
    shape.clip,
    [
      'M0 380',
      'L0 140 Q0 120 20 120',
      'L88 120 Q100 120 100 108 L100 100',
      'L180 100',
      'L180 108 Q180 120 192 120',
      'L388 120 Q400 120 400 108 L400 100',
      'L480 100',
      'L480 108 Q480 120 492 120',
      'L580 120 Q600 120 600 140',
      'L600 380 Q600 400 580 400 L20 400 Q0 400 0 380',
      'Z',
    ].join(' ')
  );
  assert.equal(shape.edge.includes('L100 100 M180 100'), true);
  assert.equal(shape.edge.includes('L400 100 M480 100'), true);
  assert.equal(shape.edge.includes('Z'), false);
  within(shape.clip, { x0: 0, x1: 600, y0: 100, y1: 400 });
});
