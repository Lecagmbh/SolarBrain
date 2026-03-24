import { T, box, boxHeader, boxTitle, boxBadge } from '../styles';
import type { Installation, NormalizedWizardData } from '../types';

interface HealthScoreProps {
  data: Installation;
  wizardData: NormalizedWizardData;
}

interface CheckItem {
  label: string;
  ok: boolean;
}

export function HealthScore({ data, wizardData }: HealthScoreProps) {
  const checks: CheckItem[] = [
    { label: 'NB-Daten', ok: !!(data.gridOperator && data.nbEmail) },
    { label: 'Technik', ok: wizardData.pvEntries.length > 0 || !!wizardData.technical.totalPvKwp },
    { label: 'Dokumente', ok: (data.documents?.length || 0) >= 2 },
    { label: 'Zähler', ok: !!wizardData.meter.number },
  ];

  const okCount = checks.filter(c => c.ok).length;
  const pct = Math.round((okCount / checks.length) * 100);

  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 75 ? T.ok : pct >= 50 ? T.wr : T.er;

  return (
    <div style={box}>
      <div style={boxHeader}>
        <div style={boxTitle}>Vollständigkeit</div>
        <span style={boxBadge}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
        <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
          <svg viewBox="0 0 44 44" style={{ width: 44, height: 44, transform: 'rotate(-90deg)' }}>
            <circle cx="22" cy="22" r={r} fill="none" stroke={T.s3} strokeWidth="3" />
            <circle
              cx="22" cy="22" r={r} fill="none"
              stroke={color} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.4s' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: T.t1,
          }}>
            {pct}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {checks.map(c => (
            <div key={c.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 11, padding: '2px 0', color: T.t2,
            }}>
              <span>{c.label}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: c.ok ? T.ok : T.er }}>
                {c.ok ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
