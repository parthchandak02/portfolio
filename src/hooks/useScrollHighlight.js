import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to track the visible category for sidebar highlighting
 * (decoupled from card expansion logic for better performance)
 */
// The hero strip hands over to the band bar once its top reaches this many px below the top of the screen.
// At 43 the strip's hairline sits exactly on the bar's, so the hand-off morph moves lines along one line.
export const STICK_AT = 43;

// The card you are on is the one in the middle of what you can see: between the band bar (with its veil)
// and the bottom of the screen.
const BAR_CLEARANCE = 110;
export const readingLineOf = (scroller) => {
  const r = scroller.getBoundingClientRect();
  return (r.top + BAR_CLEARANCE + r.bottom) / 2;
};

// Scroll so a card sits on the reading line and is the one lit. Tiles side by side share the line in turn,
// left to right (see measure below), so a tile is brought to its own share of the row.
export const scrollCardToLine = (target, scroller) => {
  const rect = target.getBoundingClientRect();
  const row = Array.from(document.querySelectorAll('.timeline__item[data-category]'))
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter((x) => x.r.height && Math.abs(x.r.top - rect.top) < 2)
    .sort((a, b) => a.r.left - b.r.left);
  const n = Math.max(1, row.length);
  const k = Math.max(0, row.findIndex((x) => x.el === target));
  const top = Math.min(rect.top, ...row.map((x) => x.r.top));
  const bottom = Math.max(rect.bottom, ...row.map((x) => x.r.bottom));
  // A block taller than most of the screen (the Lab) is brought in by its top, just under the bar, rather
  // than centred on the reading line, which would land in its middle
  const view = scroller.getBoundingClientRect();
  if (bottom - top > (view.height - BAR_CLEARANCE) * 0.7) {
    scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + top - (view.top + BAR_CLEARANCE)), behavior: 'smooth' });
    return;
  }
  const anchor = top + ((bottom - top) * (k + 0.5)) / n;
  scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + anchor - readingLineOf(scroller)), behavior: 'smooth' });
};

