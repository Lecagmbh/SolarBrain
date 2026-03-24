// ============================================================================
// Baunity Installation Detail V2 - Documents Tab ENDLEVEL
// Premium Glassmorphism Design, harmoniert mit DocumentCenter
// ============================================================================

import { useState, useRef, useMemo, useCallback } from "react";
import { useDetail } from "../context/DetailContext";
import { useAuth } from "../../../auth/AuthContext";
import { api } from "../../../api/client";
import { getAccessToken } from "../../../auth/tokenStorage";
import { DOCUMENT_CATEGORIES, type DocumentCategory } from "../types";
import { formatFileSize, formatDateTime, canEditStatus } from "../utils";

/** Append auth token to URL for authenticated file access */
function authUrl(url: string | undefined | null): string {
  if (!url) return "";
  const token = getAccessToken();
  if (!token) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

// Pflichtdokumente
const REQUIRED_DOCS: DocumentCategory[] = [
  "lageplan",
  "schaltplan",
];

type ViewMode = "grid" | "list";

export default function DocumentsTab() {
  const { detail, loading, reload } = useDetail();
  const { user } = useAuth();
  const role = (user?.role ?? "kunde") as "admin" | "mitarbeiter" | "kunde";

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | "">("");
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedDocs, setSelectedDocs] = useState<Set<number>>(new Set());
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const documents = detail?.documents || [];
  const canEdit = canEditStatus(role);

  // Map backend document format
  const mappedDocuments = useMemo(() => {
    return documents.map((d: any) => ({
      id: d.id,
      filename: d.dateiname || d.originalName || "Dokument",
      originalName: d.dateiname || d.originalName || "Dokument",
      category: d.dokumentTyp || d.kategorie?.toLowerCase() || "sonstiges",
      fileSize: d.dateigroesse || d.size || 0,
      uploadedAt: d.createdAt || d.uploadedAt,
      url: d.url || `/api/documents/${d.id}/download`,
    }));
  }, [documents]);

  // Filter documents
  const filteredDocs = useMemo(() => {
    if (categoryFilter === "all") return mappedDocuments;
    return mappedDocuments.filter((d: any) => d.category === categoryFilter);
  }, [mappedDocuments, categoryFilter]);

  // Required documents status
  const requiredStatus = useMemo(() => {
    return REQUIRED_DOCS.map((cat) => ({
      category: cat,
      label: DOCUMENT_CATEGORIES[cat]?.label || cat,
      icon: "📄", // Default icon
      hasDoc: mappedDocuments.some((d: any) => d.category === cat),
    }));
  }, [mappedDocuments]);

  const completedRequired = requiredStatus.filter((r) => r.hasDoc).length;
  const totalRequired = REQUIRED_DOCS.length;
  const progressPercent = Math.round((completedRequired / totalRequired) * 100);

  // Upload handler
  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !selectedCategory) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append("installationId", String(detail?.id));
        fd.append("kategorie", selectedCategory.toUpperCase());
        fd.append("dokumentTyp", selectedCategory);
        fd.append("file", files[i]);
        
        await api.post("/documents/upload", fd);
      }
      setSelectedCategory("");
      await reload();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.error || "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  }

  // Drag & Drop
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!selectedCategory) {
      alert("Bitte wählen Sie zuerst eine Kategorie");
      return;
    }
    handleUpload(e.dataTransfer.files);
  }

  // Bulk delete
  async function handleBulkDelete() {
    if (selectedDocs.size === 0) return;
    if (!confirm(`${selectedDocs.size} Dokumente wirklich löschen?`)) return;

    for (const id of selectedDocs) {
      await api.delete(`/documents/${id}`);
    }
    setSelectedDocs(new Set());
    await reload();
  }

  // Select/Deselect
  function toggleSelect(id: number) {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedDocs(new Set(filteredDocs.map((d: any) => d.id)));
  }

  function deselectAll() {
    setSelectedDocs(new Set());
  }

  if (loading && !detail) {
    return (
      <div className="docs-loading">
        <div className="docs-skeleton" />
        <div className="docs-skeleton" />
      </div>
    );
  }

  return (
    <div className="docs-endlvl">
      <style>{styles}</style>

      {/* Header with Progress */}
      <div className="docs-header">
        <div className="docs-header-left">
          <h2 className="docs-title">
            <span className="docs-title-icon">📁</span>
            Dokumente
          </h2>
          <p className="docs-subtitle">
            {mappedDocuments.length} Dokumente • {completedRequired} von {totalRequired} Pflichtdokumenten vorhanden
          </p>
        </div>
        <div className="docs-header-right">
          <div className="docs-progress-circle" data-progress={progressPercent}>
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" />
              <circle
                cx="18"
                cy="18"
                r="16"
                strokeDasharray={`${progressPercent}, 100`}
              />
            </svg>
            <span className="docs-progress-text">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Required Documents Checklist */}
      <div className="docs-required">
        <div className="docs-required-header">
          <span className="docs-required-icon">📋</span>
          <span className="docs-required-title">Pflichtdokumente</span>
        </div>
        <div className="docs-required-grid">
          {requiredStatus.map((req) => (
            <div
              key={req.category}
              className={`docs-required-item ${req.hasDoc ? "docs-required-item--complete" : ""}`}
            >
              <span className="docs-required-item-icon">{req.icon}</span>
              <span className="docs-required-item-label">{req.label}</span>
              {req.hasDoc ? (
                <span className="docs-required-item-check">✓</span>
              ) : (
                <span className="docs-required-item-missing">—</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Zone */}
      {canEdit && (
        <div className="docs-upload">
          <div
            className={`docs-dropzone ${dragOver ? "docs-dropzone--active" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => selectedCategory && fileInputRef.current?.click()}
          >
            <div className="docs-dropzone-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="docs-dropzone-text">
              {dragOver ? (
                <strong>Datei(en) hier ablegen...</strong>
              ) : (
                <>
                  <strong>Klicken oder Dateien hierher ziehen</strong>
                  <span>PDF, JPG, PNG bis 25 MB</span>
                </>
              )}
            </div>
          </div>

          <div className="docs-upload-controls">
            <select
              className="docs-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
            >
              <option value="">Kategorie wählen...</option>
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.label}
                </option>
              ))}
            </select>
            <button
              className="docs-btn docs-btn--primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedCategory || uploading}
            >
              {uploading ? "Uploading..." : "📤 Datei auswählen"}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            style={{ display: "none" }}
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="docs-toolbar">
        <div className="docs-toolbar-left">
          {/* Category Filter */}
          <div className="docs-filter-group">
            <button
              className={`docs-filter-btn ${categoryFilter === "all" ? "docs-filter-btn--active" : ""}`}
              onClick={() => setCategoryFilter("all")}
            >
              Alle ({documents.length})
            </button>
            {Object.entries(DOCUMENT_CATEGORIES).map(([key, cat]) => {
              const count = mappedDocuments.filter((d: any) => d.category === key).length;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  className={`docs-filter-btn ${categoryFilter === key ? "docs-filter-btn--active" : ""}`}
                  onClick={() => setCategoryFilter(key as DocumentCategory)}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="docs-toolbar-right">
          {/* View Mode Toggle */}
          <div className="docs-view-toggle">
            <button
              className={`docs-view-btn ${viewMode === "grid" ? "docs-view-btn--active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid-Ansicht"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              className={`docs-view-btn ${viewMode === "list" ? "docs-view-btn--active" : ""}`}
              onClick={() => setViewMode("list")}
              title="Listen-Ansicht"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>

          {/* Bulk Actions */}
          {canEdit && selectedDocs.size > 0 && (
            <div className="docs-bulk-actions">
              <span className="docs-bulk-text">{selectedDocs.size} ausgewählt</span>
              <button className="docs-btn docs-btn--sm docs-btn--danger" onClick={handleBulkDelete}>
                🗑️ Löschen
              </button>
              <button className="docs-btn docs-btn--sm docs-btn--ghost" onClick={deselectAll}>
                ✕
              </button>
            </div>
          )}

          {canEdit && filteredDocs.length > 0 && selectedDocs.size === 0 && (
            <button className="docs-btn docs-btn--sm docs-btn--ghost" onClick={selectAll}>
              Alle auswählen
            </button>
          )}
        </div>
      </div>

      {/* Documents Grid/List */}
      {filteredDocs.length === 0 ? (
        <div className="docs-empty">
          <div className="docs-empty-icon">📂</div>
          <div className="docs-empty-text">Keine Dokumente vorhanden</div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="docs-grid">
          {filteredDocs.map((doc: any) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              selected={selectedDocs.has(doc.id)}
              onSelect={() => toggleSelect(doc.id)}
              onPreview={() => setPreviewDoc(doc)}
              onDelete={async () => {
                if (!confirm("Dokument wirklich löschen?")) return;
                await api.delete(`/documents/${doc.id}`);
                await reload();
              }}
              canEdit={canEdit}
            />
          ))}
        </div>
      ) : (
        <div className="docs-list">
          {filteredDocs.map((doc: any) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              selected={selectedDocs.has(doc.id)}
              onSelect={() => toggleSelect(doc.id)}
              onPreview={() => setPreviewDoc(doc)}
              onDelete={async () => {
                if (!confirm("Dokument wirklich löschen?")) return;
                await api.delete(`/documents/${doc.id}`);
                await reload();
              }}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOCUMENT CARD (GRID VIEW)
   ═══════════════════════════════════════════════════════════════════════════ */

function DocumentCard({ doc, selected, onSelect, onPreview, onDelete, canEdit }: any) {
  const category = DOCUMENT_CATEGORIES[doc.category as DocumentCategory];
  const fileType = (doc.filename || doc.originalName || "").split(".").pop()?.toLowerCase();

  return (
    <div className={`docs-card ${selected ? "docs-card--selected" : ""}`}>
      {canEdit && (
        <input
          type="checkbox"
          className="docs-card-checkbox"
          checked={selected}
          onChange={onSelect}
        />
      )}

      <div className="docs-card-preview" onClick={onPreview}>
        {fileType === "pdf" && <div className="docs-card-icon docs-card-icon--pdf">PDF</div>}
        {["jpg", "jpeg", "png", "gif", "webp"].includes(fileType || "") && (
          <img src={authUrl(doc.url)} alt={doc.filename} className="docs-card-image" />
        )}
        {!["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(fileType || "") && (
          <div className="docs-card-icon docs-card-icon--file">📄</div>
        )}
      </div>

      <div className="docs-card-body">
        <div className="docs-card-category">
          {category?.label || doc.category}
        </div>
        <div className="docs-card-filename" title={doc.filename || doc.originalName}>
          {doc.filename || doc.originalName || "Dokument"}
        </div>
        <div className="docs-card-meta">
          {formatFileSize(doc.fileSize)} • {formatDateTime(doc.uploadedAt)}
        </div>
      </div>

      <div className="docs-card-actions">
        <a href={authUrl(doc.url)} download className="docs-card-action" title="Download">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </a>
        <button className="docs-card-action" onClick={onPreview} title="Vorschau">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        {canEdit && (
          <button className="docs-card-action docs-card-action--danger" onClick={onDelete} title="Löschen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOCUMENT ROW (LIST VIEW)
   ═══════════════════════════════════════════════════════════════════════════ */

function DocumentRow({ doc, selected, onSelect, onPreview, onDelete, canEdit }: any) {
  const category = DOCUMENT_CATEGORIES[doc.category as DocumentCategory];
  const fileType = (doc.filename || doc.originalName || "").split(".").pop()?.toLowerCase();

  return (
    <div className={`docs-row ${selected ? "docs-row--selected" : ""}`}>
      {canEdit && (
        <input type="checkbox" className="docs-row-checkbox" checked={selected} onChange={onSelect} />
      )}

      <div className="docs-row-icon">
        {fileType === "pdf" && <span className="docs-file-badge docs-file-badge--pdf">PDF</span>}
        {["jpg", "jpeg", "png"].includes(fileType || "") && <span className="docs-file-badge docs-file-badge--img">IMG</span>}
        {!["pdf", "jpg", "jpeg", "png"].includes(fileType || "") && <span className="docs-file-badge">DOC</span>}
      </div>

      <div className="docs-row-main" onClick={onPreview}>
        <div className="docs-row-filename">{doc.filename || doc.originalName || "Dokument"}</div>
        <div className="docs-row-category">{category?.label || doc.category}</div>
      </div>

      <div className="docs-row-meta">
        <span>{formatFileSize(doc.fileSize)}</span>
        <span className="docs-row-separator">•</span>
        <span>{formatDateTime(doc.uploadedAt)}</span>
      </div>

      <div className="docs-row-actions">
        <a href={authUrl(doc.url)} download className="docs-row-action">
          📥
        </a>
        <button className="docs-row-action" onClick={onPreview}>
          👁️
        </button>
        {canEdit && (
          <button className="docs-row-action docs-row-action--danger" onClick={onDelete}>
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PREVIEW MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

function PreviewModal({ doc, onClose }: any) {
  const fileType = (doc.filename || doc.originalName || "").split(".").pop()?.toLowerCase();
  const isPDF = fileType === "pdf";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(fileType || "");

  return (
    <div className="docs-modal-overlay" onClick={onClose}>
      <div className="docs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="docs-modal-header">
          <h3 className="docs-modal-title">{doc.filename || doc.originalName || "Dokument"}</h3>
          <button className="docs-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="docs-modal-body">
          {isPDF && <iframe src={authUrl(doc.url)} className="docs-modal-iframe" />}
          {isImage && <img src={authUrl(doc.url)} alt={doc.filename || doc.originalName} className="docs-modal-image" />}
          {!isPDF && !isImage && (
            <div className="docs-modal-unsupported">
              <div className="docs-modal-unsupported-icon">📄</div>
              <p>Vorschau nicht verfügbar</p>
              <a href={authUrl(doc.url)} download className="docs-btn docs-btn--primary">
                📥 Herunterladen
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const styles = `
.docs-endlvl {
  --docs-bg: rgba(30, 41, 59, 0.5);
  --docs-border: rgba(71, 85, 105, 0.3);
  --docs-accent: #EAD068;
  --docs-success: #10b981;
  --docs-danger: #ef4444;
  --docs-text: rgba(255, 255, 255, 0.92);
  --docs-text-muted: rgba(255, 255, 255, 0.6);
  padding: 0;
}

.docs-loading {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.docs-skeleton {
  height: 200px;
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 16px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Header */
.docs-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  background: var(--docs-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--docs-border);
  border-radius: 16px;
  margin-bottom: 20px;
}

.docs-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 800;
  color: var(--docs-text);
  margin: 0 0 8px;
}

.docs-title-icon {
  font-size: 28px;
}

.docs-subtitle {
  font-size: 13px;
  color: var(--docs-text-muted);
  margin: 0;
}

.docs-progress-circle {
  position: relative;
  width: 80px;
  height: 80px;
}

.docs-progress-circle svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.docs-progress-circle circle {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
}

.docs-progress-circle circle:first-child {
  stroke: rgba(255, 255, 255, 0.1);
}

.docs-progress-circle circle:last-child {
  stroke: var(--docs-accent);
  transition: stroke-dasharray 0.5s ease;
}

.docs-progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  font-weight: 800;
  font-family: monospace;
  color: var(--docs-text);
}

/* Required Documents */
.docs-required {
  padding: 20px;
  background: var(--docs-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--docs-border);
  border-radius: 16px;
  margin-bottom: 20px;
}

.docs-required-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.docs-required-icon {
  font-size: 20px;
}

.docs-required-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--docs-text);
}

.docs-required-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.docs-required-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  transition: all 0.2s;
}

.docs-required-item--complete {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.docs-required-item-icon {
  font-size: 18px;
}

.docs-required-item-label {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--docs-text);
}

.docs-required-item-check {
  color: var(--docs-success);
  font-weight: 700;
}

.docs-required-item-missing {
  color: var(--docs-text-muted);
}

/* Upload Zone */
.docs-upload {
  padding: 20px;
  background: var(--docs-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--docs-border);
  border-radius: 16px;
  margin-bottom: 20px;
}

.docs-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 16px;
}

.docs-dropzone:hover {
  border-color: var(--docs-accent);
  background: rgba(139, 92, 246, 0.05);
}

.docs-dropzone--active {
  border-color: var(--docs-accent);
  background: rgba(139, 92, 246, 0.1);
  transform: scale(1.02);
}

.docs-dropzone-icon {
  margin-bottom: 12px;
  color: var(--docs-accent);
}

.docs-dropzone-text {
  text-align: center;
}

.docs-dropzone-text strong {
  display: block;
  font-size: 15px;
  color: var(--docs-text);
  margin-bottom: 4px;
}

.docs-dropzone-text span {
  font-size: 12px;
  color: var(--docs-text-muted);
}

.docs-upload-controls {
  display: flex;
  gap: 12px;
}

.docs-select {
  flex: 1;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--docs-text);
  font-size: 14px;
  cursor: pointer;
}

.docs-select:focus {
  outline: none;
  border-color: var(--docs-accent);
}

/* Buttons */
.docs-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.docs-btn--primary {
  background: linear-gradient(135deg, var(--docs-accent), #ec4899);
  color: white;
}

.docs-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

.docs-btn--danger {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--docs-danger);
}

.docs-btn--danger:hover {
  background: rgba(239, 68, 68, 0.25);
}

.docs-btn--ghost {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--docs-text);
}

.docs-btn--ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}

.docs-btn--sm {
  padding: 6px 12px;
  font-size: 12px;
}

.docs-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Toolbar */
.docs-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--docs-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--docs-border);
  border-radius: 16px;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.docs-toolbar-left {
  flex: 1;
}

.docs-filter-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.docs-filter-btn {
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--docs-text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.docs-filter-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.docs-filter-btn--active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2));
  border-color: rgba(139, 92, 246, 0.4);
  color: var(--docs-text);
}

.docs-toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.docs-view-toggle {
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
}

.docs-view-btn {
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--docs-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.docs-view-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--docs-text);
}

.docs-view-btn--active {
  background: rgba(139, 92, 246, 0.2);
  color: var(--docs-accent);
}

.docs-bulk-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 10px;
}

.docs-bulk-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--docs-text);
}

/* Grid View */
.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.docs-card {
  position: relative;
  background: var(--docs-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--docs-border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
}

.docs-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  border-color: rgba(139, 92, 246, 0.4);
}

.docs-card--selected {
  border-color: var(--docs-accent);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

.docs-card-checkbox {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  z-index: 2;
}

.docs-card-preview {
  height: 160px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.docs-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.docs-card-icon {
  font-size: 48px;
  font-weight: 700;
  font-family: monospace;
}

.docs-card-icon--pdf {
  color: #ef4444;
}

.docs-card-icon--file {
  font-size: 64px;
}

.docs-card-body {
  padding: 14px;
}

.docs-card-category {
  font-size: 11px;
  color: var(--docs-text-muted);
  margin-bottom: 6px;
}

.docs-card-filename {
  font-size: 13px;
  font-weight: 600;
  color: var(--docs-text);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.docs-card-meta {
  font-size: 11px;
  color: var(--docs-text-muted);
}

.docs-card-actions {
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.docs-card-action {
  padding: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 6px;
  color: var(--docs-text-muted);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.docs-card-action:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--docs-text);
}

.docs-card-action--danger:hover {
  background: rgba(239, 68, 68, 0.2);
  color: var(--docs-danger);
}

/* List View */
.docs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.docs-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: var(--docs-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--docs-border);
  border-radius: 12px;
  transition: all 0.2s;
}

.docs-row:hover {
  border-color: rgba(139, 92, 246, 0.4);
  background: rgba(139, 92, 246, 0.05);
}

.docs-row--selected {
  border-color: var(--docs-accent);
  background: rgba(139, 92, 246, 0.1);
}

.docs-row-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.docs-row-icon {
  flex-shrink: 0;
}

.docs-file-badge {
  display: inline-flex;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  color: var(--docs-text-muted);
}

.docs-file-badge--pdf {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.docs-file-badge--img {
  background: rgba(139, 92, 246, 0.2);
  color: #f0d878;
}

.docs-row-main {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.docs-row-filename {
  font-size: 14px;
  font-weight: 600;
  color: var(--docs-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.docs-row-category {
  font-size: 12px;
  color: var(--docs-text-muted);
  margin-top: 2px;
}

.docs-row-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--docs-text-muted);
}

.docs-row-separator {
  opacity: 0.5;
}

.docs-row-actions {
  display: flex;
  gap: 8px;
}

.docs-row-action {
  padding: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.docs-row-action:hover {
  background: rgba(255, 255, 255, 0.1);
}

.docs-row-action--danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Empty State */
.docs-empty {
  text-align: center;
  padding: 60px 20px;
  background: var(--docs-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--docs-border);
  border-radius: 16px;
}

.docs-empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.docs-empty-text {
  font-size: 14px;
  color: var(--docs-text-muted);
}

/* Preview Modal */
.docs-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.docs-modal {
  background: var(--docs-bg);
  backdrop-filter: blur(40px);
  border: 1px solid var(--docs-border);
  border-radius: 16px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.docs-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.docs-modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--docs-text);
  margin: 0;
}

.docs-modal-close {
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 8px;
  color: var(--docs-text-muted);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.docs-modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--docs-text);
}

.docs-modal-body {
  flex: 1;
  padding: 24px;
  overflow: auto;
}

.docs-modal-iframe {
  width: 100%;
  height: 70vh;
  border: none;
  border-radius: 12px;
}

.docs-modal-image {
  width: 100%;
  height: auto;
  border-radius: 12px;
}

.docs-modal-unsupported {
  text-align: center;
  padding: 60px 20px;
}

.docs-modal-unsupported-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.docs-modal-unsupported p {
  margin-bottom: 20px;
  color: var(--docs-text-muted);
}
`;
