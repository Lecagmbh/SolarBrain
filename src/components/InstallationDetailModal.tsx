import React, { useEffect, useState } from "react";
import { useAuth } from "../modules/auth/AuthContext";
import { getAccessToken } from "../modules/auth/tokenStorage";

/* ===================== TYPES ===================== */

export type InstallationSummary = {
  id: number;
  customerName: string;
  location: string;
  status: string;
  statusLabel: string;
  gridOperator: string | null;
  updatedAt: string;
};

type UploadMeta = {
  filename: string;
  contentType?: string | null;
  size?: number | null;
};

type InstallationDetail = InstallationSummary & {
  uploads: Record<string, UploadMeta[]>;
};

type TabKey = "overview" | "documents" | "emails" | "history";

type Props = {
  open: boolean;
  installation: InstallationSummary | null;
  onClose: () => void;
};

/* ===================== UPLOADS ===================== */

type UploadBucketKey = "images" | "documents" | "invoices" | "other";

type UploadGroup = {
  groupKey: string;
  files: UploadMeta[];
};

const detectBucket = (groupKey: string, files: UploadMeta[]): UploadBucketKey => {
  const key = groupKey.toLowerCase();

  if (files.some((f) => (f.contentType ?? "").startsWith("image/")))
    return "images";
  if (key.includes("rechnung") || key.includes("invoice")) return "invoices";
  if (files.some((f) => f.filename.toLowerCase().endsWith(".pdf")))
    return "documents";

  return "other";
};

const bucketUploads = (
  uploads: Record<string, UploadMeta[]>
): Record<UploadBucketKey, UploadGroup[]> => {
  const out: Record<UploadBucketKey, UploadGroup[]> = {
    images: [],
    documents: [],
    invoices: [],
    other: [],
  };

  Object.entries(uploads).forEach(([k, files]) => {
    out[detectBucket(k, files)].push({ groupKey: k, files });
  });

  return out;
};

/* ===================== COMPONENT ===================== */

const InstallationDetailModal: React.FC<Props> = ({
  open,
  installation,
  onClose,
}) => {
  useAuth(); // Kontext bewusst geladen (Session)

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [detail, setDetail] = useState<InstallationDetail | null>(null);

  useEffect(() => {
    if (!open || !installation) {
      setDetail(null);
      setActiveTab("overview");
      return;
    }

    const fetchDetail = async () => {
      try {
        const token = getAccessToken();
        const res = await fetch(
          `/admin-api/installations/${installation.id}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (!res.ok) return;
        const data = await res.json();
        setDetail(data);
      } catch {
        /* bewusst leer */
      }
    };

    fetchDetail();
  }, [open, installation]);

  if (!open || !detail) return null;

  const uploadBuckets = bucketUploads(detail.uploads ?? {});

  const handleDownload = async (groupKey: string, filename: string) => {
    const token = getAccessToken();
    const res = await fetch(
      `/admin-api/installations/${detail.id}/files/${groupKey}/${filename}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    const blob = await res.blob();
    const { downloadFile } = await import("@/utils/desktopDownload");
    await downloadFile({ filename, blob });
  };

  return (
    <div className="installation-modal-backdrop" onClick={onClose}>
      <div
        className="installation-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="installation-modal-header">
          <h2>{detail.customerName}</h2>
          <button onClick={onClose}>Schließen</button>
        </header>

        <div className="installation-tabs">
          {(["overview", "documents", "emails", "history"] as TabKey[]).map(
            (t) => (
              <button
                key={t}
                className={
                  "installation-tab" +
                  (activeTab === t ? " installation-tab--active" : "")
                }
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            )
          )}
        </div>

        {activeTab === "overview" && (
          <div className="installation-overview">
            <p>
              <strong>Adresse:</strong> {detail.location}
            </p>
            <p>
              <strong>Status:</strong> {detail.statusLabel}
            </p>
            <p>
              <strong>Netzbetreiber:</strong>{" "}
              {detail.gridOperator || "–"}
            </p>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="installation-docs">
            {Object.keys(detail.uploads ?? {}).length ? (
              Object.entries(uploadBuckets).map(([bucket, groups]) =>
                groups.length ? (
                  <section key={bucket}>
                    <h4>{bucket}</h4>
                    {groups.map((g) =>
                      g.files.map((f) => (
                        <button
                          key={f.filename}
                          className="detail-upload-link"
                          onClick={() =>
                            handleDownload(g.groupKey, f.filename)
                          }
                        >
                          {f.filename}
                        </button>
                      ))
                    )}
                  </section>
                ) : null
              )
            ) : (
              <p className="detail-muted">Keine Dokumente vorhanden.</p>
            )}
          </div>
        )}

        {activeTab === "emails" && (
          <div className="installation-emails">
            <p className="detail-muted">
              E-Mail-Ansicht wird später ergänzt.
            </p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="installation-history">
            <p className="detail-muted">
              Historie ist in diesem Modus deaktiviert.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallationDetailModal;
