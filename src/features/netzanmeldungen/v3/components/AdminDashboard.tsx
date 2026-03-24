/**
 * AdminDashboard — Baunity D2D Sales Dashboard
 * KPIs, Pipeline, Top-Gebiete, Sales-Aktivitäten, Handlungsbedarf
 */
import { useStats, useGroupedByNB, fetchApi, getAuthHeaders } from "../../hooks/useEnterpriseApi";
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

// Map GridNetz stats to D2D
function mapStats(s: any) {
  return {
    leads: (s?.eingang || 0) + (s?.lead || 0),
    termine: (s?.beim_nb || s?.beimNb || 0) + (s?.termin || 0),
    angebote: (s?.rueckfrage || 0) + (s?.angebot || 0),
    verkauft: (s?.genehmigt || 0) + (s?.verkauft || 0),
    installation: (s?.ibn || 0) + (s?.installation || 0),
    fertig: s?.fertig || 0,
    storniert: s?.storniert || 0,
    total: s?.total || 0,
  };
}

export default function AdminDashboard({ onDrillDown, onPipelineFilter, pipelineCounts, isStaff }: Props) {
  const { data: stats } = useStats();
  const { data: nbData } = useGroupedByNB();
  const { data: listData } = useQuery({
    queryKey: ["installations", "list-for-kunden"],
    queryFn: () => fetchApi<any>(`/api/installations/enterprise?limit=500`),
    staleTime: 60_000,
  });

  // Top Reps / Gebiete
  const topGebiete = (() => {
    const items = listData?.data || [];
    const map = new Map<string, { name: string; count: number; open: number }>();
    items.forEach((i: any) => {
      const key = i.kundeName || i.createdByCompany || i.customerName || "Unbekannt";
      if (!map.has(key)) map.set(key, { name: key, count: 0, open: 0 });
      const m = map.get(key)!;
      m.count++;
      if (!["fertig", "storniert", "FERTIG", "STORNIERT"].includes(i.status)) m.open++;
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  })();

  // Activity Feed
  const { data: feedData } = useQuery({
    queryKey: ["dashboard", "activity-feed"],
    queryFn: () => fetchApi<any>("/api/dashboard/activity-feed").then(d => ({ activities: Array.isArray(d) ? d : d?.activities || [] })).catch(() => ({ activities: [] })),
    staleTime: 30_000,
  });

  // Wizard-Leads
  const { data: wizardLeadsData } = useQuery<{ stats: any }>({
    queryKey: ["wizard-leads-stats"],
    queryFn: () => fetchApi<{ stats: any }>("/api/wizard/leads"),
    staleTime: 30_000,
  });
  const wizardLeadCount = wizardLeadsData?.stats?.total || 0;
  const wizardLeadNeu = wizardLeadsData?.stats?.neu || 0;

  const d = mapStats(stats);
  d.leads += wizardLeadNeu; // Wizard-Leads zu den Gesamt-Leads addieren
  const topNb = (nbData?.groups || []).slice(0, 8);
  const feed = (feedData?.activities || []).slice(0, 10);
  const pipeline = d.leads + d.termine + d.angebote + d.verkauft + d.installation;

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
          { v: wizardLeadNeu, l: "Neue Leads", c: "#a855f7", sub: "zu kontaktieren" },
          { v: (wizardLeadsData?.stats?.kontaktiert || 0), l: "Kontaktiert", c: "#06b6d4", sub: "in Bearbeitung" },
          { v: (wizardLeadsData?.stats?.qualifiziert || 0), l: "Qualifiziert", c: "#22c55e", sub: "Angebot möglich" },
          { v: (wizardLeadsData?.stats?.konvertiert || 0), l: "Konvertiert", c: "#22c55e", sub: "Projekt angelegt" },
          { v: wizardLeadCount, l: "Gesamt", c: "#D4A843", sub: `${wizardLeadsData?.stats?.abgelehnt || 0} abgelehnt` },
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

      {/* 3-Spalten: Gebiete | Handlungsbedarf | Live-Feed */}
      <div className="v3-dashboard-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>

        {/* Top Gebiete / Netzbetreiber */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>📍 Top Gebiete</div>
          {topNb.length > 0 ? topNb.map((nb: any, i: number) => (
            <div key={nb.nbName || i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: i < topNb.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 10, color: C.textMuted, width: 16, textAlign: "right" }}>#{i + 1}</span>
              <span style={{ fontSize: 11, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nb.nbName || "Unbekannt"}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#D4A843", width: 30, textAlign: "right" }}>{nb.count}</span>
              <span style={{ fontSize: 9, color: nb.avgDays > 12 ? "#ef4444" : "#64748b", width: 32, textAlign: "right" }}>{nb.avgDays}d</span>
            </div>
          )) : <div style={{ color: C.textMuted, fontSize: 11, padding: 8 }}>Keine Daten</div>}
        </div>

        {/* Handlungsbedarf — D2D */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#D4A843", marginBottom: 12 }}>⚡ Handlungsbedarf</div>
          {[
            { icon: "🌟", text: `${wizardLeadNeu} neue Leads`, action: "Kontaktieren", color: "#a855f7" },
            { icon: "📞", text: `${wizardLeadsData?.stats?.kontaktiert || 0} kontaktiert`, action: "Qualifizieren", color: "#06b6d4" },
            { icon: "✅", text: `${wizardLeadsData?.stats?.qualifiziert || 0} qualifiziert`, action: "Angebot erstellen", color: "#22c55e" },
            { icon: "🎉", text: `${wizardLeadsData?.stats?.konvertiert || 0} konvertiert`, action: "Projekt bearbeiten", color: "#22c55e" },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.textDim }}>{p.text}</div>
                <button onClick={() => onDrillDown("open")} style={{ marginTop: 3, background: p.color + "10", color: p.color, border: `1px solid ${p.color}20`, borderRadius: 4, padding: "2px 8px", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>→ {p.action}</button>
              </div>
            </div>
          ))}
        </div>

        {/* Live-Feed */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.textBright }}>📊 Letzte Aktivitäten</div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D4A843", animation: "urgentPulse 2s infinite" }} />
          </div>
          {feed.length > 0 ? feed.map((e: any, i: number) => {
            const d = e.data || e;
            const name = d.customerName || d.publicId || "";
            const time = e.timestamp ? new Date(e.timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "";
            return (
              <div key={i} style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: i < feed.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width: 3, height: "auto", borderRadius: 2, background: feedColor(e.type), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: C.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.type === "status_change" ? `⚡ ${name} → ${d.toStatus || d.statusLabel || ""}` : `📌 ${name}: ${(d.message || d.text || "").substring(0, 50)}`}
                  </div>
                </div>
                <span style={{ fontSize: 9, color: C.textMuted, flexShrink: 0, fontFamily: "'DM Mono'" }}>{time}</span>
              </div>
            );
          }) : <div style={{ color: C.textMuted, fontSize: 11, padding: 8 }}>Keine Aktivitäten</div>}
        </div>
      </div>

      {/* Top Sales Reps / Kunden */}
      <div style={{ ...cardStyle, maxWidth: 600 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>🏆 Sales Leaderboard</div>
        {topGebiete.length > 0 ? topGebiete.map((k, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < topGebiete.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 10, color: C.textMuted, width: 16, textAlign: "right" }}>#{i + 1}</span>
            <span style={{ fontSize: 11, color: C.text, flex: 1, fontWeight: 600 }}>{k.name}</span>
            <span style={{ fontSize: 10, color: "#D4A843" }}>{k.count} total</span>
            <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>{k.open} aktiv</span>
          </div>
        )) : <div style={{ color: C.textMuted, fontSize: 11, padding: 8 }}>Noch keine Daten</div>}
      </div>
    </div>
  );
}
