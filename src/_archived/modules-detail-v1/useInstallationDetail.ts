import { useEffect, useState } from "react";
import { getAccessToken } from "../../auth/tokenStorage";

export type InstallationSummary = {
  id: number;
  customerName: string;
  location: string;
  status: string;
  statusLabel: string;
  gridOperator: string | null;
  updatedAt: string;
};

export type UploadMeta = {
  filename: string;
  contentType?: string | null;
  size?: number | null;
};

export type Comment = {
  id: number;
  author: string;
  message: string;
  createdAt: string;
};

export type StatusHistoryEntry = {
  status: string;
  statusLabel: string;
  changedAt: string;
  changedBy: string;
};

export type InstallationDetail = InstallationSummary & {
  uploads: Record<string, UploadMeta[]>;
  comments: Comment[];
  statusHistory: StatusHistoryEntry[];
  raw: Record<string, unknown>;
  createdByName?: string;
  createdByEmail?: string | null;
};

type UseInstallationDetailArgs = {
  open: boolean;
  installation: InstallationSummary | null;
};

export function useInstallationDetail(args: UseInstallationDetailArgs) {
  const { open, installation } = args;

  const [detail, setDetail] = useState<InstallationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusDraft, setStatusDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Basisdaten + Detail aus Backend laden
  useEffect(() => {
    if (!open || !installation) {
      setDetail(null);
      setError(null);
      setStatusDraft("");
      setCommentDraft("");
      return;
    }

    const baseDetail: InstallationDetail = {
      id: installation.id,
      customerName: installation.customerName,
      location: installation.location,
      status: installation.status,
      statusLabel: installation.statusLabel || installation.status,
      gridOperator: installation.gridOperator,
      updatedAt: installation.updatedAt,
      uploads: {},
      comments: [],
      statusHistory: [],
      raw: {},
      createdByName: undefined,
      createdByEmail: undefined,
    };

    setDetail(baseDetail);
    setStatusDraft(installation.status);
    setCommentDraft("");

    let cancelled = false;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getAccessToken();
        const res = await fetch(
          `/api/installations/${encodeURIComponent(String(installation.id))}`,
          {
            method: "GET",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!res.ok) {
          if (res.status !== 404) {
            console.warn("Installation detail not OK", res.status);
          }
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        setDetail((prev) => {
          const base = prev ?? baseDetail;
          return {
            ...base,
            status: data.status ?? base.status,
            statusLabel: data.statusLabel ?? base.statusLabel,
            gridOperator:
              typeof data.gridOperator === "string"
                ? data.gridOperator
                : base.gridOperator,
            updatedAt: data.updatedAt ?? base.updatedAt,
            uploads: data.uploads ?? base.uploads,
            comments: data.comments ?? base.comments,
            statusHistory: data.statusHistory ?? base.statusHistory,
            raw: data.raw ?? base.raw,
            createdByName: data.createdByName ?? base.createdByName,
            createdByEmail: data.createdByEmail ?? base.createdByEmail,
          };
        });
      } catch (e) {
        console.error("Error loading installation detail", e);
        if (!cancelled) {
          setError("Details konnten nicht geladen werden.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [open, installation?.id]);

  // KI-Summary (Stub – Backend-Endpoint kann später sauber implementiert werden)
  useEffect(() => {
    if (!open || !installation) {
      setAiSummary(null);
      return;
    }

    let cancelled = false;

    const fetchAiSummary = async () => {
      try {
        setAiLoading(true);
        const token = getAccessToken();
        const res = await fetch(
          `/api/installations/${encodeURIComponent(
            String(installation.id)
          )}/ai/summary`,
          {
            method: "GET",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!res.ok) {
          // Ist okay, wenn der Endpoint noch nicht existiert.
          return;
        }

        const data = (await res.json()) as { summary?: string };
        if (!cancelled) {
          setAiSummary(data.summary ?? null);
        }
      } catch (e) {
        console.warn("AI summary request failed (optional)", e);
      } finally {
        if (!cancelled) {
          setAiLoading(false);
        }
      }
    };

    fetchAiSummary();

    return () => {
      cancelled = true;
    };
  }, [open, installation?.id]);

  const saveStatusAndComment = async () => {
    if (!detail) return;
    if (!statusDraft && !commentDraft.trim()) return;

    try {
      setSaving(true);
      setError(null);

      const token = getAccessToken();
      const res = await fetch(
        `/api/installations/${encodeURIComponent(String(detail.id))}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            status: statusDraft || undefined,
            comment: commentDraft.trim() || undefined,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const updated = await res.json();

      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: updated.status ?? prev.status,
          statusLabel: updated.statusLabel ?? prev.statusLabel,
          updatedAt: updated.updatedAt ?? prev.updatedAt,
          uploads: updated.uploads ?? prev.uploads,
          comments: updated.comments ?? prev.comments,
          statusHistory: updated.statusHistory ?? prev.statusHistory,
          raw: updated.raw ?? prev.raw,
          createdByName: updated.createdByName ?? prev.createdByName,
          createdByEmail: updated.createdByEmail ?? prev.createdByEmail,
        };
      });

      if (commentDraft.trim()) {
        setCommentDraft("");
      }
    } catch (e) {
      console.error("Error updating installation", e);
      setError("Status / Kommentar konnten nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  };

  return {
    detail,
    loading,
    error,
    statusDraft,
    setStatusDraft,
    commentDraft,
    setCommentDraft,
    saving,
    saveStatusAndComment,
    aiSummary,
    aiLoading,
  };
}
