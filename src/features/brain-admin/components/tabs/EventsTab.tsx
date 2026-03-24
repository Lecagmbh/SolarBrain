/**
 * Brain Events Tab - Event log and Universal Action
 */

import { useState, useEffect } from "react";
import { brainApi } from "../../api/brain.api";
import type { BrainEvent, BrainActionType } from "../../types/brain.types";

const ACTION_TYPES: { value: BrainActionType; label: string }[] = [
  { value: "summarize", label: "Zusammenfassen" },
  { value: "analyze", label: "Analysieren" },
  { value: "suggest", label: "Vorschlaege" },
  { value: "draft_reply", label: "Antwort entwerfen" },
  { value: "classify", label: "Klassifizieren" },
  { value: "extract", label: "Extrahieren" },
];

export function EventsTab() {
  const [events, setEvents] = useState<BrainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [limit, setLimit] = useState(50);

  // Unique filter values extracted from events
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Action state
  const [actionType, setActionType] = useState<BrainActionType>("summarize");
  const [actionInput, setActionInput] = useState("");
  const [actionResult, setActionResult] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadEvents();
  }, [eventTypeFilter, categoryFilter, limit]);

  const loadEvents = async () => {
    try {
      const res = await brainApi.getEvents({
        eventType: eventTypeFilter || undefined,
        category: categoryFilter || undefined,
        limit,
      });
      const items = res.events || [];
      setEvents(items);

      // Extract unique filter values
      const types = [...new Set(items.map((e) => e.eventType))].sort();
      const cats = [...new Set(items.map((e) => e.category).filter(Boolean))].sort();
      if (types.length > 0) setEventTypes(types);
      if (cats.length > 0) setCategories(cats);
    } catch (err) {
      console.error("Events laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionInput.trim()) return;

    setActionLoading(true);
    setActionResult("");
    setActionError("");
    try {
      const res = await brainApi.executeAction(actionType, actionInput.trim());
      setActionResult(res.result || "Keine Ergebnisse.");
    } catch (err) {
      setActionError("Aktion fehlgeschlagen. Bitte versuchen Sie es erneut.");
      console.error("Brain Action fehlgeschlagen:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatData = (data: Record<string, unknown>): string => {
    try {
      const str = JSON.stringify(data);
      return str.length > 80 ? str.substring(0, 80) + "..." : str;
    } catch {
      return "-";
    }
  };

  if (loading) {
    return <div className="brain-tab-loading"><div className="brain-spinner" /></div>;
  }

  return (
    <div className="brain-tab-content">
      {/* Filter Header */}
      <div className="brain-section-header">
        <h3>Event-Log ({events.length})</h3>
        <div className="brain-header-actions">
          <select
            className="brain-select"
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
          >
            <option value="">Alle Event-Typen</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            className="brain-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Alle Kategorien</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="brain-select"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={20}>20 Eintraege</option>
            <option value={50}>50 Eintraege</option>
            <option value={100}>100 Eintraege</option>
            <option value={200}>200 Eintraege</option>
          </select>
          <button className="brain-btn-ghost" onClick={loadEvents}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56M21 3v5h-5" />
            </svg>
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Events Table */}
      {events.length === 0 ? (
        <div className="brain-empty">Keine Events gefunden.</div>
      ) : (
        <div className="brain-table-wrap">
          <table className="brain-table">
            <thead>
              <tr>
                <th>Zeitpunkt</th>
                <th>Event-Typ</th>
                <th>Kategorie</th>
                <th>Entitaet</th>
                <th>Daten</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(event.createdAt).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <span className="brain-badge brain-badge-emerald">{event.eventType}</span>
                  </td>
                  <td>
                    {event.category ? (
                      <span className="brain-badge brain-badge-teal">{event.category}</span>
                    ) : (
                      <span className="brain-text-dim">-</span>
                    )}
                  </td>
                  <td>
                    {event.entityType ? (
                      <span style={{ fontSize: "0.8rem" }}>
                        {event.entityType}
                        {event.entityId && <span className="brain-text-dim"> #{event.entityId}</span>}
                      </span>
                    ) : (
                      <span className="brain-text-dim">-</span>
                    )}
                  </td>
                  <td>
                    <span className="brain-data-preview" title={JSON.stringify(event.data, null, 2)}>
                      {formatData(event.data)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Universal Action */}
      <div className="brain-action-section">
        <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e2e8f0", margin: "0 0 1rem 0" }}>
          Universal Action
        </h3>
        <div className="brain-action-controls">
          <div className="brain-form-group" style={{ minWidth: "180px" }}>
            <label>Aktionstyp</label>
            <select
              className="brain-select"
              value={actionType}
              onChange={(e) => setActionType(e.target.value as BrainActionType)}
              style={{ width: "100%" }}
            >
              {ACTION_TYPES.map((at) => (
                <option key={at.value} value={at.value}>{at.label}</option>
              ))}
            </select>
          </div>
          <div className="brain-form-group" style={{ flex: 1 }}>
            <label>Eingabe</label>
            <textarea
              className="brain-textarea"
              placeholder="Text eingeben, der verarbeitet werden soll..."
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              style={{ minHeight: "60px" }}
            />
          </div>
          <button
            className="brain-btn-primary"
            onClick={handleExecuteAction}
            disabled={actionLoading || !actionInput.trim()}
            style={{ alignSelf: "flex-end" }}
          >
            {actionLoading && <span className="brain-spinner-small" />}
            Ausfuehren
          </button>
        </div>

        {actionError && (
          <div className="brain-message brain-message-error" style={{ marginTop: "0.75rem" }}>
            <span>{actionError}</span>
            <button className="brain-message-close" onClick={() => setActionError("")}>x</button>
          </div>
        )}

        {actionResult && (
          <div className="brain-action-result">
            <div style={{ fontSize: "0.7rem", color: "#71717a", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Ergebnis
            </div>
            {actionResult}
          </div>
        )}
      </div>
    </div>
  );
}
