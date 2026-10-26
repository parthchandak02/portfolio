import { forwardRef, useMemo, useRef } from 'react'
import { lightTheme } from '../hooks/lightTheme'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

// Based on
// "Improving the Rainbow" by Alan Zucconi: https://www.alanzucconi.com/2017/07/15/improving-the-rainbow-2/
// "More accurate Iridescence" by Julia Poo: https://www.shadertoy.com/view/ltKcWh
// Code written by https://twitter.com/shuding_
const RainbowMaterial = shaderMaterial(
  {
    time: 0,
    speed: 1,
    fade: 0.5,
    startRadius: 1,
    endRadius: 0,
    emissiveIntensity: 2.5,
    ratio: 1,
    lightMode: false,
    focus: 550,
    focusAmount: 0,
    pulseR: -1,
    pulseAmt: 0,
    pulseWave: 0,
    flash: 0,
    dispersion: 0.4,
    lightSat: 1,
    lightGain: 1
  },
  /*glsl*/ ` varying vec2 vUv;
    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * modelPosition;
    }`,
  /*glsl*/ ` varying vec2 vUv;
    uniform float fade;
    uniform float lightSat;
    uniform float lightGain;
    uniform float speed;
    uniform float startRadius;
    uniform float endRadius;
    uniform float emissiveIntensity;
    uniform float time;
    uniform float ratio;
    uniform bool lightMode;
    uniform float focus;
    uniform float focusAmount;
    uniform float pulseR;
    uniform float pulseAmt;
    uniform float pulseWave;
    uniform float flash;
    uniform float dispersion;
  
    vec2 mp;
    // ratio: 1/3 = neon, 1/4 = refracted, 1/5+ = approximate white
    vec3 physhue2rgb(float hue, float ratio) {
      return smoothstep(vec3(0.0),vec3(1.0), abs(mod(hue + vec3(0.0,1.0,2.0)*ratio,1.0)*2.0-1.0));
    }
          
    vec3 iridescence (float angle, float thickness) {      
      float NxV = cos(angle);     
      float lum = 0.05064;      
      float luma = 0.01070;      
      vec3 tint = vec3(0.49639,0.78252,0.8723);      
      float interf0 = 2.4;      
      float phase0 = 1.0 / 2.8;      
      float interf1 = interf0 * 4.0 / 3.0;      
      float phase1 = phase0;      
      float f = (1.0 - NxV) * (1.0 - NxV);
      float dp = (NxV - 1.0) * 0.5;            
      vec3 hue = mix(physhue2rgb(thickness * interf0 + dp, thickness * phase0), physhue2rgb(thickness * interf1 + 0.1 + dp, thickness * phase1), f);      
      vec3 film = hue * lum + vec3(0.9639,0.78252,0.18723) * luma;      
      return vec3((film * 3.0 + pow(f,12.0))) * tint;
    }

    float _saturate (float x) {
      return min(1.0, max(0.0,x));
    }

    vec3 _saturate (vec3 x) {
      return min(vec3(1.,1.,1.), max(vec3(0.,0.,0.),x));
    }
    
    vec3 bump3y(vec3 x, vec3 yoffset) {
      vec3 y = vec3(1.,1.,1.) - x * x;
      y = _saturate(y-yoffset);
      return y;
    }

    vec3 spectral_zucconi6(float w, float t) {    
      float x = _saturate((w - 400.0)/ 300.0);
      const vec3 c1 = vec3(3.54585104, 2.93225262, 2.41593945);
      const vec3 x1 = vec3(0.69549072, 0.49228336, 0.27699880);
      const vec3 y1 = vec3(0.02312639, 0.15225084, 0.52607955);
      const vec3 c2 = vec3(3.90307140, 3.21182957, 3.96587128);
      const vec3 x2 = vec3(0.11748627, 0.86755042, 0.66077860);
      const vec3 y2 = vec3(0.84897130, 0.88445281, 0.73949448);
      return bump3y(c1 * (x - x1), y1) + bump3y(c2 * (x - x2), y2);
    }

    void main() {
      const vec2 vstart = vec2(0.5, 0.5);
      const vec2 vend = vec2(1.0, 0.5);
      vec2 dir = vstart - vend;
      float len = length(dir);
      float cosR = dir.y / len;
      float sinR = dir.x / len;
      vec2 uv = (mat2(cosR, -sinR, sinR, cosR) * (vUv * vec2(ratio, 1.) - vec2(0., 1.) - vstart * vec2(1., -1.)) / len);
      float a = atan(uv.x, uv.y) * 10.0;
      float s = uv.y * (endRadius - startRadius) + startRadius;
      // Across the fan, 0 is the violet edge and 1 the red. Glass bends short wavelengths more, so the colours
      // are laid out by refractive index (Cauchy's equation for BK7 glass, n = A + B / λ² with λ in µm) rather
      // than evenly: violet and blue open wide and red bunches up, as through a real prism.
      float across = uv.x / s + 0.5;
      const float CAUCHY_A = 1.5046;
      const float CAUCHY_B = 0.0042;
      float n = mix(CAUCHY_A + CAUCHY_B / 0.16, CAUCHY_A + CAUCHY_B / 0.49, across); // n at 400 nm to n at 700 nm
      float wPrism = sqrt(CAUCHY_B / max(n - CAUCHY_A, 1e-4)) * 1000.0;
      float w = mix(across * 300. + 400., wPrism, dispersion) + a;
      vec3 c = spectral_zucconi6(w, time); // [400, 700]
      float l = 1. - smoothstep(fade, 1., uv.y);
      float area = uv.y < 0. ? 0. : 1.;
      float brightness = smoothstep(0., 0.5, c.x + c.y + c.z);
      vec3 co = c / iridescence(uv.x * 0.5 * 3.14159, 1.0 - uv.y + time / 10.0) / 20.0;      
      
      // Adapt colors based on background mode
      vec3 finalColor = area * co * l * brightness * emissiveIntensity * (1.0 + flash);

      // Light the band of the item being read and let the rest of the spectrum fall back
      float near = exp(-pow((w - focus) / 26.0, 2.0));
      finalColor *= mix(1.0, 0.15 + 1.75 * near, focusAmount);

      // A band of light that runs out from the prism along one colour, or the whole spectrum when pulseWave is 0
      float ring = exp(-pow((uv.y - pulseR) / 0.05, 2.0));
      float pulseBand = pulseWave > 0.0 ? exp(-pow((w - pulseWave) / 24.0, 2.0)) : 1.0;
      finalColor *= 1.0 + pulseAmt * ring * pulseBand * 2.0;
      
      if (lightMode) {
        // On white, light cannot be added, so the colour is laid over the page and fades with its brightness.
        // A smooth fade, where a cutoff used to leave the fan's edges jagged.
        float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
        vec3 laid = pow(finalColor, vec3(0.8)) * 1.2;
        laid = mix(vec3(dot(laid, vec3(0.299, 0.587, 0.114))), laid, lightSat); // the light theme's saturation
        gl_FragColor = vec4(laid, smoothstep(0.02, 0.3, luminance) * lightGain);
      } else {
        gl_FragColor = vec4(finalColor, 1.0);
      }
      #include <colorspace_fragment>
    }`
)

