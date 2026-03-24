/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  🏢 MEIN PROFIL / FIRMENEINSTELLUNGEN                                        ║
 * ║  Benutzer können hier ihre eigenen Daten und Firmendaten bearbeiten          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { apiGet, apiPatch, apiPost } from "../modules/api/client";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  role: string;
  kundeId: number | null;
  kunde?: {
    id: number;
    firma: string | null;
    strasse: string | null;
    hausNr: string | null;
    plz: string | null;
    ort: string | null;
    land: string | null;
    telefon: string | null;
    email: string | null;
    ustId: string | null;
    steuernummer: string | null;
    ansprechpartner: string | null;
  } | null;
}

type Toast = { type: "ok" | "error"; msg: string } | null;

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const Icon = {
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  mapPin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  receipt: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>,
  key: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>,
  save: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
  page: {
    padding: "24px",
    maxWidth: "900px",
    margin: "0 auto",
  } as React.CSSProperties,
  header: {
    padding: "24px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, rgba(212,168,67,0.15) 0%, rgba(139,92,246,0.1) 100%)",
    border: "1px solid rgba(255,255,255,0.1)",
    marginBottom: "24px",
  } as React.CSSProperties,
  title: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#fff",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "12px",
  } as React.CSSProperties,
  subtitle: {
    fontSize: "14px",
    opacity: 0.7,
    marginTop: "8px",
  } as React.CSSProperties,
  section: {
    padding: "24px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    marginBottom: "20px",
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 700,
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#fff",
  } as React.CSSProperties,
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  } as React.CSSProperties,
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s",
  } as React.CSSProperties,
  inputDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  } as React.CSSProperties,
  btnPrimary: {
    padding: "12px 24px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #D4A843 0%, #EAD068 100%)",
    border: "none",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  } as React.CSSProperties,
  btnSecondary: {
    padding: "12px 24px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  } as React.CSSProperties,
  toast: {
    position: "fixed" as const,
    bottom: "24px",
    right: "24px",
    padding: "14px 20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    fontWeight: 600,
    zIndex: 9999,
    animation: "slideIn 0.3s ease",
  },
  toastOk: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
  } as React.CSSProperties,
  toastError: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#fff",
  } as React.CSSProperties,
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px",
    fontSize: "16px",
    opacity: 0.6,
  } as React.CSSProperties,
  passwordWrap: {
    position: "relative" as const,
  },
  passwordToggle: {
    position: "absolute" as const,
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function MyCompanySettingsPage() {
  const { user: authUser } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  
  // Profildaten
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Formular: Persönliche Daten
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  // Formular: Firmendaten
  const [firma, setFirma] = useState("");
  const [strasse, setStrasse] = useState("");
  const [hausNr, setHausNr] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [land, setLand] = useState("Deutschland");
  const [telefon, setTelefon] = useState("");
  const [firmaEmail, setFirmaEmail] = useState("");
  const [ansprechpartner, setAnsprechpartner] = useState("");
  
  // Formular: Rechnungsdaten
  const [ustId, setUstId] = useState("");
  const [steuernummer, setSteuernummer] = useState("");
  
  // Formular: Passwort ändern
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Toast helper
  const showToast = useCallback((type: "ok" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Load profile data
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet("/auth/v2/me");
      const data = res.data || res;
      setProfile(data);
      
      // Persönliche Daten
      setName(data.name || "");
      setEmail(data.email || "");
      
      // Firmendaten (falls Kunde)
      if (data.kunde) {
        setFirma(data.kunde.firma || "");
        setStrasse(data.kunde.strasse || "");
        setHausNr(data.kunde.hausNr || "");
        setPlz(data.kunde.plz || "");
        setOrt(data.kunde.ort || "");
        setLand(data.kunde.land || "Deutschland");
        setTelefon(data.kunde.telefon || "");
        setFirmaEmail(data.kunde.email || "");
        setAnsprechpartner(data.kunde.ansprechpartner || "");
        setUstId(data.kunde.ustId || "");
        setSteuernummer(data.kunde.steuernummer || "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      showToast("error", "Profil konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Save profile
  const handleSave = async () => {
    setSaving(true);
    try {
      // Persönliche Daten speichern
      await apiPatch("/auth/me", {
        name,
      });
      
      // Firmendaten speichern (falls Kunde)
      if (profile?.kundeId) {
        await apiPatch("/auth/me/kunde", {
          firma,
          strasse,
          hausNr,
          plz,
          ort,
          land,
          telefon,
          email: firmaEmail,
          ansprechpartner,
          ustId,
          steuernummer,
        });
      }
      
      showToast("ok", "Änderungen gespeichert");
      loadProfile(); // Reload to confirm
    } catch (err: any) {
      console.error("Save failed:", err);
      showToast("error", err?.response?.data?.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      showToast("error", "Bitte alle Passwortfelder ausfüllen");
      return;
    }
    if (newPw !== confirmPw) {
      showToast("error", "Neue Passwörter stimmen nicht überein");
      return;
    }
    if (newPw.length < 8) {
      showToast("error", "Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }
    
    setChangingPw(true);
    try {
      await apiPost("/auth/change-password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      
      showToast("ok", "Passwort erfolgreich geändert");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: any) {
      console.error("Password change failed:", err);
      showToast("error", err?.response?.data?.message || "Passwort ändern fehlgeschlagen");
    } finally {
      setChangingPw(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>
          Lade Profildaten...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{
          ...styles.toast,
          ...(toast.type === "ok" ? styles.toastOk : styles.toastError),
        }}>
          <span style={{ width: 18, height: 18 }}>
            {toast.type === "ok" ? Icon.check : Icon.x}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span style={{ width: 28, height: 28 }}>{Icon.user}</span>
          Mein Profil
        </h1>
        <p style={styles.subtitle}>
          Verwalte deine persönlichen Daten und Firmeninformationen
        </p>
      </div>

      {/* Persönliche Daten */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span style={{ width: 20, height: 20 }}>{Icon.user}</span>
          Persönliche Daten
        </div>
        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>E-Mail</label>
            <input
              style={{ ...styles.input, ...styles.inputDisabled }}
              value={email}
              disabled
              title="E-Mail kann nicht geändert werden"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Rolle</label>
            <input
              style={{ ...styles.input, ...styles.inputDisabled }}
              value={profile?.role || "-"}
              disabled
            />
          </div>
        </div>
      </div>

      {/* Firmendaten (nur wenn Kunde) */}
      {profile?.kundeId && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <span style={{ width: 20, height: 20 }}>{Icon.building}</span>
            Firmendaten
          </div>
          <div style={styles.grid}>
            <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Firmenname</label>
              <input
                style={styles.input}
                value={firma}
                onChange={(e) => setFirma(e.target.value)}
                placeholder="Firmenname"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Ansprechpartner</label>
              <input
                style={styles.input}
                value={ansprechpartner}
                onChange={(e) => setAnsprechpartner(e.target.value)}
                placeholder="Ansprechpartner"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Telefon</label>
              <input
                style={styles.input}
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="+49 123 456789"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Firmen-E-Mail</label>
              <input
                style={styles.input}
                type="email"
                value={firmaEmail}
                onChange={(e) => setFirmaEmail(e.target.value)}
                placeholder="info@firma.de"
              />
            </div>
          </div>
        </div>
      )}

      {/* Adresse (nur wenn Kunde) */}
      {profile?.kundeId && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <span style={{ width: 20, height: 20 }}>{Icon.mapPin}</span>
            Adresse
          </div>
          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>Straße</label>
              <input
                style={styles.input}
                value={strasse}
                onChange={(e) => setStrasse(e.target.value)}
                placeholder="Musterstraße"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Hausnummer</label>
              <input
                style={styles.input}
                value={hausNr}
                onChange={(e) => setHausNr(e.target.value)}
                placeholder="123"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>PLZ</label>
              <input
                style={styles.input}
                value={plz}
                onChange={(e) => setPlz(e.target.value)}
                placeholder="12345"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Ort</label>
              <input
                style={styles.input}
                value={ort}
                onChange={(e) => setOrt(e.target.value)}
                placeholder="Musterstadt"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Land</label>
              <input
                style={styles.input}
                value={land}
                onChange={(e) => setLand(e.target.value)}
                placeholder="Deutschland"
              />
            </div>
          </div>
        </div>
      )}

      {/* Rechnungsdaten (nur wenn Kunde) */}
      {profile?.kundeId && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <span style={{ width: 20, height: 20 }}>{Icon.receipt}</span>
            Rechnungsdaten
          </div>
          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>USt-IdNr.</label>
              <input
                style={styles.input}
                value={ustId}
                onChange={(e) => setUstId(e.target.value)}
                placeholder="DE123456789"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Steuernummer</label>
              <input
                style={styles.input}
                value={steuernummer}
                onChange={(e) => setSteuernummer(e.target.value)}
                placeholder="123/456/78901"
              />
            </div>
          </div>
        </div>
      )}

      {/* Speichern Button */}
      <div style={{ marginBottom: "20px" }}>
        <button
          style={{
            ...styles.btnPrimary,
            opacity: saving ? 0.7 : 1,
          }}
          onClick={handleSave}
          disabled={saving}
        >
          <span style={{ width: 18, height: 18 }}>{Icon.save}</span>
          {saving ? "Speichert..." : "Änderungen speichern"}
        </button>
      </div>

      {/* Passwort ändern */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span style={{ width: 20, height: 20 }}>{Icon.key}</span>
          Passwort ändern
        </div>
        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label}>Aktuelles Passwort</label>
            <div style={styles.passwordWrap}>
              <input
                style={{ ...styles.input, paddingRight: "40px", width: "100%", boxSizing: "border-box" as const }}
                type={showCurrentPw ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                style={styles.passwordToggle}
                onClick={() => setShowCurrentPw(!showCurrentPw)}
              >
                <span style={{ width: 18, height: 18 }}>
                  {showCurrentPw ? Icon.eyeOff : Icon.eye}
                </span>
              </button>
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Neues Passwort</label>
            <div style={styles.passwordWrap}>
              <input
                style={{ ...styles.input, paddingRight: "40px", width: "100%", boxSizing: "border-box" as const }}
                type={showNewPw ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                style={styles.passwordToggle}
                onClick={() => setShowNewPw(!showNewPw)}
              >
                <span style={{ width: 18, height: 18 }}>
                  {showNewPw ? Icon.eyeOff : Icon.eye}
                </span>
              </button>
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Passwort bestätigen</label>
            <input
              style={styles.input}
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>
        <div style={{ marginTop: "20px" }}>
          <button
            style={{
              ...styles.btnSecondary,
              opacity: changingPw ? 0.7 : 1,
            }}
            onClick={handleChangePassword}
            disabled={changingPw}
          >
            <span style={{ width: 18, height: 18 }}>{Icon.key}</span>
            {changingPw ? "Ändert..." : "Passwort ändern"}
          </button>
        </div>
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
