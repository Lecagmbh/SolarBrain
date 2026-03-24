// Workflow V2: Inbox-Liste mit Priority-Gruppierung

import InboxCard from "./InboxCard";
import type { InboxItemData } from "./InboxCard";

interface InboxListProps {
  items: InboxItemData[];
  isLoading: boolean;
}

export default function InboxList({ items, isLoading }: InboxListProps) {
  if (isLoading) {
    return (
      <div className="wf2-loading">
        <div className="wf2-spinner" />
        Lade Inbox...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="inbox-empty">
        <div className="inbox-empty-icon">&#x2705;</div>
        <div>Keine offenen Aufgaben</div>
      </div>
    );
  }

  // Gruppiere nach Priority
  const critical = items.filter((i) => i.priority === "CRITICAL");
  const high = items.filter((i) => i.priority === "HIGH");
  const normal = items.filter((i) => i.priority === "NORMAL");
  const low = items.filter((i) => i.priority === "LOW");

  return (
    <div>
      {critical.length > 0 && (
        <div className="inbox-section">
          <div className="inbox-section-title" style={{ color: "#f87171" }}>Kritisch ({critical.length})</div>
          <div className="inbox-list">
            {critical.map((item) => <InboxCard key={item.id} item={item} />)}
          </div>
        </div>
      )}
      {high.length > 0 && (
        <div className="inbox-section">
          <div className="inbox-section-title" style={{ color: "#fbbf24" }}>Hoch ({high.length})</div>
          <div className="inbox-list">
            {high.map((item) => <InboxCard key={item.id} item={item} />)}
          </div>
        </div>
      )}
      {normal.length > 0 && (
        <div className="inbox-section">
          <div className="inbox-section-title">Normal ({normal.length})</div>
          <div className="inbox-list">
            {normal.map((item) => <InboxCard key={item.id} item={item} />)}
          </div>
        </div>
      )}
      {low.length > 0 && (
        <div className="inbox-section">
          <div className="inbox-section-title">Niedrig ({low.length})</div>
          <div className="inbox-list">
            {low.map((item) => <InboxCard key={item.id} item={item} />)}
          </div>
        </div>
      )}
    </div>
  );
}
