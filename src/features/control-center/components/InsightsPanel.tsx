/**
 * INSIGHTS PANEL COMPONENT
 * Intelligence System Phase 2 - Automatische Erkenntnisse
 */

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

import { useState, useEffect, type CSSProperties } from "react";
import { api } from "../../../modules/api/client";
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Zap,
  Check,
  X,
  RefreshCw,
  Eye,
  ChevronRight,
} from "lucide-react";

// Types
interface Insight {
  id: number;
  insightType: "ANOMALY" | "TREND" | "PATTERN" | "RECOMMENDATION";
  category: string;
  title: string;
  description: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  confidence?: number;
  entityType?: string;
  entityId?: number;
  data?: Record<string, unknown>;
  actionUrl?: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
  expiresAt?: string;
}

// Insight type icons & colors
const insightConfig = {
  ANOMALY: { icon: AlertTriangle, color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.1)", label: "Anomalie" },
  TREND: { icon: TrendingUp, color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)", label: "Trend" },
  PATTERN: { icon: Zap, color: "#EAD068", bgColor: "rgba(139, 92, 246, 0.1)", label: "Muster" },
  RECOMMENDATION: { icon: Lightbulb, color: "#3dd68c", bgColor: "rgba(16, 185, 129, 0.1)", label: "Empfehlung" },
};

const severityConfig = {
  INFO: { color: "#6b7280", bgColor: "rgba(107, 114, 128, 0.1)", label: "Info" },
  WARNING: { color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.1)", label: "Warnung" },
  CRITICAL: { color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.2)", label: "Kritisch" },
};

// --- Inline style definitions ---

const styles = {
  insightsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.25rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  } as CSSProperties,

  insightsTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  } as CSSProperties,

  insightsTitleH3: {
    margin: 0,
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#e4e4e7",
  } as CSSProperties,

  insightsUnreadBadge: {
    background: "#D4A843",
    color: "#fff",
    fontSize: "0.7rem",
    fontWeight: 600,
    padding: "0.125rem 0.4rem",
    borderRadius: "9999px",
  } as CSSProperties,

  insightsControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  } as CSSProperties,

  insightsFilter: {
    display: "flex",
    gap: "0.25rem",
  } as CSSProperties,

  filterButton: {
    background: "transparent",
    border: "none",
    color: "#71717a",
    fontSize: "0.75rem",
    padding: "0.375rem 0.625rem",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
  } as CSSProperties,

  filterButtonActive: {
    background: "rgba(212, 168, 67, 0.12)",
    border: "none",
    color: "#D4A843",
    fontSize: "0.75rem",
    padding: "0.375rem 0.625rem",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
  } as CSSProperties,

  insightsRefresh: {
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#71717a",
    padding: "0.375rem",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as CSSProperties,

  insightsContent: {
    maxHeight: "400px",
    overflowY: "auto",
  } as CSSProperties,

  centeredMessage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    color: "#71717a",
    textAlign: "center",
    gap: "0.5rem",
  } as CSSProperties,

  insightsSpinner: {
    width: "24px",
    height: "24px",
    border: "2px solid rgba(212, 168, 67, 0.2)",
    borderTopColor: "#D4A843",
    borderRadius: "50%",
    animation: "insights-spin 1s linear infinite",
  } as CSSProperties,

  retryButton: {
    marginTop: "0.5rem",
    background: "#D4A843",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  } as CSSProperties,

  insightsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "0.75rem",
  } as CSSProperties,

  insightCard: {
    padding: "0.875rem",
    borderRadius: "8px",
    transition: "all 0.2s",
  } as CSSProperties,

  insightHeader: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  } as CSSProperties,

  badge: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.65rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
  } as CSSProperties,

  insightTitle: {
    margin: "0 0 0.25rem 0",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#e4e4e7",
  } as CSSProperties,

  insightDescription: {
    margin: "0 0 0.5rem 0",
    fontSize: "0.8rem",
    color: "#a1a1aa",
    lineHeight: 1.4,
  } as CSSProperties,

  insightCategory: {
    fontSize: "0.7rem",
    color: "#71717a",
    marginBottom: "0.5rem",
  } as CSSProperties,

  insightCategoryLabel: {
    color: "#52525b",
  } as CSSProperties,

  insightFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as CSSProperties,

  insightTime: {
    fontSize: "0.7rem",
    color: "#52525b",
  } as CSSProperties,

  insightActions: {
    display: "flex",
    gap: "0.25rem",
  } as CSSProperties,

  insightBtn: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "none",
    color: "#71717a",
    padding: "0.35rem",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
  } as CSSProperties,
};

