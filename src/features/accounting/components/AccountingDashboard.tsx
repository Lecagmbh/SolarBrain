/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ACCOUNTING DASHBOARD
 * Übersicht: Umsatz, Ausgaben, Gewinn, Cash, offene Posten
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Euro,
  CreditCard,
  FileText,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import * as accountingApi from "../../../api/accounting";

interface DashboardData {
  summary: accountingApi.DashboardSummary | null;
  loading: boolean;
  error: string | null;
}

export function AccountingDashboard() {
  const [data, setData] = useState<DashboardData>({
    summary: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setData((d) => ({ ...d, loading: true, error: null }));
      const summary = await accountingApi.getDashboardSummary();
      setData({ summary, loading: false, error: null });
    } catch (err: any) {
      setData({ summary: null, loading: false, error: err.message });
    }
  }

  const formatCurrency = (amount: number, currency = "EUR") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  if (data.loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          color: "var(--dash-text-subtle, #71717a)",
        }}
      >
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (data.error) {
    return (
      <div
        style={{
          padding: "2rem",
          maxWidth: "1600px",
          margin: "0 auto",
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
          <p style={{ margin: 0 }}>Fehler beim Laden: {data.error}</p>
        </div>
      </div>
    );
  }

  const summary = data.summary || {
    ytd: { revenue: 0, expenses: 0, netIncome: 0 },
    mtd: { revenue: 0, expenses: 0, netIncome: 0 },
    accountsReceivable: { total: 0, count: 0 },
    accountsPayable: { total: 0, count: 0 },
    cash: {},
  };
  const ytdMargin = (summary.ytd?.revenue || 0) > 0
    ? (((summary.ytd?.netIncome || 0) / (summary.ytd?.revenue || 1)) * 100)
    : 0;

  return (
    <div style={{ padding: "1.5rem 2.5rem", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Top KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* YTD Revenue */}
        <KPICard
          title="Umsatz YTD"
          value={formatCurrency(summary.ytd.revenue)}
          subtitle={`MTD: ${formatCurrency(summary.mtd.revenue)}`}
          icon={TrendingUp}
          iconColor="#10b981"
          iconBg="rgba(16, 185, 129, 0.1)"
        />

        {/* YTD Expenses */}
        <KPICard
          title="Ausgaben YTD"
          value={formatCurrency(summary.ytd.expenses)}
          subtitle={`MTD: ${formatCurrency(summary.mtd.expenses)}`}
          icon={TrendingDown}
          iconColor="#f59e0b"
          iconBg="rgba(245, 158, 11, 0.1)"
        />

        {/* YTD Net Income */}
        <KPICard
          title="Gewinn YTD"
          value={formatCurrency(summary.ytd.netIncome)}
          subtitle={`Marge: ${ytdMargin.toFixed(1)}%`}
          icon={DollarSign}
          iconColor={summary.ytd.netIncome >= 0 ? "#10b981" : "#ef4444"}
          iconBg={summary.ytd.netIncome >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"}
        />

        {/* Accounts Receivable */}
        <KPICard
          title="Offene Forderungen"
          value={formatCurrency(summary.accountsReceivable.total)}
          subtitle={`${summary.accountsReceivable.count} Rechnungen offen`}
          icon={FileText}
          iconColor="#D4A843"
          iconBg="rgba(212, 168, 67, 0.1)"
        />

        {/* Accounts Payable */}
        <KPICard
          title="Offene Verbindlichkeiten"
          value={formatCurrency(summary.accountsPayable.total)}
          subtitle={`${summary.accountsPayable.count} Rechnungen unbezahlt`}
          icon={Receipt}
          iconColor="#ec4899"
          iconBg="rgba(236, 72, 153, 0.1)"
        />
      </div>

      {/* Cash Balances */}
      <div
        style={{
          background: "var(--dash-card-bg, #111113)",
          border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
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
          <CreditCard size={18} />
          Wise Bank Guthaben
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {Object.entries(summary.cash || {}).map(([currency, amount]) => (
            <div
              key={currency}
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "8px",
                padding: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: currency === "EUR" ? "rgba(16, 185, 129, 0.1)" : "rgba(212, 168, 67, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {currency === "EUR" ? (
                  <Euro size={20} color="#10b981" />
                ) : (
                  <DollarSign size={20} color="#D4A843" />
                )}
              </div>
              <div>
                <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.75rem" }}>
                  {currency}
                </div>
                <div
                  style={{
                    color: "var(--dash-text, #fafafa)",
                    fontSize: "1.25rem",
                    fontWeight: 600,
                  }}
                >
                  {formatCurrency(amount, currency)}
                </div>
              </div>
            </div>
          ))}
          {Object.keys(summary.cash || {}).length === 0 && (
            <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.875rem" }}>
              Keine Wise-Konten verbunden
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: MTD Summary + Quick Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
        }}
      >
        {/* MTD Performance */}
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
            }}
          >
            Performance diesen Monat
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <StatRow
              label="Umsatz"
              value={formatCurrency(summary.mtd.revenue)}
              positive
            />
            <StatRow
              label="Ausgaben"
              value={formatCurrency(summary.mtd.expenses)}
              positive={false}
            />
            <div
              style={{
                borderTop: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                paddingTop: "1rem",
              }}
            >
              <StatRow
                label="Gewinn"
                value={formatCurrency(summary.mtd.netIncome)}
                positive={summary.mtd.netIncome >= 0}
                highlight
              />
            </div>
          </div>
        </div>

        {/* Quick Info */}
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
            }}
          >
            Quick Info
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <InfoRow
              icon={CheckCircle2}
              text="US GAAP Doppelte Buchführung aktiv"
              color="#10b981"
            />
            <InfoRow
              icon={CreditCard}
              text={`${Object.keys(summary.cash || {}).length} Wise-Konten verbunden`}
              color="#D4A843"
            />
            <InfoRow
              icon={FileText}
              text={`${summary.accountsReceivable.count} offene Kundenrechnungen`}
              color="#f59e0b"
            />
            <InfoRow
              icon={Receipt}
              text={`${summary.accountsPayable.count} unbezahlte Lieferantenrechnungen`}
              color="#ec4899"
            />
          </div>
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

interface StatRowProps {
  label: string;
  value: string;
  positive: boolean;
  highlight?: boolean;
}

function StatRow({ label, value, positive, highlight }: StatRowProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.875rem" }}>
        {label}
      </span>
      <span
        style={{
          color: highlight
            ? positive
              ? "#10b981"
              : "#ef4444"
            : "var(--dash-text, #fafafa)",
          fontSize: highlight ? "1.125rem" : "0.875rem",
          fontWeight: highlight ? 600 : 500,
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
      >
        {highlight && (positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />)}
        {value}
      </span>
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

export default AccountingDashboard;
