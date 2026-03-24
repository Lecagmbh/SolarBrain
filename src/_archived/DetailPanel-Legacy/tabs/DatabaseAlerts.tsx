/**
 * DATABASE ALERTS - Installation Alerts from Database
 * ====================================================
 * Zeigt gespeicherte Alerts und ermöglicht Kunden-Benachrichtigung.
 */

import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../../../../../api/client";
import {
  AlertTriangle, AlertCircle, Info, Bell, Send, Check,
  Mail, MessageCircle, Loader2, ChevronRight, Clock, CheckCircle
} from "lucide-react";

interface DatabaseAlert {
  id: number;
  type: "CRITICAL" | "WARNING" | "INFO";
  category: string;
  title: string;
  message: string | null;
  sourceType: string;
  sourceId: number | null;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt: string | null;
  deadline: string | null;
  metadata: {
    customerNotifiedAt?: string;
    customerNotifiedVia?: string[];
    [key: string]: unknown;
  } | null;
  createdAt: string;
}

interface DatabaseAlertsProps {
  installationId: number;
  onAlertAction?: () => void;
}

export function DatabaseAlerts({ installationId, onAlertAction }: DatabaseAlertsProps) {
  const [alerts, setAlerts] = useState<DatabaseAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet<{ success: boolean; data: DatabaseAlert[] }>(
        `/api/portal/admin/installations/${installationId}/alerts`
      );
      setAlerts(response.data);
    } catch (err) {
      console.error("Fehler beim Laden der Alerts:", err);
      setError("Alerts konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [installationId]);

  // Unresolved alerts
  const unresolvedAlerts = alerts.filter(a => !a.isResolved);
  const resolvedAlerts = alerts.filter(a => a.isResolved);

  if (loading) {
    return (
      <div className="da-loading">
        <Loader2 size={20} className="da-spin" />
        <span>Lade Alerts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="da-error">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="da-empty">
        <CheckCircle size={20} />
        <span>Keine Alerts vorhanden</span>
      </div>
    );
  }

  return (
    <div className="da-container">
      {/* Unresolved Alerts */}
      {unresolvedAlerts.length > 0 && (
        <div className="da-section">
          <div className="da-section-header">
            <Bell size={16} />
            <span>{unresolvedAlerts.length} offene Alert{unresolvedAlerts.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="da-list">
            {unresolvedAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                installationId={installationId}
                onUpdate={() => {
                  loadAlerts();
                  onAlertAction?.();
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div className="da-section da-section--resolved">
          <div className="da-section-header da-section-header--resolved">
            <Check size={16} />
            <span>{resolvedAlerts.length} gelöst</span>
          </div>
          <div className="da-list">
            {resolvedAlerts.slice(0, 3).map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                installationId={installationId}
                onUpdate={loadAlerts}
                resolved
              />
            ))}
          </div>
        </div>
      )}

      <style>{databaseAlertsStyles}</style>
    </div>
  );
}

function AlertCard({
  alert,
  installationId,
  onUpdate,
  resolved = false
}: {
  alert: DatabaseAlert;
  installationId: number;
  onUpdate: () => void;
  resolved?: boolean;
}) {
  const [notifying, setNotifying] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleNotifyCustomer = async (sendWhatsApp: boolean = false) => {
    try {
      setNotifying(true);
      await apiPost(`/api/portal/admin/alerts/${alert.id}/notify-customer`, {
        sendEmail: true,
        sendWhatsApp,
      });
      onUpdate();
      setShowActions(false);
    } catch (err) {
      console.error("Fehler beim Benachrichtigen:", err);
      window.alert("Fehler beim Senden der Benachrichtigung");
    } finally {
      setNotifying(false);
    }
  };

  const handleResolve = async () => {
    try {
      setResolving(true);
      await apiPost(`/api/portal/admin/alerts/${alert.id}/resolve`, {});
      onUpdate();
    } catch (err) {
      console.error("Fehler beim Lösen:", err);
    } finally {
      setResolving(false);
    }
  };

  const getIcon = () => {
    switch (alert.type) {
      case "CRITICAL": return <AlertTriangle size={16} />;
      case "WARNING": return <AlertCircle size={16} />;
      default: return <Info size={16} />;
    }
  };

  const getCategoryLabel = () => {
    const labels: Record<string, string> = {
      RUECKFRAGE: "Rückfrage",
      ABLEHNUNG: "Ablehnung",
      GENEHMIGUNG: "Genehmigung",
      DOKUMENT_FEHLT: "Dokument fehlt",
      WARTEZEIT: "Wartezeit",
      EMAIL: "E-Mail",
      KOMMENTAR: "Kommentar",
    };
    return labels[alert.category] || alert.category;
  };

  const wasNotified = alert.metadata?.customerNotifiedAt;
  const notifiedVia = alert.metadata?.customerNotifiedVia || [];

  return (
    <div className={`da-card da-card--${alert.type.toLowerCase()} ${resolved ? "da-card--resolved" : ""}`}>
      <div className="da-card-icon">
        {getIcon()}
      </div>

      <div className="da-card-content">
        <div className="da-card-header">
          <span className="da-card-category">{getCategoryLabel()}</span>
          <span className="da-card-time">
            <Clock size={12} />
            {formatTimeAgo(alert.createdAt)}
          </span>
        </div>
        <div className="da-card-title">{alert.title}</div>
        {alert.message && (
          <div className="da-card-message">{alert.message}</div>
        )}

        {/* Benachrichtigt-Status */}
        {wasNotified && (
          <div className="da-card-notified">
            <Check size={12} />
            Kunde benachrichtigt am {new Date(wasNotified).toLocaleDateString("de-DE")}
            {notifiedVia.length > 0 && ` (${notifiedVia.join(", ")})`}
          </div>
        )}

        {/* Deadline */}
        {alert.deadline && (
          <div className="da-card-deadline">
            ⏰ Frist: {new Date(alert.deadline).toLocaleDateString("de-DE")}
          </div>
        )}
      </div>

      {/* Actions */}
      {!resolved && (
        <div className="da-card-actions">
          {showActions ? (
            <div className="da-action-menu">
              <button
                className="da-action-btn da-action-btn--email"
                onClick={() => handleNotifyCustomer(false)}
                disabled={notifying}
              >
                <Mail size={14} />
                Per E-Mail
              </button>
              <button
                className="da-action-btn da-action-btn--whatsapp"
                onClick={() => handleNotifyCustomer(true)}
                disabled={notifying}
              >
                <MessageCircle size={14} />
                + WhatsApp
              </button>
              <button
                className="da-action-btn da-action-btn--cancel"
                onClick={() => setShowActions(false)}
              >
                Abbrechen
              </button>
            </div>
          ) : (
            <>
              <button
                className="da-notify-btn"
                onClick={() => setShowActions(true)}
                disabled={notifying}
                title="Kunde benachrichtigen"
              >
                {notifying ? (
                  <Loader2 size={14} className="da-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    <span>Kunde informieren</span>
                  </>
                )}
              </button>
              <button
                className="da-resolve-btn"
                onClick={handleResolve}
                disabled={resolving}
                title="Als gelöst markieren"
              >
                {resolving ? (
                  <Loader2 size={14} className="da-spin" />
                ) : (
                  <Check size={14} />
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 5) return "Gerade eben";
  if (diffMins < 60) return `Vor ${diffMins} Min`;
  if (diffHours < 24) return `Vor ${diffHours}h`;
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `Vor ${diffDays} Tagen`;

  return date.toLocaleDateString("de-DE");
}

const databaseAlertsStyles = `
  .da-loading,
  .da-error,
  .da-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 24px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
  }

  .da-error {
    color: #f87171;
  }

  .da-empty {
    color: #34d399;
  }

  .da-spin {
    animation: daSpin 1s linear infinite;
  }

  @keyframes daSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .da-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .da-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .da-section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #f87171;
    padding: 0 4px;
  }

  .da-section-header--resolved {
    color: rgba(255, 255, 255, 0.4);
  }

  .da-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .da-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    transition: all 0.15s;
  }

  .da-card:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .da-card--resolved {
    opacity: 0.5;
  }

  .da-card--critical {
    border-left: 3px solid #ef4444;
  }

  .da-card--critical .da-card-icon {
    color: #f87171;
  }

  .da-card--warning {
    border-left: 3px solid #f59e0b;
  }

  .da-card--warning .da-card-icon {
    color: #fbbf24;
  }

  .da-card--info {
    border-left: 3px solid #3b82f6;
  }

  .da-card--info .da-card-icon {
    color: #60a5fa;
  }

  .da-card-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .da-card-content {
    flex: 1;
    min-width: 0;
  }

  .da-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .da-card-category {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.5);
  }

  .da-card-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.35);
  }

  .da-card-title {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
  }

  .da-card-message {
    margin-top: 4px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.55);
    line-height: 1.4;
  }

  .da-card-notified {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: 11px;
    color: #34d399;
  }

  .da-card-deadline {
    margin-top: 6px;
    font-size: 11px;
    color: #fbbf24;
  }

  .da-card-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  .da-notify-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: #fff;
    background: #D4A843;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .da-notify-btn:hover:not(:disabled) {
    background: #b8942e;
  }

  .da-notify-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .da-resolve-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.15s;
  }

  .da-resolve-btn:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.15);
    border-color: #10b981;
    color: #34d399;
  }

  .da-action-menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .da-action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 500;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .da-action-btn--email {
    background: #3b82f6;
    color: #fff;
  }

  .da-action-btn--email:hover {
    background: #2563eb;
  }

  .da-action-btn--whatsapp {
    background: #22c55e;
    color: #fff;
  }

  .da-action-btn--whatsapp:hover {
    background: #16a34a;
  }

  .da-action-btn--cancel {
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .da-action-btn--cancel:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

export default DatabaseAlerts;
