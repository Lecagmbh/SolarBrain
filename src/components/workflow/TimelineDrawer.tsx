// Workflow V2: Timeline-Drawer (rechte Seite)

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../../services/apiClient";
import TimelineEntry from "./TimelineEntry";
import type { TimelineEvent } from "./TimelineEntry";

interface Installation {
  id: number;
  publicId: string;
  customerName: string | null;
  phase: string | null;
  zustand: string | null;
  status: string;
}

interface TimelineDrawerProps {
  installation: Installation;
  onClose: () => void;
}

interface TimelineResponse {
  events: TimelineEvent[];
  total: number;
}

const PHASE_LABELS: Record<string, string> = {
  einreichung: "Einreichung",
  genehmigung: "Genehmigung",
  ibn: "IBN",
  mastr: "MaStR",
  fertig: "Fertig",
};

const ZUSTAND_LABELS: Record<string, string> = {
  offen: "Offen",
  wartet: "Wartet",
  abgeschlossen: "Abgeschlossen",
  rueckfrage: "Rückfrage",
};

export default function TimelineDrawer({ installation, onClose }: TimelineDrawerProps) {
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<TimelineResponse>({
    queryKey: ["workflow", "v2", "timeline", installation.id],
    queryFn: () => apiGet(`/v2/installations/${installation.id}/timeline?limit=100`),
    staleTime: 10_000,
  });

  const addNote = useMutation({
    mutationFn: (noteText: string) =>
      apiPost(`/v2/installations/${installation.id}/events`, { note: noteText }),
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["workflow", "v2", "timeline", installation.id] });
    },
  });

  const handleAddNote = useCallback(() => {
    if (note.trim()) {
      addNote.mutate(note.trim());
    }
  }, [note, addNote]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  }, [handleAddNote]);

  return (
    <>
      <div className="timeline-overlay" onClick={onClose} />
      <div className="timeline-drawer">
        <div className="timeline-drawer-header">
          <h3>Timeline: {installation.publicId}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="timeline-drawer-info">
          <div className="timeline-drawer-info-row">
            <span className="timeline-drawer-info-label">Kunde</span>
            <span className="timeline-drawer-info-value">{installation.customerName || "–"}</span>
          </div>
          <div className="timeline-drawer-info-row">
            <span className="timeline-drawer-info-label">Phase</span>
            <span className="timeline-drawer-info-value">{PHASE_LABELS[installation.phase || ""] || installation.phase || "–"}</span>
          </div>
          <div className="timeline-drawer-info-row">
            <span className="timeline-drawer-info-label">Zustand</span>
            <span className="timeline-drawer-info-value">{ZUSTAND_LABELS[installation.zustand || ""] || installation.zustand || "–"}</span>
          </div>
        </div>

        <div className="timeline-note-input">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Notiz hinzufügen..."
            disabled={addNote.isPending}
          />
          <button onClick={handleAddNote} disabled={!note.trim() || addNote.isPending}>
            {addNote.isPending ? "..." : "Senden"}
          </button>
        </div>

        <div className="timeline-drawer-body">
          {isLoading ? (
            <div className="wf2-loading">
              <div className="wf2-spinner" />
              Lade Timeline...
            </div>
          ) : !data?.events.length ? (
            <div className="inbox-empty">
              <div className="inbox-empty-icon">📋</div>
              Keine Events vorhanden
            </div>
          ) : (
            <div className="timeline-list">
              {data.events.map((event) => (
                <TimelineEntry key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
