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
    // Reading happens in the upper part of the screen, so follow the card nearest that line
    const viewportCenter = containerRect.top + containerRect.height * 0.35;

    // Check if timeline is meaningfully visible
    const timeline = document.querySelector('.timeline');
    if (timeline) {
      const timelineRect = timeline.getBoundingClientRect();
      const timelineVisibleHeight = Math.min(timelineRect.bottom, containerRect.bottom) - Math.max(timelineRect.top, containerRect.top);
      const timelineVisibilityRatio = timelineVisibleHeight / timelineRect.height;
      
      if (timelineVisibilityRatio < 0.05) {
        setVisible((prev) => (prev.category === 'all' ? prev : { category: 'all', title: null }));
        lastKeyRef.current = 'all|';
        return;
      }
    }

    let centermostCategory = 'all';
    let centermostTitle = null;
    let smallestDistance = Infinity;

    // Find the category of the item closest to viewport center
    timelineItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height * 0.5;
      const distanceFromCenter = Math.abs(itemCenter - viewportCenter);

      const itemVisibleHeight = Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top);
      const itemVisibilityRatio = itemVisibleHeight / rect.height;

      if (itemVisibilityRatio > 0.15 && distanceFromCenter < smallestDistance) {
        smallestDistance = distanceFromCenter;
        centermostCategory = item.getAttribute('data-category') || 'all';
        centermostTitle = item.getAttribute('data-title');
      }
    });

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