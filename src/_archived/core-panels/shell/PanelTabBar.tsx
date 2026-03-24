/**
 * PanelTabBar – Horizontal tab navigation with inline styles
 */

import type { ReactNode } from 'react';

export interface PanelTab {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  badge?: number | string;
  hidden?: boolean;
}

interface PanelTabBarProps {
  tabs: PanelTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function PanelTabBar({ tabs, activeTab, onTabChange }: PanelTabBarProps) {
  const visibleTabs = tabs.filter((t) => !t.hidden);

  return (
    <div style={{
      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2,
      padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: '#0f0f11', overflowX: 'auto',
    }}>
      {visibleTabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 12px',
              fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', cursor: 'pointer',
              border: 'none', background: 'transparent',
              borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
              color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
              transition: 'color 100ms',
            }}
          >
            {tab.icon && <span style={{ flexShrink: 0 }}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge != null && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 18, height: 18, padding: '0 4px', fontSize: 10, fontWeight: 600,
                borderRadius: 9999,
                background: isActive ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
                color: isActive ? '#60a5fa' : 'rgba(255,255,255,0.3)',
              }}>
                {tab.badge}
              </span>
            )}
            {tab.shortcut && (
              <span style={{ marginLeft: 2, fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                {tab.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
