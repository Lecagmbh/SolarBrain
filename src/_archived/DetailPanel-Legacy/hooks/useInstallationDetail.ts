/**
 * DETAIL PANEL - Data Hook
 * Lazy loading für alle Tabs
 */

import { useState, useCallback, useEffect } from "react";
import { api } from "../../../services/api";
import type { InstallationDetail, GridOperator, TimelineEntry, Document, Task } from "../../../types";

interface UseInstallationDetailOptions {
  installationId: number;
  activeTab: string;
}

interface Alert {
  id: string;
  type: "warning" | "error" | "info" | "success";
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

export function useInstallationDetail({ installationId, activeTab }: UseInstallationDetailOptions) {
  // Core data
  const [detail, setDetail] = useState<InstallationDetail | null>(null);
  const [gridOperators, setGridOperators] = useState<GridOperator[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab-specific data (lazy loaded)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [timelineLoaded, setTimelineLoaded] = useState(false);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  
  const [emails, setEmails] = useState<any[]>([]);
  const [emailsLoaded, setEmailsLoaded] = useState(false);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Load core detail
  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const [detailData, operators] = await Promise.all([
        api.installations.getById(installationId),
        api.gridOperators.getAll(),
      ]);
      setDetail(detailData);
      setGridOperators(operators);
      
      // Generate alerts based on detail
      generateAlerts(detailData);
    } catch (e) {
      console.error("Failed to load detail:", e);
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  // Generate smart alerts
  const generateAlerts = useCallback((data: InstallationDetail) => {
    const newAlerts: Alert[] = [];
    const now = new Date();
    const updated = new Date(data.updatedAt);
    const daysSinceUpdate = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    
    // Überfällig-Warnung
    if (daysSinceUpdate > 14 && !["abgeschlossen", "abgelehnt", "storniert"].includes(data.status)) {
      newAlerts.push({
        id: "overdue",
        type: "warning",
        title: "Keine Aktivität",
        message: `Seit ${daysSinceUpdate} Tagen keine Aktivität!`,
      });
    }
    
    // Status-spezifische Alerts
    if (data.status === "beim_nb") {
      newAlerts.push({
        id: "waiting_nb",
        type: "info",
        title: "Beim Netzbetreiber",
        message: "Warten auf Antwort vom Netzbetreiber",
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
    
    setAlerts(newAlerts);
  }, []);

  // Lazy load timeline
  const loadTimeline = useCallback(async () => {
    if (timelineLoaded) return;
    try {
      const data = await api.timeline.getForInstallation(installationId);
      setTimeline(data);
      setTimelineLoaded(true);
    } catch (e) {
      console.error("Failed to load timeline:", e);
    }
  }, [installationId, timelineLoaded]);

  // Lazy load documents
  const loadDocuments = useCallback(async () => {
    if (documentsLoaded) return;
    try {
      const token = localStorage.getItem("baunity_token") || localStorage.getItem("accessToken");
      const response = await fetch(`/api/installations/${installationId}/documents`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Fehler beim Laden");
      const result = await response.json();
      const docsData = result.data || result || [];
      setDocuments(docsData.map((d: any) => ({
        id: d.id,
        originalName: String(d.originalName || d.dateiname || "Dokument"),
        dateiname: d.dateiname,
        kategorie: String(d.kategorie || "SONSTIGE"),
        dokumentTyp: d.dokumentTyp ? String(d.dokumentTyp) : null,
        size: Number(d.size || d.groesse || d.dateigroesse || 0),
        contentType: String(d.contentType || d.dateityp || d.mimeType || "application/octet-stream"),
        uploadedBy: typeof d.uploadedBy === 'object' 
          ? (d.uploadedBy?.name || d.uploadedBy?.email || "System")
          : (d.uploadedBy || d.createdByName || "System"),
        uploadedAt: d.uploadedAt || d.createdAt || new Date().toISOString(),
        url: d.url || `/api/documents/${d.id}/download`,
      })));
      setDocumentsLoaded(true);
    } catch (e) {
      console.error("Failed to load documents:", e);
    }
  }, [installationId, documentsLoaded]);

  // Lazy load emails
  const loadEmails = useCallback(async () => {
    if (emailsLoaded) return;
    try {
      const data = await api.email.getHistory(installationId);
      setEmails(data);
      setEmailsLoaded(true);
    } catch (e) {
      console.error("Failed to load emails:", e);
    }
  }, [installationId, emailsLoaded]);

  // Lazy load tasks
  const loadTasks = useCallback(async () => {
    if (tasksLoaded) return;
    try {
      const data = await api.tasks.getAll({ installationId });
      setTasks(data);
      setTasksLoaded(true);
    } catch (e) {
      console.error("Failed to load tasks:", e);
    }
  }, [installationId, tasksLoaded]);

  // Initial load
  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Lazy load based on active tab
  useEffect(() => {
    switch (activeTab) {
      case "timeline":
        loadTimeline();
        break;
      case "documents":
        loadDocuments();
        break;
      case "emails":
        loadEmails();
        break;
      case "tasks":
        loadTasks();
        break;
    }
  }, [activeTab, loadTimeline, loadDocuments, loadEmails, loadTasks]);

  // Refresh functions
  const refreshAll = useCallback(() => {
    loadDetail();
    setTimelineLoaded(false);
    setDocumentsLoaded(false);
    setEmailsLoaded(false);
    setTasksLoaded(false);
  }, [loadDetail]);

  const refreshDocuments = useCallback(() => {
    setDocumentsLoaded(false);
    loadDocuments();
  }, [loadDocuments]);

  const refreshTimeline = useCallback(() => {
    setTimelineLoaded(false);
    loadTimeline();
  }, [loadTimeline]);

  const refreshEmails = useCallback(() => {
    setEmailsLoaded(false);
    loadEmails();
  }, [loadEmails]);

  const refreshTasks = useCallback(() => {
    setTasksLoaded(false);
    loadTasks();
  }, [loadTasks]);

  // Calculate progress
  const progress = detail ? calculateProgress(detail, documents) : { percent: 0, nextStep: "", completedSteps: 0, totalSteps: 0 };

  return {
    // Core
    detail,
    gridOperators,
    loading,
    alerts,
    progress,
    
    // Tab data
    timeline,
    documents,
    emails,
    tasks,
    
    // Loading states
    timelineLoaded,
    documentsLoaded,
    emailsLoaded,
    tasksLoaded,
    
    // Actions
    refreshAll,
    refreshDocuments,
    refreshTimeline,
    refreshEmails,
    refreshTasks,
    setDetail,
  };
}

// Progress calculation
function calculateProgress(detail: InstallationDetail, documents: Document[]): {
  percent: number;
  nextStep: string;
  completedSteps: number;
  totalSteps: number;
  steps: { label: string; done: boolean }[];
} {
  const steps = [
    { label: "Anlage erstellt", done: true },
    { label: "Pflichtdokumente", done: documents.some(d => d.kategorie === "lageplan") && documents.some(d => d.kategorie === "schaltplan") },
    { label: "Beim NB", done: ["beim_nb", "rueckfrage", "genehmigt", "ibn", "fertig"].includes(detail.status) },
    { label: "Genehmigt", done: ["genehmigt", "ibn", "fertig"].includes(detail.status) },
    { label: "Fertig", done: detail.status === "fertig" },
  ];
  
  const completedSteps = steps.filter(s => s.done).length;
  const totalSteps = steps.length;
  const percent = Math.round((completedSteps / totalSteps) * 100);
  
  const nextStepObj = steps.find(s => !s.done);
  const nextStep = nextStepObj?.label || "Fertig!";
  
  return { percent, nextStep, completedSteps, totalSteps, steps };
}

export default useInstallationDetail;
