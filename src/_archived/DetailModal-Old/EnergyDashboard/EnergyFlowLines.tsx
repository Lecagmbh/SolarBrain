/**
 * Energy Flow Lines Component - Premium Edition
 * =============================================
 * Animated SVG curved Bezier paths with flowing particles
 * Professional energy flow visualization
 */

import { useEffect, useRef, useState, useCallback } from "react";

interface FlowPath {
  id: string;
  path: string;
  color: string;
  colorLight: string;
  type: "solar" | "battery" | "grid" | "consumption" | "wallbox" | "heatpump";
  duration: number;
}

interface EnergyFlowLinesProps {
  hasSolar: boolean;
  hasBattery: boolean;
  hasWallbox: boolean;
  hasHeatPump: boolean;
}

// Color definitions
const COLORS = {
  solar: { main: "#f59e0b", light: "#fbbf24", rgb: "245, 158, 11" },
  battery: { main: "#22c55e", light: "#4ade80", rgb: "34, 197, 94" },
  grid: { main: "#3b82f6", light: "#60a5fa", rgb: "59, 130, 246" },
  consumption: { main: "#EAD068", light: "#f0d878", rgb: "139, 92, 246" },
  wallbox: { main: "#06b6d4", light: "#22d3ee", rgb: "6, 182, 212" },
  heatpump: { main: "#ef4444", light: "#f87171", rgb: "239, 68, 68" },
};

