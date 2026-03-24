import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Wrench,
  ClipboardCheck,
  Users,
  ChevronRight,
} from 'lucide-react';
import type { TerminItem } from '../../types';

interface UpcomingTermineProps {
  termine: TerminItem[];
  onTerminClick?: (termin: TerminItem) => void;
  isLoading?: boolean;
  maxItems?: number;
}

const TYPE_CONFIG = {
  ibn: {
    icon: ClipboardCheck,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    label: 'IBN-Termin',
  },
  zaehlerwechsel: {
    icon: Wrench,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    label: 'Zählerwechsel',
  },
  meeting: {
    icon: Users,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    label: 'Besprechung',
  },
  other: {
    icon: Calendar,
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    label: 'Termin',
  },
};

/**
 * UpcomingTermine - Nächste Termine für Kunden
 */
export function UpcomingTermine({
  termine,
  onTerminClick,
  isLoading = false,
  maxItems = 4,
}: UpcomingTermineProps) {
  const displayTermine = termine.slice(0, maxItems);

  if (isLoading) {
    return <TermineSkeleton count={maxItems} />;
  }

  return (
    <div className="upcoming-termine">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Nächste Termine</h3>
        </div>
        {termine.length > maxItems && (
          <span className="text-xs text-amber-400 cursor-pointer hover:underline">
            Alle anzeigen
          </span>
        )}
      </div>

      {/* Termine List */}
      <div className="space-y-3">
        {displayTermine.map((termin, index) => (
          <TerminCard
            key={termin.id}
            termin={termin}
            index={index}
            onClick={() => onTerminClick?.(termin)}
          />
        ))}
      </div>

      {termine.length === 0 && <EmptyState />}
    </div>
  );
}

interface TerminCardProps {
  termin: TerminItem;
  index: number;
  onClick?: () => void;
}

function TerminCard({ termin, index, onClick }: TerminCardProps) {
  const config = TYPE_CONFIG[termin.type] || TYPE_CONFIG.other;
  const TypeIcon = config.icon;
  const isToday = isSameDay(new Date(termin.date), new Date());
  const isTomorrow = isSameDay(new Date(termin.date), addDays(new Date(), 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`
        group flex items-start gap-3 p-3 rounded-xl cursor-pointer
        bg-white/[0.02] border border-white/5
        hover:bg-white/[0.04] hover:border-white/10
        transition-all duration-200
        ${isToday ? 'border-l-2 border-l-amber-500' : ''}
      `}
    >
      {/* Date Box */}
      <div className={`
        flex flex-col items-center justify-center p-2 rounded-lg min-w-[52px]
        ${isToday ? 'bg-amber-500/20 text-amber-400' :
          isTomorrow ? 'bg-amber-500/10 text-amber-400' :
          'bg-white/5 text-zinc-400'}
      `}>
        <span className="text-[10px] uppercase font-medium">
          {formatWeekday(termin.date)}
        </span>
        <span className="text-xl font-bold leading-none">
          {formatDay(termin.date)}
        </span>
        <span className="text-[10px]">
          {formatMonth(termin.date)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`p-1 rounded ${config.bg}`}>
            <TypeIcon size={12} className={config.color} />
          </span>
          <span className="text-xs text-zinc-500">{config.label}</span>
          {isToday && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
              Heute
            </span>
          )}
        </div>

        <h4 className="text-sm font-medium text-white truncate mb-1">
          {termin.title}
        </h4>

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {termin.time && (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {termin.time}
            </span>
          )}
          {termin.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin size={10} />
              {termin.location}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight
        size={16}
        className="text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all mt-2"
      />
    </motion.div>
  );
}

function TermineSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      <div className="h-6 w-32 bg-white/5 rounded animate-pulse mb-4" />
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-20 rounded-xl bg-white/[0.02] animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="termine-empty-state"
    >
      <div className="termine-empty-state__icon">
        <Calendar />
      </div>
      <p className="termine-empty-state__title">Keine anstehenden Termine</p>
      <p className="termine-empty-state__desc">
        Zählerwechsel und IBN-Termine werden hier angezeigt
      </p>
    </motion.div>
  );
}

// Date helpers
function formatWeekday(date: Date | string): string {
  return new Date(date).toLocaleDateString('de-DE', { weekday: 'short' });
}

function formatDay(date: Date | string): string {
  return new Date(date).getDate().toString();
}

function formatMonth(date: Date | string): string {
  return new Date(date).toLocaleDateString('de-DE', { month: 'short' });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default UpcomingTermine;
