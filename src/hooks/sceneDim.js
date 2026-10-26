// Whether someone is reading, so the scene can step back. The strip sets `strip` while it is pointed at,
// touched or focused; the app sets `record` once the record is scrolled into and `play` in play mode. The
// scene reads these every frame, so changing them re-renders nothing.
export const sceneDim = {
  strip: false,
  record: false,
  play: false
};

export const isReading = () => !sceneDim.play && (sceneDim.strip || sceneDim.record);

if (import.meta.env?.DEV && typeof window !== 'undefined') window.__sceneDim = sceneDim;
