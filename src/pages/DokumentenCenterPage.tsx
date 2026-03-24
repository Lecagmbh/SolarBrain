/**
 * DOKUMENTEN-CENTER V3 - ENDLVL EDITION
 * - Kompakte Sidebar mit Tabs statt endloser Liste
 * - Suchfilter und Pagination
 * - Harmoniert mit DetailPanel DocumentsTab
 * - ✅ FIX: bestaetigung_nb Mapping
 * - ✅ NEU: Klickbare "weitere" Dokumente
 * - ✅ NEU: Admin kann Dokumente löschen
 * - ✅ NEU: Event-Sync mit DetailPanel DocumentsTab
 */

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  FileText, Upload, Download, Search, RefreshCw, Loader2,
  X, CheckCircle2, AlertCircle, FolderOpen, Image, File,
  Zap, MapPin, Grid3X3, Battery, FileSpreadsheet, Camera,
  Receipt, Paperclip, ChevronRight, Eye, Plus, ShieldCheck,
  Database, Files, ChevronLeft, Clock,
  AlertTriangle, CheckCircle, List, Trash2,
} from "lucide-react";
import { apiGet, api } from "../modules/api/client";
import "./DokumentenCenterPage.css";

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT EVENTS - Sync mit DetailPanel
// ═══════════════════════════════════════════════════════════════════════════

type DocumentEventType = 'document:uploaded' | 'document:deleted' | 'document:generated' | 'documents:refresh';

interface DocumentEventDetail {
  installationId: number;
  documentId?: number;
  kategorie?: string;
}

function emitDocumentEvent(type: DocumentEventType, detail: DocumentEventDetail): void {
  window.dispatchEvent(new CustomEvent(type, { detail }));
  if (type !== 'documents:refresh') {
    window.dispatchEvent(new CustomEvent('documents:refresh', { detail }));
  }
}

function onDocumentsChanged(installationId: number, handler: () => void): () => void {
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<DocumentEventDetail>).detail;
    if (detail.installationId === installationId) {
      handler();
    }
  };
  window.addEventListener('documents:refresh', listener);
  return () => window.removeEventListener('documents:refresh', listener);
}

