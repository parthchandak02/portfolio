import { useRef, useCallback, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Beam } from './Beam';
import { Rainbow } from './Rainbow';
import { Prism } from './Prism';
import { Flare } from './Flare';
import { Box } from './Box';
import { SwarmLight } from './SwarmLight';
import { calculateRefractionAngle, lerp, lerpV3 } from '../util';
import { onPrismGlow } from '../hooks/prismGlow';
import { lightTheme } from '../hooks/lightTheme';

const PULSE_MS = 1500; // the pulse's run from the prism to the rainbow's far end
const CATCH_MS = 900; // the flare's swell and settle

const Scene = ({ lightMode, viewportPosition, isLocked, focusWave = null }) => {
  const [isPrismHit, hitPrism] = useState(false);
  const flare = useRef(null);
  const ambient = useRef(null);
  const spot = useRef(null);
  const boxreflect = useRef(null);
  const rainbow = useRef(null);
  
  const { viewport, invalidate } = useThree();

  // Fix stale closure issue - use ref to store current lock state
  const isLockedRef = useRef(false);
  
  // Update ref whenever lock state changes AND force re-render
  useEffect(() => {
    isLockedRef.current = isLocked;
    invalidate(); // Force React Three Fiber to re-render
  }, [isLocked, invalidate]);

  const rayOut = useCallback(() => hitPrism(false), []);
  
  const rayOver = useCallback((e) => {
    // Break raycast so the ray stops when it touches the prism
    e.stopPropagation();
    hitPrism(true);
    // Set the intensity really high on first contact
    rainbow.current.material.speed = 1;
    rainbow.current.material.emissiveIntensity = 20;
  }, []);

  // A moment of light: the prism catches the beam and a pulse runs out along the rainbow. It starts when the
  // lit band changes (picking an item, or scrolling into a section) and when the page asks for one.
  const glow = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    return onPrismGlow((wave) => { glow.current = { t: performance.now(), wave }; });
  }, []);
  useEffect(() => {
    if (focusWave && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) glow.current = { t: performance.now(), wave: focusWave };
  }, [focusWave]);

  const vecRef = useRef(new THREE.Vector3());
  const spreadRef = useRef(0.5); // the fan's width, set by where the beam meets the prism
  
  const rayMove = useCallback(({ api, position, direction, normal }) => {
    if (!normal) return;
    // Extend the line to the prisms center
    vecRef.current.toArray(api.positions, api.number++ * 3);
    // Set flare
    flare.current.position.set(position.x, position.y, -0.5);
    flare.current.rotation.set(0, 0, -Math.atan2(direction.x, direction.y));
    // Calculate refraction angles
    let angleScreenCenter = Math.atan2(-position.y, -position.x);
    const normalAngle = Math.atan2(normal.y, normal.x);
    // The angle between the ray and the normal
    const incidentAngle = angleScreenCenter - normalAngle;
    // Glass spreads the colours more the more steeply the beam strikes it, so the fan widens toward grazing
    spreadRef.current = 0.5 * (1 + 0.28 * Math.sin(incidentAngle) ** 2);
    // Calculate the refraction for the incident angle
    const refractionAngle = calculateRefractionAngle(incidentAngle) * 6;
    // Apply the refraction
    angleScreenCenter += refractionAngle;
    rainbow.current.rotation.z = angleScreenCenter;
    // Set spot light
    lerpV3(spot.current.target.position, [Math.cos(angleScreenCenter), Math.sin(angleScreenCenter), 0], 0.05);
    spot.current.target.updateMatrixWorld();
  }, []);

  useFrame((state) => {
    // Always update positions if viewportPosition is available (whether locked or not)
    if (viewportPosition) {
      // Update flare position
      if (flare.current) {
        lerpV3(flare.current.position, [viewportPosition.x * 4, viewportPosition.y * 4, 5], 0.1);
      }
      
      // Update beam ray
      const mouseX = (viewportPosition.x * viewport.width) / 2;
      const mouseY = (viewportPosition.y * viewport.height) / 2;
      boxreflect.current.setRay([mouseX, mouseY, 0], [0, 0, 0]);
    }
    
    // Glide the highlight to the picked band's wavelength; with nothing picked, ease back to the full spectrum
    const m = rainbow.current.material;
    if (focusWave) lerp(m, 'focus', focusWave, m.focusAmount < 0.05 ? 1 : 0.12);
    lerp(m, 'focusAmount', focusWave ? 1 : 0, 0.08);

    lerp(m, 'endRadius', spreadRef.current, 0.06);

    // The pulse fades in quickly and out as it travels; the catch swells the flare a little and settles
    const g = glow.current;
    const p = g ? (performance.now() - g.t) / PULSE_MS : 1;
    const k = g ? Math.max(0, 1 - (performance.now() - g.t) / CATCH_MS) : 0;
    const swell = k * k * (3 - 2 * k);
    m.pulseR = 0.05 + p * 1.05;
    m.pulseAmt = p < 1 ? Math.sin(Math.min(1, p * 6) * Math.PI / 2) * (1 - p) : 0;
    m.pulseWave = g ? g.wave : 0;
    m.flash = swell * 0.3;
    if (flare.current) flare.current.scale.setScalar(1.25 * (1 + swell * 0.4));
    if (p >= 1) glow.current = null;

    // Animate rainbow intensity
    lerp(rainbow.current.material, 'emissiveIntensity', isPrismHit ? 2.5 : 0, 0.1);
    spot.current.intensity = rainbow.current.material.emissiveIntensity;
    // Animate ambience
    lerp(ambient.current, 'intensity', lightMode ? 0.8 : 0, 0.025);
  });

  // Light mode's squares take the light theme's tone
  const boxLook = lightMode ? { color: lightTheme.box, idle: lightTheme.boxIdle } : {};

  return (
    <>
      {/* Lights */}
      <ambientLight ref={ambient} intensity={lightMode ? 0.8 : 0} />
      <pointLight position={[10, -10, 0]} intensity={0.05} />
      <pointLight position={[0, 10, 0]} intensity={0.05} />
      <pointLight position={[-10, 0, 0]} intensity={0.05} />
      <spotLight ref={spot} intensity={1} distance={7} angle={1} penumbra={1} position={[0, 0, 1]} />

      {/* Prism + blocks + reflect beam */}
      <Beam ref={boxreflect} bounce={10} far={20}>
        <Prism position={[0, -0.5, 0]} onRayOver={rayOver} onRayOut={rayOut} onRayMove={rayMove} finish={lightMode ? lightTheme.prism : undefined} />
        <Box position={[2.25, -3.5, 0]} rotation={[0, 0, Math.PI / 3.5]} {...boxLook} />
        <Box position={[-2.5, -2.5, 0]} rotation={[0, 0, Math.PI / 4]} {...boxLook} />
        <Box position={[-3, 1, 0]} rotation={[0, 0, Math.PI / 4]} {...boxLook} />
      </Beam>
      
      {/* Rainbow and flares */}
      <Rainbow ref={rainbow} lightMode={lightMode} startRadius={0} endRadius={0.5} fade={0} />
      <SwarmLight lightMode={lightMode} />
      <Flare ref={flare} visible={isPrismHit} renderOrder={10} scale={1.25} streak={[12.5, 20, 1]} />
    </>
  );
};

export default Scene; 