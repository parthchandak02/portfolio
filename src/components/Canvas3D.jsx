// eslint-disable-next-line no-unused-vars
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, LUT } from '@react-three/postprocessing';
import { LUTCubeLoader } from 'postprocessing';
import Scene from './Scene';
import { Bubbles } from './Bubbles';
import { SwarmLight } from './SwarmLight';
import { ModeShift } from './ModeShift';
import { modeShift, endShift } from '../hooks/modeShift';
import { QUALITY } from '../hooks/quality';

// Both scenes and the switch's effects stay mounted (the one not showing hidden and idle), so no shader is
// compiled at the moment you switch, which stalled phones for a second or two. Once the page has settled,
// this compiles the hidden ones' shaders too, while nothing is happening. three.js keys a
// compiled shader partly on where it draws: the scene draws into the post-processing's off-screen buffer, not
// to the screen, so the compile is aimed at a buffer of the same kind, or the shaders it made would not match.
const Warmup = () => {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    const run = () => {
      const hidden = [];
      // shown for the moment, so the hidden scene's lights are counted (three.js prepares every material,
      // seen or not, but only counts the lights it can see)
      scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
      const lights = [];
      scene.traverse((o) => { if (o.isLight) lights.push(o); });
      const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
      const before = gl.getRenderTarget();
      try {
        gl.setRenderTarget(target);
        // twice: with the dark scene's lights, and without them (light mode, and a switch once the prism has
        // gone), since the number of lights is part of the key too
        // (compileAsync sets the shaders up straight away, then lets the browser finish them off the main thread)
        const compile = () => (gl.compileAsync ? gl.compileAsync(scene, camera).catch(() => {}) : gl.compile(scene, camera));
        compile();
        lights.forEach((l) => { l.visible = false; });
        compile();
      } finally {
        lights.forEach((l) => { l.visible = true; });
        gl.setRenderTarget(before);
        target.dispose();
        hidden.forEach((o) => { o.visible = false; });
      }
    };
    const idle = window.requestIdleCallback ? window.requestIdleCallback(run, { timeout: 4000 }) : setTimeout(run, 2500);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(idle) : clearTimeout(idle));
  }, [gl, scene, camera]);
  return null;
};

// The finishing passes, kept out of the canvas's re-renders: the LUT's wrapper builds a new effect each time it
// renders, and a new effect means its shader compiled again, mid-switch
const Finish = memo(({ lut }) => {
  // Dither the final image: the soft glow over a dark page otherwise shows steps when it is cut to 8 bits
  const composer = useRef(null);
  useEffect(() => {
    let frame = 0;
    const apply = () => {
      const last = composer.current?.passes.filter((p) => p.enabled).at(-1);
      if (last && 'dithering' in last) last.dithering = true;
      else frame = requestAnimationFrame(apply);
    };
    apply();
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <EffectComposer ref={composer} disableNormalPass multisampling={QUALITY.msaa}>
      <Bloom mipmapBlur levels={9} intensity={1.5} luminanceThreshold={1} luminanceSmoothing={1} />
      <LUT lut={lut} />
    </EffectComposer>
  );
});

const Canvas3D = ({ lightMode, viewportPosition, isLocked, focusWave, focusHue = null, isPlayMode = false }) => {
  const loaded = useLoader(LUTCubeLoader, '/lut/F-6800-STD.cube');
  // The colour grade loads as 32-bit float data, which iPhones can't filter (no OES_texture_float_linear):
  // sampled that way it reads as black, and the whole scene went dark. Half floats filter on every WebGL2
  // device and keep the grade's precision (8-bit data would be filterable too, but the effect treats it as
  // a different, lower-precision grade and the scene comes out greyer).
  const texture = useMemo(() => {
    if (loaded.type !== THREE.FloatType) return loaded;
    const data = loaded.image.data;
    const half = new Uint16Array(data.length);
    for (let i = 0; i < data.length; i += 1) half[i] = THREE.DataUtils.toHalfFloat(data[i]);
    loaded.image.data = half;
    loaded.type = THREE.HalfFloatType;
    loaded.needsUpdate = true;
    return loaded;
  }, [loaded]);

  // Which scene is up. Switching modes plays a transition (see hooks/modeShift) during which both are awake:
  // the one leaving does its exit, the one arriving its entrance, and the switch's own effects run between them.
  // Without one (motion reduced), the scenes simply swap.
  const want = lightMode ? 'light' : 'dark';
  const [shown, setShown] = useState(want);
  const [shift, setShift] = useState(null);
  useEffect(() => {
    if (want === shown) return;
    if (modeShift.kind) setShift(modeShift.kind);
    else setShown(want);
  }, [want, shown]);
  const finish = useCallback(() => { setShown(want); setShift(null); endShift(); }, [want]);
  const dark = shown === 'dark' || Boolean(shift);
  const light = shown === 'light' || Boolean(shift);

  return (
    <Canvas 
      orthographic 
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      dpr={QUALITY.dpr}
      camera={{ position: [0, 0, 100], zoom: 60 }}
      className="scene3d"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw', // Use viewport units for better coverage
        height: '100vh', // Use viewport units for better coverage
        minWidth: '100%', // Fallback for better support
        minHeight: '100%', // Fallback for better support
        zIndex: 0, // Behind UI elements
        pointerEvents: 'none' // Allow UI events to pass through, global tracking handles 3D
      }}
    >
      <color attach="background" args={[lightMode ? 'white' : 'black']} />
      {/* Dark mode is the prism and its beam; light mode, soap bubbles (a white page can't show added light) */}
      <Bubbles active={light} interactive={isPlayMode || !isLocked} canPop={isPlayMode} viewportPosition={viewportPosition} tint={focusHue} shift={shift} />
      <Scene active={dark} lightMode={false} viewportPosition={viewportPosition} isLocked={isLocked} focusWave={focusWave} shift={shift} />
      <ModeShift kind={shift} onDone={finish} />
      <Warmup />
      <SwarmLight lightMode={lightMode} />
      <Finish lut={texture} />
    </Canvas>
  );
};

export default Canvas3D; 