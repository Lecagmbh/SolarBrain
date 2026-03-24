import { motion } from 'framer-motion';
import {
  Zap,
  Clock,
  CheckCircle,
  MessageSquare,
  ChevronRight,
  SunMedium,
  Battery,
  Building2,
} from 'lucide-react';
import type { CustomerAnlage } from '../../types';

interface CustomerAnlagenProps {
  anlagen: CustomerAnlage[];
  onAnlageClick?: (anlage: CustomerAnlage) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<string, {
  color: string;
  bg: string;
  icon: typeof CheckCircle;
  label: string;
}> = {
  eingang: {
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    icon: Clock,
    label: 'Eingang',
  },
  entwurf: {
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    icon: Clock,
    label: 'Entwurf',
  },
  eingereicht: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    icon: Zap,
    label: 'Eingereicht',
  },
  'beim-nb': {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    icon: Clock,
    label: 'Beim Netzbetreiber',
  },
  rueckfrage: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    icon: MessageSquare,
    label: 'Rückfrage',
  },
  genehmigt: {
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    icon: CheckCircle,
    label: 'Genehmigt',
  },
  ibn: {
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    icon: Zap,
    label: 'IBN',
  },
  fertig: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    icon: CheckCircle,
    label: 'Fertig',
  },
  abgeschlossen: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    icon: CheckCircle,
    label: 'Abgeschlossen',
  },
};

/**
 * CustomerAnlagen - Übersicht der Kundenanlagen mit Status
 */
export function CustomerAnlagen({
  anlagen,
  onAnlageClick,
  isLoading = false,
}: CustomerAnlagenProps) {
  if (isLoading) {
    return <AnlagenSkeleton />;
  }

  return (
    <div className="customer-anlagen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Ihre Anmeldungen</h3>
        <span className="text-sm text-zinc-500">{anlagen.length} Anlagen</span>
      </div>

      {/* Anlagen List */}
      {anlagen.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {anlagen.map((anlage, index) => (
            <AnlageCard
              key={anlage.id}
              anlage={anlage}
              index={index}
              onClick={() => onAnlageClick?.(anlage)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AnlageCardProps {
  anlage: CustomerAnlage;
  index: number;
  onClick?: () => void;
}

function AnlageCard({ anlage, index, onClick }: AnlageCardProps) {
  const status = STATUS_CONFIG[anlage.status] || STATUS_CONFIG.entwurf;
  const StatusIcon = status.icon;
  const isUrgent = anlage.status === 'rueckfrage';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`
        group relative p-4 rounded-xl cursor-pointer
        bg-white/[0.02] border border-white/5
        hover:bg-white/[0.04] hover:border-white/10
        transition-all duration-200
        ${isUrgent ? 'border-l-2 border-l-red-500/50 animate-pulse-subtle' : ''}
      `}
    >
      {/* Main Content */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-xl ${status.bg}`}>
          <SunMedium size={20} className={status.color} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-white truncate">
              {anlage.standort}
            </h4>
            {anlage.publicId && (
              <span className="text-xs text-zinc-500 font-mono">
                #{anlage.publicId}
              </span>
            )}
          </div>

          {/* Status Badge + Details */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`
              inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs
              ${status.bg} ${status.color}
            `}>
              <StatusIcon size={12} />
              {status.label}
            </span>

            {anlage.leistung && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Battery size={12} />
                {anlage.leistung} kWp
              </span>
            )}

            {anlage.netzbetreiber && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Building2 size={12} />
                {anlage.netzbetreiber}
              </span>
            )}
          </div>

          {/* Last Update */}
          {anlage.lastUpdate && (
            <p className="text-xs text-zinc-500 mt-2">
              Letzte Aktualisierung: {formatRelativeTime(anlage.lastUpdate)}
            </p>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight
          size={18}
          className="text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all mt-1"
        />
      </div>

      {/* Urgent Badge */}
      {isUrgent && (
        <div className="absolute top-2 right-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        </div>
      )}
    </motion.div>
  );
}

function AnlagenSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 rounded-xl bg-white/[0.02] animate-pulse"
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
      className="customer-empty-state"
    >
      <div className="customer-empty-state__icon">
        <SunMedium />
      </div>
      <p className="customer-empty-state__title">Noch keine Anlagen</p>
      <p className="customer-empty-state__desc">
        Starten Sie jetzt Ihre erste Netzanmeldung und behalten Sie den Status im Blick
      </p>
      <div className="customer-empty-state__hint">
        <Zap />
        <span>Schnell & einfach in wenigen Minuten</span>
      </div>
    </motion.div>
  );
}

function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Gerade eben';
  if (diffMins < 60) return `vor ${diffMins} Min.`;
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  if (diffDays === 1) return 'Gestern';
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export default CustomerAnlagen;
