/**
 * Solar Panels Component
 * ======================
 * Individual solar panels arranged in rows on the hip roof
 */

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { HOUSE_DIMENSIONS } from "./House";

const {
  width: HOUSE_WIDTH,
  depth: HOUSE_DEPTH,
  wallHeight: WALL_HEIGHT,
  roofHeight: ROOF_HEIGHT,
  scale: SCALE,
  roofOverhang: ROOF_OVERHANG,
  ridgeInset: RIDGE_INSET,
} = HOUSE_DIMENSIONS;

// Panel dimensions (standard solar panel ~1.7m x 1m)
const PANEL_WIDTH = 1.0 * SCALE;
const PANEL_HEIGHT = 1.7 * SCALE;
const PANEL_THICKNESS = 0.04 * SCALE;
const PANEL_GAP = 0.08 * SCALE;
const PANEL_LIFT = 0.03 * SCALE;  // Lift above roof surface

// Materials
const panelMaterial = new THREE.MeshStandardMaterial({
  color: "#1a2a4a",
  roughness: 0.25,
  metalness: 0.85,
  envMapIntensity: 1,
});

const panelFrameMaterial = new THREE.MeshStandardMaterial({
  color: "#303030",
  roughness: 0.4,
  metalness: 0.6,
});

const cellMaterial = new THREE.MeshStandardMaterial({
  color: "#0a1525",
  roughness: 0.15,
  metalness: 0.9,
});

// Single solar panel
function SolarPanel({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const shimmerRef = useRef(0);

  // Subtle shimmer effect
  useFrame((state) => {
    if (groupRef.current) {
      shimmerRef.current = Math.sin(state.clock.elapsedTime * 0.5 + position[0] * 2) * 0.02;
    }
  });

  const frameWidth = 0.025 * SCALE;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Main panel body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_THICKNESS]} />
        <primitive object={panelMaterial} />
      </mesh>

      {/* Frame edges */}
      {/* Top frame */}
      <mesh position={[0, PANEL_HEIGHT / 2 - frameWidth / 2, PANEL_THICKNESS / 2]}>
        <boxGeometry args={[PANEL_WIDTH, frameWidth, frameWidth]} />
        <primitive object={panelFrameMaterial} />
      </mesh>
      {/* Bottom frame */}
      <mesh position={[0, -PANEL_HEIGHT / 2 + frameWidth / 2, PANEL_THICKNESS / 2]}>
        <boxGeometry args={[PANEL_WIDTH, frameWidth, frameWidth]} />
        <primitive object={panelFrameMaterial} />
      </mesh>
      {/* Left frame */}
      <mesh position={[-PANEL_WIDTH / 2 + frameWidth / 2, 0, PANEL_THICKNESS / 2]}>
        <boxGeometry args={[frameWidth, PANEL_HEIGHT, frameWidth]} />
        <primitive object={panelFrameMaterial} />
      </mesh>
      {/* Right frame */}
      <mesh position={[PANEL_WIDTH / 2 - frameWidth / 2, 0, PANEL_THICKNESS / 2]}>
        <boxGeometry args={[frameWidth, PANEL_HEIGHT, frameWidth]} />
        <primitive object={panelFrameMaterial} />
      </mesh>

      {/* Cell grid lines (subtle detail) */}
      {Array.from({ length: 5 }).map((_, i) => {
        const y = (i - 2) * (PANEL_HEIGHT / 6);
        return (
          <mesh key={`h${i}`} position={[0, y, PANEL_THICKNESS / 2 + 0.001]}>
            <boxGeometry args={[PANEL_WIDTH - frameWidth * 4, 0.002 * SCALE, 0.001]} />
            <meshBasicMaterial color="#2a3a5a" />
          </mesh>
        );
      })}
      {Array.from({ length: 3 }).map((_, i) => {
        const x = (i - 1) * (PANEL_WIDTH / 3);
        return (
          <mesh key={`v${i}`} position={[x, 0, PANEL_THICKNESS / 2 + 0.001]}>
            <boxGeometry args={[0.002 * SCALE, PANEL_HEIGHT - frameWidth * 4, 0.001]} />
            <meshBasicMaterial color="#2a3a5a" />
          </mesh>
        );
      })}
    </group>
  );
}

