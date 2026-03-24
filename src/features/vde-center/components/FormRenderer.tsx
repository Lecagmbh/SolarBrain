import { useState, useEffect } from "react";
import type { VdeFormData, VdeFormField } from "../services/vdeCenterApi";
import { fetchFormData, validateForm, getPreviewUrl, sendVdeEmail } from "../services/vdeCenterApi";
import { FieldTicketBadge } from "../../tickets/components/FieldTicketBadge";

const C = {
  bg: "#06060b", bgCard: "rgba(12,12,20,0.85)", bgInput: "rgba(15,15,25,0.9)",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  text: "#e2e8f0", textDim: "#94a3b8", textMuted: "#64748b", textBright: "#f1f5f9",
  primary: "#D4A843", primaryGlow: "rgba(212,168,67,0.15)",
  green: "#34d399", greenBg: "rgba(52,211,153,0.12)",
  red: "#f87171", redBg: "rgba(248,113,113,0.12)",
  orange: "#fb923c", orangeBg: "rgba(251,146,60,0.12)",
};

interface FormRendererProps {
  formId: string;
  installationId: number;
  formName: string;
}

export function FormRenderer({ formId, installationId, formName }: FormRendererProps) {
  const [data, setData] = useState<VdeFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, any>>({});

  useEffect(() => {
    setLoading(true);
    fetchFormData(formId, installationId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [formId, installationId]);

  const handleValidate = async () => {
    setValidating(true);
    try {
      await validateForm(formId, installationId, true);
      // Reload to refresh data
      const fresh = await fetchFormData(formId, installationId);
      setData(fresh);
    } catch (err) {
      console.error(err);
    } finally {
      setValidating(false);
    }
  };

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Formulardaten werden geladen...</div>;
  }

  // Group fields by section
  const sections = new Map<string, VdeFormField[]>();
  data.fields.forEach(f => {
    if (!sections.has(f.section)) sections.set(f.section, []);
    sections.get(f.section)!.push(f);
  });

  const comp = data.completeness;
  const missing = data.missingRequired || [];

  return (
    <div>
      {/* Header with completeness */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.textBright, margin: 0 }}>{formName}</h2>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {comp.filled}/{comp.total} Felder ({comp.percent}%) — {comp.requiredFilled}/{comp.required} Pflichtfelder
          </div>
        </div>
        <button onClick={handleValidate} disabled={validating} style={{
          padding: "8px 16px", borderRadius: 8, border: "none",
          background: comp.requiredFilled === comp.required ? C.green : C.primary,
          color: "#fff", fontSize: 12, fontWeight: 700, cursor: validating ? "wait" : "pointer",
        }}>
          {validating ? "Prüfe..." : comp.requiredFilled === comp.required ? "Alle Pflichtfelder OK" : `Prüfen & Tickets erstellen`}
        </button>
      </div>

      {/* Fehlende Pflichtfelder — immer sichtbar wenn welche fehlen */}
      {missing.length > 0 && (
        <div style={{
          background: C.redBg, border: `1px solid ${C.red}25`, borderRadius: 10,
          padding: "12px 16px", marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 8 }}>
            {missing.length} Pflichtfeld{missing.length !== 1 ? "er" : ""} fehlt:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {missing.map(f => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: C.red, fontWeight: 800, fontSize: 10 }}>●</span>
                <span style={{ color: C.text, fontWeight: 600 }}>{f.label}</span>
                {f.vdeRef && <span style={{ color: C.textMuted, fontSize: 10 }}>({f.vdeRef})</span>}
                <span style={{ color: C.textMuted, fontSize: 10, marginLeft: "auto" }}>{f.section}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ height: 4, background: "rgba(212,168,67,0.1)", borderRadius: 2, marginBottom: 20 }}>
        <div style={{ height: "100%", width: `${comp.percent}%`, background: comp.percent === 100 ? C.green : C.primary, borderRadius: 2, transition: "width 0.3s" }} />
      </div>

      {/* Form sections */}
      {Array.from(sections.entries()).map(([sectionId, fields]) => (
        <div key={sectionId} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {fields[0]?.section && getSectionLabel(data, sectionId)}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {fields.map(field => (
              <FieldInput
                key={field.id}
                field={field}
                installationId={installationId}
                value={overrides[field.id] !== undefined ? overrides[field.id] : field.value}
                onChange={val => setOverrides(prev => ({ ...prev, [field.id]: val }))}
              />
            ))}
          </div>
        </div>
      ))}

      {/* ── Actions: PDF Vorschau, Generieren, Email ────────────────────── */}
      <ActionBar formId={formId} formName={formName} installationId={installationId} />
    </div>
  );
}

