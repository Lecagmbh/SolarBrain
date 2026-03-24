/**
 * WhatsApp Integration Page
 * =========================
 * Premium-looking page for WhatsApp integration activation
 */

import { useState, useEffect } from "react";
import {
  MessageCircle,
  Copy,
  Check,
  Smartphone,
  QrCode,
  Zap,
  BarChart3,
  MessageSquare,
  Unlink,
  Loader2,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { getAccessToken } from "../modules/auth/tokenStorage";

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const styles = `
.wa-page { min-height: 100vh; background: linear-gradient(135deg, #0a0a0f 0%, #0d0d14 50%, #0a0f1a 100%); padding: 32px; position: relative; }
.wa-orb { position: fixed; border-radius: 50%; filter: blur(100px); opacity: 0.25; pointer-events: none; z-index: 0; }
.wa-orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #22c55e 0%, transparent 70%); left: -200px; top: 5%; }
.wa-orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #D4A843 0%, transparent 70%); right: -100px; bottom: 20%; }
.wa-container { max-width: 900px; margin: 0 auto; position: relative; z-index: 10; }

/* Header */
.wa-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
.wa-header-left { display: flex; align-items: center; gap: 16px; }
.wa-header-icon { width: 56px; height: 56px; background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(34, 197, 94, 0.35); }
.wa-header-icon svg { width: 28px; height: 28px; color: white; }
.wa-header-title { font-size: 26px; font-weight: 800; color: white; margin: 0 0 4px 0; }
.wa-header-subtitle { color: rgba(255,255,255,0.5); font-size: 14px; margin: 0; }
.wa-status-badge { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 999px; }
.wa-status-badge svg { width: 18px; height: 18px; color: #4ade80; }
.wa-status-badge span { color: #4ade80; font-weight: 600; font-size: 14px; }

/* Stats Grid */
.wa-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
@media (max-width: 768px) { .wa-stats { grid-template-columns: 1fr; } }
.wa-stat-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 24px; }
.wa-stat-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.wa-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.wa-stat-icon.indigo { background: rgba(212, 168, 67, 0.15); }
.wa-stat-icon.purple { background: rgba(139, 92, 246, 0.15); }
.wa-stat-icon.cyan { background: rgba(6, 182, 212, 0.15); }
.wa-stat-icon svg { width: 22px; height: 22px; }
.wa-stat-icon.indigo svg { color: #EAD068; }
.wa-stat-icon.purple svg { color: #f0d878; }
.wa-stat-icon.cyan svg { color: #22d3ee; }
.wa-stat-label { color: rgba(255,255,255,0.5); font-size: 13px; }
.wa-stat-value { font-size: 28px; font-weight: 800; color: white; margin: 0; }
.wa-stat-sub { color: rgba(255,255,255,0.4); font-size: 13px; margin-top: 4px; }

/* Card */
.wa-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 28px; margin-bottom: 24px; }
.wa-card-title { font-size: 18px; font-weight: 700; color: white; margin: 0 0 16px 0; }

/* Number Display */
.wa-number-row { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 14px; border: 1px solid rgba(255,255,255,0.06); }
.wa-number-info { display: flex; align-items: center; gap: 14px; }
.wa-number-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.wa-number-icon svg { width: 24px; height: 24px; color: white; }
.wa-number-text { font-size: 22px; font-weight: 700; color: white; font-family: ui-monospace, monospace; }
.wa-number-hint { color: rgba(255,255,255,0.45); font-size: 13px; }
.wa-chat-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: rgba(34, 197, 94, 0.15); border: none; border-radius: 10px; color: #4ade80; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; text-decoration: none; }
.wa-chat-btn:hover { background: rgba(34, 197, 94, 0.25); }
.wa-chat-btn svg { width: 18px; height: 18px; }

/* Disconnect */
.wa-disconnect { display: flex; justify-content: flex-end; margin-top: 16px; }
.wa-disconnect-btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: transparent; border: none; color: #f87171; font-weight: 500; font-size: 14px; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
.wa-disconnect-btn:hover { background: rgba(248, 113, 113, 0.1); }
.wa-disconnect-btn svg { width: 18px; height: 18px; }

/* Multi-Number List */
.wa-numbers-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.wa-number-item { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; transition: all 0.2s; }
.wa-number-item:hover { border-color: rgba(255,255,255,0.12); }
.wa-number-left { display: flex; align-items: center; gap: 14px; }
.wa-number-avatar { width: 44px; height: 44px; background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.wa-number-avatar svg { width: 22px; height: 22px; color: white; }
.wa-number-details { display: flex; flex-direction: column; gap: 2px; }
.wa-number-phone { font-size: 17px; font-weight: 600; color: white; font-family: ui-monospace, monospace; }
.wa-number-meta { font-size: 13px; color: rgba(255,255,255,0.45); }
.wa-remove-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: transparent; border: none; border-radius: 8px; color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.2s; }
.wa-remove-btn:hover { background: rgba(248, 113, 113, 0.15); color: #f87171; }
.wa-remove-btn svg { width: 18px; height: 18px; }
.wa-remove-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Add Number Section */
.wa-add-section { padding: 20px; background: rgba(212, 168, 67, 0.08); border: 1px dashed rgba(212, 168, 67, 0.25); border-radius: 14px; margin-top: 16px; }
.wa-add-title { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; color: white; margin-bottom: 16px; }
.wa-add-title svg { width: 20px; height: 20px; color: #EAD068; }
.wa-add-row { display: flex; align-items: center; gap: 12px; }
.wa-add-code { display: flex; align-items: center; gap: 10px; flex: 1; padding: 12px 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; }
.wa-add-code-value { font-size: 18px; font-weight: 700; color: white; font-family: ui-monospace, monospace; letter-spacing: 1px; }
.wa-add-copy { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(255,255,255,0.08); border: none; border-radius: 8px; color: white; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.wa-add-copy:hover { background: rgba(255,255,255,0.15); }
.wa-add-copy svg { width: 16px; height: 16px; }
.wa-add-copy.copied { color: #4ade80; }
.wa-add-hint { font-size: 13px; color: rgba(255,255,255,0.45); margin-top: 12px; }

/* ═══════════════════════════════════════════════════════════════════════════
   NOT ACTIVATED STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

.wa-hero { text-align: center; margin-bottom: 48px; }
.wa-hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 999px; margin-bottom: 24px; }
.wa-hero-badge svg { width: 16px; height: 16px; color: #4ade80; }
.wa-hero-badge span { color: #4ade80; font-size: 13px; font-weight: 600; }
.wa-hero-icon { width: 96px; height: 96px; background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); border-radius: 28px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 20px 60px rgba(34, 197, 94, 0.35); }
.wa-hero-icon svg { width: 48px; height: 48px; color: white; }
.wa-hero h1 { font-size: 36px; font-weight: 800; color: white; margin: 0 0 16px 0; }
.wa-hero p { font-size: 18px; color: rgba(255,255,255,0.55); max-width: 600px; margin: 0 auto; line-height: 1.6; }

/* Steps */
.wa-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 48px; }
@media (max-width: 768px) { .wa-steps { grid-template-columns: 1fr; } }
.wa-step { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 28px; text-align: center; }
.wa-step-num { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 22px; font-weight: 800; }
.wa-step-num.s1 { background: rgba(212, 168, 67, 0.15); color: #EAD068; }
.wa-step-num.s2 { background: rgba(139, 92, 246, 0.15); color: #f0d878; }
.wa-step-num.s3 { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
.wa-step h3 { font-size: 17px; font-weight: 700; color: white; margin: 0 0 8px 0; }
.wa-step p { font-size: 14px; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.5; }

/* Activation Card */
.wa-activation { background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.12); border-radius: 28px; padding: 36px; margin-bottom: 32px; }
.wa-activation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
@media (max-width: 900px) { .wa-activation-grid { grid-template-columns: 1fr; } }

.wa-field { margin-bottom: 28px; }
.wa-field-label { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 10px; }
.wa-field-box { display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; }
.wa-field-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.wa-field-icon svg { width: 22px; height: 22px; color: white; }
.wa-field-value { font-size: 24px; font-weight: 700; color: white; font-family: ui-monospace, monospace; }

.wa-code-box { display: flex; align-items: center; gap: 14px; padding: 18px 20px; background: linear-gradient(135deg, rgba(212, 168, 67, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%); border: 1px solid rgba(212, 168, 67, 0.25); border-radius: 14px; }
.wa-code-value { font-size: 30px; font-weight: 800; color: white; font-family: ui-monospace, monospace; letter-spacing: 2px; flex: 1; }
.wa-copy-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: rgba(255,255,255,0.08); border: none; border-radius: 10px; color: white; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; }
.wa-copy-btn:hover { background: rgba(255,255,255,0.15); }
.wa-copy-btn svg { width: 18px; height: 18px; }
.wa-copy-btn.copied { color: #4ade80; }

.wa-open-btn { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; padding: 18px 24px; background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); border: none; border-radius: 14px; color: white; font-size: 18px; font-weight: 700; cursor: pointer; transition: all 0.2s; text-decoration: none; box-shadow: 0 8px 32px rgba(34, 197, 94, 0.35); }
.wa-open-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(34, 197, 94, 0.45); }
.wa-open-btn svg { width: 24px; height: 24px; }

/* QR Code */
.wa-qr-wrapper { display: flex; flex-direction: column; align-items: center; }
.wa-qr-box { padding: 20px; background: white; border-radius: 20px; margin-bottom: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
.wa-qr-box img { width: 180px; height: 180px; display: block; }
.wa-qr-hint { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.45); font-size: 13px; }
.wa-qr-hint svg { width: 16px; height: 16px; }

/* Features */
.wa-features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
@media (max-width: 768px) { .wa-features { grid-template-columns: 1fr; } }
.wa-feature { display: flex; align-items: flex-start; gap: 14px; padding: 18px; background: rgba(255,255,255,0.03); border-radius: 14px; }
.wa-feature-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.wa-feature-icon.indigo { background: rgba(212, 168, 67, 0.15); }
.wa-feature-icon.purple { background: rgba(139, 92, 246, 0.15); }
.wa-feature-icon.green { background: rgba(34, 197, 94, 0.15); }
.wa-feature-icon.cyan { background: rgba(6, 182, 212, 0.15); }
.wa-feature-icon svg { width: 22px; height: 22px; }
.wa-feature-icon.indigo svg { color: #EAD068; }
.wa-feature-icon.purple svg { color: #f0d878; }
.wa-feature-icon.green svg { color: #4ade80; }
.wa-feature-icon.cyan svg { color: #22d3ee; }
.wa-feature h4 { font-size: 15px; font-weight: 700; color: white; margin: 0 0 4px 0; }
.wa-feature p { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0; line-height: 1.5; }

/* Loading */
.wa-loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
.wa-loading svg { width: 40px; height: 40px; color: #D4A843; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   API HELPER
   ═══════════════════════════════════════════════════════════════════════════ */

const API_BASE = "/api";

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface LinkedNumber {
  phoneNumber: string;
  displayName?: string;
  activatedAt: string;
}

interface WhatsAppStatus {
  activated: boolean;
  activationCode: string;
  // Legacy
  phoneNumber?: string;
  activatedAt?: string;
  // Multi-Nummern
  linkedNumbers: LinkedNumber[];
  whatsappNumber: string;
  stats: {
    installations: number;
    messages: number;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function WhatsAppIntegrationPage() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [removingPhone, setRemovingPhone] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: WhatsAppStatus }>("/whatsapp/me");
      setStatus(response.data);
    } catch (error) {
      console.error("Failed to load WhatsApp status:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!status?.activationCode) return;
    await navigator.clipboard.writeText(status.activationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveNumber = async (phoneNumber: string) => {
    if (!confirm(`Möchten Sie die Nummer ${formatPhone(phoneNumber)} wirklich entfernen?`)) return;

    setRemovingPhone(phoneNumber);
    try {
      await apiRequest(`/whatsapp/me/${encodeURIComponent(phoneNumber)}`, { method: "DELETE" });
      await loadStatus();
    } catch (error) {
      console.error("Failed to remove number:", error);
      alert("Fehler beim Entfernen der Nummer");
    } finally {
      setRemovingPhone(null);
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("49") && cleaned.length >= 10) {
      return `+49 ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
    }
    return `+${cleaned}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const whatsappDeepLink = status
    ? `https://wa.me/${status.whatsappNumber}?text=${encodeURIComponent(status.activationCode)}`
    : "";

  const qrCodeUrl = status
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(whatsappDeepLink)}&bgcolor=ffffff&color=000000`
    : "";

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="wa-page">
          <div className="wa-orb wa-orb-1" />
          <div className="wa-orb wa-orb-2" />
          <div className="wa-loading">
            <Loader2 />
          </div>
        </div>
      </>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ACTIVATED STATE
     ═══════════════════════════════════════════════════════════════════════════ */

  if (status?.activated) {
    const linkedNumbers = status.linkedNumbers || [];

    return (
      <>
        <style>{styles}</style>
        <div className="wa-page">
          <div className="wa-orb wa-orb-1" />
          <div className="wa-orb wa-orb-2" />
          <div className="wa-container">
            {/* Header */}
            <div className="wa-header">
              <div className="wa-header-left">
                <div className="wa-header-icon">
                  <MessageCircle />
                </div>
                <div>
                  <h1 className="wa-header-title">WhatsApp Integration</h1>
                  <p className="wa-header-subtitle">Anlagen einfach per WhatsApp anlegen</p>
                </div>
              </div>
              <div className="wa-status-badge">
                <CheckCircle />
                <span>{linkedNumbers.length} Nummer{linkedNumbers.length !== 1 ? 'n' : ''} aktiv</span>
              </div>
            </div>

            {/* Stats */}
            <div className="wa-stats">
              <div className="wa-stat-card">
                <div className="wa-stat-header">
                  <div className="wa-stat-icon indigo">
                    <Users />
                  </div>
                  <span className="wa-stat-label">Verknüpfte Nummern</span>
                </div>
                <p className="wa-stat-value">{linkedNumbers.length}</p>
                <p className="wa-stat-sub">Mitarbeiter/Geräte</p>
              </div>

              <div className="wa-stat-card">
                <div className="wa-stat-header">
                  <div className="wa-stat-icon purple">
                    <Zap />
                  </div>
                  <span className="wa-stat-label">Anlagen erstellt</span>
                </div>
                <p className="wa-stat-value">{status.stats.installations}</p>
                <p className="wa-stat-sub">per WhatsApp</p>
              </div>

              <div className="wa-stat-card">
                <div className="wa-stat-header">
                  <div className="wa-stat-icon cyan">
                    <MessageSquare />
                  </div>
                  <span className="wa-stat-label">Nachrichten</span>
                </div>
                <p className="wa-stat-value">{status.stats.messages}</p>
                <p className="wa-stat-sub">gesendet/empfangen</p>
              </div>
            </div>

            {/* Verknüpfte Nummern */}
            <div className="wa-card">
              <h3 className="wa-card-title">Verknüpfte Nummern</h3>
              <div className="wa-numbers-list">
                {linkedNumbers.map((num) => (
                  <div key={num.phoneNumber} className="wa-number-item">
                    <div className="wa-number-left">
                      <div className="wa-number-avatar">
                        <Smartphone />
                      </div>
                      <div className="wa-number-details">
                        <span className="wa-number-phone">{formatPhone(num.phoneNumber)}</span>
                        <span className="wa-number-meta">
                          {num.displayName ? `${num.displayName} · ` : ''}
                          Aktiviert am {formatDate(num.activatedAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      className="wa-remove-btn"
                      onClick={() => handleRemoveNumber(num.phoneNumber)}
                      disabled={removingPhone === num.phoneNumber}
                      title="Nummer entfernen"
                    >
                      {removingPhone === num.phoneNumber ? (
                        <Loader2 className="spin" />
                      ) : (
                        <Trash2 />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Weitere Nummer hinzufügen */}
              <div className="wa-add-section">
                <div className="wa-add-title">
                  <Plus />
                  Weitere Nummer hinzufügen
                </div>
                <div className="wa-add-row">
                  <div className="wa-add-code">
                    <span className="wa-add-code-value">{status.activationCode}</span>
                  </div>
                  <button onClick={copyCode} className={`wa-add-copy ${copied ? "copied" : ""}`}>
                    {copied ? <Check /> : <Copy />}
                    {copied ? "Kopiert!" : "Kopieren"}
                  </button>
                  <a
                    href={whatsappDeepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wa-chat-btn"
                  >
                    <MessageCircle />
                    Aktivieren
                  </a>
                </div>
                <p className="wa-add-hint">
                  Senden Sie diesen Code von einer neuen Nummer an {formatPhone(status.whatsappNumber)}
                </p>
              </div>
            </div>

            {/* Baunity Number */}
            <div className="wa-card">
              <h3 className="wa-card-title">Baunity WhatsApp-Nummer</h3>
              <div className="wa-number-row">
                <div className="wa-number-info">
                  <div className="wa-number-icon">
                    <MessageCircle />
                  </div>
                  <div>
                    <p className="wa-number-text">{formatPhone(status.whatsappNumber)}</p>
                    <p className="wa-number-hint">Senden Sie Anlagen-Daten an diese Nummer</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${status.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wa-chat-btn"
                >
                  <MessageCircle />
                  Chat öffnen
                </a>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     NOT ACTIVATED STATE
     ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <>
      <style>{styles}</style>
      <div className="wa-page">
        <div className="wa-orb wa-orb-1" />
        <div className="wa-orb wa-orb-2" />
        <div className="wa-container">
          {/* Hero */}
          <div className="wa-hero">
            <div className="wa-hero-badge">
              <Sparkles />
              <span>Neues Feature</span>
            </div>
            <div className="wa-hero-icon">
              <MessageCircle />
            </div>
            <h1>Anlagen per WhatsApp anlegen</h1>
            <p>
              Schicken Sie einfach die Anlagendaten per WhatsApp – wir erledigen den Rest.
              Kein Formular, kein Tippen, einfach eine Nachricht.
            </p>
          </div>

          {/* Steps */}
          <div className="wa-steps">
            <div className="wa-step">
              <div className="wa-step-num s1">1</div>
              <h3>Nummer speichern</h3>
              <p>Speichern Sie unsere WhatsApp-Nummer in Ihren Kontakten</p>
            </div>
            <div className="wa-step">
              <div className="wa-step-num s2">2</div>
              <h3>Code senden</h3>
              <p>Senden Sie Ihren Aktivierungscode an die Nummer</p>
            </div>
            <div className="wa-step">
              <div className="wa-step-num s3">3</div>
              <h3>Loslegen!</h3>
              <p>Ab sofort Anlagen bequem per WhatsApp anlegen</p>
            </div>
          </div>

          {/* Activation Card */}
          <div className="wa-activation">
            <div className="wa-activation-grid">
              {/* Left */}
              <div>
                {/* Number */}
                <div className="wa-field">
                  <div className="wa-field-label">Baunity WhatsApp-Nummer</div>
                  <div className="wa-field-box">
                    <div className="wa-field-icon">
                      <MessageCircle />
                    </div>
                    <span className="wa-field-value">{formatPhone(status?.whatsappNumber || "")}</span>
                  </div>
                </div>

                {/* Code */}
                <div className="wa-field">
                  <div className="wa-field-label">Ihr Aktivierungscode</div>
                  <div className="wa-code-box">
                    <span className="wa-code-value">{status?.activationCode}</span>
                    <button onClick={copyCode} className={`wa-copy-btn ${copied ? "copied" : ""}`}>
                      {copied ? <Check /> : <Copy />}
                      {copied ? "Kopiert!" : "Kopieren"}
                    </button>
                  </div>
                </div>

                {/* Open Button */}
                <a
                  href={whatsappDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wa-open-btn"
                >
                  <MessageCircle />
                  WhatsApp öffnen
                  <ArrowRight />
                </a>
              </div>

              {/* Right: QR */}
              <div className="wa-qr-wrapper">
                <div className="wa-qr-box">
                  <img src={qrCodeUrl} alt="WhatsApp QR Code" />
                </div>
                <div className="wa-qr-hint">
                  <QrCode />
                  QR-Code scannen zum Aktivieren
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="wa-features">
            <div className="wa-feature">
              <div className="wa-feature-icon indigo">
                <Zap />
              </div>
              <div>
                <h4>Blitzschnell</h4>
                <p>Anlagen in Sekunden per Sprachnachricht oder Text</p>
              </div>
            </div>
            <div className="wa-feature">
              <div className="wa-feature-icon purple">
                <BarChart3 />
              </div>
              <div>
                <h4>KI-gestützt</h4>
                <p>Automatische Erkennung aller Anlagendaten</p>
              </div>
            </div>
            <div className="wa-feature">
              <div className="wa-feature-icon green">
                <MessageSquare />
              </div>
              <div>
                <h4>Nachfragen bei Bedarf</h4>
                <p>Fehlen Daten? Wir fragen automatisch nach</p>
              </div>
            </div>
            <div className="wa-feature">
              <div className="wa-feature-icon cyan">
                <CheckCircle />
              </div>
              <div>
                <h4>Bestätigung vor Anlage</h4>
                <p>Sie prüfen die Daten bevor die Anlage erstellt wird</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
