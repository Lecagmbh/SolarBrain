/**
 * House Component - Realistic German House with Hip Roof (Walmdach)
 * =================================================================
 * A professionally modeled house with proper proportions
 */

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// House dimensions (in meters, scaled down for scene)
const SCALE = 0.3;
const HOUSE_WIDTH = 12 * SCALE;    // 12m wide
const HOUSE_DEPTH = 10 * SCALE;    // 10m deep
const WALL_HEIGHT = 3.2 * SCALE;   // 3.2m wall height
const ROOF_HEIGHT = 2.5 * SCALE;   // 2.5m roof height
const ROOF_OVERHANG = 0.4 * SCALE; // 40cm overhang
const RIDGE_INSET = 2 * SCALE;     // Ridge is 2m from each end

// Materials
const wallMaterial = new THREE.MeshStandardMaterial({
  color: "#f5f0e6",  // Beige/Cream
  roughness: 0.85,
  metalness: 0.05,
});

const roofMaterial = new THREE.MeshStandardMaterial({
  color: "#2d2d2d",  // Dark anthracite
  roughness: 0.6,
  metalness: 0.15,
});

const windowFrameMaterial = new THREE.MeshStandardMaterial({
  color: "#4a4a4a",
  roughness: 0.4,
  metalness: 0.3,
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: "#88ccff",
  transparent: true,
  opacity: 0.4,
  roughness: 0.05,
  metalness: 0.1,
  reflectivity: 0.9,
  envMapIntensity: 1,
});

const doorMaterial = new THREE.MeshStandardMaterial({
  color: "#5c4033",  // Wood brown
  roughness: 0.7,
  metalness: 0.1,
});

// Create hip roof geometry using BufferGeometry
function createHipRoofGeometry(): THREE.BufferGeometry {
  const hw = (HOUSE_WIDTH + ROOF_OVERHANG * 2) / 2;  // Half width with overhang
  const hd = (HOUSE_DEPTH + ROOF_OVERHANG * 2) / 2;  // Half depth with overhang
  const rh = ROOF_HEIGHT;
  const ri = RIDGE_INSET + ROOF_OVERHANG;  // Ridge inset from edge

  // Vertices for hip roof
  // Bottom corners (at wall top level)
  const v0 = [-hw, 0, -hd];  // Front left
  const v1 = [hw, 0, -hd];   // Front right
  const v2 = [hw, 0, hd];    // Back right
  const v3 = [-hw, 0, hd];   // Back left

  // Ridge line points (top)
  const v4 = [-hw + ri, rh, 0];  // Ridge left
  const v5 = [hw - ri, rh, 0];   // Ridge right

  // Define faces (triangles)
  // Front face (trapezoid = 2 triangles)
  // Left face (triangle)
  // Right face (triangle)
  // Back face (trapezoid = 2 triangles)

  const vertices = new Float32Array([
    // Front face (trapezoid) - facing -Z
    ...v0, ...v1, ...v5,  // Bottom triangle
    ...v0, ...v5, ...v4,  // Top triangle

    // Back face (trapezoid) - facing +Z
    ...v2, ...v3, ...v4,  // Bottom triangle
    ...v2, ...v4, ...v5,  // Top triangle

    // Left face (triangle) - facing -X
    ...v3, ...v0, ...v4,

    // Right face (triangle) - facing +X
    ...v1, ...v2, ...v5,
  ]);

  // Calculate normals
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();

  return geometry;
}

// Create window with frame
function Window({
  position,
  width = 0.8 * SCALE,
  height = 1.2 * SCALE,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
  rotation?: [number, number, number];
}) {
  const frameDepth = 0.05 * SCALE;
  const frameWidth = 0.06 * SCALE;

  return (
    <group position={position} rotation={rotation}>
      {/* Window frame */}
      <mesh material={windowFrameMaterial} castShadow>
        <boxGeometry args={[width + frameWidth * 2, height + frameWidth * 2, frameDepth]} />
      </mesh>
      {/* Glass */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[width, height]} />
        <primitive object={glassMaterial} />
      </mesh>
      {/* Window cross (muntin) */}
      <mesh position={[0, 0, 0.02]} material={windowFrameMaterial}>
        <boxGeometry args={[frameWidth * 0.7, height, frameWidth * 0.5]} />
      </mesh>
      <mesh position={[0, 0, 0.02]} material={windowFrameMaterial}>
        <boxGeometry args={[width, frameWidth * 0.7, frameWidth * 0.5]} />
      </mesh>
    </group>
  );
}

// Large panorama window
function PanoramaWindow({
  position,
  width = 2.5 * SCALE,
  height = 1.8 * SCALE,
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
}) {
  const frameDepth = 0.06 * SCALE;
  const frameWidth = 0.08 * SCALE;
  const dividers = 2;

  return (
    <group position={position}>
      {/* Outer frame */}
      <mesh material={windowFrameMaterial} castShadow>
        <boxGeometry args={[width + frameWidth * 2, height + frameWidth * 2, frameDepth]} />
      </mesh>
      {/* Glass panels */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[width, height]} />
        <primitive object={glassMaterial} />
      </mesh>
      {/* Vertical dividers */}
      {Array.from({ length: dividers }).map((_, i) => {
        const x = (width / (dividers + 1)) * (i + 1) - width / 2;
        return (
          <mesh key={i} position={[x, 0, 0.02]} material={windowFrameMaterial}>
            <boxGeometry args={[frameWidth * 0.6, height, frameWidth * 0.4]} />
          </mesh>
        );
      })}
    </group>
  );
}

