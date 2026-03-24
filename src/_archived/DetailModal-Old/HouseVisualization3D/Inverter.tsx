/**
 * Inverter Component
 * ==================
 * Solar inverter with display and LED indicators
 */

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { HOUSE_DIMENSIONS } from "./House";

const { scale: SCALE, width: HOUSE_WIDTH } = HOUSE_DIMENSIONS;

// Inverter dimensions
const INVERTER_WIDTH = 0.5 * SCALE;
const INVERTER_HEIGHT = 0.6 * SCALE;
const INVERTER_DEPTH = 0.18 * SCALE;

interface InverterProps {
  kw?: number;
  position?: [number, number, number];
}

export function Inverter({ kw = 0, position }: InverterProps) {
  const led1Ref = useRef<THREE.Mesh>(null);
  const led2Ref = useRef<THREE.Mesh>(null);
  const displayRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Blinking LEDs
    if (led1Ref.current && kw > 0) {
      const blink = Math.sin(t * 4) > 0 ? 1 : 0.2;
      (led1Ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = blink;
    }
    if (led2Ref.current && kw > 0) {
      const blink = Math.sin(t * 2 + 1) > 0.5 ? 0.8 : 0.3;
      (led2Ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = blink;
    }

    // Display subtle glow
    if (displayRef.current && kw > 0) {
      const glow = 0.3 + Math.sin(t * 0.5) * 0.1;
      (displayRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow;
    }
  });

  if (kw <= 0) return null;

  // Default position: on house wall
  const inverterPosition: [number, number, number] = position || [
    -HOUSE_WIDTH / 2 - 0.1 * SCALE,
    HOUSE_DIMENSIONS.wallHeight * 0.5,
    0,
  ];

  return (
    <group position={inverterPosition} rotation={[0, -Math.PI / 2, 0]}>
      {/* Main body */}
      <mesh castShadow>
        <boxGeometry args={[INVERTER_WIDTH, INVERTER_HEIGHT, INVERTER_DEPTH]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Front panel (darker) */}
      <mesh position={[0, 0, INVERTER_DEPTH / 2 + 0.001]}>
        <boxGeometry args={[INVERTER_WIDTH * 0.92, INVERTER_HEIGHT * 0.92, 0.01]} />
        <meshStandardMaterial color="#d0d0d0" roughness={0.5} />
      </mesh>

      {/* Display screen */}
      <mesh
        ref={displayRef}
        position={[0, INVERTER_HEIGHT * 0.15, INVERTER_DEPTH / 2 + 0.015]}
      >
        <boxGeometry args={[INVERTER_WIDTH * 0.5, INVERTER_HEIGHT * 0.25, 0.01]} />
        <meshStandardMaterial
          color="#1a1a2e"
          emissive="#a855f7"
          emissiveIntensity={0.3}
          roughness={0.1}
        />
      </mesh>

      {/* LED indicators */}
      <mesh
        ref={led1Ref}
        position={[-INVERTER_WIDTH * 0.3, -INVERTER_HEIGHT * 0.3, INVERTER_DEPTH / 2 + 0.01]}
      >
        <circleGeometry args={[0.015 * SCALE, 16]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.5}
        />
      </mesh>

      <mesh
        ref={led2Ref}
        position={[-INVERTER_WIDTH * 0.15, -INVERTER_HEIGHT * 0.3, INVERTER_DEPTH / 2 + 0.01]}
      >
        <circleGeometry args={[0.015 * SCALE, 16]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Ventilation grille */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            INVERTER_WIDTH * 0.25,
            -INVERTER_HEIGHT * 0.15 + i * 0.025 * SCALE,
            INVERTER_DEPTH / 2 + 0.005,
          ]}
        >
          <boxGeometry args={[INVERTER_WIDTH * 0.3, 0.008 * SCALE, 0.01]} />
          <meshStandardMaterial color="#888" />
        </mesh>
      ))}

      {/* Brand logo placeholder */}
      <mesh position={[0, INVERTER_HEIGHT * 0.38, INVERTER_DEPTH / 2 + 0.01]}>
        <boxGeometry args={[INVERTER_WIDTH * 0.4, 0.04 * SCALE, 0.005]} />
        <meshStandardMaterial color="#666" />
      </mesh>

      {/* Cables coming out */}
      <mesh position={[0, -INVERTER_HEIGHT / 2 - 0.05 * SCALE, 0]}>
        <cylinderGeometry args={[0.02 * SCALE, 0.02 * SCALE, 0.1 * SCALE, 8]} />
        <meshStandardMaterial color="#333" roughness={0.7} />
      </mesh>
      <mesh position={[0.08 * SCALE, -INVERTER_HEIGHT / 2 - 0.05 * SCALE, 0]}>
        <cylinderGeometry args={[0.015 * SCALE, 0.015 * SCALE, 0.1 * SCALE, 8]} />
        <meshStandardMaterial color="#333" roughness={0.7} />
      </mesh>
    </group>
  );
}
