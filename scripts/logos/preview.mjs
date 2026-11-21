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
import { fileURLToPath } from 'node:url';

const USAGE = 'Usage: node scripts/logos/preview.mjs <sheet.png> <logo or folder> [more...]';

export const collectLogoFiles = (sources = []) => {
  if (!sources.length) throw new Error(USAGE);
  const files = sources.flatMap((s) => {
    let stat;
    try {
      stat = fs.statSync(s);
    } catch (e) {
      if (e.code === 'ENOENT') throw new Error(`Logo source not found: ${s}`);
      throw new Error(`Cannot read logo source "${s}": ${e.message}`);
    }
    return stat.isDirectory()
      ? fs.readdirSync(s).filter((f) => /\.(png|svg)$/i.test(f)).sort().map((f) => path.join(s, f))
      : [s];
  });
  if (!files.length) {
    throw new Error(`No .png or .svg logo files found in: ${sources.join(', ')}`);
  }
  return files;
};

const CELL = 200;
const BIG = 128;
const SMALL = 50;
const ROW = BIG + SMALL * 2 + 90;
const escape = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export const renderPreviewSheet = async (output, sources = []) => {
  if (!output || !sources.length) throw new Error(USAGE);
  const files = collectLogoFiles(sources);
  const cols = Math.min(6, files.length);
  const rows = Math.ceil(files.length / cols);

  const layers = [];
  for (const [i, file] of files.entries()) {
    const x = (i % cols) * CELL;
    const y = Math.floor(i / cols) * ROW;
    let big;
    let small;
    let inverted;
    try {
      big = await sharp(file).resize(BIG, BIG, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      small = await sharp(file).resize(SMALL, SMALL, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      // Light mode inverts the logo, as TimelineCard.css does
      inverted = await sharp(small).negate({ alpha: false }).linear(0.8, 0).png().toBuffer();
    } catch (e) {
      throw new Error(`Failed to load logo "${file}": ${e.message}`);
    }
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

  try {
    await sharp({ create: { width: CELL * cols, height: ROW * rows, channels: 4, background: { r: 10, g: 10, b: 13, alpha: 1 } } })
      .composite(layers)
      .png()
      .toFile(output);
  } catch (e) {
    throw new Error(`Failed to write preview sheet "${output}": ${e.message}`);
  }
  return { output, count: files.length };
};

const runningAsCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (runningAsCli) {
  const [output, ...sources] = process.argv.slice(2);
  if (!output || !sources.length) {
    console.error(USAGE);
    process.exit(1);
  }
  try {
    const { count } = await renderPreviewSheet(output, sources);
    console.log(`${output}: ${count} logos`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
