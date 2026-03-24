/**
 * Einzelne Tabellenzeile für einen User
 * + Expandierbare Detail-Zeile (Permissions / Consent)
 */

import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import type { UserData } from '../types';
import { PERMISSION_LABELS } from '../constants';
import { RoleBadge } from './RoleBadge';
import { AvatarInitials } from './AvatarInitials';
import { StatusBadge } from './StatusBadge';
import { ConsentBadges, ConsentSummary } from './ConsentBadges';
import { UserActionMenu } from './UserActionMenu';

interface Props {
  user: UserData;
  depth?: number;
  isAdmin: boolean;
  onAction: (action: string, user: UserData) => void;
}

export function UserRow({ user, depth = 0, isAdmin, onAction }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const rowClass = depth === 1 ? 'up-row--child' : depth >= 2 ? 'up-row--grandchild' : '';
  const firma = user.kunde?.firmenName || user.kunde?.name || '';
  const instCount = user._count?.installations || 0;
  const lastLogin = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
    : 'Nie';

  const canExpand = user.role === 'KUNDE_MITARBEITER' || user.role === 'ENDKUNDE_PORTAL';

  return (
    <>
      <tr
        className={rowClass}
        onClick={() => canExpand && setExpanded(!expanded)}
        style={{ cursor: canExpand ? 'pointer' : 'default' }}
      >
        {/* User */}
        <td>
          <div className="up-user-cell">
            {depth > 0 && <span className="up-tree-line">↳</span>}
            <AvatarInitials name={user.name} email={user.email} />
            <div className="up-user-info">
              <span className="up-user-name">{user.name || user.email}</span>
              <span className="up-user-email">{user.email}</span>
            </div>
          </div>
        </td>

        {/* Rolle */}
        <td><RoleBadge role={user.role} /></td>

        {/* Firma */}
        <td className="up-col-firma">
          {depth > 0 && firma ? `↳ ${firma}` : firma || '–'}
        </td>

        {/* Installationen */}
        <td>{instCount}</td>

        {/* Status */}
        <td><StatusBadge active={user.active} gesperrt={user.gesperrt} /></td>

        {/* Letzter Login */}
        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lastLogin}</td>

        {/* Aktionen */}
        <td style={{ position: 'relative' }}>
          <button className="up-action-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <UserActionMenu
              user={user}
              isAdmin={isAdmin}
              onAction={(action) => { setMenuOpen(false); onAction(action, user); }}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && user.role === 'KUNDE_MITARBEITER' && user.permissions && (
        <tr>
          <td colSpan={7} className="up-expanded">
            <div className="up-expanded__title">
              Konfigurierte Berechtigungen{user.kunde ? ` (von ${user.kunde.name} festgelegt)` : ''}
            </div>
            <div className="up-perm-tags">
              {Object.entries(PERMISSION_LABELS).map(([key, { label }]) => {
                const allowed = (user.permissions as any)?.[key] === true;
                return (
                  <span key={key} className={`up-perm-tag ${allowed ? 'up-perm-tag--ok' : 'up-perm-tag--no'}`}>
                    {label} {allowed ? '✓' : '✗'}
                  </span>
                );
              })}
            </div>
          </td>
        </tr>
      )}

      {expanded && user.role === 'ENDKUNDE_PORTAL' && (
        <tr>
          <td colSpan={7} className="up-expanded">
            <div className="up-expanded__title">Kontakt-Zustimmung (DSGVO)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ConsentBadges consent={user.endkundenConsent} />
              <ConsentSummary consent={user.endkundenConsent} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
