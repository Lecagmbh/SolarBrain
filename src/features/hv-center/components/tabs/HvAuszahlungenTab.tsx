/**
 * HV AUSZAHLUNGEN TAB
 * Payout list with expandable rows showing included provisionen
 */

import { useState, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import {
  Banknote,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Receipt,
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

interface AuszahlungProvision {
  id: number;
  rechnungNr: string;
  kundeName: string;
  betrag: number;
  status: string;
}

interface Auszahlung {
  id: number;
  auszahlungsNr: string;
  betrag: number;
  anzahlProvisionen: number;
  status: string;
  createdAt: string;
}

interface AuszahlungDetail extends Auszahlung {
  provisionen: AuszahlungProvision[];
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
  ANGEWIESEN: { color: "#EAD068", bg: "rgba(139, 92, 246, 0.15)" },
};

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
  trClickable: {
    cursor: "pointer",
    transition: "background 0.15s",
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
  expandedRow: {
    background: "rgba(212, 168, 67, 0.03)",
  },
  expandedCell: {
    padding: "16px 24px 20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  nestedTableWrap: {
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    overflow: "hidden",
  },
  nestedTitle: {
    padding: "10px 16px",
    margin: 0,
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#a1a1aa",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  nestedTh: {
    padding: "8px 14px",
    textAlign: "left",
    fontSize: "0.65rem",
    fontWeight: 600,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
  },
  nestedTd: {
    padding: "8px 14px",
    fontSize: "0.8rem",
    color: "#a1a1aa",
    borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
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
    animation: "hvAuszSpin 1s linear infinite",
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

export function HvAuszahlungenTab() {
  const [auszahlungen, setAuszahlungen] = useState<Auszahlung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<AuszahlungDetail | null>(null);
  const [expandLoading, setExpandLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchAuszahlungen = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/hv/auszahlungen", { params: { page, limit: pagination.limit } });
      setAuszahlungen(res.data.data || res.data);
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
      setError(err?.response?.data?.error || "Fehler beim Laden der Auszahlungen");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchAuszahlungen(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }

    setExpandedId(id);
    setExpandedData(null);
    setExpandLoading(true);

    try {
      const res = await api.get(`/hv/auszahlungen/${id}`);
      setExpandedData(res.data);
    } catch {
      // If detail fetch fails, just show expanded without details
      setExpandedData(null);
    } finally {
      setExpandLoading(false);
    }
  };

  return (
    <div style={styles.outerContainer}>
      <style>{`@keyframes hvAuszSpin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={styles.tabHeader}>
        <div style={styles.tabTitle}>
          <div>
            <h2 style={styles.tabTitleH2}>Auszahlungen</h2>
            <p style={styles.tabTitleP}>
              Uebersicht Ihrer Provisionsauszahlungen
            </p>
          </div>
        </div>
        <button
          style={styles.btnRefresh}
          onClick={() => fetchAuszahlungen(pagination.page)}
          title="Aktualisieren"
        >
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

      {/* Table */}
      <div style={styles.tableContainer}>
        <table style={styles.dataTable}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: "32px" }}></th>
              <th style={styles.th}>Auszahlungs-Nr</th>
              <th style={styles.thRight}>Betrag</th>
              <th style={styles.thRight}>Anz. Provisionen</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Datum</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div style={styles.loadingCenter}>
                    <div style={styles.spinner} />
                    <span>Auszahlungen werden geladen...</span>
                  </div>
                </td>
              </tr>
            ) : auszahlungen.length === 0 ? (
              <tr>
                <td colSpan={6} style={styles.emptyState}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    <Banknote size={32} style={{ opacity: 0.4 }} />
                    <span>Keine Auszahlungen vorhanden</span>
                  </div>
                </td>
              </tr>
            ) : (
              auszahlungen.map((a) => {
                const sc = STATUS_COLORS[a.status] || {
                  color: "#71717a",
                  bg: "rgba(113,113,122,0.15)",
                };
                const isExpanded = expandedId === a.id;

                return (
                  <>
                    <tr
                      key={a.id}
                      style={styles.trClickable}
                      onClick={() => handleToggleExpand(a.id)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = isExpanded
                          ? "rgba(212, 168, 67, 0.03)"
                          : "transparent";
                      }}
                    >
                      <td style={{ ...styles.td, width: "32px", color: "#71717a" }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                      <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 500 }}>
                        {a.auszahlungsNr}
                      </td>
                      <td style={{ ...styles.tdRight, fontWeight: 700, color: "#ffffff" }}>
                        {formatEur(a.betrag)}
                      </td>
                      <td style={{ ...styles.tdRight, color: "#a1a1aa" }}>
                        {a.anzahlProvisionen}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            color: sc.color,
                            background: sc.bg,
                          }}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td style={styles.td}>{formatDate(a.createdAt)}</td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr key={`${a.id}-detail`} style={styles.expandedRow}>
                        <td colSpan={6} style={styles.expandedCell}>
                          {expandLoading ? (
                            <div style={{ ...styles.loadingCenter, padding: "1.5rem" }}>
                              <div style={styles.spinner} />
                              <span>Details werden geladen...</span>
                            </div>
                          ) : expandedData?.provisionen && expandedData.provisionen.length > 0 ? (
                            <div style={styles.nestedTableWrap}>
                              <p style={styles.nestedTitle}>
                                <Receipt size={14} />
                                Enthaltene Provisionen ({expandedData.provisionen.length})
                              </p>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr>
                                    <th style={styles.nestedTh}>Rechnung</th>
                                    <th style={styles.nestedTh}>Kunde</th>
                                    <th style={{ ...styles.nestedTh, textAlign: "right" }}>Betrag</th>
                                    <th style={styles.nestedTh}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {expandedData.provisionen.map((p) => {
                                    const psc = STATUS_COLORS[p.status] || {
                                      color: "#71717a",
                                      bg: "rgba(113,113,122,0.15)",
                                    };
                                    return (
                                      <tr key={p.id}>
                                        <td style={{ ...styles.nestedTd, fontFamily: "monospace", fontSize: "0.75rem" }}>
                                          {p.rechnungNr}
                                        </td>
                                        <td style={styles.nestedTd}>{p.kundeName}</td>
                                        <td style={{ ...styles.nestedTd, textAlign: "right", fontWeight: 600, color: "#e2e8f0" }}>
                                          {formatEur(p.betrag)}
                                        </td>
                                        <td style={styles.nestedTd}>
                                          <span
                                            style={{
                                              ...styles.statusBadge,
                                              color: psc.color,
                                              background: psc.bg,
                                              fontSize: "0.65rem",
                                            }}
                                          >
                                            {p.status}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div style={{ textAlign: "center", padding: "1rem", color: "#71717a", fontSize: "0.8rem" }}>
                              Keine Detail-Daten verfuegbar
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div style={styles.paginationBar}>
            <span>
              Seite {pagination.page} von {pagination.totalPages} ({pagination.total} Auszahlungen)
            </span>
            <div style={styles.paginationBtns}>
              <button
                style={{
                  ...styles.paginationBtn,
                  ...(pagination.page <= 1 ? styles.paginationBtnDisabled : {}),
                }}
                disabled={pagination.page <= 1}
                onClick={() => fetchAuszahlungen(pagination.page - 1)}
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
                onClick={() => fetchAuszahlungen(pagination.page + 1)}
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

export default HvAuszahlungenTab;
