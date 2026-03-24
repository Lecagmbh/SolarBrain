/**
 * Dokumente-Tab — Liste + Upload (funktional)
 */
import { useState, useEffect, useRef } from "react";

interface Props { crmId: number; installationId?: number }
interface Dok { id: number; typ: string; titel: string; beschreibung?: string; metadata?: any; createdAt: string; url?: string; originalName?: string; source?: string }

export default function TabDokumente({ crmId, installationId }: Props) {
  const [docs, setDocs] = useState<Dok[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("baunity_token") || "";
  const hdrs = { Authorization: `Bearer ${token}` };

  const loadDocs = () => {
    if (installationId) {
      fetch(`/api/installations/${installationId}/documents`, { headers: hdrs, credentials: "include" })
        .then(r => r.ok ? r.json() : [])
        .then((result: any) => {
          const items = result.data || result || [];
          setDocs(items.map((d: any) => ({
            id: d.id, typ: "DOKUMENT", titel: d.originalName || d.dateiname || "Dokument",
            originalName: d.originalName, createdAt: d.createdAt,
            url: d.url || `/api/documents/${d.id}/download`,
            metadata: { kategorie: d.kategorie, fileSize: d.dateigroesse },
            source: "Installation",
          })));
        })
        .catch(() => {}).finally(() => setLoading(false));
    } else if (crmId) {
      Promise.all([
        fetch(`/api/crm/projekte/${crmId}/aktivitaeten`, { headers: hdrs, credentials: "include" })
          .then(r => r.ok ? r.json() : []),
        fetch(`/api/crm/projekte/${crmId}/dokumente`, { headers: hdrs, credentials: "include" })
          .then(r => r.ok ? r.json() : []).catch(() => []),
      ]).then(([acts, crmDocs]) => {
        const fromActs = (acts as any[]).filter(a => a.typ === "DOKUMENT").map((a: any) => ({
          ...a, source: "Factro",
        }));
        const fromCrm = (crmDocs as any[]).map((d: any) => ({
          id: d.id, typ: "DOKUMENT", titel: d.originalName || d.dateiname || "Dokument",
          originalName: d.originalName, createdAt: d.createdAt,
          url: d.url || `/api/crm/dokumente/${d.id}/download`,
          metadata: { kategorie: d.kategorie, fileSize: d.dateigroesse },
          source: "Upload",
        }));
        setDocs([...fromCrm, ...fromActs]);
      }).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocs(); }, [crmId, installationId]);

  const uploadFiles = async (files: FileList | File[]) => {
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    Array.from(files).forEach(f => formData.append("files", f));

    try {
      let url: string;
      if (installationId) {
        url = `/api/installations/${installationId}/documents`;
      } else if (crmId) {
        url = `/api/crm/projekte/${crmId}/dokumente`;
      } else {
        setUploadError("Kein Projekt zugeordnet");
        setUploading(false);
        return;
      }

      const resp = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
        body: formData,
      });

      if (resp.ok) {
        setUploadSuccess(`${files.length} Datei${files.length > 1 ? "en" : ""} hochgeladen`);
        setTimeout(() => setUploadSuccess(null), 4000);
        loadDocs(); // Reload
      } else {
        const err = await resp.json().catch(() => ({}));
        setUploadError(err.error || `Upload fehlgeschlagen (${resp.status})`);
      }
    } catch {
      setUploadError("Upload fehlgeschlagen — Netzwerkfehler");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      e.target.value = ""; // Reset
    }
  };

  const handleDownload = (doc: Dok) => {
    if (doc.url) {
      const sep = doc.url.includes("?") ? "&" : "?";
      const token = localStorage.getItem("token") || "";
      window.open(`${doc.url}${sep}token=${token}&view=true`, "_blank");
    }
  };

  if (loading) return <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>Laden...</div>;

  return (
    <div>
      {/* Upload Area */}
      <div
        style={{
          border: `2px dashed ${dragActive ? "#D4A843" : "rgba(212,168,67,0.15)"}`,
          borderRadius: 12, padding: "24px 20px", textAlign: "center", marginBottom: 16,
          background: dragActive ? "rgba(212,168,67,0.06)" : "rgba(212,168,67,0.02)",
          cursor: uploading ? "wait" : "pointer", transition: "all 0.2s",
        }}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.dwg,.doc,.docx,.xls,.xlsx" style={{ display: "none" }} onChange={handleFileSelect} />
        {uploading ? (
          <>
            <div style={{ fontSize: 28, marginBottom: 6 }}>⏳</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc" }}>Wird hochgeladen...</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>Dateien hier ablegen oder klicken</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>PDF, PNG, JPG, DWG, DOC, XLS — max. 20 MB</div>
          </>
        )}
      </div>

      {/* Status Messages */}
      {uploadSuccess && (
        <div style={{ marginBottom: 10, padding: "8px 14px", borderRadius: 8, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontSize: 12 }}>
          ✓ {uploadSuccess}
        </div>
      )}
      {uploadError && (
        <div style={{ marginBottom: 10, padding: "8px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 12 }}>
          ✗ {uploadError}
        </div>
      )}

      {/* Dokument-Liste */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>Dokumente ({docs.length})</div>
      {docs.map(d => {
        const meta = d.metadata as any || {};
        const fileSize = meta.fileSize ? (meta.fileSize > 1048576 ? `${(meta.fileSize / 1048576).toFixed(1)} MB` : `${Math.round(meta.fileSize / 1024)} KB`) : "";
        return (
          <div key={d.id} onClick={() => handleDownload(d)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(17,20,35,0.95)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10, marginBottom: 6, cursor: d.url ? "pointer" : "default", transition: "border-color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(212,168,67,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{(d.titel || "").replace("📄 ", "")}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>
                {meta.kategorie ? `${meta.kategorie} · ` : ""}{fileSize ? `${fileSize} · ` : ""}{new Date(d.createdAt).toLocaleDateString("de-DE")}
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: d.source === "Upload" ? "rgba(34,197,94,0.1)" : "rgba(56,189,248,0.1)", color: d.source === "Upload" ? "#22c55e" : "#38bdf8" }}>{d.source || "Factro"}</span>
            {d.url && <span style={{ fontSize: 11, color: "#a5b4fc" }}>↓</span>}
          </div>
        );
      })}
      {docs.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "#64748b", fontSize: 13 }}>Noch keine Dokumente. Lade welche hoch!</div>}
    </div>
  );
}
