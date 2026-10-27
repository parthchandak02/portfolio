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
// compiled at the moment you switch, which stalled phones for a second or two. As soon as the scene is up,
// this prepares the hidden ones too. It starts the moment the scene loads rather than waiting for a quiet
// moment: with the scene animating every frame the browser is rarely idle, and a late warm-up landed on the
// first switch and froze it for up to two seconds.
// three.js keys a compiled shader partly on where it draws: the scene draws into the post-processing's
// off-screen buffer, not to the screen, so the warm-up aims at a buffer of the same kind, or the shaders it
// made would not match. It also keys on the number of lights, so it runs twice: with the dark scene's lights,
// and without them (light mode, and a switch once the prism has gone).
const Warmup = () => {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let live = true;
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    // Runs `fn` with everything shown (three.js prepares every material, seen or not, but only counts the lights
    // it can see) and drawing into the buffer, then puts it all back
    const exposed = (lightsOn, fn) => {
      const hidden = [];
      scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
      const lights = [];
      scene.traverse((o) => { if (o.isLight) lights.push(o); });
      const before = gl.getRenderTarget();
      try {
        lights.forEach((l) => { l.visible = lightsOn; });
        gl.setRenderTarget(target);
        return fn();
      } finally {
        lights.forEach((l) => { l.visible = true; });
        gl.setRenderTarget(before);
        hidden.forEach((o) => { o.visible = false; });
      }
    };
    // compileAsync hands the shaders to the GPU to build in the background, without holding up the page. Once
    // they're built, the scene is drawn once with them: that sends the meshes' geometry and textures to the
    // GPU, and finishes setting each shader up, both of which otherwise happen the first time each one shows
    const prepare = async (lightsOn) => {
      const built = exposed(lightsOn, () => (gl.compileAsync ? gl.compileAsync(scene, camera) : gl.compile(scene, camera)));
      await Promise.resolve(built).catch(() => {});
      if (live) exposed(lightsOn, () => gl.render(scene, camera));
    };
    prepare(true).then(() => live && prepare(false)).finally(() => target.dispose());
    return () => { live = false; };
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
  // the scene starts its half the moment you switch, before the page has changed (see hooks/modeShift)
  useEffect(() => {
    const start = () => setShift(modeShift.kind);
    window.addEventListener('modeshift', start);
    return () => window.removeEventListener('modeshift', start);
  }, []);
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
      // three.js asks the GPU for each shader's error log the first time it draws with it, which makes the
      // page wait for the GPU to finish building it; the shaders are known good, so the live site doesn't ask
      onCreated={({ gl }) => { gl.debug.checkShaderErrors = !import.meta.env.PROD; }}
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