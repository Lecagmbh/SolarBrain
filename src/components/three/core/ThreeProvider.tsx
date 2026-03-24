/**
 * ThreeProvider
 * =============
 * Context provider for Three.js settings and state
 */

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { usePerformanceTier } from '../hooks/usePerformanceTier';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DEFAULT_COLORS, LIGHT_COLORS } from '../constants';
import type { ThreeContextValue, ThreeColors } from '../types';

const ThreeContext = createContext<ThreeContextValue | null>(null);

export function useThreeContext(): ThreeContextValue {
  const context = useContext(ThreeContext);
  if (!context) {
    throw new Error('useThreeContext must be used within ThreeProvider');
  }
  return context;
}

// Safe hook that returns defaults if not in provider
export function useThreeContextSafe(): ThreeContextValue | null {
  return useContext(ThreeContext);
}

interface ThreeProviderProps {
  children: React.ReactNode;
}

export const ThreeProvider: React.FC<ThreeProviderProps> = ({ children }) => {
  const performanceTier = usePerformanceTier();
  const reducedMotion = useReducedMotion();
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Watch for theme changes
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(theme !== 'light');
    };

    checkTheme();

    // Watch for attribute changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  // Compute colors based on theme
  const colors = useMemo<ThreeColors>(() => {
    if (isDarkMode) {
      return DEFAULT_COLORS;
    }
    return { ...DEFAULT_COLORS, ...LIGHT_COLORS };
  }, [isDarkMode]);

  const value = useMemo<ThreeContextValue>(
    () => ({
      performanceTier,
      reducedMotion,
      webglSupported: performanceTier.tier !== 'fallback',
      isDarkMode,
      colors,
    }),
    [performanceTier, reducedMotion, isDarkMode, colors]
  );

  return <ThreeContext.Provider value={value}>{children}</ThreeContext.Provider>;
};

export default ThreeProvider;
