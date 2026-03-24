import { useState, useEffect, useCallback } from 'react';
import {
  Send, RefreshCw, Loader2, AlertCircle, CheckCircle,
  ClipboardList, ChevronDown, ChevronUp, Mail, MessageCircle, Clock, User,
} from 'lucide-react';
import { T, box, boxHeader, boxTitle } from '../styles';
import {
  getAdminPortalStatus, activatePortal, resendWelcomeEmail,
  sendDokumentAnforderung, type PortalStatus,
} from '../../../../../../portal/api';

const QUICK_REQUESTS = [
  { group: 'Fotos', icon: '\u{1F4F8}', items: [
    { id: 'foto_zaehler', label: 'Zähler' }, { id: 'foto_zaehlerschrank', label: 'Zählerschrank' },
    { id: 'foto_hak', label: 'Hausanschluss' }, { id: 'foto_anlage', label: 'Anlage' },
  ]},
  { group: 'Dokumente', icon: '\u{1F4C4}', items: [
    { id: 'stromrechnung', label: 'Stromrechnung' }, { id: 'lageplan', label: 'Lageplan' },
    { id: 'datenblatt', label: 'Datenblatt' }, { id: 'personalausweis', label: 'Personalausweis' },
    { id: 'vollmacht', label: 'Vollmacht' }, { id: 'grundbuchauszug', label: 'Grundbuchauszug' },
  ]},
  { group: 'Technische Unterlagen', icon: '\u{1F4DD}', items: [
    { id: 'schaltplan', label: 'Schaltplan' }, { id: 'na_schutz_zertifikat', label: 'NA-Schutz' },
    { id: 'datenblatt_module', label: 'Modul-Datenblatt' }, { id: 'datenblatt_wechselrichter', label: 'WR-Datenblatt' },
    { id: 'datenblatt_speicher', label: 'Speicher-Datenblatt' },
  ]},
];

interface PortalCardProps {
  installationId: number;
  contactEmail?: string | null;
  customerName?: string | null;
  isAdmin?: boolean;
}

