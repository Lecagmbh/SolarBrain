/**
 * Baunity Three.js Components
 * ============================
 * Premium 3D visual elements for the dashboard
 */

// Core
export { ThreeProvider, useThreeContext, useThreeContextSafe } from './core';
export { Canvas3D } from './core';

// Hooks
export { useReducedMotion, useWebGLSupport, usePerformanceTier } from './hooks';

// Components
export { EnergyNetworkBackground } from './backgrounds';
export { KPI3DCard } from './cards';
export { PipelineFlow3D } from './pipeline';

// Types
export type {
  ThreeContextValue,
  ThreeColors,
  PerformanceTier,
  WebGLCapabilities,
  EnergyNetworkProps,
  KPI3DCardProps,
  PipelineFlow3DProps,
  PipelineStage,
} from './types';

// Import styles
import './styles/three-effects.css';
