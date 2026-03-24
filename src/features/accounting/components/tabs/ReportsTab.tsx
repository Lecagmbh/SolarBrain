/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REPORTS TAB
 * Finanzberichte: P&L, Balance Sheet, Tax Export
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Loader2,
  ChevronDown,
  Package,
  Building2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import * as accountingApi from "../../../../api/accounting";

type ReportType = "income-statement" | "balance-sheet" | "trial-balance" | "intercompany";

export function ReportsTab() {
  const [activeReport, setActiveReport] = useState<ReportType>("income-statement");
  const [loading, setLoading] = useState(false);
  const [incomeStatement, setIncomeStatement] = useState<accountingApi.IncomeStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<accountingApi.BalanceSheet | null>(null);
  const [trialBalance, setTrialBalance] = useState<accountingApi.TrialBalance | null>(null);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generatingPackage, setGeneratingPackage] = useState(false);

  useEffect(() => {
    loadFiscalYears();
    loadReport();
  }, [activeReport, selectedYear]);

  async function loadFiscalYears() {
    try {
      const years = await accountingApi.getFiscalYears();
      setFiscalYears(years);
    } catch (err) {
      console.error("Failed to load fiscal years:", err);
    }
  }

  async function loadReport() {
    try {
      setLoading(true);
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      switch (activeReport) {
        case "income-statement":
          const is = await accountingApi.getIncomeStatement(startDate, endDate);
          setIncomeStatement(is);
          break;
        case "balance-sheet":
          const bs = await accountingApi.getBalanceSheet(endDate);
          setBalanceSheet(bs);
          break;
        case "trial-balance":
          const tb = await accountingApi.getTrialBalance(startDate, endDate);
          setTrialBalance(tb);
          break;
        case "intercompany":
          // Load intercompany report
          break;
      }
    } catch (err) {
      console.error("Failed to load report:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateTaxPackage() {
    try {
      setGeneratingPackage(true);
      const blob = await accountingApi.generateTaxPackage(selectedYear);
      const { downloadFile } = await import("@/utils/desktopDownload");
      await downloadFile({ filename: `Baunity_TaxPackage_${selectedYear}.zip`, blob, fileType: 'zip' });
    } catch (err) {
      console.error("Failed to generate tax package:", err);
      alert("Fehler beim Erstellen des Tax Packages");
    } finally {
      setGeneratingPackage(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const currentFiscalYear = fiscalYears.find((fy) => fy.year === selectedYear);

  return (
    <div style={{ padding: "1.5rem 2.5rem", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h2
            style={{
              color: "var(--dash-text, #fafafa)",
              fontSize: "1.25rem",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Finanzberichte
          </h2>
          <p style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem", margin: 0 }}>
            US GAAP konforme Berichte
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {/* Year Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={16} color="var(--dash-text-subtle, #71717a)" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                padding: "0.5rem 0.75rem",
                background: "var(--dash-card-bg, #111113)",
                border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                borderRadius: "6px",
                color: "var(--dash-text, #fafafa)",
                fontSize: "0.8rem",
              }}
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Tax Package Button */}
          <button
            onClick={handleGenerateTaxPackage}
            disabled={generatingPackage}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              background: "linear-gradient(135deg, #D4A843 0%, #EAD068 100%)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: generatingPackage ? "wait" : "pointer",
              opacity: generatingPackage ? 0.7 : 1,
            }}
          >
            {generatingPackage ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Package size={16} />
            )}
            Tax Package {selectedYear}
          </button>
        </div>
      </div>

      {/* Year Status */}
      {currentFiscalYear && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            background: currentFiscalYear.isClosed
              ? "rgba(16, 185, 129, 0.1)"
              : "rgba(245, 158, 11, 0.1)",
            borderRadius: "8px",
            marginBottom: "1.5rem",
          }}
        >
          {currentFiscalYear.isClosed ? (
            <>
              <CheckCircle2 size={16} color="#10b981" />
              <span style={{ color: "#10b981", fontSize: "0.8rem" }}>
                Geschäftsjahr {selectedYear} abgeschlossen am{" "}
                {new Date(currentFiscalYear.closedAt).toLocaleDateString("de-DE")}
              </span>
            </>
          ) : (
            <>
              <Clock size={16} color="#f59e0b" />
              <span style={{ color: "#f59e0b", fontSize: "0.8rem" }}>
                Geschäftsjahr {selectedYear} - offen
              </span>
            </>
          )}
        </div>
      )}

      {/* Report Type Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
          paddingBottom: "0.5rem",
        }}
      >
        {[
          { id: "income-statement", label: "Gewinn & Verlust", icon: TrendingUp },
          { id: "balance-sheet", label: "Bilanz", icon: DollarSign },
          { id: "trial-balance", label: "Saldenbilanz", icon: FileText },
          { id: "intercompany", label: "Inter-Company", icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as ReportType)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1rem",
                background: isActive ? "rgba(16, 185, 129, 0.1)" : "transparent",
                border: "none",
                borderRadius: "6px",
                color: isActive ? "#10b981" : "var(--dash-text-subtle, #71717a)",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      <div
        style={{
          background: "var(--dash-card-bg, #111113)",
          border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem",
              color: "var(--dash-text-subtle, #71717a)",
            }}
          >
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : activeReport === "income-statement" && incomeStatement ? (
          <IncomeStatementReport data={incomeStatement} formatCurrency={formatCurrency} />
        ) : activeReport === "balance-sheet" && balanceSheet ? (
          <BalanceSheetReport data={balanceSheet} formatCurrency={formatCurrency} />
        ) : activeReport === "trial-balance" && trialBalance ? (
          <TrialBalanceReport data={trialBalance} formatCurrency={formatCurrency} />
        ) : (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "var(--dash-text-subtle, #71717a)",
            }}
          >
            <FileText size={40} style={{ marginBottom: "0.75rem", opacity: 0.5 }} />
            <p style={{ margin: 0 }}>Keine Daten verfügbar</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INCOME STATEMENT REPORT
// ═══════════════════════════════════════════════════════════════════════════════

interface IncomeStatementReportProps {
  data: accountingApi.IncomeStatement;
  formatCurrency: (amount: number) => string;
}

function IncomeStatementReport({ data, formatCurrency }: IncomeStatementReportProps) {
  return (
    <div style={{ padding: "1.5rem" }}>
      <h3
        style={{
          color: "var(--dash-text, #fafafa)",
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        Gewinn- und Verlustrechnung
        <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem", fontWeight: 400 }}>
          {new Date(data.period.startDate).toLocaleDateString("de-DE")} -{" "}
          {new Date(data.period.endDate).toLocaleDateString("de-DE")}
        </div>
      </h3>

      {/* Revenue Section */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h4
          style={{
            color: "#10b981",
            fontSize: "0.9rem",
            fontWeight: 600,
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <TrendingUp size={16} />
          {data.revenue.title}
        </h4>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {data.revenue.accounts.map((acc) => (
              <tr key={acc.code}>
                <td
                  style={{
                    padding: "0.5rem 0",
                    color: "var(--dash-text-subtle, #71717a)",
                    fontSize: "0.8rem",
                  }}
                >
                  {acc.code}
                </td>
                <td
                  style={{
                    padding: "0.5rem 0.5rem",
                    color: "var(--dash-text, #fafafa)",
                    fontSize: "0.8rem",
                  }}
                >
                  {acc.name}
                </td>
                <td
                  style={{
                    padding: "0.5rem 0",
                    textAlign: "right",
                    color: "var(--dash-text, #fafafa)",
                    fontSize: "0.8rem",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCurrency(acc.amount)}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "1px solid var(--dash-border, rgba(255, 255, 255, 0.1))" }}>
              <td colSpan={2} style={{ padding: "0.75rem 0", fontWeight: 600, color: "#10b981" }}>
                Total Revenue
              </td>
              <td
                style={{
                  padding: "0.75rem 0",
                  textAlign: "right",
                  fontWeight: 600,
                  color: "#10b981",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatCurrency(data.revenue.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Expenses Section */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h4
          style={{
            color: "#f59e0b",
            fontSize: "0.9rem",
            fontWeight: 600,
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <TrendingDown size={16} />
          {data.expenses.title}
        </h4>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {data.expenses.accounts.map((acc) => (
              <tr key={acc.code}>
                <td
                  style={{
                    padding: "0.5rem 0",
                    color: "var(--dash-text-subtle, #71717a)",
                    fontSize: "0.8rem",
                  }}
                >
                  {acc.code}
                </td>
                <td
                  style={{
                    padding: "0.5rem 0.5rem",
                    color: "var(--dash-text, #fafafa)",
                    fontSize: "0.8rem",
                  }}
                >
                  {acc.name}
                </td>
                <td
                  style={{
                    padding: "0.5rem 0",
                    textAlign: "right",
                    color: "var(--dash-text, #fafafa)",
                    fontSize: "0.8rem",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCurrency(acc.amount)}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "1px solid var(--dash-border, rgba(255, 255, 255, 0.1))" }}>
              <td colSpan={2} style={{ padding: "0.75rem 0", fontWeight: 600, color: "#f59e0b" }}>
                Total Expenses
              </td>
              <td
                style={{
                  padding: "0.75rem 0",
                  textAlign: "right",
                  fontWeight: 600,
                  color: "#f59e0b",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatCurrency(data.expenses.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Income */}
      <div
        style={{
          padding: "1rem",
          background: data.netIncome >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: data.netIncome >= 0 ? "#10b981" : "#ef4444",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          Net Income
        </span>
        <span
          style={{
            color: data.netIncome >= 0 ? "#10b981" : "#ef4444",
            fontSize: "1.25rem",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatCurrency(data.netIncome)}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BALANCE SHEET REPORT
// ═══════════════════════════════════════════════════════════════════════════════

interface BalanceSheetReportProps {
  data: accountingApi.BalanceSheet;
  formatCurrency: (amount: number) => string;
}

function BalanceSheetReport({ data, formatCurrency }: BalanceSheetReportProps) {
  return (
    <div style={{ padding: "1.5rem" }}>
      <h3
        style={{
          color: "var(--dash-text, #fafafa)",
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        Bilanz
        <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem", fontWeight: 400 }}>
          Stand: {new Date(data.asOf).toLocaleDateString("de-DE")}
        </div>
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Assets */}
        <div>
          <h4
            style={{
              color: "#10b981",
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            Assets
          </h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {data.assets.current.accounts.map((acc) => (
                <tr key={acc.code}>
                  <td
                    style={{
                      padding: "0.5rem 0",
                      color: "var(--dash-text, #fafafa)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {acc.code} {acc.name}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem 0",
                      textAlign: "right",
                      color: "var(--dash-text, #fafafa)",
                      fontSize: "0.8rem",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatCurrency(acc.amount)}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid #10b981" }}>
                <td style={{ padding: "0.75rem 0", fontWeight: 600, color: "#10b981" }}>
                  Total Assets
                </td>
                <td
                  style={{
                    padding: "0.75rem 0",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#10b981",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCurrency(data.assets.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Liabilities & Equity */}
        <div>
          <h4
            style={{
              color: "#D4A843",
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            Liabilities
          </h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {data.liabilities.current.accounts.map((acc) => (
                <tr key={acc.code}>
                  <td
                    style={{
                      padding: "0.5rem 0",
                      color: "var(--dash-text, #fafafa)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {acc.code} {acc.name}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem 0",
                      textAlign: "right",
                      color: "var(--dash-text, #fafafa)",
                      fontSize: "0.8rem",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatCurrency(acc.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4
            style={{
              color: "#ec4899",
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
              marginTop: "1rem",
            }}
          >
            Equity
          </h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {data.equity.accounts.map((acc) => (
                <tr key={acc.code}>
                  <td
                    style={{
                      padding: "0.5rem 0",
                      color: "var(--dash-text, #fafafa)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {acc.code} {acc.name}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem 0",
                      textAlign: "right",
                      color: "var(--dash-text, #fafafa)",
                      fontSize: "0.8rem",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatCurrency(acc.amount)}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid #ec4899" }}>
                <td style={{ padding: "0.75rem 0", fontWeight: 600, color: "#ec4899" }}>
                  Total Liab. & Equity
                </td>
                <td
                  style={{
                    padding: "0.75rem 0",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#ec4899",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCurrency(data.totalLiabilitiesAndEquity)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Check */}
      <div
        style={{
          marginTop: "1.5rem",
          padding: "0.75rem 1rem",
          background: data.isBalanced ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <span style={{ color: data.isBalanced ? "#10b981" : "#ef4444", fontSize: "0.8rem" }}>
          {data.isBalanced ? "✓ Bilanz ist ausgeglichen" : "⚠ Bilanz ist NICHT ausgeglichen!"}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRIAL BALANCE REPORT
// ═══════════════════════════════════════════════════════════════════════════════

interface TrialBalanceReportProps {
  data: accountingApi.TrialBalance;
  formatCurrency: (amount: number) => string;
}

function TrialBalanceReport({ data, formatCurrency }: TrialBalanceReportProps) {
  return (
    <div style={{ padding: "1.5rem" }}>
      <h3
        style={{
          color: "var(--dash-text, #fafafa)",
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        Saldenbilanz (Trial Balance)
      </h3>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.1))" }}>
            <th
              style={{
                padding: "0.75rem 0.5rem",
                textAlign: "left",
                color: "var(--dash-text-subtle, #71717a)",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              Konto
            </th>
            <th
              style={{
                padding: "0.75rem 0.5rem",
                textAlign: "left",
                color: "var(--dash-text-subtle, #71717a)",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              Name
            </th>
            <th
              style={{
                padding: "0.75rem 0.5rem",
                textAlign: "right",
                color: "#10b981",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              Soll
            </th>
            <th
              style={{
                padding: "0.75rem 0.5rem",
                textAlign: "right",
                color: "#ef4444",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              Haben
            </th>
          </tr>
        </thead>
        <tbody>
          {data.accounts.map((acc) => (
            <tr
              key={acc.code}
              style={{ borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))" }}
            >
              <td
                style={{
                  padding: "0.625rem 0.5rem",
                  color: "var(--dash-text-subtle, #71717a)",
                  fontSize: "0.8rem",
                }}
              >
                {acc.code}
              </td>
              <td
                style={{
                  padding: "0.625rem 0.5rem",
                  color: "var(--dash-text, #fafafa)",
                  fontSize: "0.8rem",
                }}
              >
                {acc.name}
              </td>
              <td
                style={{
                  padding: "0.625rem 0.5rem",
                  textAlign: "right",
                  color: acc.debit > 0 ? "#10b981" : "transparent",
                  fontSize: "0.8rem",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {acc.debit > 0 ? formatCurrency(acc.debit) : ""}
              </td>
              <td
                style={{
                  padding: "0.625rem 0.5rem",
                  textAlign: "right",
                  color: acc.credit > 0 ? "#ef4444" : "transparent",
                  fontSize: "0.8rem",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {acc.credit > 0 ? formatCurrency(acc.credit) : ""}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: "2px solid var(--dash-border, rgba(255, 255, 255, 0.2))" }}>
            <td colSpan={2} style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "var(--dash-text, #fafafa)" }}>
              Summen
            </td>
            <td
              style={{
                padding: "0.75rem 0.5rem",
                textAlign: "right",
                fontWeight: 600,
                color: "#10b981",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCurrency(data.totals.debit)}
            </td>
            <td
              style={{
                padding: "0.75rem 0.5rem",
                textAlign: "right",
                fontWeight: 600,
                color: "#ef4444",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCurrency(data.totals.credit)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1rem",
          background: data.isBalanced ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <span style={{ color: data.isBalanced ? "#10b981" : "#ef4444", fontSize: "0.8rem" }}>
          {data.isBalanced ? "✓ Soll = Haben (ausgeglichen)" : "⚠ Soll ≠ Haben (Differenz!)"}
        </span>
      </div>
    </div>
  );
}

export default ReportsTab;
