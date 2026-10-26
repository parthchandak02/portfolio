import { lazy, Suspense, useEffect, useRef, useState, useMemo } from 'react';
import './styles.css';
import Layout from './components/Layout';
// GlassNavigation removed - replaced with white space placeholder
import LightToggle from './components/LightToggle';
import LockToggle from './components/LockToggle';
import PlayModeToggle from './components/PlayModeToggle';
import Timeline from './components/Timeline';
import BandBar from './components/BandBar';
import ContactButton from './components/ContactButton';
import UITypewriter from './components/UITypewriter';
import useLightMode from './hooks/useLightMode';
import useGlobalMouse from './hooks/useGlobalMouse';
import useScrollHighlight, { scrollCardToLine } from './hooks/useScrollHighlight';
import { timelineData } from './data/timelineData';
import { bandForSection } from './data/spectrum';
import { TypewriterHighlightProvider } from './contexts/TypewriterHighlightContext';
import ScrollTypewriterController from './components/ScrollTypewriterController';
import Spectrograph from './components/Spectrograph';

// three.js is most of the download, so the scene loads on its own and the text doesn't wait for it
const Canvas3D = lazy(() => import('./components/Canvas3D'));

const VISITED_KEY = 'pc-has-visited';

// First visit opens play mode; later visits open the record. Storage can be blocked, so default to play.
const isReturningVisitor = () => {
  try {
    return window.localStorage.getItem(VISITED_KEY) === '1';
  } catch (e) {
    return false;
  }
};

const markVisited = () => {
  try {
    window.localStorage.setItem(VISITED_KEY, '1');
  } catch (e) {
    // ignore: the visit just isn't remembered
  }
};

/**
 * Main App component - Clean, modular structure following React 2024 best practices
 * 
 * Features:
 * - Modular component structure
 * - Separation of concerns (UI, 3D, logic)
 * - Custom hooks for state management
 * - CSS modules for styling
 * - Reusable components
 * - Light beam lock/unlock functionality
 * - Responsive sidebar layout with timeline filters and social links
 * - Fast typewriter effect in UI layer
 */
