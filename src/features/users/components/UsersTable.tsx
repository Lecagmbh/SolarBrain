/**
 * Sortierbare Tabelle für "Alle Benutzer" View
 */

import { ChevronUp, ChevronDown, Users } from 'lucide-react';
import type { UserData, SortField, SortDir } from '../types';
import { UserRow } from './UserRow';

interface Props {
  users: UserData[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  isAdmin: boolean;
  onAction: (action: string, user: UserData) => void;
}

function SortIcon({ field, active, dir }: { field: string; active: string; dir: SortDir }) {
  if (field !== active) return null;
  return dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

export function UsersTable({ users, sortField, sortDir, onSort, isAdmin, onAction }: Props) {
  if (users.length === 0) {
    return (
      <div className="up-empty">
        <Users size={40} className="up-empty__icon" />
        <span className="up-empty__text">Keine Benutzer gefunden</span>
      </div>
    );
  }

  return (
    <table className="up-table">
      <thead>
        <tr>
          <th onClick={() => onSort('name')}>
            Benutzer <SortIcon field="name" active={sortField} dir={sortDir} />
          </th>
          <th onClick={() => onSort('role')}>
            Rolle <SortIcon field="role" active={sortField} dir={sortDir} />
          </th>
          <th className="up-col-firma">Firma / Zugehörigkeit</th>
          <th>Installationen</th>
          <th>Status</th>
          <th onClick={() => onSort('lastLoginAt')}>
            Letzter Login <SortIcon field="lastLoginAt" active={sortField} dir={sortDir} />
          </th>
          <th style={{ width: 40 }}></th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <UserRow key={user.id} user={user} isAdmin={isAdmin} onAction={onAction} />
        ))}
      </tbody>
    </table>
  );
}
