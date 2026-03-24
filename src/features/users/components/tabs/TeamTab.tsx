/**
 * Team-Tab: Mitarbeiter + Subs direkt verwalten
 */

import { Plus, Shield, Trash2, UserX } from 'lucide-react';
import type { UserData } from '../../types';
import { ROLE_CONFIG, PERMISSION_LABELS } from '../../constants';
import { AvatarInitials } from '../AvatarInitials';

interface Props {
  user: UserData;
  allUsers: UserData[];
  onAction: (action: string, user: UserData) => void;
}

export function TeamTab({ user, allUsers, onAction }: Props) {
  const team = allUsers.filter(
    (u) =>
      u.id !== user.id &&
      (u.parentUserId === user.id ||
        (u.kundeId === user.kundeId && u.kundeId !== null && ['KUNDE_MITARBEITER', 'SUBUNTERNEHMER'].includes(u.role)))
  );

  const mitarbeiter = team.filter((u) => u.role === 'KUNDE_MITARBEITER');
  const subs = team.filter((u) => u.role === 'SUBUNTERNEHMER');

  return (
    <div className="ud-team">
      {/* Mitarbeiter */}
      <div className="ud-team-section">
        <div className="ud-team-header">
          <h4>Mitarbeiter ({mitarbeiter.length})</h4>
          <button className="ud-action" onClick={() => onAction('create-mitarbeiter', user)}>
            <Plus size={13} /> Hinzufügen
          </button>
        </div>
        {mitarbeiter.length === 0 ? (
          <div className="ud-team-empty">Keine Mitarbeiter</div>
        ) : (
          mitarbeiter.map((m) => (
            <div key={m.id} className="ud-team-member">
              <AvatarInitials name={m.name} email={m.email} />
              <div className="ud-team-member__info">
                <span className="ud-team-member__name">{m.name || m.email}</span>
                <span className="ud-team-member__email">{m.email}</span>
                {/* Permission Tags */}
                {m.permissions && (
                  <div className="ud-team-member__perms">
                    {Object.entries(PERMISSION_LABELS).slice(0, 6).map(([key, { label }]) => {
                      const ok = (m.permissions as any)?.[key] === true;
                      return (
                        <span key={key} className={`ud-perm-dot ${ok ? 'ud-perm-dot--ok' : ''}`} title={`${label}: ${ok ? '✓' : '✗'}`} />
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="ud-team-member__actions">
                <button className="ud-icon-btn" title="Rechte" onClick={() => onAction('permissions', m)}><Shield size={13} /></button>
                <button className="ud-icon-btn ud-icon-btn--danger" title="Entfernen" onClick={() => onAction('delete', m)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Subunternehmer */}
      <div className="ud-team-section">
        <div className="ud-team-header">
          <h4>Subunternehmer ({subs.length})</h4>
          <button className="ud-action" onClick={() => onAction('create-sub', user)}>
            <Plus size={13} /> Hinzufügen
          </button>
        </div>
        {subs.length === 0 ? (
          <div className="ud-team-empty">Keine Subunternehmer</div>
        ) : (
          subs.map((s) => (
            <div key={s.id} className="ud-team-member">
              <AvatarInitials name={s.name} email={s.email} />
              <div className="ud-team-member__info">
                <span className="ud-team-member__name">{s.kunde?.firmenName || s.name || s.email}</span>
                <span className="ud-team-member__email">{s.email}</span>
              </div>
              <div className="ud-team-member__actions">
                <button className="ud-icon-btn ud-icon-btn--danger" title="Entfernen" onClick={() => onAction('delete', s)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
