export type EmailActionsProps = {
  onAssign?: () => void;
  onCategory?: () => void;
  onIgnore?: () => void;
};

export function EmailActions({ onAssign, onCategory, onIgnore }: EmailActionsProps) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button
        type="button"
        onClick={onAssign}
        style={{
          padding: "4px 8px",
          borderRadius: 6,
          border: "1px solid rgba(52,211,153,0.5)",
          background: "rgba(6,78,59,0.9)",
          color: "#bbf7d0",
          fontSize: 11,
          cursor: "pointer",
        }}
      >
        Zuordnen
      </button>
      <button
        type="button"
        onClick={onCategory}
        style={{
          padding: "4px 8px",
          borderRadius: 6,
          border: "1px solid rgba(59,130,246,0.5)",
          background: "rgba(30,64,175,0.9)",
          color: "#bfdbfe",
          fontSize: 11,
          cursor: "pointer",
        }}
      >
        Kategorie
      </button>
      <button
        type="button"
        onClick={onIgnore}
        style={{
          padding: "4px 8px",
          borderRadius: 6,
          border: "1px solid rgba(148,163,184,0.5)",
          background: "rgba(15,23,42,0.9)",
          color: "#e5e7eb",
          fontSize: 11,
          cursor: "pointer",
        }}
      >
        Ignorieren
      </button>
    </div>
  );
}

export default EmailActions;