// Calculate roof slope angle
function getRoofAngle(): number {
  // For a hip roof, the slope is roof height / half depth
  const halfDepth = HOUSE_DEPTH / 2 + ROOF_OVERHANG;
  return Math.atan(ROOF_HEIGHT / halfDepth);
}

interface SolarPanelsProps {
  kwp?: number;
}

export function SolarPanels({ kwp = 0 }: SolarPanelsProps) {
  if (kwp <= 0) return null;

  // Calculate how many panels based on kWp (assume ~400W per panel)
  const totalPanels = Math.min(Math.ceil(kwp * 1000 / 400), 24);

  const roofAngle = getRoofAngle();

  // Generate panel positions for front roof slope (facing -Z)
  const panelPositions = useMemo(() => {
    const positions: { pos: [number, number, number]; rot: [number, number, number] }[] = [];

    // Available roof width (considering ridge inset and overhang)
    const availableWidth = HOUSE_WIDTH - PANEL_GAP * 2;
    const panelsPerRow = Math.floor(availableWidth / (PANEL_WIDTH + PANEL_GAP));
    const rowWidth = panelsPerRow * (PANEL_WIDTH + PANEL_GAP) - PANEL_GAP;
    const startX = -rowWidth / 2 + PANEL_WIDTH / 2;

    // Calculate available depth on roof slope
    const slopeLength = Math.sqrt(
      Math.pow(HOUSE_DEPTH / 2 + ROOF_OVERHANG, 2) + Math.pow(ROOF_HEIGHT, 2)
    );
    const usableSlopeLength = slopeLength * 0.7;  // Use 70% of slope
    const rowsAvailable = Math.floor(usableSlopeLength / (PANEL_HEIGHT + PANEL_GAP));

    let panelsPlaced = 0;

    // Place panels on front roof slope
    for (let row = 0; row < rowsAvailable && panelsPlaced < totalPanels; row++) {
      // Distance down the slope from ridge
      const slopeDistance = PANEL_HEIGHT / 2 + PANEL_GAP + row * (PANEL_HEIGHT + PANEL_GAP);

      // Convert slope distance to world coordinates
      const zOffset = Math.cos(roofAngle) * slopeDistance;
      const yOffset = ROOF_HEIGHT - Math.sin(roofAngle) * slopeDistance;

      for (let col = 0; col < panelsPerRow && panelsPlaced < totalPanels; col++) {
        const x = startX + col * (PANEL_WIDTH + PANEL_GAP);
        const y = WALL_HEIGHT + yOffset + PANEL_LIFT;
        const z = -zOffset;

        positions.push({
          pos: [x, y, z],
          rot: [-roofAngle, 0, 0],
        });

        panelsPlaced++;
      }
    }

    // If we need more panels, place them on back roof slope
    if (panelsPlaced < totalPanels) {
      for (let row = 0; row < rowsAvailable && panelsPlaced < totalPanels; row++) {
        const slopeDistance = PANEL_HEIGHT / 2 + PANEL_GAP + row * (PANEL_HEIGHT + PANEL_GAP);
        const zOffset = Math.cos(roofAngle) * slopeDistance;
        const yOffset = ROOF_HEIGHT - Math.sin(roofAngle) * slopeDistance;

        for (let col = 0; col < panelsPerRow && panelsPlaced < totalPanels; col++) {
          const x = startX + col * (PANEL_WIDTH + PANEL_GAP);
          const y = WALL_HEIGHT + yOffset + PANEL_LIFT;
          const z = zOffset;

          positions.push({
            pos: [x, y, z],
            rot: [roofAngle, 0, 0],
          });

          panelsPlaced++;
        }
      }
    }

    return positions;
  }, [totalPanels, roofAngle]);

  return (
    <group>
      {panelPositions.map((panel, i) => (
        <SolarPanel key={i} position={panel.pos} rotation={panel.rot} />
      ))}
    </group>
  );
}
