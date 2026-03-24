import { T } from '../styles';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  eingang:     { label: 'Eingang',     bg: T.blBg,  color: T.bl },
  beim_nb:     { label: 'Beim NB',     bg: T.wrBg,  color: T.wr },
  rueckfrage:  { label: 'Rückfrage',   bg: T.erBg,  color: T.er },
  genehmigt:   { label: 'Genehmigt',   bg: T.okBg,  color: T.ok },
  ibn:         { label: 'IBN',         bg: 'rgba(124,108,240,0.12)', color: T.ac },
  fertig:      { label: 'Fertig',      bg: T.okBg,  color: T.ok },
  abgerechnet: { label: 'Abgerechnet', bg: 'rgba(52,211,153,0.08)',  color: 'rgba(52,211,153,0.6)' },
  storniert:   { label: 'Storniert',   bg: 'rgba(248,113,113,0.08)', color: 'rgba(248,113,113,0.6)' },
};

export function StatusPill({ status }: { status: string }) {
  const normalized = status?.toLowerCase() || 'eingang';
  const cfg = STATUS_CONFIG[normalized] || { label: status, bg: T.s3, color: T.t2 };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      background: cfg.bg,
      color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}
