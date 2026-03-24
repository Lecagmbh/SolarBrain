import type { TerminStatus } from '../types';

/**
 * 3-step progress: Erkannt → Bestätigt → Informiert
 */

const STEPS = ['parsed', 'confirmed', 'notified'] as const;

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <polyline points="2 5.5 4 7.5 8 3" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <line x1="2.5" y1="2.5" x2="7.5" y2="7.5" />
      <line x1="7.5" y1="2.5" x2="2.5" y2="7.5" />
    </svg>
  );
}

const STATUS_ORDER: Record<TerminStatus, number> = {
  parsed: 0,
  confirmed: 1,
  notified: 2,
  error: 2,
};

function getStepState(stepIdx: number, status: TerminStatus): 'done' | 'active' | 'error' | 'pending' {
  if (status === 'error') {
    // Error on last step, previous steps done
    if (stepIdx < 2) return 'done';
    return 'error';
  }

  const current = STATUS_ORDER[status];
  if (stepIdx < current) return 'done';
  if (stepIdx === current) return status === 'notified' ? 'done' : 'active';
  return 'pending';
}

export function StepTrack({ status }: { status: TerminStatus }) {
  return (
    <div className="zwc-step-track">
      {STEPS.map((step, idx) => {
        const state = getStepState(idx, status);
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            {idx > 0 && (
              <div className={`zwc-step-line ${state === 'done' ? 'zwc-step-line--done' : ''}`} />
            )}
            <div className={`zwc-step-dot zwc-step-dot--${state}`} title={step}>
              {state === 'done' && <CheckIcon />}
              {state === 'error' && <XIcon />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
