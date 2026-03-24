/**
 * PREDICTIONS PANEL COMPONENT
 * Intelligence System Phase 3 - Prognosen & Anomalieerkennung
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
  TrendingUp,
  AlertTriangle,
  Clock,
  Activity,
  BarChart3,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Types
interface WorkloadPrediction {
  date: string;
  dayOfWeek: string;
  predictedCount: number;
  confidence: number;
  factors: string[];
}

interface Anomaly {
  id: string;
  type: string;
  severity: "WARNING" | "CRITICAL";
  title: string;
  description: string;
  zScore: number;
  detectedAt: string;
  entityType?: string;
  entityId?: number;
  currentValue: number;
  expectedValue: number;
}

interface FunnelStep {
  status: string;
  label: string;
  count: number;
  percentage: number;
  conversionFromPrevious?: number;
  avgTimeInStatus?: number;
}

interface FunnelData {
  steps: FunnelStep[];
  totalEntries: number;
  totalCompleted: number;
  overallConversion: number;
}

// Anomaly severity config
const severityConfig = {
  WARNING: { color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.1)", label: "Warnung" },
  CRITICAL: { color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.2)", label: "Kritisch" },
};

// Anomaly type labels
const anomalyTypeLabels: Record<string, string> = {
  HIGH_INSTALLATION_COUNT: "Hohe Anlagenzahl",
  LOW_INSTALLATION_COUNT: "Niedrige Anlagenzahl",
  NB_SLOW_RESPONSE: "NB Langsam",
  NB_HIGH_REJECTION: "NB Hohe Ablehnungsrate",
  API_ERROR_SPIKE: "API-Fehler",
  USER_ACTIVITY_ANOMALY: "Nutzeraktivitat",
  HIGH_APPROVAL_RATE: "Hohe Genehmigungsrate",
  LOW_APPROVAL_RATE: "Niedrige Genehmigungsrate",
};

// --- Inline style definitions ---

const s = {
  predictionsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.25rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  } as CSSProperties,

  predictionsTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
  } as CSSProperties,

  predictionsTitleH3: {
    margin: 0,
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#e4e4e7",
  } as CSSProperties,

  predictionsBadge: {
    color: "#fff",
    fontSize: "0.65rem",
    fontWeight: 600,
    padding: "0.125rem 0.4rem",
    borderRadius: "9999px",
  } as CSSProperties,

  predictionsControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  } as CSSProperties,

  predictionsTabs: {
    display: "flex",
    gap: "0.25rem",
  } as CSSProperties,

  tabButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    background: "transparent",
    border: "none",
    color: "#71717a",
    fontSize: "0.75rem",
    padding: "0.375rem 0.625rem",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
  } as CSSProperties,

  tabButtonActive: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    background: "rgba(212, 168, 67, 0.12)",
    border: "none",
    color: "#D4A843",
    fontSize: "0.75rem",
    padding: "0.375rem 0.625rem",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
  } as CSSProperties,

  predictionsRefresh: {
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

  predictionsContent: {
    padding: "1rem",
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

  centeredMessageSuccess: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    color: "#3dd68c",
    textAlign: "center",
    gap: "0.5rem",
  } as CSSProperties,

  predictionsSpinner: {
    width: "24px",
    height: "24px",
    border: "2px solid rgba(212, 168, 67, 0.2)",
    borderTopColor: "#D4A843",
    borderRadius: "50%",
    animation: "predictions-spin 1s linear infinite",
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

  tabContent: {
    minHeight: "200px",
  } as CSSProperties,

  // Workload chart styles
  workloadHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  } as CSSProperties,

  workloadHeaderH4: {
    margin: 0,
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "#a1a1aa",
  } as CSSProperties,

  workloadTotal: {
    fontSize: "0.75rem",
    color: "#D4A843",
    fontWeight: 600,
  } as CSSProperties,

  workloadChart: {
    padding: "0.5rem 0",
  } as CSSProperties,

  chartBars: {
    display: "flex",
    alignItems: "flex-end",
    gap: "0.5rem",
    height: "120px",
    paddingBottom: "1.5rem",
  } as CSSProperties,

  chartBarContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
  } as CSSProperties,

  chartBarValue: {
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#a1a1aa",
    marginBottom: "0.25rem",
  } as CSSProperties,

  chartBar: {
    width: "100%",
    minHeight: "4px",
    borderRadius: "4px 4px 0 0",
    transition: "all 0.3s",
  } as CSSProperties,

  chartLabel: {
    fontSize: "0.65rem",
    color: "#71717a",
    marginTop: "0.5rem",
    textTransform: "uppercase",
  } as CSSProperties,

  chartLabelToday: {
    fontSize: "0.65rem",
    color: "#D4A843",
    marginTop: "0.5rem",
    textTransform: "uppercase",
    fontWeight: 600,
  } as CSSProperties,

  chartLegend: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    marginTop: "0.5rem",
  } as CSSProperties,

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.7rem",
    color: "#71717a",
  } as CSSProperties,

  legendDot: {
    width: "8px",
    height: "8px",
    borderRadius: "2px",
    background: "linear-gradient(180deg, #3f3f46, #27272a)",
  } as CSSProperties,

  legendDotToday: {
    width: "8px",
    height: "8px",
    borderRadius: "2px",
    background: "linear-gradient(180deg, #D4A843, #b8942e)",
  } as CSSProperties,

  // Anomaly styles
  anomaliesList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  } as CSSProperties,

  anomalyCard: {
    background: "rgba(255, 255, 255, 0.03)",
    padding: "0.75rem",
    borderRadius: "8px",
  } as CSSProperties,

  anomalyHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  } as CSSProperties,

  anomalySeverity: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.6rem",
    fontWeight: 600,
    textTransform: "uppercase",
    padding: "0.15rem 0.4rem",
    borderRadius: "4px",
  } as CSSProperties,

  anomalyType: {
    fontSize: "0.7rem",
    color: "#71717a",
  } as CSSProperties,

  anomalyDescription: {
    margin: "0 0 0.5rem 0",
    fontSize: "0.8rem",
    color: "#e4e4e7",
    lineHeight: 1.4,
  } as CSSProperties,

  anomalyStats: {
    display: "flex",
    gap: "1rem",
    fontSize: "0.7rem",
    color: "#71717a",
  } as CSSProperties,

  anomalyStatsStrong: {
    color: "#a1a1aa",
  } as CSSProperties,

  zScore: {
    fontWeight: 600,
  } as CSSProperties,

  // Funnel styles
  funnelHeader: {
    marginBottom: "1rem",
  } as CSSProperties,

  funnelHeaderH4: {
    margin: 0,
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "#a1a1aa",
  } as CSSProperties,

  funnelViz: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  } as CSSProperties,

  funnelStep: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  } as CSSProperties,

  funnelBarContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  } as CSSProperties,

  funnelBar: {
    height: "28px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    padding: "0 0.75rem",
    minWidth: "50px",
    transition: "width 0.3s",
  } as CSSProperties,

  funnelCount: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#fff",
  } as CSSProperties,

  funnelConversion: {
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    fontSize: "0.65rem",
    color: "#71717a",
  } as CSSProperties,

  funnelInfo: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0 0.25rem",
  } as CSSProperties,

  funnelLabel: {
    fontSize: "0.7rem",
    color: "#a1a1aa",
  } as CSSProperties,

  funnelTime: {
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    fontSize: "0.65rem",
    color: "#52525b",
  } as CSSProperties,

  funnelSummary: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "0.75rem",
    paddingTop: "0.75rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
  } as CSSProperties,

  summaryItem: {
    fontSize: "0.75rem",
    color: "#71717a",
  } as CSSProperties,

  summaryItemStrong: {
    color: "#3dd68c",
    marginLeft: "0.25rem",
  } as CSSProperties,
};

// WorkloadChart Component
function WorkloadChart({ predictions = [] }: { predictions: WorkloadPrediction[] }) {
  if (!predictions || predictions.length === 0) return null;

  const maxCount = predictions.length > 0
    ? Math.max(...predictions.map((p) => p.predictedCount || 0), 1)
    : 1;

  return (
    <div style={s.workloadChart}>
      <div style={s.chartBars}>
        {predictions.slice(0, 7).map((p, idx) => {
          const height = (p.predictedCount / maxCount) * 100;
          const isToday = idx === 0;

          return (
            <div key={p.date} style={s.chartBarContainer}>
              <div style={s.chartBarValue}>{p.predictedCount}</div>
              <div
                style={{
                  ...s.chartBar,
                  height: `${Math.max(height, 5)}%`,
                  background: isToday
                    ? "linear-gradient(180deg, #D4A843, #b8942e)"
                    : "linear-gradient(180deg, #3f3f46, #27272a)",
                  opacity: 0.5 + p.confidence * 0.5,
                }}
              />
              <div style={isToday ? s.chartLabelToday : s.chartLabel}>
                {(p.dayOfWeek || "").slice(0, 2)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={s.chartLegend}>
        <span style={s.legendItem}>
          <span style={s.legendDotToday} />
          Heute
        </span>
        <span style={s.legendItem}>
          <span style={s.legendDot} />
          Prognose
        </span>
      </div>
    </div>
  );
}

// AnomalyCard Component
function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const config = severityConfig[anomaly.severity];
  const typeLabel = anomalyTypeLabels[anomaly.type] || anomaly.type;

  return (
    <div
      style={{ ...s.anomalyCard, borderLeft: `3px solid ${config.color}` }}
    >
      <div style={s.anomalyHeader}>
        <div
          style={{ ...s.anomalySeverity, background: config.bgColor, color: config.color }}
        >
          <AlertTriangle size={10} />
          {config.label}
        </div>
        <span style={s.anomalyType}>{typeLabel}</span>
      </div>
      <p style={s.anomalyDescription}>{anomaly.description}</p>
      <div style={s.anomalyStats}>
        <span>
          Aktuell: <strong style={s.anomalyStatsStrong}>{anomaly.currentValue.toFixed(1)}</strong>
        </span>
        <span>
          Erwartet: <strong style={s.anomalyStatsStrong}>{anomaly.expectedValue.toFixed(1)}</strong>
        </span>
        <span style={{ ...s.zScore, color: config.color }}>
          Z: {anomaly.zScore.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// FunnelVisualization Component
function FunnelVisualization({ funnel }: { funnel: FunnelData }) {
  if (!funnel.steps || funnel.steps.length === 0) return null;

  return (
    <div style={s.funnelViz}>
      {funnel.steps.map((step, idx) => {
        const width = Math.max(step.percentage, 15);
        const isTerminal = step.status === "FERTIG" || step.status === "STORNIERT";
        const isSuccess = step.status === "FERTIG";
        const isCancel = step.status === "STORNIERT";

        return (
          <div key={step.status} style={s.funnelStep}>
            <div style={s.funnelBarContainer}>
              <div
                style={{
                  ...s.funnelBar,
                  width: `${width}%`,
                  background: isSuccess
                    ? "linear-gradient(90deg, #3dd68c, #059669)"
                    : isCancel
                    ? "linear-gradient(90deg, #ef4444, #dc2626)"
                    : "linear-gradient(90deg, #D4A843, #b8942e)",
                }}
              >
                <span style={s.funnelCount}>{step.count}</span>
              </div>
              {step.conversionFromPrevious !== undefined && idx > 0 && !isTerminal && (
                <div style={s.funnelConversion}>
                  <ArrowRight size={10} />
                  {step.conversionFromPrevious.toFixed(0)}%
                </div>
              )}
            </div>
            <div style={s.funnelInfo}>
              <span style={s.funnelLabel}>{step.label}</span>
              {step.avgTimeInStatus !== undefined && step.avgTimeInStatus > 0 && (
                <span style={s.funnelTime}>
                  <Clock size={10} />
                  {step.avgTimeInStatus.toFixed(1)}d
                </span>
              )}
            </div>
          </div>
        );
      })}
      <div style={s.funnelSummary}>
        <div style={s.summaryItem}>
          <span>Gesamt-Conversion:</span>
          <strong style={s.summaryItemStrong}>{funnel.overallConversion.toFixed(1)}%</strong>
        </div>
      </div>
    </div>
  );
}

// Main PredictionsPanel Component
export function PredictionsPanel() {
  const [workload, setWorkload] = useState<WorkloadPrediction[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"workload" | "anomalies" | "funnel">("workload");
  const [expanded, setExpanded] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [workloadRes, anomaliesRes, funnelRes] = await Promise.allSettled([
        api.get("/intelligence/predictions/workload", { params: { days: 7 } }),
        api.get("/intelligence/anomalies"),
        api.get("/intelligence/funnel/summary"),
      ]);

      if (workloadRes.status === "fulfilled") {
        setWorkload(workloadRes.value.data.predictions || []);
      }

      if (anomaliesRes.status === "fulfilled") {
        setAnomalies(anomaliesRes.value.data.anomalies || []);
      }

      if (funnelRes.status === "fulfilled") {
        setFunnel(funnelRes.value.data);
      }
    } catch (err) {
      console.error("[Predictions] Fetch error:", err);
      setError("Fehler beim Laden der Prognosen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const criticalAnomalies = anomalies.filter((a) => a.severity === "CRITICAL").length;
  const totalAnomalies = anomalies.length;

  return (
    <div className="glass-card glass-card--no-hover" style={{ overflow: "hidden" }}>
      <div style={s.predictionsHeader}>
        <div style={s.predictionsTitle} onClick={() => setExpanded(!expanded)}>
          <Activity size={18} />
          <h3 style={s.predictionsTitleH3}>Prognosen & Anomalien</h3>
          {totalAnomalies > 0 && (
            <span
              style={{
                ...s.predictionsBadge,
                background: criticalAnomalies > 0 ? "#ef4444" : "#f59e0b",
              }}
            >
              {totalAnomalies}
            </span>
          )}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        {expanded && (
          <div style={s.predictionsControls}>
            <div style={s.predictionsTabs}>
              <button
                style={activeTab === "workload" ? s.tabButtonActive : s.tabButton}
                onClick={() => setActiveTab("workload")}
                onMouseEnter={(e) => {
                  if (activeTab !== "workload") {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = "#e4e4e7";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "workload") {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#71717a";
                  }
                }}
              >
                <TrendingUp size={12} />
                Workload
              </button>
              <button
                style={{
                  ...(activeTab === "anomalies" ? s.tabButtonActive : s.tabButton),
                  ...(criticalAnomalies > 0 && activeTab !== "anomalies" ? { color: "#ef4444" } : {}),
                }}
                onClick={() => setActiveTab("anomalies")}
                onMouseEnter={(e) => {
                  if (activeTab !== "anomalies") {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = "#e4e4e7";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "anomalies") {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = criticalAnomalies > 0 ? "#ef4444" : "#71717a";
                  }
                }}
              >
                <AlertCircle size={12} />
                Anomalien {totalAnomalies > 0 && `(${totalAnomalies})`}
              </button>
              <button
                style={activeTab === "funnel" ? s.tabButtonActive : s.tabButton}
                onClick={() => setActiveTab("funnel")}
                onMouseEnter={(e) => {
                  if (activeTab !== "funnel") {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = "#e4e4e7";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "funnel") {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#71717a";
                  }
                }}
              >
                <BarChart3 size={12} />
                Funnel
              </button>
            </div>
            <button
              style={s.predictionsRefresh}
              onClick={fetchData}
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
              <RefreshCw size={14} style={loading ? { animation: "predictions-spin 1s linear infinite" } : undefined} />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div style={s.predictionsContent}>
          {loading && workload.length === 0 && anomalies.length === 0 ? (
            <div style={s.centeredMessage}>
              <div style={s.predictionsSpinner} />
              <span>Lade Prognosen...</span>
            </div>
          ) : error ? (
            <div style={s.centeredMessage}>
              <AlertTriangle size={24} />
              <span>{safeString(error)}</span>
              <button style={s.retryButton} onClick={fetchData}>Erneut versuchen</button>
            </div>
          ) : (
            <>
              {activeTab === "workload" && (
                <div style={s.tabContent}>
                  {workload.length === 0 ? (
                    <div style={s.centeredMessage}>
                      <TrendingUp size={24} />
                      <span>Keine Workload-Prognosen verfugbar</span>
                    </div>
                  ) : (
                    <>
                      <div style={s.workloadHeader}>
                        <h4 style={s.workloadHeaderH4}>Erwartete Anlagen (7 Tage)</h4>
                        <span style={s.workloadTotal}>
                          Gesamt: {workload.reduce((sum, w) => sum + w.predictedCount, 0)}
                        </span>
                      </div>
                      <WorkloadChart predictions={workload} />
                    </>
                  )}
                </div>
              )}

              {activeTab === "anomalies" && (
                <div style={s.tabContent}>
                  {anomalies.length === 0 ? (
                    <div style={s.centeredMessageSuccess}>
                      <Activity size={24} />
                      <span>Keine Anomalien erkannt</span>
                      <p style={{ fontSize: "0.75rem", margin: 0, color: "#52525b" }}>
                        Alle Metriken sind im normalen Bereich.
                      </p>
                    </div>
                  ) : (
                    <div style={s.anomaliesList}>
                      {anomalies.map((anomaly) => (
                        <AnomalyCard key={anomaly.id} anomaly={anomaly} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "funnel" && (
                <div style={s.tabContent}>
                  {!funnel ? (
                    <div style={s.centeredMessage}>
                      <BarChart3 size={24} />
                      <span>Keine Funnel-Daten verfugbar</span>
                    </div>
                  ) : (
                    <>
                      <div style={s.funnelHeader}>
                        <h4 style={s.funnelHeaderH4}>Workflow-Funnel (30 Tage)</h4>
                      </div>
                      <FunnelVisualization funnel={funnel} />
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PredictionsPanel;
