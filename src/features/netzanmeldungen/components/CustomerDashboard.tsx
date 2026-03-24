/**
 * CUSTOMER DASHBOARD - Status-gruppierte Ansicht für Kunden
 * ==========================================================
 * Ersetzt die flache Liste für Kunden (Solarteure) mit einer
 * übersichtlichen, status-gruppierten Kanban-light Ansicht.
 *
 * Features:
 * - KPI-Leiste mit AnimatedNumber + StatusBar
 * - Rückfrage-Banner (prominent, wenn vorhanden)
 * - Kollabierbare Status-Sektionen mit Lazy Loading
 * - InstallationCard Grid (3 Spalten, responsive)
 * - "Alle anzeigen" → Inline-Tabelle mit Pagination
 * - Debounced Suche → Karten-Grid
 */

import { useState, useCallback, useRef, useMemo } from "react";
import { useStats, useList } from "../hooks/useEnterpriseApi";
import type { ListItem, StatsData } from "../hooks/useEnterpriseApi";
import { AnimatedNumber } from "./AnimatedNumber";
import { StatusBar } from "./StatusBar";
import {
  Search, X, ChevronRight, MapPin, Zap, Clock,
  AlertTriangle, ChevronLeft, Building2,
} from "lucide-react";
import "./CustomerDashboard.css";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONFIG
// ═══════════════════════════════════════════════════════════════════════════

interface CustomerDashboardProps {
  onItemClick: (id: number) => void;
  createdByFilter?: number;
}

interface SectionConfig {
  key: string;
  statusFilter: string;
  label: string;
  icon: string;
  color: string;
  defaultOpen: boolean | "if-items";
  showAvgDays?: boolean;
}

const SECTIONS: SectionConfig[] = [
  { key: "rueckfrage", statusFilter: "RUECKFRAGE", label: "Rückfrage", icon: "\u26A0\uFE0F", color: "#ef4444", defaultOpen: "if-items" },
  { key: "eingang", statusFilter: "EINGANG", label: "Neue Anmeldungen", icon: "\u{1F4E5}", color: "#3b82f6", defaultOpen: true },
  { key: "beim_nb", statusFilter: "BEIM_NB", label: "Beim Netzbetreiber", icon: "\u231B", color: "#f59e0b", defaultOpen: true, showAvgDays: true },
  { key: "genehmigt_ibn", statusFilter: "GENEHMIGT,IBN", label: "Genehmigt / IBN", icon: "\u2705", color: "#22c55e", defaultOpen: true },
  { key: "fertig", statusFilter: "FERTIG", label: "Abgeschlossen", icon: "\uD83C\uDF89", color: "#10b981", defaultOpen: false },
  { key: "storniert", statusFilter: "STORNIERT", label: "Storniert", icon: "\u274C", color: "#6b7280", defaultOpen: false },
];

const PREVIEW_LIMIT = 6;
const TABLE_PAGE_SIZE = 50;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Days heatmap color
// ═══════════════════════════════════════════════════════════════════════════

function getDaysColorClass(days: number | null | undefined): string {
  if (days == null) return "";
  if (days <= 3) return "cd-card__days--green";
  if (days <= 10) return "cd-card__days--yellow";
  if (days <= 20) return "cd-card__days--orange";
  return "cd-card__days--red";
}

