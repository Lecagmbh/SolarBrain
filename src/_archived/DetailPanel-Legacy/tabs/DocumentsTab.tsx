/**
 * DOCUMENTS TAB - Mit Generieren-Buttons und Drag&Drop
 */

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  FileText, Upload, Plus, Eye, Trash2, Loader2, X,
  MapPin, Zap, Battery, CheckCircle, Download, RefreshCw,
  Mail, FolderOpen, ChevronRight, Sparkles, AlertTriangle,
} from "lucide-react";
import type { Document, InstallationDetail } from "../../../types";
import { api } from "../../../services/api";
import { 
  generateDocument,
  generateDocumentWithEnrichment,
  openDocumentForPrint,
  downloadDocument,
  type GeneratedDocument,
  type DokumentTyp,
} from "../../../services/dokumenteGenerator";
import { documentEvents, onDocumentsChanged } from "../../../events/documentEvents";

// Helper: URL mit Auth-Token oder Session-Parameter
const getAuthenticatedUrl = (url: string, forView: boolean = false): string => {
  if (!url) return url;

  // Versuche Token aus verschiedenen Quellen
  const token = localStorage.getItem("baunity_token") ||
                localStorage.getItem("accessToken") ||
                sessionStorage.getItem("baunity_token") ||
                sessionStorage.getItem("accessToken");

  const separator = url.includes("?") ? "&" : "?";
  const viewParam = forView ? "view=true" : "";

  // Wenn Token vorhanden, mit Token
  if (token) {
    return `${url}${separator}${viewParam}${viewParam ? "&" : ""}token=${encodeURIComponent(token)}`;
  }

  // Ohne Token - Browser sendet Cookie automatisch (Session-Auth)
  // Füge nur view-Parameter hinzu wenn nötig
  if (viewParam) {
    return `${url}${separator}${viewParam}`;
  }

  return url;
};

// Backend-Kategorie Mapping
function toBackendKategorie(key: string): string {
  const k = key.toLowerCase();
  if (k === "lageplan") return "LAGEPLAN";
  if (k === "schaltplan") return "SCHALTPLAN";
  if (k === "projektmappe") return "PROJEKTMAPPE";
  if (k === "stringplan") return "STRINGPLAN";
  if (k === "vollmacht") return "VOLLMACHT";
  if (k === "messkonzept") return "MESSKONZEPT";
  if (k === "bestaetigung_nb") return "KORRESPONDENZ";
  if (k.startsWith("vde_")) return k.toUpperCase();
  if (k.startsWith("datenblatt_")) return "DATENBLATT";
  if (k === "rechnung") return "RECHNUNG";
  if (k === "foto") return "FOTO";
  return "SONSTIGE";
}

