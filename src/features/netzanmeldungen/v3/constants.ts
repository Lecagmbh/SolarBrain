/**
 * V3 Constants — Status Config, Views, Pipeline, CSS
 */
import { C } from "../../crm-center/crm.styles";
import type { UnifiedItem, ViewKey } from "./types";

// ═══════════════════════════════════════════════════════════════════
// STATUS CONFIG
// ═══════════════════════════════════════════════════════════════════

export const SC: Record<string, { l: string; c: string; i: string }> = {
  eingang:              { l: "Eingang",        c: "#22c55e", i: "📥" },
  beim_nb:              { l: "Beim NB",        c: "#3b82f6", i: "🏢" },
  rueckfrage:           { l: "Rückfrage",      c: "#ef4444", i: "❓" },
  genehmigt:            { l: "Genehmigt",      c: "#22c55e", i: "✅" },
  ibn:                  { l: "IBN",            c: "#f59e0b", i: "🔧" },
  fertig:               { l: "Fertig",         c: "#22c55e", i: "🎉" },
  storniert:            { l: "Storniert",      c: "#64748b", i: "🚫" },
  crm_anfrage:          { l: "Anfrage",        c: "#f0d878", i: "📊" },
  crm_hv:               { l: "HV",            c: "#f0d878", i: "🤝" },
  crm_auftrag:          { l: "Auftrag",        c: "#D4A843", i: "📋" },
  crm_nb_anfrage:       { l: "NB-Anfrage",     c: "#EAD068", i: "📧" },
  crm_nb_kommunikation: { l: "NB-Komm.",       c: "#f97316", i: "📧" },
  crm_nb_genehmigt:     { l: "NB-Genehmigt",   c: "#22c55e", i: "✅" },
  crm_nb_abgelehnt:     { l: "Abgelehnt",      c: "#ef4444", i: "❌" },
  crm_eingestellt:      { l: "Eingestellt",    c: "#64748b", i: "⏸" },
  crm_abgeschlossen:    { l: "Abgeschlossen",  c: "#22c55e", i: "🎉" },
  // D2D Pipeline
  lead:                 { l: "Lead",           c: "#D4A843", i: "🌟" },
  kontaktiert:          { l: "Kontaktiert",    c: "#3b82f6", i: "📞" },
  qualifiziert:         { l: "Qualifiziert",   c: "#22c55e", i: "✅" },
  disqualifiziert:      { l: "Disqualifiziert",c: "#ef4444", i: "❌" },
  // Wizard-Leads
  lead_neu:             { l: "Neuer Lead",     c: "#a855f7", i: "🌟" },
  lead_kontaktiert:     { l: "Kontaktiert",    c: "#06b6d4", i: "📞" },
  lead_qualifiziert:    { l: "Qualifiziert",   c: "#22c55e", i: "✅" },
  lead_disqualifiziert: { l: "Disqualifiziert",c: "#ef4444", i: "❌" },
  lead_abgelehnt:       { l: "Abgelehnt",      c: "#64748b", i: "🚫" },
};

// Pipeline-Reihenfolge für Sortierung
export const STATUS_ORDER: Record<string, number> = {
  crm_anfrage: 1, crm_hv: 2, crm_auftrag: 3, crm_nb_anfrage: 4,
  crm_nb_kommunikation: 5, crm_nb_genehmigt: 6,
  eingang: 10, beim_nb: 11, rueckfrage: 12, genehmigt: 13,
  ibn: 14, fertig: 15, storniert: 16,
  crm_eingestellt: 17, crm_nb_abgelehnt: 18, crm_abgeschlossen: 19,
  lead: 0, kontaktiert: 1, qualifiziert: 2, disqualifiziert: 3, verkauft: 4, installation_d2d: 5,
  lead_neu: 0, lead_kontaktiert: 1, lead_qualifiziert: 2, lead_disqualifiziert: 20, lead_abgelehnt: 21,
};

// ═══════════════════════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════════════════════

export const VIEWS: { key: ViewKey; label: string; icon: string; filter: (i: UnifiedItem) => boolean; color?: string; staffOnly?: boolean }[] = [
  { key: "inbox",   label: "Neue Leads", icon: "🌟", color: "#D4A843",
    filter: i => i.status === "lead_neu" },
  { key: "open",    label: "In Bearbeitung",    icon: "📞",
    filter: i => ["lead_kontaktiert", "lead_qualifiziert"].includes(i.status) },
  { key: "done",    label: "Abgeschlossen",          icon: "✅",
    filter: i => ["lead_disqualifiziert", "lead_abgelehnt", "lead_konvertiert"].includes(i.status) },
  { key: "all",     label: "Alle Leads",       icon: "📊",
    filter: () => true },
];

// ═══════════════════════════════════════════════════════════════════
// NEXT ACTION RULES
// ═══════════════════════════════════════════════════════════════════

export function getNextAction(item: UnifiedItem): string | undefined {
  switch (item.status) {
    case "rueckfrage":
      return "Rückfrage beantworten";
    case "eingang":
      return "Unterlagen prüfen + beim NB einreichen";
    case "beim_nb":
      if ((item.daysAtNb ?? 0) > 21) return "Überfällig — Eskalation prüfen";
      if ((item.daysAtNb ?? 0) > 14) return "Nachfassen beim NB";
      return undefined;
    case "genehmigt":
      return "Zählerwechsel-Termin planen";
    case "ibn":
      return "IBN-Protokoll + MaStR-Registrierung";
    case "crm_anfrage":
      return "HV zuordnen";
    case "crm_hv":
      return "Angebot erstellen";
    case "crm_auftrag":
      return "Netzanfrage vorbereiten";
    case "crm_nb_kommunikation":
      return "NB-Rückfrage beantworten";
    case "crm_nb_genehmigt":
      return "Montage planen";
    case "lead_neu":
      return "Lead kontaktieren";
    case "lead_kontaktiert":
      return "Qualifizierung prüfen";
    default:
      return undefined;
  }
}

