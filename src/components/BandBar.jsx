import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { bandForSection, spectrumBands } from '../data/spectrum';
import { timelineDataByCategory } from '../data/timelineData';
import { featuredName } from '../data/featured';
import { useWidth } from './Spectrograph';
import { scrollCardToLine } from '../hooks/useScrollHighlight';
import './BandBar.css';

const EDGE = 6;
const MIN_GAP = 6; // px between neighbouring ticks
const LAB_TITLES = new Set(timelineDataByCategory.lab.map((card) => card.title));

// Everything that scrolls under the bar fades out before it reaches it. Each element is faded on its
// own (not the whole scroll area) so the glass cards keep their blur of the scene behind them.
const FADE_SELECTOR = '.ui-typewriter-container, .spectro, .timeline__item > *';
const clearFade = (el) => {
  el.classList.remove('is-top-fading');
  el.style.removeProperty('--fade-cut');
  el.style.removeProperty('--fade-ramp');
};

// The Lab is one block on the page, so its projects all jump to that block. Selected work's copies of cards
// are only jumped to from Selected work's own bar.
const elementFor = (card, selected) => {
  if (selected) return document.querySelector(`.timeline__item[data-category="selected"][data-title="${CSS.escape(card)}"]`);
  const key = LAB_TITLES.has(card) ? 'Lab' : card;
  return document.querySelector(`.timeline__item[data-title="${CSS.escape(key)}"]:not([data-category="selected"])`);
};

const isCurrentCard = (item, title) => item.card === title || (title === 'Lab' && LAB_TITLES.has(item.card));

const scrollToCard = (card, selected = false) => {
  const target = elementFor(card, selected);
  const scroller = document.querySelector('.main-content-scroll');
  if (target && scroller) scrollCardToLine(target, scroller);
};

// Lay one band's items out by date between its first and last item, then keep them apart
const layout = (items, width) => {
  const sorted = [...items].sort((a, b) => a.t - b.t);
  const first = sorted[0].t;
  const span = sorted[sorted.length - 1].t - first || 1;
  const pos = sorted.map((item) => EDGE + ((item.t - first) / span) * (width - EDGE * 2));
  for (let i = 1; i < pos.length; i += 1) {
    if (pos[i] < pos[i - 1] + MIN_GAP) pos[i] = pos[i - 1] + MIN_GAP;
  }
  for (let i = pos.length - 1; i >= 0; i -= 1) {
    const limit = i === pos.length - 1 ? width - EDGE : pos[i + 1] - MIN_GAP;
    if (pos[i] > limit) pos[i] = limit;
  }
  return sorted.map((item, i) => ({ item, x: pos[i] }));
};

// The hand-off between the hero strip and the bar is one motion: the band's lines lift out of the strip
// into the bar (and back) at full height, while the other bands' lines fade out (or back in) where they stand.
// Positions are re-read every frame, so lines land on the strip even while it scrolls.
const MORPH_MS = 560;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const centre = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height };
};
const lineColour = (el) => {
  const cs = getComputedStyle(el);
  return cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? cs.borderTopColor : cs.backgroundColor;
};

const runMorph = (layer, sprites, done) => {
  layer.replaceChildren(...sprites.map((sp) => sp.el));
  const start = performance.now();
  let frame = 0;
  const tick = () => {
    const now = performance.now();
    let busy = false;
    sprites.forEach((sp) => {
      const raw = (now - start - sp.delay) / sp.duration;
      if (raw < 1) busy = true;
      const e = ease(Math.min(1, Math.max(0, raw)));
      const a = sp.from();
      const b = sp.to();
      const x = a.x + (b.x - a.x) * e;
      const y = a.y + (b.y - a.y) * e - Math.sin(Math.PI * e) * sp.lift;
      sp.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      sp.el.style.height = `${Math.max(0, a.h + (b.h - a.h) * e)}px`;
      sp.el.style.opacity = String(sp.o0 + (sp.o1 - sp.o0) * e);
    });
    if (busy) frame = requestAnimationFrame(tick);
    else { layer.replaceChildren(); done(); }
  };
  frame = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(frame); layer.replaceChildren(); };
};

