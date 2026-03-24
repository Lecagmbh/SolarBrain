/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * JOURNAL TAB
 * Buchungsjournal anzeigen
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  Filter,
  ChevronDown,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import * as accountingApi from "../../../../api/accounting";

export function JournalTab() {
  const [entries, setEntries] = useState<accountingApi.JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadEntries();
  }, [dateRange]);

  async function loadEntries() {
    try {
      setLoading(true);
      const data = await accountingApi.getJournalEntries({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 200,
      });
      setEntries(data.entries);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load journal:", err);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatCurrency = (amount: number, currency = "EUR") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

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
            Buchungsjournal
          </h2>
          <p style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem", margin: 0 }}>
            {total} Buchungen im Zeitraum
          </p>
        </div>

        {/* Date Range Filter */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Calendar size={16} color="var(--dash-text-subtle, #71717a)" />
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange((d) => ({ ...d, startDate: e.target.value }))}
            style={{
              padding: "0.5rem 0.75rem",
              background: "var(--dash-card-bg, #111113)",
              border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "6px",
              color: "var(--dash-text, #fafafa)",
              fontSize: "0.8rem",
            }}
          />
          <span style={{ color: "var(--dash-text-subtle, #71717a)" }}>-</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange((d) => ({ ...d, endDate: e.target.value }))}
            style={{
              padding: "0.5rem 0.75rem",
              background: "var(--dash-card-bg, #111113)",
              border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "6px",
              color: "var(--dash-text, #fafafa)",
              fontSize: "0.8rem",
            }}
          />
        </div>
      </div>

      {/* Journal List */}
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
        ) : entries.length === 0 ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "var(--dash-text-subtle, #71717a)",
            }}
          >
            <BookOpen size={40} style={{ marginBottom: "0.75rem", opacity: 0.5 }} />
            <p style={{ margin: 0 }}>Keine Buchungen im gewählten Zeitraum</p>
          </div>
        ) : (
          <div>
            {entries.map((entry) => {
              const isExpanded = expandedIds.has(entry.id);
              const lines = entry.lines || [];
              const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
              const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);

              return (
                <div
                  key={entry.id}
                  style={{
                    borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))",
                  }}
                >
                  {/* Entry Header */}
                  <div
                    onClick={() => toggleExpand(entry.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "1rem 1.25rem",
                      cursor: "pointer",
                      gap: "0.75rem",
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} color="var(--dash-text-subtle, #71717a)" />
                    ) : (
                      <ChevronRight size={16} color="var(--dash-text-subtle, #71717a)" />
                    )}

                    <div
                      style={{
                        width: "80px",
                        color: "var(--dash-text, #fafafa)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {formatDate(entry.date)}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          color: "var(--dash-text, #fafafa)",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                        }}
                      >
                        {entry.description}
                      </div>
                      {entry.reference && (
                        <div
                          style={{
                            color: "var(--dash-text-subtle, #71717a)",
                            fontSize: "0.7rem",
                          }}
                        >
                          Ref: {entry.reference}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "1.5rem",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            color: "#10b981",
                            fontSize: "0.8rem",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <ArrowUpRight size={14} />
                          {formatCurrency(totalDebit, entry.currency)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            color: "#ef4444",
                            fontSize: "0.8rem",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <ArrowDownRight size={14} />
                          {formatCurrency(totalCredit, entry.currency)}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        background: entry.isPosted
                          ? "rgba(16, 185, 129, 0.1)"
                          : "rgba(245, 158, 11, 0.1)",
                        color: entry.isPosted ? "#10b981" : "#f59e0b",
                        fontSize: "0.7rem",
                        fontWeight: 500,
                      }}
                    >
                      {entry.isPosted ? "Gebucht" : "Entwurf"}
                    </div>
                  </div>

                  {/* Entry Lines (expanded) */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: "0 1.25rem 1rem 3rem",
                        background: "rgba(0, 0, 0, 0.2)",
                      }}
                    >
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            <th
                              style={{
                                padding: "0.5rem 0.75rem",
                                textAlign: "left",
                                color: "var(--dash-text-subtle, #71717a)",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                textTransform: "uppercase",
                              }}
                            >
                              Konto
                            </th>
                            <th
                              style={{
                                padding: "0.5rem 0.75rem",
                                textAlign: "left",
                                color: "var(--dash-text-subtle, #71717a)",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                textTransform: "uppercase",
                              }}
                            >
                              Memo
                            </th>
                            <th
                              style={{
                                padding: "0.5rem 0.75rem",
                                textAlign: "right",
                                color: "var(--dash-text-subtle, #71717a)",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                textTransform: "uppercase",
                              }}
                            >
                              Soll
                            </th>
                            <th
                              style={{
                                padding: "0.5rem 0.75rem",
                                textAlign: "right",
                                color: "var(--dash-text-subtle, #71717a)",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                textTransform: "uppercase",
                              }}
                            >
                              Haben
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((line, idx) => (
                            <tr key={idx}>
                              <td
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  color: "var(--dash-text, #fafafa)",
                                  fontSize: "0.8rem",
                                }}
                              >
                                <span
                                  style={{
                                    color: "var(--dash-text-subtle, #71717a)",
                                    marginRight: "0.5rem",
                                  }}
                                >
                                  {line.account?.code}
                                </span>
                                {line.account?.name}
                              </td>
                              <td
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  color: "var(--dash-text-subtle, #71717a)",
                                  fontSize: "0.8rem",
                                }}
                              >
                                {line.memo || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  textAlign: "right",
                                  color: Number(line.debit) > 0 ? "#10b981" : "transparent",
                                  fontSize: "0.8rem",
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {Number(line.debit) > 0
                                  ? formatCurrency(Number(line.debit), entry.currency)
                                  : ""}
                              </td>
                              <td
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  textAlign: "right",
                                  color: Number(line.credit) > 0 ? "#ef4444" : "transparent",
                                  fontSize: "0.8rem",
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {Number(line.credit) > 0
                                  ? formatCurrency(Number(line.credit), entry.currency)
                                  : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default JournalTab;
