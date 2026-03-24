/**
 * StatusBadge – Status indicator with dot and color variants
 */

import type { BadgeVariant } from '../types';

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
}

const VARIANT_CLASSES: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  muted: { bg: 'bg-[var(--gray-800)]', text: 'text-[var(--text-secondary)]', dot: 'bg-[var(--gray-500)]' },
  primary: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  success: { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-400' },
  warning: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  danger: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  info: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  purple: { bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
};

export function StatusBadge({ label, variant, dot = false, size = 'sm' }: StatusBadgeProps) {
  const v = VARIANT_CLASSES[variant];
  const sizeClasses = size === 'md' ? 'h-6 px-2.5 text-xs' : 'h-[22px] px-2 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses} font-medium rounded-full ${v.bg} ${v.text}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />}
      {label}
    </span>
  );
}
