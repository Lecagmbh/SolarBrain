/**
 * SUBUNTERNEHMER OVERVIEW
 * ========================
 * Kompakte Karten-Ansicht der Subunternehmer eines WL-Kunden.
 * Zeigt pro Sub: Name, E-Mail, Firma, Anlagen-Count, Status-Verteilung, kWp.
 * Klick auf Sub → wechselt zur gefilterten Anlagen-Ansicht.
 */

import { useState, useMemo, useCallback } from "react";
import { ChevronRight, Search, Users, Zap, ArrowRight } from "lucide-react";
import { useSubOverview } from "../hooks/useSubOverview";
import type { SubContractor } from "../hooks/useSubOverview";
import { useList } from "../hooks/useEnterpriseApi";
import { AnimatedNumber } from "./AnimatedNumber";
import { StatusBar } from "./StatusBar";
import { Toast } from "./Toast";
import { getStatusConfig } from "../utils";
import "./SubunternehmerOverview.css";

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
  if (days <= 3) return "so__days--green";
  if (days <= 10) return "so__days--yellow";
  if (days <= 20) return "so__days--orange";
  return "so__days--red";
}

interface SubunternehmerOverviewProps {
  onSubClick: (subUserId: number) => void;
  onItemClick: (id: number) => void;
}

