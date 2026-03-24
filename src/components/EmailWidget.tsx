// =============================================================================
// Baunity Dashboard V4 - EmailWidget Component
// =============================================================================

import React from "react";
import {
  Mail,
  Inbox,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import type { EmailWidgetProps, EmailStats } from "../types/dashboard.types";
import { cn } from "../utils/helpers";

// -----------------------------------------------------------------------------
// EmailWidget Component
// -----------------------------------------------------------------------------

export const EmailWidget: React.FC<EmailWidgetProps> = ({
  stats,
  onOpenInbox,
}) => {
  if (!stats) {
    return <EmailWidgetSkeleton />;
  }

  const hasUnread = stats.unreadCount > 0;
  const hasUnassigned = stats.unassignedCount > 0;
  const hasReview = stats.needsReviewCount > 0;

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Posteingang
        </h3>
        <button onClick={onOpenInbox} className="card-link">
          Öffnen
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Stats */}
      <div className="email-widget">
        {/* Unread */}
        <EmailStatItem
          icon={Inbox}
          value={stats.unreadCount}
          label="Ungelesen"
          color={hasUnread ? "#3b82f6" : "#64748b"}
          highlight={hasUnread}
          onClick={onOpenInbox}
        />

        {/* Unassigned */}
        {stats.unassignedCount > 0 && (
          <EmailStatItem
            icon={AlertCircle}
            value={stats.unassignedCount}
            label="Nicht zugeordnet"
            color="#f59e0b"
            highlight={true}
            onClick={onOpenInbox}
          />
        )}

        {/* Needs Review */}
        {stats.needsReviewCount > 0 && (
          <EmailStatItem
            icon={RefreshCw}
            value={stats.needsReviewCount}
            label="Review nötig"
            color="#EAD068"
            highlight={true}
            onClick={onOpenInbox}
          />
        )}

        {/* All clear */}
        {!hasUnread && !hasUnassigned && !hasReview && (
          <div className="text-center py-4 text-slate-400 text-sm">
            ✅ Alles bearbeitet
          </div>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// EmailStatItem Component
// -----------------------------------------------------------------------------

interface EmailStatItemProps {
  icon: LucideIcon;
  value: number;
  label: string;
  color: string;
  highlight?: boolean;
  onClick: () => void;
}

const EmailStatItem: React.FC<EmailStatItemProps> = ({
  icon: Icon,
  value,
  label,
  color,
  highlight,
  onClick,
}) => {
  return (
    <div
      className={cn(
        "email-stat cursor-pointer rounded-lg p-2 -mx-2 transition-colors",
        highlight && "hover:bg-white/5"
      )}
      onClick={onClick}
    >
      <div
        className="email-stat-icon"
        style={{
          backgroundColor: `${color}20`,
          color: color,
        }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="email-stat-content">
        <div className="email-stat-value" style={{ color: highlight ? color : undefined }}>
          {value}
        </div>
        <div className="email-stat-label">{label}</div>
      </div>
      {highlight && value > 0 && (
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Compact Email Widget (für kleinere Bereiche)
// -----------------------------------------------------------------------------

interface CompactEmailWidgetProps {
  stats: EmailStats | null;
  onClick: () => void;
}

export const CompactEmailWidget: React.FC<CompactEmailWidgetProps> = ({
  stats,
  onClick,
}) => {
  if (!stats) {
    return (
      <div className="skeleton h-12 rounded-lg" />
    );
  }

  const total = stats.unreadCount + stats.unassignedCount;
  const hasItems = total > 0;

  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
        hasItems
          ? "bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20"
          : "bg-slate-800/50 hover:bg-slate-800"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          hasItems ? "bg-blue-500/20" : "bg-slate-700/50"
        )}
      >
        <Mail
          className={cn(
            "w-5 h-5",
            hasItems ? "text-blue-400" : "text-slate-500"
          )}
        />
      </div>
      <div className="flex-1 text-left">
        <div className="font-medium text-slate-200">
          {hasItems ? `${total} neue E-Mail${total > 1 ? "s" : ""}` : "Keine neuen E-Mails"}
        </div>
        {stats.unassignedCount > 0 && (
          <div className="text-xs text-amber-400">
            {stats.unassignedCount} nicht zugeordnet
          </div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500" />
    </button>
  );
};

// -----------------------------------------------------------------------------
// Email Notification Badge
// -----------------------------------------------------------------------------

interface EmailBadgeProps {
  count: number;
  onClick: () => void;
}

export const EmailBadge: React.FC<EmailBadgeProps> = ({ count, onClick }) => {
  if (count === 0) {
    return null;
  }

  return (
    <button
      className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors"
      onClick={onClick}
    >
      <Mail className="w-5 h-5 text-slate-400" />
      <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center px-1 text-xs font-bold text-white bg-blue-500 rounded-full">
        {count > 99 ? "99+" : count}
      </span>
    </button>
  );
};

// -----------------------------------------------------------------------------
// Skeleton Loading State
// -----------------------------------------------------------------------------

export const EmailWidgetSkeleton: React.FC = () => (
  <div className="card">
    <div className="card-header">
      <div className="skeleton skeleton--title w-24" />
    </div>
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-1">
            <div className="skeleton w-10 h-6" />
            <div className="skeleton w-20 h-3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default EmailWidget;
