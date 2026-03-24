/**
 * Endkunden View: Consent-Status prominent, Installation-Link
 */

import { useMemo } from 'react';
import { UserCheck, AlertTriangle, CheckCircle } from 'lucide-react';
import type { UserData } from '../types';
import { AvatarInitials } from './AvatarInitials';
import { ConsentBadges } from './ConsentBadges';
import { StatusBadge } from './StatusBadge';

interface Props {
  users: UserData[];
  isAdmin: boolean;
  onAction: (action: string, user: UserData) => void;
}

export function EndkundenView({ users, isAdmin, onAction }: Props) {
  const endkunden = useMemo(() => users.filter((u) => u.role === 'ENDKUNDE_PORTAL'), [users]);

  const stats = useMemo(() => {
    const noConsent = endkunden.filter((u) => !u.endkundenConsent?.emailConsent).length;
    const withEmail = endkunden.filter((u) => u.endkundenConsent?.emailConsent).length;
    return { noConsent, withEmail };
  }, [endkunden]);

  if (endkunden.length === 0) {
    return (
      <div className="up-empty">
        <UserCheck size={40} className="up-empty__icon" />
        <span className="up-empty__text">Keine Endkunden gefunden</span>
      </div>
    );
  }

  return (
    <div>
      {/* Consent-Warnings */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {stats.noConsent > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: 'rgba(245,158,11,.08)', color: '#f59e0b', fontSize: 13 }}>
            <AlertTriangle size={16} />
            <span>{stats.noConsent} Endkunden haben KEINEN Consent erteilt</span>
          </div>
        )}
        {stats.withEmail > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: 'rgba(34,197,94,.08)', color: '#22c55e', fontSize: 13 }}>
            <CheckCircle size={16} />
            <span>{stats.withEmail} Endkunden haben mindestens Email-Consent</span>
          </div>
        )}
      </div>

      <table className="up-table">
        <thead>
          <tr>
            <th>Endkunde</th>
            <th>Installation</th>
            <th>Consent</th>
            <th>Letzte Aktivität</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {endkunden.map((user) => {
            const inst = user.portalInstallations?.[0]?.installation;
            const lastActivity = user.endkundenConsent?.lastPortalVisit || user.lastLoginAt;

            return (
              <tr key={user.id}>
                <td>
                  <div className="up-user-cell">
                    <AvatarInitials name={user.name} email={user.email} />
                    <div className="up-user-info">
                      <span className="up-user-name">{user.name || user.email}</span>
                      <span className="up-user-email">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  {inst ? (
                    <div style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{inst.publicId}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                        ({inst.totalKwp} kWp, {inst.status})
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>–</span>
                  )}
                </td>
                <td><ConsentBadges consent={user.endkundenConsent} /></td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {lastActivity
                    ? new Date(lastActivity).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : 'Nie eingeloggt'}
                </td>
                <td><StatusBadge active={user.active} gesperrt={user.gesperrt} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
