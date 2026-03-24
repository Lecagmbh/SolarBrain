/**
 * Mock: Bidirektionales Kommentar-System
 * Zeigt vollautomatische Transparenz für alle Beteiligten
 */
import { useState } from "react";
import { C, badgeStyle, cardStyle, btnPrimary, btnGhost, CSS_INJECT } from "./crm.styles";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type EventType = "EMAIL_IN" | "EMAIL_OUT" | "FACTRO_IN" | "FACTRO_OUT" | "STATUS" | "MANUAL" | "SYSTEM" | "DOCUMENT" | "KI";

interface TimelineEvent {
  id: number;
  ts: string;
  type: EventType;
  author: string;
  title: string;
  body?: string;
  internal: boolean;
  syncTo?: "factro" | "portal";
  syncFrom?: "factro" | "email";
  meta?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════
// EVENT CONFIG
// ═══════════════════════════════════════════════════════════════════

const EV: Record<EventType, { icon: string; color: string; bg: string; label: string }> = {
  EMAIL_IN:   { icon: "📨", color: "#38bdf8", bg: "rgba(56,189,248,0.10)",  label: "Email empfangen" },
  EMAIL_OUT:  { icon: "📤", color: "#34d399", bg: "rgba(52,211,153,0.10)",  label: "Email gesendet" },
  FACTRO_IN:  { icon: "🔽", color: "#fb923c", bg: "rgba(251,146,60,0.10)", label: "Factro → Baunity" },
  FACTRO_OUT: { icon: "🔼", color: "#fbbf24", bg: "rgba(251,191,36,0.10)", label: "Baunity → Factro" },
  STATUS:     { icon: "⚡", color: "#f0d878", bg: "rgba(167,139,250,0.10)", label: "Status-Änderung" },
  MANUAL:     { icon: "💬", color: "#EAD068", bg: "rgba(212,168,67,0.10)",  label: "Kommentar" },
  SYSTEM:     { icon: "⚙",  color: "#64748b", bg: "rgba(100,116,139,0.10)", label: "System" },
  DOCUMENT:   { icon: "📎", color: "#a5b4fc", bg: "rgba(165,180,252,0.10)", label: "Dokument" },
  KI:         { icon: "🧠", color: "#f472b6", bg: "rgba(244,114,182,0.10)", label: "KI-Analyse" },
};

// ═══════════════════════════════════════════════════════════════════
// MOCK DATA — Realistische Timeline eines PV-Projekts
// ═══════════════════════════════════════════════════════════════════

const EVENTS: TimelineEvent[] = [
  { id: 1,  ts: "2026-03-10T09:12:00", type: "STATUS",     author: "System",              title: "Status: AUFTRAG → NB_ANFRAGE", body: "Alle Pflichtdokumente vorhanden, NB-Anfrage kann gestartet werden.", internal: false, syncTo: "factro", meta: { from: "AUFTRAG", to: "NB_ANFRAGE" } },
  { id: 2,  ts: "2026-03-10T09:15:00", type: "SYSTEM",     author: "System",              title: "VDE-Formulare automatisch generiert", body: "E.1 Antragstellung, E.2 Datenblatt PV (12.5 kWp, SolarEdge SE10K)", internal: false, syncTo: "factro" },
  { id: 3,  ts: "2026-03-10T09:18:00", type: "EMAIL_OUT",  author: "Baunity",            title: "Email an Stadtwerke Freiburg gesendet", body: "Betreff: Netzanschlussantrag PV-Anlage 12.5 kWp — Müller, Hauptstr. 42\nAnhänge: VDE E.1, E.2, Lageplan, Übersichtsschaltplan", internal: false, syncTo: "factro", meta: { to: "netz@stadtwerke-freiburg.de", subject: "Netzanschlussantrag PV 12.5 kWp" } },
  { id: 4,  ts: "2026-03-10T09:18:30", type: "FACTRO_OUT", author: "System",              title: "→ Factro: \"Netzanfrage gestellt am 10.03.2026 per Mail\"", body: "Automatisch als Kommentar im Factro-Projekt hinterlegt.", internal: false },
  { id: 5,  ts: "2026-03-12T14:22:00", type: "MANUAL",     author: "Christian Z.",         title: "NB hat telefonisch Rückfrage zu Schaltplan", body: "Herr Weber von Stadtwerke FR hat angerufen — braucht aktualisierten Übersichtsschaltplan mit Speicher-Anbindung.", internal: true },
  { id: 6,  ts: "2026-03-13T08:45:00", type: "EMAIL_IN",   author: "Stadtwerke Freiburg", title: "Email von Stadtwerke Freiburg empfangen", body: "Betreff: Nachforderung Unterlagen — Az. 2026-PV-1847\n\"Bitte reichen Sie einen aktualisierten Übersichtsschaltplan inkl. Speichersystem nach.\"", internal: false, syncTo: "factro", syncFrom: "email", meta: { from: "netz@stadtwerke-freiburg.de", subject: "Nachforderung Unterlagen — Az. 2026-PV-1847" } },
  { id: 7,  ts: "2026-03-13T08:45:05", type: "KI",         author: "KI-Klassifikation",   title: "Rückfrage erkannt: MISSING_DOCUMENT (Schaltplan)", body: "Confidence: 94% — Kategorie: Nachforderung\nFehlend: Übersichtsschaltplan mit Speicher\nEmpfehlung: Auto-Resolve mit aktualisiertem Schaltplan", internal: true },
  { id: 8,  ts: "2026-03-13T08:45:10", type: "STATUS",     author: "System",              title: "Status: NB_ANFRAGE → NB_KOMMUNIKATION", body: "Automatisch durch eingehende NB-Rückfrage ausgelöst.", internal: false, syncTo: "factro", meta: { from: "NB_ANFRAGE", to: "NB_KOMMUNIKATION" } },
  { id: 9,  ts: "2026-03-13T08:46:00", type: "FACTRO_OUT", author: "System",              title: "→ Factro: \"Rückfrage vom NB: Schaltplan nachgefordert\"", internal: false },
  { id: 10, ts: "2026-03-13T11:30:00", type: "FACTRO_IN",  author: "M. Müller (Factro)",  title: "Factro-Kommentar: \"Schaltplan wird heute aktualisiert\"", body: "Kommentar von Monteur M. Müller aus Factro importiert.", internal: false, syncFrom: "factro" },
  { id: 11, ts: "2026-03-13T16:05:00", type: "DOCUMENT",   author: "Christian Z.",         title: "Dokument hochgeladen: Schaltplan_v2_mit_Speicher.pdf", body: "Aktualisierter Übersichtsschaltplan mit BYD HVS 10.2 Speicher-Anbindung", internal: false, syncTo: "factro" },
  { id: 12, ts: "2026-03-13T16:08:00", type: "EMAIL_OUT",  author: "Baunity",            title: "Email an Stadtwerke Freiburg gesendet", body: "Betreff: Nachreichung Übersichtsschaltplan — Az. 2026-PV-1847\nAnhang: Schaltplan_v2_mit_Speicher.pdf", internal: false, syncTo: "factro", meta: { to: "netz@stadtwerke-freiburg.de", subject: "Nachreichung Übersichtsschaltplan" } },
  { id: 13, ts: "2026-03-13T16:08:30", type: "FACTRO_OUT", author: "System",              title: "→ Factro: \"Schaltplan nachgereicht per Mail am 13.03.\"", internal: false },
  { id: 14, ts: "2026-03-18T10:14:00", type: "EMAIL_IN",   author: "Stadtwerke Freiburg", title: "Email von Stadtwerke Freiburg empfangen", body: "Betreff: Einspeisezusage — Az. 2026-PV-1847\n\"Hiermit erteilen wir die Einspeisezusage für die PV-Anlage 12.5 kWp am Standort Hauptstr. 42, 79098 Freiburg.\"", internal: false, syncTo: "factro", syncFrom: "email", meta: { from: "netz@stadtwerke-freiburg.de", subject: "Einspeisezusage — Az. 2026-PV-1847" } },
  { id: 15, ts: "2026-03-18T10:14:05", type: "KI",         author: "KI-Klassifikation",   title: "Genehmigung erkannt: Einspeisezusage", body: "Confidence: 98% — Kategorie: Genehmigung\nAz: 2026-PV-1847\nEmpfehlung: Status auf GENEHMIGT setzen", internal: true },
  { id: 16, ts: "2026-03-18T10:14:10", type: "STATUS",     author: "System",              title: "Status: NB_KOMMUNIKATION → NB_GENEHMIGT", body: "Automatisch durch KI-erkannte Einspeisezusage ausgelöst.", internal: false, syncTo: "factro", meta: { from: "NB_KOMMUNIKATION", to: "NB_GENEHMIGT" } },
  { id: 17, ts: "2026-03-18T10:15:00", type: "FACTRO_OUT", author: "System",              title: "→ Factro: \"Einspeisezusage erhalten am 18.03.2026\"", internal: false },
  { id: 18, ts: "2026-03-18T10:20:00", type: "MANUAL",     author: "Elif K.",             title: "Kunde telefonisch über Genehmigung informiert", body: "Hr. Müller freut sich, möchte IBN-Termin so schnell wie möglich.", internal: false, syncTo: "factro" },
];

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

const EXTRA_CSS = `
@keyframes syncPulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes dotPing{0%{transform:scale(1);opacity:1}75%{transform:scale(1.8);opacity:0}100%{transform:scale(1.8);opacity:0}}
.tl-item{transition:all .15s;cursor:pointer;border-radius:10px}
.tl-item:hover{background:rgba(212,168,67,0.04)!important;transform:translateX(2px)}
.tl-internal{border-left:2px dashed rgba(251,191,36,0.3)!important}
`;

export default function MockKommentarSystem() {
  const [view, setView] = useState<"staff" | "kunde">("staff");
  const [mockTab, setMockTab] = useState<"konzept" | "preview">("konzept");
  const [expanded, setExpanded] = useState<number | null>(null);

  const visible = EVENTS.filter(e => {
    if (view === "kunde" && e.internal) return false;
    if (view === "kunde" && e.type === "KI") return false;
    if (view === "kunde" && e.type === "FACTRO_IN") return false;
    if (view === "kunde" && e.type === "FACTRO_OUT") return false;
    if (view === "kunde" && e.type === "SYSTEM") return false;
    return true;
  }).reverse(); // neueste oben

  const stats = {
    total: visible.length,
    emails: visible.filter(e => e.type === "EMAIL_IN" || e.type === "EMAIL_OUT").length,
    factroOut: EVENTS.filter(e => e.syncTo === "factro").length,
    factroIn: EVENTS.filter(e => e.syncFrom === "factro").length,
    statuses: EVENTS.filter(e => e.type === "STATUS").length,
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Sans', sans-serif", padding: "24px 32px" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_INJECT + EXTRA_CSS }} />

      {/* Header */}
      <div className="crm-fade" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.textBright, letterSpacing: -0.5 }}>
              Kommentar-System <span style={{ fontSize: 14, fontWeight: 600, color: C.primary, background: C.primaryGlow, padding: "3px 10px", borderRadius: 6, marginLeft: 8 }}>KONZEPT</span>
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Vollautomatische bidirektionale Transparenz — Emails, Factro, Status, Dokumente</div>
          </div>
          {/* View Toggle */}
          <div style={{ display: "flex", gap: 2, background: "rgba(12,12,20,0.7)", borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
            {(["staff", "kunde"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "8px 20px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: view === v ? (v === "staff" ? C.primaryGlow : "rgba(52,211,153,0.15)") : "transparent",
                color: view === v ? (v === "staff" ? C.accent : C.green) : C.textMuted,
              }}>
                {v === "staff" ? "👨‍💼 Staff-View" : "👤 Kunden-View"}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Konzept vs Preview */}
        <div style={{ display: "flex", gap: 2, background: "rgba(12,12,20,0.7)", borderRadius: 8, padding: 3, border: `1px solid ${C.border}`, marginBottom: 12 }}>
          {([["konzept", "💡 Konzept-Ansicht"], ["preview", "🖥 So sieht es in der Installation aus"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setMockTab(k)} style={{
              flex: 1, padding: "8px 16px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
              background: mockTab === k ? C.primaryGlow : "transparent",
              color: mockTab === k ? C.accent : C.textMuted,
            }}>{l}</button>
          ))}
        </div>

        {/* Konzept-Banner */}
        <div style={{ ...cardStyle, padding: "14px 20px", background: "rgba(212,168,67,0.04)", border: `1px solid rgba(212,168,67,0.15)`, display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ fontSize: 28 }}>💡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>So funktioniert das System</div>
            <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6, marginTop: 2 }}>
              {view === "staff"
                ? "Jede Aktion wird automatisch dokumentiert — Emails, Status-Änderungen, Dokumente, KI-Analysen. Factro-Kunden sehen alles gespiegelt in Factro. Interne Notizen (gelb markiert) bleiben intern."
                : "Kunden sehen eine klare Timeline: Wann wurde die Anfrage gesendet? Wann kam Antwort? Was ist der aktuelle Status? Keine Nachfragen nötig — alles transparent."}
            </div>
          </div>
        </div>
      </div>

