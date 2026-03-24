import { useState } from "react";
import { C } from "../crm.styles";

const TIERS = [
  { id: "starter", name: "Starter", price: null, label: "kostenlos", sub: "max. 2 Nutzer", cta: "Kostenlos starten", accent: false,
    includes: null, features: ["3 aktive Projekte", "Projekt-Übersicht & Kanban", "NB-Unterlagen-Checkliste", "Kommentar-System", "Benachrichtigungen", "Desktop & Mobile App"],
    note: "Upgrade jederzeit möglich." },
  { id: "team", name: "Team", price: 9.99, label: "9,99 €", sub: "pro Nutzer/Monat, ab 3", cta: "14 Tage testen", accent: false,
    includes: "Alle Starter Funktionen", features: ["Unbegrenzte Projekte", "VDE-Formular-Generierung (E.1–E.8)", "Unterschriften-Verwaltung", "Vorlagen & Dokumentenbibliothek", "Zeiterfassung & Übersicht", "Eigene Felder", "Email-Integration", "Kostenlose Gäste"] },
  { id: "professional", name: "Professional", price: 19.99, label: "19,99 €", sub: "pro Nutzer/Monat, ab 3", cta: "14 Tage testen", accent: true, badge: "EMPFOHLEN",
    includes: "Alle Team Funktionen", features: ["KI-NB-Kommunikation (Auto-Erkennung)", "Auto-Nachforderungs-Beantwortung", "KI-Dokumenten-Scanner", "Projektübergreifendes Kanban & Gantt", "Wochenpläne als Board", "Meetings mit Auto-Protokoll (KI)", "Berichte & Pipeline-Analysen", "Ressourcen & Verfügbarkeiten", "Kalender mit iCal-Sync", "Multi-Firma / Branding"] },
  { id: "enterprise", name: "Enterprise", price: null, label: "Auf Anfrage", sub: "ab 20 Nutzer", cta: "Beratung anfragen", accent: false,
    includes: "Alle Professional Funktionen", features: ["SSO / SAML Integration", "2FA-Pflicht & IP-Whitelist", "Dedizierte Instanz", "Custom NB-Templates pro NB", "API-Zugang (Webhooks, REST)", "Factro / MS Teams Sync", "Priorisierter Support (SLA)"] },
];

export default function CrmPricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: C.text, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", top: -300, left: "50%", transform: "translateX(-50%)", width: 800, height: 800, background: "radial-gradient(circle, rgba(212,168,67,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "60px 24px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff" }}>GN</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.textBright }}>Baunity</span>
            <span style={{ fontSize: 10, color: C.primary, border: `1px solid ${C.borderActive}`, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>CRM</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: C.textBright, letterSpacing: -1, margin: "0 0 8px", lineHeight: 1.15 }}>
            Einfache Preise.<br />
            <span style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.green})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Unbegrenzte Netzanmeldungen.</span>
          </h1>
          <p style={{ fontSize: 15, color: C.textDim, maxWidth: 520, margin: "0 auto 24px" }}>
            Nur die CRM-Nutzung wird berechnet. Netzanmeldungen separat nach Aufwand.
          </p>
          <div style={{ display: "inline-flex", gap: 8, background: "rgba(15,15,25,0.7)", borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
            <button onClick={() => setAnnual(false)} style={{ padding: "8px 18px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: !annual ? C.primaryGlow : "transparent", color: !annual ? C.accent : C.textMuted }}>Monatlich</button>
            <button onClick={() => setAnnual(true)} style={{ padding: "8px 18px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: annual ? C.primaryGlow : "transparent", color: annual ? C.accent : C.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
              Jährlich <span style={{ fontSize: 9, background: C.greenBg, color: C.green, padding: "2px 6px", borderRadius: 99, fontWeight: 700 }}>-20%</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, alignItems: "start" }}>
          {TIERS.map((t) => {
            const dp = t.price ? (annual ? (t.price * 0.8).toFixed(2).replace(".", ",") : t.price.toFixed(2).replace(".", ",")) : null;
            return (
              <div key={t.id} style={{ background: C.bgCard, border: `1.5px solid ${t.accent ? C.borderActive : C.border}`, borderRadius: 14, padding: "28px 22px 24px", position: "relative" }}>
                {(t as any).badge && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: 1, padding: "3px 14px", borderRadius: 99 }}>{(t as any).badge}</div>}
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: t.accent ? C.accent : C.textBright, marginBottom: 12 }}>{t.name}</div>
                  {dp ? (
                    <div>
                      <span style={{ fontSize: 36, fontWeight: 800, color: C.textBright }}>{dp}</span>
                      <span style={{ fontSize: 14, color: C.textMuted, marginLeft: 2 }}>EUR</span>
                      {annual && t.price && <div style={{ fontSize: 11, color: C.textMuted, textDecoration: "line-through", marginTop: 2 }}>statt {t.price.toFixed(2).replace(".", ",")} EUR</div>}
                    </div>
                  ) : (
                    <div style={{ fontSize: 24, fontWeight: 800, color: C.textBright }}>{t.label}</div>
                  )}
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{t.sub}</div>
                </div>
                <button style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 20, ...(t.accent ? { background: C.primary, color: "#fff" } : { background: C.primaryGlow, color: C.accent, border: `1px solid ${C.borderHover}` }) }}>{t.cta}</button>
                {t.includes && <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, marginBottom: 10, textDecoration: "underline", textUnderlineOffset: 3 }}>{t.includes}</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {t.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: C.textDim }}>
                      <span style={{ color: C.primary, fontSize: 11, marginTop: 1, flexShrink: 0 }}>+</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                {t.note && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>{t.note}</div>}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 24px" }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textBright }}>Netzanmeldungen separat berechnet</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>Staffelpreise konfigurierbar pro Organisation (Standard: 199/149/129 EUR)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
