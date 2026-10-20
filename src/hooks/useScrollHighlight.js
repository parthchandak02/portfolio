import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to track the visible category for sidebar highlighting
 * (decoupled from card expansion logic for better performance)
 */
const useScrollHighlight = (activeFilter) => {
  const [visible, setVisible] = useState({ category: 'all', title: null });
  const throttleRef = useRef(false);
  const lastKeyRef = useRef('all|');

  const updateVisibleCategory = useCallback(() => {
    if (throttleRef.current) return;
    throttleRef.current = true;
    requestAnimationFrame(() => {
      setTimeout(() => { throttleRef.current = false; }, 120); // Moderate throttle for sidebar updates
    });

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

    // The bar appears with the first scroll and then stays: no leaving and coming back
    if (scrollContainer.scrollTop < 40) {
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
    };
  }, [activeFilter, updateVisibleCategory]);

  return {
    visibleCategory: visible.category,
    visibleTitle: visible.title
  };
};

export default useScrollHighlight; 