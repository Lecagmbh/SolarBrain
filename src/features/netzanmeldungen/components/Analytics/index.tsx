/**
 * ANALYTICS DASHBOARD - Complete Reporting & Statistics
 */

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Clock, Check, AlertTriangle, Building2,
  Download, RefreshCw, Loader2, BarChart3, PieChart, Users,
  Zap, Euro, Target, ArrowRight,
} from "lucide-react";
import { api } from "../../services/api";
import { getStatusConfig, formatCurrency } from "../../utils";

interface AnalyticsDashboardProps {
  onClose?: () => void;
}

export function AnalyticsDashboard({ onClose }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month");
  const [data, setData] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, report] = await Promise.all([
        api.analytics.getDashboard(),
        api.analytics.getReport({ period }),
      ]);
      setData({ ...dashboard, report });
    } catch (e) {
      console.error("Failed to load analytics:", e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async (format: "pdf" | "excel") => {
    setExporting(true);
    try {
      const blob = await api.analytics.exportReport({ period, format });
      const filename = `netzanmeldungen-report-${period}.${format === "pdf" ? "pdf" : "xlsx"}`;
      const { downloadFile } = await import("@/utils/desktopDownload");
      await downloadFile({ filename, blob, fileType: format === "pdf" ? 'pdf' : 'xlsx' });
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="ad-loading">
        <Loader2 size={48} className="spin" />
        <span>Lade Analytics...</span>
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="ad-dashboard">
      {/* Header */}
      <div className="ad-header">
        <div className="ad-header__title">
          <BarChart3 size={24} />
          <h1>Analytics Dashboard</h1>
        </div>
        <div className="ad-header__actions">
          <div className="ad-period-selector">
            {(["week", "month", "quarter", "year"] as const).map(p => (
              <button
                key={p}
                className={period === p ? "active" : ""}
                onClick={() => setPeriod(p)}
              >
                {p === "week" ? "Woche" : p === "month" ? "Monat" : p === "quarter" ? "Quartal" : "Jahr"}
              </button>
            ))}
          </div>
          <button className="ad-btn" onClick={loadData}><RefreshCw size={16} /></button>
          <button className="ad-btn" onClick={() => handleExport("excel")} disabled={exporting}>
            {exporting ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
            Export
          </button>
          {onClose && <button className="ad-btn ad-btn--icon" onClick={onClose}>×</button>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="ad-kpis">
        <KPICard
          icon={Zap}
          label="Gesamt Anmeldungen"
          value={kpis.total || 0}
          trend={kpis.totalTrend}
          color="#3b82f6"
        />
        <KPICard
          icon={Check}
          label="Abgeschlossen"
          value={kpis.completed || 0}
          subtitle={`${kpis.completionRate || 0}% Rate`}
          trend={kpis.completedTrend}
          color="#22c55e"
        />
        <KPICard
          icon={Clock}
          label="Ø Bearbeitungszeit"
          value={`${kpis.avgDays || 0} Tage`}
          trend={kpis.avgDaysTrend}
          trendInvert
          color="#EAD068"
        />
        <KPICard
          icon={Euro}
          label="Pipeline-Wert"
          value={formatCurrency(kpis.pipelineValue || 0)}
          trend={kpis.pipelineTrend}
          color="#f59e0b"
        />
        <KPICard
          icon={AlertTriangle}
          label="Überfällig"
          value={kpis.overdue || 0}
          color={kpis.overdue > 0 ? "#ef4444" : "#64748b"}
          alert={kpis.overdue > 5}
        />
        <KPICard
          icon={Target}
          label="Diesen Monat"
          value={kpis.thisMonth || 0}
          subtitle={`${kpis.thisMonthCompleted || 0} abgeschlossen`}
          color="#06b6d4"
        />
      </div>

      {/* Charts Row */}
      <div className="ad-charts">
        {/* Status Distribution */}
        <div className="ad-chart-card">
          <h3><PieChart size={18} /> Status-Verteilung</h3>
          <div className="ad-status-chart">
            {Object.entries(kpis.byStatus || {}).map(([status, count]: [string, any]) => {
              const cfg = getStatusConfig(status);
              const total = Object.values(kpis.byStatus || {}).reduce((a: number, b: any) => a + (b as number), 0) as number;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={status} className="ad-status-bar">
                  <div className="ad-status-bar__label">
                    <span style={{ color: cfg.color }}>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                    <span className="ad-status-bar__count">{count}</span>
                  </div>
                  <div className="ad-status-bar__track">
                    <div className="ad-status-bar__fill" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                  <span className="ad-status-bar__pct">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Grid Operators */}
        <div className="ad-chart-card">
          <h3><Building2 size={18} /> Top Netzbetreiber</h3>
          <div className="ad-top-list">
            {(data?.topGridOperators || []).slice(0, 5).map((nb: any, i: number) => (
              <div key={nb.id || i} className="ad-top-item">
                <span className="ad-top-item__rank">#{i + 1}</span>
                <div className="ad-top-item__content">
                  <span className="ad-top-item__name">{nb.name}</span>
                  <span className="ad-top-item__meta">{nb.count} Anmeldungen · Ø {nb.avgDays} Tage</span>
                </div>
                <span className="ad-top-item__value">{nb.count}</span>
              </div>
            ))}
            {(!data?.topGridOperators || data.topGridOperators.length === 0) && (
              <div className="ad-empty">Keine Daten</div>
            )}
          </div>
        </div>

        {/* Team Performance */}
        <div className="ad-chart-card">
          <h3><Users size={18} /> Team Performance</h3>
          <div className="ad-top-list">
            {(kpis.byTeamMember || []).slice(0, 5).map((member: any, i: number) => (
              <div key={member.id || i} className="ad-top-item">
                <div className="ad-top-item__avatar">{member.name?.charAt(0) || "?"}</div>
                <div className="ad-top-item__content">
                  <span className="ad-top-item__name">{member.name}</span>
                  <span className="ad-top-item__meta">{member.active} aktiv · {member.completed} erledigt</span>
                </div>
                <span className="ad-top-item__value">{member.active + member.completed}</span>
              </div>
            ))}
            {(!kpis.byTeamMember || kpis.byTeamMember.length === 0) && (
              <div className="ad-empty">Keine Daten</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottlenecks & Trends */}
      <div className="ad-bottom-row">
        {/* Bottlenecks */}
        <div className="ad-chart-card ad-chart-card--warning">
          <h3><AlertTriangle size={18} /> Engpässe & Warnungen</h3>
          <div className="ad-bottlenecks">
            {(data?.bottlenecks || []).map((b: any, i: number) => (
              <div key={i} className="ad-bottleneck">
                <AlertTriangle size={16} />
                <span>{b.message}</span>
                <ArrowRight size={14} />
              </div>
            ))}
            {(!data?.bottlenecks || data.bottlenecks.length === 0) && (
              <div className="ad-success">
                <Check size={24} />
                <span>Keine kritischen Engpässe</span>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="ad-chart-card">
          <h3><TrendingUp size={18} /> Monatlicher Trend</h3>
          <div className="ad-trend-chart">
            {(data?.trendsMonthly || []).slice(-6).map((t: any, i: number) => (
              <div key={i} className="ad-trend-bar">
                <div className="ad-trend-bar__fill" style={{ height: `${Math.min(100, (t.count / 50) * 100)}%` }} />
                <span className="ad-trend-bar__label">{t.month}</span>
                <span className="ad-trend-bar__value">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KPI CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function KPICard({ icon: Icon, label, value, subtitle, trend, trendInvert, color, alert }: {
  icon: any;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendInvert?: boolean;
  color: string;
  alert?: boolean;
}) {
  const trendPositive = trendInvert ? (trend || 0) < 0 : (trend || 0) > 0;

  return (
    <div className={`ad-kpi ${alert ? "ad-kpi--alert" : ""}`} style={{ "--kpi-color": color } as React.CSSProperties}>
      <div className="ad-kpi__icon"><Icon size={24} /></div>
      <div className="ad-kpi__content">
        <span className="ad-kpi__value">{value}</span>
        <span className="ad-kpi__label">{label}</span>
        {subtitle && <span className="ad-kpi__subtitle">{subtitle}</span>}
      </div>
      {trend !== undefined && trend !== 0 && (
        <div className={`ad-kpi__trend ${trendPositive ? "ad-kpi__trend--up" : "ad-kpi__trend--down"}`}>
          {trendPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

export const AnalyticsDashboardStyles = `
.ad-dashboard { padding: 2rem; max-width: 1400px; margin: 0 auto; }
.ad-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 4rem; color: #64748b; }

.ad-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.ad-header__title { display: flex; align-items: center; gap: 0.75rem; }
.ad-header__title h1 { font-size: 1.5rem; font-weight: 700; color: #fff; margin: 0; }
.ad-header__actions { display: flex; align-items: center; gap: 0.75rem; }

.ad-period-selector { display: flex; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 0.25rem; }
.ad-period-selector button { padding: 0.5rem 1rem; background: none; border: none; color: #64748b; font-size: 0.8125rem; cursor: pointer; border-radius: 6px; transition: all 0.2s; }
.ad-period-selector button:hover { color: #e2e8f0; }
.ad-period-selector button.active { background: #3b82f6; color: #fff; }

.ad-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e2e8f0; font-size: 0.8125rem; cursor: pointer; transition: all 0.2s; }
.ad-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
.ad-btn:disabled { opacity: 0.5; }
.ad-btn--icon { width: 36px; height: 36px; padding: 0; font-size: 1.25rem; }

/* KPIs */
.ad-kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; margin-bottom: 2rem; }
.ad-kpi { display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; position: relative; }
.ad-kpi--alert { border-color: rgba(239,68,68,0.3); animation: pulse-border 2s infinite; }
@keyframes pulse-border { 0%, 100% { border-color: rgba(239,68,68,0.3); } 50% { border-color: rgba(239,68,68,0.6); } }
.ad-kpi__icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--kpi-color) 15%, transparent); color: var(--kpi-color); border-radius: 12px; }
.ad-kpi__content { flex: 1; }
.ad-kpi__value { display: block; font-size: 1.5rem; font-weight: 700; color: #fff; line-height: 1.2; }
.ad-kpi__label { display: block; font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
.ad-kpi__subtitle { display: block; font-size: 0.6875rem; color: #94a3b8; }
.ad-kpi__trend { position: absolute; top: 1rem; right: 1rem; display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; font-weight: 500; padding: 0.25rem 0.5rem; border-radius: 4px; }
.ad-kpi__trend--up { background: rgba(34,197,94,0.15); color: #22c55e; }
.ad-kpi__trend--down { background: rgba(239,68,68,0.15); color: #ef4444; }

/* Charts */
.ad-charts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
.ad-chart-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.25rem; }
.ad-chart-card--warning { border-color: rgba(245,158,11,0.2); }
.ad-chart-card h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; font-weight: 600; color: #fff; margin: 0 0 1rem; }

.ad-status-chart { display: flex; flex-direction: column; gap: 0.75rem; }
.ad-status-bar__label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #e2e8f0; margin-bottom: 0.25rem; }
.ad-status-bar__count { margin-left: auto; color: #94a3b8; }
.ad-status-bar__track { height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
.ad-status-bar__fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
.ad-status-bar__pct { font-size: 0.6875rem; color: #64748b; text-align: right; }

.ad-top-list { display: flex; flex-direction: column; gap: 0.5rem; }
.ad-top-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem; background: rgba(255,255,255,0.02); border-radius: 8px; }
.ad-top-item__rank { font-size: 0.75rem; font-weight: 600; color: #64748b; width: 24px; }
.ad-top-item__avatar { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #3b82f6, #EAD068); display: flex; align-items: center; justify-content: center; font-weight: 600; color: #fff; font-size: 0.8125rem; }
.ad-top-item__content { flex: 1; min-width: 0; }
.ad-top-item__name { display: block; font-size: 0.8125rem; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-top-item__meta { display: block; font-size: 0.6875rem; color: #64748b; }
.ad-top-item__value { font-size: 0.875rem; font-weight: 600; color: #3b82f6; }

.ad-empty { padding: 2rem; text-align: center; color: #64748b; font-size: 0.875rem; }

/* Bottom Row */
.ad-bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.ad-bottlenecks { display: flex; flex-direction: column; gap: 0.5rem; }
.ad-bottleneck { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; font-size: 0.8125rem; color: #f59e0b; }
.ad-bottleneck svg:last-child { margin-left: auto; opacity: 0.5; }
.ad-success { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; padding: 2rem; color: #22c55e; }

.ad-trend-chart { display: flex; align-items: flex-end; gap: 0.5rem; height: 150px; padding-top: 1rem; }
.ad-trend-bar { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.ad-trend-bar__fill { width: 100%; background: linear-gradient(180deg, #3b82f6, #2563eb); border-radius: 4px 4px 0 0; transition: height 0.5s ease; }
.ad-trend-bar__label { font-size: 0.6875rem; color: #64748b; margin-top: 0.5rem; }
.ad-trend-bar__value { font-size: 0.75rem; font-weight: 600; color: #fff; }

/* Responsive */
@media (max-width: 1200px) {
  .ad-kpis { grid-template-columns: repeat(3, 1fr); }
  .ad-charts { grid-template-columns: 1fr; }
  .ad-bottom-row { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .ad-kpis { grid-template-columns: repeat(2, 1fr); }
  .ad-header { flex-direction: column; gap: 1rem; align-items: stretch; }
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
