import { T, box, boxHeader, boxTitle, boxBadge } from '../styles';
import { formatDate } from '../utils/formatters';
import type { StatusHistoryItem } from '../types';

const STATUS_LABELS: Record<string, string> = {
  eingang: 'Eingang', beim_nb: 'Beim NB', rueckfrage: 'Rückfrage',
  genehmigt: 'Genehmigt', ibn: 'IBN', fertig: 'Fertig',
  abgerechnet: 'Abgerechnet', storniert: 'Storniert',
};

function getLabel(status?: string): string {
  if (!status) return '—';
  return STATUS_LABELS[status.toLowerCase()] || status;
}

export function TimelineCompact({ history }: { history?: StatusHistoryItem[] }) {
  if (!history || history.length === 0) return null;

  const recent = [...history].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  return (
    <div style={box}>
      <div style={boxHeader}>
        <div style={boxTitle}>Verlauf</div>
        <span style={boxBadge}>{history.length}</span>
      </div>
      <div style={{ padding: '6px 12px' }}>
        {recent.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 0', fontSize: 11,
            borderBottom: `1px solid ${T.bd}`,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: T.ac, flexShrink: 0,
            }} />
            <span style={{ flex: 1, color: T.t2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.fromStatus
                ? `${getLabel(item.fromStatus)} → ${getLabel(item.toStatus)}`
                : getLabel(item.toStatus)
              }
              {item.changedByName && <> · {item.changedByName}</>}
            </span>
            <span style={{ fontSize: 10, color: T.t3, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {formatDate(item.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
