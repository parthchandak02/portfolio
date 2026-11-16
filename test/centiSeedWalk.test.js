// Centi-seed only steps the way it is facing (src/components/centiSeedRobot.js).
// follow() turns the body around when the sun is more than 0.6 away. The walk
// used to take any smaller gap too, so a nearer sun behind the robot made it
// walk backward. Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldStep } from '../src/components/centiSeedRobot.js';

test('a short step forward is taken, and a tiny gap is not', () => {
  assert.equal(shouldStep(0.4, 0), true);
  assert.equal(shouldStep(0.05, 0), false);
  assert.equal(shouldStep(0, 0), false);
});

test('a sun behind the robot is not a step until the body has turned around', () => {
  // Facing right (aim 0). The sun is 0.4 to the left, inside the 0.6 turn
  // threshold, so the body has not been told to turn. Stepping would walk it
  // backward.
  assert.equal(shouldStep(-0.4, 0), false);
  assert.equal(shouldStep(-0.7, 0), false);

  // Once follow() has aimed the body left, the same sun is a forward step.
  assert.equal(shouldStep(-0.4, Math.PI), true);
  assert.equal(shouldStep(-0.7, Math.PI), true);

  // Facing left, a sun to the right waits for the turn as well.
  assert.equal(shouldStep(0.4, Math.PI), false);
  assert.equal(shouldStep(0.7, 0), true);
});
