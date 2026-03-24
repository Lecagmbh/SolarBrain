/**
 * usePerformanceTier Hook
 * =======================
 * Determines device performance tier for 3D rendering
 */

import { useState, useEffect } from 'react';
import type { PerformanceTier, WebGLCapabilities } from '../types';
import { PERFORMANCE_TIERS } from '../constants';
import { detectWebGLCapabilities } from './useWebGLSupport';

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function isLowEndGPU(renderer: string): boolean {
  const lowEndPatterns = [
    'intel',
    'mesa',
    'llvmpipe',
    'swiftshader',
    'software',
    'microsoft basic',
  ];
  const lowerRenderer = renderer.toLowerCase();
  return lowEndPatterns.some(pattern => lowerRenderer.includes(pattern));
}

export function determinePerformanceTier(
  capabilities: WebGLCapabilities,
  isMobile: boolean
): PerformanceTier {
  // No WebGL = fallback
  if (!capabilities.supported) {
    return PERFORMANCE_TIERS.fallback;
  }

  // Mobile or low-end GPU = low tier
  if (isMobile || isLowEndGPU(capabilities.renderer)) {
    return PERFORMANCE_TIERS.low;
  }

  // WebGL 2 with good specs = high tier
  if (
    capabilities.version === 2 &&
    capabilities.maxTextureSize >= 8192 &&
    capabilities.maxVertexUniforms >= 1024
  ) {
    return PERFORMANCE_TIERS.high;
  }

  // Everything else = medium tier
  return PERFORMANCE_TIERS.medium;
}

export function usePerformanceTier(): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>(PERFORMANCE_TIERS.medium);

  useEffect(() => {
    const capabilities = detectWebGLCapabilities();
    const isMobile = isMobileDevice();
    setTier(determinePerformanceTier(capabilities, isMobile));
  }, []);

  return tier;
}

export default usePerformanceTier;
