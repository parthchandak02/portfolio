import { useState } from 'react';

/**
 * Custom hook for managing light/dark mode state
 * @param {boolean} initialValue - Initial state for light mode
 * @returns {Object} - Contains lightMode state and toggle function
 */
const useLightMode = (initialValue = false) => {
  const [lightMode, setLightMode] = useState(initialValue);

  const toggleLightMode = () => {
    setLightMode((prev) => !prev);
  };

  return {
    lightMode,
    toggleLightMode,
  };
};

export default useLightMode;
