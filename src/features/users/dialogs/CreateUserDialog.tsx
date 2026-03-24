/**
 * Neuer Benutzer Dialog – Rollenabhängige Felder
 */

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { UserRole, UserData } from '../types';
import { ROLE_CONFIG } from '../constants';
import { useCreateUser } from '../hooks/useUserMutations';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Alle User für Dropdowns (Kunde-Auswahl, HV-Auswahl) */
  users: UserData[];
  /** Wenn gesetzt: Mitarbeiter/Sub wird direkt diesem Kunden zugeordnet */
  preselectedKundeId?: number;
  /** Einschränkung auf bestimmte Rollen (für Kunden-Sicht) */
  allowedRoles?: UserRole[];
}

const ALL_ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'MITARBEITER', 'HV_LEITER', 'HV_TEAMLEITER', 'HANDELSVERTRETER', 'KUNDE', 'KUNDE_MITARBEITER', 'SUBUNTERNEHMER', 'ENDKUNDE_PORTAL', 'DEMO'];

export function CreateUserDialog({ open, onClose, users, preselectedKundeId, allowedRoles }: Props) {
  const createUser = useCreateUser();
  const [role, setRole] = useState<UserRole>(preselectedKundeId ? 'KUNDE_MITARBEITER' : 'KUNDE');
  const [form, setForm] = useState({ name: '', email: '', telefon: '', firmenName: '' });
  const [parentUserId, setParentUserId] = useState<number | null>(preselectedKundeId ?? null);
  const [hvParentId, setHvParentId] = useState<number | null>(null);
  const [provisionssatz, setProvisionssatz] = useState('10');
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  if (!open) return null;

  const roles = allowedRoles ?? ALL_ROLES;
  const kunden = users.filter((u) => u.role === 'KUNDE' || u.role === 'MITARBEITER');
  const hvs = users.filter((u) => u.role === 'HANDELSVERTRETER');

  const handleSubmit = async () => {
    if (!form.email.trim()) { setError('E-Mail ist erforderlich'); return; }
    setError('');

    try {
      const payload: Record<string, unknown> = {
        email: form.email.trim(),
        name: form.name.trim() || null,
        role,
        active: true,
      };

      // Verknüpfungen je nach Rolle
      if (role === 'KUNDE_MITARBEITER' || role === 'SUBUNTERNEHMER') {
        if (!parentUserId) { setError('Bitte einen Kunden auswählen'); return; }
        payload.parentUserId = parentUserId;
        // kundeId vom Parent übernehmen
        const parent = users.find((u) => u.id === parentUserId);
        if (parent?.kundeId) payload.kundeId = parent.kundeId;
      }

      if (role === 'KUNDE') {
        payload.kunde = {
          name: form.name.trim(),
          firmenName: form.firmenName.trim() || null,
          email: form.email.trim(),
          telefon: form.telefon.trim() || null,
        };
      }

      if (role === 'HANDELSVERTRETER') {
        if (hvParentId) payload.parentUserId = hvParentId;
        payload.handelsvertreter = {
          provisionssatz: parseFloat(provisionssatz) || 10,
          firmenName: form.firmenName.trim() || null,
        };
      }

      if (role === 'SUBUNTERNEHMER') {
        payload.kunde = {
          name: form.name.trim(),
          firmenName: form.firmenName.trim() || null,
          email: form.email.trim(),
          telefon: form.telefon.trim() || null,
        };
      }

      const result = await createUser.mutateAsync(payload);
      setTempPassword((result as any).tempPassword || null);
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Fehler beim Erstellen');
    }
  };

  if (tempPassword) {
    return (
      <DialogShell onClose={onClose} title="Benutzer erstellt">
        <div className="up-dialog__success">
          <p>Benutzer <strong>{form.email}</strong> wurde erstellt.</p>
          <div className="up-dialog__password-box">
            <span className="up-dialog__password-label">Temporäres Passwort:</span>
            <code className="up-dialog__password-value">{tempPassword}</code>
          </div>
          <p className="up-dialog__hint">Bitte teilen Sie das Passwort dem Benutzer mit. Es muss beim ersten Login geändert werden.</p>
          <button className="up-btn up-btn--primary" onClick={onClose}>Schließen</button>
        </div>
      </DialogShell>
    );
  }

  return (
    <DialogShell onClose={onClose} title="Neuer Benutzer">
      {/* Rolle */}
      <label className="up-dialog__label">Rolle auswählen</label>
      <div className="up-dialog__role-grid">
        {roles.map((r) => {
          const cfg = ROLE_CONFIG[r];
          return (
            <button
              key={r}
              className={`up-dialog__role-btn ${role === r ? 'up-dialog__role-btn--active' : ''}`}
              style={role === r ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color } : undefined}
              onClick={() => setRole(r)}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Basisdaten */}
      <label className="up-dialog__label">Name</label>
      <input className="up-dialog__input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Vor- und Nachname" />

      <label className="up-dialog__label">E-Mail *</label>
      <input className="up-dialog__input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.de" />

      <label className="up-dialog__label">Telefon</label>
      <input className="up-dialog__input" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} placeholder="+49..." />

      {/* Firma (für KUNDE, SUB, HV) */}
      {['KUNDE', 'SUBUNTERNEHMER', 'HANDELSVERTRETER'].includes(role) && (
        <>
          <label className="up-dialog__label">Firma</label>
          <input className="up-dialog__input" value={form.firmenName} onChange={(e) => setForm({ ...form, firmenName: e.target.value })} placeholder="Firmenname" />
        </>
      )}

      {/* Verknüpfung: KUNDE_MITARBEITER / SUB → Kunde */}
      {(role === 'KUNDE_MITARBEITER' || role === 'SUBUNTERNEHMER') && (
        <>
          <label className="up-dialog__label">Gehört zu Kunde *</label>
          <select
            className="up-dialog__select"
            value={parentUserId ?? ''}
            onChange={(e) => setParentUserId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">-- Kunde auswählen --</option>
            {kunden.map((k) => (
              <option key={k.id} value={k.id}>{k.name || k.email} {k.kunde?.firmenName ? `(${k.kunde.firmenName})` : ''}</option>
            ))}
          </select>
        </>
      )}

      {/* Verknüpfung: HV → Ober-HV */}
      {role === 'HANDELSVERTRETER' && (
        <>
          <label className="up-dialog__label">Ober-HV (optional)</label>
          <select
            className="up-dialog__select"
            value={hvParentId ?? ''}
            onChange={(e) => setHvParentId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Neuer Ober-HV (kein Parent)</option>
            {hvs.map((h) => (
              <option key={h.id} value={h.id}>{h.name || h.email} ({h.handelsvertreter?.provisionssatz}%)</option>
            ))}
          </select>
          <label className="up-dialog__label">Provisionssatz (%)</label>
          <input className="up-dialog__input" type="number" min="0" max="100" step="0.5" value={provisionssatz} onChange={(e) => setProvisionssatz(e.target.value)} />
        </>
      )}

      {error && <div className="up-dialog__error">{error}</div>}

      <div className="up-dialog__footer">
        <button className="up-btn up-btn--ghost" onClick={onClose}>Abbrechen</button>
        <button className="up-btn up-btn--primary" onClick={handleSubmit} disabled={createUser.isPending}>
          {createUser.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          Erstellen
        </button>
      </div>
    </DialogShell>
  );
}

function DialogShell({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="up-dialog-overlay" onClick={onClose}>
      <div className="up-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="up-dialog__header">
          <h3>{title}</h3>
          <button className="up-action-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="up-dialog__body">{children}</div>
      </div>
    </div>
  );
}
