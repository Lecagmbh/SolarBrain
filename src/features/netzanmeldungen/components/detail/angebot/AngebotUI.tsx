/**
 * Shared UI Components für den Angebot-Editor (sevdesk-Style)
 */
import { useState, useEffect, useRef } from "react";

export const C = {
  bg: "#08080c", surface: "rgba(16,16,22,0.8)", card: "rgba(20,20,30,0.65)",
  border: "rgba(255,255,255,0.06)", borderHover: "rgba(255,255,255,0.12)",
  borderAccent: "rgba(0,210,150,0.2)", accent: "#00d896", accentAlt: "#00c2ff",
  accentGlow: "rgba(0,216,150,0.15)", accentGlowStrong: "rgba(0,216,150,0.3)",
  danger: "#ff4466", dangerDim: "rgba(255,68,102,0.08)",
  text: "#eeeef2", textSoft: "#b0b0c0", textMuted: "#5e5e72", textFaint: "#3a3a4e",
};
export const ff = `'Inter', -apple-system, sans-serif`;
export const mono = `'JetBrains Mono', monospace`;

export function AnimNum({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current; prev.current = value;
    let start: number | null = null;
    let raf: number;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / 500, 1);
      setShown(from + (value - from) * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
}

export function Inp({ value, onChange, placeholder, type = "text", style: sx, isMono, readOnly, suffix }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", ...sx }}>
      <input type={type} value={value} onChange={(e: any) => onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", boxSizing: "border-box", background: focused ? "rgba(0,216,150,0.02)" : "rgba(255,255,255,0.025)", border: `1px solid ${focused ? C.borderAccent : C.border}`, borderRadius: 8, padding: "9px 12px", paddingRight: suffix ? 40 : 12, color: C.text, fontSize: 14, fontFamily: isMono ? mono : ff, textAlign: isMono ? "right" : "left", outline: "none", transition: "all 0.2s", boxShadow: focused ? `0 0 0 3px ${C.accentGlow}` : "none" }} />
      {suffix && <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: 12, pointerEvents: "none" }}>{suffix}</span>}
    </div>
  );
}

export function Sel({ value, onChange, options, style: sx }: any) {
  return (
    <select value={value} onChange={(e: any) => onChange(e.target.value)} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 10px", color: C.textSoft, fontSize: 13, fontFamily: ff, outline: "none", cursor: "pointer", WebkitAppearance: "none" as any, ...sx }}>
      {options.map((o: any) => typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Card({ children, style: sx }: any) {
  return <div style={{ background: C.card, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 28px", ...sx }}>{children}</div>;
}

export function Title({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>{children}</h2>
      {sub && <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>{children}{required && <span style={{ color: C.accent, marginLeft: 2 }}>*</span>}</label>;
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; border: string; color: string }> = {
    Entwurf: { bg: "rgba(255,255,255,0.04)", border: C.border, color: C.textMuted },
    Versendet: { bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.15)", color: "#5599ff" },
    Angenommen: { bg: C.accentGlow, border: C.borderAccent, color: C.accent },
    Abgelehnt: { bg: C.dangerDim, border: "rgba(255,68,102,0.15)", color: C.danger },
  };
  const s = map[status] || map.Entwurf;
  return <span style={{ display: "inline-flex", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>{status}</span>;
}

export function BarBtn({ children, onClick, active, style: sx }: any) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: active ? C.accentGlow : hov ? "rgba(255,255,255,0.04)" : "transparent", border: `1px solid ${active ? C.borderAccent : hov ? C.borderHover : C.border}`, borderRadius: 7, padding: "6px 13px", color: active ? C.accent : hov ? C.text : C.textSoft, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: ff, transition: "all 0.15s", ...sx }}>{children}</button>
  );
}
