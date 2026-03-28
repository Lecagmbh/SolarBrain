/**
 * BACKGROUND 3D - Immersive Particle System
 * ==========================================
 * Animated particles with energy flow and grid
 */

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// Particle System
function ParticleField({ count = 3000, color = "#3b82f6" }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

// Energy Lines
function EnergyLines({ color = "#3b82f6" }) {
  const ref = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];

    // Create flowing energy lines
    for (let i = 0; i < 30; i++) {
      const x1 = (Math.random() - 0.5) * 20;
      const y1 = (Math.random() - 0.5) * 15;
      const z1 = (Math.random() - 0.5) * 10;

      const x2 = x1 + (Math.random() - 0.5) * 3;
      const y2 = y1 + (Math.random() - 0.5) * 3;
      const z2 = z1 + (Math.random() - 0.5) * 2;

      positions.push(x1, y1, z1, x2, y2, z2);
    }

    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * 0.01;
  });

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.15} />
    </lineSegments>
  );
}

// Grid Plane
function GridPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      <planeGeometry args={[50, 50, 50, 50]} />
      <meshBasicMaterial
        color="#1e40af"
        wireframe
        transparent
        opacity={0.05}
      />
    </mesh>
  );
}

// Floating Orbs (status-colored)
function FloatingOrbs({ statusColor = "#3b82f6" }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      child.position.y = Math.sin(state.clock.elapsedTime * 0.5 + i * 0.5) * 0.3;
    });
  });

  return (
    <group ref={ref}>
      {[...Array(5)].map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10,
            -5 - Math.random() * 5
          ]}
        >
          <sphereGeometry args={[0.1 + Math.random() * 0.2, 16, 16]} />
          <meshBasicMaterial color={statusColor} transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// Main Scene
function Scene({ statusColor = "#3b82f6" }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <ParticleField count={2000} color={statusColor} />
      <ParticleField count={1000} color="#a855f7" />
      <EnergyLines color={statusColor} />
      <GridPlane />
      <FloatingOrbs statusColor={statusColor} />
    </>
  );
}

interface Background3DProps {
  statusColor?: string;
  className?: string;
}

export function Background3D({ statusColor = "#3b82f6", className = "" }: Background3DProps) {
  return (
    <div className={`dv3d-background ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        style={{ pointerEvents: "none", background: "linear-gradient(145deg, #060b18 0%, #1a1a2e 100%)" }}
        eventSource={undefined}
        eventPrefix="offset"
      >
        <color attach="background" args={["#081020"]} />
        <Scene statusColor={statusColor} />
      </Canvas>
    </div>
  );
}

export default Background3D;
