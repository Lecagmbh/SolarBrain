// =============================================================================
// Baunity Dashboard V4 - ActivityFeed Component
// =============================================================================

import React from "react";
import {
  FileEdit,
  Send,
  CheckCircle,
  HelpCircle,
  Clock,
  Award,
  XCircle,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import type { ActivityFeedProps, ActivityItem } from "../types/dashboard.types";
import { formatRelativeTime, getStatusConfig } from "../utils/helpers";

// -----------------------------------------------------------------------------
// Status Icon Mapping
// -----------------------------------------------------------------------------

const STATUS_ICONS: Record<string, LucideIcon> = {
  entwurf: FileEdit,
  eingereicht: Send,
  in_pruefung: Clock,
  warten_auf_nb: Clock,
  nachbesserung: HelpCircle,
  nb_genehmigt: CheckCircle,
  nb_abgelehnt: XCircle,
  abgeschlossen: Award,
  storniert: XCircle,
};

// -----------------------------------------------------------------------------
// ActivityFeed Component
// -----------------------------------------------------------------------------

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxItems = 10,
  onViewAll,
  onActivityClick,
}) => {
  const visibleActivities = activities.slice(0, maxItems);

  if (activities.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Aktivitäten</h3>
        </div>
        <p className="text-sm text-slate-400 text-center py-4">
          Keine Aktivitäten heute
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <h3 className="card-title">Heute</h3>
        <button onClick={onViewAll} className="card-link">
          Alle anzeigen
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Activity List */}
      <div className="activity-list">
        {visibleActivities.map((activity) => (
          <ActivityItemComponent
            key={activity.id}
            activity={activity}
            onClick={() => onActivityClick(activity)}
          />
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// ActivityItem Component
// -----------------------------------------------------------------------------

interface ActivityItemComponentProps {
  activity: ActivityItem;
  onClick: () => void;
}

const ActivityItemComponent: React.FC<ActivityItemComponentProps> = ({
  activity,
  onClick,
}) => {
  const statusConfig = getStatusConfig(activity.status);
  const StatusIcon = STATUS_ICONS[activity.status.toLowerCase()] || FileEdit;

  return (
    <div className="activity-item" onClick={onClick}>
      {/* Icon */}
      <div
        className="activity-icon"
        style={{ backgroundColor: `${statusConfig.color}20` }}
      >
        <StatusIcon
          className="w-4 h-4"
          style={{ color: statusConfig.color }}
        />
      </div>

      {/* Content */}
      <div className="activity-content">
        <div className="activity-title">
          <span className="activity-title-text">
            {activity.customerName || "Unbekannt"}
          </span>
          <span
            className="activity-status"
            style={{
              backgroundColor: statusConfig.bgColor,
              color: statusConfig.color,
            }}
          >
            {activity.statusLabel || statusConfig.label}
          </span>
        </div>
        <div className="activity-meta">
          {activity.location && <span>{activity.location}</span>}
          {activity.gridOperator && (
            <>
              <span className="mx-1">•</span>
              <span>{activity.gridOperator}</span>
            </>
          )}
        </div>
      </div>

      {/* Time */}
      <div className="activity-time">
        {formatRelativeTime(activity.updatedAt)}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Compact Activity Feed (für kleinere Widgets)
// -----------------------------------------------------------------------------

interface CompactActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  onClick: (activity: ActivityItem) => void;
}

export const CompactActivityFeed: React.FC<CompactActivityFeedProps> = ({
  activities,
  maxItems = 5,
  onClick,
}) => {
  const visibleActivities = activities.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {visibleActivities.map((activity) => {
        const statusConfig = getStatusConfig(activity.status);
        
        return (
          <div
            key={activity.id}
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 p-1 rounded"
            onClick={() => onClick(activity)}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: statusConfig.color }}
            />
            <span className="text-slate-300 truncate flex-1">
              {activity.customerName}
            </span>
            <span className="text-slate-500 text-xs flex-shrink-0">
              {formatRelativeTime(activity.updatedAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Activity Feed with Grouping (nach Datum)
// -----------------------------------------------------------------------------

interface GroupedActivityFeedProps {
  activities: ActivityItem[];
  onActivityClick: (activity: ActivityItem) => void;
}

export const GroupedActivityFeed: React.FC<GroupedActivityFeedProps> = ({
  activities,
  onActivityClick,
}) => {
  // Gruppiere nach Datum
  const grouped = activities.reduce((acc, activity) => {
    const date = new Date(activity.updatedAt).toLocaleDateString("de-DE");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, ActivityItem[]>);

  const today = new Date().toLocaleDateString("de-DE");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("de-DE");

  const getDateLabel = (date: string) => {
    if (date === today) return "Heute";
    if (date === yesterday) return "Gestern";
    return date;
  };

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {getDateLabel(date)}
          </h4>
          <div className="activity-list">
            {items.map((activity) => (
              <ActivityItemComponent
                key={activity.id}
                activity={activity}
                onClick={() => onActivityClick(activity)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Skeleton Loading State
// -----------------------------------------------------------------------------

export const ActivityFeedSkeleton: React.FC = () => (
  <div className="card">
    <div className="card-header">
      <div className="skeleton skeleton--title w-24" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <div className="skeleton skeleton--text w-3/4" />
            <div className="skeleton skeleton--text w-1/2 h-3" />
          </div>
          <div className="skeleton w-16 h-3" />
        </div>
      ))}
    </div>
  </div>
);

export default ActivityFeed;
