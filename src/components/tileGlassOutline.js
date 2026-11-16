// The glass under an open tile's row. Moved out of TileGrid so the path can be checked without a browser.
// The numbers are the same ones the component used: 20px on the details' corners, 12px where a neck meets them.

const RB = 20; // the details' corners
const F = 12; // the inside curve where the neck meets the details

/**
 * The glass under a row: the details, from just under the row's tiles (yb) down to `b` and across from L to R,
 * and necks (x0..x1, left to right) that join them up to the foot of the row (foot). Until the details reach past
 * the gap under the row, the necks alone run down. Returns the shape to clip the glass to, and its edge, which
 * leaves out each neck's top, where the glass runs on into its tile. Every y is drawn from `oy`, where the
 * glass's box starts.
 */
export const tileGlassOutline = (necks, foot, yb, b, L, R, oy) => {
  const Y = (y) => y - oy;
  if (b <= foot + 0.5 || !necks.length) return null;
  if (b < yb + 1) {
    const clip = [];
    const edge = [];
    necks.forEach((n) => {
      const q = Math.min((b - foot) / 2, (n.x1 - n.x0) / 2, RB);
      const rest = `L${n.x1} ${Y(b - q)} Q${n.x1} ${Y(b)} ${n.x1 - q} ${Y(b)} L${n.x0 + q} ${Y(b)} Q${n.x0} ${Y(b)} ${n.x0} ${Y(b - q)} L${n.x0} ${Y(foot)}`;
      clip.push(`M${n.x0} ${Y(foot)} L${n.x1} ${Y(foot)} ${rest} Z`);
      edge.push(`M${n.x1} ${Y(foot)} ${rest}`);
    });
    return { clip: clip.join(' '), edge: edge.join(' ') };
  }
  const r = Math.min(RB, (b - yb) / 2, (R - L) / 2);
  const h = yb - foot;
  // Clockwise from the foot of the left side: up it, along the top, in and out of each neck, down the right side
  // and back along the bottom. A neck's top is where the glass runs on into its tile: the edge skips it.
  const clip = [`M${L} ${Y(b - r)}`];
  const edge = [`M${L} ${Y(b - r)}`];
  const both = (...c) => {
    clip.push(...c);
    edge.push(...c);
  };
  let x = L; // how far along the top it has come
  necks.forEach((n, i) => {
    const room = n.x0 - x;
    if (n.x0 < L + 1) both(`L${L} ${Y(foot)}`);
    else {
      const fl = Math.min(F, h, room / 2);
      if (i === 0) {
        const rl = Math.min(r, room - fl);
        both(`L${L} ${Y(yb + rl)}`, `Q${L} ${Y(yb)} ${L + rl} ${Y(yb)}`);
      }
      both(
        `L${n.x0 - fl} ${Y(yb)}`,
        `Q${n.x0} ${Y(yb)} ${n.x0} ${Y(yb - fl)}`,
        `L${n.x0} ${Y(foot)}`
      );
    }
    clip.push(`L${n.x1} ${Y(foot)}`);
    edge.push(`M${n.x1} ${Y(foot)}`);
    const next = i < necks.length - 1 ? necks[i + 1].x0 : R;
    if (n.x1 > R - 1) {
      x = R;
      return;
    }
    const fr = Math.min(F, h, (next - n.x1) / 2);
    both(`L${n.x1} ${Y(yb - fr)}`, `Q${n.x1} ${Y(yb)} ${n.x1 + fr} ${Y(yb)}`);
    x = n.x1 + fr;
  });
  if (x < R) {
    const rr = Math.min(r, R - x);
    both(`L${R - rr} ${Y(yb)}`, `Q${R} ${Y(yb)} ${R} ${Y(yb + rr)}`);
  }
  both(
    `L${R} ${Y(b - r)}`,
    `Q${R} ${Y(b)} ${R - r} ${Y(b)}`,
    `L${L + r} ${Y(b)}`,
    `Q${L} ${Y(b)} ${L} ${Y(b - r)}`
  );
  clip.push('Z');
  return { clip: clip.join(' '), edge: edge.join(' ') };
};
