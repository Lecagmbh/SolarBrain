import { useState, useCallback, useMemo } from "react";
import { ChevronRight, Search } from "lucide-react";
import { useCustomerGroups, useList } from "../hooks/useEnterpriseApi";
import type { CustomerSummary, CustomerGroupFilters } from "../hooks/useEnterpriseApi";
import { AnimatedNumber } from "./AnimatedNumber";
import { StatusBar } from "./StatusBar";
import { Toast } from "./Toast";
import { getStatusConfig } from "../utils";
import "./CustomerGroupedList.css";

const STATUS_COLORS: Record<string, string> = {
  eingang: "#3b82f6",
  beim_nb: "#f59e0b",
  rueckfrage: "#ef4444",
  genehmigt: "#22c55e",
  ibn: "#a855f7",
  fertig: "#10b981",
  storniert: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  eingang: "Eingang",
  beim_nb: "Beim NB",
  rueckfrage: "Rückfrage",
  genehmigt: "Genehmigt",
  ibn: "IBN",
  fertig: "Fertig",
  storniert: "Storniert",
};

function getDominantStatus(breakdown: Record<string, number>): string {
  const active = ["rueckfrage", "beim_nb", "eingang", "genehmigt", "ibn"];
  for (const s of active) {
    if (breakdown[s] && breakdown[s] > 0) return s;
  }
  return "fertig";
}

function getDaysClass(days: number): string {
  if (days <= 3) return "cgl__days--green";
  if (days <= 10) return "cgl__days--yellow";
  if (days <= 20) return "cgl__days--orange";
  return "cgl__days--red";
}

function getAvatarColor(status: string): string {
  return STATUS_COLORS[status] || "#6b7280";
}

interface CustomerGroupedListProps {
  statusFilter?: string | null;
  onItemClick: (id: number) => void;
}

