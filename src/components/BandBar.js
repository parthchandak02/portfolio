import { useEffect, useMemo, useRef, useState } from 'react';
import { bandForSection } from '../data/spectrum';
import { timelineDataByCategory } from '../data/timelineData';
import { useWidth } from './Spectrograph';
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

// The Lab is one block on the page, so its projects all jump to that block
const elementFor = (card) => {
  const key = LAB_TITLES.has(card) ? 'Lab' : card;
  return document.querySelector(`.timeline__item[data-title="${CSS.escape(key)}"]`);
};

const scrollToCard = (card) => {
  const target = elementFor(card);
  const scroller = document.querySelector('.main-content-scroll');
  if (!target || !scroller) return;
  const top = scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 96;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
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

  // Keep the last band's content on screen while the bar fades out
  if (band && band !== lastBand) setLastBand(band);
  const shown = band || lastBand;
  const visible = Boolean(band);

  const placed = useMemo(() => (shown ? layout(shown.items, width) : []), [shown, width]);

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
    return () => {
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
      touched.forEach(clearFade);
    };
  }, [visible]);

  if (!shown) return null;

  const isCurrent = (item) => item.card === title || (title === 'Lab' && LAB_TITLES.has(item.card));
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
      if (peek) { e.preventDefault(); scrollToCard(peek.item.card); }
    } else if (e.key === 'Escape') setPeek(null);
  };

  const label = peek ? peek.item.title : title || '';

  return (
    <>
    <div className={`bandbar-veil ${visible ? 'is-visible' : ''} ${lightMode ? 'bandbar-veil--light' : 'bandbar-veil--dark'}`} aria-hidden="true" />
    <nav
      ref={navRef}
      className={`bandbar ${visible ? 'is-visible' : ''} ${lightMode ? 'bandbar--light' : 'bandbar--dark'}`}
      aria-label="Where you are in the record"
      aria-hidden={!visible}
    >
      <div className="bandbar__inner" key={shown.key} style={{ '--hue': shown.hue }}>
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
          onClick={(e) => scrollToCard(nearest(e.clientX).item.card)}
          onKeyDown={onKeyDown}
        >
          {placed.map((p) => (
            <i
              key={p.item.title}
              className={`bandbar__line${isCurrent(p.item) ? ' is-current' : ''}${peek && peek.item === p.item ? ' is-peek' : ''}${p.item.future ? ' is-future' : ''}`}
              style={{ left: `${p.x}px` }}
            />
          ))}
        </div>
      </div>
    </nav>
    </>
  );
};

export default BandBar;
