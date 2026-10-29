// One motion for glass that opens, used by every card: no spring and no overshoot. The glass flows to its new
// shape on a long, soft ease-out, and what's inside condenses out of a blur into focus, like molten glass
// setting. Closing runs the same way back, a little quicker.

export const GLASS_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
export const GLASS_EASE_ARRAY = [0.32, 0.72, 0, 1]; // the same curve, for motion's animate()
export const GLASS_CLOSE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
export const OPEN_MS = 640;
export const CLOSE_MS = 380;

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The content's frames: a light blur, a touch smaller, that settles into focus (kept light, so the text never
// smears and the browser can keep up)
export const CONDENSE = [
  { opacity: 0, filter: 'blur(6px)', transform: 'translateY(-4px) scale(0.99)' },
  { opacity: 1, filter: 'blur(0px)', transform: 'none' }
];
