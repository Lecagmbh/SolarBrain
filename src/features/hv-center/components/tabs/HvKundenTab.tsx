/**
 * HV KUNDEN TAB
 * List of customers assigned to the Handelsvertreter
 */

import { useState, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Building,
  MapPin,
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

interface Kunde {
  id: number;
  name: string;
  kundenNummer: string | null;
  firmenName: string | null;
  email: string | null;
  telefon: string | null;
  ort: string | null;
  aktiv: boolean;
  installationsCount: number;
  rechnungenCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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
  tabActions: {
    display: "flex",
    gap: "0.75rem",
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
  filtersBar: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  searchForm: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "0 0.75rem",
    flex: 1,
    minWidth: "250px",
    color: "#71717a",
  },
  searchInput: {
    background: "transparent",
    border: "none",
    color: "#e2e8f0",
    padding: "0.625rem 0",
    flex: 1,
    fontSize: "0.875rem",
    outline: "none",
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
  td: {
    padding: "12px 16px",
    fontSize: "0.85rem",
    color: "#e2e8f0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
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
    animation: "hvKundenSpin 1s linear infinite",
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

export function HvKundenTab() {
  const navigate = useNavigate();
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchKunden = useCallback(async (page = 1, searchTerm = search) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: pagination.limit };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const res = await api.get("/hv/kunden", { params });
      setKunden(res.data.data || res.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      } else {
        setPagination((prev) => ({ ...prev, page, total: (res.data.data || res.data).length, totalPages: 1 }));
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Fehler beim Laden der Kunden");
    } finally {
      setLoading(false);
    }
  }, [search, pagination.limit]);

  useEffect(() => {
    fetchKunden(1, search);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKunden(1, search);
  };

  const handleRowClick = (id: number) => {
    navigate("/netzanmeldungen?kundeId=" + id);
  };

  return (
    <div style={styles.outerContainer}>
      <style>{`@keyframes hvKundenSpin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={styles.tabHeader}>
        <div style={styles.tabTitle}>
          <div>
            <h2 style={styles.tabTitleH2}>Kunden</h2>
            <p style={styles.tabTitleP}>
              Ihre zugewiesenen Kunden ({pagination.total})
            </p>
          </div>
        </div>
        <div style={styles.tabActions}>
          <button style={styles.btnRefresh} onClick={() => fetchKunden(pagination.page)} title="Aktualisieren">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={styles.filtersBar}>
        <form style={styles.searchForm} onSubmit={handleSearch}>
          <Search size={16} />
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Kunde suchen (Name, Nr, E-Mail)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
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
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Kunden-Nr</th>
              <th style={styles.th}>E-Mail</th>
              <th style={styles.th}>Ort</th>
              <th style={styles.th}>Anlagen</th>
              <th style={styles.th}>Rechnungen</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div style={styles.loadingCenter}>
                    <div style={styles.spinner} />
                    <span>Kunden werden geladen...</span>
                  </div>
                </td>
              </tr>
            ) : kunden.length === 0 ? (
              <tr>
                <td colSpan={7} style={styles.emptyState}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    <Users size={32} style={{ opacity: 0.4 }} />
                    <span>Keine Kunden gefunden</span>
                  </div>
                </td>
              </tr>
            ) : (
              kunden.map((k) => (
                <tr
                  key={k.id}
                  style={styles.trClickable}
                  onClick={() => handleRowClick(k.id)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <td style={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Building size={14} style={{ color: "#D4A843", flexShrink: 0 }} />
                      <span style={{ color: "#ffffff", fontWeight: 500 }}>{k.name}</span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "0.8rem" }}>
                    {k.kundenNummer || "-"}
                  </td>
                  <td style={styles.td}>{k.email || "-"}</td>
                  <td style={styles.td}>
                    {k.ort ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <MapPin size={12} style={{ color: "#71717a" }} />
                        {k.ort}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>{k.installationsCount || 0}</td>
                  <td style={{ ...styles.td, textAlign: "center" }}>{k.rechnungenCount}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        color: k.aktiv ? "#10b981" : "#71717a",
                        background: k.aktiv
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(113, 113, 122, 0.15)",
                      }}
                    >
                      {k.aktiv ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div style={styles.paginationBar}>
            <span>
              Seite {pagination.page} von {pagination.totalPages} ({pagination.total} Kunden)
            </span>
            <div style={styles.paginationBtns}>
              <button
                style={{
                  ...styles.paginationBtn,
                  ...(pagination.page <= 1 ? styles.paginationBtnDisabled : {}),
                }}
                disabled={pagination.page <= 1}
                onClick={() => fetchKunden(pagination.page - 1)}
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
                onClick={() => fetchKunden(pagination.page + 1)}
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

export default HvKundenTab;
