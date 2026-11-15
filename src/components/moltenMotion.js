import { CLOSE_MS, CONDENSE, GLASS_CLOSE_EASE } from '../hooks/glassMotion.js';

/**
 * Start the melt-out closing animations on Molten's outer and inner elements.
 */
export function startMoltenClose(
  closingRef,
  outer,
  inner,
  fromHeight,
  onFinish
) {
  if (closingRef.current) {
    closingRef.current.outer?.cancel();
    closingRef.current.inner?.cancel();
  }
  const innerAnim =
    inner?.animate(CONDENSE.slice().reverse(), {
      duration: CLOSE_MS,
      easing: GLASS_CLOSE_EASE,
      fill: 'forwards',
    }) ?? null;
  const outerAnim = outer.animate(
    [
      { height: `${fromHeight}px`, opacity: 1 },
      { height: '0px', opacity: 0 },
    ],
    { duration: CLOSE_MS, easing: GLASS_CLOSE_EASE, fill: 'forwards' }
  );
  const handle = { outer: outerAnim, inner: innerAnim };
  closingRef.current = handle;
  outerAnim.onfinish = () => {
    if (closingRef.current === handle) {
      closingRef.current = null;
      onFinish?.();
    }
  };
  return handle;
}

/**
 * Cancel an in-progress Molten close before reopening, returning the live
 * height captured while the closing animation was still active (or null).
 */
export function cancelMoltenClose(closingRef, outer) {
  const handle = closingRef.current;
  if (!handle) return null;
  // Read live mid-close height before cancelling the outer animation snaps it back.
  const liveHeight = outer.getBoundingClientRect().height;
  handle.outer?.cancel();
  handle.inner?.cancel();
  closingRef.current = null;
  return liveHeight;
}
