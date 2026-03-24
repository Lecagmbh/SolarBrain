/**
 * SETTINGS TAB
 * Company settings, SMTP testing, anti-spam, and NB communication settings
 */

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  RefreshCw,
  Building,
  Mail,
  Shield,
  Clock,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
} from "lucide-react";
import { api } from "../../../../modules/api/client";

interface CompanySettings {
  companyName: string;
  email: string;
  telefon: string;
  strasse: string;
  hausNr: string;
  plz: string;
  ort: string;
  ustIdNr: string;
  geschaeftsfuehrer: string;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
  smtpFromName: string;
  smtpReplyTo: string;
}

interface NbSettings {
  autoNachfrageEnabled: boolean;
  nachfrageIntervalDays: number;
  maxNachfragen: number;
  erstanmeldungAutoSend: boolean;
}

type TestStatus = "idle" | "testing" | "success" | "error";

/* ── inline style helpers ── */

const styles = {
  outerContainer: {
    padding: "24px",
    maxWidth: "1600px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column" as const,
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
  },

  btnPrimaryDisabled: {
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
    cursor: "not-allowed",
    opacity: 0.7,
  },

  sectionToggle: {
    display: "flex",
    gap: "0.5rem",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "0.375rem",
    borderRadius: "12px",
    width: "fit-content" as const,
  },

  sectionToggleBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.625rem 1.25rem",
    background: "transparent",
    border: "none",
    color: "#71717a",
    fontSize: "0.875rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  sectionToggleBtnActive: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.625rem 1.25rem",
    background: "rgba(212, 168, 67, 0.15)",
    border: "none",
    color: "#a5b4fc",
    fontSize: "0.875rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  settingsContent: {
    background: "var(--dash-card-bg, rgba(255, 255, 255, 0.03))",
    border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
    borderRadius: "var(--dash-radius, 16px)",
    padding: "24px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  },

  loadingState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem",
    color: "#71717a",
    gap: "1rem",
  },

  spinner: {
    width: "24px",
    height: "24px",
    border: "2px solid rgba(212, 168, 67, 0.3)",
    borderTopColor: "#D4A843",
    borderRadius: "50%",
    animation: "settingsTabSpin 1s linear infinite",
  },

  sectionH3: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
    margin: "0 0 1.5rem 0",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },

  formGroupFull: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    gridColumn: "1 / -1",
  },

  formGroupSmall: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    maxWidth: "120px",
  },

  formLabel: {
    fontSize: "0.8rem",
    color: "#71717a",
  },

  formInput: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.625rem 0.875rem",
    fontSize: "0.85rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },

  smtpTest: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginTop: "1.5rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
  },

  testBtnIdle: {
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
  },

  testBtnTesting: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#a1a1aa",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    cursor: "not-allowed",
  },

  testBtnSuccess: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    color: "#10b981",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    cursor: "pointer",
  },

  testBtnError: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    cursor: "pointer",
  },

  testError: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    color: "#ef4444",
    fontSize: "0.8rem",
  },

  settingsCards: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },

  settingCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "1rem 1.25rem",
  },

  settingInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
  },

  settingLabel: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#ffffff",
  },

  settingDesc: {
    fontSize: "0.8rem",
    color: "#71717a",
  },

  toggle: {
    position: "relative" as const,
    display: "inline-block",
    width: "48px",
    height: "26px",
  },

  toggleInput: {
    opacity: 0,
    width: 0,
    height: 0,
    position: "absolute" as const,
  },

  inputWithUnit: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },

  inputWithUnitInput: {
    width: "70px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.5rem 0.75rem",
    fontSize: "0.9rem",
    textAlign: "center" as const,
    outline: "none",
  },

  inputWithUnitSpan: {
    color: "#71717a",
    fontSize: "0.85rem",
  },
};

