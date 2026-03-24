/**
 * Heat Pump Component
 * ===================
 * Outdoor unit with rotating fan
 */

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { HOUSE_DIMENSIONS } from "./House";

const { scale: SCALE, width: HOUSE_WIDTH, depth: HOUSE_DEPTH } = HOUSE_DIMENSIONS;

// Heat pump dimensions
const PUMP_WIDTH = 0.9 * SCALE;
const PUMP_HEIGHT = 0.8 * SCALE;
const PUMP_DEPTH = 0.35 * SCALE;

interface HeatPumpProps {
  kw?: number;
  position?: [number, number, number];
}

export function HeatPump({ kw = 0, position }: HeatPumpProps) {
  const fanRef = useRef<THREE.Group>(null);

  // Rotating fan animation
  useFrame((_, delta) => {
    if (fanRef.current && kw > 0) {
      fanRef.current.rotation.z += delta * 8; // Spin speed
    }
  });

  if (kw <= 0) return null;

  // Default position: side of house
  const pumpPosition: [number, number, number] = position || [
    HOUSE_WIDTH / 2 + 0.3 * SCALE,
    PUMP_HEIGHT / 2,
    HOUSE_DEPTH / 4,
  ];

  return (
    <group position={pumpPosition}>
      {/* Main body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[PUMP_WIDTH, PUMP_HEIGHT, PUMP_DEPTH]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Top panel (darker) */}
      <mesh position={[0, PUMP_HEIGHT / 2 + 0.01, 0]}>
        <boxGeometry args={[PUMP_WIDTH, 0.02 * SCALE, PUMP_DEPTH]} />
        <meshStandardMaterial color="#a0a0a0" roughness={0.5} />
      </mesh>

      {/* Front grille area */}
      <mesh position={[0, 0, PUMP_DEPTH / 2 + 0.005]}>
        <boxGeometry args={[PUMP_WIDTH * 0.9, PUMP_HEIGHT * 0.85, 0.02 * SCALE]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>

      {/* Grille lines */}
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            0,
            -PUMP_HEIGHT * 0.35 + i * (PUMP_HEIGHT * 0.7 / 14),
            PUMP_DEPTH / 2 + 0.02,
          ]}
        >
          <boxGeometry args={[PUMP_WIDTH * 0.85, 0.008 * SCALE, 0.01]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      ))}

      {/* Fan behind grille */}
      <group
        ref={fanRef}
        position={[0, 0, PUMP_DEPTH / 2 - 0.05 * SCALE]}
      >
        {/* Fan hub */}
        <mesh>
          <cylinderGeometry args={[0.05 * SCALE, 0.05 * SCALE, 0.03 * SCALE, 16]} />
          <meshStandardMaterial color="#444" metalness={0.6} />
        </mesh>

        {/* Fan blades */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * 0.12 * SCALE,
                Math.sin(angle) * 0.12 * SCALE,
                0,
              ]}
              rotation={[0, 0, angle + Math.PI / 2]}
            >
              <boxGeometry args={[0.18 * SCALE, 0.06 * SCALE, 0.01 * SCALE]} />
              <meshStandardMaterial color="#666" metalness={0.4} />
            </mesh>
          );
        })}
      </group>

      {/* Side vents */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * PUMP_WIDTH / 2, 0, 0]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh
              key={i}
              position={[
                side * 0.01,
                -PUMP_HEIGHT * 0.25 + i * (PUMP_HEIGHT * 0.5 / 5),
                0,
              ]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <boxGeometry args={[PUMP_DEPTH * 0.7, 0.02 * SCALE, 0.005]} />
              <meshStandardMaterial color="#ccc" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Refrigerant pipes */}
      <group position={[PUMP_WIDTH * 0.3, -PUMP_HEIGHT / 2 - 0.05 * SCALE, PUMP_DEPTH * 0.2]}>
        <mesh>
          <cylinderGeometry args={[0.02 * SCALE, 0.02 * SCALE, 0.15 * SCALE, 8]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0.06 * SCALE, 0, 0]}>
          <cylinderGeometry args={[0.015 * SCALE, 0.015 * SCALE, 0.15 * SCALE, 8]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* Base/feet */}
      {[
        [-PUMP_WIDTH * 0.35, -PUMP_HEIGHT / 2 - 0.03 * SCALE, -PUMP_DEPTH * 0.3],
        [PUMP_WIDTH * 0.35, -PUMP_HEIGHT / 2 - 0.03 * SCALE, -PUMP_DEPTH * 0.3],
        [-PUMP_WIDTH * 0.35, -PUMP_HEIGHT / 2 - 0.03 * SCALE, PUMP_DEPTH * 0.3],
        [PUMP_WIDTH * 0.35, -PUMP_HEIGHT / 2 - 0.03 * SCALE, PUMP_DEPTH * 0.3],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.08 * SCALE, 0.06 * SCALE, 0.08 * SCALE]} />
          <meshStandardMaterial color="#404040" roughness={0.8} />
        </mesh>
      ))}

      {/* Status LED */}
      <mesh position={[PUMP_WIDTH * 0.35, PUMP_HEIGHT * 0.35, PUMP_DEPTH / 2 + 0.02]}>
        <circleGeometry args={[0.02 * SCALE, 16]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#f97316"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}
