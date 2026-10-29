import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

// One outline around a tile (x0..x1, y0..y1) and the details under it, which run down to `b`. Until the details
// reach past the gap under the tile, the tab alone runs down; after, the glass spreads across the row.
const outline = ({ x0, x1, y0, y1 }, b, W, gap) => {
  const top = [`M${x0} ${y0 + R}`, `Q${x0} ${y0} ${x0 + R} ${y0}`, `L${x1 - R} ${y0}`, `Q${x1} ${y0} ${x1} ${y0 + R}`];
  const yb = y1 + gap;
  if (b < yb + 1) {
    const yB = Math.max(y1, b);
    return [...top, `L${x1} ${yB - R}`, `Q${x1} ${yB} ${x1 - R} ${yB}`, `L${x0 + R} ${yB}`, `Q${x0} ${yB} ${x0} ${yB - R}`, 'Z'].join(' ');
  }
  const r = Math.min(RB, (b - yb) / 2);
  const f = Math.min(F, b - yb);
  const p = top;
  if (x1 < W - 1) p.push(`L${x1} ${yb - f}`, `Q${x1} ${yb} ${x1 + f} ${yb}`, `L${W - r} ${yb}`, `Q${W} ${yb} ${W} ${yb + r}`);
  p.push(`L${W} ${b - r}`, `Q${W} ${b} ${W - r} ${b}`, `L${r} ${b}`, `Q0 ${b} 0 ${b - r}`);
  if (x0 > 1) p.push(`L0 ${yb + r}`, `Q0 ${yb} ${r} ${yb}`, `L${x0 - f} ${yb}`, `Q${x0} ${yb} ${x0} ${yb - f}`);
  p.push('Z');
  return p.join(' ');
};

/**
 * The glass of one opened tile and its details as a single shape, like a folder tab: it follows the tile and
 * the details row as they flow (see Molten), slides across when another tile in the row opens, and fades
 * as it closes.
 */
const TabGlass = ({ grid, row, tile, gap, open }) => {
  const shape = useRef(null);
  const edge = useRef(null);
  const from = useRef(null); // the tab as drawn when it last started moving
  const now = useRef(null); // the tab as drawn now
  const t = useRef(1); // how far it has moved, 0..1

  useLayoutEffect(() => {
    const g = grid.current;
    if (!g) return undefined;
    const draw = () => {
      const el = g.querySelector(`[data-tile="${tile}"]`);
      if (!el || !shape.current) return;
      const to = { x0: el.offsetLeft, x1: el.offsetLeft + el.offsetWidth, y0: el.offsetTop, y1: el.offsetTop + el.offsetHeight };
      const a = from.current || to;
      const k = t.current;
      const tab = { x0: a.x0 + (to.x0 - a.x0) * k, x1: a.x1 + (to.x1 - a.x1) * k, y0: a.y0 + (to.y0 - a.y0) * k, y1: a.y1 + (to.y1 - a.y1) * k };
      now.current = tab;
      const d = g.querySelector(`.tile-drawer[data-row="${row}"]`);
      const b = d ? d.offsetTop + d.offsetHeight : tab.y1;
      const path = outline(tab, b, g.clientWidth, gap);
      shape.current.style.clipPath = `path("${path}")`;
      edge.current.setAttribute('d', path);
    };
    // Another tile in the row: slide the tab over from where it is
    let slide;
    if (now.current && !reducedMotion()) {
      from.current = now.current;
      t.current = 0;
      slide = animate(0, 1, { duration: OPEN_MS / 1000, ease: GLASS_EASE_ARRAY, onUpdate: (v) => { t.current = v; draw(); } });
    } else {
      t.current = 1;
    }
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(g);
    return () => { ro.disconnect(); slide?.stop(); };
  }, [grid, row, tile, gap]);

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
 * under it (see TabGlass). Opening another tile in the same row slides the tab over and condenses the new
 * details in place; in another row, the old glass melts away as the new one forms.
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

  // Bring the opened details into view once they have formed, without moving the tile off the screen
  const drawers = useRef({});
  useEffect(() => {
    if (at < 0) return undefined;
    const t = setTimeout(() => drawers.current[row]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 420);
    return () => clearTimeout(t);
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
