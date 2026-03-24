/**
 * EMAIL LIST TOOLBAR
 * Sort-Dropdown + Group-Toggle + Email-Zähler
 */

import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  User,
  Tag,
  LayoutList,
} from "lucide-react";
import { s } from "./styles";
import type { SortBy, SortOrder, GroupMode } from "./types";

interface Props {
  sortBy: SortBy;
  sortOrder: SortOrder;
  groupMode: GroupMode;
  emailCount: number;
  totalCount: number;
  onSortByChange: (v: SortBy) => void;
  onSortOrderToggle: () => void;
  onGroupModeChange: (v: GroupMode) => void;
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "receivedAt", label: "Datum" },
  { value: "fromAddress", label: "Absender" },
  { value: "subject", label: "Betreff" },
  { value: "aiType", label: "AI-Typ" },
];

const GROUP_OPTIONS: { value: GroupMode; label: string; icon: typeof Calendar }[] = [
  { value: "date", label: "Datum", icon: Calendar },
  { value: "sender", label: "Absender", icon: User },
  { value: "aiType", label: "AI-Typ", icon: Tag },
  { value: "none", label: "Keine", icon: LayoutList },
];

export function EmailListToolbar({
  sortBy,
  sortOrder,
  groupMode,
  emailCount,
  totalCount,
  onSortByChange,
  onSortOrderToggle,
  onGroupModeChange,
}: Props) {
  const SortIcon = sortOrder === "asc" ? ArrowUp : ArrowDown;

  return (
    <div style={s.toolbarRow}>
      {/* Sort */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <ArrowUpDown size={12} style={{ color: "#71717a", flexShrink: 0 }} />
        <select
          style={s.toolbarSelect}
          value={sortBy}
          onChange={e => onSortByChange(e.target.value as SortBy)}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button className="comm-tb-btn" style={s.toolbarBtn} onClick={onSortOrderToggle} title={sortOrder === "asc" ? "Aufsteigend" : "Absteigend"}>
          <SortIcon size={12} />
        </button>
      </div>

      {/* Group */}
      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        {GROUP_OPTIONS.map(o => {
          const Icon = o.icon;
          const active = groupMode === o.value;
          return (
            <button
              key={o.value}
              className="comm-tb-btn"
              style={active ? s.toolbarBtnActive : s.toolbarBtn}
              onClick={() => onGroupModeChange(o.value)}
              title={`Gruppieren: ${o.label}`}
            >
              <Icon size={12} />
            </button>
          );
        })}
      </div>

      {/* Count */}
      <span style={s.toolbarCount}>
        {emailCount !== totalCount
          ? `${emailCount} / ${totalCount}`
          : `${totalCount}`
        } Emails
      </span>
    </div>
  );
}
