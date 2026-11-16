import { useState } from 'react';
import { initialLight, writeStoredMode } from './colorMode';

/**
 * Light or dark for this visit.
 * A stored choice wins. With nothing stored, a light system starts light and anything else stays dark.
 * The choice is written only when the reader toggles, so a later system change still applies until then.
 * @returns {Object} lightMode state and toggle function
 */
const useLightMode = () => {
  const [lightMode, setLightMode] = useState(initialLight);

  const toggleLightMode = () => {
    setLightMode((prev) => {
      const next = !prev;
      writeStoredMode(next);
      return next;
    });
  };

  return {
    lightMode,
    toggleLightMode,
  };
};

export default useLightMode;
