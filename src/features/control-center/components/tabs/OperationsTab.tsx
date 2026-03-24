/**
 * OPERATIONS TAB
 * Installation management with bulk actions, filters, and export
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  RefreshCw,
  Search,
  Download,
  Filter,
  Check,
  ChevronDown,
  ExternalLink,
  MoreHorizontal,
  Clock,
  Building,
  User,
  Calendar,
  CheckSquare,
  Square,
} from "lucide-react";
import { api } from "../../../../modules/api/client";

interface Installation {
  id: number;
  publicId: string;
  status: string;
  anlage?: {
    id: number;
    bezeichnung?: string;
    strasse?: string;
    hausNr?: string;
    plz?: string;
    ort?: string;
    leistungKwp?: number;
    kunde?: {
      name: string;
      firmenName?: string;
    };
  };
  netzbetreiber?: {
    id: number;
    kurzname: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  EINGANG: { label: "Eingang", color: "#EAD068", bg: "rgba(139, 92, 246, 0.15)" },
  BEIM_NB: { label: "Beim NB", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
  RUECKFRAGE: { label: "Rückfrage", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
  GENEHMIGT: { label: "Genehmigt", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
  IBN: { label: "IBN", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)" },
  FERTIG: { label: "Fertig", color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)" },
  STORNIERT: { label: "Storniert", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
};

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
  tabActions: {
    display: "flex" as const,
    gap: "12px",
    alignItems: "center" as const,
  },
  bulkActions: {
    position: "relative" as const,
  },
  btnBulk: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.5rem",
    background: "rgba(212, 168, 67, 0.15)",
    border: "1px solid rgba(212, 168, 67, 0.3)",
    color: "#a5b4fc",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    cursor: "pointer" as const,
  },
  bulkMenu: {
    position: "absolute" as const,
    top: "100%",
    right: 0,
    marginTop: "0.5rem",
    background: "#1f1f23",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
    minWidth: "160px",
    zIndex: 50,
    overflow: "hidden" as const,
  },
  bulkMenuItem: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.5rem",
    width: "100%",
    padding: "0.625rem 0.875rem",
    background: "transparent",
    border: "none" as const,
    color: "#a1a1aa",
    fontSize: "0.8rem",
    cursor: "pointer" as const,
    textAlign: "left" as const,
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block" as const,
  },
  btnSecondary: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.5rem",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#a1a1aa",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    cursor: "pointer" as const,
  },
  btnRefresh: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#a1a1aa",
    padding: "0.625rem",
    borderRadius: "8px",
    cursor: "pointer" as const,
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
  filterSelect: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "0.625rem 0.875rem",
    fontSize: "0.85rem",
    minWidth: "160px",
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
  checkboxCol: {
    width: "40px",
  },
  checkboxBtn: {
    background: "transparent",
    border: "none",
    color: "#71717a",
    padding: 0,
    cursor: "pointer" as const,
  },
  checkboxBtnSelected: {
    background: "transparent",
    border: "none",
    color: "#D4A843",
    padding: 0,
    cursor: "pointer" as const,
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
    animation: "ops-spin 1s linear infinite",
  },
  idCell: {
    fontFamily: "monospace",
    color: "#a5b4fc",
  },
  statusBadge: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    padding: "0.2rem 0.6rem",
    borderRadius: "6px",
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  customerCell: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.5rem",
  },
  addressCell: {
    color: "#71717a",
    fontSize: "0.8rem",
  },
  kwpCell: {
    fontWeight: 500,
    color: "#10b981",
  },
  dateCell: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.35rem",
    fontSize: "0.8rem",
    color: "#71717a",
  },
  actionBtn: {
    background: "transparent",
    border: "none",
    color: "#71717a",
    padding: "0.375rem",
    borderRadius: "6px",
    cursor: "pointer" as const,
  },
  trSelected: {
    background: "rgba(212, 168, 67, 0.1)",
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
} as const;

export function OperationsTab() {
  const navigate = useNavigate();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [nbFilter, setNbFilter] = useState("");
  const [netzbetreiber, setNetzbetreiber] = useState<{ id: number; kurzname: string }[]>([]);

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Hover states
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredActionBtn, setHoveredActionBtn] = useState<number | null>(null);
  const [hoveredBulkItem, setHoveredBulkItem] = useState<string | null>(null);

  // Inject keyframes once
  useEffect(() => {
    const id = "ops-tab-keyframes";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `@keyframes ops-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`;
      document.head.appendChild(style);
    }
  }, []);

  const fetchInstallations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {
        page: String(pagination.page),
        limit: String(pagination.limit),
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (nbFilter) params.netzbetreiberId = nbFilter;

      const response = await api.get("/installations", { params });
      setInstallations(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 0,
      }));
    } catch (err: any) {
      console.error("[OperationsTab] Fetch error:", err);
      setError(err.response?.data?.error || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, nbFilter]);

  const fetchNetzbetreiber = useCallback(async () => {
    try {
      const response = await api.get("/netzbetreiber", { params: { limit: 500 } });
      setNetzbetreiber(response.data.data || []);
    } catch (err) {
      console.error("[OperationsTab] NB fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchInstallations();
    fetchNetzbetreiber();
  }, [fetchInstallations, fetchNetzbetreiber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selected.size === installations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(installations.map(i => i.id)));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size} Anlagen auf "${STATUS_CONFIG[newStatus]?.label || newStatus}" setzen?`)) return;

    try {
      await Promise.all(
        Array.from(selected).map(id =>
          api.patch(`/installations/${id}`, { status: newStatus })
        )
      );
      setSelected(new Set());
      setShowBulkActions(false);
      fetchInstallations();
    } catch (err: any) {
      alert(err.response?.data?.error || "Fehler bei Bulk-Aktion");
    }
  };

  const handleExport = async () => {
    const csv = [
      ["ID", "Public ID", "Status", "Kunde", "Adresse", "Netzbetreiber", "kWp", "Erstellt"].join(","),
      ...installations.map(i => [
        i.id,
        i.publicId,
        i.status,
        `"${i.anlage?.kunde?.firmenName || i.anlage?.kunde?.name || "-"}"`,
        `"${[i.anlage?.strasse, i.anlage?.hausNr, i.anlage?.plz, i.anlage?.ort].filter(Boolean).join(" ")}"`,
        i.netzbetreiber?.kurzname || "-",
        i.anlage?.leistungKwp || "-",
        i.createdAt.split("T")[0]
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const { downloadFile } = await import("@/utils/desktopDownload");
    await downloadFile({ filename: `anlagen_${new Date().toISOString().split("T")[0]}.csv`, blob, fileType: 'csv' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <div style={s.outerContainer}>
      {/* Header */}
      <div style={s.tabHeader}>
        <div style={s.tabTitle}>
          <ClipboardList size={24} />
          <div>
            <h2 style={s.tabTitleH2}>Anlagenverwaltung</h2>
            <p style={s.tabTitleP}>{pagination.total} Anlagen</p>
          </div>
        </div>
        <div style={s.tabActions}>
          {selected.size > 0 && (
            <div style={s.bulkActions}>
              <button style={s.btnBulk} onClick={() => setShowBulkActions(!showBulkActions)}>
                <CheckSquare size={16} />
                {selected.size} ausgewählt
                <ChevronDown size={14} />
              </button>
              {showBulkActions && (
                <div style={s.bulkMenu}>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <button
                      key={status}
                      style={{
                        ...s.bulkMenuItem,
                        ...(hoveredBulkItem === status ? { background: "rgba(255, 255, 255, 0.05)", color: "#e2e8f0" } : {}),
                      }}
                      onMouseEnter={() => setHoveredBulkItem(status)}
                      onMouseLeave={() => setHoveredBulkItem(null)}
                      onClick={() => handleBulkStatusChange(status)}
                    >
                      <span style={{ ...s.statusDot, background: config.color }} />
                      {config.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button style={s.btnSecondary} onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
          <button style={s.btnRefresh} onClick={fetchInstallations} disabled={loading}>
            <RefreshCw size={16} style={loading ? { animation: "ops-spin 1s linear infinite" } : undefined} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filtersBar}>
        <form onSubmit={handleSearch} style={s.searchForm}>
          <Search size={16} style={s.searchIcon} />
          <input
            type="text"
            placeholder="ID, Kunde, Adresse suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          style={s.filterSelect}
        >
          <option value="">Alle Status</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
        <select
          value={nbFilter}
          onChange={(e) => { setNbFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          style={s.filterSelect}
        >
          <option value="">Alle Netzbetreiber</option>
          {netzbetreiber.map(nb => (
            <option key={nb.id} value={nb.id}>{nb.kurzname}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={s.tableContainer}>
        <table style={s.dataTable}>
          <thead>
            <tr>
              <th style={{ ...s.th, ...s.checkboxCol }}>
                <button style={s.checkboxBtn} onClick={selectAll}>
                  {selected.size === installations.length && installations.length > 0 ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th style={s.th}>ID</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Kunde</th>
              <th style={s.th}>Adresse</th>
              <th style={s.th}>Netzbetreiber</th>
              <th style={s.th}>kWp</th>
              <th style={s.th}>Erstellt</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {loading && installations.length === 0 ? (
              <tr>
                <td colSpan={9} style={s.loadingCell}>
                  <div style={s.spinner} />
                  Lade Anlagen...
                </td>
              </tr>
            ) : installations.length === 0 ? (
              <tr>
                <td colSpan={9} style={s.emptyCell}>
                  <ClipboardList size={32} />
                  Keine Anlagen gefunden
                </td>
              </tr>
            ) : (
              installations.map((inst) => {
                const statusConfig = STATUS_CONFIG[inst.status] || STATUS_CONFIG.EINGANG;
                const isSelected = selected.has(inst.id);
                const isHovered = hoveredRow === inst.id;
                return (
                  <tr
                    key={inst.id}
                    style={{
                      ...(isSelected ? s.trSelected : {}),
                      ...(isHovered && !isSelected ? { background: "rgba(255, 255, 255, 0.02)" } : {}),
                    }}
                    onMouseEnter={() => setHoveredRow(inst.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={{ ...s.td, ...s.checkboxCol }}>
                      <button
                        style={isSelected ? s.checkboxBtnSelected : s.checkboxBtn}
                        onClick={() => toggleSelect(inst.id)}
                      >
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>
                    <td style={s.td}>
                      <span style={s.idCell}>{inst.publicId}</span>
                    </td>
                    <td style={s.td}>
                      <span
                        style={{ ...s.statusBadge, color: statusConfig.color, background: statusConfig.bg }}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={s.customerCell}>
                        <User size={14} />
                        {inst.anlage?.kunde?.firmenName || inst.anlage?.kunde?.name || "-"}
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={s.addressCell}>
                        {[inst.anlage?.strasse, inst.anlage?.hausNr].filter(Boolean).join(" ")}
                        {inst.anlage?.ort && <>, {inst.anlage.plz} {inst.anlage.ort}</>}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={s.customerCell}>
                        <Building size={14} />
                        {inst.netzbetreiber?.kurzname || "-"}
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={s.kwpCell}>
                        {inst.anlage?.leistungKwp ? `${inst.anlage.leistungKwp} kWp` : "-"}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={s.dateCell}>
                        <Calendar size={12} />
                        {formatDate(inst.createdAt)}
                      </span>
                    </td>
                    <td style={s.td}>
                      <button
                        style={{
                          ...s.actionBtn,
                          ...(hoveredActionBtn === inst.id ? { background: "rgba(255, 255, 255, 0.05)", color: "#a5b4fc" } : {}),
                        }}
                        onMouseEnter={() => setHoveredActionBtn(inst.id)}
                        onMouseLeave={() => setHoveredActionBtn(null)}
                        onClick={() => navigate(`/netzanmeldungen/${inst.id}`)}
                        title="Details öffnen"
                      >
                        <ExternalLink size={16} />
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
    </div>
  );
}

export default OperationsTab;