function mapBackendKey(kategorie: string, dateiname?: string, originalName?: string, dokumentTyp?: string | null): string {
  const fullFilename = `${dateiname || ""} ${originalName || ""}`.toLowerCase();
  if (/e9|e\.9|e_9|betriebserlaubnis/i.test(fullFilename)) return "sonstiges";
  
  // 1. dokumentTyp hat höchste Priorität
  if (dokumentTyp) {
    const dt = dokumentTyp.toLowerCase();
    const mapping: Record<string, string> = {
      schaltplan: "schaltplan", lageplan: "lageplan", projektmappe: "projektmappe",
      stringplan: "stringplan", vollmacht: "vollmacht", messkonzept: "messkonzept",
      vde_e1: "vde_e1", e1: "vde_e1",
      vde_e2: "vde_e2", e2: "vde_e2",
      vde_e3: "vde_e3", e3: "vde_e3",
      vde_e8: "vde_e8", e8: "vde_e8",
      datenblatt_module: "datenblatt_module", datenblatt_wechselrichter: "datenblatt_wechselrichter",
      datenblatt_speicher: "datenblatt_speicher", foto: "foto", bestaetigung_nb: "bestaetigung_nb",
      rechnung: "rechnung", sonstiges: "sonstiges",
      // Wizard-Fotos (Zählerschrank, AC, DC, etc.)
      foto_zaehlerschrank: "foto", foto_ac: "foto", foto_dc: "foto",
      fotos_ac: "foto", fotos_dc: "foto", ac_foto: "foto", dc_foto: "foto",
    };
    if (mapping[dt]) return mapping[dt];
    // Foto-Varianten die mit "foto" beginnen
    if (dt.startsWith("foto")) return "foto";
  }
  
  // 2. kategorie prüfen (Backend-Format)
  const k = (kategorie || "").toUpperCase();
  
  // VDE Formulare zuerst (sowohl VDE_E1 als auch direkt VDE-E1)
  if (k === "VDE_E1" || k === "VDE-E1") return "vde_e1";
  if (k === "VDE_E2" || k === "VDE-E2") return "vde_e2";
  if (k === "VDE_E3" || k === "VDE-E3") return "vde_e3";
  if (k === "VDE_E8" || k === "VDE-E8") return "vde_e8";
  
  if (k === "LAGEPLAN") return "lageplan";
  if (k === "SCHALTPLAN") return "schaltplan";
  if (k === "DATENBLATT") return "datenblatt_module";
  if (k === "KORRESPONDENZ") return "bestaetigung_nb";
  if (k === "PROJEKTMAPPE") return "projektmappe";
  if (k === "STRINGPLAN") return "stringplan";
  if (k === "VOLLMACHT") return "vollmacht";
  if (k === "MESSKONZEPT") return "messkonzept";
  if (k === "FOTO" || k === "FOTOS_AC" || k === "FOTOS_DC") return "foto";
  if (k === "RECHNUNG") return "rechnung";
  
  // 3. Fallback: Filename parsen
  if (fullFilename) {
    // Generator-Dateinamen (E1_, E3_, E8_ am Anfang)
    if (/^e1[_\-]|e1_antrag|antragstellung/i.test(fullFilename)) return "vde_e1";
    if (/^e2[_\-]|e2_datenblatt/i.test(fullFilename)) return "vde_e2";
    if (/^e3[_\-]|e3_speicher/i.test(fullFilename)) return "vde_e3";
    if (/^e8[_\-]|e8_ibn|ibn[_\-]?protokoll/i.test(fullFilename)) return "vde_e8";
    
    // Allgemeinere Patterns
    if (/vde.?e.?1|_e1_/i.test(fullFilename)) return "vde_e1";
    if (/vde.?e.?2|_e2_/i.test(fullFilename)) return "vde_e2";
    if (/vde.?e.?3|_e3_/i.test(fullFilename)) return "vde_e3";
    if (/vde.?e.?8|_e8_/i.test(fullFilename)) return "vde_e8";
    
    if (/schaltplan/i.test(fullFilename)) return "schaltplan";
    if (/lageplan/i.test(fullFilename)) return "lageplan";
    if (/projektmappe/i.test(fullFilename)) return "projektmappe";
    if (/vollmacht/i.test(fullFilename)) return "vollmacht";
  }
  
  return "sonstiges";
}

// Kategorien
interface DocCategory {
  key: string;
  label: string;
  icon: typeof FileText;
  color: string;
  required?: boolean;
  canGenerate?: boolean;
  uploadDisabled?: boolean;
  group: "pflicht" | "vde" | "nb" | "sonstige";
}

