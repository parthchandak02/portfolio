import { useEffect, useMemo, useRef, useState } from 'react';
import { spectrumBands } from '../data/spectrum';
import { warp } from './Spectrograph';
import { reducedMotion } from '../hooks/glassMotion';
import { glassNotes, glassPad } from '../hooks/glassSound';
import SelectedMark from './SelectedMark';
import './FeatureCards.css';

// Calls back once, the first time most of the card is on screen. Each moment plays only then, once per visit.
const useFirstSight = (ref, onSight) => {
  const fn = useRef(onSight);
  fn.current = onSight;
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      fn.current();
    }, { threshold: 0.55 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
};

const SWATCHES = [
  { name: 'Blue', hue: '#6a8cff', notes: [[659, 0], [880, 0.26], [988, 0.52]] },
  { name: 'Pink', hue: '#ff6b9d', notes: [[880, 0], [740, 0.26], [988, 0.52]] },
  { name: 'Teal', hue: '#35d6c0', notes: [[587, 0], [740, 0.26], [880, 0.52]] },
  { name: 'Amber', hue: '#ffb02e', notes: [[784, 0], [988, 0.26], [1175, 0.52]] }
];
const PULSE = [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0.3, offset: 0.4 }, { opacity: 1, offset: 0.6 }, { opacity: 0.3, offset: 0.8 }, { opacity: 1 }];

// Find My Zoox: the glass calls out once with a light and three notes of its own. Each colour has its own notes,
// the way each rider's car would. Abstract on purpose: it is not the vehicle's real light pattern.
const LightMoment = ({ card }) => {
  const [hue, setHue] = useState(SWATCHES[0]);
  const glow = useRef(null);
  const call = (swatch) => {
    glassNotes(swatch.notes, { gain: 0.035, decay: 0.8 });
    if (reducedMotion()) return;
    glow.current?.animate(PULSE, { duration: 1500, easing: 'ease-in-out' });
  };
  useFirstSight(card, () => call(SWATCHES[0]));
  return (
    <>
      <span ref={glow} className="fcard__glow" style={{ '--light': hue.hue }} aria-hidden="true" />
      <div className="fcard__swatches" role="group" aria-label="Try a color">
        {SWATCHES.map((s) => (
          <button
            key={s.name}
            type="button"
            className="fcard__swatch"
            style={{ '--swatch': s.hue }}
            aria-label={s.name}
            aria-pressed={hue === s}
            onClick={() => { setHue(s); call(s); }}
          />
        ))}
      </div>
    </>
  );
};

// Centi-seed: the 3D robot walks in on its own canvas, loaded only when the card is about to show
const RobotMoment = ({ card, lightMode }) => {
  const canvas = useRef(null);
  const robot = useRef(null);
  const light = useRef(lightMode);
  light.current = lightMode;
  const seen = useRef(false);
  const start = () => { if (reducedMotion()) robot.current?.rest(); else robot.current?.walkIn(); };

  useEffect(() => {
    const el = canvas.current;
    let live = true;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      import('./centiSeedRobot').then(({ createCentiSeed }) => {
        if (!live) return;
        try { robot.current = createCentiSeed(el, { lightMode: light.current }); }
        catch { return; } // no WebGL: the card still reads without it
        el.dataset.ready = '';
        if (seen.current) start();
      });
    }, { rootMargin: '400px 0px' });
    io.observe(el);
    return () => { live = false; io.disconnect(); robot.current?.dispose(); robot.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { robot.current?.setLightMode(lightMode); }, [lightMode]);
  useFirstSight(card, () => { seen.current = true; start(); });

  useEffect(() => {
    const el = card.current;
    const move = (e) => {
      if (!robot.current || e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      robot.current.follow((e.clientX - r.left) / r.width);
    };
    const tap = (e) => {
      if (!robot.current) return;
      const r = el.getBoundingClientRect();
      robot.current.follow((e.clientX - r.left) / r.width);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerdown', tap);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerdown', tap); };
  }, [card]);

  return <canvas ref={canvas} className="fcard__robot" aria-hidden="true" />;
};

