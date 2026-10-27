// eslint-disable-next-line no-unused-vars
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { Bloom, EffectComposer, LUT } from '@react-three/postprocessing';
import { LUTCubeLoader } from 'postprocessing';
import Scene from './Scene';
import { Bubbles } from './Bubbles';
import { SwarmLight } from './SwarmLight';
import { ModeShift } from './ModeShift';
import { modeShift, endShift } from '../hooks/modeShift';

const Canvas3D = ({ lightMode, viewportPosition, isLocked, focusWave, focusHue = null, isPlayMode = false }) => {
  const texture = useLoader(LUTCubeLoader, '/lut/F-6800-STD.cube');
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

  // Which scene is up. Switching modes plays a transition (see hooks/modeShift) during which both are mounted:
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
      gl={{ antialias: false }} 
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
      {light && <Bubbles interactive={isPlayMode || !isLocked} canPop={isPlayMode} viewportPosition={viewportPosition} tint={focusHue} shift={shift} />}
      {dark && <Scene lightMode={false} viewportPosition={viewportPosition} isLocked={isLocked} focusWave={focusWave} shift={shift} />}
      {shift && <ModeShift kind={shift} onDone={finish} />}
      <SwarmLight lightMode={lightMode} />
      <EffectComposer ref={composer} disableNormalPass>
        <Bloom mipmapBlur levels={9} intensity={1.5} luminanceThreshold={1} luminanceSmoothing={1} />
        <LUT lut={texture} />
      </EffectComposer>
    </Canvas>
  );
};

export default Canvas3D; 