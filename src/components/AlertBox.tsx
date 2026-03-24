// =============================================================================
// Baunity Dashboard V4 - AlertBox Component
// =============================================================================

import React from "react";
import {
  AlertTriangle,
  HelpCircle,
  FileWarning,
  Receipt,
  Mail,
  FileX,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import type { AlertItem, AlertBoxProps } from "../types/dashboard.types";
import { cn } from "../utils/helpers";

// -----------------------------------------------------------------------------
// Icon Mapping
// -----------------------------------------------------------------------------

const ALERT_ICONS: Record<string, LucideIcon> = {
  nb_query: HelpCircle,
  ibn_missing: FileWarning,
  invoice_overdue: Receipt,
  email_unassigned: Mail,
  document_missing: FileX,
  approval_received: CheckCircle,
  default: AlertCircle,
};

// -----------------------------------------------------------------------------
// AlertBox Component
// -----------------------------------------------------------------------------

export const AlertBox: React.FC<AlertBoxProps> = ({
  alerts,
  maxItems = 5,
  onViewAll,
  onAlertClick,
}) => {
  if (alerts.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">✅ Alles erledigt</h3>
        </div>
        <p className="text-sm text-slate-400">
          Keine dringenden Aufgaben vorhanden.
        </p>
      </div>
    );
  }

  const visibleAlerts = alerts.slice(0, maxItems);
  const hasMore = alerts.length > maxItems;

  // Bestimme Box-Severity basierend auf höchster Alert-Severity
  const boxSeverity = alerts[0]?.severity || "info";

  return (
    <div className={cn("alert-box", `alert-box--${boxSeverity}`)}>
      {/* Header */}
      <div className="card-header">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wide">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          Sofort Handeln
        </h3>
        {hasMore && (
          <button onClick={onViewAll} className="card-link">
            Alle {alerts.length} anzeigen
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Alert List */}
      <div className="space-y-1">
        {visibleAlerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onClick={() => onAlertClick(alert)}
          />
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// AlertItem Component
// -----------------------------------------------------------------------------

interface AlertItemComponentProps {
  alert: AlertItem;
  onClick: () => void;
}

const AlertItem: React.FC<AlertItemComponentProps> = ({ alert, onClick }) => {
  const Icon = ALERT_ICONS[alert.type] || ALERT_ICONS.default;

  return (
    <div
      className="alert-item cursor-pointer hover:bg-white/5 rounded-md transition-colors"
      onClick={onClick}
    >
      {/* Icon */}
      <div className={cn("alert-icon", `alert-icon--${alert.severity}`)}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="alert-content">
        <div className="alert-title">
          {alert.count && alert.count > 1 ? `${alert.count}× ` : ""}
          {alert.title}
        </div>
        <div className="alert-description">{alert.description}</div>
      </div>

      {/* Action Button */}
      {alert.actionLabel && (
        <button
          className="alert-action"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          {alert.actionLabel}
        </button>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Skeleton Loading State
// -----------------------------------------------------------------------------

export const AlertBoxSkeleton: React.FC = () => (
  <div className="card">
    <div className="card-header">
      <div className="skeleton skeleton--title w-40" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton w-5 h-5 rounded-full" />
          <div className="flex-1 space-y-1">
            <div className="skeleton skeleton--text w-3/4" />
            <div className="skeleton skeleton--text w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AlertBox;
