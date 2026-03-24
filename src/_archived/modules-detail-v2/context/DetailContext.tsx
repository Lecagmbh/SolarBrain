import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import type {
  InstallationDetail,
  InstallationStatus,
  TabKey,
  UploadProgress,
  UploadMeta,
  Email,
  DocumentCategory,
} from "../types";

import { getAccessToken } from "../../../auth/tokenStorage";

/* ======================================================
   HELPERS
====================================================== */

function normalizeStatus(status: string): InstallationStatus {
  switch ((status || "").toLowerCase()) {
    case "eingereicht":
    case "eingegangen":
      return "eingegangen";
    case "in_pruefung":
    case "prüfung":
      return "in_pruefung";
    case "warten_auf_nb":
      return "beim_netzbetreiber";
    case "abgeschlossen":
      return "freigegeben";
    default:
      return "entwurf";
  }
}

function safeJson<T = any>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === "object") return val as T;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

/* ======================================================
   CONTEXT TYPES
====================================================== */

interface DetailContextValue {
  detail: InstallationDetail | null;
  loading: boolean;
  error: string | null;

  reload: () => Promise<void>;
  updateStatus: (status: InstallationStatus, comment?: string) => Promise<void>;
  addComment: (message: string, isInternal?: boolean) => Promise<void>;

  uploadDocument: (
    file: File,
    category?: DocumentCategory,
    dokumentTyp?: string
  ) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;

  assignEmail: (emailId: string) => Promise<void>;
  unassignEmail: (emailId: string) => Promise<void>;

  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;

  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  previewDocument: UploadMeta | null;
  setPreviewDocument: (doc: UploadMeta | null) => void;

  previewEmail: Email | null;
  setPreviewEmail: (email: Email | null) => void;

  uploads: UploadProgress[];
  isUploading: boolean;
}

const DetailContext = createContext<DetailContextValue | undefined>(undefined);

/* ======================================================
   PROVIDER
====================================================== */

export function DetailProvider({
  installationId,
  initialTab = "overview",
  children,
}: {
  installationId: number;
  initialTab?: TabKey;
  children: ReactNode;
}) {
  const [detail, setDetail] = useState<InstallationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [previewDocument, setPreviewDocument] = useState<UploadMeta | null>(null);
  const [previewEmail, setPreviewEmail] = useState<Email | null>(null);

  // ✅ FIX: setUploads entfernt
  const [uploads] = useState<UploadProgress[]>([]);
  const isUploading = uploads.some((u) => u.status === "uploading");

  /* ================= LOAD ================= */

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAccessToken();

      const res = await fetch(`/api/installations/${installationId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();

      const wizardContext = safeJson(raw.wizardContext, {});
      const technicalData = safeJson(raw.technicalData, {});

      setDetail({
        ...raw,
        status: normalizeStatus(raw.status),
        wizardContext,
        technicalData,
        storage: raw.storage ?? null,
        wallbox: raw.wallbox ?? null,
        heatpump: raw.heatpump ?? null,
      });
    } catch (e) {
      console.error(e);
      setError("Daten konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => {
    reload();
  }, [reload]);

  /* ================= ACTIONS ================= */

  const updateStatus = async (status: InstallationStatus, comment?: string) => {
    if (!detail) return;
    const token = getAccessToken();
    await fetch(`/api/installations/${detail.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status, comment }),
    });
    await reload();
  };

  const addComment = async (message: string, isInternal?: boolean) => {
    if (!detail) return;
    const token = getAccessToken();
    await fetch(`/api/installations/${detail.id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, isInternal }),
    });
    await reload();
  };

  return (
    <DetailContext.Provider
      value={{
        detail,
        loading,
        error,
        reload,
        updateStatus,
        addComment,
        uploadDocument: async () => {},
        deleteDocument: async () => {},
        assignEmail: async () => {},
        unassignEmail: async () => {},
        activeTab,
        setActiveTab,
        commandPaletteOpen,
        setCommandPaletteOpen,
        previewDocument,
        setPreviewDocument,
        previewEmail,
        setPreviewEmail,
        uploads,
        isUploading,
      }}
    >
      {children}
    </DetailContext.Provider>
  );
}

/* ======================================================
   HOOK
====================================================== */

export function useDetail() {
  const ctx = useContext(DetailContext);
  if (!ctx) {
    throw new Error("useDetail must be used within DetailProvider");
  }
  return ctx;
}
