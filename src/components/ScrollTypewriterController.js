import { useEffect, useCallback } from 'react';
import { useTypewriterHighlight } from '../contexts/TypewriterHighlightContext';

/**
 * Component that detects scroll position and controls typewriter highlighting
 * Must be used inside TypewriterHighlightProvider
 */
const ScrollTypewriterController = () => {
  const { setUserActivity } = useTypewriterHighlight();

  const handleScroll = useCallback(() => {
    const scrollContainer = document.querySelector('.main-content-scroll');
    if (!scrollContainer) return;

    const scrollTop = scrollContainer.scrollTop;

    // If user has scrolled more than 100px, disable typewriter highlighting
    // If at the top (less than 100px), enable typewriter highlighting
    setUserActivity(scrollTop > 100);
  }, [setUserActivity]);

  useEffect(() => {
    const scrollContainer = document.querySelector('.main-content-scroll');
    if (!scrollContainer) return;

    // Add scroll listener
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // Check initial scroll position
    handleScroll();

    // Cleanup
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // This component doesn't render anything
  return null;
};

export default ScrollTypewriterController;
