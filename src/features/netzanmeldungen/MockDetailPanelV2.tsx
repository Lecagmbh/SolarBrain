/**
 * Mock Detail Panel V2 — Full-Width Layout, keine Sidebar
 * Stammdaten in Übersicht, "Alle Daten" als Button/Modal
 * Route: /mock/detail-v2
 */
import { useState, useEffect, useRef } from "react";

// Design System
const C = {
  bg: "#060b18", card: "rgba(17,20,35,0.95)", panel: "#081020",
  border: "rgba(212,168,67,0.08)", borderLight: "rgba(255,255,255,0.05)",
  text: "#e2e8f0", dim: "#64748b", muted: "#94a3b8", bright: "#f8fafc",
  accent: "#D4A843", accentLight: "#a5b4fc",
  blue: "#3b82f6", green: "#22c55e", orange: "#f97316", red: "#ef4444",
  cyan: "#06b6d4", purple: "#f0d878", pink: "#ec4899", amber: "#f59e0b",
};

const css = `
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes modalIn{from{opacity:0;transform:scale(0.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes backdropIn{from{opacity:0}to{opacity:1}}
@keyframes progressFill{from{width:0}to{width:var(--fill)}}
.fade-in{animation:fadeIn .25s ease both}
.slide-up{animation:slideUp .3s ease both}
.card-hover{transition:all .18s ease}.card-hover:hover{border-color:rgba(212,168,67,0.2)!important;transform:translateY(-1px);box-shadow:0 4px 24px rgba(0,0,0,0.35)}
.btn-hover{transition:all .15s ease}.btn-hover:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.3)}
.tab-btn{transition:all .15s ease;cursor:pointer;border:none;background:none;position:relative;font-family:'DM Sans',sans-serif}
.tab-btn:hover{color:#e2e8f0!important}
.tab-btn.active::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:#D4A843;border-radius:2px 2px 0 0}
.copy-field{transition:background .15s ease;border-radius:4px}.copy-field:hover{background:rgba(212,168,67,0.04)!important}
.email-row{transition:all .15s ease;cursor:pointer;border-radius:10px}.email-row:hover{background:rgba(212,168,67,0.05)!important;transform:translateX(2px)}
.doc-card-hover{transition:all .2s ease;cursor:pointer}.doc-card-hover:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.4)!important;border-color:rgba(212,168,67,0.25)!important}
.chip-btn{transition:all .12s ease;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}.chip-btn:hover{background:rgba(212,168,67,0.15)!important;color:#a5b4fc!important}
.timeline-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:5px}
@media(max-width:1024px){.uebersicht-grid{grid-template-columns:1fr!important}.uebersicht-stamm{grid-template-columns:1fr 1fr!important}.tech-grid{grid-template-columns:1fr!important}}
@media(max-width:850px){.uebersicht-stamm{grid-template-columns:1fr!important}}
@media(max-width:768px){.tab-btn{padding:10px 12px!important;font-size:12px!important}.v2-header-row1{flex-wrap:wrap;gap:8px!important}.v2-header-info{min-width:0!important}.v2-header-actions{width:100%;justify-content:flex-end}.v2-content{padding:12px!important}.v2-quick-grid{grid-template-columns:1fr!important}}
@media(max-width:480px){.tab-btn{padding:8px 8px!important;font-size:11px!important;gap:3px!important}.tab-btn span:first-child{display:none}.v2-lifecycle{display:none}.v2-header-kpi{font-size:14px!important}}
`;

// Live-Daten Brücke: Funktion statt Konstante — wird bei jedem Render frisch gelesen
function getLive() {
  return (window as any).__LIVE_DETAIL as { data: any; emails: any[]; activities: any[]; docs: any[]; comments: any[]; isStaff: boolean; installationId: number; isLive: boolean } | undefined;
}

// Mock Data — ALL fields from Wizard, Factro, CRM (Fallback wenn keine Live-Daten)
const MOCK_FALLBACK = {
  // Anlagenbetreiber (Step 6 Wizard + CRM anlagenbetreiber)
  betreiber: { vorname: "Max", nachname: "Müller", typ: "Privat", anrede: "Herr", strasse: "Hauptstraße", hausnr: "15", plz: "79100", ort: "Freiburg", email: "max.mueller@gmail.com", telefon: "+49 761 12345678", mobil: "", geburtsdatum: "15.03.1985", iban: "", firma: "", vertreter: "" },
  // Anlagenstandort (Step 2 Wizard + Factro)
  standort: { strasse: "Hauptstraße", hausnr: "15", plz: "79100", ort: "Freiburg", bundesland: "Baden-Württemberg", land: "DE", gemarkung: "Freiburg", flur: "12", flurstuck: "1234/5", gps: "47.99590, 7.84961", googleMapsLink: "https://maps.google.com/?q=47.99590,7.84961", istEigentuemer: true, zustimmungVorhanden: true },
  // Technische Daten (Step 5 Wizard — technical_data JSON)
  anlage: {
    kwp: "12.40", totalInverterKva: "13.2", totalBatteryKwh: "10",
    // PV-Einträge (pvEntries) — pro Dachfläche
    pvEntries: [
      { roofName: "Süddach", manufacturer: "JA Solar", model: "JAM54S30-460/MR", count: 20, powerWp: 460, orientation: "S", tilt: 30, enabled: true },
      { roofName: "Ostdach", manufacturer: "JA Solar", model: "JAM54S30-460/MR", count: 8, powerWp: 460, orientation: "O", tilt: 25, enabled: true },
    ],
    // Wechselrichter (inverterEntries)
    inverterEntries: [
      { manufacturer: "Huawei", model: "SUN2000-12KTL-M5", powerKva: 13.2, acPowerKw: 12, count: 1, zerezId: "ZR-2024-HW-12KTL", hybrid: false },
    ],
    // Speicher (batteryEntries)
    batteryEntries: [
      { manufacturer: "Huawei", model: "LUNA2000-10-S0", capacityKwh: 10, count: 1, coupling: "DC", batteryType: "LiFePO4", ladeleistungKw: 5, entladeleistungKw: 5, enabled: true },
    ],
    // Wallbox (wallboxEntries)
    wallboxEntries: [
      { manufacturer: "ABL", model: "eMH3", powerKw: 11, count: 1, phasen: 3, stecker: "Typ 2", steuerbar14a: true },
    ],
    // Wärmepumpe (waermepumpeEntries) — leer in diesem Fall
    waermepumpeEntries: [] as { manufacturer: string; model: string; powerKw: number; cop: number; count: number; sgReady: boolean; steuerbar14a: boolean }[],
    // Anlagenparameter (Step 5)
    systemTyp: "" as string, // Schwarmspeicher, Großbatteriespeicher, oder leer für PV
    einspeisung: "Überschuss", einspeisephasen: "3-phasig", messkonzept: "ZR2", betriebsweise: "Netzparallel",
    blindleistungskompensation: "cos φ = 1", einspeisemanagement: "70% Regelung",
    netzebene: "Niederspannung", begrenzungProzent: "70",
    inselbetrieb: false, naSchutzErforderlich: false, paragraph14a: true,
  },
  // Zähler (Step 4 Wizard)
  zaehler: { nummer: "1EMH0012345678", typ: "Drehstromzähler", standort: "Keller, HAK links", befestigung: "Dreipunkt", tarif: "Einzeltarif", besitzer: "Netzbetreiber", zaehlpunkt: "DE000561234560000000000000012345", marktlokation: "DE00056123456000000000000001234500", standBezug: "42350", standEinspeisung: "0", ablesedatum: "2026-02-27", fernauslesung: true, smartMeterGateway: false, imsysGewuenscht: false, wandlermessung: false },
  // Zähler-Bestand (bestehende Zähler, Step 4)
  zaehlerBestand: [
    { id: "z1", zaehlernummer: "1EMH0012345678", typ: "Einrichtungszähler", standort: "Keller, HAK links", tarifart: "Einzeltarif", verwendung: "Haushalt", aktion: "abmelden" as string, letzterStand: 42350, ablesedatum: "27.02.2026", zaehlpunktbezeichnung: "DE000561234560000000000000012345", marktlokationsId: "DE00056123456000000000000001234500" },
    { id: "z2", zaehlernummer: "1EMH0098765432", typ: "Drehstromzähler", standort: "Keller, HAK rechts", tarifart: "HT/NT", verwendung: "Wärmepumpe (alt)", aktion: "behalten" as string, letzterStand: 8120, ablesedatum: "27.02.2026", zaehlpunktbezeichnung: "", marktlokationsId: "" },
  ],
  // Zähler-Neu (gewünschter neuer Zähler, Step 4)
  zaehlerNeu: { gewuenschterTyp: "Zweirichtungszähler", standort: "Keller, HAK links", befestigung: "Dreipunktbefestigung", tarifart: "Einzeltarif", wandlermessung: false, wandlerFaktor: "", bemerkungen: "Platz für 2 Zählerfelder vorhanden" },
  // Netzbetreiber (automatisch zugeordnet)
  nb: { name: "Stadtwerke Freiburg", email: "netzanschluss@sw-freiburg.de", portal: "https://netze.sw-freiburg.de", az: "SNB-2026-14832", eingereichtAm: "02.03.2026", genehmigungAm: "", rueckfrageText: "Datenblatt Speicher + Symmetrienachweis fehlen", rueckfrageAm: "10.03.2026", rueckfrageBeantwortet: false, daysAtNb: 8 },
  // MaStR & IBN (Step 8 Wizard + Post-Processing)
  mastr: { nrSolar: "", nrSpeicher: "", status: "Nicht registriert", syncAm: "" },
  ibn: { erledigt: false, erledigtAm: "", geplantAm: "", status: "", eegDatum: "", protokollUrl: "", mastrRegistered: false, gridOperatorNotified: false },
  // Abrechnung (Backend)
  rechnung: { gestellt: false, nummer: "", datum: "", betrag: "", bezahlt: false, bezahltAm: "" },
  // Wizard-Meta (Step 1 + 3 + 8)
  wizard: { caseType: "NEUBAU", processType: "neuanmeldung", registrationTargets: ["PV", "SPEICHER", "WALLBOX"], createCustomerPortal: false, vollmachtErteilt: true, agbAkzeptiert: true, datenschutzAkzeptiert: true, mastrVoranmeldung: false, priority: "P2" },
  // Factro-Felder (wenn von Factro synchronisiert)
  factro: { projectId: "FP-2026-0042", number: "42", taskState: "In Bearbeitung", datenraumLink: "https://datenraum.example.de/proj42", firmenname: "Sol-Living GmbH", eingangDatum: "27.02.2026" },
  // CRM-Felder (wenn verknüpft)
  crm: { id: 99, titel: "PV-Neuanlage Müller 12.4 kWp", stage: "NB_KOMMUNIKATION", quelle: "EMPFEHLUNG", quelleDetail: "Über Installateur Kulla", geschaetzterWert: "18.500 €", prioritaet: "NORMAL", tags: ["Solar", "Speicher", "Wallbox"], hvName: "", zustaendiger: "Christian Z." },
  // System
  dedicatedEmail: "inst-2186@na.lecagmbh.de",
  publicId: "INST-2186",
  createdAt: "27.02.2026 14:00",
  createdByName: "Fabian Kulla",
  createdByRole: "KUNDE",
  assignedToName: "",
};

// MOCK wird als let deklariert und bei jedem Render aktualisiert (siehe useDataBridge)
let MOCK: typeof MOCK_FALLBACK = MOCK_FALLBACK;

const MOCK_EMAILS_FALLBACK = [
  { id: 1, dir: "out", subj: "Netzanschlussantrag PV 12.40 kWp — Max Müller", from: "netzanmeldung@lecagmbh.de", to: "netzanschluss@sw-freiburg.de", date: "02.03.2026 09:14", preview: "Sehr geehrte Damen und Herren, hiermit stellen wir den Netzanschlussantrag...", body: "Sehr geehrte Damen und Herren,\n\nhiermit stellen wir den Netzanschlussantrag für folgende Anlage:\n\nAnlagenbetreiber: Herr Max Müller\nHauptstraße 15, 79100 Freiburg\n\nPV-Leistung: 12.40 kWp\nModule: 28× JA Solar JAM54S30-460/MR\nWechselrichter: 1× Huawei SUN2000-12KTL-M5\n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG", files: ["E1_Antrag.pdf", "E2_Datenblatt.pdf", "Lageplan.pdf"] },
  { id: 2, dir: "in", subj: "AW: Netzanschlussantrag — Eingangsbestätigung", from: "netzanschluss@sw-freiburg.de", to: "inst-2186@na.lecagmbh.de", date: "03.03.2026 11:42", preview: "Vielen Dank für Ihren Antrag. Wir bestätigen den Eingang...", body: "Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihren Netzanschlussantrag.\n\nAktenzeichen: SNB-2026-14832\n\nMit freundlichen Grüßen\nStadtwerke Freiburg", files: [] },
  { id: 3, dir: "in", subj: "Rückfrage: Fehlende Unterlagen — SNB-2026-14832", from: "netzanschluss@sw-freiburg.de", to: "inst-2186@na.lecagmbh.de", date: "10.03.2026 14:08", preview: "Zur Bearbeitung benötigen wir noch das Datenblatt des Speichers...", body: "Sehr geehrte Damen und Herren,\n\nzur weiteren Bearbeitung benötigen wir:\n\n- Datenblatt des Batteriespeichers (Huawei LUNA2000-10-S0)\n- Symmetrienachweis\n\nBitte innerhalb 14 Tagen nachreichen.\n\nM. Schmidt\nStadtwerke Freiburg", files: [] },
];

let MOCK_EMAILS: typeof MOCK_EMAILS_FALLBACK = MOCK_EMAILS_FALLBACK;

const MOCK_ACTIVITIES_FALLBACK = [
  { id: 1, icon: "📨", text: "Rückfrage von Stadtwerke Freiburg eingegangen", date: "10.03.2026 14:08", type: "email" },
  { id: 2, icon: "🔄", text: "Status: Beim NB → Rückfrage", date: "10.03.2026 14:10", type: "status" },
  { id: 3, icon: "💬", text: "KI: Datenblatt Speicher + Symmetrienachweis fehlen", date: "10.03.2026 14:11", type: "comment" },
  { id: 4, icon: "📨", text: "Eingangsbestätigung von SW Freiburg", date: "03.03.2026 11:42", type: "email" },
  { id: 5, icon: "📤", text: "Netzanschlussantrag versendet", date: "02.03.2026 09:14", type: "email" },
  { id: 6, icon: "📄", text: "E.1 + E.2 generiert", date: "01.03.2026 16:30", type: "document" },
  { id: 7, icon: "✅", text: "Lageplan hochgeladen", date: "28.02.2026 10:15", type: "document" },
  { id: 8, icon: "🆕", text: "Installation erstellt", date: "27.02.2026 14:00", type: "system" },
];

let MOCK_ACTIVITIES: typeof MOCK_ACTIVITIES_FALLBACK = MOCK_ACTIVITIES_FALLBACK;

const MOCK_DOCS_FALLBACK = [
  { id: 1, name: "E.1 Antragstellung", type: "vde", status: "generated", date: "01.03.2026" },
  { id: 2, name: "E.2 Datenblatt EZE", type: "vde", status: "generated", date: "01.03.2026" },
  { id: 3, name: "E.3 Netzsicherheit", type: "vde", status: "draft", date: "01.03.2026" },
  { id: 4, name: "Lageplan", type: "pflicht", status: "uploaded", date: "28.02.2026" },
  { id: 5, name: "Übersichtsschaltplan", type: "pflicht", status: "uploaded", date: "01.03.2026" },
  { id: 6, name: "Datenblatt Module", type: "pflicht", status: "uploaded", date: "28.02.2026" },
  { id: 7, name: "Datenblatt WR", type: "pflicht", status: "uploaded", date: "28.02.2026" },
  { id: 8, name: "Datenblatt Speicher", type: "pflicht", status: "missing", date: "" },
  { id: 9, name: "Konformitätserklärung WR", type: "pflicht", status: "uploaded", date: "28.02.2026" },
  { id: 10, name: "Vollmacht", type: "pflicht", status: "uploaded", date: "27.02.2026" },
];

let MOCK_DOCS: typeof MOCK_DOCS_FALLBACK = MOCK_DOCS_FALLBACK;

const MOCK_COMMENTS_FALLBACK = [
  { id: 1, author: "KI-Assistent", text: "Rückfrage erkannt: Datenblatt Speicher + Symmetrienachweis fehlen.", date: "10.03.2026 14:11", source: "ki" },
  { id: 2, author: "Christian Z.", text: "Datenblatt wird nachgeliefert, Symmetrienachweis erstelle ich.", date: "10.03.2026 15:30", source: "manual" },
  { id: 3, author: "System", text: "Netzanschlussantrag versendet an netzanschluss@sw-freiburg.de", date: "02.03.2026 09:14", source: "system" },
];

let MOCK_COMMENTS: typeof MOCK_COMMENTS_FALLBACK = MOCK_COMMENTS_FALLBACK;

const LIFECYCLE = [
  { key: "eingang", label: "Eingang", short: "E" },
  { key: "beim_nb", label: "Beim NB", short: "NB" },
  { key: "rueckfrage", label: "Rückfrage", short: "❗" },
  { key: "genehmigt", label: "Genehmigt", short: "✓" },
  { key: "ibn", label: "IBN", short: "⚡" },
  { key: "fertig", label: "Fertig", short: "🏁" },
];

function getCurrentStep(): number {
  const raw = getLive()?.data?._raw;
  if (!raw) return 2; // Mock default
  const s = (raw.status || raw.statusLabel || "").toLowerCase().replace(/-/g, "_");
  // Rückfrage-Erkennung
  if (raw.nbRueckfrageText && !raw.nbRueckfrageBeantwortet) return 2;
  const map: Record<string, number> = {
    eingang: 0, entwurf: 0, draft: 0,
    in_bearbeitung: 1, beim_nb: 1, eingereicht: 1,
    rueckfrage: 2,
    genehmigt: 3, genehmigung: 3,
    ibn: 4, inbetriebnahme: 4,
    fertig: 5, abgeschlossen: 5, completed: 5,
    storniert: 0, abgelehnt: 0,
  };
  return map[s] ?? 0;
}

const cardS: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" };

// ─── Reusable Components ─────────────────────────────────────────────────────