// Expanded installations table for a sub
function ExpandedInstallations({
  createdById,
  onItemClick,
  onToast,
}: {
  createdById: number;
  onItemClick: (id: number) => void;
  onToast: (msg: string, instId: string) => void;
}) {
  const { data, isLoading } = useList({
    createdById,
    limit: 50,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  if (isLoading) {
    return (
      <div className="so__table-loading">
        <div className="so__spinner" />
        <span>Lade Anlagen...</span>
      </div>
    );
  }

  if (!data?.data?.length) {
    return <div className="so__table-loading">Keine Anlagen gefunden</div>;
  }

  return (
    <div className="so__table-wrap">
      <table className="so__table">
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
                    className="so__table-status"
                    style={{
                      color: statusCfg.color,
                      background: statusCfg.bg,
                    }}
                  >
                    {statusCfg.label}
                  </span>
                </td>
                <td>
                  <span className="so__table-id">{item.publicId}</span>
                </td>
                <td>{item.plz} {item.ort || "—"}</td>
                <td>{item.gridOperator || "—"}</td>
                <td>{item.totalKwp > 0 ? `${item.totalKwp.toFixed(1)}` : "—"}</td>
                <td>
                  <span className={`so__days ${getDaysClass(item.daysOld)}`}>
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

// Individual sub card
function SubCard({
  sub,
  index,
  isExpanded,
  onToggle,
  onSubClick,
  onItemClick,
  onToast,
}: {
  sub: SubContractor;
  index: number;
  isExpanded: boolean;
  onToggle: (id: number) => void;
  onSubClick: (id: number) => void;
  onItemClick: (id: number) => void;
  onToast: (msg: string, instId: string) => void;
}) {
  const dominantStatus = getDominantStatus(sub.statusBreakdown);
  const avatarColor = STATUS_COLORS[dominantStatus] || "#6b7280";
  const initial = (sub.name || "?")[0].toUpperCase();

  const statusTags = Object.entries(sub.statusBreakdown)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => {
      const order = ["rueckfrage", "eingang", "beim_nb", "genehmigt", "ibn", "fertig", "storniert"];
      return order.indexOf(a) - order.indexOf(b);
    });

  return (
    <div
      className={`so__card ${isExpanded ? "so__card--expanded" : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => onToggle(sub.id)}
    >
      {/* Avatar */}
      <div
        className="so__avatar"
        style={{
          background: `linear-gradient(135deg, ${avatarColor}cc, ${avatarColor}66)`,
        }}
      >
        {initial}
      </div>

      {/* Info */}
      <div className="so__info">
        <div className="so__name">{sub.name}</div>
        <div className="so__email">{sub.email}</div>
        {sub.company && <div className="so__company">{sub.company}</div>}
        {sub.totalAnlagen > 0 && (
          <>
            <div className="so__status-bar">
              <StatusBar
                statusBreakdown={sub.statusBreakdown}
                total={sub.totalAnlagen}
              />
            </div>
            <div className="so__tags">
              {statusTags.map(([status, count]) => (
                <span
                  key={status}
                  className="so__tag"
                  style={{
                    color: STATUS_COLORS[status] || "#6b7280",
                    background: `${STATUS_COLORS[status] || "#6b7280"}20`,
                  }}
                >
                  {count} {STATUS_LABELS[status] || status}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* KPIs */}
      <div className="so__kpis">
        <div className="so__kpi so__kpi--kwp">
          <span className="so__kpi-value">
            <AnimatedNumber value={sub.totalKwp} decimals={1} />
          </span>
          <span className="so__kpi-label">kWp</span>
        </div>
        <div className="so__kpi so__kpi--count">
          <span className="so__kpi-value">
            <AnimatedNumber value={sub.totalAnlagen} />
          </span>
          <span className="so__kpi-label">Anlagen</span>
        </div>
      </div>

      {/* Actions */}
      <div className="so__actions">
        <button
          className="so__view-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSubClick(sub.id);
          }}
          title="Anlagen dieses Subunternehmers anzeigen"
        >
          <ArrowRight size={16} />
        </button>
        <ChevronRight
          size={18}
          className={`so__chevron ${isExpanded ? "so__chevron--open" : ""}`}
        />
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="so__expand" onClick={(e) => e.stopPropagation()}>
          <ExpandedInstallations
            createdById={sub.id}
            onItemClick={onItemClick}
            onToast={onToast}
          />
        </div>
      )}
    </div>
  );
}

export function SubunternehmerOverview({
  onSubClick,
  onItemClick,
}: SubunternehmerOverviewProps) {
  const { data, isLoading } = useSubOverview();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; instId: string } | null>(null);

  const handleToggle = useCallback((id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const handleToast = useCallback((message: string, instId: string) => {
    setToast({ message, instId });
  }, []);

  // Client-side search (wenige Subs)
  const filteredSubs = useMemo(() => {
    if (!data?.subContractors) return [];
    if (!search.trim()) return data.subContractors;
    const q = search.toLowerCase().trim();
    return data.subContractors.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.company && s.company.toLowerCase().includes(q))
    );
  }, [data?.subContractors, search]);

  if (isLoading) {
    return (
      <div className="so">
        <div className="so__loading">
          <div className="so__spinner" />
          <span style={{ marginLeft: 8 }}>Lade Subunternehmer...</span>
        </div>
      </div>
    );
  }

  if (!data || data.totalSubs === 0) {
    return (
      <div className="so">
        <div className="so__empty">
          <Users size={32} />
          <div className="so__empty-text">Keine Subunternehmer vorhanden</div>
          <div className="so__empty-sub">
            Erstelle Subunternehmer in den Einstellungen, um hier deren Anlagen zu sehen.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="so">
      {/* Search */}
      <div className="so__search">
        <Search size={16} className="so__search-icon" />
        <input
          type="text"
          placeholder="Subunternehmer suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Header */}
      <div className="so__header">
        <span className="so__title">
          {data.totalSubs} Subunternehmer · {data.totalAnlagen} Anlagen · {data.totalKwp.toFixed(1)} kWp
        </span>
      </div>

      {/* Cards */}
      {filteredSubs.length === 0 ? (
        <div className="so__empty-search">Keine Subunternehmer gefunden</div>
      ) : (
        <div className="so__cards">
          {filteredSubs.map((sub, index) => (
            <SubCard
              key={sub.id}
              sub={sub}
              index={index}
              isExpanded={expandedId === sub.id}
              onToggle={handleToggle}
              onSubClick={onSubClick}
              onItemClick={onItemClick}
              onToast={handleToast}
            />
          ))}
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

export default SubunternehmerOverview;
