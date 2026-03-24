// =============================================================================
// Baunity Dashboard V4 - GridOperatorRanking Component
// =============================================================================

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Award,
} from "lucide-react";
import type {
  GridOperatorRankingProps,
  GridOperatorPerformance,
} from "../types/dashboard.types";
import { cn, getBarWidth, getHeatmapColor } from "../utils/helpers";

// -----------------------------------------------------------------------------
// GridOperatorRanking Component
// -----------------------------------------------------------------------------

export const GridOperatorRanking: React.FC<GridOperatorRankingProps> = ({
  operators,
  maxItems = 5,
  onViewAll,
}) => {
  const visibleOperators = operators.slice(0, maxItems);

  if (operators.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">NB Performance</h3>
        </div>
        <p className="text-sm text-slate-400 text-center py-4">
          Keine Daten verfügbar
        </p>
      </div>
    );
  }

  // Max-Wert für Balken-Berechnung (null-safe)
  const maxDays = Math.max(...operators.map((o) => o.avgDays ?? 0).filter(d => d > 0), 1);

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <h3 className="card-title">NB Performance</h3>
        <button onClick={onViewAll} className="card-link">
          Alle anzeigen
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Ranking List */}
      <div className="ranking-list">
        {visibleOperators.map((operator, index) => (
          <RankingItem
            key={operator.id}
            operator={operator}
            position={index + 1}
            maxDays={maxDays}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-500">
        Ø Bearbeitungszeit in Tagen (niedriger = besser)
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// RankingItem Component
// -----------------------------------------------------------------------------

interface RankingItemProps {
  operator: GridOperatorPerformance;
  position: number;
  maxDays: number;
}

const RankingItem: React.FC<RankingItemProps> = ({
  operator,
  position,
  maxDays,
}) => {
  // Farbe basierend auf Performance (invertiert: weniger Tage = grüner)
  const days = operator.avgDays ?? 0;
  const barColor = getHeatmapColor(days, 0, maxDays);
  const barWidth = getBarWidth(days, maxDays);

  // Trend Icon
  const TrendIcon =
    operator.trend === "up"
      ? TrendingUp
      : operator.trend === "down"
      ? TrendingDown
      : Minus;

  const trendColor =
    operator.trend === "up"
      ? "text-red-400" // Langsamer = schlecht
      : operator.trend === "down"
      ? "text-green-400" // Schneller = gut
      : "text-slate-500";

  return (
    <div className="ranking-item">
      {/* Position */}
      <div
        className={cn(
          "ranking-position",
          position === 1 && "ranking-position--1",
          position === 2 && "ranking-position--2",
          position === 3 && "ranking-position--3"
        )}
      >
        {position <= 3 ? <Award className="w-3 h-3" /> : position}
      </div>

      {/* Content */}
      <div className="ranking-content">
        <div className="ranking-name">
          {operator.shortName || operator.name}
        </div>
        <div className="ranking-bar-container">
          <div
            className="ranking-bar"
            style={{
              width: barWidth,
              backgroundColor: barColor,
            }}
          />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-center gap-1">
        <span className="ranking-value">{operator.avgDays !== null ? operator.avgDays : '-'}</span>
        <span className="ranking-unit">d</span>
        <TrendIcon className={cn("w-3 h-3 ml-1", trendColor)} />
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Detailed Ranking (mit mehr Infos)
// -----------------------------------------------------------------------------

interface DetailedRankingProps {
  operators: GridOperatorPerformance[];
  onOperatorClick: (operatorId: number) => void;
}

export const DetailedRanking: React.FC<DetailedRankingProps> = ({
  operators,
  onOperatorClick,
}) => {
  return (
    <div className="space-y-3">
      {operators.map((operator, index) => (
        <div
          key={operator.id}
          className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors"
          onClick={() => onOperatorClick(operator.id)}
        >
          {/* Position */}
          <div
            className={cn(
              "ranking-position",
              index === 0 && "ranking-position--1",
              index === 1 && "ranking-position--2",
              index === 2 && "ranking-position--3"
            )}
          >
            {index + 1}
          </div>

          {/* Name & Stats */}
          <div className="flex-1">
            <div className="font-medium text-slate-200">{operator.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {operator.openCases} offen / {operator.totalCases} gesamt
            </div>
          </div>

          {/* Metrics */}
          <div className="text-right">
            <div className="text-lg font-bold text-slate-200">
              {operator.avgDays !== null ? `Ø ${operator.avgDays}d` : '-'}
            </div>
            <div className="text-xs text-slate-500">
              {operator.approvalRate}% genehmigt
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Skeleton Loading State
// -----------------------------------------------------------------------------

export const GridOperatorRankingSkeleton: React.FC = () => (
  <div className="card">
    <div className="card-header">
      <div className="skeleton skeleton--title w-28" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton w-6 h-6 rounded-full" />
          <div className="flex-1 space-y-1">
            <div className="skeleton skeleton--text w-32" />
            <div className="skeleton h-1.5 rounded" />
          </div>
          <div className="skeleton w-10 h-5" />
        </div>
      ))}
    </div>
  </div>
);

export default GridOperatorRanking;
