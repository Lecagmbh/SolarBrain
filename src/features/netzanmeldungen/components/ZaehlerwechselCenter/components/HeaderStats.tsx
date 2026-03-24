import type { Stats } from '../types';

interface HeaderStatsProps {
  stats: Stats;
}

const STAT_ITEMS: { key: keyof Stats; label: string; color: string }[] = [
  { key: 'total', label: 'Gesamt', color: 'var(--zwc-text)' },
  { key: 'parsed', label: 'Erkannt', color: 'var(--zwc-blue)' },
  { key: 'confirmed', label: 'Bestätigt', color: 'var(--zwc-accent)' },
  { key: 'notified', label: 'Informiert', color: 'var(--zwc-green)' },
  { key: 'errors', label: 'Fehler', color: 'var(--zwc-red)' },
];

export function HeaderStats({ stats }: HeaderStatsProps) {
  return (
    <div className="zwc-stats">
      {STAT_ITEMS.map(({ key, label, color }) => (
        <div
          key={key}
          className={`zwc-stat ${stats[key] > 0 ? 'zwc-stat--active' : ''}`}
        >
          <div className="zwc-stat-value" style={{ color }}>
            {stats[key]}
          </div>
          <div className="zwc-stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
}
