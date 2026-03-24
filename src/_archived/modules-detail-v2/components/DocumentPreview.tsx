// ============================================================================
// Baunity Installation Detail V2 - Document Preview Modal
// ============================================================================

import { useEffect } from "react";
import { useDetail } from "../context/DetailContext";
import { getAccessToken } from "../../../auth/tokenStorage";
import { formatFileSize, getFileIcon } from "../utils";

function authUrl(url: string): string {
  const token = getAccessToken();
  if (!token) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

export default function DocumentPreview() {
  const { previewDocument, setPreviewDocument } = useDetail();

  // Close on ESC
  useEffect(() => {
    if (!previewDocument) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPreviewDocument(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [previewDocument, setPreviewDocument]);

  if (!previewDocument) return null;

  const isPdf =
    previewDocument.contentType === "application/pdf" ||
    previewDocument.filename.toLowerCase().endsWith(".pdf");
  const isImage =
    previewDocument.contentType?.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(previewDocument.filename);

  const fileUrl = authUrl(previewDocument.url || `/api/documents/${previewDocument.id}`);

  return (
    <div
      className="ld-preview-backdrop"
      onClick={() => setPreviewDocument(null)}
    >
      <div className="ld-preview-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className="ld-preview-close"
          onClick={() => setPreviewDocument(null)}
        >
          ✕
        </button>

        {/* File Info Header */}
        <div
          style={{
            position: "absolute",
            top: -40,
            left: 0,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "var(--ld-text-secondary)",
            fontSize: 14,
          }}
        >
          <span style={{ fontSize: 20 }}>
            {getFileIcon(previewDocument.filename, previewDocument.contentType)}
          </span>
          <span>{previewDocument.filename}</span>
          {previewDocument.size && (
            <span style={{ color: "var(--ld-text-muted)" }}>
              • {formatFileSize(previewDocument.size)}
            </span>
          )}
        </div>

        {/* Preview Content */}
        {isPdf ? (
          <iframe
            src={`${fileUrl}#view=FitH`}
            className="ld-preview-pdf"
            title={previewDocument.filename}
          />
        ) : isImage ? (
          <img
            src={fileUrl}
            alt={previewDocument.filename}
            className="ld-preview-image"
          />
        ) : (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--ld-text-muted)",
              background: "var(--ld-bg-elevated)",
              borderRadius: "var(--ld-radius-lg)",
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>
              {getFileIcon(previewDocument.filename, previewDocument.contentType)}
            </div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>
              Vorschau nicht verfügbar
            </div>
            <div style={{ fontSize: 13 }}>
              {previewDocument.filename}
            </div>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ld-btn ld-btn--primary"
              style={{ marginTop: 24, display: "inline-flex" }}
            >
              📥 Datei herunterladen
            </a>
          </div>
        )}

        {/* Download Link */}
        <div
          style={{
            position: "absolute",
            bottom: -40,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <a
            href={fileUrl}
            download={previewDocument.filename}
            className="ld-btn ld-btn--sm ld-btn--default"
            style={{ background: "var(--ld-bg-elevated)" }}
          >
            📥 Herunterladen
          </a>
        </div>
      </div>
    </div>
  );
}
