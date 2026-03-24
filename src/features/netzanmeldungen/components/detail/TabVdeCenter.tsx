/**
 * VDE Center Tab — Echte Formulargenerierung über /api/vde-center
 * Benötigt eine verknüpfte Installation (installationId).
 */
import { useState, useEffect } from "react";

interface Props {
  crmId: number;
  kwp: number;
  installationId?: number | null;
  onInstallationCreated?: (installationId: number) => void;
}
interface FormStatus { formType: string; status: string; generatedAt?: string; pdfPath?: string }

export default function TabVdeCenter({ crmId, kwp, installationId, onInstallationCreated }: Props) {
  const isMS = kwp >= 135;
  const norm = isMS ? "VDE-AR-N 4110 (Mittelspannung)" : "VDE-AR-N 4105 (Niederspannung)";

  const [formStatuses, setFormStatuses] = useState<FormStatus[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Lade Status der Formulare für diese Installation
  useEffect(() => {
    if (!installationId) { setLoading(false); return; }
    fetch(`/api/vde-center/status/${installationId}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : { forms: [] })
      .then(data => setFormStatuses(data.forms || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [installationId]);

  // Alle Formulare generieren
  const handleGenerateAll = async () => {
    if (!installationId) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/vde-center/generate/${installationId}`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formTypes: isMS ? ["E1_4110", "E8_4110"] : ["E1_4105", "E2_4105", "E9_4105"] }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatusMsg({ text: `${data.generated || "Formulare"} erfolgreich generiert`, type: "success" });
        setTimeout(() => setStatusMsg(null), 5000);
        // Reload status
        const statusRes = await fetch(`/api/vde-center/status/${installationId}`, { credentials: "include" });
        if (statusRes.ok) { const d = await statusRes.json(); setFormStatuses(d.forms || []); }
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMsg({ text: err.error || "Generierung fehlgeschlagen", type: "error" });
        setTimeout(() => setStatusMsg(null), 8000);
      }
    } catch { setStatusMsg({ text: "Generierung fehlgeschlagen — Netzwerkfehler", type: "error" }); setTimeout(() => setStatusMsg(null), 8000); }
    setGenerating(false);
  };

  // Einzelnes Formular als HTML-Preview öffnen
  const handlePreview = async (formType: string) => {
    if (!installationId) return;
    window.open(`/api/vde-center/preview/${installationId}/${formType}`, "_blank");
  };

  // PDF generieren + Download
  const handlePdf = async () => {
    if (!installationId) return;
    window.open(`/api/vde-center/html-pdf/${installationId}`, "_blank");
  };

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateInstallation = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const token = localStorage.getItem("baunity_token") || "";
      const resp = await fetch(`/api/crm/projekte/${crmId}/create-installation`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setCreateError(err.error || "Fehler beim Erstellen");
        return;
      }
      const data = await resp.json();
      onInstallationCreated?.(data.installationId);
    } catch {
      setCreateError("Netzanmeldung konnte nicht erstellt werden — Netzwerkfehler");
    } finally {
      setCreating(false);
    }
  };

  // Keine Installation verknüpft
  if (!installationId) {
    return (
      <div style={{ padding: "30px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", marginBottom: 6 }}>Keine Netzanmeldung verknüpft</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>
          VDE-Formulare können erst generiert werden wenn eine Netzanmeldung (Installation) mit diesem Projekt verknüpft ist.
        </div>
        {createError && (
          <div style={{ marginBottom: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#ef4444", fontSize: 12, fontWeight: 500 }}>
            {createError}
          </div>
        )}
        <button
          onClick={handleCreateInstallation}
          disabled={creating}
          style={{ background: creating ? "#4b5563" : "#D4A843", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 13, fontWeight: 600, cursor: creating ? "wait" : "pointer" }}
        >
          {creating ? "Wird erstellt..." : "⚡ Netzanmeldung erstellen"}
        </button>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>Laden...</div>;

  const forms = isMS
    ? [{ id: "E1_4110", name: "E.1 Antragstellung MS" }, { id: "E8_4110", name: "E.8 Datenblatt EZA (5 Seiten)" }, { id: "E10_4110", name: "E.10 IBN-Protokoll" }]
    : [{ id: "E1_4105", name: "E.1 Anmeldung NS" }, { id: "E2_4105", name: "E.2 Datenblatt EZE" }, { id: "E3_4105", name: "E.3 Datenblatt Speicher" }, { id: "E9_4105", name: "E.9 IBN-Protokoll" }];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>📋 VDE Center</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{norm} · Installation #{installationId}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={handleGenerateAll} disabled={generating}
            style={{ background: generating ? "#1e1e3a" : "#D4A843", color: generating ? "#475569" : "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 12, fontWeight: 600, cursor: generating ? "default" : "pointer" }}>
            {generating ? "⏳ Generiere..." : "⚡ Alle generieren"}
          </button>
          <button onClick={handlePdf}
            style={{ background: "rgba(255,255,255,0.04)", color: "#a5b4fc", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 14px", fontSize: 12, cursor: "pointer" }}>
            📄 PDF Download
          </button>
        </div>
      </div>

      {/* Status-Meldung */}
      {statusMsg && (
        <div style={{ marginBottom: 10, padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, background: statusMsg.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${statusMsg.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, color: statusMsg.type === "success" ? "#22c55e" : "#ef4444" }}>
          {statusMsg.type === "success" ? "✓ " : "✗ "}{statusMsg.text}
        </div>
      )}

      {/* Formular-Liste */}
      {forms.map((f) => {
        const status = formStatuses.find(s => s.formType === f.id);
        const isGenerated = status?.status === "generated";
        return (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "rgba(17,20,35,0.95)", border: `1px solid ${isGenerated ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)"}`, borderRadius: 10, marginBottom: 6 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = isGenerated ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)"; }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: isGenerated ? "rgba(34,197,94,0.08)" : "rgba(212,168,67,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {isGenerated ? "✅" : "📝"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{f.name}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {isGenerated ? `Generiert am ${status?.generatedAt ? new Date(status.generatedAt).toLocaleDateString("de-DE") : "—"}` : "Noch nicht generiert"}
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 6, background: isGenerated ? "rgba(34,197,94,0.08)" : "rgba(212,168,67,0.08)", color: isGenerated ? "#22c55e" : "#a5b4fc" }}>
              {isGenerated ? "✓ Generiert" : "Entwurf"}
            </span>
            <button onClick={() => handlePreview(f.id)}
              style={{ background: "rgba(255,255,255,0.04)", color: "#a5b4fc", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>
              Ansehen →
            </button>
          </div>
        );
      })}

      {/* Signaturen */}
      <div style={{ background: "rgba(17,20,35,0.95)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10, padding: "16px", marginTop: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>✍️ Signaturen (zentral hinterlegt)</div>
        <SignaturenStatus />
      </div>
    </div>
  );
}

function SignaturenStatus() {
  const [sigs, setSigs] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/signatures", { credentials: "include" })
      .then(r => r.ok ? r.json() : []).then(setSigs).catch(() => {});
  }, []);

  if (sigs.length === 0) return <div style={{ fontSize: 12, color: "#64748b" }}>Keine Signaturen hinterlegt. Unter Einstellungen → Signaturen hinzufügen.</div>;

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {sigs.map((s: any) => (
        <div key={s.id} style={{ flex: 1, padding: "10px 14px", background: "rgba(34,197,94,0.04)", borderRadius: 8, border: "1px solid rgba(34,197,94,0.1)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#22c55e" }}>✓ {s.name}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>{s.betrieb || "—"} · {s.signatureType}</div>
          <img src={`/api/signatures/${s.id}/image`} alt="" style={{ height: 36, marginTop: 6, borderRadius: 4, background: "#fff", padding: 2 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      ))}
    </div>
  );
}
