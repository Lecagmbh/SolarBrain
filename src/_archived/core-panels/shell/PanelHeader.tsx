/**
 * PanelHeader – Title, Badges, Action buttons, Close button
 * Uses inline styles to avoid Tailwind class generation issues.
 */

import { type ReactNode } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { BadgeConfig, HeaderAction, BadgeVariant } from '../types';

interface PanelHeaderProps {
  title: string;
  subtitle?: ReactNode;
  badges?: BadgeConfig[];
  actions?: HeaderAction[];
  onClose: () => void;
  children?: ReactNode;
}

const BADGE_COLORS: Record<BadgeVariant, { bg: string; color: string }> = {
  muted: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' },
  primary: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  success: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  warning: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  danger: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
  info: { bg: 'rgba(14,165,233,0.15)', color: '#38bdf8' },
  purple: { bg: 'rgba(139,92,246,0.15)', color: '#f0d878' },
};

export function PanelHeader({ title, subtitle, badges = [], actions = [], onClose, children }: PanelHeaderProps) {
  return (
    <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0f0f11' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {badges.map((badge, i) => {
            const c = BADGE_COLORS[badge.variant];
            return (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                height: 22, padding: '0 8px', fontSize: 11, fontWeight: 500,
                borderRadius: 9999, background: c.bg, color: c.color,
              }}>
                {badge.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />}
                {badge.text}
              </span>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {actions.filter(a => !a.hidden).map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              title={typeof action.label === 'string' ? action.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'transparent', color: 'rgba(255,255,255,0.5)',
                opacity: action.disabled ? 0.4 : 1,
              }}
            >
              {action.disabled ? <Loader2 size={16} className="animate-spin" /> : action.icon}
            </button>
          ))}
          <button
            onClick={onClose}
            title="Schließen (Esc)"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'rgba(255,255,255,0.5)', marginLeft: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h2 style={{
        padding: '0 20px 4px', fontSize: 20, fontWeight: 600,
        color: 'rgba(255,255,255,0.95)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        margin: 0,
      }}>
        {title}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <div style={{ padding: '0 20px 8px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          {subtitle}
        </div>
      )}

      {children}
    </div>
  );
}
