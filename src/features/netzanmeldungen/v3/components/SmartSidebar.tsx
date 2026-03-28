/**
 * SmartSidebar — Views + Source + KundenPicker + Sidebar-Toggle
 */
import { useState } from "react";
import { VIEWS } from "../constants";
import type { ViewKey, SourceFilter, PipelineCounts } from "../types";

const C = { accent: "#a5b4fc", dim: "#64748b", border: "rgba(212,168,67,0.08)", text: "#e2e8f0" };

interface Props {
  view: ViewKey;
  onViewChange: (v: ViewKey) => void;
  sourceFilter: SourceFilter;
  onSourceChange: (s: SourceFilter) => void;
  counts: PipelineCounts;
  isStaff: boolean;
  kundenList: { id: number; name: string; count: number }[];
  selectedKunde: number | null;
  onKundeChange: (id: number | null) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function SmartSidebar({ view, onViewChange, sourceFilter, onSourceChange, counts, isStaff, kundenList, selectedKunde, onKundeChange, collapsed, onToggle }: Props) {
  const [kundeSearch, setKundeSearch] = useState("");

  const leadsTotal = counts.leads_total || 0;
  const leadsNeu = counts.leads_neu || 0;

  const leadsKontaktiert = (counts as any).leads_kontaktiert || 0;
  const leadsQualifiziert = (counts as any).leads_qualifiziert || 0;
  const leadsDisqualifiziert = (counts as any).leads_disqualifiziert || 0;

  const viewCount = (key: ViewKey): number => {
    if (key === "inbox") return leadsNeu;
    if (key === "open") return leadsKontaktiert + leadsQualifiziert;
    if (key === "all") return leadsTotal;
    if (key === "leads") return leadsTotal;
    if (key === "done") return leadsDisqualifiziert;
    return 0;
  };

  // Collapsed: nur schmaler Streifen mit Toggle
  if (collapsed) {
    return (
      <div style={{ width: 36, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8 }}>
        <button onClick={onToggle} style={{
          background: "rgba(212,168,67,0.08)", border: `1px solid ${C.border}`, borderRadius: 6,
          padding: "6px 8px", cursor: "pointer", color: C.dim, fontSize: 14, lineHeight: 1,
        }}>▶</button>
      </div>
    );
  }

  // D2D Pipeline Views
  const d2dViews = [
    { key: "all" as ViewKey, icon: "📊", label: "Alle Leads", color: "#D4A843" },
    { key: "inbox" as ViewKey, icon: "🌟", label: "Neue Leads", color: "#a855f7" },
    { key: "open" as ViewKey, icon: "📞", label: "In Bearbeitung", color: "#06b6d4" },
    { key: "done" as ViewKey, icon: "✅", label: "Abgeschlossen", color: "#22c55e" },
  ];

  return (
    <div style={{ width: 240, flexShrink: 0, overflowY: "auto", paddingRight: 8 }}>
      {/* Toggle */}
      {onToggle && (
        <button onClick={onToggle} style={{
          background: "none", border: "none", cursor: "pointer", color: C.dim, fontSize: 12,
          padding: "6px 10px", marginBottom: 6, display: "flex", alignItems: "center", gap: 6,
        }}>◀ <span style={{ fontSize: 11, letterSpacing: 0.3 }}>Sidebar ausblenden</span></button>
      )}

      {/* Neuer Lead Button — pulsing */}
      <style>{`
        @keyframes sidebarPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.4)}70%{box-shadow:0 0 0 8px rgba(34,197,94,0)}}
        .new-lead-btn{animation:sidebarPulse 2s ease-in-out infinite}
        .new-lead-btn:hover{animation:none;transform:scale(1.02);box-shadow:0 0 20px rgba(34,197,94,.25)}
      `}</style>
      <a href="/wizard" target="_blank" rel="noopener" className="new-lead-btn" style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        width: "100%", padding: "10px 14px", borderRadius: 8, marginBottom: 12,
        background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
        color: "#22c55e", fontSize: 13, fontWeight: 700, textDecoration: "none",
        cursor: "pointer", transition: "transform .15s, box-shadow .15s", fontFamily: "inherit",
      }}>
        <span style={{ fontSize: 16 }}>+</span> Neuer Lead
      </a>

      {/* D2D Views */}
      <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>Pipeline</div>
      {d2dViews.map(v => {
        const count = viewCount(v.key);
        const active = view === v.key;
        return (
          <button key={v.key} className="v3-view-btn" onClick={() => onViewChange(v.key)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: active ? 700 : 500,
            background: active ? "rgba(212,168,67,0.15)" : "transparent", color: active ? C.accent : C.text,
            transition: "all .15s",
          }}>
            <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{v.icon}</span>
            <span style={{ flex: 1, textAlign: "left" }}>{v.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: v.color || C.dim, background: (v.color || C.dim) + "15", padding: "2px 8px", borderRadius: 12, minWidth: 24, textAlign: "center" }}>{count}</span>
          </button>
        );
      })}

      {/* Kunden */}
      {isStaff && kundenList.length > 0 && <>
        <div style={{ height: 1, background: C.border, margin: "10px 0" }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>HV / Agentur</div>
        {selectedKunde && (
          <button onClick={() => onKundeChange(null)} style={{
            width: "100%", padding: "7px 12px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer",
            background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 12, fontWeight: 600, marginBottom: 6,
          }}>✕ Filter aufheben</button>
        )}
        <input value={kundeSearch} onChange={e => setKundeSearch(e.target.value)} placeholder="HV suchen..."
          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(15,15,25,0.9)", color: C.text, fontSize: 13, outline: "none", marginBottom: 6, fontFamily: "inherit", boxSizing: "border-box" }} />
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {kundenList
            .filter(k => !kundeSearch || k.name.toLowerCase().includes(kundeSearch.toLowerCase()))
            .slice(0, 15)
            .map(k => (
              <button key={k.id} onClick={() => onKundeChange(k.id === selectedKunde ? null : k.id)} style={{
                display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                padding: "7px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                background: selectedKunde === k.id ? "rgba(212,168,67,0.12)" : "transparent",
                color: selectedKunde === k.id ? C.accent : "#94a3b8", fontSize: 13, fontWeight: selectedKunde === k.id ? 600 : 400,
                marginBottom: 2, textAlign: "left", transition: "all .1s",
              }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{k.name}</span>
                <span style={{ fontSize: 11, color: C.dim, flexShrink: 0, marginLeft: 6 }}>{k.count}</span>
              </button>
            ))}
        </div>
      </>}
    </div>
  );
}
