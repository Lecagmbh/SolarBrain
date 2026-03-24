/**
 * Handelsvertreter View: HV mit zugewiesenen Kunden + Provisionssatz
 */

import { useMemo } from 'react';
import { Briefcase } from 'lucide-react';
import type { UserData } from '../types';
import { AvatarInitials } from './AvatarInitials';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';

interface Props {
  users: UserData[];
  isAdmin: boolean;
  onAction: (action: string, user: UserData) => void;
}

export function HvView({ users, isAdmin, onAction }: Props) {
  console.log('[HvView] total users:', users.length, '| HVs:', users.filter(u => u.role === 'HANDELSVERTRETER').length, '| Kunden mit hvId:', users.filter(u => u.kunde?.handelsvertreterId).length);
  const hvUsers = useMemo(() => users.filter((u) => u.role === 'HANDELSVERTRETER'), [users]);

  // Kunden die einem HV zugewiesen sind (über kunde.handelsvertreterId)
  const kundenByHv = useMemo(() => {
    const map: Record<number, UserData[]> = {};
    const kundenUsers = users.filter((u) => u.role === 'KUNDE' && u.kunde?.handelsvertreterId);
    for (const ku of kundenUsers) {
      const hvId = ku.kunde!.handelsvertreterId!;
      if (!map[hvId]) map[hvId] = [];
      map[hvId].push(ku);
    }
    return map;
  }, [users]);

  if (hvUsers.length === 0) {
    return (
      <div className="up-empty">
        <Briefcase size={40} className="up-empty__icon" />
        <span className="up-empty__text">Keine Handelsvertreter gefunden</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {hvUsers.map((hv) => {
        const hvProfile = hv.handelsvertreter;
        const provisionssatz = hvProfile?.provisionssatz ?? 0;
        const zugewieseneKunden = kundenByHv[hvProfile?.id ?? -1] || [];
        const instCount = hv._count?.installations || 0;

        return (
          <div key={hv.id} className="up-hv-card">
            <div className="up-hv-card__header">
              <AvatarInitials name={hv.name} email={hv.email} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{hv.name || hv.email}</span>
                  <RoleBadge role={hv.role} />
                  <span style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>{provisionssatz}%</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {hvProfile?.firmenName || ''} · {instCount} Installationen · {zugewieseneKunden.length} Kunden
                </div>
              </div>
              <StatusBadge active={hv.active} gesperrt={hv.gesperrt} />
            </div>

            {zugewieseneKunden.length > 0 ? (
              <div className="up-hv-card__kunden">
                <div className="up-hv-card__kunden-title">Zugewiesene Kunden</div>
                {zugewieseneKunden.map((kunde) => (
                  <div key={kunde.id} className="up-hv-card__kunde-row">
                    <AvatarInitials name={kunde.name} email={kunde.email} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {kunde.kunde?.firmenName || kunde.name || kunde.email}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                        {kunde._count?.installations || 0} Installationen
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-muted)' }}>
                Keine Kunden zugewiesen
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
