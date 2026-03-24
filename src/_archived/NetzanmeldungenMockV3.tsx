/**
 * Netzanmeldungen V3 Mock — "Inbox für Sachbearbeiter"
 * =====================================================
 * Ersetzt die flache Tabelle durch ein aktives Arbeits-Dashboard.
 * Focus: Was muss ich JETZT tun?
 */
import { useState, useMemo, useEffect, useRef } from "react";
import { C, badgeStyle, cardStyle, CSS_INJECT } from "../crm-center/crm.styles";

// ═══════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════

interface MockItem {
  id: number;
  publicId: string;
  name: string;
  kunde: string;
  plz: string;
  ort: string;
  nb: string;
  kwp: number;
  status: string;
  source: "wizard" | "crm";
  daysAtNb: number;
  lastActivity: { text: string; time: string; type: string };
  nextAction?: string;
  tags?: string[];
  azNb?: string;
}

const ITEMS: MockItem[] = [
  // RÜCKFRAGEN — dringend
  { id: 1, publicId: "INST-V92CW399N", name: "Schäfer, Thomas", kunde: "Sol-Living GmbH", plz: "10965", ort: "Berlin", nb: "Stromnetz Berlin", kwp: 9.8, status: "rueckfrage", source: "wizard", daysAtNb: 12,
    lastActivity: { text: "📨 Nachforderung: Übersichtsschaltplan fehlt, bitte nachreichen", time: "vor 2h", type: "email" },
    nextAction: "Schaltplan hochladen + erneut einreichen", azNb: "SNB-2026-14832" },
  { id: 2, publicId: "GN-00087", name: "Heinrich, Werner", kunde: "Grünergie GmbH", plz: "44793", ort: "Bochum", nb: "Stadtwerke Bochum", kwp: 15.4, status: "rueckfrage", source: "wizard", daysAtNb: 8,
    lastActivity: { text: "📨 Rückfrage: Zählernummer nicht lesbar, bitte erneut senden", time: "vor 5h", type: "email" },
    nextAction: "Zählernummer klären und nachsenden" },
  { id: 3, publicId: "INST-6FEQSWK3U", name: "Keller GmbH", kunde: "EHBB GmbH", plz: "50667", ort: "Köln", nb: "RheinEnergie", kwp: 29.9, status: "rueckfrage", source: "wizard", daysAtNb: 3,
    lastActivity: { text: "📨 Rückfrage: BESS Speicher — Datenblatt Wechselrichter nachgefordert", time: "gestern", type: "email" },
    nextAction: "WR-Datenblatt hochladen" },

  // BEIM NB — warten
  { id: 4, publicId: "INST-3266EC08", name: "Martina Overbeck", kunde: "NOVATT GmbH", plz: "31553", ort: "Sachsenhagen", nb: "Westfalen Weser Netz", kwp: 727.26, status: "beim_nb", source: "crm", daysAtNb: 19,
    lastActivity: { text: "📤 Netzanfrage gestellt am 27.02.2026 (Az: VEEG447157)", time: "vor 19d", type: "email_out" },
    nextAction: "Warten auf NB — Nachfassen ab Tag 21", azNb: "VEEG447157", tags: ["Großanlage", "1.000kW Speicher"] },
  { id: 5, publicId: "INST-D6ECC30E", name: "Kunze, Stephanie", kunde: "NOVATT GmbH", plz: "31177", ort: "Harsum", nb: "Avacon Netz", kwp: 241.96, status: "beim_nb", source: "crm", daysAtNb: 12,
    lastActivity: { text: "📨 Eingangsbestätigung von Avacon Netz (Az: 8611558871)", time: "vor 12d", type: "email" },
    azNb: "8611558871" },
  { id: 6, publicId: "INST-HOLR2CZPU", name: "Meyer, Anna", kunde: "Lumina Solar", plz: "80331", ort: "München", nb: "SWM Infrastruktur", kwp: 12.5, status: "beim_nb", source: "wizard", daysAtNb: 5,
    lastActivity: { text: "⚡ Status: EINGANG → BEIM_NB", time: "vor 5d", type: "status" } },
  { id: 7, publicId: "INST-UP056J9LC", name: "Weber, Klaus", kunde: "360° Solar", plz: "70173", ort: "Stuttgart", nb: "Netze BW", kwp: 8.2, status: "beim_nb", source: "wizard", daysAtNb: 23,
    lastActivity: { text: "📤 2. Nachfrage an NB gesendet", time: "vor 2d", type: "email_out" },
    nextAction: "Überfällig — Eskalation prüfen", tags: ["Überfällig"] },

  // EINGANG — einzureichen
  { id: 8, publicId: "INST-2AB87D8A", name: "Schmitt, Peter", kunde: "NOVATT GmbH", plz: "04178", ort: "Leipzig", nb: "Netz Leipzig", kwp: 0, status: "eingang", source: "crm", daysAtNb: 0,
    lastActivity: { text: "💬 Factro: Netzanfrage vorbereiten — Speicher 500kW", time: "vor 1d", type: "comment" },
    nextAction: "Unterlagen prüfen + NB-Anfrage stellen", tags: ["Großspeicher"] },
  { id: 9, publicId: "INST-CAC4836C", name: "Fischer, Maria", kunde: "NOVATT GmbH", plz: "04420", ort: "Markranstädt", nb: "MITNETZ Strom", kwp: 0, status: "eingang", source: "crm", daysAtNb: 0,
    lastActivity: { text: "📎 Dokument: Lageplan_Markranstaedt.pdf hochgeladen", time: "vor 3d", type: "document" },
    nextAction: "VDE-Formulare generieren + einreichen" },

  // GENEHMIGT
  { id: 10, publicId: "INST-UZPV4ZBOP", name: "Bauer, Christian", kunde: "Sol-Living GmbH", plz: "50676", ort: "Köln", nb: "RheinEnergie", kwp: 18.7, status: "genehmigt", source: "wizard", daysAtNb: 0,
    lastActivity: { text: "📨 Einspeisezusage erteilt von RheinEnergie", time: "vor 4d", type: "email" },
    nextAction: "Zählerwechsel-Termin vereinbaren", azNb: "RE-2026-5591" },
  { id: 11, publicId: "INST-F223EF6D", name: "Overbeck, Martina", kunde: "NOVATT GmbH", plz: "38723", ort: "Seesen", nb: "Harz Energie Netz", kwp: 727.26, status: "beim_nb", source: "crm", daysAtNb: 10,
    lastActivity: { text: "📨 Eingangsbestätigung von Harz Energie Netz", time: "vor 12d", type: "email" },
    azNb: "24-99-14471", tags: ["Großanlage", "1.000kW Speicher"] },

  // FERTIG
  { id: 12, publicId: "INST-QSYO07HF8", name: "Klein, Sabine", kunde: "Lumina Solar", plz: "60311", ort: "Frankfurt", nb: "Syna GmbH", kwp: 10.2, status: "fertig", source: "wizard", daysAtNb: 0,
    lastActivity: { text: "✅ IBN-Protokoll eingereicht, MaStR registriert", time: "vor 7d", type: "status" } },
  { id: 13, publicId: "INST-YEG72UE3G", name: "Hoffmann, Jan", kunde: "Lumina Solar", plz: "60487", ort: "Frankfurt", nb: "Syna GmbH", kwp: 6.8, status: "fertig", source: "wizard", daysAtNb: 0,
    lastActivity: { text: "✅ Abgeschlossen — Rechnung RE-202603-000A12 erstellt", time: "vor 14d", type: "status" } },

  // CRM-Projekte — verschiedene Stages
  { id: 14, publicId: "CRM-85", name: "Engelberth, Harald", kunde: "NOVATT GmbH", plz: "04451", ort: "Borsdorf", nb: "MITNETZ Strom", kwp: 0, status: "crm_anfrage", source: "crm", daysAtNb: 0,
    lastActivity: { text: "💬 Factro: Grundbuch beantragen", time: "vor 4d", type: "comment" },
    nextAction: "Grundbuch prüfen + Netzanfrage vorbereiten" },
  { id: 15, publicId: "INST-039D057E", name: "Engelberth, Harald", kunde: "NOVATT GmbH", plz: "69168", ort: "Wiesloch", nb: "Netze BW", kwp: 0, status: "eingang", source: "crm", daysAtNb: 0,
    lastActivity: { text: "📨 Eingangsbestätigung von Harz Energie Netz", time: "vor 12d", type: "email" },
    nextAction: "10MW Großspeicher — Unterlagen für Hochspannung vorbereiten", tags: ["Großspeicher", "10 MW"] },
  { id: 16, publicId: "CRM-112", name: "Richter, Daniel", kunde: "NOVATT GmbH", plz: "30159", ort: "Hannover", nb: "Enercity Netz", kwp: 156, status: "crm_auftrag", source: "crm", daysAtNb: 0,
    lastActivity: { text: "💬 Factro: Auftrag bestätigt, PV Sol Simulation läuft", time: "vor 2d", type: "comment" },
    nextAction: "PV Sol abwarten, dann NB-Anfrage" },
  { id: 17, publicId: "CRM-98", name: "Lorenz, Katharina", kunde: "NOVATT GmbH", plz: "04109", ort: "Leipzig", nb: "Netz Leipzig", kwp: 89, status: "crm_nb_kommunikation", source: "crm", daysAtNb: 7,
    lastActivity: { text: "📨 Rückfrage von Netz Leipzig: Statik-Nachweis fehlt", time: "vor 1d", type: "email" },
    nextAction: "Statik-Nachweis anfordern und nachreichen" },
  { id: 18, publicId: "CRM-77", name: "Bergmann, Florian", kunde: "NOVATT GmbH", plz: "01069", ort: "Dresden", nb: "SachsenEnergie", kwp: 245, status: "crm_nb_genehmigt", source: "crm", daysAtNb: 0,
    lastActivity: { text: "📨 Einspeisezusage von SachsenEnergie erteilt", time: "vor 3d", type: "email" },
    nextAction: "Montage-Termin planen" },
  { id: 19, publicId: "CRM-63", name: "Huber, Stefan", kunde: "NOVATT GmbH", plz: "80469", ort: "München", nb: "SWM Infrastruktur", kwp: 42, status: "crm_hv", source: "crm", daysAtNb: 0,
    lastActivity: { text: "💬 HV Niklas Baumgärtner zugeordnet", time: "vor 6d", type: "comment" },
    nextAction: "Angebot erstellen" },
  { id: 20, publicId: "CRM-55", name: "Friedrich, Monika", kunde: "NOVATT GmbH", plz: "99084", ort: "Erfurt", nb: "TEN Thüringer", kwp: 18.5, status: "crm_eingestellt", source: "crm", daysAtNb: 0,
    lastActivity: { text: "⏸ Projekt eingestellt — Kundin verkauft Objekt", time: "vor 14d", type: "status" } },
  { id: 21, publicId: "CRM-201", name: "Kraus, Patrick", kunde: "NOVATT GmbH", plz: "04420", ort: "Markranstädt", nb: "MITNETZ Strom", kwp: 0, status: "crm_nb_anfrage", source: "crm", daysAtNb: 3,
    lastActivity: { text: "📤 Netzanfrage gestellt am 15.03.2026", time: "vor 3d", type: "email_out" },
    nextAction: "Warten auf NB-Eingangsbestätigung", tags: ["Großspeicher", "500kW"] },
];

