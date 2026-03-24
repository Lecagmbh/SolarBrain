/**
 * Portal Documents Page
 * =====================
 * Dokumenten-Übersicht für den Endkunden.
 *
 * Features:
 * - Completeness-Banner mit 4 Pflichtdokumenten
 * - Korrekte Kategorie-Zuordnung beim Upload (dokumentTyp = category key)
 * - Status-Badges (Hochgeladen/Geprüft/Abgelehnt/Archiviert)
 * - Funktionierende Downloads + Vorschau via JWT-Token
 * - Suchfeld über alle Dokumente
 * - Dateigröße + Datum
 * - RECHNUNG ausgeblendet für Endkunden
 */

import { useState, useEffect, useMemo } from "react";
import { usePortal } from "../PortalContext";
import {
  getPortalDocuments,
  type PortalDocument,
  type DocumentCompleteness,
} from "../api";
import { getAccessToken } from "../../modules/auth/tokenStorage";
import {
  Loader2,
  AlertCircle,
  FileText,
  MapPin,
  Camera,
  FileCheck,
  ClipboardCheck,
  Mail,
  Upload,
  Eye,
  Download,
  CheckCircle,
  AlertTriangle,
  X,
  Search,
  Zap,
} from "lucide-react";
import { InlineHelp } from "../components/GuideDrawer";
import { DOCUMENT_UPLOAD_HELP } from "../data/guideData";

// ─── Kategorie-Definitionen ────────────────────────────────────────────────
// key = wird als dokumentTyp an Backend gesendet
// Backend resolveKategorieFromDokumentTyp() mappt key → enum
const DOC_CATEGORIES = [
  {
    key: "lageplan",
    label: "Lageplan",
    icon: MapPin,
    color: "#f59e0b",
    required: true,
    hint: "Übersichtsplan vom Grundstück mit Modulbelegung",
  },
  {
    key: "schaltplan",
    label: "Schaltplan",
    icon: FileText,
    color: "#3b82f6",
    required: true,
    hint: "Zählerfeld- und Übersichtsschaltplan",
  },
  {
    key: "datenblatt",
    label: "Datenblätter",
    icon: FileCheck,
    color: "#22c55e",
    required: true,
    hint: "Datenblätter von Modulen, Wechselrichter, Speicher",
  },
  {
    key: "antrag",
    label: "Anträge / VDE",
    icon: ClipboardCheck,
    color: "#a855f7",
    required: true,
    hint: "Inbetriebsetzungsantrag, VDE-Konformitätserklärung",
  },
  {
    key: "fotos_ac",
    label: "Fotos AC",
    icon: Camera,
    color: "#ec4899",
    required: false,
    hint: "Fotos vom Zählerkasten und AC-Seite",
  },
  {
    key: "fotos_dc",
    label: "Fotos DC",
    icon: Camera,
    color: "#EAD068",
    required: false,
    hint: "Fotos von Modulen, Wechselrichter, DC-Verkabelung",
  },
  {
    key: "korrespondenz",
    label: "Korrespondenz",
    icon: Mail,
    color: "#06b6d4",
    required: false,
    hint: "Schriftverkehr mit Netzbetreiber",
  },
  {
    key: "sonstige",
    label: "Sonstige",
    icon: FileText,
    color: "#71717a",
    required: false,
    hint: "Weitere Unterlagen",
  },
] as const;

