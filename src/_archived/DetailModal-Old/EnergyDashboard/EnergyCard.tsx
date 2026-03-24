/**
 * Energy Card Component - Premium Edition
 * =======================================
 * Glassmorphism card with animated icons and glow effects
 */

import { useMemo } from "react";

export type EnergyCardType =
  | "solar"
  | "battery"
  | "wallbox"
  | "heatpump"
  | "grid"
  | "house"
  | "inverter";

interface EnergyCardProps {
  type: EnergyCardType;
  value: number;
  unit: string;
  details?: string[];
  percentage?: number;
  isEmpty?: boolean;
}

// SVG Icon Components for professional look
const SolarIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="energy-card__svg-icon">
    <defs>
      <linearGradient id="solarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
    {/* Sun rays */}
    <g className="energy-card__icon-rays">
      <line x1="32" y1="4" x2="32" y2="12" stroke="url(#solarGrad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="52" x2="32" y2="60" stroke="url(#solarGrad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="4" y1="32" x2="12" y2="32" stroke="url(#solarGrad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="52" y1="32" x2="60" y2="32" stroke="url(#solarGrad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="12" y1="12" x2="17" y2="17" stroke="url(#solarGrad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="47" y1="47" x2="52" y2="52" stroke="url(#solarGrad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="12" y1="52" x2="17" y2="47" stroke="url(#solarGrad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="47" y1="17" x2="52" y2="12" stroke="url(#solarGrad)" strokeWidth="3" strokeLinecap="round" />
    </g>
    {/* Sun center */}
    <circle cx="32" cy="32" r="14" fill="url(#solarGrad)" className="energy-card__icon-core" />
  </svg>
);

const BatteryIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="energy-card__svg-icon">
    <defs>
      <linearGradient id="batteryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#22c55e" />
      </linearGradient>
    </defs>
    <rect x="8" y="16" width="44" height="36" rx="4" stroke="url(#batteryGrad)" strokeWidth="3" fill="none" />
    <rect x="52" y="26" width="6" height="16" rx="2" fill="url(#batteryGrad)" />
    <rect x="14" y="22" width="10" height="24" rx="2" fill="url(#batteryGrad)" className="energy-card__icon-fill" />
    <rect x="27" y="22" width="10" height="24" rx="2" fill="url(#batteryGrad)" opacity="0.6" className="energy-card__icon-fill" />
    <rect x="40" y="22" width="6" height="24" rx="2" fill="url(#batteryGrad)" opacity="0.3" className="energy-card__icon-fill" />
  </svg>
);

const HouseIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="energy-card__svg-icon">
    <defs>
      <linearGradient id="houseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f0d878" />
        <stop offset="100%" stopColor="#EAD068" />
      </linearGradient>
    </defs>
    <path d="M32 8L6 28H14V56H50V28H58L32 8Z" fill="url(#houseGrad)" className="energy-card__icon-core" />
    <rect x="26" y="36" width="12" height="20" fill="rgba(0,0,0,0.3)" rx="2" />
    <circle cx="35" cy="46" r="1.5" fill="rgba(255,255,255,0.5)" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="energy-card__svg-icon">
    <defs>
      <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    {/* Tower */}
    <path d="M28 8L20 56H44L36 8H28Z" fill="url(#gridGrad)" className="energy-card__icon-core" />
    {/* Cross bars */}
    <line x1="16" y1="24" x2="48" y2="24" stroke="url(#gridGrad)" strokeWidth="3" strokeLinecap="round" />
    <line x1="12" y1="40" x2="52" y2="40" stroke="url(#gridGrad)" strokeWidth="3" strokeLinecap="round" />
    {/* Lightning bolt */}
    <path d="M32 16L26 30H34L28 48" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" className="energy-card__icon-bolt" />
  </svg>
);

const WallboxIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="energy-card__svg-icon">
    <defs>
      <linearGradient id="wallboxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    {/* Car body */}
    <path d="M8 38L14 26H50L56 38V48H52V52H44V48H20V52H12V48H8V38Z" fill="url(#wallboxGrad)" className="energy-card__icon-core" />
    {/* Windows */}
    <path d="M16 28L20 38H32V28H16Z" fill="rgba(255,255,255,0.3)" />
    <path d="M34 28V38H44L48 28H34Z" fill="rgba(255,255,255,0.3)" />
    {/* Wheels */}
    <circle cx="18" cy="48" r="5" fill="rgba(0,0,0,0.4)" />
    <circle cx="46" cy="48" r="5" fill="rgba(0,0,0,0.4)" />
    {/* Charging bolt */}
    <path d="M32 10L28 20H36L30 32" stroke="url(#wallboxGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" className="energy-card__icon-bolt" />
  </svg>
);

const HeatPumpIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="energy-card__svg-icon">
    <defs>
      <linearGradient id="heatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    {/* Flame */}
    <path
      d="M32 8C32 8 18 22 18 36C18 44 24 52 32 56C40 52 46 44 46 36C46 22 32 8 32 8Z"
      fill="url(#heatGrad)"
      className="energy-card__icon-core"
    />
    {/* Inner flame */}
    <path
      d="M32 24C32 24 26 32 26 38C26 42 28 46 32 48C36 46 38 42 38 38C38 32 32 24 32 24Z"
      fill="#fbbf24"
      opacity="0.8"
    />
    {/* Heat waves */}
    <path d="M14 44C14 44 10 48 10 52" stroke="url(#heatGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.5" className="energy-card__icon-wave" />
    <path d="M50 44C50 44 54 48 54 52" stroke="url(#heatGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.5" className="energy-card__icon-wave" />
  </svg>
);

const InverterIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="energy-card__svg-icon">
    <defs>
      <linearGradient id="inverterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>
    <rect x="10" y="14" width="44" height="36" rx="4" fill="url(#inverterGrad)" className="energy-card__icon-core" />
    <circle cx="22" cy="32" r="6" fill="rgba(255,255,255,0.3)" />
    <circle cx="42" cy="32" r="6" fill="rgba(255,255,255,0.3)" />
    {/* Sine wave */}
    <path d="M16 32 Q22 24, 28 32 T40 32 T52 32" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

// Card configuration with SVG icons
const cardConfig: Record<
  EnergyCardType,
  { Icon: React.FC; label: string; emptyText: string }
> = {
  solar: {
    Icon: SolarIcon,
    label: "PV-ANLAGE",
    emptyText: "Keine PV-Anlage",
  },
  battery: {
    Icon: BatteryIcon,
    label: "SPEICHER",
    emptyText: "Kein Speicher",
  },
  wallbox: {
    Icon: WallboxIcon,
    label: "WALLBOX",
    emptyText: "Keine Wallbox",
  },
  heatpump: {
    Icon: HeatPumpIcon,
    label: "WÄRMEPUMPE",
    emptyText: "Keine Wärmepumpe",
  },
  grid: {
    Icon: GridIcon,
    label: "STROMNETZ",
    emptyText: "Netzanschluss",
  },
  house: {
    Icon: HouseIcon,
    label: "VERBRAUCH",
    emptyText: "Eigenverbrauch",
  },
  inverter: {
    Icon: InverterIcon,
    label: "WECHSELRICHTER",
    emptyText: "Kein Wechselrichter",
  },
};

export function EnergyCard({
  type,
  value,
  unit,
  details,
  percentage,
  isEmpty = false,
}: EnergyCardProps) {
  const config = cardConfig[type];
  const { Icon } = config;

  // Format number display
  const formattedValue = useMemo(() => {
    if (isEmpty || value === 0) return "—";
    if (value >= 100) return value.toFixed(0);
    if (value >= 10) return value.toFixed(1);
    return value.toFixed(2);
  }, [value, isEmpty]);

  const classNames = [
    "energy-card",
    `energy-card--${type}`,
    isEmpty && "energy-card--empty",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      <div className="energy-card__icon">
        <Icon />
      </div>
      <div className="energy-card__label">{config.label}</div>

      <div className="energy-card__value">
        <span className="energy-card__number">{formattedValue}</span>
        {!isEmpty && value > 0 && (
          <span className="energy-card__unit">{unit}</span>
        )}
      </div>

      {percentage !== undefined && percentage > 0 && !isEmpty && (
        <div className="energy-card__progress">
          <div
            className="energy-card__progress-fill"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}

      {details && details.length > 0 && !isEmpty && (
        <div className="energy-card__details">
          {details.map((detail, i) => (
            <div key={i} className="energy-card__detail">
              <span className="energy-card__detail-icon">•</span>
              {detail}
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="energy-card__details">
          <div className="energy-card__detail">{config.emptyText}</div>
        </div>
      )}
    </div>
  );
}
