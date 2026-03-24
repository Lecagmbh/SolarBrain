/**
 * ÜBERSICHT TAB
 * Unified Dashboard: Merge aus AccountingDashboard + OP-Center KPIs
 */

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  AlertTriangle,
  CreditCard,
  Receipt,
  Euro,
  DollarSign,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import * as accountingApi from "../../../api/accounting";
import { apiGet } from "../../../modules/api/client";

interface OPKpis {
  totalOffenePosten: number;
  summeOffen: number;
  summeUeberfaellig: number;
  anzahlUeberfaellig: number;
  anzahlInMahnung: number;
  summeInMahnung: number;
  durchschnittZahlungsziel: number;
}

const EUR = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

const formatCurrency = (amount: number, currency = "EUR") =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

export default function UebersichtTab() {
  const [accountingData, setAccountingData] = useState<accountingApi.DashboardSummary | null>(null);
  const [opData, setOpData] = useState<OPKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [accounting, op] = await Promise.allSettled([
          accountingApi.getDashboardSummary(),
          apiGet("/op/dashboard"),
        ]);

        if (accounting.status === "fulfilled") setAccountingData(accounting.value);
        if (op.status === "fulfilled") setOpData((op.value as any).data);

        if (accounting.status === "rejected" && op.status === "rejected") {
          setError("Fehler beim Laden der Finanzdaten");
        }
      } catch (err: any) {
        setError(err.message || "Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
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

  if (error && !accountingData && !opData) {
    return (
      <div style={{ padding: "2rem", maxWidth: "1600px", margin: "0 auto" }}>
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
          <p style={{ margin: 0 }}>Fehler: {error}</p>
        </div>
      </div>
    );
  }

  const summary = accountingData || {
    ytd: { revenue: 0, expenses: 0, netIncome: 0 },
    mtd: { revenue: 0, expenses: 0, netIncome: 0 },
    accountsReceivable: { total: 0, count: 0 },
    accountsPayable: { total: 0, count: 0 },
    cash: {},
  };

  return (
    <div style={{ padding: "1.5rem 2.5rem", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Top KPI Cards - 6 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <KPICard
          title="Umsatz YTD"
          value={formatCurrency(summary.ytd.revenue)}
          subtitle={`MTD: ${formatCurrency(summary.mtd.revenue)}`}
          icon={TrendingUp}
          iconColor="#10b981"
          iconBg="rgba(16, 185, 129, 0.1)"
        />
        <KPICard
          title="Umsatz MTD"
          value={formatCurrency(summary.mtd.revenue)}
          subtitle={`Gewinn: ${formatCurrency(summary.mtd.netIncome)}`}
          icon={ArrowUpRight}
          iconColor="#D4A843"
          iconBg="rgba(212, 168, 67, 0.1)"
        />
        <KPICard
          title="Offene Forderungen"
          value={formatCurrency(summary.accountsReceivable.total)}
          subtitle={`${summary.accountsReceivable.count} Rechnungen`}
          icon={FileText}
          iconColor="#f59e0b"
          iconBg="rgba(245, 158, 11, 0.1)"
        />
        <KPICard
          title="Überfällige RE"
          value={opData ? String(opData.anzahlUeberfaellig) : "—"}
          subtitle={opData ? EUR(opData.summeUeberfaellig) : "—"}
          icon={AlertTriangle}
          iconColor="#ef4444"
          iconBg="rgba(239, 68, 68, 0.1)"
        />
        <KPICard
          title="Ausgaben MTD"
          value={formatCurrency(summary.mtd.expenses)}
          subtitle={`YTD: ${formatCurrency(summary.ytd.expenses)}`}
          icon={TrendingDown}
          iconColor="#ec4899"
          iconBg="rgba(236, 72, 153, 0.1)"
        />
        <KPICard
          title="Wise Saldo"
          value={summary.cash?.EUR != null ? formatCurrency(summary.cash.EUR) : "—"}
          subtitle={
            Object.keys(summary.cash || {}).length > 1
              ? `${Object.keys(summary.cash).length} Konten`
              : "EUR Konto"
          }
          icon={CreditCard}
          iconColor="#10b981"
          iconBg="rgba(16, 185, 129, 0.1)"
        />
      </div>

      {/* Bottom section: OP-Snapshot + Wise Currencies + Performance */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "1rem",
        }}
      >
        {/* OP Snapshot */}
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
            Offene Posten
          </h3>
          {opData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <InfoRow label="Gesamt offen" value={`${opData.totalOffenePosten} (${EUR(opData.summeOffen)})`} />
              <InfoRow label="Überfällig" value={`${opData.anzahlUeberfaellig} (${EUR(opData.summeUeberfaellig)})`} color="#ef4444" />
              <InfoRow label="In Mahnung" value={`${opData.anzahlInMahnung} (${EUR(opData.summeInMahnung)})`} color="#f59e0b" />
              <InfoRow label="Ø Zahlungsziel" value={`${opData.durchschnittZahlungsziel} Tage`} />
            </div>
          ) : (
            <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.85rem" }}>
              OP-Daten nicht verfügbar
            </div>
          )}
        </div>

        {/* Wise Currencies */}
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
            <CreditCard size={18} color="#10b981" />
            Wise Guthaben
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {Object.entries(summary.cash || {}).map(([currency, amount]) => (
              <div
                key={currency}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "8px",
                  padding: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: currency === "EUR" ? "rgba(16, 185, 129, 0.1)" : "rgba(212, 168, 67, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {currency === "EUR" ? <Euro size={18} color="#10b981" /> : <DollarSign size={18} color="#D4A843" />}
                </div>
                <div>
                  <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.7rem" }}>{currency}</div>
                  <div style={{ color: "var(--dash-text, #fafafa)", fontSize: "1.1rem", fontWeight: 600 }}>
                    {formatCurrency(amount, currency)}
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(summary.cash || {}).length === 0 && (
              <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.85rem" }}>
                Keine Wise-Konten verbunden
              </div>
            )}
          </div>
        </div>

        {/* Performance MTD */}
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
            <StatRow label="Umsatz" value={formatCurrency(summary.mtd.revenue)} positive />
            <StatRow label="Ausgaben" value={formatCurrency(summary.mtd.expenses)} positive={false} />
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

          {/* Quick Stats */}
          <div
            style={{
              marginTop: "1.25rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <SmallInfo icon={FileText} text={`${summary.accountsReceivable.count} offene Forderungen`} color="#f59e0b" />
            <SmallInfo icon={Receipt} text={`${summary.accountsPayable.count} unbezahlte Verbindlichkeiten`} color="#ec4899" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  iconBg: string;
}) {
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
              fontSize: "1.35rem",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}
          >
            {value}
          </div>
          <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem" }}>{subtitle}</div>
        </div>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={20} color={iconColor} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.85rem" }}>{label}</span>
      <span style={{ color: color || "var(--dash-text, #fafafa)", fontSize: "0.85rem", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

function StatRow({
  label,
  value,
  positive,
  highlight,
}: {
  label: string;
  value: string;
  positive: boolean;
  highlight?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.875rem" }}>{label}</span>
      <span
        style={{
          color: highlight ? (positive ? "#10b981" : "#ef4444") : "var(--dash-text, #fafafa)",
          fontSize: highlight ? "1.125rem" : "0.875rem",
          fontWeight: highlight ? 600 : 500,
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
      >
        {highlight &&
          (positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />)}
        {value}
      </span>
    </div>
  );
}

function SmallInfo({
  icon: Icon,
  text,
  color,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  text: string;
  color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <Icon size={14} color={color} />
      <span style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.78rem" }}>{text}</span>
    </div>
  );
}
