// Where the spectrograph's lines sit along a track, in px (see components/Spectrograph).
// Time is not linear on the track: the sparse early years are compressed so the busy recent
// years get room. Axis labels use the same mapping, so every position is still honest.
const KNOTS = [
  [2015, 0],
  [2020, 0.14],
  [2023, 0.34],
  [2025, 0.62],
  [2026, 0.8],
  [2027, 1],
];
export const MIN_GAP = 3.5; // px between neighbouring lines
export const EDGE = 4; // px kept free at each end of a track

export const warp = (t) => {
  for (let i = 1; i < KNOTS.length; i += 1) {
    const [t1, f1] = KNOTS[i];
    if (t <= t1) {
      const [t0, f0] = KNOTS[i - 1];
      return f0 + ((t - t0) / (t1 - t0)) * (f1 - f0);
    }
  }
  return 1;
};

// Spread neighbours apart in pixels. A forward pass pushes clusters right; a backward pass
// pulls the tail back inside the track. Order never changes. A track with less room than every
// line at MIN_GAP needs (the whole record on a small phone) shares out the room it has instead,
// so the earliest lines are never pushed off its left end.
export const place = (entries, width) => {
  const sorted = [...entries].sort((a, b) => a.item.t - b.item.t);
  const room = Math.max(0, width - EDGE * 2);
  const gap = Math.min(MIN_GAP, room / Math.max(1, sorted.length - 1));
  const pos = sorted.map((e) => EDGE + warp(e.item.t) * room);
  for (let i = 1; i < pos.length; i += 1) {
    if (pos[i] < pos[i - 1] + gap) pos[i] = pos[i - 1] + gap;
  }
  for (let i = pos.length - 1; i >= 0; i -= 1) {
    const limit = i === pos.length - 1 ? EDGE + room : pos[i + 1] - gap;
    if (pos[i] > limit) pos[i] = limit;
  }
  return sorted.map((e, i) => ({ ...e, x: pos[i] }));
};
