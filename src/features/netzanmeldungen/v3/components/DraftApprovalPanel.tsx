/**
 * DraftApprovalPanel — Overlay für Rückfrage-Entwurf Vorschau + Freigabe
 * Lädt den Entwurf per API, zeigt Subject/Body/Docs, Approve/Reject Buttons
 */
import { useState, useEffect } from "react";

interface Props {
  installationId: number;
  publicId: string;
  customerName: string;
  onClose: () => void;
  onApproved: () => void;
}

interface DraftData {
  id: number;
  draftSubject: string | null;
  draftBody: string | null;
  recipientEmail: string | null;
  generatedDocs: Array<{ filename: string; type: string; fromInstallation: boolean }>;
  analysisData: { items?: string[]; summary?: string };
  createdAt: string;
}

const API = import.meta.env.VITE_API_URL || "";

export default function DraftApprovalPanel({ installationId, publicId, customerName, onClose, onApproved }: Props) {
  const token = localStorage.getItem("baunity_token") || "";
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");

  useEffect(() => {
    loadDraft();
  }, [installationId]);

  async function loadDraft() {
    try {
      setLoading(true);
      // Lade pending response für diese Installation
      const res = await fetch(`${API}/api/workflow/${installationId}/rueckfrage-response`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Kein Entwurf gefunden");
      const data = await res.json();
      if (!data || !data.id) throw new Error("Kein pending Entwurf");
      setDraft(data);
      setEditSubject(data.draftSubject || "");
      setEditBody(data.draftBody || "");
    } catch (e: any) {
      setError(e.message || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!draft) return;
    try {
      setSending(true);
      setError("");
      const res = await fetch(`${API}/api/workflow/${installationId}/rueckfrage-response/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          responseId: draft.id,
          subject: editSubject,
          body: editBody,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Fehler ${res.status}`);
      }
      setSuccess("Antwort gesendet!");
      setTimeout(() => { onApproved(); onClose(); }, 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  async function handleReject() {
    if (!draft) return;
    try {
      setSending(true);
      setError("");
      const res = await fetch(`${API}/api/workflow/${installationId}/rueckfrage-response/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ responseId: draft.id }),
      });
      if (!res.ok) throw new Error("Fehler beim Ablehnen");
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20,
  };

  const panelStyle: React.CSSProperties = {
    background: "linear-gradient(145deg, #0f1225 0%, #0a0d1a 100%)",
    border: "1px solid rgba(34,197,94,0.15)",
    borderRadius: 16, width: "100%", maxWidth: 640,
    maxHeight: "85vh", overflow: "auto",
    boxShadow: "0 0 60px rgba(34,197,94,0.08), 0 25px 50px rgba(0,0,0,0.5)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(15,15,30,0.8)",
    border: "1px solid rgba(212,168,67,0.12)", borderRadius: 8,
    padding: "10px 14px", color: "#e2e8f0", fontSize: 13,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panelStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(212,168,67,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>Rückfrage-Entwurf freigeben</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{publicId} — {customerName}</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#94a3b8", cursor: "pointer", padding: "6px 12px", fontSize: 16 }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
              <div style={{ fontSize: 24, marginBottom: 8, animation: "dotPulse 1s infinite" }}>✉️</div>
              Entwurf laden...
            </div>
          )}

          {error && !draft && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>❌</div>
              <div style={{ fontSize: 13, color: "#ef4444" }}>{error}</div>
            </div>
          )}

          {success && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#22c55e" }}>{success}</div>
            </div>
          )}

          {draft && !success && (
            <>
              {/* Analyse-Info */}
              {draft.analysisData?.items && draft.analysisData.items.length > 0 && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(212,168,67,0.06)", borderRadius: 10, border: "1px solid rgba(212,168,67,0.1)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#EAD068", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Erkannte Rückfrage-Themen</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {draft.analysisData.items.map((t, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: "rgba(212,168,67,0.1)", color: "#a5b4fc", fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Empfänger */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>An</div>
                <div style={{ fontSize: 13, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>{draft.recipientEmail || "—"}</div>
              </div>

              {/* Subject editierbar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Betreff</div>
                <input value={editSubject} onChange={e => setEditSubject(e.target.value)} style={inputStyle} />
              </div>

              {/* Body editierbar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Nachricht</div>
                <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={12}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
              </div>

              {/* Dokumente */}
              {draft.generatedDocs && draft.generatedDocs.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Anhänge ({draft.generatedDocs.length})</div>
                  {draft.generatedDocs.map((doc, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(34,197,94,0.05)", borderRadius: 8, marginBottom: 4, border: "1px solid rgba(34,197,94,0.08)" }}>
                      <span style={{ fontSize: 14 }}>📎</span>
                      <span style={{ fontSize: 12, color: "#e2e8f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.filename}</span>
                      <span style={{ fontSize: 9, color: doc.fromInstallation ? "#22c55e" : "#f59e0b", fontWeight: 600 }}>{doc.fromInstallation ? "Eigenes Projekt" : "Andere Quelle"}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ padding: "8px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, color: "#ef4444", fontSize: 12, marginBottom: 14 }}>{error}</div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={handleReject} disabled={sending}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: sending ? "wait" : "pointer", fontFamily: "inherit", opacity: sending ? 0.5 : 1 }}>
                  Ablehnen
                </button>
                <button onClick={handleApprove} disabled={sending}
                  style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: sending ? "wait" : "pointer", fontFamily: "inherit", boxShadow: "0 0 20px rgba(34,197,94,0.3)", opacity: sending ? 0.5 : 1 }}>
                  {sending ? "Sende..." : "Freigeben + Senden"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
