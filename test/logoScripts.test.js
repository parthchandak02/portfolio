// Guards the card logos entrypoints documented in AGENTS.md: make-logo, preview and render-topics
// keep their CLI shapes and stay callable as node scripts from the repo root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const makeLogo = path.join(root, 'scripts/logos/make-logo.mjs');
const preview = path.join(root, 'scripts/logos/preview.mjs');
const renderTopics = path.join(root, 'scripts/logos/render-topics.mjs');
const agents = path.join(root, 'AGENTS.md');

describe('card logos scripts (AGENTS.md)', () => {
  it('keeps make-logo, preview and render-topics at the documented paths', () => {
    assert.equal(fs.existsSync(makeLogo), true, 'scripts/logos/make-logo.mjs missing');
    assert.equal(fs.existsSync(preview), true, 'scripts/logos/preview.mjs missing');
    assert.equal(fs.existsSync(renderTopics), true, 'scripts/logos/render-topics.mjs missing');
  });

  it('documents the workflow in AGENTS.md', () => {
    const text = fs.readFileSync(agents, 'utf8');
    assert.match(text, /scripts\/logos\/make-logo\.mjs/);
    assert.match(text, /scripts\/logos\/preview\.mjs/);
    assert.match(text, /scripts\/logos\/render-topics\.mjs/);
    assert.match(text, /sources\.json/);
  });

  it('keeps the documented CLI usage strings', () => {
    const makeSrc = fs.readFileSync(makeLogo, 'utf8');
    const previewSrc = fs.readFileSync(preview, 'utf8');
    const topicsSrc = fs.readFileSync(renderTopics, 'utf8');
    assert.match(makeSrc, /Usage: node scripts\/logos\/make-logo\.mjs <input> <output\.png>/);
    assert.match(previewSrc, /Usage: node scripts\/logos\/preview\.mjs <sheet\.png>/);
    assert.match(topicsSrc, /topic-\$\{name\}\.png/);
    assert.match(topicsSrc, /topics/);
  });
});
