/**
 * PanelProgress – Progress bar with steps indicator
 */

import { ChevronRight } from 'lucide-react';

interface PanelProgressProps {
  /** Completion percentage 0-100 */
  percent: number;
  /** Label for the next incomplete step */
  nextStep?: string;
  /** Optional step indicators */
  steps?: { label: string; done: boolean }[];
}

export function PanelProgress({ percent, nextStep, steps }: PanelProgressProps) {
  return (
    <div className="px-5 pb-3">
      {/* Bar */}
      <div className="h-1.5 rounded-full bg-[var(--gray-800)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>

      {/* Info line */}
      <div className="flex items-center justify-between mt-1.5 text-[10px] text-[var(--text-muted)]">
        <span>{percent}% abgeschlossen</span>
        {nextStep && (
          <span className="flex items-center gap-0.5">
            <ChevronRight size={10} />
            {nextStep}
          </span>
        )}
      </div>

      {/* Step dots (optional) */}
      {steps && steps.length > 0 && (
        <div className="flex items-center gap-1 mt-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${step.done ? 'bg-green-500' : 'bg-[var(--gray-700)]'}`}
                title={step.label}
              />
              {i < steps.length - 1 && (
                <div className={`w-4 h-px ${step.done ? 'bg-green-500/40' : 'bg-[var(--gray-800)]'}`} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
