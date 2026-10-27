// How much the 3D scene asks of the device. A phone draws three pixels for every one of a laptop's, on a
// fraction of the memory and GPU: at full settings the canvas at 3x, its 8x antialiased half-float buffer and
// the prism glass's two full-screen buffers, which redraw the whole scene each frame, come to a few hundred
// megabytes on an iPhone. So a phone gets a canvas of at most 1.5x density, no antialiasing on the final
// image, and smaller, fewer-sampled buffers for the glass; the prism is a small part of the screen, and what
// it refracts is soft light, so the difference doesn't show. The density is fixed rather than scaled with
// the frame rate: changing it resizes every buffer, which blanks the canvas for a frame, and the switch
// between modes, the one time frames run long, is exactly when that showed.

const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
const narrow = typeof window !== 'undefined' && Math.min(window.screen.width, window.screen.height) < 820;
export const isPhone = coarse && narrow;

const ratio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

export const QUALITY = isPhone
  ? { dpr: Math.min(ratio, 1.5), msaa: 0, glassResolution: 384, glassSamples: 4, shards: 5 }
  : { dpr: Math.min(ratio, 2), msaa: 4, glassResolution: 1024, glassSamples: 8, shards: 6 };
