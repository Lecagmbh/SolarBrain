import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet } from "../api/client";
import "../styles/admin.css";

type PipelineStage = {
  key: string;
  label: string;
  count: number;
};

type DashboardActivity = {
  id: number;
  publicId?: string;
  customerName: string;
  location: string;
  status: string;
  statusLabel: string;
  gridOperator?: string | null;
  updatedAt: string;
  createdBy?: string | null;
  createdByRole?: string | null;
};

type DashboardSummary = {
  totalInstallations: number;
  openNetRegistrations: number;
  avgStartHours: number | null;
  lastActivityLabel: string | null;
  pipeline: PipelineStage[];
  activities: DashboardActivity[];
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Alle Status" },
  { value: "entwurf", label: "Entwurf" },
  { value: "pruefung", label: "In Prüfung" },
  { value: "netzbetreiber", label: "Beim Netzbetreiber" },
  { value: "freigegeben", label: "Freigegeben" },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function normalizeBackendStatus(status: string): string {
  switch (String(status || "").toLowerCase()) {
    case "eingereicht":
      return "pruefung";
    case "in_pruefung":
    case "prüfung":
    case "pruefung":
      return "pruefung";
    case "warten_auf_nb":
    case "warten_nb":
      return "netzbetreiber";
    case "abgeschlossen":
      return "freigegeben";
    case "entwurf":
      return "entwurf";
    default:
      return String(status || "");
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusChipClass(status: string) {
  switch (status) {
    case "entwurf":
      return "status-chip status-chip-draft";
    case "pruefung":
      return "status-chip status-chip-review";
    case "netzbetreiber":
      return "status-chip status-chip-grid";
    case "freigegeben":
      return "status-chip status-chip-released";
    default:
      return "status-chip";
  }
}

const InstallationsPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gridOperatorFilter, setGridOperatorFilter] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number>(50);
  const [page, setPage] = useState<number>(1);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await apiGet<DashboardSummary>("/dashboard/summary");
      setSummary(data);
      setPage(1);
    } catch (err) {
      console.error(err);
      setErrorMsg("Anlagenübersicht konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep link: /admin/installations/:id
  useEffect(() => {
    if (params.id) {
      navigate(`/admin/installations/${params.id}`, { replace: true });
    }
  }, [params.id, navigate]);

  const gridOperatorOptions = useMemo(() => {
    if (!summary) return [];
    const set = new Set<string>();
    for (const a of summary.activities) {
      if (a.gridOperator) set.add(a.gridOperator);
    }
    return Array.from(set).sort();
  }, [summary]);

  const filteredActivities = useMemo(() => {
    if (!summary) return [];
    let items = [...summary.activities];

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      items = items.filter(
        (a) =>
          (a.customerName || "").toLowerCase().includes(term) ||
          (a.location || "").toLowerCase().includes(term) ||
          (a.gridOperator || "").toLowerCase().includes(term) ||
          String(a.publicId || "").toLowerCase().includes(term) ||
          String(a.id).includes(term)
      );
    }

    if (statusFilter !== "all") {
      items = items.filter((a) => normalizeBackendStatus(a.status) === statusFilter);
    }

    if (gridOperatorFilter !== "all") {
      items = items.filter((a) => (a.gridOperator || "") === gridOperatorFilter);
    }

    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return items;
  }, [summary, search, statusFilter, gridOperatorFilter]);

  const totalPages = useMemo(() => {
    if (!filteredActivities.length) return 1;
    return Math.max(1, Math.ceil(filteredActivities.length / pageSize));
  }, [filteredActivities.length, pageSize]);

  const pagedActivities = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredActivities.slice(start, end);
  }, [filteredActivities, page, pageSize]);

  const openDetail = (id: number) => {
    navigate(`/admin/installations/${id}`, { replace: false });
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Anlagen</h1>
          <p className="admin-page-subtitle">
            Zentrale Liste aller Netzanmeldungen mit Filtern &amp; Detailansicht.
          </p>
        </div>

        <div className="admin-page-header-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={loadSummary} disabled={loading}>
            {loading ? "Aktualisiere …" : "Aktualisieren"}
          </button>
        </div>
      </header>

      <section className="admin-card admin-card-activity">
        <div className="dashboard-filter-bar">
          <div className="dashboard-filter-left">
            <div className="dashboard-filter-group" style={{ minWidth: 260 }}>
              <input
                className="admin-input"
                placeholder="Suche nach Kunde, Ort, NB, ID …"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="dashboard-filter-group">
              <select
                className="admin-input"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="dashboard-filter-group">
              <select
                className="admin-input"
                value={gridOperatorFilter}
                onChange={(e) => {
                  setGridOperatorFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Alle Netzbetreiber</option>
                {gridOperatorOptions.map((go) => (
                  <option key={go} value={go}>
                    {go}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="dashboard-filter-right">
            <div className="dashboard-filter-group">
              <select
                className="admin-input"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} / Seite
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {errorMsg && <div className="admin-field-error">{errorMsg}</div>}

        {summary && filteredActivities.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-pill">Keine Anlagen gefunden</div>
            <p>Passe Filter/Suche an oder aktualisiere.</p>
          </div>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Anlage</th>
                  <th>Standort</th>
                  <th>Netzbetreiber</th>
                  <th>Status</th>
                  <th>Letzte Aktivität</th>
                </tr>
              </thead>
              <tbody>
                {pagedActivities.map((a) => {
                  const normStatus = normalizeBackendStatus(a.status);
                  return (
                    <tr key={a.id} className="dashboard-table-row" onClick={() => openDetail(a.id)}>
                      <td>
                        <div className="dash-cell-main">
                          <div className="dash-cell-title">{a.customerName || "Unbekannter Kunde"}</div>
                          <div className="dash-cell-sub">
                            ID: <span className="dash-cell-id">{a.id}</span>
                            {a.publicId ? <> · <span className="dash-cell-id">{a.publicId}</span></> : null}
                          </div>
                        </div>
                      </td>
                      <td>{a.location || "–"}</td>
                      <td>{a.gridOperator || "–"}</td>
                      <td>
                        <span className={statusChipClass(normStatus)}>{a.statusLabel || a.status}</span>
                      </td>
                      <td>{formatDateTime(a.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredActivities.length > 0 && (
          <div className="dashboard-pagination">
            <div className="dashboard-pagination-info">
              Zeige {((page - 1) * pageSize + 1).toLocaleString("de-DE")}–{" "}
              {Math.min(page * pageSize, filteredActivities.length).toLocaleString("de-DE")} von{" "}
              {filteredActivities.length.toLocaleString("de-DE")} Anlagen
            </div>
            <div className="dashboard-pagination-controls">
              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Zurück
              </button>
              <span className="dashboard-pagination-page">
                Seite {page} / {totalPages}
              </span>
              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Weiter
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default InstallationsPage;
