/**
 * Detail-Panel Header — Sticky Top Bar mit animierter Lifecycle-Bar + Quick-Actions
 */
import { useState, useRef, useEffect } from "react";
import LifecycleBar from "./LifecycleBar";

const C = {
  panel: "#081020", border: "rgba(255,255,255,0.05)", primary: "#D4A843", accent: "#a5b4fc",
  text: "#e2e8f0", dim: "#94a3b8", muted: "#64748b", bright: "#f8fafc",
  green: "#22c55e", gBg: "rgba(34,197,94,0.06)", red: "#ef4444", rBg: "rgba(239,68,68,0.05)",
  cyan: "#06b6d4", orange: "#f97316", pink: "#ec4899", wa: "#25D366", purple: "#f0d878",
};

const b = (bg: string, c: string, t: string) => <span style={{ fontSize: 8, fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: bg, color: c, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3 }}>{t}</span>;

interface WorkflowStep { l: string; done: boolean; current?: boolean; c: string; date?: string }

interface QuickAction {
  label: string;
  icon: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}

interface Props {
  title: string;
  subtitle: string;
  id: string;
  status: string;
  statusColor: string;
  srcLabel: string;
  srcIcon: string;
  srcColor: string;
  kwp: string;
  ort: string;
  nb: string;
  tickets: number;
  docsOk: number;
  docsTotal: number;
  vollstaendigkeit: number;
  angebotWert?: string;
  hasCrm: boolean;
  nextAction: string;
  nextActionColor: string;
  workflow: WorkflowStep[];
  onBack: () => void;
  onNextAction?: () => void;
  nextActionLoading?: boolean;
  nextActionError?: string | null;
  dedicatedEmail?: string;
  quickActions?: QuickAction[];
  onQuickStatusChange?: (status: string) => void;
  isInstallation?: boolean;
}

function QuickActionsDropdown({ actions, onStatusChange, isInstallation }: {
  actions?: QuickAction[];
  onStatusChange?: (status: string) => void;
  isInstallation?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const statusOptions = isInstallation
    ? [
        { label: "Rückfrage", value: "RUECKFRAGE", icon: "❓", color: "#f59e0b" },
        { label: "Storniert", value: "STORNIERT", icon: "🚫", color: "#ef4444" },
      ]
    : [
        { label: "NB abgelehnt", value: "NB_ABGELEHNT", icon: "❌", color: "#ef4444" },
        { label: "Eingestellt", value: "EINGESTELLT", icon: "⏸", color: "#f97316" },
      ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        background: "rgba(255,255,255,0.04)", color: C.dim, border: `1px solid ${C.border}`,
        borderRadius: 6, padding: "6px 8px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans'",
        display: "flex", alignItems: "center", gap: 2,
      }}>
        ⋮
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)", minWidth: 200,
          background: "rgba(15,15,35,0.98)", border: `1px solid ${C.border}`, borderRadius: 10,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)", zIndex: 50, overflow: "hidden",
        }}>
          {/* Custom Actions */}
          {actions && actions.length > 0 && (
            <>
              <div style={{ padding: "6px 12px", fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Aktionen</div>
              {actions.map((a, i) => (
                <button key={i} onClick={() => { a.onClick(); setOpen(false); }} disabled={a.disabled}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: "none", border: "none", color: a.disabled ? C.muted : a.color, fontSize: 12, cursor: a.disabled ? "default" : "pointer", opacity: a.disabled ? 0.4 : 1, textAlign: "left" }}
                  onMouseEnter={e => { if (!a.disabled) (e.target as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.background = "none"; }}>
                  <span style={{ fontSize: 14 }}>{a.icon}</span> {a.label}
                </button>
              ))}
            </>
          )}
          {/* Status-Schnellwechsel */}
          {onStatusChange && (
            <>
              <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
              <div style={{ padding: "6px 12px", fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Status setzen</div>
              {statusOptions.map(s => (
                <button key={s.value} onClick={() => { onStatusChange(s.value); setOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: "none", border: "none", color: s.color, fontSize: 12, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.background = "none"; }}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span> {s.label}
                </button>
              ))}
            </>
          )}
          <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
          <div style={{ padding: "6px 12px 8px", fontSize: 9, color: C.muted }}>Esc = Schließen · 1-9 = Tabs</div>
        </div>
      )}
    </div>
  );
}

export default function DetailHeader(p: Props) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, background: C.panel, borderBottom: `1px solid ${C.border}`, padding: "10px 20px" }}>
      {/* Row 1 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
        <button onClick={p.onBack} style={{ background: "rgba(255,255,255,0.04)", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans'" }}>← Projekte</button>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.srcColor }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{p.title}</span>
        {b(p.statusColor + "18", p.statusColor, `● ${p.status}`)}
        {b(p.srcColor + "12", p.srcColor, `${p.srcIcon} ${p.srcLabel}`)}
        {p.tickets > 0 && b(C.rBg, C.red, `🎫 ${p.tickets} offen`)}
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.dim }}>{p.id}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
          {p.nextActionError && <span style={{ fontSize: 10, color: C.red, fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nextActionError}</span>}
          {p.onNextAction ? (
            <button onClick={p.onNextAction} disabled={p.nextActionLoading} style={{ background: p.nextActionLoading ? C.muted : p.nextActionColor, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: p.nextActionLoading ? "wait" : "pointer", fontFamily: "'DM Sans'", opacity: p.nextActionLoading ? 0.6 : 1, ...(p.nextActionColor === C.red && !p.nextActionLoading ? { animation: "pulseGlow 2s infinite" } : {}) }}>{p.nextActionLoading ? "..." : p.nextAction}</button>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: p.nextActionColor, padding: "6px 14px", background: p.nextActionColor + "10", borderRadius: 6, border: `1px solid ${p.nextActionColor}20` }}>{p.nextAction}</span>
          )}
          <QuickActionsDropdown
            actions={p.quickActions}
            onStatusChange={p.onQuickStatusChange}
            isInstallation={p.isInstallation}
          />
        </div>
      </div>

      {/* Row 2: Info-Chips (responsive) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.dim, marginBottom: 6, paddingLeft: 36, flexWrap: "wrap" }}>
        <span>{p.subtitle}</span><span style={{ color: C.muted }}>·</span>
        <span>{p.ort}</span><span style={{ color: C.muted }}>·</span>
        <span>{p.nb}</span><span style={{ color: C.muted }}>·</span>
        <span style={{ fontWeight: 600, color: C.green }}>{p.kwp} kWp</span>
        {p.dedicatedEmail && <><span style={{ color: C.muted }}>·</span><span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.accent }}>📧 {p.dedicatedEmail}</span></>}
        {p.angebotWert && <><span style={{ color: C.muted }}>·</span><span style={{ fontWeight: 600, color: C.cyan }}>{p.angebotWert}</span></>}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: p.docsOk === p.docsTotal ? C.green : C.orange }}>📄 {p.docsOk}/{p.docsTotal} Docs</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: p.vollstaendigkeit >= 80 ? C.green : p.vollstaendigkeit >= 50 ? "#eab308" : C.orange, fontFamily: "monospace" }}>{p.vollstaendigkeit}%</span>
        </div>
      </div>

      {/* Row 3: Animated Lifecycle-Bar */}
      <div style={{ paddingLeft: 36, paddingRight: 20 }}>
        <LifecycleBar steps={p.workflow.map(s => ({
          label: s.l, color: s.c, done: s.done, current: s.current, date: s.date,
        }))} />
      </div>
    </div>
  );
}