// ═══════════════════════════════════════════════════════════════════
// STATUS CONFIG
// ═══════════════════════════════════════════════════════════════════

const SC: Record<string, { l: string; c: string; i: string }> = {
  eingang: { l: "Eingang", c: "#64748b", i: "📥" },
  beim_nb: { l: "Beim NB", c: "#3b82f6", i: "🏢" },
  rueckfrage: { l: "Rückfrage", c: "#ef4444", i: "❓" },
  genehmigt: { l: "Genehmigt", c: "#22c55e", i: "✅" },
  ibn: { l: "IBN", c: "#f59e0b", i: "🔧" },
  fertig: { l: "Fertig", c: "#22c55e", i: "🎉" },
  storniert: { l: "Storniert", c: "#64748b", i: "🚫" },
  crm_anfrage: { l: "CRM-Anfrage", c: "#f0d878", i: "📊" },
  crm_hv: { l: "CRM-HV", c: "#f0d878", i: "🤝" },
  crm_auftrag: { l: "CRM-Auftrag", c: "#D4A843", i: "📊" },
  crm_nb_anfrage: { l: "CRM-NB-Anfrage", c: "#EAD068", i: "📧" },
  crm_nb_kommunikation: { l: "CRM-NB-Komm.", c: "#f97316", i: "📧" },
  crm_nb_genehmigt: { l: "CRM-Genehmigt", c: "#22c55e", i: "✅" },
  crm_eingestellt: { l: "CRM-Eingestellt", c: "#64748b", i: "⏸" },
};

