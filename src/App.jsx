import { lazy, Suspense, useEffect, useState, useMemo } from 'react';
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
    if (!hash || !categories.includes(hash)) return;
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
  // While someone reads, on the strip or down in the record, the scene steps back to a third of its
  // strength so it doesn't compete with the text. Play mode is the prism's own screen, so it stays bright.
  const [stripReading, setStripReading] = useState(false);
  const dimScene = !isPlayMode && (handedOver || stripReading);

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
            dim={dimScene}
          />
        </Suspense>
        
        {/* One contact button, always on screen */}
        <ContactButton lightMode={lightMode} />

        {/* UI Overlay Layer */}
        <div className={`layout__ui${handedOver ? ' layout__ui--reading' : ''}`}>
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
            <Spectrograph lightMode={lightMode} handedOver={handedOver} onBand={setFocusBand} onReading={setStripReading} />
            
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
