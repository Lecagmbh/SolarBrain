/**
 * Baunity Command Center — Live Dashboard
 * =========================================
 * Same design as mock, but all data from API.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "../../config/storage";

// ═══════════════════════════════════════════════════════════════════════════════
// API HELPER
// ═══════════════════════════════════════════════════════════════════════════════

const API = import.meta.env.VITE_API_BASE || "/api";

async function apiFetch(path: string) {
  const token = getAuthToken();
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface DashboardData {
  pipeline: { key: string; label: string; count: number; color: string; glow: string }[];
  kpis: { value: number | string; label: string; sub: string; color: string }[];
  actions: { id: number; type: string; title: string; sub: string; detail: string; color: string; urgent: boolean; link: string }[];
  projects: { id: string; name: string; nb: string; status: string; days: number; kwp: number; action: string }[];
  activity: { time: string; text: string; type: string }[];
  topNb: { name: string; open: number; avg: number; rate: number }[];
  termine: { date: string; time: string; type: string; title: string; loc: string }[];
  userName: string;
  totalProjects: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700;800;900&display=swap');

.dc{min-height:100vh;background:#060a14;color:#e2e8f0;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;position:relative;overflow-x:hidden}
.dc::before{content:'';position:fixed;top:-30%;left:10%;width:60%;height:60%;background:radial-gradient(ellipse,rgba(212,168,67,0.03),transparent 70%);pointer-events:none}
.dc::after{content:'';position:fixed;bottom:-20%;right:5%;width:50%;height:50%;background:radial-gradient(ellipse,rgba(34,197,94,0.02),transparent 70%);pointer-events:none}

.dc-wrap{max-width:1440px;margin:0 auto;padding:24px 28px 60px;position:relative;z-index:1}

@keyframes dcFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes dcPulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes dcGlow{0%,100%{box-shadow:0 0 0 0 var(--gc,rgba(212,168,67,0.2))}50%{box-shadow:0 0 16px 0 var(--gc,rgba(212,168,67,0.1))}}
@keyframes dcSlide{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes dcSpin{to{transform:rotate(360deg)}}

.dc-fade{animation:dcFade .5s ease both}

.dc-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;animation:dcFade .4s ease both}
.dc-greeting{font-size:26px;font-weight:900;color:#f8fafc;letter-spacing:-.03em;line-height:1.1}
.dc-greeting span{color:#D4A843}
.dc-date{font-size:12px;color:#475569;font-family:'DM Mono',monospace;margin-top:6px;letter-spacing:.02em}
.dc-header-right{display:flex;align-items:center;gap:12px}
.dc-live{display:flex;align-items:center;gap:6px;font-size:11px;color:#475569;font-family:'DM Mono',monospace}
.dc-live-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;animation:dcPulse 2s infinite}
.dc-new-btn{padding:10px 22px;border-radius:10px;border:none;background:linear-gradient(135deg,#D4A843,#EAD068);color:#060a14;font-size:13px;font-weight:700;font-family:'Inter',sans-serif;cursor:pointer;transition:all .2s;box-shadow:0 0 20px rgba(212,168,67,0.2);letter-spacing:-.01em}
.dc-new-btn:hover{transform:translateY(-1px);box-shadow:0 0 30px rgba(212,168,67,0.35)}

.dc-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:20px;animation:dcFade .4s ease .05s both}
.dc-kpi{background:rgba(15,23,42,0.5);border:1px solid rgba(212,168,67,0.06);border-radius:12px;padding:16px 18px;text-align:center;transition:all .2s;cursor:default;position:relative;overflow:hidden}
.dc-kpi:hover{border-color:rgba(212,168,67,0.15);transform:translateY(-1px)}
.dc-kpi::after{content:'';position:absolute;bottom:0;left:20%;right:20%;height:2px;border-radius:1px;background:var(--kc,#D4A843);opacity:.3}
.dc-kpi-val{font-size:28px;font-weight:900;font-family:'DM Mono',monospace;color:var(--kc,#e2e8f0);line-height:1;letter-spacing:-.03em}
.dc-kpi-label{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.1em;margin-top:6px}
.dc-kpi-sub{font-size:10px;color:#475569;margin-top:2px;font-family:'DM Mono',monospace}

.dc-grid{display:grid;grid-template-columns:1fr 340px;gap:16px}

.dc-card{background:rgba(15,23,42,0.5);border:1px solid rgba(212,168,67,0.06);border-radius:14px;padding:20px;backdrop-filter:blur(8px)}
.dc-card:hover{border-color:rgba(212,168,67,0.1)}
.dc-card-title{font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.12em;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between}
.dc-card-title .count{font-size:10px;font-weight:700;color:#D4A843;background:rgba(212,168,67,0.1);padding:2px 10px;border-radius:12px;letter-spacing:0}

.dc-actions{margin-bottom:16px}
.dc-action{display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:10px;margin-bottom:6px;cursor:pointer;transition:all .15s;border:1px solid transparent;background:rgba(15,23,42,0.4)}
.dc-action:hover{background:rgba(15,23,42,0.7);border-color:rgba(212,168,67,0.1);transform:translateX(2px)}
.dc-action-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dc-action-dot.pulse{animation:dcGlow 2s infinite}
.dc-action-body{flex:1;min-width:0}
.dc-action-title{font-size:13px;font-weight:700;color:#f1f5f9}
.dc-action-sub{font-size:11px;color:#64748b;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-action-cta{font-size:10px;font-weight:700;padding:5px 14px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;transition:all .15s;flex-shrink:0}

.dc-pipeline{display:flex;align-items:center;gap:0;padding:4px 0}
.dc-pipe-stage{flex:1;text-align:center;padding:18px 8px 14px;border-radius:12px;cursor:pointer;transition:all .25s;position:relative;border:1px solid transparent;overflow:hidden}
.dc-pipe-stage::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 120%,var(--pc,rgba(212,168,67,0.08)),transparent 70%);transition:opacity .25s;opacity:.5}
.dc-pipe-stage:hover{transform:translateY(-2px);border-color:var(--pb,rgba(212,168,67,0.15))}
.dc-pipe-stage:hover::before{opacity:1}
.dc-pipe-count{font-size:32px;font-weight:900;font-family:'DM Mono',monospace;color:var(--pc,#e2e8f0);line-height:1;position:relative;text-shadow:0 0 30px var(--pg,transparent)}
.dc-pipe-label{font-size:8px;font-weight:800;letter-spacing:.15em;color:var(--pc,#64748b);margin-top:8px;opacity:.7}
.dc-pipe-bar{position:absolute;bottom:0;left:15%;right:15%;height:3px;border-radius:2px;background:var(--pc,#D4A843);opacity:.4}
.dc-pipe-arrow{display:flex;align-items:center;justify-content:center;width:20px;flex-shrink:0;color:#1e293b;font-size:14px}

.dc-projects{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.dc-proj{padding:14px 16px;border-radius:10px;background:rgba(6,10,20,0.5);border:1px solid rgba(212,168,67,0.04);cursor:pointer;transition:all .15s;position:relative}
.dc-proj:hover{border-color:rgba(212,168,67,0.12);background:rgba(15,23,42,0.5);transform:translateY(-1px)}
.dc-proj-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.dc-proj-name{font-size:13px;font-weight:700;color:#f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-proj-status{font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;letter-spacing:.02em;text-transform:uppercase}
.dc-proj-meta{display:flex;align-items:center;gap:8px;font-size:11px;color:#64748b}
.dc-proj-meta span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-proj-action{font-size:10px;color:#D4A843;font-weight:600;margin-top:6px;display:flex;align-items:center;gap:4px}
.dc-proj-id{font-size:9px;font-family:'DM Mono',monospace;color:#334155;position:absolute;top:6px;right:10px}

.dc-feed-item{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid rgba(212,168,67,0.04);animation:dcSlide .3s ease both}
.dc-feed-item:last-child{border-bottom:none}
.dc-feed-dot{width:6px;height:6px;border-radius:50%;margin-top:6px;flex-shrink:0}
.dc-feed-text{font-size:12px;color:#94a3b8;line-height:1.4;flex:1}
.dc-feed-time{font-size:10px;color:#334155;font-family:'DM Mono',monospace;flex-shrink:0;min-width:60px;text-align:right}

.dc-nb-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(212,168,67,0.04);font-size:12px}
.dc-nb-row:last-child{border-bottom:none}
.dc-nb-name{flex:1;color:#94a3b8;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-nb-stat{font-family:'DM Mono',monospace;font-size:11px;min-width:44px;text-align:right}
.dc-nb-bar{width:50px;height:4px;border-radius:2px;background:rgba(212,168,67,0.08);overflow:hidden}
.dc-nb-bar-fill{height:100%;border-radius:2px}

.dc-termin{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;background:rgba(6,10,20,0.4);border:1px solid rgba(212,168,67,0.04);margin-bottom:6px;transition:all .15s}
.dc-termin:hover{border-color:rgba(212,168,67,0.1)}
.dc-termin-date{font-family:'DM Mono',monospace;font-size:11px;color:#D4A843;font-weight:500;min-width:80px}
.dc-termin-body{flex:1}
.dc-termin-title{font-size:12px;font-weight:600;color:#e2e8f0}
.dc-termin-loc{font-size:10px;color:#475569;margin-top:1px}
.dc-termin-type{font-size:9px;font-weight:700;padding:2px 8px;border-radius:8px;text-transform:uppercase;letter-spacing:.04em}

.dc-empty{text-align:center;padding:24px;color:#475569;font-size:13px}

@media(max-width:1200px){.dc-grid{grid-template-columns:1fr}.dc-kpis{grid-template-columns:repeat(3,1fr)}}
@media(max-width:768px){
  .dc-kpis{grid-template-columns:repeat(2,1fr);gap:6px}
  .dc-kpi{padding:12px 10px}.dc-kpi-val{font-size:22px}
  .dc-projects{grid-template-columns:1fr}
  .dc-wrap{padding:12px 10px 40px}
  .dc-greeting{font-size:18px}
  .dc-pipeline{flex-wrap:wrap;gap:4px}
  .dc-pipe-arrow{display:none}
  .dc-pipe-stage{min-width:calc(33% - 4px);padding:14px 6px 10px}
  .dc-pipe-count{font-size:22px}.dc-pipe-label{font-size:7px}
  .dc-card{padding:14px;border-radius:12px}
  .dc-header{flex-direction:column;align-items:flex-start;gap:10px}
  .dc-header-right{width:100%;justify-content:space-between}
  .dc-new-btn{min-height:44px;font-size:13px}
  .dc-action{padding:10px 12px}.dc-proj{padding:12px}
  .dc-termin{padding:8px 10px}
}
@media(max-width:400px){.dc-kpi-val{font-size:18px}.dc-greeting{font-size:16px}.dc-new-btn{width:100%}}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  neu: { label: "Neuer Lead", color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  kontaktiert: { label: "Kontaktiert", color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
  qualifiziert: { label: "Qualifiziert", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  konvertiert: { label: "Konvertiert", color: "#D4A843", bg: "rgba(212,168,67,0.1)" },
  abgelehnt: { label: "Abgelehnt", color: "#64748b", bg: "rgba(100,116,139,0.1)" },
};

const FEED_COLORS: Record<string, string> = {
  visit: "#D4A843", lead: "#22c55e", termin: "#3b82f6", angebot: "#8b5cf6", sale: "#22c55e", created: "#D4A843", status: "#f59e0b", draft: "#22c55e", email_in: "#3b82f6", upload: "#EAD068",
};

const PIPELINE_DEFS = [
  { key: "lead", label: "ZU KONTAKTIEREN", color: "#D4A843", glow: "rgba(212,168,67,0.15)" },
  { key: "kontaktiert", label: "KONTAKTIERT", color: "#3b82f6", glow: "rgba(59,130,246,0.15)" },
  { key: "qualifiziert", label: "QUALIFIZIERT", color: "#22c55e", glow: "rgba(34,197,94,0.15)" },
  { key: "disqualifiziert", label: "DISQUALIFIZIERT", color: "#ef4444", glow: "rgba(239,68,68,0.1)" },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

function useCountUp(target: number, duration = 1200): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const tick = () => {
      const elapsed = Date.now() - t0;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return val;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function KPI({ value, label, sub, color, delay }: { value: number | string; label: string; sub?: string; color: string; delay: number }) {
  const num = typeof value === "number" ? useCountUp(value) : value;
  return (
    <div className="dc-kpi dc-fade" style={{ "--kc": color, animationDelay: `${delay}s` } as any}>
      <div className="dc-kpi-val">{num}</div>
      <div className="dc-kpi-label">{label}</div>
      {sub && <div className="dc-kpi-sub">{sub}</div>}
    </div>
  );
}

function PipelineStage({ stage, delay, onClick }: { stage: { key: string; label: string; count: number; color: string; glow: string }; delay: number; onClick?: () => void }) {
  const count = useCountUp(stage.count, 1400);
  return (
    <div className="dc-pipe-stage dc-fade" onClick={onClick}
      style={{ "--pc": stage.color, "--pb": stage.color + "30", "--pg": stage.glow, animationDelay: `${delay}s` } as any}>
      <div className="dc-pipe-count">{count}</div>
      <div className="dc-pipe-label">{stage.label}</div>
      <div className="dc-pipe-bar" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

export default function DashboardMock() {
  const nav = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Daten aus beiden Quellen: Wizard-Leads (JSON) + DB-Installationen
      const [leadsRes, installRes] = await Promise.allSettled([
        apiFetch("/wizard/leads"),
        apiFetch("/installations/counts"),
      ]);

      const wizardStats = (leadsRes.status === "fulfilled" ? leadsRes.value?.stats : {}) || {};
      const dbCounts = (installRes.status === "fulfilled" ? installRes.value : {}) || {};
      const leads = (leadsRes.status === "fulfilled" ? leadsRes.value?.data : []) || [];

      // DB-Installationen haben Vorrang, Wizard-Leads als Fallback
      const neu = (dbCounts.LEAD || 0) + (dbCounts.EINGANG || 0) + (wizardStats.neu || 0);
      const kontaktiert = (dbCounts.KONTAKTIERT || 0) + (dbCounts.BEIM_NB || 0) + (wizardStats.kontaktiert || 0);
      const qualifiziert = (dbCounts.QUALIFIZIERT || 0) + (dbCounts.GENEHMIGT || 0) + (wizardStats.qualifiziert || 0);
      const disqualifiziert = (dbCounts.DISQUALIFIZIERT || 0) + (wizardStats.abgelehnt || 0);
      const total = neu + kontaktiert + qualifiziert + disqualifiziert;
      const aktiv = neu + kontaktiert + qualifiziert;
      const abgelehnt = disqualifiziert;

      const pipeline = [
        { key: "lead", label: "ZU KONTAKTIEREN", count: neu, color: "#D4A843", glow: "rgba(212,168,67,0.15)" },
        { key: "kontaktiert", label: "KONTAKTIERT", count: kontaktiert, color: "#3b82f6", glow: "rgba(59,130,246,0.15)" },
        { key: "qualifiziert", label: "QUALIFIZIERT", count: qualifiziert, color: "#22c55e", glow: "rgba(34,197,94,0.15)" },
        { key: "disqualifiziert", label: "DISQUALIFIZIERT", count: abgelehnt, color: "#ef4444", glow: "rgba(239,68,68,0.15)" },
      ];

      const kpis = [
        { value: neu, label: "Zu Kontaktieren", sub: "neue Leads", color: "#D4A843" },
        { value: kontaktiert, label: "Kontaktiert", sub: "in Bearbeitung", color: "#3b82f6" },
        { value: qualifiziert, label: "Qualifiziert", sub: "Angebot möglich", color: "#22c55e" },
        { value: abgelehnt, label: "Disqualifiziert", sub: "", color: "#ef4444" },
        { value: total, label: "Gesamt", sub: `${aktiv} aktiv`, color: "#64748b" },
      ];

      // Recent leads as projects
      const STATUS_LABELS: Record<string, string> = { neu: "Zu Kontaktieren", kontaktiert: "Kontaktiert", qualifiziert: "Qualifiziert", disqualifiziert: "Disqualifiziert", abgelehnt: "Disqualifiziert" };
      const projects = leads.slice(0, 8).map((l: any) => ({
        id: l.id,
        name: l.name || "–",
        nb: l.plz || "–",
        status: l.status || "neu",
        days: Math.floor((Date.now() - new Date(l.timestamp).getTime()) / 86400000),
        kwp: 0,
        action: STATUS_LABELS[l.status] || l.status,
      }));

      // Activity from leads (newest first)
      const activity = leads.slice(0, 7).map((l: any) => {
        const ago = Math.floor((Date.now() - new Date(l.timestamp).getTime()) / 60000);
        const timeStr = ago < 60 ? `vor ${ago}m` : ago < 1440 ? `vor ${Math.floor(ago / 60)}h` : `vor ${Math.floor(ago / 1440)}d`;
        return { time: timeStr, text: `${l.name} — neuer Lead (${l.plz})`, type: "lead" };
      });

      // User name from localStorage
      const user = localStorage.getItem("baunity_user") || localStorage.getItem("gridnetz_user");
      const userName = user ? (JSON.parse(user).name || "").split(" ")[0] : "User";

      setData({ pipeline, kpis, actions: [], projects, activity, topNb: [], termine: [], userName, totalProjects: total });
    } catch (err) {
      console.error("[Dashboard] Failed to load:", err);
      setData({
        pipeline: [
          { key: "lead", label: "ZU KONTAKTIEREN", count: 0, color: "#D4A843", glow: "rgba(212,168,67,0.15)" },
          { key: "kontaktiert", label: "KONTAKTIERT", count: 0, color: "#3b82f6", glow: "rgba(59,130,246,0.15)" },
          { key: "qualifiziert", label: "QUALIFIZIERT", count: 0, color: "#22c55e", glow: "rgba(34,197,94,0.15)" },
          { key: "disqualifiziert", label: "DISQUALIFIZIERT", count: 0, color: "#ef4444", glow: "rgba(239,68,68,0.15)" },
        ],
        kpis: [
          { value: 0, label: "Zu Kontaktieren", sub: "–", color: "#D4A843" },
          { value: 0, label: "Kontaktiert", sub: "–", color: "#3b82f6" },
          { value: 0, label: "Qualifiziert", sub: "–", color: "#22c55e" },
          { value: 0, label: "Disqualifiziert", sub: "–", color: "#ef4444" },
          { value: 0, label: "Gesamt", sub: "–", color: "#64748b" },
          { value: 0, label: "Pipeline", sub: "–", color: "#D4A843" },
        ],
        actions: [], projects: [], activity: [], topNb: [], termine: [],
        userName: "User", totalProjects: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const now = new Date();
  const dateStr = now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="dc">
        <style>{CSS}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(212,168,67,0.3)", borderTopColor: "#D4A843", borderRadius: "50%", animation: "dcSpin .6s linear infinite" }} />
        </div>
      </div>
    );
  }

  const d = data!;

  return (
    <div className="dc">
      <style>{CSS}</style>
      <div className="dc-wrap">

        {/* HEADER */}
        <div className="dc-header">
          <div>
            <div className="dc-greeting">{getGreeting()}, <span>{d.userName}</span></div>
            <div className="dc-date">{dateStr} // {timeStr}</div>
          </div>
          <div className="dc-header-right">
            <div className="dc-live"><div className="dc-live-dot" /> LIVE</div>
            <button onClick={() => window.open("/wizard", "_blank")} className="dc-new-btn">+ Neuer Lead</button>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="dc-kpis">
          {d.kpis.map((kpi, i) => (
            <KPI key={i} value={kpi.value} label={kpi.label} sub={kpi.sub} color={kpi.color} delay={0.05 + i * 0.05} />
          ))}
        </div>

        {/* PIPELINE */}
        <div className="dc-card dc-fade" style={{ marginBottom: 16, padding: "16px 20px", animationDelay: ".12s" }}>
          <div className="dc-card-title">Pipeline<span className="count">{d.totalProjects} Projekte</span></div>
          <div className="dc-pipeline">
            {d.pipeline.map((s, i) => (
              <span key={s.key} style={{ display: "contents" }}>
                {i > 0 && <div className="dc-pipe-arrow">&rsaquo;</div>}
                <PipelineStage stage={s} delay={0.15 + i * 0.05} onClick={() => window.open("/wizard", "_blank")} />
              </span>
            ))}
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="dc-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ACTION CENTER */}
            {d.actions.length > 0 && (
              <div className="dc-card dc-actions dc-fade" style={{ animationDelay: ".2s", borderColor: "rgba(239,68,68,0.08)" }}>
                <div className="dc-card-title">
                  Handlungsbedarf
                  <span className="count" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{d.actions.filter(a => a.urgent).length} dringend</span>
                </div>
                {d.actions.map((a, i) => (
                  <div key={a.id} className="dc-action dc-fade" onClick={() => nav(a.link)} style={{ animationDelay: `${0.25 + i * 0.04}s` }}>
                    <div className={`dc-action-dot ${a.urgent ? "pulse" : ""}`} style={{ background: a.color, "--gc": a.color + "40" } as any} />
                    <div className="dc-action-body">
                      <div className="dc-action-title">{a.title}</div>
                      <div className="dc-action-sub">{a.sub} &middot; {a.detail}</div>
                    </div>
                    <button className="dc-action-cta" style={{
                      background: a.type === "draft" ? "rgba(34,197,94,0.1)" : a.type === "overdue" ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)",
                      color: a.color,
                    }}>
                      {a.type === "draft" ? "Freigeben" : a.type === "overdue" ? "Nachfassen" : "Anzeigen"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* PROJECTS */}
            <div className="dc-card dc-fade" style={{ animationDelay: ".3s" }}>
              <div className="dc-card-title">
                Neue Leads
                <span className="count" style={{ cursor: "pointer" }} onClick={() => nav("/netzanmeldungen")}>Alle anzeigen &rarr;</span>
              </div>
              {d.projects.length > 0 ? (
                <div className="dc-projects">
                  {d.projects.map((p, i) => {
                    const st = STATUS_MAP[p.status] || STATUS_MAP.neu;
                    const isNeu = p.status === "neu";
                    return (
                      <div key={p.id} className="dc-proj dc-fade" onClick={() => nav("/netzanmeldungen")}
                        style={{ animationDelay: `${0.35 + i * 0.03}s`, borderLeft: isNeu ? "3px solid #22c55e" : undefined }}>
                        <div className="dc-proj-head">
                          <div className="dc-proj-name">{p.name}</div>
                          <span className="dc-proj-status" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                        </div>
                        <div className="dc-proj-meta">
                          <span>PLZ {p.nb}</span>
                          <span style={{ color: "#334155" }}>&middot;</span>
                          <span style={{ fontFamily: "'DM Mono',monospace", color: "#64748b", fontWeight: 600 }}>vor {p.days}d</span>
                        </div>
                        {isNeu && <div className="dc-proj-action" style={{ color: "#22c55e" }}>&rarr; Jetzt kontaktieren</div>}
                        {!isNeu && <div className="dc-proj-action">&rarr; {p.action}</div>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="dc-empty">Noch keine Leads vorhanden</div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ACTIVITY FEED */}
            <div className="dc-card dc-fade" style={{ animationDelay: ".22s" }}>
              <div className="dc-card-title">Aktivitäten<span className="count">Echtzeit</span></div>
              {d.activity.length > 0 ? d.activity.map((a, i) => (
                <div key={i} className="dc-feed-item" style={{ animationDelay: `${0.3 + i * 0.04}s` }}>
                  <div className="dc-feed-dot" style={{ background: FEED_COLORS[a.type] || "#475569" }} />
                  <div className="dc-feed-text">{a.text}</div>
                  <div className="dc-feed-time">{a.time}</div>
                </div>
              )) : <div className="dc-empty">Keine Aktivitäten</div>}
            </div>

            {/* NB PERFORMANCE */}
            {d.topNb.length > 0 && (
              <div className="dc-card dc-fade" style={{ animationDelay: ".28s" }}>
                <div className="dc-card-title">Netzbetreiber<span className="count">Top {d.topNb.length}</span></div>
                {d.topNb.map((nb, i) => (
                  <div key={i} className="dc-nb-row">
                    <div className="dc-nb-name">{nb.name}</div>
                    <div className="dc-nb-stat" style={{ color: nb.avg > 14 ? "#ef4444" : nb.avg > 10 ? "#f59e0b" : "#22c55e" }}>{nb.avg}d</div>
                    <div className="dc-nb-bar">
                      <div className="dc-nb-bar-fill" style={{ width: `${nb.rate}%`, background: nb.rate > 90 ? "#22c55e" : nb.rate > 80 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <div className="dc-nb-stat" style={{ color: "#475569" }}>{nb.open}</div>
                  </div>
                ))}
              </div>
            )}

            {/* TERMINE */}
            {d.termine.length > 0 && (
              <div className="dc-card dc-fade" style={{ animationDelay: ".32s" }}>
                <div className="dc-card-title">Termine<span className="count">{d.termine.length} geplant</span></div>
                {d.termine.map((t, i) => (
                  <div key={i} className="dc-termin">
                    <div className="dc-termin-date">{t.date}<br /><span style={{ color: "#64748b" }}>{t.time}</span></div>
                    <div className="dc-termin-body">
                      <div className="dc-termin-title">{t.title}</div>
                      <div className="dc-termin-loc">{t.loc}</div>
                    </div>
                    <span className="dc-termin-type" style={{
                      color: t.type === "ibn" ? "#f59e0b" : "#3b82f6",
                      background: t.type === "ibn" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)",
                    }}>{t.type.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
