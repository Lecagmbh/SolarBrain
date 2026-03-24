import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  GripVertical,
  AlertTriangle,
  Clock,
  FileText,
  Send,
  Mail,
  ChevronRight,
  CheckCircle2,
  Flame,
  Zap,
} from 'lucide-react';
import type { TaskItem } from '../../types';

interface AdminTaskListProps {
  tasks: TaskItem[];
  onTaskClick?: (task: TaskItem) => void;
  onReorder?: (tasks: TaskItem[]) => void;
  isLoading?: boolean;
}

// Inline style constants
const styles = {
  card: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  cardHigh: {
    borderLeft: '3px solid #ef4444',
  } as React.CSSProperties,
  cardOverdue: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)',
  } as React.CSSProperties,
  filterPill: {
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '8px',
    border: '1px solid transparent',
    background: 'transparent',
    color: '#a1a1aa',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  filterPillActive: {
    background: 'rgba(212, 168, 67, 0.15)',
    color: '#EAD068',
    borderColor: 'rgba(212, 168, 67, 0.3)',
  } as React.CSSProperties,
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 500,
  } as React.CSSProperties,
  badgeOverdue: {
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  } as React.CSSProperties,
  badgeUrgent: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
  } as React.CSSProperties,
  iconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0,
  } as React.CSSProperties,
};

const PRIORITY_CONFIG = {
  high: {
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    label: 'Dringend',
  },
  medium: {
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    label: 'Normal',
  },
  low: {
    color: '#60a5fa',
    bg: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    label: 'Niedrig',
  },
};

const TYPE_CONFIG: Record<string, { emoji: string; label: string }> = {
  submit: { emoji: '📤', label: 'Einreichen' },
  'nb-mail': { emoji: '📧', label: 'NB-Mail' },
  ibn: { emoji: '📋', label: 'IBN-Protokoll' },
  followup: { emoji: '⏰', label: 'Nachfassen' },
  document: { emoji: '📄', label: 'Dokument' },
};

