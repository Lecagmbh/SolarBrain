/**
 * Portal Onboarding Page
 * ======================
 * WhatsApp-Verifizierung im Bank-Stil:
 * - Kein Nummern-Eingabe nötig
 * - Popup mit START-Code + Countdown
 * - Automatische Erkennung durch Backend
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getOnboardingStatus,
  saveOnboardingConsent,
  completeOnboarding,
  getWhatsAppStatus,
  type OnboardingStatus,
} from "../api";
import {
  CheckCircle,
  ArrowRight,
  Mail,
  MessageCircle,
  MapPin,
  Zap,
  Loader2,
  AlertCircle,
  X,
  Clock,
  Smartphone,
  ExternalLink,
} from "lucide-react";

type Step = "welcome" | "consent";

export function OnboardingPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [emailConsent, setEmailConsent] = useState(true);

  // WhatsApp Modal
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const ob = await getOnboardingStatus();
        setOnboarding(ob);

        if (ob.onboardingCompleted) {
          navigate("/portal");
          return;
        }

        setEmailConsent(ob.emailConsent);
      } catch (err) {
        console.error("Load error:", err);
        setError("Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  // WhatsApp verification polling when modal is open
  useEffect(() => {
    if (!showWhatsAppModal || !onboarding || verified) return;

    let cancelled = false;
    let pollInterval: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const checkVerification = async () => {
      if (cancelled || verified) return;

      setChecking(true);
      try {
        const status = await getWhatsAppStatus();
        console.log("[WhatsApp] Status check:", status);

        if (status?.verified) {
          console.log("[WhatsApp] ✅ VERIFIED!");
          setVerified(true);

          // Complete onboarding
          try {
            await completeOnboarding(onboarding.installationId);
          } catch (e) {
            console.error("Complete error:", e);
          }

          // Redirect after animation - ALWAYS redirect, ignore cancelled
          setTimeout(() => {
            console.log("[WhatsApp] Redirecting to portal...");
            window.location.href = "/portal";
          }, 2000);
        }
      } catch (err) {
        console.error("[WhatsApp] Check error:", err);
      } finally {
        setChecking(false);
      }
    };

    // Start polling every 1.5 seconds
    checkVerification();
    pollInterval = setInterval(checkVerification, 1500);

    // Countdown timer
    countdownInterval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, [showWhatsAppModal, onboarding, verified, navigate]);

  // Open WhatsApp modal
  const openWhatsAppVerification = useCallback(async () => {
    if (!onboarding) return;

    // Save email consent first
    try {
      await saveOnboardingConsent({
        installationId: onboarding.installationId,
        emailConsent: true,
        whatsappConsent: true, // Intent to use WhatsApp
      });
    } catch (err) {
      console.error("Save consent error:", err);
    }

    // Reset state and show modal
    setCountdown(300);
    setVerified(false);
    setShowWhatsAppModal(true);
  }, [onboarding]);

  // Continue without WhatsApp
  const continueWithoutWhatsApp = useCallback(async () => {
    if (!onboarding) return;

    setSaving(true);
    try {
      await saveOnboardingConsent({
        installationId: onboarding.installationId,
        emailConsent: true,
        whatsappConsent: false,
      });
      await completeOnboarding(onboarding.installationId);
      navigate("/portal");
    } catch (err) {
      console.error("Continue error:", err);
      setError("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }, [onboarding, navigate]);

  // Close modal and continue without WhatsApp
  const closeModalAndContinue = useCallback(async () => {
    setShowWhatsAppModal(false);
    await continueWithoutWhatsApp();
  }, [continueWithoutWhatsApp]);

  // Format countdown
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="ob-page">
        <div className="ob-center">
          <Loader2 size={32} className="ob-spin" />
          <p>Laden...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (!onboarding) {
    return (
      <div className="ob-page">
        <div className="ob-center">
          <AlertCircle size={48} />
          <h1>Fehler</h1>
          <p>Daten konnten nicht geladen werden.</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="ob-page">
      <div className="ob-container">

        {/* Welcome Step */}
        {step === "welcome" && (
          <div className="ob-card ob-animate">
            <div className="ob-logo">G</div>
            <h1 className="ob-title">Willkommen im Kundenportal</h1>

            <div className="ob-info-box">
              <p className="ob-intro">
                <strong>{onboarding.installateurName}</strong> hat uns beauftragt,
                die Netzanmeldung für Ihre Anlage durchzuführen.
              </p>

              <div className="ob-info-item">
                <MapPin size={18} />
                <div>
                  <span className="ob-label">Anlagenadresse</span>
                  <span className="ob-value">{onboarding.address}</span>
                </div>
              </div>

              {onboarding.anlagenTyp && (
                <div className="ob-info-item">
                  <Zap size={18} className="ob-icon-yellow" />
                  <div>
                    <span className="ob-label">Anlagentyp</span>
                    <span className="ob-value">{formatAnlagenTyp(onboarding.anlagenTyp)}</span>
                  </div>
                </div>
              )}
            </div>

            <ul className="ob-features">
              <li><CheckCircle size={16} /> Status Ihrer Anmeldung verfolgen</li>
              <li><CheckCircle size={16} /> Bei Rückfragen direkt antworten</li>
              <li><CheckCircle size={16} /> Dokumente hochladen</li>
            </ul>

            <button onClick={() => setStep("consent")} className="ob-btn ob-btn-primary">
              Weiter <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Consent Step */}
        {step === "consent" && (
          <div className="ob-card ob-animate">
            <h1 className="ob-title">Benachrichtigungen</h1>
            <p className="ob-subtitle">Wie möchten Sie informiert werden?</p>

            {error && (
              <div className="ob-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Email Option - Always active */}
            <div className="ob-option ob-option-active">
              <div className="ob-option-icon"><Mail size={20} /></div>
              <div className="ob-option-text">
                <span className="ob-option-name">E-Mail <span className="ob-badge">Pflicht</span></span>
                <span className="ob-option-desc">Statusupdates per E-Mail</span>
              </div>
              <CheckCircle size={22} className="ob-option-check" />
            </div>

            {/* WhatsApp DEAKTIVIERT */}

            <button
              onClick={continueWithoutWhatsApp}
              disabled={saving}
              className="ob-btn ob-btn-primary"
            >
              {saving ? <Loader2 size={18} className="ob-spin" /> : null}
              Weiter
            </button>
          </div>
        )}

      </div>

      {/* WhatsApp Verification Modal */}
      {showWhatsAppModal && (
        <div className="ob-modal-overlay">
          <div className={`ob-modal ${verified ? "ob-modal-success" : ""}`}>

            {!verified ? (
              <>
                {/* Header */}
                <div className="ob-modal-header">
                  <div className="ob-modal-icon">
                    <MessageCircle size={28} />
                  </div>
                  <button onClick={closeModalAndContinue} className="ob-modal-close">
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="ob-modal-content">
                  <h2 className="ob-modal-title">WhatsApp verbinden</h2>
                  <p className="ob-modal-text">
                    Senden Sie diese Nachricht per WhatsApp, um Ihre Nummer zu verifizieren:
                  </p>

                  {/* Code Box */}
                  <div className="ob-modal-code-box">
                    <div className="ob-modal-number">
                      <Smartphone size={18} />
                      <span>+49 15567 095659</span>
                    </div>
                    <div className="ob-modal-code">
                      START {onboarding.installationId}
                    </div>
                  </div>

                  {/* WhatsApp Button */}
                  <a
                    href={`https://wa.me/4915567095659?text=${encodeURIComponent(`START ${onboarding.installationId}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ob-btn ob-btn-whatsapp"
                  >
                    <MessageCircle size={18} />
                    WhatsApp öffnen
                    <ExternalLink size={14} />
                  </a>

                  {/* Timer */}
                  <div className="ob-modal-timer">
                    <Clock size={16} />
                    <span>Gültig für {formatTime(countdown)}</span>
                  </div>

                  {/* Status */}
                  <div className="ob-modal-status">
                    {checking ? (
                      <>
                        <Loader2 size={16} className="ob-spin" />
                        <span>Warte auf Bestätigung...</span>
                      </>
                    ) : (
                      <>
                        <div className="ob-modal-dot" />
                        <span>Nachricht noch nicht empfangen</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="ob-modal-footer">
                  <button onClick={closeModalAndContinue} className="ob-modal-skip">
                    Überspringen und ohne WhatsApp fortfahren
                  </button>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="ob-modal-success-content">
                <div className="ob-success-icon">
                  <CheckCircle size={48} />
                </div>
                <h2 className="ob-success-title">WhatsApp verbunden!</h2>
                <p className="ob-success-text">
                  Sie werden automatisch weitergeleitet...
                </p>
                <Loader2 size={24} className="ob-spin ob-success-loader" />
              </div>
            )}

          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

function formatAnlagenTyp(t: string): string {
  const map: Record<string, string> = {
    PV: "Photovoltaikanlage",
    PV_SPEICHER: "PV mit Speicher",
    SPEICHER: "Batteriespeicher",
    WALLBOX: "Wallbox",
    WAERMEPUMPE: "Wärmepumpe",
    BALKONKRAFTWERK: "Balkonkraftwerk",
    EINSPEISER: "Einspeiseanlage",
    einspeiser: "Einspeiseanlage",
  };
  return map[t] || t;
}

const styles = `
  .ob-page {
    min-height: 100vh;
    background: linear-gradient(145deg, #060b18 0%, #1a1a2e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .ob-center {
    text-align: center;
    color: rgba(255,255,255,0.5);
  }

  .ob-center h1 { color: #fff; margin: 16px 0 8px; }

  .ob-container {
    width: 100%;
    max-width: 420px;
  }

  .ob-animate {
    animation: fadeUp 0.35s ease-out;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .ob-spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Card */
  .ob-card {
    background: rgba(12, 12, 20, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 28px 24px;
  }

  .ob-logo {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #D4A843, #a855f7);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 800;
    color: #fff;
    margin: 0 auto 20px;
    box-shadow: 0 10px 30px rgba(212,168,67,0.3);
  }

  .ob-title {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    text-align: center;
    margin: 0 0 6px;
  }

  .ob-subtitle {
    color: rgba(255,255,255,0.5);
    font-size: 14px;
    text-align: center;
    margin: 0 0 20px;
  }

  /* Info Box */
  .ob-info-box {
    background: rgba(0,0,0,0.25);
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 20px;
  }

  .ob-intro {
    color: rgba(255,255,255,0.7);
    font-size: 14px;
    margin: 0 0 14px;
    line-height: 1.5;
  }

  .ob-intro strong { color: #fff; }

  .ob-info-item {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }

  .ob-info-item svg {
    color: #EAD068;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .ob-icon-yellow { color: #fbbf24 !important; }

  .ob-label {
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255,255,255,0.4);
  }

  .ob-value {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    margin-top: 2px;
  }

  /* Features */
  .ob-features {
    list-style: none;
    padding: 0;
    margin: 0 0 24px;
  }

  .ob-features li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    font-size: 14px;
    color: rgba(255,255,255,0.8);
  }

  .ob-features svg { color: #34d399; }

  /* Options */
  .ob-option {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    margin-bottom: 12px;
  }

  .ob-option-active {
    border-color: rgba(212,168,67,0.4);
    background: rgba(212,168,67,0.08);
  }

  .ob-option-whatsapp {
    cursor: pointer;
    transition: all 0.2s;
  }

  .ob-option-whatsapp:hover {
    border-color: rgba(52,211,153,0.5);
    background: rgba(52,211,153,0.08);
  }

  .ob-option-icon {
    width: 44px;
    height: 44px;
    background: rgba(212,168,67,0.15);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #EAD068;
    flex-shrink: 0;
  }

  .ob-option-icon-green {
    background: rgba(52,211,153,0.15);
    color: #34d399;
  }

  .ob-option-text { flex: 1; }

  .ob-option-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
  }

  .ob-option-desc {
    display: block;
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    margin-top: 2px;
  }

  .ob-option-check { color: #D4A843; }
  .ob-option-arrow { color: rgba(255,255,255,0.4); }

  .ob-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(212,168,67,0.2);
    color: #a5b4fc;
  }

  .ob-badge-optional {
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6);
  }

  /* Buttons */
  .ob-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 15px 24px;
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .ob-btn-primary {
    background: linear-gradient(135deg, #D4A843, #a855f7);
    color: #fff;
    box-shadow: 0 8px 24px rgba(212,168,67,0.3);
  }

  .ob-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(212,168,67,0.4);
  }

  .ob-btn-secondary {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.7);
    border: 1px solid rgba(255,255,255,0.1);
    margin-top: 12px;
  }

  .ob-btn-secondary:hover {
    background: rgba(255,255,255,0.1);
  }

  .ob-btn-whatsapp {
    background: linear-gradient(135deg, #16a34a, #22c55e);
    color: #fff;
    box-shadow: 0 8px 24px rgba(34,197,94,0.3);
    margin-bottom: 16px;
  }

  .ob-btn-whatsapp:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(34,197,94,0.4);
  }

  .ob-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  /* Error */
  .ob-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 10px;
    color: #fca5a5;
    font-size: 14px;
    margin-bottom: 16px;
  }

  /* Modal Overlay */
  .ob-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Modal */
  .ob-modal {
    background: linear-gradient(180deg, #1a1a2e 0%, #0a1128 100%);
    border: 1px solid rgba(52,211,153,0.2);
    border-radius: 24px;
    width: 100%;
    max-width: 380px;
    overflow: hidden;
    animation: modalPop 0.3s ease-out;
  }

  @keyframes modalPop {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .ob-modal-success {
    border-color: rgba(16,185,129,0.4);
  }

  .ob-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 0;
  }

  .ob-modal-icon {
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, #16a34a, #22c55e);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 8px 24px rgba(34,197,94,0.3);
  }

  .ob-modal-close {
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.06);
    border: none;
    border-radius: 10px;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .ob-modal-close:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }

  .ob-modal-content {
    padding: 24px;
    text-align: center;
  }

  .ob-modal-title {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 8px;
  }

  .ob-modal-text {
    color: rgba(255,255,255,0.6);
    font-size: 14px;
    margin: 0 0 20px;
    line-height: 1.5;
  }

  .ob-modal-code-box {
    background: rgba(0,0,0,0.3);
    border: 2px solid rgba(52,211,153,0.3);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .ob-modal-number {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: rgba(255,255,255,0.7);
    font-size: 14px;
    margin-bottom: 12px;
  }

  .ob-modal-code {
    font-size: 28px;
    font-weight: 800;
    font-family: 'SF Mono', Monaco, monospace;
    color: #34d399;
    letter-spacing: 2px;
  }

  .ob-modal-timer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: rgba(255,255,255,0.5);
    font-size: 14px;
    margin-bottom: 20px;
  }

  .ob-modal-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: rgba(255,255,255,0.03);
    border-radius: 10px;
    color: rgba(255,255,255,0.6);
    font-size: 13px;
  }

  .ob-modal-dot {
    width: 8px;
    height: 8px;
    background: #f59e0b;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .ob-modal-footer {
    padding: 16px 24px 24px;
    text-align: center;
  }

  .ob-modal-skip {
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    font-size: 13px;
    cursor: pointer;
    padding: 8px;
    transition: color 0.2s;
  }

  .ob-modal-skip:hover {
    color: rgba(255,255,255,0.7);
  }

  /* Success State */
  .ob-modal-success-content {
    padding: 48px 24px;
    text-align: center;
  }

  .ob-success-icon {
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin: 0 auto 24px;
    box-shadow: 0 16px 40px rgba(16,185,129,0.4);
    animation: successPop 0.4s ease-out;
  }

  @keyframes successPop {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  .ob-success-title {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 12px;
  }

  .ob-success-text {
    color: rgba(255,255,255,0.6);
    font-size: 15px;
    margin: 0 0 24px;
  }

  .ob-success-loader {
    color: #34d399;
  }

  /* Responsive */
  @media (max-width: 420px) {
    .ob-modal-code {
      font-size: 24px;
    }
  }
`;
