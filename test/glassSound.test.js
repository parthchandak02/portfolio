// Soft glass card sounds (src/hooks/glassSound.js): mute preference, the
// open+close coalescing into one switch, and the gates that keep sounds quiet
// until the reader has used the page. Run with `npm test`.
import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  glassNotes,
  glassPad,
  glassSound,
  isMuted,
  setMuted,
} from '../src/hooks/glassSound.js';

const glassSoundUrl = new URL('../src/hooks/glassSound.js', import.meta.url).href;

const MUTED_KEY = 'pc-muted';
const COALESCE_MS = 40;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Oscillator starts from every FakeAudioContext this file builds. Cleared per
// case so a reused module-level AudioContext still counts against this case.
const plays = [];
let active = null;

const restoreEnv = async () => {
  await wait(COALESCE_MS);
  setMuted(false);
  active?.restore();
  active = null;
  plays.length = 0;
};

afterEach(restoreEnv);
beforeEach(() => {
  setMuted(false);
  plays.length = 0;
});

function memoryStorage(seed = null) {
  const data = new Map();
  if (seed !== null) data.set(MUTED_KEY, seed);
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
}

function FakeAudioContext() {
  this.state = 'running';
  this.currentTime = 1;
  this.destination = {};
  this.resume = async () => {
    this.state = 'running';
  };
  const connectable = () => ({
    gain: {
      value: 0,
      setValueAtTime() {},
      linearRampToValueAtTime() {},
      exponentialRampToValueAtTime() {},
      setTargetAtTime() {},
    },
    type: 'lowpass',
    frequency: { value: 0 },
    connect(next) {
      return next;
    },
  });
  this.createGain = connectable;
  this.createBiquadFilter = connectable;
  this.createOscillator = () => ({
    type: 'sine',
    frequency: {
      value: 0,
      setValueAtTime() {},
      exponentialRampToValueAtTime() {},
    },
    connect() {
      return this;
    },
    start() {
      plays.push('start');
    },
    stop() {
      plays.push('stop');
    },
  });
}

function installDom({
  hidden = false,
  userActive = true,
  storage = memoryStorage(),
} = {}) {
  active?.restore();
  active = null;
  plays.length = 0;

  // Save the descriptor, not the value: reading globalThis.localStorage in Node
  // triggers ExperimentalWarning when --localstorage-file was not provided.
  const saved = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
    localStorage: Object.getOwnPropertyDescriptor(globalThis, 'localStorage'),
  };

  globalThis.window = {
    AudioContext: FakeAudioContext,
    localStorage: storage,
  };
  globalThis.document = { hidden };
  Object.defineProperty(globalThis, 'navigator', {
    value: { userActivation: { hasBeenActive: userActive } },
    configurable: true,
    enumerable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    enumerable: true,
    writable: true,
  });

  active = {
    storage,
    restore() {
      if (saved.window === undefined) delete globalThis.window;
      else globalThis.window = saved.window;
      if (saved.document === undefined) delete globalThis.document;
      else globalThis.document = saved.document;
      if (saved.navigator)
        Object.defineProperty(globalThis, 'navigator', saved.navigator);
      else delete globalThis.navigator;
      if (saved.localStorage)
        Object.defineProperty(globalThis, 'localStorage', saved.localStorage);
      else delete globalThis.localStorage;
    },
  };
  return active;
}

const starts = () => plays.filter((p) => p === 'start').length;

test('setMuted remembers the choice the same way light mode does', () => {
  const env = installDom({ storage: memoryStorage() });
  assert.equal(isMuted(), false);
  setMuted(true);
  assert.equal(isMuted(), true);
  assert.equal(env.storage.getItem(MUTED_KEY), '1');
  setMuted(false);
  assert.equal(isMuted(), false);
  assert.equal(env.storage.getItem(MUTED_KEY), '0');
});

test('importing glassSound in Node does not warn about localStorage', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import ${JSON.stringify(glassSoundUrl)};`,
    ],
    { encoding: 'utf8' }
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr.includes('ExperimentalWarning'), false);
  assert.equal(result.stderr.includes('localStorage'), false);
});

test('mute preference is read from window.localStorage when the module loads', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
        globalThis.window = {
          localStorage: {
            getItem: (key) => (key === ${JSON.stringify(MUTED_KEY)} ? '1' : null),
            setItem() {},
          },
        };
        const { isMuted } = await import(${JSON.stringify(glassSoundUrl)});
        if (isMuted() !== true) process.exit(2);
      `,
    ],
    { encoding: 'utf8' }
  );
  assert.equal(result.status, 0, result.stderr);
});

test('a blocked store keeps mute for this visit and does not throw', () => {
  installDom({
    storage: {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    },
  });
  assert.doesNotThrow(() => setMuted(true));
  assert.equal(isMuted(), true);
  assert.doesNotThrow(() => setMuted(false));
  assert.equal(isMuted(), false);
});

test('open and close in the same moment sound once, as a switch', async () => {
  installDom();
  glassSound('open');
  glassSound('close');
  await wait(COALESCE_MS);
  // open: two notes (6 oscillators); switch or close: one note (3).
  assert.equal(starts(), 3);
});

test('a lone open plays the open chord, not the switch', async () => {
  installDom();
  glassSound('open');
  await wait(COALESCE_MS);
  assert.equal(starts(), 6);
});

test('muted, hidden, or unused pages stay silent', async () => {
  const cases = [
    { muted: true },
    { hidden: true },
    { userActive: false },
  ];
  for (const opts of cases) {
    installDom(opts);
    setMuted(!!opts.muted);
    glassSound('open');
    glassNotes([[440, 0]]);
    assert.equal(glassPad(), null);
    await wait(COALESCE_MS);
    assert.equal(plays.length, 0);
  }
});

test('glassNotes and glassPad play once the page has been used', () => {
  installDom();
  glassNotes([
    [440, 0],
    [550, 0.05],
  ]);
  assert.equal(starts(), 6);
  const pad = glassPad();
  assert.ok(pad);
  assert.equal(typeof pad.setLevel, 'function');
  assert.equal(typeof pad.stop, 'function');
  pad.setLevel(0.5);
  pad.stop();
});

test('SoundToggle wires the mute helpers and plays a switch when unmuting', () => {
  const source = readFileSync(
    new URL('../src/components/SoundToggle.jsx', import.meta.url),
    'utf8'
  );
  assert.match(source, /from ['"]\.\.\/hooks\/glassSound['"]/);
  assert.match(source, /setMuted\(!muted\)/);
  assert.match(source, /glassSound\('switch'\)/);
});