const ACTIVITY_COLORS: Record<string, string> = {
  email: "#38bdf8", email_out: "#34d399", status: "#f0d878",
  comment: "#EAD068", document: "#06b6d4",
};

// ═══════════════════════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════════════════════

type ViewKey = "inbox" | "open" | "nb" | "done" | "all" | "crm" | "wizard";

const VIEWS: { key: ViewKey; label: string; icon: string; filter: (i: MockItem) => boolean; color?: string }[] = [
  { key: "inbox", label: "Handlungsbedarf", icon: "🔥", filter: i => ["rueckfrage", "eingang"].includes(i.status) || (i.status === "beim_nb" && i.daysAtNb > 14), color: "#ef4444" },
  { key: "open", label: "Alle offenen", icon: "📋", filter: i => !["fertig", "storniert"].includes(i.status) },
  { key: "nb", label: "Beim Netzbetreiber", icon: "🏢", filter: i => i.status === "beim_nb" },
  { key: "done", label: "Abgeschlossen", icon: "✅", filter: i => ["fertig", "storniert"].includes(i.status) },
  { key: "all", label: "Alle Projekte", icon: "📊", filter: () => true },
  { key: "wizard", label: "Netzanmeldungen", icon: "⚡", filter: i => i.source === "wizard" },
  { key: "crm", label: "CRM-Projekte", icon: "📊", filter: i => i.source === "crm" },
];

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// COUNTUP HOOK
// ═══════════════════════════════════════════════════════════════════

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const startTime = useRef(0);
  const rafId = useRef(0);
  useEffect(() => {
    startTime.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(eased * target));
      if (progress < 1) rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);
  return value;
}

function CountUp({ to, duration = 1400, locale }: { to: number; duration?: number; locale?: boolean }) {
  const v = useCountUp(to, duration);
  return <>{locale ? v.toLocaleString("de-DE") : v}</>;
}

const EXTRA_CSS = `
@keyframes urgentPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.2)}50%{box-shadow:0 0 0 4px rgba(239,68,68,0)}}
@keyframes flowPulse{0%,100%{opacity:.3}50%{opacity:.9}}
@keyframes countPop{0%{transform:scale(1)}50%{transform:scale(1.1)}100%{transform:scale(1)}}
@keyframes glowBorder{0%,100%{box-shadow:0 0 0 0 var(--gc)}50%{box-shadow:0 0 12px 0 var(--gc)}}
@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.item-card{transition:all .12s;cursor:pointer;border-radius:10px}
.item-card:hover{border-color:rgba(212,168,67,0.2)!important;transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,0,0,0.3)}
.view-btn{transition:all .1s}.view-btn:hover{background:rgba(212,168,67,0.06)!important}
.pipe-stage{position:relative;flex:1;text-align:center;padding:14px 6px 10px;border-radius:12px;cursor:pointer;transition:all .25s;border:1.5px solid transparent;overflow:hidden;animation:slideUp .5s ease both}
.pipe-stage::before{content:'';position:absolute;inset:0;border-radius:12px;background:linear-gradient(135deg,var(--bg) 0%,transparent 60%);opacity:0.06;transition:opacity .25s}
.pipe-stage:hover::before{opacity:0.15}
.pipe-stage:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 8px 24px rgba(0,0,0,0.4)}
.pipe-stage.active{border-color:var(--bc)!important;--gc:var(--bc);animation:glowBorder 2s infinite,slideUp .5s ease both}
.pipe-stage .count{font-size:34px;font-weight:900;letter-spacing:-1.5px;line-height:1;font-variant-numeric:tabular-nums}
.pipe-stage:hover .count{animation:countPop .4s ease}
.pipe-arrow{display:flex;align-items:center;padding:12px 0 0}
.pipe-arrow svg path{animation:flowPulse 2s infinite}
.pipe-label{font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;text-align:center;padding:4px 14px;border-radius:20px;display:inline-block;background:linear-gradient(135deg,var(--lc1),var(--lc2));background-size:200% 200%;animation:shimmer 3s linear infinite}
`;

// ═══════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD — 10.000+ Anmeldungen Übersicht
// ═══════════════════════════════════════════════════════════════════

