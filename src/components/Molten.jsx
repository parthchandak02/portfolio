import { useLayoutEffect, useRef, useState } from 'react';
import { CLOSE_MS, CONDENSE, GLASS_CLOSE_EASE, GLASS_EASE, OPEN_MS, reducedMotion } from '../hooks/glassMotion';
import './Molten.css';

/**
 * Glass that forms as it opens (see hooks/glassMotion). Opening, the space flows open to the content's height
 * while the content condenses out of a blur and a soft sheen runs down the glass; when `contentKey` changes
 * the glass flows to the new height and the new content condenses in its place; closing melts it back to
 * nothing before it leaves the page.
 */
const Molten = ({ open, contentKey, className = '', style, children, ...rest }) => {
  const outer = useRef(null);
  const inner = useRef(null);
  const sheen = useRef(null);
  const [mounted, setMounted] = useState(open);
  const lastChildren = useRef(children);
  const height = useRef(0); // the height it last settled at; 0 while closed
  const closing = useRef(null);
  const flowing = useRef(null);
  // Flow the glass from wherever it is now to a height
  const flow = (to, from) => {
    const o = outer.current;
    if (!o) return;
    const start = from ?? o.getBoundingClientRect().height;
    flowing.current?.cancel();
    height.current = to;
    if (Math.abs(start - to) < 1 || reducedMotion()) return;
    flowing.current = o.animate([{ height: `${start}px` }, { height: `${to}px` }], { duration: OPEN_MS, easing: GLASS_EASE });
  };
  // The height the glass needs for its content: the content plus its own border (sizes are border-box)
  const fit = () => inner.current.offsetHeight + (outer.current.offsetHeight - outer.current.clientHeight);
  if (open) lastChildren.current = children;

  if (open && !mounted) setMounted(true);

  // Open, or flow to new content
  useLayoutEffect(() => {
    const o = outer.current;
    if (!open || !o) return;
    closing.current?.cancel();
    closing.current = null;
    const from = height.current;
    flowing.current?.cancel();
    flow(fit(), from);
    if (reducedMotion()) return;
    inner.current?.animate(CONDENSE, { duration: OPEN_MS + 80, delay: from ? 40 : 90, easing: GLASS_EASE, fill: 'backwards' });
    if (!from) sheen.current?.animate([{ transform: 'translateY(-100%)', opacity: 0.9 }, { transform: 'translateY(100%)', opacity: 0 }], { duration: OPEN_MS + 260, easing: GLASS_EASE });
  }, [open, mounted, contentKey]);

  // Content that changes size once open (a picture loading, a video starting) flows the glass with it
  useLayoutEffect(() => {
    const i = inner.current;
    if (!open || !i) return undefined;
    const ro = new ResizeObserver(() => {
      const to = fit();
      if (Math.abs(to - height.current) >= 1) flow(to);
    });
    ro.observe(i);
    return () => ro.disconnect();
  }, [open, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close: melt back to nothing, then leave
  useLayoutEffect(() => {
    const o = outer.current;
    if (open || !mounted || !o) return undefined;
    const from = o.getBoundingClientRect().height;
    flowing.current?.cancel();
    height.current = 0;
    if (reducedMotion()) { setMounted(false); return undefined; }
    inner.current?.animate(CONDENSE.slice().reverse(), { duration: CLOSE_MS, easing: GLASS_CLOSE_EASE, fill: 'forwards' });
    const a = o.animate([{ height: `${from}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: CLOSE_MS, easing: GLASS_CLOSE_EASE, fill: 'forwards' });
    closing.current = a;
    a.onfinish = () => { if (closing.current === a) setMounted(false); };
    return undefined;
  }, [open, mounted]);

  if (!mounted) return null;
  return (
    <div ref={outer} className={`molten ${className}`} style={style} {...rest}>
      <div ref={inner} className="molten__inner">{open ? children : lastChildren.current}</div>
      <span ref={sheen} className="molten__sheen" aria-hidden="true" />
    </div>
  );
};

export default Molten;
