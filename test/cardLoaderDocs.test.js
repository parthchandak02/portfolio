// Guards the card loader entrypoints documented in AGENTS.md: cards.mjs stays the Vite plugin
// that serves virtual:cards, and the agent notes keep purpose, run, and test pointers in sync.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const cards = path.join(root, 'scripts/cards.mjs');
const cardsTest = path.join(root, 'scripts/cards.test.mjs');
const agents = path.join(root, 'AGENTS.md');
const astroConfig = path.join(root, 'astro.config.mjs');

describe('card loader docs (AGENTS.md)', () => {
  it('keeps cards.mjs and its fixture tests at the documented paths', () => {
    assert.equal(fs.existsSync(cards), true, 'scripts/cards.mjs missing');
    assert.equal(fs.existsSync(cardsTest), true, 'scripts/cards.test.mjs missing');
  });

  it('documents the workflow in AGENTS.md', () => {
    const text = fs.readFileSync(agents, 'utf8');
    assert.match(text, /## Card loader workflow/);
    assert.match(text, /scripts\/cards\.mjs/);
    assert.match(text, /virtual:cards/);
    assert.match(text, /scripts\/cards\.test\.mjs/);
    assert.match(text, /docs\/content\.md/);
    assert.match(text, /loadCards/);
  });

  it('keeps the plugin wired into astro.config.mjs and exporting loadCards', () => {
    const plugin = fs.readFileSync(cards, 'utf8');
    const config = fs.readFileSync(astroConfig, 'utf8');
    assert.match(plugin, /export const loadCards/);
    assert.match(plugin, /virtual:cards/);
    assert.match(config, /from ['"]\.\/scripts\/cards\.mjs['"]/);
    assert.match(config, /plugins:\s*\[[\s\S]*cards\(\)/);
  });
});
