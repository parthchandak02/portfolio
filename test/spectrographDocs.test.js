// Guards the Spectrograph bands entrypoints documented in AGENTS.md: spectrum.js stays the source
// for spectrumBands and card matching, spectroPlace.js and bandPlace.js keep their placement exports,
// and the agent notes keep purpose, run, and test pointers in sync.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { EDGE as bandEdge, MIN_GAP as bandMinGap, layout } from '../src/components/bandPlace.js';
import { EDGE as spectroEdge, MIN_GAP as spectroMinGap, place, warp } from '../src/components/spectroPlace.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const spectrum = path.join(root, 'src/data/spectrum.js');
const spectrograph = path.join(root, 'src/components/Spectrograph.jsx');
const spectroPlace = path.join(root, 'src/components/spectroPlace.js');
const bandBar = path.join(root, 'src/components/BandBar.jsx');
const bandPlace = path.join(root, 'src/components/bandPlace.js');
const agents = path.join(root, 'AGENTS.md');

describe('Spectrograph bands docs (AGENTS.md)', () => {
  it('keeps spectrum.js, Spectrograph.jsx, BandBar.jsx, and placement modules at the documented paths', () => {
    assert.equal(fs.existsSync(spectrum), true, 'src/data/spectrum.js missing');
    assert.equal(fs.existsSync(spectrograph), true, 'src/components/Spectrograph.jsx missing');
    assert.equal(fs.existsSync(spectroPlace), true, 'src/components/spectroPlace.js missing');
    assert.equal(fs.existsSync(bandBar), true, 'src/components/BandBar.jsx missing');
    assert.equal(fs.existsSync(bandPlace), true, 'src/components/bandPlace.js missing');
  });

  it('documents the workflow in AGENTS.md', () => {
    const text = fs.readFileSync(agents, 'utf8');
    assert.match(text, /## Spectrograph bands workflow/);
    assert.match(text, /src\/data\/spectrum\.js/);
    assert.match(text, /spectrumBands/);
    assert.match(text, /SPECTRUM_START/);
    assert.match(text, /SPECTRUM_END/);
    assert.match(text, /CARD_OVERRIDES/);
    assert.match(text, /src\/components\/Spectrograph\.jsx/);
    assert.match(text, /src\/components\/spectroPlace\.js/);
    assert.match(text, /src\/components\/BandBar\.jsx/);
    assert.match(text, /src\/components\/bandPlace\.js/);
  });

  it('keeps documented exports in spectrum.js, spectroPlace.js, and bandPlace.js', () => {
    const spectrumSrc = fs.readFileSync(spectrum, 'utf8');
    assert.match(spectrumSrc, /export const SPECTRUM_START/);
    assert.match(spectrumSrc, /export const SPECTRUM_END/);
    assert.match(spectrumSrc, /export const spectrumBands/);
    assert.match(spectrumSrc, /export const bandForSection/);
    assert.match(spectrumSrc, /CARD_FOR_BAND/);
    assert.match(spectrumSrc, /CARD_OVERRIDES/);
    assert.equal(typeof warp, 'function');
    assert.equal(typeof place, 'function');
    assert.equal(typeof layout, 'function');
    assert.ok(spectroMinGap > 0 && spectroEdge > 0);
    assert.ok(bandMinGap > 0 && bandEdge > 0);
  });
});
