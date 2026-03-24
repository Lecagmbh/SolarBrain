/**
 * Animated Sun Component
 * ======================
 * Sun with pulsing glow and rotating rays
 */

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { HOUSE_DIMENSIONS } from "./House";

const { scale: SCALE } = HOUSE_DIMENSIONS;

// Sun dimensions
const SUN_RADIUS = 0.8 * SCALE;
const RAY_COUNT = 12;
const RAY_LENGTH = 0.5 * SCALE;

interface SunProps {
  position?: [number, number, number];
  hasSolar?: boolean;
}

export function Sun({ position, hasSolar = true }: SunProps) {
  const sunRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const raysRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Rotate rays slowly
    if (raysRef.current) {
      raysRef.current.rotation.z = t * 0.1;
    }

    // Pulse the glow
    if (glowRef.current) {
      const pulse = 1 + Math.sin(t * 2) * 0.15;
      glowRef.current.scale.setScalar(pulse);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 2) * 0.1;
    }

    // Subtle core brightness pulse
    if (coreRef.current) {
      const brightness = 0.8 + Math.sin(t * 3) * 0.2;
      (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = brightness;
    }
  });

  const sunPosition: [number, number, number] = position || [
    -4 * SCALE,
    6 * SCALE,
    -4 * SCALE,
  ];

  return (
    <group ref={sunRef} position={sunPosition}>
      {/* Sun core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>

      {/* Inner glow */}
      <mesh ref={glowRef} scale={1.3}>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#fef08a"
          transparent
          opacity={0.35}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer glow */}
      <mesh scale={1.8}>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#fcd34d"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Sun rays */}
      <group ref={raysRef}>
        {Array.from({ length: RAY_COUNT }).map((_, i) => {
          const angle = (i / RAY_COUNT) * Math.PI * 2;
          const isLongRay = i % 2 === 0;
          const rayLength = isLongRay ? RAY_LENGTH * 1.2 : RAY_LENGTH * 0.8;
          const rayWidth = isLongRay ? 0.08 * SCALE : 0.05 * SCALE;

          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * (SUN_RADIUS + rayLength / 2 + 0.1 * SCALE),
                Math.sin(angle) * (SUN_RADIUS + rayLength / 2 + 0.1 * SCALE),
                0,
              ]}
              rotation={[0, 0, angle + Math.PI / 2]}
            >
              <boxGeometry args={[rayWidth, rayLength, rayWidth * 0.5]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#f59e0b"
                emissiveIntensity={0.6}
                transparent
                opacity={0.9}
              />
            </mesh>
          );
        })}
      </group>

      {/* Point light for illumination */}
      {hasSolar && (
        <pointLight
          color="#fff5e0"
          intensity={0.5}
          distance={20 * SCALE}
          decay={2}
        />
      )}
    </group>
  );
}
