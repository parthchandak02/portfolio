import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { animate } from 'motion';
import Molten from './Molten';
import { CLOSE_MS, GLASS_EASE_ARRAY, OPEN_MS, reducedMotion } from '../hooks/glassMotion';

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
 * The glass under a row: the details, from just under the row's tiles (yb) down to `b` and across from L to R,
 * and necks (x0..x1, left to right) that join them up to the foot of the row (foot). Until the details reach past
 * the gap under the row, the necks alone run down. Returns the shape to clip the glass to, and its edge, which
 * leaves out each neck's top, where the glass runs on into its tile. Every y is drawn from `oy`, where the
 * glass's box starts.
 */
const outline = (necks, foot, yb, b, L, R, oy) => {
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
  const both = (...c) => { clip.push(...c); edge.push(...c); };
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
      both(`L${n.x0 - fl} ${Y(yb)}`, `Q${n.x0} ${Y(yb)} ${n.x0} ${Y(yb - fl)}`, `L${n.x0} ${Y(foot)}`);
    }
    clip.push(`L${n.x1} ${Y(foot)}`);
    edge.push(`M${n.x1} ${Y(foot)}`);
    const next = i < necks.length - 1 ? necks[i + 1].x0 : R;
    if (n.x1 > R - 1) { x = R; return; }
    const fr = Math.min(F, h, (next - n.x1) / 2);
    both(`L${n.x1} ${Y(yb - fr)}`, `Q${n.x1} ${Y(yb)} ${n.x1 + fr} ${Y(yb)}`);
    x = n.x1 + fr;
  });
  if (x < R) {
    const rr = Math.min(r, R - x);
    both(`L${R - rr} ${Y(yb)}`, `Q${R} ${Y(yb)} ${R} ${Y(yb + rr)}`);
  }
  both(`L${R} ${Y(b - r)}`, `Q${R} ${Y(b)} ${R - r} ${Y(b)}`, `L${L + r} ${Y(b)}`, `Q${L} ${Y(b)} ${L} ${Y(b - r)}`);
  clip.push('Z');
  return { clip: clip.join(' '), edge: edge.join(' ') };
};

/**
 * The glass of the opened tile and its details as one shape, joined by a neck, like a folder tab: once the neck has
 * mostly formed, the tile hands its own glass over to the shape (data-joined), the very same glass, so there is no
 * join to see. It follows the tile and the details as they flow (see Molten). Opening, it pours down out of the
 * tile and spreads out across the row; closing, it gathers back in and up into the tile. When another tile in the
 * row opens, the old tile's neck closes up into it as the new tile's opens down from it, both at once, each in
 * its own place (nothing moves along the row), and the details stay open at their height. Its box covers only the
 * row and the details, so the blur behind it stays small.
 */