// Backend-Kategorie (UPPERCASE enum) → Frontend key (lowercase)
const BACKEND_TO_KEY: Record<string, string> = {
  LAGEPLAN: "lageplan",
  SCHALTPLAN: "schaltplan",
  DATENBLATT: "datenblatt",
  ANTRAG: "antrag",
  FOTOS_AC: "fotos_ac",
  FOTOS_DC: "fotos_dc",
  KORRESPONDENZ: "korrespondenz",
  SONSTIGE: "sonstige",
  // Fallbacks für Randkategorien die im Portal unter "sonstige" landen
  RECHNUNG: "__hidden__",
  VERTRAG: "sonstige",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  UPLOADED: { label: "Hochgeladen", color: "#60a5fa", bg: "rgba(59, 130, 246, 0.12)" },
  VERIFIED: { label: "Geprüft", color: "#34d399", bg: "rgba(16, 185, 129, 0.12)" },
  REJECTED: { label: "Abgelehnt", color: "#f87171", bg: "rgba(239, 68, 68, 0.12)" },
  ARCHIVED: { label: "Archiviert", color: "#9ca3af", bg: "rgba(156, 163, 175, 0.12)" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildDocUrl(doc: PortalDocument, mode: "download" | "view"): string {
  const token = getAccessToken();
  const params = new URLSearchParams();
  if (mode === "view") params.set("view", "true");
  if (token) params.set("token", token);
  const qs = params.toString();
  return qs ? `${doc.url}?${qs}` : doc.url;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileEmoji(filename?: string | null): string {
  if (!filename) return "\u{1F4C1}";
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext)) return "\u{1F5BC}\uFE0F";
  if (ext === "pdf") return "\u{1F4C4}";
  if (["doc", "docx"].includes(ext)) return "\u{1F4DD}";
  if (["xls", "xlsx"].includes(ext)) return "\u{1F4CA}";
  return "\u{1F4C1}";
}

function mapDocToKey(doc: PortalDocument): string {
  return BACKEND_TO_KEY[doc.kategorie] || "sonstige";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PortalDocumentsPage() {
  const { selectedInstallation } = usePortal();

  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [completeness, setCompleteness] = useState<DocumentCompleteness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PortalDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadDocuments = async () => {
    if (!selectedInstallation) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getPortalDocuments(selectedInstallation.id);
      setDocuments(result.data.filter((d) => d.kategorie !== "RECHNUNG"));
      setCompleteness(result.completeness);
    } catch (err) {
      console.error("Load documents error:", err);
      setError("Fehler beim Laden der Dokumente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedInstallation?.id]);

  // Filter by search
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter((d) => d.originalName.toLowerCase().includes(q));
  }, [documents, searchQuery]);

  // Group by frontend category key
  const grouped = useMemo(() => {
    const map: Record<string, PortalDocument[]> = {};
    DOC_CATEGORIES.forEach((c) => (map[c.key] = []));
    filteredDocs.forEach((doc) => {
      const key = mapDocToKey(doc);
      if (map[key]) map[key].push(doc);
      else map["sonstige"].push(doc);
    });
    return map;
  }, [filteredDocs]);

  // Upload: dokumentTyp = category.key (Backend mappt das korrekt)
  const handleUpload = async (categoryKey: string, file: File) => {
    if (!file || !selectedInstallation) return;
    setUploading(categoryKey);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("installationId", String(selectedInstallation.id));
    formData.append("dokumentTyp", categoryKey);

    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        credentials: "include",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload fehlgeschlagen");
      }

      await loadDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError("Upload fehlgeschlagen: " + msg);
    } finally {
      setUploading(null);
    }
  };

  const triggerUpload = (categoryKey: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.png,.jpg,.jpeg,.heic,.doc,.docx";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleUpload(categoryKey, file);
    };
    input.click();
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (!selectedInstallation) {
    return (
      <>
        <div className="pdoc-empty">
          <AlertCircle size={48} />
          <p>Keine Installation ausgewählt.</p>
        </div>
        <style>{styles}</style>
      </>
    );
  }

  const allComplete = completeness?.fulfilled === completeness?.total;

  return (
    <>
      <div className="pdoc-page">
        {/* ── Header ── */}
        <div className="pdoc-hdr">
          <div className="pdoc-hdr-left">
            <h1 className="pdoc-hdr-title">Dokumente</h1>
            <span className="pdoc-hdr-badge">{documents.length}</span>
          </div>
          <div className="pdoc-hdr-right">
            <div className="pdoc-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}><X size={12} /></button>
              )}
            </div>
          </div>
        </div>

        {/* ── Upload-Hilfe ── */}
        <InlineHelp
          title={DOCUMENT_UPLOAD_HELP.title}
          steps={DOCUMENT_UPLOAD_HELP.steps}
          categories={DOCUMENT_UPLOAD_HELP.categories}
        />

        {/* ── Completeness ── */}
        {completeness && !allComplete && (
          <div className="pdoc-req">
            <div className="pdoc-req-top">
              <Zap size={15} />
              <span className="pdoc-req-label">Pflichtdokumente für Netzanmeldung</span>
              <span className="pdoc-req-frac">{completeness.fulfilled}/{completeness.total}</span>
            </div>
            <div className="pdoc-req-bar">
              <div
                className="pdoc-req-fill"
                style={{ width: `${(completeness.fulfilled / completeness.total) * 100}%` }}
              />
            </div>
            <div className="pdoc-req-list">
              {completeness.required.map((item) => (
                <span
                  key={item.kategorie}
                  className={`pdoc-req-pill ${item.present ? "pdoc-req-pill--ok" : "pdoc-req-pill--miss"}`}
                >
                  {item.present ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {allComplete && completeness && (
          <div className="pdoc-req pdoc-req--done">
            <CheckCircle size={16} />
            <span>Alle {completeness.total} Pflichtdokumente vorhanden</span>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="pdoc-error">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="pdoc-loading">
            <Loader2 size={28} className="pdoc-spin" />
          </div>
        ) : (
          <div className="pdoc-grid">
            {DOC_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const docs = grouped[cat.key] || [];
              const isEmpty = docs.length === 0;
              const isMissing = cat.required && isEmpty;
              const isUploading = uploading === cat.key;

              return (
                <div
                  key={cat.key}
                  className={`pdoc-card${isEmpty ? " pdoc-card--empty" : ""}${isMissing ? " pdoc-card--missing" : ""}`}
                >
                  {/* Card Header */}
                  <div className="pdoc-card-hdr">
                    <div className="pdoc-card-ico" style={{ background: `${cat.color}18`, color: cat.color }}>
                      <Icon size={15} />
                    </div>
                    <div className="pdoc-card-meta">
                      <div className="pdoc-card-name">
                        {cat.label}
                        {cat.required && (
                          <span className={`pdoc-card-req ${isEmpty ? "" : "pdoc-card-req--ok"}`}>
                            {isEmpty ? "Pflicht" : "\u2713"}
                          </span>
                        )}
                      </div>
                      <div className="pdoc-card-hint">{cat.hint}</div>
                    </div>
                    <span className="pdoc-card-cnt">{docs.length}</span>
                  </div>

                  {/* Files */}
                  <div className="pdoc-card-body">
                    {isEmpty ? (
                      <button
                        className="pdoc-card-upload"
                        onClick={() => triggerUpload(cat.key)}
                        disabled={isUploading}
                      >
                        {isUploading
                          ? <><Loader2 size={14} className="pdoc-spin" /> Wird hochgeladen...</>
                          : <><Upload size={14} /> Datei hochladen</>}
                      </button>
                    ) : (
                      <>
                        {docs.map((doc) => {
                          const st = STATUS_CONFIG[doc.status] || STATUS_CONFIG.UPLOADED;
                          return (
                            <div key={doc.id} className="pdoc-file">
                              <span className="pdoc-file-ico">{getFileEmoji(doc.originalName)}</span>
                              <div className="pdoc-file-info">
                                <span className="pdoc-file-name" title={doc.originalName}>
                                  {doc.originalName}
                                </span>
                                <span className="pdoc-file-sub">
                                  {new Date(doc.createdAt).toLocaleDateString("de-DE")}
                                  {doc.dateigroesse ? ` \u00B7 ${formatFileSize(doc.dateigroesse)}` : ""}
                                </span>
                              </div>
                              <span className="pdoc-file-st" style={{ color: st.color, background: st.bg }}>
                                {st.label}
                              </span>
                              <div className="pdoc-file-act">
                                <button onClick={() => setPreviewDoc(doc)} title="Vorschau">
                                  <Eye size={13} />
                                </button>
                                <a href={buildDocUrl(doc, "download")} download={doc.originalName} title="Download">
                                  <Download size={13} />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                        <button
                          className="pdoc-card-add"
                          onClick={() => triggerUpload(cat.key)}
                          disabled={isUploading}
                        >
                          {isUploading
                            ? <><Loader2 size={12} className="pdoc-spin" /> Lädt...</>
                            : <><Upload size={12} /> Hinzufügen</>}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Preview Modal ── */}
      {previewDoc && (
        <div className="pdoc-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="pdoc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdoc-modal-hdr">
              <h3>{previewDoc.originalName}</h3>
              <div className="pdoc-modal-acts">
                <a href={buildDocUrl(previewDoc, "download")} download={previewDoc.originalName} className="pdoc-modal-dl">
                  <Download size={14} /> Download
                </a>
                <button onClick={() => setPreviewDoc(null)}><X size={18} /></button>
              </div>
            </div>
            <div className="pdoc-modal-body">
              {previewDoc.dateityp?.startsWith("image/") ? (
                <img src={buildDocUrl(previewDoc, "view")} alt={previewDoc.originalName} />
              ) : previewDoc.dateityp === "application/pdf" ? (
                <iframe src={buildDocUrl(previewDoc, "view")} title={previewDoc.originalName} />
              ) : (
                <div className="pdoc-modal-fallback">
                  <FileText size={40} />
                  <p>Vorschau nicht verfügbar</p>
                  <a href={buildDocUrl(previewDoc, "download")} download={previewDoc.originalName} className="pdoc-modal-dl-big">
                    <Download size={16} /> Herunterladen
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = `
  .pdoc-page { animation: pdocIn 0.35s ease-out; }
  @keyframes pdocIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Header */
  .pdoc-hdr {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px; padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-wrap: wrap; gap: 12px;
  }
  .pdoc-hdr-left { display: flex; align-items: center; gap: 10px; }
  .pdoc-hdr-title {
    font-size: 22px; font-weight: 800; margin: 0;
    background: linear-gradient(135deg, #f8fafc, #94a3b8);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .pdoc-hdr-badge {
    font-size: 11px; font-weight: 700; color: #EAD068;
    background: rgba(212,168,67,0.12); padding: 3px 10px; border-radius: 10px;
  }
  .pdoc-hdr-right { display: flex; align-items: center; gap: 10px; }

  /* Search */
  .pdoc-search {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 12px; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
    color: rgba(255,255,255,0.4); transition: border-color 0.2s;
  }
  .pdoc-search:focus-within { border-color: rgba(212,168,67,0.4); }
  .pdoc-search input {
    background: none; border: none; outline: none;
    color: #fff; font-size: 13px; width: 140px;
  }
  .pdoc-search input::placeholder { color: rgba(255,255,255,0.3); }
  .pdoc-search button {
    background: none; border: none; color: rgba(255,255,255,0.4);
    cursor: pointer; padding: 0; display: flex;
  }

  /* Completeness Banner */
  .pdoc-req {
    padding: 16px 20px; margin-bottom: 18px;
    background: rgba(245,158,11,0.06);
    border: 1px solid rgba(245,158,11,0.15); border-radius: 14px;
  }
  .pdoc-req--done {
    background: rgba(16,185,129,0.06);
    border-color: rgba(16,185,129,0.2);
    display: flex; align-items: center; gap: 10px;
    color: #34d399; font-size: 14px; font-weight: 600;
    padding: 14px 20px;
  }
  .pdoc-req-top {
    display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  }
  .pdoc-req-top svg { color: #f59e0b; flex-shrink: 0; }
  .pdoc-req-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); flex: 1; }
  .pdoc-req-frac { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.5); }
  .pdoc-req-bar {
    height: 4px; background: rgba(255,255,255,0.06);
    border-radius: 2px; overflow: hidden; margin-bottom: 12px;
  }
  .pdoc-req-fill {
    height: 100%; border-radius: 2px;
    background: linear-gradient(90deg, #f59e0b, #eab308);
    transition: width 0.5s ease;
  }
  .pdoc-req-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .pdoc-req-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 6px;
    font-size: 12px; font-weight: 500;
  }
  .pdoc-req-pill--ok { background: rgba(16,185,129,0.1); color: #34d399; }
  .pdoc-req-pill--miss { background: rgba(245,158,11,0.1); color: #fbbf24; }

  /* Error */
  .pdoc-error {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; margin-bottom: 16px;
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
    border-radius: 10px; color: #fca5a5; font-size: 13px;
  }
  .pdoc-error svg:first-child { flex-shrink: 0; }
  .pdoc-error span { flex: 1; }
  .pdoc-error button {
    background: none; border: none; color: rgba(255,255,255,0.4);
    cursor: pointer; padding: 2px;
  }

  /* Loading */
  .pdoc-loading {
    display: flex; justify-content: center; align-items: center;
    min-height: 250px; color: #D4A843;
  }
  .pdoc-spin { animation: pdocSpin 1s linear infinite; }
  @keyframes pdocSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  .pdoc-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: 250px;
    color: rgba(255,255,255,0.35); text-align: center;
  }
  .pdoc-empty svg { margin-bottom: 10px; }

  /* Grid */
  .pdoc-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  }
  @media (max-width: 1100px) { .pdoc-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px)  { .pdoc-grid { grid-template-columns: 1fr; } }

  /* Card */
  .pdoc-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; overflow: hidden;
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  }
  .pdoc-card:hover {
    border-color: rgba(255,255,255,0.15);
    box-shadow: 0 6px 24px rgba(0,0,0,0.25);
    transform: translateY(-1px);
  }
  .pdoc-card--empty { opacity: 0.6; }
  .pdoc-card--empty:hover { opacity: 1; }
  .pdoc-card--missing {
    border-color: rgba(245,158,11,0.35);
    background: rgba(245,158,11,0.04);
  }
  .pdoc-card--missing:hover { border-color: rgba(245,158,11,0.5); }

  /* Card Header */
  .pdoc-card-hdr {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .pdoc-card-ico {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .pdoc-card-meta { flex: 1; min-width: 0; }
  .pdoc-card-name {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9);
  }
  .pdoc-card-req {
    font-size: 9px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.3px; padding: 2px 6px; border-radius: 4px;
    background: rgba(245,158,11,0.15); color: #fbbf24;
  }
  .pdoc-card-req--ok { background: rgba(16,185,129,0.15); color: #34d399; }
  .pdoc-card-hint {
    font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 1px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .pdoc-card-cnt {
    font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.3);
    min-width: 18px; text-align: center;
  }

  /* Card Body */
  .pdoc-card-body { max-height: 350px; overflow-y: auto; }

  /* Empty upload button */
  .pdoc-card-upload {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 28px 16px;
    background: none; border: none;
    color: rgba(255,255,255,0.35); font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
  }
  .pdoc-card-upload:hover:not(:disabled) { color: #EAD068; background: rgba(212,168,67,0.05); }
  .pdoc-card-upload:disabled { opacity: 0.5; cursor: not-allowed; }

  /* File row */
  .pdoc-file {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    transition: background 0.1s;
  }
  .pdoc-file:hover { background: rgba(255,255,255,0.025); }
  .pdoc-file-ico { font-size: 15px; flex-shrink: 0; }
  .pdoc-file-info { flex: 1; min-width: 0; }
  .pdoc-file-name {
    display: block; font-size: 12px; font-weight: 500;
    color: rgba(255,255,255,0.85);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .pdoc-file-sub {
    display: block; font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 1px;
  }

  /* Status pill */
  .pdoc-file-st {
    font-size: 10px; font-weight: 600;
    padding: 2px 7px; border-radius: 5px;
    white-space: nowrap; flex-shrink: 0;
  }

  /* Actions - always visible */
  .pdoc-file-act {
    display: flex; gap: 3px; flex-shrink: 0;
  }
  .pdoc-file-act button, .pdoc-file-act a {
    display: flex; align-items: center; justify-content: center;
    width: 26px; height: 26px;
    background: rgba(255,255,255,0.04); border: none; border-radius: 6px;
    color: rgba(255,255,255,0.4); cursor: pointer;
    text-decoration: none; transition: all 0.15s;
  }
  .pdoc-file-act button:hover, .pdoc-file-act a:hover {
    background: rgba(255,255,255,0.1); color: #fff;
  }

  /* Add more button */
  .pdoc-card-add {
    display: flex; align-items: center; justify-content: center; gap: 5px;
    width: 100%; padding: 8px;
    background: none; border: none;
    border-top: 1px solid rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.35); font-size: 11px; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
  }
  .pdoc-card-add:hover:not(:disabled) { color: #EAD068; background: rgba(212,168,67,0.04); }
  .pdoc-card-add:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Preview Modal */
  .pdoc-overlay {
    position: fixed; inset: 0; z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
    animation: pdocIn 0.15s ease-out;
  }
  .pdoc-modal {
    width: 90%; max-width: 880px; max-height: 90vh;
    background: rgba(15,15,25,0.98);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 18px; overflow: hidden;
    display: flex; flex-direction: column;
  }
  .pdoc-modal-hdr {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .pdoc-modal-hdr h3 {
    margin: 0; font-size: 15px; font-weight: 600; color: #fff;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    flex: 1; min-width: 0;
  }
  .pdoc-modal-acts { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .pdoc-modal-dl {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 12px; font-size: 12px; font-weight: 500;
    color: #EAD068; background: rgba(212,168,67,0.1);
    border: 1px solid rgba(212,168,67,0.25); border-radius: 7px;
    text-decoration: none; transition: all 0.15s;
  }
  .pdoc-modal-dl:hover { background: rgba(212,168,67,0.18); }
  .pdoc-modal-hdr button {
    background: none; border: none; color: rgba(255,255,255,0.4);
    cursor: pointer; padding: 2px; transition: color 0.15s;
  }
  .pdoc-modal-hdr button:hover { color: #fff; }
  .pdoc-modal-body {
    flex: 1; overflow: auto;
    display: flex; align-items: center; justify-content: center;
    padding: 20px; min-height: 350px;
  }
  .pdoc-modal-body img { max-width: 100%; max-height: 70vh; border-radius: 6px; }
  .pdoc-modal-body iframe { width: 100%; height: 70vh; border: none; border-radius: 6px; }
  .pdoc-modal-fallback {
    display: flex; flex-direction: column; align-items: center;
    gap: 14px; color: rgba(255,255,255,0.35);
  }
  .pdoc-modal-fallback p { margin: 0; font-size: 14px; }
  .pdoc-modal-dl-big {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 20px; background: #D4A843; color: #fff;
    border-radius: 8px; text-decoration: none;
    font-size: 13px; font-weight: 500; transition: background 0.2s;
  }
  .pdoc-modal-dl-big:hover { background: #b8942e; }

  /* Mobile */
  @media (max-width: 600px) {
    .pdoc-hdr { flex-direction: column; align-items: flex-start; }
    .pdoc-hdr-right { width: 100%; }
    .pdoc-search { flex: 1; }
    .pdoc-search input { width: 100%; }
    .pdoc-modal { width: 95%; max-height: 95vh; }
    .pdoc-modal-dl { display: none; }
    .pdoc-req-list { flex-direction: column; }
  }
`;
