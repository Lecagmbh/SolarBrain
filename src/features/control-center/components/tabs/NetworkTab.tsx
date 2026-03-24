/**
 * NETWORK TAB
 * Grid operator (Netzbetreiber) management
 */

import { useState, useEffect, useCallback } from "react";
import {
  Network,
  RefreshCw,
  Search,
  Edit2,
  ExternalLink,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  X,
  Check,
  Building,
  Globe,
  Timer,
  BarChart3,
} from "lucide-react";
import { api } from "../../../../modules/api/client";

interface Netzbetreiber {
  id: number;
  kurzname: string;
  name: string;
  email?: string;
  portalUrl?: string;
  telefon?: string;
  aktiv: boolean;
  avgResponseDays?: number;
  approvalRate?: number;
  totalInstallations?: number;
  pendingInstallations?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ── inline style objects ────────────────────────────────────────── */

const s = {
  outerContainer: {
    padding: "24px",
    maxWidth: "1600px",
    margin: "0 auto",
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: "24px",
  },
  tabHeader: {
    display: "flex" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  tabTitle: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "1rem",
    color: "#e2e8f0",
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
    cursor: "pointer" as const,
  },
  statsGrid: {
    display: "grid" as const,
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "1rem",
  },
  statCard: {
    background: "var(--dash-card-bg, rgba(255, 255, 255, 0.03))",
    border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
    borderRadius: "12px",
    padding: "1rem",
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    gap: "0.5rem",
  },
  statCardWarning: {
    background: "rgba(245, 158, 11, 0.05)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    borderRadius: "12px",
    padding: "1rem",
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    gap: "0.5rem",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#e2e8f0",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#71717a",
    textAlign: "center" as const,
  },
  filtersBar: {
    display: "flex" as const,
    gap: "12px",
    alignItems: "center" as const,
    flexWrap: "wrap" as const,
  },
  searchForm: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.5rem",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "0 0.75rem",
    flex: 1,
    minWidth: "250px",
  },
  searchInput: {
    background: "transparent",
    border: "none",
    color: "#e2e8f0",
    padding: "0.625rem 0",
    flex: 1,
    fontSize: "0.85rem",
    outline: "none",
  },
  searchIcon: {
    color: "#71717a",
  },
  filterButtons: {
    display: "flex" as const,
    gap: "0.25rem",
    background: "rgba(255, 255, 255, 0.02)",
    padding: "0.25rem",
    borderRadius: "8px",
  },
  filterBtn: {
    padding: "0.5rem 0.875rem",
    background: "transparent",
    border: "none" as const,
    color: "#71717a",
    fontSize: "0.8rem",
    borderRadius: "6px",
    cursor: "pointer" as const,
  },
  filterBtnActive: {
    padding: "0.5rem 0.875rem",
    background: "rgba(212, 168, 67, 0.15)",
    border: "none" as const,
    color: "#a5b4fc",
    fontSize: "0.8rem",
    borderRadius: "6px",
    cursor: "pointer" as const,
  },
  filterBtnWarningActive: {
    padding: "0.5rem 0.875rem",
    background: "rgba(245, 158, 11, 0.2)",
    border: "none" as const,
    color: "#fbbf24",
    fontSize: "0.8rem",
    borderRadius: "6px",
    cursor: "pointer" as const,
  },
  tableContainer: {
    background: "var(--dash-card-bg, rgba(255, 255, 255, 0.03))",
    border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
    borderRadius: "var(--dash-radius, 16px)",
    overflow: "hidden" as const,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  },
  dataTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  th: {
    padding: "10px 16px",
    textAlign: "left" as const,
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#71717a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  td: {
    padding: "12px 16px",
    fontSize: "0.85rem",
    color: "#e2e8f0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  },
  loadingCell: {
    textAlign: "center" as const,
    padding: "3rem",
    color: "#71717a",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: "0.75rem",
  },
  emptyCell: {
    textAlign: "center" as const,
    padding: "3rem",
    color: "#71717a",
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    gap: "0.5rem",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(212, 168, 67, 0.3)",
    borderTopColor: "#D4A843",
    borderRadius: "50%",
    animation: "net-spin 1s linear infinite",
  },
  nbName: {
    display: "flex" as const,
    flexDirection: "column" as const,
  },
  kurzname: {
    fontWeight: 600,
    color: "#e2e8f0",
  },
  fullname: {
    fontSize: "0.75rem",
    color: "#71717a",
  },
  emailLink: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.35rem",
    color: "#a5b4fc",
    textDecoration: "none",
    fontSize: "0.8rem",
  },
  noEmail: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.35rem",
    color: "#f59e0b",
    fontSize: "0.8rem",
  },
  portalLink: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.35rem",
    color: "#a1a1aa",
    textDecoration: "none",
    fontSize: "0.8rem",
  },
  installationsCell: {
    display: "flex" as const,
    gap: "0.35rem",
  },
  pending: {
    color: "#71717a",
    fontSize: "0.75rem",
  },
  responseCell: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.35rem",
  },
  rateCell: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.35rem",
  },
  actionBtn: {
    background: "transparent",
    border: "none" as const,
    color: "#71717a",
    padding: "0.375rem",
    borderRadius: "6px",
    cursor: "pointer" as const,
  },
  pagination: {
    display: "flex" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: "1rem",
    padding: "1.5rem",
    color: "#71717a",
    fontSize: "0.875rem",
  },
  paginationBtn: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#a1a1aa",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer" as const,
  },
  paginationBtnDisabled: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#a1a1aa",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "not-allowed" as const,
    opacity: 0.5,
  },
  /* Modal styles */
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    zIndex: 1000,
  },
  modal: {
    background: "#18181b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "480px",
    margin: "1rem",
  },
  modalHeader: {
    display: "flex" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },
  modalHeaderH3: {
    margin: 0,
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#e2e8f0",
  },
  modalClose: {
    background: "transparent",
    border: "none" as const,
    color: "#71717a",
    cursor: "pointer" as const,
    padding: 0,
  },
  modalBody: {
    padding: "1.5rem",
  },
  formGroup: {
    marginBottom: "1.25rem",
  },
  formLabel: {
    display: "block" as const,
    fontSize: "0.875rem",
    color: "#a1a1aa",
    marginBottom: "0.5rem",
  },
  formInput: {
    width: "100%",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.625rem 0.875rem",
    fontSize: "0.85rem",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  formInputDisabled: {
    width: "100%",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.625rem 0.875rem",
    fontSize: "0.85rem",
    outline: "none",
    boxSizing: "border-box" as const,
    opacity: 0.6,
    cursor: "not-allowed" as const,
  },
  modalFooter: {
    display: "flex" as const,
    justifyContent: "flex-end" as const,
    gap: "0.75rem",
    padding: "1rem 1.5rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
  },
  btnSecondary: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#a1a1aa",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    cursor: "pointer" as const,
  },
  btnPrimary: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.5rem",
    background: "linear-gradient(135deg, #D4A843, #EAD068)",
    border: "none" as const,
    color: "#fff",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer" as const,
  },
} as const;

