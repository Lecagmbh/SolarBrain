import { AlertTriangle } from 'lucide-react';
import { T } from '../styles';
import type { ApiAlert, ApiEmail } from '../types';

interface AlertBarProps {
  openAlert?: ApiAlert;
  openRueckfrageEmail?: ApiEmail;
  onOpenEmail?: (emailId: number) => void;
}

export function AlertBar({ openAlert, openRueckfrageEmail, onOpenEmail }: AlertBarProps) {
  if (!openAlert && !openRueckfrageEmail) return null;

  const message = openAlert
    ? (openAlert.requiredAction || openAlert.message)
    : `Rückfrage vom NB: ${openRueckfrageEmail!.subject}`;

  const emailId = openAlert?.relatedEmailId || openRueckfrageEmail?.id;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 20px',
      background: T.erBg,
      borderBottom: `1px solid rgba(248,113,113,0.15)`,
      fontSize: 12, color: T.er,
      flexShrink: 0,
    }}>
      <AlertTriangle size={14} />
      <span style={{ flex: 1 }}>{message}</span>
      {emailId && onOpenEmail && (
        <span
          onClick={() => onOpenEmail(emailId)}
          style={{
            cursor: 'pointer', fontWeight: 600,
            textDecoration: 'underline', whiteSpace: 'nowrap',
          }}
        >
          Anzeigen
        </span>
      )}
    </div>
  );
}
