// Guards the card logos entrypoints documented in AGENTS.md: make-logo, preview and render-topics
// keep their CLI shapes and stay callable as node scripts from the repo root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { selectTopicNames } from '../scripts/logos/render-topics.mjs';
import { parseMakeLogoArgs } from '../scripts/logos/make-logo.mjs';

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

describe('selectTopicNames: unknown names used to fail silently', () => {
  it('returns every available name when none were asked for', () => {
    assert.deepEqual(selectTopicNames(['robotics', 'haptics'], []), ['robotics', 'haptics']);
  });

  it('keeps the folder order when filtering to requested names', () => {
    assert.deepEqual(selectTopicNames(['a', 'b', 'c'], ['c', 'a']), ['a', 'c']);
  });

  it('names the miss and lists the drawn SVGs when a requested topic is absent', () => {
    assert.throws(
      () => selectTopicNames(['robotics', 'haptics'], ['robotcs']),
      /Unknown topic logo name\(s\): robotcs\. Drawn SVGs live in scripts\/logos\/topics\/ \(robotics, haptics\)/
    );
  });

  it('lists every missing name in one error when several are absent', () => {
    assert.throws(
      () => selectTopicNames(['robotics'], ['robotics', 'nope', 'also-missing']),
      /Unknown topic logo name\(s\): nope, also-missing/
    );
  });
});

describe('parseMakeLogoArgs: rejects unknown flags and invalid option values clearly', () => {
  it('parses valid positional arguments and options with defaults', () => {
    assert.deepEqual(parseMakeLogoArgs(['in.svg', 'out.png']), {
      input: 'in.svg',
      output: 'out.png',
      inkMode: 'any',
      crop: null,
      erase: null,
      stackMark: false,
      boxW: 430,
      boxH: 380
    });
    assert.deepEqual(
      parseMakeLogoArgs([
        'in.png',
        'out.png',
        '--ink',
        'dark',
        '--crop',
        '0,0,1,0.5',
        '--erase',
        '0.1,0.2,0.3,0.4',
        '--stack',
        '--box',
        '400,320'
      ]),
      {
        input: 'in.png',
        output: 'out.png',
        inkMode: 'dark',
        crop: [0, 0, 1, 0.5],
        erase: [0.1, 0.2, 0.3, 0.4],
        stackMark: true,
        boxW: 400,
        boxH: 320
      }
    );
  });

  it('fails with usage when input or output is missing', () => {
    assert.throws(
      () => parseMakeLogoArgs(['only-input.svg']),
      /Usage: node scripts\/logos\/make-logo\.mjs <input> <output\.png>/
    );
  });

  it('names an unknown option and lists the valid options instead of ignoring it', () => {
    assert.throws(
      () => parseMakeLogoArgs(['in.svg', 'out.png', '--stak']),
      /Unknown option "--stak"\. Valid options are: --ink, --crop, --erase, --stack, --box/
    );
  });

  it('names an unknown --ink mode and lists any, alpha, dark', () => {
    assert.throws(
      () => parseMakeLogoArgs(['in.svg', 'out.png', '--ink', 'light']),
      /Unknown --ink mode "light"\. Expected one of: any, alpha, dark/
    );
  });

  it('rejects a value option when its value is missing', () => {
    assert.throws(
      () => parseMakeLogoArgs(['in.svg', 'out.png', '--box']),
      /Option --box is missing its value/
    );
    assert.throws(
      () => parseMakeLogoArgs(['in.svg', 'out.png', '--ink', '--stack']),
      /Option --ink is missing its value/
    );
  });

  it('rejects malformed --crop, --erase, and --box values with expected shapes', () => {
    assert.throws(
      () => parseMakeLogoArgs(['in.svg', 'out.png', '--crop', '0,0,1']),
      /Invalid --crop "0,0,1"\. Expected four numbers x,y,w,h with positive width and height/
    );
    assert.throws(
      () => parseMakeLogoArgs(['in.svg', 'out.png', '--erase', '0,0,0,0.5']),
      /Invalid --erase "0,0,0,0.5"\. Expected four numbers x,y,w,h with positive width and height/
    );
    assert.throws(
      () => parseMakeLogoArgs(['in.svg', 'out.png', '--box', '430']),
      /Invalid --box "430"\. Expected two positive numbers w,h in pixels/
    );
    assert.throws(
      () => parseMakeLogoArgs(['in.svg', 'out.png', '--box', '430,-10']),
      /Invalid --box "430,-10"\. Expected two positive numbers w,h in pixels/
    );
  });
});
