/**
 * ALERTS PANEL COMPONENT
 * Displays system alerts and notifications
 */

import { type ReactNode, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { Alert } from "../types";

interface AlertsPanelProps {
  alerts: Alert[];
}

const ALERT_ICONS: Record<string, ReactNode> = {
  error: <AlertCircle size={13} />,
  warning: <AlertTriangle size={13} />,
  info: <Info size={13} />,
  success: <CheckCircle2 size={13} />,
};

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  } as CSSProperties,
  h3: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--dash-text)",
    margin: 0,
  } as CSSProperties,
  badge: {
    background: "rgba(212, 168, 67, 0.15)",
    color: "var(--dash-primary)",
    fontSize: "0.75rem",
    padding: "0.125rem 0.5rem",
    borderRadius: "6px",
    fontWeight: 600,
  } as CSSProperties,
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem",
    color: "var(--dash-text-subtle)",
    gap: "0.5rem",
    textAlign: "center",
  } as CSSProperties,
  alertList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  } as CSSProperties,
  alertBase: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "var(--dash-radius-sm, 12px)",
    transition: "all 0.2s",
  } as CSSProperties,
  alertContent: {
    flex: 1,
    minWidth: 0,
  } as CSSProperties,
  alertTitle: {
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "var(--dash-text)",
  } as CSSProperties,
  alertMessage: {
    fontSize: "0.75rem",
    color: "var(--dash-text-muted)",
  } as CSSProperties,
  alertAction: {
    fontSize: "0.75rem",
    padding: "0.375rem 0.75rem",
  } as CSSProperties,
};

const ALERT_BORDER_COLORS: Record<string, string> = {
  error: "var(--dash-danger)",
  warning: "var(--dash-warning)",
  info: "var(--dash-primary)",
  success: "var(--dash-success)",
};

const ALERT_ICON_BG: Record<string, string> = {
  error: "rgba(239, 68, 68, 0.15)",
  warning: "rgba(245, 158, 11, 0.15)",
  info: "rgba(212, 168, 67, 0.15)",
  success: "rgba(16, 185, 129, 0.15)",
};

const ALERT_ICON_COLOR: Record<string, string> = {
  error: "var(--dash-danger)",
  warning: "var(--dash-warning)",
  info: "var(--dash-primary)",
  success: "var(--dash-success)",
};

function getAlertStyle(type: string): CSSProperties {
  return {
    ...styles.alertBase,
    borderLeft: `3px solid ${ALERT_BORDER_COLORS[type] || ALERT_BORDER_COLORS.info}`,
  };
}

function getAlertIconStyle(type: string): CSSProperties {
  return {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: ALERT_ICON_BG[type] || ALERT_ICON_BG.info,
    color: ALERT_ICON_COLOR[type] || ALERT_ICON_COLOR.info,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
}

export function AlertsPanel({ alerts = [] }: AlertsPanelProps) {
  const navigate = useNavigate();

  if (!alerts || alerts.length === 0) {
    return (
      <div className="glass-card glass-card--no-hover" style={{ padding: "24px" }}>
        <div style={styles.header}>
          <h3 style={styles.h3}>
            <Bell size={13} /> Alerts
          </h3>
        </div>
        <div style={styles.empty}>
          <Sparkles size={24} style={{ marginBottom: "0.5rem", opacity: 0.4 }} />
          Keine Alerts - Alles in Ordnung!
        </div>
      </div>
    );
  }

  const handleAlertClick = (alert: Alert) => {
    if (alert.actionUrl) {
      navigate(alert.actionUrl);
    }
  };

  return (
    <div className="glass-card glass-card--no-hover" style={{ padding: "24px" }}>
      <div style={styles.header}>
        <h3 style={styles.h3}>
          <Bell size={13} /> Alerts
        </h3>
        <span style={styles.badge}>{alerts.length}</span>
      </div>
      <div style={styles.alertList}>
        {alerts.map((alert) => (
          <div key={alert.id} style={getAlertStyle(alert.type)}>
            <div style={getAlertIconStyle(alert.type)}>
              {ALERT_ICONS[alert.type]}
            </div>
            <div style={styles.alertContent}>
              <div style={styles.alertTitle}>{alert.title}</div>
              <div style={styles.alertMessage}>{alert.message}</div>
            </div>
            {alert.actionUrl && (
              <button
                className="quick-action"
                style={styles.alertAction}
                onClick={() => handleAlertClick(alert)}
              >
                Anzeigen
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
