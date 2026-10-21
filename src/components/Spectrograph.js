import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { STICK_AT } from '../hooks/useScrollHighlight';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { spectrumBands } from '../data/spectrum';
import './Spectrograph.css';

// Time is not linear on the track: the sparse early years are compressed so the busy recent
// years get room. Axis labels use the same mapping, so every position is still honest.
const KNOTS = [
  [2015, 0],
  [2020, 0.14],
  [2023, 0.34],
  [2025, 0.62],
  [2026, 0.8],
  [2027, 1]
];
const MIN_GAP = 3.5; // px between neighbouring lines
const EDGE = 4; // px kept free at each end of a track

const warp = (t) => {
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
// pulls the tail back inside the track. Order never changes.
const place = (entries, width) => {
  const sorted = [...entries].sort((a, b) => a.item.t - b.item.t);
  const pos = sorted.map((e) => EDGE + warp(e.item.t) * (width - EDGE * 2));
  for (let i = 1; i < pos.length; i += 1) {
    if (pos[i] < pos[i - 1] + MIN_GAP) pos[i] = pos[i - 1] + MIN_GAP;
  }
  for (let i = pos.length - 1; i >= 0; i -= 1) {
    const limit = i === pos.length - 1 ? width - EDGE : pos[i + 1] - MIN_GAP;
    if (pos[i] > limit) pos[i] = limit;
  }
  return sorted.map((e, i) => ({ ...e, x: pos[i] }));
};

// Measures an element's width, and re-measures whenever the element is mounted, replaced or resized.
// The returned ref still exposes `.current`, so callers can read the element for pointer maths.
export const useWidth = () => {
  const nodeRef = useRef(null);
  const [node, setNode] = useState(null);
  const [width, setWidth] = useState(720);

  const ref = useMemo(() => {
    const setter = (el) => {
      nodeRef.current = el;
      setNode(el);
    };
    Object.defineProperty(setter, 'current', { get: () => nodeRef.current });
    return setter;
  }, []);

  useEffect(() => {
    if (!node) return undefined;
    const measure = () => setWidth(Math.max(120, Math.round(node.getBoundingClientRect().width)));
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [ref, width];
};

/**
 * One row of lines. The whole track is the touch target: pointer position picks the nearest line
 * (hover on desktop, drag or tap on a phone), and the arrow keys step through lines.
 */
const Track = ({ band, entries, active, onActive }) => {
  const [trackRef, width] = useWidth();
  const placed = useMemo(() => place(entries, width), [entries, width]);

  const pick = useCallback(
    (clientX) => {
      const rect = trackRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      let best = placed[0];
      placed.forEach((p) => {
        if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
      });
      onActive(best);
    },
    [placed, onActive, trackRef]
  );

  const step = (delta) => {
    const index = placed.findIndex((p) => active && p.item === active.item);
    const next = index === -1 ? (delta > 0 ? 0 : placed.length - 1) : Math.min(placed.length - 1, Math.max(0, index + delta));
    onActive(placed[next]);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'Home') { e.preventDefault(); onActive(placed[0]); }
    else if (e.key === 'End') { e.preventDefault(); onActive(placed[placed.length - 1]); }
    else if (e.key === 'Escape') onActive(null);
  };

  return (
    <div
      ref={trackRef}
      className="spectro__track"
      role="group"
      tabIndex={0}
      aria-label={`${band ? band.name : 'All bands'}: use left and right arrow keys to move between items`}
      onPointerMove={(e) => pick(e.clientX)}
      onPointerDown={(e) => pick(e.clientX)}
      onKeyDown={onKeyDown}
    >
      {placed.map((p) => {
        const on = active && active.item === p.item;
        return (
          <i
            key={`${p.band.key}-${p.item.title}`}
            className={`spectro__line${p.item.future ? ' spectro__line--future' : ''}${on ? ' spectro__line--on' : ''}`}
            style={{ left: `${p.x}px`, '--hue': p.band.hue }}
          />
        );
      })}
    </div>
  );
};

/**
 * The prism splits one beam into a spectrum; this splits a record into seven bands.
 * Collapsed it is a single strip, expanded it is one row per band. Everything is drawn from
 * src/data/spectrum.js, so adding an item there is all it takes.
 */
const Spectrograph = ({ lightMode = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(null);

  const all = useMemo(
    () => spectrumBands.flatMap((band) => band.items.map((item) => ({ item, band }))),
    []
  );
  const rows = useMemo(
    () => spectrumBands.map((band) => ({ band, entries: band.items.map((item) => ({ item, band })) })),
    []
  );

  // The toggle is one more round button in the column with the other three, so it lives in the fixed UI
  // layer. It steps aside once the strip has handed over to the band bar.
  const sectionRef = useRef(null);
  const [slot, setSlot] = useState(null);
  const [handedOver, setHandedOver] = useState(false);

  useEffect(() => {
    setSlot(document.querySelector('.layout__ui'));
    const scroller = document.querySelector('.main-content-scroll');
    const section = sectionRef.current;
    if (!scroller || !section) return undefined;
    const check = () => setHandedOver(section.getBoundingClientRect().top <= scroller.getBoundingClientRect().top + STICK_AT);
    check();
    scroller.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      scroller.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  const toggle = (
    <button
      type="button"
      className={`spectro-toggle glass glass-interactive${handedOver ? ' is-away' : ''}`}
      aria-expanded={expanded}
      aria-label={expanded ? 'Collapse to one strip' : 'Split into seven bands'}
      title={expanded ? 'Collapse' : 'Split into seven bands'}
      tabIndex={handedOver ? -1 : 0}
      onClick={() => { setExpanded((v) => !v); setActive(null); }}
    >
      <ChevronDown size={18} strokeWidth={1.75} className="spectro__chevron" />
    </button>
  );

  return (
    <section
      ref={sectionRef}
      className={`spectro ${expanded ? 'spectro--expanded' : 'spectro--collapsed'} ${active ? 'spectro--picking' : ''} ${lightMode ? 'spectro--light' : 'spectro--dark'}`}
      aria-label="Record spectrograph"
    >
      {/* Both layouts stay mounted and trade height, so the strip unfolds into lanes instead of swapping.
          The chevron never moves. */}
      {slot && createPortal(toggle, slot)}
      <div className="spectro__stage">
        <div className="spectro__fold spectro__fold--strip" inert={expanded}>
          <div className="spectro__foldinner">
            <Track entries={all} active={active} onActive={setActive} />
          </div>
        </div>
        <div className="spectro__fold spectro__fold--bands" inert={!expanded}>
          <div className="spectro__foldinner">
            {rows.map(({ band, entries }, i) => (
              <div className="spectro__row" key={band.key} style={{ '--hue': band.hue, '--i': i }}>
                <Track band={band} entries={entries} active={active} onActive={setActive} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`spectro__readout${active ? '' : ' is-idle'}`} style={{ '--hue': active ? active.band.hue : 'currentColor' }} aria-live="polite">
        {active ? (
          <>
            <span className="spectro__kicker">{active.band.name} · {active.item.when}{active.item.future ? ' · upcoming' : ''}</span>
            <span className="spectro__title">{active.item.title}</span>
            <span className="spectro__meta">
              <span className="spectro__metatext">{active.item.meta}</span>
              {active.item.url && (
                <a className="spectro__proof" href={active.item.url} target="_blank" rel="noopener noreferrer">
                  View proof <ExternalLink size={13} />
                </a>
              )}
            </span>
          </>
        ) : (
          <span className="spectro__meta">Slide across the lines to read each one.</span>
        )}
      </div>

      {/* Plain list for screen readers: every item with its proof link */}
      <ul className="spectro__sr">
        {all.map(({ item, band }) => (
          <li key={`${band.key}-${item.title}`}>
            {band.name}, {item.when}: {item.url ? <a href={item.url}>{item.title}</a> : item.title}. {item.meta}.
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Spectrograph;
