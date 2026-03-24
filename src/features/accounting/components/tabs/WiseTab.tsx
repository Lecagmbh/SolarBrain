/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * WISE TAB
 * Wise Bank Dashboard mit Transaktionen und Smart Matching
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from "react";
import {
  CreditCard,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Link2,
  Euro,
  DollarSign,
  Sparkles,
} from "lucide-react";
import * as accountingApi from "../../../../api/accounting";
import { apiGet, apiPost } from "../../../../api/client";

interface WiseBalance {
  currency: string;
  balance: number;
}

interface WiseTransaction {
  id: number;
  date: string;
  type: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  matchStatus: string | null;
  rechnung?: { id: number; nummer: string };
  expense?: { id: number; description: string };
}

interface UnmatchedWithSuggestions {
  transaction: WiseTransaction;
  suggestions: accountingApi.MatchSuggestion[];
  bestMatch: accountingApi.MatchSuggestion | null;
}

export function WiseTab() {
  const [balances, setBalances] = useState<WiseBalance[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedWithSuggestions[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [unmatchedRes, statsRes] = await Promise.all([
        accountingApi.getUnmatchedWithSuggestions(20),
        accountingApi.getMatchingStats(),
      ]);

      // Load balances from dashboard
      try {
        const summary = await accountingApi.getDashboardSummary();
        const balanceList = Object.entries(summary.cash || {}).map(([currency, balance]) => ({
          currency,
          balance: balance as number,
        }));
        setBalances(balanceList);
      } catch {
        setBalances([]);
      }

      setUnmatched(unmatchedRes);
      setStats(statsRes);
    } catch (err) {
      console.error("Failed to load Wise data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    try {
      setSyncing(true);
      await apiPost("/api/wise/sync", {});
      await loadData();
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  }

  async function handleAutoMatch() {
    try {
      setAutoMatching(true);
      const result = await accountingApi.runAutoMatching(85);
      alert(`Auto-Matching abgeschlossen: ${result.matched} gematcht, ${result.skipped} übersprungen`);
      await loadData();
    } catch (err) {
      console.error("Auto-match failed:", err);
    } finally {
      setAutoMatching(false);
    }
  }

  async function handleConfirmMatch(transactionId: number, type: string, matchId: number) {
    try {
      if (type === "invoice") {
        await apiPost(`/api/wise/transactions/${transactionId}/match`, { rechnungId: matchId });
      } else {
        await apiPost(`/api/wise/transactions/${transactionId}/match`, { expenseId: matchId });
      }
      await loadData();
    } catch (err) {
      console.error("Match failed:", err);
    }
  }

  const formatCurrency = (amount: number, currency = "EUR") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

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
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <CreditCard size={20} />
            Wise Business
          </h2>
          <p style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem", margin: 0 }}>
            Echtzeit-Kontostand und Transaction Matching
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              background: "rgba(212, 168, 67, 0.1)",
              border: "1px solid rgba(212, 168, 67, 0.2)",
              borderRadius: "8px",
              color: "#D4A843",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: syncing ? "wait" : "pointer",
            }}
          >
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            Synchronisieren
          </button>
          <button
            onClick={handleAutoMatch}
            disabled={autoMatching}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              background: "linear-gradient(135deg, #EAD068 0%, #D4A843 100%)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: autoMatching ? "wait" : "pointer",
            }}
          >
            {autoMatching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            Auto-Match
          </button>
        </div>
      </div>

      {/* Balances */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {balances.map((b) => (
          <div
            key={b.currency}
            style={{
              background: "var(--dash-card-bg, #111113)",
              border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "12px",
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background:
                  b.currency === "EUR"
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "linear-gradient(135deg, #D4A843 0%, #EAD068 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {b.currency === "EUR" ? (
                <Euro size={24} color="white" />
              ) : (
                <DollarSign size={24} color="white" />
              )}
            </div>
            <div>
              <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.75rem" }}>
                {b.currency} Balance
              </div>
              <div
                style={{
                  color: "var(--dash-text, #fafafa)",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                }}
              >
                {formatCurrency(b.balance, b.currency)}
              </div>
            </div>
          </div>
        ))}

        {/* Matching Stats Card */}
        {stats && (
          <div
            style={{
              background: "var(--dash-card-bg, #111113)",
              border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "12px",
              padding: "1.25rem",
            }}
          >
            <div
              style={{
                color: "var(--dash-text-subtle, #71717a)",
                fontSize: "0.75rem",
                marginBottom: "0.5rem",
              }}
            >
              Matching Status
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span
                style={{
                  color: "var(--dash-text, #fafafa)",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                }}
              >
                {stats.matchRate.toFixed(0)}%
              </span>
              <span style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem" }}>
                gematcht
              </span>
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <div
                style={{
                  height: "6px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${stats.matchRate}%`,
                    background: "linear-gradient(90deg, #10b981, #D4A843)",
                    borderRadius: "3px",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "0.375rem",
                  fontSize: "0.7rem",
                  color: "var(--dash-text-subtle, #71717a)",
                }}
              >
                <span>{stats.matched} gematcht</span>
                <span>{stats.unmatched} offen</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unmatched Transactions */}
      <div
        style={{
          background: "var(--dash-card-bg, #111113)",
          border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={16} color="#f59e0b" />
          <h3
            style={{
              color: "var(--dash-text, #fafafa)",
              fontSize: "0.9rem",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Ungematchte Transaktionen
          </h3>
          <span
            style={{
              marginLeft: "auto",
              padding: "0.25rem 0.5rem",
              background: "rgba(245, 158, 11, 0.1)",
              borderRadius: "4px",
              color: "#f59e0b",
              fontSize: "0.7rem",
              fontWeight: 500,
            }}
          >
            {unmatched.length} offen
          </span>
        </div>

        {unmatched.length === 0 ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "var(--dash-text-subtle, #71717a)",
            }}
          >
            <CheckCircle2 size={40} style={{ marginBottom: "0.75rem", color: "#10b981" }} />
            <p style={{ margin: 0 }}>Alle Transaktionen sind gematcht!</p>
          </div>
        ) : (
          <div>
            {unmatched.map((item) => (
              <UnmatchedTransactionCard
                key={item.transaction.id}
                item={item}
                onConfirmMatch={handleConfirmMatch}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNMATCHED TRANSACTION CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface UnmatchedTransactionCardProps {
  item: UnmatchedWithSuggestions;
  onConfirmMatch: (transactionId: number, type: string, matchId: number) => void;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: string) => string;
}

function UnmatchedTransactionCard({
  item,
  onConfirmMatch,
  formatCurrency,
  formatDate,
}: UnmatchedTransactionCardProps) {
  const { transaction, suggestions, bestMatch } = item;
  const isIncoming = transaction.amount > 0;

  return (
    <div
      style={{
        padding: "1.25rem",
        borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))",
      }}
    >
      {/* Transaction Info */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: isIncoming ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isIncoming ? (
            <ArrowDownRight size={20} color="#10b981" />
          ) : (
            <ArrowUpRight size={20} color="#ef4444" />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div
                style={{
                  color: "var(--dash-text, #fafafa)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
              >
                {transaction.reference || transaction.description}
              </div>
              <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.75rem" }}>
                {formatDate(transaction.date)} • {transaction.type}
              </div>
            </div>
            <div
              style={{
                color: isIncoming ? "#10b981" : "#ef4444",
                fontSize: "1.125rem",
                fontWeight: 600,
              }}
            >
              {isIncoming ? "+" : ""}
              {formatCurrency(transaction.amount, transaction.currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Match Suggestions */}
      {suggestions.length > 0 ? (
        <div style={{ marginLeft: "3.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <Sparkles size={14} color="#EAD068" />
            <span style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.75rem" }}>
              KI-Vorschläge
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {suggestions.slice(0, 3).map((suggestion, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.625rem 0.875rem",
                  background:
                    idx === 0 ? "rgba(139, 92, 246, 0.1)" : "rgba(255, 255, 255, 0.03)",
                  borderRadius: "8px",
                  border:
                    idx === 0
                      ? "1px solid rgba(139, 92, 246, 0.2)"
                      : "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      background:
                        suggestion.type === "invoice"
                          ? "rgba(16, 185, 129, 0.1)"
                          : "rgba(212, 168, 67, 0.1)",
                      color: suggestion.type === "invoice" ? "#10b981" : "#D4A843",
                      fontSize: "0.7rem",
                      fontWeight: 500,
                    }}
                  >
                    {suggestion.type === "invoice" ? "Rechnung" : "Expense"}
                  </div>
                  <div>
                    <div
                      style={{
                        color: "var(--dash-text, #fafafa)",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                      }}
                    >
                      {suggestion.reference}
                    </div>
                    <div style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.7rem" }}>
                      {formatCurrency(suggestion.amount)} • {suggestion.confidence}% Match
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onConfirmMatch(transaction.id, suggestion.type, suggestion.id)}
                  style={{
                    padding: "0.375rem 0.75rem",
                    background: idx === 0 ? "#EAD068" : "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    borderRadius: "6px",
                    color: idx === 0 ? "white" : "var(--dash-text, #fafafa)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                  }}
                >
                  <Link2 size={12} />
                  Match
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            marginLeft: "3.5rem",
            padding: "0.75rem",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "8px",
            color: "var(--dash-text-subtle, #71717a)",
            fontSize: "0.8rem",
          }}
        >
          Keine Match-Vorschläge gefunden
        </div>
      )}
    </div>
  );
}

export default WiseTab;
