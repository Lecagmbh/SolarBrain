/**
 * Mock Detail Panel V3 — Command Center (All 8 Phases)
 * =====================================================
 * Sidebar-Navigation, alle Services erreichbar aus einer Ansicht.
 * Route: /mock/detail-v3
 */
import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const C = {
  bg: "#060a14", sidebar: "#070c18", card: "rgba(15,23,42,0.6)", cardHover: "rgba(22,33,55,0.7)",
  cardSolid: "#0f172a",
  border: "rgba(255,255,255,0.05)", borderActive: "rgba(99,139,255,0.3)",
  borderSubtle: "rgba(255,255,255,0.03)",
  text: "#c8d5e3", dim: "#3e4f65", muted: "#5a6e84", bright: "#edf2f7",
  accent: "#6b8aff", accentLight: "#8da5ff", accentDim: "rgba(107,138,255,0.1)", accentGlow: "rgba(107,138,255,0.15)",
  green: "#34d399", greenDim: "rgba(52,211,153,0.08)", greenGlow: "rgba(52,211,153,0.12)",
  red: "#f87171", redDim: "rgba(248,113,113,0.08)",
  amber: "#fbbf24", amberDim: "rgba(251,191,36,0.08)",
  cyan: "#22d3ee", cyanDim: "rgba(34,211,238,0.08)", cyanGlow: "rgba(34,211,238,0.12)",
  purple: "#f0d878", purpleDim: "rgba(167,139,250,0.08)",
  gradient: "linear-gradient(135deg, #6b8aff 0%, #22d3ee 100%)",
  gradientSubtle: "linear-gradient(135deg, rgba(107,138,255,0.08) 0%, rgba(34,211,238,0.05) 100%)",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(107,138,255,0.3)}50%{box-shadow:0 0 16px rgba(107,138,255,0.5)}}
@keyframes shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
@keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes backdropIn{from{opacity:0}to{opacity:1}}
@keyframes stagger{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes floatIn{from{opacity:0;transform:translateY(12px) scale(0.98)}to{opacity:1;transform:none}}

/* Scrollbar */
*::-webkit-scrollbar{width:5px}
*::-webkit-scrollbar-track{background:transparent}
*::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:10px}
*::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.15)}

.v3-fade{animation:fadeIn .25s cubic-bezier(0.2,0.8,0.2,1) both}
.v3-slide{animation:slideIn .3s cubic-bezier(0.2,0.8,0.2,1) both}
.v3-float{animation:floatIn .35s cubic-bezier(0.2,0.8,0.2,1) both}

.v3-card{
  background:${C.card};
  border:1px solid ${C.border};
  border-radius:12px;
  transition:all .2s cubic-bezier(0.2,0.8,0.2,1);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
}
.v3-card:hover{
  border-color:${C.borderActive};
  box-shadow:0 4px 24px rgba(0,0,0,0.4),0 0 0 1px rgba(107,138,255,0.06);
  transform:translateY(-1px);
}

.v3-sidebar-btn{
  display:flex;align-items:center;gap:10px;width:100%;padding:9px 14px;
  border:none;background:none;color:${C.muted};
  font:500 13px/1.4 'Inter',sans-serif;cursor:pointer;border-radius:10px;
  transition:all .15s cubic-bezier(0.2,0.8,0.2,1);text-align:left;position:relative;
}
.v3-sidebar-btn:hover{background:rgba(255,255,255,0.03);color:${C.text}}
.v3-sidebar-btn.active{
  background:${C.gradientSubtle};color:${C.accentLight};font-weight:600;
  box-shadow:inset 0 0 0 1px rgba(107,138,255,0.12);
}
.v3-sidebar-btn.active::before{
  content:'';position:absolute;left:0;top:6px;bottom:6px;width:3px;
  background:${C.gradient};border-radius:0 3px 3px 0;
}
.v3-sidebar-btn .badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;margin-left:auto;letter-spacing:0.02em}

.v3-copy{display:flex;align-items:center;padding:6px 10px;gap:8px;border-radius:8px;transition:all .15s;cursor:pointer}
.v3-copy:hover{background:rgba(107,138,255,0.04);transform:translateX(2px)}

.v3-stat{
  display:flex;flex-direction:column;padding:16px 18px;border-radius:12px;
  border:1px solid ${C.border};background:${C.card};
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  transition:all .2s cubic-bezier(0.2,0.8,0.2,1);
}
.v3-stat:hover{border-color:${C.borderActive};transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,0,0,0.3)}

.v3-btn{
  padding:7px 16px;border-radius:8px;border:1px solid ${C.border};
  background:rgba(15,23,42,0.5);backdrop-filter:blur(4px);
  color:${C.text};font:500 12px/1.4 'Inter',sans-serif;cursor:pointer;
  transition:all .15s cubic-bezier(0.2,0.8,0.2,1);
}
.v3-btn:hover{border-color:${C.borderActive};background:rgba(22,33,55,0.6);transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,0.2)}
.v3-btn-primary{
  background:${C.gradientSubtle};border-color:rgba(107,138,255,0.2);color:${C.accentLight};
}
.v3-btn-primary:hover{background:rgba(107,138,255,0.15);border-color:rgba(107,138,255,0.35);box-shadow:0 2px 12px rgba(107,138,255,0.15)}
.v3-btn-danger{background:${C.redDim};border-color:rgba(248,113,113,0.15);color:${C.red}}

.v3-input{
  width:100%;padding:9px 14px;border-radius:10px;
  border:1px solid ${C.border};background:rgba(0,0,0,0.25);
  color:${C.text};font:400 13px/1.4 'Inter',sans-serif;outline:none;
  transition:all .2s;backdrop-filter:blur(4px);
}
.v3-input:focus{border-color:${C.accent};box-shadow:0 0 0 3px rgba(107,138,255,0.08)}
.v3-input::placeholder{color:${C.dim}}

.v3-timeline-line{position:absolute;left:15px;top:24px;bottom:0;width:1px;background:linear-gradient(180deg,${C.border} 0%,transparent 100%)}

.v3-qa-btn{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;border:none;background:none;color:${C.muted};font:500 12px 'Inter',sans-serif;cursor:pointer;transition:all .15s;width:100%}
.v3-qa-btn:hover{background:rgba(255,255,255,0.03);color:${C.text};transform:translateX(2px)}

.v3-pipeline-step{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;cursor:pointer;transition:all .2s cubic-bezier(0.2,0.8,0.2,1)}
.v3-pipeline-step:hover{transform:scale(1.05)}
.v3-pipeline-dot{width:10px;height:10px;border-radius:50%;border:2px solid ${C.dim};background:transparent;transition:all .25s cubic-bezier(0.2,0.8,0.2,1)}
.v3-pipeline-step.done .v3-pipeline-dot{background:${C.green};border-color:${C.green};box-shadow:0 0 6px rgba(52,211,153,0.3)}
.v3-pipeline-step.current .v3-pipeline-dot{background:${C.accent};border-color:${C.accent};animation:glow 2s ease-in-out infinite}
.v3-pipeline-bar{height:2px;background:${C.borderSubtle};flex:1;min-width:12px;margin-top:5px;border-radius:1px}
.v3-pipeline-bar.filled{background:linear-gradient(90deg,${C.green},${C.green})}

.v3-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}

.v3-dropzone{border:2px dashed rgba(255,255,255,0.06);border-radius:12px;padding:24px;text-align:center;transition:all .25s;cursor:pointer;backdrop-filter:blur(4px)}
.v3-dropzone:hover{border-color:rgba(107,138,255,0.25);background:rgba(107,138,255,0.03);box-shadow:0 0 20px rgba(107,138,255,0.05)}
.v3-dropzone.dragover{border-color:${C.accent};background:rgba(107,138,255,0.06);box-shadow:0 0 30px rgba(107,138,255,0.1)}

.v3-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:center;justify-content:center;animation:backdropIn .2s ease both}
.v3-modal{background:${C.cardSolid};border:1px solid rgba(255,255,255,0.06);border-radius:16px;max-width:800px;width:95%;max-height:85vh;overflow-y:auto;animation:modalIn .25s cubic-bezier(0.2,0.8,0.2,1) both;padding:28px;box-shadow:0 25px 60px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.03)}

@media(max-width:1024px){.v3-kpi-grid{grid-template-columns:1fr 1fr!important}}
@media(max-width:900px){.v3-layout{flex-direction:column!important}.v3-sidebar{width:100%!important;flex-direction:row!important;overflow-x:auto;padding:8px!important;border-right:none!important;border-bottom:1px solid ${C.border}!important;backdrop-filter:blur(16px)!important}.v3-sidebar-btn{padding:8px 12px!important;white-space:nowrap}.v3-sidebar-btn span:first-child{display:none}}
@media(max-width:768px){.v3-pipeline{display:none}}
@media(max-width:480px){.v3-kpi-grid{grid-template-columns:1fr!important}}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE DATA BRIDGE
// ═══════════════════════════════════════════════════════════════════════════════

