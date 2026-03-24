/**
 * Power Grid Component
 * ====================
 * Electricity pole with power lines
 */

import * as THREE from "three";
import { HOUSE_DIMENSIONS } from "./House";

const { scale: SCALE, width: HOUSE_WIDTH, depth: HOUSE_DEPTH } = HOUSE_DIMENSIONS;

// Pole dimensions
const POLE_HEIGHT = 4.5 * SCALE;
const POLE_RADIUS = 0.08 * SCALE;

interface PowerGridProps {
  position?: [number, number, number];
}

export function PowerGrid({ position }: PowerGridProps) {
  // Default position: far from house
  const gridPosition: [number, number, number] = position || [
    -HOUSE_WIDTH / 2 - 2.5 * SCALE,
    0,
    HOUSE_DEPTH / 2 + 1.0 * SCALE,
  ];

  return (
    <group position={gridPosition}>
      {/* Main pole */}
      <mesh position={[0, POLE_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[POLE_RADIUS, POLE_RADIUS * 1.2, POLE_HEIGHT, 12]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
      </mesh>

      {/* Cross arm */}
      <mesh position={[0, POLE_HEIGHT * 0.85, 0]} castShadow>
        <boxGeometry args={[1.2 * SCALE, 0.1 * SCALE, 0.1 * SCALE]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
      </mesh>

      {/* Insulators */}
      {[-0.4, 0, 0.4].map((x) => (
        <group key={x} position={[x * SCALE, POLE_HEIGHT * 0.85 + 0.1 * SCALE, 0]}>
          <mesh>
            <cylinderGeometry args={[0.03 * SCALE, 0.04 * SCALE, 0.08 * SCALE, 8]} />
            <meshStandardMaterial color="#4a7c59" roughness={0.5} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.05 * SCALE, 0]}>
            <cylinderGeometry args={[0.025 * SCALE, 0.03 * SCALE, 0.04 * SCALE, 8]} />
            <meshStandardMaterial color="#4a7c59" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Power lines (going towards house) */}
      {[-0.4, 0, 0.4].map((x, i) => {
        const startY = POLE_HEIGHT * 0.85 + 0.12 * SCALE;
        const endX = HOUSE_WIDTH / 2 + 0.5 * SCALE - gridPosition[0];
        const endZ = -HOUSE_DEPTH / 2 - gridPosition[2];

        // Create catenary curve for power line
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(x * SCALE, startY, 0),
          new THREE.Vector3(
            x * SCALE + endX * 0.5,
            startY - 0.5 * SCALE, // Sag in the middle
            endZ * 0.5
          ),
          new THREE.Vector3(endX, HOUSE_DIMENSIONS.wallHeight + 0.5 * SCALE, endZ)
        );

        const points = curve.getPoints(32);
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <line key={i}>
            <bufferGeometry attach="geometry" {...lineGeometry} />
            <lineBasicMaterial color="#333" linewidth={1} />
          </line>
        );
      })}

      {/* Transformer box at base */}
      <mesh position={[0.15 * SCALE, 0.3 * SCALE, 0]} castShadow>
        <boxGeometry args={[0.25 * SCALE, 0.6 * SCALE, 0.2 * SCALE]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Warning sign */}
      <mesh position={[0, POLE_HEIGHT * 0.4, POLE_RADIUS + 0.01]}>
        <planeGeometry args={[0.15 * SCALE, 0.15 * SCALE]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
}
