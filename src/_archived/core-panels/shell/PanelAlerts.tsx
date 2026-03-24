/**
 * PanelAlerts – Smart alert banner (warning/error/info/success)
 */

import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export interface PanelAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface PanelAlertsProps {
  alerts: PanelAlert[];
}

const ALERT_STYLES: Record<PanelAlert['type'], { bg: string; border: string; icon: ReactNode }> = {
  error: {
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    icon: <AlertCircle size={16} className="text-red-400 shrink-0" />,
  },
  warning: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    icon: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
  },
  info: {
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    icon: <Info size={16} className="text-blue-400 shrink-0" />,
  },
  success: {
    bg: 'bg-green-500/5',
    border: 'border-green-500/20',
    icon: <CheckCircle size={16} className="text-green-400 shrink-0" />,
  },
};

export function PanelAlerts({ alerts }: PanelAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="px-4 pt-3 flex flex-col gap-2">
      {alerts.map((alert) => {
        const style = ALERT_STYLES[alert.type];
        return (
          <div
            key={alert.id}
            className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${style.bg} ${style.border}`}
          >
            {style.icon}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)]">{alert.title}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{alert.message}</p>
            </div>
            {alert.action && (
              <button
                className="shrink-0 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                onClick={alert.action.onClick}
              >
                {alert.action.label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
