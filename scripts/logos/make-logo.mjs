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
import fs from 'node:fs';
import path from 'node:path';

const CANVAS = 512;
const SQUARE_MAX = 370;

const VALID_FLAGS = ['--ink', '--crop', '--erase', '--stack', '--box'];
const VALUE_FLAGS = new Set(['--ink', '--crop', '--erase', '--box']);
const VALID_INKS = ['any', 'alpha', 'dark'];

const parseRect = (name, raw) => {
  const parts = String(raw).split(',').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n)) || parts[2] <= 0 || parts[3] <= 0) {
    throw new Error(
      `Invalid --${name} "${raw}". Expected four numbers x,y,w,h with positive width and height (for example --${name} 0,0,1,0.6)`
    );
  }
  return parts;
};

const parseBox = (raw) => {
  const parts = String(raw).split(',').map(Number);
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n) || n <= 0)) {
    throw new Error(
      `Invalid --box "${raw}". Expected two positive numbers w,h in pixels (for example --box 430,380)`
    );
  }
  return parts;
};

export const parseMakeLogoArgs = (argv = []) => {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      if (!VALID_FLAGS.includes(arg)) {
        throw new Error(`Unknown option "${arg}". Valid options are: ${VALID_FLAGS.join(', ')}`);
      }
      if (VALUE_FLAGS.has(arg)) {
        const val = argv[i + 1];
        if (!val || val.startsWith('--')) throw new Error(`Option ${arg} is missing its value`);
        flags[arg.slice(2)] = val;
        i += 1;
      } else {
        flags[arg.slice(2)] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  const [input, output] = positional;
  if (!input || !output) {
    throw new Error(
      'Usage: node scripts/logos/make-logo.mjs <input> <output.png> [--ink any|alpha|dark] [--crop x,y,w,h] [--erase x,y,w,h] [--stack] [--box w,h]'
    );
  }
  const inkMode = flags.ink || 'any';
  if (!VALID_INKS.includes(inkMode)) {
    throw new Error(`Unknown --ink mode "${inkMode}". Expected one of: ${VALID_INKS.join(', ')}`);
  }
  const crop = flags.crop ? parseRect('crop', flags.crop) : null;
  const erase = flags.erase ? parseRect('erase', flags.erase) : null;
  const [boxW, boxH] = flags.box ? parseBox(flags.box) : [430, 380];
  return { input, output, inkMode, crop, erase, stackMark: Boolean(flags.stack), boxW, boxH };
};

const runningAsCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

let input;
let output;
let inkMode = 'any';
let crop = null;
let erase = null;
let stackMark = false;
let boxW = 430;
let boxH = 380;
if (runningAsCli) {
  try {
    ({ input, output, inkMode, crop, erase, stackMark, boxW, boxH } = parseMakeLogoArgs(process.argv.slice(2)));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

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
export const stack = (ink, w, h) => {
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
  if (run && (!best || run.end - run.start > best.end - best.start)) best = run;
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

// Info tiles load /logos/trim/<name>.png so the mark fills its 40 px box without the 512 x 512 margin.
export const writeTrimmedLogo = async (logoPath) => {
  const { data, info } = await sharp(logoPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const pad = Math.round(Math.max(bw, bh) * 0.03);
  const left = Math.max(0, x0 - pad);
  const top = Math.max(0, y0 - pad);
  const width = Math.min(info.width - left, bw + 2 * pad);
  const height = Math.min(info.height - top, bh + 2 * pad);
  const trimDir = path.join(path.dirname(logoPath), 'trim');
  fs.mkdirSync(trimDir, { recursive: true });
  const trimPath = path.join(trimDir, path.basename(logoPath));
  await sharp(data, { raw: info })
    .extract({ left, top, width, height })
    .png({ compressionLevel: 9 })
    .toFile(trimPath);
  return { trimPath, width, height };
};

if (runningAsCli) {
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
if (stackMark) ({ ink, w, h } = stack(ink, w, h));

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
await writeTrimmedLogo(output);

console.log(`${output}: mark ${outW}x${outH} on ${CANVAS}x${CANVAS}`);
}
