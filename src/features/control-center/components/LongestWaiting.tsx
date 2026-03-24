/**
 * LONGEST WAITING COMPONENT
 * Shows installations waiting longest at grid operators
 */

import { type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import type { LongestWaiting as LongestWaitingType } from "../types";

interface LongestWaitingProps {
  items: LongestWaitingType[];
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  } as CSSProperties,
  h3: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--dash-text)",
    margin: 0,
  } as CSSProperties,
  badge: {
    background: "rgba(212, 168, 67, 0.15)",
    color: "var(--dash-primary)",
    fontSize: "0.75rem",
    padding: "0.125rem 0.5rem",
    borderRadius: "6px",
    fontWeight: 600,
  } as CSSProperties,
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  } as CSSProperties,
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background 0.2s",
  } as CSSProperties,
  info: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  } as CSSProperties,
  publicId: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--dash-text)",
  } as CSSProperties,
  customerName: {
    fontSize: "0.75rem",
    color: "var(--dash-text-muted)",
  } as CSSProperties,
  meta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px",
  } as CSSProperties,
  nbName: {
    fontSize: "0.75rem",
    color: "var(--dash-text-subtle)",
  } as CSSProperties,
};

function getDaysStyle(waitDays: number): CSSProperties {
  return {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: waitDays > 30 ? "var(--dash-danger)" : "var(--dash-text-muted)",
  };
}

export function LongestWaiting({ items = [] }: LongestWaitingProps) {
  const navigate = useNavigate();

  if (!items || items.length === 0) {
    return null;
  }

  const handleItemClick = (id: number) => {
    navigate(`/netzanmeldungen/${id}`);
  };

  return (
    <div className="glass-card glass-card--no-hover" style={{ padding: "24px" }}>
      <div style={styles.header}>
        <h3 style={styles.h3}>
          <Clock size={13} /> Längste Wartezeiten
        </h3>
        <span style={styles.badge}>{items.length}</span>
      </div>
      <div style={styles.list}>
        {items.map((item) => (
          <div
            key={item.id}
            style={styles.item}
            onClick={() => handleItemClick(item.id)}
          >
            <div style={styles.info}>
              <span style={styles.publicId}>{item.publicId}</span>
              <span style={styles.customerName}>{item.customerName}</span>
            </div>
            <div style={styles.meta}>
              <span style={styles.nbName}>
                {item.netzbetreiber || "Unbekannt"}
              </span>
              <span style={getDaysStyle(item.waitDays)}>
                {item.waitDays} Tage
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
