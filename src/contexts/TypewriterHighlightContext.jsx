import { createContext, useContext, useState } from 'react';
import { timelineData, getTypewriterData } from '../data/timelineData';

/**
 * =============================================================================
 * TYPEWRITER HIGHLIGHT SYSTEM - FULLY INTEGRATED WITH TIMELINE DATA
 * =============================================================================
 * 
 * ✅ Typewriter data is now embedded directly in timeline cards
 * ✅ No more separate typewriter data structure
 * ✅ Single source of truth in timelineData.js
 * ✅ Cleaner architecture with no duplication
 */

// Create highlight mappings from embedded typewriter data in timeline cards
const createHighlightMappings = () => {
  const mappings = {};
  
  // Get all timeline cards that have typewriter data
  const typewriterCards = timelineData.filter(item => item.typewriterTitle);
  
  // Group cards by typewriter title
  const cardsByTitle = typewriterCards.reduce((acc, card) => {
    const title = card.typewriterTitle;
    if (!acc[title]) {
      acc[title] = [];
    }
    acc[title].push(card);
    return acc;
  }, {});

  // Create mappings for each typewriter title
  Object.entries(cardsByTitle).forEach(([title, cards]) => {
    mappings[title] = {
      skills: cards[0].skills || [],
      timelineCards: cards.map(card => card.title),
      sidebarCategories: [...new Set(cards.map(card => card.category))]
    };
  });

  return mappings;
};

const highlightMappings = createHighlightMappings();

// Create the context
const TypewriterHighlightContext = createContext();

// Provider component
export const TypewriterHighlightProvider = ({ children }) => {
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [isUserActive, setIsUserActive] = useState(false);

  // Get current highlight configuration
  const getCurrentHighlights = () => {
    if (isUserActive || !currentPhrase) {
      return { skills: [], timelineCards: [], sidebarCategories: [] };
    }
    return highlightMappings[currentPhrase] || { skills: [], timelineCards: [], sidebarCategories: [] };
  };

  // Update the current phrase (called by typewriter when phrase is complete)
  const updateCurrentPhrase = (phrase) => {
    setCurrentPhrase(phrase);
  };

  // Set user activity state (pause highlighting when user is interacting)
  const setUserActivity = (active) => {
    setIsUserActive(active);
  };

  // Get typewriter data for the UITypewriter component (now using embedded data)
  const getTypewriterDataFromContext = () => getTypewriterData();
  
  // Get full sentences for typing (generated from embedded data)
  const getFullSentences = () => {
    return getTypewriterData().map(item => `${item.prefix} ${item.title}`);
  };

  const value = {
    currentPhrase,
    updateCurrentPhrase,
    getCurrentHighlights,
    isUserActive,
    setUserActivity,
    highlightMappings,
    getTypewriterData: getTypewriterDataFromContext,
    getFullSentences
  };

  return (
    <TypewriterHighlightContext.Provider value={value}>
      {children}
    </TypewriterHighlightContext.Provider>
  );
};

// Custom hook to use the context
export const useTypewriterHighlight = () => {
  const context = useContext(TypewriterHighlightContext);
  if (!context) {
    throw new Error('useTypewriterHighlight must be used within a TypewriterHighlightProvider');
  }
  return context;
};

// Removed unused default export 