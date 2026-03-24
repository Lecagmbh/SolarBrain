/**
 * KundenPage - Consolidated User & Customer Management
 * Replaces: Kunden.tsx, PortalUsersPage.tsx, UsersTab (in ControlCenter)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Search, RefreshCw, Edit2, Trash2, Key, Shield, ShieldOff,
  MoreVertical, Check, X, AlertTriangle, Clock, ChevronDown, ChevronRight, LogIn,
  List, GitBranch, Mail, Loader2,
} from "lucide-react";
import { useAuth } from "../../modules/auth/AuthContext";
import { api, apiPost } from "../../modules/api/client";
import { fetchHandelsvertreter } from "../../services/kunden.service";
import UserTreeView from "./UserTreeView";
import "./kunden-page.css";
import "./user-tree.css";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PortalInstallation {
  id: number;
  publicId: string | null;
  customerName: string | null;
  status: string;
  address: string;
}

interface UserData {
  id: number;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  kundeId: number | null;
  parentUserId: number | null;
  kunde: {
    id: number; name: string; firmenName: string | null;
    strasse: string | null; hausNr: string | null; plz: string | null; ort: string | null; land: string | null;
    ustIdNr: string | null; steuernummer: string | null; telefon: string | null; ansprechpartner: string | null; email: string | null;
    whiteLabelConfig?: unknown;
  } | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
  gesperrt?: boolean;
  gesperrtGrund?: string | null;
  installations?: PortalInstallation[];
  subUsers?: UserData[];
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

interface HvOption { id: number; userName: string; firmenName?: string; aktiv: boolean; }

interface WaData {
  phone: string | null; verified: boolean; verifiedAt: string | null;
  activationCode: string | null; notificationsEnabled: boolean; linkedPhone: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: "Admin", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  MITARBEITER: { label: "Mitarbeiter", color: "#f0d878", bg: "rgba(168,85,247,0.12)" },
  KUNDE: { label: "Kunde", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  SUBUNTERNEHMER: { label: "Sub", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  ENDKUNDE_PORTAL: { label: "Portal", color: "#4ade80", bg: "rgba(34,197,94,0.12)" },
  HANDELSVERTRETER: { label: "HV", color: "#22d3ee", bg: "rgba(6,182,212,0.12)" },
  DEMO: { label: "Demo", color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.06)" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  EINGANG: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  BEIM_NB: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24" },
  RUECKFRAGE: { bg: "rgba(249,115,22,0.15)", text: "#fb923c" },
  GENEHMIGT: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
  IBN: { bg: "rgba(6,182,212,0.15)", text: "#22d3ee" },
  FERTIG: { bg: "rgba(34,197,94,0.2)", text: "#22c55e" },
  STORNIERT: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
};

const ROLE_CHIPS = [
  { value: "", label: "Alle" },
  { value: "ADMIN", label: "Admin" },
  { value: "MITARBEITER", label: "MA" },
  { value: "KUNDE", label: "Kunde" },
  { value: "SUBUNTERNEHMER", label: "Sub" },
  { value: "ENDKUNDE_PORTAL", label: "Portal" },
  { value: "HANDELSVERTRETER", label: "HV" },
  { value: "DEMO", label: "Demo" },
];

const EMPTY_FORM = {
  email: "", name: "", role: "KUNDE", active: true,
  firmenName: "", strasse: "", hausNr: "", plz: "", ort: "", land: "DE",
  ustIdNr: "", steuernummer: "", telefon: "", ansprechpartner: "", kundeEmail: "",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const safeString = (v: unknown): string => {
  if (v == null) return "";
  if (typeof v === "object" && "message" in (v as object)) return String((v as { message: unknown }).message);
  return typeof v === "object" ? "" : String(v);
};

const formatDate = (d: string | null) => {
  if (!d) return "Nie";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function KundenPage() {
  const { user: authUser } = useAuth();
  const userRole = ((authUser as any)?.role || "KUNDE").toUpperCase();
  const isAdmin = userRole === "ADMIN";

  // Data state
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [toast, setToast] = useState<{ type: "ok" | "error"; msg: string } | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Expanded rows (installations)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserData | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempPasswordUser, setTempPasswordUser] = useState<{ id: number; email: string; name?: string } | null>(null);
  const [sendingWelcome, setSendingWelcome] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<UserData | null>(null);
  const [actionMenuUser, setActionMenuUser] = useState<number | null>(null);
  const [impersonating, setImpersonating] = useState<number | null>(null);

  // Form
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  // HV
  const [hvList, setHvList] = useState<HvOption[]>([]);
  const [hvId, setHvId] = useState<number | null>(null);
  const [hvSaving, setHvSaving] = useState(false);

  // WhatsApp (Edit modal)
  const [waData, setWaData] = useState<WaData | null>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [waPhone, setWaPhone] = useState("");
  const [waSending, setWaSending] = useState(false);

  // ── Data fetching ──

  const fetchUsers = useCallback(async (p?: number) => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {
        page: String(p ?? pagination.page),
        limit: String(pagination.limit),
        include: "installations",
      };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (activeFilter) params.active = activeFilter;

      const res = await api.get("/admin/users", { params });
      setUsers(res.data.data || []);
      setPagination(res.data.pagination || pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || "Fehler beim Laden der Benutzer");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter, activeFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // HV-Liste einmal laden
  useEffect(() => { fetchHandelsvertreter().then(setHvList).catch(() => {}); }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
  }, [toast]);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPagination(p => ({ ...p, page: 1 }));
    }, 350);
  };

  // ── CRUD handlers ──

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { email: formData.email, name: formData.name || null, role: formData.role, active: formData.active };
      if (formData.role === "KUNDE") {
        payload.kunde = {
          name: formData.name || formData.email,
          firmenName: formData.firmenName || null, strasse: formData.strasse || null, hausNr: formData.hausNr || null,
          plz: formData.plz || null, ort: formData.ort || null, land: formData.land || null,
          ustIdNr: formData.ustIdNr || null, steuernummer: formData.steuernummer || null,
          telefon: formData.telefon || null, ansprechpartner: formData.ansprechpartner || null, email: formData.kundeEmail || null,
        };
      }
      const res = await api.post("/admin/users", payload);
      setTempPassword(res.data.tempPassword);
      setTempPasswordUser({ id: res.data.user.id, email: res.data.user.email, name: res.data.user.name });
      setShowCreateModal(false);
      setFormData({ ...EMPTY_FORM });
      fetchUsers();
      setToast({ type: "ok", msg: "Benutzer erstellt" });
    } catch (err: any) {
      setToast({ type: "error", msg: err.response?.data?.error || "Fehler beim Erstellen" });
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload: any = { email: formData.email, name: formData.name || null, role: formData.role, active: formData.active };
      payload.kunde = {
        firmenName: formData.firmenName || null, strasse: formData.strasse || null, hausNr: formData.hausNr || null,
        plz: formData.plz || null, ort: formData.ort || null, land: formData.land || null,
        ustIdNr: formData.ustIdNr || null, steuernummer: formData.steuernummer || null,
        telefon: formData.telefon || null, ansprechpartner: formData.ansprechpartner || null, email: formData.kundeEmail || null,
      };
      await api.patch(`/admin/users/${editingUser.id}`, payload);

      // HV-Zuordnung speichern wenn Kunde
      if (editingUser.kundeId && hvId !== (editingUser.kunde as any)?.handelsvertreterId) {
        try {
          await api.put(`/kunden/${editingUser.kundeId}`, { handelsvertreterId: hvId });
        } catch { /* non-fatal */ }
      }

      setEditingUser(null);
      fetchUsers();
      setToast({ type: "ok", msg: "Benutzer aktualisiert" });
    } catch (err: any) {
      setToast({ type: "error", msg: err.response?.data?.error || "Fehler beim Aktualisieren" });
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;
    try {
      const res = await api.post(`/admin/users/${resetPasswordUser.id}/reset-password`);
      setTempPassword(res.data.tempPassword);
      setTempPasswordUser({ id: resetPasswordUser.id, email: resetPasswordUser.email, name: resetPasswordUser.name || undefined });
      setResetPasswordUser(null);
    } catch (err: any) {
      setToast({ type: "error", msg: err.response?.data?.error || "Fehler beim Zurücksetzen" });
    }
  };

  const handleSendWelcome = async () => {
    if (!tempPasswordUser || !tempPassword) return;
    setSendingWelcome(true);
    try {
      await api.post(`/admin/users/${tempPasswordUser.id}/send-welcome`, { password: tempPassword });
      setToast({ type: "ok", msg: `Zugangsdaten an ${tempPasswordUser.email} gesendet` });
    } catch (err: any) {
      setToast({ type: "error", msg: err.response?.data?.error || "E-Mail konnte nicht gesendet werden" });
    } finally {
      setSendingWelcome(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/admin/users/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchUsers();
      setToast({ type: "ok", msg: "Benutzer gelöscht" });
    } catch (err: any) {
      setToast({ type: "error", msg: err.response?.data?.error || "Fehler beim Löschen" });
    }
  };

  const handleBlockUser = async (u: UserData) => {
    try {
      await api.post(`/admin/users/${u.id}/block`, { grund: "Manuell gesperrt" });
      fetchUsers();
      setToast({ type: "ok", msg: `${u.email} gesperrt` });
    } catch (err: any) {
      setToast({ type: "error", msg: err.response?.data?.error || "Fehler beim Sperren" });
    }
  };

  const handleUnblockUser = async (u: UserData) => {
    try {
      await api.post(`/admin/users/${u.id}/unblock`);
      fetchUsers();
      setToast({ type: "ok", msg: `${u.email} entsperrt` });
    } catch (err: any) {
      setToast({ type: "error", msg: err.response?.data?.error || "Fehler beim Entsperren" });
    }
  };

  // ── Impersonate ──

  const handleImpersonate = async (u: UserData) => {
    try {
      setImpersonating(u.id);
      const data = await apiPost(`/portal/admin/users/${u.id}/impersonate`, {});
      if (data.success && data.url) {
        const isDesktop = !!(window as any).baunityDesktop?.portal?.openImpersonate;
        if (isDesktop) {
          const result = await (window as any).baunityDesktop.portal.openImpersonate({ url: data.url, userName: u.name || u.email });
          if (result.success) setToast({ type: "ok", msg: `Portal für ${u.name || u.email} wird geöffnet...` });
          else setToast({ type: "error", msg: "Fenster konnte nicht geöffnet werden" });
        } else {
          window.open(data.url, "_blank");
          setToast({ type: "ok", msg: "Portal-Tab wird geöffnet..." });
        }
      }
    } catch (err: any) {
      setToast({ type: "error", msg: err.message || "Impersonation fehlgeschlagen" });
    } finally {
      setImpersonating(null);
    }
  };

  // ── Edit modal open ──

  const openEditModal = (u: UserData) => {
    setFormData({
      email: u.email, name: u.name || "", role: u.role, active: u.active,
      firmenName: u.kunde?.firmenName || "", strasse: u.kunde?.strasse || "", hausNr: u.kunde?.hausNr || "",
      plz: u.kunde?.plz || "", ort: u.kunde?.ort || "", land: u.kunde?.land || "DE",
      ustIdNr: u.kunde?.ustIdNr || "", steuernummer: u.kunde?.steuernummer || "",
      telefon: u.kunde?.telefon || "", ansprechpartner: u.kunde?.ansprechpartner || "", kundeEmail: u.kunde?.email || "",
    });
    setHvId(null); // Will be loaded properly if needed
    setEditingUser(u);
    setActionMenuUser(null);
    if (isAdmin) loadWhatsAppData(u.id);
  };

  // ── WhatsApp ──

  const loadWhatsAppData = async (userId: number) => {
    setWaLoading(true); setWaData(null);
    try {
      const res = await api.get(`/admin/users/${userId}/whatsapp`);
      if (res.data?.success) { setWaData(res.data.data); setWaPhone(res.data.data.phone || ""); }
    } catch { /* ignore */ } finally { setWaLoading(false); }
  };

  const handleWaPhoneSave = async () => {
    if (!editingUser || waSending) return;
    setWaSending(true);
    try {
      await api.patch(`/admin/users/${editingUser.id}/whatsapp`, { phone: waPhone || null });
      await loadWhatsAppData(editingUser.id);
    } catch (err: any) { setToast({ type: "error", msg: err.response?.data?.error || "Fehler" }); }
    finally { setWaSending(false); }
  };

  const handleWaVerify = async () => {
    if (!editingUser || waSending) return;
    setWaSending(true);
    try {
      const res = await api.post(`/admin/users/${editingUser.id}/whatsapp/verify`);
      setToast({ type: "ok", msg: res.data?.message || "Verifizierung gesendet" });
      await loadWhatsAppData(editingUser.id);
    } catch (err: any) { setToast({ type: "error", msg: err.response?.data?.error || "Fehler" }); }
    finally { setWaSending(false); }
  };

  const handleWaConfirm = async () => {
    if (!editingUser || waSending || !confirm("Nummer manuell als verifiziert markieren?")) return;
    setWaSending(true);
    try {
      await api.post(`/admin/users/${editingUser.id}/whatsapp/confirm`);
      await loadWhatsAppData(editingUser.id);
    } catch (err: any) { setToast({ type: "error", msg: err.response?.data?.error || "Fehler" }); }
    finally { setWaSending(false); }
  };

  const handleWaRemove = async () => {
    if (!editingUser || waSending || !confirm("WhatsApp-Verknüpfung wirklich aufheben?")) return;
    setWaSending(true);
    try {
      await api.delete(`/admin/users/${editingUser.id}/whatsapp`);
      setWaPhone(""); await loadWhatsAppData(editingUser.id);
    } catch (err: any) { setToast({ type: "error", msg: err.response?.data?.error || "Fehler" }); }
    finally { setWaSending(false); }
  };

  // ── Expand rows ──

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Click outside to close action menu ──

  useEffect(() => {
    if (actionMenuUser === null) return;
    const handler = () => setActionMenuUser(null);
    const t = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => { clearTimeout(t); document.removeEventListener("click", handler); };
  }, [actionMenuUser]);

  // ── Stats ──

  const activeCount = users.filter(u => u.active && !u.gesperrt).length;
  const installCount = users.reduce((s, u) => s + (u.installations?.length || 0), 0);

  // ── Render ──

  return (
    <div className="kp-page">
      {/* Toast */}
      {toast && <div className={`kp-toast ${toast.type === "ok" ? "kp-toast--ok" : "kp-toast--error"}`}>{toast.msg}</div>}

      {/* Header */}
      <div className="kp-header">
        <div className="kp-title-wrap">
          <h1 className="kp-title">Kunden & Benutzer</h1>
          <span className="kp-count">{pagination.total}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* View toggle */}
          <div className="kp-view-toggle">
            <button className={`kp-view-btn${viewMode === "list" ? " kp-view-btn--active" : ""}`} onClick={() => setViewMode("list")}>
              <List size={14} /> Liste
            </button>
            <button className={`kp-view-btn${viewMode === "tree" ? " kp-view-btn--active" : ""}`} onClick={() => setViewMode("tree")}>
              <GitBranch size={14} /> Stammbaum
            </button>
          </div>
          {isAdmin && (
            <button className="kp-btn-create" onClick={() => { setFormData({ ...EMPTY_FORM }); setShowCreateModal(true); }}>
              <Plus size={16} /> Neuer Benutzer
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="kp-toolbar">
        <div className="kp-search-wrap">
          <span className="kp-search-icon"><Search size={18} /></span>
          <input
            type="text" className="kp-search" value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Name, E-Mail oder Firma suchen..."
          />
        </div>
        <div className="kp-chips">
          {ROLE_CHIPS.map(c => (
            <button key={c.value} className={`kp-chip ${roleFilter === c.value ? "kp-chip--active" : ""}`}
              onClick={() => { setRoleFilter(c.value); setPagination(p => ({ ...p, page: 1 })); }}>
              {c.label}
            </button>
          ))}
        </div>
        <select className="kp-status-select" value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
          <option value="">Alle Status</option>
          <option value="true">Aktiv</option>
          <option value="false">Inaktiv</option>
        </select>
        <button className="kp-action-btn" onClick={() => fetchUsers()} title="Aktualisieren">
          <RefreshCw size={16} style={loading ? { animation: "kp-spin 1s linear infinite" } : undefined} />
        </button>
      </div>

      {/* Stats */}
      <div className="kp-stats">
        <div className="kp-stat"><span className="kp-stat-label">Gesamt:</span><span className="kp-stat-value">{pagination.total}</span></div>
        <div className="kp-stat"><span className="kp-stat-label">Aktiv:</span><span className="kp-stat-value kp-stat-value--green">{activeCount}</span></div>
        <div className="kp-stat"><span className="kp-stat-label">Installationen:</span><span className="kp-stat-value kp-stat-value--indigo">{installCount}</span></div>
      </div>

      {/* Error */}
      {error && <div className="kp-error"><AlertTriangle size={16} />{safeString(error)}</div>}

      {/* Tree View */}
      {viewMode === "tree" && (
        <div className="kp-card">
          <UserTreeView onToast={(type, msg) => setToast({ type, msg })} />
        </div>
      )}

      {/* Table (List View) */}
      {viewMode === "list" && <div className="kp-card">
        <div className="kp-table-wrap">
          <table className="kp-table">
            <thead>
              <tr>
                <th>Benutzer</th>
                <th>Rolle</th>
                <th>Firma</th>
                <th>Installationen</th>
                <th>Status</th>
                <th>Letzter Login</th>
                <th style={{ textAlign: "right" }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr><td colSpan={7}><div className="kp-loading"><div className="kp-spinner" /><span className="kp-loading-text">Lade Benutzer...</span></div></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7}><div className="kp-empty">{search || roleFilter ? "Keine Benutzer gefunden" : "Noch keine Benutzer vorhanden"}</div></td></tr>
              ) : users.map(u => {
                const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.DEMO;
                const instCount = u.installations?.length || 0;
                const isExpanded = expandedRows.has(u.id);
                return (
                  <UserRow
                    key={u.id} user={u} roleConfig={rc} instCount={instCount} isExpanded={isExpanded}
                    isAdmin={isAdmin} impersonating={impersonating} actionMenuUser={actionMenuUser}
                    onToggleRow={() => toggleRow(u.id)}
                    onActionMenu={(id) => setActionMenuUser(actionMenuUser === id ? null : id)}
                    onEdit={() => openEditModal(u)}
                    onResetPw={() => { setResetPasswordUser(u); setActionMenuUser(null); }}
                    onBlock={() => { handleBlockUser(u); setActionMenuUser(null); }}
                    onUnblock={() => { handleUnblockUser(u); setActionMenuUser(null); }}
                    onDelete={() => { setDeleteConfirm(u); setActionMenuUser(null); }}
                    onImpersonate={() => { handleImpersonate(u); setActionMenuUser(null); }}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>}

      {/* Pagination */}
      {viewMode === "list" && pagination.totalPages > 1 && (
        <div className="kp-pagination">
          <button className="kp-page-btn" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Zurück</button>
          <span>Seite {pagination.page} von {pagination.totalPages}</span>
          <button className="kp-page-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Weiter</button>
        </div>
      )}

      {/* ── Modals ── */}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="kp-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="kp-modal" onClick={e => e.stopPropagation()}>
            <div className="kp-modal-header">
              <h3 className="kp-modal-title">Neuen Benutzer erstellen</h3>
              <button className="kp-modal-close" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateUser} className="kp-form">
              <div className="kp-form-group">
                <label className="kp-form-label">E-Mail *</label>
                <input type="email" required className="kp-form-input" placeholder="benutzer@beispiel.de"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="kp-form-group">
                <label className="kp-form-label">Name</label>
                <input type="text" className="kp-form-input" placeholder="Max Mustermann"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="kp-form-group">
                <label className="kp-form-label">Rolle</label>
                <select className="kp-form-select" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="ADMIN">Admin</option>
                  <option value="MITARBEITER">Mitarbeiter</option>
                  <option value="KUNDE">Kunde</option>
                  <option value="SUBUNTERNEHMER">Subunternehmer</option>
                </select>
              </div>
              {formData.role === "KUNDE" && <BillingFields formData={formData} setFormData={setFormData} />}
              <label className="kp-form-checkbox">
                <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} /> Aktiv
              </label>
              <div className="kp-modal-footer">
                <button type="button" className="kp-btn kp-btn--secondary" onClick={() => setShowCreateModal(false)}>Abbrechen</button>
                <button type="submit" className="kp-btn kp-btn--primary"><Plus size={16} /> Erstellen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="kp-overlay" onClick={() => setEditingUser(null)}>
          <div className="kp-modal" onClick={e => e.stopPropagation()}>
            <div className="kp-modal-header">
              <h3 className="kp-modal-title">Benutzer bearbeiten</h3>
              <button className="kp-modal-close" onClick={() => setEditingUser(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateUser} className="kp-form">
              <div className="kp-form-group">
                <label className="kp-form-label">E-Mail *</label>
                <input type="email" required className="kp-form-input"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isAdmin} />
              </div>
              <div className="kp-form-group">
                <label className="kp-form-label">Name</label>
                <input type="text" className="kp-form-input"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isAdmin} />
              </div>
              {isAdmin && (
                <div className="kp-form-group">
                  <label className="kp-form-label">Rolle</label>
                  <select className="kp-form-select" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                    <option value="ADMIN">Admin</option>
                    <option value="MITARBEITER">Mitarbeiter</option>
                    <option value="KUNDE">Kunde</option>
                    <option value="SUBUNTERNEHMER">Subunternehmer</option>
                  </select>
                </div>
              )}
              {isAdmin && <BillingFields formData={formData} setFormData={setFormData} />}
              {isAdmin && (
                <label className="kp-form-checkbox">
                  <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} /> Aktiv
                </label>
              )}

              {/* HV-Zuordnung (for KUNDE users) */}
              {editingUser.kundeId && (editingUser.role === "KUNDE" || editingUser.role === "SUBUNTERNEHMER") && (
                <div className="kp-form-section">
                  <div className="kp-form-section-title">Handelsvertreter-Zuordnung</div>
                  <select className="kp-hv-select" value={hvId ?? ""} onChange={e => setHvId(e.target.value === "" ? null : Number(e.target.value))} disabled={hvSaving}>
                    <option value="">— Kein HV zugewiesen —</option>
                    {hvList.filter(h => h.aktiv).map(hv => (
                      <option key={hv.id} value={hv.id}>{hv.userName}{hv.firmenName ? ` (${hv.firmenName})` : ""}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* WhatsApp (admin only) */}
              {isAdmin && (
                <div className="kp-form-section">
                  <div className="kp-form-section-title">WhatsApp-Integration</div>
                  {waLoading ? (
                    <div style={{ color: "#94a3b8", fontSize: 13, padding: "8px 0" }}>Lade WhatsApp-Daten...</div>
                  ) : waData ? (
                    <div className="kp-wa-section">
                      <div className="kp-wa-phone-row">
                        <div className="kp-form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label className="kp-form-label">Telefonnummer</label>
                          <input type="tel" className="kp-form-input" placeholder="+49 171 1234567"
                            value={waPhone} onChange={e => setWaPhone(e.target.value)} />
                        </div>
                        <button type="button" className="kp-wa-save-btn" onClick={handleWaPhoneSave}
                          disabled={waSending || waPhone === (waData.phone || "")}>Speichern</button>
                      </div>
                      {waData.phone && (
                        <div className={`kp-wa-status ${waData.verified ? "kp-wa-status--verified" : "kp-wa-status--unverified"}`}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: waData.verified ? "#22c55e" : "#fbbf24" }}>
                              {waData.verified ? "Verifiziert" : "Nicht verifiziert"}
                            </span>
                            {waData.verifiedAt && <span style={{ fontSize: 11, color: "#94a3b8" }}>(seit {new Date(waData.verifiedAt).toLocaleDateString("de-DE")})</span>}
                          </div>
                          <div className="kp-wa-actions">
                            {!waData.verified && (
                              <>
                                <button type="button" className="kp-wa-btn kp-wa-btn--verify" onClick={handleWaVerify} disabled={waSending}>Code senden</button>
                                <button type="button" className="kp-wa-btn kp-wa-btn--confirm" onClick={handleWaConfirm} disabled={waSending}>Manuell bestätigen</button>
                              </>
                            )}
                            <button type="button" className="kp-wa-btn kp-wa-btn--remove" onClick={handleWaRemove} disabled={waSending}>Entfernen</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: "#ef4444", fontSize: 13 }}>Fehler beim Laden der WhatsApp-Daten</div>
                  )}
                </div>
              )}

              <div className="kp-modal-footer">
                <button type="button" className="kp-btn kp-btn--secondary" onClick={() => setEditingUser(null)}>Abbrechen</button>
                <button type="submit" className="kp-btn kp-btn--primary"><Check size={16} /> Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="kp-overlay" onClick={() => setResetPasswordUser(null)}>
          <div className="kp-modal kp-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="kp-modal-header">
              <h3 className="kp-modal-title">Passwort zurücksetzen</h3>
              <button className="kp-modal-close" onClick={() => setResetPasswordUser(null)}><X size={20} /></button>
            </div>
            <div className="kp-modal-body">
              <p className="kp-modal-text">Passwort für <strong>{resetPasswordUser.email}</strong> zurücksetzen?</p>
              <p className="kp-modal-warning">Der Benutzer erhält ein neues temporäres Passwort.</p>
            </div>
            <div className="kp-modal-footer">
              <button className="kp-btn kp-btn--secondary" onClick={() => setResetPasswordUser(null)}>Abbrechen</button>
              <button className="kp-btn kp-btn--primary" onClick={handleResetPassword}><Key size={16} /> Zurücksetzen</button>
            </div>
          </div>
        </div>
      )}

      {/* Temp Password Modal */}
      {tempPassword && (
        <div className="kp-overlay" onClick={() => { setTempPassword(null); setTempPasswordUser(null); setSendingWelcome(false); }}>
          <div className="kp-modal kp-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="kp-modal-header kp-modal-header--success">
              <h3 className="kp-modal-title kp-modal-title--success">Temporäres Passwort</h3>
            </div>
            <div className="kp-modal-body">
              {tempPasswordUser && (
                <p className="kp-modal-text" style={{ marginBottom: 8, fontWeight: 600 }}>{tempPasswordUser.email}</p>
              )}
              <p className="kp-modal-text">Das temporäre Passwort wurde erstellt:</p>
              <div className="kp-password">
                <code>{tempPassword}</code>
                <button className="kp-password-copy" onClick={() => navigator.clipboard.writeText(tempPassword)}>Kopieren</button>
              </div>
              <p className="kp-modal-warning">Bitte notieren Sie dieses Passwort. Es wird nur einmal angezeigt.</p>
            </div>
            <div className="kp-modal-footer" style={{ gap: 8, display: "flex", flexWrap: "wrap" }}>
              {tempPasswordUser && (
                <button
                  className="kp-btn kp-btn--success"
                  onClick={handleSendWelcome}
                  disabled={sendingWelcome}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {sendingWelcome ? <Loader2 size={14} className="kp-spin" /> : <Mail size={14} />}
                  {sendingWelcome ? "Wird gesendet..." : "Zugangsdaten per E-Mail senden"}
                </button>
              )}
              <button className="kp-btn kp-btn--primary" onClick={() => { setTempPassword(null); setTempPasswordUser(null); }}>Verstanden</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="kp-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="kp-modal kp-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="kp-modal-header kp-modal-header--danger">
              <h3 className="kp-modal-title kp-modal-title--danger">Benutzer löschen</h3>
            </div>
            <div className="kp-modal-body">
              <p className="kp-modal-text">Möchten Sie <strong>{deleteConfirm.email}</strong> wirklich löschen?</p>
              <p className="kp-modal-danger-text">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            </div>
            <div className="kp-modal-footer">
              <button className="kp-btn kp-btn--secondary" onClick={() => setDeleteConfirm(null)}>Abbrechen</button>
              <button className="kp-btn kp-btn--danger" onClick={handleDeleteUser}><Trash2 size={16} /> Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

interface UserRowProps {
  user: UserData;
  roleConfig: { label: string; color: string; bg: string };
  instCount: number;
  isExpanded: boolean;
  isAdmin: boolean;
  impersonating: number | null;
  actionMenuUser: number | null;
  onToggleRow: () => void;
  onActionMenu: (id: number) => void;
  onEdit: () => void;
  onResetPw: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onDelete: () => void;
  onImpersonate: () => void;
}

function UserRow({ user: u, roleConfig: rc, instCount, isExpanded, isAdmin, impersonating, actionMenuUser, onToggleRow, onActionMenu, onEdit, onResetPw, onBlock, onUnblock, onDelete, onImpersonate }: UserRowProps) {
  return (
    <>
      <tr className={u.gesperrt ? "kp-row-blocked" : undefined}>
        {/* User */}
        <td>
          <div className="kp-user-cell">
            <div className="kp-avatar">{(u.name || u.email).charAt(0).toUpperCase()}</div>
            <div className="kp-user-info">
              <span className="kp-user-name">{u.name || "\u2014"}</span>
              <span className="kp-user-email">{u.email}</span>
            </div>
          </div>
        </td>

        {/* Role */}
        <td><span className="kp-role" style={{ background: rc.bg, color: rc.color }}>{rc.label}</span></td>

        {/* Firma */}
        <td>{u.kunde?.firmenName || u.kunde?.name || "\u2014"}</td>

        {/* Installations */}
        <td>
          {instCount > 0 ? (
            <span className="kp-inst-count kp-inst-count--has" onClick={onToggleRow}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {instCount}
            </span>
          ) : (
            <span className="kp-inst-count kp-inst-count--none">0</span>
          )}
        </td>

        {/* Status */}
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {u.gesperrt ? (
              <span className="kp-status kp-status--blocked"><ShieldOff size={12} /> Gesperrt</span>
            ) : u.active ? (
              <span className="kp-status kp-status--active"><Check size={12} /> Aktiv</span>
            ) : (
              <span className="kp-status kp-status--inactive"><X size={12} /> Inaktiv</span>
            )}
            {u.mustChangePassword && <span className="kp-status kp-status--pw" title="Muss Passwort ändern"><Key size={12} /></span>}
          </div>
        </td>

        {/* Last Login */}
        <td>
          <span className={`kp-date ${u.lastLoginAt ? "kp-date--active" : "kp-date--never"}`}>
            <Clock size={12} /> {formatDate(u.lastLoginAt)}
          </span>
        </td>

        {/* Actions */}
        <td style={{ textAlign: "right" }}>
          <div className="kp-actions-cell">
            {isAdmin && (
              <button className="kp-action-btn" onClick={e => { e.stopPropagation(); onActionMenu(u.id); }}>
                <MoreVertical size={16} />
              </button>
            )}
            {actionMenuUser === u.id && (
              <div className="kp-action-menu" onClick={e => e.stopPropagation()}>
                <button className="kp-menu-btn" onClick={onEdit}><Edit2 size={14} /> Bearbeiten</button>
                <button className="kp-menu-btn" onClick={onResetPw}><Key size={14} /> Passwort zurücksetzen</button>
                {u.gesperrt ? (
                  <button className="kp-menu-btn" onClick={onUnblock}><Shield size={14} /> Entsperren</button>
                ) : (
                  <button className="kp-menu-btn" onClick={onBlock}><ShieldOff size={14} /> Sperren</button>
                )}
                <button className="kp-menu-btn kp-menu-btn--impersonate" onClick={onImpersonate} disabled={!u.active || impersonating === u.id}>
                  <LogIn size={14} /> Als User einloggen
                </button>
                <div className="kp-menu-sep" />
                <button className="kp-menu-btn kp-menu-btn--danger" onClick={onDelete}><Trash2 size={14} /> Löschen</button>
              </div>
            )}
            {!isAdmin && (
              <button className="kp-action-btn" onClick={onEdit} title="Bearbeiten"><Edit2 size={16} /></button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded installations */}
      {isExpanded && u.installations && u.installations.length > 0 && (
        <tr className="kp-inst-expanded">
          <td colSpan={7}>
            <div className="kp-inst-list">
              {u.installations.map(inst => {
                const sc = STATUS_COLORS[inst.status] || { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.5)" };
                return (
                  <div key={inst.id} className="kp-inst-row">
                    <span className="kp-inst-badge" style={{ background: sc.bg, color: sc.text }}>{inst.status}</span>
                    <span className="kp-inst-id">{inst.publicId || `#${inst.id}`}</span>
                    <span className="kp-inst-name">{inst.customerName || inst.address}</span>
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Billing Fields Sub-Component ───────────────────────────────────────────

function BillingFields({ formData, setFormData }: { formData: typeof EMPTY_FORM; setFormData: (fn: any) => void }) {
  const set = (key: string, val: string) => setFormData((prev: typeof EMPTY_FORM) => ({ ...prev, [key]: val }));
  return (
    <div className="kp-form-section">
      <div className="kp-form-section-title">Rechnungsdaten</div>
      <div className="kp-form-group">
        <label className="kp-form-label">Firmenname</label>
        <input type="text" className="kp-form-input" placeholder="Firma GmbH" value={formData.firmenName} onChange={e => set("firmenName", e.target.value)} />
      </div>
      <div className="kp-form-group">
        <label className="kp-form-label">Ansprechpartner</label>
        <input type="text" className="kp-form-input" placeholder="Vor- und Nachname" value={formData.ansprechpartner} onChange={e => set("ansprechpartner", e.target.value)} />
      </div>
      <div className="kp-form-row">
        <div className="kp-form-group">
          <label className="kp-form-label">Telefon</label>
          <input type="text" className="kp-form-input" placeholder="+49 ..." value={formData.telefon} onChange={e => set("telefon", e.target.value)} />
        </div>
        <div className="kp-form-group">
          <label className="kp-form-label">Rechnungs-E-Mail</label>
          <input type="email" className="kp-form-input" placeholder="rechnung@firma.de" value={formData.kundeEmail} onChange={e => set("kundeEmail", e.target.value)} />
        </div>
      </div>
      <div className="kp-form-row">
        <div className="kp-form-group" style={{ flex: 3 }}>
          <label className="kp-form-label">Straße</label>
          <input type="text" className="kp-form-input" value={formData.strasse} onChange={e => set("strasse", e.target.value)} />
        </div>
        <div className="kp-form-group" style={{ flex: 1 }}>
          <label className="kp-form-label">Hausnr.</label>
          <input type="text" className="kp-form-input" value={formData.hausNr} onChange={e => set("hausNr", e.target.value)} />
        </div>
      </div>
      <div className="kp-form-row">
        <div className="kp-form-group" style={{ flex: 1 }}>
          <label className="kp-form-label">PLZ</label>
          <input type="text" className="kp-form-input" maxLength={5} value={formData.plz} onChange={e => set("plz", e.target.value)} />
        </div>
        <div className="kp-form-group" style={{ flex: 2 }}>
          <label className="kp-form-label">Ort</label>
          <input type="text" className="kp-form-input" value={formData.ort} onChange={e => set("ort", e.target.value)} />
        </div>
      </div>
      <div className="kp-form-group">
        <label className="kp-form-label">Land</label>
        <input type="text" className="kp-form-input" placeholder="DE" value={formData.land} onChange={e => set("land", e.target.value)} />
      </div>
      <div className="kp-form-row">
        <div className="kp-form-group">
          <label className="kp-form-label">USt-IdNr.</label>
          <input type="text" className="kp-form-input" placeholder="DE123456789" value={formData.ustIdNr} onChange={e => set("ustIdNr", e.target.value)} />
        </div>
        <div className="kp-form-group">
          <label className="kp-form-label">Steuernummer</label>
          <input type="text" className="kp-form-input" placeholder="123/456/78901" value={formData.steuernummer} onChange={e => set("steuernummer", e.target.value)} />
        </div>
      </div>
    </div>
  );
}
