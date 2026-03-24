import { useState, useEffect } from "react";
import { C, cardStyle, btnPrimary, btnGhost, inputStyle, badgeStyle } from "../../crm.styles";
import { api } from "../../../../modules/api/client";

export default function CrmEinstellungenTab() {
  const [orgData, setOrgData] = useState<Record<string, any>>({});
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    api.get("/crm/organisation/1").then(r => setOrgData(r.data || {})).catch(() => {});
    api.get("/crm/email-templates?organisationId=1").then(r => setTemplates(r.data || [])).catch(() => {});
  }, []);

  return (
    <div className="crm-fade">
      <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright, marginBottom: 16 }}>Einstellungen</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Org & Branding */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textBright, marginBottom: 12 }}>Organisation & Branding</div>
          {[
            ["Firma", orgData.firmenName || orgData.name || "—"],
            ["Slug", orgData.slug || "—"],
            ["Email", orgData.email || "—"],
            ["USt-ID", orgData.ustId || "—"],
            ["Angebots-Prefix", orgData.angebotPrefix || "ANG"],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>{l}</span>
              <span style={{ fontSize: 11, color: C.text, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          {/* Color pickers */}
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Primärfarbe</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: orgData.primaerFarbe || C.primary, border: `1px solid ${C.border}` }} />
                <span style={{ fontSize: 11, color: C.text }}>{orgData.primaerFarbe || C.primary}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Logo</div>
              {orgData.logo ? (
                <img src={orgData.logo} alt="Logo" style={{ height: 32, borderRadius: 4, border: `1px solid ${C.border}` }} />
              ) : (
                <button style={btnGhost}>Logo hochladen</button>
              )}
            </div>
          </div>
        </div>

        {/* Benutzer & Rollen */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textBright, marginBottom: 12 }}>Benutzer & Rollen</div>
          {["Christian Z. — ORG_ADMIN", "Izabela Z. — SALES", "Hartmut B. — VIEWER"].map((u, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{u.split(" — ")[0]}</span>
              <span style={badgeStyle(C.primaryGlow, C.accent)}>{u.split(" — ")[1]}</span>
            </div>
          ))}
          <button style={{ ...btnGhost, marginTop: 10, width: "100%" }}>+ Benutzer einladen</button>
        </div>

        {/* KI & Automatisierungen */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textBright, marginBottom: 12 }}>KI & Automatisierungen</div>
          {[
            ["KI-Email-Klassifikation", "GPT-4o + Llama", true],
            ["Auto-NB bei Auftrag", "netzanfrage.service", true],
            ["Auto-Nachforderung", "Confidence > 90%", true],
            ["Auto-Dokument-Scan", "Bei Upload", true],
            ["Auto-Eskalation", "7 Tage ohne Antwort", true],
            ["Factro-Sync", "Projekt verlinken", false],
          ].map(([n, d, a]) => (
            <div key={n as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{n as string}</div>
                <div style={{ fontSize: 9, color: C.textMuted }}>{d as string}</div>
              </div>
              <span style={badgeStyle(a ? C.greenBg : C.redBg, a ? C.green : C.red)}>{a ? "AN" : "AUS"}</span>
            </div>
          ))}
        </div>

        {/* Email-Templates */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textBright, marginBottom: 12 }}>Email-Templates ({templates.length})</div>
          {templates.map((t: any) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{t.name}</div>
                <div style={{ fontSize: 9, color: C.textMuted }}>{t.typ}</div>
              </div>
              <span style={badgeStyle(t.aktiv ? C.greenBg : C.redBg, t.aktiv ? C.green : C.red)}>{t.aktiv ? "Aktiv" : "Inaktiv"}</span>
            </div>
          ))}
          {templates.length === 0 && <div style={{ color: C.textMuted, fontSize: 11, padding: 10 }}>Templates werden beim ersten Zugriff automatisch erstellt.</div>}
          <button style={{ ...btnGhost, marginTop: 10, width: "100%" }}>+ Custom Template</button>
        </div>
      </div>
    </div>
  );
}
