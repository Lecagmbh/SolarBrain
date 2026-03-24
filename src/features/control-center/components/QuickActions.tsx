/**
 * QUICK ACTIONS COMPONENT
 * Fast access to common admin actions
 */

import { type ReactNode, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Mail,
  Building2,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";

interface QuickAction {
  icon: ReactNode;
  label: string;
  path: string;
  primary?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: <Plus size={18} />, label: "Neuer Lead", path: "/wizard", primary: true },
  { icon: <Mail size={18} />, label: "Emails", path: "/emails" },
  { icon: <Building2 size={18} />, label: "Netzbetreiber", path: "/netzbetreiber" },
  { icon: <Users size={18} />, label: "Benutzer", path: "/benutzer" },
  { icon: <BarChart3 size={18} />, label: "Analytics", path: "/analytics" },
  { icon: <Settings size={18} />, label: "Einstellungen", path: "/settings/company" },
];

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
  actionsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: 0,
  } as CSSProperties,
};

export function QuickActions() {
  return (
    <div className="glass-card glass-card--no-hover" style={{ padding: "24px" }}>
      <div style={styles.header}>
        <h3 style={styles.h3}>Schnellaktionen</h3>
      </div>
      <div style={styles.actionsContainer}>
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className={action.primary ? "quick-action quick-action--primary" : "quick-action"}
            style={{ textDecoration: "none" }}
          >
            {action.icon} <span>{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
