import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { AnimatedCounter } from '../AnimatedCounter';
import type { NBPerformanceItem } from '../../types';
import '../../dashboard.css';

interface NBPerformanceProps {
  items: NBPerformanceItem[];
  onItemClick?: (item: NBPerformanceItem) => void;
  isLoading?: boolean;
  maxItems?: number;
}

const TREND_CONFIG = {
  up: { icon: TrendingUp, color: 'text-green-400', label: 'Verbessert', cssClass: 'trend-indicator--up' },
  down: { icon: TrendingDown, color: 'text-red-400', label: 'Verschlechtert', cssClass: 'trend-indicator--down' },
  stable: { icon: Minus, color: 'text-zinc-400', label: 'Stabil', cssClass: 'trend-indicator--stable' },
};

/**
 * NBPerformance - Netzbetreiber Performance Ranking mit Progress Bars
 */
export function NBPerformance({
  items,
  onItemClick,
  isLoading = false,
  maxItems = 5,
}: NBPerformanceProps) {
  const displayItems = items.slice(0, maxItems);

  if (isLoading) {
    return <PerformanceSkeleton count={maxItems} />;
  }

  return (
    <div className="nb-performance">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center">
            <Trophy size={16} className="text-yellow-400" />
          </div>
          <h3 className="text-base font-semibold text-white">NB Performance</h3>
        </div>
        <span className="text-xs text-zinc-500">Letzte 30 Tage</span>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <Clock size={12} /> Ø Tage
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle size={12} /> Offen
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle size={12} /> Quote
        </span>
      </div>

      {/* Rankings as Cards */}
      <div className="space-y-3">
        {displayItems.map((item, index) => (
          <PerformanceCard
            key={item.id}
            item={item}
            rank={index + 1}
            onClick={() => onItemClick?.(item)}
          />
        ))}
      </div>

      {items.length === 0 && <EmptyState />}
    </div>
  );
}

interface PerformanceCardProps {
  item: NBPerformanceItem;
  rank: number;
  onClick?: () => void;
}

function PerformanceCard({ item, rank, onClick }: PerformanceCardProps) {
  const trend = TREND_CONFIG[item.trend];
  const TrendIcon = trend.icon;
  const isTopThree = rank <= 3;

  // Determine progress bar variant based on approval rate
  const progressVariant = item.approvalRate >= 90 ? 'success' : item.approvalRate >= 70 ? 'warning' : 'danger';

  // Get rank style
  const getRankClass = () => {
    if (rank === 1) return 'nb-performance-card__rank--gold';
    if (rank === 2) return 'nb-performance-card__rank--silver';
    if (rank === 3) return 'nb-performance-card__rank--bronze';
    return 'bg-white/5 text-zinc-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      onClick={onClick}
      className={`nb-performance-card ${isTopThree && rank === 1 ? 'nb-performance-card--top' : ''}`}
    >
      {/* Header Row */}
      <div className="nb-performance-card__header">
        <div className="flex items-center gap-3">
          <div className={`nb-performance-card__rank ${getRankClass()}`}>
            {rank}
          </div>
          <span className="nb-performance-card__name">{item.name}</span>
        </div>
        <div className={`trend-indicator ${trend.cssClass}`}>
          <TrendIcon size={12} />
          <span>{trend.label}</span>
        </div>
      </div>

      {/* Progress Bar for Approval Rate */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-500">Genehmigungsquote</span>
          <span className={`text-sm font-semibold ${
            item.approvalRate >= 90 ? 'text-green-400' :
            item.approvalRate >= 70 ? 'text-amber-400' : 'text-red-400'
          }`}>
            <AnimatedCounter value={item.approvalRate} duration={0.8} />%
          </span>
        </div>
        <div className={`progress-bar progress-bar--${progressVariant}`}>
          <div
            className="progress-bar__fill"
            style={{ width: `${item.approvalRate}%` }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="nb-performance-card__stats">
        <div className="nb-performance-card__stat">
          <div className="nb-performance-card__stat-label">Ø Bearbeitung</div>
          <div className={`nb-performance-card__stat-value ${
            item.avgDays === null ? 'text-zinc-500' :
            item.avgDays <= 7 ? 'text-green-400' :
            item.avgDays <= 14 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {item.avgDays !== null ? <><AnimatedCounter value={item.avgDays} duration={0.8} /> Tage</> : '-'}
          </div>
        </div>
        <div className="nb-performance-card__stat">
          <div className="nb-performance-card__stat-label">Offene Fälle</div>
          <div className={`nb-performance-card__stat-value ${
            item.openCases === 0 ? 'text-green-400' :
            item.openCases <= 5 ? 'text-zinc-400' : 'text-amber-400'
          }`}>
            <AnimatedCounter value={item.openCases} duration={0.8} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PerformanceSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      <div className="h-6 w-32 skeleton mb-4" />
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-xl skeleton"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3">
        <Trophy size={20} className="text-yellow-500/50" />
      </div>
      <p className="text-zinc-500 text-sm">Keine Daten verfügbar</p>
    </div>
  );
}

export default NBPerformance;
