/**
 * AdminDashboard — Baunity D2D Sales Dashboard
 * KPIs, Pipeline, Top-Gebiete, Sales-Aktivitäten, Handlungsbedarf
 */
import { fetchApi } from "../../hooks/useEnterpriseApi";
import { useQuery } from "@tanstack/react-query";
import { C, cardStyle } from "../../../crm-center/crm.styles";
import { CountUp } from "../hooks/useCountUp";
import AnimatedPipeline from "./AnimatedPipeline";
import type { ViewKey, PipelineCounts } from "../types";

interface Props {
  onDrillDown: (view: ViewKey) => void;
  onPipelineFilter?: (status: string) => void;
  pipelineCounts: PipelineCounts;
  isStaff: boolean;
}

export default function AdminDashboard({ onDrillDown, onPipelineFilter, pipelineCounts, isStaff }: Props) {
  // Wizard-Leads — einzige Datenquelle für D2D
  const { data: wizardLeadsData } = useQuery<{ data: any[]; stats: any }>({
    queryKey: ["wizard-leads-dashboard"],
    queryFn: () => fetchApi<{ data: any[]; stats: any }>("/api/wizard/leads"),
    staleTime: 30_000,
  });
  const leads = wizardLeadsData?.data || [];
  const wizardStats = wizardLeadsData?.stats || {};
  const wizardLeadCount = wizardStats.total || 0;
  const wizardLeadNeu = wizardStats.neu || 0;

  // Top PLZ-Gebiete aus Leads
  const topGebiete = (() => {
    const map = new Map<string, { plz: string; count: number; qualifiziert: number }>();
    leads.forEach((l: any) => {
      const plz = l.plz || "–";
      if (!map.has(plz)) map.set(plz, { plz, count: 0, qualifiziert: 0 });
      const m = map.get(plz)!;
      m.count++;
      if (l.status === "qualifiziert") m.qualifiziert++;
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  })();

  // Top HVs aus Leads (wenn zugewiesen)
  const topHvs = (() => {
    const map = new Map<number, { id: number; name: string; count: number; qualifiziert: number }>();
    leads.forEach((l: any) => {
      if (!l.assignedToId) return;
      if (!map.has(l.assignedToId)) map.set(l.assignedToId, { id: l.assignedToId, name: l.assignedToName || `HV #${l.assignedToId}`, count: 0, qualifiziert: 0 });
      const m = map.get(l.assignedToId)!;
      m.count++;
      if (l.status === "qualifiziert") m.qualifiziert++;
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  })();

  const feedColor = (type: string) => {
    if (type === "status_change") return "#D4A843";
    if (type === "comment") return "#EAD068";
    if (type === "email") return "#38bdf8";
    if (type === "document") return "#06b6d4";
    return "#64748b";
  };

  return (
    <div className="v3-dashboard-wrap" style={{ padding: "20px 28px" }}>
      <style>{`
        @media(max-width:768px){
          .v3-dashboard-wrap{padding:12px 10px!important}
          .v3-kpi-grid{grid-template-columns:repeat(2,1fr)!important;gap:6px!important}
          .v3-kpi-grid>div{padding:10px!important}
          .v3-kpi-grid>div>div:first-child{font-size:22px!important}
          .v3-dashboard-cols{grid-template-columns:1fr!important}
        }
        @media(max-width:1024px){
          .v3-kpi-grid{grid-template-columns:repeat(3,1fr)!important}
          .v3-dashboard-cols{grid-template-columns:1fr 1fr!important}
        }
      `}</style>
      {/* KPI Row — D2D Lead Pipeline */}
      <div className="v3-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { v: wizardLeadNeu, l: "Zu Kontaktieren", c: "#D4A843", sub: "neue Leads" },
          { v: (wizardStats.kontaktiert || 0), l: "Kontaktiert", c: "#3b82f6", sub: "in Bearbeitung" },
          { v: (wizardStats.qualifiziert || 0), l: "Qualifiziert", c: "#22c55e", sub: "Angebot möglich" },
          { v: (wizardStats.disqualifiziert || 0) + (wizardStats.abgelehnt || 0), l: "Disqualifiziert", c: "#ef4444", sub: "" },
          { v: wizardLeadCount, l: "Gesamt", c: "#64748b", sub: "" },
        ].map(k => (
          <div key={k.l} style={{ ...cardStyle, padding: "16px", cursor: "default", textAlign: "center", border: `1px solid ${k.c}15`, background: k.c + "04" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: k.c, letterSpacing: -1, textShadow: `0 0 20px ${k.c}25` }}><CountUp to={k.v} duration={1600} locale /></div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textBright, marginTop: 2 }}>{k.l}</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div style={{ marginBottom: 16 }}>
        <AnimatedPipeline counts={pipelineCounts} activeFilter={null} onFilter={(k) => onPipelineFilter ? onPipelineFilter(k) : onDrillDown("open")} isStaff={isStaff} />
      </div>

      {/* 2-Spalten: Gebiete | Handlungsbedarf */}
      <div className="v3-dashboard-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>

        {/* Top PLZ-Gebiete */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>📍 Top Gebiete (PLZ)</div>
          {topGebiete.length > 0 ? topGebiete.map((g, i) => (
            <div key={g.plz} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < topGebiete.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 10, color: C.textMuted, width: 16, textAlign: "right" }}>#{i + 1}</span>
              <span style={{ fontSize: 12, color: C.text, flex: 1, fontWeight: 600 }}>{g.plz}</span>
              <span style={{ fontSize: 10, color: "#D4A843", fontWeight: 700 }}>{g.count} Leads</span>
              {g.qualifiziert > 0 && <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>{g.qualifiziert} qual.</span>}
            </div>
          )) : <div style={{ color: C.textMuted, fontSize: 11, padding: 8 }}>Keine Daten</div>}
        </div>

        {/* Handlungsbedarf — D2D */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#D4A843", marginBottom: 12 }}>Handlungsbedarf</div>
          {[
            { text: `${wizardLeadNeu} neue Leads zu kontaktieren`, action: "Kontaktieren", color: "#D4A843", filter: "lead_neu" },
            { text: `${wizardStats.kontaktiert || 0} kontaktiert — qualifizieren`, action: "Qualifizieren", color: "#3b82f6", filter: "lead_kontaktiert" },
            { text: `${wizardStats.qualifiziert || 0} qualifiziert — Angebot erstellen`, action: "Angebote", color: "#22c55e", filter: "lead_qualifiziert" },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 4, height: 28, borderRadius: 2, background: p.color, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 12, color: C.text }}>{p.text}</div>
              <button onClick={() => onPipelineFilter ? onPipelineFilter(p.filter) : onDrillDown("open")} style={{ background: p.color + "12", color: p.color, border: `1px solid ${p.color}25`, borderRadius: 6, padding: "4px 12px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>{p.action}</button>
            </div>
          ))}
        </div>
      </div>

      {/* HV Leaderboard (nur wenn HVs zugewiesen) */}
      {topHvs.length > 0 && (
        <div style={{ ...cardStyle, maxWidth: 600 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>HV Leaderboard</div>
          {topHvs.map((hv, i) => (
            <div key={hv.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < topHvs.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 10, color: C.textMuted, width: 16, textAlign: "right" }}>#{i + 1}</span>
              <span style={{ fontSize: 12, color: C.text, flex: 1, fontWeight: 600 }}>{hv.name}</span>
              <span style={{ fontSize: 10, color: "#D4A843", fontWeight: 700 }}>{hv.count} Leads</span>
              {hv.qualifiziert > 0 && <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>{hv.qualifiziert} qual.</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
