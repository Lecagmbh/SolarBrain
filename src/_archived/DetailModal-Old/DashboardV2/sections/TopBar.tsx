import { useState, useCallback } from 'react';
import { Upload, ExternalLink, Loader2 } from 'lucide-react';
import { T } from '../styles';
import { StatusPill } from './StatusPill';
import { getStatusActions } from '../utils/statusConfig';
import type { Installation } from '../types';

const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '5px 12px', borderRadius: 6,
  border: `1px solid ${T.ba}`, background: T.s2, color: T.t2,
  fontSize: 12, fontWeight: 500, cursor: 'pointer',
  whiteSpace: 'nowrap', fontFamily: 'inherit',
};

export function TopBar({ data, onOpenUploadModal, onStatusChange }: {
  data: Installation; onOpenUploadModal?: () => void; onStatusChange?: (status: string) => void;
}) {
  const [changing, setChanging] = useState<string | null>(null);
  const actions = getStatusActions(data.status);
  const primaryAction = actions.find(a => a.variant === 'primary');
  const secondaryActions = actions.filter(a => a.variant !== 'primary');

  const handleAction = useCallback(async (targetStatus: string) => {
    if (!onStatusChange) return;
    setChanging(targetStatus);
    try { await onStatusChange(targetStatus); } finally { setChanging(null); }
  }, [onStatusChange]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 20px', background: T.s1,
      borderBottom: `1px solid ${T.bd}`,
      flexShrink: 0, minHeight: 44,
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.t3 }}>
        <span style={{ color: T.ac, fontWeight: 700, fontSize: 13 }}>G</span>
        <span>Baunity</span>
        <span style={{ margin: '0 4px' }}>|</span>
        <span style={{ color: T.t2, fontWeight: 500 }}>{data.customerName || 'Unbekannt'}</span>
      </div>

      <span style={{
        fontFamily: T.mono, fontSize: 10, color: T.t3,
        background: T.s3, padding: '2px 8px', borderRadius: 4, letterSpacing: 0.5,
      }}>
        {data.publicId || `#${data.id}`}
      </span>

      <StatusPill status={data.status} />

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onOpenUploadModal && (
          <button style={btn} onClick={onOpenUploadModal}>
            <Upload size={13} /> Hochladen
          </button>
        )}
        {data.gridOperatorPortalUrl && (
          <a style={{ ...btn, textDecoration: 'none' }} href={data.gridOperatorPortalUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={13} /> NB-Portal
          </a>
        )}
        {secondaryActions.map(action => (
          <button
            key={action.targetStatus}
            style={{ ...btn, ...(action.variant === 'danger' ? { color: T.er, borderColor: 'rgba(248,113,113,0.2)' } : {}) }}
            onClick={() => handleAction(action.targetStatus)}
            disabled={changing !== null}
          >
            {changing === action.targetStatus && <Loader2 size={12} className="gnz-spin" />}
            {action.label}
          </button>
        ))}
        {primaryAction && (
          <button
            style={{ ...btn, background: T.ac, color: '#fff', borderColor: T.ac, fontWeight: 600 }}
            onClick={() => handleAction(primaryAction.targetStatus)}
            disabled={changing !== null}
          >
            {changing === primaryAction.targetStatus && <Loader2 size={12} className="gnz-spin" />}
            {primaryAction.label} →
          </button>
        )}
      </div>
    </div>
  );
}
