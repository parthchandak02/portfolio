import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { animate } from 'motion';
import Molten from './Molten';
import { CLOSE_MS, OPEN_MS, reducedMotion } from '../hooks/glassMotion';

// How many columns a grid is laid out in right now (its columns follow the width), and the gap between its rows
const useLayout = (ref) => {
  const [layout, setLayout] = useState({ cols: 1, gap: 12 });
  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid) return undefined;
    const measure = () => {
      const css = getComputedStyle(grid);
      const cols = Math.max(1, css.gridTemplateColumns.split(' ').filter(Boolean).length);
      const gap = parseFloat(css.rowGap) || 0;
      setLayout((l) => (l.cols === cols && l.gap === gap ? l : { cols, gap }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, [ref]);
  return layout;
};

const R = 16; // a tile's corners
const RB = 20; // the details' corners
const F = 12; // the inside curve where the neck meets the details

/**
 * The glass under a row: the details, from just under the row's tiles (yb) down to `b` and across from L to R, and
 * a neck (n.x0..n.x1) that joins them up to the foot of the opened tile. Until the details reach past the gap
 * under the row, the neck alone runs down. Returns the shape to clip the glass to, and its edge, which leaves out
 * the neck's top, where the glass runs on into the tile. Every y is drawn from `oy`, where the glass's box starts.
 */
const outline = (n, foot, yb, b, L, R, oy) => {
  const Y = (y) => y - oy;
  if (b <= foot + 0.5) return null;
  if (b < yb + 1) {
    const q = Math.min(R - L, (b - foot) / 2, (n.x1 - n.x0) / 2, RB);
    const rest = `L${n.x1} ${Y(b - q)} Q${n.x1} ${Y(b)} ${n.x1 - q} ${Y(b)} L${n.x0 + q} ${Y(b)} Q${n.x0} ${Y(b)} ${n.x0} ${Y(b - q)} L${n.x0} ${Y(foot)}`;
    return { clip: `M${n.x0} ${Y(foot)} L${n.x1} ${Y(foot)} ${rest} Z`, edge: `M${n.x1} ${Y(foot)} ${rest}` };
  }
  const r = Math.min(RB, (b - yb) / 2, (R - L) / 2);
  const h = yb - foot;
  const p = [];
  // Down the neck's right side and out along the top of the details, unless the neck runs straight on down
  if (n.x1 > R - 1) p.push(`L${R} ${Y(b - r)}`);
  else {
    const room = R - n.x1;
    const fr = Math.min(F, h, room / 2);
    const rr = Math.min(r, room - fr);
    p.push(`L${n.x1} ${Y(yb - fr)}`, `Q${n.x1} ${Y(yb)} ${n.x1 + fr} ${Y(yb)}`, `L${R - rr} ${Y(yb)}`, `Q${R} ${Y(yb)} ${R} ${Y(yb + rr)}`, `L${R} ${Y(b - r)}`);
  }
  p.push(`Q${R} ${Y(b)} ${R - r} ${Y(b)}`, `L${L + r} ${Y(b)}`, `Q${L} ${Y(b)} ${L} ${Y(b - r)}`);
  if (n.x0 < L + 1) p.push(`L${L} ${Y(foot)}`);
  else {
    const room = n.x0 - L;
    const fl = Math.min(F, h, room / 2);
    const rl = Math.min(r, room - fl);
    p.push(`L${L} ${Y(yb + rl)}`, `Q${L} ${Y(yb)} ${L + rl} ${Y(yb)}`, `L${n.x0 - fl} ${Y(yb)}`, `Q${n.x0} ${Y(yb)} ${n.x0} ${Y(yb - fl)}`, `L${n.x0} ${Y(foot)}`);
  }
  const rest = p.join(' ');
  return { clip: `M${n.x0} ${Y(foot)} L${n.x1} ${Y(foot)} ${rest} Z`, edge: `M${n.x1} ${Y(foot)} ${rest}` };
};

const easeOut = (t) => 1 - (1 - t) ** 3;

/**
 * The glass of the opened tile and its details as one shape, joined by a neck, like a folder tab: once the neck is
 * under the tile, the tile hands its own glass over to the shape (data-joined), so there is no join to see. It follows
 * the tile and the details as they flow (see Molten). Opening, it pours down out of the tile and spreads out
 * across the row; closing, it gathers back in and up into the tile, which only then rounds off its foot. When
 * another tile in the row opens,
 * the neck flows along under the row to it, its leading side first, like a drop of liquid, while the details keep
 * their place. Its box covers only the row and the details, so the blur behind it stays small.
 */
const TabGlass = ({ grid, row, tile, gap, open }) => {
  const shape = useRef(null);
  const edge = useRef(null);
  const neck = useRef(null); // where the neck is now, x0..x1
  const spread = useRef(0); // how far the details have spread out from under the neck, 0..1
  const redraw = useRef(null);

  useLayoutEffect(() => {
    const g = grid.current;
    if (!g) return undefined;
    const tileEl = (i) => g.querySelector(`[data-tile="${i}"]`);
    const draw = () => {
      const el = tileEl(tile);
      const n = neck.current;
      if (!el || !n || !shape.current) return;
      const top = el.offsetTop;
      const foot = top + el.offsetHeight;
      // The tile the neck sits mostly under hands its glass to the shape: the two are the same glass, swapped in
      // one frame, so the tile, the neck and the details are one piece with no join
      let joined = null;
      g.querySelectorAll('[data-tile]').forEach((t) => {
        if (t.offsetTop !== top) return;
        const over = Math.min(n.x1, t.offsetLeft + t.offsetWidth) - Math.max(n.x0, t.offsetLeft);
        const j = spread.current > 0.02 && over > t.offsetWidth / 2;
        t.toggleAttribute('data-joined', j);
        if (j) joined = t;
      });
      const d = g.querySelector(`.tile-drawer[data-row="${row}"]`);
      const b = d ? d.offsetTop + d.offsetHeight : foot;
      const W = g.clientWidth;
      const k = spread.current;
      const out = outline(n, foot, foot + gap, b, n.x0 * (1 - k), n.x1 + (W - n.x1) * k, top);
      const clip = [];
      const line = [];
      if (joined) {
        const x0 = joined.offsetLeft;
        const x1 = x0 + joined.offsetWidth;
        const f = foot - top;
        const side = `L${x0} ${R} Q${x0} 0 ${x0 + R} 0 L${x1 - R} 0 Q${x1} 0 ${x1} ${R} L${x1} ${f}`;
        clip.push(`M${x0} ${f + 1} ${side} L${x1} ${f + 1} Z`);
        line.push(`M${x0} ${f} ${side}`);
        shape.current.style.setProperty('--tab-hue', joined.style.getPropertyValue('--band-hue'));
      }
      if (out) { clip.push(out.clip); line.push(out.edge); }
      const box = { top: `${top}px`, height: `${Math.max(0, Math.max(b, joined ? foot : top) - top)}px` };
      Object.assign(shape.current.style, box, { clipPath: clip.length ? `path("${clip.join(' ')}")` : 'path("M0 0")' });
      Object.assign(edge.current.ownerSVGElement.style, box);
      edge.current.setAttribute('d', line.join(' '));
    };
    redraw.current = draw;
    const el = tileEl(tile);
    const to = el && { x0: el.offsetLeft, x1: el.offsetLeft + el.offsetWidth };
    const from = neck.current;
    let run;
    if (!to) return undefined;
    if (!from || !open || reducedMotion() || (from.x0 === to.x0 && from.x1 === to.x1)) {
      neck.current = to;
    } else {
      // The side it's flowing towards leads, the other follows on a little behind, then it settles to the tile
      const right = to.x0 > from.x0;
      run = animate(0, 1, {
        duration: OPEN_MS / 1000,
        ease: 'linear',
        onUpdate: (v) => {
          const lead = easeOut(Math.min(1, v / 0.75));
          const trail = easeOut(Math.max(0, (v - 0.12) / 0.88));
          const [p0, p1] = right ? [trail, lead] : [lead, trail];
          neck.current = { x0: from.x0 + (to.x0 - from.x0) * p0, x1: from.x1 + (to.x1 - from.x1) * p1 };
          draw();
        },
      });
    }
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(g);
    return () => { ro.disconnect(); run?.stop(); };
  }, [grid, row, tile, gap, open]);

  // Leaving the page, every tile it joined has its own glass whole again
  useLayoutEffect(() => () => {
    grid.current?.querySelectorAll('[data-joined]').forEach((el) => {
      if (el.closest('.tile-grid') === grid.current) el.removeAttribute('data-joined');
    });
  }, [grid]);

  // Pour out and spread as it opens, gather back in and up into the tile as it closes
  useLayoutEffect(() => {
    if (reducedMotion()) {
      spread.current = open ? 1 : 0;
      redraw.current?.();
      return undefined;
    }
    const run = animate(spread.current, open ? 1 : 0, {
      duration: (open ? OPEN_MS : CLOSE_MS) / 1000,
      ease: open ? [0.5, 0, 0.1, 1] : [0.4, 0, 0.2, 1],
      onUpdate: (v) => { spread.current = v; redraw.current?.(); },
      onComplete: () => redraw.current?.(),
    });
    return () => run.stop();
  }, [open]);

  return (
    <>
      <span ref={shape} className="tab-glass" aria-hidden="true" />
      <svg className="tab-glass__edge" aria-hidden="true"><path ref={edge} /></svg>
    </>
  );
};

/**
 * A grid of tiles whose opened tile stays put and becomes the tab of one piece of glass: its details form in a
 * full-width row under the tile's row (see Molten), and the glass runs down from the tile and spreads across
 * under it (see TabGlass). Opening another tile in the same row flows the glass along under the row to it, and
 * the details stay open, the new condensing in place of the old; in another row, the old glass melts away as
 * the new one forms.
 *
 * entries: [{ key, attrs, tile, detail }]: attrs go on the tile's wrapper, tile renders the tile, detail renders
 * what opens under it.
 */
const TileGrid = ({ entries, openKey, onOpen, onClose }) => {
  const grid = useRef(null);
  const { cols, gap } = useLayout(grid);
  const at = entries.findIndex((e) => e.key === openKey);
  const row = at < 0 ? -1 : Math.floor(at / cols);
  // Each row's details remember the tile they last showed, so they can melt away showing it, until they close
  const shown = useRef({});
  const laidOut = useRef(cols);
  if (laidOut.current !== cols) { laidOut.current = cols; shown.current = {}; }
  if (at >= 0) shown.current[row] = at;
  const [, settle] = useState(0);
  const openRow = useRef(row);
  openRow.current = row;
  const closed = (r) => {
    if (r === openRow.current) return;
    delete shown.current[r];
    settle((n) => n + 1);
  };

  // While one tile's glass melts away and another's forms, the opened tile holds still on the screen, however
  // the rows around it move; then its details come into view, without moving the tile off the screen
  const drawers = useRef({});
  useLayoutEffect(() => {
    const el = at >= 0 && grid.current?.querySelector(`[data-tile="${at}"]`);
    if (!el) return undefined;
    const scroller = el.closest('.main-content-scroll') || document.scrollingElement;
    // Where the tile sits in the scrolled content, so the reader's own scrolling is left alone
    const at0 = () => el.getBoundingClientRect().top + scroller.scrollTop;
    let top = at0();
    const end = performance.now() + Math.max(OPEN_MS, CLOSE_MS) + 80;
    const hold = () => {
      const drift = at0() - top;
      if (Math.abs(drift) > 0.5) { scroller.scrollBy({ top: drift, behavior: 'instant' }); top += drift; }
    };
    // Corrected as the content changes size, after layout and before it paints, so the tile never visibly moves
    const ro = new ResizeObserver(() => { if (performance.now() < end) hold(); });
    [...scroller.children].forEach((c) => ro.observe(c));
    const t = setTimeout(() => drawers.current[row]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), Math.max(OPEN_MS, CLOSE_MS) + 120);
    const stop = setTimeout(() => ro.disconnect(), end - performance.now());
    return () => { ro.disconnect(); clearTimeout(t); clearTimeout(stop); };
  }, [at, row]);

  const rows = Object.entries(shown.current).filter(([, i]) => entries[i]);
  return (
    <div className="lab__grid tile-grid" ref={grid}>
      {rows.map(([r, i]) => (
        <TabGlass key={`glass-${r}`} grid={grid} row={Number(r)} tile={i} gap={gap} open={Number(r) === row} />
      ))}
      {entries.map((e, i) => {
        const r = Math.floor(i / cols);
        const rowEnd = i === Math.min(entries.length - 1, (r + 1) * cols - 1);
        const last = shown.current[r];
        const entry = last != null ? entries[last] : null;
        return (
          <Fragment key={e.key}>
            <div {...e.attrs} data-tile={i} className={`timeline__item${i === at ? ' is-open' : ''}`}>
              {e.tile(() => (i === at ? onClose() : onOpen(e.key)), i === at)}
            </div>
            {rowEnd && entry && (
              <Molten
                open={r === row}
                contentKey={entry.key}
                className="tile-drawer"
                style={{ '--band-hue': entry.attrs.style?.['--band-hue'], '--gap': `${gap}px` }}
                role="region"
                aria-label="Details"
                data-row={r}
                onClosed={() => closed(r)}
              >
                <div className="tile-drawer__inner" ref={(el) => { drawers.current[r] = el; }}>
                  {entry.detail()}
                </div>
              </Molten>
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default TileGrid;
