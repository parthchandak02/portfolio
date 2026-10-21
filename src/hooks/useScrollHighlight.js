import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to track the visible category for sidebar highlighting
 * (decoupled from card expansion logic for better performance)
 */
// The hero strip hands over to the band bar once its top reaches this many px below the top of the screen.
// At 43 the strip's hairline sits exactly on the bar's, so the hand-off morph moves lines along one line.
export const STICK_AT = 43;

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
    // Reading happens just under the band bar, which is also where jumps land a card.
    // The card on that line is the one you are on.
    const readingLine = containerRect.top + 170;

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
    let onLine = null;

    timelineItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top <= readingLine && rect.bottom >= readingLine) onLine = item;

      // Otherwise (the line is in a gap) fall back to the closest card
      const distance = Math.abs(rect.top + rect.height * 0.5 - readingLine);
      const itemVisibleHeight = Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top);
      if (itemVisibleHeight / rect.height > 0.15 && distance < smallestDistance) {
        smallestDistance = distance;
        centermostCategory = item.getAttribute('data-category') || 'all';
        centermostTitle = item.getAttribute('data-title');
      }
    });

    if (onLine) {
      centermostCategory = onLine.getAttribute('data-category') || 'all';
      centermostTitle = onLine.getAttribute('data-title');
    } else if (centermostCategory === 'all') {
      // Above the first card (still in the hero) show the first band; below the last card keep the last
      const edge = timelineRect(readingLine) ? timelineItems[0] : timelineItems[timelineItems.length - 1];
      centermostCategory = edge.getAttribute('data-category') || 'all';
      centermostTitle = timelineRect(readingLine) ? null : edge.getAttribute('data-title');
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