// Door
function Door({ position }: { position: [number, number, number] }) {
  const doorWidth = 1 * SCALE;
  const doorHeight = 2.2 * SCALE;
  const frameWidth = 0.1 * SCALE;

  return (
    <group position={position}>
      {/* Door frame */}
      <mesh material={windowFrameMaterial} castShadow>
        <boxGeometry args={[doorWidth + frameWidth * 2, doorHeight + frameWidth, 0.1 * SCALE]} />
      </mesh>
      {/* Door panel */}
      <mesh position={[0, 0, 0.02]} material={doorMaterial} castShadow>
        <boxGeometry args={[doorWidth, doorHeight, 0.08 * SCALE]} />
      </mesh>
      {/* Door handle */}
      <mesh position={[doorWidth * 0.35, 0, 0.07 * SCALE]}>
        <boxGeometry args={[0.03 * SCALE, 0.15 * SCALE, 0.03 * SCALE]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Main House component
export function House() {
  const roofGeometry = useMemo(() => createHipRoofGeometry(), []);

  return (
    <group position={[0, 0, 0]}>
      {/* Main walls */}
      <mesh
        position={[0, WALL_HEIGHT / 2, 0]}
        material={wallMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[HOUSE_WIDTH, WALL_HEIGHT, HOUSE_DEPTH]} />
      </mesh>

      {/* Hip roof */}
      <mesh
        geometry={roofGeometry}
        position={[0, WALL_HEIGHT, 0]}
        material={roofMaterial}
        castShadow
        receiveShadow
      />

      {/* Roof underside (soffit) - to close the gap */}
      <mesh
        position={[0, WALL_HEIGHT - 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[HOUSE_WIDTH + ROOF_OVERHANG * 2, HOUSE_DEPTH + ROOF_OVERHANG * 2]} />
        <meshStandardMaterial color="#e8e4dc" side={THREE.BackSide} />
      </mesh>

      {/* Front side windows and door */}
      <group position={[0, 0, -HOUSE_DEPTH / 2 - 0.01]}>
        {/* Large panorama window on left */}
        <PanoramaWindow position={[-HOUSE_WIDTH / 4, WALL_HEIGHT * 0.5, 0]} />

        {/* Door on right */}
        <Door position={[HOUSE_WIDTH / 4, 1.1 * SCALE, 0]} />

        {/* Small window above door */}
        <Window
          position={[HOUSE_WIDTH / 4, WALL_HEIGHT * 0.8, 0]}
          width={0.6 * SCALE}
          height={0.5 * SCALE}
        />
      </group>

      {/* Back side windows */}
      <group position={[0, 0, HOUSE_DEPTH / 2 + 0.01]} rotation={[0, Math.PI, 0]}>
        <Window position={[-HOUSE_WIDTH / 3, WALL_HEIGHT * 0.5, 0]} />
        <Window position={[0, WALL_HEIGHT * 0.5, 0]} />
        <Window position={[HOUSE_WIDTH / 3, WALL_HEIGHT * 0.5, 0]} />
      </group>

      {/* Left side windows */}
      <group position={[-HOUSE_WIDTH / 2 - 0.01, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Window position={[-HOUSE_DEPTH / 4, WALL_HEIGHT * 0.5, 0]} />
        <Window position={[HOUSE_DEPTH / 4, WALL_HEIGHT * 0.5, 0]} />
      </group>

      {/* Right side windows */}
      <group position={[HOUSE_WIDTH / 2 + 0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Window position={[-HOUSE_DEPTH / 4, WALL_HEIGHT * 0.5, 0]} />
        <Window position={[HOUSE_DEPTH / 4, WALL_HEIGHT * 0.5, 0]} />
      </group>

      {/* Foundation/base */}
      <mesh position={[0, -0.05 * SCALE, 0]} receiveShadow>
        <boxGeometry args={[HOUSE_WIDTH + 0.1 * SCALE, 0.1 * SCALE, HOUSE_DEPTH + 0.1 * SCALE]} />
        <meshStandardMaterial color="#8b8b8b" roughness={0.9} />
      </mesh>

      {/* Chimney */}
      <mesh position={[HOUSE_WIDTH / 4, WALL_HEIGHT + ROOF_HEIGHT * 0.6, 0]} castShadow>
        <boxGeometry args={[0.4 * SCALE, 0.8 * SCALE, 0.4 * SCALE]} />
        <meshStandardMaterial color="#8b4513" roughness={0.85} />
      </mesh>
    </group>
  );
}

// Export house dimensions for use in other components
export const HOUSE_DIMENSIONS = {
  width: HOUSE_WIDTH,
  depth: HOUSE_DEPTH,
  wallHeight: WALL_HEIGHT,
  roofHeight: ROOF_HEIGHT,
  totalHeight: WALL_HEIGHT + ROOF_HEIGHT,
  scale: SCALE,
  roofOverhang: ROOF_OVERHANG,
  ridgeInset: RIDGE_INSET,
};
