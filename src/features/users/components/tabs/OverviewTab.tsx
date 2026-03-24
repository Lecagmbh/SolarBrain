/**
 * Übersicht-Tab: Kontakt, Billing-Modell, HV-Zuordnung, letzte Aktivität
 */

import { useState } from 'react';
import { Mail, Phone, MapPin, Calendar, CreditCard, Briefcase, Building2 } from 'lucide-react';
import type { UserData } from '../../types';
import { ROLE_CONFIG } from '../../constants';
import { api } from '../../../../modules/api/client';

interface Props {
  user: UserData;
  allUsers: UserData[];
  onAction: (action: string, user: UserData) => void;
}

export function OverviewTab({ user, allUsers, onAction }: Props) {
  const [assigningHv, setAssigningHv] = useState(false);
  const k = user.kunde;
  const hvs = allUsers.filter((u) => u.role === 'HANDELSVERTRETER');
  const currentHvId = k?.handelsvertreterId;
  const currentHv = currentHvId ? hvs.find((h) => h.handelsvertreter?.id === currentHvId) : null;

  const handleAssignHv = async (hvProfileId: number | null) => {
    if (!k) return;
    setAssigningHv(true);
    try {
      await api.put(`/admin/kunden/${k.id}`, { handelsvertreterId: hvProfileId });
      window.location.reload();
    } catch {
      alert('HV-Zuordnung fehlgeschlagen');
    } finally {
      setAssigningHv(false);
    }
  };

  // Billing info
  const sp = user.kunde ? (user as any)._servicePrices?.[0] : null;

  return (
    <div className="ud-overview">
      {/* Kontakt */}
      <Section title="Kontakt">
        <Field icon={<Mail size={14} />} label="E-Mail" value={user.email} copyable />
        {k?.telefon && <Field icon={<Phone size={14} />} label="Telefon" value={k.telefon} />}
        {k?.ansprechpartner && <Field icon={<Building2 size={14} />} label="Ansprechpartner" value={k.ansprechpartner} />}
        {k?.strasse && (
          <Field icon={<MapPin size={14} />} label="Adresse" value={`${k.strasse} ${k.hausNr || ''}, ${k.plz || ''} ${k.ort || ''}`} />
        )}
        {k?.ustIdNr && <Field label="USt-ID" value={k.ustIdNr} />}
      </Section>

      {/* HV-Zuordnung (nur für Kunden) */}
      {user.role === 'KUNDE' && (
        <Section title="Handelsvertreter">
          {currentHv ? (
            <div className="ud-hv-assigned">
              <span className="ud-hv-name">💼 {currentHv.name || currentHv.email}</span>
              <span className="ud-hv-prov">{currentHv.handelsvertreter?.provisionssatz}%</span>
              <button className="ud-link-btn" onClick={() => handleAssignHv(null)} disabled={assigningHv}>
                Entfernen
              </button>
            </div>
          ) : (
            <div className="ud-hv-empty">
              <span>Kein HV zugewiesen</span>
            </div>
          )}
          <select
            className="ud-select"
            value={currentHvId || ''}
            onChange={(e) => handleAssignHv(e.target.value ? Number(e.target.value) : null)}
            disabled={assigningHv}
          >
            <option value="">– HV zuweisen –</option>
            {hvs.map((h) => (
              <option key={h.id} value={h.handelsvertreter?.id || ''}>
                {h.name || h.email} ({h.handelsvertreter?.provisionssatz}%)
              </option>
            ))}
          </select>
        </Section>
      )}

      {/* Timestamps */}
      <Section title="Aktivität">
        <Field icon={<Calendar size={14} />} label="Erstellt" value={fmt(user.createdAt)} />
        <Field icon={<Calendar size={14} />} label="Letzter Login" value={user.lastLoginAt ? fmt(user.lastLoginAt) : 'Nie'} />
      </Section>

      {/* HV-Profil (für HVs) */}
      {user.role === 'HANDELSVERTRETER' && user.handelsvertreter && (
        <Section title="HV-Profil">
          <Field label="Provisionssatz" value={`${user.handelsvertreter.provisionssatz}%`} />
          <Field label="Firma" value={user.handelsvertreter.firmenName || '–'} />
          <Field label="Ober-HV" value={user.handelsvertreter.isOberHv ? 'Ja' : 'Nein'} />
          <Field label="Zugewiesene Kunden" value={String(user.handelsvertreter.kunden?.length || 0)} />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ud-section">
      <h3 className="ud-section__title">{title}</h3>
      <div className="ud-section__body">{children}</div>
    </div>
  );
}

function Field({ icon, label, value, copyable }: { icon?: React.ReactNode; label: string; value: string; copyable?: boolean }) {
  return (
    <div className="ud-field">
      {icon && <span className="ud-field__icon">{icon}</span>}
      <span className="ud-field__label">{label}</span>
      <span className="ud-field__value">{value}</span>
    </div>
  );
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
