import type { TerminStatus } from '../types';

const LABELS: Record<TerminStatus, string> = {
  parsed: 'Erkannt',
  confirmed: 'Bestätigt',
  notified: 'Informiert',
  error: 'Fehler',
};

export function StatusPill({ status }: { status: TerminStatus }) {
  return (
    <span className={`zwc-pill zwc-pill--${status}`}>
      <span className="zwc-pill-dot" />
      {LABELS[status]}
    </span>
  );
}
