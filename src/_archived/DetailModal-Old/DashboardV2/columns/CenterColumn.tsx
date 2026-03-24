import { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { T, box, boxHeader, boxTitle, boxBadge, boxBody } from '../styles';
import { DocumentGrid } from '../sections/DocumentGrid';
import { MaStrMatchInline, MaStrConfirmInline } from '../sections/MaStrInline';
import { formatRelativeTime, formatDate } from '../utils/formatters';
import type { Installation, NormalizedWizardData, ApiEmail } from '../types';

interface CenterColumnProps {
  data: Installation;
  wizardData: NormalizedWizardData;
  emails: ApiEmail[];
  emailsLoading: boolean;
  dedicatedEmail: string;
  onCopy: (text: string, key: string) => void;
  isCopied: (key: string) => boolean;
  onOpenEmail?: (emailId: number) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

type EmailFilter = 'all' | 'nb' | 'kunde';

const tabBtn: React.CSSProperties = {
  padding: '3px 8px', borderRadius: 4,
  fontSize: 10, fontWeight: 500, cursor: 'pointer',
  border: `1px solid ${T.ba}`, fontFamily: 'inherit',
};

export function CenterColumn({
  data, wizardData, emails, emailsLoading, dedicatedEmail,
  onCopy, isCopied, onOpenEmail, showToast
}: CenterColumnProps) {
  const [emailFilter, setEmailFilter] = useState<EmailFilter>('all');
  const nbEmail = data.nbEmail?.toLowerCase();
  const customerEmail = (wizardData.customer?.email || data.contactEmail)?.toLowerCase();

  const filteredEmails = emails.filter(e => {
    if (emailFilter === 'all') return true;
    const from = e.fromAddress?.toLowerCase() || '';
    if (emailFilter === 'nb') return nbEmail && from.includes(nbEmail.split('@')[0]);
    if (emailFilter === 'kunde') return customerEmail && from.includes(customerEmail.split('@')[0]);
    return true;
  });

  const commission = wizardData.commissioning;
  const auth = wizardData.authorization;
  const hasSpeicher = wizardData.batteryEntries.length > 0;

  return (
    <div className="gnz-scroll" style={{
      overflowY: 'auto', padding: 10,
      display: 'flex', flexDirection: 'column', gap: 10,
      minHeight: 0,
    }}>
      {/* 1. Kommunikation / E-Mails — TOP, most important */}
      <div style={box}>
        <div style={boxHeader}>
          <div style={boxTitle}><Mail size={13} /> Kommunikation</div>
          <span style={boxBadge}>{emails.length}</span>
        </div>
        <div style={{ padding: '4px 8px', display: 'flex', gap: 4, borderBottom: `1px solid ${T.bd}` }}>
          {(['all', 'nb', 'kunde'] as EmailFilter[]).map(f => (
            <button
              key={f}
              style={{
                ...tabBtn,
                background: emailFilter === f ? T.ac : T.s3,
                color: emailFilter === f ? '#fff' : T.t2,
                borderColor: emailFilter === f ? T.ac : T.ba,
              }}
              onClick={() => setEmailFilter(f)}
            >
              {f === 'all' ? 'Alle' : f === 'nb' ? 'NB' : 'Kunde'}
            </button>
          ))}
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }} className="gnz-scroll">
          {emailsLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 12, color: T.t3, fontSize: 12 }}>
              <Loader2 size={14} className="gnz-spin" /> Lade...
            </div>
          ) : filteredEmails.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: 11, color: T.t3 }}>
              Keine E-Mails vorhanden
            </div>
          ) : (
            filteredEmails.slice(0, 15).map(email => {
              const isIncoming = !email.fromAddress?.includes('@baunity.de');
              return (
                <div
                  key={email.id}
                  onClick={() => onOpenEmail?.(email.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '7px 12px', cursor: 'pointer',
                    borderBottom: `1px solid ${T.bd}`,
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: isIncoming ? T.blBg : T.okBg,
                    color: isIncoming ? T.bl : T.ok,
                  }}>
                    {isIncoming ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 500, color: T.t1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {email.subject}
                    </div>
                    <div style={{ fontSize: 10, color: T.t3, marginTop: 1 }}>
                      {email.fromName || email.fromAddress}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: T.t3, whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 2 }}>
                    {formatRelativeTime(email.receivedAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. NB-Weiterleitungs-Email */}
      <div
        onClick={() => onCopy(dedicatedEmail, 'dedicated-email')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 8,
          background: isCopied('dedicated-email') ? T.acGlow : T.s2,
          border: `1px solid ${isCopied('dedicated-email') ? T.ac : T.bd}`,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <span style={{ fontSize: 10, color: T.t3, whiteSpace: 'nowrap' }}>NB-Weiterleitung:</span>
        <span style={{ flex: 1, fontSize: 11, fontFamily: T.mono, color: T.ac, letterSpacing: -0.3 }}>
          {dedicatedEmail}
        </span>
        <span style={{ fontSize: 9, color: isCopied('dedicated-email') ? T.ok : T.t3, fontWeight: 600 }}>
          {isCopied('dedicated-email') ? '✓ Kopiert' : 'Kopieren'}
        </span>
      </div>

      {/* 3. Pflichtdokumente (2x2) + 4. Alle Dokumente (expanded when no emails) */}
      <DocumentGrid data={data} defaultExpanded={emails.length === 0} />

      {/* 5. IBN & Autorisierung / MaStR */}
      {(commission || auth?.mastrRegistration) && (
        <div style={box}>
          <div style={boxHeader}>
            <div style={boxTitle}>IBN & Autorisierung</div>
          </div>
          <div style={boxBody}>
            {commission?.plannedDate && (
              <div style={{ display: 'flex', alignItems: 'center', padding: '5px 12px', borderBottom: `1px solid ${T.bd}` }}>
                <span style={{ width: 90, fontSize: 11, color: T.t3, flexShrink: 0 }}>Geplante IBN</span>
                <span style={{ fontSize: 12, color: T.t1 }}>{formatDate(commission.plannedDate)}</span>
              </div>
            )}
            {commission?.actualDate && (
              <div style={{ display: 'flex', alignItems: 'center', padding: '5px 12px', borderBottom: `1px solid ${T.bd}` }}>
                <span style={{ width: 90, fontSize: 11, color: T.t3, flexShrink: 0 }}>Tats. IBN</span>
                <span style={{ fontSize: 12, color: T.t1 }}>{formatDate(commission.actualDate)}</span>
              </div>
            )}
            {commission?.mastrNumber && (
              <div style={{ display: 'flex', alignItems: 'center', padding: '5px 12px', borderBottom: `1px solid ${T.bd}` }}>
                <span style={{ width: 90, fontSize: 11, color: T.t3, flexShrink: 0 }}>MaStR Solar</span>
                <span style={{ fontSize: 11, fontFamily: T.mono, color: T.ok }}>{commission.mastrNumber}</span>
              </div>
            )}
            {commission?.mastrNumberSpeicher && (
              <div style={{ display: 'flex', alignItems: 'center', padding: '5px 12px', borderBottom: `1px solid ${T.bd}` }}>
                <span style={{ width: 90, fontSize: 11, color: T.t3, flexShrink: 0 }}>MaStR Speicher</span>
                <span style={{ fontSize: 11, fontFamily: T.mono, color: T.ok }}>{commission.mastrNumberSpeicher}</span>
              </div>
            )}
            {data.publicId && !commission?.mastrNumber && (
              <MaStrMatchInline publicId={data.publicId} onMatched={() => showToast('MaStR verknüpft', 'success')} />
            )}
            {auth?.mastrRegistration && !commission?.mastrRegistered && (
              <MaStrConfirmInline
                installId={data.id}
                hasStorage={hasSpeicher}
                onConfirmed={() => showToast('MaStR bestätigt', 'success')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
