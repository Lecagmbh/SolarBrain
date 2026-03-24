// ============================================
// ANALYTICS PAGE - ENDLEVEL PREMIUM
// ============================================

import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, TrendingDown, Calendar, FileText, Table,
  Activity, Clock, Euro, AlertTriangle, Building2,
  RefreshCw, ChevronDown, Zap, Target, Users, FileCheck
} from "lucide-react";
import { apiGet } from "../../services/apiClient";

// ============================================
// TYPES
// ============================================

interface AnalyticsData {
  overview: {
    totalInstallations: number;
    completedInstallations: number;
    pendingInstallations: number;
    rejectedInstallations: number;
    avgProcessingDays: number;
    successRate: number;
    totalRevenue: number;
    activeCustomers: number;
  };
  trends: {
    installations: number;
    revenue: number;
    processingTime: number;
    successRate: number;
  };
  monthlyData: Array<{
    month: string;
    completed: number;
    submitted: number;
    rejected: number;
    revenue: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  topRejectionReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  netzbetreiberPerformance: Array<{
    name: string;
    avgDays: number;
    count: number;
    successRate: number;
  }>;
  customerGrowth: Array<{
    month: string;
    customers: number;
    newCustomers: number;
  }>;
  revenueByType: Array<{
    type: string;
    revenue: number;
    count: number;
  }>;
}

type Period = "7d" | "30d" | "90d" | "1y" | "all";

// ============================================
// COMPONENT
// ============================================

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      const response = await apiGet<AnalyticsData>(`/analytics?period=${period}`);
      setData(response);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setData(getMockData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const handleExportPDF = () => {
    window.open(`/api/analytics/export/pdf?period=${period}`, "_blank");
  };

  const handleExportExcel = () => {
    window.open(`/api/analytics/export/excel?period=${period}`, "_blank");
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner" />
        <p>Lade Analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="analytics-error">
        <AlertTriangle size={48} />
        <h2>Fehler beim Laden</h2>
        <button onClick={() => fetchData()} className="btn-retry">
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Background Effects */}
      <div className="analytics-bg">
        <div className="bg-gradient-1" />
        <div className="bg-gradient-2" />
        <div className="bg-grid" />
      </div>

      {/* Header */}
      <header className="analytics-header">
        <div className="header-left">
          <div className="header-icon">
            <Activity size={28} />
          </div>
          <div>
            <h1>Analytics Dashboard</h1>
            <p>Übersicht über alle Netzanmeldungen und Performance</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className={`btn-refresh ${refreshing ? "spinning" : ""}`}
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw size={18} />
          </button>
          <div className="period-select">
            <Calendar size={16} />
            <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
              <option value="7d">Letzte 7 Tage</option>
              <option value="30d">Letzte 30 Tage</option>
              <option value="90d">Letzte 90 Tage</option>
              <option value="1y">Letztes Jahr</option>
              <option value="all">Gesamt</option>
            </select>
            <ChevronDown size={16} />
          </div>
          <div className="export-buttons">
            <button className="btn-export" onClick={handleExportPDF}>
              <FileText size={16} />
              PDF
            </button>
            <button className="btn-export" onClick={handleExportExcel}>
              <Table size={16} />
              Excel
            </button>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="kpi-grid">
        <KPICard
          icon={<FileCheck />}
          label="Abgeschlossen"
          value={data.overview.completedInstallations}
          trend={data.trends.installations}
          color="success"
        />
        <KPICard
          icon={<Clock />}
          label="Ø Bearbeitungszeit"
          value={`${data.overview.avgProcessingDays} Tage`}
          trend={data.trends.processingTime}
          trendInverse
          color="primary"
        />
        <KPICard
          icon={<Target />}
          label="Erfolgsquote"
          value={`${data.overview.successRate}%`}
          trend={data.trends.successRate}
          color="accent"
        />
        <KPICard
          icon={<Euro />}
          label="Umsatz"
          value={`€${data.overview.totalRevenue.toLocaleString("de-DE")}`}
          trend={data.trends.revenue}
          color="warning"
        />
      </section>

      {/* Secondary Stats */}
      <section className="stats-row">
        <div className="stat-mini">
          <Zap size={20} />
          <div>
            <span className="stat-value">{data.overview.totalInstallations}</span>
            <span className="stat-label">Gesamt</span>
          </div>
        </div>
        <div className="stat-mini">
          <Activity size={20} />
          <div>
            <span className="stat-value">{data.overview.pendingInstallations}</span>
            <span className="stat-label">In Bearbeitung</span>
          </div>
        </div>
        <div className="stat-mini">
          <AlertTriangle size={20} />
          <div>
            <span className="stat-value">{data.overview.rejectedInstallations}</span>
            <span className="stat-label">Abgelehnt</span>
          </div>
        </div>
        <div className="stat-mini">
          <Users size={20} />
          <div>
            <span className="stat-value">{data.overview.activeCustomers}</span>
            <span className="stat-label">Aktive Kunden</span>
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Monthly Volume Chart */}
        <div className="chart-card large">
          <div className="chart-header">
            <h3>Volumen über Zeit</h3>
            <div className="chart-legend">
              <span className="legend-item"><span className="dot success" /> Abgeschlossen</span>
              <span className="legend-item"><span className="dot primary" /> Eingereicht</span>
              <span className="legend-item"><span className="dot danger" /> Abgelehnt</span>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.monthlyData}>
                <defs>
                  <linearGradient id="gradientCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A843" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#22c55e"
                  fill="url(#gradientCompleted)"
                  strokeWidth={2}
                  name="Abgeschlossen"
                />
                <Area
                  type="monotone"
                  dataKey="submitted"
                  stroke="#D4A843"
                  fill="url(#gradientSubmitted)"
                  strokeWidth={2}
                  name="Eingereicht"
                />
                <Line
                  type="monotone"
                  dataKey="rejected"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 4 }}
                  name="Abgelehnt"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Status-Verteilung</h3>
          </div>
          <div className="chart-body pie-chart">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {data.statusDistribution.map((item, i) => (
                <div key={i} className="pie-legend-item">
                  <span className="dot" style={{ background: item.color }} />
                  <span className="label">{item.status}</span>
                  <span className="value">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue by Type */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Umsatz nach Typ</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.revenueByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis type="category" dataKey="type" stroke="rgba(255,255,255,0.5)" fontSize={11} width={100} />
                <Tooltip content={<RevenueTooltip />} />
                <Bar dataKey="revenue" fill="#EAD068" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Rejection Reasons */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top Ablehnungsgründe</h3>
          </div>
          <div className="chart-body reasons-list">
            {data.topRejectionReasons.length > 0 ? (
              data.topRejectionReasons.map((reason, i) => (
                <div key={i} className="reason-item">
                  <div className="reason-rank">{i + 1}</div>
                  <div className="reason-content">
                    <div className="reason-text">{reason.reason}</div>
                    <div className="reason-bar">
                      <div 
                        className="reason-bar-fill" 
                        style={{ width: `${reason.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="reason-count">{reason.count}</div>
                </div>
              ))
            ) : (
              <p className="no-data">Keine Ablehnungen im Zeitraum</p>
            )}
          </div>
        </div>

        {/* Netzbetreiber Performance */}
        <div className="chart-card large">
          <div className="chart-header">
            <h3>Netzbetreiber Performance</h3>
            <span className="chart-subtitle">Durchschnittliche Bearbeitungszeit</span>
          </div>
          <div className="chart-body nb-performance">
            <div className="nb-table">
              <div className="nb-header">
                <span>Netzbetreiber</span>
                <span>Ø Tage</span>
                <span>Anträge</span>
                <span>Erfolg</span>
              </div>
              {data.netzbetreiberPerformance.length > 0 ? (
                data.netzbetreiberPerformance.map((nb, i) => (
                  <div key={i} className="nb-row">
                    <div className="nb-name">
                      <Building2 size={16} />
                      {nb.name}
                    </div>
                    <div className="nb-days">
                      <div className={`nb-badge ${getDaysBadgeColor(nb.avgDays)}`}>
                        {nb.avgDays}d
                      </div>
                    </div>
                    <div className="nb-count">{nb.count}</div>
                    <div className="nb-success">
                      <div className="success-bar">
                        <div 
                          className="success-bar-fill"
                          style={{ width: `${nb.successRate}%` }}
                        />
                      </div>
                      <span>{nb.successRate}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">Keine Daten verfügbar</p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Growth */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Kundenwachstum</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ fill: "#22c55e", r: 5 }}
                  name="Gesamt"
                />
                <Line
                  type="monotone"
                  dataKey="newCustomers"
                  stroke="#D4A843"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#D4A843", r: 4 }}
                  name="Neue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style>{analyticsStyles}</style>
    </div>
  );
}

// ============================================
// KPI CARD COMPONENT
// ============================================

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend: number;
  trendInverse?: boolean;
  color: "success" | "primary" | "accent" | "warning";
}

function KPICard({ icon, label, value, trend, trendInverse, color }: KPICardProps) {
  const isPositive = trendInverse ? trend < 0 : trend > 0;
  
  return (
    <div className={`kpi-card ${color}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-trend ${isPositive ? "positive" : "negative"}`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {Math.abs(trend)}%
      </div>
    </div>
  );
}

// ============================================
// TOOLTIP COMPONENTS
// ============================================

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((item: any, i: number) => (
        <div key={i} className="tooltip-item">
          <span className="tooltip-dot" style={{ background: item.color }} />
          {item.name}: {item.value}
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  
  return (
    <div className="custom-tooltip">
      <div className="tooltip-item">
        <span className="tooltip-dot" style={{ background: payload[0].payload.color }} />
        {payload[0].payload.status}: {payload[0].value}
      </div>
    </div>
  );
}

function RevenueTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">{payload[0].payload.type}</div>
      <div className="tooltip-item">
        €{payload[0].value.toLocaleString("de-DE")}
      </div>
      <div className="tooltip-item" style={{ fontSize: "0.75rem", opacity: 0.7 }}>
        {payload[0].payload.count} Anträge
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function getDaysBadgeColor(days: number): string {
  if (days <= 5) return "fast";
  if (days <= 10) return "ok";
  return "slow";
}

function getMockData(): AnalyticsData {
  return {
    overview: {
      totalInstallations: 156,
      completedInstallations: 124,
      pendingInstallations: 23,
      rejectedInstallations: 9,
      avgProcessingDays: 8,
      successRate: 93,
      totalRevenue: 45800,
      activeCustomers: 47,
    },
    trends: {
      installations: 12,
      revenue: 8,
      processingTime: -15,
      successRate: 3,
    },
    monthlyData: [
      { month: "Jul", completed: 28, submitted: 32, rejected: 2, revenue: 8200 },
      { month: "Aug", completed: 31, submitted: 35, rejected: 3, revenue: 9100 },
      { month: "Sep", completed: 35, submitted: 38, rejected: 2, revenue: 10300 },
      { month: "Okt", completed: 42, submitted: 46, rejected: 3, revenue: 12400 },
      { month: "Nov", completed: 48, submitted: 52, rejected: 4, revenue: 14100 },
      { month: "Dez", completed: 52, submitted: 58, rejected: 5, revenue: 15800 },
    ],
    statusDistribution: [
      { status: "Abgeschlossen", count: 124, color: "#22c55e" },
      { status: "In Bearbeitung", count: 15, color: "#D4A843" },
      { status: "Warten auf NB", count: 8, color: "#f59e0b" },
      { status: "Abgelehnt", count: 9, color: "#ef4444" },
    ],
    topRejectionReasons: [
      { reason: "Schaltplan unvollständig", count: 12, percentage: 45 },
      { reason: "Lageplan fehlt", count: 8, percentage: 30 },
      { reason: "Datenblatt veraltet", count: 4, percentage: 15 },
      { reason: "Falsches Formular", count: 2, percentage: 8 },
    ],
    netzbetreiberPerformance: [
      { name: "Stadtwerke Freiburg", avgDays: 4, count: 28, successRate: 96 },
      { name: "Badenova", avgDays: 6, count: 35, successRate: 94 },
      { name: "EnBW", avgDays: 8, count: 42, successRate: 91 },
      { name: "Netze BW", avgDays: 10, count: 31, successRate: 88 },
      { name: "E-Werk Mittelbaden", avgDays: 12, count: 20, successRate: 85 },
    ],
    customerGrowth: [
      { month: "Jul", customers: 32, newCustomers: 5 },
      { month: "Aug", customers: 35, newCustomers: 4 },
      { month: "Sep", customers: 38, newCustomers: 6 },
      { month: "Okt", customers: 42, newCustomers: 7 },
      { month: "Nov", customers: 45, newCustomers: 5 },
      { month: "Dez", customers: 47, newCustomers: 4 },
    ],
    revenueByType: [
      { type: "PV-Anlage", revenue: 28500, count: 85 },
      { type: "Speicher", revenue: 8200, count: 24 },
      { type: "Wallbox", revenue: 5400, count: 32 },
      { type: "Wärmepumpe", revenue: 3700, count: 15 },
    ],
  };
}

// ============================================
// STYLES
// ============================================

const analyticsStyles = `
  .analytics-page {
    min-height: 100vh;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }

  .analytics-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  .bg-gradient-1 {
    position: absolute;
    top: -20%;
    right: -10%;
    width: 60%;
    height: 60%;
    background: radial-gradient(circle, rgba(212, 168, 67, 0.15) 0%, transparent 70%);
    filter: blur(60px);
  }

  .bg-gradient-2 {
    position: absolute;
    bottom: -20%;
    left: -10%;
    width: 50%;
    height: 50%;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
    filter: blur(60px);
  }

  .bg-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 50px 50px;
  }

  .analytics-header {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-icon {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #D4A843 0%, #EAD068 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 8px 32px rgba(212, 168, 67, 0.3);
  }

  .analytics-header h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-primary, #fff);
    margin: 0;
  }

  .analytics-header p {
    font-size: 0.875rem;
    color: var(--text-tertiary, #94a3b8);
    margin: 0.25rem 0 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .btn-refresh {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--text-secondary, #cbd5e1);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-refresh:hover {
    background: rgba(255,255,255,0.1);
    color: var(--text-primary, #fff);
  }

  .btn-refresh.spinning svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .period-select {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: var(--text-secondary, #cbd5e1);
  }

  .period-select select {
    background: transparent;
    border: none;
    color: var(--text-primary, #fff);
    font-size: 0.875rem;
    cursor: pointer;
    appearance: none;
    padding-right: 1rem;
  }

  .period-select select option {
    background: #1e1e2e;
    color: #fff;
  }

  .export-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .btn-export {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: var(--text-secondary, #cbd5e1);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-export:hover {
    background: rgba(255,255,255,0.1);
    color: var(--text-primary, #fff);
  }

  .kpi-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 1200px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 600px) {
    .kpi-grid { grid-template-columns: 1fr; }
  }

  .kpi-card {
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .kpi-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255,255,255,0.15);
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  }

  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 20px 20px 0 0;
  }

  .kpi-card.success::before { background: linear-gradient(90deg, #22c55e, #4ade80); }
  .kpi-card.primary::before { background: linear-gradient(90deg, #D4A843, #EAD068); }
  .kpi-card.accent::before { background: linear-gradient(90deg, #EAD068, #f0d878); }
  .kpi-card.warning::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

  .kpi-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .kpi-card.success .kpi-icon { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
  .kpi-card.primary .kpi-icon { background: rgba(212, 168, 67, 0.15); color: #D4A843; }
  .kpi-card.accent .kpi-icon { background: rgba(139, 92, 246, 0.15); color: #EAD068; }
  .kpi-card.warning .kpi-icon { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

  .kpi-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary, #fff);
    line-height: 1.2;
  }

  .kpi-label {
    font-size: 0.875rem;
    color: var(--text-tertiary, #94a3b8);
    margin-top: 0.25rem;
  }

  .kpi-trend {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .kpi-trend.positive {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  .kpi-trend.negative {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }

  .stats-row {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .stat-mini {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
  }

  .stat-mini svg {
    color: var(--text-tertiary, #94a3b8);
  }

  .stat-mini .stat-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  .stat-mini .stat-label {
    font-size: 0.75rem;
    color: var(--text-tertiary, #94a3b8);
    display: block;
  }

  .charts-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 1000px) {
    .charts-grid { grid-template-columns: 1fr; }
  }

  .chart-card {
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    overflow: hidden;
  }

  .chart-card.large {
    grid-column: span 2;
  }

  @media (max-width: 1000px) {
    .chart-card.large { grid-column: span 1; }
  }

  .chart-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chart-header h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #fff);
    margin: 0;
  }

  .chart-subtitle {
    font-size: 0.75rem;
    color: var(--text-tertiary, #94a3b8);
  }

  .chart-legend {
    display: flex;
    gap: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-secondary, #cbd5e1);
  }

  .legend-item .dot, .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .dot.success { background: #22c55e; }
  .dot.primary { background: #D4A843; }
  .dot.danger { background: #ef4444; }

  .chart-body {
    padding: 1.5rem;
  }

  .pie-chart {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .pie-legend {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .pie-legend-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .pie-legend-item .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .pie-legend-item .label {
    flex: 1;
    font-size: 0.875rem;
    color: var(--text-secondary, #cbd5e1);
  }

  .pie-legend-item .value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  .reasons-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .reason-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: rgba(255,255,255,0.02);
    border-radius: 10px;
  }

  .reason-rank {
    width: 28px;
    height: 28px;
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .reason-content {
    flex: 1;
  }

  .reason-text {
    font-size: 0.875rem;
    color: var(--text-primary, #fff);
    margin-bottom: 0.5rem;
  }

  .reason-bar {
    height: 4px;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .reason-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
    border-radius: 2px;
  }

  .reason-count {
    font-size: 1rem;
    font-weight: 600;
    color: #f59e0b;
  }

  .nb-table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .nb-header {
    display: grid;
    grid-template-columns: 1fr 80px 80px 150px;
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-tertiary, #94a3b8);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .nb-row {
    display: grid;
    grid-template-columns: 1fr 80px 80px 150px;
    padding: 1rem;
    background: rgba(255,255,255,0.02);
    border-radius: 12px;
    align-items: center;
    transition: all 0.2s;
  }

  .nb-row:hover {
    background: rgba(255,255,255,0.05);
  }

  .nb-name {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: var(--text-primary, #fff);
  }

  .nb-name svg {
    color: var(--text-tertiary, #94a3b8);
  }

  .nb-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-align: center;
  }

  .nb-badge.fast {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  .nb-badge.ok {
    background: rgba(212, 168, 67, 0.15);
    color: #D4A843;
  }

  .nb-badge.slow {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
  }

  .nb-count {
    font-size: 0.875rem;
    color: var(--text-secondary, #cbd5e1);
    text-align: center;
  }

  .nb-success {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .success-bar {
    flex: 1;
    height: 6px;
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  .success-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #22c55e, #4ade80);
    border-radius: 3px;
  }

  .nb-success span {
    font-size: 0.75rem;
    font-weight: 600;
    color: #22c55e;
    min-width: 40px;
    text-align: right;
  }

  .analytics-loading,
  .analytics-error {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--text-secondary, #cbd5e1);
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(255,255,255,0.1);
    border-top-color: #D4A843;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .analytics-error svg {
    color: #f59e0b;
  }

  .analytics-error h2 {
    color: var(--text-primary, #fff);
    margin: 0;
  }

  .btn-retry {
    padding: 0.75rem 1.5rem;
    background: #D4A843;
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
  }

  .custom-tooltip {
    background: rgba(15, 15, 25, 0.95);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  }

  .tooltip-label {
    font-size: 0.75rem;
    color: var(--text-tertiary, #94a3b8);
    margin-bottom: 0.5rem;
  }

  .tooltip-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-primary, #fff);
  }

  .tooltip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .no-data {
    text-align: center;
    color: var(--text-tertiary, #94a3b8);
    padding: 2rem;
  }
`;
