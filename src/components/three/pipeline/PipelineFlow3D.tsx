/**
 * PipelineFlow3D
 * ==============
 * Animated pipeline visualization with flowing particles
 */

import React, { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Canvas3D } from '../core/Canvas3D';
import { useThreeContext } from '../core/ThreeProvider';
import type { PipelineFlow3DProps, PipelineStage } from '../types';

// ============================================================================
// Flow Particles Between Stages
// ============================================================================

interface FlowParticlesProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  count: number;
  speed: number;
  hasFlow: boolean;
}

const FlowParticles: React.FC<FlowParticlesProps> = memo(
  ({ from, to, color, count, speed, hasFlow }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    // Progress for each particle
    const progressRef = useRef<Float32Array>(
      new Float32Array(count).map(() => Math.random())
    );

    // Bezier curve between points
    const curve = useMemo(() => {
      const midPoint = new THREE.Vector3().lerpVectors(from, to, 0.5);
      midPoint.y += 0.4;
      return new THREE.QuadraticBezierCurve3(from, midPoint, to);
    }, [from, to]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((_, delta) => {
      if (!meshRef.current || !hasFlow) return;

      for (let i = 0; i < count; i++) {
        progressRef.current[i] += delta * speed;
        if (progressRef.current[i] > 1) {
          progressRef.current[i] = 0;
        }

        const point = curve.getPoint(progressRef.current[i]);
        const scale = 0.025 * (1 - Math.abs(progressRef.current[i] - 0.5) * 0.6);

        dummy.position.copy(point);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }

      meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!hasFlow) return null;

    return (
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    );
  }
);

FlowParticles.displayName = 'FlowParticles';

// ============================================================================
// Stage Node
// ============================================================================

interface StageNodeProps {
  position: THREE.Vector3;
  stage: PipelineStage;
  onClick?: () => void;
}

const StageNode: React.FC<StageNodeProps> = memo(({ position, stage, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const baseScale = 0.15 + (stage.count > 0 ? Math.min(stage.count / 50, 0.1) : 0);
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.01;
      const hoverScale = hovered ? 0.03 : 0;
      meshRef.current.scale.setScalar(baseScale + pulse + hoverScale);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(0.25 + (hovered ? 0.05 : 0));
    }
  });

  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={stage.color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Main node */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color={stage.color}
          emissive={stage.color}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
    </group>
  );
});

StageNode.displayName = 'StageNode';

// ============================================================================
// Connection Path
// ============================================================================

const ConnectionPath: React.FC<{
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
}> = memo(({ from, to, color }) => {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const midPoint = new THREE.Vector3().lerpVectors(from, to, 0.5);
    midPoint.y += 0.3;

    const curve = new THREE.QuadraticBezierCurve3(from, midPoint, to);
    const points = curve.getPoints(20);

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [from, to]);

  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 }),
    [color]
  );

  return <primitive ref={lineRef} object={new THREE.Line(geometry, material)} />;
});

ConnectionPath.displayName = 'ConnectionPath';

// ============================================================================
// Pipeline Scene
// ============================================================================

interface PipelineSceneProps {
  stages: PipelineStage[];
  onStageClick?: (stageKey: string) => void;
  animationSpeed: number;
  showParticles: boolean;
}

const PipelineScene: React.FC<PipelineSceneProps> = ({
  stages,
  onStageClick,
  animationSpeed,
  showParticles,
}) => {
  const { performanceTier } = useThreeContext();

  // Calculate positions
  const stagePositions = useMemo(() => {
    const width = (stages.length - 1) * 1.2;
    const startX = -width / 2;
    return stages.map((_, i) => new THREE.Vector3(startX + i * 1.2, 0, 0));
  }, [stages.length]);

  const particlesPerConnection = Math.round(
    (performanceTier.maxParticles / Math.max(stages.length - 1, 1)) * 0.15
  );

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 3, 3]} intensity={0.6} />

      {/* Connections and particles */}
      {stages.map((stage, index) => {
        if (index === 0) return null;

        const from = stagePositions[index - 1];
        const to = stagePositions[index];
        const prevStage = stages[index - 1];

        return (
          <React.Fragment key={`conn-${index}`}>
            <ConnectionPath from={from} to={to} color={stage.color} />
            {showParticles && (
              <FlowParticles
                from={from}
                to={to}
                color={prevStage.color}
                count={particlesPerConnection}
                speed={animationSpeed}
                hasFlow={prevStage.count > 0}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Stage nodes */}
      {stages.map((stage, index) => (
        <StageNode
          key={stage.key}
          position={stagePositions[index]}
          stage={stage}
          onClick={() => onStageClick?.(stage.key)}
        />
      ))}
    </>
  );
};

// ============================================================================
// Main Export
// ============================================================================

export const PipelineFlow3D: React.FC<PipelineFlow3DProps> = memo(
  ({
    stages,
    onStageClick,
    animationSpeed = 0.4,
    showParticles = true,
    className = '',
  }) => {
    const { webglSupported, reducedMotion } = useThreeContext();

    // Filter out storniert for visualization
    const visibleStages = stages.filter((s) => s.key !== 'storniert');

    if (!webglSupported || visibleStages.length === 0) {
      return null; // Fallback to existing CSS pipeline
    }

    return (
      <div className={`pipeline-flow-3d ${className}`} style={{ height: '140px' }}>
        <Canvas3D style={{ width: '100%', height: '100%' }}>
          <color attach="background" args={['transparent']} />
          <PipelineScene
            stages={visibleStages}
            onStageClick={onStageClick}
            animationSpeed={reducedMotion ? 0 : animationSpeed}
            showParticles={showParticles && !reducedMotion}
          />
        </Canvas3D>
      </div>
    );
  }
);

PipelineFlow3D.displayName = 'PipelineFlow3D';

export default PipelineFlow3D;
