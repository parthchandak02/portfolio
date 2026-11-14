import * as THREE from 'three';

export function lerp(object, prop, goal, speed = 0.1) {
  object[prop] = THREE.MathUtils.lerp(object[prop], goal, speed);
}

const color = new THREE.Color();
export function lerpC(value, goal, speed = 0.1) {
  value.lerp(color.set(goal), speed);
}

const vector = new THREE.Vector3();
export function lerpV3(value, goal, speed = 0.1) {
  value.lerp(vector.set(...goal), speed);
}

export function calculateRefractionAngle(
  incidentAngle,
  glassIor = 2.5,
  airIor = 1.000293
) {
  const theta = Math.asin((airIor * Math.sin(incidentAngle)) / glassIor) || 0;
  return theta;
}

/**
 * Dynamically balance sidebar widths by measuring the left sidebar
 * and setting a CSS custom property for the right sidebar's margin
 */
// Removed unused balanceSidebarWidths function

// Removed unused setupSidebarBalancing function

// Removed unused showCenteringGuides function

// Removed all debugging functions - they were unused
