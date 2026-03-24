/**
 * EnergyNetworkBackground
 * =======================
 * Animated particle network with energy flow effect
 * Reacts to mouse movement with spring physics
 */

import React, { useRef, useMemo, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Canvas3D } from '../core/Canvas3D';
import { useThreeContext } from '../core/ThreeProvider';
import type { EnergyNetworkProps } from '../types';

// ============================================================================
// Energy Particles Component
// ============================================================================

interface EnergyParticlesProps {
  count: number;
  color: string;
  mousePos: React.MutableRefObject<{ x: number; y: number }>;
  speed?: number;
}

const EnergyParticles: React.FC<EnergyParticlesProps> = memo(
  ({ count, color, mousePos, speed = 1 }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const threeCtx = useThreeContext();

    // Create particle data
    const particleData = useMemo(() => {
      const positions = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);
      const phases = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        // Spread particles across view
        positions[i3] = (Math.random() - 0.5) * 16;
        positions[i3 + 1] = (Math.random() - 0.5) * 12;
        positions[i3 + 2] = (Math.random() - 0.5) * 4 - 2;

        // Random flow directions
        velocities[i3] = (Math.random() - 0.5) * 0.015 * speed;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.015 * speed;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.005;

        // Phase offset for varied animation
        phases[i] = Math.random() * Math.PI * 2;
      }

      return { positions, velocities, phases };
    }, [count, speed]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
      if (!meshRef.current || threeCtx.reducedMotion) return;

      const time = state.clock.elapsedTime;
      const { positions, velocities, phases } = particleData;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        // Flow animation with sine wave
        positions[i3] += velocities[i3] + Math.sin(time * 0.3 + phases[i]) * 0.002;
        positions[i3 + 1] += velocities[i3 + 1] + Math.cos(time * 0.2 + phases[i]) * 0.002;
        positions[i3 + 2] += velocities[i3 + 2];

        // Mouse interaction - particles flee from cursor
        const dx = positions[i3] - mousePos.current.x * 8;
        const dy = positions[i3 + 1] - mousePos.current.y * 6;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 2.5 && dist > 0.01) {
          const force = (2.5 - dist) * 0.008;
          positions[i3] += (dx / dist) * force;
          positions[i3 + 1] += (dy / dist) * force;
        }

        // Boundary wrapping
        if (positions[i3] > 8) positions[i3] = -8;
        if (positions[i3] < -8) positions[i3] = 8;
        if (positions[i3 + 1] > 6) positions[i3 + 1] = -6;
        if (positions[i3 + 1] < -6) positions[i3 + 1] = 6;
        if (positions[i3 + 2] > 0) positions[i3 + 2] = -4;
        if (positions[i3 + 2] < -4) positions[i3 + 2] = 0;

        // Update instance
        const scale = 0.015 + Math.sin(time * 2 + phases[i]) * 0.005;
        dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }

      meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    );
  }
);

EnergyParticles.displayName = 'EnergyParticles';

// ============================================================================
// Network Grid Component
// ============================================================================

const NetworkGrid: React.FC<{ color: string; opacity?: number }> = memo(
  ({ color, opacity = 0.04 }) => {
    const linesRef = useRef<THREE.LineSegments>(null);

    const geometry = useMemo(() => {
      const points: THREE.Vector3[] = [];
      const gridSize = 16;
      const divisions = 16;
      const step = gridSize / divisions;

      // Horizontal lines
      for (let i = 0; i <= divisions; i++) {
        const y = -gridSize / 2 + i * step;
        points.push(new THREE.Vector3(-gridSize / 2, y, -3));
        points.push(new THREE.Vector3(gridSize / 2, y, -3));
      }

      // Vertical lines
      for (let i = 0; i <= divisions; i++) {
        const x = -gridSize / 2 + i * step;
        points.push(new THREE.Vector3(x, -gridSize / 2, -3));
        points.push(new THREE.Vector3(x, gridSize / 2, -3));
      }

      return new THREE.BufferGeometry().setFromPoints(points);
    }, []);

    useFrame((state) => {
      if (linesRef.current) {
        const mat = linesRef.current.material as THREE.LineBasicMaterial;
        mat.opacity = opacity + Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
      }
    });

    return (
      <lineSegments ref={linesRef} geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={opacity} />
      </lineSegments>
    );
  }
);

