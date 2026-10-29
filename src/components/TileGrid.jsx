import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { animate } from 'motion';
import { X } from 'lucide-react';
import Molten from './Molten';
import { CLOSE_MS, GLASS_CLOSE_EASE, GLASS_EASE_ARRAY, OPEN_MS, reducedMotion } from '../hooks/glassMotion';

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
const F = 12; // the inside curve where the tab meets the details

// One outline around the details under a row, which run from just under its tiles (yb) down to `b`, and the
// tabs that join it to the row's tiles. A tab is a tile's span (x0..x1) risen to `top`: up to the tile's top
// edge when it's fully joined, down to the details when it isn't, so a tab can drain or fill. Until the details
// reach past the gap under the row, the opened tile's tab alone runs down.
const outline = (tabs, yb, b, W, gap) => {
  if (b < yb + 1) {
    const { x0, x1, top } = tabs[tabs.length - 1];
    const yB = Math.max(yb - gap, b);
    return [`M${x0} ${top + R}`, `Q${x0} ${top} ${x0 + R} ${top}`, `L${x1 - R} ${top}`, `Q${x1} ${top} ${x1} ${top + R}`,
      `L${x1} ${yB - R}`, `Q${x1} ${yB} ${x1 - R} ${yB}`, `L${x0 + R} ${yB}`, `Q${x0} ${yB} ${x0} ${yB - R}`, 'Z'].join(' ');
  }
  const r = Math.min(RB, (b - yb) / 2);
  const risen = tabs.filter((t) => yb - t.top > 0.5).sort((m, n) => m.x0 - n.x0);
  const p = [`M0 ${b - r}`];
  if (!(risen[0]?.x0 < 1)) p.push(`L0 ${yb + r}`, `Q0 ${yb} ${r} ${yb}`);
  risen.forEach((t, i) => {
    const h = yb - t.top;
    const rt = Math.min(R, h / 2, (t.x1 - t.x0) / 2);
    // The inside curves where it meets the details, kept clear of a neighbouring tab's
    const room = (x) => (x == null ? F : x / 2);
    const fl = Math.min(F, h, room(i > 0 ? t.x0 - risen[i - 1].x1 : null));
    const fr = Math.min(F, h, room(i < risen.length - 1 ? risen[i + 1].x0 - t.x1 : null));
    if (t.x0 >= 1) p.push(`L${t.x0 - fl} ${yb}`, `Q${t.x0} ${yb} ${t.x0} ${yb - fl}`);
    p.push(`L${t.x0} ${t.top + rt}`, `Q${t.x0} ${t.top} ${t.x0 + rt} ${t.top}`, `L${t.x1 - rt} ${t.top}`, `Q${t.x1} ${t.top} ${t.x1} ${t.top + rt}`);
    if (t.x1 <= W - 1) p.push(`L${t.x1} ${yb - fr}`, `Q${t.x1} ${yb} ${t.x1 + fr} ${yb}`);
  });
  if (!(risen[risen.length - 1]?.x1 > W - 1)) p.push(`L${W - r} ${yb}`, `Q${W} ${yb} ${W} ${yb + r}`);
  p.push(`L${W} ${b - r}`, `Q${W} ${b} ${W - r} ${b}`, `L${r} ${b}`, `Q0 ${b} 0 ${b - r}`, 'Z');
  return p.join(' ');
};

/**
 * The glass of one opened tile and its details as a single shape, like a folder tab: it follows the tile and
 * the details row as they flow (see Molten), and fades as it closes. When another tile in the row opens, the
 * glass drains out of the old tile back into the details as it rises into the new one, and the details keep
 * their place, only flowing to fit what's new. A tile the glass has risen into gives up its own glass
 * (data-joined).
 */
const TabGlass = ({ grid, row, tile, gap, open }) => {
  const shape = useRef(null);
  const edge = useRef(null);
  const joins = useRef({}); // how far the glass has risen into each tile, 0..1

  useLayoutEffect(() => {
    const g = grid.current;
    if (!g) return undefined;
    const tileEl = (i) => g.querySelector(`[data-tile="${i}"]`);
    const draw = () => {
      const el = tileEl(tile);
      if (!el || !shape.current) return;
      const y0 = el.offsetTop;
      const yb = y0 + el.offsetHeight + gap;
      const tabs = Object.entries(joins.current).map(([i, j]) => {
        const t = tileEl(i);
        if (t) t.toggleAttribute('data-joined', open && j > 0.5);
        return t && { x0: t.offsetLeft, x1: t.offsetLeft + t.offsetWidth, top: yb - j * (yb - y0), j };
      }).filter(Boolean).sort((m, n) => m.j - n.j);
      const d = g.querySelector(`.tile-drawer[data-row="${row}"]`);
      const path = outline(tabs, yb, d ? d.offsetTop + d.offsetHeight : yb - gap, g.clientWidth, gap);
      shape.current.style.clipPath = `path("${path}")`;
      edge.current.setAttribute('d', path);
    };
    // The glass drains from every other tile as it rises into this one
    const start = { ...joins.current };
    const fresh = Object.keys(start).length === 0;
    if (!(tile in start)) start[tile] = 0;
    let run;
    let live = true;
    const step = (v) => {
      Object.keys(start).forEach((i) => { joins.current[i] = start[i] + ((Number(i) === tile ? 1 : 0) - start[i]) * v; });
      draw();
    };
    if (fresh || reducedMotion()) {
      step(1);
    } else {
      run = animate(0, 1, { duration: OPEN_MS / 1000, ease: GLASS_EASE_ARRAY, onUpdate: step });
      run.then(() => { if (!live) return; Object.keys(joins.current).forEach((i) => { if (Number(i) !== tile) { delete joins.current[i]; tileEl(i)?.removeAttribute('data-joined'); } }); draw(); });
    }
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(g);
    return () => { live = false; ro.disconnect(); run?.stop(); };
  }, [grid, row, tile, gap, open]);

  // Leaving the page, every tile it joined has its own glass back
  useLayoutEffect(() => () => {
    grid.current?.querySelectorAll('[data-joined]').forEach((el) => {
      if (el.closest('.tile-grid') === grid.current && Number(el.dataset.tile) in joins.current) el.removeAttribute('data-joined');
    });
  }, [grid]);

  // Frost in as it opens, out as it closes
  useLayoutEffect(() => {
    const els = [shape.current, edge.current?.ownerSVGElement];
    if (reducedMotion()) return undefined;
    const runs = els.map((el) => el?.animate(
      open ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
      open ? { duration: OPEN_MS * 0.6, easing: 'ease-out', fill: 'backwards' } : { duration: CLOSE_MS, easing: GLASS_CLOSE_EASE, fill: 'forwards' }
    ));
    return () => runs.forEach((a) => a?.cancel());
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
 * under it (see TabGlass). Opening another tile in the same row drains the glass out of the old tile as it
 * rises into the new one, and the details stay open, the new condensing in place of the old; in another row,
 * the old glass melts away as the new one forms.
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
                  <button type="button" className="tile-drawer__close" onClick={onClose} aria-label="Close the details">
                    <X size={16} />
                  </button>
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
