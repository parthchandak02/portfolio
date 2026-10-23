import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
 * The touch and keyboard target for one row. The whole row picks the nearest line (hover on desktop,
 * drag or tap on a phone), and the arrow keys step through lines. The lines themselves are drawn once,
 * for every row, by the Spectrograph, so they can travel between the strip and the lanes.
 */
const Track = ({ band, placed, active, onActive, top, height }) => {
  const trackRef = useRef(null);

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
    [placed, onActive]
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
      style={{ top: `${top}px`, height: `${height}px` }}
      role="group"
      tabIndex={0}
      aria-label={`${band ? band.name : 'All bands'}: use left and right arrow keys to move between items`}
      onPointerMove={(e) => pick(e.clientX)}
      onPointerDown={(e) => pick(e.clientX)}
      onKeyDown={onKeyDown}
    />
  );
};

/**
 * The prism splits one beam into a spectrum; this splits a record into eight bands, red through violet.
 * Collapsed it is a single strip, expanded it is one row per band. Everything is drawn from
 * src/data/spectrum.js, so adding an item there is all it takes.
 */
// The opening: the record arrives split into its eight lanes, holds a moment, then folds into one strip.
// A spark then carries the fold to the button that undoes it, so the control explains itself.
const INTRO_HOLD = 1100; // ms the lanes stay open; the draw-in finishes inside it. Start-up work adds ~0.5 s in practice
const FOLD_MS = 1150; // ms for the fold to finish, matching the collapse transitions in Spectrograph.css
const SPARK_MS = 1900; // ms from leaving the strip to closing the lap round the button
const COAST_MS = 1300; // ms the drawn ring keeps turning as it fades, on the same curve
const HINT_MS = 2600; // ms the button labels stay up after the spark lands

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// One timing curve for the spark's whole trip: quick off the strip, slowing all the way round the button
const easeOut = (t) => 1 - Math.pow(1 - t, 2.6);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { const c = clamp01(x); return c * c * (3 - 2 * c); };

