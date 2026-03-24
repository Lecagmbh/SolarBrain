/**
 * DSGVO Consent-Badges für Endkunden (read-only)
 * ✉ Email, W WhatsApp, ☎ Phone, P Portal
 */

import type { EndkundenConsent } from '../types';

interface Props {
  consent: EndkundenConsent | null | undefined;
}

export function ConsentBadges({ consent }: Props) {
  if (!consent) return <span className="up-consent-na">–</span>;

  const badges: { icon: string; ok: boolean; label: string }[] = [
    { icon: '✉', ok: consent.emailConsent, label: 'Email' },
    { icon: 'W', ok: consent.whatsappConsent, label: 'WhatsApp' },
    { icon: '☎', ok: false, label: 'Telefon' }, // Phone consent not tracked yet
    { icon: 'P', ok: !!consent.portalActivatedAt, label: 'Portal' },
  ];

  return (
    <div className="up-consent-badges">
      {badges.map((b) => (
        <span
          key={b.icon}
          className={`up-consent-badge ${b.ok ? 'up-consent-badge--ok' : 'up-consent-badge--no'}`}
          title={`${b.label}: ${b.ok ? 'Zugestimmt' : 'Nicht zugestimmt'}`}
        >
          {b.icon}
        </span>
      ))}
    </div>
  );
}

export function ConsentSummary({ consent }: Props) {
  if (!consent) return null;

  const parts: string[] = [];
  if (consent.emailConsent) parts.push('Email');
  if (consent.whatsappConsent) parts.push('WhatsApp');
  if (consent.portalActivatedAt) parts.push('Portal');

  const allowed = parts.length > 0 ? `${parts.join(' + ')} erlaubt` : 'Kein Consent erteilt';
  const denied: string[] = [];
  if (!consent.emailConsent) denied.push('Email');
  if (!consent.whatsappConsent) denied.push('WhatsApp');
  const deniedText = denied.length > 0 ? ` · Kein ${denied.join('/')}` : '';

  const dateText = consent.emailConsentAt
    ? ` · Zugestimmt am ${new Date(consent.emailConsentAt).toLocaleDateString('de-DE')}`
    : '';

  return (
    <span className="up-consent-summary">{allowed}{deniedText}{dateText}</span>
  );
}
