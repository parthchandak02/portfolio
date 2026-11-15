// Where one band's ticks sit on the bar, in px (see components/BandBar).
// Dates run from the band's first item to its last. A forward pass then keeps
// neighbours apart, and a backward pass pulls the tail back inside the track.
// A track with less room than every tick at MIN_GAP needs (the Projects band
// on a zoomed phone) shares out the room it has, so the earliest ticks are
// never pushed off its left end.
export const MIN_GAP = 6; // px between neighbouring ticks
export const EDGE = 6; // px kept free at each end of a track

export const layout = (items, width) => {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.t - b.t);
  const first = sorted[0].t;
  const span = sorted[sorted.length - 1].t - first || 1;
  const room = Math.max(0, width - EDGE * 2);
  const gap = Math.min(MIN_GAP, room / Math.max(1, sorted.length - 1));
  const pos = sorted.map((item) => EDGE + ((item.t - first) / span) * room);
  for (let i = 1; i < pos.length; i += 1) {
    if (pos[i] < pos[i - 1] + gap) pos[i] = pos[i - 1] + gap;
  }
  for (let i = pos.length - 1; i >= 0; i -= 1) {
    const limit = i === pos.length - 1 ? EDGE + room : pos[i + 1] - gap;
    if (pos[i] > limit) pos[i] = limit;
  }
  return sorted.map((item, i) => ({ item, x: pos[i] }));
};
