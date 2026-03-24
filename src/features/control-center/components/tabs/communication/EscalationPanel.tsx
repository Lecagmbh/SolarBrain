/**
 * ESCALATION PANEL
 * Zeigt offene Eskalationen (Reminder, Escalation, Customer Update)
 * mit Aktionen: Ausführen / Überspringen
 */

import { useState } from "react";
import {
  Bell,
  Play,
  SkipForward,
  Clock,
  AlertTriangle,
  Mail,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { s } from "./styles";
import type { EscalationItem } from "./types";
import { ESCALATION_TYPE_CONFIG, formatDate } from "./types";

interface Props {
  escalations: EscalationItem[];
  loading: boolean;
  onExecute: (id: number) => void;
  onSkip: (id: number) => void;
}

export function EscalationPanel({ escalations, loading, onExecute, onSkip }: Props) {
  const [executing, setExecuting] = useState<number | null>(null);

  const pending = escalations.filter(e => e.status === "PENDING");
  const executed = escalations.filter(e => e.status === "EXECUTED");

  const handleExecute = async (id: number) => {
    setExecuting(id);
    await onExecute(id);
    setExecuting(null);
  };

  if (loading) {
    return (
      <div style={s.loading}>
        <Loader2 size={20} style={{ animation: "comm-spin 1s linear infinite" }} />
        Lade Eskalationen...
      </div>
    );
  }

  if (escalations.length === 0) {
    return (
      <div style={s.empty}>
        <Bell size={32} />
        <span>Keine Eskalationen</span>
        <span style={{ fontSize: "0.75rem", color: "#52525b" }}>
          Eskalationen werden automatisch erstellt wenn Netzbetreiber nicht antworten
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px", padding: "16px" }}>
      {/* Pending Escalations */}
      {pending.length > 0 && (
        <>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#f59e0b", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
            Ausstehend ({pending.length})
          </div>
          {pending.map(esc => {
            const typeConfig = ESCALATION_TYPE_CONFIG[esc.type] || { label: esc.type, color: "#71717a" };
            return (
              <div key={esc.id} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                padding: "14px",
                display: "flex",
                flexDirection: "column" as const,
                gap: "8px",
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    ...s.typeBadge,
                    color: typeConfig.color,
                    background: `${typeConfig.color}20`,
                  }}>
                    {esc.type === "ESCALATION" ? <AlertTriangle size={10} /> : esc.type === "REMINDER" ? <Clock size={10} /> : <Mail size={10} />}
                    {typeConfig.label}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#71717a" }}>
                    Geplant: {formatDate(esc.scheduledFor)}
                  </span>
                  {esc.installationPublicId && (
                    <a
                      href={`/netzanmeldungen?id=${esc.installationId}`}
                      style={{ ...s.installationLink, fontSize: "0.7rem", marginLeft: "auto" }}
                    >
                      {esc.installationPublicId}
                      <ExternalLink size={9} />
                    </a>
                  )}
                </div>

                {/* Reason */}
                <div style={{ fontSize: "0.8rem", color: "#e2e8f0", lineHeight: 1.5 }}>
                  {esc.reason}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button
                    className="comm-action-btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#a1a1aa",
                      padding: "5px 10px",
                      borderRadius: "6px",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                    }}
                    onClick={() => onSkip(esc.id)}
                  >
                    <SkipForward size={11} />
                    Überspringen
                  </button>
                  <button
                    className="comm-action-btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "rgba(212,168,67,0.2)",
                      border: "1px solid rgba(212,168,67,0.4)",
                      color: "#a5b4fc",
                      padding: "5px 10px",
                      borderRadius: "6px",
                      fontSize: "0.72rem",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                    onClick={() => handleExecute(esc.id)}
                    disabled={executing === esc.id}
                  >
                    {executing === esc.id ? (
                      <Loader2 size={11} style={{ animation: "comm-spin 1s linear infinite" }} />
                    ) : (
                      <Play size={11} />
                    )}
                    Ausführen
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Executed (collapsed) */}
      {executed.length > 0 && (
        <>
          <div style={{ fontSize: "0.72rem", color: "#52525b", marginTop: "8px" }}>
            {executed.length} bereits ausgeführt
          </div>
        </>
      )}
    </div>
  );
}