// The audio patent: music, and sounds that matter more. The more one matters, the further the music steps back,
// which is what the application describes; the percentages here are for illustration.
const DUCK = { none: 1, nav: 0.45, urgent: 0.12 };
const AudioMoment = ({ card, lightMode }) => {
  const canvas = useRef(null);
  const state = useRef({ mode: 'none', music: 1, other: 0 });
  const pad = useRef(null);
  const timers = useRef([]);
  const frame = useRef(0);
  const [mode, setMode] = useState('none');
  const dark = useRef(!lightMode);
  dark.current = !lightMode;

  const draw = (t) => {
    const cv = canvas.current;
    if (!cv) return;
    const s = state.current;
    s.music += (DUCK[s.mode] - s.music) * 0.11;
    s.other += ((s.mode === 'none' ? 0 : 1) - s.other) * 0.13;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    if (cv.width !== Math.round(w * ratio) || cv.height !== Math.round(h * ratio)) { cv.width = Math.round(w * ratio); cv.height = Math.round(h * ratio); }
    const x = cv.getContext('2d');
    x.setTransform(ratio, 0, 0, ratio, 0, 0);
    x.clearRect(0, 0, w, h);
    const n = Math.floor(w / 7);
    const mid = h / 2;
    const ink = dark.current ? 'rgba(255,255,255,0.72)' : 'rgba(20,20,24,0.62)';
    for (let i = 0; i < n; i += 1) {
      const px = ((i + 0.5) * w) / n;
      const wave = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.42 + t / 620) * Math.sin(i * 0.13 - t / 900));
      const a = wave * s.music * mid * 0.72;
      x.fillStyle = ink;
      x.fillRect(px - 1, mid - a, 2, a * 2);
      if (s.other > 0.02) {
        const b = s.other * (0.4 + 0.6 * Math.abs(Math.sin(i * 1.3 + t / 150))) * mid * 0.9 * Math.max(0, 1 - Math.abs(i - n * 0.5) / (n * 0.3));
        x.fillStyle = '#ff5a52';
        x.fillRect(px + 1.5, mid - b, 2, b * 2);
      }
    }
  };

  // It only draws while something is changing
  const run = (until) => {
    cancelAnimationFrame(frame.current);
    const tick = (t) => {
      draw(t);
      frame.current = t < until ? requestAnimationFrame(tick) : 0;
    };
    frame.current = requestAnimationFrame(tick);
  };
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const set = (m) => {
    state.current.mode = m;
    setMode(m);
    pad.current?.setLevel(DUCK[m]);
  };
  const hear = (m) => {
    clear();
    if (!pad.current) pad.current = glassPad();
    set(m);
    if (m === 'nav') glassNotes([[880, 0], [1109, 0.2]], { gain: 0.06, decay: 0.8 });
    if (m === 'urgent') glassNotes([[1319, 0], [1319, 0.22], [1319, 0.44]], { gain: 0.07, decay: 0.4, from: 1 });
    run(performance.now() + 4200);
    timers.current.push(setTimeout(() => set('none'), 2000));
    timers.current.push(setTimeout(() => { pad.current?.stop(); pad.current = null; }, 3400));
  };

  // First sight plays it silently, so the idea shows even without a press
  useFirstSight(card, () => {
    if (reducedMotion()) return;
    timers.current.push(setTimeout(() => set('nav'), 700));
    timers.current.push(setTimeout(() => set('urgent'), 2500));
    timers.current.push(setTimeout(() => set('none'), 4300));
    run(performance.now() + 5600);
  });
  useEffect(() => { requestAnimationFrame(draw); }, [lightMode]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { clear(); cancelAnimationFrame(frame.current); pad.current?.stop(); }, []);

  return (
    <div className="fcard__audio">
      <canvas ref={canvas} className="fcard__wave" aria-hidden="true" />
      <div className="fcard__audio-row">
        <span className="fcard__level" aria-live="polite">
          {mode === 'none' ? 'Music at full volume' : mode === 'nav' ? 'Navigation prompt: music steps back' : 'Urgent alert: music almost silent'}
        </span>
        <span className="fcard__actions">
          <button type="button" className="fcard__action" onClick={() => hear('nav')}>Navigation prompt</button>
          <button type="button" className="fcard__action" onClick={() => hear('urgent')}>Urgent alert</button>
        </span>
      </div>
    </div>
  );
};

