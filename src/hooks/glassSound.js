// Soft glass sounds for cards opening, switching and closing, made in the browser (no files to load): each is a
// few sine partials at a struck glass's uneven ratios, sliding a little in pitch like something liquid settling,
// and ringing out. They stay quiet, play only once the reader has clicked or pressed a key on the page, and
// cards that close and open in the same moment (moving to another card) sound once, as a switch.

let ctx = null;
const context = () => {
  if (ctx) return ctx;
  const C = window.AudioContext || window.webkitAudioContext;
  ctx = C ? new C() : null;
  return ctx;
};

// One note: `freq` reached from `from` times it, partials ringing out over `decay` seconds, the higher sooner
const note = (c, at, freq, { gain, decay, from = 1 }) => {
  const out = c.createGain();
  const soft = c.createBiquadFilter();
  soft.type = 'lowpass';
  soft.frequency.value = 4200;
  out.connect(soft).connect(c.destination);
  [[1, 1], [2.76, 0.32], [5.4, 0.1]].forEach(([ratio, level], i) => {
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * ratio * from, at);
    osc.frequency.exponentialRampToValueAtTime(freq * ratio, at + 0.09);
    const end = at + decay / (1 + i * 0.8);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(gain * level, at + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(env).connect(out);
    osc.start(at);
    osc.stop(end + 0.05);
  });
};

const SOUNDS = {
  // A clear note that lifts into place, and a fainter one above it
  open: (c, t) => { note(c, t, 784, { gain: 0.05, decay: 0.9, from: 0.86 }); note(c, t + 0.07, 1175, { gain: 0.022, decay: 0.7, from: 0.92 }); },
  // One quick note, between the two
  switch: (c, t) => note(c, t, 988, { gain: 0.035, decay: 0.55, from: 0.9 }),
  // Lower and softer, settling down
  close: (c, t) => note(c, t, 587, { gain: 0.035, decay: 0.6, from: 1.12 }),
};

// The reader can turn them off (see SoundToggle), and the choice stays for their next visit
const MUTED_KEY = 'pc-muted';
let muted = (() => { try { return localStorage.getItem(MUTED_KEY) === '1'; } catch { return false; } })();
export const isMuted = () => muted;
export const setMuted = (m) => {
  muted = m;
  try { localStorage.setItem(MUTED_KEY, m ? '1' : '0'); } catch { /* kept for this visit only */ }
};

let pending = null;
export const glassSound = (kind) => {
  if (typeof window === 'undefined' || document.hidden || muted) return;
  if (!navigator.userActivation?.hasBeenActive && navigator.userActivation) return;
  // Gather what happens in the same moment, then sound it once
  if (pending) { pending.add(kind); return; }
  pending = new Set([kind]);
  setTimeout(() => {
    const kinds = pending;
    pending = null;
    const which = kinds.has('switch') || (kinds.has('open') && kinds.has('close')) ? 'switch' : kinds.has('open') ? 'open' : 'close';
    const c = context();
    if (!c) return;
    const play = () => SOUNDS[which](c, c.currentTime + 0.01);
    if (c.state === 'running') play();
    else c.resume().then(play, () => {});
  }, 30);
};
