import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

// How many columns a grid is laid out in right now (its columns follow the width)
const useColumns = (ref) => {
  const [n, setN] = useState(1);
  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid) return undefined;
    const measure = () => setN(Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, [ref]);
  return n;
};

/**
 * A grid of tiles whose opened tile stays put: its details open as a full-width row under the tile's row, with a
 * notch pointing up at it. Opening another tile in the same row swaps the details in place; in another row, the
 * row moves there.
 *
 * entries: [{ key, attrs, tile, detail }]: attrs go on the tile's wrapper, tile renders the tile, detail renders
 * what opens under it.
 */
const TileGrid = ({ entries, openKey, onOpen, onClose }) => {
  const grid = useRef(null);
  const drawer = useRef(null);
  const cols = useColumns(grid);
  const at = entries.findIndex((e) => e.key === openKey);
  const row = at < 0 ? -1 : Math.floor(at / cols);
  const rowEnd = Math.min(entries.length - 1, (row + 1) * cols - 1);

  // The details open by growing from nothing, so the rows below slide down rather than jump
  useLayoutEffect(() => {
    const el = drawer.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.animate(
      [{ height: '0px', opacity: 0 }, { height: `${el.offsetHeight}px`, opacity: 1 }],
      { duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    );
  }, [row]);

  // Keep the opened details in view without moving the tile off the screen
  useEffect(() => {
    if (at < 0) return undefined;
    const t = setTimeout(() => drawer.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 340);
    return () => clearTimeout(t);
  }, [at]);

  return (
    <div className="lab__grid" ref={grid}>
      {entries.map((e, i) => (
        <Fragment key={e.key}>
          <div {...e.attrs} className={`timeline__item${i === at ? ' is-open' : ''}`}>
            {e.tile(() => (i === at ? onClose() : onOpen(e.key)), i === at)}
          </div>
          {i === rowEnd && (
            <div
              key={`drawer-${row}`}
              ref={drawer}
              className="tile-drawer"
              style={{ '--notch': `${(((at % cols) + 0.5) / cols) * 100}%`, '--band-hue': entries[at].attrs.style?.['--band-hue'] }}
              role="region"
              aria-label="Details"
            >
              <div className="tile-drawer__inner">
                {entries[at].detail()}
                <button type="button" className="tile-drawer__close" onClick={onClose} aria-label="Close the details">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
};

export default TileGrid;
