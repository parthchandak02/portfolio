import { useState, useEffect, useCallback, useRef } from 'react';
import {
  STICK_AT,
  readingLineFromRect,
  glideReadingLine,
  rowHeightOf,
  barIsStuck,
  cardOnLine,
  scrollTopForCard,
} from './scrollReading';

export { STICK_AT };

/**
 * Custom hook to track the visible category for sidebar highlighting
 * (decoupled from card expansion logic for better performance)
 */
export const readingLineOf = (scroller) =>
  readingLineFromRect(scroller.getBoundingClientRect());

// Scroll so a card sits on the reading line and is the one lit.
export const scrollCardToLine = (target, scroller, behavior = 'smooth') => {
  const rect = target.getBoundingClientRect();
  const row = Array.from(
    document.querySelectorAll('.timeline__item[data-category]')
  )
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter((x) => x.r.height && Math.abs(x.r.top - rect.top) < 2)
    .sort((a, b) => a.r.left - b.r.left)
    .map((x) => ({
      top: x.r.top,
      bottom: x.r.bottom,
      isTarget: x.el === target,
    }));
  const view = scroller.getBoundingClientRect();
  scroller.scrollTo({
    top: scrollTopForCard({
      rect,
      row,
      view,
      scrollTop: scroller.scrollTop,
      line: readingLineOf(scroller),
    }),
    behavior,
  });
};

const useScrollHighlight = (activeFilter) => {
  const [visible, setVisible] = useState({ category: 'all', title: null });
  const frameRef = useRef(0);
  const lastKeyRef = useRef('all|');

  const measure = useCallback(() => {
    frameRef.current = 0;
    const timelineItems = document.querySelectorAll(
      '.timeline__item[data-category]'
    );
    if (timelineItems.length === 0) {
      return;
    }

    const scrollContainer = document.querySelector('.main-content-scroll');
    if (!scrollContainer) {
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    // The card on the reading line, mid-screen, is the one you are on. Jumps land cards on it too.
    const remaining =
      scrollContainer.scrollHeight -
      scrollContainer.clientHeight -
      scrollContainer.scrollTop;
    const readingLine = glideReadingLine(
      readingLineOf(scrollContainer),
      remaining,
      timelineItems[timelineItems.length - 1].getBoundingClientRect().bottom
    );

    const stage = document.querySelector('.spectro__stage');
    const stuck = barIsStuck({
      scrollTop: scrollContainer.scrollTop,
      stage: stage
        ? {
            bottom: stage.getBoundingClientRect().bottom,
            rowH: rowHeightOf(
              getComputedStyle(stage).getPropertyValue('--row-h')
            ),
            containerTop: containerRect.top,
          }
        : null,
    });
    if (!stuck) {
      setVisible((prev) =>
        prev.category === 'all' ? prev : { category: 'all', title: null }
      );
      lastKeyRef.current = 'all|';
      return;
    }

    const items = Array.from(timelineItems).map((item) => {
      const rect = item.getBoundingClientRect();
      return {
        category: item.getAttribute('data-category'),
        title: item.getAttribute('data-title'),
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        height: rect.height,
      };
    });
    const { category, title } = cardOnLine({
      items,
      scroll: { top: containerRect.top, bottom: containerRect.bottom },
      line: readingLine,
      drawers: () =>
        Array.from(document.querySelectorAll('.tile-drawer')).map((d) => {
          const r = d.getBoundingClientRect();
          const owner = d.parentElement?.querySelector(
            '.timeline__item.is-open[data-category]'
          );
          return {
            top: r.top,
            bottom: r.bottom,
            owner: Boolean(owner),
            category: owner && owner.getAttribute('data-category'),
            title: owner && owner.getAttribute('data-title'),
          };
        }),
      selected: () => {
        const el = document.getElementById('selected');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      },
    });

    // Only update if category changed (reduce unnecessary re-renders)
    const key = `${category}|${title}`;
    if (key !== lastKeyRef.current) {
      lastKeyRef.current = key;
      setVisible({ category, title });
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
      return undefined;
    }

    const scrollContainer = document.querySelector('.main-content-scroll');
    if (!scrollContainer) {
      return undefined;
    }

    scrollContainer.addEventListener('scroll', updateVisibleCategory, {
      passive: true,
    });
    window.addEventListener('resize', updateVisibleCategory);
    measure();
    const t1 = setTimeout(measure, 80);
    const t2 = setTimeout(measure, 220);

    const timeline = document.querySelector('.timeline');
    const ro =
      typeof ResizeObserver !== 'undefined' && timeline
        ? new ResizeObserver(updateVisibleCategory)
        : null;
    if (ro) ro.observe(timeline);

    // Cleanup
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      scrollContainer.removeEventListener('scroll', updateVisibleCategory);
      window.removeEventListener('resize', updateVisibleCategory);
      if (ro) ro.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
  }, [activeFilter, updateVisibleCategory, measure]);

  return {
    visibleCategory: visible.category,
    visibleTitle: visible.title,
  };
};

export default useScrollHighlight;
