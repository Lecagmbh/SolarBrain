/**
 * AlertsSection – Smart alerts and EVU warnings for the overview tab
 * Wraps PanelAlerts and external EvuWarningsCard
 */

import type { ReactNode } from 'react';

interface AlertsSectionProps {
  /** EVU warnings component (passed from caller who has the import) */
  evuWarnings?: ReactNode;
  /** AI validation badge component */
  aiValidation?: ReactNode;
}

export function AlertsSection({ evuWarnings, aiValidation }: AlertsSectionProps) {
  if (!evuWarnings && !aiValidation) return null;

  return (
    <div className="flex flex-col gap-3">
      {evuWarnings}
      {aiValidation}
    </div>
  );
}
