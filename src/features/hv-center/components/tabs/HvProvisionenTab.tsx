/**
 * HV PROVISIONEN TAB
 * Provisionen list with status filters, summary cards, and pagination
 */

import { useState, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import {
  Coins,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Banknote,
  Filter,
} from "lucide-react";
import { api } from "../../../../modules/api/client";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

/* ── Types ── */

interface Provision {
  id: number;
  rechnungNr: string;
  kundeName: string;
  nettoBetrag: number;
  provisionsSatz: number;
  betrag: number;
  status: string;
  createdAt: string;
}

interface ProvisionStats {
  OFFEN: { count: number; betrag: number };
  FREIGEGEBEN: { count: number; betrag: number };
  AUSGEZAHLT: { count: number; betrag: number };
  STORNIERT: { count: number; betrag: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ── Constants ── */

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  OFFEN: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
  FREIGEGEBEN: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
  AUSGEZAHLT: { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
  STORNIERT: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
};

const STATUS_FILTERS = ["Alle", "OFFEN", "FREIGEGEBEN", "AUSGEZAHLT", "STORNIERT"];

const formatEur = (v: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v);

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("de-DE") : "-";

/* ── Styles ── */

const styles: Record<string, CSSProperties> = {
  outerContainer: {
    padding: "24px",
    maxWidth: "1600px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  tabHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabTitle: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    color: "#ffffff",
  },
  tabTitleH2: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  tabTitleP: {
    margin: 0,
    fontSize: "0.875rem",
    color: "#71717a",
  },
  btnRefresh: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#a1a1aa",
    padding: "0.625rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
  },
  summaryCard: {
    background: "var(--dash-card-bg, rgba(255, 255, 255, 0.03))",
    border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  },
  summaryLabel: {
    margin: 0,
    fontSize: "0.8rem",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  summaryValue: {
    margin: 0,
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "#ffffff",
  },
  summaryCount: {
    margin: 0,
    fontSize: "0.75rem",
    color: "#71717a",
  },
  filterBar: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    alignItems: "center",
  },
  filterLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    color: "#71717a",
    fontSize: "0.8rem",
    marginRight: "0.25rem",
  },
  filterBtn: {
    padding: "0.375rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(255, 255, 255, 0.03)",
    color: "#a1a1aa",
  },
  filterBtnActive: {
    background: "rgba(212, 168, 67, 0.15)",
    border: "1px solid rgba(212, 168, 67, 0.3)",
    color: "#D4A843",
    fontWeight: 600,
  },
  tableContainer: {
    background: "var(--dash-card-bg, rgba(255, 255, 255, 0.03))",
    border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  },
  dataTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "10px 16px",
    textAlign: "left",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  thRight: {
    padding: "10px 16px",
    textAlign: "right",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  td: {
    padding: "12px 16px",
    fontSize: "0.85rem",
    color: "#e2e8f0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  },
  tdRight: {
    padding: "12px 16px",
    fontSize: "0.85rem",
    color: "#e2e8f0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
    textAlign: "right",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.25rem 0.625rem",
    borderRadius: "6px",
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  loadingCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "3rem",
    color: "#71717a",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(212, 168, 67, 0.3)",
    borderTopColor: "#D4A843",
    borderRadius: "50%",
    animation: "hvProvSpin 1s linear infinite",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    color: "#fca5a5",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    color: "#71717a",
  },
  paginationBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#71717a",
    fontSize: "0.8rem",
  },
  paginationBtns: {
    display: "flex",
    gap: "0.5rem",
  },
  paginationBtn: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#a1a1aa",
    padding: "0.375rem 0.625rem",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    fontSize: "0.8rem",
  },
  paginationBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
};

/* ── Component ── */

export function HvProvisionenTab() {
  const [provisionen, setProvisionen] = useState<Provision[]>([]);
  const [stats, setStats] = useState<ProvisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string>("Alle");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/hv/provisionen/stats");
      setStats(res.data);
    } catch {
      // Stats are secondary, don't block
    }
  }, []);

  const fetchProvisionen = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = { page, limit: pagination.limit };
        if (activeStatus !== "Alle") params.status = activeStatus;
        const res = await api.get("/hv/provisionen", { params });
        setProvisionen(res.data.data || res.data);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        } else {
          setPagination((prev) => ({
            ...prev,
            page,
            total: (res.data.data || res.data).length,
            totalPages: 1,
          }));
        }
      } catch (err: any) {
        setError(err?.response?.data?.error || "Fehler beim Laden der Provisionen");
      } finally {
        setLoading(false);
      }
    },
    [activeStatus, pagination.limit]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchProvisionen(1);
  }, [activeStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    fetchStats();
    fetchProvisionen(pagination.page);
  };

  const summaryCards = [
    {
      label: "Offen",
      icon: Clock,
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.15)",
      data: stats?.OFFEN || { count: 0, betrag: 0 },
    },
    {
      label: "Freigegeben",
      icon: CheckCircle,
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.15)",
      data: stats?.FREIGEGEBEN || { count: 0, betrag: 0 },
    },
    {
      label: "Ausgezahlt",
      icon: Banknote,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.15)",
      data: stats?.AUSGEZAHLT || { count: 0, betrag: 0 },
    },
  ];

  return (
    <div style={styles.outerContainer}>
      <style>{`@keyframes hvProvSpin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={styles.tabHeader}>
        <div style={styles.tabTitle}>
          <div>
            <h2 style={styles.tabTitleH2}>Provisionen</h2>
            <p style={styles.tabTitleP}>
              Uebersicht aller Provisionsansprueche
            </p>
          </div>
        </div>
        <button style={styles.btnRefresh} onClick={handleRefresh} title="Aktualisieren">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBanner}>
          <AlertTriangle size={16} />
          <span>{safeString(error)}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} style={styles.summaryCard}>
              <p style={{ ...styles.summaryLabel, color: card.color }}>
                <Icon size={16} />
                {card.label}
              </p>
              <p style={styles.summaryValue}>{formatEur(card.data.betrag)}</p>
              <p style={styles.summaryCount}>{card.data.count} Provisionen</p>
            </div>
          );
        })}
      </div>

      {/* Status Filter */}
      <div style={styles.filterBar}>
        <span style={styles.filterLabel}>
          <Filter size={14} />
          Status:
        </span>
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf}
            style={{
              ...styles.filterBtn,
              ...(activeStatus === sf ? styles.filterBtnActive : {}),
            }}
            onClick={() => setActiveStatus(sf)}
          >
            {sf === "Alle" ? "Alle" : sf}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <table style={styles.dataTable}>
          <thead>
            <tr>
              <th style={styles.th}>Rechnung</th>
              <th style={styles.th}>Kunde</th>
              <th style={styles.thRight}>Netto</th>
              <th style={styles.thRight}>Satz %</th>
              <th style={styles.thRight}>Provision</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Datum</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div style={styles.loadingCenter}>
                    <div style={styles.spinner} />
                    <span>Provisionen werden geladen...</span>
                  </div>
                </td>
              </tr>
            ) : provisionen.length === 0 ? (
              <tr>
                <td colSpan={7} style={styles.emptyState}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    <Coins size={32} style={{ opacity: 0.4 }} />
                    <span>Keine Provisionen gefunden</span>
                  </div>
                </td>
              </tr>
            ) : (
              provisionen.map((p) => {
                const sc = STATUS_COLORS[p.status] || {
                  color: "#71717a",
                  bg: "rgba(113,113,122,0.15)",
                };
                return (
                  <tr key={p.id}>
                    <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {p.rechnungNr}
                    </td>
                    <td style={styles.td}>{p.kundeName}</td>
                    <td style={{ ...styles.tdRight, color: "#a1a1aa" }}>
                      {formatEur(p.nettoBetrag)}
                    </td>
                    <td style={{ ...styles.tdRight, color: "#a1a1aa" }}>
                      {p.provisionsSatz.toFixed(2)}%
                    </td>
                    <td style={{ ...styles.tdRight, fontWeight: 600, color: "#ffffff" }}>
                      {formatEur(p.betrag)}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          color: sc.color,
                          background: sc.bg,
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(p.createdAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div style={styles.paginationBar}>
            <span>
              Seite {pagination.page} von {pagination.totalPages} ({pagination.total} Provisionen)
            </span>
            <div style={styles.paginationBtns}>
              <button
                style={{
                  ...styles.paginationBtn,
                  ...(pagination.page <= 1 ? styles.paginationBtnDisabled : {}),
                }}
                disabled={pagination.page <= 1}
                onClick={() => fetchProvisionen(pagination.page - 1)}
              >
                <ChevronLeft size={14} />
                Zurueck
              </button>
              <button
                style={{
                  ...styles.paginationBtn,
                  ...(pagination.page >= pagination.totalPages ? styles.paginationBtnDisabled : {}),
                }}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchProvisionen(pagination.page + 1)}
              >
                Weiter
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HvProvisionenTab;
