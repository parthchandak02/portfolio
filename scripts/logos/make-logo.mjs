#!/usr/bin/env node
/**
 * Turns an organisation's logo file (SVG, PNG or JPG) into a card logo in the site's style:
 * a white mark on a transparent 512 x 512 square, trimmed, centred and sized to sit with the others.
 * Cards show it at 50 px and invert it in light mode, so it must be one colour.
 *
 *   node scripts/logos/make-logo.mjs <input> <output.png> [options]
 *
 * Options
 *   --ink any|alpha|dark   Which pixels become the mark (default any)
 *                           any:   anything that is not white or transparent. White inside the logo
 *                                  becomes a cut-out, so detail survives.
 *                           alpha: anything opaque. For logos that are already white on transparent.
 *                           dark:  only dark pixels. For a dark mark on a coloured tile, like an app icon.
 *   --crop x,y,w,h         Keep part of the source, as fractions of its size (e.g. 0,0,1,0.6 drops a tagline)
 *   --erase x,y,w,h        Blank part of the source, same units; for a tagline that sits beside part of the mark
 *   --stack                Split a one-line wordmark at its widest word gap and stack the halves,
 *                           so a long name stays legible at 50 px
 *   --box w,h              Space the mark may fill, in px of the 512 canvas (default 430,380)
 *
 * Sizing follows the existing set: wide marks fill about 430 px across, square ones about 370 px,
 * tall ones about 380 px high, so no logo looks louder than its neighbours.
 */
import sharp from 'sharp';
import path from 'node:path';

const CANVAS = 512;
const SQUARE_MAX = 370;

const args = process.argv.slice(2);
const positional = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').match(/^--(ink|crop|erase|box)$/));
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1] ?? true;
};

const [input, output] = positional;
if (!input || !output) {
  console.error('Usage: node scripts/logos/make-logo.mjs <input> <output.png> [--ink any|alpha|dark] [--crop x,y,w,h] [--erase x,y,w,h] [--stack] [--box w,h]');
  process.exit(1);
}
const inkMode = flag('ink') || 'any';
const crop = flag('crop') ? flag('crop').split(',').map(Number) : null;
const erase = flag('erase') ? flag('erase').split(',').map(Number) : null;
const [boxW, boxH] = (flag('box') || '430,380').split(',').map(Number);

// Render big enough that the final downscale is always clean
const load = async () => {
  const isSvg = path.extname(input).toLowerCase() === '.svg';
  let img = sharp(input, isSvg ? { density: 1200 } : {}).ensureAlpha();
  const meta = await img.metadata();
  if (crop) {
    const [x, y, w, h] = crop;
    img = img.extract({
      left: Math.round(x * meta.width), top: Math.round(y * meta.height),
      width: Math.round(w * meta.width), height: Math.round(h * meta.height)
    });
  }
  return img.raw().toBuffer({ resolveWithObject: true });
};

// One value per pixel: how much of the mark it is, 0 to 1
const inkOf = (r, g, b, a) => {
  const alpha = a / 255;
  if (inkMode === 'alpha') return alpha;
  if (inkMode === 'dark') {
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return alpha * Math.min(1, Math.max(0, (150 - lum) / 70));
  }
  // any: distance from white, boosted so mid tones and colours read as solid
  return alpha * Math.min(1, ((255 - Math.min(r, g, b)) / 255) * 2.2);
};

const bounds = (ink, w, h) => {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (ink[y * w + x] > 0.04) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error('No mark found: try a different --ink mode');
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
};

const sub = (ink, w, r) => {
  const out = new Float32Array(r.w * r.h);
  for (let y = 0; y < r.h; y += 1) out.set(ink.subarray((r.y + y) * w + r.x, (r.y + y) * w + r.x + r.w), y * r.w);
  return out;
};

// Split at the widest run of empty columns in the middle half, then put the second part under the first
const stack = (ink, w, h) => {
  const empty = (x) => { for (let y = 0; y < h; y += 1) if (ink[y * w + x] > 0.04) return false; return true; };
  let best = null;
  let run = null;
  for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x += 1) {
    if (empty(x)) {
      if (!run) run = { start: x, end: x };
      else run.end = x;
    } else if (run) {
      if (!best || run.end - run.start > best.end - best.start) best = run;
      run = null;
    }
  }
  if (!best) throw new Error('--stack found no gap between words');
  const left = bounds(sub(ink, w, { x: 0, y: 0, w: best.start, h }), best.start, h);
  const rightX = best.end + 1;
  const right = bounds(sub(ink, w, { x: rightX, y: 0, w: w - rightX, h }), w - rightX, h);
  right.x += rightX;
  const lead = Math.round(Math.max(left.h, right.h) * 0.18);
  const outW = Math.max(left.w, right.w);
  const outH = left.h + lead + right.h;
  const out = new Float32Array(outW * outH);
  const blit = (r, oy) => {
    const part = sub(ink, w, r);
    for (let y = 0; y < r.h; y += 1) out.set(part.subarray(y * r.w, (y + 1) * r.w), (oy + y) * outW);
  };
  blit(left, 0);
  blit(right, left.h + lead);
  return { ink: out, w: outW, h: outH };
};

const { data, info } = await load();
let w = info.width;
let h = info.height;
let ink = new Float32Array(w * h);
for (let i = 0; i < w * h; i += 1) ink[i] = inkOf(data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]);
if (erase) {
  const [ex, ey, ew, eh] = erase;
  for (let y = Math.round(ey * h); y < Math.min(h, Math.round((ey + eh) * h)); y += 1) {
    ink.fill(0, y * w + Math.round(ex * w), y * w + Math.min(w, Math.round((ex + ew) * w)));
  }
}

const box = bounds(ink, w, h);
ink = sub(ink, w, box);
w = box.w;
h = box.h;
if (flag('stack')) ({ ink, w, h } = stack(ink, w, h));

// Fit inside the box; a near-square mark stops at SQUARE_MAX so it does not outweigh the wordmarks
const aspect = w / h;
const limitW = aspect > 0.8 && aspect < 1.25 ? Math.min(boxW, SQUARE_MAX) : boxW;
const limitH = aspect > 0.8 && aspect < 1.25 ? Math.min(boxH, SQUARE_MAX) : boxH;
const scale = Math.min(limitW / w, limitH / h);
const outW = Math.max(1, Math.round(w * scale));
const outH = Math.max(1, Math.round(h * scale));

const rgba = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i += 1) {
  rgba[i * 4] = 255;
  rgba[i * 4 + 1] = 255;
  rgba[i * 4 + 2] = 255;
  rgba[i * 4 + 3] = Math.round(ink[i] * 255);
}
const mark = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
  .resize(outW, outH, { kernel: 'lanczos3' })
  .png()
  .toBuffer();

await sharp({ create: { width: CANVAS, height: CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: mark, left: Math.round((CANVAS - outW) / 2), top: Math.round((CANVAS - outH) / 2) }])
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(`${output}: mark ${outW}x${outH} on ${CANVAS}x${CANVAS}`);
