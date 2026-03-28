// CRM Color System & shared constants — matching Mock design
export const C = {
  bg: "#06060b",
  bgCard: "rgba(12,12,20,0.85)",
  bgCardHover: "rgba(18,18,30,0.95)",
  bgPanel: "#060b18",
  bgInput: "rgba(15,15,25,0.9)",
  border: "rgba(212,168,67,0.08)",
  borderHover: "rgba(212,168,67,0.2)",
  borderActive: "rgba(212,168,67,0.4)",
  primary: "#D4A843",
  primaryLight: "#EAD068",
  primaryGlow: "rgba(212,168,67,0.15)",
  accent: "#a5b4fc",
  accentDim: "#D4A84380",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  textMuted: "#64748b",
  textBright: "#f1f5f9",
  green: "#34d399",
  greenBg: "rgba(52,211,153,0.12)",
  yellow: "#fbbf24",
  yellowBg: "rgba(251,191,36,0.12)",
  red: "#f87171",
  redBg: "rgba(248,113,113,0.12)",
  blue: "#38bdf8",
  blueBg: "rgba(56,189,248,0.12)",
  orange: "#fb923c",
  orangeBg: "rgba(251,146,60,0.12)",
  purple: "#f0d878",
  purpleBg: "rgba(167,139,250,0.12)",
};

export const fmt = (v?: number | null) =>
  v != null ? v.toLocaleString("de-DE", { style: "currency", currency: "EUR" }) : "—";

export const badgeStyle = (bg: string, color: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  fontSize: 10,
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: 4,
  background: bg,
  color,
  letterSpacing: 0.3,
  whiteSpace: "nowrap",
});

export const cardStyle: React.CSSProperties = {
  background: C.bgCard,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: 16,
};

export const btnPrimary: React.CSSProperties = {
  background: C.primary,
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 16px",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
};

export const btnGhost: React.CSSProperties = {
  background: C.primaryGlow,
  color: C.accent,
  border: `1px solid ${C.accentDim}`,
  borderRadius: 6,
  padding: "8px 16px",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
};

export const inputStyle: React.CSSProperties = {
  background: C.bgInput,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  padding: "7px 12px",
  color: C.text,
  fontSize: 12,
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
};

export const kpiCardStyle = (color: string): React.CSSProperties => ({
  background: C.bgCard,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: "14px 16px",
  position: "relative",
  overflow: "hidden",
});

export const CSS_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;500;700;800&family=DM+Mono:wght@400;500&display=swap');
.crm-fade { animation: crmFadeIn 0.35s ease both; }
.crm-card:hover { border-color: ${C.borderHover} !important; transform: translateY(-1px); }
@keyframes crmFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
.crm-ki-badge { background: linear-gradient(135deg, ${C.primary}, ${C.orange}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; }
`;
