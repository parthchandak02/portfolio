import { forwardRef } from 'react'
import { useLoader } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three-stdlib'
import { QUALITY } from '../hooks/quality'

// Given in place of the glass's own buffer while the scene is hidden, which stops it re-rendering the scene
// into that buffer every frame (drei's material only renders when its buffer is its own)
const idle = new THREE.DataTexture(new Uint8Array(4), 1, 1)

export const Prism = forwardRef(function Prism({ onRayOver, onRayOut, onRayMove, paused = false, ...props }, ref) {
  const { nodes } = useLoader(GLTFLoader, '/gltf/prism.glb')
  return (
    <group ref={ref} {...props}>
      {/* A low-res, invisible representation of the prism that gets hit by the raycaster */}
      <mesh visible={false} scale={1.9} rotation={[Math.PI / 2, Math.PI, 0]} onRayOver={onRayOver} onRayOut={onRayOut} onRayMove={onRayMove}>
        <cylinderGeometry args={[1, 1, 1, 3, 1]} />
      </mesh>
      {/* The visible hi-res prism */}
      <mesh position={[0, 0, 0.6]} renderOrder={10} scale={2} dispose={null} geometry={nodes.Cone.geometry}>
        <MeshTransmissionMaterial buffer={paused ? idle : undefined} resolution={QUALITY.glassResolution} samples={QUALITY.glassSamples} clearcoat={1} transmission={1} thickness={0.9} roughness={0} anisotropy={0.1} chromaticAberration={1} toneMapped={false} />
      </mesh>
    </group>
  )
})
