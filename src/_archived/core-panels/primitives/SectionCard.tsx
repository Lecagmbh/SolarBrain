/**
 * SectionCard – Reusable card container for panel sections
 */

import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  /** Badge shown next to the title */
  badge?: string | number;
  /** Optional action button in the header */
  action?: { label: string; onClick: () => void; icon?: ReactNode };
  /** Number of grid columns for children layout */
  columns?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
}

export function SectionCard({
  title,
  badge,
  action,
  columns,
  className = '',
  children,
}: SectionCardProps) {
  const gridCls = columns === 3
    ? 'grid grid-cols-3 gap-3'
    : columns === 2
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
      : '';

  return (
    <div
      className={`
        rounded-xl border border-[var(--panel-border)]
        bg-[var(--panel-surface)] overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--panel-border)]">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide">
            {title}
          </h3>
          {badge != null && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full bg-[var(--gray-800)] text-[var(--text-muted)]">
              {badge}
            </span>
          )}
        </div>
        {action && (
          <button
            className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </button>
        )}
      </div>

      {/* Body */}
      <div className={`p-4 ${gridCls}`}>
        {children}
      </div>
    </div>
  );
}
