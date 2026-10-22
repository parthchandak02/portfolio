#!/usr/bin/env node
/**
 * Renders the topic logos in scripts/logos/topics/*.svg to public/logos/topic-<name>.png.
 *
 * Topic logos mark work with no organisation behind it (independent research, side projects).
 * They are drawn, not converted, to one spec so they read as a set:
 *   - 512 x 512 viewBox, white strokes on transparent, no fill except small solid nodes
 *   - stroke-width 16 with round caps and joins (about 1.5 px at the 50 px card size)
 *   - the drawing stays inside the central 300 x 300 area (106 to 406), centred
 * They render at their drawn size, never rescaled, so every line keeps the same weight.
 *
 *   node scripts/logos/render-topics.mjs [name ...]
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const topics = path.join(here, 'topics');
const out = path.join(here, '..', '..', 'public', 'logos');
const wanted = process.argv.slice(2);

const names = fs.readdirSync(topics)
  .filter((f) => f.endsWith('.svg'))
  .map((f) => f.replace(/\.svg$/, ''))
  .filter((n) => !wanted.length || wanted.includes(n));

for (const name of names) {
  const file = path.join(out, `topic-${name}.png`);
  await sharp(path.join(topics, `${name}.svg`), { density: 72 }).resize(512, 512).png({ compressionLevel: 9 }).toFile(file);
  console.log(path.relative(process.cwd(), file));
}
