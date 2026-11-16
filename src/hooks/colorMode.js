// The reader's light or dark choice, remembered the same way sound remembers
// mute (`pc-muted` in glassSound.js). Nothing stored follows the system.
// `colorModeBoot` is that decision inlined into the page head, so the document
// is already in the right mode before the first paint.

export const LIGHT_KEY = 'pc-light';
export const THEME_LIGHT = '#f4f5f7';
export const THEME_DARK = '#000000';

// `stored` is '1' (light), '0' (dark), or null when the reader has not chosen.
// A stored choice wins. Otherwise a light system starts light, and anything else stays dark.
export const resolveLight = (stored, systemLight) => {
  if (stored === '1') return true;
  if (stored === '0') return false;
  return !!systemLight;
};

export const readStoredMode = (storage = globalThis.localStorage) => {
  try {
    const value = storage.getItem(LIGHT_KEY);
    return value === '1' || value === '0' ? value : null;
  } catch {
    return null;
  }
};

export const writeStoredMode = (light, storage = globalThis.localStorage) => {
  try {
    storage.setItem(LIGHT_KEY, light ? '1' : '0');
  } catch {
    /* kept for this visit only */
  }
};

export const systemPrefersLight = (view = globalThis) => {
  try {
    return view.matchMedia('(prefers-color-scheme: light)').matches === true;
  } catch {
    return false;
  }
};

export const initialLight = () =>
  resolveLight(readStoredMode(), systemPrefersLight());

// Classes on the document, and the browser chrome colour, for one mode.
export const applyColorMode = (light, doc = globalThis.document) => {
  if (!doc) return;
  const on = !!light;
  [doc.documentElement, doc.body].forEach((el) => {
    if (!el) return;
    el.classList.toggle('light-mode', on);
    el.classList.toggle('dark-mode', !on);
  });
  const meta = doc.querySelector?.('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', on ? THEME_LIGHT : THEME_DARK);
};

// Standalone on purpose: it runs before the bundle, so it cannot import this module.
// The branch is the same one `resolveLight` uses, and the unit test runs this string.
export const colorModeBoot = `(() => {
  let stored = null;
  try {
    const value = localStorage.getItem(${JSON.stringify(LIGHT_KEY)});
    if (value === '1' || value === '0') stored = value;
  } catch (e) {}
  let systemLight = false;
  try {
    systemLight = window.matchMedia('(prefers-color-scheme: light)').matches === true;
  } catch (e) {}
  const light = stored === '1' ? true : stored === '0' ? false : !!systemLight;
  const apply = (el) => {
    if (!el) return;
    el.classList.toggle('light-mode', light);
    el.classList.toggle('dark-mode', !light);
  };
  apply(document.documentElement);
  apply(document.body);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', light ? ${JSON.stringify(THEME_LIGHT)} : ${JSON.stringify(THEME_DARK)});
  }
})();`;

// The head script runs before <body> exists. This one copies the class onto body
// as the body is parsed, still before the first paint.
export const colorModeBodyBoot = `(() => {
  const light = document.documentElement.classList.contains('light-mode');
  const body = document.body;
  if (!body) return;
  body.classList.toggle('light-mode', light);
  body.classList.toggle('dark-mode', !light);
})();`;
