/**
 * Baunity Three.js Constants
 * ===========================
 * Design system colors and configuration
 */

import type { ThreeColors, PerformanceTier } from './types';

// Default colors from design system
export const DEFAULT_COLORS: ThreeColors = {
  primary: '#D4A843',
  secondary: '#EAD068',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  background: '#060b18',
  surface: 'rgba(255, 255, 255, 0.02)',
  pipelineDraft: '#525866',
  pipelineSubmitted: '#3b82f6',
  pipelineWaiting: '#f59e0b',
  pipelineQuery: '#ef4444',
  pipelineApproved: '#22c55e',
  pipelineCompleted: '#06b6d4',
};

// Light mode colors
export const LIGHT_COLORS: Partial<ThreeColors> = {
  background: '#f8fafc',
  surface: 'rgba(0, 0, 0, 0.02)',
};

// Performance tier presets
export const PERFORMANCE_TIERS: Record<PerformanceTier['tier'], PerformanceTier> = {
  high: {
    tier: 'high',
    maxParticles: 500,
    enablePostProcessing: true,
    enableShadows: true,
    targetFPS: 60,
  },
  medium: {
    tier: 'medium',
    maxParticles: 200,
    enablePostProcessing: false,
    enableShadows: false,
    targetFPS: 60,
  },
  low: {
    tier: 'low',
    maxParticles: 50,
    enablePostProcessing: false,
    enableShadows: false,
    targetFPS: 30,
  },
  fallback: {
    tier: 'fallback',
    maxParticles: 0,
    enablePostProcessing: false,
    enableShadows: false,
    targetFPS: 30,
  },
};

// Animation timings
export const ANIMATION = {
  fast: 150,
  base: 200,
  slow: 300,
  spring: {
    stiffness: 300,
    damping: 25,
  },
  parallax: {
    stiffness: 50,
    damping: 30,
  },
};