const documentEvents = {
  uploaded: (installationId: number, kategorie?: string) => 
    emitDocumentEvent('document:uploaded', { installationId, kategorie }),
  deleted: (installationId: number, documentId: number) =>
    emitDocumentEvent('document:deleted', { installationId, documentId }),
  refresh: (installationId: number) =>
    emitDocumentEvent('documents:refresh', { installationId }),
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Installation {
  id: number;
  publicId: string;
  customerName: string;
  location: string;
  status: string;
}

interface DocumentItem {
  id: number;
  originalName: string;
  categoryKey: string;
  kategorie: string;
  dokumentTyp?: string | null;
  size: number;
  contentType: string;
  installationId: number | null;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  isLocal?: boolean;
}

// @ts-ignore - Used for type reference
interface WizardDocument {
  id: string;
  name: string;
  filename: string;
  uploadedAt: Date | string;
  url: string;
  kategorie: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

interface DocCategory {
  key: string;
  label: string;
  icon: typeof FileText;
  color: string;
  required: boolean;
  uploadDisabled?: boolean;
  autoFromProductDb?: boolean;
}

interface AvailableDatasheet {
  type: string;
  product: string;
  hasDatasheet: boolean;
  url?: string;
  alreadyImported: boolean;
}

const CATEGORIES: DocCategory[] = [
  { key: "lageplan", label: "Lageplan", icon: MapPin, color: "#3b82f6", required: true },
  { key: "schaltplan", label: "Schaltplan", icon: Zap, color: "#EAD068", required: true },
  { key: "vde_e1", label: "E.1 Antragstellung", icon: FileText, color: "#10b981", required: true },
  { key: "vde_e2", label: "E.2 Datenblatt Erzeugung", icon: FileSpreadsheet, color: "#10b981", required: false },
  { key: "vde_e3", label: "E.3 Datenblatt Speicher", icon: Battery, color: "#10b981", required: false },
  { key: "vde_e8", label: "E.8 IBN-Protokoll", icon: CheckCircle2, color: "#10b981", required: false },
  { key: "stringplan", label: "Stringplan", icon: Grid3X3, color: "#EAD068", required: false },
  { key: "projektmappe", label: "Projektmappe", icon: Files, color: "#f59e0b", required: false },
  { key: "bestaetigung_nb", label: "Bestätigung Netzbetreiber", icon: ShieldCheck, color: "#22c55e", required: false },
  { key: "datenblatt_module", label: "Datenblatt Module", icon: Grid3X3, color: "#06b6d4", required: true, autoFromProductDb: true },
  { key: "datenblatt_wechselrichter", label: "Datenblatt WR", icon: FileSpreadsheet, color: "#06b6d4", required: false, autoFromProductDb: true },
  { key: "datenblatt_speicher", label: "Datenblatt Speicher", icon: Battery, color: "#06b6d4", required: false, autoFromProductDb: true },
  { key: "messkonzept", label: "Messkonzept", icon: FileText, color: "#ec4899", required: false },
  { key: "vollmacht", label: "Vollmacht", icon: FileText, color: "#64748b", required: false },
  { key: "foto", label: "Fotos", icon: Camera, color: "#14b8a6", required: false },
  { key: "rechnung", label: "Rechnung", icon: Receipt, color: "#a855f7", required: false, uploadDisabled: true },
  { key: "sonstiges", label: "Sonstiges", icon: Paperclip, color: "#94a3b8", required: false },
];

// Pflicht-Gruppen: Für Completeness zählt jedes Dokument in einer Gruppe
// z.B. ein beliebiges Datenblatt erfüllt die Datenblatt-Pflicht
const REQUIRED_GROUPS: { label: string; keys: string[] }[] = [
  { label: "Lageplan", keys: ["lageplan"] },
  { label: "Schaltplan", keys: ["schaltplan"] },
  { label: "Datenblätter", keys: ["datenblatt_module", "datenblatt_wechselrichter", "datenblatt_speicher", "projektmappe"] },
  { label: "Anträge / VDE", keys: ["vde_e1", "vde_e2", "vde_e3", "vde_e8", "messkonzept"] },
];

// Sidebar Filter Tabs
type SidebarFilter = "all" | "incomplete" | "complete" | "recent";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(contentType: string) {
  if (contentType?.startsWith("image/")) return Image;
  if (contentType === "application/pdf") return FileText;
  return File;
}

function toBackendKategorie(key: string): string {
  const k = key.toLowerCase();
  if (k === "lageplan") return "LAGEPLAN";
  if (k === "schaltplan") return "SCHALTPLAN";
  if (k === "projektmappe") return "PROJEKTMAPPE";
  if (k === "stringplan") return "STRINGPLAN";
  if (k === "vollmacht") return "VOLLMACHT";
  if (k === "messkonzept") return "MESSKONZEPT";
  if (k === "bestaetigung_nb") return "KORRESPONDENZ";
  if (k.startsWith("vde_")) return k.toUpperCase(); // vde_e1 -> VDE_E1
  if (k.startsWith("datenblatt_")) return "DATENBLATT";
  if (k === "rechnung") return "RECHNUNG";
  if (k === "foto") return "FOTO";
  return "SONSTIGE";
}

function mapBackendKey(kategorie: string, dateiname?: string, originalName?: string, dokumentTyp?: string | null): string {
  // 1. Erst dokumentTyp prüfen (direkt vom Wizard gesetzt!)
  if (dokumentTyp) {
    const dt = dokumentTyp.toLowerCase();
    if (dt === "schaltplan") return "schaltplan";
    if (dt === "lageplan") return "lageplan";
    if (dt === "projektmappe") return "projektmappe";
    if (dt === "stringplan") return "stringplan";
    if (dt === "vollmacht") return "vollmacht";
    if (dt === "messkonzept") return "messkonzept";
    if (dt === "vde_e1") return "vde_e1";
    if (dt === "vde_e2") return "vde_e2";
    if (dt === "vde_e3") return "vde_e3";
    if (dt === "vde_e8") return "vde_e8";
    if (dt === "datenblatt_module") return "datenblatt_module";
    if (dt === "datenblatt_wechselrichter") return "datenblatt_wechselrichter";
    if (dt === "datenblatt_speicher") return "datenblatt_speicher";
    if (dt === "foto") return "foto";
    // ✅ FIX: bestaetigung_nb hinzugefügt
    if (dt === "bestaetigung_nb") return "bestaetigung_nb";
    if (dt === "rechnung") return "rechnung";
    if (dt === "sonstiges") return "sonstiges";
  }
  
  // 2. Dann kategorie prüfen (Backend-Format)
  const k = (kategorie || "").toUpperCase();
  const filename = `${dateiname || ""} ${originalName || ""}`.toLowerCase();
  
  if (k === "LAGEPLAN") return "lageplan";
  if (k === "SCHALTPLAN") return "schaltplan";
  if (k === "DATENBLATT") return "datenblatt_module";
  if (k === "RECHNUNG") return "rechnung";
  if (k === "VOLLMACHT" || k === "VERTRAG") return "vollmacht";
  if (k === "MESSKONZEPT" || k === "ANTRAG") return "messkonzept";
  if (k === "PROJEKTMAPPE") return "projektmappe";
  if (k === "STRINGPLAN") return "stringplan";
  if (k === "FOTO") return "foto";
  // ✅ FIX: KORRESPONDENZ mit bestaetigung_nb verbinden
  if (k === "KORRESPONDENZ") {
    // Check filename for more specific match
    if (/netzbetreiber|bestätigung|bestaetigung|nb_/i.test(filename)) return "bestaetigung_nb";
    return "bestaetigung_nb"; // Default KORRESPONDENZ -> bestaetigung_nb
  }
  if (k.includes("VDE_E1") || k.includes("VDE-E1")) return "vde_e1";
  if (k.includes("VDE_E2") || k.includes("VDE-E2")) return "vde_e2";
  if (k.includes("VDE_E3") || k.includes("VDE-E3")) return "vde_e3";
  if (k.includes("VDE_E8") || k.includes("VDE-E8")) return "vde_e8";
  
  // 3. Fallback: Filename parsen
  if (filename) {
    if (/vde.?e.?1|_e1_|e\.1|antragstellung/i.test(filename)) return "vde_e1";
    if (/vde.?e.?2|_e2_|e\.2/i.test(filename) && !/speicher/i.test(filename)) return "vde_e2";
    if (/vde.?e.?3|_e3_|e\.3|speicher/i.test(filename)) return "vde_e3";
    if (/vde.?e.?8|_e8_|e\.8|ibn|protokoll/i.test(filename)) return "vde_e8";
    if (/schaltplan|uebersichtsschalt|übersichtsschalt/i.test(filename)) return "schaltplan";
    if (/lageplan/i.test(filename)) return "lageplan";
    if (/stringplan/i.test(filename)) return "stringplan";
    if (/projektmappe/i.test(filename)) return "projektmappe";
    if (/modul|panel|solar/i.test(filename)) return "datenblatt_module";
    if (/wechselrichter|inverter|wr\d/i.test(filename)) return "datenblatt_wechselrichter";
    if (/speicher|battery|akku/i.test(filename)) return "datenblatt_speicher";
    if (/vollmacht/i.test(filename)) return "vollmacht";
    if (/messkonzept/i.test(filename)) return "messkonzept";
    if (/foto|photo|bild|img/i.test(filename)) return "foto";
    // ✅ FIX: Netzbetreiber-Bestätigung erkennen
    if (/netzbetreiber|bestätigung|bestaetigung|registrierung/i.test(filename)) return "bestaetigung_nb";
  }
  
  return "sonstiges";
}

function getCompletionPercent(documents: DocumentItem[], installationId: number): number {
  const instDocs = documents.filter(d => d.installationId === installationId);
  const docKeys = new Set(instDocs.map(d => mapBackendKey(d.kategorie, undefined, d.originalName, d.dokumentTyp)));

  const fulfilled = REQUIRED_GROUPS.filter(group =>
    group.keys.some(key => docKeys.has(key))
  );

  return REQUIRED_GROUPS.length > 0
    ? Math.round((fulfilled.length / REQUIRED_GROUPS.length) * 100)
    : 100;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH HELPER - Check if user is Admin
// ═══════════════════════════════════════════════════════════════════════════

function isUserAdmin(): boolean {
  try {
    const token = localStorage.getItem("baunity_token");
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role === "ADMIN" || payload.role === "SUPERADMIN";
  } catch {
    return false;
  }
}

function isUserSubunternehmer(): boolean {
  try {
    const token = localStorage.getItem("baunity_token");
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role === "SUBUNTERNEHMER";
  } catch {
    return false;
  }
}

function getUserRole(): string {
  try {
    const token = localStorage.getItem("baunity_token");
    if (!token) return "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (payload.role || "").toUpperCase();
  } catch {
    return "";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function UploadModal({ installation, category, onClose, onSuccess }: {
  installation: Installation;
  category: DocCategory;
  onClose: () => void;
  onSuccess: (count: number) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<Record<string, "pending" | "done" | "error">>({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    let successCount = 0;

    for (const file of files) {
      setUploadStatus(prev => ({ ...prev, [file.name]: "pending" }));
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kategorie", toBackendKategorie(category.key));
        formData.append("dokumentTyp", category.key);

        await api.post(`/documents/upload/${installation.id}`, formData);
        setUploadStatus(prev => ({ ...prev, [file.name]: "done" }));
        successCount++;
      } catch (err) {
        console.error("Upload error:", err);
        setUploadStatus(prev => ({ ...prev, [file.name]: "error" }));
      }
    }

    setUploading(false);
    if (successCount > 0) {
      setTimeout(() => onSuccess(successCount), 500);
    }
  };

  const Icon = category.icon;
  const doneCount = Object.values(uploadStatus).filter(s => s === "done").length;

  return (
    <div className="dc2-modal-overlay" onClick={onClose}>
      <div className={`dc2-upload-modal ${files.length > 0 ? "dc2-upload-modal--multi" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="dc2-upload-modal-header">
          <div className="dc2-upload-modal-title">
            <div className="dc2-upload-modal-icon" style={{ background: `${category.color}15`, borderColor: `${category.color}40`, color: category.color }}>
              <Icon size={24} />
            </div>
            <div>
              <h2>{category.label} hochladen</h2>
              <p>{installation.publicId} • {installation.customerName}</p>
            </div>
          </div>
          <button className="dc2-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <input ref={fileInputRef} type="file" hidden multiple onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />

        <div
          className={`dc2-dropzone ${dragActive ? "dc2-dropzone--active" : ""} ${uploading ? "dc2-dropzone--uploading" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <Upload size={32} />
          <span>Dateien hierher ziehen</span>
          <p>oder klicken zum Auswählen</p>
        </div>

        {files.length > 0 && (
          <div className="dc2-upload-files">
            <div className="dc2-upload-files-header">
              <span>{files.length} Datei{files.length > 1 ? "en" : ""} ausgewählt</span>
              {doneCount > 0 && <span className="dc2-upload-done">{doneCount} hochgeladen</span>}
            </div>
            <div className="dc2-upload-files-list">
              {files.map((file, i) => (
                <div key={i} className={`dc2-upload-file ${uploadStatus[file.name] === "done" ? "dc2-upload-file--done" : ""} ${uploadStatus[file.name] === "error" ? "dc2-upload-file--error" : ""}`}>
                  <FileText size={16} />
                  <span className="dc2-upload-file-name">{file.name}</span>
                  <span className="dc2-upload-file-size">{formatSize(file.size)}</span>
                  {uploadStatus[file.name] === "done" ? (
                    <CheckCircle2 size={16} className="dc2-upload-file-done" />
                  ) : uploadStatus[file.name] === "error" ? (
                    <AlertCircle size={16} className="dc2-upload-file-error" />
                  ) : (
                    <button className="dc2-upload-file-remove" onClick={() => removeFile(i)} disabled={uploading}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dc2-upload-modal-footer">
          <span>PDF, JPG, PNG, DOC bis 25MB</span>
          <button className="dc2-btn dc2-btn--primary" onClick={handleUpload} disabled={files.length === 0 || uploading}>
            {uploading ? <><Loader2 size={16} className="dc2-spin" /> Lädt...</> : <><Upload size={16} /> Hochladen</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PREVIEW MODAL - Mit Delete-Funktion für Admins
// ═══════════════════════════════════════════════════════════════════════════

function PreviewModal({ doc, onClose, onDelete, isAdmin }: { 
  doc: DocumentItem; 
  onClose: () => void;
  onDelete?: (docId: number) => void;
  isAdmin?: boolean;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Token für iframe/img Requests anhängen (diese können keine Auth-Header senden)
  const token = localStorage.getItem("baunity_token");
  // Für Vorschau: view=true für inline-Anzeige
  const viewUrl = token ? doc.url + "?view=true&token=" + token : doc.url + "?view=true";
  // Für Download: nur Token
  const downloadUrl = token ? doc.url + "?token=" + token : doc.url;
  
  const isImage = doc.contentType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.url);
  const isPdf = doc.contentType === "application/pdf" || doc.url?.endsWith(".pdf");
  const FileIcon = getFileIcon(doc.contentType);

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${doc.id}`);
      onDelete(doc.id);
      onClose();
    } catch (err) {
      console.error("Delete error:", err);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="dc2-modal-overlay" onClick={onClose}>
      <div className="dc2-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="dc2-preview-modal-header">
          <div className="dc2-preview-modal-info">
            <FileIcon size={24} />
            <div>
              <h3>{doc.originalName}</h3>
              <p>{formatSize(doc.size)} • {formatDate(doc.uploadedAt)}</p>
            </div>
          </div>
          <button className="dc2-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="dc2-preview-content">
          {isPdf ? (
            <iframe src={viewUrl} title={doc.originalName} />
          ) : isImage ? (
            <img src={viewUrl} alt={doc.originalName} />
          ) : (
            <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
              <FileIcon size={64} />
              <p style={{ marginTop: 16 }}>Vorschau nicht verfügbar</p>
            </div>
          )}
        </div>

        <div className="dc2-preview-modal-footer">
          {/* Admin Delete Button */}
          {isAdmin && onDelete && (
            confirmDelete ? (
              <div className="dc2-delete-confirm">
                <span>Wirklich löschen?</span>
                <button 
                  className="dc2-btn dc2-btn--danger" 
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 size={16} className="dc2-spin" /> : <Trash2 size={16} />}
                  Ja, löschen
                </button>
                <button 
                  className="dc2-btn dc2-btn--secondary" 
                  onClick={() => setConfirmDelete(false)}
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <button 
                className="dc2-btn dc2-btn--danger-outline" 
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={16} /> Löschen
              </button>
            )
          )}
          
          <div className="dc2-preview-modal-footer-right">
            <button className="dc2-btn dc2-btn--secondary" onClick={onClose}>Schließen</button>
            <a href={downloadUrl} download className="dc2-btn dc2-btn--secondary"><Download size={16} /> Download</a>
            <a href={viewUrl} target="_blank" rel="noreferrer" className="dc2-btn dc2-btn--primary"><Eye size={16} /> Öffnen</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY DETAIL MODAL - Zeigt alle Dokumente einer Kategorie
// ═══════════════════════════════════════════════════════════════════════════

function CategoryDetailModal({ 
  category, 
  documents, 
  installation,
  onClose, 
  onPreview,
  onUpload,
  isAdmin,
  onDelete 
}: { 
  category: DocCategory;
  documents: DocumentItem[];
  installation: Installation;
  onClose: () => void;
  onPreview: (doc: DocumentItem) => void;
  onUpload: () => void;
  isAdmin: boolean;
  onDelete: (docId: number) => void;
}) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const Icon = category.icon;

  const handleDelete = async (docId: number) => {
    setDeletingId(docId);
    try {
      await api.delete(`/documents/${docId}`);
      onDelete(docId);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dc2-modal-overlay" onClick={onClose}>
      <div className="dc2-category-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="dc2-category-detail-header">
          <div className="dc2-category-detail-title">
            <div className="dc2-category-detail-icon" style={{ background: `${category.color}15`, borderColor: `${category.color}40`, color: category.color }}>
              <Icon size={24} />
            </div>
            <div>
              <h2>{category.label}</h2>
              <p>{installation.publicId} • {documents.length} Dokument{documents.length !== 1 ? "e" : ""}</p>
            </div>
          </div>
          <button className="dc2-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="dc2-category-detail-list">
          {documents.length === 0 ? (
            <div className="dc2-category-detail-empty">
              <FolderOpen size={48} />
              <p>Keine Dokumente in dieser Kategorie</p>
            </div>
          ) : (
            documents.map(doc => {
              const FileIcon = getFileIcon(doc.contentType);
              return (
                <div key={doc.id} className="dc2-category-detail-item">
                  <button 
                    className="dc2-category-detail-item-main"
                    onClick={() => onPreview(doc)}
                  >
                    <FileIcon size={20} />
                    <div className="dc2-category-detail-item-info">
                      <span className="dc2-category-detail-item-name">{doc.originalName}</span>
                      <span className="dc2-category-detail-item-meta">
                        {formatSize(doc.size)} • {formatDate(doc.uploadedAt)} • {doc.uploadedBy}
                      </span>
                    </div>
                    <Eye size={18} className="dc2-category-detail-item-preview" />
                  </button>
                  {isAdmin && (
                    <button 
                      className="dc2-category-detail-item-delete"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      title="Dokument löschen"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 size={16} className="dc2-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="dc2-category-detail-footer">
          {!category.uploadDisabled && (
            <button className="dc2-btn dc2-btn--primary" onClick={onUpload}>
              <Upload size={16} /> Hochladen
            </button>
          )}
          <button className="dc2-btn dc2-btn--secondary" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`dc2-toast dc2-toast--${type}`}>
      {type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
      <span>{message}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function DokumentenCenterPage() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstId, setSelectedInstId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [uploadModal, setUploadModal] = useState<DocCategory | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  // NEW: Category Detail Modal
  const [categoryDetailModal, setCategoryDetailModal] = useState<DocCategory | null>(null);
  
  // NEW: Sidebar Filter & Pagination
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const itemsPerPage = 8;

  // Check if current user is admin
  const isAdmin = useMemo(() => isUserAdmin(), []);
  
  // 🔥 Check if current user is Subunternehmer
  const isSubunternehmer = useMemo(() => isUserSubunternehmer(), []);
  
  // 🔥 Gefilterte Kategorien - Rechnungen für Subunternehmer ausblenden
  const FILTERED_CATEGORIES = useMemo(() => {
    if (isSubunternehmer) {
      return CATEGORIES.filter(c => c.key !== "rechnung");
    }
    return CATEGORIES;
  }, [isSubunternehmer]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [instRes, docsRes] = await Promise.all([
        apiGet("/installations/enterprise?limit=500"),
        apiGet("/documents"),
      ]);

      const instData = instRes?.data || instRes || [];
      setInstallations(instData.map((i: any) => ({
        id: i.id,
        publicId: i.publicId || "",
        customerName: typeof i.customerName === 'object' 
          ? (i.customerName?.name || i.customerName?.firma || "Unbekannt")
          : (i.customerName || i.kunde?.name || i.kunde?.firma || "Unbekannt"),
        location: i.location || `${i.plz || ""} ${i.ort || ""}`.trim() || "—",
        status: i.status || "",
      })));

      const docsData = docsRes?.data || docsRes || [];
      setDocuments(docsData.map((d: any) => ({
        id: d.id,
        originalName: String(d.originalName || d.dateiname || "Dokument"),
        categoryKey: mapBackendKey(d.kategorie, d.dateiname, d.originalName, d.dokumentTyp),
        kategorie: String(d.kategorie || "SONSTIGE"),
        dokumentTyp: d.dokumentTyp ? String(d.dokumentTyp) : null,
        size: Number(d.size || d.groesse || d.dateigroesse || 0),
        contentType: String(d.contentType || d.dateityp || d.mimeType || "application/octet-stream"),
        installationId: d.installationId,
        uploadedBy: typeof d.uploadedBy === 'object' 
          ? (d.uploadedBy?.name || d.uploadedBy?.email || "System")
          : (d.uploadedBy || d.createdByName || "System"),
        uploadedAt: d.uploadedAt || d.createdAt || new Date().toISOString(),
        url: d.url || `/api/documents/${d.id}/download`,
      })));
    } catch (err) {
      console.error("Load error:", err);
      setToast({ message: "Fehler beim Laden", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Subscribe to external document events (from DetailPanel DocumentsTab)
  useEffect(() => {
    if (!selectedInstId) return;
    const unsubscribe = onDocumentsChanged(selectedInstId, () => {
      loadData();
    });
    return unsubscribe;
  }, [selectedInstId, loadData]);

  // Handle document deletion
  const handleDocumentDeleted = useCallback((docId: number) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    setToast({ message: "Dokument gelöscht", type: "success" });
    // Emit event for DetailPanel DocumentsTab sync
    if (selectedInstId) {
      documentEvents.deleted(selectedInstId, docId);
    }
  }, [selectedInstId]);

  // Filter & Sort Installations
  const filteredInstallations = useMemo(() => {
    let filtered = installations;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i =>
        i.publicId.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    }

    // Tab filter
    if (sidebarFilter === "incomplete") {
      filtered = filtered.filter(i => getCompletionPercent(documents, i.id) < 100);
    } else if (sidebarFilter === "complete") {
      filtered = filtered.filter(i => getCompletionPercent(documents, i.id) === 100);
    } else if (sidebarFilter === "recent") {
      // Sort by most recent activity (installations with recent docs)
      filtered = [...filtered].sort((a, b) => {
        const aRecent = documents.filter(d => d.installationId === a.id).sort((x, y) => new Date(y.uploadedAt).getTime() - new Date(x.uploadedAt).getTime())[0];
        const bRecent = documents.filter(d => d.installationId === b.id).sort((x, y) => new Date(y.uploadedAt).getTime() - new Date(x.uploadedAt).getTime())[0];
        return (bRecent ? new Date(bRecent.uploadedAt).getTime() : 0) - (aRecent ? new Date(aRecent.uploadedAt).getTime() : 0);
      });
    }

    return filtered;
  }, [installations, documents, search, sidebarFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredInstallations.length / itemsPerPage);
  const paginatedInstallations = filteredInstallations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filter changes
  useEffect(() => { setCurrentPage(1); }, [search, sidebarFilter]);

  const selectedInst = installations.find(i => i.id === selectedInstId);
  const instDocs = useMemo(() =>
    documents.filter(d => d.installationId === selectedInstId),
    [documents, selectedInstId]
  );

  const docsByCategory = useMemo(() => {
    const map: Record<string, DocumentItem[]> = {};
    FILTERED_CATEGORIES.forEach(c => map[c.key] = []);
    instDocs.forEach(doc => {
      const key = mapBackendKey(doc.kategorie, undefined, doc.originalName, doc.dokumentTyp);
      // 🔥 Rechnungen für Subunternehmer komplett ausblenden (nicht in Sonstiges)
      if (isSubunternehmer && (key === "rechnung" || doc.kategorie === "RECHNUNG")) {
        return; // Skip this document
      }
      if (map[key]) map[key].push(doc);
      else map["sonstiges"].push(doc);
    });
    return map;
  }, [instDocs, FILTERED_CATEGORIES, isSubunternehmer]);

  const stats = useMemo(() => ({
    totalDocs: instDocs.length,
    totalSize: instDocs.reduce((s, d) => s + (d.size || 0), 0),
    completion: selectedInstId ? getCompletionPercent(documents, selectedInstId) : 0,
  }), [instDocs, documents, selectedInstId]);

  // Available datasheets from Product-DB
  const [availableDatasheets, setAvailableDatasheets] = useState<AvailableDatasheet[]>([]);
  const [importingDatasheets, setImportingDatasheets] = useState(false);

  useEffect(() => {
    if (!selectedInstId) {
      setAvailableDatasheets([]);
      return;
    }
    apiGet(`/documents/available-datasheets/${selectedInstId}`)
      .then((res) => setAvailableDatasheets(res.available || []))
      .catch(() => setAvailableDatasheets([]));
  }, [selectedInstId, documents]);

  const handleImportDatasheets = async () => {
    if (!selectedInstId) return;
    setImportingDatasheets(true);
    try {
      const res = await api.post("/documents/import-from-product-db", { installationId: selectedInstId });
      const data = res.data;
      if (data.imported?.length > 0) {
        setToast({ message: `${data.imported.length} Datenblatt(er) importiert!`, type: "success" });
        loadData();
      } else {
        setToast({ message: data.message || "Keine neuen Datenblätter gefunden", type: "error" });
      }
    } catch (e: any) {
      setToast({ message: e?.response?.data?.error || "Import fehlgeschlagen", type: "error" });
    } finally {
      setImportingDatasheets(false);
    }
  };

  const canImportDatasheets = availableDatasheets.some(d => d.hasDatasheet && !d.alreadyImported);

  // Stats for tabs
  const incompleteCount = installations.filter(i => getCompletionPercent(documents, i.id) < 100).length;
  const completeCount = installations.filter(i => getCompletionPercent(documents, i.id) === 100).length;

  return (
    <div className="dc2-container">
      {/* Header */}
      <header className="dc2-header">
        <div className="dc2-header-bg">
          <div className="dc2-orb dc2-orb--1" />
          <div className="dc2-orb dc2-orb--2" />
          <div className="dc2-orb dc2-orb--3" />
        </div>
        <div className="dc2-header-content">
          <div className="dc2-header-left">
            <div className="dc2-header-icon">
              <FolderOpen size={28} />
            </div>
            <div>
              <h1>Dokumenten-Center</h1>
              <p>Pflicht: Lageplan, Schaltplan, Datenblatt, Antrag</p>
            </div>
          </div>
          <div className="dc2-header-stats">
            <div className="dc2-stat">
              <span className="dc2-stat-value">{loading ? "—" : installations.length}</span>
              <span className="dc2-stat-label">INSTALLATIONEN</span>
            </div>
            <div className="dc2-stat">
              <span className="dc2-stat-value">{loading ? "—" : documents.length}</span>
              <span className="dc2-stat-label">DOKUMENTE</span>
            </div>
            <div className={`dc2-stat ${incompleteCount === 0 ? "dc2-stat--success" : "dc2-stat--warning"}`}>
              <span className="dc2-stat-value">{loading ? "—" : incompleteCount}</span>
              <span className="dc2-stat-label">UNVOLLSTÄNDIG</span>
            </div>
          </div>
        </div>
      </header>

      <div className="dc2-main">
        {/* Sidebar - Compact with Tabs */}
        <aside className={`dc2-sidebar ${sidebarCollapsed ? "dc2-sidebar--collapsed" : ""}`}>
          {/* Collapse Toggle */}
          <button className="dc2-sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {!sidebarCollapsed && (
            <>
              {/* Search */}
              <div className="dc2-sidebar-search">
                <Search size={18} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..." />
                {search && <button onClick={() => setSearch("")}><X size={16} /></button>}
              </div>

              {/* Filter Tabs */}
              <div className="dc2-sidebar-tabs">
                <button
                  className={`dc2-sidebar-tab ${sidebarFilter === "all" ? "dc2-sidebar-tab--active" : ""}`}
                  onClick={() => setSidebarFilter("all")}
                >
                  <List size={14} />
                  <span>Alle</span>
                  <span className="dc2-sidebar-tab__count">{installations.length}</span>
                </button>
                <button
                  className={`dc2-sidebar-tab dc2-sidebar-tab--warning ${sidebarFilter === "incomplete" ? "dc2-sidebar-tab--active" : ""}`}
                  onClick={() => setSidebarFilter("incomplete")}
                >
                  <AlertTriangle size={14} />
                  <span>Offen</span>
                  <span className="dc2-sidebar-tab__count">{incompleteCount}</span>
                </button>
                <button
                  className={`dc2-sidebar-tab dc2-sidebar-tab--success ${sidebarFilter === "complete" ? "dc2-sidebar-tab--active" : ""}`}
                  onClick={() => setSidebarFilter("complete")}
                >
                  <CheckCircle size={14} />
                  <span>Fertig</span>
                  <span className="dc2-sidebar-tab__count">{completeCount}</span>
                </button>
                <button
                  className={`dc2-sidebar-tab ${sidebarFilter === "recent" ? "dc2-sidebar-tab--active" : ""}`}
                  onClick={() => setSidebarFilter("recent")}
                >
                  <Clock size={14} />
                  <span>Aktuell</span>
                </button>
              </div>

              {/* Installation List */}
              <div className="dc2-inst-list">
                {loading ? (
                  <div className="dc2-inst-loading"><Loader2 size={24} className="dc2-spin" /></div>
                ) : paginatedInstallations.length === 0 ? (
                  <div className="dc2-inst-empty">
                    <FolderOpen size={32} />
                    <span>Keine Installationen</span>
                  </div>
                ) : (
                  paginatedInstallations.map((inst) => {
                    const completion = getCompletionPercent(documents, inst.id);
                    const docCount = documents.filter(d => d.installationId === inst.id).length;
                    const isActive = selectedInstId === inst.id;

                    return (
                      <button
                        key={inst.id}
                        className={`dc2-inst-card ${isActive ? "dc2-inst-card--active" : ""} ${completion === 100 ? "dc2-inst-card--complete" : ""}`}
                        onClick={() => setSelectedInstId(inst.id)}
                      >
                        <div className="dc2-inst-card-row">
                          <span className="dc2-inst-card-id">{inst.publicId}</span>
                          <span className={`dc2-inst-card-badge ${completion === 100 ? "dc2-inst-card-badge--success" : "dc2-inst-card-badge--warning"}`}>
                            {completion}%
                          </span>
                        </div>
                        <div className="dc2-inst-card-name">{inst.customerName}</div>
                        <div className="dc2-inst-card-meta">
                          <span>{inst.location}</span>
                          <span>{docCount} Dok.</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="dc2-sidebar-pagination">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span>{currentPage} / {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </aside>

        {/* Main Content */}
        <main className="dc2-content">
          {selectedInst ? (
            <>
              {/* Selected Installation Header */}
              <div className="dc2-content-header">
                <div className="dc2-content-header-info">
                  <span className="dc2-content-header-id">{selectedInst.publicId}</span>
                  <span className="dc2-content-header-name">{selectedInst.customerName}</span>
                  <span className="dc2-content-header-location">{selectedInst.location}</span>
                </div>
                <div className="dc2-content-header-stats">
                  <div className="dc2-mini-stat">
                    <span>{stats.totalDocs}</span>
                    <label>Dok.</label>
                  </div>
                  <div className="dc2-mini-stat">
                    <span>{formatSize(stats.totalSize)}</span>
                    <label>Größe</label>
                  </div>
                  <div className={`dc2-mini-stat ${stats.completion === 100 ? "dc2-mini-stat--success" : "dc2-mini-stat--warning"}`}>
                    <span>{stats.completion}%</span>
                    <label>Pflicht</label>
                  </div>
                </div>
                <div className="dc2-content-header-actions">
                  {canImportDatasheets && (
                    <button 
                      className="dc2-btn dc2-btn--import"
                      onClick={handleImportDatasheets}
                      disabled={importingDatasheets}
                    >
                      {importingDatasheets ? (
                        <><Loader2 size={16} className="dc2-spin" /> Importiere...</>
                      ) : (
                        <><Database size={16} /> Datenblätter aus Produkt-DB</>
                      )}
                    </button>
                  )}
                  <button className="dc2-refresh-btn" onClick={loadData} disabled={loading}>
                    <RefreshCw size={18} className={loading ? "dc2-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* Category Grid */}
              <div className="dc2-category-grid">
                {FILTERED_CATEGORIES.map((cat, idx) => {
                  const catDocs = docsByCategory[cat.key] || [];
                  const isEmpty = catDocs.length === 0;
                  const isMissing = cat.required && isEmpty;
                  const Icon = cat.icon;

                  return (
                    <div 
                      key={cat.key}
                      className={`dc2-category-card ${isMissing ? "dc2-category-card--missing" : ""} ${catDocs.length > 0 ? "dc2-category-card--has-docs" : ""}`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <div className="dc2-category-header">
                        <div className="dc2-category-icon" style={{ background: `${cat.color}15`, borderColor: `${cat.color}30` }}>
                          <Icon size={20} style={{ color: cat.color }} />
                        </div>
                        <div className="dc2-category-info">
                          <h3>{cat.label}</h3>
                          <p>
                            {catDocs.length} Dokument{catDocs.length !== 1 ? "e" : ""}
                            {cat.required && (
                              <span className={isMissing ? "dc2-tag-required" : "dc2-tag-complete"}>
                                {isMissing ? "Pflicht!" : "✓"}
                              </span>
                            )}
                          </p>
                        </div>
                        {!cat.uploadDisabled && (
                          <button 
                            className="dc2-category-upload"
                            onClick={() => setUploadModal(cat)}
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </div>

                      {catDocs.length > 0 && (
                        <div className="dc2-category-docs">
                          {catDocs.slice(0, 3).map(doc => {
                            const FileIcon = getFileIcon(doc.contentType);
                            return (
                              <button 
                                key={doc.id}
                                className="dc2-doc-item"
                                onClick={() => setPreviewDoc(doc)}
                              >
                                <FileIcon size={16} />
                                <span>{doc.originalName}</span>
                                <ChevronRight size={14} />
                              </button>
                            );
                          })}
                          {/* ✅ FIX: Klickbare "weitere" Anzeige */}
                          {catDocs.length > 3 && (
                            <button 
                              className="dc2-doc-more"
                              onClick={() => setCategoryDetailModal(cat)}
                            >
                              +{catDocs.length - 3} weitere anzeigen
                            </button>
                          )}
                        </div>
                      )}

                      {isEmpty && !cat.uploadDisabled && (
                        <button 
                          className="dc2-category-empty"
                          onClick={() => setUploadModal(cat)}
                        >
                          <Upload size={18} />
                          <span>Hochladen</span>
                        </button>
                      )}

                      {isEmpty && cat.uploadDisabled && (
                        <div className="dc2-category-auto">
                          Wird automatisch erstellt
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="dc2-empty-state">
              <FolderOpen size={64} />
              <h2>Keine Installation ausgewählt</h2>
              <p>Wähle links eine Installation aus</p>
            </div>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {uploadModal && selectedInst && (
        <UploadModal
          installation={selectedInst}
          category={uploadModal}
          onClose={() => setUploadModal(null)}
          onSuccess={(count) => {
            setUploadModal(null);
            setToast({ message: `${count} Dokument${count > 1 ? "e" : ""} hochgeladen!`, type: "success" });
            // Emit event for DetailPanel DocumentsTab sync
            documentEvents.uploaded(selectedInst.id, uploadModal.key);
            loadData();
          }}
        />
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <PreviewModal 
          doc={previewDoc} 
          onClose={() => setPreviewDoc(null)}
          isAdmin={isAdmin}
          onDelete={handleDocumentDeleted}
        />
      )}

      {/* ✅ NEU: Category Detail Modal */}
      {categoryDetailModal && selectedInst && (
        <CategoryDetailModal
          category={categoryDetailModal}
          documents={docsByCategory[categoryDetailModal.key] || []}
          installation={selectedInst}
          onClose={() => setCategoryDetailModal(null)}
          onPreview={(doc) => {
            setCategoryDetailModal(null);
            setPreviewDoc(doc);
          }}
          onUpload={() => {
            setCategoryDetailModal(null);
            setUploadModal(categoryDetailModal);
          }}
          isAdmin={isAdmin}
          onDelete={handleDocumentDeleted}
        />
      )}

      {/* Toast */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
