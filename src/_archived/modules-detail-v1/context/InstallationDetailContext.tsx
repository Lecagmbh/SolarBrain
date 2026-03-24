import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "../../../auth/AuthContext";
import {
  fetchInstallationDetail,
  patchInstallationStatus,
} from "../logic/api";

export type UploadMeta = {
  filename: string;
  size?: number | null;
  contentType?: string | null;
};

export type StatusHistoryEntry = {
  status: string;
  changedAt: string;
  changedBy: string;
  comment?: string;
};

export type Comment = {
  id: number;
  author: string;
  message: string;
  createdAt: string;
};

export type InstallationDetail = {
  id: number;
  customerName: string;
  location: string;
  status: string;
  statusLabel: string;
  gridOperator: string | null;
  updatedAt: string;

  uploads: Record<string, UploadMeta[]>;
  comments: Comment[];
  statusHistory: StatusHistoryEntry[];
  raw: Record<string, any>;
  createdByName?: string;
  createdByEmail?: string | null;
};

type Ctx = {
  detail: InstallationDetail | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  updateStatus: (
    nextStatus: string,
    comment?: string
  ) => Promise<void>;
};

const InstallationDetailContext = createContext<Ctx | undefined>(undefined);

export function InstallationDetailProvider({
  installationId,
  children,
}: {
  installationId: number;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<InstallationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const data = await fetchInstallationDetail(installationId);
      setDetail(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Fehler beim Laden der Detaildaten.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [installationId]);

  async function updateStatus(nextStatus: string, comment?: string) {
    if (!detail || !user) return;

    const payload = {
      status: nextStatus,
      comment: comment || null,
      meta: {
        changedFrom: detail.status,
        source: "frontend",
        reason: user.role === "admin" ? "manual_admin" : "workflow_step",
      },
      changedBy: {
        email: user.email,
        role: user.role,
      },
      timestamp: new Date().toISOString(),
    };

    const updated = await patchInstallationStatus(detail.id, payload);
    setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
  }

  return (
    <InstallationDetailContext.Provider
      value={{
        detail,
        loading,
        error,
        reload: load,
        updateStatus,
      }}
    >
      {children}
    </InstallationDetailContext.Provider>
  );
}

export function useInstallationDetail() {
  const ctx = useContext(InstallationDetailContext);
  if (!ctx) throw new Error("useInstallationDetail must be inside provider");
  return ctx;
}
