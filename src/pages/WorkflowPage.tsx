import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchApi,
} from "../features/netzanmeldungen/hooks/useEnterpriseApi";
import "./WorkflowPage.css";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface FormField {
  name: string;
  label: string;
  type: "text" | "date" | "select" | "confirm";
  required: boolean;
  placeholder?: string;
  validation?: string;
  currentValue?: string | null;
  options?: { value: string; label: string }[];
}

interface WorkItem {
  id: string;
  label: string;
  description: string;
  type: "form" | "confirm" | "link";
  priority: "MUST" | "SHOULD" | "NICE";
  step: number;
  urgent: boolean;
  phase: string;
  fields: FormField[];
  aiSuggestable: boolean;
  blockedBy: string[];
  blocked: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  phase: string;
  done: boolean;
  required: boolean;
}

interface TaskItem {
  id: number;
  title: string;
  dueDate: string | null;
  status: string;
  priority: string;
  isOverdue: boolean;
}

interface PendingRueckfrageResponse {
  id: number;
  draftSubject: string | null;
  draftBody: string | null;
  recipientEmail: string | null;
  generatedDocs: Array<{ filename: string; kategorie: string; dokumentTyp: string }>;
  analysisData: { summary?: string; suggestedDocuments?: string[] };
  createdAt: string;
}

interface WorkflowInstallation {
  id: number;
  publicId: string;
  customerName: string;
  status: string;
  statusLabel: string;
  gridOperator: string | null;
  location: string | null;
  address: string | null;
  daysInStatus: number;
  isOverdue: boolean;
  progress: { done: number; total: number };
  checklist: ChecklistItem[];
  workItems: WorkItem[];
  tasks: TaskItem[];
  activeWiedervorlage: { dueDate: string; note: string | null } | null;
  wiedervorlageNote: { note: string | null; dueDate: string; taskId: number } | null;
  pendingRueckfrageResponse: PendingRueckfrageResponse | null;
  updatedAt: string;
}

interface WorkflowOverview {
  stats: {
    total: number;
    openWorkItems: number;
    actionRequired: number;
    onTrack: number;
    overdue: number;
    mustOpen: number;
    blockedCount: number;
  };
  grouped: Record<string, WorkflowInstallation[]>;
  installations: WorkflowInstallation[];
}

interface SmartNoteAction {
  id: string;
  type: "STATUS_CHANGE" | "FIELD_UPDATE" | "WIEDERVORLAGE" | "ADD_COMMENT";
  label: string;
  description: string;
  confidence: number;
  data: {
    newStatus?: string;
    field?: string;
    value?: string;
    fieldLabel?: string;
    dueDate?: string;
    reason?: string;
    commentText?: string;
    isInternal?: boolean;
  };
  autoInclude: boolean;
}

interface SmartNoteResult {
  understanding: string;
  suggestedActions: SmartNoteAction[];
}

interface ScreenshotMatch {
  portalEntry: {
    name: string | null;
    address: string | null;
    plz: string | null;
    ort: string | null;
    status: string | null;
    statusNormalized: string | null;
    vorgangsnummer: string | null;
    datum: string | null;
    bemerkung: string | null;
  };
  match: {
    installationId: number;
    publicId: string;
    customerName: string | null;
    currentStatus: string;
    confidence: number;
    matchMethod: string;
  } | null;
  statusComparison: {
    match: boolean;
    portalStatus: string | null;
    gridnetzStatus: string;
    suggestedGridnetzStatus: string | null;
  } | null;
  suggestedActions: Array<{
    action: string;
    label: string;
    data: Record<string, unknown>;
  }>;
}

