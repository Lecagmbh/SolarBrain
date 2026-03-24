// Admin-Tab: HV-Vertragsverwaltung (Templates, Akzeptanzen, Audit-Log, Status)

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../../modules/api/client";

/* ═══════════ Types ═══════════ */

interface ContractTemplate {
  id: number;
  version: string;
  title: string;
  description: string | null;
  pdfHash: string;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  createdBy: { id: number; name: string | null; email: string };
  _count: { acceptances: number };
}

interface Acceptance {
  id: number;
  acceptedAt: string;
  ipAddress: string;
  contractVersionAtAcceptance: string;
  revokedAt: string | null;
  revokeReason: string | null;
  handelsvertreter: {
    id: number;
    firmenName: string | null;
    user: { id: number; name: string | null; email: string };
  };
}

interface AuditEntry {
  id: number;
  handelsvertreterId: number | null;
  action: string;
  ipAddress: string | null;
  userId: number | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  contractTemplate: { version: string; title: string } | null;
}

interface ContractStatus {
  activeTemplate: ContractTemplate | null;
  accepted: Array<{ id: number; user: { name: string | null; email: string }; acceptedAt?: string }>;
  pending: Array<{ id: number; user: { name: string | null; email: string } }>;
}

type SubView = "overview" | "templates" | "acceptances" | "audit";

/* ═══════════ Styles ═══════════ */

