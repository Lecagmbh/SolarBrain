/**
 * UserDetailPanel – Rechte Seite im Master-Detail Layout
 * Zeigt Detail-Info + Tabs für den ausgewählten User/Kunden
 */

import { useState } from 'react';
import { X, LogIn, Edit2, Lock, Unlock, Trash2, Shield, Users as UsersIcon } from 'lucide-react';
import type { UserData } from '../types';
import { ROLE_CONFIG } from '../constants';
import { AvatarInitials } from './AvatarInitials';
import { StatusBadge } from './StatusBadge';
import { OverviewTab } from './tabs/OverviewTab';
import { TeamTab } from './tabs/TeamTab';
import { InvoicesTab } from './tabs/InvoicesTab';
import { SettingsTab } from './tabs/SettingsTab';

interface Props {
  user: UserData;
  allUsers: UserData[];
  onClose: () => void;
  onAction: (action: string, user: UserData) => void;
}

type TabId = 'overview' | 'team' | 'invoices' | 'settings';

export function UserDetailPanel({ user, allUsers, onClose, onAction }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const role = ROLE_CONFIG[user.role];
  const instCount = (user.kunde as any)?._count?.installations || user._count?.installations || 0;
  const isKunde = user.role === 'KUNDE';
  const isHv = user.role === 'HANDELSVERTRETER';

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Übersicht' },
    ...(isKunde ? [{ id: 'team' as TabId, label: 'Team' }] : []),
    ...(isKunde ? [{ id: 'invoices' as TabId, label: 'Rechnungen' }] : []),
    { id: 'settings', label: 'Einstellungen' },
  ];

  return (
    <div className="ud-panel">
      {/* Header */}
      <div className="ud-header">
        <div className="ud-header__top">
          <AvatarInitials name={user.name} email={user.email} />
          <div className="ud-header__info">
            <h2 className="ud-header__name">{user.kunde?.firmenName || user.name || user.email}</h2>
            <div className="ud-header__meta">
              <span className="ud-role-badge" style={{ background: role?.bg, color: role?.color }}>{role?.label}</span>
              <StatusBadge active={user.active} gesperrt={user.gesperrt} />
              {instCount > 0 && <span className="ud-meta-item">{instCount} Installationen</span>}
            </div>
          </div>
          <button className="ud-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Quick Actions */}
        <div className="ud-actions">
          <button className="ud-action" onClick={() => onAction('edit', user)}><Edit2 size={13} /> Bearbeiten</button>
          {user.role !== 'ADMIN' && (
            <button className="ud-action" onClick={() => onAction('impersonate', user)}><LogIn size={13} /> Einloggen</button>
          )}
          {isKunde && <button className="ud-action" onClick={() => onAction('permissions', user)}><Shield size={13} /> Rechte</button>}
          {user.gesperrt
            ? <button className="ud-action" onClick={() => onAction('unblock', user)}><Unlock size={13} /> Entsperren</button>
            : <button className="ud-action ud-action--warn" onClick={() => onAction('block', user)}><Lock size={13} /> Sperren</button>
          }
          <button className="ud-action ud-action--danger" onClick={() => onAction('delete', user)}><Trash2 size={13} /> Löschen</button>
        </div>

        {/* Tabs */}
        <div className="ud-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`ud-tab ${activeTab === tab.id ? 'ud-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="ud-content">
        {activeTab === 'overview' && <OverviewTab user={user} allUsers={allUsers} onAction={onAction} />}
        {activeTab === 'team' && <TeamTab user={user} allUsers={allUsers} onAction={onAction} />}
        {activeTab === 'invoices' && <InvoicesTab user={user} />}
        {activeTab === 'settings' && <SettingsTab user={user} onAction={onAction} />}
      </div>
    </div>
  );
}
