import { Check, Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { T, box, boxHeader, boxTitle } from '../styles';
import { TIMELINE_STEPS, getStepState, getStatusActions } from '../utils/statusConfig';
import { formatDate } from '../utils/formatters';
import type { Installation } from '../types';

interface WorkflowVerticalProps {
  data: Installation;
  onStatusChange: (status: string) => void;
}

const dotBase: React.CSSProperties = {
  width: 22, height: 22, borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 9, fontWeight: 700, flexShrink: 0,
  position: 'relative', zIndex: 1,
};

const dotStyles: Record<string, React.CSSProperties> = {
  done: { ...dotBase, background: T.ok, color: '#fff' },
  active: { ...dotBase, background: T.ac, color: '#fff' },
  pending: { ...dotBase, background: T.s3, color: T.t3, border: `1px solid ${T.ba}` },
};

const lineStyles: Record<string, React.CSSProperties> = {
  done: { position: 'absolute', left: 10, top: 22, width: 2, bottom: -6, background: T.ok, zIndex: 0 },
  active: { position: 'absolute', left: 10, top: 22, width: 2, bottom: -6, background: T.ba, zIndex: 0 },
  pending: { position: 'absolute', left: 10, top: 22, width: 2, bottom: -6, background: T.ba, zIndex: 0 },
};

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '5px 12px', borderRadius: 6,
  fontSize: 11, fontWeight: 600, cursor: 'pointer',
  border: 'none', fontFamily: 'inherit',
};

export function WorkflowVertical({ data, onStatusChange }: WorkflowVerticalProps) {
  const [changing, setChanging] = useState<string | null>(null);
  const actions = getStatusActions(data.status);

  const handleAction = useCallback(async (targetStatus: string) => {
    setChanging(targetStatus);
    try { await onStatusChange(targetStatus); } finally { setChanging(null); }
  }, [onStatusChange]);

  const getStepDate = (stepStatus: string): string | undefined => {
    if (!data.statusHistory) return undefined;
    const entry = [...data.statusHistory].reverse().find(h => h.toStatus?.toLowerCase() === stepStatus);
    return entry?.createdAt;
  };

  return (
    <div style={box}>
      <div style={boxHeader}>
        <div style={boxTitle}>Workflow</div>
      </div>
      <div style={{ padding: '10px 12px' }}>
        {TIMELINE_STEPS.map((step, i) => {
          const state = getStepState(step.status, data.status);
          const stepDate = getStepDate(step.status);
          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative', paddingBottom: i < TIMELINE_STEPS.length - 1 ? 12 : 0 }}>
              {i < TIMELINE_STEPS.length - 1 && <div style={lineStyles[state]} />}
              <div style={dotStyles[state]}>
                {state === 'done' ? <Check size={11} /> : state === 'active' ? step.id : ''}
              </div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ fontSize: 12, fontWeight: state === 'active' ? 600 : 400, color: state === 'pending' ? T.t3 : T.t1 }}>
                  {step.label}
                </div>
                {stepDate && (
                  <div style={{ fontSize: 10, color: T.t3, marginTop: 1 }}>{formatDate(stepDate)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderTop: `1px solid ${T.bd}` }}>
          {actions.map(action => (
            <button
              key={action.targetStatus}
              style={{
                ...btnBase,
                ...(action.variant === 'primary'
                  ? { background: T.ac, color: '#fff' }
                  : action.variant === 'danger'
                    ? { background: T.erBg, color: T.er }
                    : { background: T.s3, color: T.t2 }),
              }}
              onClick={() => handleAction(action.targetStatus)}
              disabled={changing !== null}
            >
              {changing === action.targetStatus ? <Loader2 size={13} className="gnz-spin" /> : null}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