function getLive() {
  return (window as any).__LIVE_DETAIL as {
    data: any; emails: any[]; activities: any[]; docs: any[];
    comments: any[]; isStaff: boolean; installationId: number; isLive: boolean;
  } | undefined;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA (Phase 1: Extended)
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_DEFAULT: Record<string, any> = {
  publicId: "INST-A7X2K9B3", status: "beim_nb", statusLabel: "Beim Netzbetreiber",
  caseType: "einspeiser", kundeId: 24, assignedTo: "Christian Z.",
  dedicatedEmail: "inst-a7x2k9b3@baunity.de",
  createdByName: "Christian Zwick", createdByRole: "ADMIN", createdAt: "01.03.2026",
  betreiber: {
    vorname: "Max", nachname: "Müller", typ: "Privat", email: "max.mueller@gmail.com",
    telefon: "+49 761 12345678", strasse: "Hauptstraße", hausnr: "15", plz: "79100",
    ort: "Freiburg", geburtsdatum: "15.03.1985",
  },
  eigentuemer: {
    name: "Max Müller", email: "max.mueller@gmail.com", telefon: "+49 761 12345678",
    strasse: "Hauptstraße 15", plz: "79100", ort: "Freiburg",
  },
  standort: {
    strasse: "Hauptstraße", hausnr: "15", plz: "79100", ort: "Freiburg",
    bundesland: "Baden-Württemberg", gemarkung: "Freiburg", flur: "12",
    flurstuck: "1234/5", gps: "47.99590, 7.84961",
    googleMapsLink: "https://maps.google.com/?q=47.99590,7.84961", istEigentuemer: true,
  },
  anlage: {
    kwp: "12.40", totalInverterKva: "13.2", totalBatteryKwh: "10",
    systemTyp: "",
    pvEntries: [
      { roofName: "Süddach", manufacturer: "JA Solar", model: "JAM54S30-460/MR", count: 20, powerWp: 460, orientation: "S", tilt: 30 },
      { roofName: "Ostdach", manufacturer: "JA Solar", model: "JAM54S30-460/MR", count: 8, powerWp: 460, orientation: "O", tilt: 25 },
    ],
    inverterEntries: [
      { manufacturer: "Huawei", model: "SUN2000-12KTL-M5", powerKva: 13.2, acPowerKw: 12, scheinleistungKva: 13.2, count: 1, zerezId: "ZR-2024-HW-12KTL", hybrid: false },
    ],
    batteryEntries: [
      { manufacturer: "Huawei", model: "LUNA2000-10-S0", capacityKwh: 10, powerKw: 5, ladeleistungKw: 5, entladeleistungKw: 5, count: 1, coupling: "DC", batteryType: "LiFePO4", notstrom: true, inselfaehig: false },
    ],
    wallboxEntries: [
      { manufacturer: "ABL", model: "eMH3", powerKw: 11, phasen: 3, stecker: "Typ 2", steuerbar14a: true },
    ],
    waermepumpeEntries: [] as any[],
    betriebsweise: "Netzparallel",
    blindleistungskompensation: "cos φ = 1",
    einspeisemanagement: "60% Regelung",
    netzebene: "Niederspannung",
    begrenzungProzent: "60",
    paragraph14a: true,
    inselbetrieb: false,
    naSchutzErforderlich: false,
    einspeisung: "Überschuss", messkonzept: "ZR2", einspeisephasen: "3-phasig",
  },
  zaehler: { nummer: "1EMH0012345678", typ: "Zweirichtungszähler", standort: "Keller", tarif: "Einzeltarif" },
  zaehlerBestand: [
    { id: "z1", nummer: "1EMH0012345678", typ: "Einrichtungszähler", standort: "Keller", aktion: "abmelden", letzterStand: 42350 },
    { id: "z2", nummer: "1EMH0098765432", typ: "Drehstromzähler", standort: "Keller rechts", aktion: "behalten", letzterStand: 8120 },
  ],
  zaehlerNeu: { gewuenschterTyp: "Zweirichtungszähler", standort: "Keller", befestigung: "Dreipunkt", wandlermessung: false },
  netzanschluss: { fernauslesung: true, smartMeterGateway: false, imsysGewuenscht: false },
  nb: {
    name: "Westnetz GmbH", email: "einspeiser@westnetz.de", az: "VO-003.834.522",
    portal: "https://service.westnetz.de", daysAtNb: 8, eingereichtAm: "02.03.2026",
  },
  mastr: { nrSolar: "", nrSpeicher: "", status: "Nicht registriert", syncAm: "", voranmeldung: true },
  ibn: {
    erledigt: false, geplantAm: "2026-04-15", protokollUrl: "",
    mastrRegistered: false, gridOperatorNotified: false,
  },
  factro: {
    number: "42", taskState: "In Bearbeitung",
    datenraumLink: "https://datenraum.example.de/proj42",
  },
  crm: {
    id: 99, titel: "PV-Neuanlage Müller 12.4 kWp", stage: "NB_KOMMUNIKATION",
    quelle: "EMPFEHLUNG", geschaetzterWert: "18.500 €", prioritaet: "NORMAL",
    tags: ["Solar", "Speicher", "Wallbox"], zustaendiger: "Christian Z.",
  },
  rechnungen: [
    { id: 1, nummer: "RE-202603-000D4A", betragBrutto: "177.31", status: "VERSENDET", datum: "10.03.2026", faelligAm: "2026-03-24" },
  ],
  termine: [
    { id: 1, typ: "Montage", datum: "2026-04-15", uhrzeit: "09:00", status: "geplant", notiz: "Gerüst steht ab 14.04." },
    { id: 2, typ: "Zählerwechsel", datum: "2026-04-22", uhrzeit: "10:00", status: "offen", notiz: "NB kommt" },
  ],
  credentials: [
    { id: 1, portal: "Stadtwerke Freiburg Portal", url: "https://netze.sw-freiburg.de", benutzer: "leca_solar_2026", passwort: "Sx$9kLm#2026!", notiz: "Haupt-Login" },
  ],
  createdByCompany: "LeCa GmbH & Co. KG",
};

const MOCK_EMAILS: any[] = [
  { id: 1, dir: "in", subj: "Rückfrage zu Ihrer Anmeldung SNB-2026-14832", from: "netzanschluss@sw-freiburg.de", date: "10.03.2026 14:22",
    preview: "Sehr geehrte Damen und Herren, für die Bearbeitung benötigen wir noch das Datenblatt des Batteriespeichers...",
    body: "Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihren Netzanschlussantrag.\n\nFür die weitere Bearbeitung benötigen wir noch folgende Unterlagen:\n\n1. Datenblatt des Batteriespeichers Huawei LUNA2000-10-S0\n2. Symmetrienachweis für die geplante 12,4 kWp Anlage\n\nBitte reichen Sie die fehlenden Unterlagen innerhalb von 14 Tagen nach.\n\nMit freundlichen Grüßen\nStefanie Schmidt\nAbt. Netzanschluss\nStadtwerke Freiburg",
    files: ["Anforderungsliste.pdf"] },
  { id: 2, dir: "out", subj: "Netzanschlussantrag — Müller, Hauptstraße 15, 79100 Freiburg", from: "netzanschluss@sw-freiburg.de", date: "02.03.2026 09:14",
    preview: "Anbei der vollständige Antrag mit allen erforderlichen Unterlagen...",
    body: "Sehr geehrte Damen und Herren,\n\nhiermit übersenden wir Ihnen den Netzanschlussantrag für folgende Anlage:\n\nAnlagenbetreiber: Max Müller\nStandort: Hauptstraße 15, 79100 Freiburg\nAnlagenleistung: 12,4 kWp PV + 10 kWh Speicher\n\nAlle erforderlichen Unterlagen (VDE-Formularsatz, Lageplan, Schaltplan, Datenblätter) liegen bei.\n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG",
    files: ["E1_Antragstellung.pdf", "E2_Datenblatt.pdf", "Lageplan.pdf", "Schaltplan.pdf"] },
  { id: 3, dir: "in", subj: "Eingangsbestätigung Netzanschlussantrag", from: "noreply@sw-freiburg.de", date: "02.03.2026 09:18",
    preview: "Ihr Antrag wurde unter dem Aktenzeichen SNB-2026-14832 erfasst.",
    body: "Sehr geehrte Damen und Herren,\n\nIhr Netzanschlussantrag wurde erfolgreich eingereicht.\n\nAktenzeichen: SNB-2026-14832\nEingangsdatum: 02.03.2026\nVoraussichtliche Bearbeitungszeit: 10 Werktage\n\nDies ist eine automatisch generierte Nachricht.",
    files: [] },
];

const MOCK_DOCS: any[] = [
  { id: 1, name: "E1_Antragstellung.pdf", type: "vde_e1", category: "vde", status: "uploaded", date: "02.03.2026" },
  { id: 2, name: "E2_Datenblatt.pdf", type: "vde_e2", category: "vde", status: "uploaded", date: "02.03.2026" },
  { id: 3, name: "Lageplan.pdf", type: "lageplan", category: "plaene", status: "uploaded", date: "02.03.2026" },
  { id: 4, name: "Speicher-Datenblatt", type: "datenblatt", category: "datenblaetter", status: "missing", date: "" },
  { id: 5, name: "Schaltplan.pdf", type: "schaltplan", category: "plaene", status: "uploaded", date: "01.03.2026" },
  { id: 6, name: "WR-Datenblatt.pdf", type: "datenblatt_wr", category: "datenblaetter", status: "uploaded", date: "01.03.2026" },
];

const MOCK_TIMELINE: any[] = [
  { id: 1, type: "email_in", text: "Rückfrage vom NB: Datenblatt Speicher fehlt", date: "10.03.2026 14:22", author: "Stadtwerke Freiburg" },
  { id: 2, type: "status", text: "Status → Beim Netzbetreiber", date: "02.03.2026 09:15", author: "System" },
  { id: 3, type: "email_out", text: "Netzanschlussantrag versendet", date: "02.03.2026 09:14", author: "christian.zwick" },
  { id: 4, type: "doc", text: "6 Dokumente generiert (VDE-Formularsatz)", date: "02.03.2026 09:10", author: "System" },
  { id: 5, type: "comment", text: "Installation angelegt via Wizard", date: "01.03.2026 16:30", author: "christian.zwick" },
  { id: 6, type: "invoice", text: "Rechnung RE-202603-000D4A erstellt (177,31 €)", date: "02.03.2026 09:16", author: "System" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS (Phase 2)
// ═══════════════════════════════════════════════════════════════════════════════

const PIPELINE = [
  { key: "eingang", label: "Eingang" },
  { key: "beim_nb", label: "Beim NB" },
  { key: "rueckfrage", label: "Rückfrage" },
  { key: "genehmigt", label: "Genehmigt" },
  { key: "ibn", label: "IBN" },
  { key: "fertig", label: "Fertig" },
];

function getStepIndex(status: string): number {
  const s = (status || "").toLowerCase().replace(/-/g, "_");
  const map: Record<string, number> = { eingang: 0, entwurf: 0, beim_nb: 1, in_bearbeitung: 1, eingereicht: 1, warten_auf_nb: 1, rueckfrage: 2, genehmigt: 3, ibn: 4, fertig: 5, abgeschlossen: 5 };
  return map[s] ?? 0;
}

function n2(v: any): string { const n = Number(v); return isNaN(n) ? "0" : n.toFixed(2).replace(/\.?0+$/, ""); }

function isSpeicherTyp(systemTyp: string): boolean {
  return systemTyp === "Schwarmspeicher" || systemTyp === "Großbatteriespeicher";
}

function formatPower(kw: number, isSpeicher: boolean): { value: string; unit: string } {
  if (kw >= 1000) return { value: (kw / 1000).toFixed(1), unit: isSpeicher ? "MW" : "MWp" };
  return { value: String(kw), unit: isSpeicher ? "kW" : "kWp" };
}

function formatCapacity(kwh: number): { value: string; unit: string } {
  if (kwh >= 1000) return { value: (kwh / 1000).toFixed(1), unit: "MWh" };
  return { value: n2(kwh), unit: "kWh" };
}

function getDueDateColor(faelligAm: string): string {
  if (!faelligAm) return C.dim;
  const diff = (new Date(faelligAm).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return C.red;
  if (diff < 3) return C.amber;
  return C.green;
}

function getStatusColor(status: string): string {
  const s = (status || "").toLowerCase().replace(/-/g, "_");
  if (s === "genehmigt" || s === "fertig" || s === "abgeschlossen") return C.green;
  if (s === "rueckfrage") return C.red;
  if (s === "beim_nb" || s === "eingereicht" || s === "in_bearbeitung") return C.cyan;
  if (s === "ibn") return C.purple;
  return C.amber;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function CopyRow({ label, value, mono, important }: { label: string; value?: string; mono?: boolean; important?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="v3-copy" onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
      <span style={{ fontSize: 11, color: C.dim, minWidth: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: copied ? C.green : important ? C.bright : C.text, fontWeight: important ? 600 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...(mono ? { fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: copied ? C.green : C.accent } : {}) }}>
        {copied ? "✓ Kopiert" : value}
      </span>
    </div>
  );
}

// Phase 8: EditableCopyRow
function EditableCopyRow({ label, value, mono, important, onSave }: { label: string; value?: string; mono?: boolean; important?: boolean; onSave?: (v: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  if (!value && !editing) return null;

  const handleSave = () => {
    setEditing(false);
    if (onSave && editVal !== value) onSave(editVal);
  };

  if (editing) {
    return (
      <div className="v3-copy" style={{ background: "rgba(99,139,255,0.04)" }}>
        <span style={{ fontSize: 11, color: C.dim, minWidth: 80, flexShrink: 0 }}>{label}</span>
        <input ref={inputRef} className="v3-input" value={editVal} onChange={e => setEditVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditing(false); setEditVal(value || ""); } }}
          style={{ flex: 1, padding: "4px 8px", fontSize: 12 }} />
        <button className="v3-btn" style={{ fontSize: 10, padding: "2px 8px" }} onClick={handleSave}>OK</button>
      </div>
    );
  }

  return (
    <div className="v3-copy" onClick={() => { navigator.clipboard.writeText(value || ""); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
      onDoubleClick={(e) => { e.stopPropagation(); setEditVal(value || ""); setEditing(true); }}>
      <span style={{ fontSize: 11, color: C.dim, minWidth: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: copied ? C.green : important ? C.bright : C.text, fontWeight: important ? 600 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...(mono ? { fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: copied ? C.green : C.accent } : {}) }}>
        {copied ? "✓ Kopiert" : value}
      </span>
    </div>
  );
}

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color, background: bg, letterSpacing: "0.03em", border: `1px solid ${color}18`, boxShadow: `0 0 8px ${color}08` }}>{children}</span>;
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: string }) {
  return (
    <div className="v3-stat v3-fade" style={{ position: "relative", overflow: "hidden" }}>
      {/* Subtle glow top-left */}
      <div style={{ position: "absolute", top: -20, left: -20, width: 60, height: 60, borderRadius: "50%", background: `${color}08`, filter: "blur(20px)", pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, position: "relative" }}>
        <span style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <span style={{ fontSize: 14, opacity: 0.7 }}>{icon}</span>
      </div>
      <span style={{ fontSize: value.length > 10 ? 16 : value.length > 6 ? 20 : 24, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1.1, position: "relative", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{value}</span>
      {sub && <span style={{ fontSize: 10, color: C.dim, marginTop: 4, position: "relative" }}>{sub}</span>}
    </div>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.bright, letterSpacing: "-0.01em" }}>{children}</h3>
      {action}
    </div>
  );
}

function YesNoBadge({ value, label }: { value: boolean | undefined; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
      <span style={{ fontSize: 11, color: C.dim, minWidth: 100 }}>{label}</span>
      <Badge color={value ? C.green : C.dim} bg={value ? C.greenDim : "rgba(100,116,139,0.1)"}>
        {value ? "Ja" : "Nein"}
      </Badge>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

const NAV_STAFF = [
  { key: "overview", icon: "📋", label: "Übersicht" },
  { key: "comms", icon: "📨", label: "Kommunikation", badge: 0 },
  { key: "docs", icon: "📄", label: "Dokumente", badge: 0 },
  { key: "tech", icon: "⚙️", label: "Technik" },
  { key: "billing", icon: "💰", label: "Abrechnung" },
  { key: "schedule", icon: "📅", label: "Termine" },
  { key: "credentials", icon: "🔑", label: "Zugangsdaten" },
  { key: "timeline", icon: "📜", label: "Verlauf" },
];

const NAV_KUNDE = [
  { key: "kunde-overview", icon: "📋", label: "Mein Projekt", desc: "Status & Übersicht deiner Anlage" },
  { key: "kunde-docs", icon: "📄", label: "Dokumente", desc: "Unterlagen hochladen & herunterladen" },
  { key: "kunde-rechnungen", icon: "💰", label: "Rechnungen", desc: "Zahlungen & offene Beträge" },
  { key: "timeline", icon: "📜", label: "Verlauf", desc: "Alle Aktivitäten & Nachrichten" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 8: StatusChangeModal
// ═══════════════════════════════════════════════════════════════════════════════

function StatusChangeModal({ currentStatus, onClose, onConfirm }: { currentStatus: string; onClose: () => void; onConfirm: (newStatus: string, comment: string) => void }) {
  const [selected, setSelected] = useState(currentStatus);
  const [comment, setComment] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const needsUpload = (currentStatus === "eingang" && selected === "beim_nb") || (selected === "genehmigt") || (selected === "ibn");
  const uploadHint = selected === "beim_nb" ? "Einreichungsbestätigung" : selected === "genehmigt" ? "Genehmigungsbescheid" : selected === "ibn" ? "IBN-Protokoll" : "Dokument";

  const handleConfirm = async () => {
    // Upload wenn Datei vorhanden
    if (uploadFile) {
      const live = getLive();
      const instId = live?.installationId;
      if (instId) {
        const token = localStorage.getItem("baunity_token") || "";
        const formData = new FormData();
        formData.append("file", uploadFile);
        await fetch(`/api/installations/${instId}/documents`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
        }).catch(() => {});
      }
    }
    onConfirm(selected, comment);
  };

  const statuses = PIPELINE.map(p => p.key);

  return (
    <div className="v3-modal-backdrop" onClick={onClose}>
      <div className="v3-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.bright }}>Status ändern</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.05em" }}>Neuer Status</label>
          <select className="v3-input" value={selected} onChange={e => setSelected(e.target.value)} style={{ cursor: "pointer" }}>
            {statuses.map(s => (
              <option key={s} value={s}>{PIPELINE.find(p => p.key === s)?.label || s}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.05em" }}>Kommentar (optional)</label>
          <textarea className="v3-input" rows={3} value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Grund für die Statusänderung..." style={{ resize: "vertical" }} />
        </div>

        {/* Dokument Upload */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
            {needsUpload ? `📎 ${uploadHint} hochladen` : "📎 Dokument anhängen (optional)"}
          </label>
          <input ref={fileRef} type="file" style={{ display: "none" }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={e => { if (e.target.files?.[0]) setUploadFile(e.target.files[0]); }} />
          {uploadFile ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: C.greenDim, borderRadius: 8, border: `1px solid ${C.green}30` }}>
              <span style={{ fontSize: 12, color: C.green }}>✓</span>
              <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{uploadFile.name}</span>
              <button onClick={() => setUploadFile(null)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={e => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files?.[0]) setUploadFile(e.dataTransfer.files[0]); }}
              style={{ border: `2px dashed ${needsUpload ? `${C.amber}40` : "rgba(255,255,255,0.08)"}`, borderRadius: 8, padding: "14px 12px", textAlign: "center", cursor: "pointer", background: needsUpload ? "rgba(245,158,11,0.03)" : "transparent" }}>
              <div style={{ fontSize: 12, color: needsUpload ? C.amber : C.dim }}>{needsUpload ? `${uploadHint} hier ablegen` : "Datei hier ablegen oder klicken"}</div>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>PDF, JPG, PNG</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="v3-btn" onClick={onClose}>Abbrechen</button>
          <button className="v3-btn v3-btn-primary" onClick={handleConfirm}>
            Status ändern
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 7: AllDataModal
// ═══════════════════════════════════════════════════════════════════════════════

function AllDataModal({ d, onClose }: { d: any; onClose: () => void }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const b = d.betreiber || {};
  const s = d.standort || {};
  const a = d.anlage || {};
  const nb = d.nb || {};
  const z = d.zaehler || {};
  const m = d.mastr || {};
  const ibn = d.ibn || {};

  // "Alle Daten kopieren" — formatierter Text
  const buildCopyText = () => {
    const lines: string[] = [];
    const add = (label: string, value: any) => { if (value !== undefined && value !== null && value !== "") lines.push(`${label}: ${value}`); };
    const sep = (title: string) => { lines.push("", `═══ ${title.toUpperCase()} ═══`); };

    sep("Anlagenbetreiber");
    add("Name", `${b.vorname || ""} ${b.nachname || ""}`.trim() || b.firma);
    add("Typ", b.typ); add("Firma", b.firma);
    add("Straße", b.strasse); add("Hausnr.", b.hausnr); add("PLZ", b.plz); add("Ort", b.ort);
    add("Email", b.email); add("Telefon", b.telefon); add("Geburtsdatum", b.geburtsdatum);
    add("Inst.-Email", d.dedicatedEmail);

    if (d.eigentuemer?.name) { sep("Eigentümer"); add("Name", d.eigentuemer.name); add("Email", d.eigentuemer.email); add("Telefon", d.eigentuemer.telefon); }

    sep("Anlagenstandort");
    add("Straße", s.strasse); add("Hausnr.", s.hausnr); add("PLZ", s.plz); add("Ort", s.ort);
    add("Bundesland", s.bundesland); add("Gemarkung", s.gemarkung); add("Flur", s.flur); add("Flurstück", s.flurstuck); add("GPS", s.gps);

    sep("Technische Daten");
    add("Leistung", `${a.kwp} kWp`); add("WR-Leistung", `${a.totalInverterKva} kVA`); add("Speicher", `${a.totalBatteryKwh} kWh`);
    add("Einspeisung", a.einspeisung); add("Messkonzept", a.messkonzept); add("Betriebsweise", a.betriebsweise);
    add("Netzebene", a.netzebene); add("§14a", a.paragraph14a ? "Ja" : "Nein");
    (a.pvEntries || []).forEach((pv: any, i: number) => {
      add(`PV ${pv.roofName || `Dach ${i + 1}`}`, `${pv.count}× ${pv.manufacturer} ${pv.model} (${pv.powerWp} Wp) ${pv.orientation} ${pv.tilt}°`);
    });
    (a.inverterEntries || []).forEach((wr: any) => { add("Wechselrichter", `${wr.count}× ${wr.manufacturer} ${wr.model} (${wr.powerKva || wr.scheinleistungKva} kVA)${wr.zerezId ? ` ZEREZ: ${wr.zerezId}` : ""}`); });
    (a.batteryEntries || []).forEach((bat: any) => { add("Speicher", `${bat.count}× ${bat.manufacturer} ${bat.model} (${bat.capacityKwh} kWh, ${bat.coupling})`); });
    (a.wallboxEntries || []).forEach((wb: any) => { add("Wallbox", `${wb.manufacturer} ${wb.model} (${wb.powerKw} kW, ${wb.phasen}p, §14a: ${wb.steuerbar14a ? "Ja" : "Nein"})`); });

    sep("Netzbetreiber");
    add("Name", nb.name); add("Email", nb.email); add("Az", nb.az); add("Portal", nb.portal);
    add("Eingereicht am", nb.eingereichtAm); add("Tage beim NB", nb.daysAtNb);

    sep("Zähler");
    add("Nummer", z.nummer); add("Typ", z.typ); add("Standort", z.standort);
    (d.zaehlerBestand || []).forEach((zb: any) => { add(`Zähler ${zb.nummer}`, `${zb.typ}, ${zb.standort}, Aktion: ${zb.aktion}, Stand: ${zb.letzterStand}`); });
    if (d.zaehlerNeu?.gewuenschterTyp) add("Neuer Zähler", `${d.zaehlerNeu.gewuenschterTyp}, ${d.zaehlerNeu.standort}`);

    sep("System");
    add("Public-ID", d.publicId); add("Inst.-Email", d.dedicatedEmail);
    add("Erstellt von", d.createdByName); add("Erstellt am", d.createdAt);
    if (m.nrSolar) add("MaStR Solar", m.nrSolar); if (m.nrSpeicher) add("MaStR Speicher", m.nrSpeicher);
    if (d.factro?.number) add("Factro", `#${d.factro.number} (${d.factro.taskState})`);
    if (d.crm?.titel) add("CRM", `${d.crm.titel} (${d.crm.stage})`);

    return lines.join("\n");
  };

  const handleCopyAll = () => { navigator.clipboard.writeText(buildCopyText()); setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000); };

  // Reusable Section-Card
  const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div style={{ padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: 10, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="v3-modal-backdrop" onClick={onClose}>
      <div className="v3-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 920, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, position: "sticky", top: 0, background: C.card, padding: "12px 0", zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.bright }}>Alle Daten — {d.publicId}</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="v3-btn v3-btn-primary" onClick={handleCopyAll} style={{ fontSize: 11 }}>
              {copiedAll ? "✓ Kopiert!" : "📋 Alle Daten kopieren"}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Betreiber */}
          <Section title="Anlagenbetreiber" icon="👤">
            <CopyRow label="Name" value={`${b.vorname || ""} ${b.nachname || ""}`.trim() || b.firma} important />
            <CopyRow label="Typ" value={b.typ} />
            {b.firma && <CopyRow label="Firma" value={b.firma} />}
            <CopyRow label="Straße" value={b.strasse} />
            <CopyRow label="Hausnr." value={b.hausnr} />
            <CopyRow label="PLZ" value={b.plz} mono />
            <CopyRow label="Ort" value={b.ort} />
            <CopyRow label="Email" value={b.email} important />
            <CopyRow label="Telefon" value={b.telefon} mono />
            <CopyRow label="Geburtsdatum" value={b.geburtsdatum} />
            <CopyRow label="Inst.-Email" value={d.dedicatedEmail} mono />
          </Section>

          {/* Standort */}
          <Section title="Anlagenstandort" icon="📍">
            <CopyRow label="Straße" value={s.strasse} />
            <CopyRow label="Hausnr." value={s.hausnr} />
            <CopyRow label="PLZ" value={s.plz} mono />
            <CopyRow label="Ort" value={s.ort} />
            <CopyRow label="Bundesland" value={s.bundesland} />
            <CopyRow label="Gemarkung" value={s.gemarkung} />
            <CopyRow label="Flur" value={s.flur} />
            <CopyRow label="Flurstück" value={s.flurstuck} mono />
            <CopyRow label="GPS" value={s.gps} mono />
            <CopyRow label="Eigentümer" value={s.istEigentuemer ? "Ja (= Betreiber)" : "Nein"} />
          </Section>

          {/* Netzbetreiber */}
          <Section title="Netzbetreiber" icon="⚡">
            <CopyRow label="Name" value={nb.name} important />
            <CopyRow label="Email" value={nb.email} important />
            <CopyRow label="Az" value={nb.az} mono important />
            <CopyRow label="Portal" value={nb.portal} mono />
            <CopyRow label="Eingereicht" value={nb.eingereichtAm} />
            <CopyRow label="Tage beim NB" value={nb.daysAtNb ? String(nb.daysAtNb) : undefined} />
          </Section>

          {/* Zähler */}
          <Section title="Zähler & Netzanschluss" icon="🔌">
            <CopyRow label="Zählernr." value={z.nummer} mono important />
            <CopyRow label="Typ" value={z.typ} />
            <CopyRow label="Standort" value={z.standort} />
            <CopyRow label="Tarif" value={z.tarif} />
            {(d.zaehlerBestand || []).map((zb: any) => (
              <CopyRow key={zb.id} label={`${zb.aktion === "abmelden" ? "✕" : "✓"} ${zb.nummer}`} value={`${zb.typ}, ${zb.standort}`} />
            ))}
            {d.zaehlerNeu?.gewuenschterTyp && <CopyRow label="Neu" value={`${d.zaehlerNeu.gewuenschterTyp}, ${d.zaehlerNeu.standort}`} />}
          </Section>

          {/* Technische Gesamtwerte */}
          <Section title="Anlagenleistung" icon="☀️">
            <CopyRow label="PV-Leistung" value={`${a.kwp} kWp`} important />
            <CopyRow label="WR-Leistung" value={`${a.totalInverterKva} kVA`} />
            <CopyRow label="Speicher" value={`${a.totalBatteryKwh} kWh`} />
            <CopyRow label="Einspeisung" value={a.einspeisung} />
            <CopyRow label="Messkonzept" value={a.messkonzept} />
            <CopyRow label="Netzebene" value={a.netzebene} />
            <CopyRow label="§14a" value={a.paragraph14a ? "Ja" : "Nein"} />
          </Section>

          {/* Anlagenparameter */}
          <Section title="Anlagenparameter" icon="⚙️">
            <CopyRow label="Betriebsweise" value={a.betriebsweise} />
            <CopyRow label="Blindleistung" value={a.blindleistungskompensation} />
            <CopyRow label="Einspeise-Mgmt" value={a.einspeisemanagement} />
            <CopyRow label="Begrenzung" value={a.begrenzungProzent ? `${a.begrenzungProzent}%` : undefined} />
            <CopyRow label="Phasen" value={a.einspeisephasen} />
            <CopyRow label="Inselbetrieb" value={a.inselbetrieb ? "Ja" : "Nein"} />
            <CopyRow label="NA-Schutz" value={a.naSchutzErforderlich ? "Erforderlich" : "Nicht erforderlich"} />
          </Section>

          {/* PV-Module */}
          {(a.pvEntries || []).length > 0 && (
            <Section title="PV-Module" icon="🔆">
              {(a.pvEntries || []).map((pv: any, i: number) => (
                <div key={i} style={{ marginBottom: i < (a.pvEntries?.length || 0) - 1 ? 8 : 0, paddingBottom: i < (a.pvEntries?.length || 0) - 1 ? 8 : 0, borderBottom: i < (a.pvEntries?.length || 0) - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.bright, marginBottom: 2 }}>{pv.roofName || `Dach ${i + 1}`}</div>
                  <CopyRow label="Modul" value={`${pv.manufacturer} ${pv.model}`} />
                  <CopyRow label="Anzahl" value={`${pv.count}× ${pv.powerWp} Wp = ${n2((pv.count * pv.powerWp) / 1000)} kWp`} />
                  <CopyRow label="Ausrichtung" value={`${pv.orientation} ${pv.tilt}°`} />
                </div>
              ))}
            </Section>
          )}

          {/* Wechselrichter */}
          {(a.inverterEntries || []).length > 0 && (
            <Section title="Wechselrichter" icon="⚡">
              {(a.inverterEntries || []).map((wr: any, i: number) => (
                <div key={i}>
                  <CopyRow label="Modell" value={`${wr.count > 1 ? `${wr.count}× ` : ""}${wr.manufacturer} ${wr.model}`} important />
                  <CopyRow label="Leistung" value={`${wr.acPowerKw || wr.powerKw || "—"} kW / ${wr.powerKva || wr.scheinleistungKva || "—"} kVA`} />
                  {wr.zerezId && <CopyRow label="ZEREZ" value={wr.zerezId} mono />}
                </div>
              ))}
            </Section>
          )}

          {/* Speicher */}
          {(a.batteryEntries || []).length > 0 && (
            <Section title="Speicher" icon="🔋">
              {(a.batteryEntries || []).map((bat: any, i: number) => (
                <div key={i}>
                  <CopyRow label="Modell" value={`${bat.count > 1 ? `${bat.count}× ` : ""}${bat.manufacturer} ${bat.model}`} important />
                  <CopyRow label="Kapazität" value={`${bat.capacityKwh} kWh`} />
                  <CopyRow label="Leistung" value={`${bat.powerKw || bat.ladeleistungKw || "—"} kW`} />
                  <CopyRow label="Kopplung" value={bat.coupling?.toUpperCase()} />
                  <CopyRow label="Batterietyp" value={bat.batteryType} />
                </div>
              ))}
            </Section>
          )}

          {/* Wallbox */}
          {(a.wallboxEntries || []).length > 0 && (
            <Section title="Wallbox" icon="🚗">
              {(a.wallboxEntries || []).map((wb: any, i: number) => (
                <div key={i}>
                  <CopyRow label="Modell" value={`${wb.manufacturer} ${wb.model}`} important />
                  <CopyRow label="Leistung" value={`${wb.powerKw} kW, ${wb.phasen}-phasig`} />
                  <CopyRow label="§14a" value={wb.steuerbar14a ? "Ja" : "Nein"} />
                </div>
              ))}
            </Section>
          )}

          {/* System / Meta */}
          <Section title="System" icon="🏷️">
            <CopyRow label="Public-ID" value={d.publicId} mono important />
            <CopyRow label="Erstellt von" value={d.createdByName} />
            <CopyRow label="Erstellt am" value={d.createdAt} />
            {m.nrSolar && <CopyRow label="MaStR Solar" value={m.nrSolar} mono />}
            {m.nrSpeicher && <CopyRow label="MaStR Speicher" value={m.nrSpeicher} mono />}
            <CopyRow label="MaStR Status" value={m.status} />
            {d.factro?.number && <CopyRow label="Factro" value={`#${d.factro.number} — ${d.factro.taskState}`} />}
            {d.crm?.titel && <CopyRow label="CRM" value={`${d.crm.titel} (${(d.crm.stage || "").replace(/_/g, " ")})`} />}
          </Section>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: ÜBERSICHT (Phase 4: Extended)
// ═══════════════════════════════════════════════════════════════════════════════

function HelpHint({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", background: "rgba(99,139,255,0.03)", borderRadius: 8, border: `1px dashed rgba(99,139,255,0.12)`, marginBottom: 4 }}>
      <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>💡</span>
      <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

function DropZone({ onDrop, label, hint, installationId }: { onDrop?: (files: File[]) => void; label: string; hint?: string; installationId?: number }) {
  const [dragActive, setDragActive] = useState(false);
  const [dropped, setDropped] = useState<{ name: string; status: "uploading" | "done" | "error" }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    const live = getLive();
    const instId = installationId || live?.installationId;
    if (!instId) { onDrop?.([file]); return; }

    setDropped(prev => [...prev, { name: file.name, status: "uploading" }]);
    try {
      const token = localStorage.getItem("baunity_token") || "";
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/installations/${instId}/documents`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      if (res.ok) {
        setDropped(prev => prev.map(d => d.name === file.name ? { ...d, status: "done" } : d));
      } else {
        setDropped(prev => prev.map(d => d.name === file.name ? { ...d, status: "error" } : d));
      }
    } catch {
      setDropped(prev => prev.map(d => d.name === file.name ? { ...d, status: "error" } : d));
    }
    onDrop?.([file]);
  }, [installationId, onDrop]);

  const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover"); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    Array.from(e.dataTransfer.files).forEach(f => uploadFile(f));
  }, [uploadFile]);
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(f => uploadFile(f));
  }, [uploadFile]);

  return (
    <div
      onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragActive ? C.accent : dropped.length > 0 ? C.green : "rgba(255,255,255,0.08)"}`,
        borderRadius: 10, padding: dropped.length > 0 ? "12px 16px" : "20px 16px",
        background: dragActive ? "rgba(99,139,255,0.06)" : dropped.length > 0 ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.01)",
        cursor: "pointer", transition: "all .2s", textAlign: "center",
      }}
    >
      <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
      {dropped.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {dropped.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <span style={{ fontSize: 12, color: item.status === "done" ? C.green : item.status === "error" ? C.red : C.amber }}>
                {item.status === "done" ? "✓" : item.status === "error" ? "✗" : "⏳"}
              </span>
              <span style={{ fontSize: 12, color: C.text }}>{item.name}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>Weitere Dateien hierhin ziehen oder klicken</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 20, marginBottom: 6 }}>{dragActive ? "📂" : "📎"}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: dragActive ? C.accent : C.text, marginBottom: 4 }}>{label}</div>
          {hint && <div style={{ fontSize: 11, color: C.dim }}>{hint}</div>}
          <div style={{ fontSize: 10, color: C.dim, marginTop: 6 }}>PDF, JPG, PNG, DOC — oder klicken zum Auswählen</div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRAFT APPROVAL BANNER — Prominent in der Übersicht
// ═══════════════════════════════════════════════════════════════════════════════

function DraftBanner({ installationId }: { installationId: number }) {
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [allDocs, setAllDocs] = useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<number>>(new Set());
  const token = localStorage.getItem("baunity_token") || "";
  const API = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    if (!installationId) return;
    fetch(`${API}/api/workflow/${installationId}/rueckfrage-response`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.id) {
        setDraft(data);
        setEditSubject(data.draftSubject || "");
        setEditBody(data.draftBody || "");
        // Pre-select draft attachments
        const draftDocIds = (data.generatedDocs || []).map((d: any) => d.id).filter(Boolean);
        setSelectedDocIds(new Set(draftDocIds));
      }
    }).catch(() => {}).finally(() => setLoading(false));

    // Alle Dokumente der Installation laden
    fetch(`${API}/api/installations/${installationId}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : []).then(data => {
      setAllDocs(Array.isArray(data) ? data : data?.documents || data?.data || []);
    }).catch(() => {});
  }, [installationId]);

  if (loading || !draft) return null;

  async function handleApprove() {
    setSending(true);
    try {
      const res = await fetch(`${API}/api/workflow/${installationId}/rueckfrage-response/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ responseId: draft.id, subject: editSubject, body: editBody }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Fehler");
      }
      setResult({ ok: true, msg: "Antwort gesendet!" });
      setTimeout(() => window.location.reload(), 2000);
    } catch (e: any) {
      setResult({ ok: false, msg: e.message });
    } finally { setSending(false); }
  }

  async function handleReject() {
    setSending(true);
    try {
      await fetch(`${API}/api/workflow/${installationId}/rueckfrage-response/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ responseId: draft.id }),
      });
      setDraft(null);
    } catch {} finally { setSending(false); }
  }

  if (result?.ok) {
    return (
      <div style={{ padding: 20, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{result.msg}</div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(15,15,30,0.8)", border: `1px solid ${C.border}`,
    borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 13,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const,
  };

  const analysisItems = draft.analysisData?.items || [];
  const docs = draft.generatedDocs || [];

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.02) 100%)",
      border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, overflow: "hidden",
      boxShadow: "0 0 24px rgba(34,197,94,0.06)",
    }}>
      {/* Header — immer sichtbar */}
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.green, boxShadow: `0 0 10px ${C.green}80`, animation: "dotPulse 1.5s infinite", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.green }}>Antwort-Entwurf bereit</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>An: {draft.recipientEmail} · {analysisItems.length > 0 ? analysisItems.join(", ") : "Rückfrage"}</div>
        </div>
        <div style={{
          padding: "8px 20px", borderRadius: 10, fontSize: 12, fontWeight: 800,
          background: expanded ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${C.green}, #16a34a)`,
          color: expanded ? C.dim : "#fff", boxShadow: expanded ? "none" : `0 0 20px rgba(34,197,94,0.3)`,
          transition: "all .2s",
        }}>
          {expanded ? "▲ Zuklappen" : "Prüfen & Freigeben"}
        </div>
      </div>

      {/* Expanded: Editierbarer Entwurf */}
      {expanded && (
        <div style={{ padding: "0 18px 18px", borderTop: `1px solid rgba(34,197,94,0.1)` }}>
          {/* Betreff */}
          <div style={{ marginTop: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Betreff</div>
            <input value={editSubject} onChange={e => setEditSubject(e.target.value)} style={inputStyle} />
          </div>

          {/* Body */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Nachricht</div>
            <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={14}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7, whiteSpace: "pre-wrap" }} />
          </div>

          {/* ══ ANHÄNGE — Wird mitgesendet ══ */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.green, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              Wird mitgesendet ({selectedDocIds.size})
            </div>
            {selectedDocIds.size === 0 && (
              <div style={{ padding: "12px 14px", background: "rgba(245,158,11,0.06)", border: "1px dashed rgba(245,158,11,0.2)", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.amber, fontWeight: 600 }}>Keine Anhänge ausgewählt — wähle unten Dokumente aus</div>
              </div>
            )}
            {allDocs.filter(d => selectedDocIds.has(d.id)).map((doc: any) => {
              const name = doc.originalName || doc.original_name || doc.filename || "Dokument";
              return (
                <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(34,197,94,0.04)", borderRadius: 8, marginBottom: 4, border: `1px solid rgba(34,197,94,0.15)` }}>
                  <span style={{ fontSize: 14 }}>📎</span>
                  <span style={{ fontSize: 12, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                  <a href={`${API}/api/documents/${doc.id}/download?view=true&token=${token}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 9, color: C.cyan, fontWeight: 600, textDecoration: "none", padding: "2px 8px", background: "rgba(56,189,248,0.06)", borderRadius: 6 }}>
                    Ansehen
                  </a>
                  <button onClick={() => setSelectedDocIds(prev => { const n = new Set(prev); n.delete(doc.id); return n; })}
                    style={{ fontSize: 9, color: C.red, background: "rgba(239,68,68,0.06)", border: `1px solid rgba(239,68,68,0.15)`, borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {/* ══ VERFÜGBARE DOKUMENTE — anklicken zum Hinzufügen ══ */}
          {allDocs.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                Verfügbare Dokumente — klick um anzuhängen
              </div>
              <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
                {allDocs.filter(d => !selectedDocIds.has(d.id)).map((doc: any) => {
                  const docId = doc.id;
                  const name = doc.originalName || doc.original_name || doc.filename || "Dokument";
                  const typ = doc.dokumentTyp || doc.dokument_typ || doc.type || "";
                  const isVde = typ.startsWith("vde_");
                  const isDatenblatt = typ.includes("datenblatt");
                  const icon = isVde ? "📋" : isDatenblatt ? "📊" : typ.includes("schaltplan") ? "⚡" : typ.includes("lageplan") ? "🗺️" : "📄";
                  return (
                    <div key={docId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(15,23,42,0.4)", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 11 }}>
                      <button onClick={() => setSelectedDocIds(prev => new Set([...prev, docId]))}
                        style={{ fontSize: 10, color: C.green, background: "rgba(34,197,94,0.08)", border: `1px solid rgba(34,197,94,0.15)`, borderRadius: 4, padding: "1px 6px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                        +
                      </button>
                      <span>{icon}</span>
                      <span style={{ flex: 1, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                      <span style={{ fontSize: 9, color: C.dim, minWidth: 50 }}>{typ.replace("vde_", "").toUpperCase()}</span>
                      <a href={`${API}/api/documents/${docId}/download?view=true&token=${token}`} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: 9, color: C.cyan, fontWeight: 600, textDecoration: "none", padding: "2px 8px", background: "rgba(56,189,248,0.06)", borderRadius: 4 }}>
                        Ansehen
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {result && !result.ok && (
            <div style={{ padding: "8px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, color: C.red, fontSize: 12, marginBottom: 12 }}>{result.msg}</div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={handleReject} disabled={sending}
              style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid rgba(239,68,68,0.2)`, background: "rgba(239,68,68,0.06)", color: C.red, fontSize: 12, fontWeight: 700, cursor: sending ? "wait" : "pointer", fontFamily: "inherit", opacity: sending ? 0.5 : 1 }}>
              Verwerfen
            </button>
            <button onClick={handleApprove} disabled={sending}
              style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.green}, #16a34a)`, color: "#fff", fontSize: 13, fontWeight: 800, cursor: sending ? "wait" : "pointer", fontFamily: "inherit", boxShadow: `0 0 24px rgba(34,197,94,0.3)`, opacity: sending ? 0.5 : 1 }}>
              {sending ? "Sende..." : "Freigeben & Senden"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TabOverview({ d, emails, timeline, installationId }: { d: any; emails: any[]; timeline: any[]; installationId?: number }) {
  const allDocs = MOCK_DOCS;
  const missingDocs = allDocs.filter(x => x.status === "missing").length;
  const missingNames = allDocs.filter(x => x.status === "missing").map(x => x.name);
  const nextTermin = d.termine?.[0];

  // Kontextuelle KI-Empfehlung basierend auf aktuellem Status
  const status = (d.status || "").toLowerCase();
  const aiSteps: { text: string; action?: string }[] = [];
  if (status.includes("eingang") || status === "entwurf") {
    aiSteps.push({ text: "Antrag ist im Eingang. Prüfe ob alle Dokumente vollständig sind.", action: "→ Dokumente prüfen" });
    if (missingDocs > 0) aiSteps.push({ text: `${missingDocs} Dokument(e) fehlen — diese müssen vor dem Senden hochgeladen werden.` });
    aiSteps.push({ text: "Wenn alles komplett: Netzanfrage an den Netzbetreiber senden." });
  } else if (status.includes("nb") && !status.includes("genehmigt")) {
    aiSteps.push({ text: `Antrag seit ${d.nb?.daysAtNb || "?"} Tagen beim Netzbetreiber.` });
    if (d.nb?.daysAtNb > 10) aiSteps.push({ text: "Lange Wartezeit — Nachfrage beim NB empfohlen.", action: "→ Kommunikation" });
    if (status.includes("rueckfrage")) aiSteps.push({ text: "Rückfrage offen — Antwort mit fehlenden Unterlagen senden.", action: "→ Kommunikation" });
  } else if (status.includes("genehmigt")) {
    aiSteps.push({ text: "Genehmigung erhalten! Nächste Schritte:" });
    aiSteps.push({ text: "1. IBN-Termin mit Elektriker und NB koordinieren", action: "→ Termine" });
    aiSteps.push({ text: "2. MaStR-Registrierung vorbereiten" });
  } else if (status.includes("ibn")) {
    aiSteps.push({ text: "Inbetriebnahme läuft. IBN-Protokoll nach Abschluss hochladen.", action: "→ Dokumente" });
    aiSteps.push({ text: "MaStR-Registrierung abschließen und NB über IBN informieren." });
  } else if (status.includes("fertig")) {
    aiSteps.push({ text: "Vorgang abgeschlossen. Alle Schritte erledigt. ✓" });
  }

  return (
    <div className="v3-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Kontext-Hilfe */}
      <HelpHint text="Die Übersicht zeigt den aktuellen Stand deines Projekts auf einen Blick. Offene Aufgaben werden automatisch erkannt. Du kannst Dokumente direkt hier per Drag-and-Drop hochladen." />

      {/* DRAFT APPROVAL — ganz oben wenn vorhanden */}
      {installationId && <DraftBanner installationId={installationId} />}

      {/* KPI Row */}
      <div className="v3-kpi-grid">
        <StatCard icon="⏱" label="Tage beim NB" value={String(d.nb?.daysAtNb || 0)} sub={`seit ${d.nb?.eingereichtAm || "—"}`} color={d.nb?.daysAtNb > 10 ? C.red : d.nb?.daysAtNb > 5 ? C.amber : C.green} />
        <StatCard icon="💰" label="Offene Rechnungen" value={String(d.rechnungen?.filter((r: any) => r.status !== "BEZAHLT").length || 0)} sub={d.rechnungen?.[0]?.betragBrutto ? `${d.rechnungen[0].betragBrutto} €` : "—"} color={C.amber} />
        <StatCard icon="📄" label="Dokumente" value={missingDocs > 0 ? `${missingDocs} fehlt` : "Komplett"} sub={`${allDocs.filter(x => x.status === "uploaded").length}/${allDocs.length} vorhanden`} color={missingDocs > 0 ? C.red : C.green} />
        <StatCard icon="📅" label="Nächster Termin" value={nextTermin ? nextTermin.typ : "Keiner"} sub={nextTermin ? `${new Date(nextTermin.datum).toLocaleDateString("de-DE")} ${nextTermin.uhrzeit}` : "—"} color={C.cyan} />
      </div>

      {/* Letzte Emails */}
      {emails.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.bright }}>📨 Letzte Emails</div>
            <span style={{ fontSize: 10, color: C.dim }}>{emails.filter(e => e.dir === "in").length} eingegangen · {emails.filter(e => e.dir === "out").length} gesendet</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {emails.slice(0, 4).map((em: any, i: number) => {
              const isIn = em.dir === "in";
              const isRecent = i === 0 && isIn;
              return (
                <div key={em.id || i} className="v3-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${isIn ? (isRecent ? C.amber : C.cyan) : C.green}`, background: isRecent ? "rgba(245,158,11,0.03)" : C.card }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{isIn ? "📩" : "📤"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: isRecent ? 700 : 500, color: isRecent ? C.bright : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {em.subj || em.subject || "Kein Betreff"}
                    </div>
                    <div style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>
                      {isIn ? `Von: ${em.from || em.fromAddress || ""}` : `An: ${em.to || em.from || ""}`} · {em.date || ""}
                    </div>
                  </div>
                  {isRecent && <Badge color={C.amber} bg={C.amberDim}>Neu</Badge>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hinweise — dezent, nur wenn relevant */}
      {(missingDocs > 0 || (status.includes("genehmigt") && !d.ibn?.erledigt)) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {missingDocs > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(239,68,68,0.04)", borderRadius: 8, border: `1px solid rgba(239,68,68,0.1)` }}>
              <span style={{ fontSize: 12 }}>📄</span>
              <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{missingDocs} Dokument(e) fehlen: <span style={{ color: C.dim }}>{missingNames.join(", ")}</span></span>
              <span style={{ fontSize: 11, color: C.accent, fontWeight: 600, cursor: "pointer" }}>↓ Unten hochladen</span>
            </div>
          )}
          {status.includes("genehmigt") && !d.ibn?.erledigt && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(6,182,212,0.04)", borderRadius: 8, border: `1px solid rgba(6,182,212,0.1)` }}>
              <span style={{ fontSize: 12 }}>📅</span>
              <span style={{ fontSize: 12, color: C.text }}>Genehmigung liegt vor — IBN-Termin koordinieren</span>
            </div>
          )}
        </div>
      )}

      {/* Drag-and-Drop Upload Zone — immer sichtbar wenn Docs fehlen */}
      {missingDocs > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.bright, marginBottom: 8 }}>📎 Dokumente hochladen</div>
          <DropZone
            label="Fehlende Unterlagen hier ablegen"
            hint={`Benötigt: ${missingNames.join(", ")}`}
          />
        </div>
      )}

      {/* KI Nächste Schritte */}
      <div className="v3-card" style={{ padding: 16, borderLeft: `3px solid ${C.accent}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>🤖</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>Nächste Schritte</span>
        </div>
        {aiSteps.length > 0 ? aiSteps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent, flexShrink: 0, marginTop: 6 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{step.text}</span>
              {step.action && <span style={{ fontSize: 11, color: C.accent, fontWeight: 600, marginLeft: 6 }}>{step.action}</span>}
            </div>
          </div>
        )) : <p style={{ margin: 0, fontSize: 12, color: C.text }}>Keine offenen Schritte.</p>}
      </div>

      {/* Kontakt-Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Betreiber */}
        <div className="v3-card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: C.greenDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>👤</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>{d.betreiber?.vorname} {d.betreiber?.nachname}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{d.betreiber?.typ || "Privat"}</div>
            </div>
          </div>
          <CopyRow label="Email" value={d.betreiber?.email} important />
          <CopyRow label="Telefon" value={d.betreiber?.telefon} mono />
          <CopyRow label="Adresse" value={`${d.betreiber?.strasse || ""} ${d.betreiber?.hausnr || ""}, ${d.betreiber?.plz || ""} ${d.betreiber?.ort || ""}`} />
        </div>

        {/* Netzbetreiber */}
        <div className="v3-card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: C.cyanDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>⚡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>{d.nb?.name || "—"}</div>
              <div style={{ fontSize: 11, color: C.dim }}>Netzbetreiber</div>
            </div>
          </div>
          <CopyRow label="AZ" value={d.nb?.az} mono important />
          <CopyRow label="Email" value={d.nb?.email} />
          {d.nb?.portal && <CopyRow label="Portal" value={d.nb.portal} mono />}
          <CopyRow label="Eingereicht" value={d.nb?.eingereichtAm} />
        </div>
      </div>

      {/* Phase 4: Eigentümer Card */}
      {d.eigentuemer?.name && (
        <div className="v3-card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: C.purpleDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🏠</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>{d.eigentuemer.name}</div>
              <div style={{ fontSize: 11, color: C.dim }}>Grundstückseigentümer</div>
            </div>
            {d.standort?.istEigentuemer && <Badge color={C.green} bg={C.greenDim}>= Betreiber</Badge>}
          </div>
          <CopyRow label="Email" value={d.eigentuemer.email} />
          <CopyRow label="Telefon" value={d.eigentuemer.telefon} mono />
          <CopyRow label="Adresse" value={`${d.eigentuemer.strasse || ""}, ${d.eigentuemer.plz || ""} ${d.eigentuemer.ort || ""}`} />
        </div>
      )}

      {/* Phase 4: Standort Card */}
      <div className="v3-card" style={{ padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: "50%", background: C.amberDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>📍</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>Anlagenstandort</span>
        </div>
        <CopyRow label="Adresse" value={`${d.standort?.strasse || ""} ${d.standort?.hausnr || ""}, ${d.standort?.plz || ""} ${d.standort?.ort || ""}`} important />
        <CopyRow label="Bundesland" value={d.standort?.bundesland} />
        {d.standort?.gemarkung && <CopyRow label="Gemarkung" value={d.standort.gemarkung} />}
        {d.standort?.flur && <CopyRow label="Flur" value={d.standort.flur} />}
        {d.standort?.flurstuck && <CopyRow label="Flurstück" value={d.standort.flurstuck} mono />}
        {d.standort?.gps && (
          <div className="v3-copy" onClick={() => d.standort?.googleMapsLink && window.open(d.standort.googleMapsLink, "_blank")}>
            <span style={{ fontSize: 11, color: C.dim, minWidth: 80, flexShrink: 0 }}>GPS</span>
            <span style={{ fontSize: 12, color: C.accent, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
              {d.standort.gps} ↗
            </span>
          </div>
        )}
      </div>

      {/* Phase 4: Factro Card */}
      {d.factro?.number && (
        <div className="v3-card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>📊</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>Factro #{d.factro.number}</div>
              <div style={{ fontSize: 11, color: C.dim }}>Projektmanagement</div>
            </div>
            <Badge color={C.cyan} bg={C.cyanDim}>{d.factro.taskState}</Badge>
          </div>
          {d.factro.datenraumLink && (
            <div className="v3-copy" onClick={() => window.open(d.factro.datenraumLink, "_blank")}>
              <span style={{ fontSize: 11, color: C.dim, minWidth: 80, flexShrink: 0 }}>Datenraum</span>
              <span style={{ fontSize: 12, color: C.accent, cursor: "pointer" }}>{d.factro.datenraumLink} ↗</span>
            </div>
          )}
        </div>
      )}

      {/* Phase 4: CRM Card */}
      {d.crm?.id && (
        <div className="v3-card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: C.purpleDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>💼</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.crm.titel}</div>
              <div style={{ fontSize: 11, color: C.dim }}>CRM #{d.crm.id}</div>
            </div>
            <Badge color={C.purple} bg={C.purpleDim}>{(d.crm.stage || "").replace(/_/g, " ")}</Badge>
          </div>
          <CopyRow label="Quelle" value={d.crm.quelle} />
          <CopyRow label="Wert" value={d.crm.geschaetzterWert} />
          <CopyRow label="Priorität" value={d.crm.prioritaet} />
          <CopyRow label="Zuständig" value={d.crm.zustaendiger} />
          {d.crm.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6, padding: "0 10px" }}>
              {d.crm.tags.map((tag: string) => (
                <span key={tag} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: C.accentDim, color: C.accent, fontWeight: 600 }}>{tag}</span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 10, padding: "0 10px" }}>
            <button className="v3-btn" style={{ fontSize: 10, flex: 1 }} onClick={() => window.open(`/netzanmeldungen/crm-${d.crm.id}`, "_blank")}>💼 CRM-Projekt öffnen ↗</button>
            {d.factro?.taskId && <button className="v3-btn" style={{ fontSize: 10, flex: 1 }} onClick={() => window.open(`https://cloud.factro.com/app#/task/${d.factro.taskId}`, "_blank")}>📊 Factro #{d.factro.number} ↗</button>}
          </div>
        </div>
      )}

      {/* Factro Card (ohne CRM) */}
      {!d.crm?.id && d.factro?.number && (
        <div className="v3-card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>📊</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>Factro #{d.factro.number}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{d.factro.taskState || "Aktiv"}</div>
            </div>
          </div>
          {d.factro.datenraumLink && <CopyRow label="Datenraum" value={d.factro.datenraumLink} mono />}
          <button className="v3-btn" style={{ fontSize: 10, marginTop: 8, width: "100%" }} onClick={() => window.open(`https://cloud.factro.com/app#/task/${d.factro.taskId}`, "_blank")}>📊 In Factro öffnen ↗</button>
        </div>
      )}

      {/* Mini-Timeline */}
      <div className="v3-card" style={{ padding: 14 }}>
        <SectionTitle>Letzte Aktivitäten</SectionTitle>
        {timeline.slice(0, 5).map((ev, i) => (
          <div key={ev.id || i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 12, width: 20, textAlign: "center" }}>
              {ev.type === "email_in" ? "📩" : ev.type === "email_out" ? "📤" : ev.type === "status" ? "🔄" : ev.type === "doc" ? "📎" : ev.type === "invoice" ? "💰" : "💬"}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.text}</div>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>{ev.date} · {ev.author}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: KOMMUNIKATION (Phase 8: Quick-Actions)
// ═══════════════════════════════════════════════════════════════════════════════

function WorkflowBadge({ email }: { email: any }) {
  if (!email.workflowType) return null;
  const TYPES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    GENEHMIGUNG: { label: "Genehmigung", color: C.green, bg: C.greenDim, icon: "✅" },
    EINGANGSBESTAETIGUNG: { label: "Eingang bestätigt", color: C.cyan, bg: C.cyanDim, icon: "📥" },
    RUECKFRAGE: { label: "Rückfrage", color: C.amber, bg: C.amberDim, icon: "❓" },
    STORNIERUNG: { label: "Storniert", color: C.red, bg: C.redDim, icon: "🚨" },
    FRISTABLAUF: { label: "Frist!", color: C.red, bg: C.redDim, icon: "⏰" },
    IBN: { label: "IBN/Zähler", color: C.purple, bg: C.purpleDim, icon: "⚡" },
    PORTAL_NACHRICHT: { label: "Portal", color: C.accent, bg: C.accentDim, icon: "🌐" },
    REGISTRIERUNG: { label: "Registrierung", color: C.accent, bg: C.accentDim, icon: "🔑" },
    FORMULAR_FREIGABE: { label: "Freigabe nötig", color: C.amber, bg: C.amberDim, icon: "📋" },
  };
  const t = TYPES[email.workflowType];
  if (!t) return null;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, color: t.color, background: t.bg, display: "inline-flex", alignItems: "center", gap: 3 }}>
      {t.icon} {t.label}
    </span>
  );
}

function WorkflowActions({ email }: { email: any }) {
  if (!email.workflowActions?.length) return null;
  return (
    <div style={{ margin: "8px 0", padding: "8px 12px", background: "rgba(99,139,255,0.04)", borderRadius: 8, border: `1px solid rgba(99,139,255,0.1)` }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.accent, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Automatische Aktionen</div>
      {email.workflowActions.map((a: any, i: number) => (
        <div key={i} style={{ fontSize: 11, color: C.text, padding: "2px 0", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: a.priority === "CRITICAL" ? C.red : a.priority === "HIGH" ? C.amber : C.green, flexShrink: 0 }} />
          {a.description}
        </div>
      ))}
    </div>
  );
}

function TabComms({ emails, d }: { emails: any[]; d: any }) {
  const [composing, setComposing] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [body, setBody] = useState("");
  const [to, setTo] = useState(d.nb?.email || "");
  const [cc, setCc] = useState(d.dedicatedEmail || "");
  const [subj, setSubj] = useState("");
  const [fromAddr, setFromAddr] = useState(d.dedicatedEmail || "netzanmeldung@lecagmbh.de");
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [sentConfirm, setSentConfirm] = useState(false);

  const enrichedEmails = emails.map(em => ({
    ...em,
    workflowType: em.workflowType || (em.dir === "in" && em.id === 1 ? "RUECKFRAGE" : em.dir === "in" && em.id === 3 ? "EINGANGSBESTAETIGUNG" : undefined),
    workflowActions: em.workflowActions || (em.dir === "in" && em.id === 1 ? [
      { type: "STATUS_CHANGE", priority: "NORMAL", description: "Status → RUECKFRAGE" },
      { type: "COMMENT", priority: "NORMAL", description: "Kommentar auf Installation geschrieben" },
    ] : undefined),
  }));

  const filtered = filter === "all" ? enrichedEmails : enrichedEmails.filter(e => e.dir === filter);
  const inCount = emails.filter(e => e.dir === "in").length;
  const outCount = emails.filter(e => e.dir === "out").length;
  const daysAtNb = d.nb?.daysAtNb || 0;

  const startReply = (em: any) => {
    setReplyTo(em); setComposing(true); setSentConfirm(false);
    setTo(em.dir === "in" ? em.from : (d.nb?.email || ""));
    setSubj(em.subj?.startsWith("Re:") ? em.subj : `Re: ${em.subj}`);
    setBody(""); setCc(d.dedicatedEmail || "");
  };

  const startNew = () => {
    setReplyTo(null); setComposing(true); setSentConfirm(false);
    setTo(d.nb?.email || ""); setSubj(`Netzanschlussantrag ${d.nb?.az || d.publicId || ""}`);
    setBody(""); setCc(d.dedicatedEmail || "");
  };

  const generateAiDraft = () => {
    setAiLoading(true);
    setTimeout(() => {
      const betreiber = `${d.betreiber?.vorname || ""} ${d.betreiber?.nachname || ""}`.trim();
      const standort = `${d.standort?.strasse || ""} ${d.standort?.hausnr || ""}, ${d.standort?.plz || ""} ${d.standort?.ort || ""}`;
      setBody(replyTo
        ? `Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihre Nachricht zu unserem Antrag (AZ: ${d.nb?.az || ""}).\n\nAnbei übersenden wir die angeforderten Unterlagen.\n\nAnlagenbetreiber: ${betreiber}\nStandort: ${standort}\n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG\nTel: 0721-98618238`
        : `Sehr geehrte Damen und Herren,\n\nhiermit übersenden wir Ihnen den Netzanschlussantrag für:\n\nAnlagenbetreiber: ${betreiber}\nStandort: ${standort}\nLeistung: ${d.anlage?.kwp || "?"} kWp\n\nAlle erforderlichen Unterlagen (VDE-Formularsatz, Lageplan, Schaltplan, Datenblätter) liegen bei.\n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG\nTel: 0721-98618238`
      );
      setAiLoading(false);
    }, 800);
  };

  const handleSend = () => {
    setSentConfirm(true);
    setTimeout(() => { setComposing(false); setReplyTo(null); setBody(""); setSentConfirm(false); }, 2000);
  };

  const QUICK_ACTIONS: { icon: string; label: string; desc: string; color: string; type: string }[] = [
    { icon: "📩", label: "Sachstand anfragen", desc: "Bearbeitungsstand beim NB erfragen", color: C.cyan, type: "nachfragen" },
    { icon: "📎", label: "Unterlagen nachreichen", desc: "Fehlende Dokumente senden", color: C.accent, type: "nachreichung" },
    { icon: "🔄", label: "Zählernummer melden", desc: "Zähler-Info an NB übermitteln", color: C.green, type: "zaehler" },
    { icon: "🚫", label: "Stornierung", desc: "Antrag zurückziehen", color: C.red, type: "stornierung" },
  ];

  const applyTemplate = (type: string) => {
    const az = d.nb?.az || ""; const betreiber = `${d.betreiber?.vorname || ""} ${d.betreiber?.nachname || ""}`.trim();
    const standort = `${d.standort?.strasse || ""} ${d.standort?.hausnr || ""}, ${d.standort?.plz || ""} ${d.standort?.ort || ""}`;
    const tpls: Record<string, { subj: string; body: string }> = {
      nachfragen: { subj: `Sachstandsanfrage — ${az || d.publicId}`, body: `Sehr geehrte Damen und Herren,\n\nwir möchten uns nach dem aktuellen Bearbeitungsstand unseres Netzanschlussantrags erkundigen.\n\nAktenzeichen: ${az}\nAnlagenbetreiber: ${betreiber}\nStandort: ${standort}\n\nDer Antrag wurde am ${d.nb?.eingereichtAm || "?"} eingereicht (${daysAtNb} Tage).\n\nFür Rückfragen stehen wir gerne zur Verfügung.\n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG\nTel: 0721-98618238` },
      nachreichung: { subj: `Nachreichung Unterlagen — ${az || d.publicId}`, body: `Sehr geehrte Damen und Herren,\n\nanbei übersenden wir die angeforderten Unterlagen zu unserem Netzanschlussantrag.\n\nAktenzeichen: ${az}\n\nFolgende Unterlagen liegen bei:\n• [Unterlagen hier auflisten]\n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG\nTel: 0721-98618238` },
      zaehler: { subj: `Zählernummer — ${az || d.publicId}`, body: `Sehr geehrte Damen und Herren,\n\nhiermit teilen wir Ihnen die Zählernummer mit:\n\nAktenzeichen: ${az}\nZählernummer: ${d.zaehler?.nummer || "[bitte eintragen]"}\nStandort: ${standort}\nAnlagenbetreiber: ${betreiber}\n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG\nTel: 0721-98618238` },
      stornierung: { subj: `Stornierung — ${az || d.publicId}`, body: `Sehr geehrte Damen und Herren,\n\nhiermit möchten wir den Netzanschlussantrag stornieren.\n\nAktenzeichen: ${az}\nAnlagenbetreiber: ${betreiber}\nStandort: ${standort}\n\nBitte bestätigen Sie die Stornierung.\n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG\nTel: 0721-98618238` },
    };
    const tpl = tpls[type]; if (!tpl) return;
    setReplyTo(null); setComposing(true); setSentConfirm(false);
    setTo(d.nb?.email || ""); setSubj(tpl.subj); setBody(tpl.body); setCc(d.dedicatedEmail || "");
  };

  const FROM_OPTIONS = [d.dedicatedEmail, "netzanmeldung@lecagmbh.de", "info@baunity.de"].filter(Boolean);

  return (
    <div className="v3-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <HelpHint text="Email-Verkehr mit dem Netzbetreiber. Eingehende Emails werden automatisch analysiert (KI-Klassifikation). Antworten werden von der Installations-Email gesendet, damit Antworten automatisch zugeordnet werden." />

      {/* NB-Kontakt-Bar (erweitert) */}
      <div className="v3-card" style={{ padding: "12px 16px", borderLeft: `3px solid ${C.cyan}`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: C.cyanDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⚡</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.bright }}>{d.nb?.name || "Netzbetreiber"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.muted, marginTop: 2 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{d.nb?.email || ""}</span>
            {d.nb?.az && <><span style={{ color: C.dim }}>·</span><span>AZ: <strong style={{ color: C.cyan }}>{d.nb.az}</strong></span></>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: daysAtNb > 10 ? C.red : daysAtNb > 5 ? C.amber : C.green, lineHeight: 1 }}>{daysAtNb}</div>
          <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tage</div>
        </div>
        {d.nb?.portal && (
          <button className="v3-btn" style={{ fontSize: 10, padding: "4px 10px" }} onClick={() => window.open(d.nb.portal, "_blank")}>Portal ↗</button>
        )}
      </div>

      {/* Filter + Neue Email */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "in", "out"] as const).map(f => {
            const active = filter === f;
            const cnt = f === "all" ? emails.length : f === "in" ? inCount : outCount;
            const col = f === "in" ? C.cyan : f === "out" ? C.green : C.accent;
            return (
              <button key={f} className="v3-btn" onClick={() => setFilter(f)}
                style={{ fontSize: 10, padding: "4px 12px", ...(active ? { background: `${col}12`, borderColor: `${col}30`, color: col } : {}) }}>
                {f === "in" ? "📩 Eingang" : f === "out" ? "📤 Ausgang" : "Alle"} ({cnt})
              </button>
            );
          })}
        </div>
        <button className="v3-btn v3-btn-primary" onClick={startNew} style={{ fontSize: 11 }}>✉ Neue Email</button>
      </div>

      {/* Quick-Actions (als Cards, nicht als flache Buttons) */}
      {!composing && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
          {QUICK_ACTIONS.map(qa => (
            <div key={qa.type} onClick={() => applyTemplate(qa.type)}
              className="v3-card" style={{ padding: "10px 12px", cursor: "pointer", textAlign: "center", borderTop: `2px solid ${qa.color}15` }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{qa.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.bright, marginBottom: 2 }}>{qa.label}</div>
              <div style={{ fontSize: 9, color: C.dim }}>{qa.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Compose / Reply */}
      {composing && (
        <div className="v3-card v3-float" style={{ padding: 18, borderLeft: `3px solid ${replyTo ? C.cyan : C.accent}`, position: "relative", overflow: "hidden" }}>
          {/* Subtle gradient bg */}
          <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: `radial-gradient(circle, ${replyTo ? C.cyanGlow : C.accentGlow}, transparent)`, pointerEvents: "none" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>{replyTo ? "↩" : "✉"}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: replyTo ? C.cyan : C.accent }}>
                {replyTo ? `Antwort auf: ${replyTo.subj?.slice(0, 40)}...` : "Neue Email"}
              </span>
            </div>
            <button onClick={() => { setComposing(false); setReplyTo(null); setSentConfirm(false); }} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 16, padding: 4 }}>✕</button>
          </div>

          {/* Absender-Auswahl */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 9, color: C.dim, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Von</label>
            <div style={{ display: "flex", gap: 4 }}>
              {FROM_OPTIONS.map(addr => (
                <button key={addr} className="v3-btn" onClick={() => setFromAddr(addr!)}
                  style={{ fontSize: 10, padding: "3px 10px", fontFamily: "'JetBrains Mono',monospace",
                    ...(fromAddr === addr ? { background: C.accentDim, borderColor: `${C.accent}30`, color: C.accent } : {}) }}>
                  {addr}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div>
              <label style={{ fontSize: 9, color: C.dim, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>An</label>
              <input className="v3-input" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 9, color: C.dim, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>CC</label>
              <input className="v3-input" value={cc} onChange={e => setCc(e.target.value)} placeholder={d.dedicatedEmail || ""} />
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 9, color: C.dim, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Betreff</label>
            <input className="v3-input" value={subj} onChange={e => setSubj(e.target.value)} />
          </div>

          <textarea className="v3-input" rows={8} value={body} onChange={e => setBody(e.target.value)}
            placeholder={replyTo ? "Antwort schreiben..." : "Nachricht verfassen..."}
            style={{ resize: "vertical", marginBottom: 12, lineHeight: 1.7 }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="v3-btn" style={{ fontSize: 11 }}>📎 Anhang</button>
              <button className="v3-btn" style={{ fontSize: 11 }}>📄 Dokument wählen</button>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="v3-btn" style={{ fontSize: 11 }} onClick={generateAiDraft} disabled={aiLoading}>
                {aiLoading ? "⏳ Generiert..." : "🤖 KI-Entwurf"}
              </button>
              {sentConfirm ? (
                <span style={{ fontSize: 12, color: C.green, fontWeight: 600, padding: "7px 14px" }}>✓ Gesendet!</span>
              ) : (
                <button className="v3-btn v3-btn-primary" onClick={handleSend} style={{ fontWeight: 700 }}>
                  Senden →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email-Thread-Liste */}
      {filtered.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {filtered.map((em, idx) => {
            const isIn = em.dir === "in";
            const isExpanded = expanded[em.id];
            const isUnread = isIn && idx === 0;
            const borderColor = isIn ? (isUnread ? C.cyan : `${C.cyan}40`) : `${C.green}40`;

            return (
              <div key={em.id} className="v3-card" style={{
                borderRadius: 12, overflow: "hidden",
                borderColor: isUnread ? `${C.cyan}30` : undefined,
                background: isUnread ? `${C.cyan}05` : undefined,
              }}>
                {/* Email Header Row */}
                <div onClick={() => setExpanded(p => ({ ...p, [em.id]: !p[em.id] }))}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}>
                  {/* Direction indicator */}
                  <div style={{ width: 3, height: 36, borderRadius: 2, background: borderColor, flexShrink: 0 }} />
                  {/* Avatar */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: isIn ? C.cyanDim : C.greenDim,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                    boxShadow: isUnread ? `0 0 12px ${C.cyan}15` : "none",
                  }}>
                    {isIn ? "📩" : "📤"}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: isUnread ? 700 : 500, color: isUnread ? C.bright : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, letterSpacing: "-0.01em" }}>
                        {em.subj}
                      </span>
                      <WorkflowBadge email={em} />
                    </div>
                    <div style={{ fontSize: 10, color: C.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {isIn ? em.from : `An: ${em.from}`}
                      {!isExpanded && em.preview && <span> — {em.preview.slice(0, 50)}…</span>}
                    </div>
                  </div>
                  {/* Meta */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: C.dim }}>{em.date?.split(" ")[0]}</div>
                      <div style={{ fontSize: 9, color: C.dim }}>{em.date?.split(" ")[1]}</div>
                    </div>
                    {em.files?.length > 0 && <span style={{ fontSize: 10, color: C.muted }}>📎{em.files.length}</span>}
                    {isUnread && <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.cyan, boxShadow: `0 0 6px ${C.cyan}50` }} />}
                    <span style={{ fontSize: 10, color: C.dim, transition: "transform .2s cubic-bezier(0.2,0.8,0.2,1)", transform: isExpanded ? "rotate(180deg)" : "none" }}>▾</span>
                  </div>
                </div>

                {/* Expanded Body */}
                {isExpanded && (
                  <div className="v3-fade" style={{ padding: "0 16px 16px 65px", borderTop: `1px solid ${C.border}` }}>
                    {/* Meta Grid */}
                    <div style={{ padding: "10px 0", display: "grid", gridTemplateColumns: "auto 1fr", gap: "3px 14px", fontSize: 11 }}>
                      <span style={{ color: C.dim, fontWeight: 600 }}>Von</span><span style={{ color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>{isIn ? em.from : fromAddr}</span>
                      <span style={{ color: C.dim, fontWeight: 600 }}>An</span><span style={{ color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>{isIn ? (d.dedicatedEmail || "evu@lecagmbh.de") : em.from}</span>
                      <span style={{ color: C.dim, fontWeight: 600 }}>Datum</span><span style={{ color: C.text }}>{em.date}</span>
                    </div>

                    {/* Email Body */}
                    <div style={{
                      padding: "14px 16px", background: "rgba(0,0,0,0.2)", borderRadius: 10,
                      border: `1px solid ${C.borderSubtle}`,
                      fontSize: 13, color: C.text, lineHeight: 1.75, whiteSpace: "pre-wrap", marginBottom: 12,
                    }}>
                      {em.body || em.preview || "Kein Inhalt verfügbar."}
                    </div>

                    {/* Anhänge — klickbar */}
                    {em.files?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Anhänge ({em.files.length})</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {em.files.map((f: string, fi: number) => {
                            const isPdf = f.toLowerCase().endsWith(".pdf");
                            // Versuche passenden Dokument-Link aus attachmentIds zu finden
                            const attId = em.attachmentIds?.[fi];
                            return attId ? (
                              <a key={fi} href={`/api/documents/${attId}/download?view=true&token=${localStorage.getItem("baunity_token") || ""}`}
                                target="_blank" rel="noreferrer" className="v3-btn"
                                style={{ fontSize: 10, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: C.cyan, borderColor: `${C.cyan}25` }}>
                                <span>{isPdf ? "📄" : "📎"}</span><span>{f}</span><span style={{ fontSize: 9 }}>↗</span>
                              </a>
                            ) : (
                              <span key={fi} className="v3-btn" style={{ fontSize: 10, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6, opacity: 0.6 }}>
                                <span>{isPdf ? "📄" : "📎"}</span><span>{f}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Workflow Actions */}
                    <WorkflowActions email={em} />

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button className="v3-btn v3-btn-primary" style={{ fontSize: 11 }} onClick={() => startReply(em)}>↩ Antworten</button>
                      <button className="v3-btn" style={{ fontSize: 11 }}>↗ Weiterleiten</button>
                      {isIn && <button className="v3-btn" style={{ fontSize: 11 }}>🤖 KI-Analyse</button>}
                      {isIn && em.workflowType === "RUECKFRAGE" && (
                        <button className="v3-btn" style={{ fontSize: 11, color: C.amber, borderColor: `${C.amber}25` }}>📋 Rückfrage bearbeiten</button>
                      )}
                      {isIn && em.workflowType === "GENEHMIGUNG" && (
                        <button className="v3-btn" style={{ fontSize: 11, color: C.green, borderColor: `${C.green}25` }}>✅ Genehmigung bestätigen</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 50, color: C.dim }}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.5 }}>📭</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
            {filter === "all" ? "Noch keine Emails" : `Keine ${filter === "in" ? "eingehenden" : "ausgehenden"} Emails`}
          </div>
          <div style={{ fontSize: 12, color: C.dim }}>Sende die Netzanfrage um die Kommunikation zu starten.</div>
          <button className="v3-btn v3-btn-primary" style={{ marginTop: 12 }} onClick={startNew}>✉ Erste Email senden</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: DOKUMENTE (Phase 5: Extended)
// ═══════════════════════════════════════════════════════════════════════════════

function TabDocs({ docs, d, isStaff }: { docs: any[]; d?: any; isStaff?: boolean }) {
  const uploaded = docs.filter(x => x.status === "uploaded");
  const total = docs.length;

  // Norm bestimmen: kWp >= 135 oder Speicher → Mittelspannung (E1+E8), sonst NS (E1+E2+E3+E8)
  const kwp = Number(d?.anlage?.kwp) || 0;
  const isSpeicher = isSpeicherTyp(d?.anlage?.systemTyp || "");
  const isMS = kwp >= 135 || isSpeicher;

  // Auto-generierte Dokumente (nur für Admin sichtbar)
  const AUTO_DOCS = isMS
    ? [
        { key: "vde_e1", label: "E.1 Anmeldung (VDE 4110)", icon: "📋" },
        { key: "vde_e8", label: "E.8 Datenblatt EZA (VDE 4110)", icon: "📋" },
        { key: "schaltplan", label: "Übersichtsschaltplan", icon: "⚡" },
        { key: "lageplan", label: "Lageplan", icon: "🗺️" },
      ]
    : [
        { key: "vde_e1", label: "E.1 Anmeldung (VDE 4105)", icon: "📋" },
        { key: "vde_e2", label: "E.2 Datenblatt EZA (VDE 4105)", icon: "📋" },
        { key: "vde_e3", label: "E.3 Datenblatt Speicher (VDE 4105)", icon: "📋" },
        { key: "vde_e8", label: "E.8 IBN-Protokoll (VDE 4105)", icon: "📋" },
        { key: "schaltplan", label: "Übersichtsschaltplan", icon: "⚡" },
        { key: "lageplan", label: "Lageplan", icon: "🗺️" },
      ];

  const autoDocs = AUTO_DOCS.map(item => {
    const found = docs.find(x => x.type === item.key || x.name?.toLowerCase().includes(item.label.split(" ")[0].toLowerCase()));
    return { ...item, found: !!found, doc: found };
  });

  // Alle sonstigen hochgeladenen Dokumente (nicht auto-generiert)
  const manualDocs = docs.filter(x => x.status === "uploaded" && !autoDocs.some(a => a.doc?.id === x.id));

  return (
    <div className="v3-fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <HelpHint text={isStaff
        ? `Formulare (${isMS ? "VDE 4110: E.1 + E.8" : "VDE 4105: E.1 + E.2 + E.3 + E.8"}), Schaltplan und Lageplan werden automatisch generiert. Mit einem Klick alles erzeugen und an den NB senden.`
        : "Hier findest du alle Dokumente zu deiner Netzanmeldung. Du kannst fehlende Unterlagen per Drag-and-Drop hochladen."
      } />

      {/* Fortschritts-Header */}
      <div className="v3-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.bright }}>{uploaded.length} Dokument{uploaded.length !== 1 ? "e" : ""} vorhanden</div>
            <div style={{ fontSize: 11, color: C.dim }}>{isMS ? "Mittelspannung (VDE-AR-N 4110)" : "Niederspannung (VDE-AR-N 4105)"}</div>
          </div>
          {isStaff && (
            <div style={{ display: "flex", gap: 6 }}>
              <button className="v3-btn v3-btn-primary" style={{ fontSize: 11 }}>🔧 Alles generieren</button>
            </div>
          )}
        </div>
        {/* Progress Bar */}
        {(() => {
          const autoFound = autoDocs.filter(a => a.found).length;
          const autoTotal = autoDocs.length;
          const pct = autoTotal > 0 ? Math.round((autoFound / autoTotal) * 100) : 0;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ height: 6, flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? C.green : C.accent, borderRadius: 3, transition: "width .3s ease" }} />
              </div>
              <span style={{ fontSize: 10, color: C.dim, flexShrink: 0 }}>{autoFound}/{autoTotal}</span>
            </div>
          );
        })()}
      </div>

      {/* Auto-generierte Dokumente — nur für Admin */}
      {isStaff && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.bright, marginBottom: 8 }}>Generierte Unterlagen</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {autoDocs.map(item => (
              <div key={item.key} className="v3-card" style={{
                padding: "10px 12px", display: "flex", alignItems: "center", gap: 10,
                opacity: item.found ? 1 : 0.5,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: item.found ? C.greenDim : "rgba(255,255,255,0.03)",
                  fontSize: 15,
                }}>
                  {item.found ? "✅" : item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: item.found ? C.text : C.dim, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 10, color: C.dim }}>
                    {item.found ? (item.doc?.date || "Generiert") : "Noch nicht generiert"}
                  </div>
                </div>
                {item.found && (
                  <div style={{ display: "flex", gap: 3 }}>
                    <button className="v3-btn" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => { const url = item.doc?.url || `/api/documents/${item.doc?.id}/download`; const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.click(); }}>👁</button>
                    <button className="v3-btn" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => { const url = item.doc?.url || `/api/documents/${item.doc?.id}/download`; const a = document.createElement("a"); a.href = url; a.download = item.doc?.name || "dokument"; a.click(); }}>⬇</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hochgeladene Dokumente */}
      {manualDocs.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.bright, marginBottom: 8 }}>
            {isStaff ? "Hochgeladene Dokumente" : "Dokumente"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {manualDocs.map(doc => {
              const isPdf = (doc.name || "").toLowerCase().endsWith(".pdf");
              const isImg = /\.(png|jpg|jpeg|gif|webp)$/i.test(doc.name || "");
              const docUrl = doc.url || `/api/documents/${doc.id}/download`;
              return (
                <div key={doc.id} className="v3-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14 }}>{isPdf ? "📄" : isImg ? "🖼️" : "📎"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.originalName || doc.name}</div>
                    <div style={{ fontSize: 10, color: C.dim }}>{doc.kategorie || doc.type || "Dokument"} · {doc.date || "—"}{doc.size ? ` · ${(doc.size / 1024).toFixed(0)} KB` : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 3 }}>
                    {(isPdf || isImg) && <button className="v3-btn" style={{ fontSize: 10, padding: "3px 8px" }} onClick={() => window.open(`${docUrl}?view=true`, "_blank")}>👁</button>}
                    <button className="v3-btn" style={{ fontSize: 10, padding: "3px 8px" }} onClick={() => { const a = document.createElement("a"); a.href = docUrl; a.download = doc.originalName || doc.name || "dokument"; a.click(); }}>⬇</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Datenraum (Google Drive) */}
      {d?.factro?.datenraumLink && (
        <div className="v3-card" style={{ padding: 14, borderLeft: `3px solid ${C.accent}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>📂</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.bright }}>Datenraum (Google Drive)</div>
              <div style={{ fontSize: 10, color: C.dim }}>Alle Projektdokumente aus Factro</div>
            </div>
            <button className="v3-btn v3-btn-primary" style={{ fontSize: 11 }} onClick={() => window.open(d.factro.datenraumLink, "_blank")}>Öffnen ↗</button>
          </div>
        </div>
      )}

      {/* Datenblätter Hinweis */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(167,139,250,0.04)", borderRadius: 8, border: `1px solid rgba(167,139,250,0.1)` }}>
        <span style={{ fontSize: 13 }}>📊</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>Datenblätter</div>
          <div style={{ fontSize: 10, color: C.dim }}>Produktdatenblätter für Module, Wechselrichter und Speicher werden demnächst automatisch aus der Datenbank geladen.</div>
        </div>
      </div>

      {/* Drag-and-Drop Upload */}
      <DropZone label="Dokumente hochladen" hint="PDF, JPG, PNG — z.B. Genehmigungen, Nachweise, Fotos" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: TECHNIK (Phase 3: Complete Rewrite)
// ═══════════════════════════════════════════════════════════════════════════════

function TabTech({ d }: { d: any }) {
  const a = d.anlage || {};
  const speicher = isSpeicherTyp(a.systemTyp || "");
  const kwpNum = Number(a.kwp) || 0;
  const kvaNum = Number(a.totalInverterKva) || 0;
  const kwhNum = Number(a.totalBatteryKwh) || 0;

  const pvPower = formatPower(kwpNum, speicher);
  const batCap = formatCapacity(kwhNum);

  // Speicher-Leistung aus batteryEntries (für Großspeicher die kein kWh haben)
  const batPowerKw = (a.batteryEntries || []).reduce((s: number, b: any) => s + ((b.count || 1) * (b.powerKw || 0)), 0);
  const hasBattery = kwhNum > 0 || batPowerKw > 0;

  // KPI items: filter out zero values
  const kpis: { icon: string; label: string; value: string; color: string }[] = [];
  if (kwpNum > 0) {
    kpis.push({ icon: "☀️", label: "PV", value: `${pvPower.value} ${pvPower.unit}`, color: C.green });
  }
  if (kvaNum > 0) {
    kpis.push({ icon: "⚡", label: "Wechselrichter", value: `${n2(kvaNum)} kVA`, color: C.cyan });
  }
  if (hasBattery) {
    const batDisplay = batPowerKw > 0 && kwhNum === 0
      ? formatPower(batPowerKw, true)  // Großspeicher: kW/MW
      : batCap;                         // Heimspeicher: kWh
    const batLabel = batPowerKw >= 1000 ? "Speicher" : "Speicher";
    kpis.push({ icon: "🔋", label: batLabel, value: `${batDisplay.value} ${batDisplay.unit}`, color: C.purple });
  }
  if (kpis.length < 4) {
    // Messkonzept kürzen wenn zu lang
    const mk = (a.messkonzept || "—").replace("einspeisung", "").replace("messung", "").trim() || a.messkonzept || "—";
    kpis.push({ icon: "🔌", label: "Einspeisung", value: mk, color: C.amber });
  }

  const zaehlerBestand = d.zaehlerBestand || [];
  const zaehlerNeu = d.zaehlerNeu;
  const netzanschluss = d.netzanschluss || {};

  return (
    <div className="v3-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <HelpHint text={speicher
        ? "Technische Daten des Speicherprojekts. Leistungsangaben in kW/MW. Wechselrichter und Speicher-Systeme werden aus dem CRM übernommen."
        : "Alle technischen Komponenten der Anlage: Module, Wechselrichter, Speicher, Zähler. Anlagenparameter werden für die VDE-Formulare verwendet."
      } />
      {/* KPI Row */}
      <div className="v3-kpi-grid" style={{ gridTemplateColumns: `repeat(${Math.min(kpis.length, 4)}, 1fr)` }}>
        {kpis.map((kpi, i) => (
          <StatCard key={i} icon={kpi.icon} label={kpi.label} value={kpi.value} color={kpi.color} />
        ))}
      </div>

      {/* PV-Module (hide if speicher and no PV) */}
      {(!speicher || (a.pvEntries || []).length > 0) && (a.pvEntries || []).length > 0 && (() => {
        const totalModules = (a.pvEntries || []).reduce((s: number, pv: any) => s + (pv.count || 0), 0);
        const totalKwp = (a.pvEntries || []).reduce((s: number, pv: any) => s + ((pv.count || 0) * (pv.powerWp || 0)) / 1000, 0);
        return (
        <div className="v3-card" style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <SectionTitle>PV-Module</SectionTitle>
            <div style={{ display: "flex", gap: 6 }}>
              <Badge color={C.green} bg={C.greenDim}>{totalModules} Module</Badge>
              <Badge color={C.green} bg={C.greenDim}>{n2(totalKwp)} kWp</Badge>
            </div>
          </div>
          {(a.pvEntries || []).map((pv: any, i: number) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: i < (a.pvEntries?.length || 0) - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>{pv.roofName || `Dach ${i + 1}`}</span>
                <Badge color={C.green} bg={C.greenDim}>{n2((pv.count * pv.powerWp) / 1000)} kWp</Badge>
              </div>
              <div style={{ fontSize: 12, color: C.text }}>{pv.count}× {pv.manufacturer} {pv.model} ({pv.powerWp} Wp)</div>
              <div style={{ fontSize: 11, color: C.dim }}>{pv.orientation} {pv.tilt}°</div>
            </div>
          ))}
          {/* Gesamtzeile */}
          <div style={{ padding: "10px 0 0", borderTop: `1px solid ${C.border}`, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.bright }}>Gesamt</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{totalModules} Module · {n2(totalKwp)} kWp</span>
          </div>
        </div>
        );
      })()}

      {/* WR + Speicher */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* Wechselrichter */}
        <div className="v3-card" style={{ padding: 14 }}>
          <SectionTitle>Wechselrichter</SectionTitle>
          {(a.inverterEntries || []).map((wr: any, i: number) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.bright }}>{wr.manufacturer} {wr.model}</div>
              <div style={{ fontSize: 11, color: C.dim }}>
                {wr.count}× {wr.powerKva} kVA
                {wr.acPowerKw ? ` · AC: ${wr.acPowerKw} kW` : ""}
                {wr.scheinleistungKva ? ` · S: ${wr.scheinleistungKva} kVA` : ""}
              </div>
              {wr.zerezId && <div style={{ fontSize: 10, color: C.accent, fontFamily: "'JetBrains Mono',monospace" }}>ZEREZ: {wr.zerezId}</div>}
              <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                {wr.hybrid && <Badge color={C.purple} bg={C.purpleDim}>Hybrid</Badge>}
                {wr.count > 1 && <Badge color={C.cyan} bg={C.cyanDim}>{wr.count}×</Badge>}
              </div>
            </div>
          ))}
        </div>

        {/* Speicher */}
        <div className="v3-card" style={{ padding: 14 }}>
          <SectionTitle>Speicher</SectionTitle>
          {(a.batteryEntries || []).length > 0 ? (a.batteryEntries || []).map((b: any, i: number) => {
            const bPowerKw = b.powerKw || 0;
            const bPower = bPowerKw > 0 ? (bPowerKw >= 1000 ? `${(bPowerKw / 1000).toFixed(1)} MW` : `${bPowerKw} kW`) : "";
            const bCapKwh = b.capacityKwh || 0;
            const bCap = formatCapacity(bCapKwh);
            const isGross = bPowerKw >= 1000 || (b.model || "").includes("Großbatterie") || (b.model || "").includes("Schwarmspeicher");
            // Lade/Entlade nur zeigen wenn sie sich von powerKw unterscheiden (nicht doppelt anzeigen)
            const showLadeEntlade = !isGross && (b.ladeleistungKw > 0 || b.entladeleistungKw > 0) && b.ladeleistungKw !== bPowerKw;
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.bright }}>{b.manufacturer && b.manufacturer !== "—" ? `${b.manufacturer} ` : ""}{b.model}</div>
                <div style={{ fontSize: 11, color: C.dim }}>
                  {b.count > 1 ? `${b.count}× ` : ""}
                  {bPower ? `${bPower}` : ""}
                  {bCapKwh > 0 ? `${bPower ? " · " : ""}${bCap.value} ${bCap.unit}` : ""}
                  {b.coupling ? ` · ${b.coupling}` : ""}
                </div>
                {showLadeEntlade && (
                  <div style={{ fontSize: 10, color: C.dim }}>
                    Laden: {b.ladeleistungKw || "—"} kW · Entladen: {b.entladeleistungKw || "—"} kW
                  </div>
                )}
                {b.batteryType && <div style={{ fontSize: 10, color: C.dim }}>Typ: {b.batteryType}</div>}
                <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                  {b.emergencyPower && <Badge color={C.amber} bg={C.amberDim}>Notstrom</Badge>}
                  {b.islandForming && <Badge color={C.green} bg={C.greenDim}>Inselfähig</Badge>}
                </div>
              </div>
            );
          }) : <div style={{ fontSize: 12, color: C.dim }}>Kein Speicher</div>}
        </div>
      </div>

      {/* Wallbox Section */}
      {(a.wallboxEntries || []).length > 0 && (
        <div className="v3-card" style={{ padding: 14 }}>
          <SectionTitle>Wallbox / Ladeinfrastruktur</SectionTitle>
          {(a.wallboxEntries || []).map((wb: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < (a.wallboxEntries?.length || 0) - 1 ? `1px solid ${C.border}` : "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.bright }}>{wb.manufacturer} {wb.model}</div>
                <div style={{ fontSize: 11, color: C.dim }}>
                  {wb.powerKw} kW · {wb.phasen || 3}-phasig
                  {wb.stecker ? ` · ${wb.stecker}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {wb.steuerbar14a && <Badge color={C.green} bg={C.greenDim}>§14a</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wärmepumpe Section */}
      {(a.waermepumpeEntries || []).length > 0 && (
        <div className="v3-card" style={{ padding: 14 }}>
          <SectionTitle>Wärmepumpe</SectionTitle>
          {(a.waermepumpeEntries || []).map((wp: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.bright }}>{wp.manufacturer} {wp.model}</div>
                <div style={{ fontSize: 11, color: C.dim }}>
                  {wp.powerKw} kW {wp.cop ? `· COP ${wp.cop}` : ""}
                  {wp.count > 1 ? ` · ${wp.count}×` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {wp.sgReady && <Badge color={C.cyan} bg={C.cyanDim}>SG Ready</Badge>}
                {wp.steuerbar14a && <Badge color={C.green} bg={C.greenDim}>§14a</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Anlagenparameter */}
      <div className="v3-card" style={{ padding: 14 }}>
        <SectionTitle>Anlagenparameter</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <CopyRow label="Einspeiseart" value={a.einspeisung} />
          <CopyRow label="Messkonzept" value={a.messkonzept} />
          <CopyRow label="Betriebsweise" value={a.betriebsweise} />
          <CopyRow label="Netzebene" value={a.netzebene} />
          <CopyRow label="Blindleistung" value={a.blindleistungskompensation} />
          <CopyRow label="Einspeisemgmt." value={a.einspeisemanagement} />
          <CopyRow label="Begrenzung %" value={a.begrenzungProzent ? `${a.begrenzungProzent}%` : undefined} />
          <CopyRow label="Phasen" value={a.einspeisephasen} />
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <YesNoBadge value={a.paragraph14a} label="§14a EnWG" />
          <YesNoBadge value={a.inselbetrieb} label="Inselbetrieb" />
          <YesNoBadge value={a.naSchutzErforderlich} label="NA-Schutz" />
        </div>
      </div>

      {/* Zähler-Bestand */}
      {zaehlerBestand.length > 0 && (
        <div>
          <SectionTitle>Zähler-Bestand</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {zaehlerBestand.map((z: any) => {
              const isAbmelden = z.aktion === "abmelden";
              return (
                <div key={z.id} className="v3-card" style={{ padding: 14, borderLeft: `3px solid ${isAbmelden ? C.red : C.green}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.bright, fontFamily: "'JetBrains Mono',monospace" }}>{z.nummer}</span>
                    <Badge color={isAbmelden ? C.red : C.green} bg={isAbmelden ? C.redDim : C.greenDim}>
                      {z.aktion}
                    </Badge>
                  </div>
                  <CopyRow label="Typ" value={z.typ} />
                  <CopyRow label="Standort" value={z.standort} />
                  {z.letzterStand != null && <CopyRow label="Letzter Stand" value={String(z.letzterStand)} mono />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Zähler-Neu */}
      {zaehlerNeu && (
        <div className="v3-card" style={{ padding: 14, borderLeft: `3px solid ${C.green}` }}>
          <SectionTitle>Neuer Zähler (gewünscht)</SectionTitle>
          <CopyRow label="Typ" value={zaehlerNeu.gewuenschterTyp} important />
          <CopyRow label="Standort" value={zaehlerNeu.standort} />
          <CopyRow label="Befestigung" value={zaehlerNeu.befestigung} />
          <YesNoBadge value={zaehlerNeu.wandlermessung} label="Wandlermessung" />
        </div>
      )}

      {/* Netzanschluss */}
      {(netzanschluss.fernauslesung !== undefined || netzanschluss.smartMeterGateway !== undefined || netzanschluss.imsysGewuenscht !== undefined) && (
        <div className="v3-card" style={{ padding: 14 }}>
          <SectionTitle>Netzanschluss</SectionTitle>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <YesNoBadge value={netzanschluss.fernauslesung} label="Fernauslesung" />
            <YesNoBadge value={netzanschluss.smartMeterGateway} label="Smart Meter GW" />
            <YesNoBadge value={netzanschluss.imsysGewuenscht} label="iMSys gewünscht" />
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: ABRECHNUNG (Phase 6: Extended)
// ═══════════════════════════════════════════════════════════════════════════════

function TabBilling({ d }: { d: any }) {
  const rechnungen = d.rechnungen || [];
  const [copiedLink, setCopiedLink] = useState<number | null>(null);

  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    BEZAHLT: { color: C.green, bg: C.greenDim },
    OFFEN: { color: C.amber, bg: C.amberDim },
    VERSENDET: { color: C.cyan, bg: C.cyanDim },
    UEBERFAELLIG: { color: C.red, bg: C.redDim },
    MAHNUNG: { color: C.red, bg: C.redDim },
    STORNIERT: { color: C.dim, bg: "rgba(100,116,139,0.1)" },
  };

  // Phase 6: Calculate totals
  const offenSum = rechnungen.filter((r: any) => r.status !== "BEZAHLT" && r.status !== "STORNIERT")
    .reduce((sum: number, r: any) => sum + (parseFloat(r.betragBrutto) || 0), 0);
  const bezahltSum = rechnungen.filter((r: any) => r.status === "BEZAHLT")
    .reduce((sum: number, r: any) => sum + (parseFloat(r.betragBrutto) || 0), 0);

  return (
    <div className="v3-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <HelpHint text="Rechnungen werden automatisch bei Status-Wechsel erstellt und per Email versendet. Der Payment-Link kann an den Kunden weitergeleitet werden. Bei überfälligen Rechnungen kann eine Mahnung ausgelöst werden." />
      <SectionTitle action={<button className="v3-btn v3-btn-primary">+ Rechnung erstellen</button>}>Abrechnung</SectionTitle>

      {/* Phase 6: Summary Bar */}
      {rechnungen.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="v3-stat">
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Offen</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: offenSum > 0 ? C.amber : C.dim }}>{n2(offenSum)} €</span>
          </div>
          <div className="v3-stat">
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Bezahlt</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: bezahltSum > 0 ? C.green : C.dim }}>{n2(bezahltSum)} €</span>
          </div>
        </div>
      )}

      {rechnungen.map((r: any) => {
        const sc = STATUS_COLORS[r.status] || STATUS_COLORS.OFFEN;
        const dueDateColor = getDueDateColor(r.faelligAm);
        const isOverdue = dueDateColor === C.red;

        return (
          <div key={r.id} className="v3-card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🧾</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.bright, fontFamily: "'JetBrains Mono',monospace" }}>{r.nummer}</span>
              </div>
              <Badge color={sc.color} bg={sc.bg}>{r.status}</Badge>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div><div style={{ fontSize: 10, color: C.dim }}>Betrag</div><div style={{ fontSize: 14, fontWeight: 700, color: C.bright }}>{r.betragBrutto} €</div></div>
              <div><div style={{ fontSize: 10, color: C.dim }}>Datum</div><div style={{ fontSize: 12, color: C.text }}>{r.datum}</div></div>
              <div>
                <div style={{ fontSize: 10, color: C.dim }}>Fällig am</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {/* Phase 6: Due date indicator dot */}
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: dueDateColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: dueDateColor }}>{r.faelligAm ? new Date(r.faelligAm).toLocaleDateString("de-DE") : r.faelligAm}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button className="v3-btn" style={{ fontSize: 11 }}>📄 PDF</button>
              <button className="v3-btn" style={{ fontSize: 11 }} onClick={() => { navigator.clipboard.writeText(`https://pay.baunity.de/${r.nummer}`); setCopiedLink(r.id); setTimeout(() => setCopiedLink(null), 1500); }}>
                {copiedLink === r.id ? "✓ Kopiert" : "🔗 Link kopieren"}
              </button>
              {isOverdue && r.status !== "BEZAHLT" && (
                <button className="v3-btn v3-btn-danger" style={{ fontSize: 11 }}>⚠ Mahnung</button>
              )}
            </div>
          </div>
        );
      })}

      {rechnungen.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.dim }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 13 }}>Noch keine Rechnungen</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: TERMINE
// ═══════════════════════════════════════════════════════════════════════════════

function TabSchedule({ d, emails }: { d: any; emails?: any[] }) {
  const [termine, setTermine] = useState<any[]>(d.termine || []);
  const [showNew, setShowNew] = useState(false);
  const [newTyp, setNewTyp] = useState("Zählerwechsel");
  const [newDatum, setNewDatum] = useState("");
  const [newUhrzeit, setNewUhrzeit] = useState("10:00");
  const [newNotiz, setNewNotiz] = useState("");
  const [notifySent, setNotifySent] = useState<Record<number, boolean>>({});

  const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
    geplant: { color: C.green, bg: C.greenDim, label: "Geplant" },
    bestaetigt: { color: C.green, bg: C.greenDim, label: "Bestätigt" },
    offen: { color: C.amber, bg: C.amberDim, label: "Offen" },
    abgesagt: { color: C.red, bg: C.redDim, label: "Abgesagt" },
    erledigt: { color: C.dim, bg: "rgba(100,116,139,0.1)", label: "Erledigt" },
    verschoben: { color: C.purple, bg: C.purpleDim, label: "Verschoben" },
  };

  // Emails die Termin-Hinweise enthalten (ZW-Erkennung aus NB-Mails)
  const terminEmails = (emails || []).filter((em: any) =>
    em.dir === "in" && (
      (em.subj || em.subject || "").toLowerCase().match(/zähler|zaehlerwechsel|inbetrieb|termin|monteur/) ||
      (em.body || em.preview || "").toLowerCase().match(/zähler.*wechsel|zählerwechsel|inbetriebsetzung.*termin|monteur.*kommt/)
    )
  );

  const handleAddTermin = () => {
    if (!newDatum) return;
    const id = Date.now();
    setTermine(prev => [...prev, { id, typ: newTyp, datum: newDatum, uhrzeit: newUhrzeit, status: "geplant", notiz: newNotiz }]);
    setShowNew(false); setNewDatum(""); setNewUhrzeit("10:00"); setNewNotiz("");
  };

  const handleNotify = (terminId: number) => {
    setNotifySent(p => ({ ...p, [terminId]: true }));
  };

  const TYPEN = ["Zählerwechsel", "Montage", "IBN", "NB-Termin", "Abnahme", "Sonstiges"];

  return (
    <div className="v3-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <HelpHint text="Zählerwechsel-Termine werden aus NB-Emails automatisch erkannt oder manuell angelegt. Nach Anlage kann der Endkunde per Email + ICS-Kalendereinladung benachrichtigt werden. Er kann den Termin bestätigen oder verschieben." />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.bright }}>Termine & Zählerwechsel</h3>
          <Badge color={C.accent} bg={C.accentDim}>{termine.length}</Badge>
        </div>
        <button className="v3-btn v3-btn-primary" onClick={() => setShowNew(true)} style={{ fontSize: 11 }}>+ Termin anlegen</button>
      </div>

      {/* Aus Emails erkannte Termin-Hinweise */}
      {terminEmails.length > 0 && (
        <div className="v3-card" style={{ padding: 14, borderLeft: `3px solid ${C.cyan}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 14 }}>🔍</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.cyan }}>Termin-Hinweise aus Emails</div>
              <div style={{ fontSize: 10, color: C.dim }}>{terminEmails.length} Email(s) mit möglichen Termin-Informationen</div>
            </div>
          </div>
          {terminEmails.slice(0, 3).map((em: any) => (
            <div key={em.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12 }}>📩</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{em.subj || em.subject}</div>
                <div style={{ fontSize: 10, color: C.dim }}>{em.from || em.fromAddress} · {em.date}</div>
              </div>
              <button className="v3-btn" style={{ fontSize: 10, padding: "3px 10px", color: C.cyan, borderColor: `${C.cyan}30` }}
                onClick={() => { setShowNew(true); setNewTyp("Zählerwechsel"); setNewNotiz(`Aus Email: ${(em.subj || em.subject || "").slice(0, 50)}`); }}>
                → Termin anlegen
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Neuen Termin anlegen */}
      {showNew && (
        <div className="v3-card v3-float" style={{ padding: 16, borderLeft: `3px solid ${C.accent}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>Neuer Termin</span>
            <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 9, color: C.dim, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Typ</label>
              <select className="v3-input" value={newTyp} onChange={e => setNewTyp(e.target.value)} style={{ cursor: "pointer" }}>
                {TYPEN.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 9, color: C.dim, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Datum</label>
              <input className="v3-input" type="date" value={newDatum} onChange={e => setNewDatum(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 9, color: C.dim, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Uhrzeit</label>
              <input className="v3-input" type="time" value={newUhrzeit} onChange={e => setNewUhrzeit(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 9, color: C.dim, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Notiz</label>
              <input className="v3-input" value={newNotiz} onChange={e => setNewNotiz(e.target.value)} placeholder="z.B. Zugang über Nachbar, Gerüst steht..." />
            </div>
          </div>
          <button className="v3-btn v3-btn-primary" onClick={handleAddTermin} style={{ width: "100%", fontSize: 12 }} disabled={!newDatum}>
            ✓ Termin speichern
          </button>
        </div>
      )}

      {/* Termin-Liste */}
      {termine.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {termine.map((t: any) => {
            const sc = STATUS_COLORS[t.status] || STATUS_COLORS.offen;
            const dt = new Date(t.datum);
            const isZw = t.typ === "Zählerwechsel";
            const isFuture = dt.getTime() > Date.now();
            const sent = notifySent[t.id];

            return (
              <div key={t.id} className="v3-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", gap: 14, padding: 14, alignItems: "flex-start" }}>
                  {/* Datum-Block */}
                  <div style={{
                    width: 54, height: 58, borderRadius: 10, flexShrink: 0,
                    background: isZw ? C.purpleDim : C.accentDim,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: isZw ? C.purple : C.accent, lineHeight: 1 }}>{dt.getDate()}</span>
                    <span style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>{dt.toLocaleDateString("de-DE", { month: "short" })}</span>
                    <span style={{ fontSize: 8, color: C.dim }}>{dt.getFullYear()}</span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.bright }}>{t.typ}</span>
                      <Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge>
                      {isZw && <Badge color={C.purple} bg={C.purpleDim}>ZW</Badge>}
                    </div>
                    <div style={{ fontSize: 12, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>🕐 {t.uhrzeit} Uhr</span>
                      <span style={{ color: C.dim }}>·</span>
                      <span>{dt.toLocaleDateString("de-DE", { weekday: "long" })}</span>
                    </div>
                    {t.notiz && <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>💬 {t.notiz}</div>}
                  </div>
                </div>

                {/* Aktionen — nur für geplante zukünftige Termine */}
                {isFuture && t.status === "geplant" && (
                  <div style={{ padding: "8px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 6, background: "rgba(0,0,0,0.1)" }}>
                    {!sent ? (
                      <button className="v3-btn v3-btn-primary" style={{ fontSize: 10 }} onClick={() => handleNotify(t.id)}>
                        📧 Kunde benachrichtigen (Email + ICS)
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: C.green, fontWeight: 600, padding: "4px 0" }}>✓ Benachrichtigung gesendet (Email + ICS)</span>
                    )}
                    <button className="v3-btn" style={{ fontSize: 10 }} onClick={() => setTermine(prev => prev.map(x => x.id === t.id ? { ...x, status: "verschoben" } : x))}>
                      ↩ Verschieben
                    </button>
                    <button className="v3-btn" style={{ fontSize: 10, color: C.red, borderColor: `${C.red}20` }} onClick={() => setTermine(prev => prev.map(x => x.id === t.id ? { ...x, status: "abgesagt" } : x))}>
                      ✕ Absagen
                    </button>
                  </div>
                )}

                {/* Erledigt-Button für vergangene */}
                {!isFuture && t.status === "geplant" && (
                  <div style={{ padding: "8px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 6, background: "rgba(0,0,0,0.1)" }}>
                    <button className="v3-btn" style={{ fontSize: 10, color: C.green, borderColor: `${C.green}25` }} onClick={() => setTermine(prev => prev.map(x => x.id === t.id ? { ...x, status: "erledigt" } : x))}>
                      ✓ Als erledigt markieren
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : !showNew && terminEmails.length === 0 ? (
        <div style={{ textAlign: "center", padding: 50, color: C.dim }}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.5 }}>📅</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.muted, marginBottom: 4 }}>Keine Termine geplant</div>
          <div style={{ fontSize: 12, color: C.dim, marginBottom: 12 }}>Lege einen Zählerwechsel- oder IBN-Termin an.</div>
          <button className="v3-btn v3-btn-primary" onClick={() => setShowNew(true)}>+ Ersten Termin anlegen</button>
        </div>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: ZUGANGSDATEN
// ═══════════════════════════════════════════════════════════════════════════════

function TabCredentials({ d }: { d: any }) {
  const creds = d.credentials || [];
  const [visible, setVisible] = useState<Record<number, boolean>>({});
  const [showWestnetz, setShowWestnetz] = useState(false);
  const [westnetzPw, setWestnetzPw] = useState("");
  const [westnetzSending, setWestnetzSending] = useState(false);
  const [westnetzSent, setWestnetzSent] = useState(false);

  const instEmail = d.dedicatedEmail || d.publicId ? `inst-${(d.publicId || "").toLowerCase().replace("inst-", "")}@baunity.de` : "";

  const generatePassword = useCallback(() => {
    const nachname = (d.betreiber?.nachname || "Solar").replace(/[^a-zA-ZäöüÄÖÜß]/g, "");
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const num = Math.floor(1000 + Math.random() * 9000);
    const specials = ["!", "#", "$", "&", "?"];
    const special = specials[Math.floor(Math.random() * specials.length)];
    return `${capitalize(nachname)}${num}${special}`;
  }, [d.betreiber?.nachname]);
  const nbName = d.nb?.name || "";
  const isWestnetz = nbName.toLowerCase().includes("westnetz");

  const handleWestnetzSend = () => {
    setWestnetzSending(true);
    setTimeout(() => {
      setWestnetzSending(false);
      setWestnetzSent(true);
      setShowWestnetz(false);
      setWestnetzPw("");
    }, 1500);
  };

  return (
    <div className="v3-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <HelpHint text="Portal-Zugangsdaten für NB-Portale. Bei Westnetz wird der Endkunde automatisch registriert — das generierte Passwort wird per Email zugesendet. Passwörter sind standardmäßig verborgen." />
      <SectionTitle action={<button className="v3-btn v3-btn-primary">+ Zugangsdaten</button>}>Portal-Zugangsdaten</SectionTitle>

      {isWestnetz && !westnetzSent && (
        <div className="v3-card" style={{ padding: 16, borderLeft: `3px solid ${C.accent}`, background: "rgba(99,139,255,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showWestnetz ? 12 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🌐</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>Westnetz Portal-Registrierung</div>
                <div style={{ fontSize: 11, color: C.dim }}>Endkunde registrieren & Zugangsdaten senden</div>
              </div>
            </div>
            {!showWestnetz && (
              <button className="v3-btn v3-btn-primary" onClick={() => { setShowWestnetz(true); setWestnetzPw(generatePassword()); }}>Registrieren & senden</button>
            )}
          </div>

          {showWestnetz && (
            <div className="v3-fade">
              <div style={{ padding: "10px 12px", background: "rgba(99,139,255,0.06)", borderRadius: 8, marginBottom: 12, fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                <strong>1.</strong> Kopiere die Daten unten und registriere den Endkunden im <a href="https://service.westnetz.de" target="_blank" rel="noopener" style={{ color: C.accent, fontWeight: 600 }}>Westnetz Serviceportal</a>.<br/>
                <strong>2.</strong> Klick auf "Zugangsdaten senden" — der Endkunde bekommt eine Email mit Anleitung + Passwort.
              </div>

              <div style={{ background: "#0f172a", border: `2px solid ${C.accent}`, borderRadius: 10, padding: "14px 18px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Benutzer</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.accent, fontFamily: "'JetBrains Mono',monospace" }}>{instEmail}</div>
                  </div>
                  <button className="v3-btn" style={{ fontSize: 10, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(instEmail)}>📋 Kopieren</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Passwort</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.bright, fontFamily: "'JetBrains Mono',monospace" }}>{westnetzPw || "—"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="v3-btn" style={{ fontSize: 10, padding: "3px 10px" }} onClick={() => { const pw = generatePassword(); setWestnetzPw(pw); }}>🔄 Neu generieren</button>
                    {westnetzPw && <button className="v3-btn" style={{ fontSize: 10, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(westnetzPw)}>📋 Kopieren</button>}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: C.dim, marginBottom: 12, padding: "0 4px" }}>
                Email geht an: <strong style={{ color: C.text }}>{d.betreiber?.email || d.contactEmail || "Endkunde"}</strong>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="v3-btn" onClick={() => { setShowWestnetz(false); setWestnetzPw(""); }}>Abbrechen</button>
                <button className="v3-btn v3-btn-primary" disabled={!westnetzPw.trim() || westnetzSending} onClick={handleWestnetzSend}>
                  {westnetzSending ? "⏳ Wird gesendet..." : "📧 Zugangsdaten an Endkunde senden"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {westnetzSent && (
        <div className="v3-card v3-fade" style={{ padding: 14, borderLeft: `3px solid ${C.green}`, background: "rgba(34,197,94,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.green }}>Zugangsdaten versendet</div>
              <div style={{ fontSize: 11, color: C.dim }}>Email mit Westnetz-Zugangsdaten an {d.betreiber?.email || "Endkunde"} gesendet</div>
            </div>
          </div>
        </div>
      )}

      {creds.map((c: any) => (
        <div key={c.id} className="v3-card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 14 }}>🔑</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>{c.portal}</span>
          </div>
          <CopyRow label="URL" value={c.url} mono />
          <CopyRow label="Benutzer" value={c.benutzer} mono important />
          <div className="v3-copy" onClick={() => { navigator.clipboard.writeText(c.passwort); }}>
            <span style={{ fontSize: 11, color: C.dim, minWidth: 80 }}>Passwort</span>
            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: C.accent, flex: 1 }}>
              {visible[c.id] ? c.passwort : "•".repeat(12)}
            </span>
            <button className="v3-btn" style={{ fontSize: 10, padding: "2px 8px" }} onClick={(e) => { e.stopPropagation(); setVisible(v => ({ ...v, [c.id]: !v[c.id] })); }}>
              {visible[c.id] ? "🙈" : "👁"}
            </button>
          </div>
          {c.notiz && <div style={{ fontSize: 11, color: C.dim, marginTop: 6, padding: "0 10px" }}>{c.notiz}</div>}
        </div>
      ))}

      {creds.length === 0 && !isWestnetz && (
        <div style={{ textAlign: "center", padding: 40, color: C.dim }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔐</div>
          <div style={{ fontSize: 13 }}>Keine Zugangsdaten hinterlegt</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: MaStR (Marktstammdatenregister)
// ═══════════════════════════════════════════════════════════════════════════════

function TabMastr({ d }: { d: any }) {
  const m = d.mastr || {};
  const b = d.betreiber || {};
  const a = d.anlage || {};
  const [solarNr, setSolarNr] = useState(m.nrSolar || "");
  const [speicherNr, setSpeicherNr] = useState(m.nrSpeicher || "");
  const [status, setStatus] = useState(m.status || "Nicht registriert");
  const [uploads, setUploads] = useState<string[]>([]);
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending] = useState(false);

  const betreiberName = `${b.vorname || ""} ${b.nachname || ""}`.trim() || b.firma || "—";
  const kwp = a.kwp || "0";

  const handleFileDrop = useCallback((files: File[]) => {
    setUploads(prev => [...prev, ...files.map(f => f.name)]);
  }, []);

  const handleSendConfirmation = () => {
    setSending(true);
    // Mock: Nach 1.5s "gesendet"
    setTimeout(() => {
      setSending(false);
      setEmailSent(true);
      setStatus("Registriert");
    }, 1500);
  };

  return (
    <div className="v3-fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <HelpHint text="Marktstammdatenregister (MaStR) — Die Registrierung ist seit 2019 Pflicht für alle Stromerzeugungsanlagen. Nach der Anmeldung erhältst du MaStR-Nummern für Solar und ggf. Speicher. Lade die Bestätigungen hier hoch und sende sie an den Kunden." />

      {/* Status-Übersicht */}
      <div className="v3-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🏛️</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.bright }}>Marktstammdatenregister</div>
              <div style={{ fontSize: 11, color: C.dim }}>Bundesnetzagentur — Pflichtregistrierung</div>
            </div>
          </div>
          <Badge color={status === "Registriert" ? C.green : status === "In Bearbeitung" ? C.amber : C.red} bg={status === "Registriert" ? C.greenDim : status === "In Bearbeitung" ? C.amberDim : C.redDim}>
            {status}
          </Badge>
        </div>

        {/* Checkliste */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { label: "Anlage im MaStR registriert", done: status === "Registriert" },
            { label: "MaStR-Nummern eingetragen", done: !!solarNr },
            { label: "Bestätigungen hochgeladen", done: uploads.length > 0 },
            { label: "Bestätigungen an Kunde gesendet", done: emailSent },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700,
                background: item.done ? C.greenDim : "rgba(255,255,255,0.04)",
                color: item.done ? C.green : C.dim,
                border: `1.5px solid ${item.done ? C.green : "rgba(255,255,255,0.1)"}`,
              }}>
                {item.done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 12, color: item.done ? C.text : C.dim }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Betreiber-Daten für MaStR (Geburtsdatum prominent) */}
      <div className="v3-card" style={{ padding: 14 }}>
        <SectionTitle>Betreiberdaten für MaStR</SectionTitle>
        <CopyRow label="Name" value={betreiberName} important />
        <CopyRow label="Geburtsdatum" value={b.geburtsdatum} important mono />
        <CopyRow label="Adresse" value={`${b.strasse || ""} ${b.hausnr || ""}, ${b.plz || ""} ${b.ort || ""}`} />
        <CopyRow label="Email" value={b.email} />
        <CopyRow label="Leistung" value={`${kwp} kWp`} />
        {a.totalBatteryKwh && Number(a.totalBatteryKwh) > 0 && <CopyRow label="Speicher" value={`${a.totalBatteryKwh} kWh`} />}
      </div>

      {/* MaStR-Nummern eingeben / automatisch abrufen */}
      <div className="v3-card" style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SectionTitle>MaStR-Nummern</SectionTitle>
          <button className="v3-btn" style={{ fontSize: 10, color: C.cyan, borderColor: `${C.cyan}33` }} onClick={() => {
            // API-Call: POST /api/mastr/installations/:publicId/match
            const publicId = d.publicId;
            if (!publicId) return;
            setStatus("Wird abgeglichen...");
            const token = localStorage.getItem("baunity_token") || "";
            fetch(`/api/mastr/installations/${publicId}/match`, {
              method: "POST", headers: { Authorization: `Bearer ${token}` },
            }).then(r => r.json()).then(res => {
              if (res.solar?.mastrNr) setSolarNr(res.solar.mastrNr);
              if (res.speicher?.mastrNr) setSpeicherNr(res.speicher.mastrNr);
              setStatus(res.solar?.mastrNr ? "Registriert" : "Nicht gefunden");
            }).catch(() => setStatus("Fehler beim Abgleich"));
          }}>
            🔄 Auto-Abgleich via API
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Solar (SEE...)</label>
            <input className="v3-input" value={solarNr} onChange={e => setSolarNr(e.target.value)} placeholder="SEE123456789012" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Speicher (SSE...)</label>
            <input className="v3-input" value={speicherNr} onChange={e => setSpeicherNr(e.target.value)} placeholder="SSE123456789012" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
          </div>
        </div>
        {(solarNr || speicherNr) && (
          <button className="v3-btn v3-btn-primary" style={{ marginTop: 10, fontSize: 11, width: "100%" }} onClick={() => setStatus("Registriert")}>
            ✓ MaStR-Nummern speichern
          </button>
        )}
      </div>

      {/* Bestätigungen hochladen */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.bright, marginBottom: 8 }}>Bestätigungen hochladen</div>
        <DropZone label="MaStR-Bestätigungen hier ablegen" hint="PDF-Bestätigungen von marktstammdatenregister.de" onDrop={handleFileDrop} />
      </div>

      {/* Hochgeladene Bestätigungen */}
      {uploads.length > 0 && (
        <div className="v3-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.bright, marginBottom: 8 }}>Hochgeladene Bestätigungen ({uploads.length})</div>
          {uploads.map((name, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <span style={{ fontSize: 12, color: C.green }}>✓</span>
              <span style={{ fontSize: 12, color: C.text }}>{name}</span>
            </div>
          ))}

          {/* Email an Kunde senden */}
          {!emailSent ? (
            <button className="v3-btn v3-btn-primary" style={{ marginTop: 10, fontSize: 11, width: "100%" }} onClick={handleSendConfirmation} disabled={sending}>
              {sending ? "⏳ Wird gesendet..." : "📧 Bestätigungen per Email an Kunden senden"}
            </button>
          ) : (
            <div style={{ marginTop: 10, padding: "8px 12px", background: C.greenDim, borderRadius: 8, border: `1px solid rgba(34,197,94,0.2)`, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: C.green }}>✓</span>
              <span style={{ fontSize: 12, color: C.green }}>Bestätigungen an {b.email || "Kunde"} gesendet</span>
            </div>
          )}
        </div>
      )}

      {/* Link zum MaStR Portal */}
      <div className="v3-copy" onClick={() => window.open("https://www.marktstammdatenregister.de", "_blank")} style={{ padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <span style={{ fontSize: 13 }}>🔗</span>
        <span style={{ fontSize: 12, color: C.accent, flex: 1 }}>marktstammdatenregister.de öffnen</span>
        <span style={{ fontSize: 11, color: C.dim }}>↗</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: VERLAUF (Phase 8: Comment Input)
// ═══════════════════════════════════════════════════════════════════════════════

function TabTimeline({ timeline: initialTimeline, comments }: { timeline: any[]; comments: any[] }) {
  const [timelineItems, setTimelineItems] = useState(initialTimeline);
  const [newComment, setNewComment] = useState("");
  const [filter, setFilter] = useState("all");

  const ICON_MAP: Record<string, string> = { email_in: "📩", email_out: "📤", status: "🔄", doc: "📎", comment: "💬", invoice: "💰" };
  const COLOR_MAP: Record<string, string> = { email_in: C.cyan, email_out: C.green, status: C.amber, doc: C.purple, comment: C.accent, invoice: C.amber };

  const filtered = filter === "all" ? timelineItems : timelineItems.filter(e => e.type === filter || (filter === "email" && (e.type === "email_in" || e.type === "email_out")));

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const live = getLive();
    const instId = live?.installationId;

    // Lokal sofort anzeigen
    const newEntry = {
      id: `comment-${Date.now()}`,
      type: "comment",
      text: newComment.trim(),
      date: new Date().toLocaleString("de-DE"),
      author: "Du",
    };
    setTimelineItems(prev => [newEntry, ...prev]);
    const comment = newComment.trim();
    setNewComment("");

    // API-Call: Kommentar speichern (wird automatisch mit Factro synchronisiert)
    if (instId) {
      try {
        const token = localStorage.getItem("baunity_token") || "";
        await fetch(`/api/installations/${instId}/comments`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ message: comment, isInternal: false }),
        });
      } catch (err) {
        console.error("Kommentar speichern fehlgeschlagen:", err);
      }
    }
  };

  return (
    <div className="v3-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <HelpHint text="Chronologischer Verlauf aller Aktivitäten: Emails, Status-Änderungen, Dokument-Uploads, Kommentare. Eigene Kommentare werden automatisch mit Factro synchronisiert." />
      <SectionTitle>Verlauf</SectionTitle>

      {/* Phase 8: Comment Textarea + Button */}
      <div className="v3-card" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <textarea className="v3-input" rows={3} placeholder="Kommentar hinzufügen..." value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
          style={{ resize: "vertical", lineHeight: 1.5 }} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="v3-btn v3-btn-primary" disabled={!newComment.trim()} onClick={handleAddComment}>
            Kommentar hinzufügen
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {[
          { key: "all", label: "Alle" },
          { key: "email", label: "📨 Emails" },
          { key: "status", label: "🔄 Status" },
          { key: "doc", label: "📎 Dokumente" },
          { key: "comment", label: "💬 Kommentare" },
          { key: "invoice", label: "💰 Rechnungen" },
        ].map(f => (
          <button key={f.key} className="v3-btn" onClick={() => setFilter(f.key)}
            style={{ fontSize: 11, padding: "4px 10px", ...(filter === f.key ? { background: C.accentDim, borderColor: "rgba(99,139,255,0.3)", color: C.accent } : {}) }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.map((ev, i) => (
          <div key={ev.id || i} style={{ display: "flex", gap: 12, padding: "8px 4px", position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 30 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLOR_MAP[ev.type] || C.dim, flexShrink: 0, marginTop: 4 }} />
              {i < filtered.length - 1 && <div style={{ width: 1, flex: 1, background: C.border, marginTop: 4 }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 12 }}>{ICON_MAP[ev.type] || "📌"}</span>
                <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{ev.text}</span>
              </div>
              <div style={{ fontSize: 10, color: C.dim }}>{ev.date} · {ev.author}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KUNDEN-TABS (vereinfachte Ansicht)
// ═══════════════════════════════════════════════════════════════════════════════

function KundeOverview({ d, timeline }: { d: any; timeline: any[] }) {
  const currentStep = getStepIndex(d.status || d.statusLabel || "beim_nb");
  const statusTexts: Record<string, { title: string; desc: string; color: string }> = {
    eingang: { title: "Eingegangen", desc: "Ihr Antrag ist bei uns eingegangen und wird vorbereitet.", color: C.muted },
    beim_nb: { title: "Beim Netzbetreiber", desc: "Ihr Antrag wurde beim Netzbetreiber eingereicht und wird bearbeitet.", color: C.cyan },
    rueckfrage: { title: "Rückfrage vom NB", desc: "Der Netzbetreiber hat eine Rückfrage. Wir kümmern uns darum.", color: C.amber },
    genehmigt: { title: "Genehmigt!", desc: "Ihr Netzanschluss wurde vom Netzbetreiber genehmigt.", color: C.green },
    ibn: { title: "Inbetriebnahme", desc: "Die Anlage wird in Betrieb genommen.", color: C.purple },
    fertig: { title: "Abgeschlossen", desc: "Alles erledigt! Ihre Anlage ist am Netz.", color: C.green },
  };
  const statusKey = PIPELINE[currentStep]?.key || "eingang";
  const st = statusTexts[statusKey] || statusTexts.eingang;

  return (
    <div className="v3-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="v3-card" style={{ padding: 24, textAlign: "center", borderTop: `3px solid ${st.color}` }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>
          {statusKey === "fertig" ? "🎉" : statusKey === "genehmigt" ? "✅" : statusKey === "rueckfrage" ? "⏳" : statusKey === "ibn" ? "⚡" : "📋"}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: st.color, marginBottom: 4 }}>{st.title}</div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>{st.desc}</div>
      </div>

      <div className="v3-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fortschritt</div>
        <PipelineBar currentStep={currentStep} isStaff={false} onStepClick={() => {}} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="v3-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8 }}>Ihre Anlage</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{d.anlage?.kwp || "?"}</div><div style={{ fontSize: 10, color: C.dim }}>kWp PV</div></div>
            {Number(d.anlage?.totalBatteryKwh) > 0 && <div><div style={{ fontSize: 20, fontWeight: 700, color: C.purple }}>{d.anlage?.totalBatteryKwh}</div><div style={{ fontSize: 10, color: C.dim }}>kWh Speicher</div></div>}
          </div>
          <CopyRow label="Standort" value={`${d.standort?.strasse || ""} ${d.standort?.hausnr || ""}, ${d.standort?.plz || ""} ${d.standort?.ort || ""}`} />
          <CopyRow label="Netzbetreiber" value={d.nb?.name} />
          {d.nb?.az && <CopyRow label="Aktenzeichen" value={d.nb.az} mono />}
        </div>

        <div className="v3-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8 }}>Ihr Ansprechpartner</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>👤</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.bright }}>{d.assignedTo || d.createdByCompany || "LeCa GmbH"}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{d.createdByCompany || ""}</div>
            </div>
          </div>
          <CopyRow label="Projekt-Nr." value={d.publicId} mono />
          <CopyRow label="Erstellt am" value={d.createdAt} />
        </div>
      </div>

      <div className="v3-card" style={{ padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 10 }}>Letzte Updates</div>
        {timeline.slice(0, 4).map((ev, i) => (
          <div key={ev.id || i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 12, width: 20, textAlign: "center" }}>
              {ev.type === "email_in" ? "📩" : ev.type === "status" ? "🔄" : ev.type === "doc" ? "📎" : "💬"}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: C.text }}>{ev.text}</div>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>{ev.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KundeDocs({ docs }: { docs: any[] }) {
  const uploaded = docs.filter(d => d.status === "uploaded");
  const missing = docs.filter(d => d.status === "missing");

  return (
    <div className="v3-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionTitle action={<button className="v3-btn v3-btn-primary">📤 Dokument hochladen</button>}>Ihre Dokumente</SectionTitle>

      {missing.length > 0 && (
        <div className="v3-card" style={{ padding: 14, borderLeft: `3px solid ${C.amber}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.amber, marginBottom: 8 }}>Noch benötigte Unterlagen</div>
          {missing.map(d => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.text }}>{d.name}</span>
              <button className="v3-btn v3-btn-primary" style={{ fontSize: 11 }}>Hochladen</button>
            </div>
          ))}
        </div>
      )}

      {uploaded.length > 0 && (
        <div className="v3-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.green, marginBottom: 8 }}>Vorhandene Dokumente</div>
          {uploaded.map(d => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 14 }}>📄</span>
              <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{d.name}</span>
              <span style={{ fontSize: 10, color: C.dim }}>{d.date}</span>
              <button className="v3-btn" style={{ fontSize: 10, padding: "3px 10px" }}>⬇</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KundeRechnungen({ d }: { d: any }) {
  const rechnungen = d.rechnungen || [];
  return (
    <div className="v3-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionTitle>Ihre Rechnungen</SectionTitle>

      {rechnungen.map((r: any) => {
        const isPaid = r.status === "BEZAHLT";
        return (
          <div key={r.id} className="v3-card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.bright }}>{r.nummer}</div>
                <div style={{ fontSize: 11, color: C.dim }}>{r.datum}</div>
              </div>
              <Badge color={isPaid ? C.green : C.amber} bg={isPaid ? C.greenDim : C.amberDim}>
                {isPaid ? "Bezahlt" : r.status === "UEBERFAELLIG" ? "Überfällig" : "Offen"}
              </Badge>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.bright, marginBottom: 10 }}>{r.betragBrutto} €</div>
            {!isPaid && (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="v3-btn v3-btn-primary" style={{ flex: 1 }}>💳 Jetzt bezahlen</button>
                <button className="v3-btn">📄 PDF</button>
              </div>
            )}
            {isPaid && <button className="v3-btn" style={{ width: "100%" }}>📄 PDF herunterladen</button>}
          </div>
        );
      })}

      {rechnungen.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.dim }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 13 }}>Keine offenen Rechnungen</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE HEADER (Phase 7: Clickable steps for staff)
// ═══════════════════════════════════════════════════════════════════════════════

function PipelineBar({ currentStep, isStaff, onStepClick }: { currentStep: number; isStaff: boolean; onStepClick: (stepIndex: number) => void }) {
  return (
    <div className="v3-pipeline" style={{ display: "flex", alignItems: "flex-start", gap: 0, width: "100%" }}>
      {PIPELINE.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        const isRueckfrage = step.key === "rueckfrage" && active;

        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div
              onClick={() => isStaff && onStepClick(i)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "0 0 auto", minWidth: 56,
                cursor: isStaff ? "pointer" : "default",
                borderRadius: 8,
                padding: "4px 6px",
                transition: "background .12s",
              }}
              onMouseEnter={e => { if (isStaff) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{
                width: active ? 40 : 32, height: active ? 40 : 32,
                borderRadius: 12,
                background: done
                  ? `linear-gradient(135deg, ${C.green}, #16a34a)`
                  : active
                  ? isRueckfrage
                    ? `linear-gradient(135deg, ${C.red}, #dc2626)`
                    : `linear-gradient(135deg, ${C.accent}, #4f6ef7)`
                  : "rgba(255,255,255,0.04)",
                border: done || active ? "none" : `1.5px solid rgba(255,255,255,0.08)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: active ? 16 : 13,
                color: done || active ? "#fff" : C.dim,
                fontWeight: 700,
                transition: "all .25s ease",
                boxShadow: active
                  ? isRueckfrage
                    ? "0 0 0 4px rgba(239,68,68,0.15), 0 4px 16px rgba(239,68,68,0.25)"
                    : "0 0 0 4px rgba(99,139,255,0.15), 0 4px 16px rgba(99,139,255,0.25)"
                  : done
                  ? "0 2px 8px rgba(34,197,94,0.2)"
                  : "none",
              }}>
                {done ? "✓" : i + 1}
              </div>

              <span style={{
                fontSize: 11, fontWeight: active ? 700 : done ? 500 : 400,
                color: active ? (isRueckfrage ? C.red : C.accent) : done ? C.green : C.dim,
                whiteSpace: "nowrap", letterSpacing: "-0.01em",
                textAlign: "center",
              }}>{step.label}</span>
            </div>

            {i < PIPELINE.length - 1 && (
              <div style={{ flex: 1, height: 3, margin: "0 4px", marginBottom: 22, borderRadius: 2, position: "relative", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 2,
                  width: done ? "100%" : active ? "50%" : "0%",
                  background: done ? `linear-gradient(90deg, ${C.green}, ${i + 1 < currentStep ? C.green : C.accent})` : `linear-gradient(90deg, ${C.accent}, transparent)`,
                  transition: "width .4s ease",
                }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function QuickActions({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const actions = [
    { icon: "🧾", label: "Rechnung erstellen", tab: "billing" },
    { icon: "🔧", label: "VDE generieren", tab: "docs" },
    { icon: "✉️", label: "Email an NB", tab: "comms" },
    { icon: "📅", label: "Termin anlegen", tab: "schedule" },
    { icon: "🎫", label: "Ticket erstellen", tab: "overview" },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="v3-btn v3-btn-primary" onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span>⚡</span> Aktionen
      </button>
      {open && (
        <div className="v3-fade" style={{ position: "absolute", right: 0, top: "100%", marginTop: 6, background: C.card, border: `1px solid ${C.borderActive}`, borderRadius: 10, padding: 4, minWidth: 200, zIndex: 100, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
          {actions.map(a => (
            <button key={a.label} className="v3-qa-btn" onClick={() => { onNavigate(a.tab); setOpen(false); }}>
              <span>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function MockDetailPanelV3({ onBack }: { onBack?: () => void } = {}) {
  // Live-Daten Bridge
  const LIVE = getLive();
  const isStaff = LIVE?.isLive ? LIVE.isStaff : true;
  const d = LIVE?.isLive ? { ...MOCK_DEFAULT, ...LIVE.data } : MOCK_DEFAULT;
  const emails = LIVE?.isLive ? (LIVE.emails || []) : MOCK_EMAILS;
  const timeline = LIVE?.isLive ? (LIVE.activities || []) : MOCK_TIMELINE;
  const docs = LIVE?.isLive ? (LIVE.docs || []) : MOCK_DOCS;
  const comments = LIVE?.isLive ? (LIVE.comments || []) : [];
  const liveInstId = LIVE?.isLive ? LIVE.installationId : undefined;

  const hasMastr = d.mastr?.voranmeldung || d.wizard?.mastrVoranmeldung;
  const staffNav = hasMastr ? [...NAV_STAFF.slice(0, 5), { key: "mastr", icon: "🏛️", label: "MaStR" }, ...NAV_STAFF.slice(5)] : NAV_STAFF;
  const NAV_ITEMS = isStaff ? staffNav : NAV_KUNDE;
  const [activeTab, setActiveTab] = useState(NAV_ITEMS[0].key);
  const [showAllData, setShowAllData] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [localStatus, setLocalStatus] = useState(d.status || "beim_nb");

  const currentStep = getStepIndex(localStatus);

  // Phase 7: Dynamic badge counts
  const emailInCount = emails.filter((e: any) => e.dir === "in").length;
  const missingDocCount = docs.filter((x: any) => x.status === "missing").length;
  const offeneRechnungen = (d.rechnungen || []).filter((r: any) => r.status !== "BEZAHLT" && r.status !== "STORNIERT").length;

  const navWithBadges = NAV_ITEMS.map(item => {
    let badge = 0;
    if (item.key === "comms") badge = emailInCount;
    if (item.key === "docs") badge = missingDocCount;
    if (item.key === "billing") badge = offeneRechnungen;
    return { ...item, badge };
  });

  const handleStepClick = (stepIndex: number) => {
    if (!isStaff) return;
    setShowStatusModal(true);
  };

  const handleStatusChange = async (newStatus: string, comment: string) => {
    const live = getLive();
    const instId = live?.installationId;
    if (instId) {
      try {
        const token = localStorage.getItem("baunity_token") || "";
        // Status ändern
        const res = await fetch(`/api/installations/${instId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) { console.error("Status-Wechsel fehlgeschlagen:", await res.text()); }

        // Kommentar speichern wenn vorhanden
        if (comment.trim()) {
          await fetch(`/api/installations/${instId}/comments`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message: comment, isInternal: false }),
          });
        }
      } catch (err) {
        console.error("Status-Wechsel Fehler:", err);
      }
    }
    setLocalStatus(newStatus);
    setShowStatusModal(false);
  };

  // Phase 7: Status color + badges for header
  const statusColor = getStatusColor(localStatus);
  const statusLabel = PIPELINE[currentStep]?.label || localStatus;
  const a = d.anlage || {};
  const speicher = isSpeicherTyp(a.systemTyp || "");
  const kwpNum = Number(a.kwp) || 0;
  const pvPower = formatPower(kwpNum, speicher);

  const renderTab = () => {
    if (!isStaff) {
      switch (activeTab) {
        case "kunde-overview": return <KundeOverview d={d} timeline={timeline} />;
        case "kunde-docs": return <KundeDocs docs={docs} />;
        case "kunde-rechnungen": return <KundeRechnungen d={d} />;
        case "timeline": return <TabTimeline timeline={timeline} comments={comments} />;
        default: return <KundeOverview d={d} timeline={timeline} />;
      }
    }
    switch (activeTab) {
      case "overview": return <TabOverview d={d} emails={emails} timeline={timeline} installationId={liveInstId} />;
      case "comms": return <TabComms emails={emails} d={d} />;
      case "docs": return <TabDocs docs={docs} d={d} isStaff={isStaff} />;
      case "tech": return <TabTech d={d} />;
      case "billing": return <TabBilling d={d} />;
      case "mastr": return <TabMastr d={d} />;
      case "schedule": return <TabSchedule d={d} emails={emails} />;
      case "credentials": return <TabCredentials d={d} />;
      case "timeline": return <TabTimeline timeline={timeline} comments={comments} />;
      default: return <TabOverview d={d} emails={emails} timeline={timeline} installationId={liveInstId} />;
    }
  };

  return (
    <>
      <style>{css}</style>
      <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: `${C.bg} radial-gradient(ellipse 80% 50% at 50% -20%, rgba(107,138,255,0.06), transparent)`, fontFamily: "'Inter',sans-serif", color: C.text, overflow: "hidden", letterSpacing: "-0.01em" }}>

        {/* HEADER (Phase 7: Enhanced) */}
        <div style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(8,13,26,0.8)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px" }}>
            <button onClick={onBack} className="v3-btn" style={{ padding: "6px 10px", fontSize: 14 }}>←</button>
            {isStaff && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: C.accent, fontWeight: 600 }}>{d.publicId || "INST-???"}</span>}
            <span style={{ fontSize: 14, color: C.bright, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isStaff ? (d.projektName || `${d.betreiber?.vorname} ${d.betreiber?.nachname}`.trim() || d.customerName || "—") : "Mein Projekt"}
            </span>
            {/* Phase 7: Status Badge with color */}
            <Badge color={statusColor} bg={`${statusColor}1a`}>{statusLabel}</Badge>
            {/* Phase 7: Dynamic kWp/MW Badge */}
            <Badge color={C.cyan} bg={C.cyanDim}>{pvPower.value} {pvPower.unit}</Badge>
            {/* Phase 7: systemTyp Badge for Speicher */}
            {speicher && <Badge color={C.purple} bg={C.purpleDim}>{a.systemTyp}</Badge>}
            <div style={{ flex: 1 }} />
            {/* Phase 7: "Alle Daten" Button */}
            {isStaff && (
              <button className="v3-btn" onClick={() => setShowAllData(true)} style={{ fontSize: 11 }}>
                Alle Daten
              </button>
            )}
            {isStaff && <QuickActions onNavigate={setActiveTab} />}
          </div>

          <div className="v3-pipeline" style={{ padding: "4px 20px 14px" }}>
            <PipelineBar currentStep={currentStep} isStaff={isStaff} onStepClick={handleStepClick} />
          </div>
        </div>

        {/* BODY: SIDEBAR + CONTENT */}
        <div className="v3-layout" style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Sidebar */}
          <div className="v3-sidebar" style={{ width: 210, background: "rgba(8,13,26,0.7)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRight: `1px solid ${C.border}`, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, flexShrink: 0, overflowY: "auto" }}>
            {navWithBadges.map(item => (
              <button key={item.key} className={`v3-sidebar-btn ${activeTab === item.key ? "active" : ""}`} onClick={() => setActiveTab(item.key)}>
                <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span>{item.label}</span>
                  {(item as any).desc && !isStaff && (
                    <div style={{ fontSize: 9, color: C.dim, marginTop: 1, lineHeight: 1.3 }}>{(item as any).desc}</div>
                  )}
                </div>
                {item.badge > 0 && (
                  <span className="badge" style={{ background: C.redDim, color: C.red }}>{item.badge}</span>
                )}
              </button>
            ))}

            {/* Meta Info */}
            <div style={{ marginTop: "auto", padding: "10px 14px 10px 38px", borderTop: `1px solid ${C.border}`, overflow: "hidden" }}>
              {isStaff ? (<>
                <div style={{ fontSize: 9, color: C.dim, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Erstellt von</div>
                <div style={{ fontSize: 10, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.createdByName || d.createdByCompany || "—"}</div>
                <div style={{ fontSize: 9, color: C.dim, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Erstellt am</div>
                <div style={{ fontSize: 10, color: C.muted }}>{d.createdAt || "—"}</div>
                {d.assignedTo && <>
                  <div style={{ fontSize: 9, color: C.dim, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Zuständig</div>
                  <div style={{ fontSize: 10, color: C.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.assignedTo}</div>
                </>}
                {d.dedicatedEmail && <>
                  <div style={{ fontSize: 9, color: C.dim, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Projekt-Email</div>
                  <div style={{ fontSize: 10, color: C.accent, fontFamily: "'JetBrains Mono',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
                    onClick={() => navigator.clipboard.writeText(d.dedicatedEmail)}>
                    {d.dedicatedEmail}
                  </div>
                </>}
              </>) : (<>
                <div style={{ fontSize: 9, color: C.dim, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Projekt-Nr.</div>
                <div style={{ fontSize: 10, color: C.accent, fontFamily: "'JetBrains Mono',monospace" }}>{d.publicId || "—"}</div>
                <div style={{ fontSize: 9, color: C.dim, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Betreut von</div>
                <div style={{ fontSize: 10, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.createdByCompany || "LeCa GmbH"}</div>
              </>)}
            </div>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", background: "radial-gradient(ellipse at top right, rgba(107,138,255,0.02), transparent 60%)" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              {renderTab()}
            </div>
          </div>
        </div>
      </div>

      {/* Phase 7: AllDataModal */}
      {showAllData && <AllDataModal d={d} onClose={() => setShowAllData(false)} />}

      {/* Phase 8: StatusChangeModal */}
      {showStatusModal && (
        <StatusChangeModal
          currentStatus={localStatus}
          onClose={() => setShowStatusModal(false)}
          onConfirm={handleStatusChange}
        />
      )}
    </>
  );
}
