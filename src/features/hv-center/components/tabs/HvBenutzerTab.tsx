/**
 * HV BENUTZER TAB
 * User management for Handelsvertreter - create users and demo accounts
 */

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import {
  UserPlus,
  RefreshCw,
  AlertTriangle,
  X,
  Check,
  Copy,
  User,
  Mail,
  Shield,
  Building,
  Calendar,
  Sparkles,
  Trash2,
  Loader2,
  Send,
} from "lucide-react";
import { api } from "../../../../modules/api/client";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

/* ── Types ── */

interface HvBenutzer {
  id: number;
  name: string | null;
  email: string;
  role: string;
  kundeName: string | null;
  createdAt: string;
}

interface CreateBenutzerForm {
  name: string;
  email: string;
  role: "KUNDE" | "DEMO";
  // Kundendaten
  firmenName: string;
  ansprechpartner: string;
  kundeEmail: string;
  telefon: string;
  strasse: string;
  hausNr: string;
  plz: string;
  ort: string;
  ustIdNr: string;
}

interface CreateResult {
  success: boolean;
  tempPassword?: string;
  email?: string;
  error?: string;
}

/* ── Constants ── */

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: "Admin", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
  MITARBEITER: { label: "Mitarbeiter", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
  KUNDE: { label: "Kunde", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
  HANDELSVERTRETER: { label: "HV", color: "#EAD068", bg: "rgba(139, 92, 246, 0.15)" },
  SUBUNTERNEHMER: { label: "Subunternehmer", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
};

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("de-DE") : "-";

/* ── Styles ── */

const styles: Record<string, CSSProperties> = {
  outerContainer: {
    padding: "24px",
    maxWidth: "1600px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  tabHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabTitle: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    color: "#ffffff",
  },
  tabTitleH2: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  tabTitleP: {
    margin: 0,
    fontSize: "0.875rem",
    color: "#71717a",
  },
  tabActions: {
    display: "flex",
    gap: "0.75rem",
  },
  btnRefresh: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#a1a1aa",
    padding: "0.625rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "linear-gradient(135deg, #D4A843, #EAD068)",
    border: "none",
    color: "#ffffff",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnSecondary: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#a1a1aa",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tableContainer: {
    background: "var(--dash-card-bg, rgba(255, 255, 255, 0.03))",
    border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  },
  dataTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "10px 16px",
    textAlign: "left",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  td: {
    padding: "12px 16px",
    fontSize: "0.85rem",
    color: "#e2e8f0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  },
  roleBadge: {
    display: "inline-flex",
    padding: "0.25rem 0.625rem",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  loadingCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "3rem",
    color: "#71717a",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(212, 168, 67, 0.3)",
    borderTopColor: "#D4A843",
    borderRadius: "50%",
    animation: "hvBenutzerSpin 1s linear infinite",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    color: "#fca5a5",
  },
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    color: "#6ee7b7",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    color: "#71717a",
  },
  /* Modal */
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  modal: {
    background: "#18181b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    padding: "24px",
    maxWidth: "560px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  modalCloseBtn: {
    background: "transparent",
    border: "none",
    color: "#71717a",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px",
  },
  formLabel: {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "#a1a1aa",
  },
  formInput: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  formSelect: {
    background: "#27272a",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    marginTop: "20px",
  },
  tempPasswordBox: {
    background: "rgba(212, 168, 67, 0.1)",
    border: "1px solid rgba(212, 168, 67, 0.3)",
    borderRadius: "10px",
    padding: "16px",
    marginTop: "16px",
    textAlign: "center",
  },
  tempPasswordLabel: {
    margin: "0 0 8px",
    fontSize: "0.8rem",
    color: "#a1a1aa",
  },
  tempPasswordValue: {
    fontFamily: "monospace",
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#D4A843",
    letterSpacing: "0.1em",
    margin: "0 0 12px",
  },
  copyBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "6px",
    color: "#a1a1aa",
    padding: "0.375rem 0.75rem",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
};

/* ── Component ── */

export function HvBenutzerTab() {
  const [benutzer, setBenutzer] = useState<HvBenutzer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [createResult, setCreateResult] = useState<CreateResult | null>(null);
  const [formData, setFormData] = useState<CreateBenutzerForm>({
    name: "",
    email: "",
    role: "KUNDE",
    firmenName: "",
    ansprechpartner: "",
    kundeEmail: "",
    telefon: "",
    strasse: "",
    hausNr: "",
    plz: "",
    ort: "",
    ustIdNr: "",
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<HvBenutzer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sendingWelcome, setSendingWelcome] = useState(false);
  const [welcomeSent, setWelcomeSent] = useState(false);
  const [lastCreatedUserId, setLastCreatedUserId] = useState<number | null>(null);
  const [welcomeEmail, setWelcomeEmail] = useState("");

  const fetchBenutzer = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/hv/benutzer");
      setBenutzer(res.data.data || res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Fehler beim Laden der Benutzer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenutzer();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    setSaving(true);
    try {
      const res = await api.post("/hv/benutzer", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        kunde: {
          name: formData.ansprechpartner.trim() || formData.name.trim(),
          firmenName: formData.firmenName.trim() || null,
          email: formData.kundeEmail.trim() || formData.email.trim(),
          telefon: formData.telefon.trim() || null,
          strasse: formData.strasse.trim() || null,
          hausNr: formData.hausNr.trim() || null,
          plz: formData.plz.trim() || null,
          ort: formData.ort.trim() || null,
          ustIdNr: formData.ustIdNr.trim() || null,
        },
      });
      setCreateResult({
        success: true,
        tempPassword: res.data.tempPassword,
        email: res.data.email || formData.email,
      });
      setLastCreatedUserId(res.data.data?.id || res.data.data?.user?.id || null);
      setWelcomeEmail(formData.email.trim());
      setWelcomeSent(false);
      setShowCreateModal(false);
      setShowResultModal(true);
      setFormData({
          name: "",
          email: "",
          role: "KUNDE",
          firmenName: "",
          ansprechpartner: "",
          kundeEmail: "",
          telefon: "",
          strasse: "",
          hausNr: "",
          plz: "",
          ort: "",
          ustIdNr: "",
        });
      fetchBenutzer();
    } catch (err: any) {
      setCreateResult({
        success: false,
        error: err?.response?.data?.error || "Fehler beim Erstellen des Benutzers",
      });
      setShowCreateModal(false);
      setShowResultModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDemo = async () => {
    setSaving(true);
    try {
      const res = await api.post("/hv/benutzer/demo");
      setCreateResult({
        success: true,
        tempPassword: res.data.tempPassword,
        email: res.data.email,
      });
      setLastCreatedUserId(res.data.data?.user?.id || null);
      setWelcomeEmail("");
      setWelcomeSent(false);
      setShowResultModal(true);
      fetchBenutzer();
    } catch (err: any) {
      setCreateResult({
        success: false,
        error: err?.response?.data?.error || "Fehler beim Erstellen des Demo-Accounts",
      });
      setShowResultModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/hv/benutzer/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      setDeleteError(null);
      fetchBenutzer();
    } catch (err: any) {
      setDeleteError(err?.response?.data?.error || "Fehler beim Löschen des Benutzers");
    } finally {
      setDeleting(false);
    }
  };

  const handleSendWelcome = async () => {
    if (!lastCreatedUserId || !createResult?.tempPassword) return;
    if (!welcomeEmail.trim()) return;
    setSendingWelcome(true);
    try {
      await api.post(`/hv/benutzer/${lastCreatedUserId}/send-welcome`, {
        password: createResult.tempPassword,
        recipientEmail: welcomeEmail.trim(),
      });
      setWelcomeSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || "E-Mail konnte nicht gesendet werden");
    } finally {
      setSendingWelcome(false);
    }
  };

  const handleCopyPassword = () => {
    if (createResult?.tempPassword) {
      navigator.clipboard.writeText(createResult.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={styles.outerContainer}>
      <style>{`@keyframes hvBenutzerSpin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={styles.tabHeader}>
        <div style={styles.tabTitle}>
          <div>
            <h2 style={styles.tabTitleH2}>Benutzer</h2>
            <p style={styles.tabTitleP}>Benutzerverwaltung fuer Ihre Kunden</p>
          </div>
        </div>
        <div style={styles.tabActions}>
          <button style={styles.btnRefresh} onClick={fetchBenutzer} title="Aktualisieren">
            <RefreshCw size={16} />
          </button>
          <button
            style={styles.btnSecondary}
            onClick={handleCreateDemo}
            disabled={saving}
          >
            <Sparkles size={16} />
            Demo-Account erstellen
          </button>
          <button
            style={styles.btnPrimary}
            onClick={() => setShowCreateModal(true)}
          >
            <UserPlus size={16} />
            Neuen Benutzer anlegen
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBanner}>
          <AlertTriangle size={16} />
          <span>{safeString(error)}</span>
        </div>
      )}

      {/* Table */}
      <div style={styles.tableContainer}>
        <table style={styles.dataTable}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>E-Mail</th>
              <th style={styles.th}>Rolle</th>
              <th style={styles.th}>Kunde</th>
              <th style={styles.th}>Erstellt am</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div style={styles.loadingCenter}>
                    <div style={styles.spinner} />
                    <span>Benutzer werden geladen...</span>
                  </div>
                </td>
              </tr>
            ) : benutzer.length === 0 ? (
              <tr>
                <td colSpan={6} style={styles.emptyState}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    <User size={32} style={{ opacity: 0.4 }} />
                    <span>Keine Benutzer vorhanden</span>
                  </div>
                </td>
              </tr>
            ) : (
              benutzer.map((b) => {
                const rl = ROLE_LABELS[b.role] || { label: b.role, color: "#71717a", bg: "rgba(113,113,122,0.15)" };
                return (
                  <tr key={b.id}>
                    <td style={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <User size={14} style={{ color: "#D4A843", flexShrink: 0 }} />
                        <span style={{ color: "#ffffff", fontWeight: 500 }}>
                          {b.name || "-"}
                        </span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <Mail size={12} style={{ color: "#71717a" }} />
                        {b.email}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.roleBadge,
                          color: rl.color,
                          background: rl.bg,
                        }}
                      >
                        {rl.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {b.kundeName ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <Building size={12} style={{ color: "#71717a" }} />
                          {b.kundeName}
                        </span>
                      ) : (
                        <span style={{ color: "#71717a" }}>-</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <Calendar size={12} style={{ color: "#71717a" }} />
                        {formatDate(b.createdAt)}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <button
                        onClick={() => { setDeleteError(null); setDeleteConfirm(b); }}
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          borderRadius: "6px",
                          color: "#ef4444",
                          padding: "6px 10px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          transition: "all 0.2s",
                        }}
                        title="Benutzer löschen"
                      >
                        <Trash2 size={12} />
                        Löschen
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div style={styles.overlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Neuen Benutzer anlegen</h3>
              <button style={styles.modalCloseBtn} onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Name</label>
                <input
                  style={styles.formInput}
                  type="text"
                  placeholder="Vor- und Nachname"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>E-Mail</label>
                <input
                  style={styles.formInput}
                  type="email"
                  placeholder="benutzer@beispiel.de"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Rolle</label>
                <select
                  style={styles.formSelect}
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as "KUNDE" | "DEMO" }))}
                >
                  <option value="KUNDE" style={{ background: "#27272a", color: "#e2e8f0" }}>Kunde</option>
                  <option value="DEMO" style={{ background: "#27272a", color: "#e2e8f0" }}>Demo-Account</option>
                </select>
              </div>

              {/* Kundendaten Section */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "16px 0", paddingTop: "16px" }}>
                <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Kundendaten / Rechnungsadresse
                </p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Firmenname</label>
                <input
                  style={styles.formInput}
                  type="text"
                  placeholder="Firma GmbH"
                  value={formData.firmenName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firmenName: e.target.value }))}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Ansprechpartner</label>
                <input
                  style={styles.formInput}
                  type="text"
                  placeholder="Max Mustermann"
                  value={formData.ansprechpartner}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ansprechpartner: e.target.value }))}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Kunden-E-Mail</label>
                  <input
                    style={styles.formInput}
                    type="email"
                    placeholder="info@firma.de"
                    value={formData.kundeEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, kundeEmail: e.target.value }))}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Telefon</label>
                  <input
                    style={styles.formInput}
                    type="tel"
                    placeholder="+49 123 456789"
                    value={formData.telefon}
                    onChange={(e) => setFormData((prev) => ({ ...prev, telefon: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "12px" }}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Strasse</label>
                  <input
                    style={styles.formInput}
                    type="text"
                    placeholder="Musterstrasse"
                    value={formData.strasse}
                    onChange={(e) => setFormData((prev) => ({ ...prev, strasse: e.target.value }))}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nr.</label>
                  <input
                    style={styles.formInput}
                    type="text"
                    placeholder="12a"
                    value={formData.hausNr}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hausNr: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>PLZ</label>
                  <input
                    style={styles.formInput}
                    type="text"
                    placeholder="12345"
                    value={formData.plz}
                    onChange={(e) => setFormData((prev) => ({ ...prev, plz: e.target.value }))}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Ort</label>
                  <input
                    style={styles.formInput}
                    type="text"
                    placeholder="Musterstadt"
                    value={formData.ort}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ort: e.target.value }))}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>USt-IdNr. (optional)</label>
                <input
                  style={styles.formInput}
                  type="text"
                  placeholder="DE123456789"
                  value={formData.ustIdNr}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ustIdNr: e.target.value }))}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.btnSecondary}
                  onClick={() => setShowCreateModal(false)}
                >
                  Abbrechen
                </button>
                <button type="submit" style={styles.btnPrimary} disabled={saving}>
                  {saving ? "Erstelle..." : "Benutzer anlegen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Modal (temp password or error) */}
      {showResultModal && createResult && (
        <div
          style={styles.overlay}
          onClick={() => {
            setShowResultModal(false);
            setCreateResult(null);
            setCopied(false);
          }}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {createResult.success ? "Benutzer erstellt" : "Fehler"}
              </h3>
              <button
                style={styles.modalCloseBtn}
                onClick={() => {
                  setShowResultModal(false);
                  setCreateResult(null);
                  setCopied(false);
                }}
              >
                <X size={18} />
              </button>
            </div>

            {createResult.success ? (
              <>
                <div style={styles.successBanner}>
                  <Check size={16} />
                  <span>Benutzer wurde erfolgreich erstellt.</span>
                </div>
                {createResult.email && (
                  <p style={{ color: "#a1a1aa", fontSize: "0.85rem", margin: "12px 0 0" }}>
                    E-Mail: <strong style={{ color: "#e2e8f0" }}>{createResult.email}</strong>
                  </p>
                )}
                {createResult.tempPassword && (
                  <div style={styles.tempPasswordBox}>
                    <p style={styles.tempPasswordLabel}>Temporaeres Passwort:</p>
                    <p style={styles.tempPasswordValue}>{createResult.tempPassword}</p>
                    <button style={styles.copyBtn} onClick={handleCopyPassword}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Kopiert!" : "Kopieren"}
                    </button>
                    <p style={{ margin: "12px 0 0", fontSize: "0.75rem", color: "#71717a" }}>
                      Bitte teilen Sie das Passwort sicher mit dem Benutzer.
                      Es muss beim ersten Login geaendert werden.
                    </p>
                  </div>
                )}
                {/* Email-Status / manuell senden */}
                {createResult.tempPassword && lastCreatedUserId && (() => {
                  const isDemo = createResult.email?.includes("@demo.gridnetz.local");
                  if (!isDemo) {
                    // Normale Benutzer: Email wurde automatisch gesendet
                    return (
                      <div style={{
                        marginTop: "16px",
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}>
                        <Check size={16} style={{ color: "#6ee7b7", flexShrink: 0 }} />
                        <span style={{ color: "#6ee7b7", fontSize: "0.85rem" }}>
                          Zugangsdaten wurden automatisch an <strong>{createResult.email}</strong> gesendet.
                        </span>
                      </div>
                    );
                  }
                  // Demo-Accounts: Manuell Email eingeben
                  return (
                    <div style={{ marginTop: "16px" }}>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "#a1a1aa", marginBottom: "6px" }}>
                        Zugangsdaten per E-Mail senden an:
                      </label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="email"
                          value={welcomeEmail}
                          onChange={(e) => setWelcomeEmail(e.target.value)}
                          placeholder="kunde@email.de"
                          disabled={welcomeSent}
                          style={{
                            flex: 1,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "8px",
                            color: "#e2e8f0",
                            padding: "10px 12px",
                            fontSize: "0.875rem",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={handleSendWelcome}
                          disabled={sendingWelcome || welcomeSent || !welcomeEmail.trim()}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: welcomeSent
                              ? "rgba(16, 185, 129, 0.15)"
                              : !welcomeEmail.trim()
                                ? "rgba(255,255,255,0.05)"
                                : "linear-gradient(135deg, #059669, #10b981)",
                            border: welcomeSent ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
                            color: welcomeSent ? "#6ee7b7" : !welcomeEmail.trim() ? "#71717a" : "#ffffff",
                            padding: "10px 16px",
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            cursor: sendingWelcome || welcomeSent || !welcomeEmail.trim() ? "default" : "pointer",
                            opacity: sendingWelcome ? 0.7 : 1,
                            transition: "all 0.2s",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {welcomeSent ? (
                            <><Check size={16} /> Gesendet!</>
                          ) : sendingWelcome ? (
                            <Loader2 size={16} style={{ animation: "hvBenutzerSpin 1s linear infinite" }} />
                          ) : (
                            <><Send size={16} /> Senden</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div style={styles.errorBanner}>
                <AlertTriangle size={16} />
                <span>{safeString(createResult.error)}</span>
              </div>
            )}

            <div style={styles.modalActions}>
              <button
                style={styles.btnPrimary}
                onClick={() => {
                  setShowResultModal(false);
                  setCreateResult(null);
                  setCopied(false);
                  setWelcomeSent(false);
                  setLastCreatedUserId(null);
                  setWelcomeEmail("");
                }}
              >
                Schliessen
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={styles.overlay} onClick={() => !deleting && setDeleteConfirm(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Benutzer löschen</h3>
              <button style={styles.modalCloseBtn} onClick={() => !deleting && setDeleteConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "16px",
            }}>
              <p style={{ margin: 0, color: "#fca5a5", fontSize: "0.875rem", lineHeight: 1.6 }}>
                Möchten Sie <strong style={{ color: "#ffffff" }}>{deleteConfirm.name || deleteConfirm.email}</strong> wirklich löschen?
              </p>
              <p style={{ margin: "8px 0 0", color: "#71717a", fontSize: "0.8rem" }}>
                {deleteConfirm.email}
              </p>
            </div>
            {deleteError && (
              <div style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <AlertTriangle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                <span style={{ color: "#fca5a5", fontSize: "0.8rem" }}>{deleteError}</span>
              </div>
            )}
            <p style={{ margin: "0 0 16px", color: "#ef4444", fontSize: "0.8rem" }}>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div style={styles.modalActions}>
              <button
                style={styles.btnSecondary}
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "#dc2626",
                  border: "none",
                  color: "#ffffff",
                  padding: "0.625rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? (
                  <><Loader2 size={16} style={{ animation: "hvBenutzerSpin 1s linear infinite" }} /> Wird gelöscht...</>
                ) : (
                  <><Trash2 size={16} /> Löschen</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HvBenutzerTab;
