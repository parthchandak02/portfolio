// The page asks the 3D scene for a moment of light: the prism catches the beam and a pulse runs out along
// the rainbow. A wavelength sends the pulse down that colour only; none sends it across the whole spectrum.
const EVENT = 'prism-glow';

export const glowPrism = (wave = 0) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT, { detail: { wave } }));
};

export const onPrismGlow = (handler) => {
  const listener = (e) => handler(e.detail?.wave || 0);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
};
