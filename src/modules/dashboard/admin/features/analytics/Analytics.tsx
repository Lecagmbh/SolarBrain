/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  ANALYTICS DASHBOARD                                                         ║
 * ║  Statistiken, Charts, Reports                                                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ChevronDown,
  Clock,
  Zap,
  Building,
  Users,
  Euro,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Activity,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select, Skeleton } from "../../components/ui/UIComponents";
import "./analytics.css";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AnalyticsData {
  overview: {
    total: number;
    totalChange: number;
    completed: number;
    completedChange: number;
    avgDays: number;
    avgDaysChange: number;
    revenue: number;
    revenueChange: number;
  };
  monthlyTrend: Array<{
    month: string;
    total: number;
    completed: number;
  }>;
  statusDistribution: Array<{
    status: string;
    label: string;
    count: number;
    color: string;
  }>;
  topGridOperators: Array<{
    name: string;
    count: number;
    avgDays: number;
  }>;
  performanceByMonth: Array<{
    month: string;
    avgDays: number;
  }>;
  recentActivity: Array<{
    date: string;
    newRegistrations: number;
    completed: number;
  }>;
}

type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";

// ═══════════════════════════════════════════════════════════════════════════════
// CHART COMPONENTS (Simple SVG-based)
// ═══════════════════════════════════════════════════════════════════════════════

