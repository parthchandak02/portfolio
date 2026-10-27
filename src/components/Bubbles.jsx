import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

// Light mode's scene. The prism's beam is light added to black, which a white page can't show, so here the
// light-splitting object is the soap bubble: nearly invisible, seen by the room reflected in its skin and
// coloured by thin-film interference. In the playground they drift from the pointer and pop when tapped; in
// the portfolio they only float.

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
    vec3 n = normalize(vN); vec3 v = normalize(vV);
    if (!gl_FrontFacing) n = -n;
    float cosi = clamp(dot(n, v), 0.0, 1.0);
    float fres = 0.02 + 0.98 * pow(1.0 - cosi, 5.0);
    // Thin-film interference: the film drains, so it is thinner at the top
    float th = clamp(swirl(vObj * 1.4 + uSeed, uTime), 0.0, 1.0);
    float d = mix(160.0, 860.0, th) * (0.7 + 0.5 * (0.5 - 0.5 * vUp));
    float sint = sqrt(max(0.0, 1.0 - cosi * cosi)) / 1.33; float cost = sqrt(1.0 - sint * sint);
    vec3 film = 0.5 - 0.5 * cos(12.566 * 1.33 * d * cost / vec3(650.0, 510.0, 470.0));
    vec3 refl = env(reflect(-v, n)) * (0.25 + 1.5 * film);
    float a = clamp(fres * 1.1 + 0.025 + 0.12 * max(max(film.r, film.g), film.b) * (0.15 + fres), 0.0, 0.9);
    // The scene is composited in linear light and converted for the screen at the end, so the colour is
    // given in linear terms; written as is, it came out washed out
    gl_FragColor = vec4(pow(refl, vec3(2.2)), a);
  }`;

const SMALL = 9; // bubbles rising past the big one
const POP_S = 0.18; // seconds for a bubble to swell and burst

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);

export const Bubbles = ({ interactive = false, viewportPosition }) => {
  const { viewport } = useThree();
  const time = useMemo(() => ({ value: 0 }), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 96, 64), []);
  const meshes = useRef([]);

  // One big bubble where the prism stands, and small ones rising past it, sized to the screen
  const bubbles = useMemo(() => Array.from({ length: SMALL + 1 }, (_, i) => ({
    big: i === 0,
    seed: Math.random() * 10,
    material: new THREE.ShaderMaterial({
      uniforms: { uTime: time, uSeed: { value: Math.random() * 10 } },
      vertexShader, fragmentShader, transparent: true, depthWrite: false, side: THREE.DoubleSide
    }),
    pos: new THREE.Vector3(), push: new THREE.Vector3(), r: 1, speed: 0, grow: 1, pop: 0
  })), [time]);

  const spawn = (b, fromBelow, vw, vh) => {
    const unit = Math.min(vw, vh);
    b.r = b.big ? unit * 0.21 : unit * rand(0.03, 0.085);
    if (b.big) b.pos.set(vw * 0.06, -vh * 0.04, 0);
    else b.pos.set(rand(-vw / 2, vw / 2), fromBelow ? -vh / 2 - b.r - rand(0, vh * 0.15) : rand(-vh / 2, vh / 2), rand(-1, 1));
    b.speed = b.big ? 0 : vh * rand(0.025, 0.05);
    b.pop = 0;
    b.grow = fromBelow || b.big ? 0 : 1;
  };
  const placed = useRef(false);
  if (!placed.current) {
    bubbles.forEach((b) => { spawn(b, false, viewport.width, viewport.height); b.grow = 1; });
    placed.current = true;
  }

  // Tapping a bubble in the playground pops it. The canvas takes no pointer events, so the page's taps are
  // mapped into the scene; the play button's own taps are left alone.
  const view = useRef(viewport);
  view.current = viewport;
  useEffect(() => {
    if (!interactive) return undefined;
    const onDown = (e) => {
      if (e.target.closest?.('.play-mode-toggle')) return;
      const { width: vw, height: vh } = view.current;
      const x = (e.clientX / window.innerWidth - 0.5) * vw;
      const y = (0.5 - e.clientY / window.innerHeight) * vh;
      const hit = bubbles.filter((b) => !b.pop && Math.hypot(b.pos.x + b.push.x - x, b.pos.y + b.push.y - y) < b.r).sort((a, b) => a.r - b.r)[0];
      if (hit) hit.pop = 0.0001;
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [interactive, bubbles]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const still = reduceMotion();
    const { width: vw, height: vh } = viewport;
    time.value += still ? 0 : dt;
    // In the portfolio they rise slowly, in the playground at full pace
    const pace = still ? 0 : interactive ? 1 : 0.45;
    const px = (viewportPosition?.x ?? 9) * vw / 2;
    const py = (viewportPosition?.y ?? 9) * vh / 2;
    bubbles.forEach((b, i) => {
      if (!b.big) {
        b.pos.y += b.speed * dt * pace;
        b.pos.x += Math.sin(time.value * 0.6 + b.seed) * 0.003 * pace;
        if (b.pos.y - b.r > vh / 2) spawn(b, true, vw, vh);
      } else {
        b.pos.set(vw * 0.06 + Math.sin(time.value * 0.31) * vw * 0.01, -vh * 0.04 + Math.sin(time.value * 0.5) * vh * 0.012, 0);
      }
      // In the playground they drift away from the pointer, and ease back
      if (interactive) {
        const dx = b.pos.x - px; const dy = b.pos.y - py; const l = Math.hypot(dx, dy); const reach = b.r + Math.min(vw, vh) * 0.12;
        if (l < reach && l > 1e-3) { const k = ((reach - l) / reach) * dt * 4; b.push.x += (dx / l) * k * reach; b.push.y += (dy / l) * k * reach; }
      }
      b.push.multiplyScalar(0.94);
      if (b.grow < 1) b.grow = Math.min(1, b.grow + dt * 1.6);
      let s = b.r * (1 - (1 - b.grow) ** 3);
      if (b.pop) {
        b.pop += dt;
        const k = b.pop / POP_S;
        s *= k < 1 ? 1 + k * 0.18 : 0;
        if (k >= 1.6) spawn(b, !b.big, vw, vh);
      }
      const m = meshes.current[i];
      if (!m) return;
      m.position.set(b.pos.x + b.push.x, b.pos.y + b.push.y, b.pos.z);
      m.scale.setScalar(Math.max(s, 0.0001));
      m.rotation.y += dt * 0.08 * pace; m.rotation.x += dt * 0.03 * pace;
    });
  });

  return bubbles.map((b, i) => (
    <mesh key={i} ref={(m) => { meshes.current[i] = m; }} geometry={geometry} material={b.material} renderOrder={5} />
  ));
};
