/**
 * Portal Settings Page
 * ====================
 * Einstellungsseite für Endkunden: Passwort ändern, WhatsApp verwalten.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePortal } from "../PortalContext";
import {
  getPortalSettings,
  changePassword,
  removeWhatsApp,
  getWhatsAppStatus,
  type PortalSettings,
  type WhatsAppStatus,
} from "../api";
import {
  Loader2,
  ArrowLeft,
  Settings,
  Lock,
  MessageCircle,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Smartphone,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

export function PortalSettingsPage() {
  const navigate = useNavigate();
  const { selectedInstallation } = usePortal();

  const [settings, setSettings] = useState<PortalSettings | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // WhatsApp state
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [pollingForVerification, setPollingForVerification] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [settingsData, whatsappData] = await Promise.all([
        getPortalSettings(),
        getWhatsAppStatus(),
      ]);
      setSettings(settingsData);
      setWhatsappStatus(whatsappData);
    } catch (err) {
      console.error("Settings load error:", err);
      setError("Fehler beim Laden der Einstellungen");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Die Passwörter stimmen nicht überein");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Das Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Fehler beim Ändern des Passworts");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRemoveWhatsApp = async () => {
    if (!confirm("Möchten Sie die WhatsApp-Verknüpfung wirklich entfernen?")) return;

    try {
      setWhatsappLoading(true);
      await removeWhatsApp();
      setWhatsappStatus(prev => prev ? { ...prev, consent: false, verified: false, number: null } : null);
      if (settings) {
        setSettings({ ...settings, whatsappConsent: false, whatsappVerified: false, whatsappNumber: null });
      }
    } catch (err: any) {
      setWhatsappError(err.message || "Fehler beim Entfernen der WhatsApp-Verknüpfung");
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleConnectWhatsApp = () => {
    setShowWhatsAppModal(true);
    setPollingForVerification(true);
    startPolling();
  };

  const startPolling = async () => {
    const maxTime = 5 * 60 * 1000; // 5 Minuten
    const startTime = Date.now();

    const poll = async () => {
      if (Date.now() - startTime > maxTime) {
        setPollingForVerification(false);
        return;
      }

      try {
        const status = await getWhatsAppStatus();
        if (status.verified) {
          setWhatsappStatus(status);
          setSettings(prev => prev ? {
            ...prev,
            whatsappConsent: true,
            whatsappVerified: true,
            whatsappNumber: status.number
          } : null);
          setShowWhatsAppModal(false);
          setPollingForVerification(false);
          return;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      setTimeout(poll, 1500);
    };

    poll();
  };

  const getWhatsAppLink = () => {
    if (!whatsappStatus || !selectedInstallation) return null;
    const message = encodeURIComponent(`START ${selectedInstallation.id}`);
    const phone = whatsappStatus.businessNumber.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${message}`;
  };

  if (loading) {
    return (
      <>
        <div className="ps-loading">
          <Loader2 size={32} className="ps-spin" />
          <span>Einstellungen laden...</span>
        </div>
        <style>{settingsStyles}</style>
      </>
    );
  }

  if (error || !settings) {
    return (
      <>
        <div className="ps-error">
          <AlertCircle size={48} />
          <h2>Fehler</h2>
          <p>{error || "Einstellungen konnten nicht geladen werden"}</p>
          <button onClick={() => navigate("/portal")} className="ps-btn">
            Zurück zum Dashboard
          </button>
        </div>
        <style>{settingsStyles}</style>
      </>
    );
  }

  return (
    <>
      <div className="ps-page">
        {/* Header */}
        <header className="ps-header">
          <button onClick={() => navigate("/portal")} className="ps-back-btn">
            <ArrowLeft size={20} />
          </button>
          <div className="ps-header-icon">
            <Settings size={24} />
          </div>
          <div>
            <h1>Einstellungen</h1>
            <p>Passwort und Benachrichtigungen verwalten</p>
          </div>
        </header>

        {/* Content */}
        <div className="ps-content">
          {/* Account Info */}
          <div className="ps-card">
            <div className="ps-card-header">
              <h2>Ihr Konto</h2>
            </div>
            <div className="ps-info-row">
              <span className="ps-info-label">E-Mail</span>
              <span className="ps-info-value">{settings.email}</span>
            </div>
            {settings.name && (
              <div className="ps-info-row">
                <span className="ps-info-label">Name</span>
                <span className="ps-info-value">{settings.name}</span>
              </div>
            )}
          </div>

          {/* Password Change */}
          <div className="ps-card">
            <div className="ps-card-header">
              <Lock size={20} />
              <h2>Passwort ändern</h2>
            </div>

            {passwordSuccess && (
              <div className="ps-alert ps-alert--success">
                <CheckCircle size={18} />
                <span>Passwort erfolgreich geändert!</span>
              </div>
            )}

            {passwordError && (
              <div className="ps-alert ps-alert--error">
                <AlertCircle size={18} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="ps-form">
              <div className="ps-field">
                <label>Aktuelles Passwort</label>
                <div className="ps-input-wrap">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    className="ps-eye-btn"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="ps-field">
                <label>Neues Passwort</label>
                <div className="ps-input-wrap">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    className="ps-eye-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <span className="ps-hint">Mindestens 8 Zeichen</span>
              </div>

              <div className="ps-field">
                <label>Passwort bestätigen</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={passwordLoading}
                />
              </div>

              <button type="submit" className="ps-btn ps-btn--primary" disabled={passwordLoading}>
                {passwordLoading ? (
                  <>
                    <Loader2 size={18} className="ps-spin" />
                    Ändern...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Passwort ändern
                  </>
                )}
              </button>
            </form>
          </div>

          {/* WhatsApp */}
          <div className="ps-card">
            <div className="ps-card-header">
              <MessageCircle size={20} />
              <h2>WhatsApp-Benachrichtigungen</h2>
            </div>

            {whatsappError && (
              <div className="ps-alert ps-alert--error">
                <AlertCircle size={18} />
                <span>{whatsappError}</span>
              </div>
            )}

            {settings.whatsappVerified ? (
              <div className="ps-whatsapp-status">
                <div className="ps-whatsapp-connected">
                  <div className="ps-whatsapp-icon ps-whatsapp-icon--connected">
                    <CheckCircle size={24} />
                  </div>
                  <div className="ps-whatsapp-info">
                    <span className="ps-whatsapp-label">WhatsApp verbunden</span>
                    <span className="ps-whatsapp-number">{settings.whatsappNumber}</span>
                  </div>
                </div>
                <p className="ps-whatsapp-desc">
                  Sie erhalten Benachrichtigungen zu Rückfragen und wichtigen Updates per WhatsApp.
                </p>
                <button
                  onClick={handleRemoveWhatsApp}
                  className="ps-btn ps-btn--danger"
                  disabled={whatsappLoading}
                >
                  {whatsappLoading ? (
                    <>
                      <Loader2 size={18} className="ps-spin" />
                      Entfernen...
                    </>
                  ) : (
                    <>
                      <X size={18} />
                      WhatsApp-Verknüpfung entfernen
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="ps-whatsapp-status">
                <div className="ps-whatsapp-not-connected">
                  <div className="ps-whatsapp-icon">
                    <Smartphone size={24} />
                  </div>
                  <div className="ps-whatsapp-info">
                    <span className="ps-whatsapp-label">WhatsApp nicht verbunden</span>
                    <span className="ps-whatsapp-sublabel">Aktivieren Sie WhatsApp für schnellere Benachrichtigungen</span>
                  </div>
                </div>
                <p className="ps-whatsapp-desc">
                  Mit WhatsApp erhalten Sie Benachrichtigungen direkt auf Ihr Handy -
                  schneller und bequemer als per E-Mail.
                </p>
                <button
                  onClick={handleConnectWhatsApp}
                  className="ps-btn ps-btn--whatsapp"
                >
                  <MessageCircle size={18} />
                  WhatsApp verbinden
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && whatsappStatus && (
        <div className="ps-modal-overlay" onClick={() => setShowWhatsAppModal(false)}>
          <div className="ps-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ps-modal-close" onClick={() => setShowWhatsAppModal(false)}>
              <X size={20} />
            </button>

            <div className="ps-modal-icon">
              <MessageCircle size={32} />
            </div>

            <h3>WhatsApp verbinden</h3>
            <p>
              Senden Sie uns eine WhatsApp-Nachricht mit dem folgenden Code,
              um Benachrichtigungen zu aktivieren:
            </p>

            <div className="ps-modal-code">
              START {selectedInstallation?.id}
            </div>

            <div className="ps-modal-phone">
              <span>An:</span>
              <strong>{whatsappStatus.businessNumber}</strong>
            </div>

            {pollingForVerification && (
              <div className="ps-modal-waiting">
                <Loader2 size={20} className="ps-spin" />
                <span>Warte auf Ihre Nachricht...</span>
              </div>
            )}

            <div className="ps-modal-actions">
              <a href={getWhatsAppLink() || "#"} target="_blank" className="ps-btn ps-btn--whatsapp">
                <MessageCircle size={18} />
                WhatsApp öffnen
                <ExternalLink size={14} />
              </a>
            </div>

            <p className="ps-modal-hint">
              Sie haben 5 Minuten Zeit. Nach dem Senden wird die Verbindung automatisch hergestellt.
            </p>
          </div>
        </div>
      )}

      <style>{settingsStyles}</style>
    </>
  );
}

const settingsStyles = `
  .ps-page {
    animation: psFadeIn 0.4s ease-out;
  }

  @keyframes psFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes psSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .ps-spin {
    animation: psSpin 1s linear infinite;
  }

  /* Loading & Error */
  .ps-loading,
  .ps-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
  }

  .ps-loading svg {
    color: #D4A843;
    margin-bottom: 16px;
  }

  .ps-error svg {
    color: rgba(255, 255, 255, 0.3);
    margin-bottom: 16px;
  }

  .ps-error h2 {
    font-size: 20px;
    color: #fff;
    margin: 0 0 8px 0;
  }

  .ps-error p {
    margin: 0 0 20px 0;
  }

  /* Header */
  .ps-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
  }

  .ps-back-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.2s;
  }

  .ps-back-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .ps-header-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(212, 168, 67, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
    border: 1px solid rgba(212, 168, 67, 0.3);
    border-radius: 14px;
    color: #EAD068;
  }

  .ps-header h1 {
    font-size: 28px;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .ps-header p {
    margin: 4px 0 0 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }

  /* Content */
  .ps-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 600px;
  }

  /* Cards */
  .ps-card {
    background: rgba(10, 10, 15, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    overflow: hidden;
  }

  .ps-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .ps-card-header svg {
    color: #EAD068;
  }

  .ps-card-header h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Info rows */
  .ps-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  .ps-info-row:last-child {
    border-bottom: none;
  }

  .ps-info-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }

  .ps-info-value {
    font-size: 14px;
    color: #fff;
    font-weight: 500;
  }

  /* Alerts */
  .ps-alert {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 16px 20px;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
  }

  .ps-alert--success {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #34d399;
  }

  .ps-alert--error {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  /* Form */
  .ps-form {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .ps-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ps-field label {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
  }

  .ps-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .ps-field input {
    width: 100%;
    padding: 12px 14px;
    font-size: 14px;
    color: #fff;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    outline: none;
    transition: all 0.2s;
  }

  .ps-input-wrap input {
    padding-right: 44px;
  }

  .ps-field input:focus {
    border-color: rgba(212, 168, 67, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  .ps-field input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ps-eye-btn {
    position: absolute;
    right: 10px;
    padding: 6px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: color 0.2s;
  }

  .ps-eye-btn:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  .ps-hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  /* Buttons */
  .ps-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .ps-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .ps-btn--primary {
    background: #D4A843;
    color: #fff;
  }

  .ps-btn--primary:hover:not(:disabled) {
    background: #b8942e;
  }

  .ps-btn--danger {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  .ps-btn--danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.25);
  }

  .ps-btn--whatsapp {
    background: #25D366;
    color: #fff;
  }

  .ps-btn--whatsapp:hover:not(:disabled) {
    background: #1fb855;
  }

  /* WhatsApp Status */
  .ps-whatsapp-status {
    padding: 20px;
  }

  .ps-whatsapp-connected,
  .ps-whatsapp-not-connected {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  .ps-whatsapp-icon {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  .ps-whatsapp-icon--connected {
    background: rgba(37, 211, 102, 0.15);
    color: #25D366;
  }

  .ps-whatsapp-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ps-whatsapp-label {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
  }

  .ps-whatsapp-number,
  .ps-whatsapp-sublabel {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
  }

  .ps-whatsapp-desc {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 16px 0;
  }

  /* Modal */
  .ps-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .ps-modal {
    position: relative;
    width: 100%;
    max-width: 420px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 32px;
    text-align: center;
  }

  .ps-modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s;
  }

  .ps-modal-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .ps-modal-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(37, 211, 102, 0.15);
    border-radius: 16px;
    color: #25D366;
  }

  .ps-modal h3 {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 12px 0;
  }

  .ps-modal p {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 20px 0;
  }

  .ps-modal-code {
    padding: 16px 24px;
    font-size: 20px;
    font-weight: 700;
    font-family: "SF Mono", Monaco, monospace;
    color: #25D366;
    background: rgba(37, 211, 102, 0.1);
    border: 2px dashed rgba(37, 211, 102, 0.4);
    border-radius: 12px;
    margin-bottom: 16px;
    letter-spacing: 1px;
  }

  .ps-modal-phone {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 20px;
  }

  .ps-modal-phone strong {
    color: #fff;
    font-weight: 600;
    margin-left: 6px;
  }

  .ps-modal-waiting {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px;
    background: rgba(212, 168, 67, 0.1);
    border-radius: 10px;
    font-size: 14px;
    color: #EAD068;
    margin-bottom: 20px;
  }

  .ps-modal-actions {
    margin-bottom: 16px;
  }

  .ps-modal-actions .ps-btn {
    width: 100%;
  }

  .ps-modal-hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
  }

  /* Mobile */
  @media (max-width: 640px) {
    .ps-header {
      flex-wrap: wrap;
    }

    .ps-header h1 {
      font-size: 24px;
    }
  }
`;