export function AdminTaskList({
  tasks,
  onTaskClick,
  onReorder,
  isLoading = false,
}: AdminTaskListProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [orderedTasks, setOrderedTasks] = useState(tasks);
  const [showAll, setShowAll] = useState(false);
  const MAX_VISIBLE = 5;

  // Sync orderedTasks when tasks prop changes
  useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  const filteredTasks = filter === 'all'
    ? orderedTasks
    : orderedTasks.filter(t => t.priority === filter);

  const visibleTasks = showAll ? filteredTasks : filteredTasks.slice(0, MAX_VISIBLE);
  const hiddenCount = filteredTasks.length - MAX_VISIBLE;

  const handleReorder = (newOrder: TaskItem[]) => {
    setOrderedTasks(newOrder);
    onReorder?.(newOrder);
  };

  const urgentCount = tasks.filter(t => t.priority === 'high').length;
  const overdueCount = tasks.filter(t => isOverdue(t.dueDate)).length;

  if (isLoading) {
    return <TaskListSkeleton />;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(249, 115, 22, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertTriangle size={18} color="#f87171" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Handlungsbedarf
              <span style={{
                fontSize: '12px',
                fontWeight: 500,
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                padding: '2px 8px',
                borderRadius: '10px',
              }}>
                {tasks.length}
              </span>
            </h3>
            {overdueCount > 0 && (
              <p style={{ fontSize: '11px', color: '#f87171', margin: '2px 0 0 0' }}>
                {overdueCount} überfällig
              </p>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '4px', padding: '3px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
          {(['all', 'high', 'medium', 'low'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setShowAll(false); }}
              style={{
                ...styles.filterPill,
                padding: '4px 10px',
                fontSize: '11px',
                ...(filter === f ? styles.filterPillActive : {}),
                ...(f === 'high' && filter === f ? { background: 'rgba(239,68,68,0.15)', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' } : {}),
              }}
            >
              {f === 'all' ? 'Alle' : PRIORITY_CONFIG[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Task Cards - Scrollable Container */}
      {filteredTasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{
          maxHeight: showAll ? '400px' : 'none',
          overflowY: showAll ? 'auto' : 'visible',
          paddingRight: showAll ? '4px' : 0,
        }}>
          <Reorder.Group
            axis="y"
            values={visibleTasks}
            onReorder={handleReorder}
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            <AnimatePresence>
              {visibleTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onClick={() => onTaskClick?.(task)}
                  compact
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      )}

      {/* Show More / Show Less Button */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: '#a1a1aa',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          {showAll ? (
            <>Weniger anzeigen</>
          ) : (
            <>
              <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
              {hiddenCount} weitere anzeigen
            </>
          )}
        </button>
      )}

      {/* Footer */}
      {urgentCount > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', fontSize: '12px' }}>
          <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
            <Flame size={12} />
            {urgentCount} dringend
          </span>
        </div>
      )}
    </div>
  );
}

interface TaskCardProps {
  task: TaskItem;
  index: number;
  onClick?: () => void;
  compact?: boolean;
}

function TaskCard({ task, index, onClick, compact = false }: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority];
  const typeConfig = TYPE_CONFIG[task.type] || TYPE_CONFIG.submit;
  const overdue = isOverdue(task.dueDate);
  const daysOverdue = getDaysOverdue(task.dueDate);

  const cardStyle: React.CSSProperties = {
    ...styles.card,
    padding: compact ? '10px 12px' : '16px',
    marginBottom: compact ? '6px' : '12px',
    ...(task.priority === 'high' ? styles.cardHigh : {}),
    ...(overdue ? styles.cardOverdue : {}),
  };

  return (
    <Reorder.Item
      value={task}
      id={String(task.id)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.02 }}
      onClick={onClick}
      style={{ listStyle: 'none' }}
    >
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '10px' : '16px' }}>
          {/* Type Icon - smaller in compact mode */}
          <div style={{
            ...styles.iconBox,
            width: compact ? '36px' : '48px',
            height: compact ? '36px' : '48px',
            borderRadius: compact ? '8px' : '12px',
            fontSize: compact ? '18px' : '24px',
            background: priority.bg,
            border: `1px solid ${priority.borderColor}`,
          }}>
            {typeConfig.emoji}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: compact ? '13px' : '14px',
                fontWeight: 500,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '200px',
              }}>
                {task.title}
              </span>
              {task.publicId && (
                <span style={{
                  fontSize: '10px',
                  color: '#71717a',
                  fontFamily: 'monospace',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  flexShrink: 0,
                }}>
                  {task.publicId}
                </span>
              )}
            </div>

            {!compact && task.subtitle && (
              <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '4px 0 0 0' }}>
                {task.subtitle}
              </p>
            )}
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
            {overdue && (
              <span style={{ ...styles.badge, ...styles.badgeOverdue, fontSize: '10px', padding: '2px 6px' }}>
                <Flame size={10} />
                {daysOverdue}d
              </span>
            )}
            {task.priority === 'high' && !overdue && (
              <span style={{ ...styles.badge, ...styles.badgeUrgent, fontSize: '10px', padding: '2px 6px' }}>
                <Zap size={10} />
              </span>
            )}
            <ChevronRight size={16} color="#52525b" />
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}

function TaskListSkeleton() {
  return (
    <div>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            height: '96px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.02)',
            marginBottom: '12px',
          }}
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
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', textAlign: 'center' }}
    >
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <CheckCircle2 size={28} color="#4ade80" />
      </div>
      <p style={{ color: '#fff', fontWeight: 500, margin: 0 }}>Alles erledigt!</p>
      <p style={{ color: '#71717a', fontSize: '14px', margin: '4px 0 0 0' }}>Keine offenen Aufgaben</p>
    </motion.div>
  );
}

// Helper functions
function isOverdue(date: Date | string | undefined): boolean {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

function getDaysOverdue(date: Date | string | undefined): number {
  if (!date) return 0;
  const d = new Date(date);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDueDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Morgen';
  if (diffDays < 7) return `in ${diffDays} Tagen`;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export default AdminTaskList;
