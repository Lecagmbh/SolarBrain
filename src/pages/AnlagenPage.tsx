// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import InstallationDetailModal from "../components/InstallationDetailModal";
import "../styles/admin.css";
import { useAuth } from "../modules/auth/AuthContext";
import { getAccessToken } from "../modules/auth/tokenStorage";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

type DashboardActivityApi = {
  id: number;
  publicId: string;
  customerName: string;
  location: string;
  status: string;
  statusLabel: string;
  gridOperator?: string | null;
  updatedAt: string;
  createdBy?: string | null;
  createdByRole?: string | null;
};

type PipelineStageApi = {
  key: string;
  label: string;
  count: number;
};

type DashboardSummaryApi = {
  totalInstallations: number;
  openNetRegistrations: number;
  avgStartHours: number | null;
  lastActivityLabel: string | null;
  pipeline: PipelineStageApi[];
  activities: DashboardActivityApi[];
};

type DashboardActivity = {
  id: number;
  customerName: string;
  location: string;
  status: string;
  statusLabel: string;
  gridOperator?: string | null;
  updatedAt: string;
  createdByEmail?: string | null;
  createdByRole?: string | null;
};

type NormalizedStatusKey = "draft" | "review" | "grid" | "released" | "unknown";
type StatusFilterKey = "all" | Exclude<NormalizedStatusKey, "unknown">;

type StatusConfig = {
  key: Exclude<NormalizedStatusKey, "unknown">;
  label: string;
  description: string;
  badgeClassModifier: string;
};

const STATUS_CONFIGS: Record<Exclude<NormalizedStatusKey, "unknown">, StatusConfig> =
  {
    draft: {
      key: "draft",
      label: "Eingegangen",
      description: "Anmeldung bei Baunity eingegangen",
      badgeClassModifier: "entwurf",
    },
    review: {
      key: "review",
      label: "In Prüfung",
      description: "bei Baunity in Bearbeitung",
      badgeClassModifier: "pruefung",
    },
    grid: {
      key: "grid",
      label: "Beim Netzbetreiber",
      description: "Unterlagen beim Netzbetreiber",
      badgeClassModifier: "netzbetreiber",
    },
    released: {
      key: "released",
      label: "Freigegeben",
      description: "Anschluss freigegeben",
      badgeClassModifier: "freigegeben",
    },
  };

const normalizeStatusLabel = (label: string): NormalizedStatusKey => {
  const l = label.trim().toLowerCase();
  if (l.startsWith("eingegangen")) return "draft";
  if (l.startsWith("entwurf")) return "draft";
  if (l.startsWith("in prüfung") || l.startsWith("in pruefung")) return "review";
  if (l.startsWith("beim netzbetreiber")) return "grid";
  if (l.startsWith("freigegeben")) return "released";
  return "unknown";
};

const STATUS_FILTER_LABELS: { key: StatusFilterKey; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "draft", label: `${STATUS_CONFIGS.draft.label} – ${STATUS_CONFIGS.draft.description}` },
  { key: "review", label: `${STATUS_CONFIGS.review.label} – ${STATUS_CONFIGS.review.description}` },
  { key: "grid", label: `${STATUS_CONFIGS.grid.label} – ${STATUS_CONFIGS.grid.description}` },
  { key: "released", label: `${STATUS_CONFIGS.released.label} – ${STATUS_CONFIGS.released.description}` },
];

const PAGE_SIZE = 20;

const AnlagenPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter] = useState<StatusFilterKey>("all");
  const [search] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<DashboardActivity | null>(null);

  useEffect(() => {
    const fetchInstallations = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getAccessToken();
        if (!token) {
          setError("Nicht eingeloggt – bitte neu anmelden.");
          return;
        }

        const res = await fetch("/api/dashboard/summary", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const apiData = (await res.json()) as DashboardSummaryApi;

        const mapped: DashboardActivity[] = apiData.activities.map((a) => ({
          id: a.id,
          customerName: a.customerName,
          location: a.location,
          status: a.statusLabel || a.status,
          statusLabel: a.statusLabel || a.status,
          gridOperator: a.gridOperator ?? null,
          updatedAt: a.updatedAt,
          createdByEmail: a.createdBy ?? null,
          createdByRole: a.createdByRole ?? null,
        }));

        setActivities(mapped);
      } catch (e) {
        setError("Anlagenübersicht konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    fetchInstallations();
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const normalized = normalizeStatusLabel(a.status);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : normalized !== "unknown" && normalized === statusFilter;

      const term = search.trim().toLowerCase();
      if (!term) return matchesStatus;

      return (
        matchesStatus &&
        (
          a.customerName.toLowerCase().includes(term) ||
          a.location.toLowerCase().includes(term) ||
          (a.gridOperator ?? "").toLowerCase().includes(term) ||
          String(a.id).toLowerCase().includes(term) ||
          (a.createdByEmail ?? "").toLowerCase().includes(term)
        )
      );
    });
  }, [activities, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / PAGE_SIZE));

  const pagedActivities = filteredActivities.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleRowClick = (activity: DashboardActivity) => setSelected(activity);

  const closeDetail = () => setSelected(null);

  const formatDateTime = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1 className="admin-page-title">Anlagen</h1>
        <p className="admin-page-subtitle">
          Zentrale Liste aller Netzanmeldungen mit leistungsfähigen Filtern
          und Detailansicht.
        </p>

        <div className="admin-page-header-actions">
          <button
            className="admin-btn admin-btn-ghost"
            onClick={() => window.location.reload()}
          >
            Aktualisieren
          </button>

          <button
            className="admin-btn admin-btn-primary"
            onClick={() => navigate("/admin/anlagen-wizard")}
          >
            Neue Anlage anlegen
          </button>
        </div>
      </header>

      <section className="admin-card admin-card-activity">
        {loading && <p>Anlagen werden geladen …</p>}
        {error && <p style={{ color: "#f87171" }}>{safeString(error)}</p>}

        {!loading && activities.length === 0 && (
          <p>Noch keine Anlagen angelegt.</p>
        )}

        {!loading && activities.length > 0 && (
          <>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Kunde</th>
                  <th>Ort</th>
                  <th>Status</th>
                  <th>Letztes Update</th>
                  {isAdmin && <th>Angelegt von</th>}
                  <th>ID</th>
                </tr>
              </thead>

              <tbody>
                {pagedActivities.map((a) => (
                  <tr
                    key={a.id}
                    className="dashboard-row"
                    onClick={() => handleRowClick(a)}
                  >
                    <td>{a.customerName}</td>
                    <td>{a.location}</td>
                    <td>{a.statusLabel}</td>
                    <td>{formatDateTime(a.updatedAt)}</td>
                    {isAdmin && <td>{a.createdByEmail ?? "–"}</td>}
                    <td>{a.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <InstallationDetailModal
        open={!!selected}
        installation={selected}
        onClose={closeDetail}
      />
    </div>
  );
};

export default AnlagenPage;
