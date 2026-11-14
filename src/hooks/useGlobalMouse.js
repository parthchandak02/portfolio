import { useState, useEffect, useCallback, useRef } from 'react';

const useGlobalMouse = () => {
  // Initialize with center-left position for automatic rainbow effect
  const centerLeftX = window.innerWidth * 0.15; // 15% from left edge
  const centerLeftY = window.innerHeight * 0.5; // Center vertically

  const [mousePosition, setMousePosition] = useState({
    x: centerLeftX,
    y: centerLeftY,
  });
  const [viewportPosition, setViewportPosition] = useState({
    x: (centerLeftX / window.innerWidth) * 2 - 1, // Convert to normalized coordinates
    y: -(centerLeftY / window.innerHeight) * 2 + 1,
  });

  // Lock state - when true, position is completely frozen (default: false to match play mode)
  const [isLocked, setIsLocked] = useState(false);

  const hasUserMoved = useRef(false);
  // Use ref to store the current lock state for event handlers
  const isLockedRef = useRef(false);
  // Store the frozen position when locked
  const frozenPositionRef = useRef(null);
  // Store current live viewport position for capturing when locking
  const currentViewportPositionRef = useRef({
    x: (centerLeftX / window.innerWidth) * 2 - 1,
    y: -(centerLeftY / window.innerHeight) * 2 + 1,
  });

  const updatePosition = useCallback((x, y) => {
    // CRITICAL: If locked, completely ignore ALL mouse input
    if (isLockedRef.current) {
      return;
    }

    hasUserMoved.current = true;

    const normalizedX = (x / window.innerWidth) * 2 - 1;
    const normalizedY = -(y / window.innerHeight) * 2 + 1;

    // Update both positions
    setMousePosition({ x, y });
    setViewportPosition({ x: normalizedX, y: normalizedY });

    // Always keep track of current live position
    currentViewportPositionRef.current = { x: normalizedX, y: normalizedY };
  }, []); // No dependencies needed

  // Helper function to identify UI elements that shouldn't affect ray tracking
  const isUIElement = useCallback((element) => {
    if (!element) return false;

    // Check if the element or any parent is the lock toggle
    let current = element;
    while (current && current !== document.body) {
      if (current.classList && current.classList.contains('lock-toggle')) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }, []);

  const updateMousePosition = useCallback(
    (e) => {
      // Ignore mouse events from UI elements
      if (isUIElement(e.target)) return;
      updatePosition(e.clientX, e.clientY);
    },
    [updatePosition, isUIElement]
  );

  const updateTouchPosition = useCallback(
    (e) => {
      // Ignore touch events from UI elements
      if (isUIElement(e.target)) return;
      const touch = e.touches[0] || e.changedTouches[0];
      if (touch) {
        updatePosition(touch.clientX, touch.clientY);
      }
    },
    [updatePosition, isUIElement]
  );

  const setAutomaticPosition = useCallback((pixelX, pixelY) => {
    if (hasUserMoved.current || isLockedRef.current) return;

    const normalizedX = (pixelX / window.innerWidth) * 2 - 1;
    const normalizedY = -(pixelY / window.innerHeight) * 2 + 1;

    setMousePosition({ x: pixelX, y: pixelY });
    setViewportPosition({ x: normalizedX, y: normalizedY });

    // Update current position ref
    currentViewportPositionRef.current = { x: normalizedX, y: normalizedY };
  }, []);

  // Fixed lock toggle - no circular dependency on viewportPosition
  const toggleLock = useCallback(() => {
    setIsLocked((prev) => {
      const newLockState = !prev;
      if (newLockState) {
        // Capture current live position when locking
        frozenPositionRef.current = { ...currentViewportPositionRef.current };
      } else {
        // Clear frozen position when unlocking
        frozenPositionRef.current = null;
      }
      return newLockState;
    });
  }, []); // No dependencies needed - we use refs for current values

  // Initialize frozen position on mount since we start locked
  useEffect(() => {
    if (isLocked && !frozenPositionRef.current) {
      frozenPositionRef.current = { ...currentViewportPositionRef.current };
    }
  }, [isLocked]);

  // Update ref whenever lock state changes
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    // Initial automatic positioning
    const initTimer = setTimeout(() => {
      if (!hasUserMoved.current && !isLockedRef.current) {
        const initialX = window.innerWidth * 0.15;
        const initialY = window.innerHeight * 0.5;
        setAutomaticPosition(initialX, initialY);
      }
    }, 100);

    // Event listeners - only attach once, not dependent on lock state
    document.addEventListener('mousemove', updateMousePosition, {
      passive: true,
    });
    document.addEventListener('touchstart', updateTouchPosition, {
      passive: true,
    });
    document.addEventListener('touchmove', updateTouchPosition, {
      passive: true,
    });

    return () => {
      clearTimeout(initTimer);
      document.removeEventListener('mousemove', updateMousePosition);
      document.removeEventListener('touchstart', updateTouchPosition);
      document.removeEventListener('touchmove', updateTouchPosition);
    };
  }, [updateMousePosition, updateTouchPosition, setAutomaticPosition]);

  // Calculate the return value - return frozen position when locked, live position when unlocked
  const returnedPosition =
    isLocked && frozenPositionRef.current
      ? frozenPositionRef.current
      : viewportPosition;

  return {
    mousePosition,
    viewportPosition: returnedPosition,
    setAutomaticPosition,
    hasUserMoved: hasUserMoved.current,
    isLocked,
    toggleLock,
    lockedPosition: null, // Simplified - not needed with this approach
  };
};

export default useGlobalMouse;