export function NetworkTab() {
  const [netzbetreiber, setNetzbetreiber] = useState<Netzbetreiber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });

  // Filters
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "noEmail">("all");

  // Edit modal
  const [editingNb, setEditingNb] = useState<Netzbetreiber | null>(null);
  const [editForm, setEditForm] = useState({ email: "", portalUrl: "", telefon: "" });

  // Hover states
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredActionBtn, setHoveredActionBtn] = useState<number | null>(null);
  const [hoveredPortalLink, setHoveredPortalLink] = useState<number | null>(null);
  const [hoveredFilterBtn, setHoveredFilterBtn] = useState<string | null>(null);

  // Inject keyframes once
  useEffect(() => {
    const id = "net-tab-keyframes";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `@keyframes net-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`;
      document.head.appendChild(style);
    }
  }, []);

  const fetchNetzbetreiber = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {
        page: String(pagination.page),
        limit: String(pagination.limit),
      };
      if (search) params.search = search;

      const response = await api.get("/netzbetreiber", { params });
      let data = response.data.data || response.data || [];

      // Apply frontend filter
      if (filter === "active") {
        data = data.filter((nb: Netzbetreiber) => nb.aktiv);
      } else if (filter === "noEmail") {
        data = data.filter((nb: Netzbetreiber) => !nb.email);
      }

      setNetzbetreiber(data);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || data.length,
        totalPages: response.data.totalPages || 1,
      }));
    } catch (err: any) {
      console.error("[NetworkTab] Fetch error:", err);
      setError(err.response?.data?.error || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, filter]);

  useEffect(() => {
    fetchNetzbetreiber();
  }, [fetchNetzbetreiber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
  };

  const openEditModal = (nb: Netzbetreiber) => {
    setEditForm({
      email: nb.email || "",
      portalUrl: nb.portalUrl || "",
      telefon: nb.telefon || "",
    });
    setEditingNb(nb);
  };

  const handleSaveEdit = async () => {
    if (!editingNb) return;
    try {
      await api.patch(`/netzbetreiber/${editingNb.id}`, editForm);
      setEditingNb(null);
      fetchNetzbetreiber();
    } catch (err: any) {
      alert(err.response?.data?.error || "Fehler beim Speichern");
    }
  };

  const stats = {
    total: netzbetreiber.length,
    active: netzbetreiber.filter(nb => nb.aktiv).length,
    noEmail: netzbetreiber.filter(nb => !nb.email).length,
    avgResponse: netzbetreiber.reduce((sum, nb) => sum + (nb.avgResponseDays || 0), 0) / netzbetreiber.length || 0,
  };

  const getFilterBtnStyle = (key: string, isWarning: boolean) => {
    if (filter === key) {
      return isWarning ? s.filterBtnWarningActive : s.filterBtnActive;
    }
    if (hoveredFilterBtn === key) {
      return { ...s.filterBtn, background: "rgba(255, 255, 255, 0.05)", color: "#a1a1aa" };
    }
    return s.filterBtn;
  };

  return (
    <div style={s.outerContainer}>
      {/* Header */}
      <div style={s.tabHeader}>
        <div style={s.tabTitle}>
          <Network size={24} />
          <div>
            <h2 style={s.tabTitleH2}>Netzbetreiber</h2>
            <p style={s.tabTitleP}>{pagination.total} Netzbetreiber</p>
          </div>
        </div>
        <div>
          <button style={s.btnRefresh} onClick={fetchNetzbetreiber} disabled={loading}>
            <RefreshCw size={16} style={loading ? { animation: "net-spin 1s linear infinite" } : undefined} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <Building size={20} style={{ color: "#a1a1aa" }} />
          <span style={s.statValue}>{stats.total}</span>
          <span style={s.statLabel}>Gesamt</span>
        </div>
        <div style={s.statCard}>
          <CheckCircle size={20} style={{ color: "#10b981" }} />
          <span style={s.statValue}>{stats.active}</span>
          <span style={s.statLabel}>Aktiv</span>
        </div>
        <div style={s.statCardWarning}>
          <AlertTriangle size={20} style={{ color: "#f59e0b" }} />
          <span style={s.statValue}>{stats.noEmail}</span>
          <span style={s.statLabel}>Ohne Email</span>
        </div>
        <div style={s.statCard}>
          <Timer size={20} style={{ color: "#3b82f6" }} />
          <span style={s.statValue}>{stats.avgResponse.toFixed(1)}</span>
          <span style={s.statLabel}>Ø Antwortzeit (Tage)</span>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filtersBar}>
        <form onSubmit={handleSearch} style={s.searchForm}>
          <Search size={16} style={s.searchIcon} />
          <input
            type="text"
            placeholder="Netzbetreiber suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
          />
        </form>
        <div style={s.filterButtons}>
          <button
            style={getFilterBtnStyle("all", false)}
            onMouseEnter={() => setHoveredFilterBtn("all")}
            onMouseLeave={() => setHoveredFilterBtn(null)}
            onClick={() => { setFilter("all"); setPagination(p => ({ ...p, page: 1 })); }}
          >
            Alle
          </button>
          <button
            style={getFilterBtnStyle("active", false)}
            onMouseEnter={() => setHoveredFilterBtn("active")}
            onMouseLeave={() => setHoveredFilterBtn(null)}
            onClick={() => { setFilter("active"); setPagination(p => ({ ...p, page: 1 })); }}
          >
            Aktiv
          </button>
          <button
            style={getFilterBtnStyle("noEmail", true)}
            onMouseEnter={() => setHoveredFilterBtn("noEmail")}
            onMouseLeave={() => setHoveredFilterBtn(null)}
            onClick={() => { setFilter("noEmail"); setPagination(p => ({ ...p, page: 1 })); }}
          >
            Ohne Email
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={s.tableContainer}>
        <table style={s.dataTable}>
          <thead>
            <tr>
              <th style={s.th}>Netzbetreiber</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Portal</th>
              <th style={s.th}>Anlagen</th>
              <th style={s.th}>Ø Antwort</th>
              <th style={s.th}>Genehmigung</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {loading && netzbetreiber.length === 0 ? (
              <tr>
                <td colSpan={7} style={s.loadingCell}>
                  <div style={s.spinner} />
                  Lade Netzbetreiber...
                </td>
              </tr>
            ) : netzbetreiber.length === 0 ? (
              <tr>
                <td colSpan={7} style={s.emptyCell}>
                  <Network size={32} />
                  Keine Netzbetreiber gefunden
                </td>
              </tr>
            ) : (
              netzbetreiber.map((nb) => {
                const isHovered = hoveredRow === nb.id;
                return (
                  <tr
                    key={nb.id}
                    style={isHovered ? { background: "rgba(255, 255, 255, 0.02)" } : undefined}
                    onMouseEnter={() => setHoveredRow(nb.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={s.td}>
                      <div style={s.nbName}>
                        <span style={s.kurzname}>{nb.kurzname}</span>
                        <span style={s.fullname}>{nb.name}</span>
                      </div>
                    </td>
                    <td style={s.td}>
                      {nb.email ? (
                        <a href={`mailto:${nb.email}`} style={s.emailLink}>
                          <Mail size={14} />
                          {nb.email}
                        </a>
                      ) : (
                        <span style={s.noEmail}>
                          <AlertTriangle size={14} />
                          Keine Email
                        </span>
                      )}
                    </td>
                    <td style={s.td}>
                      {nb.portalUrl ? (
                        <a
                          href={nb.portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            ...s.portalLink,
                            ...(hoveredPortalLink === nb.id ? { color: "#a5b4fc" } : {}),
                          }}
                          onMouseEnter={() => setHoveredPortalLink(nb.id)}
                          onMouseLeave={() => setHoveredPortalLink(null)}
                        >
                          <Globe size={14} />
                          Portal
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={s.td}>
                      <div style={s.installationsCell}>
                        <span>{nb.totalInstallations || 0}</span>
                        {(nb.pendingInstallations || 0) > 0 && (
                          <span style={s.pending}>({nb.pendingInstallations} offen)</span>
                        )}
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={s.responseCell}>
                        {nb.avgResponseDays !== undefined ? (
                          <>
                            <Clock size={14} />
                            {nb.avgResponseDays.toFixed(1)} Tage
                          </>
                        ) : "-"}
                      </div>
                    </td>
                    <td style={s.td}>
                      {nb.approvalRate !== undefined ? (
                        <div style={s.rateCell}>
                          {nb.approvalRate >= 0.8 ? (
                            <TrendingUp size={14} style={{ color: "#10b981" }} />
                          ) : nb.approvalRate >= 0.6 ? (
                            <BarChart3 size={14} style={{ color: "#f59e0b" }} />
                          ) : (
                            <TrendingDown size={14} style={{ color: "#ef4444" }} />
                          )}
                          {(nb.approvalRate * 100).toFixed(0)}%
                        </div>
                      ) : "-"}
                    </td>
                    <td style={s.td}>
                      <button
                        style={{
                          ...s.actionBtn,
                          ...(hoveredActionBtn === nb.id ? { background: "rgba(255, 255, 255, 0.05)", color: "#a5b4fc" } : {}),
                        }}
                        onMouseEnter={() => setHoveredActionBtn(nb.id)}
                        onMouseLeave={() => setHoveredActionBtn(null)}
                        onClick={() => openEditModal(nb)}
                        title="Bearbeiten"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={s.pagination}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            style={pagination.page <= 1 ? s.paginationBtnDisabled : s.paginationBtn}
          >
            Zurück
          </button>
          <span>
            Seite {pagination.page} von {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            style={pagination.page >= pagination.totalPages ? s.paginationBtnDisabled : s.paginationBtn}
          >
            Weiter
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingNb && (
        <div style={s.modalOverlay} onClick={() => setEditingNb(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalHeaderH3}>Netzbetreiber bearbeiten</h3>
              <button style={s.modalClose} onClick={() => setEditingNb(null)}>
                <X size={20} />
              </button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Netzbetreiber</label>
                <input type="text" value={editingNb.kurzname} disabled style={s.formInputDisabled} />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Email-Adresse</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="netzanschluss@netzbetreiber.de"
                  style={s.formInput}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Portal-URL</label>
                <input
                  type="url"
                  value={editForm.portalUrl}
                  onChange={(e) => setEditForm({ ...editForm, portalUrl: e.target.value })}
                  placeholder="https://portal.netzbetreiber.de"
                  style={s.formInput}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Telefon</label>
                <input
                  type="tel"
                  value={editForm.telefon}
                  onChange={(e) => setEditForm({ ...editForm, telefon: e.target.value })}
                  placeholder="+49 123 456789"
                  style={s.formInput}
                />
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={() => setEditingNb(null)}>
                Abbrechen
              </button>
              <button style={s.btnPrimary} onClick={handleSaveEdit}>
                <Check size={16} />
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NetworkTab;