const ADMIN_STATS = {
  total: 10247, offen: 3891, fertig: 5842, storniert: 514,
  eingang: 312, beimNb: 2104, rueckfrage: 187, genehmigt: 892, ibn: 396,
  avgDaysAtNb: 11.3, avgDaysTotal: 34.7,
  crm: 847, wizard: 9400,
  crmAnfrage: 164, crmAuftrag: 14, crmNbKomm: 8, crmGenehmigt: 5, crmEingestellt: 3,
  thisWeek: { neu: 89, abgeschlossen: 67, emails: 412, kommentare: 1247 },
  thisMonth: { neu: 342, abgeschlossen: 289, umsatz: 28450 },
};

const TOP_NB = [
  { name: "Stromnetz Berlin", count: 487, avgDays: 14.2, rueckfragen: 23 },
  { name: "Netze BW", count: 412, avgDays: 8.7, rueckfragen: 11 },
  { name: "Westnetz", count: 389, avgDays: 12.1, rueckfragen: 18 },
  { name: "Bayernwerk Netz", count: 356, avgDays: 9.4, rueckfragen: 8 },
  { name: "EnBW Netzgesellschaft", count: 298, avgDays: 7.3, rueckfragen: 5 },
  { name: "SWM Infrastruktur", count: 245, avgDays: 10.8, rueckfragen: 14 },
  { name: "Avacon Netz", count: 198, avgDays: 6.2, rueckfragen: 3 },
  { name: "MITNETZ Strom", count: 187, avgDays: 15.1, rueckfragen: 21 },
];

const TOP_KUNDEN = [
  { name: "NOVATT GmbH", count: 892, offen: 234, avgDays: 9.1 },
  { name: "Sol-Living GmbH", count: 756, offen: 189, avgDays: 11.3 },
  { name: "EHBB GmbH", count: 623, offen: 156, avgDays: 8.7 },
  { name: "Lumina Solar", count: 534, offen: 98, avgDays: 7.2 },
  { name: "360° Solar", count: 412, offen: 87, avgDays: 12.4 },
  { name: "Grünergie GmbH", count: 389, offen: 112, avgDays: 10.1 },
];

const RECENT_EVENTS = [
  { time: "vor 3min", text: "📨 Einspeisezusage von Stromnetz Berlin — INST-A8K2M1P (Müller, 12.5kWp)", color: "#22c55e" },
  { time: "vor 7min", text: "📨 Rückfrage von Westnetz — INST-B3N7P2Q: Schaltplan fehlt", color: "#ef4444" },
  { time: "vor 12min", text: "⚡ Auto-Status: INST-C4M8R3S → BEIM_NB (KI-Email-Analyse)", color: "#f0d878" },
  { time: "vor 18min", text: "📤 Netzanfrage gesendet an Bayernwerk — INST-D5L9T4U (29.9kWp)", color: "#34d399" },
  { time: "vor 23min", text: "📎 Dokument hochgeladen: Lageplan — INST-E6K0V5W", color: "#06b6d4" },
  { time: "vor 31min", text: "💬 Factro-Kommentar importiert — CRM-203 (Engelberth, 10MW Speicher)", color: "#fb923c" },
  { time: "vor 42min", text: "📨 Eingangsbestätigung von MITNETZ — INST-F7J1X6Y (Az: 4001399112)", color: "#3b82f6" },
  { time: "vor 1h", text: "⚡ Auto-Status: INST-G8H2Z7A → GENEHMIGT (Einspeisezusage erkannt)", color: "#22c55e" },
  { time: "vor 1h", text: "📤 2. Nachfrage an SWM Infrastruktur — INST-H9G3B8C (überfällig, 18d)", color: "#f97316" },
  { time: "vor 2h", text: "📨 Nachforderung von EnBW: VDE E.2 Datenblatt — INST-I0F4D9E", color: "#ef4444" },
];

const STATUS_TREND = [
  { week: "KW 8", eingang: 78, beimNb: 1980, rueckfrage: 165, genehmigt: 834, fertig: 5612 },
  { week: "KW 9", eingang: 91, beimNb: 2012, rueckfrage: 172, genehmigt: 856, fertig: 5689 },
  { week: "KW 10", eingang: 84, beimNb: 2045, rueckfrage: 179, genehmigt: 871, fertig: 5742 },
  { week: "KW 11", eingang: 95, beimNb: 2078, rueckfrage: 184, genehmigt: 885, fertig: 5798 },
  { week: "KW 12", eingang: 89, beimNb: 2104, rueckfrage: 187, genehmigt: 892, fertig: 5842 },
];

// ═══════════════════════════════════════════════════════════════════
// ANIMATED PIPELINE — "WOW" Version
// ═══════════════════════════════════════════════════════════════════

