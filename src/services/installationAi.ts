export type InstallationAiSummary = {
  aiStatus: string | null;
  aiSubStatus: string | null;
  requiredDocs: string[];
  optionalDocs: string[];
  nextActions: string[];
  notes: string[];
};

/**
 * Platzhalter: später durch echtes Backend / KI ersetzen.
 */
export async function fetchInstallationAiSummary(
  _installationId: number,
  _payload?: Record<string, unknown>
): Promise<InstallationAiSummary> {
  return {
    aiStatus: null,
    aiSubStatus: null,
    requiredDocs: [],
    optionalDocs: [],
    nextActions: [],
    notes: [],
  };
}