const sprite = (el, opts) => {
  const node = document.createElement('i');
  node.className = 'bandbar-morph__line';
  node.style.background = lineColour(el);
  return { el: node, delay: 0, duration: MORPH_MS, lift: 0, o0: 0.9, o1: 0.9, ...opts };
};

/**
 * A fogged-glass bar pinned to the top while you read the record. It shows only the band you are in,
 * as a row of ticks with the card you are reading lit. Tapping a tick jumps to its card.
 */
const BandBar = ({ category, title, lightMode = false }) => {
  const band = bandForSection(category);
  const [trackRef, width] = useWidth();
  const [peek, setPeek] = useState(null); // tick under the pointer or keyboard focus
  const [lastBand, setLastBand] = useState(null);
  const navRef = useRef(null);

  // Moving from one band to the next, the old band drifts out while the new one's ticks rise in, so keep
  // the old one (and the label it showed) for the length of that hand-over
  const [leaving, setLeaving] = useState(null);
  const lastLabelRef = useRef('');
  const shownRef = useRef(false);

  // Keep the last band's content on screen while the bar fades out
  if (band && band !== lastBand) {
    if (lastBand && shownRef.current) {
      const dir = spectrumBands.indexOf(band) > spectrumBands.indexOf(lastBand) ? 1 : -1;
      setLeaving({ band: lastBand, label: lastLabelRef.current, dir });
    }
    setLastBand(band);
  }
  const shown = band || lastBand;
  const visible = Boolean(band);
  shownRef.current = visible;

  useEffect(() => {
    if (!leaving) return undefined;
    const timer = setTimeout(() => setLeaving(null), 760); // the longest tick-in in BandBar.css, plus a frame
    return () => clearTimeout(timer);
  }, [leaving]);

  const placed = useMemo(() => (shown ? layout(shown.items, width) : []), [shown, width]);

  const morphRef = useRef(null);
  const [morphing, setMorphing] = useState(false);
  const wasVisible = useRef(visible);

  useLayoutEffect(() => {
    const before = wasVisible.current;
    wasVisible.current = visible;
    if (before === visible || !shown) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const layer = morphRef.current;
    const track = trackRef.current;
    const strip = document.querySelector('.spectro');
    const stripLines = strip ? Array.from(strip.querySelectorAll('.spectro__line[data-band]')) : [];
    if (!layer || !track || !stripLines.length) return undefined;
    // A jump from far down the page (a link, a restored scroll) has nothing on screen to morph from
    const stage = strip.querySelector('.spectro__stage').getBoundingClientRect();
    if (stage.bottom < -window.innerHeight || stage.top > window.innerHeight) return undefined;

    const trackRect = track.getBoundingClientRect();
    // The bar's ticks are as tall as the strip's lines, so lines only move and fade on the way, never resize
    const resting = stripLines.find((el) => !el.classList.contains('spectro__line--on')) || stripLines[0];
    const lineH = centre(resting).h;
    const barSpots = new Map(layout(shown.items, trackRect.width).map((p) => [p.item.title, {
      x: trackRect.left + p.x,
      y: trackRect.top + trackRect.height / 2,
      h: lineH,
      o: isCurrentCard(p.item, title) ? 1 : 0.45
    }]));
    // Selected work's lines come from several bands
    const ours = stripLines.filter((el) => (shown.key === 'selected' || el.dataset.band === shown.key) && barSpots.has(el.dataset.title))
      .sort((a, b) => centre(a).x - centre(b).x);

    const sprites = [];
    if (visible) {
      // Into the bar: the band's lines lift off the strip and spread across the bar
      ours.forEach((el, i) => {
        const from = centre(el);
        const to = barSpots.get(el.dataset.title);
        sprites.push(sprite(el, { from: () => from, to: () => to, o1: to.o, delay: i * 9, lift: 14 }));
      });
      stripLines.forEach((el) => {
        if (ours.includes(el)) return;
        const from = centre(el);
        sprites.push(sprite(el, { from: () => from, to: () => from, o1: 0, duration: 300, delay: (from.x % 7) * 12 }));
      });
    } else {
      // Back to the strip: the bar's ticks fly home, and the other bands grow back in around them
      const ticks = new Map(Array.from(track.querySelectorAll('.bandbar__line[data-title]')).map((el) => [el.dataset.title, centre(el)]));
      ours.forEach((el, i) => {
        const from = ticks.get(el.dataset.title) || barSpots.get(el.dataset.title);
        sprites.push(sprite(el, { from: () => from, to: () => centre(el), o0: 0.5, delay: i * 9, lift: -10 }));
      });
      stripLines.forEach((el) => {
        if (ours.includes(el)) return;
        sprites.push(sprite(el, { from: () => centre(el), to: () => centre(el), o0: 0, delay: 200 + (centre(el).x % 7) * 14, duration: 360 }));
      });
    }

    setMorphing(true);
    strip.classList.add('is-morphing');
    const stop = runMorph(layer, sprites, () => {
      setMorphing(false);
      strip.classList.remove('is-morphing');
    });
    return () => { stop(); setMorphing(false); strip.classList.remove('is-morphing'); };
    // Only a change of visibility starts a morph; the rest is read when it starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // The round buttons step aside while the bar is up, so the bar can span the whole card column below it
  const [column, setColumn] = useState(null);
  useEffect(() => {
    const measure = () => {
      const items = document.querySelector('.timeline__items');
      if (!items) return;
      const r = items.getBoundingClientRect();
      setColumn((prev) => (prev && prev.left === r.left && prev.width === r.width ? prev : { left: r.left, width: r.width }));
    };
    measure();
    const items = document.querySelector('.timeline__items');
    const observer = typeof ResizeObserver !== 'undefined' && items ? new ResizeObserver(measure) : null;
    if (observer) observer.observe(items);
    window.addEventListener('resize', measure);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [visible]);

  // Fade content out as it approaches the bar, so cards never run under it
  useEffect(() => {
    if (!visible) return undefined;
    const scroller = document.querySelector('.main-content-scroll');
    const nav = navRef.current;
    if (!scroller || !nav) return undefined;

    const ramp = window.innerWidth <= 1024 ? 44 : 56;
    let frame = 0;
    let touched = new Set();

    const apply = () => {
      frame = 0;
      const cutoff = nav.getBoundingClientRect().bottom + 6;
      const els = Array.from(scroller.querySelectorAll(FADE_SELECTOR));
      const rects = els.map((el) => el.getBoundingClientRect()); // read everything before writing
      const next = new Set();
      els.forEach((el, i) => {
        const r = rects[i];
        if (r.bottom > 0 && r.top < cutoff + ramp) {
          el.style.setProperty('--fade-cut', `${cutoff - r.top}px`);
          el.style.setProperty('--fade-ramp', `${ramp}px`);
          el.classList.add('is-top-fading');
          next.add(el);
        }
      });
      touched.forEach((el) => { if (!next.has(el)) clearFade(el); });
      touched = next;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(apply); };

    apply();
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Opening or closing a card moves everything below it without a scroll, so a change in the content's
    // size re-measures too; otherwise cards that moved down keep the fade they had near the bar
    const resized = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (resized) Array.from(scroller.children).forEach((child) => resized.observe(child));
    return () => {
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (resized) resized.disconnect();
      if (frame) cancelAnimationFrame(frame);
      touched.forEach(clearFade);
    };
  }, [visible]);

  if (!shown) return <div ref={morphRef} className="bandbar-morph" aria-hidden="true" />;

  const isCurrent = (item) => isCurrentCard(item, title);
  const nearest = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return placed.reduce((best, p) => (Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best), placed[0]);
  };

  const step = (delta) => {
    const index = peek ? placed.findIndex((p) => p.item === peek.item) : -1;
    const next = Math.min(placed.length - 1, Math.max(0, (index === -1 ? (delta > 0 ? -1 : placed.length) : index) + delta));
    setPeek(placed[next]);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'Enter' || e.key === ' ') {
      if (peek) { e.preventDefault(); scrollToCard(peek.item.card, shown.key === 'selected'); }
    } else if (e.key === 'Escape') setPeek(null);
  };

  // Selected work names its picks as its tiles do
  const named = (card, fallback) => (shown.key === 'selected' && featuredName(card)) || fallback;
  const label = peek ? named(peek.item.card, peek.item.title) : named(title, title) || '';
  lastLabelRef.current = label;
  const leavingPlaced = leaving ? layout(leaving.band.items, width) : [];

  return (
    <>
    <div ref={morphRef} className="bandbar-morph" aria-hidden="true" />
    <div className={`bandbar-veil ${visible ? 'is-visible' : ''} ${lightMode ? 'bandbar-veil--light' : 'bandbar-veil--dark'}`} aria-hidden="true" />
    <nav
      ref={navRef}
      className={`bandbar ${visible ? 'is-visible' : ''}${morphing ? ' is-morphing' : ''} ${lightMode ? 'bandbar--light' : 'bandbar--dark'}`}
      aria-label="Where you are in the portfolio"
      aria-hidden={!visible}
      style={column ? { left: `${column.left}px`, width: `${column.width}px`, transform: 'none' } : undefined}
    >
      <div className="bandbar__stack" style={{ '--dir': leaving ? leaving.dir : 1 }}>
      {leaving && (
        <div className="bandbar__inner is-leaving" key={`out-${leaving.band.key}`} style={{ '--hue': leaving.band.hue }} aria-hidden="true">
          <div className="bandbar__top">
            <span className="bandbar__name">{leaving.band.name}</span>
            <span className="bandbar__label">{leaving.label}</span>
          </div>
          <div className="bandbar__track">
            {leavingPlaced.map((p) => (
              <i key={p.item.title} className={`bandbar__line${p.item.future ? ' is-future' : ''}`} style={{ left: `${p.x}px` }} />
            ))}
          </div>
        </div>
      )}
      <div className={`bandbar__inner${leaving ? ' is-entering' : ''}`} key={shown.key} style={{ '--hue': shown.hue, '--step': `${Math.min(9, 220 / Math.max(1, placed.length))}ms` }}>
        <div className="bandbar__top">
          <button
            type="button"
            className="bandbar__name"
            onClick={() => document.querySelector('.main-content-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Back to the top"
            tabIndex={visible ? 0 : -1}
          >
            {shown.name}
          </button>
          <span className="bandbar__label" aria-live="polite">{label}</span>
        </div>

        <div
          ref={trackRef}
          className="bandbar__track"
          role="group"
          tabIndex={visible ? 0 : -1}
          aria-label={`${shown.name}: use left and right arrow keys, then Enter to jump to an item`}
          onPointerMove={(e) => setPeek(nearest(e.clientX))}
          onPointerDown={(e) => setPeek(nearest(e.clientX))}
          onPointerLeave={() => setPeek(null)}
          onClick={(e) => scrollToCard(nearest(e.clientX).item.card, shown.key === 'selected')}
          onKeyDown={onKeyDown}
        >
          {placed.map((p, i) => (
            <i
              key={p.item.title}
              data-title={p.item.title}
              className={`bandbar__line${isCurrent(p.item) ? ' is-current' : ''}${peek && peek.item === p.item ? ' is-peek' : ''}${p.item.future ? ' is-future' : ''}`}
              style={{ left: `${p.x}px`, '--i': i, ...(p.item.hue ? { '--hue': p.item.hue } : {}) }}
            />
          ))}
        </div>
      </div>
      </div>
    </nav>
    </>
  );
};

export default BandBar;
