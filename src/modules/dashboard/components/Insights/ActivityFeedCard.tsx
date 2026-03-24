import { motion } from 'framer-motion';
import {
  Activity,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { ActivityItem } from '../../types';

interface ActivityFeedCardProps {
  activities: ActivityItem[];
  onActivityClick?: (activity: ActivityItem) => void;
  onViewAll?: () => void;
  isLoading?: boolean;
  maxItems?: number;
  title?: string;
}

// Style constants
const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    marginBottom: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  iconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  } as React.CSSProperties,
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 500,
    flexShrink: 0,
  } as React.CSSProperties,
};

const ACTIVITY_CONFIG: Record<string, {
  emoji: string;
  color: string;
  bg: string;
  label: string;
}> = {
  created: { emoji: '✨', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', label: 'Erstellt' },
  submitted: { emoji: '📤', color: '#EAD068', bg: 'rgba(212, 168, 67, 0.15)', label: 'Eingereicht' },
  approved: { emoji: '✅', color: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)', label: 'Genehmigt' },
  query: { emoji: '❓', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', label: 'Rückfrage' },
  pending: { emoji: '⏳', color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.15)', label: 'Wartend' },
  email: { emoji: '✉️', color: '#f0d878', bg: 'rgba(139, 92, 246, 0.15)', label: 'E-Mail' },
  warning: { emoji: '⚠️', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', label: 'Warnung' },
  default: { emoji: '📌', color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.15)', label: 'Aktivität' },
};

export function ActivityFeedCard({
  activities,
  onActivityClick,
  onViewAll,
  isLoading = false,
  maxItems = 5,
  title = 'Letzte Aktivitäten',
}: ActivityFeedCardProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (isLoading) {
    return <ActivitySkeleton count={maxItems} />;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={16} color="#34d399" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>{title}</h3>
        </div>
        {onViewAll && activities.length > maxItems && (
          <button
            onClick={onViewAll}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#EAD068',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Alle anzeigen
            <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* Activity List */}
      <div>
        {displayActivities.map((activity, index) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            index={index}
            onClick={() => onActivityClick?.(activity)}
          />
        ))}
      </div>

      {activities.length === 0 && <EmptyState />}
    </div>
  );
}

interface ActivityRowProps {
  activity: ActivityItem;
  index: number;
  onClick?: () => void;
}

function ActivityRow({ activity, index, onClick }: ActivityRowProps) {
  const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.default;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      style={styles.row}
    >
      {/* Icon with Emoji */}
      <div style={{ ...styles.iconBox, background: config.bg }}>
        {config.emoji}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>
            {activity.title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activity.publicId && (
            <span style={{ fontSize: '11px', color: '#52525b', fontFamily: 'monospace' }}>
              #{activity.publicId}
            </span>
          )}
          {activity.description && (
            <>
              {activity.publicId && <span style={{ color: '#3f3f46' }}>•</span>}
              <span style={{ fontSize: '12px', color: '#71717a' }}>
                {activity.description}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <span style={{
        ...styles.badge,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}33`,
      }}>
        {config.label}
      </span>

      {/* Time */}
      <span style={{ fontSize: '11px', color: '#52525b', minWidth: '40px', textAlign: 'right', flexShrink: 0 }}>
        {formatRelativeTime(activity.timestamp)}
      </span>

      {/* Arrow */}
      <ChevronRight size={14} color="#3f3f46" style={{ flexShrink: 0 }} />
    </motion.div>
  );
}

function ActivitySkeleton({ count }: { count: number }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ height: '20px', width: '140px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '64px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.02)',
            marginBottom: '8px',
          }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', textAlign: 'center' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'rgba(161, 161, 170, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px',
      }}>
        <Activity size={20} color="#71717a" />
      </div>
      <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>Keine Aktivitäten</p>
    </div>
  );
}

function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Jetzt';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Gestern';
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export default ActivityFeedCard;
