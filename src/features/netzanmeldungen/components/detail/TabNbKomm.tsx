/**
 * NB-Kommunikation Tab — Vollständiger Email-Verlauf (ein- und ausgehend)
 * Nutzt /api/nb-communication/installation/:id für Installations
 * und /api/crm/projekte/:id/emails für CRM-Projekte
 */
import { useState, useEffect } from "react";

interface Props { crmId: number; installationId?: number }

interface Correspondence {
  id: number;
  type: string;
  direction: "outgoing" | "incoming";
  subject: string;
  message?: string;
  sentAt: string;
  sentBy?: string;
  sentTo?: string;
  responseType?: string | null;
  responseNote?: string;
  notes?: string;
  documents?: { id: number; name: string }[];
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  erstanmeldung: { label: "Erstanmeldung", icon: "📨", color: "#3b82f6" },
  nachfrage: { label: "Nachfrage", icon: "🔔", color: "#f59e0b" },
  nachfrage_1: { label: "1. Nachfrage", icon: "🔔", color: "#f59e0b" },
  nachfrage_2: { label: "2. Nachfrage", icon: "🔔", color: "#f97316" },
  nachfrage_3: { label: "3. Nachfrage", icon: "⚠️", color: "#ef4444" },
  antwort: { label: "NB-Antwort", icon: "📩", color: "#22c55e" },
  rueckfrage_antwort: { label: "Rückfrage-Antwort", icon: "💬", color: "#EAD068" },
  dokument_nachreichung: { label: "Dokument-Nachreichung", icon: "📄", color: "#06b6d4" },
  stornierung: { label: "Stornierung", icon: "🚫", color: "#ef4444" },
  admin_alert: { label: "Admin-Alert", icon: "🚨", color: "#ef4444" },
  email: { label: "E-Mail", icon: "📧", color: "#64748b" },
  portal: { label: "Portal", icon: "🌐", color: "#06b6d4" },
};

const RESPONSE_LABELS: Record<string, { label: string; color: string }> = {
  genehmigt: { label: "✅ Genehmigt", color: "#22c55e" },
  rueckfrage: { label: "❓ Rückfrage", color: "#f59e0b" },
  abgelehnt: { label: "❌ Abgelehnt", color: "#ef4444" },
};

