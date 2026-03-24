/**
 * ENERGY DASHBOARD
 * ================
 * Modern energy flow visualization with animated cards
 * Alternative to 3D house visualization - cleaner and more professional
 */

import { useMemo } from "react";
import { EnergyCard } from "./EnergyCard";
import { EnergyFlowLines } from "./EnergyFlowLines";
import "./EnergyDashboard.css";

export interface EnergyDashboardProps {
  totalKwp?: number;
  speicherKwh?: number;
  wallboxKw?: number;
  waermepumpeKw?: number;
  wechselrichterKw?: number;
  messkonzept?: string;
  // Extended data for details
  moduleCount?: number;
  moduleManufacturer?: string;
  moduleModel?: string;
  inverterManufacturer?: string;
  inverterModel?: string;
  batteryManufacturer?: string;
  batteryModel?: string;
  wallboxManufacturer?: string;
  wallboxModel?: string;
}

export function EnergyDashboard({
  totalKwp = 0,
  speicherKwh = 0,
  wallboxKw = 0,
  waermepumpeKw = 0,
  wechselrichterKw = 0,
  messkonzept,
  moduleCount,
  moduleManufacturer,
  moduleModel,
  inverterManufacturer,
  inverterModel,
  batteryManufacturer,
  batteryModel,
  wallboxManufacturer,
  wallboxModel,
}: EnergyDashboardProps) {
  // Determine what's present
  const hasSolar = totalKwp > 0;
  const hasBattery = speicherKwh > 0;
  const hasWallbox = wallboxKw > 0;
  const hasHeatPump = waermepumpeKw > 0;
  const hasInverter = wechselrichterKw > 0;

  // Build details arrays
  const solarDetails = useMemo(() => {
    const details: string[] = [];
    if (moduleCount) details.push(`${moduleCount} Module`);
    if (moduleManufacturer && moduleModel) {
      details.push(`${moduleManufacturer} ${moduleModel}`);
    } else if (moduleManufacturer) {
      details.push(moduleManufacturer);
    }
    if (inverterManufacturer && inverterModel) {
      details.push(`WR: ${inverterManufacturer} ${inverterModel}`);
    } else if (wechselrichterKw > 0) {
      details.push(`WR: ${wechselrichterKw} kW`);
    }
    return details;
  }, [moduleCount, moduleManufacturer, moduleModel, inverterManufacturer, inverterModel, wechselrichterKw]);

  const batteryDetails = useMemo(() => {
    const details: string[] = [];
    if (batteryManufacturer && batteryModel) {
      details.push(`${batteryManufacturer} ${batteryModel}`);
    } else if (batteryManufacturer) {
      details.push(batteryManufacturer);
    }
    return details;
  }, [batteryManufacturer, batteryModel]);

  const wallboxDetails = useMemo(() => {
    const details: string[] = [];
    if (wallboxManufacturer && wallboxModel) {
      details.push(`${wallboxManufacturer} ${wallboxModel}`);
    } else if (wallboxManufacturer) {
      details.push(wallboxManufacturer);
    }
    return details;
  }, [wallboxManufacturer, wallboxModel]);

  // Get messkonzept description
  const messkonzeptLabel = useMemo(() => {
    const labels: Record<string, string> = {
      mk1: "MK1 - Volleinspeisung",
      mk2: "MK2 - Überschusseinspeisung",
      mk3: "MK3 - Mit Speicher",
      mk4: "MK4 - Nulleinspeisung",
    };
    return messkonzept ? labels[messkonzept.toLowerCase()] || messkonzept.toUpperCase() : null;
  }, [messkonzept]);

  const gridDetails = useMemo(() => {
    const details: string[] = [];
    if (messkonzeptLabel) {
      details.push(messkonzeptLabel);
    }
    return details;
  }, [messkonzeptLabel]);

  return (
    <div className="energy-dashboard">
      {/* Messkonzept Badge */}
      {messkonzept && (
        <div className="energy-dashboard__badge">
          {messkonzept.toUpperCase()}
        </div>
      )}

      {/* Header Stats */}
      <div className="energy-dashboard__header">
        {hasSolar && (
          <div className="energy-dashboard__stat energy-dashboard__stat--solar">
            <div className="energy-dashboard__stat-label">Solarleistung</div>
            <div className="energy-dashboard__stat-value">{totalKwp.toFixed(2)} kWp</div>
          </div>
        )}
        {hasBattery && (
          <div className="energy-dashboard__stat energy-dashboard__stat--battery">
            <div className="energy-dashboard__stat-label">Speicherkapazität</div>
            <div className="energy-dashboard__stat-value">{speicherKwh.toFixed(1)} kWh</div>
          </div>
        )}
        {(hasWallbox || hasHeatPump) && (
          <div className="energy-dashboard__stat energy-dashboard__stat--grid">
            <div className="energy-dashboard__stat-label">Verbraucher</div>
            <div className="energy-dashboard__stat-value">
              {[
                hasWallbox && `${wallboxKw} kW WB`,
                hasHeatPump && `${waermepumpeKw} kW WP`,
              ]
                .filter(Boolean)
                .join(" + ")}
            </div>
          </div>
        )}
      </div>

      {/* Energy Flow Lines (background) */}
      <EnergyFlowLines
        hasSolar={hasSolar}
        hasBattery={hasBattery}
        hasWallbox={hasWallbox}
        hasHeatPump={hasHeatPump}
      />

      {/* Cards Grid */}
      <div className="energy-dashboard__grid">
        {/* Solar - Top Center */}
        <EnergyCard
          type="solar"
          value={totalKwp}
          unit="kWp"
          details={solarDetails.length > 0 ? solarDetails : undefined}
          percentage={hasSolar ? 100 : 0}
          isEmpty={!hasSolar}
        />

        {/* Battery - Middle Left */}
        <EnergyCard
          type="battery"
          value={speicherKwh}
          unit="kWh"
          details={batteryDetails.length > 0 ? batteryDetails : undefined}
          percentage={hasBattery ? 75 : 0}
          isEmpty={!hasBattery}
        />

        {/* House - Middle Center */}
        <EnergyCard
          type="house"
          value={0}
          unit=""
          details={["Eigenverbrauch"]}
        />

        {/* Grid - Middle Right */}
        <EnergyCard
          type="grid"
          value={0}
          unit=""
          details={gridDetails.length > 0 ? gridDetails : ["Netzanschluss"]}
        />

        {/* Wallbox - Bottom Left */}
        {(hasWallbox || hasBattery) && (
          <EnergyCard
            type="wallbox"
            value={wallboxKw}
            unit="kW"
            details={wallboxDetails.length > 0 ? wallboxDetails : undefined}
            isEmpty={!hasWallbox}
          />
        )}

        {/* Heat Pump - Bottom Right */}
        {(hasHeatPump || hasSolar) && (
          <EnergyCard
            type="heatpump"
            value={waermepumpeKw}
            unit="kW"
            isEmpty={!hasHeatPump}
          />
        )}
      </div>
    </div>
  );
}

export default EnergyDashboard;
