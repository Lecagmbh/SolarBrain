// =============================================================================
// Baunity Dashboard V4 - KPICards Component
// =============================================================================

import React from "react";
import {
  Activity,
  Zap,
  Euro,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { KPICardsProps, DashboardKPIs } from "../types/dashboard.types";
import { formatCurrency, formatCompactNumber, cn } from "../utils/helpers";

// -----------------------------------------------------------------------------
// KPI Configuration
// -----------------------------------------------------------------------------

interface KPIConfig {
  key: keyof DashboardKPIs;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  formatValue?: (value: number, data?: KPICardProps["data"]) => string;
  link?: string;
}

const KPI_CONFIG: KPIConfig[] = [
  {
    key: "neueAnmeldungen",
    icon: Activity,
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.1)",
    link: "/netzanmeldungen?created=thisMonth",
  },
  {
    key: "abgeschlossen",
    icon: Zap,
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.1)",
    link: "/netzanmeldungen?status=FERTIG",
  },
  {
    key: "kunden",
    icon: Users,
    color: "#EAD068",
    bgColor: "rgba(139, 92, 246, 0.1)",
    link: "/kunden",
  },
  {
    key: "anlagen",
    icon: Building2,
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.1)",
    link: "/anlagen",
  },
  {
    key: "offeneRechnungen",
    icon: Euro,
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
    formatValue: (_, data) => formatCurrency(data?.summe || 0),
    link: "/finanzen?status=OFFEN",
  },
];

// -----------------------------------------------------------------------------
// KPICards Component
// -----------------------------------------------------------------------------

export const KPICards: React.FC<KPICardsProps> = ({ kpis, loading }) => {
  if (loading) {
    return <KPICardsSkeleton />;
  }

  if (!kpis) {
    return null;
  }

  return (
    <div className="kpi-grid">
      {KPI_CONFIG.map((config) => {
        const data = kpis[config.key];
        if (!data) return null;

        return (
          <KPICard
            key={config.key}
            config={config}
            data={data}
          />
        );
      })}
    </div>
  );
};

// -----------------------------------------------------------------------------
// KPICard Component
// -----------------------------------------------------------------------------

interface KPICardProps {
  config: KPIConfig;
  data: {
    value: number;
    trend?: number;
    label: string;
    summe?: number;
  };
}

const KPICard: React.FC<KPICardProps> = ({ config, data }) => {
  const Icon = config.icon;
  const displayValue = config.formatValue
    ? config.formatValue(data.value, data)
    : formatCompactNumber(data.value);

  const handleClick = () => {
    if (config.link) {
      window.location.href = config.link;
    }
  };

  return (
    <div
      className="kpi-card group"
      onClick={handleClick}
      style={{
        borderColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = config.color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: config.bgColor }}
      >
        <Icon className="w-5 h-5" style={{ color: config.color }} />
      </div>

      {/* Value */}
      <div
        className={cn(
          "kpi-value",
          config.key === "offeneRechnungen" && "kpi-value--currency"
        )}
      >
        {displayValue}
      </div>

      {/* Label */}
      <div className="kpi-label">{data.label}</div>

      {/* Trend */}
      {data.trend !== undefined && data.trend !== 0 && (
        <TrendBadge trend={data.trend} />
      )}

      {/* Sub-value for invoices */}
      {config.key === "offeneRechnungen" && data.value > 0 && (
        <div className="text-xs text-slate-500 mt-1">
          {data.value} Rechnung{data.value > 1 ? "en" : ""}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// TrendBadge Component
// -----------------------------------------------------------------------------

interface TrendBadgeProps {
  trend: number;
}

const TrendBadge: React.FC<TrendBadgeProps> = ({ trend }) => {
  const isPositive = trend > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "kpi-trend",
        isPositive ? "kpi-trend--up" : "kpi-trend--down"
      )}
    >
      <TrendIcon className="w-3 h-3" />
      {Math.abs(trend)}%
    </div>
  );
};

// -----------------------------------------------------------------------------
// Skeleton Loading State
// -----------------------------------------------------------------------------

export const KPICardsSkeleton: React.FC = () => (
  <div className="kpi-grid">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="kpi-card">
        <div className="skeleton w-10 h-10 mx-auto mb-2 rounded-lg" />
        <div className="skeleton w-16 h-8 mx-auto mb-1" />
        <div className="skeleton w-20 h-3 mx-auto" />
      </div>
    ))}
  </div>
);

export default KPICards;