export default function TabNbKomm({ crmId, installationId }: Props) {
  const [items, setItems] = useState<Correspondence[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loadingBody, setLoadingBody] = useState<number | null>(null);
  const [loadedBodies, setLoadedBodies] = useState<Record<number, string>>({});
  const [nbLoading, setNbLoading] = useState(false);
  const [nbPreview, setNbPreview] = useState<{ betreff: string; htmlBody: string; nbEmail: string; nbName: string } | null>(null);
  const [nbSending, setNbSending] = useState(false);
  const [nbMsg, setNbMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("baunity_token") || "";
    const hdrs: Record<string, string> = { Authorization: `Bearer ${token}` };

    const loadData = async () => {
      setLoading(true);
      try {
        if (installationId) {
          // Für Installations: NB-Communication API (hat ein- und ausgehende Mails)
          const resp = await fetch(`/api/nb-communication/installation/${installationId}`, { headers: hdrs, credentials: "include" });
          if (resp.ok) {
            const data = await resp.json();
            const corrs = Array.isArray(data) ? data : data.data || data.correspondences || [];
            setItems(corrs.map((c: any) => {
              const body = c.bodyPreview || c.message || c.textBody || c.notes || "";
              return {
                id: c.id,
                type: (c.type || "email").toLowerCase(),
                direction: c.direction || (c.responseAt ? "incoming" : "outgoing"),
                subject: c.subject || c.betreff || TYPE_CONFIG[(c.type || "").toLowerCase()]?.label || "E-Mail",
                message: body,
                sentAt: c.sentAt || c.createdAt,
                sentBy: c.sentBy || c.von || "",
                sentTo: c.sentTo || c.an || "",
                responseType: c.responseType ? (c.responseType || "").toLowerCase() : null,
                responseNote: c.responseNote || "",
                documents: c.documents || [],
              };
            }));
          }

          // Zusätzlich: Eingehende Emails von der Email-API laden
          try {
            const emailResp = await fetch(`/api/installations/${installationId}/emails`, { headers: hdrs, credentials: "include" });
            if (emailResp.ok) {
              const emailData = await emailResp.json();
              const emails = Array.isArray(emailData) ? emailData : emailData.data || [];
              if (emails.length > 0) {
                setItems(prev => {
                  const existingIds = new Set(prev.map(p => p.id));
                  const newEmails = emails
                    .filter((e: any) => !existingIds.has(e.id))
                    .map((e: any) => ({
                      id: e.id + 100000,
                      type: "email" as const,
                      direction: (e.direction === "incoming" || e.richtung === "EIN") ? "incoming" as const : "outgoing" as const,
                      subject: e.subject || e.betreff || "E-Mail",
                      message: e.bodyText || e.bodyPreview || "",
                      sentAt: e.sentAt || e.receivedAt || e.createdAt,
                      sentBy: e.from || e.von || "",
                      sentTo: e.to || e.an || "",
                      responseType: null as Correspondence["responseType"],
                      responseNote: "",
                      documents: [],
                    }));
                  return [...prev, ...newEmails].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
                });
              }
            }
          } catch { /* Emails-Endpoint optional */ }

        } else if (crmId) {
          // Für CRM: Emails-API
          const resp = await fetch(`/api/crm/projekte/${crmId}/emails`, { headers: hdrs, credentials: "include" });
          if (resp.ok) {
            const data = await resp.json();
            const emails = Array.isArray(data) ? data : data.data || [];
            setItems(emails.map((e: any) => ({
              id: e.id,
              type: "email",
              direction: (e.direction === "incoming" || e.richtung === "EIN") ? "incoming" as const : "outgoing" as const,
              subject: e.subject || e.betreff || "E-Mail",
              message: e.bodyText || e.textBody || e.bodyPreview || "",
              sentAt: e.sentAt || e.receivedAt || e.createdAt,
              sentBy: e.from || e.von || "",
              sentTo: e.to || e.an || "",
              responseType: null,
              responseNote: "",
              documents: [],
            })));
          }
        }
      } catch (err) {
        console.error("NB-Kommunikation laden fehlgeschlagen:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [crmId, installationId]);

  // Email-Body on-demand laden
  const [bodyErrors, setBodyErrors] = useState<Record<number, boolean>>({});

  const loadBody = async (itemId: number) => {
    if (loadedBodies[itemId] || bodyErrors[itemId]) return;
    setLoadingBody(itemId);
    try {
      const token = localStorage.getItem("baunity_token") || "";
      const resp = await fetch(`/api/nb-communication/correspondence/${itemId}/body`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.body) {
          setLoadedBodies(prev => ({ ...prev, [itemId]: data.body }));
        } else {
          setBodyErrors(prev => ({ ...prev, [itemId]: true }));
        }
      } else {
        setBodyErrors(prev => ({ ...prev, [itemId]: true }));
      }
    } catch {
      setBodyErrors(prev => ({ ...prev, [itemId]: true }));
    }
    setLoadingBody(null);
  };

  const handleToggle = (item: Correspondence) => {
    if (expandedId === item.id) {
      setExpandedId(null);
    } else {
      setExpandedId(item.id);
      // Body laden wenn noch nicht vorhanden
      if (!item.message && !loadedBodies[item.id] && !bodyErrors[item.id]) {
        loadBody(item.id);
      }
    }
  };

  if (loading) return <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>Laden...</div>;

  const incoming = items.filter(i => i.direction === "incoming").length;
  const outgoing = items.filter(i => i.direction === "outgoing").length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>📧 NB-Kommunikation</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            {items.length} Einträge · {incoming} empfangen · {outgoing} gesendet
          </div>
        </div>
        {installationId && (
          <button
            disabled={nbLoading}
            onClick={async () => {
              setNbLoading(true);
              setNbMsg(null);
              try {
                const res = await fetch(`/api/crm/nb-anfrage/render/${installationId}`, { credentials: "include" });
                if (!res.ok) { setNbMsg({ text: "Keine Vorlage (CRM-Verknüpfung fehlt)", type: "err" }); return; }
                const data = await res.json();
                setNbPreview(data);
              } catch { setNbMsg({ text: "Fehler beim Laden", type: "err" }); }
              finally { setNbLoading(false); }
            }}
            style={{
              padding: "8px 16px", fontSize: 12, fontWeight: 700,
              background: "linear-gradient(135deg, #1565c0, #1976d2)", color: "#fff",
              border: "none", borderRadius: 8, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(21,101,192,0.3)",
            }}
          >
            {nbLoading ? "Laden..." : "📨 NB-Anfrage erstellen"}
          </button>
        )}
      </div>

      {/* NB-Anfrage Vorschau */}
      {nbMsg && (
        <div style={{ padding: "8px 14px", marginBottom: 10, borderRadius: 8, fontSize: 12, fontWeight: 600, background: nbMsg.type === "ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: nbMsg.type === "ok" ? "#22c55e" : "#ef4444", border: `1px solid ${nbMsg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
          {nbMsg.text}
        </div>
      )}
      {nbPreview && (
        <div style={{ background: "rgba(21,101,192,0.05)", border: "1px solid rgba(21,101,192,0.15)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#93c5fd", marginBottom: 8 }}>📨 NB-Anfrage Vorschau</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
            <strong>An:</strong> {nbPreview.nbName} ({nbPreview.nbEmail || "Keine Email gefunden"})
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
            <strong>Betreff:</strong> {nbPreview.betreff}
          </div>
          <div style={{ background: "#fff", borderRadius: 6, padding: 12, maxHeight: 300, overflow: "auto", fontSize: 12 }}>
            <div dangerouslySetInnerHTML={{ __html: nbPreview.htmlBody }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              disabled={nbSending || !nbPreview.nbEmail}
              onClick={async () => {
                if (!nbPreview.nbEmail) return;
                if (!confirm(`Netzanschlussanfrage an ${nbPreview.nbName} (${nbPreview.nbEmail}) senden?\n\nVDE E.1 + E.8 werden als PDF angehängt.`)) return;
                setNbSending(true);
                try {
                  const res = await fetch(`/api/vde-center/html-send/${installationId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      to: nbPreview.nbEmail,
                      subject: nbPreview.betreff,
                      message: nbPreview.htmlBody,
                      norm: "4110",
                      forms: ["E1", "E8"],
                    }),
                  });
                  if (res.ok) {
                    setNbMsg({ text: `NB-Anfrage an ${nbPreview.nbEmail} gesendet!`, type: "ok" });
                    setNbPreview(null);
                  } else {
                    setNbMsg({ text: "Senden fehlgeschlagen", type: "err" });
                  }
                } catch { setNbMsg({ text: "Senden fehlgeschlagen", type: "err" }); }
                finally { setNbSending(false); }
              }}
              style={{
                padding: "8px 20px", fontSize: 12, fontWeight: 700,
                background: nbPreview.nbEmail ? "linear-gradient(135deg, #2e7d32, #388e3c)" : "#374151",
                color: "#fff", border: "none", borderRadius: 8, cursor: nbPreview.nbEmail ? "pointer" : "not-allowed",
              }}
            >
              {nbSending ? "Sende..." : `An ${nbPreview.nbName || "NB"} senden`}
            </button>
            <button
              onClick={() => setNbPreview(null)}
              style={{ padding: "8px 16px", fontSize: 12, background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, cursor: "pointer" }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {items.length > 0 ? (
        <div>
          {items.map(item => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.email;
            const isIncoming = item.direction === "incoming";
            const isExpanded = expandedId === item.id;
            const resp = item.responseType ? RESPONSE_LABELS[item.responseType] : null;

            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item)}
                style={{
                  padding: "12px 16px",
                  background: "rgba(17,20,35,0.95)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  borderRadius: 10,
                  marginBottom: 6,
                  borderLeft: `3px solid ${isIncoming ? "#38bdf8" : config.color}`,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(17,20,35,1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(17,20,35,0.95)")}
              >
                {/* Top Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                      background: isIncoming ? "rgba(56,189,248,0.1)" : `${config.color}15`,
                      color: isIncoming ? "#38bdf8" : config.color,
                    }}>
                      {isIncoming ? "📨 Empfangen" : `${config.icon} ${config.label}`}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.subject}
                    </span>
                    {resp && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: resp.color, flexShrink: 0 }}>{resp.label}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: "#475569", flexShrink: 0, marginLeft: 8 }}>
                    {new Date(item.sentAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    {" "}
                    {new Date(item.sentAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Von/An */}
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {isIncoming
                    ? `Von: ${item.sentBy || "Netzbetreiber"}`
                    : `An: ${item.sentTo || "Netzbetreiber"}`
                  }
                  {item.sentBy && !isIncoming && ` · Gesendet von: ${item.sentBy}`}
                </div>

                {/* Dokumente */}
                {item.documents && item.documents.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                    {item.documents.map(doc => (
                      <span key={doc.id} style={{ fontSize: 9, padding: "2px 6px", background: "rgba(212,168,67,0.08)", borderRadius: 3, color: "#a5b4fc" }}>
                        📎 {doc.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (() => {
                  const body = item.message || loadedBodies[item.id];
                  const isLoadingThis = loadingBody === item.id;
                  return (
                    <div style={{ marginTop: 8 }}>
                      {/* Metadaten */}
                      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#64748b", marginBottom: 6, flexWrap: "wrap" }}>
                        {item.sentBy && <span>Von: {item.sentBy === "AUTO" ? "Automatisch (System)" : item.sentBy}</span>}
                        {item.sentTo && <span>An: {item.sentTo}</span>}
                        <span>{new Date(item.sentAt).toLocaleString("de-DE")}</span>
                      </div>
                      {/* Loading */}
                      {isLoadingThis && (
                        <div style={{ fontSize: 12, color: "#64748b", padding: "12px 14px", textAlign: "center" }}>
                          ⏳ Email-Inhalt wird geladen...
                        </div>
                      )}
                      {/* Message Body */}
                      {!isLoadingThis && body && (
                        <div style={{
                          fontSize: 12, color: "#b0b0c0", padding: "10px 14px",
                          background: "rgba(0,0,0,0.2)", borderRadius: 8, lineHeight: 1.7,
                          maxHeight: 400, overflowY: "auto", whiteSpace: "pre-wrap",
                        }}>
                          {body}
                        </div>
                      )}
                      {/* Kein Body / Fehler */}
                      {!isLoadingThis && !body && bodyErrors[item.id] && (
                        <div style={{ fontSize: 12, color: "#f97316", padding: "10px 14px", background: "rgba(249,115,22,0.06)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                          <span>⚠ Email-Inhalt konnte nicht geladen werden</span>
                          <button onClick={(e) => { e.stopPropagation(); setBodyErrors(prev => { const n = {...prev}; delete n[item.id]; return n; }); loadBody(item.id); }}
                            style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 4, padding: "2px 8px", fontSize: 10, color: "#f97316", cursor: "pointer" }}>
                            ↻ Erneut
                          </button>
                        </div>
                      )}
                      {!isLoadingThis && !body && !bodyErrors[item.id] && (
                        <div style={{ fontSize: 12, color: "#475569", padding: "10px 14px", background: "rgba(0,0,0,0.1)", borderRadius: 8 }}>
                          Email-Inhalt nicht verfügbar — Template: {item.type.toUpperCase()}
                        </div>
                      )}
                      {/* Response Note */}
                      {item.responseNote && (
                        <div style={{
                          fontSize: 11, color: "#f59e0b", marginTop: 6, padding: "6px 10px",
                          background: "rgba(245,158,11,0.06)", borderRadius: 6, borderLeft: "2px solid #f59e0b",
                        }}>
                          💬 {item.responseNote}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📧</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>Keine NB-Kommunikation</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {installationId
              ? "Eingehende und ausgehende Emails mit dem Netzbetreiber werden hier angezeigt."
              : "Verknüpfen Sie eine Netzanmeldung um die NB-Kommunikation zu sehen."
            }
          </div>
        </div>
      )}
    </div>
  );
}
