/**
 * ALERTS PAGE
 * Globale Übersicht aller System-Alerts
 */

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Eye,
  Check,
  RefreshCw,
  Filter,
  Clock,
  Building2,
} from "lucide-react";

// Types
interface InstallationAlert {
  id: number;
  installationId: number;
  publicId: string;
  customerName: string;
  status: string;
  type: "CRITICAL" | "WARNING" | "INFO";
  category: string;
  title: string;
  message?: string;
  isRead: boolean;
  isResolved: boolean;
  deadline?: string;
  createdAt: string;
}

interface AlertStats {
  critical: number;
  warning: number;
  info: number;
  unread: number;
  total: number;
}

// API functions
async function fetchAlerts(includeResolved: boolean): Promise<InstallationAlert[]> {
  const res = await fetch(`/api/alerts?includeResolved=${includeResolved}&limit=100`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Fehler beim Laden der Alerts");
  const json = await res.json();
  return json.data || [];
}

async function fetchAlertStats(): Promise<AlertStats> {
  const res = await fetch("/api/alerts/stats", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Fehler beim Laden der Statistiken");
  const json = await res.json();
  return json.data;
}

// Constants
const ALERT_ICONS: Record<string, typeof AlertCircle> = {
  CRITICAL: AlertCircle,
  WARNING: AlertTriangle,
  INFO: Info,
};

const ALERT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  CRITICAL: { bg: "rgba(239, 68, 68, 0.1)", border: "#ef4444", text: "#fca5a5" },
  WARNING: { bg: "rgba(245, 158, 11, 0.1)", border: "#f59e0b", text: "#fcd34d" },
  INFO: { bg: "rgba(59, 130, 246, 0.1)", border: "#3b82f6", text: "#93c5fd" },
};

const CATEGORY_LABELS: Record<string, string> = {
  RUECKFRAGE: "Rückfrage vom NB",
  ABLEHNUNG: "Ablehnung",
  GENEHMIGUNG: "Genehmigung",
  WARTEZEIT: "Lange Wartezeit",
  DOKUMENT_FEHLT: "Dokumente fehlen",
};

export function AlertsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showResolved, setShowResolved] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ["all-alerts", showResolved],
    queryFn: () => fetchAlerts(showResolved),
    staleTime: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ["alert-stats"],
    queryFn: fetchAlertStats,
    staleTime: 30000,
  });

  const handleMarkRead = useCallback(async (alertId: number) => {
    try {
      await fetch(`/api/alerts/${alertId}/read`, {
        method: "POST",
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: ["all-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-stats"] });
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  }, [queryClient]);

  const handleResolve = useCallback(async (alertId: number) => {
    try {
      await fetch(`/api/alerts/${alertId}/resolve`, {
        method: "POST",
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: ["all-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-stats"] });
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  }, [queryClient]);

  const handleOpenInstallation = useCallback((installationId: number) => {
    navigate(`/netzanmeldungen?open=${installationId}`);
  }, [navigate]);

  // Filter alerts
  const filteredAlerts = filterType
    ? alerts.filter(a => a.type === filterType)
    : alerts;

  return (
    <div className="alerts-page">
      {/* Header */}
      <div className="alerts-page__header">
        <div className="alerts-page__title">
          <Bell size={24} />
          <h1>Alert Center</h1>
        </div>
        <div className="alerts-page__actions">
          <button
            className="alerts-page__refresh"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "spin" : ""} />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="alerts-page__stats">
          <div className="alert-stat alert-stat--critical" onClick={() => setFilterType(filterType === "CRITICAL" ? null : "CRITICAL")}>
            <AlertCircle size={20} />
            <div className="alert-stat__content">
              <span className="alert-stat__value">{stats.critical}</span>
              <span className="alert-stat__label">Kritisch</span>
            </div>
          </div>
          <div className="alert-stat alert-stat--warning" onClick={() => setFilterType(filterType === "WARNING" ? null : "WARNING")}>
            <AlertTriangle size={20} />
            <div className="alert-stat__content">
              <span className="alert-stat__value">{stats.warning}</span>
              <span className="alert-stat__label">Warnung</span>
            </div>
          </div>
          <div className="alert-stat alert-stat--info" onClick={() => setFilterType(filterType === "INFO" ? null : "INFO")}>
            <Info size={20} />
            <div className="alert-stat__content">
              <span className="alert-stat__value">{stats.info}</span>
              <span className="alert-stat__label">Info</span>
            </div>
          </div>
          <div className="alert-stat alert-stat--unread">
            <Eye size={20} />
            <div className="alert-stat__content">
              <span className="alert-stat__value">{stats.unread}</span>
              <span className="alert-stat__label">Ungelesen</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="alerts-page__filters">
        <label className="alerts-page__checkbox">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
          />
          <span>Erledigte anzeigen</span>
        </label>
        {filterType && (
          <button className="alerts-page__clear-filter" onClick={() => setFilterType(null)}>
            <Filter size={14} />
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="alerts-page__list">
        {isLoading ? (
          <div className="alerts-page__loading">
            <RefreshCw size={24} className="spin" />
            <span>Lade Alerts...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="alerts-page__empty">
            <CheckCircle2 size={48} />
            <h3>Keine Alerts</h3>
            <p>Alle Alerts wurden erledigt oder es gibt keine offenen Alerts.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const Icon = ALERT_ICONS[alert.type] || Info;
            const colors = ALERT_COLORS[alert.type] || ALERT_COLORS.INFO;

            return (
              <div
                key={alert.id}
                className={`alert-card ${!alert.isRead ? "alert-card--unread" : ""} ${alert.isResolved ? "alert-card--resolved" : ""}`}
                style={{
                  background: colors.bg,
                  borderLeftColor: colors.border,
                }}
              >
                <div className="alert-card__icon" style={{ color: colors.border }}>
                  <Icon size={24} />
                </div>

                <div className="alert-card__content">
                  <div className="alert-card__header">
                    <span className="alert-card__category">
                      {CATEGORY_LABELS[alert.category] || alert.category}
                    </span>
                    <span className="alert-card__time">
                      <Clock size={12} />
                      {new Date(alert.createdAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <h3 className="alert-card__title">{alert.title}</h3>

                  {alert.message && (
                    <p className="alert-card__message">{alert.message}</p>
                  )}

                  <div className="alert-card__installation" onClick={() => handleOpenInstallation(alert.installationId)}>
                    <Building2 size={14} />
                    <span>{alert.publicId}</span>
                    <span className="alert-card__customer">{alert.customerName}</span>
                  </div>
                </div>

                <div className="alert-card__actions">
                  {!alert.isRead && (
                    <button
                      className="alert-card__btn"
                      onClick={() => handleMarkRead(alert.id)}
                      title="Als gelesen markieren"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                  {!alert.isResolved && (
                    <button
                      className="alert-card__btn alert-card__btn--resolve"
                      onClick={() => handleResolve(alert.id)}
                      title="Als erledigt markieren"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .alerts-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .alerts-page__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .alerts-page__title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-primary, #fff);
        }

        .alerts-page__title h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }

        .alerts-page__refresh {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(212, 168, 67, 0.15);
          border: none;
          border-radius: 8px;
          color: #EAD068;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .alerts-page__refresh:hover {
          background: rgba(212, 168, 67, 0.25);
        }

        .alerts-page__refresh:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .alerts-page__stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .alert-stat {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .alert-stat:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .alert-stat--critical { color: #ef4444; }
        .alert-stat--warning { color: #f59e0b; }
        .alert-stat--info { color: #3b82f6; }
        .alert-stat--unread { color: #a855f7; }

        .alert-stat__content {
          display: flex;
          flex-direction: column;
        }

        .alert-stat__value {
          font-size: 24px;
          font-weight: 700;
        }

        .alert-stat__label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .alerts-page__filters {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }

        .alerts-page__checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          cursor: pointer;
        }

        .alerts-page__checkbox input {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .alerts-page__clear-filter {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(239, 68, 68, 0.15);
          border: none;
          border-radius: 6px;
          color: #fca5a5;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .alerts-page__clear-filter:hover {
          background: rgba(239, 68, 68, 0.25);
        }

        .alerts-page__list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alerts-page__loading,
        .alerts-page__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
        }

        .alerts-page__empty h3 {
          margin: 16px 0 8px;
          font-size: 18px;
          color: rgba(255, 255, 255, 0.8);
        }

        .alerts-page__empty p {
          margin: 0;
          font-size: 14px;
        }

        .alert-card {
          display: flex;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 12px;
          border-left: 4px solid #3b82f6;
          transition: all 0.2s;
        }

        .alert-card--unread {
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .alert-card--resolved {
          opacity: 0.6;
        }

        .alert-card__icon {
          flex-shrink: 0;
          padding-top: 2px;
        }

        .alert-card__content {
          flex: 1;
          min-width: 0;
        }

        .alert-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .alert-card__category {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.5);
        }

        .alert-card__time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .alert-card__title {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary, #fff);
        }

        .alert-card__message {
          margin: 0 0 10px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }

        .alert-card__installation {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.2s;
        }

        .alert-card__installation:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .alert-card__customer {
          color: rgba(255, 255, 255, 0.5);
        }

        .alert-card__actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }

        .alert-card__btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.08);
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s;
        }

        .alert-card__btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }

        .alert-card__btn--resolve:hover {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        @media (max-width: 768px) {
          .alerts-page__stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .alert-card {
            flex-wrap: wrap;
          }

          .alert-card__actions {
            flex-direction: row;
            width: 100%;
            justify-content: flex-end;
            margin-top: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default AlertsPage;