// Expanded card detail table
function ExpandedInstallations({
  kundeId,
  statusFilter,
  onItemClick,
  onToast,
}: {
  kundeId: number;
  statusFilter?: string | null;
  onItemClick: (id: number) => void;
  onToast: (msg: string, instId: string) => void;
}) {
  const { data, isLoading } = useList({
    kundeId,
    status: statusFilter || undefined,
    limit: 50,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  if (isLoading) {
    return (
      <div className="cgl__table-loading">
        <div className="cgl__spinner" />
        <span>Lade Anlagen...</span>
      </div>
    );
  }

  if (!data?.data?.length) {
    return <div className="cgl__table-loading">Keine Anlagen gefunden</div>;
  }

  return (
    <div className="cgl__table-wrap">
      <table className="cgl__table">
        <thead>
          <tr>
            <th>Status</th>
            <th>ID / Typ</th>
            <th>Standort</th>
            <th>NB</th>
            <th>kWp</th>
            <th>Tage</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((item, i) => {
            const statusCfg = getStatusConfig(item.status);
            return (
              <tr
                key={item.id}
                onClick={() => {
                  onItemClick(item.id);
                  onToast("Öffne Installation", item.publicId);
                }}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <td>
                  <span
                    className="cgl__table-status"
                    style={{
                      color: statusCfg.color,
                      background: statusCfg.bg,
                    }}
                  >
                    {statusCfg.label}
                  </span>
                </td>
                <td>
                  <span className="cgl__table-id">{item.publicId}</span>
                </td>
                <td>{item.plz} {item.ort || "—"}</td>
                <td>{item.gridOperator || "—"}</td>
                <td>{item.totalKwp > 0 ? `${item.totalKwp.toFixed(1)}` : "—"}</td>
                <td>
                  <span className={`cgl__days ${getDaysClass(item.daysOld)}`}>
                    {item.daysOld}d
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CustomerGroupedList({
  statusFilter,
  onItemClick,
}: CustomerGroupedListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<CustomerGroupFilters["sortBy"]>("count");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; instId: string } | null>(null);

  const filters: CustomerGroupFilters = useMemo(() => ({
    search: search || undefined,
    status: statusFilter || undefined,
    sortBy,
    sortOrder,
    page,
    limit: 30,
  }), [search, statusFilter, sortBy, sortOrder, page]);

  const { data, isLoading } = useCustomerGroups(filters);

  const handleToggle = useCallback((kundeId: number) => {
    setExpandedId(prev => (prev === kundeId ? null : kundeId));
  }, []);

  const handleSort = useCallback((field: CustomerGroupFilters["sortBy"]) => {
    if (field === sortBy) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }, [sortBy]);

  const handleToast = useCallback((message: string, instId: string) => {
    setToast({ message, instId });
  }, []);

  if (isLoading) {
    return (
      <div className="cgl">
        <div className="cgl__loading">
          <div className="cgl__spinner" />
          <span style={{ marginLeft: 8 }}>Lade Kunden-Gruppen...</span>
        </div>
      </div>
    );
  }

  const groups = data?.groups || [];

  return (
    <div className="cgl">
      {/* Search */}
      <div className="cgl__search">
        <Search size={16} className="cgl__search-icon" />
        <input
          type="text"
          placeholder="Kunden suchen..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Header + Sort */}
      <div className="cgl__header">
        <span className="cgl__title">
          {data?.totalCustomers || 0} Kunden · {data?.total || 0} Anlagen · {(data?.totalKwp || 0).toFixed(1)} kWp
        </span>
        <div className="cgl__sort">
          <select
            value={sortBy}
            onChange={e => handleSort(e.target.value as CustomerGroupFilters["sortBy"])}
          >
            <option value="count">Anzahl</option>
            <option value="name">Name</option>
            <option value="totalKwp">kWp</option>
            <option value="lastActivity">Aktivität</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      {groups.length === 0 ? (
        <div className="cgl__empty">Keine Kunden gefunden</div>
      ) : (
        <div className="cgl__cards">
          {groups.map((group, index) => (
            <CustomerCard
              key={group.kundeId}
              group={group}
              index={index}
              isExpanded={expandedId === group.kundeId}
              onToggle={handleToggle}
              statusFilter={statusFilter}
              onItemClick={onItemClick}
              onToast={handleToast}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalCustomers > (data.limit || 30) && (
        <div className="cgl__pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            Zurück
          </button>
          <span>Seite {page} von {Math.ceil(data.totalCustomers / (data.limit || 30))}</span>
          <button
            disabled={!data.hasMore}
            onClick={() => setPage(p => p + 1)}
          >
            Weiter
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          installationId={toast.instId}
          onDismiss={() => setToast(null)}
          onClick={() => setToast(null)}
        />
      )}
    </div>
  );
}

// Individual customer card
function CustomerCard({
  group,
  index,
  isExpanded,
  onToggle,
  statusFilter,
  onItemClick,
  onToast,
}: {
  group: CustomerSummary;
  index: number;
  isExpanded: boolean;
  onToggle: (id: number) => void;
  statusFilter?: string | null;
  onItemClick: (id: number) => void;
  onToast: (msg: string, instId: string) => void;
}) {
  const dominantStatus = getDominantStatus(group.statusBreakdown);
  const avatarColor = getAvatarColor(dominantStatus);
  const initial = (group.kundeName || "?")[0].toUpperCase();

  const statusTags = Object.entries(group.statusBreakdown)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => {
      const order = ["rueckfrage", "eingang", "beim_nb", "genehmigt", "ibn", "fertig", "storniert"];
      return order.indexOf(a) - order.indexOf(b);
    });

  return (
    <div
      className={`cgl__card ${isExpanded ? "cgl__card--expanded" : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => onToggle(group.kundeId)}
    >
      {/* Avatar */}
      <div
        className="cgl__avatar"
        style={{
          background: `linear-gradient(135deg, ${avatarColor}cc, ${avatarColor}66)`,
        }}
      >
        {initial}
      </div>

      {/* Info */}
      <div className="cgl__info">
        <div className="cgl__name">{group.kundeName}</div>
        {group.ansprechpartner && (
          <div className="cgl__contact">{group.ansprechpartner}</div>
        )}
        {(group.plz || group.ort) && (
          <div className="cgl__location">{group.plz} {group.ort}</div>
        )}
        <div className="cgl__status-bar">
          <StatusBar
            statusBreakdown={group.statusBreakdown}
            total={group.count}
          />
        </div>
        <div className="cgl__tags">
          {statusTags.map(([status, count]) => (
            <span
              key={status}
              className="cgl__tag"
              style={{
                color: STATUS_COLORS[status] || "#6b7280",
                background: `${STATUS_COLORS[status] || "#6b7280"}20`,
              }}
            >
              {count} {STATUS_LABELS[status] || status}
            </span>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="cgl__kpis">
        <div className="cgl__kpi cgl__kpi--kwp">
          <span className="cgl__kpi-value">
            <AnimatedNumber value={group.totalKwp} decimals={1} />
          </span>
          <span className="cgl__kpi-label">kWp</span>
        </div>
        <div className="cgl__kpi cgl__kpi--count">
          <span className="cgl__kpi-value">
            <AnimatedNumber value={group.count} />
          </span>
          <span className="cgl__kpi-label">Anlagen</span>
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight
        size={18}
        className={`cgl__chevron ${isExpanded ? "cgl__chevron--open" : ""}`}
      />

      {/* Expanded Content */}
      {isExpanded && (
        <div className="cgl__expand" onClick={e => e.stopPropagation()}>
          <ExpandedInstallations
            kundeId={group.kundeId}
            statusFilter={statusFilter}
            onItemClick={onItemClick}
            onToast={onToast}
          />
        </div>
      )}
    </div>
  );
}
