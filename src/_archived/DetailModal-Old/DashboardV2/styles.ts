// Design tokens as JS constants — immune to Tailwind v4 overrides
export const T = {
  bg: '#07070C',
  s1: '#0E0E16',
  s2: '#14141E',
  s3: '#1A1A26',
  s4: '#222230',
  bd: 'rgba(255,255,255,0.04)',
  ba: 'rgba(255,255,255,0.08)',
  t1: '#EEEEF2',
  t2: '#9898AE',
  t3: '#5C5C72',
  ac: '#7C6CF0',
  acHover: '#6B5CE0',
  acGlow: 'rgba(124,108,240,0.09)',
  ok: '#34D399',
  okBg: 'rgba(52,211,153,0.07)',
  wr: '#FBBF24',
  wrBg: 'rgba(251,191,36,0.07)',
  er: '#F87171',
  erBg: 'rgba(248,113,113,0.07)',
  bl: '#60A5FA',
  blBg: 'rgba(96,165,250,0.07)',
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

// Shared style objects
export const box: React.CSSProperties = {
  background: T.s2,
  borderRadius: 10,
  border: `1px solid ${T.bd}`,
  overflow: 'hidden',
};

export const boxHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  background: T.s1,
  borderBottom: `1px solid ${T.bd}`,
};

export const boxTitle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
  fontWeight: 700,
  color: T.t3,
  letterSpacing: 0.8,
  textTransform: 'uppercase',
};

export const boxBadge: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  padding: '1px 7px',
  borderRadius: 8,
  background: T.acGlow,
  color: T.ac,
};

export const boxBody: React.CSSProperties = {
  padding: '4px 0',
};
