/**
 * Status Timeline Component
 * =========================
 * Zeigt den kompletten Verlauf: Status, E-Mails, Nachrichten und Dokumente.
 * Mit Filter-Tabs und Document-Events.
 */

import { useState, useMemo } from "react";
import { type TimelineEntry } from "../api";
import { EmailModal } from "./EmailModal";
import {
  CheckCircle,
  Circle,
  AlertCircle,
  Clock,
  Send,
  FileCheck,
  Zap,
  Mail,
  MailOpen,
  MessageSquare,
  ExternalLink,
  Upload,
} from "lucide-react";
import "./timeline.css";

type FilterType = "status" | "all" | "email" | "message" | "document";

interface StatusTimelineProps {
  entries: TimelineEntry[];
  currentStatus: string;
  installationId: number;
  defaultFilter?: FilterType;
  showFilters?: boolean;
  maxEntries?: number;
  onShowMore?: () => void;
}

export function StatusTimeline({
  entries,
  currentStatus,
  installationId,
  defaultFilter = "status",
  showFilters = true,
  maxEntries,
  onShowMore,
}: StatusTimelineProps) {
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>(defaultFilter);

  // Count entries per type
  const counts = useMemo(() => {
    const c = { status: 0, email: 0, message: 0, document: 0, all: entries.length };
    for (const e of entries) {
      if (e.type in c) c[e.type as keyof typeof c]++;
    }
    return c;
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (activeFilter === "all") return entries;
    return entries.filter((e) => e.type === activeFilter);
  }, [entries, activeFilter]);

  // Apply max entries limit
  const displayEntries = maxEntries ? filteredEntries.slice(0, maxEntries) : filteredEntries;
  const hasMore = maxEntries ? filteredEntries.length > maxEntries : false;

  if (entries.length === 0) {
    return (
      <div className="stl-empty">
        Noch keine Einträge vorhanden.
      </div>
    );
  }

  const handleEmailClick = (emailId: number | undefined) => {
    if (emailId) {
      setSelectedEmailId(emailId);
    }
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "status", label: "Status" },
    { key: "all", label: "Alle" },
    { key: "email", label: "E-Mails" },
    { key: "message", label: "Nachrichten" },
    { key: "document", label: "Dokumente" },
  ];

  return (
    <>
      {/* Filter Tabs */}
      {showFilters && (
        <div className="stl-filters">
          {filters.map((f) => (
            <button
              key={f.key}
              className={`stl-filter-btn ${activeFilter === f.key ? "stl-filter-btn--active" : ""}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
              {counts[f.key] > 0 && (
                <span className="stl-filter-count">{counts[f.key]}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {filteredEntries.length === 0 ? (
        <div className="stl-empty">
          Keine Einträge für diesen Filter.
        </div>
      ) : (
        <div className="stl-timeline">
          {/* Timeline Line */}
          <div className="stl-line" />

          {/* Entries */}
          <div className="stl-entries">
            {displayEntries.map((entry, index) => {
              const isEmail = entry.type === "email";
              const emailId = entry.meta?.emailId;

              return (
                <div
                  key={entry.id}
                  className={`stl-entry ${isEmail ? "stl-entry--clickable" : ""}`}
                  onClick={isEmail ? () => handleEmailClick(emailId) : undefined}
                >
                  {/* Icon */}
                  <div className="stl-icon-wrap">
                    <EntryIcon entry={entry} isLatest={index === 0} />
                  </div>

                  {/* Content */}
                  <div className="stl-content">
                    <div className="stl-header">
                      <h4 className="stl-title">
                        {entry.title}
                        {isEmail && (
                          <>
                            <span className="stl-badge stl-badge--blue">E-Mail</span>
                            <ExternalLink size={12} className="stl-open-icon" />
                          </>
                        )}
                        {entry.type === "message" && (
                          <span className="stl-badge stl-badge--purple">Nachricht</span>
                        )}
                        {entry.type === "document" && (
                          <span className="stl-badge stl-badge--green">Dokument</span>
                        )}
                      </h4>
                      <time className="stl-time">
                        {formatDateTime(entry.date)}
                      </time>
                    </div>
                    {entry.description && (
                      <p className="stl-comment">{entry.description}</p>
                    )}
                    {/* E-Mail Preview */}
                    {isEmail && entry.meta?.preview && (
                      <p className="stl-preview">{entry.meta.preview}...</p>
                    )}
                    {/* Klick-Hinweis für E-Mails */}
                    {isEmail && (
                      <span className="stl-click-hint">Klicken zum Öffnen</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show More */}
          {hasMore && (
            <div className="stl-show-more">
              <button className="stl-show-more-btn" onClick={onShowMore}>
                Kompletten Verlauf anzeigen ({filteredEntries.length - (maxEntries || 0)} weitere)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Email Modal */}
      {selectedEmailId && (
        <EmailModal
          installationId={installationId}
          emailId={selectedEmailId}
          onClose={() => setSelectedEmailId(null)}
        />
      )}
    </>
  );
}

function EntryIcon({ entry, isLatest }: { entry: TimelineEntry; isLatest: boolean }) {
  const getIcon = () => {
    // E-Mail-Icons
    if (entry.type === "email") {
      if (entry.meta?.direction === "INBOUND") {
        return <MailOpen size={14} />;
      }
      return <Mail size={14} />;
    }

    // Nachrichten-Icon
    if (entry.type === "message") {
      return <MessageSquare size={14} />;
    }

    // Dokument-Icon
    if (entry.type === "document") {
      return <Upload size={14} />;
    }

    // Status-Icons
    const status = entry.meta?.toStatus || "";
    switch (status) {
      case "EINGANG":
        return <Circle size={14} />;
      case "BEIM_NB":
        return <Send size={14} />;
      case "RUECKFRAGE":
        return <AlertCircle size={14} />;
      case "GENEHMIGT":
        return <FileCheck size={14} />;
      case "IBN":
        return <Zap size={14} />;
      case "FERTIG":
        return <CheckCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const getColorClass = () => {
    // E-Mails: blau
    if (entry.type === "email") {
      return isLatest ? "stl-icon--blue-solid" : "stl-icon--blue";
    }

    // Nachrichten: lila
    if (entry.type === "message") {
      return isLatest ? "stl-icon--purple-solid" : "stl-icon--purple";
    }

    // Dokumente: emerald/grün
    if (entry.type === "document") {
      return isLatest ? "stl-icon--emerald-solid" : "stl-icon--emerald";
    }

    // Status-Farben
    const status = entry.meta?.toStatus || "";
    if (status === "RUECKFRAGE") {
      return isLatest ? "stl-icon--red-solid" : "stl-icon--red";
    }
    if (status === "FERTIG" || status === "GENEHMIGT") {
      return isLatest ? "stl-icon--green-solid" : "stl-icon--green";
    }
    return isLatest ? "stl-icon--indigo-solid" : "stl-icon--gray";
  };

  return (
    <div className={`stl-icon ${getColorClass()}`}>
      {getIcon()}
    </div>
  );
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