function getTestBtnStyle(status: TestStatus) {
  switch (status) {
    case "testing": return styles.testBtnTesting;
    case "success": return styles.testBtnSuccess;
    case "error": return styles.testBtnError;
    default: return styles.testBtnIdle;
  }
}

export function SettingsTab() {
  const [activeSection, setActiveSection] = useState<"company" | "email" | "nb">("company");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testError, setTestError] = useState<string | null>(null);

  const [company, setCompany] = useState<CompanySettings>({
    companyName: "",
    email: "",
    telefon: "",
    strasse: "",
    hausNr: "",
    plz: "",
    ort: "",
    ustIdNr: "",
    geschaeftsfuehrer: "",
  });

  const [email, setEmail] = useState<EmailSettings>({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpFrom: "",
    smtpFromName: "",
    smtpReplyTo: "",
  });

  const [nb, setNb] = useState<NbSettings>({
    autoNachfrageEnabled: true,
    nachfrageIntervalDays: 7,
    maxNachfragen: 3,
    erstanmeldungAutoSend: false,
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/settings/company");
      const data = response.data.data || response.data;

      if (data) {
        setCompany({
          companyName: data.companyName || "",
          email: data.email || "",
          telefon: data.telefon || "",
          strasse: data.strasse || "",
          hausNr: data.hausNr || "",
          plz: data.plz || "",
          ort: data.ort || "",
          ustIdNr: data.ustIdNr || "",
          geschaeftsfuehrer: data.geschaeftsfuehrer || "",
        });

        if (data.smtp) {
          setEmail({
            smtpHost: data.smtp.host || "",
            smtpPort: data.smtp.port || 587,
            smtpUser: data.smtp.user || "",
            smtpFrom: data.smtp.from || "",
            smtpFromName: data.smtp.fromName || "",
            smtpReplyTo: data.smtp.replyTo || "",
          });
        }

        if (data.nbSettings) {
          setNb({
            autoNachfrageEnabled: data.nbSettings.autoNachfrageEnabled ?? true,
            nachfrageIntervalDays: data.nbSettings.nachfrageIntervalDays || 7,
            maxNachfragen: data.nbSettings.maxNachfragen || 3,
            erstanmeldungAutoSend: data.nbSettings.erstanmeldungAutoSend ?? false,
          });
        }
      }
    } catch (err) {
      console.error("[SettingsTab] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put("/settings/company", {
        ...company,
        smtp: email,
        nbSettings: nb,
      });
      alert("Einstellungen gespeichert");
    } catch (err: any) {
      alert(err.response?.data?.error || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    try {
      setTestStatus("testing");
      setTestError(null);
      await api.post("/emails/test-smtp", { recipient: company.email || email.smtpFrom });
      setTestStatus("success");
    } catch (err: any) {
      setTestStatus("error");
      setTestError(err.response?.data?.error || "SMTP-Test fehlgeschlagen");
    }
  };

  return (
    <div style={styles.outerContainer}>
      {/* Keyframe for spinner + toggle */}
      <style>{`
        @keyframes settingsTabSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .settings-toggle-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 26px;
          transition: 0.3s;
        }
        .settings-toggle-slider::before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background: #fff;
          border-radius: 50%;
          transition: 0.3s;
        }
        .settings-toggle-input:checked + .settings-toggle-slider {
          background: linear-gradient(135deg, #D4A843, #EAD068);
        }
        .settings-toggle-input:checked + .settings-toggle-slider::before {
          transform: translateX(22px);
        }
      `}</style>

      {/* Header */}
      <div style={styles.tabHeader}>
        <div style={styles.tabTitle}>
          <Settings size={24} />
          <div>
            <h2 style={styles.tabTitleH2}>Einstellungen</h2>
            <p style={styles.tabTitleP}>System- und Firmenkonfiguration</p>
          </div>
        </div>
        <div style={styles.tabActions}>
          <button style={styles.btnRefresh} onClick={fetchSettings} disabled={loading}>
            <RefreshCw size={16} style={loading ? { animation: "settingsTabSpin 1s linear infinite" } : undefined} />
          </button>
          <button
            style={saving ? styles.btnPrimaryDisabled : styles.btnPrimary}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader size={16} style={{ animation: "settingsTabSpin 1s linear infinite" }} /> : <Save size={16} />}
            Speichern
          </button>
        </div>
      </div>

      {/* Section Toggle */}
      <div style={styles.sectionToggle}>
        <button
          style={activeSection === "company" ? styles.sectionToggleBtnActive : styles.sectionToggleBtn}
          onClick={() => setActiveSection("company")}
        >
          <Building size={16} />
          Firmendaten
        </button>
        <button
          style={activeSection === "email" ? styles.sectionToggleBtnActive : styles.sectionToggleBtn}
          onClick={() => setActiveSection("email")}
        >
          <Mail size={16} />
          E-Mail / SMTP
        </button>
        <button
          style={activeSection === "nb" ? styles.sectionToggleBtnActive : styles.sectionToggleBtn}
          onClick={() => setActiveSection("nb")}
        >
          <Clock size={16} />
          NB-Kommunikation
        </button>
      </div>

      {/* Content */}
      <div style={styles.settingsContent}>
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            Lade Einstellungen...
          </div>
        ) : (
          <>
            {/* Company Settings */}
            {activeSection === "company" && (
              <div>
                <h3 style={styles.sectionH3}>
                  <Building size={18} />
                  Firmendaten
                </h3>
                <div style={styles.formGrid}>
                  <div style={styles.formGroupFull}>
                    <label style={styles.formLabel}>Firmenname</label>
                    <input
                      type="text"
                      value={company.companyName}
                      onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                      placeholder="Baunity GmbH"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>E-Mail</label>
                    <input
                      type="email"
                      value={company.email}
                      onChange={(e) => setCompany({ ...company, email: e.target.value })}
                      placeholder="info@baunity.de"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Telefon</label>
                    <input
                      type="tel"
                      value={company.telefon}
                      onChange={(e) => setCompany({ ...company, telefon: e.target.value })}
                      placeholder="+49 123 456789"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Straße</label>
                    <input
                      type="text"
                      value={company.strasse}
                      onChange={(e) => setCompany({ ...company, strasse: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroupSmall}>
                    <label style={styles.formLabel}>Hausnr.</label>
                    <input
                      type="text"
                      value={company.hausNr}
                      onChange={(e) => setCompany({ ...company, hausNr: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroupSmall}>
                    <label style={styles.formLabel}>PLZ</label>
                    <input
                      type="text"
                      value={company.plz}
                      onChange={(e) => setCompany({ ...company, plz: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Ort</label>
                    <input
                      type="text"
                      value={company.ort}
                      onChange={(e) => setCompany({ ...company, ort: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>USt-IdNr.</label>
                    <input
                      type="text"
                      value={company.ustIdNr}
                      onChange={(e) => setCompany({ ...company, ustIdNr: e.target.value })}
                      placeholder="DE123456789"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Geschäftsführer</label>
                    <input
                      type="text"
                      value={company.geschaeftsfuehrer}
                      onChange={(e) => setCompany({ ...company, geschaeftsfuehrer: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeSection === "email" && (
              <div>
                <h3 style={styles.sectionH3}>
                  <Mail size={18} />
                  E-Mail / SMTP Konfiguration
                </h3>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>SMTP Host</label>
                    <input
                      type="text"
                      value={email.smtpHost}
                      onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })}
                      placeholder="smtp.example.com"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroupSmall}>
                    <label style={styles.formLabel}>Port</label>
                    <input
                      type="number"
                      value={email.smtpPort}
                      onChange={(e) => setEmail({ ...email, smtpPort: parseInt(e.target.value) || 587 })}
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>SMTP Benutzer</label>
                    <input
                      type="text"
                      value={email.smtpUser}
                      onChange={(e) => setEmail({ ...email, smtpUser: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Absender E-Mail</label>
                    <input
                      type="email"
                      value={email.smtpFrom}
                      onChange={(e) => setEmail({ ...email, smtpFrom: e.target.value })}
                      placeholder="noreply@baunity.de"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Absender Name</label>
                    <input
                      type="text"
                      value={email.smtpFromName}
                      onChange={(e) => setEmail({ ...email, smtpFromName: e.target.value })}
                      placeholder="Baunity Portal"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Reply-To</label>
                    <input
                      type="email"
                      value={email.smtpReplyTo}
                      onChange={(e) => setEmail({ ...email, smtpReplyTo: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>

                {/* SMTP Test */}
                <div style={styles.smtpTest}>
                  <button
                    style={getTestBtnStyle(testStatus)}
                    onClick={handleTestSmtp}
                    disabled={testStatus === "testing"}
                  >
                    {testStatus === "testing" ? (
                      <Loader size={16} style={{ animation: "settingsTabSpin 1s linear infinite" }} />
                    ) : testStatus === "success" ? (
                      <CheckCircle size={16} />
                    ) : testStatus === "error" ? (
                      <XCircle size={16} />
                    ) : (
                      <TestTube size={16} />
                    )}
                    {testStatus === "testing" ? "Teste..." :
                     testStatus === "success" ? "Test erfolgreich" :
                     testStatus === "error" ? "Test fehlgeschlagen" :
                     "SMTP testen"}
                  </button>
                  {testError && (
                    <span style={styles.testError}>
                      <AlertTriangle size={14} />
                      {testError}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* NB Communication Settings */}
            {activeSection === "nb" && (
              <div>
                <h3 style={styles.sectionH3}>
                  <Clock size={18} />
                  NB-Kommunikation Einstellungen
                </h3>
                <div style={styles.settingsCards}>
                  <div style={styles.settingCard}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Automatische Nachfragen</span>
                      <span style={styles.settingDesc}>
                        Automatische Nachfrage-Emails an Netzbetreiber senden
                      </span>
                    </div>
                    <label style={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={nb.autoNachfrageEnabled}
                        onChange={(e) => setNb({ ...nb, autoNachfrageEnabled: e.target.checked })}
                        className="settings-toggle-input"
                        style={styles.toggleInput}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  <div style={styles.settingCard}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Nachfrage-Intervall</span>
                      <span style={styles.settingDesc}>
                        Tage zwischen automatischen Nachfragen
                      </span>
                    </div>
                    <div style={styles.inputWithUnit}>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={nb.nachfrageIntervalDays}
                        onChange={(e) => setNb({ ...nb, nachfrageIntervalDays: parseInt(e.target.value) || 7 })}
                        style={styles.inputWithUnitInput}
                      />
                      <span style={styles.inputWithUnitSpan}>Tage</span>
                    </div>
                  </div>

                  <div style={styles.settingCard}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Max. Nachfragen</span>
                      <span style={styles.settingDesc}>
                        Maximale Anzahl automatischer Nachfragen pro Anlage
                      </span>
                    </div>
                    <div style={styles.inputWithUnit}>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={nb.maxNachfragen}
                        onChange={(e) => setNb({ ...nb, maxNachfragen: parseInt(e.target.value) || 3 })}
                        style={styles.inputWithUnitInput}
                      />
                      <span style={styles.inputWithUnitSpan}>x</span>
                    </div>
                  </div>

                  <div style={styles.settingCard}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Auto-Erstanmeldung</span>
                      <span style={styles.settingDesc}>
                        Erstanmeldung automatisch an NB senden wenn Dokumente komplett
                      </span>
                    </div>
                    <label style={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={nb.erstanmeldungAutoSend}
                        onChange={(e) => setNb({ ...nb, erstanmeldungAutoSend: e.target.checked })}
                        className="settings-toggle-input"
                        style={styles.toggleInput}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SettingsTab;
