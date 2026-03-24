export type SmartActionsProps = {
  onApplyStatus?: () => void;
  onAiSummary?: () => void;
  onOpenEmails?: () => void;
};

export function SmartActions({
  onApplyStatus,
  onAiSummary,
  onOpenEmails,
}: SmartActionsProps) {
  return (
    <div style={{ display: "flex", gap: 8, padding: 16 }}>
      <button
        type="button"
        onClick={onApplyStatus}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid rgba(148,163,184,0.4)",
          background: "rgba(15,23,42,0.9)",
          color: "#e5e7eb",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        Status aktualisieren
      </button>
      <button
        type="button"
        onClick={onAiSummary}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid rgba(52,211,153,0.4)",
          background: "rgba(6,78,59,0.9)",
          color: "#bbf7d0",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        KI-Zusammenfassung
      </button>
      <button
        type="button"
        onClick={onOpenEmails}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid rgba(59,130,246,0.4)",
          background: "rgba(30,64,175,0.9)",
          color: "#bfdbfe",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        E-Mails anzeigen
      </button>
    </div>
  );
}

export default SmartActions;