// InsightCard Component
function InsightCard({
  insight,
  onMarkRead,
  onDismiss,
}: {
  insight: Insight;
  onMarkRead: (id: number) => void;
  onDismiss: (id: number) => void;
}) {
  const typeConfig = insightConfig[insight.insightType];
  const sevConfig = severityConfig[insight.severity];
  const Icon = typeConfig.icon;

  return (
    <div
      style={{
        ...styles.insightCard,
        background: insight.isRead ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.05)",
        borderLeft: `3px solid ${sevConfig.color}`,
        opacity: insight.isRead ? 0.8 : 1,
      }}
    >
      <div style={styles.insightHeader}>
        <div
          style={{
            ...styles.badge,
            background: typeConfig.bgColor,
            color: typeConfig.color,
          }}
        >
          <Icon size={12} />
          <span>{typeConfig.label}</span>
        </div>
        <div
          style={{
            ...styles.badge,
            background: sevConfig.bgColor,
            color: sevConfig.color,
          }}
        >
          {sevConfig.label}
        </div>
      </div>

      <h4 style={styles.insightTitle}>{insight.title}</h4>
      <p style={styles.insightDescription}>{insight.description}</p>

      {insight.category && (
        <div style={styles.insightCategory}>
          <span style={styles.insightCategoryLabel}>Kategorie:</span> {insight.category.replace(/_/g, " ")}
        </div>
      )}

      <div style={styles.insightFooter}>
        <span style={styles.insightTime}>
          {new Date(insight.createdAt).toLocaleString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        <div style={styles.insightActions}>
          {!insight.isRead && (
            <button
              style={styles.insightBtn}
              onClick={() => onMarkRead(insight.id)}
              title="Als gelesen markieren"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.color = "#e4e4e7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "#71717a";
              }}
            >
              <Eye size={14} />
            </button>
          )}
          {insight.actionUrl && (
            <a
              href={insight.actionUrl}
              style={styles.insightBtn}
              title="Details anzeigen"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(212, 168, 67, 0.12)";
                e.currentTarget.style.color = "#D4A843";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "#71717a";
              }}
            >
              <ChevronRight size={14} />
            </a>
          )}
          <button
            style={styles.insightBtn}
            onClick={() => onDismiss(insight.id)}
            title="Ausblenden"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
              e.currentTarget.style.color = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.color = "#71717a";
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Main InsightsPanel Component
export function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all");

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filter === "unread") params.unreadOnly = "true";
      if (filter === "critical") params.severity = "CRITICAL";

      const response = await api.get("/intelligence/insights", { params });
      setInsights(response.data.insights || []);
      setError(null);
    } catch (err) {
      console.error("[Insights] Fetch error:", err);
      setError("Fehler beim Laden der Insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.post(`/intelligence/insights/${id}/read`);
      setInsights((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isRead: true } : i))
      );
    } catch (err) {
      console.error("[Insights] Mark read error:", err);
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await api.post(`/intelligence/insights/${id}/dismiss`);
      setInsights((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("[Insights] Dismiss error:", err);
    }
  };

  const unreadCount = insights.filter((i) => !i.isRead).length;
  const criticalCount = insights.filter((i) => i.severity === "CRITICAL").length;

  return (
    <div className="glass-card glass-card--no-hover" style={{ overflow: "hidden" }}>
      <div style={styles.insightsHeader}>
        <div style={styles.insightsTitle}>
          <Lightbulb size={18} />
          <h3 style={styles.insightsTitleH3}>Automatische Erkenntnisse</h3>
          {unreadCount > 0 && (
            <span style={styles.insightsUnreadBadge}>{unreadCount}</span>
          )}
        </div>
        <div style={styles.insightsControls}>
          <div style={styles.insightsFilter}>
            <button
              style={filter === "all" ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setFilter("all")}
              onMouseEnter={(e) => {
                if (filter !== "all") {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.color = "#e4e4e7";
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== "all") {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#71717a";
                }
              }}
            >
              Alle
            </button>
            <button
              style={filter === "unread" ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setFilter("unread")}
              onMouseEnter={(e) => {
                if (filter !== "unread") {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.color = "#e4e4e7";
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== "unread") {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#71717a";
                }
              }}
            >
              Ungelesen
            </button>
            <button
              style={{
                ...(filter === "critical" ? styles.filterButtonActive : styles.filterButton),
                ...(criticalCount > 0 && filter !== "critical" ? { color: "#ef4444" } : {}),
              }}
              onClick={() => setFilter("critical")}
              onMouseEnter={(e) => {
                if (filter !== "critical") {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.color = "#e4e4e7";
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== "critical") {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = criticalCount > 0 ? "#ef4444" : "#71717a";
                }
              }}
            >
              Kritisch {criticalCount > 0 && `(${criticalCount})`}
            </button>
          </div>
          <button
            style={{
              ...styles.insightsRefresh,
              ...(loading ? { animation: "insights-spin 1s linear infinite" } : {}),
            }}
            onClick={fetchInsights}
            disabled={loading}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.color = "#e4e4e7";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#71717a";
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div style={styles.insightsContent}>
        {loading && insights.length === 0 ? (
          <div style={styles.centeredMessage}>
            <div style={styles.insightsSpinner} />
            <span>Lade Insights...</span>
          </div>
        ) : error ? (
          <div style={styles.centeredMessage}>
            <AlertTriangle size={24} />
            <span>{safeString(error)}</span>
            <button style={styles.retryButton} onClick={fetchInsights}>Erneut versuchen</button>
          </div>
        ) : insights.length === 0 ? (
          <div style={styles.centeredMessage}>
            <Check size={32} />
            <span>Keine neuen Erkenntnisse</span>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#52525b" }}>
              Das System analysiert kontinuierlich Ihre Daten.
            </p>
          </div>
        ) : (
          <div style={styles.insightsList}>
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onMarkRead={handleMarkRead}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InsightsPanel;
