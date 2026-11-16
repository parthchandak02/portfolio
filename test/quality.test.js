// How much the 3D scene asks of the device (src/hooks/quality.js). A phone gets a
// canvas of at most 1.5x, no final antialiasing, and smaller glass buffers. Anything
// else keeps the full buffers, capped at 2x. The choice is read once, when the
// module loads, so each case loads it in a fresh process. Run with `npm test`.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const qualityUrl = new URL('../src/hooks/quality.js', import.meta.url).href;

const phoneBudget = (dpr) => ({
  dpr,
  msaa: 0,
  glassResolution: 384,
  glassSamples: 4,
  shards: 5,
});

const desktopBudget = (dpr) => ({
  dpr,
  msaa: 4,
  glassResolution: 1024,
  glassSamples: 8,
  shards: 6,
});

// `dpr` may be 0 or missing: the module treats both as 1x (`|| 1`, not `??`).
const loadQuality = ({
  window: hasWindow = true,
  coarse = false,
  width = 1440,
  height = 900,
  dpr = 1,
} = {}) => {
  const dprLiteral = dpr === undefined ? 'undefined' : String(dpr);
  const setup = hasWindow
    ? `globalThis.window = {
        matchMedia(query) {
          return { matches: ${Boolean(coarse)} && query === '(pointer: coarse)' };
        },
        screen: { width: ${Number(width)}, height: ${Number(height)} },
        devicePixelRatio: ${dprLiteral},
      };`
    : 'delete globalThis.window;';
  const script = `${setup}
const mod = await import(${JSON.stringify(qualityUrl)});
process.stdout.write(JSON.stringify({ isPhone: mod.isPhone, QUALITY: mod.QUALITY }));
`;
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', script],
    { encoding: 'utf8' }
  );
  assert.equal(
    result.status,
    0,
    result.stderr || result.stdout || 'quality module failed to load'
  );
  return JSON.parse(result.stdout);
};

const expectPhone = (loaded, dpr) => {
  assert.equal(loaded.isPhone, true);
  assert.deepEqual(loaded.QUALITY, phoneBudget(dpr));
};

const expectDesktop = (loaded, dpr) => {
  assert.equal(loaded.isPhone, false);
  assert.deepEqual(loaded.QUALITY, desktopBudget(dpr));
};

test('with no window the scene keeps the desktop budget at 1x', () => {
  expectDesktop(loadQuality({ window: false }), 1);
});

test('a mouse on a large screen keeps the full glass buffers', () => {
  expectDesktop(
    loadQuality({ coarse: false, width: 1440, height: 900, dpr: 2 }),
    2
  );
});

test('a desktop pixel ratio above 2 is capped so the canvas stays at 2x', () => {
  expectDesktop(
    loadQuality({ coarse: false, width: 1920, height: 1080, dpr: 3 }),
    2
  );
});

test('a narrow screen with a fine pointer still gets the desktop budget', () => {
  expectDesktop(
    loadQuality({ coarse: false, width: 390, height: 844, dpr: 3 }),
    2
  );
});

test('a coarse pointer on a wide screen still gets the desktop budget', () => {
  expectDesktop(
    loadQuality({ coarse: true, width: 1024, height: 1366, dpr: 2 }),
    2
  );
});

test('the phone budget starts when the shorter side drops below 820', () => {
  expectDesktop(
    loadQuality({ coarse: true, width: 820, height: 1180, dpr: 2 }),
    2
  );
  expectPhone(
    loadQuality({ coarse: true, width: 819, height: 1180, dpr: 2 }),
    1.5
  );
});

test('a phone in either orientation gets the cheaper buffers and at most 1.5x', () => {
  expectPhone(
    loadQuality({ coarse: true, width: 390, height: 844, dpr: 3 }),
    1.5
  );
  expectPhone(
    loadQuality({ coarse: true, width: 844, height: 390, dpr: 3 }),
    1.5
  );
});

test('a phone already under the cap is not scaled up', () => {
  expectPhone(
    loadQuality({ coarse: true, width: 390, height: 844, dpr: 1 }),
    1
  );
  expectPhone(
    loadQuality({ coarse: true, width: 390, height: 844, dpr: 1.25 }),
    1.25
  );
});

test('a missing or zero pixel ratio falls back to 1x', () => {
  expectDesktop(
    loadQuality({ coarse: false, width: 1440, height: 900, dpr: undefined }),
    1
  );
  expectDesktop(
    loadQuality({ coarse: false, width: 1440, height: 900, dpr: 0 }),
    1
  );
  expectPhone(
    loadQuality({ coarse: true, width: 390, height: 844, dpr: 0 }),
    1
  );
});

test('the canvas, the glass, the shatter, and the bubbles spend that budget', () => {
  const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');
  const canvas = read('../src/components/Canvas3D.jsx');
  assert.match(canvas, /dpr=\{QUALITY\.dpr\}/);
  assert.match(canvas, /multisampling=\{QUALITY\.msaa\}/);
  const prism = read('../src/components/Prism.jsx');
  assert.match(prism, /resolution=\{QUALITY\.glassResolution\}/);
  assert.match(prism, /samples=\{QUALITY\.glassSamples\}/);
  const shift = read('../src/components/ModeShift.jsx');
  assert.match(shift, /fracture\(a, b, c, QUALITY\.shards, pieces\)/);
  const bubbles = read('../src/components/Bubbles.jsx');
  assert.match(bubbles, /isPhone\s*\?/);
});