const DOC_CATEGORIES: DocCategory[] = [
  // Pflichtdokumente
  { key: "lageplan", label: "Lageplan", icon: MapPin, color: "#3b82f6", required: true, canGenerate: true, group: "pflicht" },
  { key: "schaltplan", label: "Schaltplan", icon: Zap, color: "#EAD068", required: true, canGenerate: true, group: "pflicht" },
  // VDE-Formulare
  { key: "vde_e1", label: "E.1 Antragstellung", icon: FileText, color: "#10b981", canGenerate: true, group: "vde" },
  { key: "vde_e2", label: "E.2 Datenblatt Erzeugung", icon: FileText, color: "#10b981", canGenerate: true, group: "vde" },
  { key: "vde_e3", label: "E.3 Datenblatt Speicher", icon: Battery, color: "#10b981", canGenerate: true, group: "vde" },
  { key: "vde_e8", label: "E.8 IBN-Protokoll", icon: CheckCircle, color: "#10b981", canGenerate: true, group: "vde" },
  // Weitere Dokumente
  { key: "stringplan", label: "Stringplan", icon: FileText, color: "#EAD068", canGenerate: true, group: "sonstige" },
  { key: "projektmappe", label: "Projektmappe", icon: FileText, color: "#f59e0b", canGenerate: true, group: "sonstige" },
  { key: "vollmacht", label: "Vollmacht", icon: FileText, color: "#64748b", canGenerate: true, group: "sonstige" },
  // Vom Netzbetreiber
  { key: "bestaetigung_nb", label: "Bestätigung NB", icon: Mail, color: "#22c55e", group: "nb" },
  // Datenblätter
  { key: "datenblatt_module", label: "Datenblatt Module", icon: FileText, color: "#06b6d4", group: "sonstige" },
  { key: "datenblatt_wechselrichter", label: "Datenblatt WR", icon: Zap, color: "#06b6d4", group: "sonstige" },
  { key: "datenblatt_speicher", label: "Datenblatt Speicher", icon: Battery, color: "#06b6d4", group: "sonstige" },
  // Rest
  { key: "messkonzept", label: "Messkonzept", icon: FileText, color: "#ec4899", group: "sonstige" },
  { key: "foto", label: "Fotos", icon: FileText, color: "#14b8a6", group: "sonstige" },
  { key: "rechnung", label: "Rechnung", icon: FileText, color: "#a855f7", uploadDisabled: true, group: "sonstige" },
  { key: "sonstiges", label: "Sonstiges", icon: FileText, color: "#94a3b8", group: "sonstige" },
];

interface DocumentsTabProps {
  documents: Document[];
  installationId: number | string;
  detail: InstallationDetail;
  onRefresh: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
  isKunde?: boolean;
  isSubunternehmer?: boolean;
  crmProjektId?: number | null;
}