const actionBtn: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 6,
  background: T.s3, border: `1px solid ${T.ba}`,
  color: T.t2, fontSize: 10, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', gap: 4,
};

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function PortalCard({ installationId, contactEmail, customerName, isAdmin = false }: PortalCardProps) {
  const [status, setStatus] = useState<PortalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRequestPanel, setShowRequestPanel] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setStatus(await getAdminPortalStatus(installationId)); }
      catch { setStatus(null); }
      finally { setLoading(false); }
    })();
  }, [installationId]);

  const handleActivate = useCallback(async () => {
    if (!contactEmail) { setError('Keine E-Mail-Adresse vorhanden'); return; }
    setActivating(true); setError(null); setSuccessMessage(null);
    try {
      const result = await activatePortal(installationId);
      setSuccessMessage(result.isNewUser
        ? `Portal aktiviert! Zugangsdaten an ${result.email} gesendet.`
        : `Installation mit User ${result.email} verknüpft.`);
      setStatus(await getAdminPortalStatus(installationId));
    } catch { setError('Fehler beim Aktivieren'); }
    finally { setActivating(false); }
  }, [installationId, contactEmail]);

  const handleResend = useCallback(async () => {
    setResending(true); setError(null); setSuccessMessage(null);
    try { await resendWelcomeEmail(installationId); setSuccessMessage('Neues Passwort gesendet!'); }
    catch { setError('Fehler beim Senden'); }
    finally { setResending(false); }
  }, [installationId]);

  if (loading) {
    return (
      <div style={box}>
        <div style={boxHeader}><div style={boxTitle}>Kundenportal</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 12, color: T.t3, fontSize: 12 }}>
          <Loader2 size={14} className="gnz-spin" /> Lade...
        </div>
      </div>
    );
  }

  return (
    <div style={box}>
      <div style={boxHeader}><div style={boxTitle}>Kundenportal</div></div>
      <div style={{ padding: '8px 10px' }}>
        {/* Messages */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, background: T.erBg, marginBottom: 8, fontSize: 11, color: T.er }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {successMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, background: T.okBg, marginBottom: 8, fontSize: 11, color: T.ok }}>
            <CheckCircle size={14} /> {successMessage}
          </div>
        )}

        {/* Not Activated */}
        {!status?.isActivated && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: T.s3, marginBottom: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.t3 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.t3 }}>Nicht aktiviert</span>
            </div>
            {contactEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', fontSize: 11, color: T.t1, borderBottom: `1px solid ${T.bd}` }}>
                <span style={{ color: T.t3, fontSize: 10 }}>E-Mail</span>
                <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 11 }}>{contactEmail}</span>
              </div>
            )}
            <button
              onClick={handleActivate} disabled={activating || !contactEmail}
              style={{ ...actionBtn, marginTop: 8, background: T.ac, color: '#fff', borderColor: T.ac, width: '100%', justifyContent: 'center' }}
            >
              {activating ? <><Loader2 size={14} className="gnz-spin" /> Aktiviere...</> : <><Send size={14} /> Kundenportal aktivieren</>}
            </button>
            {!contactEmail && <p style={{ fontSize: 10, color: T.t3, marginTop: 4 }}>Keine E-Mail vorhanden.</p>}
          </>
        )}

        {/* Activated */}
        {status?.isActivated && (
          <>
            {/* Status line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: T.okBg, marginBottom: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.ok, boxShadow: `0 0 6px ${T.ok}` }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.ok }}>Aktiv</span>
              {status.activatedAt && <span style={{ fontSize: 10, color: T.t3, marginLeft: 'auto' }}>seit {fmtDate(status.activatedAt)}</span>}
            </div>

            {/* User info */}
            {status.user && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', fontSize: 11, color: T.t1, borderBottom: `1px solid ${T.bd}` }}>
                  <span style={{ color: T.t3, fontSize: 10 }}>E-Mail</span>
                  <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 11 }}>{status.user.email}</span>
                </div>
                {status.user.lastLogin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', fontSize: 11, color: T.t3, borderBottom: `1px solid ${T.bd}` }}>
                    <Clock size={12} /> Letzter Login: {fmtDate(status.user.lastLogin)}
                  </div>
                )}
              </>
            )}

            {/* Consent badges */}
            {status.consent && (
              <div style={{ display: 'flex', gap: 6, padding: '6px 8px' }}>
                <ConsentBadge label="E-Mail" icon={Mail} active={status.consent.emailConsent} />
                <ConsentBadge label="WhatsApp" icon={MessageCircle} active={status.consent.whatsappConsent} verified={status.consent.whatsappVerified} />
              </div>
            )}

            {/* Onboarding warning */}
            {status.consent && !status.consent.onboardingCompleted && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, background: T.wrBg, margin: '4px 0 8px', fontSize: 11, color: T.wr }}>
                <AlertCircle size={14} /> Onboarding nicht abgeschlossen
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, padding: '0 2px' }}>
              <button style={actionBtn} onClick={handleResend} disabled={resending}>
                {resending ? <Loader2 size={12} className="gnz-spin" /> : <RefreshCw size={12} />} Neues Passwort
              </button>
              {isAdmin && (
                <button
                  style={{ ...actionBtn, ...(showRequestPanel ? { background: T.ac, color: '#fff', borderColor: T.ac } : {}) }}
                  onClick={() => setShowRequestPanel(v => !v)}
                >
                  <ClipboardList size={12} /> Daten anfordern
                  {showRequestPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
              {status.consent?.emailConsent && contactEmail && (
                <a href={`mailto:${contactEmail}`} style={{ ...actionBtn, textDecoration: 'none' }}>
                  <Mail size={12} /> E-Mail
                </a>
              )}
              {status.consent?.whatsappConsent && (
                <button style={{ ...actionBtn, background: T.okBg, borderColor: 'rgba(52,211,153,0.12)', color: T.ok }}>
                  <MessageCircle size={12} /> WhatsApp
                </button>
              )}
            </div>

            {/* Quick Request Panel */}
            {showRequestPanel && isAdmin && (
              <QuickRequestPanel
                installationId={installationId}
                onSuccess={msg => { setSuccessMessage(msg); setShowRequestPanel(false); }}
                onError={msg => setError(msg)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ConsentBadge({ label, icon: Icon, active, verified }: {
  label: string; icon: typeof Mail; active: boolean; verified?: boolean;
}) {
  const bg = active ? (verified !== false ? T.okBg : T.wrBg) : T.s3;
  const color = active ? (verified !== false ? T.ok : T.wr) : T.t3;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: bg, fontSize: 10, fontWeight: 600, color }}>
      <Icon size={11} /> {label}
      {active && (verified !== false ? <CheckCircle size={10} /> : <Clock size={10} />)}
    </span>
  );
}

function QuickRequestPanel({ installationId, onSuccess, onError }: {
  installationId: number; onSuccess: (msg: string) => void; onError: (msg: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customMsg, setCustomMsg] = useState('');
  const [sending, setSending] = useState(false);

  const toggleItem = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSubmit = async () => {
    const labels = QUICK_REQUESTS.flatMap(g => g.items).filter(i => selected.has(i.id)).map(i => i.label);
    if (labels.length === 0 && !customMsg.trim()) { onError('Bitte mindestens ein Dokument auswählen.'); return; }
    const dokumente = labels.length > 0 ? labels : [customMsg.trim()];
    const message = labels.length > 0 ? customMsg.trim() || undefined : undefined;
    setSending(true);
    try {
      const result = await sendDokumentAnforderung(installationId, dokumente, message);
      const ch: string[] = [];
      if (result.whatsappSent) ch.push('WhatsApp');
      if (result.emailSent) ch.push('E-Mail');
      onSuccess(`${dokumente.length} Dok. angefordert per ${ch.join(' + ') || 'Portal'}`);
    } catch { onError('Fehler beim Senden'); }
    finally { setSending(false); }
  };

  const chipBase: React.CSSProperties = {
    padding: '3px 8px', borderRadius: 4, fontSize: 10,
    cursor: 'pointer', border: `1px solid ${T.ba}`,
    fontFamily: 'inherit', fontWeight: 500,
  };

  return (
    <div style={{ marginTop: 8, padding: '8px', background: T.s1, borderRadius: 6, border: `1px solid ${T.bd}` }}>
      {QUICK_REQUESTS.map(group => (
        <div key={group.group} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, marginBottom: 3 }}>{group.icon} {group.group}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {group.items.map(item => (
              <button
                key={item.id}
                style={{
                  ...chipBase,
                  background: selected.has(item.id) ? T.ac : T.s3,
                  color: selected.has(item.id) ? '#fff' : T.t2,
                  borderColor: selected.has(item.id) ? T.ac : T.ba,
                }}
                onClick={() => toggleItem(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <textarea
        value={customMsg} onChange={e => setCustomMsg(e.target.value)}
        placeholder="Individuelle Nachricht..."
        rows={2}
        style={{
          width: '100%', padding: '4px 8px', borderRadius: 4, fontSize: 11,
          background: T.s3, border: `1px solid ${T.ba}`, color: T.t1,
          fontFamily: 'inherit', resize: 'vertical', outline: 'none',
          marginTop: 4,
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={sending || (selected.size === 0 && !customMsg.trim())}
        style={{
          ...chipBase, marginTop: 6, width: '100%', justifyContent: 'center',
          display: 'flex', alignItems: 'center', gap: 4,
          background: T.ac, color: '#fff', borderColor: T.ac, fontWeight: 600,
          opacity: (sending || (selected.size === 0 && !customMsg.trim())) ? 0.5 : 1,
        }}
      >
        {sending ? <Loader2 size={12} className="gnz-spin" /> : <Send size={12} />}
        {sending ? 'Wird gesendet...' : 'Anfordern (WhatsApp + E-Mail)'}
      </button>
    </div>
  );
}
