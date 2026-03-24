/**
 * ACTIVITY FEED COMPONENT
 * Real-time activity stream
 */

import { type ReactNode, type CSSProperties } from "react";
import {
  ClipboardList,
  Mail,
  FileText,
  User,
  Settings,
  XCircle,
  Plug,
  Shield,
  Pin,
} from "lucide-react";
import type { ActivityItem } from "../types";

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const CATEGORY_ICONS: Record<string, ReactNode> = {
  INSTALLATION: <ClipboardList size={12} />,
  EMAIL: <Mail size={12} />,
  DOCUMENT: <FileText size={12} />,
  USER: <User size={12} />,
  SYSTEM: <Settings size={12} />,
  ERROR: <XCircle size={12} />,
  API: <Plug size={12} />,
  AUTH: <Shield size={12} />,
  DEFAULT: <Pin size={12} />,
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
    background: "rgba(16, 185, 129, 0.15)",
    color: "var(--dash-success)",
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
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    maxHeight: "400px",
    overflowY: "auto",
  } as CSSProperties,
  activityItem: {
    display: "flex",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "8px",
    transition: "background 0.2s",
  } as CSSProperties,
  icon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "rgba(212, 168, 67, 0.1)",
    color: "var(--dash-primary)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as CSSProperties,
  content: {
    flex: 1,
    minWidth: 0,
  } as CSSProperties,
  action: {
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "var(--dash-text)",
  } as CSSProperties,
  message: {
    fontSize: "0.75rem",
    color: "var(--dash-text-muted)",
    marginTop: "2px",
  } as CSSProperties,
  meta: {
    display: "flex",
    gap: "0.375rem",
    fontSize: "0.7rem",
    color: "var(--dash-text-subtle)",
    marginTop: "4px",
  } as CSSProperties,
};

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Gerade eben";
  if (diffMins < 60) return `vor ${diffMins} Min`;
  if (diffHours < 24) return `vor ${diffHours} Std`;
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return date.toLocaleDateString("de-DE");
}

export function ActivityFeed({ activities = [] }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="glass-card glass-card--no-hover" style={{ padding: "24px" }}>
        <div style={styles.header}>
          <h3 style={styles.h3}>Aktivitäten</h3>
        </div>
        <div style={styles.empty}>Keine Aktivitäten</div>
      </div>
    );
  }

  return (
    <div className="glass-card glass-card--no-hover" style={{ padding: "24px" }}>
      <div style={styles.header}>
        <h3 style={styles.h3}>Aktivitäten</h3>
        <span style={styles.badge}>Live</span>
      </div>
      <div style={styles.activityList}>
        {activities.map((activity) => (
          <div key={activity.id} style={styles.activityItem}>
            <div style={styles.icon}>
              {CATEGORY_ICONS[activity.category] || CATEGORY_ICONS.DEFAULT}
            </div>
            <div style={styles.content}>
              <div style={styles.action}>{activity.action}</div>
              {activity.message && (
                <div style={styles.message}>{activity.message}</div>
              )}
              <div style={styles.meta}>
                <span>{activity.userName}</span>
                <span>•</span>
                <span>{formatTimeAgo(activity.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