// Bar Chart
const BarChart: React.FC<{
  data: Array<{ label: string; value: number; value2?: number }>;
  height?: number;
  showLegend?: boolean;
}> = ({ data, height = 200, showLegend = false }) => {
  const maxValue = Math.max(...data.flatMap(d => [d.value, d.value2 || 0]));
  const barWidth = Math.floor(100 / data.length) - 2;

  return (
    <div className="chart-bar">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="chart-bar__svg">
        {data.map((item, i) => {
          const x = i * (barWidth + 2) + 1;
          const h1 = (item.value / maxValue) * (height - 20);
          const h2 = item.value2 ? (item.value2 / maxValue) * (height - 20) : 0;
          
          return (
            <g key={i}>
              <rect
                x={x}
                y={height - h1 - 16}
                width={barWidth / 2 - 1}
                height={h1}
                fill="var(--brand-primary)"
                rx="2"
              />
              {item.value2 !== undefined && (
                <rect
                  x={x + barWidth / 2}
                  y={height - h2 - 16}
                  width={barWidth / 2 - 1}
                  height={h2}
                  fill="var(--status-success)"
                  rx="2"
                />
              )}
              <text
                x={x + barWidth / 2}
                y={height - 4}
                textAnchor="middle"
                fontSize="6"
                fill="var(--text-muted)"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
      {showLegend && (
        <div className="chart-bar__legend">
          <span className="chart-bar__legend-item">
            <span className="chart-bar__legend-dot" style={{ background: "var(--brand-primary)" }} />
            Neu
          </span>
          <span className="chart-bar__legend-item">
            <span className="chart-bar__legend-dot" style={{ background: "var(--status-success)" }} />
            Abgeschlossen
          </span>
        </div>
      )}
    </div>
  );
};

// Donut Chart
const DonutChart: React.FC<{
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
}> = ({ data, size = 160 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;
  const radius = 40;
  const cx = 50;
  const cy = 50;

  const segments = data.map((item) => {
    const startAngle = (cumulative / total) * 360;
    cumulative += item.value;
    const endAngle = (cumulative / total) * 360;
    
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return {
      ...item,
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
    };
  });

  return (
    <div className="chart-donut">
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {segments.map((seg, i) => (
          <path
            key={i}
            d={seg.path}
            fill={seg.color}
            stroke="var(--bg-secondary)"
            strokeWidth="1"
          />
        ))}
        <circle cx={cx} cy={cy} r="25" fill="var(--bg-secondary)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text-primary)">
          {total}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="6" fill="var(--text-muted)">
          Gesamt
        </text>
      </svg>
      <div className="chart-donut__legend">
        {data.map((item, i) => (
          <div key={i} className="chart-donut__legend-item">
            <span className="chart-donut__legend-dot" style={{ background: item.color }} />
            <span className="chart-donut__legend-label">{item.label}</span>
            <span className="chart-donut__legend-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Line Chart
const LineChart: React.FC<{
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
}> = ({ data, height = 100, color = "var(--brand-primary)" }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((item, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - ((item.value - minValue) / range) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height - 10} ${points} 100,${height - 10}`;

  return (
    <div className="chart-line">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="chart-line__svg">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#lineGradient)" />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((item, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = height - ((item.value - minValue) / range) * (height - 20) - 10;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="var(--bg-secondary)"
              stroke={color}
              strokeWidth="2"
            />
          );
        })}
      </svg>
      <div className="chart-line__labels">
        {data.map((item, i) => (
          <span key={i} className="chart-line__label">{item.label}</span>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════

const StatCard: React.FC<{
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}> = ({ label, value, change, icon, color = "var(--brand-primary)" }) => (
  <Card className="analytics-stat">
    <div className="analytics-stat__icon" style={{ background: `${color}15`, color }}>
      {icon}
    </div>
    <div className="analytics-stat__content">
      <span className="analytics-stat__label">{label}</span>
      <span className="analytics-stat__value">{value}</span>
      {change !== undefined && (
        <span className={`analytics-stat__change ${change >= 0 ? "analytics-stat__change--up" : "analytics-stat__change--down"}`}>
          {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(change)}% zum Vormonat
        </span>
      )}
    </div>
  </Card>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.warn("Analytics: Keine Daten"); setData(null);
      setLoading(false);
    };
    fetchData();
  }, [timeRange]);

  const exportToCSV = async (rows: Record<string, unknown>[], filename: string) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(";"),
      ...rows.map(row =>
        headers
          .map(h => {
            const val = row[h];
            if (val === null || val === undefined) return "";
            if (typeof val === "string" && val.includes(";")) return `"${val}"`;
            return String(val);
          })
          .join(";")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const { downloadFile } = await import("@/utils/desktopDownload");
    await downloadFile({ filename: `${filename}_${new Date().toISOString().slice(0, 10)}.csv`, blob, fileType: 'csv' });
  };

  const handleExport = () => {
    if (!data) return;

    // Combine all visible analytics data into flat rows for CSV
    const rows: Record<string, unknown>[] = [];

    // Overview row
    rows.push({
      Bereich: "Übersicht",
      Kennzahl: "Netzanmeldungen gesamt",
      Wert: data.overview.total,
      "Veränderung (%)": data.overview.totalChange,
    });
    rows.push({
      Bereich: "Übersicht",
      Kennzahl: "Abgeschlossen",
      Wert: data.overview.completed,
      "Veränderung (%)": data.overview.completedChange,
    });
    rows.push({
      Bereich: "Übersicht",
      Kennzahl: "Durchschnittliche Durchlaufzeit (Tage)",
      Wert: data.overview.avgDays,
      "Veränderung (%)": data.overview.avgDaysChange,
    });
    rows.push({
      Bereich: "Übersicht",
      Kennzahl: "Umsatz (EUR)",
      Wert: data.overview.revenue,
      "Veränderung (%)": data.overview.revenueChange,
    });

    // Monthly trend
    for (const m of data.monthlyTrend) {
      rows.push({
        Bereich: "Monatlicher Trend",
        Kennzahl: m.month,
        Wert: m.total,
        "Veränderung (%)": m.completed,
      });
    }

    // Status distribution
    for (const s of data.statusDistribution) {
      rows.push({
        Bereich: "Status-Verteilung",
        Kennzahl: s.label,
        Wert: s.count,
        "Veränderung (%)": "",
      });
    }

    // Top grid operators
    for (const op of data.topGridOperators) {
      rows.push({
        Bereich: "Top Netzbetreiber",
        Kennzahl: op.name,
        Wert: op.count,
        "Veränderung (%)": op.avgDays,
      });
    }

    // Performance by month
    for (const p of data.performanceByMonth) {
      rows.push({
        Bereich: "Durchlaufzeit Trend",
        Kennzahl: p.month,
        Wert: p.avgDays,
        "Veränderung (%)": "",
      });
    }

    exportToCSV(rows, "analytics_export");
  };

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (!data) {
    return <div className="analytics-error">Fehler beim Laden der Daten</div>;
  }

  return (
    <div className="analytics">
      {/* Header */}
      <div className="analytics-header">
        <div className="analytics-header__left">
          <h1 className="analytics-title">Analytics</h1>
          <p className="analytics-subtitle">Übersicht und Statistiken</p>
        </div>
        <div className="analytics-header__right">
          <Select
            options={[
              { value: "7d", label: "Letzte 7 Tage" },
              { value: "30d", label: "Letzte 30 Tage" },
              { value: "90d", label: "Letzte 90 Tage" },
              { value: "1y", label: "Letztes Jahr" },
              { value: "all", label: "Gesamter Zeitraum" },
            ]}
            value={timeRange}
            onChange={(v) => setTimeRange(v as TimeRange)}
          />
          <Button variant="secondary" size="sm" icon={<Download size={16} />} onClick={handleExport}>
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="analytics-stats">
        <StatCard
          label="Netzanmeldungen"
          value={data.overview.total}
          change={data.overview.totalChange}
          icon={<Zap size={20} />}
          color="#D4A843"
        />
        <StatCard
          label="Abgeschlossen"
          value={data.overview.completed}
          change={data.overview.completedChange}
          icon={<CheckCircle2 size={20} />}
          color="#22c55e"
        />
        <StatCard
          label="⌀ Durchlaufzeit"
          value={`${data.overview.avgDays} Tage`}
          change={data.overview.avgDaysChange}
          icon={<Clock size={20} />}
          color="#06b6d4"
        />
        <StatCard
          label="Umsatz"
          value={`${(data.overview.revenue / 1000).toFixed(0)}k €`}
          change={data.overview.revenueChange}
          icon={<Euro size={20} />}
          color="#a855f7"
        />
      </div>

      {/* Charts Grid */}
      <div className="analytics-grid">
        {/* Monthly Trend */}
        <Card className="analytics-card analytics-card--wide">
          <CardHeader>
            <CardTitle>Monatlicher Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={data.monthlyTrend.map((m) => ({
                label: m.month,
                value: m.total,
                value2: m.completed,
              }))}
              height={200}
              showLegend
            />
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="analytics-card">
          <CardHeader>
            <CardTitle>Status-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={data.statusDistribution.map((s) => ({
                label: s.label,
                value: s.count,
                color: s.color,
              }))}
            />
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card className="analytics-card">
          <CardHeader>
            <CardTitle>Durchlaufzeit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={data.performanceByMonth.map((p) => ({
                label: p.month,
                value: p.avgDays,
              }))}
              color="#06b6d4"
            />
          </CardContent>
        </Card>

        {/* Top Grid Operators */}
        <Card className="analytics-card analytics-card--wide">
          <CardHeader>
            <CardTitle>Top Netzbetreiber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="analytics-table">
              <table>
                <thead>
                  <tr>
                    <th>Netzbetreiber</th>
                    <th>Anmeldungen</th>
                    <th>⌀ Tage</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topGridOperators.map((op, i) => (
                    <tr key={i}>
                      <td>
                        <div className="analytics-table__name">
                          <Building size={14} />
                          {op.name}
                        </div>
                      </td>
                      <td>{op.count}</td>
                      <td>{op.avgDays}</td>
                      <td>
                        <Badge
                          variant={op.avgDays < 5 ? "success" : op.avgDays < 7 ? "warning" : "error"}
                          size="sm"
                        >
                          {op.avgDays < 5 ? "Schnell" : op.avgDays < 7 ? "Normal" : "Langsam"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════════════

const AnalyticsSkeleton: React.FC = () => (
  <div className="analytics">
    <div className="analytics-header">
      <div>
        <Skeleton width={200} height={32} />
        <Skeleton width={300} height={20} className="mt-2" />
      </div>
    </div>
    <div className="analytics-stats">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} height={100} />
      ))}
    </div>
    <div className="analytics-grid">
      <Skeleton height={300} className="analytics-card--wide" />
      <Skeleton height={300} />
      <Skeleton height={300} />
      <Skeleton height={200} className="analytics-card--wide" />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const getMockData = (): AnalyticsData => ({
  overview: {
    total: 247,
    totalChange: 12,
    completed: 189,
    completedChange: 8,
    avgDays: 4.2,
    avgDaysChange: -15,
    revenue: 48500,
    revenueChange: 22,
  },
  monthlyTrend: [
    { month: "Jul", total: 28, completed: 22 },
    { month: "Aug", total: 35, completed: 28 },
    { month: "Sep", total: 42, completed: 35 },
    { month: "Okt", total: 38, completed: 32 },
    { month: "Nov", total: 45, completed: 38 },
    { month: "Dez", total: 59, completed: 34 },
  ],
  statusDistribution: [
    { status: "entwurf", label: "Entwurf", count: 5, color: "#525866" },
    { status: "eingereicht", label: "Eingereicht", count: 12, color: "#3b82f6" },
    { status: "warten_auf_nb", label: "Beim NB", count: 18, color: "#f59e0b" },
    { status: "nachbesserung", label: "Rückfrage", count: 3, color: "#ef4444" },
    { status: "nb_genehmigt", label: "Genehmigt", count: 9, color: "#22c55e" },
    { status: "abgeschlossen", label: "Fertig", count: 200, color: "#06b6d4" },
  ],
  topGridOperators: [
    { name: "E-Werk Mittelbaden", count: 45, avgDays: 3.2 },
    { name: "EnBW", count: 38, avgDays: 5.8 },
    { name: "Stadtwerke Karlsruhe", count: 28, avgDays: 4.1 },
    { name: "Netze BW", count: 22, avgDays: 6.5 },
    { name: "Pfalzwerke", count: 18, avgDays: 4.8 },
  ],
  performanceByMonth: [
    { month: "Jul", avgDays: 5.2 },
    { month: "Aug", avgDays: 4.8 },
    { month: "Sep", avgDays: 4.5 },
    { month: "Okt", avgDays: 4.8 },
    { month: "Nov", avgDays: 4.3 },
    { month: "Dez", avgDays: 4.2 },
  ],
  recentActivity: [],
});

export default Analytics;
