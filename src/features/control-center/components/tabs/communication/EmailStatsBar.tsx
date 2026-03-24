/**
 * EMAIL STATS BAR
 * Filterbare Statistik-Karten für Inbox und Sent
 */

import {
  Inbox,
  AlertTriangle,
  Check,
  HelpCircle,
  XCircle,
} from "lucide-react";
import { s } from "./styles";
import type { InboxStats, SentStats } from "./types";
import { SENT_STATUS_CONFIG } from "./types";

interface InboxStatsBarProps {
  stats: InboxStats;
  filter: string;
  onFilter: (filter: string) => void;
}

export function InboxStatsBar({ stats, filter, onFilter }: InboxStatsBarProps) {
  const items = [
    { key: "all", icon: Inbox, color: "#D4A843", value: stats.total, label: "Gesamt" },
    { key: "unassigned", icon: AlertTriangle, color: "#f59e0b", value: stats.unassigned, label: "Nicht zugeordnet" },
    { key: "genehmigung", icon: Check, color: "#10b981", value: stats.genehmigungen, label: "Genehmigungen" },
    { key: "rueckfrage", icon: HelpCircle, color: "#f59e0b", value: stats.rueckfragen, label: "Rückfragen" },
    { key: "ablehnung", icon: XCircle, color: "#ef4444", value: stats.ablehnungen, label: "Ablehnungen" },
  ];

  return (
    <div style={s.statsRow}>
      {items.map(({ key, icon: Icon, color, value, label }) => {
        const isActive = filter === key;
        return (
          <button
            key={key}
            style={isActive ? s.statCardActive : s.statCard}
            onClick={() => onFilter(isActive && key !== "all" ? "all" : key)}
          >
            <Icon size={16} style={{ color }} />
            <div>
              <div style={s.statValue}>{value}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface SentStatsBarProps {
  stats: SentStats;
  filter: string;
  onFilter: (filter: string) => void;
}

export function SentStatsBar({ stats, filter, onFilter }: SentStatsBarProps) {
  return (
    <div style={s.statsRow}>
      {Object.entries(SENT_STATUS_CONFIG).map(([key, config]) => {
        const count = stats[key as keyof SentStats] || 0;
        const Icon = config.icon;
        const isActive = filter === key;
        return (
          <button
            key={key}
            style={isActive ? s.statCardActive : s.statCard}
            onClick={() => onFilter(isActive ? "all" : key)}
          >
            <Icon size={16} style={{ color: config.color }} />
            <div>
              <div style={s.statValue}>{count}</div>
              <div style={s.statLabel}>{config.label}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
