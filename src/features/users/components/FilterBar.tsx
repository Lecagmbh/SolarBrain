/**
 * Suchfeld + Rollen-Chips + Stats-Zeile
 */

import { Search } from 'lucide-react';
import type { UserRole } from '../types';
import { ROLE_CONFIG } from '../constants';

interface Props {
  search: string;
  onSearch: (value: string) => void;
  roleFilter: UserRole | null;
  onRoleFilter: (role: UserRole | null) => void;
  roleCounts: Record<string, number>;
  stats: { total: number; active: number; gesperrt: number; installationen: number };
}

const FILTER_ROLES: UserRole[] = [
  'ADMIN', 'KUNDE', 'KUNDE_MITARBEITER', 'SUBUNTERNEHMER',
  'HANDELSVERTRETER', 'ENDKUNDE_PORTAL', 'DEMO',
];

export function FilterBar({ search, onSearch, roleFilter, onRoleFilter, roleCounts, stats }: Props) {
  return (
    <div className="up-filter-bar">
      {/* Search */}
      <div className="up-search">
        <Search size={16} className="up-search__icon" />
        <input
          type="text"
          className="up-search__input"
          placeholder="Name, E-Mail oder Firma..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* Role chips */}
      <div className="up-chips">
        <button
          className={`up-chip ${!roleFilter ? 'up-chip--active' : ''}`}
          onClick={() => onRoleFilter(null)}
        >
          Alle {stats.total}
        </button>
        {FILTER_ROLES.map((role) => {
          const count = roleCounts[role] || 0;
          if (count === 0) return null;
          const cfg = ROLE_CONFIG[role];
          return (
            <button
              key={role}
              className={`up-chip ${roleFilter === role ? 'up-chip--active' : ''}`}
              style={roleFilter === role ? { background: cfg.bg, color: cfg.color } : undefined}
              onClick={() => onRoleFilter(roleFilter === role ? null : role)}
            >
              {cfg.label} {count}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="up-stats-bar">
        <span>Gesamt: <strong>{stats.total}</strong></span>
        <span>Aktiv: <strong>{stats.active}</strong></span>
        {stats.gesperrt > 0 && <span className="up-stats-bar__warn">Gesperrt: <strong>{stats.gesperrt}</strong></span>}
        <span>Installationen: <strong>{stats.installationen.toLocaleString('de-DE')}</strong></span>
      </div>
    </div>
  );
}
