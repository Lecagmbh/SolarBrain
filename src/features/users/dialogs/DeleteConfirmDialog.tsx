/**
 * Lösch-Bestätigung mit Warnung über verwaiste Installationen
 */

import { X, Loader2, AlertTriangle } from 'lucide-react';
import type { UserData } from '../types';
import { useDeleteUser } from '../hooks/useUserMutations';

interface Props {
  open: boolean;
  user: UserData | null;
  onClose: () => void;
}

export function DeleteConfirmDialog({ open, user, onClose }: Props) {
  const deleteUser = useDeleteUser();

  if (!open || !user) return null;

  const instCount = user._count?.installations || 0;

  const handleDelete = async () => {
    try {
      await deleteUser.mutateAsync(user.id);
      onClose();
    } catch (e: any) {
      console.error('Delete failed:', e);
    }
  };

  return (
    <div className="up-dialog-overlay" onClick={onClose}>
      <div className="up-dialog up-dialog--sm" onClick={(e) => e.stopPropagation()}>
        <div className="up-dialog__header">
          <h3>Benutzer löschen</h3>
          <button className="up-action-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="up-dialog__body">
          <div className="up-dialog__warn-icon"><AlertTriangle size={40} /></div>
          <p>Möchten Sie <strong>{user.name || user.email}</strong> wirklich löschen?</p>
          {instCount > 0 && (
            <p className="up-dialog__warning">
              ⚠️ {instCount} Installation{instCount > 1 ? 'en' : ''} werden verwaist!
            </p>
          )}
          {user.role === 'ENDKUNDE_PORTAL' && (
            <p className="up-dialog__warning">
              DSGVO-Hinweis: Alle personenbezogenen Daten dieses Endkunden werden gelöscht.
            </p>
          )}
          <div className="up-dialog__footer">
            <button className="up-btn up-btn--ghost" onClick={onClose}>Abbrechen</button>
            <button className="up-btn up-btn--danger" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              Endgültig löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
