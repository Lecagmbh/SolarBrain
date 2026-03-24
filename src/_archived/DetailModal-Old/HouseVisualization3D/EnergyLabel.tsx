/**
 * Energy Label Component
 * ======================
 * Reusable HTML label for 3D space
 */

import { Html } from "@react-three/drei";

type LabelVariant = "solar" | "battery" | "wallbox" | "grid" | "inverter" | "heatpump";

interface EnergyLabelProps {
  position: [number, number, number];
  icon: string;
  title: string;
  value: string | number;
  unit: string;
  variant: LabelVariant;
  visible?: boolean;
}

export function EnergyLabel({
  position,
  icon,
  title,
  value,
  unit,
  variant,
  visible = true,
}: EnergyLabelProps) {
  if (!visible) return null;

  return (
    <Html
      position={position}
      center
      distanceFactor={8}
      occlude={false}
      style={{
        transition: "opacity 0.3s ease",
        pointerEvents: "none",
      }}
    >
      <div className={`energy-label energy-label--${variant}`}>
        <span className="energy-label__icon">{icon}</span>
        <span className="energy-label__title">{title}</span>
        <span className="energy-label__value">
          {typeof value === "number" ? value.toFixed(2) : value}
          <span>{unit}</span>
        </span>
      </div>
    </Html>
  );
}

// Pre-configured labels for common use cases
export function SolarLabel({
  position,
  kwp,
}: {
  position: [number, number, number];
  kwp: number;
}) {
  if (kwp <= 0) return null;
  return (
    <EnergyLabel
      position={position}
      icon="☀️"
      title="PV-ANLAGE"
      value={kwp}
      unit="kWp"
      variant="solar"
    />
  );
}

export function BatteryLabel({
  position,
  kwh,
}: {
  position: [number, number, number];
  kwh: number;
}) {
  if (kwh <= 0) return null;
  return (
    <EnergyLabel
      position={position}
      icon="🔋"
      title="SPEICHER"
      value={kwh}
      unit="kWh"
      variant="battery"
    />
  );
}

export function WallboxLabel({
  position,
  kw,
}: {
  position: [number, number, number];
  kw: number;
}) {
  if (kw <= 0) return null;
  return (
    <EnergyLabel
      position={position}
      icon="🔌"
      title="WALLBOX"
      value={kw}
      unit="kW"
      variant="wallbox"
    />
  );
}

export function GridLabel({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <EnergyLabel
      position={position}
      icon="⚡"
      title="STROMNETZ"
      value="~"
      unit=""
      variant="grid"
    />
  );
}

export function InverterLabel({
  position,
  kw,
}: {
  position: [number, number, number];
  kw: number;
}) {
  if (kw <= 0) return null;
  return (
    <EnergyLabel
      position={position}
      icon="⚙️"
      title="WECHSELRICHTER"
      value={kw}
      unit="kW"
      variant="inverter"
    />
  );
}

export function HeatPumpLabel({
  position,
  kw,
}: {
  position: [number, number, number];
  kw: number;
}) {
  if (kw <= 0) return null;
  return (
    <EnergyLabel
      position={position}
      icon="🌡️"
      title="WÄRMEPUMPE"
      value={kw}
      unit="kW"
      variant="heatpump"
    />
  );
}
