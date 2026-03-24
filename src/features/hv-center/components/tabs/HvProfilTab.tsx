/**
 * HV PROFIL TAB
 * Handelsvertreter profile with read-only info and editable bank details
 */

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import {
  UserCircle,
  RefreshCw,
  AlertTriangle,
  Check,
  Save,
  Building,
  CreditCard,
  Percent,
  FileText,
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

interface Handelsvertreter {
  id: number;
  userId: number;
  firmenName: string | null;
  steuerNr: string | null;
  ustIdNr: string | null;
  provisionssatz: number;  // Backend sendet lowercase
  iban: string | null;
  bic: string | null;
  bankName: string | null;
  kontoinhaber: string | null;
}

interface HvProfilFormData {
  iban: string;
  bic: string;
  bankName: string;
  kontoinhaber: string;
}

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
  glassCard: {
    background: "var(--dash-card-bg, rgba(255, 255, 255, 0.03))",
    border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  readOnlyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "16px",
  },
  readOnlyField: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  fieldLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  fieldValue: {
    fontSize: "0.95rem",
    color: "#e2e8f0",
    fontWeight: 500,
  },
  fieldValueHighlight: {
    fontSize: "1.25rem",
    color: "#D4A843",
    fontWeight: 700,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
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
    transition: "border-color 0.2s",
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "linear-gradient(135deg, #D4A843, #EAD068)",
    border: "none",
    color: "#ffffff",
    padding: "0.625rem 1.25rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
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
    animation: "hvProfilSpin 1s linear infinite",
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
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "8px",
  },
};

/* ── Component ── */

export function HvProfilTab() {
  const [profil, setProfil] = useState<Handelsvertreter | null>(null);
  const [formData, setFormData] = useState<HvProfilFormData>({
    iban: "",
    bic: "",
    bankName: "",
    kontoinhaber: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchProfil = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/hv/profil");
      const data: Handelsvertreter = res.data.data;
      setProfil(data);
      setFormData({
        iban: data.iban || "",
        bic: data.bic || "",
        bankName: data.bankName || "",
        kontoinhaber: data.kontoinhaber || "",
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Fehler beim Laden des Profils");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfil();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put("/hv/profil", formData);
      setSuccess("Bankdaten erfolgreich gespeichert.");
      // Clear success after 4 seconds
      setTimeout(() => setSuccess(null), 4000);
      fetchProfil();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Fehler beim Speichern der Bankdaten");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof HvProfilFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={styles.outerContainer}>
      <style>{`@keyframes hvProfilSpin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={styles.tabHeader}>
        <div style={styles.tabTitle}>
          <div>
            <h2 style={styles.tabTitleH2}>Profil</h2>
            <p style={styles.tabTitleP}>
              Ihre Handelsvertreter-Daten und Bankverbindung
            </p>
          </div>
        </div>
        <button style={styles.btnRefresh} onClick={fetchProfil} title="Aktualisieren">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBanner}>
          <AlertTriangle size={16} />
          <span>{safeString(error)}</span>
        </div>
      )}

      {/* Success */}
      {success && (
        <div style={styles.successBanner}>
          <Check size={16} />
          <span>{safeString(success)}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={styles.loadingCenter}>
          <div style={styles.spinner} />
          <span>Profil wird geladen...</span>
        </div>
      )}

      {/* Content */}
      {!loading && profil && (
        <>
          {/* Read-only Section */}
          <div style={styles.glassCard}>
            <h3 style={styles.sectionTitle}>
              <Building size={18} style={{ color: "#D4A843" }} />
              Unternehmensdaten
            </h3>
            <div style={styles.readOnlyGrid}>
              <div style={styles.readOnlyField}>
                <span style={styles.fieldLabel}>
                  <Percent size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                  Provisionssatz
                </span>
                <span style={styles.fieldValueHighlight}>
                  {(profil.provisionssatz ?? 0).toFixed(2)} %
                </span>
              </div>
              <div style={styles.readOnlyField}>
                <span style={styles.fieldLabel}>Firmenname</span>
                <span style={styles.fieldValue}>{profil.firmenName || "-"}</span>
              </div>
              <div style={styles.readOnlyField}>
                <span style={styles.fieldLabel}>
                  <FileText size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                  Steuer-Nr
                </span>
                <span style={styles.fieldValue}>{profil.steuerNr || "-"}</span>
              </div>
              <div style={styles.readOnlyField}>
                <span style={styles.fieldLabel}>USt-IdNr</span>
                <span style={styles.fieldValue}>{profil.ustIdNr || "-"}</span>
              </div>
            </div>
          </div>

          {/* Editable Bank Details */}
          <div style={styles.glassCard}>
            <h3 style={styles.sectionTitle}>
              <CreditCard size={18} style={{ color: "#10b981" }} />
              Bankverbindung
            </h3>
            <form onSubmit={handleSave}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>IBAN</label>
                  <input
                    style={styles.formInput}
                    type="text"
                    placeholder="DE89 3704 0044 0532 0130 00"
                    value={formData.iban}
                    onChange={(e) => handleInputChange("iban", e.target.value)}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>BIC</label>
                  <input
                    style={styles.formInput}
                    type="text"
                    placeholder="COBADEFFXXX"
                    value={formData.bic}
                    onChange={(e) => handleInputChange("bic", e.target.value)}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Bankname</label>
                  <input
                    style={styles.formInput}
                    type="text"
                    placeholder="Commerzbank"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange("bankName", e.target.value)}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Kontoinhaber</label>
                  <input
                    style={styles.formInput}
                    type="text"
                    placeholder="Max Mustermann GmbH"
                    value={formData.kontoinhaber}
                    onChange={(e) => handleInputChange("kontoinhaber", e.target.value)}
                  />
                </div>
              </div>
              <div style={styles.formActions}>
                <button
                  type="submit"
                  style={{
                    ...styles.btnPrimary,
                    ...(saving ? styles.btnDisabled : {}),
                  }}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Wird gespeichert..." : "Bankdaten speichern"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Empty state if no profile loaded and no error */}
      {!loading && !profil && !error && (
        <div style={styles.glassCard}>
          <div style={{ textAlign: "center", padding: "2rem", color: "#71717a" }}>
            <UserCircle size={48} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
            <p style={{ margin: 0 }}>Kein Handelsvertreter-Profil gefunden</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HvProfilTab;
