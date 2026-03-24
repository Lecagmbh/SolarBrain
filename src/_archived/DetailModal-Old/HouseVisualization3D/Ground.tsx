/**
 * Ground Component
 * ================
 * Grass lawn with driveway
 */

import { useRef } from "react";
import * as THREE from "three";
import { HOUSE_DIMENSIONS } from "./House";

const { scale: SCALE, width: HOUSE_WIDTH, depth: HOUSE_DEPTH } = HOUSE_DIMENSIONS;

// Ground size
const GROUND_SIZE = 15 * SCALE;
const DRIVEWAY_WIDTH = 2.5 * SCALE;
const DRIVEWAY_LENGTH = 5 * SCALE;

export function Ground() {
  return (
    <group>
      {/* Main grass lawn */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial
          color="#2d5a27"
          roughness={0.95}
        />
      </mesh>

      {/* Grass texture variation (lighter patches) */}
      {[
        [-2 * SCALE, 0.001, -2 * SCALE],
        [1.5 * SCALE, 0.001, 1 * SCALE],
        [-1 * SCALE, 0.001, 2.5 * SCALE],
        [2.5 * SCALE, 0.001, -1.5 * SCALE],
      ].map((pos, i) => (
        <mesh
          key={i}
          position={pos as [number, number, number]}
          rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}
          receiveShadow
        >
          <circleGeometry args={[0.8 * SCALE + Math.random() * 0.3 * SCALE, 16]} />
          <meshStandardMaterial
            color="#3d6a37"
            roughness={0.9}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}

      {/* Driveway - main path */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[HOUSE_WIDTH / 2 + DRIVEWAY_WIDTH / 2, 0.005, -HOUSE_DEPTH / 2 - DRIVEWAY_LENGTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[DRIVEWAY_WIDTH, DRIVEWAY_LENGTH]} />
        <meshStandardMaterial
          color="#5a5a5a"
          roughness={0.85}
        />
      </mesh>

      {/* Driveway edge lines */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[
            HOUSE_WIDTH / 2 + DRIVEWAY_WIDTH / 2 + side * DRIVEWAY_WIDTH / 2,
            0.007,
            -HOUSE_DEPTH / 2 - DRIVEWAY_LENGTH / 2,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.05 * SCALE, DRIVEWAY_LENGTH]} />
          <meshStandardMaterial color="#404040" />
        </mesh>
      ))}

      {/* House perimeter path/foundation extension */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.003, -HOUSE_DEPTH / 2 - 0.3 * SCALE]}
        receiveShadow
      >
        <planeGeometry args={[HOUSE_WIDTH + 0.6 * SCALE, 0.6 * SCALE]} />
        <meshStandardMaterial color="#8a8a8a" roughness={0.9} />
      </mesh>

      {/* Side path around house */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-HOUSE_WIDTH / 2 - 0.3 * SCALE, 0.003, 0]}
        receiveShadow
      >
        <planeGeometry args={[0.6 * SCALE, HOUSE_DEPTH + 0.6 * SCALE]} />
        <meshStandardMaterial color="#9a9a9a" roughness={0.9} />
      </mesh>

      {/* Garden bed areas */}
      {[
        { pos: [-HOUSE_WIDTH / 2 - 1.2 * SCALE, 0.002, -HOUSE_DEPTH / 4], size: [0.8 * SCALE, 1.5 * SCALE] },
        { pos: [-HOUSE_WIDTH / 2 - 1.2 * SCALE, 0.002, HOUSE_DEPTH / 4], size: [0.8 * SCALE, 1.5 * SCALE] },
      ].map((bed, i) => (
        <mesh
          key={i}
          position={bed.pos as [number, number, number]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={bed.size as [number, number]} />
          <meshStandardMaterial color="#3d2817" roughness={0.95} />
        </mesh>
      ))}

      {/* Small bushes/shrubs */}
      {[
        [-HOUSE_WIDTH / 2 - 1.2 * SCALE, 0.15 * SCALE, -HOUSE_DEPTH / 4],
        [-HOUSE_WIDTH / 2 - 1.2 * SCALE, 0.12 * SCALE, HOUSE_DEPTH / 4],
        [-HOUSE_WIDTH / 2 - 0.8 * SCALE, 0.1 * SCALE, -HOUSE_DEPTH / 4 - 0.4 * SCALE],
        [HOUSE_WIDTH / 4, 0.1 * SCALE, HOUSE_DEPTH / 2 + 0.6 * SCALE],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <sphereGeometry args={[0.15 * SCALE + Math.random() * 0.1 * SCALE, 8, 8]} />
          <meshStandardMaterial
            color={`hsl(${100 + Math.random() * 30}, 50%, ${25 + Math.random() * 15}%)`}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
