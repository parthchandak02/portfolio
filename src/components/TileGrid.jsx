import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Molten from './Molten';

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
 * A grid of tiles whose opened tile stays put: its details form as glass in a full-width row under the tile's
 * row (see Molten). Opening another tile in the same row condenses the
 * new details in place; in another row, the old details melt away as the new ones form.
 *
 * entries: [{ key, attrs, tile, detail }]: attrs go on the tile's wrapper, tile renders the tile, detail renders
 * what opens under it.
 */
const TileGrid = ({ entries, openKey, onOpen, onClose }) => {
  const grid = useRef(null);
  const cols = useColumns(grid);
  const at = entries.findIndex((e) => e.key === openKey);
  const row = at < 0 ? -1 : Math.floor(at / cols);
  // Each row's details remember the tile they last showed, so they can melt away showing it
  const shown = useRef({});
  if (at >= 0) shown.current[row] = at;

  // Bring the opened details into view once they have formed, without moving the tile off the screen
  const drawers = useRef({});
  useEffect(() => {
    if (at < 0) return undefined;
    const t = setTimeout(() => drawers.current[row]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 420);
    return () => clearTimeout(t);
  }, [at, row]);

  return (
    <div className="lab__grid" ref={grid}>
      {entries.map((e, i) => {
        const r = Math.floor(i / cols);
        const rowEnd = i === Math.min(entries.length - 1, (r + 1) * cols - 1);
        const last = shown.current[r];
        const entry = last != null ? entries[last] : null;
        return (
          <Fragment key={e.key}>
            <div {...e.attrs} className={`timeline__item${i === at ? ' is-open' : ''}`}>
              {e.tile(() => (i === at ? onClose() : onOpen(e.key)), i === at)}
            </div>
            {rowEnd && entry && (
              <Molten
                open={r === row}
                contentKey={entry.key}
                className="tile-drawer"
                style={{ '--band-hue': entry.attrs.style?.['--band-hue'] }}
                role="region"
                aria-label="Details"
                data-row={r}
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
