import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Effect } from 'postprocessing';
import { isReading } from '../hooks/sceneDim';

const DIM = 0.35; // the scene's strength while someone is reading
const RATE = 5; // per second; the fade takes about 0.6 s

const fragmentShader = `uniform float strength; uniform vec3 page;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    outputColor = vec4(mix(page, inputColor.rgb, strength), inputColor.a);
  }`;

class DimEffect extends Effect {
  constructor() {
    super('DimEffect', fragmentShader, {
      uniforms: new Map([['strength', new THREE.Uniform(1)], ['page', new THREE.Uniform(new THREE.Color(0, 0, 0))]])
    });
  }
}

/**
 * The last step of the scene's image: while someone reads, it fades the finished frame toward the page's own
 * black or white. Doing it here, rather than fading the canvas in CSS, keeps the canvas opaque for the browser
 * and keeps the page from re-rendering when reading starts or stops.
 */
export const SceneDim = ({ lightMode }) => {
  const effect = useMemo(() => new DimEffect(), []);
  useEffect(() => { effect.uniforms.get('page').value.set(lightMode ? 0xffffff : 0x000000); }, [effect, lightMode]);
  useFrame((_, dt) => {
    const u = effect.uniforms.get('strength');
    const target = isReading() ? DIM : 1;
    u.value += (target - u.value) * Math.min(1, dt * RATE);
    if (import.meta.env?.DEV) window.__sceneStrength = u.value;
  });
  return <primitive object={effect} dispose={null} />;
};
