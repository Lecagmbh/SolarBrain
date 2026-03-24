import { useEffect, useState } from "react";
import { getAccessToken } from "../../../auth/tokenStorage";
import type { InstallationDetail } from "../types";
import type { InstallationAiSummary } from "../../../../services/installationAi";

type State = {
  detail: InstallationDetail | null;
  ai: InstallationAiSummary | null;
  loading: boolean;
  error: string | null;
};

export default function useInstallationDetail(
  installationId: number | null,
  open: boolean
): State {
  const [detail, setDetail] = useState<InstallationDetail | null>(null);
  const [ai, setAi] = useState<InstallationAiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !installationId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getAccessToken();
        const res = await fetch(
          `/api/installations/${encodeURIComponent(String(installationId))}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = (await res.json()) as InstallationDetail;
        setDetail(json);

        if (json.raw) {
          const aiRes = await fetch(
            `/api/installations/${installationId}/ai-summary`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );
          if (aiRes.ok) {
            const aiJson =
              (await aiRes.json()) as InstallationAiSummary;
            setAi(aiJson);
          }
        }
      } catch (e) {
        console.error("useInstallationDetail error", e);
        setError("Details konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [installationId, open]);

  return { detail, ai, loading, error };
}
