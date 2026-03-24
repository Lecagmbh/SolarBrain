import type { ParsedTermin } from '../types';
import { formatDateDE, getWeekday } from '../utils/dateHelpers';

interface Props {
  termin: ParsedTermin;
}

export function EmailPreview({ termin }: Props) {
  const weekday = getWeekday(termin.datum);
  const datumDE = formatDateDE(termin.datum);

  return (
    <div className="zwc-email-preview">
      <div className="zwc-email-header">
        <div className="zwc-email-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <div>
          <div className="zwc-email-title">Email-Vorschau</div>
          <div className="zwc-email-subtitle">An den Endkunden der Installation #{termin.selectedInstallationId}</div>
        </div>
      </div>

      <div className="zwc-email-body">
        <p style={{ marginBottom: 12 }}>
          <strong>Betreff:</strong> Ihr Zählerwechsel-Termin am {datumDE}
        </p>
        <p style={{ marginBottom: 8 }}>Sehr geehrte(r) Kunde/Kundin,</p>
        <p style={{ marginBottom: 8 }}>
          wir möchten Sie darüber informieren, dass Ihr <strong>Zählerwechsel</strong> für den
        </p>
        <p style={{ marginBottom: 8, fontSize: 15, fontWeight: 600, color: 'var(--zwc-accent)' }}>
          {weekday}, {datumDE} um {termin.uhrzeit} Uhr
        </p>
        <p style={{ marginBottom: 8 }}>
          vorgesehen ist. Bitte stellen Sie sicher, dass der Zugang zum Zählerschrank gewährleistet ist.
        </p>
        {termin.kommentar && (
          <p style={{ marginBottom: 8, fontStyle: 'italic', color: 'var(--zwc-text-dim)' }}>
            Hinweis: {termin.kommentar}
          </p>
        )}
        <p style={{ marginTop: 16, fontSize: 11, color: 'var(--zwc-text-dim)' }}>
          Diese Nachricht wird automatisch per Email und ggf. WhatsApp versendet.
        </p>
      </div>
    </div>
  );
}
