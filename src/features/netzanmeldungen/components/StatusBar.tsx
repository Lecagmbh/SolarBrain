const STATUS_COLORS: Record<string, string> = {
  eingang: "#3b82f6",
  beim_nb: "#f59e0b",
  rueckfrage: "#ef4444",
  genehmigt: "#22c55e",
  ibn: "#a855f7",
  fertig: "#10b981",
  storniert: "#6b7280",
};

interface StatusBarProps {
  statusBreakdown: Record<string, number>;
  total: number;
  className?: string;
}

export function StatusBar({ statusBreakdown, total, className }: StatusBarProps) {
  if (total === 0) return null;

  const segments = Object.entries(statusBreakdown)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => {
      const order = ["eingang", "beim_nb", "rueckfrage", "genehmigt", "ibn", "fertig", "storniert"];
      return order.indexOf(a) - order.indexOf(b);
    });

  return (
    <div
      className={className}
      style={{
        display: "flex",
        height: 3,
        borderRadius: 2,
        overflow: "hidden",
        background: "rgba(255,255,255,0.06)",
        width: "100%",
      }}
    >
      {segments.map(([status, count]) => (
        <div
          key={status}
          style={{
            width: `${(count / total) * 100}%`,
            background: STATUS_COLORS[status] || "#6b7280",
            transition: "width 0.4s ease-out",
            minWidth: count > 0 ? 2 : 0,
          }}
        />
      ))}
    </div>
  );
}
