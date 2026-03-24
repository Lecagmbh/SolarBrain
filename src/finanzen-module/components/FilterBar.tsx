// ============================================
// FINANZEN MODULE - FILTER BAR
// ============================================

import { Search, X, Check, FileText, LayoutGrid } from "lucide-react";
import type { FilterBarProps, StatusFilter } from "../types";
import { getStatusInfo, clsx } from "../utils";

// ============================================
// STATUS OPTIONS
// ============================================

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Alle" },
  { value: "ENTWURF", label: "Entwurf" },
  { value: "OFFEN", label: "Offen" },
  { value: "BEZAHLT", label: "Bezahlt" },
  { value: "STORNIERT", label: "Storniert" },
];

// ============================================
// COMPONENT
// ============================================

export function FilterBar({
  filters,
  onFilterChange,
  counts,
  viewMode,
  onViewModeChange,
  bulkMode,
  onBulkModeChange,
  selectedCount = 0,
  onSelectAll,
  onDeselectAll,
  onBulkAction,
}: FilterBarProps) {
  return (
    <div className="fin-filters">
      {/* Search Input */}
      <div className="fin-search">
        <Search size={18} className="fin-search__icon" />
        <input
          type="text"
          placeholder="Suchen nach Nummer oder Kunde..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="fin-search__input"
        />
        {filters.search && (
          <button
            className="fin-search__clear"
            onClick={() => onFilterChange({ search: "" })}
            aria-label="Suche löschen"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Status Filter Chips */}
      <div className="fin-chips">
        {STATUS_OPTIONS.map(({ value, label }) => {
          const isActive = filters.status === value;
          const count = counts[value] || 0;
          const statusInfo = value !== "all" ? getStatusInfo(value) : null;

          return (
            <button
              key={value}
              className={clsx("fin-chip", isActive && "fin-chip--active")}
              onClick={() => onFilterChange({ status: value })}
              style={
                isActive && statusInfo
                  ? {
                      backgroundColor: statusInfo.bg,
                      borderColor: statusInfo.color,
                      color: statusInfo.color,
                    }
                  : undefined
              }
            >
              <span className="fin-chip__label">{label}</span>
              <span className="fin-chip__count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="fin-filter-actions">
        {/* Bulk Mode Toggle */}
        <button
          className={clsx("fin-toggle", bulkMode && "fin-toggle--active")}
          onClick={() => {
            onBulkModeChange(!bulkMode);
            if (bulkMode) onDeselectAll?.();
          }}
        >
          <Check size={14} />
          <span>Mehrfachauswahl</span>
        </button>

        {/* View Mode Switch */}
        <div className="fin-view-switch" role="group" aria-label="Ansicht wechseln">
          <button
            className={clsx(viewMode === "table" && "active")}
            onClick={() => onViewModeChange("table")}
            title="Tabellenansicht"
            aria-pressed={viewMode === "table"}
          >
            <FileText size={16} />
          </button>
          <button
            className={clsx(viewMode === "grid" && "active")}
            onClick={() => onViewModeChange("grid")}
            title="Kartenansicht"
            aria-pressed={viewMode === "grid"}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {bulkMode && selectedCount > 0 && (
        <BulkActionsBar
          selectedCount={selectedCount}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          onAction={onBulkAction}
        />
      )}
    </div>
  );
}

// ============================================
// BULK ACTIONS BAR
// ============================================

interface BulkActionsBarProps {
  selectedCount: number;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onAction?: (action: string) => void;
}

function BulkActionsBar({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onAction,
}: BulkActionsBarProps) {
  return (
    <div className="fin-bulk-bar">
      <div className="fin-bulk-bar__left">
        <span className="fin-bulk-bar__count">
          {selectedCount} ausgewählt
        </span>
        <button 
          className="fin-bulk-bar__link" 
          onClick={onSelectAll}
        >
          Alle auswählen
        </button>
        <button 
          className="fin-bulk-bar__link" 
          onClick={onDeselectAll}
        >
          Auswahl aufheben
        </button>
      </div>
      <div className="fin-bulk-bar__actions">
        <button
          className="fin-btn fin-btn--success fin-btn--sm"
          onClick={() => onAction?.("markPaid")}
        >
          <Check size={16} />
          <span>Als bezahlt markieren</span>
        </button>
      </div>
    </div>
  );
}
