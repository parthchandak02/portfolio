// eslint-disable-next-line no-unused-vars
import React from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { Bloom, EffectComposer, LUT } from '@react-three/postprocessing';
import { LUTCubeLoader } from 'postprocessing';
import Scene from './Scene';

const Canvas3D = ({ lightMode, viewportPosition, isLocked, focusWave }) => {
  const texture = useLoader(LUTCubeLoader, '/lut/F-6800-STD.cube');

  return (
    <Canvas 
      orthographic 
      gl={{ antialias: false }} 
      camera={{ position: [0, 0, 100], zoom: 60 }}
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
      <Scene 
        lightMode={lightMode} 
        viewportPosition={viewportPosition} 
        isLocked={isLocked}
        focusWave={focusWave}
      />
      <EffectComposer disableNormalPass>
        <Bloom mipmapBlur levels={9} intensity={1.5} luminanceThreshold={1} luminanceSmoothing={1} />
        <LUT lut={texture} />
      </EffectComposer>
    </Canvas>
  );
};

export default Canvas3D; 