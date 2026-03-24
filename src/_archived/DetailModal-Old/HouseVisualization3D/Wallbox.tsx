/**
 * Wallbox and Electric Car Components
 * ====================================
 * EV charging station with connected vehicle
 */

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { HOUSE_DIMENSIONS } from "./House";

const { scale: SCALE, width: HOUSE_WIDTH, depth: HOUSE_DEPTH } = HOUSE_DIMENSIONS;

// Wallbox dimensions
const WALLBOX_WIDTH = 0.25 * SCALE;
const WALLBOX_HEIGHT = 0.4 * SCALE;
const WALLBOX_DEPTH = 0.12 * SCALE;

// Car dimensions (Tesla Model 3 inspired)
const CAR_LENGTH = 2.5 * SCALE;
const CAR_WIDTH = 1.0 * SCALE;
const CAR_HEIGHT = 0.75 * SCALE;

// Wallbox Station
function WallboxStation({ charging = false }: { charging: boolean }) {
  const ledRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(0);

  useFrame((state) => {
    if (ledRef.current && charging) {
      pulseRef.current = state.clock.elapsedTime;
      const pulse = 0.5 + Math.sin(pulseRef.current * 3) * 0.5;
      (ledRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
  });

  return (
    <group>
      {/* Post/stand */}
      <mesh position={[0, 0.5 * SCALE, 0]} castShadow>
        <boxGeometry args={[0.1 * SCALE, 1.0 * SCALE, 0.1 * SCALE]} />
        <meshStandardMaterial color="#404040" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Main wallbox body */}
      <mesh position={[0, 1.0 * SCALE, 0]} castShadow>
        <boxGeometry args={[WALLBOX_WIDTH, WALLBOX_HEIGHT, WALLBOX_DEPTH]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Front panel */}
      <mesh position={[0, 1.0 * SCALE, WALLBOX_DEPTH / 2 + 0.001]}>
        <boxGeometry args={[WALLBOX_WIDTH * 0.85, WALLBOX_HEIGHT * 0.85, 0.01]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
      </mesh>

      {/* LED ring/indicator */}
      <mesh
        ref={ledRef}
        position={[0, 1.05 * SCALE, WALLBOX_DEPTH / 2 + 0.015]}
      >
        <ringGeometry args={[0.04 * SCALE, 0.06 * SCALE, 32]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={charging ? 0.8 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cable holder hook */}
      <mesh position={[WALLBOX_WIDTH / 2 + 0.02 * SCALE, 0.9 * SCALE, 0]}>
        <boxGeometry args={[0.04 * SCALE, 0.1 * SCALE, 0.08 * SCALE]} />
        <meshStandardMaterial color="#333" roughness={0.5} />
      </mesh>

      {/* Ground base */}
      <mesh position={[0, 0.02 * SCALE, 0]} receiveShadow>
        <boxGeometry args={[0.2 * SCALE, 0.04 * SCALE, 0.2 * SCALE]} />
        <meshStandardMaterial color="#505050" roughness={0.7} />
      </mesh>
    </group>
  );
}

// Charging Cable
function ChargingCable({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  const cablePoints = useMemo(() => {
    // Create a curved path from wallbox to car
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(...start),
      new THREE.Vector3(
        start[0],
        start[1] - 0.3 * SCALE,
        start[2]
      ),
      new THREE.Vector3(
        (start[0] + end[0]) / 2,
        0.1 * SCALE,
        (start[2] + end[2]) / 2
      ),
      new THREE.Vector3(
        end[0],
        end[1] + 0.1 * SCALE,
        end[2]
      ),
      new THREE.Vector3(...end),
    ]);
    return curve;
  }, [start, end]);

  return (
    <mesh>
      <tubeGeometry args={[cablePoints, 32, 0.015 * SCALE, 8, false]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
    </mesh>
  );
}

// Electric Car (Tesla-inspired)
function ElectricCar() {
  return (
    <group>
      {/* Car body - main shape */}
      <mesh position={[0, CAR_HEIGHT * 0.35, 0]} castShadow>
        <boxGeometry args={[CAR_WIDTH, CAR_HEIGHT * 0.5, CAR_LENGTH]} />
        <meshStandardMaterial
          color="#f8f8f8"
          roughness={0.15}
          metalness={0.8}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Cabin/roof - curved top */}
      <mesh position={[0, CAR_HEIGHT * 0.7, -CAR_LENGTH * 0.05]} castShadow>
        <boxGeometry args={[CAR_WIDTH * 0.9, CAR_HEIGHT * 0.4, CAR_LENGTH * 0.55]} />
        <meshStandardMaterial
          color="#f8f8f8"
          roughness={0.15}
          metalness={0.8}
        />
      </mesh>

      {/* Windshield */}
      <mesh
        position={[0, CAR_HEIGHT * 0.65, -CAR_LENGTH * 0.35]}
        rotation={[-0.5, 0, 0]}
      >
        <planeGeometry args={[CAR_WIDTH * 0.85, CAR_HEIGHT * 0.45]} />
        <meshPhysicalMaterial
          color="#111"
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Rear window */}
      <mesh
        position={[0, CAR_HEIGHT * 0.65, CAR_LENGTH * 0.25]}
        rotation={[0.4, Math.PI, 0]}
      >
        <planeGeometry args={[CAR_WIDTH * 0.8, CAR_HEIGHT * 0.35]} />
        <meshPhysicalMaterial
          color="#111"
          roughness={0.05}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Side windows */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * CAR_WIDTH * 0.45, CAR_HEIGHT * 0.65, -CAR_LENGTH * 0.05]}
          rotation={[0, side * Math.PI / 2, 0]}
        >
          <planeGeometry args={[CAR_LENGTH * 0.45, CAR_HEIGHT * 0.3]} />
          <meshPhysicalMaterial
            color="#111"
            roughness={0.05}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      {/* Wheels */}
      {[
        [-CAR_WIDTH / 2.2, 0.12 * SCALE, -CAR_LENGTH * 0.32],
        [CAR_WIDTH / 2.2, 0.12 * SCALE, -CAR_LENGTH * 0.32],
        [-CAR_WIDTH / 2.2, 0.12 * SCALE, CAR_LENGTH * 0.32],
        [CAR_WIDTH / 2.2, 0.12 * SCALE, CAR_LENGTH * 0.32],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          {/* Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.12 * SCALE, 0.12 * SCALE, 0.08 * SCALE, 24]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
          {/* Rim */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07 * SCALE, 0.07 * SCALE, 0.085 * SCALE, 16]} />
            <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Headlights */}
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x * CAR_WIDTH, CAR_HEIGHT * 0.35, -CAR_LENGTH / 2 - 0.01]}>
          <boxGeometry args={[0.15 * SCALE, 0.05 * SCALE, 0.02 * SCALE]} />
          <meshStandardMaterial
            color="#fff"
            emissive="#fff"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Taillights */}
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x * CAR_WIDTH, CAR_HEIGHT * 0.4, CAR_LENGTH / 2 + 0.01]}>
          <boxGeometry args={[0.12 * SCALE, 0.03 * SCALE, 0.02 * SCALE]} />
          <meshStandardMaterial
            color="#ff0000"
            emissive="#ff0000"
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      {/* Charge port (on left side) */}
      <mesh position={[-CAR_WIDTH / 2 - 0.005, CAR_HEIGHT * 0.4, -CAR_LENGTH * 0.15]}>
        <boxGeometry args={[0.02 * SCALE, 0.08 * SCALE, 0.08 * SCALE]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

interface WallboxProps {
  kw?: number;
  position?: [number, number, number];
}

export function Wallbox({ kw = 0, position }: WallboxProps) {
  if (kw <= 0) return null;

  // Default position: in front of house, to the right
  const wallboxPosition: [number, number, number] = position || [
    HOUSE_WIDTH / 2 + 1.0 * SCALE,
    0,
    -HOUSE_DEPTH / 2 - 1.5 * SCALE,
  ];

  // Car position: next to wallbox
  const carPosition: [number, number, number] = [
    wallboxPosition[0] + 0.8 * SCALE,
    0,
    wallboxPosition[2] + 0.5 * SCALE,
  ];

  // Cable connection points
  const cableStart: [number, number, number] = [
    wallboxPosition[0],
    0.85 * SCALE,
    wallboxPosition[2] + WALLBOX_DEPTH / 2,
  ];

  const cableEnd: [number, number, number] = [
    carPosition[0] - CAR_WIDTH / 2,
    CAR_HEIGHT * 0.4,
    carPosition[2] - CAR_LENGTH * 0.15,
  ];

  return (
    <group>
      {/* Wallbox station */}
      <group position={wallboxPosition}>
        <WallboxStation charging={true} />
      </group>

      {/* Electric car */}
      <group position={carPosition} rotation={[0, -Math.PI / 4, 0]}>
        <ElectricCar />
      </group>

      {/* Charging cable */}
      <ChargingCable start={cableStart} end={cableEnd} />

      {/* Driveway/parking spot */}
      <mesh
        position={[carPosition[0], 0.005, carPosition[2]]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 4]}
        receiveShadow
      >
        <planeGeometry args={[CAR_WIDTH * 1.5, CAR_LENGTH * 1.3]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.95} />
      </mesh>
    </group>
  );
}
