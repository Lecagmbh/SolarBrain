/**
 * Alert Banner Component
 * ======================
 * Zeigt wichtige Alerts für den Endkunden an.
 * Premium Design mit Dringlichkeits-Farben.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, AlertCircle, Info, Clock, ChevronRight, X } from "lucide-react";
import { getPortalAlerts, type PortalAlert } from "../api";

interface AlertBannerProps {
  installationId?: number;
  maxAlerts?: number;
}

const DISMISSED_STORAGE_KEY = 'gridnetz_portal_dismissed_alerts';

function loadDismissedFromStorage(): Set<number> {
  try {
    const stored = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  return new Set();
}

function saveDismissedToStorage(ids: Set<number>) {
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function AlertBanner({ installationId, maxAlerts = 3 }: AlertBannerProps) {
  const [alerts, setAlerts] = useState<PortalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(() => loadDismissedFromStorage());

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const data = await getPortalAlerts();

        // Filter nach Installation wenn angegeben
        const filtered = installationId
          ? data.filter(a => a.installation.id === installationId)
          : data;

        setAlerts(filtered);
      } catch (err) {
        console.error("Fehler beim Laden der Alerts:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [installationId]);

  const handleDismiss = (alertId: number) => {
    setDismissedIds(prev => {
      const next = new Set([...prev, alertId]);
      saveDismissedToStorage(next);
      return next;
    });
  };

  // Nicht angezeigte Alerts filtern
  const visibleAlerts = alerts
    .filter(a => !dismissedIds.has(a.id))
    .slice(0, maxAlerts);

  if (loading || visibleAlerts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="ab-container">
        {visibleAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={() => handleDismiss(alert.id)}
          />
        ))}

        {/* Link zu allen Alerts wenn mehr vorhanden */}
        {alerts.length > maxAlerts && (
          <div className="ab-more">
            <Link to="/portal/messages" className="ab-more-link">
              {alerts.length - maxAlerts} weitere Benachrichtigungen
              <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </div>

      <style>{alertBannerStyles}</style>
    </>
  );
}

function AlertCard({ alert, onDismiss }: { alert: PortalAlert; onDismiss: () => void }) {
  const getTypeStyles = () => {
    switch (alert.type) {
      case "CRITICAL":
        return {
          bgClass: "ab-card--critical",
          icon: <AlertTriangle size={20} />,
        };
      case "WARNING":
        return {
          bgClass: "ab-card--warning",
          icon: <AlertCircle size={20} />,
        };
      default:
        return {
          bgClass: "ab-card--info",
          icon: <Info size={20} />,
        };
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
    };
    return labels[alert.category] || alert.category;
  };

  const { bgClass, icon } = getTypeStyles();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Gerade eben";
    if (diffHours < 24) return `Vor ${diffHours} Stunden`;
    if (diffDays === 1) return "Gestern";
    if (diffDays < 7) return `Vor ${diffDays} Tagen`;

    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className={`ab-card ${bgClass}`}>
      {/* Icon */}
      <div className="ab-card-icon">
        {icon}
      </div>

      {/* Content */}
      <div className="ab-card-content">
        <div className="ab-card-header">
          <span className="ab-card-category">{getCategoryLabel()}</span>
          <span className="ab-card-time">
            <Clock size={12} />
            {formatDate(alert.createdAt)}
          </span>
        </div>
        <h3 className="ab-card-title">{alert.title}</h3>
        {alert.message && (
          <p className="ab-card-message">{alert.message}</p>
        )}
        {alert.deadline && (
          <div className="ab-card-deadline">
            ⏰ Frist: {new Date(alert.deadline).toLocaleDateString("de-DE")}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="ab-card-actions">
        <Link to="/portal/messages" className="ab-card-btn">
          Antworten
          <ChevronRight size={16} />
        </Link>
        <button className="ab-card-dismiss" onClick={onDismiss} title="Ausblenden">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

const alertBannerStyles = `
  .ab-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .ab-card {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 20px;
    border-radius: 14px;
    animation: abSlideIn 0.3s ease-out;
  }

  @keyframes abSlideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .ab-card--critical {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .ab-card--critical .ab-card-icon {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }

  .ab-card--warning {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .ab-card--warning .ab-card-icon {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }

  .ab-card--info {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%);
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .ab-card--info .ab-card-icon {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }

  .ab-card-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .ab-card-content {
    flex: 1;
    min-width: 0;
  }

  .ab-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  .ab-card-category {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.5);
  }

  .ab-card-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
  }

  .ab-card-title {
    margin: 0 0 4px 0;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
  }

  .ab-card-message {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .ab-card-deadline {
    margin-top: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #fbbf24;
  }

  .ab-card-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .ab-card-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s;
  }

  .ab-card-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .ab-card--critical .ab-card-btn {
    background: rgba(239, 68, 68, 0.3);
  }

  .ab-card--critical .ab-card-btn:hover {
    background: rgba(239, 68, 68, 0.4);
  }

  .ab-card-dismiss {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: all 0.15s;
  }

  .ab-card-dismiss:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
  }

  .ab-more {
    text-align: center;
    padding: 8px;
  }

  .ab-more-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #EAD068;
    text-decoration: none;
    transition: color 0.15s;
  }

  .ab-more-link:hover {
    color: #a5b4fc;
  }

  @media (max-width: 640px) {
    .ab-card {
      flex-wrap: wrap;
    }

    .ab-card-actions {
      width: 100%;
      margin-top: 12px;
      justify-content: flex-end;
    }
  }
`;
