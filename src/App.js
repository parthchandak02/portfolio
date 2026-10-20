import { useEffect, useState, useMemo } from 'react';
import Layout from './components/Layout';
import Canvas3D from './components/Canvas3D';
// GlassNavigation removed - replaced with white space placeholder
import LightToggle from './components/LightToggle';
import LockToggle from './components/LockToggle';
import PlayModeToggle from './components/PlayModeToggle';
import Timeline from './components/Timeline';
import BandBar from './components/BandBar';
import RightSidebar from './components/RightSidebar';
import UITypewriter from './components/UITypewriter';
import useLightMode from './hooks/useLightMode';
import useGlobalMouse from './hooks/useGlobalMouse';
import useScrollHighlight from './hooks/useScrollHighlight';
import { timelineData } from './data/timelineData';
import { TypewriterHighlightProvider } from './contexts/TypewriterHighlightContext';
import ScrollTypewriterController from './components/ScrollTypewriterController';
import Spectrograph from './components/Spectrograph';

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
    const timer = setTimeout(() => {
      const target = document.getElementById(hash);
      const scroller = document.querySelector('.main-content-scroll');
      if (target && scroller) {
        const top = scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 100;
        scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }, 150);
    return () => clearTimeout(timer);
    // togglePlayMode is recreated each render; hash and mode are the real triggers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, isPlayMode]);

  // Which section and card is in view, for the sticky band bar
  const { visibleCategory, visibleTitle } = useScrollHighlight('all');

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
        rightSidebar={!isPlayMode ? (
          <RightSidebar
            lightMode={lightMode}
          />
        ) : null}
      >
        {/* 3D Canvas Background */}
        <Canvas3D 
          lightMode={lightMode} 
          viewportPosition={viewportPosition} 
          isLocked={isLocked}
        />
        
        {/* UI Overlay Layer */}
        <div className="layout__ui">
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
            <Spectrograph lightMode={lightMode} />
            
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
