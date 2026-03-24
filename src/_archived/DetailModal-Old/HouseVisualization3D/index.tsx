/**
 * SENEC-Style 3D House Visualization
 * ===================================
 * Professional energy monitoring visualization using Three.js
 *
 * Components:
 * - Realistic house with hip roof (Walmdach)
 * - Solar panels arranged in rows
 * - Battery storage (Tesla Powerwall style)
 * - Wallbox with electric car
 * - Heat pump with rotating fan
 * - Power grid connection
 * - Animated energy flows
 * - Glassmorphism labels
 */

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";

// Components
import { House, HOUSE_DIMENSIONS } from "./House";
import { SolarPanels } from "./SolarPanels";
import { Battery } from "./Battery";
import { Wallbox } from "./Wallbox";
import { Inverter } from "./Inverter";
import { PowerGrid } from "./PowerGrid";
import { HeatPump } from "./HeatPump";
import { Ground } from "./Ground";
import { Sun } from "./Sun";
import { EnergyFlow } from "./EnergyFlow";
import {
  SolarLabel,
  BatteryLabel,
  WallboxLabel,
  GridLabel,
  InverterLabel,
  HeatPumpLabel,
} from "./EnergyLabel";

// Styles
import "./styles.css";

const { scale: SCALE, wallHeight, roofHeight, width: HOUSE_WIDTH, depth: HOUSE_DEPTH } = HOUSE_DIMENSIONS;

// Loading fallback
function LoadingScreen() {
  return (
    <div className="house-viz-loading">
      <div className="house-viz-loading__spinner" />
      <div className="house-viz-loading__text">3D-Visualisierung wird geladen...</div>
    </div>
  );
}

// Scene content
function Scene({
  totalKwp = 0,
  speicherKwh = 0,
  wallboxKw = 0,
  waermepumpeKw = 0,
  wechselrichterKw = 0,
}: SceneProps) {
  const hasSolar = totalKwp > 0;
  const hasBattery = speicherKwh > 0;
  const hasWallbox = wallboxKw > 0;
  const hasHeatPump = waermepumpeKw > 0;
  const hasInverter = wechselrichterKw > 0;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <hemisphereLight
        args={["#87CEEB", "#3d5a3d", 0.5]}
        position={[0, 10, 0]}
      />
      <directionalLight
        position={[8, 12, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />
      <directionalLight
        position={[-5, 8, -5]}
        intensity={0.3}
        color="#b0c4de"
      />

      {/* Ground and environment */}
      <Ground />
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={10}
      />

      {/* Animated sun */}
      {hasSolar && <Sun hasSolar={hasSolar} />}

      {/* Main house */}
      <House />

      {/* Solar panels on roof */}
      {hasSolar && <SolarPanels kwp={totalKwp} />}

      {/* Energy components */}
      {hasBattery && <Battery kwh={speicherKwh} />}
      {hasWallbox && <Wallbox kw={wallboxKw} />}
      {hasInverter && <Inverter kw={wechselrichterKw} />}
      {hasHeatPump && <HeatPump kw={waermepumpeKw} />}
      <PowerGrid />

      {/* Animated energy flow */}
      <EnergyFlow
        hasSolar={hasSolar}
        hasBattery={hasBattery}
        hasWallbox={hasWallbox}
        hasHeatPump={hasHeatPump}
      />

      {/* Labels */}
      {hasSolar && (
        <SolarLabel
          position={[0, wallHeight + roofHeight + 0.8 * SCALE, 0]}
          kwp={totalKwp}
        />
      )}
      {hasBattery && (
        <BatteryLabel
          position={[HOUSE_WIDTH / 2 + 0.8 * SCALE, 1.5 * SCALE, -HOUSE_DEPTH / 4]}
          kwh={speicherKwh}
        />
      )}
      {hasWallbox && (
        <WallboxLabel
          position={[HOUSE_WIDTH / 2 + 1.8 * SCALE, 1.2 * SCALE, -HOUSE_DEPTH / 2 - 1.0 * SCALE]}
          kw={wallboxKw}
        />
      )}
      {hasInverter && (
        <InverterLabel
          position={[-HOUSE_WIDTH / 2 - 0.8 * SCALE, wallHeight * 0.5 + 0.5 * SCALE, 0]}
          kw={wechselrichterKw}
        />
      )}
      {hasHeatPump && (
        <HeatPumpLabel
          position={[HOUSE_WIDTH / 2 + 0.8 * SCALE, 1.2 * SCALE, HOUSE_DEPTH / 4]}
          kw={waermepumpeKw}
        />
      )}
      <GridLabel
        position={[-HOUSE_WIDTH / 2 - 2.5 * SCALE, 3.5 * SCALE, HOUSE_DEPTH / 2 + 1.0 * SCALE]}
      />

      {/* Camera controls */}
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.3}
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={12}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, wallHeight * 0.5, 0]}
      />
    </>
  );
}

interface SceneProps {
  totalKwp?: number;
  speicherKwh?: number;
  wallboxKw?: number;
  waermepumpeKw?: number;
  wechselrichterKw?: number;
}

export interface HouseVisualization3DProps extends SceneProps {
  messkonzept?: string;
}

export function HouseVisualization3D({
  totalKwp = 0,
  speicherKwh = 0,
  wallboxKw = 0,
  waermepumpeKw = 0,
  wechselrichterKw = 0,
  messkonzept,
}: HouseVisualization3DProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="house-viz-container">
      <Suspense fallback={<LoadingScreen />}>
        <Canvas
          shadows
          camera={{
            position: [6, 5, 6],
            fov: 45,
            near: 0.1,
            far: 100,
          }}
          onCreated={() => setIsLoaded(true)}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
        >
          <color attach="background" args={["#0a0f1a"]} />
          <fog attach="fog" args={["#0a0f1a", 15, 30]} />

          <Scene
            totalKwp={totalKwp}
            speicherKwh={speicherKwh}
            wallboxKw={wallboxKw}
            waermepumpeKw={waermepumpeKw}
            wechselrichterKw={wechselrichterKw}
          />
        </Canvas>
      </Suspense>

      {/* Interaction hint */}
      <div className="house-viz-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M2 12h20M8 8l4 4 4-4M8 16l4-4 4 4" />
        </svg>
        Ziehen zum Drehen
      </div>

      {/* Stats overlay */}
      {isLoaded && (
        <div className="house-viz-stats">
          {totalKwp > 0 && (
            <div className="house-viz-stat house-viz-stat--solar">
              <span className="house-viz-stat__label">Solar</span>
              <span className="house-viz-stat__value">{totalKwp.toFixed(2)} kWp</span>
            </div>
          )}
          {speicherKwh > 0 && (
            <div className="house-viz-stat house-viz-stat--battery">
              <span className="house-viz-stat__label">Speicher</span>
              <span className="house-viz-stat__value">{speicherKwh.toFixed(1)} kWh</span>
            </div>
          )}
          {wallboxKw > 0 && (
            <div className="house-viz-stat">
              <span className="house-viz-stat__label">Wallbox</span>
              <span className="house-viz-stat__value">{wallboxKw} kW</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HouseVisualization3D;
