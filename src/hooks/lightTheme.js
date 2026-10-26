// Light mode's look: the page colour, the prism's finish, the floating squares and how the rainbow sits on
// the page. One theme ships (DEFAULT); in development `?lt=<key>` previews another.
export const LIGHT_THEMES = {
  // Bright white and gloss: the dark scene, lit
  current: { page: '#ffffff', prism: { roughness: 0, clearcoat: 1, color: '#ffffff', chromaticAberration: 1 }, box: '#333333', boxIdle: '#454545', rainbow: { sat: 1, gain: 1 } },
  // Warm paper, frosted glass and pigment colours, like a spectrum printed in a book
  paper: { page: '#eee8de', prism: { roughness: 0.32, clearcoat: 0, color: '#f7f0e6', chromaticAberration: 0.55 }, box: '#bdb4a7', boxIdle: '#857d72', rainbow: { sat: 0.72, gain: 0.82 } },
  // Cool concrete and satin glass, like a product shot in a grey studio
  studio: { page: '#e2e5e9', prism: { roughness: 0.2, clearcoat: 0.25, color: '#eef2f6', chromaticAberration: 0.7 }, box: '#a3a9b2', boxIdle: '#7c838d', rainbow: { sat: 0.82, gain: 0.9 } },
  // Gallery white, sandblasted glass and soft light, quiet and airy
  gallery: { page: '#f6f6f3', prism: { roughness: 0.48, clearcoat: 0, color: '#ffffff', chromaticAberration: 0.35 }, box: '#c9c9c5', boxIdle: '#9d9d98', rainbow: { sat: 0.6, gain: 0.72 } }
};

const DEFAULT = 'current';

const pick = () => {
  if (import.meta.env?.DEV && typeof window !== 'undefined') {
    const key = new URLSearchParams(window.location.search).get('lt');
    if (key && LIGHT_THEMES[key]) return key;
  }
  return DEFAULT;
};

export const lightThemeKey = pick();
export const lightTheme = LIGHT_THEMES[lightThemeKey];
