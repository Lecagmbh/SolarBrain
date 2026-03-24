/**
 * Battery Storage Component (Tesla Powerwall Style)
 * ==================================================
 * Wall-mounted home battery with LED indicators
 */

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { HOUSE_DIMENSIONS } from "./House";

const { scale: SCALE, depth: HOUSE_DEPTH } = HOUSE_DIMENSIONS;

// Battery dimensions (based on Tesla Powerwall)
const BATTERY_WIDTH = 0.75 * SCALE;
const BATTERY_HEIGHT = 1.15 * SCALE;
const BATTERY_DEPTH = 0.15 * SCALE;

interface BatteryProps {
  kwh?: number;
  position?: [number, number, number];
}

export function Battery({ kwh = 0, position }: BatteryProps) {
  const ledRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  // Pulsing LED animation
  useFrame((state) => {
    if (ledRef.current && kwh > 0) {
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
      (ledRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
    if (glowRef.current && kwh > 0) {
      const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      glowRef.current.intensity = pulse;
    }
  });

  if (kwh <= 0) return null;

  // Position next to house if not specified
  const batteryPosition: [number, number, number] = position || [
    HOUSE_DIMENSIONS.width / 2 + 0.3 * SCALE,
    BATTERY_HEIGHT / 2,
    -HOUSE_DEPTH / 4,
  ];

  return (
    <group position={batteryPosition}>
      {/* Main battery body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[BATTERY_WIDTH, BATTERY_HEIGHT, BATTERY_DEPTH]} />
        <meshStandardMaterial
          color="#f5f5f5"
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Front panel (slightly darker) */}
      <mesh position={[0, 0, BATTERY_DEPTH / 2 + 0.001]}>
        <boxGeometry args={[BATTERY_WIDTH * 0.9, BATTERY_HEIGHT * 0.85, 0.01 * SCALE]} />
        <meshStandardMaterial
          color="#e8e8e8"
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Logo area */}
      <mesh position={[0, BATTERY_HEIGHT * 0.3, BATTERY_DEPTH / 2 + 0.015]}>
        <boxGeometry args={[BATTERY_WIDTH * 0.4, 0.08 * SCALE, 0.005]} />
        <meshStandardMaterial color="#333" roughness={0.5} />
      </mesh>

      {/* LED indicator strip */}
      <mesh
        ref={ledRef}
        position={[0, -BATTERY_HEIGHT * 0.35, BATTERY_DEPTH / 2 + 0.01]}
      >
        <boxGeometry args={[BATTERY_WIDTH * 0.6, 0.02 * SCALE, 0.01]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Green glow */}
      <pointLight
        ref={glowRef}
        position={[0, -BATTERY_HEIGHT * 0.35, BATTERY_DEPTH / 2 + 0.1]}
        color="#22c55e"
        intensity={0.3}
        distance={1}
        decay={2}
      />

      {/* Mounting bracket (top) */}
      <mesh position={[0, BATTERY_HEIGHT / 2 + 0.02 * SCALE, -BATTERY_DEPTH * 0.3]}>
        <boxGeometry args={[BATTERY_WIDTH * 0.8, 0.04 * SCALE, BATTERY_DEPTH * 0.4]} />
        <meshStandardMaterial color="#666" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Mounting bracket (bottom) */}
      <mesh position={[0, -BATTERY_HEIGHT / 2 - 0.02 * SCALE, -BATTERY_DEPTH * 0.3]}>
        <boxGeometry args={[BATTERY_WIDTH * 0.8, 0.04 * SCALE, BATTERY_DEPTH * 0.4]} />
        <meshStandardMaterial color="#666" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Cable coming out bottom */}
      <mesh position={[BATTERY_WIDTH * 0.25, -BATTERY_HEIGHT / 2 - 0.1 * SCALE, 0]}>
        <cylinderGeometry args={[0.015 * SCALE, 0.015 * SCALE, 0.2 * SCALE, 8]} />
        <meshStandardMaterial color="#333" roughness={0.7} />
      </mesh>
    </group>
  );
}
