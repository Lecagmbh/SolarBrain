import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import type { TerminItem } from '../../types';

interface WeekCalendarProps {
  termine: TerminItem[];
  onTerminClick?: (termin: TerminItem) => void;
  onDayClick?: (date: Date) => void;
  isLoading?: boolean;
}

// Style constants
const styles = {
  container: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    overflow: 'hidden',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 16px 20px',
  } as React.CSSProperties,
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    padding: '8px',
    margin: '0 16px 16px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  } as React.CSSProperties,
  dayCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 4px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '80px',
    position: 'relative',
  } as React.CSSProperties,
  dayCellToday: {
    background: 'rgba(212, 168, 67, 0.2)',
    border: '1px solid rgba(212, 168, 67, 0.3)',
  } as React.CSSProperties,
  terminCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    margin: '0 16px 8px 16px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  terminCardToday: {
    borderLeft: '3px solid #EAD068',
  } as React.CSSProperties,
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: 600,
  } as React.CSSProperties,
};

// Termin type config
const TERMIN_TYPE_CONFIG: Record<string, {
  emoji: string;
  color: string;
  bg: string;
  label: string;
}> = {
  ibn: { emoji: '⚡', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.5)', label: 'IBN' },
  zaehlerwechsel: { emoji: '🔧', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.5)', label: 'Zählerwechsel' },
  meeting: { emoji: '👥', color: '#f0d878', bg: 'rgba(139, 92, 246, 0.5)', label: 'Besprechung' },
  other: { emoji: '📅', color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.5)', label: 'Termin' },
};

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function WeekCalendar({
  termine,
  onTerminClick,
  onDayClick,
  isLoading = false,
}: WeekCalendarProps) {
  // Get current week days
  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + mondayOffset + i);
      days.push(day);
    }
    return days;
  }, []);

  // Group termine by date
  const termineByDate = useMemo(() => {
    const grouped: Record<string, TerminItem[]> = {};
    termine.forEach(termin => {
      const dateKey = new Date(termin.date).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(termin);
    });
    return grouped;
  }, [termine]);

  // Get upcoming termine (next 7 days)
  const upcomingTermine = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    return termine
      .filter(t => {
        const d = new Date(t.date);
        return d >= today && d <= weekEnd;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [termine]);

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.2), rgba(139, 92, 246, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Calendar size={20} color="#EAD068" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
              Termine diese Woche
            </h3>
            <p style={{ fontSize: '12px', color: '#71717a', margin: '4px 0 0 0' }}>
              {upcomingTermine.length} anstehend
            </p>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div style={styles.weekGrid}>
        {weekDays.map((day, index) => {
          const dateKey = day.toDateString();
          const dayTermine = termineByDate[dateKey] || [];
          const isToday = day.toDateString() === new Date().toDateString();
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

          return (
            <div
              key={index}
              onClick={() => onDayClick?.(day)}
              style={{
                ...styles.dayCell,
                ...(isToday ? styles.dayCellToday : {}),
                opacity: isPast && !isToday ? 0.5 : 1,
              } as React.CSSProperties}
            >
              {/* Weekday label */}
              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                marginBottom: '4px',
                color: isToday ? '#EAD068' : '#71717a',
              }}>
                {WEEKDAYS[index]}
              </span>

              {/* Date number */}
              <span style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '8px',
                color: isToday ? '#fff' : '#d4d4d8',
              }}>
                {day.getDate()}
              </span>

              {/* Termin dots */}
              <div style={{ display: 'flex', gap: '3px', minHeight: '8px' }}>
                {dayTermine.slice(0, 3).map((t, i) => {
                  const config = TERMIN_TYPE_CONFIG[t.type] || TERMIN_TYPE_CONFIG.other;
                  return (
                    <div
                      key={i}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: config.bg,
                      }}
                      title={t.title}
                    />
                  );
                })}
              </div>

              {/* Count badge */}
              {dayTermine.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: dayTermine.length >= 3 ? '#ef4444' : '#EAD068',
                  color: '#fff',
                }}>
                  {dayTermine.length}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming Termine List */}
      <div style={{ paddingBottom: '16px' }}>
        {upcomingTermine.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#71717a', fontSize: '14px' }}>
            Keine Termine diese Woche
          </div>
        ) : (
          upcomingTermine.map((termin, index) => (
            <TerminRow
              key={termin.id}
              termin={termin}
              index={index}
              onClick={() => onTerminClick?.(termin)}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

interface TerminRowProps {
  termin: TerminItem;
  index: number;
  onClick?: () => void;
}

function TerminRow({ termin, index, onClick }: TerminRowProps) {
  const config = TERMIN_TYPE_CONFIG[termin.type] || TERMIN_TYPE_CONFIG.other;
  const date = new Date(termin.date);
  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      style={{
        ...styles.terminCard,
        ...(isToday ? styles.terminCardToday : {}),
      }}
    >
      {/* Type Icon */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        background: `rgba(${config.color === '#60a5fa' ? '59, 130, 246' : config.color === '#fbbf24' ? '245, 158, 11' : '139, 92, 246'}, 0.15)`,
        flexShrink: 0,
      }}>
        {config.emoji}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>
            {termin.title}
          </span>
          {isToday && (
            <span style={{
              ...styles.badge,
              background: 'rgba(212, 168, 67, 0.2)',
              color: '#EAD068',
              border: '1px solid rgba(212, 168, 67, 0.3)',
            }}>
              HEUTE
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#71717a' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={10} />
            {formatDate(date)}
          </span>
          {termin.time && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={10} />
              {termin.time}
            </span>
          )}
          {termin.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={10} />
              {termin.location}
            </span>
          )}
        </div>
      </div>

      {/* Type Badge */}
      <span style={{
        ...styles.badge,
        color: config.color,
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0,
        fontSize: '11px',
      }}>
        {config.label}
      </span>

      {/* Arrow */}
      <ChevronRight size={16} color="#52525b" style={{ flexShrink: 0 }} />
    </motion.div>
  );
}

function CalendarSkeleton() {
  return (
    <div style={styles.container}>
      <div style={{ padding: '20px' }}>
        <div style={{ height: '24px', width: '160px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '16px' }} />
        <div style={{ ...styles.weekGrid }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={{ height: '80px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Heute';
  if (date.toDateString() === tomorrow.toDateString()) return 'Morgen';

  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
}

export default WeekCalendar;