interface ScreenshotResult {
  extractedCount: number;
  matchedCount: number;
  actionRequiredCount: number;
  results: ScreenshotMatch[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_LABELS: Record<string, string> = {
  EINGANG: "Eingang",
  BEIM_NB: "Beim Netzbetreiber",
  RUECKFRAGE: "Rückfrage",
  GENEHMIGT: "Genehmigt",
  IBN: "Inbetriebnahme",
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function WorkflowPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queue state — track by ID so refetch/re-sort doesn't jump away
  const [currentInstId, setCurrentInstId] = useState<number | null>(null);
  const [skippedIds, setSkippedIds] = useState<Set<number>>(new Set());
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  // Screenshot
  const [dragOver, setDragOver] = useState(false);
  const [screenshotResult, setScreenshotResult] =
    useState<ScreenshotResult | null>(null);

  // Wiedervorlage
  const [showWiedervorlage, setShowWiedervorlage] = useState(false);
  const [wiedervorlageDate, setWiedervorlageDate] = useState("");
  const [wiedervorlageReason, setWiedervorlageReason] = useState("");

  // Work item form state
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);

  // Success feedback
  const [completedLabel, setCompletedLabel] = useState<string | null>(null);

  // Override dialog
  const [overrideTarget, setOverrideTarget] = useState<{
    workItem: WorkItem;
    allWorkItems: WorkItem[];
  } | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  // ─── Data Fetching ───────────────────────────────────────────────────

  const {
    data: overview,
    isLoading,
    error,
  } = useQuery<WorkflowOverview>({
    queryKey: ["workflow", "overview"],
    queryFn: () => fetchApi<WorkflowOverview>("/api/workflow/overview"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // ─── Queue: sorted & filtered ─────────────────────────────────────────

  const queue = useMemo(() => {
    if (!overview) return [];

    // Filter: only installations with work items, no active Wiedervorlage, not skipped
    const eligible = overview.installations.filter((inst) => {
      if (inst.activeWiedervorlage) return false;
      if (inst.workItems.length === 0) return false;
      if (skippedIds.has(inst.id)) return false;
      return true;
    });

    // Sort: group by grid operator first (less portal switching),
    // then overdue first, then MUST items count, then age
    return [...eligible].sort((a, b) => {
      // 1. Group by grid operator (same NB together)
      const aOp = (a.gridOperator || "").toLowerCase();
      const bOp = (b.gridOperator || "").toLowerCase();
      if (aOp !== bOp) return aOp.localeCompare(bOp);
      // 2. Within same NB: overdue first
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      // 3. Among overdue: most days first
      if (a.isOverdue && b.isOverdue) {
        if (a.daysInStatus !== b.daysInStatus) return b.daysInStatus - a.daysInStatus;
      }
      // 4. More MUST items = higher priority
      const aMust = a.workItems.filter((w) => w.priority === "MUST" && !w.blocked).length;
      const bMust = b.workItems.filter((w) => w.priority === "MUST" && !w.blocked).length;
      if (aMust !== bMust) return bMust - aMust;
      // 5. Oldest first (more days in status)
      return b.daysInStatus - a.daysInStatus;
    });
  }, [overview, skippedIds]);

  // Resolve current installation: stay on same ID, or fall back to first in queue
  const currentInst = useMemo(() => {
    if (currentInstId !== null) {
      const found = queue.find((i) => i.id === currentInstId);
      if (found) return found;
    }
    return queue[0] || null;
  }, [queue, currentInstId]);

  // Sync tracked ID: lock on first render, reset when installation leaves queue
  useEffect(() => {
    if (queue.length === 0) return;
    if (currentInstId === null || !queue.find((i) => i.id === currentInstId)) {
      setCurrentInstId(queue[0].id);
    }
  }, [currentInstId, queue]);

  const currentQueuePos = currentInst ? queue.indexOf(currentInst) : -1;
  const totalInQueue = queue.length;
  const overdueInQueue = queue.filter((i) => i.isOverdue).length;

  // How many from same grid operator in sequence?
  const sameNbInfo = useMemo(() => {
    if (!currentInst?.gridOperator) return null;
    const nb = currentInst.gridOperator;
    const nbItems = queue.filter((i) => i.gridOperator === nb);
    const posInNb = nbItems.indexOf(currentInst);
    return { name: nb, current: posInNb + 1, total: nbItems.length };
  }, [currentInst, queue]);

  // Split work items: MUST (not blocked) vs optional vs blocked
  const mustItems = useMemo(() =>
    currentInst
      ? [...currentInst.workItems]
          .filter((w) => w.priority === "MUST" && !w.blocked)
          .sort((a, b) => a.step - b.step)
      : [],
    [currentInst]
  );

  const optionalItems = useMemo(() =>
    currentInst
      ? [...currentInst.workItems]
          .filter((w) => (w.priority !== "MUST" || w.blocked))
          .sort((a, b) => {
            if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
            const pOrder: Record<string, number> = { MUST: 0, SHOULD: 1, NICE: 2 };
            if (pOrder[a.priority] !== pOrder[b.priority])
              return pOrder[a.priority] - pOrder[b.priority];
            return a.step - b.step;
          })
      : [],
    [currentInst]
  );

  // ─── Mutations ────────────────────────────────────────────────────────

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("screenshot", file);
      const token =
        localStorage.getItem("baunity_token") ||
        localStorage.getItem("gridnetz_access_token");
      const res = await fetch("/api/workflow/screenshot-sync", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload fehlgeschlagen" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json() as Promise<ScreenshotResult>;
    },
    onSuccess: (data) => setScreenshotResult(data),
  });

  const applyMutation = useMutation({
    mutationFn: async (
      actions: Array<{ installationId: number; action: string; data?: Record<string, unknown> }>
    ) =>
      fetchApi<{ total: number; success: number; failed: number }>(
        "/api/workflow/screenshot-sync/apply",
        { method: "POST", body: JSON.stringify({ actions }) }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
      setScreenshotResult(null);
    },
  });

  const completeWorkItemMutation = useMutation({
    mutationFn: async ({
      installationId,
      workItemId,
      data,
      override,
    }: {
      installationId: number;
      workItemId: string;
      data: Record<string, string>;
      override?: { reason: string };
    }) =>
      fetchApi<{ success: boolean; workItemId?: string; propagatedCount?: number }>(
        `/api/workflow/${installationId}/complete-work-item`,
        { method: "POST", body: JSON.stringify({ workItemId, data, override }) }
      ),
    onSuccess: (result, variables) => {
      const wi = currentInst?.workItems.find((w) => w.id === variables.workItemId);
      let label = `${wi?.label || "Aufgabe"} gespeichert`;
      if (variables.workItemId === "add_portal_url" && result.propagatedCount && result.propagatedCount > 0) {
        label = `Portal-URL gespeichert (+ ${result.propagatedCount} weitere Installationen aktualisiert)`;
      }
      setCompletedLabel(label);
      setActiveFormId(null);
      setFormValues({});
      setFormErrors({});
      setOverrideTarget(null);
      setOverrideReason("");
      setTimeout(() => setCompletedLabel(null), 3500);
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
    },
  });

  const wiedervorlageMutation = useMutation({
    mutationFn: async ({
      installationId,
      dueDate,
      reason,
    }: {
      installationId: number;
      dueDate: string;
      reason: string;
    }) =>
      fetchApi<{ success: boolean }>(
        `/api/workflow/${installationId}/wiedervorlage`,
        { method: "POST", body: JSON.stringify({ dueDate, reason }) }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
      setShowWiedervorlage(false);
      setWiedervorlageDate("");
      setWiedervorlageReason("");
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) =>
      fetchApi<{ success: boolean }>(`/api/workflow/task/${taskId}/complete`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
    },
  });

  const mastrAutoMatchMutation = useMutation({
    mutationFn: async (installationId: number) =>
      fetchApi<{
        found: boolean;
        solar: { mastrNr: string; matchType: string } | null;
        speicher: { mastrNr: string; matchType: string } | null;
      }>(`/api/workflow/${installationId}/mastr-auto-match`, { method: "POST" }),
    onSuccess: (result) => {
      if (result.found) {
        if (result.solar) {
          setFormValues((prev) => ({ ...prev, mastrNrSolar: result.solar!.mastrNr }));
        }
        if (result.speicher) {
          setFormValues((prev) => ({ ...prev, mastrNrSpeicher: result.speicher!.mastrNr }));
        }
        setCompletedLabel(
          result.solar
            ? `MaStR Solar gefunden: ${result.solar.mastrNr} (${result.solar.matchType})`
            : "Kein Solar-Match gefunden"
        );
        setTimeout(() => setCompletedLabel(null), 4000);
        queryClient.invalidateQueries({ queryKey: ["workflow"] });
      } else {
        setCompletedLabel("Kein MaStR-Match gefunden — bitte manuell eintragen");
        setTimeout(() => setCompletedLabel(null), 4000);
      }
    },
  });

  // ─── Rückfrage-Antwort Mutations ──────────────────────────────────────

  const approveResponseMutation = useMutation({
    mutationFn: async (params: {
      installationId: number;
      responseId: number;
      subject: string;
      body: string;
      selectedDocIndices: number[];
    }) =>
      fetchApi<{ success: boolean; sentEmailId?: number }>(
        `/api/workflow/${params.installationId}/rueckfrage-response/approve`,
        {
          method: "POST",
          body: JSON.stringify({
            responseId: params.responseId,
            subject: params.subject,
            body: params.body,
            selectedDocIndices: params.selectedDocIndices,
          }),
        }
      ),
    onSuccess: (_result, variables) => {
      const docCount = variables.selectedDocIndices.length;
      setCompletedLabel(
        `Rückfrage-Antwort gesendet (${docCount} Dokument${docCount !== 1 ? "e" : ""} angehängt)`
      );
      setTimeout(() => setCompletedLabel(null), 5000);
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
    },
  });

  const rejectResponseMutation = useMutation({
    mutationFn: async (params: {
      installationId: number;
      responseId: number;
      reason: string;
    }) =>
      fetchApi<{ success: boolean }>(
        `/api/workflow/${params.installationId}/rueckfrage-response/reject`,
        {
          method: "POST",
          body: JSON.stringify({
            responseId: params.responseId,
            reason: params.reason,
          }),
        }
      ),
    onSuccess: () => {
      setCompletedLabel("Rückfrage-Antwort abgelehnt");
      setTimeout(() => setCompletedLabel(null), 3500);
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleSkip = useCallback(() => {
    if (!currentInst) return;
    const skipId = currentInst.id;
    // Move to next before adding to skipped, so we don't lose position
    const nextIdx = currentQueuePos + 1;
    const nextInst = queue[nextIdx] || queue[0];
    setCurrentInstId(nextInst && nextInst.id !== skipId ? nextInst.id : null);
    setSkippedIds((prev) => new Set(prev).add(skipId));
    setActiveFormId(null);
    setFormValues({});
    setFormErrors({});
    setShowOptional(false);
  }, [currentInst, currentQueuePos, queue]);

  const handleNext = useCallback(() => {
    const nextIdx = currentQueuePos + 1;
    const nextInst = queue[nextIdx < queue.length ? nextIdx : 0];
    setCurrentInstId(nextInst ? nextInst.id : null);
    setActiveFormId(null);
    setFormValues({});
    setFormErrors({});
    setShowOptional(false);
  }, [currentQueuePos, queue]);

  const handleDoneAndNext = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleOpenWiedervorlage = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    setWiedervorlageDate(d.toISOString().split("T")[0]);
    setWiedervorlageReason("");
    setShowWiedervorlage(true);
  }, []);

  const handleSubmitWiedervorlage = useCallback(() => {
    if (!currentInst || !wiedervorlageDate) return;
    wiedervorlageMutation.mutate({
      installationId: currentInst.id,
      dueDate: wiedervorlageDate,
      reason: wiedervorlageReason,
    });
  }, [currentInst, wiedervorlageDate, wiedervorlageReason, wiedervorlageMutation]);

  const handleToggleForm = useCallback((wi: WorkItem) => {
    if (wi.blocked) {
      setOverrideTarget({
        workItem: wi,
        allWorkItems: currentInst?.workItems || [],
      });
      setOverrideReason("");
      return;
    }
    if (activeFormId === wi.id) {
      setActiveFormId(null);
      setFormValues({});
      setFormErrors({});
    } else {
      const initial: Record<string, string> = {};
      for (const field of wi.fields) {
        if (field.currentValue) initial[field.name] = field.currentValue;
      }
      setActiveFormId(wi.id);
      setFormValues(initial);
      setFormErrors({});
    }
  }, [activeFormId, currentInst]);

  const handleFormChange = useCallback((fieldName: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const handleAiSuggest = useCallback(async (workItemId: string) => {
    if (!currentInst) return;
    setAiLoading(true);
    try {
      const result = await fetchApi<{
        suggestions: Record<string, string>;
        confidence: number;
        source: string;
      }>(`/api/workflow/${currentInst.id}/ai-suggest`, {
        method: "POST",
        body: JSON.stringify({ workItemId }),
      });
      if (result.suggestions && Object.keys(result.suggestions).length > 0) {
        setFormValues((prev) => ({ ...prev, ...result.suggestions }));
      }
    } catch {
      // No suggestions available
    } finally {
      setAiLoading(false);
    }
  }, [currentInst]);

  const handleSubmitWorkItem = useCallback((wi: WorkItem) => {
    if (!currentInst) return;
    const errors: Record<string, string> = {};
    for (const field of wi.fields) {
      if (field.type === "confirm") continue;
      const val = formValues[field.name]?.trim();
      if (field.required && !val) {
        errors[field.name] = `${field.label} ist erforderlich`;
      }
      if (val && field.validation) {
        const regex = new RegExp(field.validation);
        if (!regex.test(val)) {
          errors[field.name] = `Ungültiges Format`;
        }
      }
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    completeWorkItemMutation.mutate({
      installationId: currentInst.id,
      workItemId: wi.id,
      data: formValues,
    });
  }, [currentInst, formValues, completeWorkItemMutation]);

  const handleOverrideSubmit = useCallback(() => {
    if (!overrideTarget || !overrideReason.trim() || !currentInst) return;
    completeWorkItemMutation.mutate({
      installationId: currentInst.id,
      workItemId: overrideTarget.workItem.id,
      data: {},
      override: { reason: overrideReason.trim() },
    });
  }, [overrideTarget, overrideReason, currentInst, completeWorkItemMutation]);

  // Screenshot handlers
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) uploadMutation.mutate(file);
  }, [uploadMutation]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = "";
  }, [uploadMutation]);

  const handleApplyAll = useCallback(() => {
    if (!screenshotResult) return;
    const allActions = screenshotResult.results.flatMap((r) =>
      r.suggestedActions.map((a) => ({
        installationId: a.data.installationId as number,
        action: a.action,
        data: a.data,
      }))
    );
    if (allActions.length > 0) applyMutation.mutate(allActions);
  }, [screenshotResult, applyMutation]);

  // ─── Render ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="workflow-page">
        <div className="workflow-loading">
          <div className="spinner" />
          <span>Workflow-Daten laden...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workflow-page">
        <div className="workflow-error">
          Fehler beim Laden: {(error as Error).message}
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const { stats } = overview;
  const isSaving = completeWorkItemMutation.isPending;

  return (
    <div className="workflow-page">
      <div className="queue-header">
        <div>
          <h1>Workflow Queue</h1>
          <p className="page-subtitle">Vorgänge nacheinander abarbeiten</p>
        </div>
        <button
          className={`screenshot-toggle ${showScreenshot ? "active" : ""}`}
          onClick={() => setShowScreenshot(!showScreenshot)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          NB-Screenshot
        </button>
      </div>

      {/* Stats */}
      <div className="workflow-stats">
        <div className="workflow-stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Aktiv Gesamt</span>
        </div>
        <div className="workflow-stat-card stat-must">
          <span className="stat-value">{stats.mustOpen}</span>
          <span className="stat-label">Pflicht Offen</span>
        </div>
        <div className="workflow-stat-card stat-action">
          <span className="stat-value">{stats.openWorkItems}</span>
          <span className="stat-label">Aufgaben Offen</span>
        </div>
        <div className="workflow-stat-card stat-blocked">
          <span className="stat-value">{stats.blockedCount}</span>
          <span className="stat-label">Blockiert</span>
        </div>
        <div className="workflow-stat-card stat-ontrack">
          <span className="stat-value">{stats.onTrack}</span>
          <span className="stat-label">On Track</span>
        </div>
        <div className="workflow-stat-card stat-overdue">
          <span className="stat-value">{stats.overdue}</span>
          <span className="stat-label">Überfällig</span>
        </div>
      </div>

      {/* Queue Progress */}
      {totalInQueue > 0 && (
        <div className="queue-progress-bar">
          <div className="queue-progress-info">
            <span>Vorgang {currentQueuePos + 1} von {totalInQueue}</span>
            {sameNbInfo && sameNbInfo.total > 1 && (
              <span className="queue-nb-hint">{sameNbInfo.name}: {sameNbInfo.current}/{sameNbInfo.total}</span>
            )}
            {overdueInQueue > 0 && (
              <span className="queue-overdue-hint">{overdueInQueue} überfällig</span>
            )}
            {skippedIds.size > 0 && (
              <button className="queue-reset-skip" onClick={() => setSkippedIds(new Set())}>
                {skippedIds.size} übersprungen — zurücksetzen
              </button>
            )}
          </div>
          <div className="queue-bar">
            <div
              className="queue-bar-fill"
              style={{ width: `${totalInQueue > 0 ? ((currentQueuePos + 1) / totalInQueue) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Screenshot Sync (collapsible) */}
      {showScreenshot && (
        <div className="screenshot-section">
          <div
            className={`workflow-screenshot-area ${dragOver ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="upload-text">
              {uploadMutation.isPending
                ? "Screenshot wird analysiert..."
                : <>NB-Portal Screenshot <strong>hierher ziehen</strong> oder <strong>klicken</strong></>}
            </p>
          </div>

          {screenshotResult && (
            <div className="screenshot-results">
              <h3>Screenshot-Analyse ({screenshotResult.extractedCount} Einträge, {screenshotResult.matchedCount} zugeordnet)</h3>
              {screenshotResult.results.map((result, idx) => (
                <div key={idx} className="screenshot-result-item">
                  <div className="result-info">
                    <span className="result-name">{result.portalEntry.name || "Unbekannt"}</span>
                    <div className="result-details">
                      {result.portalEntry.vorgangsnummer && <span>VG: {result.portalEntry.vorgangsnummer}</span>}
                      {result.portalEntry.plz && <span>{result.portalEntry.plz} {result.portalEntry.ort}</span>}
                    </div>
                    <div className="result-match">
                      {result.match ? (
                        <span className={`confidence-badge ${result.match.confidence >= 0.8 ? "high" : result.match.confidence >= 0.5 ? "medium" : "low"}`}>
                          {Math.round(result.match.confidence * 100)}% {result.match.matchMethod}
                        </span>
                      ) : (
                        <span className="confidence-badge none">Kein Match</span>
                      )}
                    </div>
                  </div>
                  {result.suggestedActions.length > 0 && (
                    <div className="result-actions">
                      {result.suggestedActions.map((action, aIdx) => (
                        <button key={aIdx} className="action-btn primary" onClick={() => applyMutation.mutate([{
                          installationId: action.data.installationId as number,
                          action: action.action,
                          data: action.data,
                        }])} disabled={applyMutation.isPending}>
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {screenshotResult.actionRequiredCount > 0 && (
                <div className="bulk-actions">
                  <button className="action-btn secondary" onClick={() => setScreenshotResult(null)}>Verwerfen</button>
                  <button className="action-btn primary" onClick={handleApplyAll} disabled={applyMutation.isPending}>
                    {applyMutation.isPending ? "Wird ausgeführt..." : `Alle ${screenshotResult.actionRequiredCount} Aktionen ausführen`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ QUEUE CARD ═══════════════ */}
      {!currentInst ? (
        <div className="queue-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <h2>Alle Vorgänge abgearbeitet</h2>
          <p>
            {skippedIds.size > 0
              ? `${skippedIds.size} Vorgänge wurden übersprungen.`
              : "Keine offenen Aufgaben in der Queue."}
          </p>
          {skippedIds.size > 0 && (
            <button className="action-btn primary" onClick={() => { setSkippedIds(new Set()); setCurrentInstId(null); }}>
              Übersprungene zurückholen
            </button>
          )}
        </div>
      ) : (
        <div className={`queue-card ${currentInst.isOverdue ? "overdue" : ""} ${currentInst.status === "RUECKFRAGE" ? "action-needed" : ""}`}>
          {/* Overdue Banner */}
          {currentInst.isOverdue && (
            <div className="queue-overdue-banner">
              ÜBERFÄLLIG: {currentInst.daysInStatus} Tage im Status "{currentInst.statusLabel}"
            </div>
          )}

          {/* Wiedervorlage Note Banner */}
          {currentInst.wiedervorlageNote && (
            <div className="queue-wv-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Wiedervorlage vom {new Date(currentInst.wiedervorlageNote.dueDate).toLocaleDateString("de-DE")}
              {currentInst.wiedervorlageNote.note && `: ${currentInst.wiedervorlageNote.note}`}
              <button
                className="wv-dismiss"
                onClick={() => completeTaskMutation.mutate(currentInst.wiedervorlageNote!.taskId)}
                title="Wiedervorlage als erledigt markieren"
              >
                erledigt
              </button>
            </div>
          )}

          {/* Card Header */}
          <div className="queue-card-header">
            <span className={`status-badge ${currentInst.status}`}>
              {currentInst.statusLabel}
            </span>
            <div className="queue-card-info">
              <h2 className="queue-customer-name">{currentInst.customerName}</h2>
              <div className="queue-card-meta">
                <a
                  className="public-id"
                  href={`/netzanmeldungen/${currentInst.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Installation öffnen"
                >
                  {currentInst.publicId}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 3, verticalAlign: 'middle' }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
                {currentInst.gridOperator && <span>{currentInst.gridOperator}</span>}
                {currentInst.location && <span>{currentInst.location}</span>}
                {currentInst.address && <span>{currentInst.address}</span>}
              </div>
            </div>
            <div className="queue-card-stats">
              <span className={`days-badge ${currentInst.isOverdue ? "overdue" : ""}`}>
                {currentInst.daysInStatus} Tage
              </span>
              <div className="progress-mini">
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${
                      currentInst.progress.done / currentInst.progress.total >= 0.75
                        ? "high" : currentInst.progress.done / currentInst.progress.total >= 0.4
                        ? "medium" : "low"
                    }`}
                    style={{ width: `${currentInst.progress.total > 0 ? (currentInst.progress.done / currentInst.progress.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="progress-text">{currentInst.progress.done}/{currentInst.progress.total}</span>
              </div>
            </div>
          </div>

          {/* Success Flash */}
          {completedLabel && (
            <div className="queue-success-flash">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {completedLabel}
            </div>
          )}

          {/* ═══ Rückfrage-Antwort Approval ═══ */}
          {currentInst.pendingRueckfrageResponse && (
            <div className="queue-section">
              <div className="queue-wi active" style={{ borderLeftColor: "#f59e0b" }}>
                <div className="queue-wi-header">
                  <span className="queue-wi-priority must">MUST</span>
                  <span className="queue-wi-label">Rückfrage-Antwort prüfen & freigeben</span>
                </div>
                <div className="queue-wi-desc">
                  KI hat Dokumente generiert und Antwort-Email entworfen
                </div>
                <RueckfrageApproval
                  installationId={currentInst.id}
                  response={currentInst.pendingRueckfrageResponse}
                  onApprove={(p) => approveResponseMutation.mutate(p)}
                  onReject={(p) => rejectResponseMutation.mutate(p)}
                  isApproving={approveResponseMutation.isPending}
                  isRejecting={rejectResponseMutation.isPending}
                />
                {approveResponseMutation.isError && (
                  <div className="wi-field-error">
                    Fehler: {(approveResponseMutation.error as Error).message}
                  </div>
                )}
                {rejectResponseMutation.isError && (
                  <div className="wi-field-error">
                    Fehler: {(rejectResponseMutation.error as Error).message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ MUST Work Items (always expanded) ═══ */}
          {mustItems.filter((wi) => wi.id !== "approve_rueckfrage_response").length > 0 && (
            <div className="queue-section">
              <h3 className="queue-section-title">
                Offene Pflichtaufgaben ({mustItems.filter((wi) => wi.id !== "approve_rueckfrage_response").length})
              </h3>
              {mustItems.filter((wi) => wi.id !== "approve_rueckfrage_response").map((wi) => (
                <QueueWorkItem
                  key={wi.id}
                  wi={wi}
                  isActive={activeFormId === wi.id}
                  formValues={formValues}
                  formErrors={formErrors}
                  aiLoading={aiLoading}
                  isSaving={isSaving}
                  onToggle={() => handleToggleForm(wi)}
                  onFormChange={handleFormChange}
                  onAiSuggest={() => handleAiSuggest(wi.id)}
                  onSubmit={() => handleSubmitWorkItem(wi)}
                  onMastrAutoMatch={currentInst ? () => mastrAutoMatchMutation.mutate(currentInst.id) : undefined}
                  mastrLoading={mastrAutoMatchMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* ═══ Optional / Blocked Items (collapsible) ═══ */}
          {optionalItems.length > 0 && (
            <div className="queue-section optional">
              <button
                className="queue-section-toggle"
                onClick={() => setShowOptional(!showOptional)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: showOptional ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                Weitere Aufgaben ({optionalItems.length})
              </button>
              {showOptional && optionalItems.map((wi) => (
                <QueueWorkItem
                  key={wi.id}
                  wi={wi}
                  isActive={activeFormId === wi.id}
                  formValues={formValues}
                  formErrors={formErrors}
                  aiLoading={aiLoading}
                  isSaving={isSaving}
                  onToggle={() => handleToggleForm(wi)}
                  onFormChange={handleFormChange}
                  onAiSuggest={() => handleAiSuggest(wi.id)}
                  onSubmit={() => handleSubmitWorkItem(wi)}
                  onMastrAutoMatch={currentInst ? () => mastrAutoMatchMutation.mutate(currentInst.id) : undefined}
                  mastrLoading={mastrAutoMatchMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* ═══ Smart Note Input ═══ */}
          <SmartNoteInput
            installationId={currentInst.id}
            onActionsApplied={() => queryClient.invalidateQueries({ queryKey: ["workflow"] })}
          />

          {/* Task Tags (Wiedervorlagen) */}
          {currentInst.tasks.length > 0 && (
            <div className="queue-tasks">
              {currentInst.tasks.map((task) => (
                <span
                  key={task.id}
                  className={`task-tag ${task.isOverdue ? "overdue" : ""}`}
                  onClick={() => completeTaskMutation.mutate(task.id)}
                  title="Klick = erledigt"
                >
                  {task.isOverdue ? "! " : ""}{task.title}
                  {task.dueDate && (
                    <span className="task-date">
                      {new Date(task.dueDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* ═══ Bottom Action Bar ═══ */}
          <div className="queue-actions">
            <button className="action-btn secondary" onClick={handleSkip}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 4 15 12 5 20 5 4" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
              Überspringen
            </button>
            <button className="action-btn wv-action" onClick={handleOpenWiedervorlage}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Wiedervorlage
            </button>
            <button
              className="action-btn primary done-btn"
              onClick={handleDoneAndNext}
              disabled={mustItems.length > 0}
              title={mustItems.length > 0 ? `Noch ${mustItems.length} Pflichtaufgabe(n) offen` : "Weiter zum nächsten Vorgang"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {mustItems.length > 0
                ? `Noch ${mustItems.length} Pflicht offen`
                : "Erledigt & Weiter"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Wiedervorlage Modal */}
      {showWiedervorlage && currentInst && (
        <div className="wv-overlay" onClick={() => setShowWiedervorlage(false)}>
          <div className="wv-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Wiedervorlage setzen</h3>
            <p className="wv-subtitle">
              {currentInst.customerName} ({currentInst.publicId})
            </p>
            <label className="wv-label">
              Wann soll der Vorgang wieder erscheinen?
              <input
                type="date"
                className="wv-input"
                value={wiedervorlageDate}
                onChange={(e) => setWiedervorlageDate(e.target.value)}
              />
            </label>
            <label className="wv-label">
              Grund / Notiz
              <textarea
                className="wv-textarea"
                rows={3}
                placeholder="z.B. Warte auf Rückmeldung vom NB, Kunde schickt fehlende Unterlagen..."
                value={wiedervorlageReason}
                onChange={(e) => setWiedervorlageReason(e.target.value)}
              />
            </label>
            <div className="wv-actions">
              <button className="action-btn secondary" onClick={() => setShowWiedervorlage(false)}>
                Abbrechen
              </button>
              <button
                className="action-btn primary"
                onClick={handleSubmitWiedervorlage}
                disabled={!wiedervorlageDate || wiedervorlageMutation.isPending}
              >
                {wiedervorlageMutation.isPending ? "Wird gesetzt..." : "Wiedervorlage setzen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {overrideTarget && (
        <div className="wv-overlay" onClick={() => setOverrideTarget(null)}>
          <div className="override-modal" onClick={(e) => e.stopPropagation()}>
            <h3>"{overrideTarget.workItem.label}" ist blockiert</h3>
            <div className="override-blockers">
              {overrideTarget.workItem.blockedBy.map((blockerId) => {
                const blocker = overrideTarget.allWorkItems.find((w) => w.id === blockerId);
                return (
                  <div key={blockerId} className="override-blocker-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {blocker ? blocker.label : blockerId} fehlt
                  </div>
                );
              })}
            </div>
            <label className="wv-label">
              Trotzdem fortfahren? Grund eingeben:
              <input
                type="text"
                className="wv-input"
                placeholder="Begründung für Override..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </label>
            <div className="wv-actions">
              <button className="action-btn secondary" onClick={() => setOverrideTarget(null)}>Abbrechen</button>
              <button
                className="action-btn override"
                onClick={handleOverrideSubmit}
                disabled={!overrideReason.trim() || isSaving}
              >
                {isSaving ? "Wird ausgeführt..." : "Override mit Grund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Queue Work Item
// ═══════════════════════════════════════════════════════════════════════════

function QueueWorkItem({
  wi,
  isActive,
  formValues,
  formErrors,
  aiLoading,
  isSaving,
  onToggle,
  onFormChange,
  onAiSuggest,
  onSubmit,
  onMastrAutoMatch,
  mastrLoading,
}: {
  wi: WorkItem;
  isActive: boolean;
  formValues: Record<string, string>;
  formErrors: Record<string, string>;
  aiLoading: boolean;
  isSaving: boolean;
  onToggle: () => void;
  onFormChange: (fieldName: string, value: string) => void;
  onAiSuggest: () => void;
  onSubmit: () => void;
  onMastrAutoMatch?: () => void;
  mastrLoading?: boolean;
}) {
  const isMastrItem = wi.id === "register_mastr_solar" || wi.id === "register_mastr_speicher";
  const priorityClass = wi.priority.toLowerCase();

  return (
    <div className={`queue-wi ${priorityClass} ${wi.blocked ? "blocked" : ""} ${isActive ? "active" : ""}`}>
      <div className="queue-wi-header" onClick={onToggle}>
        <div className="queue-wi-status">
          {wi.blocked ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : isActive ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          ) : (
            <div className="queue-wi-checkbox" />
          )}
        </div>
        <div className="queue-wi-info">
          <span className="queue-wi-label">{wi.label}</span>
          <span className="queue-wi-desc">{wi.description}</span>
        </div>
        <span className={`queue-wi-priority ${priorityClass}`}>
          {wi.priority === "MUST" ? "Pflicht" : wi.priority === "SHOULD" ? "Empfohlen" : "Optional"}
        </span>
      </div>

      {isActive && !wi.blocked && (
        <div className="queue-wi-form">
          {wi.type === "confirm" ? (
            <div className="queue-wi-confirm">
              <button className="action-btn secondary" onClick={onToggle}>Abbrechen</button>
              <button className="action-btn primary" onClick={onSubmit} disabled={isSaving}>
                {isSaving ? "Wird ausgeführt..." : wi.label}
              </button>
            </div>
          ) : (
            <>
              {wi.fields.map((field) => (
                <div key={field.name} className="wi-field">
                  <label className="wi-field-label">
                    {field.label}
                    {field.required && <span className="wi-required">*</span>}
                  </label>
                  {field.type === "select" ? (
                    <select
                      className="wi-field-input"
                      value={formValues[field.name] || ""}
                      onChange={(e) => onFormChange(field.name, e.target.value)}
                    >
                      <option value="">Bitte wählen...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "date" ? "date" : "text"}
                      className={`wi-field-input ${formErrors[field.name] ? "error" : ""}`}
                      value={formValues[field.name] || ""}
                      placeholder={field.placeholder}
                      onChange={(e) => onFormChange(field.name, e.target.value)}
                    />
                  )}
                  {formErrors[field.name] && (
                    <span className="wi-field-error">{formErrors[field.name]}</span>
                  )}
                </div>
              ))}
              <div className="queue-wi-form-actions">
                <div className="queue-wi-form-suggest">
                  {isMastrItem && onMastrAutoMatch && (
                    <button className="action-btn mastr-match" onClick={onMastrAutoMatch} disabled={mastrLoading}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      {mastrLoading ? "Suche im MaStR..." : "MaStR Auto-Match"}
                    </button>
                  )}
                  {wi.aiSuggestable && !isMastrItem && (
                    <button className="action-btn ai-suggest" onClick={onAiSuggest} disabled={aiLoading}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22l-.75-12.07A4.001 4.001 0 0 1 12 2z" />
                        <path d="M8 10l-1.5 3H4" /><path d="M16 10l1.5 3H20" />
                      </svg>
                      {aiLoading ? "Lade..." : "KI-Vorschlag"}
                    </button>
                  )}
                </div>
                <div className="queue-wi-form-btns">
                  <button className="action-btn secondary" onClick={onToggle}>Abbrechen</button>
                  <button className="action-btn primary" onClick={onSubmit} disabled={isSaving}>
                    {isSaving ? "Wird gespeichert..." : "Speichern"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Smart Note Input
// ═══════════════════════════════════════════════════════════════════════════

type SmartNoteState = "IDLE" | "ANALYZING" | "RESULTS" | "APPLYING" | "DONE";

const ACTION_TYPE_CONFIG: Record<string, { icon: string; colorClass: string }> = {
  STATUS_CHANGE: { icon: "\u2192", colorClass: "status-change" },
  FIELD_UPDATE: { icon: "\u270E", colorClass: "field-update" },
  WIEDERVORLAGE: { icon: "\u23F0", colorClass: "wiedervorlage" },
  ADD_COMMENT: { icon: "\uD83D\uDCAC", colorClass: "comment" },
};

function SmartNoteInput({
  installationId,
  onActionsApplied,
}: {
  installationId: number;
  onActionsApplied: () => void;
}) {
  const [state, setState] = useState<SmartNoteState>("IDLE");
  const [noteText, setNoteText] = useState("");
  const [result, setResult] = useState<SmartNoteResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [applyResults, setApplyResults] = useState<string | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: (note: string) =>
      fetchApi<SmartNoteResult>(
        `/api/workflow/${installationId}/smart-notes`,
        { method: "POST", body: JSON.stringify({ note }) }
      ),
    onSuccess: (data) => {
      setResult(data);
      const autoSelected = new Set(
        data.suggestedActions
          .filter((a) => a.autoInclude)
          .map((a) => a.id)
      );
      setSelectedIds(autoSelected);
      setState("RESULTS");
    },
    onError: () => {
      setState("IDLE");
    },
  });

  const applyMutation = useMutation({
    mutationFn: (actions: Array<{ id: string; type: string; data: Record<string, unknown> }>) =>
      fetchApi<{ results: Array<{ id: string; success: boolean; error?: string }>; successCount: number; failedCount: number }>(
        `/api/workflow/${installationId}/smart-notes/apply`,
        { method: "POST", body: JSON.stringify({ actions, originalNote: noteText }) }
      ),
    onSuccess: (data) => {
      const msg = data.failedCount > 0
        ? `${data.successCount} erfolgreich, ${data.failedCount} fehlgeschlagen`
        : `${data.successCount} Aktionen ausgeführt`;
      setApplyResults(msg);
      setState("DONE");
      onActionsApplied();
      setTimeout(() => {
        setState("IDLE");
        setNoteText("");
        setResult(null);
        setSelectedIds(new Set());
        setApplyResults(null);
      }, 2500);
    },
    onError: () => {
      setState("RESULTS");
    },
  });

  const handleAnalyze = useCallback(() => {
    if (!noteText.trim()) return;
    setState("ANALYZING");
    analyzeMutation.mutate(noteText.trim());
  }, [noteText, analyzeMutation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  }, [handleAnalyze]);

  const handleToggleAction = useCallback((actionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(actionId)) next.delete(actionId);
      else next.add(actionId);
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    if (!result) return;
    const selected = result.suggestedActions.filter((a) => selectedIds.has(a.id));
    if (selected.length === 0) return;
    setState("APPLYING");
    applyMutation.mutate(
      selected.map((a) => ({ id: a.id, type: a.type, data: a.data as Record<string, unknown> }))
    );
  }, [result, selectedIds, applyMutation]);

  const handleDiscard = useCallback(() => {
    setState("IDLE");
    setResult(null);
    setSelectedIds(new Set());
  }, []);

  if (state === "DONE" && applyResults) {
    return (
      <div className="smart-note-section">
        <div className="sn-done-flash">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {applyResults}
        </div>
      </div>
    );
  }

  if (state === "RESULTS" && result) {
    return (
      <div className="smart-note-section">
        <div className="sn-understanding">{result.understanding}</div>
        <div className="smart-note-results">
          {result.suggestedActions.map((action) => {
            const config = ACTION_TYPE_CONFIG[action.type] || { icon: "?", colorClass: "comment" };
            const isSelected = selectedIds.has(action.id);
            return (
              <label
                key={action.id}
                className={`sn-action ${config.colorClass} ${isSelected ? "selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleAction(action.id)}
                  className="sn-action-check"
                />
                <span className="sn-action-icon">{config.icon}</span>
                <div className="sn-action-content">
                  <span className="sn-action-label">{action.label}</span>
                  <span className="sn-action-desc">{action.description}</span>
                </div>
                <span className={`sn-confidence ${action.confidence >= 0.8 ? "high" : action.confidence >= 0.6 ? "medium" : "low"}`}>
                  {Math.round(action.confidence * 100)}%
                </span>
              </label>
            );
          })}
        </div>
        <div className="sn-actions-bar">
          <button className="action-btn secondary" onClick={handleDiscard}>
            Verwerfen
          </button>
          <button
            className="action-btn primary"
            onClick={handleApply}
            disabled={selectedIds.size === 0}
          >
            Ausgewählte ausführen ({selectedIds.size})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="smart-note-section">
      <div className="smart-note-input-row">
        <textarea
          className="smart-note-input"
          rows={1}
          placeholder="Notiz / Info eingeben – KI erkennt Aktionen..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={state === "ANALYZING" || state === "APPLYING"}
          maxLength={2000}
        />
        <button
          className="smart-note-send"
          onClick={handleAnalyze}
          disabled={!noteText.trim() || state === "ANALYZING" || state === "APPLYING"}
          title="KI-Analyse starten"
        >
          {state === "ANALYZING" ? (
            <div className="sn-spinner" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22l-.75-12.07A4.001 4.001 0 0 1 12 2z" />
              <path d="M8 10l-1.5 3H4" /><path d="M16 10l1.5 3H20" />
            </svg>
          )}
        </button>
      </div>
      {analyzeMutation.isError && (
        <div className="sn-error">
          Fehler: {(analyzeMutation.error as Error).message}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RÜCKFRAGE APPROVAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function RueckfrageApproval({
  installationId,
  response,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  installationId: number;
  response: PendingRueckfrageResponse;
  onApprove: (params: {
    installationId: number;
    responseId: number;
    subject: string;
    body: string;
    selectedDocIndices: number[];
  }) => void;
  onReject: (params: { installationId: number; responseId: number; reason: string }) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const [subject, setSubject] = useState(response.draftSubject || "");
  const [body, setBody] = useState(response.draftBody || "");
  const [selectedDocs, setSelectedDocs] = useState<Set<number>>(() => {
    const suggested = response.analysisData?.suggestedDocuments || [];
    const initial = new Set<number>();
    response.generatedDocs.forEach((doc, i) => {
      // Pre-select docs that match suggestions or all if no suggestions
      if (
        suggested.length === 0 ||
        suggested.some(
          (s) =>
            doc.filename.toLowerCase().includes(s.toLowerCase()) ||
            doc.kategorie.toLowerCase().includes(s.toLowerCase()) ||
            doc.dokumentTyp.toLowerCase().includes(s.toLowerCase())
        )
      ) {
        initial.add(i);
      }
    });
    return initial;
  });
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const toggleDoc = (index: number) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleApprove = () => {
    onApprove({
      installationId,
      responseId: response.id,
      subject,
      body,
      selectedDocIndices: Array.from(selectedDocs),
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onReject({
      installationId,
      responseId: response.id,
      reason: rejectReason,
    });
  };

  const isBusy = isApproving || isRejecting;

  return (
    <div className="rr-approval">
      {/* Analysis Summary */}
      {response.analysisData?.summary && (
        <div className="rr-analysis">
          <span className="rr-analysis-label">KI-Analyse:</span>{" "}
          {response.analysisData.summary}
        </div>
      )}

      {/* Generated Documents */}
      {response.generatedDocs.length > 0 && (
        <div className="rr-docs">
          <div className="rr-docs-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            Generierte Dokumente ({selectedDocs.size}/{response.generatedDocs.length} ausgewählt)
          </div>
          {response.generatedDocs.map((doc, i) => (
            <label key={i} className="rr-doc-item">
              <input
                type="checkbox"
                checked={selectedDocs.has(i)}
                onChange={() => toggleDoc(i)}
                disabled={isBusy}
              />
              <span className="rr-doc-name">{doc.filename}</span>
              <span className="rr-doc-kategorie">{doc.kategorie}</span>
            </label>
          ))}
        </div>
      )}

      {/* Email Preview */}
      <div className="rr-email-preview">
        <div className="rr-email-recipient">
          <span className="rr-email-recipient-label">An:</span>{" "}
          {response.recipientEmail || "Keine Email-Adresse"}
        </div>
        <input
          type="text"
          className="rr-email-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Betreff..."
          disabled={isBusy}
        />
        <textarea
          className="rr-email-body"
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Email-Text..."
          disabled={isBusy}
        />
      </div>

      {/* Reject Form */}
      {showRejectForm && (
        <div className="rr-reject-reason">
          <textarea
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ablehnungsgrund eingeben..."
            disabled={isBusy}
          />
          <div className="rr-reject-actions">
            <button
              className="action-btn secondary"
              onClick={() => setShowRejectForm(false)}
              disabled={isBusy}
            >
              Abbrechen
            </button>
            <button
              className="action-btn reject"
              onClick={handleReject}
              disabled={!rejectReason.trim() || isBusy}
            >
              {isRejecting ? "Wird abgelehnt..." : "Ablehnen"}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="rr-actions">
        {!showRejectForm && (
          <button
            className="action-btn secondary"
            onClick={() => setShowRejectForm(true)}
            disabled={isBusy}
          >
            Ablehnen
          </button>
        )}
        <button
          className="action-btn primary"
          onClick={handleApprove}
          disabled={isBusy || !subject.trim() || !body.trim() || !response.recipientEmail}
        >
          {isApproving ? "Wird gesendet..." : `Freigeben & Senden (${selectedDocs.size} Dok.)`}
        </button>
      </div>

      {/* Errors */}
      {!response.recipientEmail && (
        <div className="rr-error">Keine Empfänger-Email vorhanden — Versand nicht möglich</div>
      )}
    </div>
  );
}
