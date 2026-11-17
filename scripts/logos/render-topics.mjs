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
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const topics = path.join(here, 'topics');
const out = path.join(here, '..', '..', 'public', 'logos');

// Pick which topic SVGs to render. With no names, every SVG in the folder.
// A name that is not a file used to exit 0 with no output; name the miss and the folder.
export const selectTopicNames = (available, wanted = []) => {
  if (!wanted.length) return [...available];
  const have = new Set(available);
  const missing = wanted.filter((n) => !have.has(n));
  if (missing.length) {
    const listed = available.length ? available.join(', ') : '(none)';
    throw new Error(
      `Unknown topic logo name(s): ${missing.join(', ')}. ` +
        `Drawn SVGs live in scripts/logos/topics/ (${listed})`
    );
  }
  return available.filter((n) => wanted.includes(n));
};

const runningAsCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (runningAsCli) {
  const sharp = (await import('sharp')).default;
  const wanted = process.argv.slice(2);
  const available = fs
    .readdirSync(topics)
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.replace(/\.svg$/, ''));
  const names = selectTopicNames(available, wanted);

  for (const name of names) {
    const file = path.join(out, `topic-${name}.png`);
    await sharp(path.join(topics, `${name}.svg`), { density: 72 })
      .resize(512, 512)
      .png({ compressionLevel: 9 })
      .toFile(file);
    console.log(path.relative(process.cwd(), file));
  }
}
