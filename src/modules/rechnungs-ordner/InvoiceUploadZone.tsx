// src/modules/rechnungs-ordner/InvoiceUploadZone.tsx
import { useCallback, useRef, useState } from "react";

interface InvoiceUploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export default function InvoiceUploadZone({ onUpload, disabled }: InvoiceUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setSuccess(null);

      if (file.type !== "application/pdf") {
        setError("Nur PDF-Dateien erlaubt");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError("Datei zu groß (max. 20 MB)");
        return;
      }

      setUploading(true);
      try {
        await onUpload(file);
        setSuccess(`"${file.name}" hochgeladen`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (e: any) {
        setError(e?.message || "Upload fehlgeschlagen");
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || uploading) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, uploading, handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile]
  );

  const zoneClass = [
    "ro-upload-zone",
    dragOver && "ro-upload-zone--active",
    (disabled || uploading) && "ro-upload-zone--disabled",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={zoneClass}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => !disabled && !uploading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={onFileChange}
        style={{ display: "none" }}
      />

      {uploading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div className="ro-spinner" />
          <span className="ro-upload-text">Wird hochgeladen...</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="ro-upload-icon">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="ro-upload-text">PDF hier ablegen oder klicken</span>
          <span className="ro-upload-hint">Max. 20 MB</span>
        </div>
      )}

      {error && <div className="ro-upload-msg ro-upload-msg--error">{error}</div>}
      {success && <div className="ro-upload-msg ro-upload-msg--success">{success}</div>}
    </div>
  );
}
