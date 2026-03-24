/**
 * ⚠️ ARCHIVIERT — Nicht mehr aktiv verwendet.
 * Ersetzt durch: CrmDetailPanel (components/detail/CrmDetailPanel.tsx)
 * Siehe: DETAIL_PANELS.md
 *
 * NETZANMELDUNGEN ENTERPRISE - DETAIL PANEL v3.0
 * Complete Rewrite with:
 * - Slide-in animation
 * - Progress bar
 * - Smart alerts
 * - Lazy loading
 * - Quick actions
 * - Keyboard shortcuts
 * - Sidebar
 */

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Loader2, ChevronRight, RefreshCw, Copy, Check,
  AlertTriangle, AlertCircle, Info, CheckCircle, XCircle,
  Clock, FileText, Mail, CheckSquare, Zap, ExternalLink,
  Activity, Home, User, Building2, Globe, Clipboard, Edit3,
  Sun, Battery, Car, Flame, Tag, Calendar, Users, Trash2,
  ArrowRightCircle, MessageCircle, Briefcase, Download,
} from "lucide-react";
import { useAuth } from "../../../../pages/AuthContext";
import { api } from "../../services/api";
import { getStatusConfig, getAvailableTransitions, formatRelativeTime, computePriority, getPriorityConfig, getPermissions } from "../../utils";
import type { InstallationDetail, InstallationStatus, GridOperator, TimelineEntry, Document, Task } from "../../types";

// Tab Components
import { OverviewTab } from "./tabs/OverviewTab";
import { TechTab } from "./tabs/TechTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { TimelineTab } from "./tabs/TimelineTab";
import { EmailsTab } from "./tabs/EmailsTab";
import { TasksTab } from "./tabs/TasksTab";
import { KommunikationTab } from "./tabs/KommunikationTab";
import { WhatsAppTab } from "./tabs/WhatsAppTab";
import { ChatTab } from "./tabs/ChatTab";

// VDE Generator
import { VDEGeneratorModal } from "../VDEGeneratorModal";

// Ticket System
import { TicketSidebarPanel } from "../../../tickets/components/TicketSidebarPanel";

import "./styles.css";

