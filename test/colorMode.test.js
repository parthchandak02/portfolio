// Light or dark for the next visit (src/hooks/colorMode.js). Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import {
  LIGHT_KEY,
  THEME_DARK,
  THEME_LIGHT,
  applyColorMode,
  colorModeBodyBoot,
  colorModeBoot,
  readStoredMode,
  resolveLight,
  writeStoredMode,
} from '../src/hooks/colorMode.js';

const cases = [
  {
    name: 'a stored light choice wins over a dark system',
    stored: '1',
    systemLight: false,
    light: true,
  },
  {
    name: 'a stored dark choice stays dark when the system is light',
    stored: '0',
    systemLight: true,
    light: false,
  },
  {
    name: 'nothing stored follows a light system',
    stored: null,
    systemLight: true,
    light: true,
  },
  {
    name: 'nothing stored stays dark otherwise',
    stored: null,
    systemLight: false,
    light: false,
  },
];

for (const item of cases) {
  test(item.name, () => {
    assert.equal(resolveLight(item.stored, item.systemLight), item.light);
  });
}

const memoryStorage = (seed = null) => {
  const data = new Map();
  if (seed !== null) data.set(LIGHT_KEY, seed);
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
};

test('a choice round-trips through the same guarded storage as mute', () => {
  const storage = memoryStorage();
  writeStoredMode(true, storage);
  assert.equal(readStoredMode(storage), '1');
  assert.equal(storage.getItem(LIGHT_KEY), '1');
  writeStoredMode(false, storage);
  assert.equal(readStoredMode(storage), '0');
});

test('a blocked store is ignored and does not throw', () => {
  const storage = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  };
  assert.equal(readStoredMode(storage), null);
  assert.doesNotThrow(() => writeStoredMode(true, storage));
  assert.equal(resolveLight(readStoredMode(storage), true), true);
});

const classList = (initial) => {
  const names = new Set(initial);
  return {
    toggle(name, force) {
      const on = force === undefined ? !names.has(name) : !!force;
      if (on) names.add(name);
      else names.delete(name);
    },
    contains: (name) => names.has(name),
    value: () => [...names].sort().join(' '),
  };
};

// Head script first, while body is still unparsed, then the body script copies the class.
const paintWithBoot = ({ stored, systemLight }) => {
  const html = classList(['dark-mode']);
  const body = classList(['dark-mode']);
  const meta = {
    content: THEME_DARK,
    setAttribute(name, value) {
      if (name === 'content') this.content = value;
    },
  };
  const document = {
    documentElement: { classList: html },
    body: null,
    querySelector: (selector) =>
      selector === 'meta[name="theme-color"]' ? meta : null,
  };
  const localStorage = {
    getItem: (key) => (key === LIGHT_KEY ? stored : null),
  };
  const window = {
    document,
    localStorage,
    matchMedia: () => ({ matches: systemLight }),
  };
  const context = vm.createContext({ document, localStorage, window });
  vm.runInContext(colorModeBoot, context);
  document.body = { classList: body };
  vm.runInContext(colorModeBodyBoot, context);
  return {
    html: html.value(),
    body: body.value(),
    theme: meta.content,
  };
};

for (const item of cases) {
  test(`boot script: ${item.name}`, () => {
    const painted = paintWithBoot({
      stored: item.stored,
      systemLight: item.systemLight,
    });
    const mode = item.light ? 'light-mode' : 'dark-mode';
    assert.equal(painted.html, mode);
    assert.equal(painted.body, mode);
    assert.equal(painted.theme, item.light ? THEME_LIGHT : THEME_DARK);
  });
}

test('applying a mode sets the document class and theme-color', () => {
  const html = classList(['dark-mode']);
  const body = classList(['dark-mode']);
  let theme = THEME_DARK;
  const doc = {
    documentElement: { classList: html },
    body: { classList: body },
    querySelector: () => ({
      setAttribute: (_name, value) => {
        theme = value;
      },
    }),
  };
  applyColorMode(true, doc);
  assert.equal(html.value(), 'light-mode');
  assert.equal(body.value(), 'light-mode');
  assert.equal(theme, THEME_LIGHT);
  applyColorMode(false, doc);
  assert.equal(html.value(), 'dark-mode');
  assert.equal(body.value(), 'dark-mode');
  assert.equal(theme, THEME_DARK);
});

test('the page inlines the boot script before paint, including on body', () => {
  const page = readFileSync(
    new URL('../src/pages/index.astro', import.meta.url),
    'utf8'
  );
  assert.match(page, /colorModeBoot/);
  assert.match(page, /colorModeBodyBoot/);
  assert.match(page, /<body class="dark-mode">/);
  assert.equal(colorModeBoot.includes('</'), false);
  assert.equal(colorModeBodyBoot.includes('</'), false);
});
