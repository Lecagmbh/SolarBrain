/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EVU LEARNING DASHBOARD
 * Statistiken und Analysen über alle Netzbetreiber
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Building2,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import * as evuApi from "../api/evu";

interface DashboardState {
  data: evuApi.EvuDashboard | null;
  loading: boolean;
  error: string | null;
  analyzing: boolean;
}

export default function EvuDashboardPage() {
  const [state, setState] = useState<DashboardState>({
    data: null,
    loading: true,
    error: null,
    analyzing: false,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      const data = await evuApi.getEvuDashboard();
      setState({ data, loading: false, error: null, analyzing: false });
    } catch (err: any) {
      setState({ data: null, loading: false, error: err.message, analyzing: false });
    }
  }

  async function handleAnalyzeAll() {
    try {
      setState((s) => ({ ...s, analyzing: true }));
      const result = await evuApi.analyzeAllEvus();
      // Reload dashboard after analysis
      await loadDashboard();
      alert(`Analyse abgeschlossen: ${result.analyzed} EVUs analysiert, ${result.errors} Fehler`);
    } catch (err: any) {
      setState((s) => ({ ...s, analyzing: false }));
      alert(`Fehler bei der Analyse: ${err.message}`);
    }
  }

  const formatPercent = (value: number | null) => {
    if (value === null) return "N/A";
    return `${value.toFixed(1)}%`;
  };

  const formatDays = (value: number) => {
    return `${value.toFixed(1)} Tage`;
  };

  // Loading State
  if (state.loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--dash-bg, #0a0a0f)",
          color: "var(--dash-text-subtle, #71717a)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <Loader2 size={32} className="animate-spin" />
          <span>Dashboard lädt...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (state.error) {
    return (
      <div
        style={{
          padding: "2rem",
          maxWidth: "1600px",
          margin: "0 auto",
          background: "var(--dash-bg, #0a0a0f)",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "12px",
            padding: "1.5rem",
            color: "#ef4444",
          }}
        >
          <AlertTriangle size={20} style={{ marginBottom: "0.5rem" }} />
          <p style={{ margin: 0 }}>Fehler beim Laden: {state.error}</p>
          <button
            onClick={loadDashboard}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "6px",
              color: "#ef4444",
              cursor: "pointer",
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  const data = state.data!;
  const analysisRate = data.totalEvus > 0 ? (data.analyzedEvus / data.totalEvus) * 100 : 0;

  return (
    <div style={{ padding: "1.5rem 2.5rem", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #EAD068 0%, #D4A843 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GraduationCap size={24} color="white" />
          </div>
          <div>
            <h1
              style={{
                color: "var(--dash-text, #fafafa)",
                fontSize: "1.5rem",
                fontWeight: 700,
                margin: 0,
              }}
            >
              EVU Learning Dashboard
            </h1>
            <p
              style={{
                color: "var(--dash-text-subtle, #71717a)",
                fontSize: "0.875rem",
                margin: 0,
              }}
            >
              Statistiken und Erfahrungen mit Netzbetreibern
            </p>
          </div>
        </div>
        <button
          onClick={handleAnalyzeAll}
          disabled={state.analyzing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            background: state.analyzing
              ? "rgba(212, 168, 67, 0.3)"
              : "linear-gradient(135deg, #D4A843 0%, #EAD068 100%)",
            border: "none",
            borderRadius: "8px",
            color: "white",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: state.analyzing ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {state.analyzing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <RefreshCw size={18} />
          )}
          {state.analyzing ? "Analysiere..." : "Alle EVUs analysieren"}
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Total EVUs */}
        <KPICard
          title="Netzbetreiber gesamt"
          value={data.totalEvus.toString()}
          subtitle={`${data.analyzedEvus} analysiert`}
          icon={Building2}
          iconColor="#D4A843"
          iconBg="rgba(212, 168, 67, 0.1)"
        />

        {/* Analyzed EVUs */}
        <KPICard
          title="Analyse-Abdeckung"
          value={`${analysisRate.toFixed(0)}%`}
          subtitle={`${data.analyzedEvus} von ${data.totalEvus} EVUs`}
          icon={BarChart3}
          iconColor="#10b981"
          iconBg="rgba(16, 185, 129, 0.1)"
        />

        {/* Avg Success Rate */}
        <KPICard
          title="Durchschnittliche Erfolgsquote"
          value={formatPercent(data.avgSuccessRate)}
          subtitle="Basierend auf historischen Daten"
          icon={data.avgSuccessRate && data.avgSuccessRate >= 80 ? TrendingUp : TrendingDown}
          iconColor={data.avgSuccessRate && data.avgSuccessRate >= 80 ? "#10b981" : "#f59e0b"}
          iconBg={
            data.avgSuccessRate && data.avgSuccessRate >= 80
              ? "rgba(16, 185, 129, 0.1)"
              : "rgba(245, 158, 11, 0.1)"
          }
        />
      </div>

      {/* Main Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Top Issues */}
        <div
          style={{
            background: "var(--dash-card-bg, #111113)",
            border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <h3
            style={{
              color: "var(--dash-text, #fafafa)",
              fontSize: "1rem",
              fontWeight: 600,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertTriangle size={18} color="#f59e0b" />
            Häufigste Probleme
          </h3>
          {data.topIssues.length === 0 ? (
            <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.875rem" }}>
              Keine Probleme erfasst
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {data.topIssues.map((issue, idx) => {
                const maxCount = data.topIssues[0]?.count || 1;
                const widthPercent = (issue.count / maxCount) * 100;
                return (
                  <div key={idx}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--dash-text, #fafafa)",
                          fontSize: "0.875rem",
                        }}
                      >
                        {issue.category}
                      </span>
                      <span
                        style={{
                          color: "var(--dash-text-subtle, #71717a)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {issue.count}x
                      </span>
                    </div>
                    <div
                      style={{
                        height: "6px",
                        background: "rgba(255, 255, 255, 0.05)",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${widthPercent}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                          borderRadius: "3px",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div
          style={{
            background: "var(--dash-card-bg, #111113)",
            border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <h3
            style={{
              color: "var(--dash-text, #fafafa)",
              fontSize: "1rem",
              fontWeight: 600,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <CheckCircle2 size={18} color="#10b981" />
            System Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <InfoRow
              icon={Building2}
              text={`${data.totalEvus} Netzbetreiber in der Datenbank`}
              color="#D4A843"
            />
            <InfoRow
              icon={BarChart3}
              text={`${data.analyzedEvus} EVUs mit Analysedaten`}
              color="#10b981"
            />
            <InfoRow
              icon={AlertTriangle}
              text={`${data.topIssues.length} verschiedene Problemkategorien`}
              color="#f59e0b"
            />
            <InfoRow
              icon={Clock}
              text={`${data.evusWithLongestProcessing.length} EVUs mit langen Bearbeitungszeiten`}
              color="#ec4899"
            />
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
        }}
      >
        {/* EVUs with Lowest Success Rate */}
        <div
          style={{
            background: "var(--dash-card-bg, #111113)",
            border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <h3
            style={{
              color: "var(--dash-text, #fafafa)",
              fontSize: "1rem",
              fontWeight: 600,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <TrendingDown size={18} color="#ef4444" />
            EVUs mit niedrigster Erfolgsquote
          </h3>
          {data.evusWithLowestSuccess.length === 0 ? (
            <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.875rem" }}>
              Keine Daten verfügbar
            </div>
          ) : (
            <div style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "0.75rem",
                        color: "var(--dash-text-subtle, #71717a)",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                      }}
                    >
                      Netzbetreiber
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "0.75rem",
                        color: "var(--dash-text-subtle, #71717a)",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                      }}
                    >
                      Erfolgsquote
                    </th>
                    <th
                      style={{
                        width: "40px",
                        borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                      }}
                    />
                  </tr>
                </thead>
                <tbody>
                  {data.evusWithLowestSuccess.map((evu) => (
                    <tr key={evu.id}>
                      <td
                        style={{
                          padding: "0.75rem",
                          color: "var(--dash-text, #fafafa)",
                          fontSize: "0.875rem",
                          borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))",
                        }}
                      >
                        {evu.name}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "0.75rem",
                          borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            background:
                              evu.successRate < 50
                                ? "rgba(239, 68, 68, 0.1)"
                                : evu.successRate < 70
                                ? "rgba(245, 158, 11, 0.1)"
                                : "rgba(16, 185, 129, 0.1)",
                            color:
                              evu.successRate < 50
                                ? "#ef4444"
                                : evu.successRate < 70
                                ? "#f59e0b"
                                : "#10b981",
                          }}
                        >
                          {evu.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))",
                        }}
                      >
                        <Link
                          to={`/netzbetreiber?id=${evu.id}`}
                          style={{
                            color: "var(--dash-text-subtle, #71717a)",
                            transition: "color 0.2s",
                          }}
                          title="Zum Netzbetreiber"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* EVUs with Longest Processing Time */}
        <div
          style={{
            background: "var(--dash-card-bg, #111113)",
            border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <h3
            style={{
              color: "var(--dash-text, #fafafa)",
              fontSize: "1rem",
              fontWeight: 600,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Clock size={18} color="#ec4899" />
            EVUs mit längster Bearbeitungszeit
          </h3>
          {data.evusWithLongestProcessing.length === 0 ? (
            <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.875rem" }}>
              Keine Daten verfügbar
            </div>
          ) : (
            <div style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "0.75rem",
                        color: "var(--dash-text-subtle, #71717a)",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                      }}
                    >
                      Netzbetreiber
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "0.75rem",
                        color: "var(--dash-text-subtle, #71717a)",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                      }}
                    >
                      Durchschn. Tage
                    </th>
                    <th
                      style={{
                        width: "40px",
                        borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                      }}
                    />
                  </tr>
                </thead>
                <tbody>
                  {data.evusWithLongestProcessing.map((evu) => (
                    <tr key={evu.id}>
                      <td
                        style={{
                          padding: "0.75rem",
                          color: "var(--dash-text, #fafafa)",
                          fontSize: "0.875rem",
                          borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))",
                        }}
                      >
                        {evu.name}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "0.75rem",
                          borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            background:
                              evu.avgDays > 30
                                ? "rgba(239, 68, 68, 0.1)"
                                : evu.avgDays > 14
                                ? "rgba(245, 158, 11, 0.1)"
                                : "rgba(16, 185, 129, 0.1)",
                            color:
                              evu.avgDays > 30
                                ? "#ef4444"
                                : evu.avgDays > 14
                                ? "#f59e0b"
                                : "#10b981",
                          }}
                        >
                          {formatDays(evu.avgDays)}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))",
                        }}
                      >
                        <Link
                          to={`/netzbetreiber?id=${evu.id}`}
                          style={{
                            color: "var(--dash-text-subtle, #71717a)",
                            transition: "color 0.2s",
                          }}
                          title="Zum Netzbetreiber"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  iconBg: string;
}

function KPICard({ title, value, subtitle, icon: Icon, iconColor, iconBg }: KPICardProps) {
  return (
    <div
      style={{
        background: "var(--dash-card-bg, #111113)",
        border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
        borderRadius: "12px",
        padding: "1.25rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div
            style={{
              color: "var(--dash-text-subtle, #71717a)",
              fontSize: "0.75rem",
              fontWeight: 500,
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: "var(--dash-text, #fafafa)",
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}
          >
            {value}
          </div>
          <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem" }}>
            {subtitle}
          </div>
        </div>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={22} color={iconColor} />
        </div>
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  text: string;
  color: string;
}

function InfoRow({ icon: Icon, text, color }: InfoRowProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <Icon size={16} color={color} />
      <span style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem" }}>{text}</span>
    </div>
  );
}
