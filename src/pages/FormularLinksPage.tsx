/**
 * FormularLinksPage - Verwaltung externer Formular-Links und Einreichungen
 * Staff sieht alles, Kunden nur ihre eigenen Links/Submissions
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Search, RefreshCw, Edit2, Trash2, X, AlertTriangle,
  Copy, Check, ChevronDown, ChevronRight, ExternalLink, XCircle, ArrowRight,
} from "lucide-react";
import { useAuth } from "../modules/auth/AuthContext";
import { api } from "../modules/api/client";
import "./formular-links.css";

// ─── Types ──────────────────────────────────────────────────────────────────

interface FormularLink {
  id: number;
  slug: string;
  title: string | null;
  kundeId: number;
  isActive: boolean;
  viewCount: number;
  welcomeText: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { submissions: number };
  kunde?: { name: string; firmenName: string | null };
}

interface FormularSubmission {
  id: number;
  formularLinkId: number;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  totalKwp: number | null;
  data: Record<string, unknown>;
  installationId: number | null;
  rejectionReason: string | null;
  submittedAt: string;
  convertedAt: string | null;
  formularLink?: { slug: string; title: string | null };
}

interface KundeOption {
  id: number;
  name: string;
  firmenName: string | null;
}

type TabId = "links" | "submissions";

const EMPTY_LINK_FORM = { slug: "", title: "", welcomeText: "", kundeId: 0 };

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (d: string | null): string => {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
};

const FORMULAR_BASE_URL = "https://baunity.de/formular";

// ─── Component ──────────────────────────────────────────────────────────────

export default function FormularLinksPage() {
  const { user: authUser } = useAuth();
  const userRole = ((authUser as Record<string, unknown>)?.role as string || "KUNDE").toUpperCase();
  const userKundeId = (authUser as Record<string, unknown>)?.kundeId as number | undefined;
  const isStaff = userRole === "ADMIN" || userRole === "MITARBEITER";

  // ─── State ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<TabId>("links");
  const [toast, setToast] = useState<{ type: "ok" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Links state
  const [links, setLinks] = useState<FormularLink[]>([]);
  const [linksTotal, setLinksTotal] = useState(0);

  // Submissions state
  const [submissions, setSubmissions] = useState<FormularSubmission[]>([]);
  const [subsTotal, setSubsTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedSubId, setExpandedSubId] = useState<number | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLink, setEditingLink] = useState<FormularLink | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<FormularLink | null>(null);
  const [rejectModal, setRejectModal] = useState<FormularSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState(EMPTY_LINK_FORM);

  // Kunden-Dropdown (nur Staff)
  const [kunden, setKunden] = useState<KundeOption[]>([]);

  // Copied slug
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ─── Fetch Links ────────────────────────────────────────────────────────
  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/formulare/links");
      const data = res.data as { links?: FormularLink[]; data?: FormularLink[] };
      const items = data.links || data.data || (Array.isArray(res.data) ? res.data as FormularLink[] : []);
      setLinks(items);
      setLinksTotal(items.length);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Links konnten nicht geladen werden";
      setToast({ type: "error", msg });
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch Submissions ──────────────────────────────────────────────────
  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await api.get(`/formulare/submissions${params}`);
      const data = res.data as { submissions?: FormularSubmission[]; data?: FormularSubmission[] };
      const items = data.submissions || data.data || (Array.isArray(res.data) ? res.data as FormularSubmission[] : []);
      setSubmissions(items);
      setSubsTotal(items.length);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Einreichungen konnten nicht geladen werden";
      setToast({ type: "error", msg });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // ─── Fetch Kunden (Staff only) ──────────────────────────────────────────
  const fetchKunden = useCallback(async () => {
    if (!isStaff) return;
    try {
      const res = await api.get("/kunden?limit=500");
      const data = res.data as { data?: KundeOption[]; kunden?: KundeOption[] };
      setKunden(data.data || data.kunden || []);
    } catch {
      // Non-critical
    }
  }, [isStaff]);

  // Initial load
  useEffect(() => {
    if (tab === "links") fetchLinks();
    else fetchSubmissions();
  }, [tab, fetchLinks, fetchSubmissions]);

  useEffect(() => { fetchKunden(); }, [fetchKunden]);

  // ─── Create Link ────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim()) return;
    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        slug: form.slug.trim().toLowerCase(),
        title: form.title.trim() || undefined,
        welcomeText: form.welcomeText.trim() || undefined,
      };
      if (isStaff && form.kundeId > 0) {
        payload.kundeId = form.kundeId;
      }
      await api.post("/formulare/links", payload);
      setToast({ type: "ok", msg: "Link erstellt!" });
      setShowCreateModal(false);
      setForm(EMPTY_LINK_FORM);
      fetchLinks();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Link konnte nicht erstellt werden";
      setToast({ type: "error", msg });
    } finally {
      setSaving(false);
    }
  };

  // ─── Update Link ────────────────────────────────────────────────────────
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;
    try {
      setSaving(true);
      await api.patch(`/formulare/links/${editingLink.id}`, {
        slug: form.slug.trim().toLowerCase() || undefined,
        title: form.title.trim() || null,
        welcomeText: form.welcomeText.trim() || null,
      });
      setToast({ type: "ok", msg: "Link aktualisiert!" });
      setEditingLink(null);
      fetchLinks();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Link konnte nicht aktualisiert werden";
      setToast({ type: "error", msg });
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle Active ──────────────────────────────────────────────────────
  const handleToggleActive = async (link: FormularLink) => {
    try {
      await api.patch(`/formulare/links/${link.id}`, { isActive: !link.isActive });
      setToast({ type: "ok", msg: link.isActive ? "Link deaktiviert" : "Link aktiviert" });
      fetchLinks();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Status konnte nicht geändert werden";
      setToast({ type: "error", msg });
    }
  };

  // ─── Delete Link ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setSaving(true);
      await api.delete(`/formulare/links/${deleteConfirm.id}`);
      setToast({ type: "ok", msg: "Link gelöscht" });
      setDeleteConfirm(null);
      fetchLinks();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Link konnte nicht gelöscht werden";
      setToast({ type: "error", msg });
    } finally {
      setSaving(false);
    }
  };

  // ─── Copy URL ───────────────────────────────────────────────────────────
  const handleCopyUrl = (link: FormularLink) => {
    navigator.clipboard.writeText(`${FORMULAR_BASE_URL}/${link.slug}`);
    setCopiedId(link.id);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── Convert Submission ─────────────────────────────────────────────────
  const handleConvert = async (sub: FormularSubmission) => {
    try {
      setSaving(true);
      const res = await api.post(`/formulare/submissions/${sub.id}/convert`);
      const result = res.data as { installation?: { publicId?: string } };
      const publicId = result.installation?.publicId || "";
      setToast({ type: "ok", msg: `Konvertiert! Installation: ${publicId}` });
      fetchSubmissions();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Konvertierung fehlgeschlagen";
      setToast({ type: "error", msg });
    } finally {
      setSaving(false);
    }
  };

  // ─── Reject Submission ──────────────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      setSaving(true);
      await api.post(`/formulare/submissions/${rejectModal.id}/reject`, {
        reason: rejectReason.trim() || undefined,
      });
      setToast({ type: "ok", msg: "Einreichung abgelehnt" });
      setRejectModal(null);
      setRejectReason("");
      fetchSubmissions();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Ablehnung fehlgeschlagen";
      setToast({ type: "error", msg });
    } finally {
      setSaving(false);
    }
  };

  // ─── Open Edit Modal ────────────────────────────────────────────────────
  const openEdit = (link: FormularLink) => {
    setForm({
      slug: link.slug,
      title: link.title || "",
      welcomeText: link.welcomeText || "",
      kundeId: link.kundeId,
    });
    setEditingLink(link);
  };

  // ─── Render Links Tab ───────────────────────────────────────────────────
  const renderLinksTab = () => (
    <>
      <div className="flp-toolbar">
        <button className="flp-action-btn" onClick={fetchLinks} title="Aktualisieren">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flp-stats">
        <div className="flp-stat">
          <span className="flp-stat-label">Gesamt:</span>
          <span className="flp-stat-value">{linksTotal}</span>
        </div>
        <div className="flp-stat">
          <span className="flp-stat-label">Aktiv:</span>
          <span className="flp-stat-value flp-stat-value--green">{links.filter(l => l.isActive).length}</span>
        </div>
      </div>

      <div className="flp-card">
        <div className="flp-table-wrap">
          <table className="flp-table">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Titel</th>
                {isStaff && <th>Kunde</th>}
                <th>Views</th>
                <th>Einreichungen</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {loading && links.length === 0 ? (
                <tr><td colSpan={isStaff ? 7 : 6}><div className="flp-loading"><div className="flp-spinner" /><span className="flp-loading-text">Lade Links...</span></div></td></tr>
              ) : links.length === 0 ? (
                <tr><td colSpan={isStaff ? 7 : 6}><div className="flp-empty">Keine Links vorhanden. Erstelle deinen ersten Formular-Link!</div></td></tr>
              ) : links.map(link => (
                <tr key={link.id}>
                  <td><span className="flp-slug">{link.slug}</span></td>
                  <td>{link.title || <span style={{ color: "rgba(255,255,255,0.2)" }}>–</span>}</td>
                  {isStaff && (
                    <td style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                      {link.kunde?.firmenName || link.kunde?.name || `#${link.kundeId}`}
                    </td>
                  )}
                  <td>{link.viewCount}</td>
                  <td>
                    <span className="flp-status-badge flp-status-badge--active" style={!link._count?.submissions ? { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" } : undefined}>
                      {link._count?.submissions ?? 0}
                    </span>
                  </td>
                  <td>
                    <label className="flp-toggle" title={link.isActive ? "Aktiv – Klicken zum Deaktivieren" : "Inaktiv – Klicken zum Aktivieren"}>
                      <input type="checkbox" checked={link.isActive} onChange={() => handleToggleActive(link)} />
                      <span className="flp-toggle-slider" />
                    </label>
                  </td>
                  <td>
                    <div className="flp-tbl-actions">
                      <button className="flp-tbl-btn" onClick={() => handleCopyUrl(link)} title="URL kopieren">
                        {copiedId === link.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === link.id ? "Kopiert!" : "URL"}
                      </button>
                      <button className="flp-tbl-btn" onClick={() => openEdit(link)} title="Bearbeiten">
                        <Edit2 size={14} />
                      </button>
                      <button className="flp-tbl-btn flp-tbl-btn--danger" onClick={() => setDeleteConfirm(link)} title="Löschen">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // ─── Render Submissions Tab ─────────────────────────────────────────────
  const renderSubmissionsTab = () => (
    <>
      <div className="flp-toolbar">
        <select className="flp-status-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Alle Status</option>
          <option value="PENDING">Ausstehend</option>
          <option value="CONVERTED">Konvertiert</option>
          <option value="REJECTED">Abgelehnt</option>
        </select>
        <button className="flp-action-btn" onClick={fetchSubmissions} title="Aktualisieren">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flp-stats">
        <div className="flp-stat">
          <span className="flp-stat-label">Gesamt:</span>
          <span className="flp-stat-value">{subsTotal}</span>
        </div>
        <div className="flp-stat">
          <span className="flp-stat-label">Ausstehend:</span>
          <span className="flp-stat-value flp-stat-value--amber">{submissions.filter(s => s.status === "PENDING").length}</span>
        </div>
        <div className="flp-stat">
          <span className="flp-stat-label">Konvertiert:</span>
          <span className="flp-stat-value flp-stat-value--green">{submissions.filter(s => s.status === "CONVERTED").length}</span>
        </div>
      </div>

      <div className="flp-card">
        <div className="flp-table-wrap">
          <table className="flp-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>Name</th>
                <th>E-Mail</th>
                <th>kWp</th>
                <th>Formular</th>
                <th>Datum</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {loading && submissions.length === 0 ? (
                <tr><td colSpan={8}><div className="flp-loading"><div className="flp-spinner" /><span className="flp-loading-text">Lade Einreichungen...</span></div></td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan={8}><div className="flp-empty">Keine Einreichungen vorhanden</div></td></tr>
              ) : submissions.map(sub => {
                const isExpanded = expandedSubId === sub.id;
                return (
                  <SubmissionRow
                    key={sub.id}
                    sub={sub}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedSubId(isExpanded ? null : sub.id)}
                    onConvert={() => handleConvert(sub)}
                    onReject={() => { setRejectModal(sub); setRejectReason(""); }}
                    saving={saving}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // ─── Main Render ────────────────────────────────────────────────────────
  return (
    <div className="flp-page">
      {/* Toast */}
      {toast && (
        <div className={`flp-toast ${toast.type === "ok" ? "flp-toast--ok" : "flp-toast--error"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flp-header">
        <div className="flp-title-wrap">
          <h1 className="flp-title">Formulare</h1>
          <span className="flp-count">{tab === "links" ? linksTotal : subsTotal}</span>
        </div>
        {tab === "links" && (
          <button className="flp-btn-create" onClick={() => { setForm({ ...EMPTY_LINK_FORM, kundeId: userKundeId || 0 }); setShowCreateModal(true); }}>
            <Plus size={16} /> Neuen Link erstellen
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flp-tabs">
        <button className={`flp-tab ${tab === "links" ? "flp-tab--active" : ""}`} onClick={() => setTab("links")}>
          <ExternalLink size={16} />
          Meine Links
          <span className="flp-tab-badge">{linksTotal}</span>
        </button>
        <button className={`flp-tab ${tab === "submissions" ? "flp-tab--active" : ""}`} onClick={() => setTab("submissions")}>
          <ArrowRight size={16} />
          Einreichungen
          <span className="flp-tab-badge">{subsTotal}</span>
        </button>
      </div>

      {/* Tab Content */}
      {tab === "links" ? renderLinksTab() : renderSubmissionsTab()}

      {/* ═══ CREATE MODAL ═══ */}
      {showCreateModal && (
        <div className="flp-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="flp-modal" onClick={e => e.stopPropagation()}>
            <div className="flp-modal-header">
              <h3 className="flp-modal-title">Neuen Formular-Link erstellen</h3>
              <button className="flp-modal-close" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="flp-form">
              <div className="flp-form-group">
                <label className="flp-form-label">Slug *</label>
                <input
                  type="text"
                  required
                  className="flp-form-input"
                  placeholder="mein-formular"
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                />
                <span className="flp-form-hint">URL: {FORMULAR_BASE_URL}/{form.slug || "..."}</span>
              </div>
              <div className="flp-form-group">
                <label className="flp-form-label">Titel</label>
                <input
                  type="text"
                  className="flp-form-input"
                  placeholder="z.B. Netzanmeldung Formular"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="flp-form-group">
                <label className="flp-form-label">Willkommenstext</label>
                <textarea
                  className="flp-form-textarea"
                  placeholder="Begrüßungstext für den Endkunden..."
                  value={form.welcomeText}
                  onChange={e => setForm({ ...form, welcomeText: e.target.value })}
                />
              </div>
              {isStaff && (
                <div className="flp-form-group">
                  <label className="flp-form-label">Kunde</label>
                  <select
                    className="flp-form-select"
                    value={form.kundeId}
                    onChange={e => setForm({ ...form, kundeId: Number(e.target.value) })}
                  >
                    <option value={0}>– Kunde wählen –</option>
                    {kunden.map(k => (
                      <option key={k.id} value={k.id}>{k.firmenName || k.name} (#{k.id})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flp-modal-footer" style={{ padding: 0, border: "none" }}>
                <button type="button" className="flp-btn flp-btn--secondary" onClick={() => setShowCreateModal(false)}>Abbrechen</button>
                <button type="submit" className="flp-btn flp-btn--primary" disabled={saving || !form.slug.trim()}>
                  {saving ? "Erstelle..." : <><Plus size={16} /> Erstellen</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {editingLink && (
        <div className="flp-overlay" onClick={() => setEditingLink(null)}>
          <div className="flp-modal" onClick={e => e.stopPropagation()}>
            <div className="flp-modal-header">
              <h3 className="flp-modal-title">Link bearbeiten</h3>
              <button className="flp-modal-close" onClick={() => setEditingLink(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} className="flp-form">
              <div className="flp-form-group">
                <label className="flp-form-label">Slug</label>
                <input
                  type="text"
                  className="flp-form-input"
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                />
                <span className="flp-form-hint">URL: {FORMULAR_BASE_URL}/{form.slug || "..."}</span>
              </div>
              <div className="flp-form-group">
                <label className="flp-form-label">Titel</label>
                <input
                  type="text"
                  className="flp-form-input"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="flp-form-group">
                <label className="flp-form-label">Willkommenstext</label>
                <textarea
                  className="flp-form-textarea"
                  value={form.welcomeText}
                  onChange={e => setForm({ ...form, welcomeText: e.target.value })}
                />
              </div>
              <div className="flp-modal-footer" style={{ padding: 0, border: "none" }}>
                <button type="button" className="flp-btn flp-btn--secondary" onClick={() => setEditingLink(null)}>Abbrechen</button>
                <button type="submit" className="flp-btn flp-btn--primary" disabled={saving}>
                  {saving ? "Speichere..." : <><Check size={16} /> Speichern</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRM ═══ */}
      {deleteConfirm && (
        <div className="flp-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="flp-modal flp-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="flp-modal-header">
              <h3 className="flp-modal-title">Link löschen?</h3>
              <button className="flp-modal-close" onClick={() => setDeleteConfirm(null)}><X size={20} /></button>
            </div>
            <div className="flp-modal-body">
              <p className="flp-modal-text">
                Möchtest du den Link <strong style={{ color: "white" }}>{deleteConfirm.slug}</strong> wirklich löschen?
                Alle zugehörigen Einreichungen bleiben erhalten.
              </p>
            </div>
            <div className="flp-modal-footer">
              <button className="flp-btn flp-btn--secondary" onClick={() => setDeleteConfirm(null)}>Abbrechen</button>
              <button className="flp-btn flp-btn--danger" onClick={handleDelete} disabled={saving}>
                {saving ? "Lösche..." : <><Trash2 size={14} /> Löschen</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ REJECT MODAL ═══ */}
      {rejectModal && (
        <div className="flp-overlay" onClick={() => setRejectModal(null)}>
          <div className="flp-modal flp-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="flp-modal-header">
              <h3 className="flp-modal-title">Einreichung ablehnen</h3>
              <button className="flp-modal-close" onClick={() => setRejectModal(null)}><X size={20} /></button>
            </div>
            <div className="flp-form" style={{ gap: 12 }}>
              <p className="flp-modal-text" style={{ margin: 0 }}>
                Einreichung von <strong style={{ color: "white" }}>{rejectModal.customerName || rejectModal.customerEmail || "Unbekannt"}</strong> ablehnen?
              </p>
              <div className="flp-form-group">
                <label className="flp-form-label">Grund (optional)</label>
                <textarea
                  className="flp-form-textarea"
                  placeholder="Begründung für die Ablehnung..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flp-modal-footer">
              <button className="flp-btn flp-btn--secondary" onClick={() => setRejectModal(null)}>Abbrechen</button>
              <button className="flp-btn flp-btn--danger" onClick={handleReject} disabled={saving}>
                {saving ? "..." : <><XCircle size={14} /> Ablehnen</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Submission Row Component ───────────────────────────────────────────────

interface SubmissionRowProps {
  sub: FormularSubmission;
  isExpanded: boolean;
  onToggle: () => void;
  onConvert: () => void;
  onReject: () => void;
  saving: boolean;
}

function SubmissionRow({ sub, isExpanded, onToggle, onConvert, onReject, saving }: SubmissionRowProps) {
  const statusClass = sub.status === "PENDING" ? "flp-status-badge--pending"
    : sub.status === "CONVERTED" ? "flp-status-badge--converted"
    : sub.status === "REJECTED" ? "flp-status-badge--rejected" : "";

  const statusLabel = sub.status === "PENDING" ? "Ausstehend"
    : sub.status === "CONVERTED" ? "Konvertiert"
    : sub.status === "REJECTED" ? "Abgelehnt" : sub.status;

  // Safe string helper for unknown values
  const s = (v: unknown, fallback = "–"): string => (v != null && v !== "" ? String(v) : fallback);

  const data = sub.data as Record<string, unknown> | null;
  const betreiber = data?.betreiber as Record<string, string> | undefined;
  const pvModule = data?.pvModule as Record<string, string | number | boolean> | undefined;
  const wechselrichter = data?.wechselrichter as Record<string, string | number | boolean> | undefined;
  const speicher = data?.speicher as Record<string, string | number | boolean> | undefined;
  const wallbox = data?.wallbox as Record<string, string | number | boolean> | undefined;
  const zaehler = data?.zaehler as Record<string, string> | undefined;

  return (
    <>
      <tr style={{ cursor: "pointer" }} onClick={onToggle}>
        <td>{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
        <td style={{ fontWeight: 500, color: "white" }}>{sub.customerName || "–"}</td>
        <td style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{sub.customerEmail || "–"}</td>
        <td>{sub.totalKwp != null ? `${Number(sub.totalKwp).toFixed(2)} kWp` : "–"}</td>
        <td><span className="flp-slug">{sub.formularLink?.slug || "–"}</span></td>
        <td style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{formatDate(sub.submittedAt)}</td>
        <td><span className={`flp-status-badge ${statusClass}`}>{statusLabel}</span></td>
        <td onClick={e => e.stopPropagation()}>
          <div className="flp-tbl-actions">
            {sub.status === "PENDING" && (
              <>
                <button className="flp-tbl-btn flp-tbl-btn--success" onClick={onConvert} disabled={saving} title="Zu Installation konvertieren">
                  <ArrowRight size={14} /> Installation
                </button>
                <button className="flp-tbl-btn flp-tbl-btn--danger" onClick={onReject} disabled={saving} title="Ablehnen">
                  <XCircle size={14} />
                </button>
              </>
            )}
            {sub.status === "CONVERTED" && sub.installationId != null && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>ID: {sub.installationId}</span>
            )}
            {sub.status === "REJECTED" && sub.rejectionReason ? (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }} title={sub.rejectionReason}>
                {sub.rejectionReason}
              </span>
            ) : null}
          </div>
        </td>
      </tr>
      {isExpanded && data ? (
        <tr>
          <td colSpan={8} className="flp-expanded-cell">
            <div className="flp-expanded-grid">
              {/* Betreiber */}
              {betreiber ? (
                <div className="flp-expanded-section">
                  <div className="flp-expanded-section-title">Betreiber</div>
                  {betreiber.anrede ? <div className="flp-expanded-row"><span className="flp-expanded-label">Anrede</span><span className="flp-expanded-value">{betreiber.anrede}</span></div> : null}
                  <div className="flp-expanded-row"><span className="flp-expanded-label">Name</span><span className="flp-expanded-value">{s(betreiber.vorname, "")} {s(betreiber.nachname, "")}</span></div>
                  {betreiber.firma ? <div className="flp-expanded-row"><span className="flp-expanded-label">Firma</span><span className="flp-expanded-value">{betreiber.firma}</span></div> : null}
                  <div className="flp-expanded-row"><span className="flp-expanded-label">Adresse</span><span className="flp-expanded-value">{s(betreiber.strasse, "")} {s(betreiber.hausNr, "")}, {s(betreiber.plz, "")} {s(betreiber.ort, "")}</span></div>
                  <div className="flp-expanded-row"><span className="flp-expanded-label">Telefon</span><span className="flp-expanded-value">{s(betreiber.telefon)}</span></div>
                  {betreiber.geburtsdatum ? <div className="flp-expanded-row"><span className="flp-expanded-label">Geburtsdatum</span><span className="flp-expanded-value">{betreiber.geburtsdatum}</span></div> : null}
                </div>
              ) : null}

              {/* PV-Module */}
              {pvModule ? (
                <div className="flp-expanded-section">
                  <div className="flp-expanded-section-title">PV-Module</div>
                  <div className="flp-expanded-row"><span className="flp-expanded-label">Hersteller</span><span className="flp-expanded-value">{s(pvModule.hersteller)}</span></div>
                  <div className="flp-expanded-row"><span className="flp-expanded-label">Modell</span><span className="flp-expanded-value">{s(pvModule.modell)}</span></div>
                  <div className="flp-expanded-row"><span className="flp-expanded-label">Leistung</span><span className="flp-expanded-value">{pvModule.leistungWp ? `${pvModule.leistungWp} Wp` : "–"}</span></div>
                  <div className="flp-expanded-row"><span className="flp-expanded-label">Anzahl</span><span className="flp-expanded-value">{s(pvModule.anzahl)}</span></div>
                  {pvModule.ausrichtung ? <div className="flp-expanded-row"><span className="flp-expanded-label">Ausrichtung</span><span className="flp-expanded-value">{String(pvModule.ausrichtung)}</span></div> : null}
                  {pvModule.neigung ? <div className="flp-expanded-row"><span className="flp-expanded-label">Neigung</span><span className="flp-expanded-value">{String(pvModule.neigung)}</span></div> : null}
                </div>
              ) : null}

              {/* Wechselrichter */}
              {wechselrichter ? (
                <div className="flp-expanded-section">
                  <div className="flp-expanded-section-title">Wechselrichter</div>
                  <div className="flp-expanded-row"><span className="flp-expanded-label">Hersteller</span><span className="flp-expanded-value">{s(wechselrichter.hersteller)}</span></div>
                  <div className="flp-expanded-row"><span className="flp-expanded-label">Modell</span><span className="flp-expanded-value">{s(wechselrichter.modell)}</span></div>
                  <div className="flp-expanded-row"><span className="flp-expanded-label">Leistung</span><span className="flp-expanded-value">{wechselrichter.leistungKva ? `${wechselrichter.leistungKva} kVA` : "–"}</span></div>
                  <div className="flp-expanded-row"><span className="flp-expanded-label">Anzahl</span><span className="flp-expanded-value">{s(wechselrichter.anzahl)}</span></div>
                  {wechselrichter.hybrid ? <div className="flp-expanded-row"><span className="flp-expanded-label">Hybrid</span><span className="flp-expanded-value">Ja</span></div> : null}
                </div>
              ) : null}

              {/* Speicher */}
              {speicher?.vorhanden ? (
                <div className="flp-expanded-section">
                  <div className="flp-expanded-section-title">Speicher</div>
                  <div className="flp-expanded-row"><span className="flp-expanded-label">Hersteller</span><span className="flp-expanded-value">{s(speicher.hersteller)}</span></div>
                  <div className="flp-expanded-row"><span className="flp-expanded-label">Modell</span><span className="flp-expanded-value">{s(speicher.modell)}</span></div>
                  {speicher.kapazitaetKwh ? <div className="flp-expanded-row"><span className="flp-expanded-label">Kapazität</span><span className="flp-expanded-value">{String(speicher.kapazitaetKwh)} kWh</span></div> : null}
                  {speicher.kopplung ? <div className="flp-expanded-row"><span className="flp-expanded-label">Kopplung</span><span className="flp-expanded-value">{String(speicher.kopplung)}</span></div> : null}
                </div>
              ) : null}

              {/* Wallbox */}
              {wallbox?.vorhanden ? (
                <div className="flp-expanded-section">
                  <div className="flp-expanded-section-title">Wallbox</div>
                  {wallbox.hersteller ? <div className="flp-expanded-row"><span className="flp-expanded-label">Hersteller</span><span className="flp-expanded-value">{String(wallbox.hersteller)}</span></div> : null}
                  {wallbox.modell ? <div className="flp-expanded-row"><span className="flp-expanded-label">Modell</span><span className="flp-expanded-value">{String(wallbox.modell)}</span></div> : null}
                  {wallbox.leistungKw ? <div className="flp-expanded-row"><span className="flp-expanded-label">Leistung</span><span className="flp-expanded-value">{String(wallbox.leistungKw)} kW</span></div> : null}
                </div>
              ) : null}

              {/* Sonstiges */}
              <div className="flp-expanded-section flp-expanded-full">
                <div className="flp-expanded-section-title">Sonstiges</div>
                {data.einspeiseart ? <div className="flp-expanded-row"><span className="flp-expanded-label">Einspeiseart</span><span className="flp-expanded-value">{String(data.einspeiseart)}</span></div> : null}
                {data.ibnDatum ? <div className="flp-expanded-row"><span className="flp-expanded-label">IBN-Datum</span><span className="flp-expanded-value">{String(data.ibnDatum)}</span></div> : null}
                {zaehler?.zaehlernummer ? <div className="flp-expanded-row"><span className="flp-expanded-label">Zählernummer</span><span className="flp-expanded-value">{zaehler.zaehlernummer}</span></div> : null}
                {zaehler?.maloId ? <div className="flp-expanded-row"><span className="flp-expanded-label">MaLo-ID</span><span className="flp-expanded-value">{zaehler.maloId}</span></div> : null}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
