/**
 * Baunity Three.js Types
 * =======================
 * TypeScript interfaces for 3D components
 */

export interface PerformanceTier {
  tier: 'high' | 'medium' | 'low' | 'fallback';
  maxParticles: number;
  enablePostProcessing: boolean;
  enableShadows: boolean;
  targetFPS: number;
}

export interface WebGLCapabilities {
  supported: boolean;
  version: number;
  maxTextureSize: number;
  maxVertexUniforms: number;
  renderer: string;
  vendor: string;
}

export interface ThreeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  // Pipeline colors
  pipelineDraft: string;
  pipelineSubmitted: string;
  pipelineWaiting: string;
  pipelineQuery: string;
  pipelineApproved: string;
  pipelineCompleted: string;
}

export interface ThreeContextValue {
  performanceTier: PerformanceTier;
  reducedMotion: boolean;
  webglSupported: boolean;
  isDarkMode: boolean;
  colors: ThreeColors;
}

export interface EnergyNetworkProps {
  intensity?: number;
  particleCount?: number;
  reactToMouse?: boolean;
  className?: string;
}

export interface KPI3DCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  onClick?: () => void;
  glowIntensity?: number;
  floatAmplitude?: number;
}

export interface PipelineStage {
  key: string;
  label: string;
  count: number;
  color: string;
}

export interface PipelineFlow3DProps {
  stages: PipelineStage[];
  onStageClick?: (stageKey: string) => void;
  animationSpeed?: number;
  showParticles?: boolean;
  className?: string;
}