// CALarm: a pill opens into the app's flip clock, counts down, rings once, then keeps the visitor's own time
const clockNow = () => {
  const d = new Date();
  return [(d.getHours() % 12 || 12).toString(), String(d.getMinutes()).padStart(2, '0')];
};
const AlarmMoment = ({ card }) => {
  const [digits, setDigits] = useState(clockNow);
  const [phase, setPhase] = useState('rest');
  const timers = useRef([]);
  useFirstSight(card, () => {
    if (reducedMotion()) return;
    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    setPhase('pill');
    setDigits(['0', '03']);
    at(800, () => setPhase('open'));
    at(1500, () => setDigits(['0', '02']));
    at(2200, () => setDigits(['0', '01']));
    at(2900, () => { setDigits(['0', '00']); setPhase('ring'); glassNotes([[1319, 0], [1568, 0.12]], { gain: 0.04, decay: 0.4, from: 1 }); });
    at(4300, () => { setPhase('rest'); setDigits(clockNow()); });
  });
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => { if (p === 'rest') setDigits(clockNow()); return p; }), 20000);
    const list = timers.current;
    return () => { clearInterval(t); list.forEach(clearTimeout); };
  }, []);
  const [h, m] = digits;
  return (
    <span className={`fcard__clock is-${phase}`} aria-hidden="true">
      <span className="fcard__flip">{h}</span>
      <i>:</i>
      <span className="fcard__flip">{m[0]}</span>
      <span className="fcard__flip">{m[1]}</span>
    </span>
  );
};

/**
 * One of Selected work's large cards: the same glass as every tile, and the same details below it (see TileGrid),
 * with one small thing happening inside. The card itself stays still; only that one thing moves, once.
 */
const FeatureCard = ({ feature, lightMode, open, onOpen }) => {
  const card = useRef(null);
  const { moment } = feature;
  return (
    <div ref={card} className={`lab-tile fcard fcard--${moment}${open ? ' is-open' : ''}`}>
      {moment === 'robot' && <RobotMoment card={card} lightMode={lightMode} />}
      {moment === 'light' && <LightMoment card={card} />}
      <button
        type="button"
        className="fcard__open"
        onClick={onOpen}
        aria-expanded={open}
        aria-label={`${feature.name}, ${feature.kind}. ${open ? 'Close' : 'Show'} the details`}
      />
      <div className="fcard__text">
        <span className="fcard__kind">{feature.kind}</span>
        <h3 className="fcard__name">{feature.name}</h3>
        <p className="fcard__line">{feature.line}</p>
      </div>
      {moment === 'audio' && <AudioMoment card={card} lightMode={lightMode} />}
      {moment === 'alarm' && <AlarmMoment card={card} />}
    </div>
  );
};

// After the last card, the eight bands of the strip open up, and each one goes to its part of the portfolio
export const PortfolioDoor = ({ lightMode }) => {
  const door = useRef(null);
  const [on, setOn] = useState(false);
  useFirstSight(door, () => setOn(true));
  const lanes = useMemo(() => spectrumBands.map((band) => ({ band, ticks: band.items.map((i) => warp(i.t)) })), []);
  const go = (e, band) => {
    e.preventDefault();
    const target = document.getElementById(band.section);
    if (!target) return;
    // Its top lands just under the band bar
    target.closest('.main-content-scroll')?.scrollBy({ top: target.getBoundingClientRect().top - 96, behavior: reducedMotion() ? 'auto' : 'smooth' });
  };
  return (
    <nav ref={door} id="portfolio" className={`fdoor ${lightMode ? 'fdoor--light' : 'fdoor--dark'}${on ? ' is-on' : ''}`} aria-label="The full portfolio">
      <h2 className="fdoor__title"><SelectedMark on className="timeline__selected-mark" />The full portfolio</h2>
      {lanes.map(({ band, ticks }, i) => (
        <a key={band.key} className="fdoor__lane" href={`#${band.section}`} style={{ '--hue': band.hue, '--lane': i }} onClick={(e) => go(e, band)}>
          <span className="fdoor__name">{band.name}</span>
          <span className="fdoor__track" aria-hidden="true">
            {ticks.map((t, j) => <i key={j} style={{ left: `${t * 100}%`, '--j': (j * 37) % 90 }} />)}
          </span>
        </a>
      ))}
    </nav>
  );
};

export default FeatureCard;
