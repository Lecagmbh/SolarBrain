/**
 * DashboardBackground - Three.js Animated Background
 * ==================================================
 * Subtle energy particle network as background layer
 *
 * WICHTIG:
 * - Wird als separater Layer UNTER dem Dashboard gerendert
 * - z-index: -1, position: fixed
 * - Verändert NICHTS am Dashboard selbst
 * - Mobile Fallback: CSS gradient wenn kein WebGL
 */

import React, { useRef, useMemo, useEffect, useState, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  primary: '#D4A843',
  secondary: '#EAD068',
  lineOpacity: 0.15,
};

// ============================================================================
// WebGL Support Detection
// ============================================================================

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// ============================================================================
// Performance Tier Detection
// ============================================================================

function getPerformanceTier(): 'high' | 'medium' | 'low' {
  if (typeof navigator === 'undefined') return 'low';

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) return 'low';

  // Check for low-end indicators
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
      if (renderer.includes('intel') || renderer.includes('mesa')) {
        return 'medium';
      }
    }
  }

  return 'high';
}

const PARTICLE_COUNTS = {
  high: 120,
  medium: 60,
  low: 30,
};

// ============================================================================
// Particle System Component
// ============================================================================

interface ParticleSystemProps {
  count: number;
  color: string;
  mousePos: React.MutableRefObject<{ x: number; y: number }>;
}

const ParticleSystem: React.FC<ParticleSystemProps> = memo(({ count, color, mousePos }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Create particle positions
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 20;     // x
      positions[i3 + 1] = (Math.random() - 0.5) * 15; // y
      positions[i3 + 2] = (Math.random() - 0.5) * 5;  // z

      velocities[i3] = (Math.random() - 0.5) * 0.008;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.008;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.003;
    }

    return { positions, velocities };
  }, [count]);

  // Line geometry for connections
  const lineGeometry = useMemo(() => new THREE.BufferGeometry(), []);
  const linePositions = useMemo(() => new Float32Array(count * count * 6), [count]);

  useFrame(() => {
    if (!pointsRef.current) return;

    const positionAttr = pointsRef.current.geometry.attributes.position;
    const posArray = positionAttr.array as Float32Array;

    // Update particle positions
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Apply velocity
      posArray[i3] += velocities[i3];
      posArray[i3 + 1] += velocities[i3 + 1];
      posArray[i3 + 2] += velocities[i3 + 2];

      // Subtle mouse interaction
      const dx = posArray[i3] - mousePos.current.x * 10;
      const dy = posArray[i3 + 1] - mousePos.current.y * 8;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 3 && dist > 0.1) {
        const force = (3 - dist) * 0.002;
        posArray[i3] += (dx / dist) * force;
        posArray[i3 + 1] += (dy / dist) * force;
      }

      // Boundary wrap
      if (posArray[i3] > 10) posArray[i3] = -10;
      if (posArray[i3] < -10) posArray[i3] = 10;
      if (posArray[i3 + 1] > 7.5) posArray[i3 + 1] = -7.5;
      if (posArray[i3 + 1] < -7.5) posArray[i3 + 1] = 7.5;
      if (posArray[i3 + 2] > 2.5) posArray[i3 + 2] = -2.5;
      if (posArray[i3 + 2] < -2.5) posArray[i3 + 2] = 2.5;
    }

    positionAttr.needsUpdate = true;

    // Update connection lines
    let lineIndex = 0;
    const maxDist = 2.5;

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const i3 = i * 3;
        const j3 = j * 3;

        const dx = posArray[i3] - posArray[j3];
        const dy = posArray[i3 + 1] - posArray[j3 + 1];
        const dz = posArray[i3 + 2] - posArray[j3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < maxDist && lineIndex < linePositions.length - 6) {
          linePositions[lineIndex++] = posArray[i3];
          linePositions[lineIndex++] = posArray[i3 + 1];
          linePositions[lineIndex++] = posArray[i3 + 2];
          linePositions[lineIndex++] = posArray[j3];
          linePositions[lineIndex++] = posArray[j3 + 1];
          linePositions[lineIndex++] = posArray[j3 + 2];
        }
      }
    }

    // Clear remaining line positions
    for (let i = lineIndex; i < linePositions.length; i++) {
      linePositions[i] = 0;
    }

    if (linesRef.current) {
      lineGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(linePositions.slice(0, lineIndex), 3)
      );
      lineGeometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.08}
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Connection Lines */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={COLORS.lineOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </>
  );
});

ParticleSystem.displayName = 'ParticleSystem';

// ============================================================================
// Scene Component
// ============================================================================

interface SceneProps {
  particleCount: number;
  mousePos: React.MutableRefObject<{ x: number; y: number }>;
}

const Scene: React.FC<SceneProps> = ({ particleCount, mousePos }) => {
  return (
    <>
      {/* Primary particles */}
      <ParticleSystem
        count={particleCount}
        color={COLORS.primary}
        mousePos={mousePos}
      />
      {/* Secondary particles (fewer, different color) */}
      <ParticleSystem
        count={Math.round(particleCount * 0.4)}
        color={COLORS.secondary}
        mousePos={mousePos}
      />
    </>
  );
};

// ============================================================================
// CSS Fallback (for no WebGL)
// ============================================================================

const CSSFallback: React.FC = () => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: -1,
      pointerEvents: 'none',
      background: `
        radial-gradient(ellipse at 20% 30%, rgba(212, 168, 67, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)
      `,
    }}
  />
);

// ============================================================================
// Main Export Component
// ============================================================================

export const DashboardBackground: React.FC = memo(() => {
  const [webglSupported, setWebglSupported] = useState(true);
  const [performanceTier, setPerformanceTier] = useState<'high' | 'medium' | 'low'>('medium');
  const mousePos = useRef({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check WebGL support and performance tier
  useEffect(() => {
    setWebglSupported(checkWebGLSupport());
    setPerformanceTier(getPerformanceTier());

    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Mouse tracking
  useEffect(() => {
    if (reducedMotion) return;

    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  // No WebGL or reduced motion - show CSS fallback
  if (!webglSupported || reducedMotion) {
    return <CSSFallback />;
  }

  const particleCount = PARTICLE_COUNTS[performanceTier];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        gl={{
          alpha: true,
          antialias: performanceTier !== 'low',
          powerPreference: performanceTier === 'low' ? 'low-power' : 'default',
        }}
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: 'transparent' }}
        dpr={performanceTier === 'low' ? 1 : [1, 1.5]}
      >
        <Scene particleCount={particleCount} mousePos={mousePos} />
      </Canvas>
    </div>
  );
});

DashboardBackground.displayName = 'DashboardBackground';

export default DashboardBackground;