export function DocumentsTab({ documents, installationId, detail, onRefresh, showToast, isKunde, isSubunternehmer = false, crmProjektId }: DocumentsTabProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragCategory, setDragCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔥 Gefilterte Kategorien - Rechnungen für Subunternehmer ausblenden
  const FILTERED_CATEGORIES = useMemo(() => {
    if (isSubunternehmer) {
      return DOC_CATEGORIES.filter(c => c.key !== "rechnung");
    }
    return DOC_CATEGORIES;
  }, [isSubunternehmer]);

  // Subscribe to external document events (from DokumentenCenter)
  useEffect(() => {
    if (crmProjektId) return; // CRM events not via DokumentenCenter
    const unsubscribe = onDocumentsChanged(Number(installationId), () => {
      onRefresh();
    });
    return unsubscribe;
  }, [installationId, onRefresh, crmProjektId]);

  // Gruppiere Dokumente
  const docsByCategory = useMemo(() => {
    const map: Record<string, Document[]> = {};
    FILTERED_CATEGORIES.forEach(c => map[c.key] = []);
    documents.forEach(doc => {
      const key = mapBackendKey(doc.kategorie || "", doc.dateiname, doc.originalName, doc.dokumentTyp);
      // 🔥 Rechnungen für Subunternehmer komplett ausblenden
      if (isSubunternehmer && key === "rechnung") {
        return;
      }
      if (map[key]) map[key].push(doc);
      else map["sonstiges"].push(doc);
    });
    return map;
  }, [documents, FILTERED_CATEGORIES, isSubunternehmer]);

  // Stats
  const requiredCats = FILTERED_CATEGORIES.filter(c => c.required);
  const requiredComplete = requiredCats.filter(c => docsByCategory[c.key]?.length > 0).length;

  // Upload Handler
  const handleUpload = async (file: File, category: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kategorie", toBackendKategorie(category));
      formData.append("dokumentTyp", category);

      const token = localStorage.getItem("baunity_token") || localStorage.getItem("accessToken");

      // CRM-Projekte: Eigener Upload-Endpoint
      const uploadUrl = crmProjektId
        ? `/api/crm/projekte/${crmProjektId}/dokumente`
        : `/api/documents/upload/${installationId}`;

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Upload fehlgeschlagen");
      }

      showToast("Dokument hochgeladen", "success");
      if (!crmProjektId) {
        documentEvents.uploaded(Number(installationId), category);
      }
      onRefresh();
    } catch (e: any) {
      showToast(e.message || "Upload fehlgeschlagen", "error");
    } finally {
      setUploading(false);
      setSelectedCategory(null);
      setDragCategory(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedCategory) {
      handleUpload(file, selectedCategory);
    }
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent, category?: string) => {
    e.preventDefault();
    setDragActive(true);
    if (category) setDragCategory(category);
  };

  const handleDragLeave = () => {
    setDragActive(false);
    setDragCategory(null);
  };

  const handleDrop = (e: React.DragEvent, category: string) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file, category);
    }
  };

  // Delete Handler
  const handleDelete = async (docId: number) => {
    setDeleting(docId);
    try {
      const token = localStorage.getItem("baunity_token") || localStorage.getItem("accessToken");
      const deleteUrl = crmProjektId ? `/api/crm/dokumente/${docId}` : `/api/documents/${docId}`;
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Löschen fehlgeschlagen");
      showToast("Dokument gelöscht", "success");
      if (!crmProjektId) {
        documentEvents.deleted(Number(installationId), docId);
      }
      onRefresh();
    } catch (e: any) {
      showToast(e.message || "Fehler", "error");
    } finally {
      setDeleting(null);
    }
  };

  // Generate Document
  const handleGenerate = async (category: string) => {
    setGenerating(category);
    try {
      // Map category to DokumentTyp
      let dokumentTyp: DokumentTyp | null = null;
      
      if (category === "vde_e1") dokumentTyp = "E1";
      else if (category === "vde_e2") dokumentTyp = "E2";
      else if (category === "vde_e3") dokumentTyp = "E3";
      else if (category === "vde_e8") dokumentTyp = "E8";
      else if (category === "vollmacht") dokumentTyp = "vollmacht";
      else if (category === "lageplan") dokumentTyp = "lageplan";
      else if (category === "schaltplan") dokumentTyp = "schaltplan";
      else if (category === "projektmappe") dokumentTyp = "projektmappe";
      
      if (dokumentTyp) {
        // Dokument generieren MIT ProduktDB-Anreicherung (async)
        // Sucht nach Hersteller+Modell in der DB und ergänzt technische Daten
        const doc = await generateDocumentWithEnrichment(detail, dokumentTyp, { isAdmin: true });
        
        if (doc) {
          // PDF in neuem Tab öffnen
          openDocumentForPrint(doc);
          
          // Dokument zum Backend hochladen
          try {
            const file = new File([doc.blob], doc.filename, { type: 'application/pdf' });
            // ✅ FIX: dokumentTyp mitsenden für korrekte Kategorisierung
            if (crmProjektId) {
              // CRM: Generiertes Doc per CRM-Upload hochladen
              const formData = new FormData();
              formData.append("file", file);
              formData.append("kategorie", doc.kategorie);
              formData.append("dokumentTyp", category);
              const token = localStorage.getItem("baunity_token") || localStorage.getItem("accessToken");
              await fetch(`/api/crm/projekte/${crmProjektId}/dokumente`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
              });
            } else {
              await api.documents.upload(Number(installationId), file, doc.kategorie, category);
              documentEvents.generated(Number(installationId), category);
            }
            showToast(`${doc.name} wurde generiert und gespeichert`, "success");
            onRefresh();
          } catch (uploadError) {
            console.error("Upload error:", uploadError);
            showToast(`${doc.name} wurde generiert (Speichern fehlgeschlagen)`, "success");
          }
        } else {
          if (dokumentTyp === "E3") {
            showToast("E.3 Speicher: Kein Speicher vorhanden", "error");
          } else {
            showToast(`${category.toUpperCase()} konnte nicht generiert werden`, "error");
          }
        }
      } else {
        // Stringplan und andere über API (Backend) - nur für Installations
        if (!crmProjektId) {
          await api.documents.generate(Number(installationId), category);
          documentEvents.generated(Number(installationId), category);
        }
        showToast(`${category.toUpperCase()} wurde generiert`, "success");
        onRefresh();
      }
    } catch (e: any) {
      showToast(e.message || "Generierung fehlgeschlagen", "error");
    } finally {
      setGenerating(null);
    }
  };

  // Request from Customer
  const handleRequestFromCustomer = async (category: string) => {
    try {
      await api.documents.requestFromCustomer(Number(installationId), category);
      showToast("Anforderung wurde gesendet", "success");
    } catch (e: any) {
      showToast("E-Mail konnte nicht gesendet werden", "error");
    }
  };

  // Group categories
  // Group categories - 🔥 Verwendet gefilterte Kategorien
  const groupedCategories = useMemo(() => ({
    pflicht: FILTERED_CATEGORIES.filter(c => c.group === "pflicht"),
    vde: FILTERED_CATEGORIES.filter(c => c.group === "vde"),
    nb: FILTERED_CATEGORIES.filter(c => c.group === "nb"),
    sonstige: FILTERED_CATEGORIES.filter(c => c.group === "sonstige"),
  }), [FILTERED_CATEGORIES]);

  return (
    <div className="dp-docs">
      <input 
        ref={fileInputRef} 
        type="file" 
        hidden 
        onChange={handleFileSelect} 
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
      />

      {/* Stats */}
      <div className="dp-docs-header">
        <div className="dp-docs-stats">
          <div className="dp-docs-stat">
            <span className="dp-docs-stat__value">{documents.length}</span>
            <span className="dp-docs-stat__label">Dokumente</span>
          </div>
          <div className={`dp-docs-stat ${requiredComplete === requiredCats.length ? "dp-docs-stat--success" : "dp-docs-stat--warning"}`}>
            <span className="dp-docs-stat__value">{requiredComplete}/{requiredCats.length}</span>
            <span className="dp-docs-stat__label">Pflicht</span>
          </div>
        </div>
        <button className="dp-btn dp-btn--sm" onClick={onRefresh}>
          <RefreshCw size={14} /> Aktualisieren
        </button>
      </div>

      {/* Document Sections */}
      <div className="dp-docs-sections">
        {/* Pflichtdokumente */}
        <div className="dp-docs-section">
          <h4 className="dp-docs-section__title">
            <AlertTriangle size={16} />
            Pflichtdokumente
          </h4>
          <div className="dp-docs-grid">
            {groupedCategories.pflicht.map(cat => (
              <CategoryCard
                key={cat.key}
                category={cat}
                documents={docsByCategory[cat.key] || []}
                onUpload={() => { setSelectedCategory(cat.key); fileInputRef.current?.click(); }}
                onGenerate={() => handleGenerate(cat.key)}
                onRequest={() => handleRequestFromCustomer(cat.key)}
                onExpand={() => setExpandedCategory(cat.key)}
                onPreview={setPreviewDoc}
                onDelete={handleDelete}
                uploading={uploading && selectedCategory === cat.key}
                generating={generating === cat.key}
                deleting={deleting}
                isKunde={isKunde}
                dragActive={dragCategory === cat.key}
                onDragOver={(e) => handleDragOver(e, cat.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, cat.key)}
              />
            ))}
          </div>
        </div>

        {/* Automatisch generierbar */}
        <div className="dp-docs-section">
          <h4 className="dp-docs-section__title">
            <Sparkles size={16} />
            VDE-Formulare (automatisch generierbar)
          </h4>
          <div className="dp-docs-grid">
            {groupedCategories.vde.map(cat => (
              <CategoryCard
                key={cat.key}
                category={cat}
                documents={docsByCategory[cat.key] || []}
                onUpload={() => { setSelectedCategory(cat.key); fileInputRef.current?.click(); }}
                onGenerate={() => handleGenerate(cat.key)}
                onExpand={() => setExpandedCategory(cat.key)}
                onPreview={setPreviewDoc}
                onDelete={handleDelete}
                uploading={uploading && selectedCategory === cat.key}
                generating={generating === cat.key}
                deleting={deleting}
                isKunde={isKunde}
                dragActive={dragCategory === cat.key}
                onDragOver={(e) => handleDragOver(e, cat.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, cat.key)}
              />
            ))}
          </div>
        </div>

        {/* Vom Netzbetreiber */}
        <div className="dp-docs-section">
          <h4 className="dp-docs-section__title">
            <Mail size={16} />
            Vom Netzbetreiber
          </h4>
          <div className="dp-docs-grid">
            {groupedCategories.nb.map(cat => (
              <CategoryCard
                key={cat.key}
                category={cat}
                documents={docsByCategory[cat.key] || []}
                onUpload={() => { setSelectedCategory(cat.key); fileInputRef.current?.click(); }}
                onExpand={() => setExpandedCategory(cat.key)}
                onPreview={setPreviewDoc}
                onDelete={handleDelete}
                uploading={uploading && selectedCategory === cat.key}
                deleting={deleting}
                isKunde={isKunde}
                dragActive={dragCategory === cat.key}
                onDragOver={(e) => handleDragOver(e, cat.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, cat.key)}
              />
            ))}
          </div>
        </div>

        {/* Sonstige */}
        <div className="dp-docs-section">
          <h4 className="dp-docs-section__title">
            <FolderOpen size={16} />
            Weitere Dokumente
          </h4>
          <div className="dp-docs-grid dp-docs-grid--compact">
            {groupedCategories.sonstige.map(cat => (
              <CategoryCard
                key={cat.key}
                category={cat}
                documents={docsByCategory[cat.key] || []}
                onUpload={() => { setSelectedCategory(cat.key); fileInputRef.current?.click(); }}
                onGenerate={cat.canGenerate ? () => handleGenerate(cat.key) : undefined}
                onExpand={() => setExpandedCategory(cat.key)}
                onPreview={setPreviewDoc}
                onDelete={handleDelete}
                uploading={uploading && selectedCategory === cat.key}
                generating={generating === cat.key}
                deleting={deleting}
                isKunde={isKunde}
                compact
                dragActive={dragCategory === cat.key}
                onDragOver={(e) => handleDragOver(e, cat.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, cat.key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Category Modal */}
      {expandedCategory && (
        <ExpandedCategoryModal
          category={FILTERED_CATEGORIES.find(c => c.key === expandedCategory)!}
          documents={docsByCategory[expandedCategory] || []}
          onClose={() => setExpandedCategory(null)}
          onPreview={setPreviewDoc}
          onDelete={handleDelete}
          onUpload={() => { setSelectedCategory(expandedCategory); fileInputRef.current?.click(); }}
          deleting={deleting}
          isKunde={isKunde}
        />
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <PreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

// Category Card Component
function CategoryCard({
  category,
  documents,
  onUpload,
  onGenerate,
  onRequest,
  onExpand,
  onPreview,
  onDelete,
  uploading,
  generating,
  deleting,
  isKunde,
  compact,
  dragActive,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  category: DocCategory;
  documents: Document[];
  onUpload: () => void;
  onGenerate?: () => void;
  onRequest?: () => void;
  onExpand: () => void;
  onPreview: (doc: Document) => void;
  onDelete: (id: number) => void;
  uploading?: boolean;
  generating?: boolean;
  deleting: number | null;
  isKunde?: boolean;
  compact?: boolean;
  dragActive?: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const Icon = category?.icon || FileText;
  const isEmpty = documents.length === 0;
  const isMissing = category?.required && isEmpty;

  return (
    <div 
      className={`dp-doc-card ${isMissing ? "dp-doc-card--missing" : ""} ${documents.length > 0 ? "dp-doc-card--has-docs" : ""} ${compact ? "dp-doc-card--compact" : ""} ${dragActive ? "dp-doc-card--drag-active" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="dp-doc-card__header">
        <div className="dp-doc-card__icon" style={{ background: `${category?.color || '#64748b'}20`, color: category?.color || '#64748b' }}>
          <Icon size={compact ? 16 : 18} />
        </div>
        <div className="dp-doc-card__info">
          <span className="dp-doc-card__label">{category?.label || 'Dokument'}</span>
          <span className="dp-doc-card__meta">
            {documents.length > 0 ? `${documents.length} Datei${documents.length > 1 ? "en" : ""}` : "Leer"}
            {category.required && isEmpty && <span className="dp-doc-card__required">Pflicht!</span>}
            {category.required && !isEmpty && <CheckCircle size={12} className="dp-doc-card__check" />}
          </span>
        </div>
      </div>

      {/* Actions - Only visible for non-Kunden */}
      {!isKunde && (
        <div className="dp-doc-card__actions">
          {onGenerate && (
            <button 
              className="dp-doc-card__action dp-doc-card__action--generate"
              onClick={onGenerate}
              disabled={generating}
              title="Neu generieren"
            >
              {generating ? <Loader2 size={14} className="dp-spin" /> : <Sparkles size={14} />}
            </button>
          )}
          {!category.uploadDisabled && (
            <button 
              className="dp-doc-card__action"
              onClick={onUpload}
              disabled={uploading}
              title="Hochladen"
            >
              {uploading ? <Loader2 size={14} className="dp-spin" /> : <Upload size={14} />}
            </button>
          )}
          {category.required && isEmpty && onRequest && (
            <button 
              className="dp-doc-card__action dp-doc-card__action--request"
              onClick={onRequest}
              title="Vom Kunden anfordern"
            >
              <Mail size={14} />
            </button>
          )}
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && !compact && (
        <div className="dp-doc-card__files">
          {documents.slice(0, 2).map(doc => (
            <button 
              key={doc.id} 
              className="dp-doc-card__file"
              onClick={() => onPreview(doc)}
            >
              <FileText size={12} />
              <span>{doc.originalName || doc.dateiname}</span>
            </button>
          ))}
          {documents.length > 2 && (
            <button className="dp-doc-card__more" onClick={onExpand}>
              +{documents.length - 2} weitere
            </button>
          )}
        </div>
      )}

      {/* Compact: Just show count badge */}
      {compact && documents.length > 0 && (
        <button className="dp-doc-card__badge" onClick={onExpand}>
          {documents.length}
        </button>
      )}
    </div>
  );
}

// Expanded Category Modal
function ExpandedCategoryModal({
  category,
  documents,
  onClose,
  onPreview,
  onDelete,
  onUpload,
  deleting,
  isKunde,
}: {
  category: DocCategory;
  documents: Document[];
  onClose: () => void;
  onPreview: (doc: Document) => void;
  onDelete: (id: number) => void;
  onUpload: () => void;
  deleting: number | null;
  isKunde?: boolean;
}) {
  const Icon = category?.icon || FileText;
  const catColor = category?.color || '#64748b';
  const catLabel = category?.label || 'Dokumente';

  // Download Handler mit Credentials
  const handleDocumentDownload = async (doc: Document) => {
    try {
      const token = localStorage.getItem("baunity_token") ||
                    localStorage.getItem("accessToken") ||
                    sessionStorage.getItem("baunity_token") ||
                    sessionStorage.getItem("accessToken");

      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(doc.url || "", {
        credentials: "include",
        headers,
      });

      if (!response.ok) throw new Error("Download fehlgeschlagen");

      const blob = await response.blob();
      const { downloadFile } = await import("@/utils/desktopDownload");
      await downloadFile({ filename: doc.originalName || doc.dateiname || "download", blob });
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  return (
    <div className="dp-modal-overlay" onClick={onClose}>
      <div className="dp-modal dp-modal--md" onClick={e => e.stopPropagation()}>
        <div className="dp-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${catColor}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={22} style={{ color: catColor }} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{catLabel}</h3>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{documents.length} Dokument{documents.length !== 1 ? "e" : ""}</span>
            </div>
          </div>
          <button className="dp-btn dp-btn--icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="dp-modal__body" style={{ maxHeight: 400, overflowY: "auto" }}>
          {documents.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", opacity: 0.5 }}>
              <FolderOpen size={48} />
              <p>Keine Dokumente</p>
            </div>
          ) : (
            <div className="dp-expanded-files">
              {documents.map(doc => (
                <div key={doc.id} className="dp-expanded-file">
                  <FileText size={18} />
                  <div className="dp-expanded-file__info">
                    <span className="dp-expanded-file__name">{doc.originalName || doc.dateiname}</span>
                    <span className="dp-expanded-file__meta">
                      {doc.uploadedBy} • {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                  <div className="dp-expanded-file__actions">
                    <button onClick={() => onPreview(doc)} title="Vorschau"><Eye size={16} /></button>
                    <button onClick={() => handleDocumentDownload(doc)} title="Download"><Download size={16} /></button>
                    {!isKunde && (
                      <button onClick={() => onDelete(doc.id)} disabled={deleting === doc.id} title="Löschen">
                        {deleting === doc.id ? <Loader2 size={16} className="dp-spin" /> : <Trash2 size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dp-modal__footer">
          {!category.uploadDisabled && (
            <button className="dp-btn dp-btn--primary" onClick={onUpload}>
              <Upload size={14} /> Hochladen
            </button>
          )}
          <button className="dp-btn" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  );
}

// Preview Modal - mit Blob-URL für sichere Cookie-basierte Auth
function PreviewModal({ document, onClose }: { document: Document; onClose: () => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPdf = document.contentType === "application/pdf" || document.url?.endsWith(".pdf") || document.dateiname?.endsWith(".pdf");
  const isImage = document.contentType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(document.url || document.dateiname || "");

  useEffect(() => {
    let cancelled = false;

    const loadDocument = async () => {
      if (!document.url) {
        setError("Keine URL vorhanden");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch mit credentials (sendet Session-Cookie)
        const token = localStorage.getItem("baunity_token") ||
                      localStorage.getItem("accessToken") ||
                      sessionStorage.getItem("baunity_token") ||
                      sessionStorage.getItem("accessToken");

        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(document.url + "?view=true", {
          credentials: "include",
          headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err: any) {
        if (cancelled) return;
        console.error("Document load error:", err);
        setError(err.message || "Dokument konnte nicht geladen werden");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [document.url]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem("baunity_token") ||
                    localStorage.getItem("accessToken") ||
                    sessionStorage.getItem("baunity_token") ||
                    sessionStorage.getItem("accessToken");

      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(document.url || "", {
        credentials: "include",
        headers,
      });

      if (!response.ok) throw new Error("Download fehlgeschlagen");

      const blob = await response.blob();
      const { downloadFile } = await import("@/utils/desktopDownload");
      await downloadFile({ filename: document.originalName || document.dateiname || "download", blob });
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  return (
    <div className="dp-modal-overlay" onClick={onClose}>
      <div className="dp-modal dp-modal--lg" onClick={e => e.stopPropagation()}>
        <div className="dp-modal__header">
          <h3>{document.originalName || document.dateiname}</h3>
          <button className="dp-btn dp-btn--icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dp-modal__body" style={{ padding: 0, minHeight: 400 }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <Loader2 size={48} className="dp-spin" style={{ opacity: 0.5 }} />
              <p>Dokument wird geladen...</p>
            </div>
          ) : error ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <FileText size={64} style={{ opacity: 0.3, color: "#ef4444" }} />
              <p style={{ color: "#ef4444" }}>{error}</p>
              <button className="dp-btn dp-btn--sm" onClick={handleDownload} style={{ marginTop: 16 }}>
                <Download size={14} /> Stattdessen herunterladen
              </button>
            </div>
          ) : blobUrl && isPdf ? (
            <iframe src={blobUrl} style={{ width: "100%", height: 500, border: "none" }} />
          ) : blobUrl && isImage ? (
            <img src={blobUrl} alt={document.originalName} style={{ maxWidth: "100%", maxHeight: 500, display: "block", margin: "0 auto" }} />
          ) : (
            <div style={{ padding: 60, textAlign: "center" }}>
              <FileText size={64} style={{ opacity: 0.3 }} />
              <p>Vorschau nicht verfügbar</p>
              <button className="dp-btn dp-btn--sm" onClick={handleDownload} style={{ marginTop: 16 }}>
                <Download size={14} /> Herunterladen
              </button>
            </div>
          )}
        </div>
        <div className="dp-modal__footer">
          <button className="dp-btn" onClick={onClose}>Schließen</button>
          <button className="dp-btn dp-btn--primary" onClick={handleDownload}>
            <Download size={14} /> Herunterladen
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentsTab;
