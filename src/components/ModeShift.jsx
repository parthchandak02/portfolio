import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { modeShift, shiftTime, wipeAt, SHATTER, VORTEX, CENTRE, TRIANGLE, smooth } from '../hooks/modeShift';

// The 3D half of switching modes (see hooks/modeShift): the page's colour sweeping in a circle, the prism's
// shards, the sparks the rainbow bursts into, and the light that gathers where the prism forms. It is mounted
// only for the length of a switch, alongside both scenes.

const SMALL = 9; // the bubbles the shards become (Bubbles.jsx keeps this many small ones)
const SPARKS = 900;

// Every shader here finds the page's colour at its own point with the same circle
const WIPE = `
  uniform vec2 uWC; uniform float uWR; uniform float uWIn; uniform float uWOut;
  float lightAt(vec2 p) { return mix(uWOut, uWIn, smoothstep(uWR + 0.03, uWR - 0.03, length(p - uWC))); }`;

const bgVert = `uniform vec2 uView; varying vec2 vP;
  void main() { vP = position.xy * 0.5 * uView; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;
const bgFrag = `${WIPE} uniform float uRing; uniform float uTime; uniform vec2 uCam; varying vec2 vP;
  void main() {
    vec2 p = vP + uCam;
    vec3 c = vec3(lightAt(p));
    // the sweep's edge carries a faint spectrum: the light changing hands
    float d = length(p - uWC); float ring = uRing * exp(-pow((d - uWR) / 0.3, 2.0));
    vec3 rb = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + atan(p.y - uWC.y, p.x - uWC.x) / 3.1416 + uTime * 0.25));
    c = mix(c, rb, ring * 0.4);
    gl_FragColor = vec4(pow(c, vec3(2.2)), 1.0);
  }`;

const shardVert = `
  attribute vec3 aEdge; attribute vec3 aCen; attribute vec4 aRand;
  uniform float uT;
  varying vec3 vE; varying vec3 vN; varying vec2 vW; varying float vFade;
  mat3 rot(vec3 ax, float a) { float s = sin(a), c = cos(a), oc = 1.0 - c;
    return mat3(oc*ax.x*ax.x + c, oc*ax.x*ax.y + ax.z*s, oc*ax.z*ax.x - ax.y*s,
                oc*ax.x*ax.y - ax.z*s, oc*ax.y*ax.y + c, oc*ax.y*ax.z + ax.x*s,
                oc*ax.z*ax.x + ax.y*s, oc*ax.y*ax.z - ax.x*s, oc*ax.z*ax.z + c); }
  void main() {
    float t = max(uT, 0.0);
    // flung out, slowing in the air, falling a little, tumbling, and shrinking away
    vec2 dir = vec2(cos(aRand.x), sin(aRand.x));
    vec3 disp = vec3(dir * aRand.y * (1.0 - exp(-2.2 * t)) / 2.2, 0.0) + vec3(0.0, -0.9 * t * t, 0.0);
    vec3 ax = normalize(vec3(sin(aRand.z * 6.28), cos(aRand.z * 6.28), sin(aRand.z * 12.0) + 0.3));
    mat3 R = rot(ax, aRand.w * t);
    float s = 1.0 - smoothstep(0.6 + aRand.z * 0.3, 1.05 + aRand.z * 0.3, t);
    vec3 p = aCen + R * ((position - aCen) * s) + disp;
    vN = R * normal; vE = aEdge; vW = p.xy; vFade = s;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }`;
const shardFrag = `${WIPE}
  uniform float uEdge; uniform float uBody;
  varying vec3 vE; varying vec3 vN; varying vec2 vW; varying float vFade;
  void main() {
    float L = lightAt(vW);
    float edge = (1.0 - smoothstep(0.0, 0.05, min(min(vE.x, vE.y), vE.z))) * uEdge;
    float facing = abs(normalize(vN).z);
    // on black, dark glass with a bright, faintly chromatic edge; once the white reaches it, clear glass
    vec3 irid = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + (vW.x + vW.y) * 0.18));
    vec3 body = mix(vec3(0.05, 0.06, 0.08) + vec3(0.18, 0.2, 0.26) * (1.0 - facing), vec3(0.88, 0.9, 0.95) - vec3(0.12) * (1.0 - facing), L);
    vec3 rim = mix(mix(vec3(0.9, 0.95, 1.0), irid, 0.3) * 1.6, mix(vec3(0.42, 0.46, 0.56), irid * 0.7, 0.35), L);
    vec3 col = mix(body, rim, edge);
    gl_FragColor = vec4(pow(col, vec3(2.2)), max(mix(0.78, 0.32, L) * uBody, edge * mix(1.0, 0.85, L)) * vFade);
  }`;

const sparkVert = `attribute float aLife; attribute float aSize; attribute vec3 aColor; uniform float uDpr;
  varying float vLife; varying vec3 vColor; varying vec2 vW;
  void main() { vLife = aLife; vColor = aColor; vW = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uDpr * (0.6 + 0.4 * aLife); }`;
const sparkFrag = `${WIPE} varying float vLife; varying vec3 vColor; varying vec2 vW;
  void main() { vec2 c = gl_PointCoord - 0.5; float r = length(c); if (r > 0.5 || vLife <= 0.0) discard;
    // a glowing spark on black, a coloured bead on white
    float L = lightAt(vW);
    vec3 bead = mix(vColor * 0.75, vec3(1.0), smoothstep(0.22, 0.0, length(c - vec2(-0.12, 0.12))));
    vec3 col = mix(mix(vColor, vec3(1.0), 0.45) * 1.6, bead, L);
    float a = mix(exp(-r * r * 18.0), smoothstep(0.5, 0.32, r) * 0.85, L) * vLife;
    gl_FragColor = vec4(pow(col, vec3(2.2)), a); }`;

const glowFrag = `uniform float uO; varying vec2 vU;
  void main() { vec2 p = (vU - 0.5) * 2.0;
    float g = exp(-dot(p, p) * 9.0) + 0.5 * exp(-p.y * p.y * 900.0) * exp(-abs(p.x) * 2.5);
    gl_FragColor = vec4(vec3(1.0, 0.97, 0.92) * g * uO, 1.0); }`;

const rand = (a, b) => a + Math.random() * (b - a);

// Break a triangle at random points along its longest edges, so the pieces are irregular, like real glass
function fracture(a, b, c, depth, out) {
  const area = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;
  if (depth <= 0 || area < 0.035) { out.push([a, b, c]); return; }
  const [p, q, r] = [[a, b, c], [b, c, a], [c, a, b]].sort((x, y) => y[0].distanceTo(y[1]) - x[0].distanceTo(x[1]))[0];
  const m = new THREE.Vector2().lerpVectors(p, q, rand(0.3, 0.7));
  const next = depth - 1 - (Math.random() < 0.2 ? 1 : 0);
  fracture(p, m, r, next, out);
  fracture(m, q, r, next, out);
}

// The shards as one mesh: each an extruded triangle whose vertices carry its centre and its flight
function shardGeometry() {
  const [a, b, c] = TRIANGLE.map(([x, y]) => new THREE.Vector2(x, y));
  const pieces = [];
  fracture(a, b, c, 6, pieces);
  const pos = []; const nor = []; const edge = []; const cen = []; const rnd = []; const info = [];
  const H = 0.3;
  pieces.forEach(([p, q, r]) => {
    const cx = (p.x + q.x + r.x) / 3; const cy = (p.y + q.y + r.y) / 3;
    const ang = Math.atan2(cy - (CENTRE.y - 0.35), cx - CENTRE.x) + rand(-0.35, 0.35);
    const sp = rand(3.5, 8.5) * (0.6 + 0.6 * Math.hypot(cx - CENTRE.x, cy - CENTRE.y) / 1.9);
    const area = Math.abs((q.x - p.x) * (r.y - p.y) - (r.x - p.x) * (q.y - p.y)) / 2;
    const seed = Math.random(); const spin = rand(-9, 9);
    info.push({ cx, cy, ang, sp, area });
    // e marks which edges of a face to light: a component is 0 along the edge it draws
    const tri = (v1, v2, v3, n, e) => [v1, v2, v3].forEach((v, i) => {
      pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); edge.push(...e[i]); cen.push(cx, cy, 0); rnd.push(ang, sp, seed, spin);
    });
    const V = (v, z) => new THREE.Vector3(v.x, v.y, z);
    const B = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    tri(V(p, H), V(q, H), V(r, H), new THREE.Vector3(0, 0, 1), B);
    tri(V(p, -H), V(r, -H), V(q, -H), new THREE.Vector3(0, 0, -1), B);
    [[p, q], [q, r], [r, p]].forEach(([u, v]) => {
      const n = new THREE.Vector3(v.y - u.y, u.x - v.x, 0).normalize();
      // a side as two triangles; the diagonal between them stays dark
      tri(V(u, H), V(u, -H), V(v, -H), n, [[0, 1, 1], [0, 0, 1], [1, 0, 1]]);
      tri(V(u, H), V(v, -H), V(v, H), n, [[1, 0, 1], [0, 1, 1], [0, 0, 1]]);
    });
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 3));
  g.setAttribute('aCen', new THREE.Float32BufferAttribute(cen, 3));
  g.setAttribute('aRand', new THREE.Float32BufferAttribute(rnd, 4));
  return { g, info };
}

// Where a shard is, and how fast it is going, t seconds after the break (as the vertex shader moves it)
const shardAt = (s, t) => {
  const k = (1 - Math.exp(-2.2 * t)) / 2.2;
  return [s.cx + Math.cos(s.ang) * s.sp * k, s.cy + Math.sin(s.ang) * s.sp * k - 0.9 * t * t];
};
const shardVel = (s, t) => [Math.cos(s.ang) * s.sp * Math.exp(-2.2 * t), Math.sin(s.ang) * s.sp * Math.exp(-2.2 * t) - 1.8 * t];

export const ModeShift = ({ kind, onDone }) => {
  const { viewport, gl, camera } = useThree();
  const wipe = useMemo(() => ({
    uWC: { value: new THREE.Vector2(CENTRE.x, CENTRE.y) }, uWR: { value: 0 }, uWIn: { value: 1 }, uWOut: { value: 0 }
  }), []);
  const time = useMemo(() => ({ value: 0 }), []);

  const bg = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { ...wipe, uView: { value: new THREE.Vector2() }, uCam: { value: new THREE.Vector2() }, uRing: { value: 0 }, uTime: time },
    vertexShader: bgVert, fragmentShader: bgFrag, depthTest: false, depthWrite: false
  }), [wipe, time]);

  const shards = useMemo(() => {
    if (kind !== 'shatter') return null;
    const { g, info } = shardGeometry();
    const material = new THREE.ShaderMaterial({
      uniforms: { ...wipe, uT: { value: -1 }, uEdge: { value: 0 }, uBody: { value: 0 } },
      vertexShader: shardVert, fragmentShader: shardFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide
    });
    // The shards the small bubbles grow from: spread round the circle, and not the slivers
    let pool = info.map((s, i) => ({ s, i })).filter((x) => x.s.area > 0.05);
    if (pool.length < SMALL) pool = info.map((s, i) => ({ s, i }));
    pool.sort((x, y) => x.s.ang - y.s.ang);
    modeShift.spawns = Array.from({ length: SMALL }, (_, k) => {
      const s = pool[Math.floor(((k + 0.5) * pool.length) / SMALL)].s;
      const when = SHATTER.BREAK + 0.42 + k * 0.025;
      const at = shardAt(s, when - SHATTER.BREAK); const vel = shardVel(s, when - SHATTER.BREAK);
      return { when, x: at[0], y: at[1], vx: vel[0], vy: vel[1] };
    });
    return { g, material };
  }, [kind, wipe]);

  const sparks = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(SPARKS * 3); const life = new Float32Array(SPARKS); const size = new Float32Array(SPARKS); const color = new Float32Array(SPARKS * 3);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aLife', new THREE.BufferAttribute(life, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
    const material = new THREE.ShaderMaterial({ uniforms: { ...wipe, uDpr: { value: 1 } }, vertexShader: sparkVert, fragmentShader: sparkFrag, transparent: true, depthWrite: false, depthTest: false });
    return { g, material, pos, life, size, color, vel: new Float32Array(SPARKS * 3), age: new Float32Array(SPARKS), span: new Float32Array(SPARKS), next: 0 };
  }, [wipe]);
  const emit = (x, y, vx, vy, px, span, c) => {
    const i = sparks.next; sparks.next = (sparks.next + 1) % SPARKS;
    sparks.pos.set([x, y, 6], i * 3); sparks.vel.set([vx, vy, 0], i * 3);
    sparks.age[i] = 0; sparks.span[i] = span; sparks.life[i] = 1; sparks.size[i] = px; sparks.color.set([c.r, c.g, c.b], i * 3);
  };

  const glow = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uO: { value: 0 } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: glowFrag, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false
  }), []);
  const glowMesh = useRef(null);

  useEffect(() => () => {
    bg.dispose(); glow.dispose(); sparks.g.dispose(); sparks.material.dispose();
    if (shards) { shards.g.dispose(); shards.material.dispose(); }
  }, [bg, glow, sparks, shards]);

  const state = useRef({ broke: false, done: false });
  const colour = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = shiftTime();
    time.value += dt;
    const { r } = wipeAt(kind, t);
    wipe.uWR.value = r;
    bg.uniforms.uView.value.set(viewport.width, viewport.height);
    bg.uniforms.uCam.value.set(camera.position.x, camera.position.y);
    sparks.material.uniforms.uDpr.value = gl.getPixelRatio();
    let glowAmt = 0; let glowSize = 2.4;

    if (kind === 'shatter') {
      const u = shards.material.uniforms;
      if (t < SHATTER.BREAK) {
        // cracks of light run through the glass, flickering, as the beam overloads it
        const c = smooth(t / SHATTER.BREAK);
        u.uEdge.value = c * (0.75 + 0.25 * Math.sin(t * 90));
        glowAmt = c * 1.2; glowSize = 2.4 * (1 + c * 1.6);
      } else {
        const tb = t - SHATTER.BREAK;
        if (!state.current.broke) {
          state.current.broke = true;
          u.uEdge.value = 1; u.uBody.value = 1;
          // the rainbow bursts into sparks of its own colours, and the beam's last light flies on
          const beam = modeShift.beam;
          if (beam) {
            const reach = Math.hypot(viewport.width, viewport.height) * 0.55;
            for (let k = 0; k < 560; k++) {
              const f = Math.random(); const a = beam.out + (f - 0.5) * 0.4; const d = rand(0.3, 1) * reach; const sp = rand(1.5, 5);
              emit(beam.ox + Math.cos(a) * d, beam.oy + Math.sin(a) * d, Math.cos(a) * sp + rand(-1, 1), Math.sin(a) * sp + rand(-1, 1), rand(3, 7), rand(0.5, 1.1), colour.setHSL(0.8 * (1 - f), 1, 0.6));
            }
            const dx = beam.hx - beam.fx; const dy = beam.hy - beam.fy; const len = Math.hypot(dx, dy) || 1;
            for (let k = 0; k < 180; k++) {
              const f = Math.random(); const sp = rand(2, 6);
              emit(beam.fx + dx * f, beam.fy + dy * f, (dx / len) * sp + rand(-0.8, 0.8), (dy / len) * sp + rand(-0.8, 0.8), rand(2, 5), rand(0.3, 0.8), colour.set('#ffffff'));
            }
          }
        }
        u.uT.value = tb;
        glowAmt = Math.max(0, 3 * (1 - tb / 0.35)); glowSize = 2.4 * (2.6 + tb * 4);
        bg.uniforms.uRing.value = 1 - smooth(tb / SHATTER.WIPE);
      }
      if (t > SHATTER.END && !state.current.done) { state.current.done = true; onDone(); }
    } else {
      bg.uniforms.uRing.value = 0.8 * smooth((t - VORTEX.IRIS_AT) / 0.2);
      // the droplets gather into a point of light, which flashes as the prism forms
      const g = Math.min(1, modeShift.core / 500);
      if (t < VORTEX.FORM) { glowAmt = smooth((t - 0.15) / 0.5) * (0.35 + g * 1.4); glowSize = 1.2 + g * 3; }
      else { const k = t - VORTEX.FORM; glowAmt = 4 * Math.exp(-k * 6); glowSize = 2.4 + 9 * Math.exp(-k * 5); }
      if (t > VORTEX.END && !state.current.done) { state.current.done = true; onDone(); }
    }

    if (glowMesh.current) {
      glowMesh.current.visible = glowAmt > 0.002;
      glowMesh.current.scale.setScalar(glowSize);
      glow.uniforms.uO.value = glowAmt;
    }

    // sparks fly, slow in the air, fall and fade
    for (let i = 0; i < SPARKS; i++) {
      if (sparks.life[i] <= 0) continue;
      sparks.age[i] += dt;
      const f = 1 - sparks.age[i] / sparks.span[i];
      if (f <= 0) { sparks.life[i] = 0; continue; }
      const ix = i * 3;
      sparks.vel[ix] *= Math.exp(-dt * 2.4); sparks.vel[ix + 1] = sparks.vel[ix + 1] * Math.exp(-dt * 2.4) - viewport.height * 0.35 * dt;
      sparks.pos[ix] += sparks.vel[ix] * dt; sparks.pos[ix + 1] += sparks.vel[ix + 1] * dt;
      sparks.life[i] = f;
    }
    for (const k of ['position', 'aLife', 'aSize', 'aColor']) sparks.g.attributes[k].needsUpdate = true;
  });

  return (
    <>
      <mesh material={bg} frustumCulled={false} renderOrder={-100}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      {shards && <mesh geometry={shards.g} material={shards.material} frustumCulled={false} renderOrder={12} />}
      <points geometry={sparks.g} material={sparks.material} frustumCulled={false} renderOrder={14} />
      <mesh ref={glowMesh} material={glow} position={[CENTRE.x, CENTRE.y, 8]} renderOrder={15} visible={false}>
        <planeGeometry />
      </mesh>
    </>
  );
};
