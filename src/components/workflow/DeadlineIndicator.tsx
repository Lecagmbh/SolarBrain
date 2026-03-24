// Workflow V2: Deadline-Anzeige mit Ampel-Logik

interface DeadlineIndicatorProps {
  dueDate: string;
  warnDays?: number;
}

export default function DeadlineIndicator({ dueDate, warnDays = 2 }: DeadlineIndicatorProps) {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let status: "overdue" | "warning" | "ok";
  let label: string;

  if (diffDays < 0) {
    status = "overdue";
    label = `${Math.abs(diffDays)}d überfällig`;
  } else if (diffDays <= warnDays) {
    status = "warning";
    label = diffDays === 0 ? "Heute fällig" : `${diffDays}d verbleibend`;
  } else {
    status = "ok";
    label = `${diffDays}d verbleibend`;
  }

  return (
    <span className={`deadline-indicator ${status}`}>
      {status === "overdue" ? "!" : status === "warning" ? "⏰" : ""}
      {label}
    </span>
  );
}
