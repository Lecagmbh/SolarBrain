/**
 * Kunden & Benutzer – Master-Detail Layout
 * Links: Baum mit allen Kunden, HVs, Endkunden
 * Rechts: Detail-Panel mit Tabs
 */

import { useState, useCallback } from 'react';
import { Loader2, Users } from 'lucide-react';
import { useIsAdmin } from '../../pages/AuthContext';
import { api } from '../../modules/api/client';
import { useUsers } from './hooks/useUsers';
import { useBlockUser, useUnblockUser, useImpersonateUser, useResetPassword } from './hooks/useUserMutations';
import { UserTree } from './components/UserTree';
import { UserDetailPanel } from './components/UserDetailPanel';
import { CreateUserDialog } from './dialogs/CreateUserDialog';
import { EditUserDialog } from './dialogs/EditUserDialog';
import { PermissionsDialog } from './dialogs/PermissionsDialog';
import { DeleteConfirmDialog } from './dialogs/DeleteConfirmDialog';
import type { UserData } from './types';
import './UsersPage.css';

export function UsersPage() {
  const isAdmin = useIsAdmin();
  const { data, isLoading } = useUsers({ limit: 500, include: 'installations', tree: true });
  const users = data?.data ?? [];

  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [permUser, setPermUser] = useState<UserData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);

  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const impersonate = useImpersonateUser();
  const resetPassword = useResetPassword();

  const handleAction = useCallback((action: string, user: UserData) => {
    switch (action) {
      case 'edit': setEditUser(user); break;
      case 'permissions': setPermUser(user); break;
      case 'delete': setDeleteTarget(user); break;
      case 'block':
        if (confirm(`${user.name || user.email} sperren?`)) {
          blockUser.mutate({ id: user.id, grund: 'Manuell gesperrt' });
        }
        break;
      case 'unblock': unblockUser.mutate(user.id); break;
      case 'impersonate':
        impersonate.mutateAsync(user.id).then((r) => {
          if (r.url) window.open(r.url, '_blank');
        }).catch(() => alert('Impersonation fehlgeschlagen'));
        break;
      case 'set-ober-hv':
        if (user.handelsvertreter?.id) {
          api.put(`/admin/hv/${user.handelsvertreter.id}/set-ober-hv`, { isOberHv: true })
            .then(() => window.location.reload());
        }
        break;
      case 'remove-ober-hv':
        if (user.handelsvertreter?.id && confirm('Ober-HV Status entfernen?')) {
          api.put(`/admin/hv/${user.handelsvertreter.id}/set-ober-hv`, { isOberHv: false })
            .then(() => window.location.reload());
        }
        break;
      case 'reset-password':
        if (confirm(`Passwort für ${user.name || user.email} zurücksetzen?`)) {
          resetPassword.mutateAsync(user.id).then((r) => {
            prompt('Neues temporäres Passwort (bitte kopieren):', r.tempPassword);
          }).catch(() => alert('Passwort-Reset fehlgeschlagen'));
        }
        break;
      case 'portal-toggle':
        api.patch(`/admin/users/${user.id}`, { portalZugang: !(user as any).portalZugang })
          .then(() => window.location.reload())
          .catch(() => alert('Portal-Zugang ändern fehlgeschlagen'));
        break;
    }
  }, [blockUser, unblockUser, impersonate, resetPassword]);

  if (isLoading) {
    return (
      <div className="up-page">
        <div className="up-loading">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-400)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="up-page">
      <header className="up-header">
        <div className="up-header__left">
          <h1 className="up-header__title">
            Team & Benutzer <span className="up-header__count">{users.length}</span>
          </h1>
        </div>
      </header>

      <div className="up-master-detail">
        <UserTree
          users={users}
          selectedId={selectedUser?.id ?? null}
          onSelect={setSelectedUser}
          onCreateUser={() => setShowCreate(true)}
          search={search}
          onSearch={setSearch}
        />

        {selectedUser ? (
          <UserDetailPanel
            user={selectedUser}
            allUsers={users}
            onClose={() => setSelectedUser(null)}
            onAction={handleAction}
          />
        ) : (
          <div className="ud-empty-state">
            <Users size={48} className="ud-empty-state__icon" />
            <span className="ud-empty-state__text">Wähle einen Kunden oder Benutzer aus</span>
          </div>
        )}
      </div>

      <CreateUserDialog open={showCreate} onClose={() => setShowCreate(false)} users={users} />
      <EditUserDialog open={!!editUser} user={editUser} allUsers={users} onClose={() => setEditUser(null)} />
      <PermissionsDialog open={!!permUser} user={permUser} onClose={() => setPermUser(null)} />
      <DeleteConfirmDialog open={!!deleteTarget} user={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}

export default UsersPage;
