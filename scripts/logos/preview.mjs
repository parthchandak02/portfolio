#!/usr/bin/env node
/**
 * Draws a review sheet of logos the way cards show them: 50 px on a dark card, and inverted
 * on a light one, with a large copy above to check the detail. New logos sit beside the existing
 * set so any that look louder, smaller or rougher than their neighbours stand out.
 *
 *   node scripts/logos/preview.mjs <sheet.png> <logo or folder> [more...]
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [output, ...sources] = process.argv.slice(2);
if (!output || !sources.length) {
  console.error('Usage: node scripts/logos/preview.mjs <sheet.png> <logo or folder> [more...]');
  process.exit(1);
}

const files = sources.flatMap((s) => (fs.statSync(s).isDirectory()
  ? fs.readdirSync(s).filter((f) => /\.(png|svg)$/i.test(f)).sort().map((f) => path.join(s, f))
  : [s]));

const CELL = 200;
const BIG = 128;
const SMALL = 50;
const ROW = BIG + SMALL * 2 + 90;
const COLS = Math.min(6, files.length);
const rows = Math.ceil(files.length / COLS);
const escape = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const layers = [];
for (const [i, file] of files.entries()) {
  const x = (i % COLS) * CELL;
  const y = Math.floor(i / COLS) * ROW;
  const big = await sharp(file).resize(BIG, BIG, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const small = await sharp(file).resize(SMALL, SMALL, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  // Light mode inverts the logo, as TimelineCard.css does
  const inverted = await sharp(small).negate({ alpha: false }).linear(0.8, 0).png().toBuffer();
  const card = (fill) => Buffer.from(`<svg width="${CELL - 24}" height="${SMALL + 16}"><rect width="100%" height="100%" rx="10" fill="${fill}"/></svg>`);
  layers.push(
    { input: big, left: x + (CELL - BIG) / 2, top: y + 10 },
    { input: card('#1c1c22'), left: x + 12, top: y + BIG + 18 },
    { input: small, left: x + (CELL - SMALL) / 2, top: y + BIG + 26 },
    { input: card('#ecebe8'), left: x + 12, top: y + BIG + SMALL + 40 },
    { input: inverted, left: x + (CELL - SMALL) / 2, top: y + BIG + SMALL + 48 },
    {
      input: Buffer.from(`<svg width="${CELL}" height="20"><text x="${CELL / 2}" y="14" font-family="Helvetica, Arial" font-size="12" fill="#9a9aa2" text-anchor="middle">${escape(path.basename(file))}</text></svg>`),
      left: x, top: y + ROW - 26
    }
  );
}

await sharp({ create: { width: CELL * COLS, height: ROW * rows, channels: 4, background: { r: 10, g: 10, b: 13, alpha: 1 } } })
  .composite(layers)
  .png()
  .toFile(output);
console.log(`${output}: ${files.length} logos`);
