/**
 * Energy Flow Component
 * =====================
 * Animated particles showing energy flow between components
 */

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { HOUSE_DIMENSIONS } from "./House";

const { scale: SCALE, wallHeight: WALL_HEIGHT, roofHeight: ROOF_HEIGHT } = HOUSE_DIMENSIONS;

// Particle settings
const PARTICLES_PER_FLOW = 15;
const PARTICLE_SIZE = 0.04 * SCALE;

interface FlowPath {
  start: THREE.Vector3;
  control: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  active: boolean;
}

// Energy particle that follows a bezier curve
function EnergyParticle({
  curve,
  speed,
  offset,
  color,
}: {
  curve: THREE.QuadraticBezierCurve3;
  speed: number;
  offset: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Calculate position along curve
      const t = ((state.clock.elapsedTime * speed + offset) % 1);
      const point = curve.getPoint(t);
      meshRef.current.position.copy(point);

      // Fade in/out at ends
      const opacity = Math.sin(t * Math.PI);
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.9;

      // Slight scale animation
      const scale = 0.8 + Math.sin(t * Math.PI) * 0.4;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[PARTICLE_SIZE, 8, 8]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

// Flow line (the path particles follow)
function FlowLine({ curve, color }: { curve: THREE.QuadraticBezierCurve3; color: string }) {
  const points = useMemo(() => curve.getPoints(32), [curve]);
  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line>
      <bufferGeometry attach="geometry" {...lineGeometry} />
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.2}
        linewidth={1}
      />
    </line>
  );
}

interface EnergyFlowProps {
  hasSolar?: boolean;
  hasBattery?: boolean;
  hasWallbox?: boolean;
  hasHeatPump?: boolean;
}

export function EnergyFlow({
  hasSolar = false,
  hasBattery = false,
  hasWallbox = false,
  hasHeatPump = false,
}: EnergyFlowProps) {
  // Define flow paths based on what components are present
  const flows = useMemo(() => {
    const paths: { curve: THREE.QuadraticBezierCurve3; color: string }[] = [];

    // Solar to house (roof to wall)
    if (hasSolar) {
      const solarToHouse = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, WALL_HEIGHT + ROOF_HEIGHT * 0.7, 0),
        new THREE.Vector3(0.5 * SCALE, WALL_HEIGHT + 0.3 * SCALE, -0.3 * SCALE),
        new THREE.Vector3(0, WALL_HEIGHT * 0.5, -HOUSE_DIMENSIONS.depth / 2 - 0.1 * SCALE)
      );
      paths.push({ curve: solarToHouse, color: "#fbbf24" });
    }

    // Solar to battery
    if (hasSolar && hasBattery) {
      const solarToBattery = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, WALL_HEIGHT + ROOF_HEIGHT * 0.5, 0),
        new THREE.Vector3(HOUSE_DIMENSIONS.width / 3, WALL_HEIGHT, 0),
        new THREE.Vector3(
          HOUSE_DIMENSIONS.width / 2 + 0.3 * SCALE,
          0.6 * SCALE,
          -HOUSE_DIMENSIONS.depth / 4
        )
      );
      paths.push({ curve: solarToBattery, color: "#22c55e" });
    }

    // House to wallbox (when charging)
    if (hasWallbox) {
      const houseToWallbox = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(HOUSE_DIMENSIONS.width / 4, WALL_HEIGHT * 0.3, -HOUSE_DIMENSIONS.depth / 2),
        new THREE.Vector3(
          HOUSE_DIMENSIONS.width / 2 + 0.5 * SCALE,
          0.5 * SCALE,
          -HOUSE_DIMENSIONS.depth / 2 - 0.8 * SCALE
        ),
        new THREE.Vector3(
          HOUSE_DIMENSIONS.width / 2 + 1.0 * SCALE,
          1.0 * SCALE,
          -HOUSE_DIMENSIONS.depth / 2 - 1.5 * SCALE
        )
      );
      paths.push({ curve: houseToWallbox, color: "#06b6d4" });
    }

    // House to heat pump
    if (hasHeatPump) {
      const houseToHeatPump = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(HOUSE_DIMENSIONS.width / 2, WALL_HEIGHT * 0.5, HOUSE_DIMENSIONS.depth / 4),
        new THREE.Vector3(
          HOUSE_DIMENSIONS.width / 2 + 0.2 * SCALE,
          0.5 * SCALE,
          HOUSE_DIMENSIONS.depth / 4
        ),
        new THREE.Vector3(
          HOUSE_DIMENSIONS.width / 2 + 0.3 * SCALE,
          0.4 * SCALE,
          HOUSE_DIMENSIONS.depth / 4
        )
      );
      paths.push({ curve: houseToHeatPump, color: "#f97316" });
    }

    return paths;
  }, [hasSolar, hasBattery, hasWallbox, hasHeatPump]);

  if (flows.length === 0) return null;

  return (
    <group>
      {flows.map((flow, flowIndex) => (
        <group key={flowIndex}>
          {/* Flow line (subtle path indicator) */}
          <FlowLine curve={flow.curve} color={flow.color} />

          {/* Animated particles */}
          {Array.from({ length: PARTICLES_PER_FLOW }).map((_, i) => (
            <EnergyParticle
              key={i}
              curve={flow.curve}
              speed={0.3 + Math.random() * 0.1}
              offset={i / PARTICLES_PER_FLOW}
              color={flow.color}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