// CRM Stage → Installation Status Mapping
function mapCrmStageToStatus(stage: string): string {
  const map: Record<string, string> = {
    ANFRAGE: "eingang",
    HV_VERMITTELT: "eingang",
    AUFTRAG: "in_bearbeitung",
    NB_KOMMUNIKATION: "beim_nb",
    NB_GENEHMIGT: "genehmigt",
    MONTAGE: "in_bearbeitung",
    ABGESCHLOSSEN: "abgeschlossen",
    EINGESTELLT: "storniert",
    NB_ABGELEHNT: "abgelehnt",
  };
  return map[stage] || "eingang";
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface DetailPanelProps {
  installationId: number | string;
  onClose: () => void;
  onUpdate?: () => void;
}

interface Alert {
  id: string;
  type: "warning" | "error" | "info" | "success";
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

type TabType = "overview" | "tech" | "documents" | "timeline" | "emails" | "tasks" | "kommunikation" | "whatsapp" | "chat" | "tickets";

const TABS: { id: TabType; label: string; icon: typeof Home; shortcut: string }[] = [
  { id: "overview", label: "Übersicht", icon: Home, shortcut: "1" },
  { id: "tech", label: "Technik", icon: Zap, shortcut: "2" },
  { id: "documents", label: "Dokumente", icon: FileText, shortcut: "3" },
  { id: "timeline", label: "Historie", icon: Clock, shortcut: "4" },
  { id: "chat", label: "Chat", icon: Users, shortcut: "5" },
  { id: "emails", label: "E-Mails", icon: Mail, shortcut: "6" },
  { id: "tasks", label: "Aufgaben", icon: CheckSquare, shortcut: "7" },
  { id: "kommunikation", label: "NB-Kommunikation", icon: Building2, shortcut: "8" },
  // DEAKTIVIERT: { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, shortcut: "9" },
  { id: "tickets", label: "Tickets", icon: Clipboard, shortcut: "0" },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function DetailPanel({ installationId, onClose, onUpdate }: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // CRM-Projekt erkennen (ID = "crm-123")
  const isCrmProject = typeof installationId === "string" && String(installationId).startsWith("crm-");
  const crmProjektId = isCrmProject ? Number(String(installationId).replace("crm-", "")) : null;
  const effectiveInstallationId = isCrmProject ? 0 : Number(installationId);

  // Versuche verschiedene Felder für die Rolle
  const userRole = ((user as any)?.role || (user as any)?.rolle || (user as any)?.userRole || "").toUpperCase();

  // Nur Admin und Mitarbeiter dürfen Status ändern
  const isStaff = userRole === "ADMIN" || userRole === "MITARBEITER";
  const isKunde = userRole === "KUNDE";
  const isSubunternehmer = userRole === "SUBUNTERNEHMER";

  const permissions = getPermissions(userRole);

  // CRM project data
  const [crmDetail, setCrmDetail] = useState<any>(null);

  // Core state
  const [detail, setDetail] = useState<InstallationDetail | null>(null);
  const [gridOperators, setGridOperators] = useState<GridOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [visible, setVisible] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Tab data (lazy loaded)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [timelineLoaded, setTimelineLoaded] = useState(false);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  
  const [emails, setEmails] = useState<any[]>([]);
  const [emailsLoaded, setEmailsLoaded] = useState(false);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  
  // Alerts & Progress
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [progress, setProgress] = useState({ percent: 0, nextStep: "", steps: [] as { label: string; done: boolean }[] });
  
  // Status change
  const [statusChanging, setStatusChanging] = useState(false);
  
  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // VDE Generator
  const [showVDEGenerator, setShowVDEGenerator] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  // Load core detail
  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);

      if (isCrmProject && crmProjektId) {
        // CRM-Projekt laden
        const token = localStorage.getItem("baunity_token") || "";
        const resp = await fetch(`/api/crm/projekte/${crmProjektId}/detail`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!resp.ok) throw new Error("CRM-Projekt nicht gefunden");
        const crmData = await resp.json();
        setCrmDetail(crmData);

        // CRM-Daten als "virtuelle Installation" mappen
        const virtualDetail: InstallationDetail = {
          id: 0,
          publicId: `CRM-${crmData.id}`,
          status: mapCrmStageToStatus(crmData.stage),
          customerName: crmData.kundenName || crmData.titel,
          customer_name: crmData.kundenName || crmData.titel,
          strasse: crmData.strasse || "",
          plz: crmData.plz || "",
          ort: crmData.ort || "",
          email: crmData.kontaktEmail || "",
          telefon: crmData.kontaktTelefon || "",
          technical_data: {
            totalPvKwPeak: crmData.totalKwp ? Number(crmData.totalKwp) : null,
            modulAnzahl: crmData.modulAnzahl,
            modulTyp: crmData.modulTyp,
            wechselrichterTyp: crmData.wechselrichterTyp,
            speicherTyp: crmData.speicherTyp,
            speicherKwh: crmData.speicherKwh ? Number(crmData.speicherKwh) : null,
          },
          netzbetreiberId: crmData.netzbetreiberId,
          createdAt: crmData.createdAt,
          updatedAt: crmData.updatedAt,
          _isCrm: true,
          _crmProjektId: crmData.id,
          _crmStage: crmData.stage,
          _crmTitel: crmData.titel,
          _crmOrganisation: crmData.organisation?.name,
        } as any;

        setDetail(virtualDetail);
        setGridOperators([]);
        generateAlerts(virtualDetail);
        calculateProgress(virtualDetail);
      } else {
        // Wizard/API Installation laden
        const [detailData, operators] = await Promise.all([
          api.installations.getById(effectiveInstallationId),
          api.gridOperators.getAll().catch(() => []),
        ]);
        setDetail(detailData);
        setGridOperators(operators);
        generateAlerts(detailData);
        calculateProgress(detailData);
      }
    } catch (e) {
      console.error("Failed to load detail:", e);
      showToast("Fehler beim Laden", "error");
    } finally {
      setLoading(false);
    }
  }, [installationId, showToast]);

  // Generate smart alerts
  const generateAlerts = (data: InstallationDetail) => {
    const newAlerts: Alert[] = [];
    const now = new Date();
    const updated = new Date(data.updatedAt);
    const daysSinceUpdate = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceUpdate > 14 && !["abgeschlossen", "abgelehnt", "storniert"].includes(data.status)) {
      newAlerts.push({
        id: "overdue",
        type: "warning",
        title: "Keine Aktivität",
        message: `Seit ${daysSinceUpdate} Tagen keine Aktivität`,
      });
    }
    
    if (data.status === "rueckfrage") {
      newAlerts.push({
        id: "action_required",
        type: "error",
        title: "Rückfrage vom NB",
        message: "Aktion erforderlich - NB hat Rückfragen!",
      });
    }

    if (data.status === "beim_nb") {
      newAlerts.push({
        id: "waiting_nb",
        type: "info",
        title: "Beim Netzbetreiber",
        message: "Warten auf Antwort vom NB",
      });
    }

    if (data.status === "genehmigt") {
      newAlerts.push({
        id: "approved",
        type: "success",
        title: "Genehmigt",
        message: "Einspeisezusage erhalten!",
      });
    }
    
    setAlerts(newAlerts);
  };

  // Calculate progress
  const calculateProgress = (data: InstallationDetail) => {
    const steps = [
      { label: "Anlage erstellt", done: true },
      { label: "Daten vollständig", done: Boolean(data.customerName && data.plz) },
      { label: "Beim NB", done: ["beim_nb", "rueckfrage", "genehmigt", "ibn", "fertig"].includes(data.status) },
      { label: "Genehmigt", done: ["genehmigt", "ibn", "fertig"].includes(data.status) },
      { label: "Fertig", done: data.status === "fertig" },
    ];
    
    const completedSteps = steps.filter(s => s.done).length;
    const percent = Math.round((completedSteps / steps.length) * 100);
    const nextStepObj = steps.find(s => !s.done);
    const nextStep = nextStepObj?.label || "Fertig!";
    
    setProgress({ percent, nextStep, steps });
  };

  // Lazy load timeline
  const loadTimeline = useCallback(async () => {
    if (timelineLoaded) return;
    try {
      const data = await api.timeline.getForInstallation(effectiveInstallationId);
      setTimeline(data);
      setTimelineLoaded(true);
    } catch (e) {
      console.error("Failed to load timeline:", e);
    }
  }, [effectiveInstallationId, timelineLoaded]);

  // Lazy load documents
  const loadDocuments = useCallback(async (force = false) => {
    if (documentsLoaded && !force) return;
    try {
      const token = localStorage.getItem("baunity_token") || localStorage.getItem("accessToken");

      // CRM-Projekte: Eigener Dokument-Endpoint
      const endpoint = isCrmProject && crmProjektId
        ? `/api/crm/projekte/${crmProjektId}/dokumente`
        : `/api/installations/${effectiveInstallationId}/documents`;

      const response = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Fehler beim Laden");
      const result = await response.json();
      const docsData = result.data || result || [];
      setDocuments(docsData.map((d: any) => ({
        id: d.id,
        originalName: String(d.originalName || d.original_name || d.dateiname || "Dokument"),
        dateiname: d.dateiname,
        kategorie: String(d.kategorie || "SONSTIGE"),
        dokumentTyp: d.dokumentTyp || d.dokument_typ ? String(d.dokumentTyp || d.dokument_typ) : null,
        size: Number(d.size || d.groesse || d.dateigroesse || 0),
        contentType: String(d.contentType || d.dateityp || "application/octet-stream"),
        uploadedBy: typeof d.uploadedBy === 'object'
          ? (d.uploadedBy?.name || d.uploadedBy?.email || "System")
          : (d.uploadedBy || d.uploadedByName || d.uploaded_by_name || d.createdByName || "System"),
        uploadedAt: d.uploadedAt || d.createdAt || d.created_at || new Date().toISOString(),
        url: d.url || (isCrmProject ? `/api/crm/dokumente/${d.id}/download` : `/api/documents/${d.id}/download`),
        createdAt: d.createdAt || d.created_at,
      })));
      setDocumentsLoaded(true);
    } catch (e) {
      console.error("Failed to load documents:", e);
    }
  }, [effectiveInstallationId, crmProjektId, isCrmProject, documentsLoaded]);

  // Lazy load emails
  const loadEmails = useCallback(async () => {
    if (emailsLoaded) return;
    try {
      const data = await api.email.getHistory(effectiveInstallationId);
      setEmails(data);
      setEmailsLoaded(true);
    } catch (e) {
      console.error("Failed to load emails:", e);
    }
  }, [effectiveInstallationId, emailsLoaded]);

  // Lazy load tasks
  const loadTasks = useCallback(async () => {
    if (tasksLoaded) return;
    try {
      const data = await api.tasks.getAll({ installationId: effectiveInstallationId });
      setTasks(data);
      setTasksLoaded(true);
    } catch (e) {
      console.error("Failed to load tasks:", e);
    }
  }, [effectiveInstallationId, tasksLoaded]);

  // Initial load
  useEffect(() => {
    loadDetail();
    // Animate in
    setTimeout(() => setVisible(true), 10);
  }, [loadDetail]);

  // Lazy load based on active tab
  useEffect(() => {
    switch (activeTab) {
      case "timeline": loadTimeline(); break;
      case "documents": loadDocuments(); break;
      case "emails": loadEmails(); break;
      case "tasks": loadTasks(); break;
    }
  }, [activeTab, loadTimeline, loadDocuments, loadEmails, loadTasks]);

  // ═══════════════════════════════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Escape to close
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      
      // Number keys for tabs
      if (e.key >= "1" && e.key <= "9" && !e.ctrlKey && !e.metaKey) {
        const index = parseInt(e.key) - 1;
        if (TABS[index]) {
          setActiveTab(TABS[index].id);
        }
      }
      
      // R to refresh
      if (e.key === "r" && !e.ctrlKey && !e.metaKey) {
        handleRefresh();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleRefresh = () => {
    loadDetail();
    setTimelineLoaded(false);
    setDocumentsLoaded(false);
    setEmailsLoaded(false);
    setTasksLoaded(false);
  };

  const handleStatusChange = async (newStatus: InstallationStatus) => {
    if (!detail) return;
    setStatusChanging(true);
    try {
      await api.installations.updateStatus(effectiveInstallationId, newStatus);
      showToast("Status aktualisiert", "success");
      loadDetail();
      onUpdate?.();
    } catch (e: any) {
      showToast(e.message || "Fehler", "error");
    } finally {
      setStatusChanging(false);
    }
  };

  const handleUpdate = async (data: Partial<InstallationDetail>) => {
    try {
      // Wenn data leer ist, nur neu laden (z.B. nach Subcontractor-Zuweisung)
      if (Object.keys(data).length === 0) {
        loadDetail();
        onUpdate?.();
        return;
      }
      
      await api.installations.updateCustomer(effectiveInstallationId, data as any);
      showToast("Gespeichert", "success");
      loadDetail();
      onUpdate?.();
    } catch (e: any) {
      showToast(e.message || "Fehler", "error");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.installations.delete(effectiveInstallationId);
      showToast("Anlage gelöscht", "success");
      setShowDeleteConfirm(false);
      onUpdate?.();
      handleClose();
    } catch (e: any) {
      showToast(e.message || "Fehler beim Löschen", "error");
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading || !detail) {
    return (
      <div className={`dp-overlay ${visible ? "dp-overlay--visible" : ""}`} onClick={handleClose}>
        <div className="dp-panel dp-panel--loading" onClick={e => e.stopPropagation()}>
          <Loader2 className="dp-spin" size={48} />
          <span>Laden...</span>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(detail.status);
  const availableTransitions = getAvailableTransitions(detail.status);
  
  const priority = computePriority(detail);
  const priorityConfig = getPriorityConfig(priority);
  const currentOperator = gridOperators.find(op => op.id === detail.gridOperatorId);

  // Counts for tabs
  const docCount = documents.length;
  const emailCount = emails.length;
  const taskCount = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled").length;

  return (
    <div className={`dp-overlay ${visible ? "dp-overlay--visible" : ""}`} onClick={handleClose}>
      <div 
        ref={panelRef}
        className={`dp-panel ${visible ? "dp-panel--visible" : ""}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* HEADER */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="dp-header">
          <div className="dp-header__top">
            <div className="dp-header__id">
              <span className="dp-header__badge" style={{ background: `${priorityConfig.color}20`, color: priorityConfig.color }}>
                <Zap size={12} /> {detail.caseType || "NETZANMELDUNG"}
              </span>
              <span className="dp-header__public-id">
                {detail.publicId || `INST-${detail.id}`}
                <button 
                  className="dp-header__copy"
                  onClick={() => copyToClipboard(detail.publicId || `INST-${detail.id}`, "id")}
                >
                  {copiedField === "id" ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </span>
            </div>
            <div className="dp-header__actions">
              {window.baunityDesktop?.isDesktop && (
                <button
                  className="dp-btn dp-btn--icon"
                  onClick={async () => {
                    if (!detail) return;
                    try {
                      window.baunityDesktop!.progress.set(0.1);
                      // Lade alle Dokumente als Base64
                      const token = localStorage.getItem("baunity_token") || localStorage.getItem("accessToken") || sessionStorage.getItem("baunity_token") || "";
                      const docs: Array<{ base64: string; filename: string }> = [];
                      const allDocs = detail.documents || [];
                      for (let i = 0; i < allDocs.length; i++) {
                        try {
                          const res = await fetch(allDocs[i].url || "", { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" });
                          if (res.ok) {
                            const blob = await res.blob();
                            const base64 = await new Promise<string>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
                              reader.onerror = reject;
                              reader.readAsDataURL(blob);
                            });
                            docs.push({ base64, filename: allDocs[i].originalName || allDocs[i].dateiname || `doc_${i}` });
                          }
                        } catch { /* skip failed doc */ }
                        window.baunityDesktop!.progress.set((i + 1) / allDocs.length);
                      }
                      const result = await window.baunityDesktop!.briefcase.export({
                        installation: {
                          id: detail.id,
                          publicId: detail.publicId,
                          customerName: detail.customerName,
                          address: `${detail.strasse || ""} ${detail.hausNr || ""}, ${detail.plz || ""} ${detail.ort || ""}`.trim(),
                          status: detail.status,
                          totalKwp: detail.totalKwp,
                          gridOperator: detail.gridOperator || "",
                          createdAt: detail.createdAt,
                        },
                        documents: docs,
                      });
                      window.baunityDesktop!.progress.set(-1);
                      if (result.success) {
                        setCopiedField("briefcase");
                        setTimeout(() => setCopiedField(null), 2000);
                      }
                    } catch (err) {
                      console.error("Briefcase export error:", err);
                      window.baunityDesktop!.progress.set(-1);
                    }
                  }}
                  title="Offline speichern (Briefcase)"
                >
                  {copiedField === "briefcase" ? <Check size={16} className="dp-text-success" /> : <Briefcase size={16} />}
                </button>
              )}
              <button
                className="dp-btn dp-btn--icon"
                onClick={async () => {
                  if (!detail) return;
                  const lines = [
                    `Installation: ${detail.publicId || detail.id}`,
                    `Kunde: ${detail.customerName || ""}`,
                    `Adresse: ${detail.strasse || ""} ${detail.hausNr || ""}, ${detail.plz || ""} ${detail.ort || ""}`,
                    `kWp: ${detail.totalKwp || ""}`,
                    `Netzbetreiber: ${detail.gridOperator || ""}`,
                    `Status: ${detail.status || ""}`,
                    `Erstellt: ${detail.createdAt ? new Date(detail.createdAt).toLocaleDateString("de-DE") : ""}`,
                  ];
                  const text = lines.join("\n");
                  if (window.baunityDesktop?.isDesktop) {
                    await window.baunityDesktop.clipboard.writeText(text);
                  } else {
                    await navigator.clipboard.writeText(text);
                  }
                  setCopiedField("data");
                  setTimeout(() => setCopiedField(null), 2000);
                }}
                title="Daten kopieren"
              >
                {copiedField === "data" ? <Check size={16} className="dp-text-success" /> : <Clipboard size={16} />}
              </button>
              <button className="dp-btn dp-btn--icon" onClick={handleRefresh} title="Aktualisieren (R)">
                <RefreshCw size={16} />
              </button>
              <button
                className="dp-btn dp-btn--icon"
                onClick={() => window.open(isCrmProject ? `/crm/projekte/${crmProjektId}` : `/installations/${effectiveInstallationId}`, "_blank")}
                title="In neuem Tab öffnen"
              >
                <ExternalLink size={16} />
              </button>
              {permissions.canDeleteInstallation && !isKunde && !isSubunternehmer && (
                <button 
                  className="dp-btn dp-btn--icon dp-btn--danger" 
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Anlage löschen"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button className="dp-btn dp-btn--icon dp-btn--close" onClick={handleClose} title="Schließen (Esc)">
                <X size={18} />
              </button>
            </div>
          </div>

          <h2 className="dp-header__title">{detail.customerName || "Unbekannt"}</h2>

          <div className="dp-header__meta">
            <div className={`dp-header__status dp-header__status--${detail.status}`}>
              <span>{statusConfig?.icon || "📋"}</span>
              {statusConfig?.label || detail.status || "Unbekannt"}
            </div>
            <span className="dp-header__meta-item">
              <Home size={12} /> {detail.plz} {detail.ort}
            </span>
            <span className="dp-header__meta-item">
              <Building2 size={12} /> {detail.gridOperator || currentOperator?.name || "–"}
            </span>
            <span className="dp-header__meta-item">
              <Clock size={12} /> {formatRelativeTime(detail.updatedAt)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="dp-header__progress">
            <div className="dp-header__progress-bar">
              <div 
                className="dp-header__progress-fill"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="dp-header__progress-info">
              <span>{progress.percent}% abgeschlossen</span>
              <span className="dp-header__next-step">
                <ChevronRight size={12} /> {progress.nextStep}
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ALERTS */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {alerts.length > 0 && (
          <div className="dp-alerts">
            {alerts.map(alert => (
              <div key={alert.id} className={`dp-alert dp-alert--${alert.type}`}>
                {alert.type === "error" && <AlertCircle size={16} />}
                {alert.type === "warning" && <AlertTriangle size={16} />}
                {alert.type === "info" && <Info size={16} />}
                {alert.type === "success" && <CheckCircle size={16} />}
                <div className="dp-alert__content">
                  <strong>{alert.title}</strong>
                  <span>{alert.message}</span>
                </div>
                {alert.action && (
                  <button className="dp-alert__action" onClick={alert.action.onClick}>
                    {alert.action.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* QUICK ACTIONS - Nur für Admin/Mitarbeiter */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {isStaff && availableTransitions.length > 0 && (
          <div className="dp-quick-actions">
            <span className="dp-quick-actions__label">Status ändern:</span>
            {availableTransitions.map(transition => {
              const config = getStatusConfig(transition.to);
              return (
                <button
                  key={transition.to}
                  className="dp-quick-action"
                  onClick={() => handleStatusChange(transition.to)}
                  disabled={statusChanging}
                  style={{ borderColor: config?.color || '#64748b', color: config?.color || '#64748b' }}
                >
                  {statusChanging ? <Loader2 size={12} className="dp-spin" /> : <span>{config?.icon || "→"}</span>}
                  {config?.label || transition.to}
                </button>
              );
            })}
          </div>
        )}

        {/* VDE Formulare — alte Generatoren deaktiviert, Redirect zu VDE Center */}
        {!isKunde && !isSubunternehmer && (
          <div className="dp-quick-actions">
            <span className="dp-quick-actions__label">VDE Formulare:</span>
            <button
              className="dp-quick-action"
              onClick={() => window.open(`/vde-center?installationId=${detail.id}`, '_blank')}
              style={{ borderColor: '#D4A843', color: '#D4A843' }}
            >
              <FileText size={12} />
              VDE Center öffnen
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MAIN LAYOUT - TABS/CONTENT + SIDEBAR */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="dp-main-layout">
          <div className="dp-main-content">
            {/* TABS */}
            <div className="dp-tabs">
              {TABS.map(tab => {
                const Icon = tab.icon;
                let badge: number | null = null;
                if (tab.id === "documents" && docCount > 0) badge = docCount;
                if (tab.id === "emails" && emailCount > 0) badge = emailCount;
                if (tab.id === "tasks" && taskCount > 0) badge = taskCount;

                return (
                  <button
                    key={tab.id}
                    className={`dp-tab ${activeTab === tab.id ? "dp-tab--active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {badge !== null && <span className="dp-tab__badge">{badge}</span>}
                    <span className="dp-tab__shortcut">{tab.shortcut}</span>
                  </button>
                );
              })}
            </div>

            {/* CONTENT */}
            <div className="dp-content">
              {activeTab === "overview" && (
                <OverviewTab
                  detail={detail}
                  gridOperators={gridOperators}
                  onUpdate={handleUpdate}
                  showToast={showToast}
                  isKunde={isKunde}
                  onSwitchToTab={(tab) => setActiveTab(tab as TabType)}
                />
              )}

          {activeTab === "tech" && (
            <TechTab
              detail={detail}
              onUpdate={handleUpdate}
              showToast={showToast}
              isKunde={isKunde}
            />
          )}

          {activeTab === "documents" && (
            <DocumentsTab
              documents={documents}
              installationId={installationId}
              detail={detail}
              onRefresh={() => loadDocuments(true)}
              showToast={showToast}
              isKunde={isKunde}
              isSubunternehmer={isSubunternehmer}
              crmProjektId={crmProjektId}
            />
          )}

          {activeTab === "timeline" && (
            <TimelineTab
              timeline={timeline}
              installationId={effectiveInstallationId}
              onRefresh={() => { setTimelineLoaded(false); loadTimeline(); }}
              showToast={showToast}
              isKunde={isKunde}
            />
          )}

          {activeTab === "emails" && (
            <EmailsTab
              emails={emails}
              installationId={effectiveInstallationId}
              detail={detail}
              onRefresh={() => { setEmailsLoaded(false); loadEmails(); }}
              showToast={showToast}
              isKunde={isKunde}
            />
          )}

          {activeTab === "tasks" && (
            <TasksTab
              tasks={tasks}
              installationId={effectiveInstallationId}
              onRefresh={() => { setTasksLoaded(false); loadTasks(); }}
              showToast={showToast}
              isKunde={isKunde}
            />
          )}

          {activeTab === "kommunikation" && (
            <KommunikationTab
              detail={detail}
              gridOperator={currentOperator || null}
              installationId={effectiveInstallationId}
              onRefresh={loadDetail}
              showToast={showToast}
              isKunde={isKunde}
            />
          )}

          {activeTab === "whatsapp" && (
            <WhatsAppTab
              installationId={effectiveInstallationId}
              showToast={showToast}
              isKunde={isKunde}
            />
          )}

          {activeTab === "chat" && (
            <ChatTab
              installationId={effectiveInstallationId}
              showToast={showToast}
              isKunde={isKunde}
            />
          )}

          {activeTab === "tickets" && (
            <TicketSidebarPanel installationId={effectiveInstallationId} />
          )}
        </div>
        {/* End dp-content */}
      </div>
      {/* End dp-main-content */}

      {/* SIDEBAR */}
      <div className="dp-sidebar">
        {/* Status Change - Nur für Admin/Mitarbeiter */}
        {isStaff && availableTransitions.length > 0 && (
          <div className="dp-sidebar__section">
            <h4><ArrowRightCircle size={14} /> Status ändern</h4>
            <div className="dp-sidebar__status-actions">
              {availableTransitions.map(transition => {
                const config = getStatusConfig(transition.to);
                return (
                  <button
                    key={transition.to}
                    className="dp-sidebar__status-btn"
                    onClick={() => handleStatusChange(transition.to)}
                    disabled={statusChanging}
                    style={{ 
                      borderColor: config?.color || '#64748b', 
                      color: config?.color || '#64748b',
                    }}
                  >
                    {statusChanging ? (
                      <Loader2 size={12} className="dp-spin" />
                    ) : (
                      <span>{config?.icon || "→"}</span>
                    )}
                    {transition.label || config?.label || transition.to}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Assigned */}
        <div className="dp-sidebar__section">
          <h4><Users size={14} /> Zugewiesen</h4>
          <div className="dp-sidebar__value">
            {detail.assignedToName || "Nicht zugewiesen"}
          </div>
        </div>

        {/* Priority */}
        <div className="dp-sidebar__section">
          <h4><Tag size={14} /> Priorität</h4>
          <div 
            className="dp-sidebar__badge"
            style={{ background: `${priorityConfig.color}20`, color: priorityConfig.color }}
          >
            {priorityConfig.label}
          </div>
        </div>

        {/* Components */}
        <div className="dp-sidebar__section">
          <h4><Zap size={14} /> Komponenten</h4>
          <div className="dp-sidebar__components">
            {(detail.totalKwp && detail.totalKwp > 0) && <span title="PV"><Sun size={16} /></span>}
            {(detail.technicalData?.storage?.length ?? 0) > 0 && <span title="Speicher"><Battery size={16} /></span>}
            {(detail.technicalData?.wallbox?.length ?? 0) > 0 && <span title="Wallbox"><Car size={16} /></span>}
            {(detail.technicalData?.heatPump?.length ?? 0) > 0 && <span title="Wärmepumpe"><Flame size={16} /></span>}
          </div>
        </div>

        {/* Dates */}
        <div className="dp-sidebar__section">
          <h4><Calendar size={14} /> Zeitstempel</h4>
          <div className="dp-sidebar__dates">
            <div>
              <span>Erstellt</span>
              <span>{new Date(detail.createdAt).toLocaleDateString("de-DE")}</span>
            </div>
            <div>
              <span>Aktualisiert</span>
              <span>{new Date(detail.updatedAt).toLocaleDateString("de-DE")}</span>
            </div>
          </div>
        </div>

        {/* NB Portal */}
        {currentOperator?.portalUrl && (
          <div className="dp-sidebar__section">
            <h4><Globe size={14} /> NB-Portal</h4>
            <a 
              href={currentOperator.portalUrl} 
              target="_blank" 
              className="dp-sidebar__link"
            >
              Portal öffnen <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
      {/* End dp-sidebar */}
    </div>
    {/* End dp-main-layout */}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TOAST */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {toast && (
          <div className={`dp-toast dp-toast--${toast.type}`}>
            {toast.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {safeString(toast.message)}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* DELETE CONFIRMATION MODAL */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {showDeleteConfirm && (
          <div className="dp-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="dp-modal dp-modal--sm" onClick={e => e.stopPropagation()}>
              <div className="dp-modal__header">
                <h3>Anlage löschen</h3>
                <button className="dp-btn dp-btn--icon" onClick={() => setShowDeleteConfirm(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="dp-modal__body">
                <div className="dp-delete-confirm">
                  <div className="dp-delete-confirm__icon">
                    <AlertTriangle size={48} />
                  </div>
                  <p className="dp-delete-confirm__text">
                    Möchten Sie die Anlage <strong>{detail.customerName}</strong> wirklich löschen?
                  </p>
                  <p className="dp-delete-confirm__warning">
                    Diese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen Dokumente, E-Mails und Aufgaben werden ebenfalls gelöscht.
                  </p>
                </div>
              </div>
              <div className="dp-modal__footer">
                <button className="dp-btn" onClick={() => setShowDeleteConfirm(false)}>
                  Abbrechen
                </button>
                <button 
                  className="dp-btn dp-btn--danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 size={14} className="dp-spin" /> : <Trash2 size={14} />}
                  Endgültig löschen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VDE Generator Modal */}
        {showVDEGenerator && detail && (
          <VDEGeneratorModal
            installation={detail}
            onClose={() => setShowVDEGenerator(false)}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}