function getRelevantDays(item: ListItem): number | null {
  return item.daysAtNb ?? item.daysOld;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function InstallationCard({
  item,
  color,
  onClick,
}: {
  item: ListItem;
  color: string;
  onClick: () => void;
}) {
  const days = getRelevantDays(item);

  return (
    <div
      className="cd-card"
      style={{ "--card-color": color } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="cd-card__name">{item.customerName}</div>
      <div className="cd-card__location">
        <MapPin size={11} />
        {item.plz} {item.ort}
      </div>
      {item.totalKwp > 0 && (
        <div className="cd-card__kwp">
          <Zap size={11} />
          {item.totalKwp.toFixed(1)} kWp
        </div>
      )}
      {item.gridOperator && (
        <div className="cd-card__nb">
          <Building2 size={11} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />
          {item.gridOperator}
        </div>
      )}
      <div className="cd-card__footer">
        {days != null && (
          <span className={`cd-card__days ${getDaysColorClass(days)}`}>
            <Clock size={11} />
            {days} Tage
          </span>
        )}
        <span className="cd-card__id">{item.publicId}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KPI PILLS
// ═══════════════════════════════════════════════════════════════════════════

function KpiPills({
  stats,
  onScrollTo,
}: {
  stats: StatsData;
  onScrollTo: (key: string) => void;
}) {
  const pills = [
    { key: "rueckfrage", icon: "\uD83D\uDD34", value: stats.rueckfrage, label: "Rückfrage", active: stats.rueckfrage > 0 },
    { key: "eingang", icon: "\uD83D\uDCE5", value: stats.eingang, label: "Eingang" },
    { key: "beim_nb", icon: "\u23F3", value: stats.beimNb, label: "Beim NB" },
    { key: "genehmigt_ibn", icon: "\u2705", value: stats.genehmigt + stats.ibn, label: "Genehm." },
    { key: "fertig", icon: "\uD83C\uDF89", value: stats.fertig, label: "Fertig" },
  ];

  return (
    <div className="cd-kpis">
      {pills.map((p) => (
        <button
          key={p.key}
          className={`cd-kpi cd-kpi--${p.key}${p.active ? " cd-kpi--active" : ""}`}
          onClick={() => onScrollTo(p.key)}
        >
          <span className="cd-kpi__icon">{p.icon}</span>
          <span className="cd-kpi__value">
            <AnimatedNumber value={p.value} />
          </span>
          <span className="cd-kpi__label">{p.label}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RÜCKFRAGE BANNER
// ═══════════════════════════════════════════════════════════════════════════

function RueckfrageBanner({
  items,
  count,
  onItemClick,
}: {
  items: ListItem[];
  count: number;
  onItemClick: (id: number) => void;
}) {
  if (count === 0) return null;

  return (
    <div className="cd-banner">
      <div className="cd-banner__header">
        <span className="cd-banner__dot" />
        <AlertTriangle size={16} color="#ef4444" />
        <h3 className="cd-banner__title">Rückfragen beantworten</h3>
        <span className="cd-banner__count">{count}</span>
      </div>
      <div className="cd-banner__cards">
        {items.map((item) => (
          <InstallationCard
            key={item.id}
            item={item}
            color="#ef4444"
            onClick={() => onItemClick(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS SECTION (Collapsible with Lazy Loading)
// ═══════════════════════════════════════════════════════════════════════════

function StatusSection({
  config,
  count,
  avgDays,
  onItemClick,
  sectionRef,
  createdByFilter,
}: {
  config: SectionConfig;
  count: number;
  avgDays?: number;
  onItemClick: (id: number) => void;
  sectionRef?: (el: HTMLDivElement | null) => void;
  createdByFilter?: number;
}) {
  // Determine default open state
  const shouldDefaultOpen = config.defaultOpen === true
    || (config.defaultOpen === "if-items" && count > 0);

  const [expanded, setExpanded] = useState(shouldDefaultOpen);
  const [showAll, setShowAll] = useState(false);
  const [tablePage, setTablePage] = useState(1);

  // Lazy-loaded preview data (only when expanded and not in showAll mode)
  const { data: previewData, isLoading: previewLoading } = useList({
    status: config.statusFilter,
    limit: PREVIEW_LIMIT,
    sortBy: "createdAt",
    sortOrder: config.key === "rueckfrage" ? "asc" : "desc",
    createdById: createdByFilter,
    enabled: expanded && !showAll,
  });

  // Full table data (only when "Alle anzeigen" is active)
  const { data: tableData, isLoading: tableLoading } = useList({
    status: config.statusFilter,
    limit: TABLE_PAGE_SIZE,
    page: tablePage,
    sortBy: "createdAt",
    sortOrder: "desc",
    createdById: createdByFilter,
    enabled: showAll,
  });

  // Don't render hidden sections with 0 items (storniert)
  if (count === 0 && config.key === "storniert") return null;

  const items = showAll ? (tableData?.data || []) : (previewData?.data || []);
  const isLoading = showAll ? tableLoading : previewLoading;
  const totalPages = showAll && tableData ? Math.ceil(tableData.total / TABLE_PAGE_SIZE) : 1;

  return (
    <div
      ref={sectionRef}
      className={`cd-section${expanded ? " cd-section--expanded" : ""}`}
    >
      {/* Section Header */}
      <div className="cd-section__header" onClick={() => { setExpanded((v) => !v); setShowAll(false); }}>
        <ChevronRight size={16} className="cd-section__chevron" />
        <span className="cd-section__icon">{config.icon}</span>
        <span className="cd-section__label">{config.label}</span>
        <div className="cd-section__meta">
          <span className="cd-section__count-badge" style={{ background: `${config.color}22`, color: config.color }}>
            {count}
          </span>
          {config.showAvgDays && avgDays != null && (
            <span className="cd-section__avg-days">&Oslash; {Math.round(avgDays)}d</span>
          )}
        </div>
      </div>

      {/* Collapsible Body */}
      <div className="cd-section__body">
        <div className="cd-section__inner">
          {expanded && (
            <div className="cd-section__content">
              {isLoading ? (
                <div className="cd-skeleton">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="cd-skeleton__card" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="cd-empty">
                  <div className="cd-empty__icon">{config.icon}</div>
                  <div className="cd-empty__text">Keine Anlagen in diesem Status</div>
                </div>
              ) : showAll ? (
                <>
                  {/* Full Table View */}
                  <table className="cd-table">
                    <thead>
                      <tr>
                        <th>Kunde</th>
                        <th>Standort</th>
                        <th>kWp</th>
                        <th>Netzbetreiber</th>
                        <th>Tage</th>
                        <th>ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const days = getRelevantDays(item);
                        return (
                          <tr key={item.id} onClick={() => onItemClick(item.id)}>
                            <td className="cd-table__name">{item.customerName}</td>
                            <td>{item.plz} {item.ort}</td>
                            <td className="cd-table__kwp">{item.totalKwp > 0 ? `${item.totalKwp.toFixed(1)}` : "-"}</td>
                            <td>{item.gridOperator || "-"}</td>
                            <td>
                              <span className={getDaysColorClass(days)}>
                                {days != null ? `${days}d` : "-"}
                              </span>
                            </td>
                            <td style={{ fontFamily: '"SF Mono", Monaco, monospace', fontSize: 11, color: "#64748b" }}>
                              {item.publicId}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="cd-pagination">
                      <button
                        className="cd-pagination__btn"
                        disabled={tablePage <= 1}
                        onClick={(e) => { e.stopPropagation(); setTablePage((p) => p - 1); }}
                      >
                        <ChevronLeft size={14} /> Zurück
                      </button>
                      <span className="cd-pagination__info">
                        Seite {tablePage} von {totalPages}
                      </span>
                      <button
                        className="cd-pagination__btn"
                        disabled={tablePage >= totalPages}
                        onClick={(e) => { e.stopPropagation(); setTablePage((p) => p + 1); }}
                      >
                        Weiter <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                  {/* Back to cards */}
                  <button
                    className="cd-show-all"
                    onClick={() => { setShowAll(false); setTablePage(1); }}
                  >
                    Zurück zur Vorschau
                  </button>
                </>
              ) : (
                <>
                  {/* Card Grid */}
                  <div className="cd-cards">
                    {items.map((item) => (
                      <InstallationCard
                        key={item.id}
                        item={item}
                        color={config.color}
                        onClick={() => onItemClick(item.id)}
                      />
                    ))}
                  </div>

                  {/* Show All Button */}
                  {count > PREVIEW_LIMIT && (
                    <button
                      className="cd-show-all"
                      onClick={() => setShowAll(true)}
                    >
                      Alle {count} anzeigen <ChevronRight size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH RESULTS
// ═══════════════════════════════════════════════════════════════════════════

function SearchResults({
  query,
  onItemClick,
  createdByFilter,
}: {
  query: string;
  onItemClick: (id: number) => void;
  createdByFilter?: number;
}) {
  const { data, isLoading } = useList({ search: query, limit: 50, createdById: createdByFilter });
  const items = data?.data || [];
  const total = data?.total || 0;

  if (isLoading) {
    return (
      <div className="cd-skeleton">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="cd-skeleton__card" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="cd-search-results-label">
        <span>{total}</span> Ergebnis{total !== 1 ? "se" : ""} für &quot;{query}&quot;
      </div>
      {items.length === 0 ? (
        <div className="cd-empty">
          <div className="cd-empty__icon">
            <Search size={28} />
          </div>
          <div className="cd-empty__text">Keine Anlagen gefunden</div>
        </div>
      ) : (
        <div className="cd-cards">
          {items.map((item) => (
            <InstallationCard
              key={item.id}
              item={item}
              color="#3b82f6"
              onClick={() => onItemClick(item.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CustomerDashboard({ onItemClick, createdByFilter }: CustomerDashboardProps) {
  const { data: stats, isLoading: statsLoading } = useStats();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Rückfrage preview data for banner
  const { data: rueckfrageData } = useList({
    status: "RUECKFRAGE",
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "asc",
    createdById: createdByFilter,
  });

  const isSearching = debouncedQuery.length >= 2;

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(value.trim());
    }, 300);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
    setDebouncedQuery("");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleSearchClear();
      (e.target as HTMLInputElement).blur();
    }
  }, [handleSearchClear]);

  const scrollToSection = useCallback((key: string) => {
    const el = sectionRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Build status breakdown for StatusBar
  const statusBreakdown: Record<string, number> = useMemo(() => {
    if (!stats) return { eingang: 0, beim_nb: 0, rueckfrage: 0, genehmigt: 0, fertig: 0, storniert: 0 };
    return {
      eingang: stats.eingang,
      beim_nb: stats.beimNb,
      rueckfrage: stats.rueckfrage,
      genehmigt: stats.genehmigt + stats.ibn,
      fertig: stats.fertig,
      storniert: stats.storniert,
    };
  }, [stats]);

  const getCountForSection = useCallback((key: string): number => {
    if (!stats) return 0;
    switch (key) {
      case "rueckfrage": return stats.rueckfrage;
      case "eingang": return stats.eingang;
      case "beim_nb": return stats.beimNb;
      case "genehmigt_ibn": return stats.genehmigt + stats.ibn;
      case "fertig": return stats.fertig;
      case "storniert": return stats.storniert;
      default: return 0;
    }
  }, [stats]);

  if (statsLoading || !stats) {
    return (
      <div>
        {/* KPI Skeleton */}
        <div className="cd-kpis">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="cd-kpi" style={{ width: 120, height: 44, opacity: 0.3 }} />
          ))}
        </div>
        {/* Section Skeletons */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="cd-section" style={{ marginBottom: 16, height: 48, opacity: 0.3 }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* KPI Pills — ausblenden bei aktivem createdByFilter */}
      {!createdByFilter && (
        <>
          <KpiPills stats={stats} onScrollTo={scrollToSection} />
          <div className="cd-statusbar">
            <StatusBar
              statusBreakdown={statusBreakdown}
              total={stats.total}
            />
          </div>
        </>
      )}

      {/* Search */}
      <div className="cd-search">
        <Search size={16} className="cd-search__icon" />
        <input
          className="cd-search__input"
          type="text"
          placeholder="Anlage suchen (Name, PLZ, ID...)"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        {searchQuery && (
          <button className="cd-search__clear" onClick={handleSearchClear}>
            <X size={14} />
          </button>
        )}
      </div>

      {isSearching ? (
        /* Search Results Mode */
        <SearchResults query={debouncedQuery} onItemClick={onItemClick} createdByFilter={createdByFilter} />
      ) : (
        /* Normal Mode: Sections */
        <>
          {/* Rückfrage Banner */}
          <RueckfrageBanner
            items={rueckfrageData?.data || []}
            count={stats.rueckfrage}
            onItemClick={onItemClick}
          />

          {/* Status Sections */}
          {SECTIONS.map((sectionConfig) => {
            // Skip rueckfrage in sections since it has its own banner
            if (sectionConfig.key === "rueckfrage") return null;

            return (
              <StatusSection
                key={sectionConfig.key}
                config={sectionConfig}
                count={getCountForSection(sectionConfig.key)}
                avgDays={sectionConfig.showAvgDays ? stats.avgDaysBeimNb : undefined}
                onItemClick={onItemClick}
                sectionRef={(el) => { sectionRefs.current[sectionConfig.key] = el; }}
                createdByFilter={createdByFilter}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

export default CustomerDashboard;