const TabGlass = ({ grid, row, tile, gap, open }) => {
  const shape = useRef(null);
  const edge = useRef(null);
  const joins = useRef({}); // how open each tile's neck is, 0..1
  const spread = useRef(0); // how far the details have spread out from under the necks, 0..1
  const redraw = useRef(null);

  useLayoutEffect(() => {
    const g = grid.current;
    if (!g) return undefined;
    const tileEl = (i) => g.querySelector(`[data-tile="${i}"]`);
    const draw = () => {
      const el = tileEl(tile);
      if (!el || !shape.current) return;
      const top = el.offsetTop;
      const foot = top + el.offsetHeight;
      // Each neck opens out from the middle of its tile's foot to its full width. A tile whose neck is mostly
      // open hands its glass to the shape: the two are the same glass, swapped in one frame.
      const necks = [];
      const caps = [];
      Object.entries(joins.current).forEach(([i, a]) => {
        const t = tileEl(i);
        if (!t) return;
        const j = spread.current > 0.02 && a > 0.5;
        t.toggleAttribute('data-joined', j);
        const c = t.offsetLeft + t.offsetWidth / 2;
        const half = (t.offsetWidth / 2) * a;
        const n = { x0: c - half, x1: c + half };
        if (a > 0.01) necks.push(n);
        if (j) caps.push({ t, n });
      });
      necks.sort((m, n) => m.x0 - n.x0);
      const d = g.querySelector(`.tile-drawer[data-row="${row}"]`);
      const b = d ? d.offsetTop + d.offsetHeight : foot;
      const W = g.clientWidth;
      const k = spread.current;
      const lo = Math.min(...necks.map((n) => n.x0));
      const hi = Math.max(...necks.map((n) => n.x1));
      const out = necks.length ? outline(necks, foot, foot + gap, b, lo * (1 - k), hi + (W - hi) * k, top) : null;
      const clip = [];
      const line = [];
      const f = foot - top;
      caps.forEach(({ t, n }) => {
        const x0 = t.offsetLeft;
        const x1 = x0 + t.offsetWidth;
        const side = `L${x0} ${R} Q${x0} 0 ${x0 + R} 0 L${x1 - R} 0 Q${x1} 0 ${x1} ${R} L${x1} ${f}`;
        clip.push(`M${x0} ${f + 1} ${side} L${x1} ${f + 1} Z`);
        // Its edge runs round the top, and along its foot either side of the neck
        line.push(`M${x0} ${f} ${side}`);
        if (n.x0 > x0 + 0.5) line.push(`M${x0} ${f} L${n.x0} ${f}`);
        if (n.x1 < x1 - 0.5) line.push(`M${n.x1} ${f} L${x1} ${f}`);
        shape.current.style.setProperty('--tab-hue', t.style.getPropertyValue('--band-hue'));
      });
      if (out) { clip.push(out.clip); line.push(out.edge); }
      const box = { top: `${top}px`, height: `${Math.max(0, Math.max(b, caps.length ? foot : top) - top)}px` };
      Object.assign(shape.current.style, box, { clipPath: clip.length ? `path("${clip.join(' ')}")` : 'path("M0 0")' });
      Object.assign(edge.current.ownerSVGElement.style, box);
      edge.current.setAttribute('d', line.join(' '));
    };
    redraw.current = draw;
    // This tile's neck opens as every other's closes, from wherever they are
    const start = { ...joins.current };
    const fresh = Object.keys(start).length === 0;
    if (!(tile in start)) start[tile] = 0;
    const step = (v) => {
      Object.keys(start).forEach((i) => { joins.current[i] = start[i] + ((Number(i) === tile ? 1 : 0) - start[i]) * v; });
      draw();
    };
    let run;
    let live = true;
    if (fresh || !open || reducedMotion()) {
      if (open) step(1);
    } else {
      run = animate(0, 1, { duration: OPEN_MS / 1000, ease: GLASS_EASE_ARRAY, onUpdate: step });
      run.then(() => {
        if (!live) return;
        Object.keys(joins.current).forEach((i) => {
          if (Number(i) !== tile) { delete joins.current[i]; tileEl(i)?.removeAttribute('data-joined'); }
        });
        draw();
      });
    }
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(g);
    return () => { live = false; ro.disconnect(); run?.stop(); };
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
 * under it (see TabGlass). Opening another tile closes the open one fully first (see Timeline), then opens it.
 *
 * entries: [{ key, attrs, tile, detail }]: attrs go on the tile's wrapper, tile renders the tile, detail renders
 * what opens under it. holdKey names a tile waiting to open while another closes: it holds still meanwhile.
 */
const TileGrid = ({ entries, openKey, holdKey = null, onOpen, onClose }) => {
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

  // While one tile's glass melts away and then another's forms, the tile that was clicked holds still on the
  // screen, however the rows around it move; then its details come into view, without moving it off the screen
  const drawers = useRef({});
  const held = at >= 0 ? at : entries.findIndex((e) => e.key === holdKey);
  useLayoutEffect(() => {
    const el = held >= 0 && grid.current?.querySelector(`[data-tile="${held}"]`);
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
    const t = at >= 0 && setTimeout(() => drawers.current[row]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), Math.max(OPEN_MS, CLOSE_MS) + 120);
    const stop = setTimeout(() => ro.disconnect(), end - performance.now());
    return () => { ro.disconnect(); clearTimeout(t); clearTimeout(stop); };
  }, [held, at, row]);

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