NetworkGrid.displayName = 'NetworkGrid';

// ============================================================================
// Connection Lines Between Particles
// ============================================================================

const ConnectionLines: React.FC<{
  particleCount: number;
  color: string;
  maxDistance?: number;
}> = memo(({ particleCount, color, maxDistance = 1.5 }) => {
  const linesRef = useRef<THREE.LineSegments>(null);
  const positionsRef = useRef<Float32Array>(new Float32Array(particleCount * 6 * 3));

  // This is a simplified version - in production you'd want to
  // share particle positions with the main particles component
  useFrame(() => {
    // For performance, we skip dynamic connection lines
    // The grid provides enough visual structure
  });

  return null; // Disabled for performance - grid is sufficient
});

ConnectionLines.displayName = 'ConnectionLines';

// ============================================================================
// Scene Component (runs inside Canvas)
// ============================================================================

interface SceneProps {
  particleCount: number;
  colors: { primary: string; secondary: string };
  mousePos: React.MutableRefObject<{ x: number; y: number }>;
}

const Scene: React.FC<SceneProps> = ({ particleCount, colors, mousePos }) => {
  return (
    <>
      {/* Transparent background */}
      <color attach="background" args={['transparent']} />

      {/* Ambient light for subtle illumination */}
      <ambientLight intensity={0.3} />

      {/* Grid */}
      <NetworkGrid color={colors.primary} opacity={0.03} />

      {/* Primary particles */}
      <EnergyParticles
        count={particleCount}
        color={colors.primary}
        mousePos={mousePos}
        speed={1}
      />

      {/* Secondary particles (fewer, different color) */}
      <EnergyParticles
        count={Math.round(particleCount * 0.4)}
        color={colors.secondary}
        mousePos={mousePos}
        speed={0.7}
      />
    </>
  );
};

// ============================================================================
// CSS Fallback Component
// ============================================================================

const CSSFallback: React.FC<{ colors: { primary: string; secondary: string } }> = ({
  colors,
}) => (
  <div className="energy-network-fallback">
    <div
      className="energy-network-fallback__orb energy-network-fallback__orb--1"
      style={{ background: colors.primary }}
    />
    <div
      className="energy-network-fallback__orb energy-network-fallback__orb--2"
      style={{ background: colors.secondary }}
    />
    <div className="energy-network-fallback__grid" />
  </div>
);

// ============================================================================
// Main Export Component
// ============================================================================

export const EnergyNetworkBackground: React.FC<EnergyNetworkProps> = memo(
  ({ intensity = 0.5, particleCount, reactToMouse = true, className = '' }) => {
    const { performanceTier, colors, reducedMotion, webglSupported } = useThreeContext();
    const mousePos = useRef({ x: 0, y: 0 });

    // Calculate particle count based on performance tier and intensity
    const count = particleCount ?? Math.round(performanceTier.maxParticles * intensity);

    // Mouse tracking with throttle
    useEffect(() => {
      if (!reactToMouse || reducedMotion) return;

      let rafId: number;
      let lastUpdate = 0;
      const throttleMs = 16; // ~60fps

      const handleMouseMove = (e: MouseEvent) => {
        const now = performance.now();
        if (now - lastUpdate < throttleMs) return;
        lastUpdate = now;

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
    }, [reactToMouse, reducedMotion]);

    // Reduced motion or fallback - show CSS version
    if (!webglSupported || reducedMotion) {
      return (
        <div className={`energy-network-bg ${className}`}>
          <CSSFallback colors={{ primary: colors.primary, secondary: colors.secondary }} />
        </div>
      );
    }

    return (
      <div className={`energy-network-bg ${className}`}>
        <Canvas3D
          fallback={
            <CSSFallback colors={{ primary: colors.primary, secondary: colors.secondary }} />
          }
          style={{ position: 'absolute', inset: 0 }}
        >
          <Scene
            particleCount={count}
            colors={{ primary: colors.primary, secondary: colors.secondary }}
            mousePos={mousePos}
          />
        </Canvas3D>
      </div>
    );
  }
);

EnergyNetworkBackground.displayName = 'EnergyNetworkBackground';

export default EnergyNetworkBackground;
