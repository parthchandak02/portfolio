// Guards the card logos entrypoints documented in AGENTS.md: make-logo, preview and render-topics
// keep their CLI shapes and stay callable as node scripts from the repo root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { selectTopicNames } from '../scripts/logos/render-topics.mjs';
import { parseMakeLogoArgs, stack } from '../scripts/logos/make-logo.mjs';
import { collectLogoFiles, renderPreviewSheet } from '../scripts/logos/preview.mjs';

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

  it('renders a requested topic SVG via CLI into 512x512 and trimmed PNGs and rejects unknown names', async () => {
    const { spawnSync } = await import('node:child_process');
    const sharp = (await import('sharp')).default;
    const full = path.join(root, 'public/logos/topic-robotics.png');
    const trimmed = path.join(root, 'public/logos/trim/topic-robotics.png');
    const origFull = fs.readFileSync(full);
    const origTrim = fs.readFileSync(trimmed);
    try {
      const ok = spawnSync(process.execPath, [renderTopics, 'robotics'], {
        cwd: root,
        encoding: 'utf8'
      });
      assert.equal(ok.status, 0, ok.stderr);
      assert.equal(ok.stdout.trim(), path.join('public', 'logos', 'topic-robotics.png'));
      const fullMeta = await sharp(full).metadata();
      const trimMeta = await sharp(trimmed).metadata();
      assert.equal(fullMeta.width, 512);
      assert.equal(fullMeta.height, 512);
      assert.ok(trimMeta.width < 512);
      assert.ok(trimMeta.height < 512);

      const fail = spawnSync(process.execPath, [renderTopics, 'not-a-topic'], {
        cwd: root,
        encoding: 'utf8'
      });
      assert.notEqual(fail.status, 0);
      assert.match(fail.stderr, /Unknown topic logo name\(s\): not-a-topic/);
    } finally {
      fs.writeFileSync(full, origFull);
      fs.writeFileSync(trimmed, origTrim);
    }
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

  it('writes a margin-trimmed copy in trim/ so info tiles can load /logos/trim/<name>.png', async () => {
    const os = await import('node:os');
    const { execFileSync } = await import('node:child_process');
    const sharp = (await import('sharp')).default;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'make-logo-trim-'));
    try {
      const svg = path.join(dir, 'wide.svg');
      const logosDir = path.join(dir, 'logos');
      fs.mkdirSync(logosDir);
      const out = path.join(logosDir, 'wide-logo.png');
      const trimmed = path.join(logosDir, 'trim', 'wide-logo.png');
      fs.writeFileSync(
        svg,
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">' +
          '<rect x="10" y="10" width="180" height="40" fill="#000"/>' +
          '</svg>'
      );
      execFileSync(process.execPath, [makeLogo, svg, out], {
        cwd: root,
        stdio: 'pipe'
      });
      assert.equal(fs.existsSync(out), true, '512x512 logo missing');
      assert.equal(fs.existsSync(trimmed), true, 'trimmed tile logo missing in trim/');
      const fullMeta = await sharp(out).metadata();
      const trimMeta = await sharp(trimmed).metadata();
      assert.equal(fullMeta.width, 512);
      assert.equal(fullMeta.height, 512);
      assert.ok(trimMeta.width < 512, 'trimmed width should cut off empty 512x512 margins');
      assert.ok(trimMeta.height < 300, 'trimmed height should cut off empty vertical margins');
      // 180 x 40 scaled to 430 px wide is 430 x 96; 3% pad on 430 is 13 px on each side -> 456 x 122.
      assert.equal(trimMeta.width, 456);
      assert.equal(trimMeta.height, 122);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('applies --crop, --erase, --ink alpha/dark, and rejects a blank mark via CLI', async () => {
    const os = await import('node:os');
    const { spawnSync } = await import('node:child_process');
    const sharp = (await import('sharp')).default;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'make-logo-opts-'));
    try {
      const logosDir = path.join(dir, 'logos');
      fs.mkdirSync(logosDir);
      // 100 x 100 SVG: top-left dark mark (10..50, 10..30), bottom tagline (10..90, 70..90),
      // and a white square on the right (60..90, 10..40) on a light background.
      const svg = path.join(dir, 'mark.svg');
      fs.writeFileSync(
        svg,
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
          '<rect x="0" y="0" width="100" height="50" fill="#e0e0e0"/>' +
          '<rect x="10" y="10" width="40" height="20" fill="#111111"/>' +
          '<rect x="60" y="10" width="30" height="20" fill="#ffffff"/>' +
          '<rect x="10" y="70" width="80" height="20" fill="#111111"/>' +
          '</svg>'
      );

      // --crop top half, --erase right side, --ink dark keeps only the 40x20 dark mark (2:1 aspect -> 430x215).
      const darkOut = path.join(logosDir, 'dark-logo.png');
      const darkRun = spawnSync(
        process.execPath,
        [makeLogo, svg, darkOut, '--ink', 'dark', '--crop', '0,0,1,0.5', '--erase', '0.55,0,0.45,1'],
        { cwd: root, encoding: 'utf8' }
      );
      assert.equal(darkRun.status, 0, darkRun.stderr);
      assert.match(darkRun.stdout, /mark 430x215 on 512x512/);

      // --ink alpha on a white-on-transparent SVG keeps the 30x30 square mark (1:1 aspect -> capped at 370x370).
      const whiteSvg = path.join(dir, 'white.svg');
      const alphaOut = path.join(logosDir, 'alpha-logo.png');
      fs.writeFileSync(
        whiteSvg,
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
          '<rect x="20" y="20" width="30" height="30" fill="#ffffff"/>' +
          '</svg>'
      );
      const alphaRun = spawnSync(
        process.execPath,
        [makeLogo, whiteSvg, alphaOut, '--ink', 'alpha'],
        { cwd: root, encoding: 'utf8' }
      );
      assert.equal(alphaRun.status, 0, alphaRun.stderr);
      assert.match(alphaRun.stdout, /mark 370x370 on 512x512/);
      const alphaMeta = await sharp(path.join(logosDir, 'trim', 'alpha-logo.png')).metadata();
      assert.equal(alphaMeta.width, 392);
      assert.equal(alphaMeta.height, 392);

      // Default --ink any on an all-white SVG finds no mark and exits non-zero.
      const blankRun = spawnSync(
        process.execPath,
        [makeLogo, whiteSvg, path.join(logosDir, 'blank.png')],
        { cwd: root, encoding: 'utf8' }
      );
      assert.notEqual(blankRun.status, 0);
      assert.match(blankRun.stderr, /No mark found: try a different --ink mode/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('preview: names missing sources, empty folders, and unreadable logos clearly', () => {
  it('collects sorted png and svg logos from folders alongside direct files', async () => {
    const os = await import('node:os');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'preview-collect-'));
    try {
      const folder = path.join(dir, 'logos');
      fs.mkdirSync(folder);
      fs.writeFileSync(path.join(folder, 'b.svg'), '<svg/>');
      fs.writeFileSync(path.join(folder, 'a.png'), '');
      fs.writeFileSync(path.join(folder, 'notes.txt'), 'ignored');
      const extra = path.join(dir, 'extra.png');
      fs.writeFileSync(extra, '');

      assert.deepEqual(collectLogoFiles([folder, extra]), [
        path.join(folder, 'a.png'),
        path.join(folder, 'b.svg'),
        extra
      ]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('names a missing source path instead of throwing a raw stat error', () => {
    const missing = path.join(root, 'public/logos/does-not-exist-logo.png');
    assert.throws(
      () => collectLogoFiles([missing]),
      new RegExp(`Logo source not found: ${missing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
    );
  });

  it('rejects a folder with no png or svg files instead of failing with zero width in sharp', async () => {
    const os = await import('node:os');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'preview-empty-'));
    try {
      fs.writeFileSync(path.join(dir, 'readme.txt'), 'not a logo');
      assert.throws(
        () => collectLogoFiles([dir]),
        /No \.png or \.svg logo files found in:/
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('names the failing logo file when sharp cannot decode it', async () => {
    const os = await import('node:os');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'preview-bad-logo-'));
    try {
      const bad = path.join(dir, 'broken.png');
      const out = path.join(dir, 'sheet.png');
      fs.writeFileSync(bad, 'not valid image bytes');
      await assert.rejects(
        () => renderPreviewSheet(out, [bad]),
        /Failed to load logo ".*broken\.png":/
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('names the output path when the preview sheet cannot be written', async () => {
    const os = await import('node:os');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'preview-bad-out-'));
    try {
      const svg = path.join(dir, 'mark.svg');
      fs.writeFileSync(
        svg,
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" fill="#fff"/></svg>'
      );
      const badOut = path.join(dir, 'missing-dir', 'sheet.png');
      await assert.rejects(
        () => renderPreviewSheet(badOut, [svg]),
        /Failed to write preview sheet ".*missing-dir\/sheet\.png":/
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('renders a preview sheet via CLI and exits cleanly with a clear stderr message on error', async () => {
    const os = await import('node:os');
    const { spawnSync } = await import('node:child_process');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'preview-cli-'));
    try {
      const svg = path.join(dir, 'mark.svg');
      const sheet = path.join(dir, 'sheet.png');
      fs.writeFileSync(
        svg,
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" fill="#fff"/></svg>'
      );

      const ok = spawnSync(process.execPath, [preview, sheet, svg], {
        cwd: root,
        encoding: 'utf8'
      });
      assert.equal(ok.status, 0, ok.stderr);
      assert.equal(fs.existsSync(sheet), true);
      assert.match(ok.stdout, /: 1 logos\n$/);

      const missingDir = path.join(dir, 'empty');
      fs.mkdirSync(missingDir);
      const fail = spawnSync(process.execPath, [preview, sheet, missingDir], {
        cwd: root,
        encoding: 'utf8'
      });
      assert.equal(fail.status, 1);
      assert.match(fail.stderr, /^No \.png or \.svg logo files found in:/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