function ActionBar({ formId, formName, installationId }: { formId: string; formName: string; installationId: number }) {
  const [showEmail, setShowEmail] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; filename?: string; error?: string } | null>(null);

  const norm = formId.startsWith("4110") ? "4110" : "4105";
  const allForms = norm === "4105" ? "E1,E2,E3,E8" : "E1,E8";

  // Lade NB-Email automatisch
  useEffect(() => {
    import("../../../modules/api/client").then(({ api }) => {
      api.get(`/installations/${installationId}`).then((res: any) => {
        const d = res.data?.data || res.data;
        const nbEmail = d?.netzbetreiber?.email || d?.netzbetreiber?.contact || "";
        if (nbEmail) setEmailTo(nbEmail);
        const name = d?.customerName || "";
        setEmailSubject(`Netzanschlussantrag ${name} — VDE-Formulare`);
        setEmailMessage(`Sehr geehrte Damen und Herren,\n\nanbei übersenden wir Ihnen die VDE-Formulare für die Erzeugungsanlage von ${name}.\n\nAnlage-ID: ${d?.publicId || ""}\n\nMit freundlichen Grüßen\nLeCa GmbH & Co KG\nHartmut Bischoff`);
      }).catch(() => {});
    });
  }, [installationId]);

  const handleSend = async () => {
    if (!emailTo) { alert("Bitte Empfänger-Email eingeben"); return; }
    setSending(true);
    setSendResult(null);
    try {
      const { api } = await import("../../../modules/api/client");
      const { data: result } = await api.post(`/vde-center/html-send/${installationId}`, {
        to: emailTo,
        subject: emailSubject || undefined,
        message: emailMessage || undefined,
        norm,
        forms: allForms.split(","),
      });
      setSendResult(result);
    } catch (err: any) {
      setSendResult({ success: false, error: err.response?.data?.error || err.message });
    }
    setSending(false);
  };

  return (
    <div style={{ marginTop: 24, borderTop: `1px solid rgba(212,168,67,0.08)`, paddingTop: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#D4A843", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        Aktionen
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {/* HTML Vorschau — so wie Christians Mockup */}
        <a
          href={`/api/vde-center/html/${installationId}?norm=${norm}&forms=${allForms}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, textDecoration: "none",
            border: "1px solid rgba(212,168,67,0.2)", background: "transparent",
            color: "#D4A843", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          Vorschau (alle Formulare)
        </a>

        {/* PDF Download via Playwright */}
        <a
          href={`/api/vde-center/html-pdf/${installationId}?norm=${norm}&forms=${allForms}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, textDecoration: "none",
            border: "none", background: "#D4A843",
            color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          PDF herunterladen
        </a>

        {/* Email senden */}
        <button onClick={() => setShowEmail(!showEmail)} style={{
          padding: "8px 16px", borderRadius: 8, border: "none",
          background: "linear-gradient(135deg, #34d399, #059669)",
          color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>
          An Netzbetreiber senden
        </button>
      </div>

      {/* Email-Formular */}
      {showEmail && (
        <div style={{
          background: "rgba(12,12,20,0.85)", border: "1px solid rgba(212,168,67,0.08)",
          borderRadius: 12, padding: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>
            Email an Netzbetreiber
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>
            Alle {norm === "4105" ? "4 Formulare (E.1, E.2, E.3, E.8)" : "3 Formulare (E.1, E.8, E.10)"} werden als PDF generiert und angehängt.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 3 }}>An (NB-Email) *</label>
              <input value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="netzbetreiber@example.de" style={actionInputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 3 }}>Betreff</label>
              <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} style={actionInputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 3 }}>Nachricht</label>
              <textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} rows={6} style={{ ...actionInputStyle, resize: "vertical" }} />
            </div>

            {sendResult && (
              <div style={{
                padding: 10, borderRadius: 6, fontSize: 12,
                background: sendResult.success ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                color: sendResult.success ? "#34d399" : "#f87171",
              }}>
                {sendResult.success
                  ? `Email gesendet! PDF: ${sendResult.filename || "angehängt"}`
                  : `Fehler: ${sendResult.error}`
                }
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowEmail(false)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(212,168,67,0.12)", background: "transparent", color: "#94a3b8", fontSize: 11, cursor: "pointer" }}>
                Abbrechen
              </button>
              <button onClick={handleSend} disabled={sending} style={{
                padding: "8px 20px", borderRadius: 6, border: "none",
                background: "linear-gradient(135deg, #34d399, #059669)",
                color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: sending ? "wait" : "pointer", opacity: sending ? 0.6 : 1,
              }}>
                {sending ? "Sende..." : "Jetzt senden"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const actionInputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 6,
  border: "1px solid rgba(212,168,67,0.12)", background: "rgba(15,15,25,0.9)",
  color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box",
};

function getSectionLabel(data: VdeFormData, sectionId: string): string {
  // Derive from section ID
  return sectionId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function FieldInput({ field, installationId, value, onChange }: {
  field: VdeFormField; installationId: number; value: any; onChange: (v: any) => void;
}) {
  const isFilled = value !== null && value !== undefined && value !== "" && value !== false;
  const borderColor = isFilled ? `${C.green}40` : field.required ? `${C.red}40` : C.border;
  const bgDot = isFilled ? C.green : field.required ? C.red : C.textMuted;

  if (field.type === "signature") {
    return (
      <div style={{ background: C.bgCard, border: `1px solid ${borderColor}`, borderRadius: 8, padding: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: bgDot }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text, flex: 1 }}>{field.label}</span>
          {field.required && <span style={{ fontSize: 9, color: C.red }}>Pflicht</span>}
          <FieldTicketBadge installationId={installationId} fieldId={field.id} context="vde_form" />
        </div>
        <div style={{ height: 50, background: C.bgInput, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", border: `1px dashed ${C.border}` }}>
          <span style={{ fontSize: 10, color: C.textMuted }}>Signatur-Pad</span>
        </div>
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <div style={{ background: C.bgCard, border: `1px solid ${borderColor}`, borderRadius: 8, padding: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{field.label}</span>
          {field.vdeRef && <span style={{ fontSize: 9, color: C.textMuted }}>{field.vdeRef}</span>}
          <FieldTicketBadge installationId={installationId} fieldId={field.id} context="vde_form" />
        </label>
      </div>
    );
  }

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${borderColor}`, borderRadius: 8, padding: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: bgDot }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: C.text, flex: 1 }}>{field.label}</span>
        {field.unit && <span style={{ fontSize: 10, color: C.textDim }}>{field.unit}</span>}
        {field.required && <span style={{ fontSize: 9, color: C.red }}>*</span>}
        {field.vdeRef && <span style={{ fontSize: 9, color: C.textMuted }}>{field.vdeRef}</span>}
        <FieldTicketBadge installationId={installationId} fieldId={field.id} context="vde_form" />
      </div>

      {field.type === "select" && field.options ? (
        <select value={value || ""} onChange={e => onChange(e.target.value)} style={inputStyle}>
          <option value="">— Auswählen —</option>
          {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : field.type === "textarea" ? (
        <textarea value={value || ""} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, height: 60, resize: "vertical" }} />
      ) : (
        <input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          value={value ?? ""}
          onChange={e => onChange(field.type === "number" ? (e.target.value ? Number(e.target.value) : "") : e.target.value)}
          style={inputStyle}
          placeholder={field.hint || ""}
        />
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "6px 8px", borderRadius: 4,
  border: "1px solid rgba(212,168,67,0.1)", background: "rgba(15,15,25,0.9)",
  color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box",
};