extend({ RainbowMaterial })

// The fan covers a narrow wedge of the plane the shader is written for: from the plane's centre, where the light
// leaves the prism, out to its edge, within a quarter of the distance either side. Drawing only that wedge (with
// a margin) instead of the whole plane, which is larger than the screen, saves most of the shader's work.
const WEDGE = 0.4; // width at the far end, either side, as a share of the length; the colours reach 0.33 at the widest spread
const wedgeGeometry = () => {
  const g = new THREE.BufferGeometry()
  const pts = [0, 0, 0, 0.5, -0.5 * WEDGE, 0, 0.5, 0.5 * WEDGE, 0]
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0.5, 0.5, 1, 0.5 - 0.5 * WEDGE, 1, 0.5 + 0.5 * WEDGE], 2))
  return g
}

export const Rainbow = forwardRef(({ lightMode, startRadius = 0, endRadius = 0.5, emissiveIntensity = 2.5, fade = 0.25, ...props }, fRef) => {
  const material = useRef(null)
  const geometry = useMemo(wedgeGeometry, [])
  const { width, height } = useThree((state) => state.viewport)
  // calculate the maximum length the rainbow has to have to reach all screen corners
  const length = Math.hypot(width, height) + 1.5 // add 1.5 to due motion of the rainbow
  
  useFrame((state, delta) => {
    if (material.current) {
      material.current.time += delta * material.current.speed;
      // Update the lightMode uniform
      material.current.lightMode = lightMode;
    }
  });
  
  // Dynamic blending based on background mode
  // Use additive for dark backgrounds (traditional), normal for light backgrounds (shader-handled)
  const blendingMode = lightMode ? THREE.NormalBlending : THREE.AdditiveBlending;
  
  return (
    <mesh ref={fRef} scale={[length, length, 1]} geometry={geometry} {...props}>
      <rainbowMaterial 
        ref={material} 
        key={RainbowMaterial.key} 
        fade={fade} 
        startRadius={startRadius} 
        endRadius={endRadius} 
        ratio={1} 
        toneMapped={false}
        blending={blendingMode}
        transparent={true}
        lightMode={lightMode}
        lightSat={lightTheme.rainbow.sat}
        lightGain={lightTheme.rainbow.gain}
      />
    </mesh>
  )
})