const s = {
  container: { display: "flex", flexDirection: "column" as const, gap: "1.5rem" },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "1.5rem",
  },
  h3: { margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#fff" },
  subtitle: { margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#71717a" },
  tabRow: { display: "flex", gap: "0.375rem", flexWrap: "wrap" as const },
  tab: (active: boolean) => ({
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    fontSize: "0.83rem",
    fontWeight: 500,
    cursor: "pointer",
    border: active ? "none" : "1px solid rgba(255,255,255,0.1)",
    background: active ? "linear-gradient(135deg, #D4A843, #EAD068)" : "rgba(255,255,255,0.05)",
    color: active ? "#fff" : "#a1a1aa",
  }),
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: {
    padding: "10px 14px", textAlign: "left" as const, fontSize: "0.7rem",
    fontWeight: 600, color: "#71717a", textTransform: "uppercase" as const,
    letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  td: { padding: "10px 14px", fontSize: "0.83rem", color: "#e2e8f0", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  badge: (color: string, bg: string) => ({
    display: "inline-flex", padding: "0.2rem 0.5rem", borderRadius: "6px",
    fontSize: "0.73rem", fontWeight: 600, color, background: bg,
  }),
  btnPrimary: {
    display: "inline-flex", alignItems: "center", gap: "0.5rem",
    background: "linear-gradient(135deg, #D4A843, #EAD068)", border: "none",
    color: "#fff", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.83rem",
    fontWeight: 500, cursor: "pointer",
  },
  btnSmall: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#a1a1aa", padding: "0.375rem 0.75rem", borderRadius: "6px", fontSize: "0.78rem", cursor: "pointer",
  },
  btnDanger: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
    color: "#ef4444", padding: "0.375rem 0.75rem", borderRadius: "6px", fontSize: "0.78rem", cursor: "pointer",
  },
  statBox: {
    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.25rem",
    padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.06)", flex: "1",
  },
  statNum: { fontSize: "1.75rem", fontWeight: 700, color: "#fff" },
  statLabel: { fontSize: "0.75rem", color: "#71717a" },
  formGroup: { marginBottom: "1rem" },
  formLabel: { display: "block", fontSize: "0.83rem", color: "#a1a1aa", marginBottom: "0.375rem" },
  formInput: {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", color: "#e2e8f0", padding: "0.5rem 0.75rem", fontSize: "0.83rem",
    outline: "none", boxSizing: "border-box" as const,
  },
  overlay: {
    position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 1000, padding: "1rem",
  },
  modal: {
    background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "85vh", overflowY: "auto" as const,
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  modalBody: { padding: "1.25rem" },
  modalFooter: {
    display: "flex", justifyContent: "flex-end", gap: "0.75rem",
    padding: "1rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  empty: { textAlign: "center" as const, padding: "2rem", color: "#71717a", fontSize: "0.85rem" },
  error: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "8px", padding: "0.75rem 1rem", color: "#fca5a5", fontSize: "0.85rem",
  },
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDateTime = (d: string) => new Date(d).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/* ═══════════ Component ═══════════ */

export function HvContractAdminTab() {
  const [subView, setSubView] = useState<SubView>("overview");
  const [status, setStatus] = useState<ContractStatus | null>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [acceptances, setAcceptances] = useState<Acceptance[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get("/admin/hv-contracts/status");
      setStatus(res.data.data);
    } catch { /* ignore */ }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await api.get("/admin/hv-contracts");
      setTemplates(res.data.data || []);
    } catch { /* ignore */ }
  }, []);

  const fetchAcceptances = useCallback(async (templateId: number) => {
    try {
      const res = await api.get(`/admin/hv-contracts/${templateId}/acceptances`);
      setAcceptances(res.data.data || []);
    } catch { /* ignore */ }
  }, []);

  const fetchAudit = useCallback(async (page = 1) => {
    try {
      const res = await api.get("/admin/hv-contracts/audit-log", { params: { page, limit: 50 } });
      setAuditLog(res.data.rows || []);
      setAuditPagination({ page: res.data.page, total: res.data.total, totalPages: res.data.totalPages });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStatus(), fetchTemplates()]).finally(() => setLoading(false));
  }, [fetchStatus, fetchTemplates]);

  useEffect(() => {
    if (subView === "audit") fetchAudit();
  }, [subView, fetchAudit]);

  useEffect(() => {
    if (selectedTemplateId) fetchAcceptances(selectedTemplateId);
  }, [selectedTemplateId, fetchAcceptances]);

  const handleActivate = async (id: number) => {
    if (!confirm("Template aktivieren? Alle HVs müssen danach den neuen Vertrag akzeptieren.")) return;
    try {
      setError(null);
      await api.put(`/admin/hv-contracts/${id}/activate`);
      await Promise.all([fetchTemplates(), fetchStatus()]);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "Fehler beim Aktivieren");
    }
  };

  const handleRevoke = async (acceptanceId: number) => {
    const reason = prompt("Grund für den Widerruf:");
    if (!reason) return;
    try {
      setError(null);
      await api.post(`/admin/hv-contracts/acceptances/${acceptanceId}/revoke`, { reason });
      if (selectedTemplateId) await fetchAcceptances(selectedTemplateId);
      await fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || "Fehler beim Widerrufen");
    }
  };

  if (loading) {
    return <div style={s.empty}>Laden...</div>;
  }

  return (
    <div style={s.container}>
      {error && <div style={s.error}>{error}</div>}

      {/* Sub-Navigation */}
      <div style={s.tabRow}>
        {(["overview", "templates", "acceptances", "audit"] as SubView[]).map((v) => (
          <button key={v} style={s.tab(subView === v)} onClick={() => setSubView(v)}>
            {{ overview: "Übersicht", templates: "Vorlagen", acceptances: "Akzeptanzen", audit: "Audit-Log" }[v]}
          </button>
        ))}
      </div>

      {/* ─── Overview ─── */}
      {subView === "overview" && status && (
        <>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={s.statBox}>
              <span style={{ ...s.statNum, color: "#D4A843" }}>{status.activeTemplate?.version || "—"}</span>
              <span style={s.statLabel}>Aktive Version</span>
            </div>
            <div style={s.statBox}>
              <span style={{ ...s.statNum, color: "#22c55e" }}>{status.accepted.length}</span>
              <span style={s.statLabel}>Akzeptiert</span>
            </div>
            <div style={s.statBox}>
              <span style={{ ...s.statNum, color: status.pending.length > 0 ? "#f59e0b" : "#22c55e" }}>{status.pending.length}</span>
              <span style={s.statLabel}>Ausstehend</span>
            </div>
          </div>

          {status.pending.length > 0 && (
            <div style={s.card}>
              <h3 style={{ ...s.h3, marginBottom: "1rem", color: "#f59e0b" }}>Ausstehende Vertragsannahmen</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Name</th>
                      <th style={s.th}>E-Mail</th>
                      <th style={s.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.pending.map((hv) => (
                      <tr key={hv.id}>
                        <td style={s.td}>{hv.user.name || "—"}</td>
                        <td style={s.td}>{hv.user.email}</td>
                        <td style={s.td}><span style={s.badge("#f59e0b", "rgba(245,158,11,0.15)")}>ausstehend</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {status.accepted.length > 0 && (
            <div style={s.card}>
              <h3 style={{ ...s.h3, marginBottom: "1rem", color: "#22c55e" }}>Vertrag akzeptiert</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Name</th>
                      <th style={s.th}>E-Mail</th>
                      <th style={s.th}>Akzeptiert am</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.accepted.map((hv) => (
                      <tr key={hv.id}>
                        <td style={s.td}>{hv.user.name || "—"}</td>
                        <td style={s.td}>{hv.user.email}</td>
                        <td style={s.td}>{hv.acceptedAt ? fmtDateTime(hv.acceptedAt as string) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Templates ─── */}
      {subView === "templates" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={s.h3}>Vertragsvorlagen</h3>
            <button style={s.btnPrimary} onClick={() => setShowUpload(true)}>+ Neue Vorlage</button>
          </div>

          <div style={{ overflowX: "auto", ...s.card, padding: 0 }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Version</th>
                  <th style={s.th}>Titel</th>
                  <th style={s.th}>Gültig ab</th>
                  <th style={s.th}>Akzeptanzen</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Erstellt von</th>
                  <th style={s.th}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr><td colSpan={7} style={s.empty}>Keine Vorlagen vorhanden</td></tr>
                ) : templates.map((t) => (
                  <tr key={t.id}>
                    <td style={{ ...s.td, fontWeight: 600, fontFamily: "monospace" }}>{t.version}</td>
                    <td style={s.td}>{t.title}</td>
                    <td style={s.td}>{fmtDate(t.effectiveFrom)}</td>
                    <td style={s.td}>
                      <button style={s.btnSmall} onClick={() => { setSelectedTemplateId(t.id); setSubView("acceptances"); }}>
                        {t._count.acceptances} ansehen
                      </button>
                    </td>
                    <td style={s.td}>
                      {t.isActive
                        ? <span style={s.badge("#22c55e", "rgba(16,185,129,0.15)")}>aktiv</span>
                        : <span style={s.badge("#71717a", "rgba(113,113,122,0.15)")}>inaktiv</span>}
                    </td>
                    <td style={s.td}>{t.createdBy.name || t.createdBy.email}</td>
                    <td style={s.td}>
                      {!t.isActive && (
                        <button style={s.btnPrimary} onClick={() => handleActivate(t.id)}>Aktivieren</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── Acceptances ─── */}
      {subView === "acceptances" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={s.h3}>Akzeptanzen {selectedTemplateId ? `(Template #${selectedTemplateId})` : "(alle)"}</h3>
            {selectedTemplateId && (
              <button style={s.btnSmall} onClick={() => setSelectedTemplateId(null)}>Alle zeigen</button>
            )}
          </div>

          <div style={{ overflowX: "auto", ...s.card, padding: 0 }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>HV</th>
                  <th style={s.th}>E-Mail</th>
                  <th style={s.th}>Version</th>
                  <th style={s.th}>Akzeptiert am</th>
                  <th style={s.th}>IP</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {acceptances.length === 0 ? (
                  <tr><td colSpan={7} style={s.empty}>Keine Akzeptanzen vorhanden</td></tr>
                ) : acceptances.map((a) => (
                  <tr key={a.id}>
                    <td style={s.td}>{a.handelsvertreter.user.name || a.handelsvertreter.firmenName || "—"}</td>
                    <td style={s.td}>{a.handelsvertreter.user.email}</td>
                    <td style={{ ...s.td, fontFamily: "monospace" }}>{a.contractVersionAtAcceptance}</td>
                    <td style={s.td}>{fmtDateTime(a.acceptedAt)}</td>
                    <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.75rem" }}>{a.ipAddress}</td>
                    <td style={s.td}>
                      {a.revokedAt
                        ? <span style={s.badge("#ef4444", "rgba(239,68,68,0.15)")}>widerrufen</span>
                        : <span style={s.badge("#22c55e", "rgba(16,185,129,0.15)")}>gültig</span>}
                    </td>
                    <td style={s.td}>
                      {!a.revokedAt && (
                        <button style={s.btnDanger} onClick={() => handleRevoke(a.id)}>Widerrufen</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── Audit Log ─── */}
      {subView === "audit" && (
        <>
          <h3 style={s.h3}>Audit-Trail</h3>
          <div style={{ overflowX: "auto", ...s.card, padding: 0 }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Zeitpunkt</th>
                  <th style={s.th}>Aktion</th>
                  <th style={s.th}>HV-ID</th>
                  <th style={s.th}>Template</th>
                  <th style={s.th}>IP</th>
                  <th style={s.th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.length === 0 ? (
                  <tr><td colSpan={6} style={s.empty}>Keine Einträge</td></tr>
                ) : auditLog.map((e) => (
                  <tr key={e.id}>
                    <td style={s.td}>{fmtDateTime(e.createdAt)}</td>
                    <td style={s.td}><span style={s.badge("#EAD068", "rgba(212,168,67,0.12)")}>{e.action}</span></td>
                    <td style={s.td}>{e.handelsvertreterId || "—"}</td>
                    <td style={s.td}>{e.contractTemplate?.version || "—"}</td>
                    <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.75rem" }}>{e.ipAddress || "—"}</td>
                    <td style={{ ...s.td, fontSize: "0.75rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {e.details ? JSON.stringify(e.details).substring(0, 80) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {auditPagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", padding: "1rem" }}>
              <button style={s.btnSmall} disabled={auditPagination.page <= 1} onClick={() => fetchAudit(auditPagination.page - 1)}>Zurück</button>
              <span style={{ color: "#71717a", fontSize: "0.83rem" }}>Seite {auditPagination.page} von {auditPagination.totalPages}</span>
              <button style={s.btnSmall} disabled={auditPagination.page >= auditPagination.totalPages} onClick={() => fetchAudit(auditPagination.page + 1)}>Weiter</button>
            </div>
          )}
        </>
      )}

      {/* ─── Upload Modal ─── */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); fetchTemplates(); fetchStatus(); }} />}
    </div>
  );
}

/* ═══════════ Upload Modal ═══════════ */

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [checkboxes, setCheckboxes] = useState([
    { id: "vertrag_gelesen", label: "Ich habe den Handelsvertretervertrag vollständig gelesen und verstanden." },
    { id: "agb_akzeptiert", label: "Ich akzeptiere die Allgemeinen Geschäftsbedingungen." },
    { id: "datenschutz", label: "Ich stimme der Verarbeitung meiner personenbezogenen Daten gemäß Art. 6 Abs. 1 lit. b DSGVO zu.", legalRef: "Art. 6 Abs. 1 lit. b DSGVO" },
    { id: "geheimhaltung", label: "Ich verpflichte mich zur Geheimhaltung aller vertraulichen Informationen." },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addCheckbox = () => {
    const id = `cb_${Date.now()}`;
    setCheckboxes((prev) => [...prev, { id, label: "" }]);
  };

  const removeCheckbox = (id: string) => {
    setCheckboxes((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCheckboxLabel = (id: string, label: string) => {
    setCheckboxes((prev) => prev.map((c) => (c.id === id ? { ...c, label } : c)));
  };

  const handleSubmit = async () => {
    if (!version || !title || !fileRef.current?.files?.[0]) {
      setError("Version, Titel und PDF sind erforderlich");
      return;
    }
    const validCheckboxes = checkboxes.filter((c) => c.label.trim());
    if (validCheckboxes.length === 0) {
      setError("Mindestens eine Checkbox ist erforderlich");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("version", version);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("effectiveFrom", effectiveFrom);
      formData.append("requiredCheckboxes", JSON.stringify(validCheckboxes));
      formData.append("clauses", JSON.stringify([]));
      formData.append("pdf", fileRef.current.files[0]);

      await api.post("/admin/hv-contracts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "Fehler beim Erstellen");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>Neue Vertragsvorlage</h3>
          <button style={{ background: "transparent", border: "none", color: "#71717a", cursor: "pointer", fontSize: "1.25rem" }} onClick={onClose}>&times;</button>
        </div>
        <div style={s.modalBody}>
          {error && <div style={{ ...s.error, marginBottom: "1rem" }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={s.formGroup}>
              <label style={s.formLabel}>Version *</label>
              <input style={s.formInput} placeholder="z.B. 1.0" value={version} onChange={(e) => setVersion(e.target.value)} />
            </div>
            <div style={s.formGroup}>
              <label style={s.formLabel}>Gültig ab *</label>
              <input style={s.formInput} type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            </div>
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>Titel *</label>
            <input style={s.formInput} placeholder="Handelsvertretervertrag Baunity" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>Beschreibung</label>
            <textarea
              style={{ ...s.formInput, minHeight: "60px", resize: "vertical" }}
              placeholder="Optionale Beschreibung..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>Vertrags-PDF *</label>
            <input ref={fileRef} type="file" accept=".pdf" style={{ color: "#a1a1aa", fontSize: "0.83rem" }} />
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>Pflicht-Checkboxen</label>
            {checkboxes.map((cb) => (
              <div key={cb.id} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center" }}>
                <input
                  style={{ ...s.formInput, flex: 1 }}
                  placeholder="Checkbox-Text..."
                  value={cb.label}
                  onChange={(e) => updateCheckboxLabel(cb.id, e.target.value)}
                />
                <button style={s.btnDanger} onClick={() => removeCheckbox(cb.id)}>&times;</button>
              </div>
            ))}
            <button style={s.btnSmall} onClick={addCheckbox}>+ Checkbox hinzufügen</button>
          </div>
        </div>
        <div style={s.modalFooter}>
          <button style={s.btnSmall} onClick={onClose}>Abbrechen</button>
          <button style={{ ...s.btnPrimary, opacity: submitting ? 0.5 : 1 }} disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Wird erstellt..." : "Vorlage erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HvContractAdminTab;
