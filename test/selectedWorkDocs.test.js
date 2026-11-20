// Guards the Selected work entrypoints documented in AGENTS.md: featured.js stays the source list,
// every pick uses a moment implemented in FeatureCards.jsx, and the agent notes keep purpose, run, and test pointers.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { FEATURED, featuredName } from '../src/data/featured.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const featured = path.join(root, 'src/data/featured.js');
const featureCards = path.join(root, 'src/components/FeatureCards.jsx');
const robot = path.join(root, 'src/components/centiSeedRobot.js');
const timeline = path.join(root, 'src/components/Timeline.jsx');
const spectrum = path.join(root, 'src/data/spectrum.js');
const agents = path.join(root, 'AGENTS.md');

const MOMENTS = new Set(['light', 'robot', 'audio', 'alarm']);

describe('Selected work docs (AGENTS.md)', () => {
  it('keeps featured.js, FeatureCards.jsx, and centiSeedRobot.js at the documented paths', () => {
    assert.equal(fs.existsSync(featured), true, 'src/data/featured.js missing');
    assert.equal(fs.existsSync(featureCards), true, 'src/components/FeatureCards.jsx missing');
    assert.equal(fs.existsSync(robot), true, 'src/components/centiSeedRobot.js missing');
    assert.equal(fs.existsSync(timeline), true, 'src/components/Timeline.jsx missing');
    assert.equal(fs.existsSync(spectrum), true, 'src/data/spectrum.js missing');
  });

  it('documents the workflow in AGENTS.md', () => {
    const text = fs.readFileSync(agents, 'utf8');
    assert.match(text, /## Selected work workflow/);
    assert.match(text, /src\/data\/featured\.js/);
    assert.match(text, /FEATURED/);
    assert.match(text, /featuredName/);
    assert.match(text, /src\/components\/FeatureCards\.jsx/);
    assert.match(text, /src\/components\/centiSeedRobot\.js/);
    assert.match(text, /selectedBand/);
  });

  it('keeps every FEATURED entry well-formed and wired to a moment in FeatureCards.jsx', () => {
    const cardsSrc = fs.readFileSync(featureCards, 'utf8');
    assert.ok(FEATURED.length > 0, 'FEATURED must not be empty');
    for (const item of FEATURED) {
      assert.ok(item.title, 'missing title');
      assert.ok(item.name, `missing name for ${item.title}`);
      assert.ok(item.kind, `missing kind for ${item.title}`);
      assert.ok(item.line, `missing line for ${item.title}`);
      assert.ok(MOMENTS.has(item.moment), `unknown moment "${item.moment}" for ${item.title}`);
      assert.match(cardsSrc, new RegExp(`moment === '${item.moment}'`));
      assert.equal(featuredName(item.title), item.name);
    }
  });
});
