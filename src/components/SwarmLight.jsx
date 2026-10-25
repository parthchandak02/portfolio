import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { swarmLight } from '../hooks/swarmLight';

const MAX = 64;
const WIDTH = 14; // px across a pill's glow; its bright core is much narrower
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

const vertexShader = `attribute vec4 aColor; varying vec2 vUv; varying vec4 vColor;
  void main() { vUv = uv; vColor = aColor; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); }`;
const fragmentShader = `varying vec2 vUv; varying vec4 vColor; uniform bool lightMode;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float along = 1.0 - smoothstep(0.55, 1.0, abs(p.y));
    float core = exp(-p.x * p.x * 30.0) * along;
    float halo = exp(-p.x * p.x * 4.0) * along * 0.35;
    // Bright enough to bloom on the dark page; on the light page, solid colour, since light added to white vanishes
    if (lightMode) gl_FragColor = vec4(vColor.rgb, (core * 1.4 + halo * 0.3) * vColor.a);
    else gl_FragColor = vec4(vColor.rgb * (core * 3.2 + halo * 1.4) * vColor.a, 1.0);
  }`;

/**
 * Draws the strip's swarm inside the 3D scene, so the pills glow like the rainbow and pass behind the page's
 * glass. The pills live in screen pixels; each frame they are placed with the canvas's own box and the camera's
 * zoom, which is exact because the camera is orthographic. The canvas is sized to 100vh, taller than the
 * visible window on phones, so its box is read every frame rather than taken from the window.
 */
export const SwarmLight = ({ lightMode }) => {
  const mesh = useRef(null);
  const { gl, camera, size } = useThree();
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    g.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(MAX * 4), 4));
    return g;
  }, []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader, fragmentShader, transparent: true, depthWrite: false, depthTest: false, toneMapped: false,
    uniforms: { lightMode: { value: false } }
  }), []);
  const scratch = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), s: new THREE.Vector3(), z: new THREE.Vector3(0, 0, 1), c: new THREE.Color() }), []);

  useEffect(() => {
    material.uniforms.lightMode.value = lightMode;
    material.blending = lightMode ? THREE.NormalBlending : THREE.AdditiveBlending;
    material.needsUpdate = true;
  }, [lightMode, material]);

  useEffect(() => {
    swarmLight.ready = true;
    return () => { swarmLight.ready = false; };
  }, []);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  useFrame(() => {
    const inst = mesh.current;
    if (!inst) return;
    const rect = gl.domElement.getBoundingClientRect();
    const zoom = camera.zoom;
    const colour = geometry.attributes.aColor;
    const now = performance.now();
    let n = 0;
    swarmLight.pills.forEach((p) => {
      if (!p.on || p.done || n >= MAX) return;
      // Screen px to scene units: the camera looks at the canvas centre, one unit is `zoom` px
      const x = (p.x - rect.left - size.width / 2) / zoom;
      const y = (size.height / 2 - (p.y - rect.top)) / zoom;
      const length = clamp(9 + p.speed * 1.5, 9, 30);
      scratch.v.set(x + camera.position.x, y + camera.position.y, 10);
      scratch.q.setFromAxisAngle(scratch.z, p.angle);
      scratch.s.set(WIDTH / zoom, length / zoom, 1);
      scratch.m.compose(scratch.v, scratch.q, scratch.s);
      inst.setMatrixAt(n, scratch.m);
      scratch.c.set(p.hue);
      colour.setXYZW(n, scratch.c.r, scratch.c.g, scratch.c.b, clamp((now - p.born) / 160, 0, 1));
      n += 1;
    });
    inst.count = n;
    inst.instanceMatrix.needsUpdate = true;
    colour.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geometry, material, MAX]} frustumCulled={false} renderOrder={30} />;
};
