/**
 * Benutzer bearbeiten – Name, Email, Firma, Zuordnung ändern
 */

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { UserData } from '../types';
import { useUpdateUser } from '../hooks/useUserMutations';

interface Props {
  open: boolean;
  user: UserData | null;
  allUsers: UserData[];
  onClose: () => void;
}

export function EditUserDialog({ open, user, allUsers, onClose }: Props) {
  const updateUser = useUpdateUser();
  const [form, setForm] = useState({ name: '', email: '', telefon: '', firmenName: '' });
  const [parentUserId, setParentUserId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email,
        telefon: user.kunde?.telefon || '',
        firmenName: user.kunde?.firmenName || '',
      });
      setParentUserId(user.parentUserId);
      setError('');
    }
  }, [user]);

  if (!open || !user) return null;

  const kunden = allUsers.filter((u) => u.role === 'KUNDE' || u.role === 'MITARBEITER');
  const hvs = allUsers.filter((u) => u.role === 'HANDELSVERTRETER');
  const showParentSelect = ['KUNDE_MITARBEITER', 'SUBUNTERNEHMER'].includes(user.role);
  const showHvParent = user.role === 'HANDELSVERTRETER';

  const handleSave = async () => {
    setError('');
    try {
      const payload: Record<string, unknown> = {
        id: user.id,
        name: form.name.trim() || null,
        email: form.email.trim(),
      };

      if (user.kundeId) {
        payload.kunde = {
          firmenName: form.firmenName.trim() || null,
          telefon: form.telefon.trim() || null,
        };
      }

      if (showParentSelect && parentUserId !== user.parentUserId) {
        payload.parentUserId = parentUserId;
        // Update kundeId from new parent
        const parent = allUsers.find((u) => u.id === parentUserId);
        if (parent?.kundeId) payload.kundeId = parent.kundeId;
      }

      if (showHvParent && parentUserId !== user.parentUserId) {
        payload.parentUserId = parentUserId;
      }

      await updateUser.mutateAsync(payload as { id: number } & Record<string, unknown>);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Fehler beim Speichern');
    }
  };

  return (
    <div className="up-dialog-overlay" onClick={onClose}>
      <div className="up-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="up-dialog__header">
          <h3>Benutzer bearbeiten</h3>
          <button className="up-action-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="up-dialog__body">
          <label className="up-dialog__label">Name</label>
          <input className="up-dialog__input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label className="up-dialog__label">E-Mail</label>
          <input className="up-dialog__input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <label className="up-dialog__label">Telefon</label>
          <input className="up-dialog__input" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} />

          {user.kundeId && (
            <>
              <label className="up-dialog__label">Firma</label>
              <input className="up-dialog__input" value={form.firmenName} onChange={(e) => setForm({ ...form, firmenName: e.target.value })} />
            </>
          )}

          {/* Zuordnung ändern: Mitarbeiter/Sub → Kunde */}
          {showParentSelect && (
            <>
              <label className="up-dialog__label">Gehört zu Kunde</label>
              <select
                className="up-dialog__select"
                value={parentUserId ?? ''}
                onChange={(e) => setParentUserId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">-- Nicht zugeordnet --</option>
                {kunden.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name || k.email} {k.kunde?.firmenName ? `(${k.kunde.firmenName})` : ''}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* HV: Ober-HV Zuordnung */}
          {showHvParent && (
            <>
              <label className="up-dialog__label">Ober-HV</label>
              <select
                className="up-dialog__select"
                value={parentUserId ?? ''}
                onChange={(e) => setParentUserId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Kein Ober-HV (eigenständig)</option>
                {hvs.filter((h) => h.id !== user.id).map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name || h.email} ({h.handelsvertreter?.provisionssatz}%)
                  </option>
                ))}
              </select>
            </>
          )}

          {error && <div className="up-dialog__error">{error}</div>}

          <div className="up-dialog__footer">
            <button className="up-btn up-btn--ghost" onClick={onClose}>Abbrechen</button>
            <button className="up-btn up-btn--primary" onClick={handleSave} disabled={updateUser.isPending}>
              {updateUser.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