      {/* Preview: Installation Detail-Panel Simulation */}
      {mockTab === "preview" && (
        <div className="crm-fade">
          {/* Fake Detail-Header */}
          <div style={{ ...cardStyle, padding: "16px 20px", marginBottom: 16, background: "rgba(10,10,20,0.95)", border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: C.textMuted, cursor: "pointer" }}>← Projekte</span>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: C.textBright }}>Max Müller</span>
              <span style={badgeStyle("rgba(34,197,94,0.15)", C.green)}>● Genehmigt</span>
              <span style={badgeStyle("rgba(56,189,248,0.12)", C.blue)}>⚡ Wizard</span>
              <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: C.textMuted, marginLeft: 4 }}>INST-X7K2M9P</span>
              <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "'DM Mono', monospace", color: C.accent }}>📧 inst-x7k2m9p@baunity.de</span>
            </div>
            <div style={{ display: "flex", gap: 6, fontSize: 10, color: C.textDim, paddingLeft: 20 }}>
              <span>79098 Freiburg</span><span style={{ color: C.textMuted }}>·</span>
              <span>Stadtwerke Freiburg</span><span style={{ color: C.textMuted }}>·</span>
              <span style={{ fontWeight: 600, color: C.green }}>12.5 kWp</span>
            </div>
          </div>

          {/* Fake Tab Bar — Verlauf aktiv */}
          <div style={{ display: "flex", gap: 4, padding: "8px 0", marginBottom: 16, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
            {[
              { k: "uebersicht", l: "Übersicht", i: "◉" },
              { k: "verlauf", l: "Verlauf", i: "📜", active: true },
              { k: "nb", l: "NB-Komm.", i: "📧" },
              { k: "vde", l: "VDE Center", i: "📋" },
              { k: "tix", l: "Tickets", i: "🎫" },
              { k: "docs", l: "Dokumente", i: "📄" },
              { k: "check", l: "Unterlagen", i: "✅" },
              { k: "comments", l: "Kommentare", i: "💬" },
            ].map(t => (
              <div key={t.k} style={{
                padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: (t as any).active ? 600 : 400,
                background: (t as any).active ? "rgba(212,168,67,0.12)" : "transparent",
                color: (t as any).active ? C.accent : C.textMuted,
                display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
              }}>
                <span style={{ fontSize: 14 }}>{t.i}</span>{t.l}
              </div>
            ))}
          </div>

          {/* Fake TabVerlauf Content */}
          <div style={{ maxWidth: 900 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.textBright }}>📜 Projekt-Verlauf</div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>{visible.length} Einträge</span>
                <span style={badgeStyle("rgba(212,168,67,0.10)", "#EAD068")}>CRM #85</span>
              </div>
            </div>

            {/* Filter-Buttons */}
            <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
              {[
                { k: "all", l: "Alle", c: C.primary },
                { k: "EMAIL_IN", l: "📨 Email empfangen", c: "#38bdf8" },
                { k: "EMAIL_OUT", l: "📤 Email gesendet", c: "#34d399" },
                { k: "STATUS", l: "⚡ Status", c: "#f0d878" },
                { k: "FACTRO", l: "🔄 Factro", c: "#fb923c" },
                { k: "DOCUMENT", l: "📎 Dokument", c: "#06b6d4" },
                { k: "COMMENT", l: "💬 Kommentar", c: "#EAD068" },
              ].map(f => (
                <button key={f.k} style={{
                  padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer",
                  background: f.k === "all" ? f.c + "20" : "rgba(255,255,255,0.03)",
                  color: f.k === "all" ? f.c : C.textMuted,
                }}>{f.l}</button>
              ))}
            </div>

            {/* Timeline */}
            <div style={{ position: "relative", paddingLeft: 28 }}>
              <div style={{ position: "absolute", left: 13, top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.04)", borderRadius: 1 }} />

              {visible.map((e, i) => {
                const cfg = EV[e.type];
                const dateStr = new Date(e.ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
                const prevDate = i > 0 ? new Date(visible[i-1].ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "";
                const showDate = dateStr !== prevDate;

                return (
                  <div key={e.id}>
                    {showDate && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", padding: "8px 0 4px", marginLeft: -28, paddingLeft: 28, background: "rgba(10,10,15,0.8)", position: "sticky", top: 140, zIndex: 1 }}>
                        {dateStr}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10, padding: "8px 4px", position: "relative", borderRadius: 6, borderLeft: e.internal ? "2px dashed rgba(251,191,36,0.3)" : "2px solid transparent" }}
                      onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.03)"; }}
                      onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = "transparent"; }}>

                      <div style={{ position: "absolute", left: -22, top: 12, width: 12, height: 12, borderRadius: "50%", background: cfg.color + "20", border: `2px solid ${cfg.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: cfg.color }} />
                      </div>

                      <div style={{ width: 42, flexShrink: 0, textAlign: "right", paddingTop: 2 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", fontFamily: "monospace" }}>
                          {new Date(e.ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>

                      <div style={{ width: 28, height: 28, borderRadius: 8, background: cfg.color + "10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{cfg.icon}</div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{e.author}</span>
                          <span style={badgeStyle(cfg.color + "15", cfg.color)}>{cfg.label}</span>
                          {e.internal && view === "staff" && <span style={badgeStyle("rgba(251,191,36,0.12)", "#fbbf24")}>🔒 Intern</span>}
                          {e.syncTo === "factro" && view === "staff" && <span style={badgeStyle("rgba(251,146,60,0.12)", "#fb923c")}>🔄 Factro</span>}
                          {e.syncFrom === "factro" && <span style={badgeStyle("rgba(251,146,60,0.12)", "#fb923c")}>📊 CRM</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 2 }}>{e.title}</div>
                        {e.body && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90%" }}>{e.body.split("\n")[0]}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3-Spalten Layout — Konzept */}
      {mockTab === "konzept" && <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 280px", gap: 20, alignItems: "start" }}>

        {/* ═══ LEFT: Projekt-Info ═══ */}
        <div className="crm-fade" style={{ position: "sticky", top: 24 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>📊 Beispiel-Projekt</div>
            {[
              ["Kunde", "Max Müller"],
              ["Anlage", "PV 12.5 kWp + Speicher 10.2 kWh"],
              ["Standort", "Hauptstr. 42, 79098 Freiburg"],
              ["Netzbetreiber", "Stadtwerke Freiburg"],
              ["Aktenzeichen", "2026-PV-1847"],
              ["Status", "NB_GENEHMIGT"],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 10, color: C.textMuted }}>{l}</span>
                <span style={{ fontSize: 11, color: l === "Status" ? C.green : C.text, fontWeight: l === "Status" ? 700 : 500 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ ...cardStyle, marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.textBright, marginBottom: 10 }}>📈 {view === "staff" ? "Alle" : "Sichtbare"} Events</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { n: stats.total, l: "Events", c: C.primary },
                { n: stats.emails, l: "Emails", c: C.blue },
                { n: stats.factroOut, l: "→ Factro", c: C.orange },
                { n: stats.factroIn, l: "← Factro", c: C.yellow },
              ].map(s => (
                <div key={s.l} style={{ background: s.c + "08", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.n}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Flow-Diagram */}
          <div style={{ ...cardStyle, marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.textBright, marginBottom: 10 }}>🔄 Datenfluss</div>
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              {["📧 NB-Email", "→", "📥 Baunity", "→", "💬 Kommentar", "→", "🔄 Factro"].map((t, i) => (
                <span key={i} style={{ fontSize: i % 2 === 1 ? 10 : 11, color: i % 2 === 1 ? C.textMuted : C.accent, fontWeight: i % 2 === 1 ? 400 : 600, margin: "0 2px", display: "inline-block" }}>{t}</span>
              ))}
            </div>
            <div style={{ height: 1, background: C.border, margin: "8px 0" }} />
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              {["🔄 Factro", "→", "📥 Baunity", "→", "💬 Kommentar", "→", "👤 Kunde sieht"].map((t, i) => (
                <span key={i} style={{ fontSize: i % 2 === 1 ? 10 : 11, color: i % 2 === 1 ? C.textMuted : C.orange, fontWeight: i % 2 === 1 ? 400 : 600, margin: "0 2px", display: "inline-block" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ CENTER: Timeline ═══ */}
        <div className="crm-fade">
          <div style={{ fontSize: 14, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>
            {view === "staff" ? "📜 Vollständige Timeline" : "📜 Projekt-Verlauf"} <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted }}>({visible.length} Einträge)</span>
          </div>

          <div style={{ position: "relative", paddingLeft: 28 }}>
            {/* Vertical line */}
            <div style={{ position: "absolute", left: 11, top: 8, bottom: 8, width: 2, background: `linear-gradient(to bottom, ${C.primary}40, ${C.border})`, borderRadius: 1 }} />

            {visible.map((e, i) => {
              const cfg = EV[e.type];
              const isOpen = expanded === e.id;
              const isNew = i === 0;

              return (
                <div key={e.id} className={`tl-item ${e.internal ? "tl-internal" : ""}`}
                  onClick={() => setExpanded(isOpen ? null : e.id)}
                  style={{ marginBottom: 4, padding: "10px 14px", position: "relative", borderLeft: e.internal ? undefined : "2px solid transparent" }}>

                  {/* Dot */}
                  <div style={{ position: "absolute", left: -22, top: 14, width: 12, height: 12, borderRadius: "50%", background: cfg.color, border: `2px solid ${C.bg}`, zIndex: 1 }}>
                    {isNew && <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `2px solid ${cfg.color}`, animation: "dotPing 1.5s infinite" }} />}
                  </div>

                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                    <span style={badgeStyle(cfg.bg, cfg.color)}>{cfg.label}</span>
                    {e.internal && <span style={badgeStyle(C.yellowBg, C.yellow)}>🔒 Intern</span>}
                    {e.syncTo === "factro" && view === "staff" && <span style={badgeStyle(C.orangeBg, C.orange)}>→ Factro</span>}
                    {e.syncFrom === "factro" && view === "staff" && <span style={badgeStyle("rgba(251,191,36,0.08)", C.yellow)}>← Factro</span>}
                    {e.syncFrom === "email" && view === "staff" && <span style={badgeStyle(C.blueBg, C.blue)}>← Email</span>}
                    <span style={{ marginLeft: "auto", fontSize: 10, color: C.textMuted, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                      {new Date(e.ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} {new Date(e.ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Title */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                    <span style={{ color: cfg.color, fontWeight: 700 }}>{e.author}</span> — {e.title}
                  </div>

                  {/* Collapsed preview */}
                  {!isOpen && e.body && (
                    <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90%" }}>
                      {e.body.split("\n")[0]}
                    </div>
                  )}

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={{ marginTop: 8, padding: "10px 14px", background: cfg.bg, borderRadius: 8, border: `1px solid ${cfg.color}20` }}>
                      {e.body && <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: e.meta ? 8 : 0 }}>{e.body}</div>}
                      {e.meta && (
                        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
                          {Object.entries(e.meta).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", gap: 8, fontSize: 10, marginBottom: 2 }}>
                              <span style={{ color: C.textMuted, minWidth: 60, fontWeight: 600, textTransform: "uppercase" }}>{k}</span>
                              <span style={{ color: C.accent, fontFamily: "'DM Mono', monospace" }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {view === "staff" && e.syncTo === "factro" && (
                        <div style={{ marginTop: 8, padding: "6px 10px", background: C.orangeBg, borderRadius: 6, fontSize: 10, color: C.orange, fontWeight: 600 }}>
                          🔄 Automatisch zu Factro gespiegelt
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ RIGHT: Sync-Status + Legende + Regeln ═══ */}
        <div className="crm-fade" style={{ position: "sticky", top: 24 }}>

          {/* Sync-Status */}
          {view === "staff" && (
            <div style={{ ...cardStyle, marginBottom: 12, background: "rgba(251,146,60,0.03)", border: "1px solid rgba(251,146,60,0.12)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.orange, marginBottom: 10 }}>🔄 Factro-Sync</div>
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <div style={{ background: C.primaryGlow, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.primary }}>GN</div>
                    <div style={{ fontSize: 8, color: C.textMuted }}>Baunity</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>{stats.factroOut} →</div>
                    <div style={{ width: 60, height: 2, background: `linear-gradient(to right, ${C.primary}, ${C.orange})`, borderRadius: 1, animation: "syncPulse 2s infinite" }} />
                    <div style={{ width: 60, height: 2, background: `linear-gradient(to left, ${C.primary}, ${C.yellow})`, borderRadius: 1, animation: "syncPulse 2s infinite 0.5s" }} />
                    <div style={{ fontSize: 11, color: C.yellow, fontWeight: 700 }}>← {stats.factroIn}</div>
                  </div>
                  <div style={{ background: C.orangeBg, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.orange }}>F</div>
                    <div style={{ fontSize: 8, color: C.textMuted }}>Factro</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legende */}
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.textBright, marginBottom: 10 }}>
              {view === "staff" ? "📋 Event-Typen" : "📋 Was Sie sehen"}
            </div>
            {Object.entries(EV)
              .filter(([k]) => view === "staff" || !["FACTRO_IN", "FACTRO_OUT", "SYSTEM", "KI"].includes(k))
              .map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{v.icon}</span>
                  <span style={{ fontSize: 11, color: v.color, fontWeight: 600, flex: 1 }}>{v.label}</span>
                  <span style={{ fontSize: 9, color: C.textMuted }}>
                    {k === "EMAIL_IN" ? "NB-Antwort" : k === "EMAIL_OUT" ? "Ausgehend" : k === "FACTRO_IN" ? "Import" : k === "FACTRO_OUT" ? "Export" : k === "STATUS" ? "Auto" : k === "KI" ? "Nur Staff" : ""}
                  </span>
                </div>
              ))}
          </div>

          {/* Sync-Regeln (nur Staff) */}
          {view === "staff" && (
            <div style={{ ...cardStyle, marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.textBright, marginBottom: 10 }}>⚙ Sync-Regeln</div>
              {[
                { rule: "Emails rein/raus", to: true, from: true },
                { rule: "Status-Änderungen", to: true, from: false },
                { rule: "Dokument-Uploads", to: true, from: false },
                { rule: "Öffentl. Kommentare", to: true, from: true },
                { rule: "Interne Notizen", to: false, from: false },
                { rule: "KI-Analysen", to: false, from: false },
              ].map(r => (
                <div key={r.rule} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 11, color: C.text, flex: 1 }}>{r.rule}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: r.to ? C.green : C.red, width: 40, textAlign: "center" }}>{r.to ? "→ ✓" : "→ ✗"}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: r.from ? C.green : C.red, width: 40, textAlign: "center" }}>{r.from ? "← ✓" : "← ✗"}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 6, fontSize: 9, color: C.textMuted }}>
                <span style={{ width: 40 }} />
                <span style={{ width: 40, textAlign: "center" }}>→ Factro</span>
                <span style={{ width: 40, textAlign: "center" }}>← Factro</span>
              </div>
            </div>
          )}

          {/* Kunden-Info (Kunden-View) */}
          {view === "kunde" && (
            <div style={{ ...cardStyle, marginTop: 12, background: "rgba(52,211,153,0.03)", border: "1px solid rgba(52,211,153,0.12)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.green, marginBottom: 8 }}>✓ Ihre Vorteile</div>
              {[
                "Echtzeit-Status Ihrer Netzanmeldung",
                "Sichtbar wann Emails gesendet/empfangen",
                "Dokumente nachverfolgen",
                "Kein Anrufen nötig — alles transparent",
                "Push-Benachrichtigungen bei Änderungen",
              ].map((t, i) => (
                <div key={i} style={{ fontSize: 11, color: C.textDim, padding: "3px 0", display: "flex", gap: 6 }}>
                  <span style={{ color: C.green }}>✓</span> {t}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>}
    </div>
  );
}