const Spectrograph = ({ lightMode = false, handedOver = false, onBand }) => {
  // Section links and reduced motion skip the show and start folded
  const [intro, setIntro] = useState(() => typeof window !== 'undefined' && !window.location.hash && !prefersReducedMotion());
  const [expanded, setExpanded] = useState(intro);
  const [hint, setHint] = useState(false);
  const [active, setActive] = useState(null);
  const toggleRef = useRef(null);
  const timersRef = useRef([]);

  // The prism lights the picked item's band in its rainbow
  const band = active ? active.band : null;
  useEffect(() => {
    if (onBand) onBand(band);
  }, [band, onBand]);

  const all = useMemo(
    () => spectrumBands.flatMap((band) => band.items.map((item) => ({ item, band }))),
    []
  );
  const rows = useMemo(
    () => spectrumBands.map((band) => ({ band, entries: band.items.map((item) => ({ item, band })) })),
    []
  );

  // Every line has two homes: its spot on the strip and its spot in its band's lane. The first lane sits
  // where the strip is, so opening drops lines down onto their lanes and closing lifts them back up.
  const [stageRef, width] = useWidth();
  const rowH = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches ? 52 : 46;
  const stripPlaced = useMemo(() => place(all, width), [all, width]);
  const lanes = useMemo(() => rows.map(({ band, entries }) => ({ band, placed: place(entries, width) })), [rows, width]);
  const lines = useMemo(() => {
    const laneOf = new Map();
    lanes.forEach(({ placed }, lane) => placed.forEach((p) => laneOf.set(p.item, { lane, x: p.x })));
    return stripPlaced.map((p, i) => {
      const home = laneOf.get(p.item);
      return { ...p, sx: p.x, bx: home.x, lane: home.lane, jitter: (i * 37) % 90 };
    });
  }, [stripPlaced, lanes]);

  // The toggle is one more round button in the column with the other three, so it lives in the fixed UI
  // layer. It steps aside while the band bar has the spot; that is decided once, in useScrollHighlight,
  // so the strip and the bar can never both be showing.
  const [slot, setSlot] = useState(null);
  useEffect(() => setSlot(document.querySelector('.layout__ui')), []);

  // The spark leaves the strip's right end and lands on the toggle, which rings; the other buttons show their labels
  const showHints = useCallback(() => {
    const ui = document.querySelector('.layout__ui');
    setHint(true);
    if (ui) ui.classList.add('layout__ui--hints');
    timersRef.current.push(setTimeout(() => {
      setHint(false);
      if (ui) ui.classList.remove('layout__ui--hints');
    }, HINT_MS));
  }, []);

  // The spark leaves the strip's right end, curves into the button's rim from the left already heading up,
  // and carries straight on round it, drawing a ring that coasts on and fades. One motion, one speed curve.
  const rafRef = useRef(0);
  const sendSpark = useCallback(() => {
    const stage = stageRef.current;
    const button = toggleRef.current;
    if (!stage || !button || button.classList.contains('is-away')) return;
    const s = stage.getBoundingClientRect();
    const ring = button.querySelector('.spectro-ring');
    const arcEl = button.querySelector('.spectro-ring__arc');
    if (s.bottom < 0 || s.top > window.innerHeight || !ring) { showHints(); return; }
    const o = ring.getBoundingClientRect();
    const cx = o.left + o.width / 2;
    const cy = o.top + o.height / 2;
    const r = o.width / 2 - 1.25; // the middle of the ring's band
    const A = { x: s.right - 6, y: s.top + rowH / 2 };
    const P = { x: cx - r, y: cy }; // enter on the left of the rim
    const Q = { x: P.x, y: P.y + Math.max(40, (A.y - P.y) * 0.9) }; // control point below it, so the curve meets the rim heading up

    // The flight measured by distance, so the speed carries over unchanged where it meets the rim
    const pts = [];
    let flight = 0;
    for (let i = 0; i <= 80; i += 1) {
      const t = i / 80;
      const u = 1 - t;
      const p = { x: u * u * A.x + 2 * u * t * Q.x + t * t * P.x, y: u * u * A.y + 2 * u * t * Q.y + t * t * P.y };
      if (i) flight += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
      p.d = flight;
      pts.push(p);
    }
    const lap = 2 * Math.PI * r;
    const coast = (80 * Math.PI * r) / 180; // the ring coasts on 80 degrees after it closes
    const total = flight + lap + coast;
    const at = (d) => {
      if (d <= flight) {
        let i = 1;
        while (i < pts.length - 1 && pts[i].d < d) i += 1;
        const a = pts[i - 1];
        const b = pts[i];
        const f = (d - a.d) / Math.max(1e-6, b.d - a.d);
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
      }
      const phi = Math.PI + (d - flight) / r; // clockwise on screen from the left
      return { x: cx + r * Math.cos(phi), y: cy + r * Math.sin(phi) };
    };

    // A head and a short trail riding the same path; once on the rim the ring itself is the trail
    const lags = [0, 9, 19, 31];
    const sparks = lags.map((_, k) => {
      const spark = document.createElement('i');
      spark.className = k ? 'spectro-spark spectro-spark--trail' : 'spectro-spark';
      spark.setAttribute('aria-hidden', 'true');
      spark.style.opacity = '0';
      document.body.appendChild(spark);
      return spark;
    });
    ring.style.setProperty('--start', '270deg');

    let lit = false;
    const t0 = performance.now();
    const frame = (now) => {
      const d = easeOut(clamp01((now - t0) / (SPARK_MS + COAST_MS))) * total;
      const drawn = clamp01((d - flight) / lap);
      const after = clamp01((d - flight - lap) / coast);
      const drift = (Math.max(0, d - flight - lap) / r) * (180 / Math.PI);

      sparks.forEach((el, k) => {
        const dk = Math.max(0, d - lags[k]);
        const p = at(dk);
        const onRim = clamp01((dk - flight) / 40);
        let fade = (1 - k * 0.26) * clamp01(dk / 30) * (1 - smooth(after));
        if (k && drawn > 0) fade *= 1 - smooth(drawn * 3);
        el.style.opacity = String(fade);
        el.style.transform = `translate(${p.x}px, ${p.y}px) scale(${(1 - onRim * 0.45) * (1 - k * 0.18)})`;
      });
      ring.style.setProperty('--sweep', `${drawn * 360}deg`);
      ring.style.transform = `rotate(${drift}deg)`;
      if (arcEl) arcEl.style.opacity = drawn > 0 ? String(1 - smooth(after)) : '0';
      if (!lit && drawn > 0) { lit = true; showHints(); }

      if (now - t0 < SPARK_MS + COAST_MS) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        sparks.forEach((el) => el.remove());
        if (arcEl) arcEl.style.opacity = '0';
        ring.style.transform = '';
      }
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [stageRef, rowH, showHints]);

  // Run the opening once. Touching the toggle during it hands control straight to the visitor.
  useEffect(() => {
    if (!intro) return undefined;
    const timers = timersRef.current;
    timers.push(setTimeout(() => { setExpanded(false); setIntro(false); }, INTRO_HOLD));
    timers.push(setTimeout(sendSpark, INTRO_HOLD + FOLD_MS));
    return () => timers.forEach(clearTimeout);
    // Once, on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const stopSpark = () => {
    cancelAnimationFrame(rafRef.current);
    document.querySelectorAll('.spectro-spark').forEach((el) => el.remove());
    const arcEl = toggleRef.current && toggleRef.current.querySelector('.spectro-ring__arc');
    if (arcEl) arcEl.style.opacity = '0';
  };
  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    stopSpark();
  }, []);

  const onToggle = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    stopSpark();
    setIntro(false);
    setHint(false);
    const ui = document.querySelector('.layout__ui');
    if (ui) ui.classList.remove('layout__ui--hints');
    setExpanded((v) => !v);
    setActive(null);
  };

  const toggle = (
    <button
      ref={toggleRef}
      type="button"
      className={`spectro-toggle glass glass-interactive${handedOver ? ' is-away' : ''}${hint ? ' is-hint' : ''}`}
      aria-expanded={expanded}
      aria-label={expanded ? 'Fold into one strip' : 'Split into eight bands'}
      tabIndex={handedOver ? -1 : 0}
      onClick={onToggle}
    >
      <span className="spectro-ring" aria-hidden="true"><span className="spectro-ring__arc" /></span>
      <ChevronDown size={18} strokeWidth={1.75} className="spectro__chevron" />
    </button>
  );

  return (
    <section
      className={`spectro ${expanded ? 'spectro--expanded' : 'spectro--collapsed'}${intro ? ' spectro--intro' : ''} ${active ? 'spectro--picking' : ''} ${lightMode ? 'spectro--light' : 'spectro--dark'}`}
      aria-label="Record spectrograph"
    >
      {slot && createPortal(toggle, slot)}
      <div
        ref={stageRef}
        className="spectro__stage"
        style={{ '--row-h': `${rowH}px`, height: `${expanded ? rowH * lanes.length : rowH}px` }}
      >
        {/* Hairlines: the strip's own, and one per lane that draws in as its lines arrive */}
        <span className="spectro__rule spectro__rule--strip" style={{ top: `${rowH / 2}px` }} />
        {lanes.map(({ band }, lane) => (
          <span key={band.key} className="spectro__rule spectro__rule--lane" style={{ top: `${lane * rowH + rowH / 2}px`, '--lane': lane }} />
        ))}

        {/* Every line once. The outer span carries it along the row, the inner one between rows. */}
        <div className="spectro__lines" aria-hidden="true">
          {lines.map((l) => {
            const on = active && active.item === l.item;
            return (
              <span
                key={`${l.band.key}-${l.item.title}`}
                className="spectro__x"
                style={{ transform: `translateX(${expanded ? l.bx : l.sx}px)`, '--lane': l.lane, '--j': l.jitter }}
              >
                <span className="spectro__y" style={{ transform: `translateY(${(expanded ? l.lane * rowH : 0) + rowH / 2}px)` }}>
                  <i
                    className={`spectro__line${l.item.future ? ' spectro__line--future' : ''}${on ? ' spectro__line--on' : ''}`}
                    style={{ '--hue': l.band.hue }}
                    data-band={l.band.key}
                    data-title={l.item.title}
                  />
                </span>
              </span>
            );
          })}
        </div>

        {expanded
          ? lanes.map(({ band, placed }, lane) => (
            <Track key={band.key} band={band} placed={placed} active={active} onActive={setActive} top={lane * rowH} height={rowH} />
          ))
          : <Track placed={stripPlaced} active={active} onActive={setActive} top={0} height={rowH} />}
      </div>

      <div className={`spectro__readout${active ? '' : ' is-idle'}`} style={{ '--hue': active ? active.band.hue : 'currentColor' }} aria-live="polite">
        {active ? (
          <>
            <span className="spectro__kicker">{active.band.name} · {active.item.when}</span>
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