function CopyRow({ label, value, mono, important }: { label: string; value: string; mono?: boolean; important?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!value || value === "—") return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderBottom: `1px solid ${C.borderLight}` }}>
      <span style={{ fontSize: 13, color: C.dim }}>{label}</span><span style={{ fontSize: 13, color: "#374151" }}>—</span>
    </div>
  );
  return (
    <div className="copy-field" style={{ display: "flex", alignItems: "center", padding: "5px 10px", borderBottom: `1px solid ${C.borderLight}`, gap: 8, ...(copied ? { background: "rgba(34,197,94,0.04)" } : {}) }}>
      <span style={{ fontSize: 12, color: C.dim, flexShrink: 0, minWidth: 70, maxWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 13, color: copied ? C.green : (important ? C.bright : C.text), fontWeight: important ? 600 : 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color .15s", ...(mono ? { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: copied ? C.green : C.accentLight } : {}) }}>
        {copied ? "✓ Kopiert" : value}
      </span>
      <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        style={{ background: copied ? "rgba(34,197,94,0.12)" : "rgba(212,168,67,0.06)", border: `1px solid ${copied ? "rgba(34,197,94,0.2)" : "rgba(212,168,67,0.08)"}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, color: copied ? C.green : C.accentLight, cursor: "pointer", transition: "all .15s", flexShrink: 0, opacity: copied ? 1 : 0.7 }}
        onMouseEnter={e => { (e.target as HTMLElement).style.opacity = "1"; }}
        onMouseLeave={e => { if (!copied) (e.target as HTMLElement).style.opacity = "0.7"; }}
      >{copied ? "✓" : "📋"}</button>
    </div>
  );
}

function StammCard({ icon, title, children, highlight }: { icon: string; title: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="card-hover" style={{ ...cardS, ...(highlight ? { borderColor: C.orange + "30", borderLeft: `3px solid ${C.orange}` } : {}) }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: 8, background: highlight ? "rgba(249,115,22,0.04)" : "rgba(255,255,255,0.01)" }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: highlight ? C.orange : C.bright }}>{title}</span>
      </div>
      <div style={{ padding: "2px 4px" }}>{children}</div>
    </div>
  );
}

// Status-Keys für API
const STATUS_API_MAP: Record<string, string> = {
  eingang: "eingang", beim_nb: "beim_nb", rueckfrage: "rueckfrage",
  genehmigt: "genehmigt", ibn: "ibn", fertig: "fertig",
};

// Transitions die einen Dokument-Upload erfordern
const REQUIRED_UPLOAD_TRANSITIONS: Record<string, { label: string; docType: string }> = {
  "eingang_beim_nb": { label: "Anmeldebestätigung hochladen", docType: "ANMELDEBESTAETIGUNG" },
  "genehmigt_ibn": { label: "Genehmigungsbescheid hochladen", docType: "GENEHMIGUNG" },
};

function LifecycleBar({ onStatusChange }: { onStatusChange?: (newStatus: string) => void }) {
  const currentStep = getCurrentStep();
  const isRueckfrage = currentStep === 2;
  const live = getLive();
  const isAdmin = live?.isStaff || false;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%", padding: "0 4px" }}>
      {LIFECYCLE.map((step, i) => {
        const isPast = i < currentStep;
        const isCurrent = i === currentStep;
        const isLast = i === LIFECYCLE.length - 1;
        const isNext = i === currentStep + 1;
        const currentColor = isRueckfrage && isCurrent ? C.red : isCurrent ? C.blue : "";
        const canClick = isAdmin && onStatusChange && (isNext || (i > currentStep && isPast === false));

        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
            <div
              onClick={canClick ? () => onStatusChange(step.key) : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6,
                background: isCurrent ? `${currentColor}18` : isPast ? "rgba(34,197,94,0.06)" : "transparent",
                border: `1px solid ${isCurrent ? `${currentColor}30` : isPast ? "rgba(34,197,94,0.12)" : isNext && isAdmin ? "rgba(212,168,67,0.2)" : "transparent"}`,
                cursor: canClick ? "pointer" : "default",
                transition: "all .15s",
                ...(isNext && isAdmin ? { background: "rgba(212,168,67,0.04)" } : {}),
              }}
              onMouseEnter={e => { if (canClick) { (e.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.12)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,168,67,0.4)"; } }}
              onMouseLeave={e => { if (canClick) { (e.currentTarget as HTMLElement).style.background = isNext ? "rgba(212,168,67,0.04)" : "transparent"; (e.currentTarget as HTMLElement).style.borderColor = isNext ? "rgba(212,168,67,0.2)" : "transparent"; } }}
              title={canClick ? `Klicken: Status auf "${step.label}" setzen` : ""}
            >
              <span style={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, background: isCurrent ? currentColor : isPast ? C.green : isNext && isAdmin ? C.accent + "30" : "rgba(255,255,255,0.06)", color: isCurrent || isPast ? "#fff" : isNext && isAdmin ? C.accentLight : C.dim }}>
                {isPast ? "✓" : isNext && isAdmin ? "→" : step.short}
              </span>
              <span style={{ fontSize: 12, fontWeight: isCurrent ? 700 : isNext && isAdmin ? 600 : 500, color: isCurrent ? currentColor : isPast ? C.green : isNext && isAdmin ? C.accentLight : C.dim, whiteSpace: "nowrap" }}>{step.label}</span>
            </div>
            {!isLast && <div style={{ flex: 1, height: 2, minWidth: 12, background: isPast ? `linear-gradient(90deg, ${C.green}, ${i + 1 <= currentStep ? C.green : C.dim}40)` : "rgba(255,255,255,0.06)", margin: "0 2px", borderRadius: 1 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Status-Wechsel Modal mit optionalem Pflicht-Upload ─────────────────────

function StatusChangeModal({ open, onClose, targetStatus, installationId, currentStatus, onSuccess }: {
  open: boolean; onClose: () => void; targetStatus: string; installationId: number; currentStatus: string; onSuccess: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const transitionKey = `${currentStatus}_${targetStatus}`;
  const requiredUpload = REQUIRED_UPLOAD_TRANSITIONS[transitionKey];
  const targetLabel = LIFECYCLE.find(l => l.key === targetStatus)?.label || targetStatus;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    if (e.dataTransfer.files[0]) setUploadedFile(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setUploadedFile(e.target.files[0]);
  };

  const handleConfirm = async () => {
    if (requiredUpload && !uploadedFile) { setError("Bitte Dokument hochladen"); return; }
    setChanging(true); setError(null);

    try {
      const token = localStorage.getItem("baunity_token") || "";
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Dokument hochladen wenn nötig
      if (uploadedFile && installationId) {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("kategorie", requiredUpload?.docType || "SONSTIGES");
        const uploadResp = await fetch(`/api/installations/${installationId}/documents`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` }, credentials: "include", body: formData,
        });
        if (!uploadResp.ok) {
          const err = await uploadResp.json().catch(() => ({}));
          throw new Error(err.error || "Upload fehlgeschlagen");
        }
      }

      // 2. Status ändern
      const statusResp = await fetch(`/api/installations/${installationId}`, {
        method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ status: STATUS_API_MAP[targetStatus] || targetStatus }),
      });

      if (!statusResp.ok) {
        const err = await statusResp.json().catch(() => ({}));
        throw new Error(err.error || `Status-Wechsel fehlgeschlagen (${statusResp.status})`);
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setChanging(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />
      <div style={{ position: "relative", width: 520, background: "rgba(15,15,30,0.98)", border: "1px solid rgba(212,168,67,0.15)", borderRadius: 20, boxShadow: "0 24px 80px rgba(0,0,0,0.6)", animation: "modalIn .25s ease", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>Status ändern → {targetLabel}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Installation #{installationId}</div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 28px" }}>
          {/* Pflicht-Upload */}
          {requiredUpload && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", marginBottom: 8 }}>
                📄 {requiredUpload.label} <span style={{ color: "#ef4444" }}>*</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                {transitionKey === "eingang_beim_nb"
                  ? "Die Anmeldebestätigung wird an den Kunden versendet (nicht an den Endkunden ohne Zustimmung!)."
                  : "Der Genehmigungsbescheid wird an den Kunden versendet (nicht an den Endkunden ohne Zustimmung!)."}
              </div>
              <div
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragActive ? "#D4A843" : uploadedFile ? "#22c55e" : "rgba(212,168,67,0.2)"}`,
                  borderRadius: 14, padding: "24px 16px", textAlign: "center",
                  background: dragActive ? "rgba(212,168,67,0.06)" : uploadedFile ? "rgba(34,197,94,0.04)" : "rgba(212,168,67,0.02)",
                  cursor: "pointer", transition: "all .2s",
                }}
                onClick={() => document.getElementById("status-file-input")?.click()}
              >
                <input id="status-file-input" type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={handleFileSelect} />
                {uploadedFile ? (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#22c55e" }}>{uploadedFile.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{(uploadedFile.size / 1024).toFixed(0)} KB — Klicken um zu ändern</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Dokument hier ablegen</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>oder klicken zum Auswählen (PDF, PNG, JPG)</div>
                  </>
                )}
              </div>
              <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ fontSize: 11, color: "#f97316" }}>Email geht an den <strong>Kunden</strong> (Installateur) — NIEMALS an den Endkunden ohne Consent!</span>
              </div>
            </div>
          )}

          {!requiredUpload && (
            <div style={{ padding: "16px 0", fontSize: 14, color: "#e2e8f0", lineHeight: 1.6 }}>
              Status wird von <strong>{LIFECYCLE.find(l => l.key === currentStatus)?.label || currentStatus}</strong> auf <strong style={{ color: "#D4A843" }}>{targetLabel}</strong> geändert.
              {targetStatus === "storniert" && <div style={{ marginTop: 8, color: "#ef4444", fontWeight: 600 }}>⚠ Stornierung kann nicht rückgängig gemacht werden!</div>}
            </div>
          )}

          {/* Error */}
          {error && <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#ef4444", fontSize: 12, marginTop: 12 }}>✗ {error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 20px", fontSize: 13, color: "#94a3b8", cursor: "pointer" }}>Abbrechen</button>
          <button onClick={handleConfirm} disabled={changing || (!!requiredUpload && !uploadedFile)} style={{
            background: changing ? "#475569" : requiredUpload && !uploadedFile ? "#1e1e3a" : "#D4A843", color: "#fff", border: "none",
            borderRadius: 12, padding: "10px 24px", fontSize: 14, fontWeight: 700,
            cursor: (changing || (requiredUpload && !uploadedFile)) ? "default" : "pointer",
            opacity: (requiredUpload && !uploadedFile) ? 0.4 : 1,
          }}>
            {changing ? "Wird geändert..." : `→ ${targetLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, subtitle, width = 800, children }: { open: boolean; onClose: () => void; title: string; subtitle?: string; width?: number; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", animation: "backdropIn .2s ease both" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }} />
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width, maxWidth: "95vw", maxHeight: "85vh", background: "linear-gradient(180deg, #141828 0%, #0f1220 100%)", border: `1px solid ${C.accent}20`, borderRadius: 20, boxShadow: `0 32px 80px rgba(0,0,0,0.8)`, overflow: "hidden", display: "flex", flexDirection: "column", animation: "modalIn .3s cubic-bezier(0.16,1,0.3,1) both" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid rgba(255,255,255,0.06)`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} className="btn-hover" style={{ background: "rgba(239,68,68,0.06)", color: C.red, border: `1px solid rgba(239,68,68,0.12)`, borderRadius: 8, padding: "7px 16px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Schließen</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── "Alle Daten" Modal ──────────────────────────────────────────────────────

function AlleDatenModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const d = MOCK;

  const copyAll = () => {
    const pvLines = d.anlage.pvEntries.map((pv: any) => `  ${pv.roofName || "Dach"}: ${pv.count}× ${pv.manufacturer} ${pv.model} (${pv.powerWp} Wp) → ${((pv.count||0)*(pv.powerWp||0)/1000).toFixed(2)} kWp | ${pv.orientation || "—"} ${pv.tilt ? pv.tilt + "°" : ""}`);
    const wrLines = d.anlage.inverterEntries.map((wr: any) => `  ${wr.count}× ${wr.manufacturer} ${wr.model} (${wr.acPowerKw} kW / ${wr.powerKva} kVA)${wr.zerezId ? ` | ZEREZ: ${wr.zerezId}` : ""}${wr.hybrid ? " | Hybrid" : ""}`);
    const batLines = d.anlage.batteryEntries.map((b: any) => `  ${b.count}× ${b.manufacturer} ${b.model} (${((b.count||1)*b.capacityKwh).toFixed(1)} kWh gesamt, je ${b.capacityKwh} kWh, ${(b.coupling||"").toUpperCase()}) | ${b.batteryType || "—"} | Lade: ${b.ladeleistungKw || "—"} kW / Entlade: ${b.entladeleistungKw || "—"} kW`);
    const wbLines = d.anlage.wallboxEntries.map((wb: any) => `  ${wb.manufacturer} ${wb.model} (${wb.powerKw} kW, ${wb.phasen}-phasig, ${wb.stecker || "Typ 2"}) | §14a: ${wb.steuerbar14a ? "Ja" : "Nein"}`);
    const wpLines = d.anlage.waermepumpeEntries.map((wp: any) => `  ${wp.manufacturer} ${wp.model} (${wp.powerKw} kW) | SG Ready: ${wp.sgReady ? "Ja" : "Nein"} | §14a: ${wp.steuerbar14a ? "Ja" : "Nein"}`);
    const lines = [
      `═══ ANLAGENBETREIBER ═══`,
      `${d.betreiber.anrede} ${d.betreiber.vorname} ${d.betreiber.nachname}`.trim(),
      d.betreiber.firma ? `Firma: ${d.betreiber.firma}` : "",
      `${d.betreiber.strasse} ${d.betreiber.hausnr}, ${d.betreiber.plz} ${d.betreiber.ort}`,
      `E-Mail: ${d.betreiber.email} | Tel: ${d.betreiber.telefon}`,
      d.betreiber.geburtsdatum ? `Geb: ${d.betreiber.geburtsdatum}` : "",
      d.dedicatedEmail ? `Inst.-Email: ${d.dedicatedEmail}` : "",
      `ID: ${d.publicId}`,
      ``,
      `═══ ANLAGENSTANDORT ═══`,
      `${d.standort.strasse} ${d.standort.hausnr}, ${d.standort.plz} ${d.standort.ort}`,
      d.standort.bundesland ? `Bundesland: ${d.standort.bundesland}` : "",
      d.standort.gemarkung ? `Gemarkung: ${d.standort.gemarkung} | Flur: ${d.standort.flur} | Flurstück: ${d.standort.flurstuck}` : "",
      d.standort.gps ? `GPS: ${d.standort.gps}` : "",
      d.standort.istEigentuemer === true ? "Eigentümer: Ja" : d.standort.istEigentuemer === false ? `Eigentümer: Nein | Zustimmung: ${d.standort.zustimmungVorhanden ? "Vorhanden" : "Fehlt"}` : "",
      ``,
      `═══ TECHNISCHE DATEN ═══`,
      `Gesamt: ${d.anlage.kwp} kWp | ${d.anlage.totalInverterKva} kVA | ${d.anlage.totalBatteryKwh} kWh`,
      ``,
      `PV-Module (${d.anlage.pvEntries.length} Dachflächen):`, ...pvLines,
      ``,
      `Wechselrichter (${d.anlage.inverterEntries.length}):`, ...wrLines,
      ...(batLines.length > 0 ? [``, `Speicher (${d.anlage.batteryEntries.length}):`, ...batLines] : []),
      ...(wbLines.length > 0 ? [``, `Wallbox:`, ...wbLines] : []),
      ...(wpLines.length > 0 ? [``, `Wärmepumpe:`, ...wpLines] : []),
      ``,
      `Einspeisung: ${d.anlage.einspeisung} | Messkonzept: ${d.anlage.messkonzept}`,
      `Betriebsweise: ${d.anlage.betriebsweise} | Netzebene: ${d.anlage.netzebene}`,
      d.anlage.blindleistungskompensation ? `Blindleistung: ${d.anlage.blindleistungskompensation}` : "",
      d.anlage.einspeisemanagement ? `Einspeisemanagement: ${d.anlage.einspeisemanagement}` : "",
      d.anlage.begrenzungProzent ? `Begrenzung: ${d.anlage.begrenzungProzent}%` : "",
      `§14a: ${d.anlage.paragraph14a ? "Ja" : "Nein"} | NA-Schutz: ${d.anlage.naSchutzErforderlich ? "Erforderlich" : "Nein"}`,
      ``,
      `═══ ZÄHLER ═══`,
      `Nr: ${d.zaehler.nummer} | Typ: ${d.zaehler.typ}`,
      `Standort: ${d.zaehler.standort} | Tarif: ${d.zaehler.tarif}`,
      d.zaehler.zaehlpunkt ? `ZPB: ${d.zaehler.zaehlpunkt}` : "",
      d.zaehler.marktlokation ? `MLO: ${d.zaehler.marktlokation}` : "",
      `Fernauslesung: ${d.zaehler.fernauslesung ? "Ja" : "Nein"} | Smart Meter: ${d.zaehler.smartMeterGateway ? "Ja" : "Nein"} | iMSys: ${d.zaehler.imsysGewuenscht ? "Ja" : "Nein"}`,
      ``,
      `═══ NETZBETREIBER ═══`,
      `${d.nb.name}`,
      d.nb.email ? `Email: ${d.nb.email}` : "", d.nb.az ? `Az: ${d.nb.az}` : "",
      d.nb.portal ? `Portal: ${d.nb.portal}` : "",
      `Eingereicht: ${d.nb.eingereichtAm || "—"} | Genehmigt: ${d.nb.genehmigungAm || "—"}`,
      d.nb.daysAtNb > 0 ? `Wartezeit: ${d.nb.daysAtNb} Tage` : "",
      d.nb.rueckfrageText ? `Rückfrage: ${d.nb.rueckfrageText} (${d.nb.rueckfrageAm})` : "",
      ``,
      `═══ SYSTEM ═══`,
      `Falltyp: ${d.wizard.caseType} | Komponenten: ${d.wizard.registrationTargets.join(", ")}`,
      `Erstellt: ${d.createdAt} von ${d.createdByName} (${d.createdByRole})`,
      `Vollmacht: ${d.wizard.vollmachtErteilt ? "Erteilt" : "Fehlt"} | AGB: ${d.wizard.agbAkzeptiert ? "Ja" : "Nein"}`,
      d.mastr.nrSolar ? `MaStR Solar: ${d.mastr.nrSolar}` : "", d.mastr.nrSpeicher ? `MaStR Speicher: ${d.mastr.nrSpeicher}` : "",
      d.factro.projectId ? `Factro: #${d.factro.number} — ${d.factro.taskState}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines);
    setCopiedAll(true); setTimeout(() => setCopiedAll(false), 3000);
  };

  return (
    <Modal open={open} onClose={onClose} title="Alle Daten — Zusammengefasst" subtitle={`${d.publicId} · ${d.betreiber.vorname} ${d.betreiber.nachname} · ${d.anlage.kwp} kWp`} width={900}>
      <div style={{ marginBottom: 16 }}>
        <button onClick={copyAll} className="btn-hover" style={{ background: copiedAll ? C.green : C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%" }}>
          {copiedAll ? "✓ Alles in Zwischenablage kopiert!" : "📋 Alle Daten kopieren"}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <StammCard icon="👤" title="Anlagenbetreiber">
          <CopyRow label="Anrede" value={d.betreiber.anrede} />
          <CopyRow label="Vorname" value={d.betreiber.vorname} important />
          <CopyRow label="Nachname" value={d.betreiber.nachname} important />
          {d.betreiber.firma && <CopyRow label="Firma" value={d.betreiber.firma} important />}
          {d.betreiber.vertreter && <CopyRow label="Vertreter" value={d.betreiber.vertreter} />}
          <CopyRow label="Straße" value={d.betreiber.strasse} important />
          <CopyRow label="Hausnr." value={d.betreiber.hausnr} important />
          <CopyRow label="PLZ" value={d.betreiber.plz} important />
          <CopyRow label="Ort" value={d.betreiber.ort} important />
          <CopyRow label="Email" value={d.betreiber.email} mono />
          <CopyRow label="Telefon" value={d.betreiber.telefon} />
          {d.betreiber.mobil && <CopyRow label="Mobil" value={d.betreiber.mobil} />}
          <CopyRow label="Geburtsdatum" value={d.betreiber.geburtsdatum} />
          {d.betreiber.iban && <CopyRow label="IBAN" value={d.betreiber.iban} mono />}
          <CopyRow label="Typ" value={d.betreiber.typ} />
          {d.dedicatedEmail && <CopyRow label="Inst.-Email" value={d.dedicatedEmail} mono important />}
          <CopyRow label="Public-ID" value={d.publicId} mono />
        </StammCard>
        <StammCard icon="📍" title="Anlagenstandort">
          <CopyRow label="Straße" value={d.standort.strasse} important />
          <CopyRow label="Hausnr." value={d.standort.hausnr} important />
          <CopyRow label="PLZ" value={d.standort.plz} important />
          <CopyRow label="Ort" value={d.standort.ort} important />
          <CopyRow label="Bundesland" value={d.standort.bundesland} />
          <CopyRow label="Land" value={d.standort.land} />
          <CopyRow label="Gemarkung" value={d.standort.gemarkung} />
          <CopyRow label="Flur" value={d.standort.flur} />
          <CopyRow label="Flurstück" value={d.standort.flurstuck} />
          <CopyRow label="GPS" value={d.standort.gps} mono />
          {d.standort.googleMapsLink && <CopyRow label="Google Maps" value={d.standort.googleMapsLink} mono />}
          <CopyRow label="Eigentümer" value={d.standort.istEigentuemer === true ? "Ja" : d.standort.istEigentuemer === false ? "Nein" : "—"} />
          {d.standort.istEigentuemer === false && <CopyRow label="Zustimmung" value={d.standort.zustimmungVorhanden ? "Vorhanden" : "Fehlt"} />}
        </StammCard>
        <StammCard icon="🏢" title="Netzbetreiber">
          <CopyRow label="Name" value={d.nb.name} important />
          <CopyRow label="Email" value={d.nb.email} mono />
          <CopyRow label="Portal" value={d.nb.portal} mono />
          <CopyRow label="Az" value={d.nb.az} mono important />
          <CopyRow label="Eingereicht" value={d.nb.eingereichtAm || "—"} />
          <CopyRow label="Genehmigt" value={d.nb.genehmigungAm || "—"} />
          <CopyRow label="Tage beim NB" value={d.nb.daysAtNb > 0 ? `${d.nb.daysAtNb}` : "—"} />
          {d.nb.rueckfrageText && <CopyRow label="Rückfrage" value={d.nb.rueckfrageText} important />}
          {d.nb.rueckfrageAm && <CopyRow label="Rückfrage am" value={d.nb.rueckfrageAm} />}
        </StammCard>
        <StammCard icon="🔌" title="Zähler & Netzanschluss">
          {d.zaehler.nummer && <CopyRow label="Zählernr." value={d.zaehler.nummer} mono important />}
          {d.zaehler.typ && <CopyRow label="Typ" value={d.zaehler.typ} />}
          {d.zaehler.standort && <CopyRow label="Standort" value={d.zaehler.standort} />}
          {d.zaehler.befestigung && <CopyRow label="Befestigung" value={d.zaehler.befestigung} />}
          {d.zaehler.tarif && <CopyRow label="Tarif" value={d.zaehler.tarif} />}
          {d.zaehler.besitzer && <CopyRow label="Besitzer" value={d.zaehler.besitzer} />}
          {d.zaehler.standBezug && <CopyRow label="Stand Bezug" value={`${d.zaehler.standBezug} kWh`} />}
          {d.zaehler.standEinspeisung !== undefined && d.zaehler.standEinspeisung !== "" && <CopyRow label="Stand Einspeisung" value={`${d.zaehler.standEinspeisung} kWh`} />}
          {d.zaehler.ablesedatum && <CopyRow label="Ablesedatum" value={d.zaehler.ablesedatum} />}
          <CopyRow label="ZPB" value={d.zaehler.zaehlpunkt} mono />
          <CopyRow label="MLO" value={d.zaehler.marktlokation} mono />
          <CopyRow label="Wandlermessung" value={d.zaehler.wandlermessung ? "Ja" : "Nein"} />
          <CopyRow label="Fernauslesung" value={d.zaehler.fernauslesung ? "Ja" : "Nein"} />
          <CopyRow label="Smart Meter GW" value={d.zaehler.smartMeterGateway ? "Ja" : "Nein"} />
          <CopyRow label="iMSys gewünscht" value={d.zaehler.imsysGewuenscht ? "Ja" : "Nein"} />
        </StammCard>

        {/* ═══ PV-Module — pro Dachfläche ═══ */}
        {d.anlage.pvEntries.length > 0 && (
          <StammCard icon="☀️" title={`PV-Module — ${d.anlage.kwp} kWp gesamt`}>
            {d.anlage.pvEntries.map((pv: any, i: number) => (
              <div key={i} style={{ marginBottom: i < d.anlage.pvEntries.length - 1 ? 10 : 0, paddingBottom: i < d.anlage.pvEntries.length - 1 ? 10 : 0, borderBottom: i < d.anlage.pvEntries.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 4, padding: "0 10px" }}>{pv.roofName || `Dach ${i + 1}`} — {((pv.count || 0) * (pv.powerWp || 0) / 1000).toFixed(2)} kWp</div>
                <CopyRow label="Hersteller" value={pv.manufacturer} important />
                <CopyRow label="Modell" value={pv.model} important />
                <CopyRow label="Leistung" value={pv.powerWp ? `${pv.powerWp} Wp` : "—"} />
                <CopyRow label="Anzahl" value={`${pv.count}×`} />
                <CopyRow label="Ausrichtung" value={pv.orientation || "—"} />
                <CopyRow label="Neigung" value={pv.tilt ? `${pv.tilt}°` : "—"} />
                {pv.shading && <CopyRow label="Verschattung" value={pv.shading} />}
              </div>
            ))}
          </StammCard>
        )}

        {/* ═══ Wechselrichter ═══ */}
        {d.anlage.inverterEntries.length > 0 && (
          <StammCard icon="⚡" title={`Wechselrichter — ${d.anlage.totalInverterKva} kVA`}>
            {d.anlage.inverterEntries.map((wr: any, i: number) => (
              <div key={i} style={{ marginBottom: i < d.anlage.inverterEntries.length - 1 ? 10 : 0, paddingBottom: i < d.anlage.inverterEntries.length - 1 ? 10 : 0, borderBottom: i < d.anlage.inverterEntries.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                <CopyRow label="Hersteller" value={wr.manufacturer} important />
                <CopyRow label="Modell" value={wr.model} important />
                <CopyRow label="AC-Leistung" value={wr.acPowerKw ? `${wr.acPowerKw} kW` : "—"} />
                <CopyRow label="Scheinleistung" value={wr.powerKva ? `${wr.powerKva} kVA` : "—"} />
                <CopyRow label="Anzahl" value={`${wr.count}×`} />
                {wr.zerezId && <CopyRow label="ZEREZ-ID" value={wr.zerezId} mono important />}
                <CopyRow label="Hybrid" value={wr.hybrid ? "Ja" : "Nein"} />
              </div>
            ))}
          </StammCard>
        )}

        {/* ═══ Speicher ═══ */}
        {d.anlage.batteryEntries.length > 0 && (
          <StammCard icon="🔋" title={`Speicher — ${d.anlage.totalBatteryKwh} kWh`}>
            {d.anlage.batteryEntries.map((b: any, i: number) => (
              <div key={i} style={{ marginBottom: i < d.anlage.batteryEntries.length - 1 ? 10 : 0, paddingBottom: i < d.anlage.batteryEntries.length - 1 ? 10 : 0, borderBottom: i < d.anlage.batteryEntries.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                <CopyRow label="Hersteller" value={b.manufacturer} important />
                <CopyRow label="Modell" value={b.model} important />
                <CopyRow label="Kapazität gesamt" value={b.capacityKwh ? `${((b.count || 1) * b.capacityKwh).toFixed(1)} kWh` : "—"} important />
                <CopyRow label="Anzahl" value={`${b.count}× (je ${b.capacityKwh} kWh)`} />
                <CopyRow label="Kopplung" value={(b.coupling || "").toUpperCase()} />
                <CopyRow label="Batterietyp" value={b.batteryType || "—"} />
                <CopyRow label="Ladeleistung" value={b.ladeleistungKw ? `${b.ladeleistungKw} kW` : "—"} />
                <CopyRow label="Entladeleistung" value={b.entladeleistungKw ? `${b.entladeleistungKw} kW` : "—"} />
                {b.apparentPowerKva > 0 && <CopyRow label="Scheinleistung" value={`${b.apparentPowerKva} kVA`} />}
                {b.ratedCurrentA > 0 && <CopyRow label="Nennstrom" value={`${b.ratedCurrentA} A`} />}
                {b.connectionPhase && <CopyRow label="Anschluss" value={b.connectionPhase === "drehstrom" ? "Drehstrom (3~)" : "Wechselstrom (1~)"} />}
                <CopyRow label="Notstrom" value={b.emergencyPower ? "Ja" : "Nein"} />
                <CopyRow label="Ersatzstrom" value={b.backupPower ? "Ja" : "Nein"} />
                <CopyRow label="Inselfähig" value={b.islandForming ? "Ja" : "Nein"} />
                <CopyRow label="NA-Schutz" value={b.naProtectionPresent ? "Vorhanden" : "—"} />
                <CopyRow label="Allpolige Trennung" value={b.allPoleSeparation ? "Ja" : "Nein"} />
              </div>
            ))}
          </StammCard>
        )}

        {/* ═══ Wallbox ═══ */}
        {d.anlage.wallboxEntries.length > 0 && (
          <StammCard icon="🔌" title="Wallbox">
            {d.anlage.wallboxEntries.map((wb: any, i: number) => (
              <div key={i}>
                <CopyRow label="Hersteller" value={wb.manufacturer} important />
                <CopyRow label="Modell" value={wb.model} important />
                <CopyRow label="Leistung" value={`${wb.powerKw} kW`} />
                <CopyRow label="Phasen" value={`${wb.phasen}-phasig`} />
                <CopyRow label="Stecker" value={wb.stecker} />
                <CopyRow label="§14a steuerbar" value={wb.steuerbar14a ? "Ja" : "Nein"} />
              </div>
            ))}
          </StammCard>
        )}

        {/* ═══ Wärmepumpe ═══ */}
        {d.anlage.waermepumpeEntries.length > 0 && (
          <StammCard icon="🌡️" title="Wärmepumpe">
            {d.anlage.waermepumpeEntries.map((wp: any, i: number) => (
              <div key={i}>
                <CopyRow label="Hersteller" value={wp.manufacturer} important />
                <CopyRow label="Modell" value={wp.model} important />
                {wp.type && <CopyRow label="Typ" value={wp.type === "Luft" ? "Luft-Wasser" : wp.type} />}
                <CopyRow label="Leistung" value={`${wp.powerKw} kW`} />
                <CopyRow label="SG Ready" value={wp.sgReady ? "Ja" : "Nein"} />
                <CopyRow label="§14a steuerbar" value={wp.steuerbar14a ? "Ja" : "Nein"} />
              </div>
            ))}
          </StammCard>
        )}

        {/* ═══ Netzparameter ═══ */}
        <StammCard icon="⚙️" title="Netzparameter & Betrieb">
          <CopyRow label="Einspeisung" value={d.anlage.einspeisung} important />
          <CopyRow label="Messkonzept" value={d.anlage.messkonzept} important />
          <CopyRow label="Betriebsweise" value={d.anlage.betriebsweise} />
          <CopyRow label="Netzebene" value={d.anlage.netzebene} />
          <CopyRow label="Blindleistung" value={d.anlage.blindleistungskompensation || "—"} />
          <CopyRow label="Einspeisemanagement" value={d.anlage.einspeisemanagement || "—"} />
          <CopyRow label="Begrenzung" value={d.anlage.begrenzungProzent ? `${d.anlage.begrenzungProzent}%` : "—"} />
          <CopyRow label="§14a relevant" value={d.anlage.paragraph14a ? "Ja" : "Nein"} />
          <CopyRow label="NA-Schutz" value={d.anlage.naSchutzErforderlich ? "Erforderlich" : "Nein"} />
          <CopyRow label="Inselbetrieb" value={d.anlage.inselbetrieb ? "Ja" : "Nein"} />
        </StammCard>

        {/* ═══ System ═══ */}
        <StammCard icon="📧" title="System & Verwaltung">
          <CopyRow label="Falltyp" value={d.wizard.caseType} />
          <CopyRow label="Komponenten" value={d.wizard.registrationTargets.join(", ")} />
          <CopyRow label="Erstellt" value={d.createdAt} />
          <CopyRow label="Erstellt von" value={d.createdByName} />
          <CopyRow label="Rolle" value={d.createdByRole} />
          <CopyRow label="Zugewiesen" value={d.assignedToName || "—"} />
          <CopyRow label="Vollmacht" value={d.wizard.vollmachtErteilt ? "Erteilt" : "Fehlt"} />
          <CopyRow label="AGB" value={d.wizard.agbAkzeptiert ? "Akzeptiert" : "Fehlt"} />
          <CopyRow label="MaStR Solar" value={d.mastr.nrSolar || "—"} mono />
          <CopyRow label="MaStR Speicher" value={d.mastr.nrSpeicher || "—"} mono />
          <CopyRow label="MaStR Status" value={d.mastr.status || "—"} />
          {d.factro.projectId && <CopyRow label="Factro" value={`${d.factro.number} — ${d.factro.taskState}`} />}
          {d.factro.datenraumLink && <CopyRow label="Datenraum" value={d.factro.datenraumLink} mono />}
        </StammCard>
      </div>
    </Modal>
  );
}

// ─── NB-Portal Quick Access Widget ───────────────────────────────────────────

// ─── Dokumente generieren Button ─────────────────────────────────────────────

function GenerateDocsButton() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ count: number; documents: { filename: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    const live = getLive();
    const instId = live?.installationId;
    if (!instId) { setError("Keine Installation"); return; }
    setGenerating(true); setError(null); setResult(null);
    try {
      const token = localStorage.getItem("baunity_token") || "";
      const resp = await fetch(`/api/installations/${instId}/generate-documents`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, credentials: "include",
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || `Fehler ${resp.status}`); }
      const data = await resp.json();
      setResult(data);
      // Seite neu laden um Dokumente im Tab zu sehen
      setTimeout(() => { if (getLive()?.isLive) window.location.reload(); }, 2000);
    } catch (e: any) { setError(e.message); }
    finally { setGenerating(false); }
  };

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button onClick={generate} disabled={generating} className="btn-hover" style={{
        background: generating ? "rgba(212,168,67,0.04)" : "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(6,182,212,0.08))",
        color: generating ? C.dim : C.green, border: `1px solid ${generating ? C.borderLight : "rgba(34,197,94,0.25)"}`,
        borderRadius: 10, padding: "10px 28px", fontSize: 14, fontWeight: 700, cursor: generating ? "wait" : "pointer",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {generating ? "⏳ Generiere..." : result ? `✅ ${result.count} Dokumente` : "📄 VDE + Schaltplan generieren"}
      </button>
      {error && <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, fontSize: 11, color: C.red, background: "rgba(239,68,68,0.08)", padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap" }}>✗ {error}</div>}
      {result && (
        <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, fontSize: 11, color: C.green, background: "rgba(34,197,94,0.08)", padding: "6px 10px", borderRadius: 6, whiteSpace: "nowrap" }}>
          {result.documents.map((d, i) => <div key={i}>✅ {d.filename}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── Betreibererklärung PDF Button ───────────────────────────────────────────

function BetreibererklaerungButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const generate = async () => {
    const live = getLive();
    const instId = live?.installationId || live?.data?._raw?.id;
    if (!instId) { alert("Keine Installation"); return; }
    setLoading(true); setDone(false);
    try {
      const token = localStorage.getItem("baunity_token") || "";
      // Generate + save as document
      const resp = await fetch(`/api/vde-center/betreibererklaerung/generate/${instId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, credentials: "include",
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || `Fehler ${resp.status}`); }
      const data = await resp.json();
      // Open the PDF
      if (data.documentId) {
        window.open(`/api/documents/${data.documentId}/download?view=true`, "_blank");
      } else if (data.url) {
        window.open(data.url, "_blank");
      }
      setDone(true);
      setTimeout(() => setDone(false), 5000);
    } catch (e: any) { alert("Fehler: " + e.message); }
    finally { setLoading(false); }
  };

  return (
    <button onClick={generate} disabled={loading} className="btn-hover" style={{
      background: loading ? "rgba(212,168,67,0.04)" : "linear-gradient(135deg, rgba(251,146,60,0.12), rgba(251,146,60,0.06))",
      color: loading ? C.dim : C.orange, border: `1px solid ${loading ? C.borderLight : "rgba(251,146,60,0.25)"}`,
      borderRadius: 10, padding: "10px 28px", fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {loading ? "⏳ Generiere..." : done ? "✅ Gespeichert" : "📋 Betreibererklärung"}
    </button>
  );
}

function NbPortalWidget({ nb, isStaff }: { nb: typeof MOCK_FALLBACK.nb; isStaff: boolean }) {
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [cred, setCred] = useState<{ username: string; password: string } | null>(null);
  const [portalUrl, setPortalUrl] = useState(nb.portal || "");
  const [loadingCreds, setLoadingCreds] = useState(false);

  // Echte Credentials laden wenn Installation eine NB-ID hat
  useEffect(() => {
    if (!isStaff) return;
    const live = getLive();
    const nbId = live?.data?._raw?.netzbetreiberId;
    if (!nbId) return;
    setLoadingCreds(true);
    const token = localStorage.getItem("baunity_token") || "";
    fetch(`/api/credentials/netzbetreiber/${nbId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.credentials?.length > 0) {
          setCred({ username: data.credentials[0].username, password: data.credentials[0].password });
        }
        if (data?.netzbetreiber?.portalUrl) {
          setPortalUrl(data.netzbetreiber.portalUrl);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCreds(false));
  }, [isStaff]);

  const hasCreds = !!cred;

  const copyToClip = (val: string, field: string) => {
    navigator.clipboard.writeText(val);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="card-hover" style={{ ...cardS, padding: 0, overflow: "hidden", background: "linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(17,20,35,0.95) 100%)", borderColor: "rgba(6,182,212,0.15)" }}>
      {/* Header */}
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.borderLight}` }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(6,182,212,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌐</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.bright }}>NB-Portal</div>
          <div style={{ fontSize: 11, color: C.dim }}>{nb.name}</div>
        </div>
        {portalUrl && (
          <a href={portalUrl} target="_blank" rel="noopener" className="btn-hover" style={{
            background: C.cyan, color: "#fff", border: "none", borderRadius: 8,
            padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            Portal öffnen ↗
          </a>
        )}
      </div>

      {/* Credentials */}
      {isStaff && hasCreds && (
        <div style={{ padding: "12px 18px" }}>
          {/* Username */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: C.dim, width: 70 }}>Benutzer:</span>
            <span style={{ fontSize: 13, color: C.bright, fontFamily: "'JetBrains Mono', monospace", flex: 1 }}>{cred.username}</span>
            <button onClick={() => copyToClip(cred.username, "user")} style={{ background: copied === "user" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${copied === "user" ? "rgba(34,197,94,0.2)" : C.borderLight}`, borderRadius: 4, padding: "2px 8px", fontSize: 10, color: copied === "user" ? C.green : C.dim, cursor: "pointer" }}>
              {copied === "user" ? "✓" : "📋"}
            </button>
          </div>
          {/* Password */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: C.dim, width: 70 }}>Passwort:</span>
            <span style={{ fontSize: 13, color: C.bright, fontFamily: "'JetBrains Mono', monospace", flex: 1, letterSpacing: showPw ? 0 : 2 }}>
              {showPw ? cred.password : "••••••••••"}
            </span>
            <button onClick={() => setShowPw(!showPw)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderLight}`, borderRadius: 4, padding: "2px 8px", fontSize: 10, color: C.dim, cursor: "pointer" }}>
              {showPw ? "🙈" : "👁"}
            </button>
            <button onClick={() => copyToClip(cred.password, "pw")} style={{ background: copied === "pw" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${copied === "pw" ? "rgba(34,197,94,0.2)" : C.borderLight}`, borderRadius: 4, padding: "2px 8px", fontSize: 10, color: copied === "pw" ? C.green : C.dim, cursor: "pointer" }}>
              {copied === "pw" ? "✓" : "📋"}
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: C.dim }}>Az: {nb.az}</div>
        </div>
      )}

      {isStaff && !hasCreds && (
        <div style={{ padding: "12px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: C.dim, marginBottom: 8 }}>{loadingCreds ? "Laden..." : "Keine Zugangsdaten hinterlegt"}</div>
          {!loadingCreds && <a href="/credential-vault" className="btn-hover" style={{ display: "inline-block", background: "rgba(6,182,212,0.1)", color: C.cyan, border: `1px solid rgba(6,182,212,0.2)`, borderRadius: 8, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
            + Zugangsdaten anlegen
          </a>}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Übersicht ──────────────────────────────────────────────────────────

function TabWasMusIchTun({ onAlleDaten, onSwitchTab, isStaff }: { onAlleDaten: () => void; onSwitchTab: (tab: number) => void; isStaff: boolean }) {
  const d = MOCK;
  const missingDocs = MOCK_DOCS.filter(d => d.status === "missing");
  const lastEmail = MOCK_EMAILS.filter(e => e.dir === "in")[0];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {(() => {
        // Dynamische Aufgaben basierend auf echten Daten
        const tasks: { icon: string; title: string; detail: string; sub: string; color: string; action: string; tab: number }[] = [];
        if (d.nb.rueckfrageText && !d.nb.rueckfrageBeantwortet) {
          tasks.push({ icon: "❗", title: "Rückfrage vom Netzbetreiber beantworten", detail: `${d.nb.name} fragt nach: ${d.nb.rueckfrageText}`, sub: d.nb.rueckfrageAm ? `Eingegangen am ${d.nb.rueckfrageAm}` : "", color: C.red, action: "Email lesen →", tab: 1 });
        }
        if (missingDocs.length > 0) {
          tasks.push({ icon: "📄", title: `${missingDocs.length} Dokument${missingDocs.length > 1 ? "e" : ""} fehlt`, detail: missingDocs.map((dd: any) => dd.name).join(", "), sub: "Pflichtdokumente vervollständigen", color: C.orange, action: "Hochladen →", tab: 2 });
        }
        // Keine Aufgaben → Alles gut
        if (tasks.length === 0 && isStaff) {
          return (
            <div style={{ ...cardS, padding: 24, borderLeft: `4px solid ${C.green}`, background: "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(17,20,35,0.95) 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✅</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.bright }}>Keine offenen Aufgaben</div>
                  <div style={{ fontSize: 13, color: C.dim, marginTop: 4 }}>Alles erledigt — Projekt läuft planmäßig</div>
                </div>
              </div>
            </div>
          );
        }
        return isStaff ? (
          <div style={{ ...cardS, padding: 24, borderLeft: `4px solid ${tasks[0]?.color || C.orange}`, background: `linear-gradient(135deg, ${tasks[0]?.color || C.orange}08 0%, rgba(17,20,35,0.95) 100%)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${tasks[0]?.color || C.orange}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔥</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.bright }}>{tasks.length} offene Aufgabe{tasks.length !== 1 ? "n" : ""}</div>
                <div style={{ fontSize: 13, color: C.dim }}>Bitte erledigen, damit es weitergeht</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tasks.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: `${t.color}08`, border: `1px solid ${t.color}20`, borderRadius: 12 }}>
                  <span style={{ fontSize: 24 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>{t.title}</div>
                    {t.detail && <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{t.detail}</div>}
                    {t.sub && <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>{t.sub}</div>}
                  </div>
                  <button onClick={() => onSwitchTab(t.tab)} className="btn-hover" style={{ background: t.color, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                    {t.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          tasks.length > 0 ? (
            <div style={{ ...cardS, padding: 24, borderLeft: `4px solid ${C.orange}`, background: "linear-gradient(135deg, rgba(249,115,22,0.05) 0%, rgba(17,20,35,0.95) 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(249,115,22,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⏳</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.bright }}>{tasks[0].title}</div>
                  <div style={{ fontSize: 14, color: C.muted, marginTop: 4, lineHeight: 1.6 }}>{tasks[0].detail}</div>
                  {tasks[0].sub && <div style={{ fontSize: 13, color: C.dim, marginTop: 8 }}>{tasks[0].sub} · Wird bearbeitet</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, padding: "0 12px" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.orange }} />
                  <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>In Arbeit</span>
                </div>
              </div>
            </div>
          ) : null
        );
      })()}

      {/* Stammdaten-Karten */}
      <div className="uebersicht-stamm" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        <StammCard icon="👤" title="Anlagenbetreiber">
          {d.betreiber.firma && <CopyRow label="Firma" value={d.betreiber.firma} important />}
          {d.betreiber.vertreter && <CopyRow label="Vertreter" value={d.betreiber.vertreter} important />}
          {!d.betreiber.firma && <CopyRow label="Name" value={`${d.betreiber.vorname} ${d.betreiber.nachname}`.trim()} important />}
          <CopyRow label="Adresse" value={`${d.betreiber.strasse} ${d.betreiber.hausnr}`.trim()} important />
          <CopyRow label="PLZ / Ort" value={`${d.betreiber.plz} ${d.betreiber.ort}`.trim()} important />
          {d.betreiber.email && <CopyRow label="Email" value={d.betreiber.email} mono />}
          {d.betreiber.telefon && <CopyRow label="Telefon" value={d.betreiber.telefon} />}
        </StammCard>
        {(() => {
          const live = getLive();
          const eig = live?.data?.eigentuemer;
          if (!eig) return null;
          return (
            <StammCard icon="🏠" title="Anschluss-Eigentümer">
              <CopyRow label="Name" value={eig.name} important />
              {eig.email && <CopyRow label="Email" value={eig.email} mono />}
              {eig.telefon && <CopyRow label="Telefon" value={eig.telefon} />}
              {eig.strasse && <CopyRow label="Adresse" value={`${eig.strasse} ${eig.plz || ""} ${eig.ort || ""}`.trim()} />}
            </StammCard>
          );
        })()}
        <StammCard icon="📍" title="Anlagenstandort">
          <CopyRow label="Adresse" value={`${d.standort.strasse} ${d.standort.hausnr}`.trim()} important />
          <CopyRow label="PLZ / Ort" value={`${d.standort.plz} ${d.standort.ort}`.trim()} important />
          <CopyRow label="Flurstück" value={[d.standort.gemarkung, d.standort.flurstuck].filter(Boolean).join(", ")} />
          <CopyRow label="GPS" value={d.standort.gps} mono />
        </StammCard>
        <StammCard icon="🏢" title="Netzbetreiber">
          <CopyRow label="Name" value={d.nb.name} important />
          <CopyRow label="Email" value={d.nb.email} mono />
          <CopyRow label="Az" value={d.nb.az} mono />
        </StammCard>
        <StammCard icon="⚡" title={d.anlage.systemTyp ? `${d.anlage.systemTyp}` : "Anlage"}>
          {(() => {
            const isSpeicher = d.anlage.systemTyp === "Schwarmspeicher" || d.anlage.systemTyp === "Großbatteriespeicher";
            const kwp = Number(d.anlage.kwp) || 0;
            const kwh = Number(d.anlage.totalBatteryKwh) || 0;
            const wr0 = d.anlage.inverterEntries[0];
            const bat0 = d.anlage.batteryEntries[0];
            const hasPv = d.anlage.pvEntries.length > 0 && d.anlage.pvEntries[0]?.manufacturer;

            // Leistungs-Anzeige angepasst an Anlagentyp
            const stats = isSpeicher
              ? [
                  { v: kwp >= 1000 ? `${(kwp / 1000).toFixed(1)}` : String(kwp), u: kwp >= 1000 ? "MW" : "kW", l: "Leistung", c: C.cyan },
                  ...(kwh > 0 ? [{ v: kwh >= 1000 ? `${(kwh / 1000).toFixed(1)}` : String(kwh), u: kwh >= 1000 ? "MWh" : "kWh", l: "Kapazität", c: C.purple }] : []),
                ]
              : [
                  { v: String(kwp), u: "kWp", l: "PV", c: C.green },
                  ...(kwh > 0 ? [{ v: String(kwh), u: "kWh", l: "Speicher", c: C.purple }] : []),
                ];

            return (<>
              <div style={{ display: "flex", gap: 6, padding: "6px 8px" }}>
                {stats.map(s => (
                  <div key={s.u + s.l} style={{ flex: 1, background: `${s.c}10`, borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: s.c, opacity: 0.7 }}>{s.u}</div>
                    <div style={{ fontSize: 9, color: C.dim }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {hasPv && <CopyRow label="Module" value={`${d.anlage.pvEntries.reduce((s: number, p: any) => s + (p.count || 0), 0)}× ${d.anlage.pvEntries[0]?.manufacturer} ${(d.anlage.pvEntries[0]?.model || "").split("-")[0]}`} />}
              {bat0?.manufacturer && <CopyRow label="Speicher" value={`${bat0.count || 1}× ${bat0.manufacturer} ${bat0.model} (${((bat0.count||1)*bat0.capacityKwh).toFixed(0)} kWh)`} />}
              {wr0?.manufacturer && <CopyRow label="WR" value={`${wr0.count || 1}× ${wr0.manufacturer} ${wr0.model}`} />}
              {wr0?.zerezId && <CopyRow label="ZEREZ" value={wr0.zerezId} mono />}
            </>);
          })()}
        </StammCard>
        <StammCard icon="📋" title="Projekt-Info">
          <CopyRow label="Erstellt von" value={d.createdByName} important />
          <CopyRow label="Rolle" value={d.createdByRole} />
          <CopyRow label="Erstellt am" value={d.createdAt} />
          {d.assignedToName && <CopyRow label="Zugewiesen" value={d.assignedToName} />}
          {d.dedicatedEmail && <CopyRow label="Inst.-Email" value={d.dedicatedEmail} mono important />}
          <CopyRow label="ID" value={d.publicId} mono />
          {d.factro.number && <CopyRow label="Factro" value={`#${d.factro.number}`} mono />}
        </StammCard>
      </div>

      {/* Aktions-Buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onAlleDaten} className="btn-hover" style={{ background: "rgba(212,168,67,0.08)", color: C.accentLight, border: `1px solid rgba(212,168,67,0.2)`, borderRadius: 10, padding: "10px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          📋 Alle Daten
        </button>
        {isStaff && <GenerateDocsButton />}
        {isStaff && <BetreibererklaerungButton />}
      </div>

      {/* Schnellzugriff: 4 Karten */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {/* NB-Portal Quick Access */}
        <NbPortalWidget nb={d.nb} isStaff={isStaff} />

        <div className="card-hover" onClick={() => onSwitchTab(1)} style={{ ...cardS, padding: 18, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>📨</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.bright }}>Letzte NB-Nachricht</span>
          </div>
          {lastEmail && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastEmail.subj}</div>
              <div style={{ fontSize: 12, color: C.dim }}>{lastEmail.date}</div>
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: 13, color: C.accentLight, fontWeight: 600 }}>Alle Emails lesen →</div>
        </div>

        <div className="card-hover" onClick={() => onSwitchTab(2)} style={{ ...cardS, padding: 18, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>📋</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.bright }}>Unterlagen-Status</span>
            <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: C.green }}>8/10</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ width: "80%", height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${C.green}, ${C.accent})` }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: C.accentLight, fontWeight: 600 }}>Alle Dokumente →</div>
        </div>

        <div className="card-hover" onClick={() => onSwitchTab(4)} style={{ ...cardS, padding: 18, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>📜</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.bright }}>Letzter Verlauf</span>
          </div>
          <div style={{ fontSize: 13, color: C.text }}>{MOCK_ACTIVITIES[0]?.icon || "📋"} {MOCK_ACTIVITIES[0]?.text || "Keine Aktivitäten"}</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{MOCK_ACTIVITIES[0]?.date || ""}</div>
          <div style={{ marginTop: 10, fontSize: 13, color: C.accentLight, fontWeight: 600 }}>Gesamter Verlauf →</div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Kommunikation (NEU — mit Antworten, Compose, KI-Entwurf) ─────────

const QUICK_TEMPLATES = [
  { id: "nachreichung", label: "Dokumente nachreichen", icon: "📄", desc: "Fehlende Unterlagen nachsenden" },
  { id: "nachfrage", label: "Nachfrage senden", icon: "🔔", desc: "Status-Nachfrage zum Antrag" },
  { id: "rueckfrage_antwort", label: "Rückfrage beantworten", icon: "💬", desc: "Auf NB-Rückfrage antworten" },
  { id: "stornierung", label: "Stornierung", icon: "🚫", desc: "Antrag zurückziehen" },
];

function TabKommunikation() {
  const d = MOCK;
  const [selectedEmail, setSelectedEmail] = useState<typeof MOCK_EMAILS[0] | null>(null);
  const [composing, setComposing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<typeof MOCK_EMAILS[0] | null>(null);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeTo, setComposeTo] = useState(d.nb.email);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sentConfirm, setSentConfirm] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [composeFrom, setComposeFrom] = useState(d.dedicatedEmail);

  const FROM_OPTIONS = [
    { value: d.dedicatedEmail, label: d.dedicatedEmail, desc: "Installations-Adresse (Antworten landen direkt hier)" },
    { value: "netzanmeldung@lecagmbh.de", label: "netzanmeldung@lecagmbh.de", desc: "Zentrale Netzanmeldung" },
    { value: "info@baunity.de", label: "info@baunity.de", desc: "Baunity allgemein" },
  ];

  const startReply = (email: typeof MOCK_EMAILS[0]) => {
    setReplyingTo(email);
    setSelectedEmail(null);
    setComposing(true);
    setComposeSubject(`AW: ${email.subj}`);
    setComposeTo(email.from);
    setComposeBody("");
    setAiDone(false);
  };

  const startCompose = (templateId?: string) => {
    setReplyingTo(null);
    setComposing(true);
    setComposeTo(d.nb.email);
    setAiDone(false);
    setActiveTemplate(templateId || null);
    if (templateId === "nachfrage") {
      setComposeSubject(`Nachfrage zum Netzanschlussantrag — Az: ${d.nb.az}`);
      setComposeBody(`Sehr geehrte Damen und Herren,\n\nwir erlauben uns, zum oben genannten Vorgang nachzufragen.\n\nDer Antrag wurde am ${d.nb.eingereichtAm} eingereicht. Könnten Sie uns bitte den aktuellen Bearbeitungsstand mitteilen?\n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG`);
    } else if (templateId === "nachreichung") {
      setComposeSubject(`Nachreichung Unterlagen — Az: ${d.nb.az}`);
      setComposeBody(`Sehr geehrte Damen und Herren,\n\nanbei übersenden wir die angeforderten Unterlagen:\n\n- \n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG`);
    } else if (templateId === "rueckfrage_antwort") {
      setComposeSubject(`AW: Rückfrage — Az: ${d.nb.az}`);
      setComposeBody("");
    } else if (templateId === "stornierung") {
      setComposeSubject(`Stornierung Netzanschlussantrag — Az: ${d.nb.az}`);
      setComposeBody(`Sehr geehrte Damen und Herren,\n\nhiermit ziehen wir den Netzanschlussantrag zum Aktenzeichen ${d.nb.az} zurück.\n\nBegründung: \n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG`);
    } else {
      setComposeSubject("");
      setComposeBody("");
    }
  };

  const cancelCompose = () => {
    setComposing(false);
    setReplyingTo(null);
    setComposeBody("");
    setComposeSubject("");
    setActiveTemplate(null);
    setAiDone(false);
  };

  const simulateAiDraft = () => {
    setAiLoading(true);
    setTimeout(() => {
      if (replyingTo && replyingTo.id === 3) {
        setComposeBody(`Sehr geehrte Frau Schmidt,\n\nvielen Dank für Ihre Nachricht vom 10.03.2026.\n\nAnbei übersenden wir die angeforderten Unterlagen:\n\n1. Datenblatt Batteriespeicher Huawei LUNA2000-10-S0 (siehe Anhang)\n2. Symmetrienachweis für die 12.40 kWp PV-Anlage mit 10 kWh Speicher (siehe Anhang)\n\nSollten weitere Unterlagen benötigt werden, stehen wir gerne zur Verfügung.\n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG\nVogesenblick 21, 77933 Lahr`);
      } else {
        setComposeBody(`Sehr geehrte Damen und Herren,\n\nbezugnehmend auf den Netzanschlussantrag (Az: ${d.nb.az}) möchten wir folgendes mitteilen:\n\n[Ihr Text hier]\n\nAnlage:\n- PV: ${d.anlage.kwp} kWp (${d.anlage.pvEntries.reduce((s, p) => s + p.count, 0)}× Module)\n- Speicher: ${d.anlage.batteryEntries[0]?.capacityKwh} kWh ${d.anlage.batteryEntries[0]?.manufacturer}\n- Standort: ${d.standort.strasse} ${d.standort.hausnr}, ${d.standort.plz} ${d.standort.ort}\n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG`);
      }
      setAiLoading(false);
      setAiDone(true);
    }, 1800);
  };

  const simulateSend = () => {
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setSentConfirm(true);
      setTimeout(() => {
        setSentConfirm(false);
        cancelCompose();
      }, 2500);
    }, 1200);
  };

  // ─── Compose View ───
  if (composing) {
    return (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={cancelCompose} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, color: C.muted, cursor: "pointer" }}>← Zurück</button>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.bright }}>{replyingTo ? "Antworten" : "Neue Email"}</span>
            {activeTemplate && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: "rgba(212,168,67,0.1)", color: C.accentLight }}>{QUICK_TEMPLATES.find(t => t.id === activeTemplate)?.label}</span>}
          </div>
          {sentConfirm && <span style={{ fontSize: 14, fontWeight: 700, color: C.green, padding: "8px 16px", background: "rgba(34,197,94,0.08)", borderRadius: 8 }}>✓ Email gesendet!</span>}
        </div>

        {/* Reply-Context */}
        {replyingTo && (
          <div style={{ background: "rgba(59,130,246,0.04)", border: `1px solid rgba(59,130,246,0.12)`, borderRadius: 10, padding: "12px 16px", borderLeft: `3px solid ${C.blue}` }}>
            <div style={{ fontSize: 11, color: C.blue, fontWeight: 700, marginBottom: 4 }}>Antwort auf:</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>{replyingTo.subj}</div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>Von: {replyingTo.from} · {replyingTo.date}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6, padding: "8px 12px", background: "rgba(0,0,0,0.15)", borderRadius: 6, maxHeight: 80, overflow: "hidden", lineHeight: 1.5 }}>{replyingTo.body.substring(0, 200)}...</div>
          </div>
        )}

        {/* Form */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          {/* An */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.borderLight}` }}>
            <span style={{ fontSize: 13, color: C.dim, width: 60, flexShrink: 0 }}>An:</span>
            <input value={composeTo} onChange={e => setComposeTo(e.target.value)} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, color: C.bright, outline: "none", fontFamily: "'JetBrains Mono', monospace" }} />
          </div>
          {/* Von — Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.borderLight}` }}>
            <span style={{ fontSize: 13, color: C.dim, width: 60, flexShrink: 0 }}>Von:</span>
            <div style={{ flex: 1, position: "relative" }}>
              <select value={composeFrom} onChange={e => setComposeFrom(e.target.value)} style={{
                width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderLight}`,
                borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.accentLight, outline: "none",
                fontFamily: "'JetBrains Mono', monospace", appearance: "none", cursor: "pointer",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
              }}>
                {FROM_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: "#1a1a2e", color: "#e2e8f0" }}>{o.label}</option>)}
              </select>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>{FROM_OPTIONS.find(o => o.value === composeFrom)?.desc}</div>
            </div>
          </div>
          {/* Betreff */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.borderLight}` }}>
            <span style={{ fontSize: 13, color: C.dim, width: 60, flexShrink: 0 }}>Betreff:</span>
            <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Betreff eingeben..." style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, color: C.bright, outline: "none", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }} />
          </div>

          {/* KI-Button */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={simulateAiDraft} disabled={aiLoading} className="btn-hover" style={{
              background: aiDone ? "rgba(34,197,94,0.08)" : "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(212,168,67,0.15))",
              border: `1px solid ${aiDone ? "rgba(34,197,94,0.2)" : "rgba(167,139,250,0.25)"}`,
              borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700,
              color: aiDone ? C.green : C.purple, cursor: aiLoading ? "wait" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {aiLoading ? <><span style={{ animation: "pulse 1s infinite" }}>🧠</span> KI schreibt...</> :
               aiDone ? "✓ KI-Entwurf übernommen" : "🧠 KI-Entwurf generieren"}
            </button>
            <span style={{ fontSize: 11, color: C.dim, alignSelf: "center" }}>Nutzt Projektdaten + NB-Kontext</span>
          </div>

          {/* Body */}
          <textarea
            value={composeBody} onChange={e => { setComposeBody(e.target.value); setAiDone(false); }}
            placeholder="Email-Text schreiben oder KI-Entwurf generieren lassen..."
            rows={14}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(255,255,255,0.03)", border: `1px solid ${C.borderLight}`, borderRadius: 10,
              padding: "16px 18px", fontSize: 14, color: C.text, outline: "none", resize: "vertical",
              fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7,
            }}
          />

          {/* Anhänge (Mock) */}
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: `1px dashed ${C.borderLight}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: C.dim }}>📎 Anhänge</span>
              <button style={{ background: "rgba(212,168,67,0.08)", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 12px", fontSize: 11, color: C.accentLight, cursor: "pointer" }}>+ Datei anhängen</button>
            </div>
            {replyingTo?.id === 3 && (
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: C.accentLight, background: "rgba(212,168,67,0.08)", padding: "4px 10px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>📄 Datenblatt_LUNA2000.pdf <button style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 10, padding: 0 }}>✕</button></span>
                <span style={{ fontSize: 11, color: C.accentLight, background: "rgba(212,168,67,0.08)", padding: "4px 10px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>📄 Symmetrienachweis.pdf <button style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 10, padding: 0 }}>✕</button></span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
            <button onClick={simulateSend} disabled={!composeBody.trim() || !composeSubject.trim() || sendingEmail} className="btn-hover" style={{
              background: sendingEmail ? C.muted : `linear-gradient(135deg, ${C.accent}, #b8942e)`, color: "#fff", border: "none", borderRadius: 10,
              padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: (!composeBody.trim() || sendingEmail) ? "default" : "pointer",
              opacity: (!composeBody.trim() || !composeSubject.trim()) ? 0.4 : 1,
              boxShadow: composeBody.trim() ? `0 4px 20px rgba(212,168,67,0.3)` : "none",
            }}>
              {sendingEmail ? "⏳ Wird gesendet..." : "📤 Email senden"}
            </button>
            <button onClick={cancelCompose} style={{ background: "none", border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "12px 20px", fontSize: 13, color: C.muted, cursor: "pointer" }}>Abbrechen</button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: C.dim }}>Wird gesendet von: <strong style={{ color: C.accentLight }}>{composeFrom}</strong></span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Inbox View ───
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header mit Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.bright }}>📧 NB-Kommunikation</span>
          <span style={{ fontSize: 12, color: C.dim }}>{MOCK_EMAILS.length} Emails · Az: {d.nb.az}</span>
        </div>
        <button onClick={() => startCompose()} className="btn-hover" style={{
          background: C.accent, color: "#fff", border: "none", borderRadius: 10,
          padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          boxShadow: `0 2px 12px rgba(212,168,67,0.25)`,
        }}>
          + Neue Email
        </button>
      </div>

      {/* NB Info-Bar */}
      <div style={{ background: "rgba(212,168,67,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(212,168,67,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏢</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.bright }}>{d.nb.name || "Kein NB zugeordnet"}</div>
          <div style={{ fontSize: 12, color: C.dim }}>{[d.nb.email, d.nb.daysAtNb > 0 ? `Seit ${d.nb.daysAtNb} Tagen` : ""].filter(Boolean).join(" · ") || "—"}</div>
        </div>
        {d.nb.rueckfrageText && !d.nb.rueckfrageBeantwortet && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: "rgba(239,68,68,0.08)", color: C.red, border: "1px solid rgba(239,68,68,0.15)" }}>Rückfrage offen</span>
        )}
        {d.nb.genehmigungAm && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: "rgba(34,197,94,0.08)", color: C.green, border: "1px solid rgba(34,197,94,0.15)" }}>Genehmigt</span>
        )}
      </div>

      {/* Schnell-Aktionen */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Schnell-Aktionen</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
          {QUICK_TEMPLATES.map(t => (
            <button key={t.id} onClick={() => startCompose(t.id)} className="card-hover" style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: "12px 14px", cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.bright }}>{t.label}</div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Email-Thread */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Email-Verlauf</div>
        {MOCK_EMAILS.map(email => {
          const isIn = email.dir === "in";
          const isSelected = selectedEmail?.id === email.id;
          return (
            <div key={email.id}>
              <div className="email-row" onClick={() => setSelectedEmail(isSelected ? null : email)} style={{
                display: "flex", gap: 12, padding: "14px 16px", marginBottom: 4,
                background: isSelected ? "rgba(212,168,67,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isSelected ? "rgba(212,168,67,0.2)" : C.borderLight}`,
                borderRadius: 10, borderLeft: `3px solid ${isIn ? C.blue : C.accent}`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: isIn ? "rgba(59,130,246,0.1)" : "rgba(212,168,67,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{isIn ? "📨" : "📤"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email.subj}</span>
                    <span style={{ fontSize: 12, color: C.dim, flexShrink: 0 }}>{email.date}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{isIn ? `Von: ${email.from}` : `An: ${email.to}`}</div>
                  {!isSelected && <div style={{ fontSize: 13, color: C.muted, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email.preview}</div>}
                  {email.files.length > 0 && <div style={{ display: "flex", gap: 6, marginTop: 6 }}>{email.files.map(f => <span key={f} style={{ fontSize: 11, color: C.accentLight, background: "rgba(212,168,67,0.08)", padding: "2px 8px", borderRadius: 4 }}>📎 {f}</span>)}</div>}
                </div>
              </div>

              {/* Expanded Email */}
              {isSelected && (
                <div className="slide-up" style={{ marginBottom: 8, marginLeft: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                  {/* Email Body */}
                  <div style={{ padding: "20px 24px", background: "linear-gradient(180deg, #fefefe, #f8f9fa)", color: "#1a1a2e", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "'Segoe UI', sans-serif", minHeight: 80 }}>{email.body}</div>

                  {/* Anhänge */}
                  {email.files.length > 0 && (
                    <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.borderLight}` }}>
                      <div style={{ fontSize: 12, color: C.dim, marginBottom: 8 }}>📎 Anhänge ({email.files.length})</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{email.files.map(f => <div key={f} className="doc-card-hover" style={{ padding: "8px 14px", background: "rgba(212,168,67,0.06)", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.accentLight }}>📎 {f}</div>)}</div>
                    </div>
                  )}

                  {/* Inline-Aktionen */}
                  <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.borderLight}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {isIn && (
                      <button onClick={(e) => { e.stopPropagation(); startReply(email); }} className="btn-hover" style={{
                        background: C.accent, color: "#fff", border: "none", borderRadius: 8,
                        padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}>↩ Antworten</button>
                    )}
                    {isIn && (
                      <button onClick={(e) => { e.stopPropagation(); startCompose("rueckfrage_antwort"); }} className="btn-hover" style={{
                        background: "rgba(167,139,250,0.1)", color: C.purple, border: `1px solid rgba(167,139,250,0.2)`,
                        borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}>🧠 Mit KI antworten</button>
                    )}
                    <button style={{
                      background: "rgba(255,255,255,0.04)", color: C.muted, border: `1px solid ${C.borderLight}`,
                      borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer",
                    }}>📋 Text kopieren</button>
                    <button style={{
                      background: "rgba(255,255,255,0.04)", color: C.muted, border: `1px solid ${C.borderLight}`,
                      borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer",
                    }}>🎫 Ticket erstellen</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Kommentare */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Interne Notizen</div>
        {MOCK_COMMENTS.map(comment => {
          const sc = comment.source === "ki" ? C.purple : comment.source === "system" ? C.cyan : C.accent;
          return (
            <div key={comment.id} style={{ display: "flex", gap: 10, padding: "10px 14px", marginBottom: 4, background: "rgba(255,255,255,0.015)", border: `1px solid ${C.borderLight}`, borderRadius: 10, borderLeft: `3px solid ${sc}` }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: `${sc}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: sc }}>{comment.source === "ki" ? "🤖" : comment.source === "system" ? "⚙" : comment.author[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>{comment.author}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: `${sc}15`, color: sc }}>{comment.source === "ki" ? "KI" : comment.source === "system" ? "System" : "Manuell"}</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.dim }}>{comment.date}</span>
                </div>
                <div style={{ fontSize: 13, color: C.text, marginTop: 4, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{comment.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Dokumente ──────────────────────────────────────────────────────────

function TabDokumente() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const live = getLive();
  const instId = live?.installationId;

  const pflicht = MOCK_DOCS.filter((d: any) => d.type === "pflicht");
  const vde = MOCK_DOCS.filter((d: any) => d.type === "vde");
  const uploaded = pflicht.filter((d: any) => d.status === "uploaded").length;

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !instId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append("files", f));
      const token = localStorage.getItem("baunity_token") || "";
      const resp = await fetch(`/api/installations/${instId}/documents`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, credentials: "include", body: formData,
      });
      if (resp.ok) {
        setUploadMsg(`${files.length} Datei${files.length > 1 ? "en" : ""} hochgeladen`);
        setTimeout(() => { setUploadMsg(null); if (live?.isLive) window.location.reload(); }, 2000);
      } else {
        const err = await resp.json().catch(() => ({}));
        setUploadMsg(`Fehler: ${err.error || resp.status}`);
        setTimeout(() => setUploadMsg(null), 4000);
      }
    } catch { setUploadMsg("Upload fehlgeschlagen"); setTimeout(() => setUploadMsg(null), 4000); }
    finally { setUploading(false); }
  };

  const getDocUrl = (doc: any): string => {
    if (doc.url) return doc.url;
    if (doc.id >= 100000) return `/api/crm/dokumente/${doc.id - 100000}/download`;
    return `/api/documents/${doc.id}/download`;
  };

  const handleDownload = async (doc: any) => {
    const url = getDocUrl(doc);
    const token = localStorage.getItem("baunity_token") || "";
    try {
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
      if (!resp.ok) { alert("Download fehlgeschlagen"); return; }
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = doc.name || "dokument";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { alert("Download fehlgeschlagen"); }
  };

  const handlePreview = async (doc: any) => {
    const ext = (doc.name || "").split(".").pop()?.toLowerCase();
    if (!["pdf", "png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) { handleDownload(doc); return; }
    const url = getDocUrl(doc) + "?view=true";
    const token = localStorage.getItem("baunity_token") || "";
    try {
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
      if (!resp.ok) { alert("Vorschau nicht verfügbar"); return; }
      const blob = await resp.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch { alert("Vorschau fehlgeschlagen"); }
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Upload */}
      <div
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = "rgba(212,168,67,0.06)"; }}
        onDragLeave={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,0.15)"; e.currentTarget.style.background = "rgba(212,168,67,0.02)"; }}
        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(212,168,67,0.15)"; e.currentTarget.style.background = "rgba(212,168,67,0.02)"; handleUpload(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        style={{ border: `2px dashed rgba(212,168,67,0.15)`, borderRadius: 14, padding: "24px 20px", textAlign: "center", cursor: uploading ? "wait" : "pointer", background: "rgba(212,168,67,0.02)", transition: "all .2s ease" }}
      >
        <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.dwg,.doc,.docx,.xls,.xlsx" style={{ display: "none" }} onChange={e => handleUpload(e.target.files)} />
        {uploading ? <><div style={{ fontSize: 28, marginBottom: 6 }}>⏳</div><div style={{ fontSize: 14, fontWeight: 600, color: C.accentLight }}>Wird hochgeladen...</div></>
        : uploadMsg ? <div style={{ fontSize: 14, fontWeight: 600, color: uploadMsg.startsWith("Fehler") ? C.red : C.green }}>{uploadMsg}</div>
        : <><div style={{ fontSize: 28, marginBottom: 6, opacity: 0.4 }}>📄</div><div style={{ fontSize: 14, fontWeight: 600, color: C.bright }}>Dokumente hier ablegen oder klicken</div><div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>PDF, JPG, PNG, DWG, DOC, XLS — max. 20 MB</div></>}
      </div>

      {/* Dokument-Liste */}
      <div style={{ ...cardS, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>Dokumente ({MOCK_DOCS.length})</span>
          {pflicht.length > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: uploaded === pflicht.length ? C.green : C.orange }}>{uploaded}/{pflicht.length} Pflicht</span>}
        </div>
        {MOCK_DOCS.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.dim }}>Keine Dokumente vorhanden</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {MOCK_DOCS.map((doc: any) => {
            const ext = (doc.name || "").split(".").pop()?.toLowerCase();
            const isPdf = ext === "pdf";
            const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "");
            const canPreview = isPdf || isImage;
            return (
              <div key={doc.id} className="email-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.borderLight}`, borderRadius: 10 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{doc.status === "missing" ? "❌" : isPdf ? "📑" : isImage ? "🖼️" : "📄"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: doc.status === "missing" ? C.red : C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                  <div style={{ fontSize: 11, color: C.dim }}>{doc.date}{doc.type === "vde" ? " · VDE" : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {canPreview && doc.status !== "missing" && (
                    <button onClick={() => handlePreview(doc)} className="btn-hover" style={{ background: "rgba(212,168,67,0.08)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", fontSize: 11, color: C.accentLight, cursor: "pointer" }}>👁 Vorschau</button>
                  )}
                  {doc.status !== "missing" && (
                    <button onClick={() => handleDownload(doc)} className="btn-hover" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: C.green, cursor: "pointer" }}>↓ Download</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vorschau-Popup */}
      {previewUrl && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", animation: "backdropIn .2s ease" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "90%", maxWidth: 950, height: "88vh", background: "rgba(15,15,30,0.98)", borderRadius: 20, overflow: "hidden", boxShadow: "0 32px 100px rgba(0,0,0,0.7)", border: "1px solid rgba(212,168,67,0.15)", animation: "modalIn .25s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,15,0.95)" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>Dokument-Vorschau</span>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={previewUrl} download className="btn-hover" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "8px 18px", fontSize: 13, color: C.green, textDecoration: "none", fontWeight: 600 }}>↓ Herunterladen</a>
                <button onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} className="btn-hover" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: "8px 18px", fontSize: 13, color: C.red, cursor: "pointer", fontWeight: 600 }}>✕ Schließen</button>
              </div>
            </div>
            {previewUrl.includes("image") || previewUrl.match(/\.(png|jpg|jpeg|gif|webp)/i) ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100% - 56px)", padding: 20, background: "rgba(0,0,0,0.3)" }}>
                <img src={previewUrl} alt="Vorschau" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }} />
              </div>
            ) : (
              <object data={previewUrl} type="application/pdf" style={{ width: "100%", height: "calc(100% - 56px)" }}>
                <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                  <div style={{ fontSize: 14 }}>Vorschau nicht verfügbar — bitte herunterladen</div>
                </div>
              </object>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Tab: Technik (ALLE Felder aus Wizard + Factro + CRM) ────────────────────

function TabTechnik() {
  const a = MOCK.anlage;
  const z = MOCK.zaehler;
  const nb = MOCK.nb;
  const m = MOCK.mastr;
  const ibn = MOCK.ibn;
  const w = MOCK.wizard;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Gesamt-Stats — angepasst an Anlagentyp */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
        {(() => {
          const isSpeicher = a.systemTyp === "Schwarmspeicher" || a.systemTyp === "Großbatteriespeicher";
          const kwp = Number(a.kwp) || 0;
          const kva = Number(a.totalInverterKva) || 0;
          const kwh = Number(a.totalBatteryKwh) || 0;
          const stats: { v: string; u: string; l: string; c: string }[] = [];

          if (isSpeicher) {
            // Speicher: Leistung in kW/MW, kVA, kWh
            stats.push({ v: kwp >= 1000 ? `${(kwp / 1000).toFixed(1)}` : String(kwp), u: kwp >= 1000 ? "MW" : "kW", l: "Nennleistung", c: C.cyan });
            if (kva > 0) stats.push({ v: kva >= 1000 ? `${(kva / 1000).toFixed(1)}` : String(kva), u: kva >= 1000 ? "MVA" : "kVA", l: "Scheinleistung", c: C.blue });
            if (kwh > 0) stats.push({ v: kwh >= 1000 ? `${(kwh / 1000).toFixed(1)}` : String(kwh), u: kwh >= 1000 ? "MWh" : "kWh", l: "Kapazität", c: C.purple });
          } else {
            // PV: kWp, kVA, kWh
            stats.push({ v: String(kwp), u: "kWp", l: "PV-Leistung", c: C.green });
            if (kva > 0) stats.push({ v: String(kva), u: "kVA", l: "WR-Leistung", c: C.blue });
            if (kwh > 0) stats.push({ v: String(kwh), u: "kWh", l: "Speicher", c: C.purple });
          }
          if (a.wallboxEntries.length > 0) stats.push({ v: String(a.wallboxEntries[0].powerKw), u: "kW", l: "Wallbox", c: C.cyan });
          if (a.waermepumpeEntries.length > 0) stats.push({ v: String(a.waermepumpeEntries[0].powerKw), u: "kW", l: "Wärmepumpe", c: C.red });

          // Keine 0-Werte anzeigen
          return stats.filter(s => s.v !== "0" && s.v !== "0.0");
        })().map(s => (
          <div key={s.l} style={{ background: `${s.c}08`, border: `1px solid ${s.c}18`, borderRadius: 10, padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: s.c, opacity: 0.7 }}>{s.u}</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* PV-Module — pro Dachfläche */}
      <div className="tech-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {a.pvEntries.map((pv, i) => (
          <div key={i} className="card-hover" style={{ ...cardS, padding: 20, borderTop: `2px solid ${C.green}30` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>☀️</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>PV — {pv.roofName}</span>
              <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: C.green }}>{((pv.count * pv.powerWp) / 1000).toFixed(2)} kWp</span>
            </div>
            <CopyRow label="Hersteller" value={pv.manufacturer} important />
            <CopyRow label="Modell" value={pv.model} important />
            <CopyRow label="Anzahl" value={`${pv.count} Stück`} />
            <CopyRow label="Leistung/Modul" value={`${pv.powerWp} Wp`} />
            <CopyRow label="Ausrichtung" value={pv.orientation} />
            <CopyRow label="Neigung" value={`${pv.tilt}°`} />
          </div>
        ))}

        {/* Wechselrichter */}
        {a.inverterEntries.map((wr, i) => (
          <div key={`wr-${i}`} className="card-hover" style={{ ...cardS, padding: 20, borderTop: `2px solid ${C.blue}30` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>🔌</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>Wechselrichter</span>
              {wr.hybrid && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(212,168,67,0.12)", color: C.accentLight }}>Hybrid</span>}
            </div>
            <CopyRow label="Hersteller" value={wr.manufacturer} important />
            <CopyRow label="Modell" value={wr.model} important />
            <CopyRow label="Anzahl" value={`${wr.count} Stück`} />
            <CopyRow label="AC-Leistung" value={`${wr.acPowerKw} kW`} />
            <CopyRow label="Scheinleistung" value={`${wr.powerKva} kVA`} />
            <CopyRow label="ZEREZ-Nr." value={wr.zerezId} mono />
          </div>
        ))}

        {/* Speicher */}
        {a.batteryEntries.map((bat, i) => (
          <div key={`bat-${i}`} className="card-hover" style={{ ...cardS, padding: 20, borderTop: `2px solid ${C.purple}30` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>🔋</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>Speicher</span>
            </div>
            <CopyRow label="Hersteller" value={bat.manufacturer} important />
            <CopyRow label="Modell" value={bat.model} important />
            {((bat as any).powerKw || bat.ladeleistungKw) > 0 && <CopyRow label="Leistung" value={`${Number((bat as any).powerKw || bat.ladeleistungKw) >= 1000 ? `${(Number((bat as any).powerKw || bat.ladeleistungKw) / 1000).toFixed(1)} MW` : `${(bat as any).powerKw || bat.ladeleistungKw} kW`}`} important />}
            {Number(bat.capacityKwh || 0) > 0 && <CopyRow label="Kapazität gesamt" value={`${((bat.count || 1) * bat.capacityKwh) >= 1000 ? `${(((bat.count || 1) * bat.capacityKwh) / 1000).toFixed(1)} MWh` : `${((bat.count || 1) * bat.capacityKwh).toFixed(1)} kWh`}`} important />}
            {(bat.count || 1) > 1 && <CopyRow label="Anzahl" value={`${bat.count}×${bat.capacityKwh ? ` (je ${bat.capacityKwh} kWh)` : ""}`} />}
            {bat.coupling && <CopyRow label="Kopplung" value={`${bat.coupling.toUpperCase()}-gekoppelt`} />}
            {bat.batteryType && <CopyRow label="Batterietyp" value={bat.batteryType} />}
            {bat.ladeleistungKw > 0 && !(bat as any).powerKw && <CopyRow label="Ladeleistung" value={`${bat.ladeleistungKw} kW`} />}
            {bat.entladeleistungKw > 0 && <CopyRow label="Entladeleistung" value={`${bat.entladeleistungKw} kW`} />}
          </div>
        ))}

        {/* Wallbox */}
        {a.wallboxEntries.map((wb, i) => (
          <div key={`wb-${i}`} className="card-hover" style={{ ...cardS, padding: 20, borderTop: `2px solid ${C.cyan}30` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>🚗</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>Wallbox</span>
            </div>
            <CopyRow label="Hersteller" value={wb.manufacturer} important />
            <CopyRow label="Modell" value={wb.model} important />
            <CopyRow label="Ladeleistung" value={`${wb.powerKw} kW`} />
            <CopyRow label="Phasen" value={`${wb.phasen}-phasig`} />
            <CopyRow label="Stecker" value={wb.stecker || "—"} />
            <CopyRow label="§14a steuerbar" value={wb.steuerbar14a ? "Ja" : "Nein"} />
          </div>
        ))}

        {/* Wärmepumpe */}
        {a.waermepumpeEntries.map((wp, i) => (
          <div key={`wp-${i}`} className="card-hover" style={{ ...cardS, padding: 20, borderTop: `2px solid ${C.red}30` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>🌡️</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>Wärmepumpe</span>
            </div>
            <CopyRow label="Hersteller" value={wp.manufacturer} important />
            <CopyRow label="Modell" value={wp.model} important />
            <CopyRow label="Leistung" value={`${wp.powerKw} kW`} />
            <CopyRow label="COP" value={String(wp.cop)} />
            <CopyRow label="SG Ready" value={wp.sgReady ? "Ja" : "Nein"} />
            <CopyRow label="§14a steuerbar" value={wp.steuerbar14a ? "Ja" : "Nein"} />
          </div>
        ))}
      </div>

      {/* Anlagenparameter */}
      <div className="card-hover" style={{ ...cardS, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.bright, marginBottom: 14 }}>Anlagenparameter</div>
        <div className="tech-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <CopyRow label="Einspeiseart" value={a.einspeisung} />
          {a.einspeisephasen && <CopyRow label="Einspeisephasen" value={a.einspeisephasen} />}
          <CopyRow label="Messkonzept" value={a.messkonzept} />
          <CopyRow label="Betriebsweise" value={a.betriebsweise} />
          <CopyRow label="Netzebene" value={a.netzebene} />
          <CopyRow label="Blindleistung" value={a.blindleistungskompensation || "—"} />
          <CopyRow label="Einspeisemanagement" value={a.einspeisemanagement || "—"} />
          <CopyRow label="Begrenzung" value={a.begrenzungProzent ? `${a.begrenzungProzent}%` : "—"} />
          <CopyRow label="§14a relevant" value={a.paragraph14a ? "Ja" : "Nein"} />
          <CopyRow label="Inselbetrieb" value={a.inselbetrieb ? "Ja" : "Nein"} />
          <CopyRow label="NA-Schutz" value={a.naSchutzErforderlich ? "Erforderlich" : "Nicht erforderlich"} />
        </div>
      </div>

      {/* Zähler-Bestand + Zähler-Neu + Netzanschluss */}
      <div className="card-hover" style={{ ...cardS, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>🔌</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>Zähler & Netzanschluss</span>
        </div>

        {/* Basis-Zählerdaten (Fallback wenn keine zaehlerBestand vorhanden, z.B. V18-Installationen) */}
        {MOCK.zaehlerBestand.length === 0 && (z.nummer || z.typ) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.borderLight}`, borderRadius: 10, borderLeft: `3px solid ${C.cyan}` }}>
              {z.nummer && <CopyRow label="Zählernr." value={z.nummer} mono important />}
              {z.typ && <CopyRow label="Typ" value={z.typ} />}
              {z.standort && <CopyRow label="Standort" value={z.standort} />}
              {z.tarif && <CopyRow label="Tarif" value={z.tarif} />}
              {z.besitzer && <CopyRow label="Besitzer" value={z.besitzer} />}
              {z.zaehlpunkt && <CopyRow label="ZPB" value={z.zaehlpunkt} mono />}
              {z.marktlokation && <CopyRow label="MLO" value={z.marktlokation} mono />}
            </div>
          </div>
        )}

        {/* Bestehende Zähler */}
        {MOCK.zaehlerBestand.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, padding: "0 10px" }}>Bestehende Zähler</div>
            {MOCK.zaehlerBestand.map(zb => {
              const isAbmelden = zb.aktion === "abmelden";
              return (
                <div key={zb.id} style={{ marginBottom: 8, padding: "10px 12px", background: isAbmelden ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${isAbmelden ? "rgba(239,68,68,0.15)" : C.borderLight}`, borderRadius: 10, borderLeft: isAbmelden ? `3px solid ${C.red}` : `3px solid ${C.green}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isAbmelden ? C.red : C.green }}>{isAbmelden ? "Abmelden" : zb.aktion === "zusammenlegen" ? "Zusammenlegen" : "Behalten"}</span>
                    <span style={{ fontSize: 11, color: C.dim }}>· {zb.verwendung}</span>
                  </div>
                  <CopyRow label="Zählernr." value={zb.zaehlernummer} mono important />
                  <CopyRow label="Typ" value={zb.typ} />
                  <CopyRow label="Standort" value={zb.standort} />
                  <CopyRow label="Tarif" value={zb.tarifart} />
                  {zb.letzterStand !== undefined && <CopyRow label="Letzter Stand" value={`${zb.letzterStand.toLocaleString()} kWh`} />}
                  {zb.ablesedatum && <CopyRow label="Ablesedatum" value={zb.ablesedatum} />}
                  {zb.zaehlpunktbezeichnung && <CopyRow label="ZPB" value={zb.zaehlpunktbezeichnung} mono />}
                  {zb.marktlokationsId && <CopyRow label="MLO" value={zb.marktlokationsId} mono />}
                </div>
              );
            })}
          </div>
        )}

        {/* Neuer Zähler — nur anzeigen wenn Daten vorhanden */}
        {MOCK.zaehlerNeu && (MOCK.zaehlerNeu.gewuenschterTyp || MOCK.zaehlerNeu.standort || MOCK.zaehlerNeu.befestigung) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, padding: "0 10px" }}>Neuer Zähler (gewünscht)</div>
          <div style={{ padding: "10px 12px", background: "rgba(34,197,94,0.04)", border: `1px solid rgba(34,197,94,0.12)`, borderRadius: 10, borderLeft: `3px solid ${C.green}` }}>
            <CopyRow label="Gewünschter Typ" value={MOCK.zaehlerNeu.gewuenschterTyp} important />
            <CopyRow label="Standort" value={MOCK.zaehlerNeu.standort} />
            <CopyRow label="Befestigung" value={MOCK.zaehlerNeu.befestigung} />
            <CopyRow label="Tarif" value={MOCK.zaehlerNeu.tarifart} />
            <CopyRow label="Wandlermessung" value={MOCK.zaehlerNeu.wandlermessung ? `Ja (Faktor ${MOCK.zaehlerNeu.wandlerFaktor})` : "Nein"} />
            {MOCK.zaehlerNeu.bemerkungen && <CopyRow label="Bemerkungen" value={MOCK.zaehlerNeu.bemerkungen} />}
          </div>
        </div>
        )}

        {/* Netzanschluss-Details — nur anzeigen wenn Zählerdaten vorhanden */}
        {(z.nummer || z.typ || z.standort) && (<>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, padding: "0 10px" }}>Netzanschluss</div>
        <CopyRow label="Fernauslesung" value={z.fernauslesung ? "Ja" : "Nein"} />
        <CopyRow label="Smart Meter GW" value={z.smartMeterGateway ? "Ja" : "Nein"} />
        <CopyRow label="iMSys gewünscht" value={z.imsysGewuenscht ? "Ja" : "Nein"} />
        </>)}
      </div>

      {/* NB-Status + MaStR + IBN */}
      <div className="tech-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {/* NB-Status */}
        <div className="card-hover" style={{ ...cardS, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>🏢</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>NB-Status</span>
          </div>
          <CopyRow label="NB" value={nb.name} important />
          <CopyRow label="Az" value={nb.az} mono />
          <CopyRow label="Eingereicht" value={nb.eingereichtAm || "—"} />
          <CopyRow label="Genehmigt" value={nb.genehmigungAm || "—"} />
          <CopyRow label="Tage beim NB" value={nb.daysAtNb > 0 ? `${nb.daysAtNb} Tage` : "—"} />
          <CopyRow label="Rückfrage am" value={nb.rueckfrageAm || "—"} />
          <CopyRow label="Beantwortet" value={nb.rueckfrageBeantwortet ? "Ja" : "Nein"} />
        </div>

        {/* MaStR */}
        <div className="card-hover" style={{ ...cardS, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>🏛️</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>MaStR</span>
          </div>
          <CopyRow label="Nr. Solar" value={m.nrSolar || "—"} mono />
          <CopyRow label="Nr. Speicher" value={m.nrSpeicher || "—"} mono />
          <CopyRow label="Status" value={m.status} />
          <CopyRow label="Letzter Sync" value={m.syncAm || "—"} />
        </div>

        {/* IBN */}
        <div className="card-hover" style={{ ...cardS, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>Inbetriebnahme</span>
          </div>
          <CopyRow label="IBN erledigt" value={ibn.erledigt ? "Ja" : "Nein"} />
          {ibn.geplantAm && <CopyRow label="Geplant am" value={ibn.geplantAm} />}
          <CopyRow label="IBN-Datum" value={ibn.erledigtAm || "—"} />
          {ibn.status && <CopyRow label="Status" value={ibn.status} />}
          {ibn.eegDatum && <CopyRow label="EEG-Datum" value={ibn.eegDatum} />}
          <CopyRow label="Protokoll" value={ibn.protokollUrl ? "Vorhanden" : "—"} />
          <CopyRow label="MaStR registriert" value={ibn.mastrRegistered ? "Ja" : "Nein"} />
          <CopyRow label="NB informiert" value={ibn.gridOperatorNotified ? "Ja" : "Nein"} />
          <CopyRow label="Vollmacht" value={w.vollmachtErteilt ? "Erteilt" : "Fehlt"} />
          <CopyRow label="AGB akzeptiert" value={w.agbAkzeptiert ? "Ja" : "Nein"} />
        </div>
      </div>

      {/* Meta-Infos */}
      <div className="card-hover" style={{ ...cardS, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.bright, marginBottom: 14 }}>Projekt-Infos</div>
        <div className="tech-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <CopyRow label="Falltyp" value={w.caseType} />
          {w.processType && <CopyRow label="Prozesstyp" value={w.processType} />}
          <CopyRow label="Ziel-Komponenten" value={w.registrationTargets.join(", ")} />
          <CopyRow label="Priorität" value={w.priority} />
          <CopyRow label="Erstellt am" value={MOCK.createdAt} />
          <CopyRow label="Erstellt von" value={MOCK.createdByName} />
          <CopyRow label="Rolle" value={MOCK.createdByRole} />
          {MOCK.assignedToName && <CopyRow label="Zugewiesen an" value={MOCK.assignedToName} />}
          <CopyRow label="Public-ID" value={MOCK.publicId} mono />
          <CopyRow label="Inst.-Email" value={MOCK.dedicatedEmail} mono />
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Verlauf ────────────────────────────────────────────────────────────

function TabVerlauf() {
  const [filter, setFilter] = useState("all");
  const [commentInput, setCommentInput] = useState("");
  const [sending, setSending] = useState(false);
  const live = getLive();

  const types = [{ key: "all", label: "Alle" }, { key: "email", label: "📧 Emails" }, { key: "status", label: "🔄 Status" }, { key: "document", label: "📄 Dokumente" }, { key: "comment", label: "💬 Kommentare" }];

  // Kommentare + Activities zusammenführen
  const allItems = [
    ...MOCK_ACTIVITIES,
    ...MOCK_COMMENTS.map((c: any) => ({
      id: c.id + 10000, icon: c.source === "ki" ? "🤖" : c.source === "system" ? "⚙️" : "💬",
      text: `${c.author}: ${c.text}`, date: c.date, type: "comment",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = filter === "all" ? allItems : allItems.filter(a => a.type === filter);
  const typeColors: Record<string, string> = { email: C.blue, status: C.orange, document: C.green, comment: C.purple, system: C.cyan };

  const sendComment = async () => {
    if (!commentInput.trim() || sending) return;
    setSending(true);
    try {
      const instId = live?.installationId;
      if (instId) {
        const token = localStorage.getItem("baunity_token") || "";
        await fetch(`/api/installations/${instId}/comments`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: commentInput.trim() }),
        });
      }
      setCommentInput("");
      // Reload
      if (live?.isLive) window.location.reload();
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Kommentar schreiben */}
      <div style={{ display: "flex", gap: 8 }}>
        <input value={commentInput} onChange={e => setCommentInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") sendComment(); }}
          placeholder="Kommentar schreiben... (wird zu Factro gesynct)"
          style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", color: C.text, fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
        <button onClick={sendComment} disabled={!commentInput.trim() || sending} className="btn-hover" style={{
          background: commentInput.trim() && !sending ? C.accent : "rgba(30,30,58,0.5)", color: commentInput.trim() && !sending ? "#fff" : C.dim,
          border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 700, cursor: commentInput.trim() && !sending ? "pointer" : "default",
        }}>
          {sending ? "..." : "Senden"}
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {types.map(t => {
          const count = t.key === "all" ? allItems.length : allItems.filter(a => a.type === t.key).length;
          return (
            <button key={t.key} className="chip-btn" onClick={() => setFilter(t.key)} style={{ background: filter === t.key ? "rgba(212,168,67,0.2)" : "rgba(255,255,255,0.04)", color: filter === t.key ? C.accentLight : C.muted, border: `1px solid ${filter === t.key ? "rgba(212,168,67,0.3)" : C.border}`, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>
              {t.label} <span style={{ opacity: 0.5, marginLeft: 4 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div style={{ position: "relative", paddingLeft: 24 }}>
        <div style={{ position: "absolute", left: 4, top: 8, bottom: 8, width: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1 }} />
        {filtered.length === 0 && <div style={{ padding: "24px 0", textAlign: "center", color: C.dim }}>Noch keine Einträge</div>}
        {filtered.map((a, i) => (
          <div key={a.id} className="slide-up" style={{ display: "flex", gap: 14, padding: "10px 0", position: "relative", animationDelay: `${i * 40}ms` }}>
            <div className="timeline-dot" style={{ background: typeColors[a.type] || C.dim, position: "absolute", left: -20 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{a.icon}</span>
                  <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5, wordBreak: "break-word" }}>{a.text}</span>
                </div>
                <span style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>{a.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function MockDetailPanelV2({ onBack }: { onBack?: () => void } = {}) {
  // Live-Daten Bridge: Bei jedem Render prüfen ob echte Daten vorliegen
  const LIVE = getLive();
  if (LIVE?.isLive) {
    MOCK = LIVE.data;
    MOCK_EMAILS = LIVE.emails as any || [];
    MOCK_ACTIVITIES = LIVE.activities as any || [];
    MOCK_DOCS = LIVE.docs as any || [];
    MOCK_COMMENTS = LIVE.comments as any || [];
  } else {
    MOCK = MOCK_FALLBACK;
    MOCK_EMAILS = MOCK_EMAILS_FALLBACK;
    MOCK_ACTIVITIES = MOCK_ACTIVITIES_FALLBACK;
    MOCK_DOCS = MOCK_DOCS_FALLBACK;
    MOCK_COMMENTS = MOCK_COMMENTS_FALLBACK;
  }

  const [activeTab, setActiveTab] = useState(0);
  const [alleDatenOpen, setAlleDatenOpen] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [mockRole, setMockRole] = useState<"admin" | "kunde">(LIVE?.isLive ? (LIVE.isStaff ? "admin" : "kunde") : "admin");
  const isStaff = LIVE?.isLive ? LIVE.isStaff : mockRole === "admin";
  const d = MOCK;
  const isLive = !!LIVE?.isLive;
  const [statusModalTarget, setStatusModalTarget] = useState<string | null>(null);
  const [statusChangeKey, setStatusChangeKey] = useState(0); // Force re-render nach Status-Wechsel

  const missingDocs = MOCK_DOCS.filter(d => d.status === "missing").length;
  const unreadEmails = MOCK_EMAILS.filter(e => e.dir === "in").length;
  const tabs = isStaff ? [
    { label: "Was muss ich tun?", icon: "🔥", badge: "2 offen", badgeColor: C.red },
    { label: "Was hat der NB geschrieben?", icon: "📨", badge: `${unreadEmails} neu`, badgeColor: C.blue },
    { label: "Sind alle Unterlagen da?", icon: "📋", badge: missingDocs > 0 ? `${missingDocs} fehlt` : "Alles da", badgeColor: missingDocs > 0 ? C.red : C.green },
    { label: "Anlagendaten", icon: "⚡" },
    { label: "Was ist passiert?", icon: "📜", badge: `${MOCK_ACTIVITIES.length}` },
  ] : [
    { label: "Aktueller Stand", icon: "📊" },
    { label: "Was hat der NB geschrieben?", icon: "📨", badge: `${unreadEmails} neu`, badgeColor: C.blue },
    { label: "Sind alle Unterlagen da?", icon: "📋", badge: missingDocs > 0 ? `${missingDocs} fehlt` : "Alles da", badgeColor: missingDocs > 0 ? C.red : C.green },
    { label: "Anlagendaten", icon: "⚡" },
    { label: "Was ist passiert?", icon: "📜", badge: `${MOCK_ACTIVITIES.length}` },
  ];

  // NB-Email aus Backend-Template laden (statt hardcoded Mock)
  const [nbEmailSubject, setNbEmailSubject] = useState("");
  const [nbEmailBody, setNbEmailBody] = useState("");
  const [nbEmailHtml, setNbEmailHtml] = useState("");
  const [nbSendTarget, setNbSendTarget] = useState("");
  const [nbSending, setNbSending] = useState(false);
  const [nbAttachments, setNbAttachments] = useState<File[]>([]);
  const [nbNorm, setNbNorm] = useState("4110");
  const [nbForms, setNbForms] = useState("E1,E8");

  useEffect(() => {
    const live = getLive();
    const instId = live?.installationId || live?.data?._raw?.id;
    if (!instId) return;
    fetch(`/api/crm/nb-anfrage/render/${instId}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setNbEmailSubject(data.betreff);
          setNbEmailBody(data.htmlBody.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim());
          setNbEmailHtml(data.htmlBody);
          setNbSendTarget(data.nbEmail || "");
          if (data.norm) setNbNorm(data.norm);
          if (data.forms) setNbForms(data.forms.join(","));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, color: C.text, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{css}</style>

      {/* ═══ HEADER ═══ */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,15,0.97)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}` }}>
        {/* Row 1: Navigation + Info */}
        <div className="v2-header-row1" style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 28px 0", flexWrap: "wrap" }}>
          <button onClick={onBack} className="btn-hover" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 16px", fontSize: 13, color: C.muted, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans'" }}>← Zurück</button>

          {/* Projekt-Info */}
          <div className="v2-header-info" style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, flexWrap: "wrap" }}>
            {(() => {
              const raw = getLive()?.data?._raw;
              const status = raw?.status || raw?.statusLabel || "";
              const hasRueckfrage = d.nb.rueckfrageText && !d.nb.rueckfrageBeantwortet;
              const statusColor = hasRueckfrage ? C.red : status === "GENEHMIGT" ? C.green : status === "FERTIG" || status === "ABGESCHLOSSEN" ? C.green : status === "STORNIERT" ? C.dim : C.blue;
              const statusLabel = hasRueckfrage ? "Rückfrage" : raw?.statusLabel || status || "Offen";
              return (<>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: statusColor, flexShrink: 0, boxShadow: `0 0 8px ${statusColor}40` }} />
                <span style={{ fontSize: 20, fontWeight: 800, color: C.bright, letterSpacing: -0.5 }}>{(() => {
                  const live = getLive();
                  const eig = live?.data?.eigentuemer;
                  const crmTitel = live?.data?.crm?.titel;
                  // Priorität: CRM-Titel > Eigentümer > Betreiber
                  if (crmTitel) return crmTitel;
                  if (eig?.name && eig.name !== d.betreiber.firma) return eig.name;
                  return d.betreiber.firma || `${d.betreiber.vorname} ${d.betreiber.nachname}`.trim();
                })()}</span>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6, background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}>{statusLabel}</span>
                {d.wizard.caseType && <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6, background: "rgba(59,130,246,0.1)", color: C.blue }}>{d.wizard.caseType === "PV_WITH_STORAGE" ? "PV+Sp" : d.wizard.caseType === "NEUBAU" ? "NA" : d.wizard.caseType.substring(0, 8)}</span>}
                <span className="v2-header-kpi" style={{ fontSize: 18, fontWeight: 800, color: C.green }}>{d.anlage.kwp} <span style={{ fontSize: 12, fontWeight: 600 }}>kWp</span></span>
                <span style={{ fontSize: 12, color: C.dim, fontFamily: "'JetBrains Mono', monospace" }}>{d.publicId}</span>
              </>);
            })()}
          </div>

          {/* Mock Rollen-Toggle (nur für Demo, nicht im Live-Modus) */}
          {!isLive && <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
            {(["admin", "kunde"] as const).map(r => (
              <button key={r} onClick={() => { setMockRole(r); setActiveTab(0); }} style={{
                padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: mockRole === r ? (r === "admin" ? "rgba(212,168,67,0.15)" : "rgba(34,197,94,0.12)") : "transparent",
                color: mockRole === r ? (r === "admin" ? C.accentLight : C.green) : C.dim, fontFamily: "'DM Sans'",
              }}>{r === "admin" ? "Admin" : "Kunde"}</button>
            ))}
          </div>}
        </div>

        {/* Row 2: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 28px 0", flexWrap: "wrap" }}>
          <button onClick={() => setAlleDatenOpen(true)} className="btn-hover" style={{
            background: "rgba(212,168,67,0.06)", color: C.accentLight,
            border: `1px solid rgba(212,168,67,0.15)`, borderRadius: 10,
            padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans'",
          }}>
            📋 Alle Daten
          </button>
          {isStaff && <button onClick={() => {
            // DEBUG: Was sind die aktuellen Daten?
            const freshLive = getLive();
            const freshD = freshLive?.isLive ? freshLive.data : MOCK_FALLBACK;
            const freshAnlage = freshD.anlage || d.anlage;
            // Daten werden direkt im Modal berechnet (keine States nötig)
            const kwp = Number(freshAnlage.kwp) || 0;
            const isSpeicher = (freshAnlage.systemTyp || d.anlage.systemTyp) === "Schwarmspeicher" || (freshAnlage.systemTyp || d.anlage.systemTyp) === "Großbatteriespeicher";
            const leistungStr = kwp >= 1000 ? `${(kwp / 1000).toFixed(kwp % 1000 === 0 ? 0 : 1)} MW (${kwp.toLocaleString("de-DE")} kW)` : `${kwp} kW`;
            const sysTyp = freshAnlage.systemTyp || d.anlage.systemTyp || "";
            const typStr = isSpeicher ? (sysTyp === "Schwarmspeicher" ? "Schwarmspeicher" : "Stationärer Großbatteriespeicher") : `PV-Anlage ${leistungStr}`;
            const freshBetreiber = freshD.betreiber || d.betreiber;
            const freshStandort = freshD.standort || d.standort;
            const freshNb = freshD.nb || d.nb;
            const betreiber = freshBetreiber.firma || `${freshBetreiber.vorname} ${freshBetreiber.nachname}`.trim();
            const standort = `${freshStandort.strasse} ${freshStandort.hausnr}`.trim() + `, ${freshStandort.plz} ${freshStandort.ort}`;

            setNbSendTarget(freshNb.email || "");
            setNbEmailSubject(`Netzanschlussanfrage — ${leistungStr} ${typStr} — ${standort}`);

            const wr0 = freshAnlage.inverterEntries?.[0] || d.anlage.inverterEntries[0];
            const bat0 = freshAnlage.batteryEntries?.[0] || d.anlage.batteryEntries[0];
            const eigentuemer = freshLive?.data?.eigentuemer?.name || freshBetreiber.firma || betreiber;
            const gemarkung = freshStandort.gemarkung ? `${freshStandort.gemarkung}${freshStandort.flurstuck ? `, Flurstück ${freshStandort.flurstuck}` : ""}` : "";
            const isMS = kwp >= 135 || isSpeicher;
            const norm = isMS ? "VDE-AR-N 4110/4120" : "VDE-AR-N 4105";
            const anschlussebene = kwp >= 10000 ? "Hochspannung (HS) / Mittelspannung (MS)" : kwp >= 135 ? "Mittelspannung (MS)" : "Niederspannung (NS)";
            const zerezId = wr0?.zerezId || "";

            const wrLine = wr0 ? `${wr0.count || 1}× ${wr0.manufacturer} ${wr0.model} (${(wr0.acPowerKw || 0).toLocaleString("de-DE")} kW / ${(wr0.powerKva || 0).toLocaleString("de-DE")} kVA)` : "";
            const batLine = bat0 ? `${((bat0.count || 1) * (bat0.ladeleistungKw || bat0.capacityKwh || 0)).toLocaleString("de-DE")} kW (${bat0.count || 1}× ${bat0.manufacturer} ${bat0.model})` : "";
            const freshPvEntries = freshAnlage.pvEntries || d.anlage.pvEntries || [];
            const pvLine = freshPvEntries.length > 0 ? `${freshPvEntries.reduce((s: number, p: any) => s + (p.count || 0), 0)}× ${freshPvEntries[0]?.manufacturer} ${freshPvEntries[0]?.model} (${kwp} kWp)` : "";

            setNbEmailBody(
`Sehr geehrte Damen und Herren,

im Auftrag der ${betreiber} stellen wir hiermit eine Netzanschlussanfrage gemäß ${norm} für die Errichtung ${isSpeicher ? "eines stationären " + (d.anlage.systemTyp === "Schwarmspeicher" ? "Schwarmspeichers" : "Großbatteriespeichers") : `einer PV-Anlage (${leistungStr})`} am nachfolgend genannten Standort.

STANDORT DER GEPLANTEN ANLAGE
Adresse:              ${standort}
Grundstückseigentümer: ${eigentuemer}${gemarkung ? `\nGemarkung / Flurstück: ${gemarkung}` : ""}

TECHNISCHE ECKDATEN
Anlagentyp:           ${typStr}
Anschlussleistung:    ${leistungStr}${wrLine ? `\nWechselrichter / PCS: ${wrLine}` : ""}${batLine ? `\nSpeicherleistung:     ${batLine}` : ""}${pvLine ? `\nPV-Module:            ${pvLine}` : ""}
Anschlussebene:       ${anschlussebene}

ANLAGENBETREIBER / ANSCHLUSSNEHMER
Firma:    ${freshBetreiber.firma || betreiber}${freshBetreiber.vertreter ? `\nVertreter: ${freshBetreiber.vertreter}` : ""}
Adresse:  ${freshBetreiber.strasse} ${freshBetreiber.hausnr}, ${freshBetreiber.plz} ${freshBetreiber.ort}${freshBetreiber.telefon ? `\nTelefon:  ${freshBetreiber.telefon}` : ""}

Folgende Unterlagen liegen diesem Antrag bei bzw. können bei Bedarf umgehend nachgereicht werden:
${isMS ? `• E.1 Antragstellung (VDE-AR-N 4110)
• E.8 Datenblatt einer Erzeugungsanlage / eines Speichers (VDE-AR-N 4110)` : `• E.1 Anmeldung (VDE-AR-N 4105)
• E.2 Datenblatt Erzeugungsanlage (VDE-AR-N 4105)`}
• Einpoliger Übersichtsschaltplan mit Messkonzept
• Lageplan mit Aufstellort der geplanten Anlage
• Vollmacht des Grundstückseigentümers
• Technisches Datenblatt Wechselrichter / PCS${zerezId ? `\n• Einheitenzertifikat (ZEREZ-ID: ${zerezId})` : ""}

Wir bitten Sie um:
• Prüfung der Netzanschlussmöglichkeit und Durchführung der Netzverträglichkeitsprüfung
• Mitteilung der voraussichtlichen Anschlusskosten
• Information zum zeitlichen Ablauf bis zur Netzanschlusszusage

Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.

Mit freundlichen Grüßen

LeCa GmbH & Co. KG
Netzanmeldung / Baunity
Vogesenblick 21, 77933 Lahr
Tel: +49 (0) 7821 / 9239 850
E-Mail: netzanmeldung@lecagmbh.de
www.baunity.de`
            );

            setEmailPreviewOpen(true);
          }} className="btn-hover" style={{
            background: "rgba(255,255,255,0.03)", color: C.muted,
            border: `1px solid ${C.border}`, borderRadius: 10,
            padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans'",
          }}>
            📧 NB-Email Vorschau
          </button>}
          <div style={{ flex: 1 }} />
          {isStaff && d.nb.rueckfrageText && !d.nb.rueckfrageBeantwortet && (
            <button onClick={() => setActiveTab(1)} className="btn-hover" style={{
              background: `linear-gradient(135deg, ${C.red}, #b91c1c)`, color: "#fff",
              border: "none", borderRadius: 10,
              padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: `0 4px 20px rgba(239,68,68,0.25)`, fontFamily: "'DM Sans'",
              letterSpacing: -0.2,
            }}>
              → Rückfrage beantworten
            </button>
          )}
        </div>

        {/* Row 3: Lifecycle */}
        <div className="v2-lifecycle" style={{ padding: "10px 28px 12px" }}>
          <LifecycleBar onStatusChange={isLive && isStaff ? (newStatus) => setStatusModalTarget(newStatus) : undefined} />
        </div>
      </div>

      {/* ═══ VERKNÜPFUNGEN ═══ */}
      {isLive && (() => {
        const live = getLive();
        const data = live?.data;
        if (!data) return null;
        const hasCrm = data._linkedCrmId && data._linkedCrmId > 0;
        const hasInst = data._linkedInstallationId && data._linkedInstallationId > 0;
        const hasFactro = data._linkedFactroNumber;
        const isCrmWithoutInst = !hasInst && data.publicId?.startsWith("CRM-");
        if (!hasCrm && !hasInst && !hasFactro && !isCrmWithoutInst) return null;
        return (
          <div style={{ padding: "0 28px 8px", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {hasCrm && (
              <a href={`/netzanmeldungen/crm-${data._linkedCrmId}`} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                background: "linear-gradient(135deg, rgba(212,168,67,0.08), rgba(212,168,67,0.03))",
                border: "1px solid rgba(212,168,67,0.15)", borderRadius: 12, textDecoration: "none",
                flex: 1, minWidth: 200, transition: "all .15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,168,67,0.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,168,67,0.15)"; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(212,168,67,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>Verknüpftes CRM-Projekt</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>CRM-{data._linkedCrmId}{data._linkedCrmTitel ? ` · ${data._linkedCrmTitel}` : ""}</div>
                  {data._linkedCrmStage && (() => {
                    const stageLabels: Record<string, { label: string; color: string }> = {
                      ANFRAGE: { label: "Anfrage", color: C.dim }, HV_VERMITTELT: { label: "HV vermittelt", color: C.purple },
                      AUFTRAG: { label: "Auftrag", color: C.accent }, NB_ANFRAGE: { label: "NB-Anfrage", color: C.blue },
                      NB_KOMMUNIKATION: { label: "NB-Kommunikation", color: C.cyan }, NB_GENEHMIGT: { label: "Genehmigt", color: C.green },
                      NB_ABGELEHNT: { label: "Abgelehnt", color: C.red }, EINGESTELLT: { label: "Eingestellt", color: C.orange },
                      ABGESCHLOSSEN: { label: "Abgeschlossen", color: C.green }, BAUANTRAG: { label: "Bauantrag", color: C.amber },
                      BAUGENEHMIGT: { label: "Baugenehmigt", color: C.green }, BAUBEGINN: { label: "Baubeginn", color: C.cyan },
                    };
                    const s = stageLabels[data._linkedCrmStage] || { label: data._linkedCrmStage.replace(/_/g, " "), color: C.dim };
                    return <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: `${s.color}15`, color: s.color, marginTop: 2, display: "inline-block" }}>{s.label}</span>;
                  })()}
                </div>
                <span style={{ fontSize: 12, color: C.accentLight, fontWeight: 600 }}>Öffnen →</span>
              </a>
            )}
            {hasInst && (
              <a href={`/netzanmeldungen/${data._linkedInstallationId}`} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))",
                border: "1px solid rgba(59,130,246,0.15)", borderRadius: 12, textDecoration: "none",
                flex: 1, minWidth: 200, transition: "all .15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.15)"; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: 0.5 }}>Verknüpfte Netzanmeldung</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>{data._linkedInstallationPublicId || `#${data._linkedInstallationId}`}</div>
                </div>
                <span style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>Öffnen →</span>
              </a>
            )}
            {hasFactro && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                background: "linear-gradient(135deg, rgba(251,146,60,0.08), rgba(251,146,60,0.03))",
                border: "1px solid rgba(251,146,60,0.15)", borderRadius: 12, minWidth: 160,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(251,146,60,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔄</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: 0.5 }}>Factro</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>#{data._linkedFactroNumber}</div>
                </div>
              </div>
            )}
            {/* Installation erstellen Button (CRM ohne Installation) */}
            {isCrmWithoutInst && isStaff && (
              <button onClick={async () => {
                if (!confirm("Netzanmeldung aus diesem CRM-Projekt erstellen?")) return;
                try {
                  const token = localStorage.getItem("baunity_token") || "";
                  const resp = await fetch(`/api/crm/projekte/${data.crm?.id || data._raw?.id}/create-installation`, {
                    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, credentials: "include",
                  });
                  if (resp.ok) {
                    const result = await resp.json();
                    alert(`Installation ${result.publicId} erstellt!`);
                    window.location.href = `/netzanmeldungen/${result.installationId}`;
                  } else {
                    const err = await resp.json().catch(() => ({}));
                    alert(err.error || "Fehler beim Erstellen");
                  }
                } catch { alert("Netzwerkfehler"); }
              }} className="btn-hover" style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
                background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.06))",
                border: "1px solid rgba(34,197,94,0.25)", borderRadius: 12, cursor: "pointer",
                fontSize: 13, fontWeight: 700, color: C.green,
              }}>
                ⚡ Netzanmeldung erstellen
              </button>
            )}
          </div>
        );
      })()}

      {/* ═══ TABS ═══ */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, background: "rgba(10,10,15,0.6)", padding: "0 24px", position: "sticky", top: 80, zIndex: 10 }}>
        {tabs.map((tab, i) => (
          <button key={tab.label} className={`tab-btn ${activeTab === i ? "active" : ""}`} onClick={() => setActiveTab(i)} style={{ padding: "14px 22px", fontSize: 14, fontWeight: activeTab === i ? 700 : 500, color: activeTab === i ? C.bright : C.dim, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>{tab.icon}</span>{tab.label}
            {tab.badge && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, marginLeft: 2,
                background: (tab.badgeColor || C.accent) + "18",
                color: tab.badgeColor || C.accent,
                border: `1px solid ${(tab.badgeColor || C.accent)}25`,
              }}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="v2-content" style={{ flex: 1, overflowY: "auto", padding: 24, maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {activeTab === 0 && <TabWasMusIchTun onAlleDaten={() => setAlleDatenOpen(true)} onSwitchTab={setActiveTab} isStaff={isStaff} />}
        {activeTab === 1 && <TabKommunikation />}
        {activeTab === 2 && <TabDokumente />}
        {activeTab === 3 && <TabTechnik />}
        {activeTab === 4 && <TabVerlauf />}
      </div>

      {/* ═══ MODALS ═══ */}
      <AlleDatenModal open={alleDatenOpen} onClose={() => setAlleDatenOpen(false)} />

      {/* Status-Wechsel Modal */}
      {statusModalTarget && (
        <StatusChangeModal
          open={true}
          onClose={() => setStatusModalTarget(null)}
          targetStatus={statusModalTarget}
          installationId={LIVE?.installationId || 0}
          currentStatus={LIFECYCLE[getCurrentStep()]?.key || "eingang"}
          onSuccess={() => {
            setStatusModalTarget(null);
            setStatusChangeKey(k => k + 1);
            // Seite neu laden um echte Daten zu refreshen
            if (isLive) window.location.reload();
          }}
        />
      )}

      <Modal open={emailPreviewOpen} onClose={() => setEmailPreviewOpen(false)} title="📨 Netzanschlussanfrage" subtitle="">
        {/* Alles inline berechnen aus FRISCHEN Live-Daten */}
        {(() => {
          const fl = getLive();
          const fd = fl?.isLive ? fl.data : MOCK_FALLBACK;
          const fa = fd.anlage || d.anlage;
          const fb = fd.betreiber || d.betreiber;
          const fs = fd.standort || d.standort;
          const fn = fd.nb || d.nb;
          const kwp = Number(fa.kwp) || 0;
          const isSp = (fa.systemTyp || "") === "Schwarmspeicher" || (fa.systemTyp || "") === "Großbatteriespeicher";
          const lStr = kwp >= 1000 ? `${(kwp / 1000).toFixed(kwp % 1000 === 0 ? 0 : 1)} MW (${kwp.toLocaleString("de-DE")} kW)` : `${kwp} kW`;
          const sTyp = fa.systemTyp || "";
          const tStr = isSp ? (sTyp === "Schwarmspeicher" ? "Schwarmspeicher" : "Stationärer Großbatteriespeicher") : `PV-Anlage`;
          const wr0 = (fa.inverterEntries || [])[0];
          const bat0 = (fa.batteryEntries || [])[0];
          const eig = fl?.data?.eigentuemer?.name || fb.firma || "";
          const gem = fs.gemarkung ? `${fs.gemarkung}${fs.flurstuck ? `, Flurstück ${fs.flurstuck}` : ""}` : "";
          const isMS = kwp >= 135 || isSp;
          const norm = isMS ? "VDE-AR-N 4110/4120" : "VDE-AR-N 4105";
          const ebene = kwp >= 10000 ? "Hochspannung (HS) / Mittelspannung (MS)" : kwp >= 135 ? "Mittelspannung (MS)" : "Niederspannung (NS)";
          const zerez = wr0?.zerezId || "";
          const standort = `${fs.strasse} ${fs.hausnr}`.trim() + `, ${fs.plz} ${fs.ort}`;
          const wrLine = wr0 ? `${wr0.count || 1}× ${wr0.manufacturer} ${wr0.model} (${(wr0.acPowerKw || 0).toLocaleString("de-DE")} kW / ${(wr0.powerKva || 0).toLocaleString("de-DE")} kVA)` : "";
          const batPow = bat0 ? ((bat0.count || 1) * (bat0.ladeleistungKw || bat0.capacityKwh || 0)) : 0;
          const batLine = bat0 ? `${batPow >= 1000 ? `${(batPow/1000).toFixed(1)} MW` : `${batPow} kW`} (${bat0.count || 1}× ${bat0.manufacturer} ${bat0.model})` : "";
          const subj = `Netzanschlussanfrage — ${lStr} ${tStr} — ${standort}`;
          const unterlagen = isMS
            ? [`E.1 Antragstellung (VDE-AR-N 4110)`, `E.8 Datenblatt EZA / Speicher (VDE-AR-N 4110)`]
            : [`E.1 Anmeldung (VDE-AR-N 4105)`, `E.2 Datenblatt Erzeugungsanlage (VDE-AR-N 4105)`, ...(bat0 ? [`E.3 Datenblatt Speicher (VDE-AR-N 4105)`] : []), `E.8 Inbetriebsetzungsprotokoll (VDE-AR-N 4105)`];
          unterlagen.push("Einpoliger Übersichtsschaltplan mit Messkonzept", "Lageplan mit Aufstellort", "Vollmacht des Grundstückseigentümers", "Technisches Datenblatt Wechselrichter / PCS");
          if (zerez) unterlagen.push(`Einheitenzertifikat (ZEREZ-ID: ${zerez})`);

          const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#1a1a2e;background:#f8f9fa}
.wrap{max-width:680px;margin:0 auto;background:#fff}
.header{background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;padding:32px 40px}
.header h1{margin:0 0 4px;font-size:20px;font-weight:700;letter-spacing:-0.3px}
.header p{margin:0;font-size:13px;color:#94a3b8}
.content{padding:32px 40px}
.greeting{font-size:15px;line-height:1.7;margin-bottom:24px}
.section{margin-bottom:24px}
.section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#D4A843;border-bottom:2px solid #D4A843;padding-bottom:6px;margin-bottom:12px}
.data-table{width:100%;border-collapse:collapse}
.data-table td{padding:6px 0;font-size:14px;vertical-align:top;border-bottom:1px solid #f1f5f9}
.data-table td:first-child{color:#64748b;font-size:13px;width:180px;padding-right:16px}
.data-table td:last-child{color:#1e293b;font-weight:500}
.docs-list{list-style:none;padding:0;margin:0}
.docs-list li{padding:6px 0;font-size:14px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px}
.docs-list li::before{content:"📄";font-size:14px}
.request-list{list-style:none;padding:0;margin:0}
.request-list li{padding:5px 0;font-size:14px;color:#334155}
.request-list li::before{content:"→ ";color:#D4A843;font-weight:700}
.closing{font-size:14px;line-height:1.7;margin-top:24px;color:#334155}
.signature{margin-top:24px;padding-top:20px;border-top:2px solid #e2e8f0}
.sig-name{font-size:15px;font-weight:700;color:#1e293b}
.sig-company{font-size:13px;color:#D4A843;font-weight:600;margin-top:2px}
.sig-details{font-size:12px;color:#64748b;margin-top:6px;line-height:1.6}
.sig-details a{color:#D4A843;text-decoration:none}
.footer{background:#f8fafc;padding:16px 40px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0}
</style></head><body>
<div class="wrap">
<div class="header">
<h1>Netzanschlussanfrage</h1>
<p>${norm} · ${tStr}</p>
</div>
<div class="content">
<div class="greeting">
Sehr geehrte Damen und Herren,<br><br>
im Auftrag der <strong>${fb.firma || `${fb.vorname || ""} ${fb.nachname || ""}`.trim() || "—"}</strong> stellen wir hiermit eine Netzanschlussanfrage gemäß ${norm} für die Errichtung ${isSp ? `eines stationären ${sTyp === "Schwarmspeicher" ? "Schwarmspeichers" : "Großbatteriespeichers"}` : `einer PV-Anlage (${lStr})`} am nachfolgend genannten Standort.
</div>
<div class="section">
<div class="section-title">Standort der geplanten Anlage</div>
<table class="data-table">
<tr><td>Adresse</td><td><strong>${standort}</strong></td></tr>
<tr><td>Grundstückseigentümer</td><td>${eig}</td></tr>
${gem ? `<tr><td>Gemarkung / Flurstück</td><td>${gem}</td></tr>` : ""}
</table>
</div>
<div class="section">
<div class="section-title">Technische Eckdaten</div>
<table class="data-table">
<tr><td>Anlagentyp</td><td><strong>${tStr}</strong></td></tr>
<tr><td>Anschlussleistung (AC)</td><td><strong>${lStr}</strong></td></tr>
${wrLine ? `<tr><td>Wechselrichter / PCS</td><td>${wrLine}</td></tr>` : ""}
${batLine ? `<tr><td>Speicherleistung</td><td>${batLine}</td></tr>` : ""}
<tr><td>Anschlussebene</td><td>${ebene}</td></tr>
</table>
</div>
<div class="section">
<div class="section-title">Anlagenbetreiber / Anschlussnehmer</div>
<table class="data-table">
<tr><td>Firma</td><td><strong>${fb.firma || `${fb.vorname || ""} ${fb.nachname || ""}`.trim() || "—"}</strong></td></tr>
${fb.vertreter ? `<tr><td>Vertreter</td><td>${fb.vertreter}</td></tr>` : ""}
<tr><td>Adresse</td><td>${fb.strasse} ${fb.hausnr}, ${fb.plz} ${fb.ort}</td></tr>
${fb.telefon ? `<tr><td>Telefon</td><td>${fb.telefon}</td></tr>` : ""}
</table>
</div>
<div class="section">
<div class="section-title">Beiliegende Unterlagen</div>
<ul class="docs-list">${unterlagen.map(u => `<li>${u}</li>`).join("")}</ul>
</div>
<div class="section">
<div class="section-title">Unsere Bitte</div>
<ul class="request-list">
<li>Prüfung der Netzanschlussmöglichkeit und Durchführung der Netzverträglichkeitsprüfung</li>
<li>Mitteilung der voraussichtlichen Anschlusskosten</li>
<li>Information zum zeitlichen Ablauf bis zur Netzanschlusszusage</li>
</ul>
</div>
<div class="closing">Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.</div>
<div class="signature">
<div class="sig-name">LeCa GmbH &amp; Co. KG</div>
<div class="sig-company">Netzanmeldung / Baunity</div>
<div class="sig-details">
Vogesenblick 21, 77933 Lahr<br>
Tel: +49 (0) 7821 / 9239 850<br>
E-Mail: <a href="mailto:netzanmeldung@lecagmbh.de">netzanmeldung@lecagmbh.de</a><br>
<a href="https://www.baunity.de">www.baunity.de</a>
</div>
</div>
</div>
<div class="footer">Diese Nachricht wurde automatisch über Baunity generiert.</div>
</div>
</body></html>`;

          return (<>
        <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: "6px 10px", fontSize: 12, marginBottom: 14, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: `1px solid ${C.borderLight}` }}>
          <span style={{ color: C.dim }}>Von:</span>
          <span style={{ color: "#60a5fa", fontWeight: 600 }}>netzanmeldung@lecagmbh.de</span>
          <span style={{ color: C.dim }}>An:</span>
          <span style={{ color: C.bright, fontWeight: 600 }}>{fn.email || "—"}</span>
          <span style={{ color: C.dim }}>CC:</span>
          <span style={{ color: "#94a3b8" }}>{fd.dedicatedEmail || fl?.data?._raw?.dedicatedEmail || "—"}</span>
          <span style={{ color: C.dim }}>Betreff:</span>
          <span style={{ color: C.bright, fontWeight: 600 }}>{subj}</span>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>Inhalt:</div>
          <iframe srcDoc={htmlBody} style={{ width: "100%", height: 520, border: `1px solid ${C.borderLight}`, borderRadius: 8, background: "#fff" }} title="NB-Email" />
        </div>

        {/* Anhänge: VDE-Formulare (automatisch, inline berechnet) */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>Anhänge:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {(isMS
              ? ["E.1 Antragstellung (VDE 4110)", "E.8 Datenblatt EZA/Speicher (VDE 4110)", "Übersichtsschaltplan"]
              : ["E.1 Anmeldung (VDE 4105)", "E.2 Datenblatt EZA (VDE 4105)", ...(d.anlage.batteryEntries?.length > 0 ? ["E.3 Datenblatt Speicher (VDE 4105)"] : []), "E.8 IBN-Protokoll (VDE 4105)", "Übersichtsschaltplan"]
            ).map(name => (
              <span key={name} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.2)", borderRadius: 6, fontSize: 10, color: "#a5b4fc", fontWeight: 600 }}>
                📄 {name}
              </span>
            ))}
            {(nbAttachments || []).map((f: File, i: number) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 6, fontSize: 10, color: "#86efac", fontWeight: 600 }}>
                📎 {f.name}
                <button onClick={() => setNbAttachments(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 12, padding: 0, marginLeft: 2 }}>×</button>
              </span>
            ))}
          </div>
          {/* Drag & Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#D4A843"; }}
            onDragLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            onDrop={e => {
              e.preventDefault();
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              const files = Array.from(e.dataTransfer.files);
              if (files.length) setNbAttachments(prev => [...prev, ...files]);
            }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.multiple = true;
              input.onchange = () => {
                if (input.files) setNbAttachments(prev => [...prev, ...Array.from(input.files!)]);
              };
              input.click();
            }}
            style={{
              border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px",
              textAlign: "center", fontSize: 11, color: C.dim, cursor: "pointer",
              transition: "border-color 0.2s",
            }}
          >
            📎 Dateien hierher ziehen oder klicken zum Hochladen
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            disabled={nbSending || !fn.email}
            onClick={async () => {
              // Debug entfernt
              const live = getLive();
              const instId = live?.installationId || live?.data?._raw?.id;
              const freshNb = (live?.isLive ? live.data : MOCK_FALLBACK).nb || d.nb;
              const sendTo = freshNb.email;
              if (!instId || !sendTo) { alert("Keine NB-Email hinterlegt!"); return; }
              const ccEmail = live?.data?.dedicatedEmail || live?.data?._raw?.dedicatedEmail || "";
              const freshAnlage = (live?.isLive ? live.data : MOCK_FALLBACK).anlage || d.anlage;
              const kwpVal = Number(freshAnlage.kwp) || 0;
              const isMSVal = kwpVal >= 135 || freshAnlage.systemTyp === "Schwarmspeicher" || freshAnlage.systemTyp === "Großbatteriespeicher";
              const normVal = isMSVal ? "4110" : "4105";
              const formsVal = isMSVal ? "E1,E8" : "E1,E2,E3,E8";
              if (!confirm(`Netzanschlussanfrage JETZT senden?\n\nAn: ${sendTo}\nNorm: VDE ${normVal}\n\nDie Email wird mit VDE-Formularen + Schaltplan versendet.\nDas kann 10-20 Sekunden dauern.`)) return;
              setNbSending(true);
              try {
                const token = localStorage.getItem("baunity_token") || "";
                const formData = new FormData();
                formData.append("to", sendTo);
                formData.append("subject", subj);
                formData.append("message", htmlBody);
                formData.append("norm", normVal);
                formData.append("forms", formsVal);
                if (ccEmail) formData.append("cc", ccEmail);

                const res = await fetch(`/api/installations/${instId}/send-nb-anfrage`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ to: sendTo, subject: subj, html: htmlBody, norm: normVal, forms: formsVal }),
                });
                if (res.ok) {
                  setEmailPreviewOpen(false);
                  alert("NB-Anfrage wird im Hintergrund generiert und versendet.\n\nKommentar wird automatisch geschrieben.");
                } else {
                  const err = await res.json().catch(() => ({}));
                  alert("Fehler: " + (err.error || "Senden fehlgeschlagen"));
                }
              } catch (e: any) { alert("Fehler beim Senden: " + (e?.message || e)); }
              finally { setNbSending(false); }
            }}
            style={{ padding: "10px 24px", fontSize: 13, fontWeight: 700, background: fn.email ? "linear-gradient(135deg, #2e7d32, #388e3c)" : "#374151", color: "#fff", border: "none", borderRadius: 8, cursor: fn.email ? "pointer" : "not-allowed", flex: 1 }}
          >
            {nbSending ? "Sende..." : "📨 An NB senden"}
          </button>
          <button onClick={() => { setEmailPreviewOpen(false); }} style={{ padding: "10px 20px", fontSize: 13, background: "rgba(255,255,255,0.05)", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer" }}>
            Abbrechen
          </button>
        </div>
          </>); })()}
      </Modal>
    </div>
  );
}