export function EnergyFlowLines({
  hasSolar,
  hasBattery,
  hasWallbox,
  hasHeatPump,
}: EnergyFlowLinesProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [flowPaths, setFlowPaths] = useState<FlowPath[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate smooth curved Bezier paths
  const calculatePaths = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const container = svg.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    setDimensions({ width: containerRect.width, height: containerRect.height });

    // Get card positions
    const getCardCenter = (selector: string) => {
      const card = container.querySelector(selector);
      if (!card) return null;
      const rect = card.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top,
        top: rect.top - containerRect.top,
        bottom: rect.bottom - containerRect.top,
        left: rect.left - containerRect.left,
        right: rect.right - containerRect.left,
        width: rect.width,
        height: rect.height,
      };
    };

    const solar = getCardCenter(".energy-card--solar");
    const battery = getCardCenter(".energy-card--battery");
    const house = getCardCenter(".energy-card--house");
    const grid = getCardCenter(".energy-card--grid");
    const wallbox = getCardCenter(".energy-card--wallbox");
    const heatpump = getCardCenter(".energy-card--heatpump");

    const newPaths: FlowPath[] = [];

    // Create smooth curved Bezier paths

    // 1. Solar to House (main energy flow)
    if (solar && house && hasSolar) {
      const startY = solar.bottom + 5;
      const endY = house.top - 5;
      const midY = (startY + endY) / 2;

      // Smooth vertical curve with slight S-bend
      const path = `
        M ${solar.x} ${startY}
        C ${solar.x} ${midY - 20},
          ${house.x} ${midY + 20},
          ${house.x} ${endY}
      `.trim();

      newPaths.push({
        id: "solar-to-house",
        path,
        color: COLORS.solar.main,
        colorLight: COLORS.solar.light,
        type: "solar",
        duration: 2,
      });
    }

    // 2. Solar to Battery (branching flow)
    if (solar && battery && hasSolar && hasBattery) {
      const startY = solar.bottom + 5;
      const endY = battery.top - 5;

      // Curved path going left
      const controlX1 = solar.x - (solar.x - battery.x) * 0.3;
      const controlY1 = startY + (endY - startY) * 0.4;
      const controlX2 = battery.x + (solar.x - battery.x) * 0.2;
      const controlY2 = startY + (endY - startY) * 0.7;

      const path = `
        M ${solar.x} ${startY}
        C ${controlX1} ${controlY1},
          ${controlX2} ${controlY2},
          ${battery.x} ${endY}
      `.trim();

      newPaths.push({
        id: "solar-to-battery",
        path,
        color: COLORS.battery.main,
        colorLight: COLORS.battery.light,
        type: "battery",
        duration: 2.5,
      });
    }

    // 3. House to Grid (bidirectional flow)
    if (house && grid) {
      const startX = house.right + 5;
      const endX = grid.left - 5;
      const midX = (startX + endX) / 2;

      // Smooth horizontal curve
      const path = `
        M ${startX} ${house.y}
        C ${midX} ${house.y - 15},
          ${midX} ${grid.y + 15},
          ${endX} ${grid.y}
      `.trim();

      newPaths.push({
        id: "house-to-grid",
        path,
        color: COLORS.grid.main,
        colorLight: COLORS.grid.light,
        type: "grid",
        duration: 1.8,
      });
    }

    // 4. Battery to House (discharge)
    if (battery && house && hasBattery) {
      const startX = battery.right + 5;
      const endX = house.left - 5;

      // Curved horizontal path
      const midX = (startX + endX) / 2;
      const path = `
        M ${startX} ${battery.y}
        C ${midX} ${battery.y + 20},
          ${midX} ${house.y - 20},
          ${endX} ${house.y}
      `.trim();

      newPaths.push({
        id: "battery-to-house",
        path,
        color: COLORS.consumption.main,
        colorLight: COLORS.consumption.light,
        type: "consumption",
        duration: 2.2,
      });
    }

    // 5. Battery to Wallbox
    if (battery && wallbox && hasBattery && hasWallbox) {
      const startY = battery.bottom + 5;
      const endY = wallbox.top - 5;
      const midY = (startY + endY) / 2;

      const path = `
        M ${battery.x} ${startY}
        C ${battery.x} ${midY},
          ${wallbox.x} ${midY},
          ${wallbox.x} ${endY}
      `.trim();

      newPaths.push({
        id: "battery-to-wallbox",
        path,
        color: COLORS.wallbox.main,
        colorLight: COLORS.wallbox.light,
        type: "wallbox",
        duration: 2.3,
      });
    }

    // 6. House to Heatpump
    if (house && heatpump && hasHeatPump) {
      const startX = house.right + 5;
      const startY = house.bottom - house.height * 0.3;
      const endY = heatpump.top - 5;

      // Curved path going right and down
      const path = `
        M ${startX} ${startY}
        Q ${heatpump.x} ${startY},
          ${heatpump.x} ${endY}
      `.trim();

      newPaths.push({
        id: "house-to-heatpump",
        path,
        color: COLORS.heatpump.main,
        colorLight: COLORS.heatpump.light,
        type: "heatpump",
        duration: 2.1,
      });
    }

    // 7. Grid to Heatpump (alternative)
    if (grid && heatpump && hasHeatPump && !hasBattery) {
      const startY = grid.bottom + 5;
      const endY = heatpump.top - 5;
      const midY = (startY + endY) / 2;

      const path = `
        M ${grid.x} ${startY}
        C ${grid.x} ${midY},
          ${heatpump.x} ${midY},
          ${heatpump.x} ${endY}
      `.trim();

      newPaths.push({
        id: "grid-to-heatpump",
        path,
        color: COLORS.heatpump.main,
        colorLight: COLORS.heatpump.light,
        type: "heatpump",
        duration: 2.4,
      });
    }

    setFlowPaths(newPaths);
  }, [hasSolar, hasBattery, hasWallbox, hasHeatPump]);

  // Setup resize observer
  useEffect(() => {
    calculatePaths();

    const handleResize = () => {
      calculatePaths();
    };

    window.addEventListener("resize", handleResize);

    // Recalculate after cards are rendered
    const timeouts = [
      setTimeout(calculatePaths, 50),
      setTimeout(calculatePaths, 150),
      setTimeout(calculatePaths, 300),
    ];

    return () => {
      window.removeEventListener("resize", handleResize);
      timeouts.forEach(clearTimeout);
    };
  }, [calculatePaths]);

  if (flowPaths.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      className="energy-flow-svg"
      viewBox={`0 0 ${dimensions.width || 800} ${dimensions.height || 600}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Gradient definitions for each flow type */}
        {Object.entries(COLORS).map(([type, colors]) => (
          <linearGradient
            key={`gradient-${type}`}
            id={`flowGradient-${type}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={colors.light} stopOpacity="0.9" />
            <stop offset="50%" stopColor={colors.main} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.light} stopOpacity="0.9" />
          </linearGradient>
        ))}

        {/* Glow filter for lines */}
        <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Strong glow for particles */}
        <filter id="particleGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur1" />
          <feGaussianBlur stdDeviation="6" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Particle with trail gradient */}
        {flowPaths.map((flow) => (
          <radialGradient
            key={`particle-gradient-${flow.id}`}
            id={`particleGradient-${flow.id}`}
          >
            <stop offset="0%" stopColor={flow.colorLight} stopOpacity="1" />
            <stop offset="50%" stopColor={flow.color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={flow.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* Render each flow path */}
      {flowPaths.map((flow, index) => (
        <g key={flow.id}>
          {/* Wide glow background */}
          <path
            d={flow.path}
            fill="none"
            stroke={flow.color}
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.08"
            className="flow-line-glow"
          />

          {/* Medium glow */}
          <path
            d={flow.path}
            fill="none"
            stroke={flow.color}
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.15"
            filter="url(#lineGlow)"
          />

          {/* Main solid line */}
          <path
            d={flow.path}
            fill="none"
            stroke={`url(#flowGradient-${flow.type})`}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
            className="flow-line-main"
          />

          {/* Animated dashed line */}
          <path
            d={flow.path}
            fill="none"
            stroke={flow.colorLight}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="10 20"
            opacity="0.9"
            className="flow-line-animated"
            style={{
              animation: `flowDash ${flow.duration * 0.8}s linear infinite`,
            }}
          />

          {/* Define path for particle motion */}
          <path
            id={`motionPath-${flow.id}`}
            d={flow.path}
            fill="none"
            stroke="none"
          />

          {/* Main particle */}
          <circle
            r="6"
            fill={flow.colorLight}
            filter="url(#particleGlow)"
            className={`flow-particle flow-particle--${flow.type}`}
          >
            <animateMotion
              dur={`${flow.duration}s`}
              repeatCount="indefinite"
              rotate="auto"
            >
              <mpath href={`#motionPath-${flow.id}`} />
            </animateMotion>
          </circle>

          {/* Secondary particle (delayed) */}
          <circle
            r="4"
            fill={flow.color}
            filter="url(#particleGlow)"
            opacity="0.7"
          >
            <animateMotion
              dur={`${flow.duration}s`}
              repeatCount="indefinite"
              rotate="auto"
              begin={`${flow.duration * 0.5}s`}
            >
              <mpath href={`#motionPath-${flow.id}`} />
            </animateMotion>
          </circle>

          {/* Third particle (smaller, different timing) */}
          <circle
            r="3"
            fill={flow.colorLight}
            filter="url(#particleGlow)"
            opacity="0.5"
          >
            <animateMotion
              dur={`${flow.duration * 1.2}s`}
              repeatCount="indefinite"
              rotate="auto"
              begin={`${flow.duration * 0.25}s`}
            >
              <mpath href={`#motionPath-${flow.id}`} />
            </animateMotion>
          </circle>
        </g>
      ))}
    </svg>
  );
}
