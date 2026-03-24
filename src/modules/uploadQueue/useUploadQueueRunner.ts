import { useEffect, useRef, useState } from "react";
import { apiPost } from "../api/client";
import { listUploads, removeUpload, updateUpload } from "./uploadQueue";

type RunnerState = {
  pending: number;
  uploading: boolean;
  lastError?: string;
  lastSuccessAt?: number;
};

export function useUploadQueueRunner() {
  const [state, setState] = useState<RunnerState>({ pending: 0, uploading: false });
  const runningRef = useRef(false);

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      if (runningRef.current) return;
      runningRef.current = true;

      try {
        const items = await listUploads(25);
        if (!alive) return;

        setState((s) => ({ ...s, pending: items.length }));

        if (items.length === 0) return;

        setState((s) => ({ ...s, uploading: true }));

        for (const it of items) {
          if (!alive) return;

          // max retries
          if (it.tries >= 3) {
            // keep in queue but mark error
            await updateUpload(it.id, { lastError: it.lastError || "Max retries reached" });
            continue;
          }

          try {
            const fd = new FormData();
            fd.append("file", it.blob, it.filename);
            fd.append("installationId", String(it.installationId));
            fd.append("kategorie", it.kategorie);
            fd.append("dokumentTyp", it.dokumentTyp);

            // apiPost kann FormData
            await apiPost("/documents/upload", fd);

            await removeUpload(it.id);
            setState((s) => ({ ...s, lastSuccessAt: Date.now() }));
          } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: string } }; message?: string };
            const msg = err?.response?.data?.error || err?.message || "Upload fehlgeschlagen";
            await updateUpload(it.id, { tries: (it.tries || 0) + 1, lastError: msg });
            setState((s) => ({ ...s, lastError: msg }));
          }
        }
      } finally {
        if (!alive) return;
        setState((s) => ({ ...s, uploading: false }));
        runningRef.current = false;
      }
    };

    const timer = setInterval(() => tick().catch(() => {}), 2500);
    tick().catch(() => {});

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return state;
}