function PipelineStage({ label, count, color, sub, active, onClick, delay = 0, pulse }: {
  label: string; count: number; color: string; sub?: string; active: boolean; onClick: () => void; delay?: number; pulse?: boolean;
}) {
  const animated = useCountUp(count, 1400);
  return (
    <div className={`pipe-stage ${active ? "active" : ""}`}
      style={{ "--bg": color, "--bc": color + "60", animationDelay: `${delay}ms` } as any}
      onClick={onClick}>
      <div className="count" style={{ color, textShadow: `0 0 20px ${color}30` }}>{animated}</div>
      <div style={{ fontSize: 10, fontWeight: 800, color, opacity: 0.85, marginTop: 4, letterSpacing: 0.5 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{sub}</div>}
      {pulse && count > 0 && (
        <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: color, animation: "flowPulse 1s infinite" }} />
      )}
      {/* Bottom glow line */}
      <div style={{ position: "absolute", bottom: 0, left: "15%", right: "15%", height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
    </div>
  );
}

function PipelineArrowSvg({ color = C.textMuted }: { color?: string }) {
  return (
    <div className="pipe-arrow">
      <svg width="24" height="32" viewBox="0 0 24 32">
        <defs>
          <linearGradient id={`ag-${color.replace("#","")}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.1" />
            <stop offset="50%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path d="M5 8 L17 16 L5 24" fill="none" stroke={`url(#ag-${color.replace("#","")})`} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function AnimatedPipeline({ activeFilter, onFilter }: { activeFilter: string | null; onFilter: (k: string) => void }) {
  // Counts dynamisch aus ITEMS berechnen
  const count = (s: string) => ITEMS.filter(i => i.status === s).length;
  const avgDays = Math.round(ITEMS.filter(i => i.status === "beim_nb").reduce((s, i) => s + i.daysAtNb, 0) / Math.max(1, ITEMS.filter(i => i.status === "beim_nb").length));

  return (
    <div style={{ padding: "14px 24px 10px" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        {/* CRM */}
        <div style={{ flex: 1.8 }}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <span className="pipe-label" style={{ "--lc1": "#D4A84320", "--lc2": "#f0d87820", color: "#D4A843" } as any}>CRM</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <PipelineStage label="ANFRAGE" count={count("crm_anfrage")} color="#f0d878" active={activeFilter === "crm_anfrage"} onClick={() => onFilter("crm_anfrage")} delay={0} />
            <PipelineStage label="HV" count={count("crm_hv")} color="#f0d878" active={activeFilter === "crm_hv"} onClick={() => onFilter("crm_hv")} delay={60} />
            <PipelineStage label="AUFTRAG" count={count("crm_auftrag")} color="#D4A843" active={activeFilter === "crm_auftrag"} onClick={() => onFilter("crm_auftrag")} delay={120} />
            <PipelineStage label="NB-KOMM." count={count("crm_nb_kommunikation") + count("crm_nb_anfrage")} color="#f97316" active={activeFilter === "crm_nb_kommunikation"} onClick={() => onFilter("crm_nb_kommunikation")} delay={180} pulse={count("crm_nb_kommunikation") > 0} />
            <PipelineStage label="GENEHMIGT" count={count("crm_nb_genehmigt")} color="#22c55e" active={activeFilter === "crm_nb_genehmigt"} onClick={() => onFilter("crm_nb_genehmigt")} delay={240} />
          </div>
        </div>

        <PipelineArrowSvg color="#D4A843" />

        {/* NETZANMELDUNG */}
        <div style={{ flex: 1.5 }}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <span className="pipe-label" style={{ "--lc1": "#3b82f620", "--lc2": "#f9731620", color: "#3b82f6" } as any}>NETZANMELDUNG</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <PipelineStage label="BEIM NB" count={count("beim_nb")} color="#3b82f6" sub={`Ø ${avgDays}d`} active={activeFilter === "beim_nb"} onClick={() => onFilter("beim_nb")} delay={320} />
            <PipelineStage label="RÜCKFRAGE" count={count("rueckfrage")} color="#ef4444" active={activeFilter === "rueckfrage"} onClick={() => onFilter("rueckfrage")} delay={400} pulse />
            <PipelineStage label="GENEHMIGT" count={count("genehmigt")} color="#22c55e" active={activeFilter === "genehmigt"} onClick={() => onFilter("genehmigt")} delay={480} />
          </div>
        </div>

        <PipelineArrowSvg color="#22c55e" />

        {/* ABSCHLUSS */}
        <div style={{ flex: 0.8 }}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <span className="pipe-label" style={{ "--lc1": "#22c55e20", "--lc2": "#f59e0b20", color: "#22c55e" } as any}>ABSCHLUSS</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <PipelineStage label="IBN" count={count("ibn")} color="#f59e0b" active={activeFilter === "ibn"} onClick={() => onFilter("ibn")} delay={560} />
            <PipelineStage label="FERTIG" count={count("fertig")} color="#22c55e" active={activeFilter === "fertig"} onClick={() => onFilter("fertig")} delay={640} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ onDrillDown }: { onDrillDown: (view: ViewKey) => void }) {
  const s = ADMIN_STATS;
  const maxBar = Math.max(...STATUS_TREND.map(t => t.beimNb));

  return (
    <div style={{ padding: "20px 28px" }}>
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { v: s.total, l: "Total", c: C.text, sub: `${s.offen} offen` },
          { v: s.rueckfrage, l: "Rückfragen", c: "#ef4444", sub: "Antwort nötig", click: "inbox" as ViewKey },
          { v: s.beimNb, l: "Beim NB", c: "#3b82f6", sub: `Ø ${s.avgDaysAtNb}d`, click: "nb" as ViewKey },
          { v: s.eingang, l: "Einzureichen", c: "#f97316", sub: "NB-Anfrage fehlt", click: "inbox" as ViewKey },
          { v: s.genehmigt, l: "Genehmigt", c: "#22c55e", sub: `${s.ibn} in IBN` },
          { v: s.thisWeek.emails, l: "Emails/Woche", c: "#06b6d4", sub: `${s.thisWeek.kommentare} Kommentare` },
        ].map(k => (
          <div key={k.l} onClick={() => k.click && onDrillDown(k.click)} style={{ ...cardStyle, padding: "16px", cursor: k.click ? "pointer" : "default", textAlign: "center", border: `1px solid ${k.c}15`, background: k.c + "04" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: k.c, letterSpacing: -1, textShadow: `0 0 20px ${k.c}25` }}><CountUp to={k.v} duration={1600} locale /></div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textBright, marginTop: 2 }}>{k.l}</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ═══ ANIMATED PIPELINE ═══ */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          {/* CRM */}
          <div style={{ flex: 1.8 }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <span className="pipe-label" style={{ "--lc1": "#D4A84320", "--lc2": "#f0d87820", color: "#D4A843" } as any}>CRM</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <PipelineStage label="ANFRAGE" count={s.crmAnfrage} color="#f0d878" active={false} onClick={() => onDrillDown("crm")} delay={0} />
              <PipelineStage label="AUFTRAG" count={s.crmAuftrag} color="#D4A843" active={false} onClick={() => onDrillDown("crm")} delay={60} />
              <PipelineStage label="NB-KOMM." count={s.crmNbKomm} color="#f97316" active={false} onClick={() => onDrillDown("crm")} delay={120} pulse={s.crmNbKomm > 0} />
              <PipelineStage label="GENEHMIGT" count={s.crmGenehmigt} color="#22c55e" active={false} onClick={() => onDrillDown("crm")} delay={180} />
            </div>
          </div>
          <PipelineArrowSvg color="#D4A843" />
          {/* NETZANMELDUNG */}
          <div style={{ flex: 2.5 }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <span className="pipe-label" style={{ "--lc1": "#3b82f620", "--lc2": "#f9731620", color: "#3b82f6" } as any}>NETZANMELDUNG</span>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <PipelineStage label="BEIM NB" count={s.beimNb} color="#3b82f6" sub={`Ø ${s.avgDaysAtNb}d`} active={false} onClick={() => onDrillDown("nb")} delay={200} />
              <PipelineStage label="RÜCKFRAGE" count={s.rueckfrage} color="#ef4444" active={false} onClick={() => onDrillDown("inbox")} delay={300} pulse />
              <PipelineStage label="GENEHMIGT" count={s.genehmigt} color="#22c55e" active={false} onClick={() => onDrillDown("open")} delay={400} />
            </div>
          </div>
          <PipelineArrowSvg color="#22c55e" />
          {/* ABSCHLUSS */}
          <div style={{ flex: 1 }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <span className="pipe-label" style={{ "--lc1": "#22c55e20", "--lc2": "#f59e0b20", color: "#22c55e" } as any}>ABSCHLUSS</span>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <PipelineStage label="IBN" count={s.ibn} color="#f59e0b" active={false} onClick={() => onDrillDown("open")} delay={500} />
              <PipelineStage label="FERTIG" count={s.fertig} color="#22c55e" active={false} onClick={() => onDrillDown("done")} delay={600} />
            </div>
          </div>
        </div>
      </div>

      {/* 3-Spalten: Trend | Top-NB | Live-Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>

        {/* Status-Trend (letzte 5 Wochen) */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>📈 Status-Trend (5 Wochen)</div>
          {STATUS_TREND.map(t => (
            <div key={t.week} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: C.textMuted, width: 36, fontFamily: "'DM Mono'" }}>{t.week}</span>
              <div style={{ flex: 1, display: "flex", height: 14, borderRadius: 3, overflow: "hidden", background: "rgba(255,255,255,0.03)" }}>
                {[
                  { v: t.eingang, c: "#64748b" }, { v: t.beimNb, c: "#3b82f6" },
                  { v: t.rueckfrage, c: "#ef4444" }, { v: t.genehmigt, c: "#22c55e" },
                ].map((seg, i) => (
                  <div key={i} style={{ width: `${(seg.v / (t.eingang + t.beimNb + t.rueckfrage + t.genehmigt)) * 100}%`, background: seg.c, minWidth: seg.v > 0 ? 2 : 0 }} />
                ))}
              </div>
              <span style={{ fontSize: 9, color: C.textMuted, width: 35, textAlign: "right" }}>{t.beimNb}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 8, justifyContent: "center" }}>
            {[{ l: "Eingang", c: "#64748b" }, { l: "Beim NB", c: "#3b82f6" }, { l: "Rückfrage", c: "#ef4444" }, { l: "Genehmigt", c: "#22c55e" }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />
                <span style={{ fontSize: 9, color: C.textMuted }}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Netzbetreiber */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>🏢 Top Netzbetreiber</div>
          {TOP_NB.map((nb, i) => (
            <div key={nb.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: i < TOP_NB.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 10, color: C.textMuted, width: 16, textAlign: "right" }}>#{i + 1}</span>
              <span style={{ fontSize: 11, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nb.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#3b82f6", width: 30, textAlign: "right" }}>{nb.count}</span>
              <span style={{ fontSize: 9, color: nb.avgDays > 12 ? "#ef4444" : "#64748b", width: 32, textAlign: "right" }}>{nb.avgDays}d</span>
              {nb.rueckfragen > 10 && <span style={{ fontSize: 8, fontWeight: 700, color: "#ef4444", background: "#ef444415", padding: "1px 4px", borderRadius: 3 }}>❓{nb.rueckfragen}</span>}
            </div>
          ))}
        </div>

        {/* Live-Feed */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.textBright }}>⚡ Live-Feed</div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "urgentPulse 2s infinite" }} />
          </div>
          {RECENT_EVENTS.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: i < RECENT_EVENTS.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 3, height: "auto", borderRadius: 2, background: e.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: C.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.text}</div>
              </div>
              <span style={{ fontSize: 9, color: C.textMuted, flexShrink: 0, fontFamily: "'DM Mono'" }}>{e.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Spalten: Kunden | Probleme */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* Top Kunden */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>👥 Top Kunden</div>
          {TOP_KUNDEN.map((k, i) => (
            <div key={k.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < TOP_KUNDEN.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 10, color: C.textMuted, width: 16, textAlign: "right" }}>#{i + 1}</span>
              <span style={{ fontSize: 11, color: C.text, flex: 1, fontWeight: 600 }}>{k.name}</span>
              <span style={{ fontSize: 10, color: "#3b82f6" }}>{k.count} total</span>
              <span style={{ fontSize: 10, color: "#f97316", fontWeight: 600 }}>{k.offen} offen</span>
              <span style={{ fontSize: 9, color: C.textMuted }}>{k.avgDays}d</span>
            </div>
          ))}
        </div>

        {/* Probleme & Anomalien */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#ef4444", marginBottom: 12 }}>⚠ Handlungsbedarf</div>
          {[
            { icon: "🔴", text: "187 Rückfragen offen — 23 davon seit >7 Tagen", action: "Rückfragen anzeigen", color: "#ef4444" },
            { icon: "🟠", text: "34 Anmeldungen >21 Tage beim NB ohne Antwort", action: "Nachfassen", color: "#f97316" },
            { icon: "🟡", text: "312 Eingang ohne NB-Anfrage — älteste seit 14 Tagen", action: "Einreichen", color: "#eab308" },
            { icon: "🔵", text: "MITNETZ Strom: Ø 15.1d Bearbeitungszeit (Ausreißer)", action: "NB analysieren", color: "#3b82f6" },
            { icon: "🟢", text: "67 diese Woche abgeschlossen — Rechnungen prüfen", action: "Rechnungen", color: "#22c55e" },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.textDim }}>{p.text}</div>
                <button onClick={() => onDrillDown("inbox")} style={{ marginTop: 4, background: p.color + "10", color: p.color, border: `1px solid ${p.color}20`, borderRadius: 4, padding: "3px 8px", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>→ {p.action}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function NetzanmeldungenMockV3() {
  const [mode, setMode] = useState<"dashboard" | "list">("dashboard");
  const [view, setView] = useState<ViewKey>("inbox");
  const [search, setSearch] = useState("");
  const [compact, setCompact] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = ITEMS;
    // Pipeline-Filter hat Vorrang
    if (activeFilter) {
      // Spezialfall: crm_nb_kommunikation matcht auch crm_nb_anfrage
      if (activeFilter === "crm_nb_kommunikation") {
        items = items.filter(i => i.status === "crm_nb_kommunikation" || i.status === "crm_nb_anfrage");
      } else {
        items = items.filter(i => i.status === activeFilter);
      }
    } else {
      const viewDef = VIEWS.find(v => v.key === view)!;
      items = items.filter(viewDef.filter);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) || i.kunde.toLowerCase().includes(q) ||
        i.ort.toLowerCase().includes(q) || i.publicId.toLowerCase().includes(q) ||
        i.nb.toLowerCase().includes(q)
      );
    }
    return items.sort((a, b) => {
      if (a.status === "rueckfrage" && b.status !== "rueckfrage") return -1;
      if (b.status === "rueckfrage" && a.status !== "rueckfrage") return 1;
      if (a.nextAction && !b.nextAction) return -1;
      if (b.nextAction && !a.nextAction) return 1;
      return b.daysAtNb - a.daysAtNb;
    });
  }, [view, search, activeFilter]);

  // Focus-Bar Stats
  const rueckfragen = ITEMS.filter(i => i.status === "rueckfrage").length;
  const einzureichen = ITEMS.filter(i => i.status === "eingang").length;
  const ueberfaellig = ITEMS.filter(i => i.status === "beim_nb" && i.daysAtNb > 14).length;
  const genehmigt = ITEMS.filter(i => i.status === "genehmigt").length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_INJECT + EXTRA_CSS }} />

      {/* ═══ HEADER ═══ */}
      <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.textBright }}>Netzanmeldungen</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.primary, background: C.primaryGlow, padding: "3px 10px", borderRadius: 6 }}>V3 MOCK</span>
        {/* Dashboard / Liste Toggle */}
        <div style={{ display: "flex", gap: 2, background: "rgba(12,12,20,0.7)", borderRadius: 6, padding: 2, border: `1px solid ${C.border}` }}>
          {([["dashboard", "📊 Dashboard"], ["list", "📋 Projekte"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} style={{
              padding: "6px 14px", borderRadius: 4, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: mode === k ? C.primaryGlow : "transparent", color: mode === k ? C.accent : C.textMuted,
            }}>{l}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {/* Suche (nur im List-Mode) */}
        {mode === "list" && (
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suche nach Name, Kunde, Ort, NB..."
            style={{ width: 300, background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} />
        )}
        {/* Ansicht-Toggle (nur im List-Mode) */}
        {mode === "list" && (
          <div style={{ display: "flex", gap: 2, background: "rgba(12,12,20,0.7)", borderRadius: 6, padding: 2, border: `1px solid ${C.border}` }}>
            {[false, true].map(c => (
              <button key={String(c)} onClick={() => setCompact(c)} style={{
                padding: "6px 12px", borderRadius: 4, border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer",
                background: compact === c ? C.primaryGlow : "transparent", color: compact === c ? C.accent : C.textMuted,
              }}>{c ? "Kompakt" : "Karten"}</button>
            ))}
          </div>
        )}
      </div>

      {/* ═══ DASHBOARD MODE ═══ */}
      {mode === "dashboard" && <AdminDashboard onDrillDown={(v) => { setView(v); setMode("list"); }} />}

      {/* ═══ ANIMATED PIPELINE (List-Mode) ═══ */}
      {mode === "list" && <>
      <AnimatedPipeline activeFilter={activeFilter} onFilter={(k: string) => { setActiveFilter(prev => prev === k ? null : k); setView("all"); }} />

      {/* ═══ MAIN LAYOUT ═══ */}
      <div style={{ display: "flex", padding: "0 24px 24px", gap: 16 }}>

        {/* SIDEBAR */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 4 }}>Ansichten</div>
          {VIEWS.slice(0, 4).map(v => {
            const count = ITEMS.filter(v.filter).length;
            const active = view === v.key;
            return (
              <button key={v.key} className="view-btn" onClick={() => { setView(v.key); setActiveFilter(null); }} style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 6,
                border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: active ? 700 : 500,
                background: active ? C.primaryGlow : "transparent", color: active ? C.accent : C.text,
              }}>
                <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{v.icon}</span>
                <span style={{ flex: 1, textAlign: "left" }}>{v.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: v.color || C.textMuted, background: (v.color || C.textMuted) + "15", padding: "1px 6px", borderRadius: 10, minWidth: 20, textAlign: "center" }}>{count}</span>
              </button>
            );
          })}

          <div style={{ height: 1, background: C.border, margin: "10px 0" }} />
          <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Quelle</div>
          {VIEWS.slice(4).map(v => {
            const count = ITEMS.filter(v.filter).length;
            const active = view === v.key;
            return (
              <button key={v.key} className="view-btn" onClick={() => { setView(v.key); setActiveFilter(null); }} style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 6,
                border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: active ? 700 : 500,
                background: active ? C.primaryGlow : "transparent", color: active ? C.accent : C.text,
              }}>
                <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{v.icon}</span>
                <span style={{ flex: 1, textAlign: "left" }}>{v.label}</span>
                <span style={{ fontSize: 10, color: C.textMuted }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* HAUPTLISTE */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
            {filtered.length} {filtered.length === 1 ? "Projekt" : "Projekte"} · <span style={{ color: C.accent }}>{VIEWS.find(v => v.key === view)?.label}</span>
          </div>

          {filtered.map(item => {
            const sc = SC[item.status] || { l: item.status, c: "#64748b", i: "📋" };
            const actColor = ACTIVITY_COLORS[item.lastActivity.type] || "#64748b";
            const daysColor = item.daysAtNb > 14 ? "#ef4444" : item.daysAtNb > 7 ? "#f97316" : item.daysAtNb > 0 ? "#3b82f6" : "#64748b";
            const isUrgent = item.status === "rueckfrage" || (item.status === "beim_nb" && item.daysAtNb > 14);

            if (compact) {
              // Kompakt-Ansicht
              return (
                <div key={item.id} className="item-card" onClick={() => setSelectedId(item.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: C.bgCard, border: `1px solid ${isUrgent ? sc.c + "25" : C.border}`, borderRadius: 6, marginBottom: 4, borderLeft: `3px solid ${sc.c}` }}>
                  <span style={badgeStyle(sc.c + "15", sc.c)}>{sc.i} {sc.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.textBright, minWidth: 140 }}>{item.name}</span>
                  <span style={{ fontSize: 10, color: C.textMuted, minWidth: 100 }}>{item.kunde}</span>
                  <span style={{ fontSize: 11, color: C.textDim, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.lastActivity.text}</span>
                  {item.daysAtNb > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: daysColor }}>{item.daysAtNb}d</span>}
                  <span style={{ fontSize: 10, color: C.textMuted }}>{item.kwp > 0 ? `${item.kwp} kWp` : "—"}</span>
                  <span style={{ fontSize: 9, fontFamily: "'DM Mono'", color: C.textMuted }}>{item.publicId}</span>
                </div>
              );
            }

            // Karten-Ansicht
            return (
              <div key={item.id} className="item-card" onClick={() => setSelectedId(item.id)}
                style={{ ...cardStyle, marginBottom: 8, padding: "14px 18px", borderLeft: `3px solid ${sc.c}`,
                  border: `1px solid ${isUrgent ? sc.c + "25" : C.border}`,
                  background: isUrgent ? sc.c + "04" : C.bgCard }}>

                {/* Row 1: Badges + kWp + Tage */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={badgeStyle(item.source === "crm" ? "#f0d87815" : "#3b82f815", item.source === "crm" ? "#f0d878" : "#3b82f6")}>{item.source === "crm" ? "CRM" : "NA"}</span>
                  <span style={badgeStyle(sc.c + "15", sc.c)}>{sc.i} {sc.l}</span>
                  {item.tags?.map(t => <span key={t} style={{ fontSize: 8, fontWeight: 600, color: C.orange, background: C.orangeBg, padding: "1px 6px", borderRadius: 3 }}>{t}</span>)}
                  {item.azNb && <span style={{ fontSize: 9, fontFamily: "'DM Mono'", color: C.textMuted }}>Az: {item.azNb}</span>}
                  <div style={{ flex: 1 }} />
                  {item.daysAtNb > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: daysColor, background: daysColor + "10", padding: "2px 8px", borderRadius: 4 }}>
                      {item.daysAtNb}d beim NB
                    </span>
                  )}
                  {item.kwp > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>{item.kwp} kWp</span>}
                </div>

                {/* Row 2: Name + Kunde + Standort + NB */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.textBright }}>{item.name}</span>
                  <span style={{ fontSize: 11, color: C.textDim }}>· {item.kunde}</span>
                  <span style={{ fontSize: 10, color: C.textMuted }}>· {item.plz} {item.ort}</span>
                  <span style={{ fontSize: 10, color: C.textMuted }}>· {item.nb}</span>
                </div>

                {/* Row 3: Trennlinie */}
                <div style={{ height: 1, background: C.border, margin: "6px 0" }} />

                {/* Row 4: Letzte Aktivität */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 2, background: actColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: C.textDim, flex: 1 }}>{item.lastActivity.text}</span>
                  <span style={{ fontSize: 9, color: C.textMuted, fontFamily: "'DM Mono'" }}>{item.lastActivity.time}</span>
                </div>

                {/* Row 5: Nächste Aktion */}
                {item.nextAction && (
                  <div style={{ marginTop: 6, padding: "6px 10px", background: isUrgent ? sc.c + "08" : "rgba(212,168,67,0.04)", borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: isUrgent ? sc.c : C.accent }}>→</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: isUrgent ? sc.c : C.accent }}>{item.nextAction}</span>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14 }}>Keine Projekte in dieser Ansicht</div>
            </div>
          )}
        </div>
      </div>

      {/* Detail-Panel Placeholder */}
      </>}
      {selectedId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setSelectedId(null)}>
          <div style={{ ...cardStyle, padding: "32px 40px", maxWidth: 500, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textBright, marginBottom: 8 }}>Detail-Panel</div>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 16 }}>
              In der echten Implementierung öffnet sich hier das vollständige Detail-Panel mit Verlauf, Kommentaren, Dokumenten etc.
            </div>
            <div style={{ fontSize: 11, color: C.accent, fontFamily: "'DM Mono'" }}>
              {ITEMS.find(i => i.id === selectedId)?.publicId}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
