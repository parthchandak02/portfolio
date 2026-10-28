import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { onPrismGlow } from '../hooks/prismGlow';
import { isPhone } from '../hooks/quality';
import { modeShift, shiftTime, wipeAt, SHATTER, VORTEX, CENTRE, smooth, easeInOut3, easeOutBack } from '../hooks/modeShift';

// Light mode's scene. The prism's beam is light added to black, which a white page can't show, so here the
// light-splitting object is the soap bubble: nearly invisible, seen by the room reflected in its skin and
// coloured by thin-film interference. They follow the prism's rules: in the playground, or with the lock
// open, they drift from the pointer; in the playground a tap pops one. The band you are reading tints them,
// as it lights its colour in the dark mode's rainbow.

const vertexShader = `
  uniform float uTime; uniform float uSeed;
  varying vec3 vN; varying vec3 vV; varying vec3 vObj; varying float vUp;
  void main() {
    vec3 p = position;
    // The skin never quite holds still
    float w = sin(p.x * 2.2 + uTime * 1.6 + uSeed) * sin(p.y * 2.0 + uTime * 1.25) * sin(p.z * 1.8 + uTime * 1.05 + uSeed * 0.7);
    p += normal * w * 0.035;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = cameraPosition - wp.xyz;
    vObj = normal; vUp = normal.y;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;

const fragmentShader = `
  uniform float uTime; uniform float uSeed;
  uniform vec3 uTint; uniform float uTintAmt; uniform float uGlow;
  uniform float uPop; uniform vec3 uRupture;
  varying vec3 vN; varying vec3 vV; varying vec3 vObj; varying float vUp;
  // The film's thickness: broad, slow swirls in 3D, so there is no seam anywhere on the sphere
  float swirl(vec3 q, float t) {
    q += 0.35 * vec3(sin(q.y * 2.1 + t * 0.5), sin(q.z * 1.9 + t * 0.4), sin(q.x * 2.3 + t * 0.45));
    return 0.5 + 0.22 * sin(q.x * 2.4 + q.y * 1.3 + t * 0.3) + 0.18 * sin(q.y * 2.0 - q.z * 1.7 + t * 0.22) + 0.1 * sin(q.z * 3.1 + q.x * 0.8 - t * 0.35);
  }
  // A white studio: bright overhead, a soft grey horizon, a darker floor and two softboxes
  vec3 env(vec3 r) {
    vec3 c = mix(vec3(0.32, 0.33, 0.37), vec3(0.97, 0.97, 0.99), smoothstep(-0.45, 0.55, r.y));
    c += vec3(1.25) * smoothstep(0.86, 0.95, dot(r, normalize(vec3(-0.6, 0.65, 0.45))));
    c += vec3(0.85) * smoothstep(0.9, 0.97, dot(r, normalize(vec3(0.75, 0.25, 0.55))));
    return c;
  }
  void main() {
    vec3 o = normalize(vObj);
    // Bursting: the film tears open at the rupture point and the hole races round the sphere. Its edge is
    // ragged, and the retreating rim, where the torn film gathers, is thicker and brighter.
    float rim = 0.0;
    if (uPop > 0.0) {
      float ang = acos(clamp(dot(o, uRupture), -1.0, 1.0));
      float ragged = 0.07 * sin(o.x * 17.0 + uSeed) * sin(o.y * 13.0 - uSeed) + 0.05 * sin(o.z * 23.0 + uSeed * 2.0);
      float hole = uPop * 3.3 + ragged * uPop;
      if (ang < hole) discard;
      rim = 1.0 - smoothstep(0.0, 0.16, ang - hole);
    }
    vec3 n = normalize(vN); vec3 v = normalize(vV);
    if (!gl_FrontFacing) n = -n;
    float cosi = clamp(dot(n, v), 0.0, 1.0);
    float fres = 0.02 + 0.98 * pow(1.0 - cosi, 5.0);
    // Thin-film interference: the film drains, so it is thinner at the top
    float th = clamp(swirl(o * 1.4 + uSeed, uTime), 0.0, 1.0);
    float d = mix(160.0, 860.0, th) * (0.7 + 0.5 * (0.5 - 0.5 * vUp));
    float sint = sqrt(max(0.0, 1.0 - cosi * cosi)) / 1.33; float cost = sqrt(1.0 - sint * sint);
    vec3 film = 0.5 - 0.5 * cos(12.566 * 1.33 * d * cost / vec3(650.0, 510.0, 470.0));
    // The band being read leans the film toward its colour
    film = mix(film, film * uTint * 1.25 + uTint * 0.2, uTintAmt * 0.55);
    vec3 refl = env(reflect(-v, n)) * (0.25 + 1.5 * film) * (1.0 + 0.6 * uGlow + 0.5 * rim);
    float a = clamp(fres * 1.1 + 0.025 + 0.12 * max(max(film.r, film.g), film.b) * (0.15 + fres) + 0.12 * uGlow + 0.55 * rim, 0.0, 0.92);
    // The scene is composited in linear light and converted for the screen at the end, so the colour is
    // given in linear terms; written as is, it came out washed out
    gl_FragColor = vec4(pow(max(refl, 0.0), vec3(2.2)), a);
  }`;

// The droplets a burst sheds from its retreating rim
const dropVert = `
  attribute float aLife; attribute float aSize; attribute vec3 aColor;
  uniform float uDpr;
  varying float vLife; varying vec3 vColor; varying vec2 vW;
  void main() {
    vLife = aLife; vColor = aColor; vW = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uDpr * (0.6 + 0.4 * aLife);
  }`;
const dropFrag = `
  uniform vec2 uWC; uniform float uWR; uniform float uWDark;
  varying float vLife; varying vec3 vColor; varying vec2 vW;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float r = length(c);
    if (r > 0.5 || vLife <= 0.0) discard;
    // a tiny bead: a darker edge and a bright glint
    float bead = 1.0 - smoothstep(0.32, 0.5, r);
    vec3 col = mix(vColor * 0.75, vec3(1.0), 1.0 - smoothstep(0.0, 0.22, length(c - vec2(-0.12, 0.12))));
    // switching to dark, the page goes dark outside a closing circle, and there a droplet glows instead
    float dark = uWDark * smoothstep(uWR - 0.03, uWR + 0.03, length(vW - uWC));
    col = mix(col, mix(vColor, vec3(1.0), 0.6) * 1.6, dark);
    float a = mix(bead * 0.85, exp(-r * r * 18.0), dark);
    gl_FragColor = vec4(pow(max(col, 0.0), vec3(2.2)), a * vLife);
  }`;

const SMALL = 9; // bubbles rising past the big one
const POP_S = 0.32; // seconds for the hole to sweep the whole bubble
const DROPS = 640; // droplet pool: one big burst sheds about 420, so two can overlap
const PER_FRAME = 24; // most droplets a burst sheds in one frame

// Read once and kept current, rather than asked every frame
const motionQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
let still = Boolean(motionQuery?.matches);
motionQuery?.addEventListener?.('change', (e) => { still = e.matches; });
const reduceMotion = () => still;
// Colours here are written straight into shaders that work in sRGB terms, so they are kept as written
const srgb = (hex) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);
const rand = (a, b) => a + Math.random() * (b - a);
const PASTELS = ['#9fb6ff', '#c3a6ff', '#8fe3d4', '#ffd29a', '#ffb3c7', '#b9c3d1'].map(srgb);

// A burst starting at a point on the bubble's surface, given as a direction on screen from its centre
const burst = (b, m, dir) => {
  dir = dir.clone().normalize().applyQuaternion(m.quaternion.clone().invert());
  b.uniforms.uRupture.value.copy(dir);
  const a = Math.abs(dir.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(dir, a).normalize(); const w = new THREE.Vector3().crossVectors(dir, u);
  b.basis = { dir, u, w };
  b.pop = reduceMotion() ? POP_S : 0.0001;
};

// `active` is false while dark mode is up: they stay mounted, so their shaders are ready for the switch back,
// but are hidden and do no work. Each time light mode comes up they start afresh.
export const Bubbles = ({ interactive = false, canPop = false, viewportPosition, tint = null, shift = null, active = true }) => {
  const { viewport, gl } = useThree();
  const time = useMemo(() => ({ value: 0 }), []);
  const tintColor = useMemo(() => ({ value: srgb('#ffffff') }), []);
  const tintAmt = useMemo(() => ({ value: 0 }), []);
  const glow = useMemo(() => ({ value: 0 }), []);
  const geometry = useMemo(() => (isPhone ? new THREE.SphereGeometry(1, 64, 40) : new THREE.SphereGeometry(1, 96, 64)), []);
  const meshes = useRef([]);

  // One big bubble where the prism stands, and small ones rising past it, sized to the screen
  const bubbles = useMemo(() => Array.from({ length: SMALL + 1 }, (_, i) => {
    const uniforms = {
      uTime: time, uSeed: { value: Math.random() * 10 }, uTint: tintColor, uTintAmt: tintAmt, uGlow: glow,
      uPop: { value: 0 }, uRupture: { value: new THREE.Vector3(0, 0, 1) }
    };
    return {
      big: i === 0, seed: Math.random() * 10, uniforms,
      material: new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
      pos: new THREE.Vector3(), push: new THREE.Vector3(), vel: new THREE.Vector2(), r: 1, speed: 0, grow: 1, pop: 0, basis: null, when: Infinity, gone: false, arrived: false
    };
  }), [time, tintColor, tintAmt, glow]);

  // The droplet pool: positions, velocities, life
  const drops = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(DROPS * 3); const life = new Float32Array(DROPS); const size = new Float32Array(DROPS); const color = new Float32Array(DROPS * 3);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aLife', new THREE.BufferAttribute(life, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
    const material = new THREE.ShaderMaterial({ uniforms: { uDpr: { value: 1 }, uWC: { value: new THREE.Vector2(CENTRE.x, CENTRE.y) }, uWR: { value: 1e4 }, uWDark: { value: 0 } }, vertexShader: dropVert, fragmentShader: dropFrag, transparent: true, depthWrite: false, depthTest: false });
    return { g, material, pos, life, size, color, vel: new Float32Array(DROPS * 3), age: new Float32Array(DROPS), span: new Float32Array(DROPS), next: 0 };
  }, []);
  const emit = (x, y, z, vx, vy, vz, px) => {
    const i = drops.next; drops.next = (drops.next + 1) % DROPS;
    drops.pos.set([x, y, z], i * 3); drops.vel.set([vx, vy, vz], i * 3);
    drops.age[i] = 0; drops.span[i] = rand(0.45, 0.8); drops.life[i] = 1; drops.size[i] = px;
    const c = PASTELS[(Math.random() * PASTELS.length) | 0]; drops.color.set([c.r, c.g, c.b], i * 3);
  };

  const spawn = (b, fromBelow, vw, vh) => {
    const unit = Math.min(vw, vh);
    b.k = b.big ? 0.21 : rand(0.03, 0.085);
    b.r = unit * b.k;
    if (b.big) b.pos.set(vw * 0.06, -vh * 0.04, 0);
    // Rising bubbles come up from below the screen; with motion reduced they could never arrive, so they appear in place
    else b.pos.set(rand(-vw / 2, vw / 2), fromBelow && !reduceMotion() ? -vh / 2 - b.r - rand(0, vh * 0.15) : rand(-vh / 2, vh / 2), rand(-1, 1));
    b.speed = b.big ? 0 : vh * rand(0.025, 0.05);
    b.pop = 0; b.uniforms.uPop.value = 0;
    b.grow = (fromBelow || b.big) && !reduceMotion() ? 0 : 1;
  };
  const placed = useRef(false);
  const departing = useRef(false);
  const root = useRef(null);
  const awake = useRef(active);
  if (!placed.current) {
    bubbles.forEach((b) => { spawn(b, false, viewport.width, viewport.height); b.grow = 1; });
    placed.current = true;
  }

  // The band being read tints the bubbles, easing in and out
  const tintTarget = useRef(null);
  const tintGoal = useMemo(() => srgb('#ffffff'), []);
  useEffect(() => {
    tintTarget.current = tint;
    if (tint) tintGoal.copy(srgb(tint));
  }, [tint, tintGoal]);

  // The page's cues (the first swarm landing, opening the contact card) make them shimmer, as they make the prism glow
  useEffect(() => {
    if (reduceMotion()) return undefined;
    return onPrismGlow(() => { glow.value = 1; });
  }, [glow]);

  // Tapping a bubble in the playground bursts it from the point tapped. The canvas takes no pointer events,
  // so the page's taps are mapped into the scene; the play button's own taps are left alone.
  const view = useRef(viewport);
  view.current = viewport;
  useEffect(() => {
    if (!canPop || !active) return undefined;
    const onDown = (e) => {
      if (e.target.closest?.('.play-mode-toggle')) return;
      const { width: vw, height: vh } = view.current;
      // Mapped against the canvas: it is 100vh, so on a phone it is taller than the window
      const box = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - box.left) / box.width - 0.5) * vw;
      const y = (0.5 - (e.clientY - box.top) / box.height) * vh;
      const hit = bubbles.filter((b) => !b.pop && b.grow > 0.6 && Math.hypot(b.pos.x + b.push.x - x, b.pos.y + b.push.y - y) < b.r).sort((a, b) => a.r - b.r)[0];
      if (!hit) return;
      const m = meshes.current[bubbles.indexOf(hit)];
      // The rupture is where the finger touched the front of the bubble
      const lx = (x - m.position.x) / m.scale.x; const ly = (y - m.position.y) / m.scale.y;
      burst(hit, m, new THREE.Vector3(lx, ly, Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly))));
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [canPop, active, bubbles, gl]);

  const tmp = useMemo(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3() }), []);

  // Light mode can be left and re-entered many times; each time the bubbles' buffers and programs are freed
  useEffect(() => () => {
    geometry.dispose();
    bubbles.forEach((b) => b.material.dispose());
    drops.g.dispose();
    drops.material.dispose();
  }, [geometry, bubbles, drops]);

  useFrame((_, delta) => {
    if (root.current) root.current.visible = active;
    if (!active) { awake.current = false; return; }
    if (!awake.current) {
      awake.current = true;
      departing.current = false;
      bubbles.forEach((b) => {
        spawn(b, false, viewport.width, viewport.height);
        Object.assign(b, { grow: 1, gone: false, arrived: false, when: Infinity, basis: null });
        b.push.set(0, 0, 0);
      });
      drops.life.fill(0);
    }
    const dt = Math.min(delta, 0.05);
    const still = reduceMotion();
    const { width: vw, height: vh } = viewport;
    time.value += still ? 0 : dt;
    glow.value *= Math.exp(-dt * 2.2);
    if (tintTarget.current) tintColor.value.lerp(tintGoal, 0.06);
    tintAmt.value += ((tintTarget.current ? 1 : 0) - tintAmt.value) * 0.05;
    // In the portfolio they rise slowly, in the playground at full pace
    const pace = still ? 0 : canPop ? 1 : 0.45;
    drops.material.uniforms.uDpr.value = gl.getPixelRatio();
    const unit = Math.min(vw, vh);
    const px = (viewportPosition?.x ?? 9) * vw / 2;
    const py = (viewportPosition?.y ?? 9) * vh / 2;
    // Switching modes (see hooks/modeShift)
    const st = shift ? shiftTime() : 0;
    const wipe = shift === 'vortex' ? wipeAt('vortex', st) : null;
    drops.material.uniforms.uWDark.value = wipe ? 1 : 0;
    drops.material.uniforms.uWR.value = wipe ? wipe.r : 1e4;
    // Leaving for dark: they burst from the outside in, the big one last
    if (shift === 'vortex' && !departing.current) {
      departing.current = true;
      const d = (b) => Math.hypot(b.pos.x + b.push.x - CENTRE.x, b.pos.y + b.push.y - CENTRE.y);
      const far = Math.max(1e-3, ...bubbles.map(d));
      bubbles.forEach((b) => { b.when = b.big ? 0.5 : 0.04 + 0.4 * (1 - d(b) / far); });
    }
    bubbles.forEach((b, i) => {
      const m = meshes.current[i];
      b.r = unit * b.k; // follows the window as it is resized
      // Arriving from the shattered prism: the big one swells out of its core, the small ones grow from shards
      if (shift === 'shatter') {
        let shown = false;
        if (b.big) {
          const k = (st - SHATTER.BREAK - 0.12) / 0.95;
          if (k > 0) {
            const e = easeInOut3(k);
            const rx = vw * 0.06 + Math.sin(time.value * 0.31) * vw * 0.01; const ry = -vh * 0.04 + Math.sin(time.value * 0.5) * vh * 0.012;
            b.pos.set(CENTRE.x + (rx - CENTRE.x) * e, CENTRE.y + (ry - CENTRE.y) * e, 0);
            b.s = b.r * easeOutBack(k); shown = true;
          }
        } else {
          const sp = modeShift.spawns[i - 1];
          if (sp && st >= sp.when) {
            if (!b.arrived) { b.arrived = true; b.pos.set(sp.x, sp.y, b.pos.z); b.vel.set(sp.vx, sp.vy); }
            b.vel.multiplyScalar(Math.exp(-dt * 2.5));
            b.pos.x += b.vel.x * dt; b.pos.y += b.vel.y * dt;
            b.s = b.r * easeOutBack((st - sp.when) / 0.55); shown = true;
          }
        }
        if (m) {
          m.visible = shown;
          m.position.copy(b.pos); m.scale.setScalar(Math.max(b.s || 0, 0.0001));
          m.rotation.y += dt * 0.08; m.rotation.x += dt * 0.03;
        }
        return;
      }
      if (b.gone) { if (m) m.visible = false; return; }
      if (m) m.visible = true;
      if (shift === 'vortex' && !b.pop && st >= b.when && m) {
        // burst on the side facing the centre, so the droplets are flung inward
        const to = new THREE.Vector3(CENTRE.x - m.position.x, CENTRE.y - m.position.y, 0);
        if (to.lengthSq() < 1e-4) to.set(0, 0, 1);
        to.normalize(); to.z = 0.7;
        burst(b, m, to);
      }
      if (!b.big) {
        b.pos.y += b.speed * dt * pace;
        b.pos.x += Math.sin(time.value * 0.6 + b.seed) * 0.003 * pace;
        if (b.pos.y - b.r > vh / 2 && !b.pop) spawn(b, true, vw, vh);
      } else {
        b.pos.set(vw * 0.06 + Math.sin(time.value * 0.31) * vw * 0.01, -vh * 0.04 + Math.sin(time.value * 0.5) * vh * 0.012, 0);
      }
      // drift away from the pointer, and ease back
      if (interactive && !still) {
        const dx = b.pos.x - px; const dy = b.pos.y - py; const l = Math.hypot(dx, dy); const reach = b.r + Math.min(vw, vh) * 0.12;
        if (l < reach && l > 1e-3) { const k = ((reach - l) / reach) * dt * 4; b.push.x += (dx / l) * k * reach; b.push.y += (dy / l) * k * reach; }
      }
      b.push.multiplyScalar(0.94);
      if (b.grow < 1) b.grow = Math.min(1, b.grow + dt * (still ? 99 : 1.6));
      const s = b.r * (1 - (1 - b.grow) ** 3);
      if (b.pop) {
        b.pop += dt;
        const k = Math.min(1, b.pop / POP_S);
        b.uniforms.uPop.value = still ? 1 : k;
        // the retreating rim sheds droplets, flung onward along the film and a little outward
        if (m && b.basis && k < 1 && !still) {
          const ang = k * 3.3;
          const n = Math.min(PER_FRAME, Math.round(b.r * 26 * dt * 60 / 4) + 2);
          for (let j = 0; j < n; j++) {
            const phi = Math.random() * Math.PI * 2;
            const { dir, u, w } = b.basis;
            tmp.p.copy(dir).multiplyScalar(Math.cos(ang)).addScaledVector(u, Math.sin(ang) * Math.cos(phi)).addScaledVector(w, Math.sin(ang) * Math.sin(phi));
            tmp.t.copy(dir).multiplyScalar(-Math.sin(ang)).addScaledVector(u, Math.cos(ang) * Math.cos(phi)).addScaledVector(w, Math.cos(ang) * Math.sin(phi));
            tmp.p.applyQuaternion(m.quaternion); tmp.t.applyQuaternion(m.quaternion);
            const sp = b.r * rand(1.2, 2.6);
            emit(m.position.x + tmp.p.x * s, m.position.y + tmp.p.y * s, 5,
              tmp.t.x * sp + tmp.p.x * b.r * 0.6, tmp.t.y * sp + tmp.p.y * b.r * 0.6, 0, rand(2.5, 5.5));
          }
        }
        if (b.pop > POP_S + 0.12) {
          // leaving for dark, a burst bubble is gone for good
          if (shift === 'vortex') { b.gone = true; b.pop = 0; b.uniforms.uPop.value = 0; } else spawn(b, !b.big, vw, vh);
        }
      }
      if (!m) return;
      m.position.set(b.pos.x + b.push.x, b.pos.y + b.push.y, b.pos.z);
      m.scale.setScalar(Math.max(s, 0.0001));
      if (!b.pop) { m.rotation.y += dt * 0.08 * pace; m.rotation.x += dt * 0.03 * pace; }
    });

    // droplets fly, slow in the air, fall and fade. Leaving for dark, they are drawn into a spiral to the
    // centre instead, each one caught there feeding the light the prism forms from.
    const attract = shift === 'vortex' ? smooth((st - 0.15) / 0.5) : 0;
    const formed = shift === 'vortex' && st >= VORTEX.FORM;
    let live = 0;
    for (let i = 0; i < DROPS; i++) {
      if (drops.life[i] <= 0) continue;
      if (formed) { drops.life[i] = 0; continue; }
      if (attract > 0) {
        const ix = i * 3; const iy = ix + 1;
        const tx = CENTRE.x - drops.pos[ix]; const ty = CENTRE.y - drops.pos[iy]; const d = Math.hypot(tx, ty) || 1e-3;
        if (d < 0.22 * attract + 0.02) { drops.life[i] = 0; modeShift.core += 1; continue; }
        const pull = 22 * attract; const turn = 11 * attract;
        drops.vel[ix] += ((tx / d) * pull - (ty / d) * turn) * dt; drops.vel[iy] += ((ty / d) * pull + (tx / d) * turn) * dt;
        const damp = Math.exp(-dt * 2.2 * attract); drops.vel[ix] *= damp; drops.vel[iy] *= damp;
        drops.pos[ix] += drops.vel[ix] * dt; drops.pos[iy] += drops.vel[iy] * dt;
        drops.life[i] = Math.max(drops.life[i], 0.7);
        live += 1;
        continue;
      }
      drops.age[i] += dt;
      const f = 1 - drops.age[i] / drops.span[i];
      if (f <= 0) { drops.life[i] = 0; continue; }
      live += 1;
      drops.vel[i * 3] *= 0.96; drops.vel[i * 3 + 1] = drops.vel[i * 3 + 1] * 0.96 - vh * 0.35 * dt;
      drops.pos[i * 3] += drops.vel[i * 3] * dt; drops.pos[i * 3 + 1] += drops.vel[i * 3 + 1] * dt;
      drops.life[i] = f;
    }
    const { g } = drops;
    g.attributes.position.needsUpdate = true; g.attributes.aLife.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true; g.attributes.aColor.needsUpdate = true;
    drops.points && (drops.points.visible = live > 0);
  });

  return (
    <group ref={root}>
      {bubbles.map((b, i) => (
        <mesh key={i} ref={(m) => { meshes.current[i] = m; }} geometry={geometry} material={b.material} renderOrder={5} />
      ))}
      <points ref={(p) => { drops.points = p; }} geometry={drops.g} material={drops.material} frustumCulled={false} renderOrder={6} />
    </group>
  );
};
