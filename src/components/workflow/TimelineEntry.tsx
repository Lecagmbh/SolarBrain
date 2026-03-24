// Workflow V2: Einzelner Timeline-Eintrag

interface TimelineEvent {
  id: number;
  type: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  createdBy: number | null;
}

interface TimelineEntryProps {
  event: TimelineEvent;
}

const TYPE_LABELS: Record<string, string> = {
  phase_changed: "Phase geändert",
  zustand_changed: "Zustand geändert",
  email_sent: "E-Mail gesendet",
  document_uploaded: "Dokument hochgeladen",
  nb_response_received: "NB-Antwort erhalten",
  deadline_set: "Frist gesetzt",
  manual_note: "Notiz",
  automation_executed: "Automation ausgeführt",
  error_occurred: "Fehler aufgetreten",
  storniert: "Storniert",
  inbox_item_created: "Inbox-Item erstellt",
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin}m`;
  if (diffH < 24) return `vor ${diffH}h`;
  if (diffD < 7) return `vor ${diffD}d`;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function renderPayload(type: string, payload: Record<string, unknown> | null) {
  if (!payload) return null;

  switch (type) {
    case "phase_changed":
      return (
        <div className="timeline-entry-payload">
          {payload.fromStatus ? (
            <div><span className="label">Status: </span><span className="value">{String(payload.fromStatus)} → {String(payload.toStatus)}</span></div>
          ) : null}
          {payload.comment ? <div><span className="label">Kommentar: </span><span className="value">{String(payload.comment)}</span></div> : null}
          {payload.migrated ? <div><span className="label">(migriert)</span></div> : null}
        </div>
      );
    case "manual_note":
      return (
        <div className="timeline-entry-payload">
          <span className="value">{String(payload.note || "")}</span>
        </div>
      );
    case "deadline_set":
      return (
        <div className="timeline-entry-payload">
          <span className="label">Frist: </span>
          <span className="value">{String(payload.deadlineType || "")} ({String(payload.days)}d)</span>
        </div>
      );
    case "error_occurred":
      return (
        <div className="timeline-entry-payload">
          <span className="value" style={{ color: "#f87171" }}>{String(payload.message || payload.details || "")}</span>
        </div>
      );
    case "storniert":
      return (
        <div className="timeline-entry-payload">
          {payload.comment ? <span className="value">{String(payload.comment)}</span> : null}
        </div>
      );
    default:
      // Generische Darstellung
      if (Object.keys(payload).length === 0) return null;
      return (
        <div className="timeline-entry-payload">
          {Object.entries(payload)
            .filter(([k]) => k !== "migrated" && k !== "source")
            .slice(0, 3)
            .map(([k, v]) => (
              <div key={k}><span className="label">{k}: </span><span className="value">{String(v)}</span></div>
            ))}
        </div>
      );
  }
}

export default function TimelineEntry({ event }: TimelineEntryProps) {
  return (
    <div className={`timeline-entry type-${event.type}`}>
      <div className="timeline-entry-header">
        <span className="timeline-entry-type">{TYPE_LABELS[event.type] || event.type}</span>
        <span className="timeline-entry-time">{formatTime(event.createdAt)}</span>
      </div>
      {renderPayload(event.type, event.payload)}
    </div>
  );
}

export type { TimelineEvent };