const useScrollHighlight = (activeFilter) => {
  const [visible, setVisible] = useState({ category: 'all', title: null });
  const frameRef = useRef(0);
  const lastKeyRef = useRef('all|');

  const measure = useCallback(() => {
    frameRef.current = 0;
    const timelineItems = document.querySelectorAll('.timeline__item[data-category]');
    if (timelineItems.length === 0) {
      return;
    }

    const scrollContainer = document.querySelector('.main-content-scroll');
    if (!scrollContainer) {
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    // The card on the reading line, mid-screen, is the one you are on. Jumps land cards on it too.
    let readingLine = readingLineOf(scrollContainer);
    // The last cards can never scroll up to that line, so over the final stretch the line glides down
    // to meet them, reaching the last card just as the page bottoms out
    const remaining = scrollContainer.scrollHeight - scrollContainer.clientHeight - scrollContainer.scrollTop;
    const target = timelineItems[timelineItems.length - 1].getBoundingClientRect().bottom - remaining - 12;
    if (target > readingLine && remaining < target - readingLine) readingLine = target - remaining;

    // The bar takes over from the hero strip at the strip's own spot: while the strip is still on its way
    // up the bar stays away, and scrolling back up hands the spot back to the strip. With the lanes open,
    // the hand-off waits for the last lane, so the bar and the lanes are never on screen together.
    const stage = document.querySelector('.spectro__stage');
    let stuck = scrollContainer.scrollTop > 40;
    if (stage) {
      const rowH = parseFloat(getComputedStyle(stage).getPropertyValue('--row-h')) || 46;
      stuck = stage.getBoundingClientRect().bottom - rowH <= containerRect.top + STICK_AT;
    }
    if (!stuck) {
      setVisible((prev) => (prev.category === 'all' ? prev : { category: 'all', title: null }));
      lastKeyRef.current = 'all|';
      return;
    }

    const timelineRect = (line) => timelineItems[0].getBoundingClientRect().top > line;
    let centermostCategory = 'all';
    let centermostTitle = null;
    let smallestDistance = Infinity;
    const crossing = [];

    timelineItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top <= readingLine && rect.bottom >= readingLine) crossing.push({ item, rect });

      // Otherwise (the line is in a gap) fall back to the closest card
      const distance = Math.abs(rect.top + rect.height * 0.5 - readingLine);
      const itemVisibleHeight = Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top);
      if (itemVisibleHeight / rect.height > 0.15 && distance < smallestDistance) {
        smallestDistance = distance;
        centermostCategory = item.getAttribute('data-category') || 'all';
        centermostTitle = item.getAttribute('data-title');
      }
    });

    // Tiles side by side cross the line together. Hand the row's height out among them, left to right,
    // so scrolling through the row walks the highlight across it and every tile gets its turn.
    let onLine = null;
    if (crossing.length === 1) onLine = crossing[0].item;
    else if (crossing.length > 1) {
      crossing.sort((a, b) => a.rect.left - b.rect.left);
      const top = Math.min(...crossing.map((c) => c.rect.top));
      const bottom = Math.max(...crossing.map((c) => c.rect.bottom));
      const progress = (readingLine - top) / Math.max(1, bottom - top);
      onLine = crossing[Math.min(crossing.length - 1, Math.floor(progress * crossing.length))].item;
    }

    if (onLine) {
      centermostCategory = onLine.getAttribute('data-category') || 'all';
      centermostTitle = onLine.getAttribute('data-title');
    } else if (centermostCategory === 'all') {
      // Above the first card (still in the hero) show the first band; below the last card keep the last
      const edge = timelineRect(readingLine) ? timelineItems[0] : timelineItems[timelineItems.length - 1];
      centermostCategory = edge.getAttribute('data-category') || 'all';
      centermostTitle = timelineRect(readingLine) ? null : edge.getAttribute('data-title');
    }

    // Selected work is a single row on a wide screen, so the reading line passes it while its tiles are still
    // in full view. While they are, the bar keeps saying Selected work rather than naming the card below.
    const selected = document.getElementById('selected');
    if (selected && centermostCategory !== 'selected') {
      const r = selected.getBoundingClientRect();
      if (r.top < readingLine && r.bottom > containerRect.top + BAR_CLEARANCE + 60) {
        centermostCategory = 'selected';
        centermostTitle = null;
      }
    }

    // Only update if category changed (reduce unnecessary re-renders)
    const key = `${centermostCategory}|${centermostTitle}`;
    if (key !== lastKeyRef.current) {
      lastKeyRef.current = key;
      setVisible({ category: centermostCategory, title: centermostTitle });
    }
  }, []);

  // At most one measurement per frame, always of the latest scroll position. (Dropping events instead
  // left the bar showing at the top after a fast flick up: the event that reached the top was thrown away.)
  const updateVisibleCategory = useCallback(() => {
    if (!frameRef.current) frameRef.current = requestAnimationFrame(measure);
  }, [measure]);

  useEffect(() => {
    // Reset when not in 'all' mode
    if (activeFilter !== 'all') {
      setVisible({ category: activeFilter, title: null });
      return;
    }

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(() => {
      const scrollContainer = document.querySelector('.main-content-scroll');
      if (!scrollContainer) {
        return;
      }
      
      // Add scroll listener
      scrollContainer.addEventListener('scroll', updateVisibleCategory);
      
      // Add resize listener in case viewport changes
      window.addEventListener('resize', updateVisibleCategory);
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timeout);
      const scrollContainer = document.querySelector('.main-content-scroll');
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', updateVisibleCategory);
      }
      window.removeEventListener('resize', updateVisibleCategory);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
  }, [activeFilter, updateVisibleCategory]);

  return {
    visibleCategory: visible.category,
    visibleTitle: visible.title
  };
};

export default useScrollHighlight; 