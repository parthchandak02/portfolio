import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { animate } from 'motion';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { spectrumBands } from '../data/spectrum';
import { glowPrism } from '../hooks/prismGlow';
import { swarmLight } from '../hooks/swarmLight';
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
const SWITCH_MS = 140; // ms a mouse must rest on another lane before it takes over, so heading for the link doesn't pick lanes on the way

// What the readout's link opens, in words, from where it points
const linkLabel = (url) => {
  if (/patents\.google/.test(url)) return 'View patent';
  if (/doi\.org/.test(url)) return 'Read paper';
  if (/github\.com/.test(url)) return 'View code';
  if (/youtube\.com|youtu\.be/.test(url)) return 'Watch';
  if (/photos\.app\.goo\.gl/.test(url)) return 'See photos';
  if (/freepressjournal/.test(url)) return 'Read article';
  return 'Open link';
};

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
const Track = ({ band, placed, active, onActive, onLeave, top, left = 0, height }) => {
  const trackRef = useRef(null);

  const pick = useCallback(
    (e) => {
      const clientX = e.clientX;
      const rect = trackRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      let best = placed[0];
      placed.forEach((p) => {
        if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
      });
      onActive(best, e.pointerType);
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
      style={{ top: `${top}px`, left: `${left}px`, height: `${height}px` }}
      role="group"
      tabIndex={0}
      aria-label={`${band ? band.name : 'All bands'}: use left and right arrow keys to move between items`}
      onPointerMove={pick}
      onPointerDown={(e) => pick({ clientX: e.clientX, pointerType: 'touch' })}
      onPointerLeave={onLeave}
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
// A swarm of the strip's own colours then carries the fold to the button that undoes it, so the control
// explains itself.
const INTRO_HOLD = 1100; // ms the lanes stay open; the draw-in finishes inside it. Start-up work adds ~0.5 s in practice
const FOLD_MS = 1150; // ms for the fold to finish, matching the collapse transitions in Spectrograph.css
const SWARM_WAVE = 520; // ms for the lift-off to travel from the strip's left end to its right
const SWARM_CAP = 3200; // ms after which any pill still in the air is let go
const HINT_MS = 2600; // ms the button labels stay up after the first pills land

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const noise = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };

const Spectrograph = ({ lightMode = false, handedOver = false, onBand, onReading }) => {
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

  // Someone is reading the strip while a mouse is over it, a finger has touched it, or the keyboard is in
  // it; the scene behind steps back meanwhile. A touch counts until the next touch lands somewhere else.
  const sectionRef = useRef(null);
  const [hovering, setHovering] = useState(false);
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const reading = hovering || touched || focused;
  useEffect(() => {
    if (onReading) onReading(reading);
  }, [reading, onReading]);
  useEffect(() => {
    if (!touched) return undefined;
    const onDown = (e) => { if (!sectionRef.current?.contains(e.target)) setTouched(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [touched]);

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
  // Open, each lane keeps a margin on the left for its band's name
  const gutter = width < 560 ? 84 : 104;
  const stripPlaced = useMemo(() => place(all, width), [all, width]);
  const lanes = useMemo(() => rows.map(({ band, entries }) => ({ band, placed: place(entries, width - gutter) })), [rows, width, gutter]);
  const lines = useMemo(() => {
    const laneOf = new Map();
    lanes.forEach(({ placed }, lane) => placed.forEach((p) => laneOf.set(p.item, { lane, x: p.x })));
    return stripPlaced.map((p, i) => {
      const home = laneOf.get(p.item);
      return { ...p, sx: p.x, bx: gutter + home.x, lane: home.lane, jitter: (i * 37) % 90 };
    });
  }, [stripPlaced, lanes, gutter]);

  // A mouse crossing other lanes on its way down to the readout's link leaves the picked line alone: a
  // line in another lane takes over only once the mouse rests there. Within a lane, and on touch, it is
  // immediate.
  const activeRef = useRef(null);
  activeRef.current = active;
  const switchRef = useRef(0);
  const pick = useCallback((entry, pointerType) => {
    clearTimeout(switchRef.current);
    const current = activeRef.current;
    if (pointerType === 'touch' || !current || current.band === entry.band) { setActive(entry); return; }
    switchRef.current = setTimeout(() => setActive(entry), SWITCH_MS);
  }, []);
  const cancelPick = useCallback(() => clearTimeout(switchRef.current), []);
  useEffect(() => () => clearTimeout(switchRef.current), []);

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

  // Every fourth line lifts off the strip as a pill of its own colour, in a wave from left to right like
  // the bars rising. Each is thrown upward at its own speed and pulled into the button by a spring, so
  // each curves in on its own path; it stretches with its speed, and the chevron takes its colour and
  // gives a small bounce as it is absorbed.
  const rafRef = useRef(0);
  const flightsRef = useRef([]);
  const pillsRef = useRef([]);
  const launch = useCallback((withHints) => {
    // The button labels come up only on the opening; a fold the visitor makes just gets the swarm
    const hints = withHints ? showHints : () => {};
    const stage = stageRef.current;
    const button = toggleRef.current;
    if (!stage || !button || button.classList.contains('is-away')) return;
    const s = stage.getBoundingClientRect();
    if (s.bottom < 0 || s.top > window.innerHeight) { hints(); return; }
    const b = button.getBoundingClientRect();
    const T = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    const catchR = b.width / 2 - 6; // a pill is absorbed once it is inside the button's glass
    const chevron = button.querySelector('.spectro__chevron');

    const lines = Array.from(stage.querySelectorAll('.spectro__line'))
      .map((el) => ({ r: el.getBoundingClientRect(), hue: getComputedStyle(el).getPropertyValue('--hue').trim() }))
      .sort((p, q) => p.r.left - q.r.left);
    if (!lines.length) { hints(); return; }
    const left = lines[0].r.left;
    const span = lines[lines.length - 1].r.left - left || 1;
    const pills = lines.filter((_, i) => i % 4 === 0).map((l, i) => {
      const x = l.r.left + l.r.width / 2;
      const y = l.r.top + l.r.height / 2;
      return { hue: l.hue, x, y, px: x, py: y, angle: 0, speed: 0, born: 0, r1: noise(i, 1), r2: noise(i, 2), wave: (x - left) / span, on: false, done: false };
    });

    let landed = false;
    const absorb = (p) => {
      if (p.done) return;
      p.done = true;
      p.stop?.();
      button.style.color = p.hue;
      if (chevron) {
        flightsRef.current.push(animate(1.22, 1, {
          type: 'spring', stiffness: 520, damping: 14,
          onUpdate: (v) => { chevron.style.scale = v; },
          onComplete: () => { chevron.style.scale = ''; }
        }));
      }
      // The first pill to land lights the prism too
      if (!landed) { landed = true; hints(); glowPrism(); }
    };

    pills.forEach((p) => {
      p.timer = setTimeout(() => {
        p.on = true;
        p.born = performance.now();
        // Upward the spring is loose, so the throw carries each pill above the button and it drops in.
        // Sideways it is nearly critical, so no pill swings past the button and off the screen's edge.
        const stiffness = 55 + p.r1 * 35;
        const fx = animate(p.x, T.x, { type: 'spring', stiffness, damping: 1.9 * Math.sqrt(stiffness), velocity: (T.x - p.x) * (0.3 + p.r1 * 0.6), onUpdate: (v) => { p.x = v; } });
        const fy = animate(p.y, T.y, { type: 'spring', stiffness, damping: 9 + p.r2 * 4, velocity: -(600 + p.r2 * 700), onUpdate: (v) => { p.y = v; } });
        p.stop = () => { fx.stop(); fy.stop(); };
        flightsRef.current.push(fx, fy);
        Promise.all([fx, fy]).then(() => absorb(p));
      }, p.wave * SWARM_WAVE + p.r1 * 80);
    });

    // The pills are drawn as light in the 3D scene (SwarmLight); this loop measures each one's speed and
    // heading for that drawing, and catches it as it reaches the button
    swarmLight.pills = pills;
    const t0 = performance.now();
    let last = t0;
    const frame = (now) => {
      const dt = Math.max(1, now - last);
      last = now;
      let live = 0;
      pills.forEach((p) => {
        if (p.done) return;
        live += 1;
        if (!p.on) return;
        const dx = p.x - p.px;
        const dy = p.y - p.py;
        p.px = p.x;
        p.py = p.y;
        if (Math.hypot(p.x - T.x, p.y - T.y) < catchR) { absorb(p); return; }
        // Speed in px per 60 Hz frame sets the pill's length; the heading is in the scene's y-up terms
        p.speed = (Math.hypot(dx, dy) / dt) * 16.7;
        if (p.speed > 0.2) p.angle = Math.atan2(-dy, dx) - Math.PI / 2;
      });
      if (live && now - t0 < SWARM_CAP) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        stopSwarm();
        if (!landed) hints();
      }
    };
    rafRef.current = requestAnimationFrame(frame);
    pillsRef.current = pills;
  // stopSwarm only touches refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageRef, showHints]);

  // The scene loads a moment after the page; hold the swarm until it is drawing, so the first visit never misses it
  const sendSpark = useCallback((withHints = true) => {
    const start = performance.now();
    const wait = () => {
      if (swarmLight.ready || performance.now() - start > 3000) launch(withHints);
      else timersRef.current.push(setTimeout(wait, 100));
    };
    wait();
  }, [launch]);

  // Ends any flight: the pills, their light in the scene, and the chevron's borrowed colour
  const stopSwarm = () => {
    cancelAnimationFrame(rafRef.current);
    pillsRef.current.forEach((p) => clearTimeout(p.timer));
    pillsRef.current = [];
    flightsRef.current.forEach((c) => c.stop());
    flightsRef.current = [];
    swarmLight.pills = [];
    const button = toggleRef.current;
    if (button) {
      // The colour eases back through the button's transition
      setTimeout(() => { button.style.color = ''; }, 350);
      const chevron = button.querySelector('.spectro__chevron');
      if (chevron) chevron.style.scale = '';
    }
  };

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
  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    stopSwarm();
  }, []);

  const onToggle = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    stopSwarm();
    setIntro(false);
    setHint(false);
    const ui = document.querySelector('.layout__ui');
    if (ui) ui.classList.remove('layout__ui--hints');
    // Folding the lanes back into the strip sends the swarm to the button again, once the fold has landed
    if (expanded && !prefersReducedMotion()) timersRef.current.push(setTimeout(() => sendSpark(false), FOLD_MS));
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
      <ChevronDown size={18} strokeWidth={1.75} className="spectro__chevron" />
    </button>
  );

  return (
    <section
      ref={sectionRef}
      onPointerEnter={(e) => { if (e.pointerType !== 'touch') setHovering(true); }}
      onPointerLeave={(e) => { if (e.pointerType !== 'touch') setHovering(false); }}
      onPointerDown={(e) => { if (e.pointerType === 'touch') setTouched(true); }}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}
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
          <span key={band.key} className="spectro__rule spectro__rule--lane" style={{ top: `${lane * rowH + rowH / 2}px`, left: `${gutter}px`, '--lane': lane }} />
        ))}
        {lanes.map(({ band }, lane) => (
          <span
            key={band.key}
            className={`spectro__label${band === active?.band ? ' is-on' : ''}`}
            style={{ top: `${lane * rowH}px`, height: `${rowH}px`, '--lane': lane, '--hue': band.hue }}
            aria-hidden="true"
          >
            {band.name}
          </span>
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
            <Track key={band.key} band={band} placed={placed} active={active} onActive={pick} onLeave={cancelPick} top={lane * rowH} left={gutter} height={rowH} />
          ))
          : <Track placed={stripPlaced} active={active} onActive={pick} onLeave={cancelPick} top={0} height={rowH} />}
      </div>

      <div className={`spectro__readout${active ? '' : ' is-idle'}`} style={{ '--hue': active ? active.band.hue : 'currentColor' }} aria-live="polite">
        {active ? (
          <>
            <span className="spectro__kicker">{active.band.name} · {active.item.when}</span>
            <span className="spectro__title">{active.item.title}</span>
            <span className="spectro__meta">
              <span className="spectro__metatext">{active.item.meta}</span>
              {active.item.url && (
                <a className="spectro__link" href={active.item.url} target="_blank" rel="noopener noreferrer">
                  {linkLabel(active.item.url)} <ExternalLink size={13} />
                </a>
              )}
            </span>
          </>
        ) : (
          <span className="spectro__meta">Slide across the lines to read each one.</span>
        )}
      </div>

      {/* Plain list for screen readers: every item with its link */}
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