// ═══════════════════════════════════════════════════════════════════
// LAST ACTIVITY FALLBACK
// ═══════════════════════════════════════════════════════════════════

export function getLastActivityFallback(item: UnifiedItem): { text: string; time: string; type: string } {
  const sc = SC[item.status];
  const timeAgo = getTimeAgo(item.createdAt);
  // CRM: Titel anzeigen wenn vorhanden
  if (item.source === "crm" && item.titel) {
    return { text: `${sc?.i || "📋"} ${item.titel}`, time: timeAgo, type: "status" };
  }
  if (item.azNb) {
    return { text: `${sc?.i || "📋"} Status: ${sc?.l || item.status} (Az: ${item.azNb})`, time: timeAgo, type: "status" };
  }
  return { text: `${sc?.i || "📋"} Status: ${sc?.l || item.status}`, time: timeAgo, type: "status" };
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `vor ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "gestern";
  return `vor ${days}d`;
}

// ═══════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════

export const V3_CSS = `
@keyframes urgentPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.2)}50%{box-shadow:0 0 0 4px rgba(239,68,68,0)}}
@keyframes flowPulse{0%,100%{opacity:.3}50%{opacity:.9}}
@keyframes countPop{0%{transform:scale(1)}50%{transform:scale(1.1)}100%{transform:scale(1)}}
@keyframes glowBorder{0%,100%{box-shadow:0 0 0 0 var(--gc)}50%{box-shadow:0 0 12px 0 var(--gc)}}
@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.v3-card{transition:all .12s;cursor:pointer;border-radius:10px}
.v3-card:hover{border-color:rgba(212,168,67,0.2)!important;transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,0,0,0.3)}
.v3-view-btn{transition:all .1s}.v3-view-btn:hover{background:rgba(212,168,67,0.06)!important}
.pipe-stage{position:relative;flex:1;text-align:center;padding:14px 6px 10px;border-radius:12px;cursor:pointer;transition:all .25s;border:1.5px solid transparent;overflow:hidden;animation:slideUp .5s ease both;min-width:0}
.pipe-stage::before{content:'';position:absolute;inset:0;border-radius:12px;background:linear-gradient(135deg,var(--bg) 0%,transparent 60%);opacity:0.12;transition:opacity .25s}
.pipe-stage:hover::before{opacity:0.25}
.pipe-stage:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 8px 24px rgba(0,0,0,0.4),0 0 20px var(--bg)}
.pipe-stage.active{border-color:var(--bc)!important;--gc:var(--bc);animation:glowBorder 2s infinite,slideUp .5s ease both;box-shadow:0 0 20px var(--bg)}
.pipe-stage .count{font-size:34px;font-weight:900;letter-spacing:-1.5px;line-height:1;font-variant-numeric:tabular-nums}
.pipe-stage:hover .count{animation:countPop .4s ease}
.pipe-arrow{display:flex;align-items:center;padding:12px 0 0}
.pipe-arrow svg path{animation:flowPulse 2s infinite}
.pipe-label{font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;text-align:center;padding:4px 14px;border-radius:20px;display:inline-block;background:linear-gradient(135deg,var(--lc1),var(--lc2));background-size:200% 200%;animation:shimmer 3s linear infinite}
select option{background:#0a1128;color:#e2e8f0}

/* ─── Responsive: Tablet (<1024px) ─── */
@media(max-width:1024px){
  .v3-header{flex-wrap:wrap;gap:10px!important;padding:12px 16px!important}
  .v3-search{width:100%!important;order:10}
  .v3-header-controls{order:9;flex-wrap:wrap;gap:6px}
  .v3-pipeline-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;padding:10px 16px!important}
  .v3-pipeline-inner{min-width:700px}
  .v3-main-layout{padding:0 16px 16px!important;gap:12px!important}
  .v3-sidebar{display:none!important}
  .v3-sidebar-mobile{display:flex!important}
  .v3-kpi-grid{grid-template-columns:repeat(3,1fr)!important}
  .v3-dashboard-cols{grid-template-columns:1fr!important}
  .v3-dashboard-wrap{padding:16px!important}
  .pipe-stage .count{font-size:26px}
  .pipe-stage{padding:10px 4px 8px}
  .v3-card-row2{flex-wrap:wrap;gap:4px!important}
}

/* ─── Responsive: Small Laptop (<1280px) ─── */
@media(max-width:1280px){
  .v3-kpi-grid{grid-template-columns:repeat(3,1fr)!important}
  .v3-dashboard-cols{grid-template-columns:1fr 1fr!important}
  .pipe-stage .count{font-size:28px}
}

/* ─── Responsive: Large Tablet Portrait (<850px) ─── */
@media(max-width:850px){
  .v3-kpi-grid{grid-template-columns:repeat(2,1fr)!important}
  .v3-dashboard-cols{grid-template-columns:1fr!important}
  .v3-card-compact-info{display:none!important}
}
`;
