import { useState, useEffect } from 'react';
import { apiGet } from '../../../services/api';

interface TerminEntry {
  id: number;
  status: string;
  datum: string;
  uhrzeit: string;
  confirmedAt: string | null;
  createdAt: string;
  kommentar: string | null;
  contactName: string | null;
  location: string | null;
  installation: {
    id: number;
    publicId: string;
    customerName: string;
    status: string;
    errichterName: string | null;
    errichterEmail: string | null;
    endkundeEmail: string | null;
    endkundePhone: string | null;
    portalAktiv: boolean;
    emailConsent: boolean;
    endkundeWirdBenachrichtigt: boolean;
  } | null;
}

function formatDateDE(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function daysLabel(days: number): string {
  if (days === 0) return 'Heute';
  if (days === 1) return 'Morgen';
  if (days < 0) return `${Math.abs(days)}d überfällig`;
  return `in ${days}d`;
}

export function TermineOverview() {
  const [termine, setTermine] = useState<TerminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    loadTermine();
  }, []);

  async function loadTermine() {
    try {
      const res = await apiGet<{ data: TerminEntry[] }>('/zaehlerwechsel-termine');
      setTermine(res.data || []);
    } catch (err) {
      console.error('Fehler beim Laden der Termine:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="zwc-panel">
        <div className="zwc-panel-title">Geplante Termine</div>
        <div style={{ padding: 16, textAlign: 'center', color: 'var(--zwc-text-muted)', fontSize: 13 }}>
          Laden...
        </div>
      </div>
    );
  }

  if (termine.length === 0) return null;

  return (
    <div className="zwc-panel">
      <div
        className="zwc-panel-title"
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <span>Geplante Termine ({termine.length})</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {termine.map(t => {
            const days = getDaysUntil(t.datum);
            const inst = t.installation;
            const isConfirmed = t.status === 'CONFIRMED';
            const isSoon = days <= 3 && days >= 0;

            return (
              <div
                key={t.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: isSoon ? 'rgba(245, 166, 35, 0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSoon ? 'rgba(245, 166, 35, 0.25)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {/* Top line: date + status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--zwc-text)' }}>
                      {formatDateDE(t.datum)} {t.uhrzeit}
                    </span>
                    <span style={{
                      fontSize: 11,
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontWeight: 600,
                      background: isSoon ? 'rgba(245, 166, 35, 0.15)' : 'rgba(126, 110, 242, 0.12)',
                      color: isSoon ? 'var(--zwc-amber)' : 'var(--zwc-accent)',
                    }}>
                      {daysLabel(days)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 600,
                    background: isConfirmed ? 'rgba(56, 217, 143, 0.15)' : 'rgba(90, 171, 245, 0.12)',
                    color: isConfirmed ? 'var(--zwc-green)' : 'var(--zwc-blue)',
                  }}>
                    {isConfirmed ? 'Bestätigt' : 'Ausstehend'}
                  </span>
                </div>

                {/* Customer name + installation */}
                <div style={{ fontSize: 12, color: 'var(--zwc-text-muted)' }}>
                  {inst?.customerName || t.contactName || '—'}
                  {inst && <span style={{ opacity: 0.6 }}> · #{inst.id}</span>}
                </div>

                {/* Location */}
                {t.location && (
                  <div style={{ fontSize: 11, color: 'var(--zwc-text-muted)', opacity: 0.7, marginTop: 2 }}>
                    {t.location}
                  </div>
                )}

                {/* Notification info */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  {inst?.errichterEmail && (
                    <span style={{ fontSize: 10, color: 'var(--zwc-green)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                      Errichter
                    </span>
                  )}
                  {inst?.endkundeWirdBenachrichtigt ? (
                    <span style={{ fontSize: 10, color: 'var(--zwc-green)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                      Endkunde
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: 'var(--zwc-text-muted)', opacity: 0.5, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Endkunde (kein Consent)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