export default function App() {
  const { lightMode, toggleLightMode } = useLightMode(false);
  // Single source of truth for all mouse state
  const { isLocked, toggleLock, viewportPosition } = useGlobalMouse();
  
  // Play mode state - toggle between interactive mode and resume reading mode.
  // First visit: play mode. Returning visitors, and anyone arriving on a #section link, get the record.
  const [isPlayMode, setIsPlayMode] = useState(() => !isReturningVisitor() && !window.location.hash);
  const togglePlayMode = () => {
    const newPlayMode = !isPlayMode;
    setIsPlayMode(newPlayMode);
    // The playground and the way back both start from the top of the page
    document.querySelector('.main-content-scroll')?.scrollTo({ top: 0 });
    
    if (newPlayMode) {
      // Entering play mode: automatically unlock the light beam for better UX
      if (isLocked) {
        toggleLock();
      }
    } else {
      // Exiting play mode (returning to resume): automatically lock to avoid distracting rainbow
      if (!isLocked) {
        toggleLock();
      }
    }
  };
  
  // Play mode hides the record, so scrolling there used to do nothing and the page felt locked. Any move
  // to scroll down, by wheel, swipe or key, opens the record instead, and the gesture carries on into it.
  const togglePlayRef = useRef(togglePlayMode);
  togglePlayRef.current = togglePlayMode;
  useEffect(() => {
    if (!isPlayMode) return undefined;
    let touchY = null;
    let done = false;
    const open = () => {
      if (done) return;
      done = true;
      togglePlayRef.current();
    };
    const onWheel = (e) => { if (e.deltaY > 4) open(); };
    const onTouchStart = (e) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e) => { if (touchY !== null && touchY - e.touches[0].clientY > 30) open(); };
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, [contenteditable]')) return;
      if (['ArrowDown', 'PageDown', 'End', ' '].includes(e.key) && !e.target.closest?.('button, a, .spectro__track')) open();
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [isPlayMode]);

  // At the very top of the page the play button keeps its label up, so the prism's own screen is easy to find
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    const scroller = document.querySelector('.main-content-scroll');
    if (!scroller) return undefined;
    const onScroll = () => setAtTop(scroller.scrollTop < 24);
    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [isPlayMode]);

  // Get unique categories for filter buttons (excluding 'all')
  const categories = useMemo(() => {
    return [...new Set(timelineData.map(item => item.category?.toLowerCase()).filter(Boolean))];
  }, []);

  // Resume mode starts with the beam locked, matching what the toggle does at runtime
  useEffect(() => {
    markVisited();
    if (!isPlayMode && !isLocked) {
      toggleLock();
    }
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // #section links: show the record, then scroll the section into view
  const [hash, setHash] = useState(() => window.location.hash.slice(1));
  useEffect(() => {
    const onHash = () => setHash(window.location.hash.slice(1));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!hash || !(categories.includes(hash) || hash === 'selected')) return;
    if (isPlayMode) {
      togglePlayMode();
      return;
    }
    // Measure once the web fonts are in: text set in a fallback font has other heights and the jump lands off
    let cancelled = false;
    const timer = setTimeout(() => document.fonts.ready.then(() => {
      const target = document.getElementById(hash);
      const scroller = document.querySelector('.main-content-scroll');
      // The section's first card lands mid-screen, on the reading line, so it is the one lit
      if (!cancelled && target && scroller) scrollCardToLine(target, scroller);
    }), 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // togglePlayMode is recreated each render; hash and mode are the real triggers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, isPlayMode]);

  // The band picked on the spectrograph, lit in the prism's rainbow
  const [focusBand, setFocusBand] = useState(null);

  // Which section and card is in view, for the sticky band bar
  const { visibleCategory, visibleTitle } = useScrollHighlight('all');
  // Once the band bar takes over from the strip, the round buttons step aside; they belong to the top screen
  const handedOver = !isPlayMode && visibleCategory !== 'all';
  // The rainbow lights the band you are reading in the record, or the one picked on the strip above it
  const litBand = handedOver ? bandForSection(visibleCategory) : focusBand;

  // Sync html and body background with light mode to prevent edge bleeding
  useEffect(() => {
    const className = lightMode ? 'light-mode' : 'dark-mode';
    document.documentElement.className = className;
    document.body.className = className;
  }, [lightMode]);

  return (
    <TypewriterHighlightProvider>
      <ScrollTypewriterController />
      <Layout 
        lightMode={lightMode}
        darkMode={!lightMode}
      >
        {/* 3D Canvas Background */}
        <Suspense fallback={null}>
          <Canvas3D
            lightMode={lightMode}
            viewportPosition={viewportPosition}
            isLocked={isLocked}
            focusWave={litBand?.wave ?? null}
          />
        </Suspense>
        
        {/* One contact button, always on screen */}
        <ContactButton lightMode={lightMode} away={isPlayMode} />

        {/* UI Overlay Layer */}
        <div className={`layout__ui${handedOver ? ' layout__ui--reading' : ''}${atTop ? ' layout__ui--top' : ''}${isPlayMode ? ' layout__ui--play' : ''}`}>
          {/* Fixed UI Components */}
          <LightToggle lightMode={lightMode} onToggle={toggleLightMode} />
          <LockToggle isLocked={isLocked} onToggle={toggleLock} />
          <PlayModeToggle isPlayMode={isPlayMode} onToggle={togglePlayMode} />
          {!isPlayMode && <BandBar category={visibleCategory} title={visibleTitle} lightMode={lightMode} />}
          
          {/* Main Content Area - Typewriter always shows, other content conditional */}
          <div className="main-content-scroll">
            {/* Typewriter that always shows regardless of play mode */}
            <UITypewriter lightMode={lightMode} />

            {/* Record spectrograph - visible in both modes */}
            <Spectrograph lightMode={lightMode} handedOver={handedOver} onBand={setFocusBand} />
            
            {/* Resume content - Hidden in play mode */}
            {!isPlayMode && (
              <>
                {/* Empty space container to showcase prism/rainbow effects */}
                <div className="navigation-placeholder" style={{
                  width: '100%',
                  height: '400px',
                  minHeight: '35vh',
                  marginBottom: '3rem'
                }}>
                  {/* Completely empty - just space for prism effects */}
                </div>
                <Timeline 
                 data={timelineData}
                 lightMode={lightMode}
                 currentTitle={handedOver ? visibleTitle : null}
                 className="timeline-in-scroll"
               />
              </>
            )}
          </div>
        </div>
      </Layout>
    </TypewriterHighlightProvider>
  );
}
