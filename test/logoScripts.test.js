// Guards the card logos entrypoints documented in AGENTS.md: make-logo, preview and render-topics
// keep their CLI shapes and stay callable as node scripts from the repo root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { selectTopicNames } from '../scripts/logos/render-topics.mjs';
import { parseMakeLogoArgs, stack } from '../scripts/logos/make-logo.mjs';

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

  it('stacks a two-word mark even when the gap between words reaches 80% of the width', async () => {
    const os = await import('node:os');
    const { execFileSync } = await import('node:child_process');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'make-logo-stack-'));
    try {
      // A wide first word (x: 0..64) and a short second word (x: 82..100), so the gap
      // runs across the 80% boundary of the trimmed 100 px mark.
      const svg = path.join(dir, 'two-words.svg');
      const out = path.join(dir, 'out.png');
      fs.writeFileSync(
        svg,
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20">' +
          '<rect x="0" y="2" width="64" height="16" fill="#000"/>' +
          '<rect x="82" y="2" width="18" height="16" fill="#000"/>' +
          '</svg>'
      );
      execFileSync(process.execPath, [makeLogo, svg, out, '--stack'], {
        cwd: root,
        stdio: 'pipe'
      });
      assert.equal(fs.existsSync(out), true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('picks the widest word gap even when that gap runs to the 80% scan boundary', () => {
    // 100 x 10 mark: a narrow intra-word gap at x=30..31 (2 px), and the real word gap at x=70..79 (10 px).
    const w = 100;
    const h = 10;
    const ink = new Float32Array(w * h);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const inGap1 = x >= 30 && x <= 31;
        const inGap2 = x >= 70 && x <= 79;
        if (!inGap1 && !inGap2) ink[y * w + x] = 1;
      }
    }
    const stacked = stack(ink, w, h);
    // Split at x=70..79: left word is 70 px wide (0..69), right word is 20 px wide (80..99).
    assert.equal(stacked.w, 70);
    assert.ok(stacked.h > h * 2);
  });
});


