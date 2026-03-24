/**
 * Kunden-Hierarchie View: Gruppiert nach Kunde → Mitarbeiter → Subs
 */

import { useMemo } from 'react';
import { Users } from 'lucide-react';
import type { UserData } from '../types';
import { UserRow } from './UserRow';

interface Props {
  users: UserData[];
  isAdmin: boolean;
  onAction: (action: string, user: UserData) => void;
}

interface KundeGroup {
  kunde: UserData;
  children: UserData[];
}

export function HierarchyView({ users, isAdmin, onAction }: Props) {
  const groups = useMemo(() => {
    const kunden = users.filter((u) => u.role === 'KUNDE' || u.role === 'MITARBEITER');
    const result: KundeGroup[] = [];

    for (const kunde of kunden) {
      if (kunde.role !== 'KUNDE') continue;
      const children = users.filter(
        (u) => u.parentUserId === kunde.id ||
               (u.kundeId === kunde.kundeId && u.id !== kunde.id &&
                ['KUNDE_MITARBEITER', 'SUBUNTERNEHMER'].includes(u.role))
      );
      result.push({ kunde, children });
    }

    // Whitelabel-Kunden mit Sub-Kunden
    const whitelabels = users.filter((u) =>
      u.role === 'KUNDE' && u.kunde?.whiteLabelConfig &&
      (u.kunde.whiteLabelConfig as any)?.enabled
    );
    // Already included in kunden above

    return result;
  }, [users]);

  if (groups.length === 0) {
    return (
      <div className="up-empty">
        <Users size={40} className="up-empty__icon" />
        <span className="up-empty__text">Keine Kunden-Hierarchien gefunden</span>
      </div>
    );
  }

  return (
    <table className="up-table">
      <thead>
        <tr>
          <th>Benutzer</th>
          <th>Rolle</th>
          <th className="up-col-firma">Firma</th>
          <th>Installationen</th>
          <th>Status</th>
          <th>Letzter Login</th>
          <th style={{ width: 40 }}></th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => (
          <HierarchyGroup
            key={group.kunde.id}
            group={group}
            isAdmin={isAdmin}
            onAction={onAction}
          />
        ))}
      </tbody>
    </table>
  );
}

function HierarchyGroup({ group, isAdmin, onAction }: {
  group: KundeGroup;
  isAdmin: boolean;
  onAction: (action: string, user: UserData) => void;
}) {
  return (
    <>
      <UserRow user={group.kunde} depth={0} isAdmin={isAdmin} onAction={onAction} />
      {group.children.map((child) => (
        <UserRow key={child.id} user={child} depth={1} isAdmin={isAdmin} onAction={onAction} />
      ))}
      {group.children.length === 0 && (
        <tr className="up-row--child">
          <td colSpan={7} style={{ color: 'var(--text-muted)', fontSize: 12, paddingLeft: 56 }}>
            (keine Mitarbeiter/Subs)
          </td>
        </tr>
      )}
    </>
  );
}
