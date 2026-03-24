// Workflow V2: Inbox + Pipeline + Timeline
// Ersetzt die alte WorkflowPage wenn Feature Flag "workflow_v2_inbox" aktiv

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../services/apiClient";
import InboxList from "../components/workflow/InboxList";
import PipelineBoard from "../components/workflow/PipelineBoard";
import TimelineDrawer from "../components/workflow/TimelineDrawer";
import DeadlineIndicator from "../components/workflow/DeadlineIndicator";
import type { InboxItemData } from "../components/workflow/InboxCard";
import type { PipelineData } from "../components/workflow/PipelineBoard";
import type { PipelineInstallation } from "../components/workflow/PipelineCard";
import "./WorkflowV2Page.css";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface InboxResponse {
  items: InboxItemData[];
  total: number;
}

interface DeadlineData {
  id: number;
  installationId: number;
  type: string;
  dueDate: string;
  warnDays: number;
  description: string | null;
  isTriggered: boolean;
  triggeredAt: string | null;
  createdAt: string;
  installation: {
    id: number;
    publicId: string;
    customerName: string | null;
  };
}

interface DeadlinesResponse {
  deadlines: DeadlineData[];
  total: number;
}

type Tab = "inbox" | "pipeline" | "deadlines";

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function WorkflowV2Page() {
  const [activeTab, setActiveTab] = useState<Tab>("inbox");
  const [timelineInstallation, setTimelineInstallation] = useState<PipelineInstallation | null>(null);

  // ─── API Hooks ────────────────────────────────────────────────────────

  const inbox = useQuery<InboxResponse>({
    queryKey: ["workflow", "v2", "inbox"],
    queryFn: () => apiGet("/v2/inbox"),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const pipeline = useQuery<PipelineData>({
    queryKey: ["workflow", "v2", "pipeline"],
    queryFn: () => apiGet("/v2/pipeline"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const deadlines = useQuery<DeadlinesResponse>({
    queryKey: ["workflow", "v2", "deadlines"],
    queryFn: () => apiGet("/v2/deadlines?triggered=false"),
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: activeTab === "deadlines",
  });

  // ─── Computed ─────────────────────────────────────────────────────────

  const inboxCount = inbox.data?.total ?? 0;
  const pipelineTotal = pipeline.data?.total ?? 0;
  const deadlineCount = deadlines.data?.total ?? 0;

  const deadlinesByUrgency = useMemo(() => {
    if (!deadlines.data?.deadlines) return { overdue: [], warning: [], ok: [] };
    const now = new Date();
    const result: { overdue: DeadlineData[]; warning: DeadlineData[]; ok: DeadlineData[] } = { overdue: [], warning: [], ok: [] };

    for (const d of deadlines.data.deadlines) {
      const due = new Date(d.dueDate);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) result.overdue.push(d);
      else if (diffDays <= d.warnDays) result.warning.push(d);
      else result.ok.push(d);
    }
    return result;
  }, [deadlines.data]);

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleCardClick = (inst: PipelineInstallation) => {
    setTimelineInstallation(inst);
  };

  const handleRefresh = () => {
    inbox.refetch();
    pipeline.refetch();
    if (activeTab === "deadlines") deadlines.refetch();
  };

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="wf2-page">
      {/* Header */}
      <div className="wf2-header">
        <div>
          <h1>Workflow</h1>
          <p className="page-subtitle">
            Inbox, Pipeline & Timeline {pipelineTotal > 0 && `· ${pipelineTotal} Vorgänge`}
          </p>
        </div>
        <div className="wf2-header-actions">
          <button className="wf2-refresh-btn" onClick={handleRefresh}>
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="wf2-tab-bar">
        <button
          className={`wf2-tab ${activeTab === "inbox" ? "active" : ""}`}
          onClick={() => setActiveTab("inbox")}
        >
          Inbox
          {inboxCount > 0 && <span className="count-badge">{inboxCount}</span>}
        </button>
        <button
          className={`wf2-tab ${activeTab === "pipeline" ? "active" : ""}`}
          onClick={() => setActiveTab("pipeline")}
        >
          Pipeline
          {pipelineTotal > 0 && <span className="count-badge">{pipelineTotal}</span>}
        </button>
        <button
          className={`wf2-tab ${activeTab === "deadlines" ? "active" : ""}`}
          onClick={() => setActiveTab("deadlines")}
        >
          Fristen
          {deadlineCount > 0 && <span className="count-badge">{deadlineCount}</span>}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "inbox" && (
        <InboxList items={inbox.data?.items ?? []} isLoading={inbox.isLoading} />
      )}

      {activeTab === "pipeline" && (
        <PipelineBoard
          data={pipeline.data}
          isLoading={pipeline.isLoading}
          onCardClick={handleCardClick}
        />
      )}

      {activeTab === "deadlines" && (
        <div>
          {deadlines.isLoading ? (
            <div className="wf2-loading">
              <div className="wf2-spinner" />
              Lade Fristen...
            </div>
          ) : (deadlines.data?.deadlines.length ?? 0) === 0 ? (
            <div className="inbox-empty">
              <div className="inbox-empty-icon">&#x23F0;</div>
              <div>Keine aktiven Fristen</div>
            </div>
          ) : (
            <div className="deadlines-list">
              {deadlinesByUrgency.overdue.map((d) => (
                <DeadlineCard key={d.id} deadline={d} status="overdue" onClick={handleCardClick} />
              ))}
              {deadlinesByUrgency.warning.map((d) => (
                <DeadlineCard key={d.id} deadline={d} status="warning" onClick={handleCardClick} />
              ))}
              {deadlinesByUrgency.ok.map((d) => (
                <DeadlineCard key={d.id} deadline={d} status="ok" onClick={handleCardClick} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline Drawer */}
      {timelineInstallation && (
        <TimelineDrawer
          installation={timelineInstallation}
          onClose={() => setTimelineInstallation(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE: DeadlineCard (nur auf dieser Seite gebraucht)
// ═══════════════════════════════════════════════════════════════════════════

function DeadlineCard({
  deadline,
  status,
  onClick,
}: {
  deadline: DeadlineData;
  status: "overdue" | "warning" | "ok";
  onClick: (inst: PipelineInstallation) => void;
}) {
  const handleClick = () => {
    onClick({
      id: deadline.installationId,
      publicId: deadline.installation.publicId,
      customerName: deadline.installation.customerName,
      gridOperator: null,
      phase: null,
      zustand: null,
      status: "",
      priority: null,
      createdAt: "",
      updatedAt: "",
      nbEingereichtAm: null,
      nbGenehmigungAm: null,
    });
  };

  return (
    <div className={`deadline-card ${status}`} onClick={handleClick} style={{ cursor: "pointer" }}>
      <div className="deadline-card-body">
        <div className="deadline-card-title">{deadline.description || deadline.type}</div>
        <div className="deadline-card-meta">
          {deadline.installation.publicId}
          {deadline.installation.customerName && ` · ${deadline.installation.customerName}`}
        </div>
      </div>
      <div className={`deadline-card-due ${status}`}>
        <DeadlineIndicator dueDate={deadline.dueDate} warnDays={deadline.warnDays} />
      </div>
    </div>
  );
}
