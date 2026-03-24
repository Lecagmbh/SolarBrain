/**
 * MAILBOX SIDEBAR — Schritt 3+5 Redesign
 *
 * Sektionen (feste Reihenfolge):
 *   1. Smart Filter (Alle, Nicht zugeordnet, Gesendet)
 *   2. Eskalationen (immer sichtbar, Badge bei PENDING)
 *   3. VNB-Filter (collapsible, Top NB nach Email-Anzahl)
 *   4. Mailboxen (collapsible)
 *   5. Kunden A-Z (collapsible)
 *
 * Active-Style: bg #1e293b, border-left 2px solid #EAD068
 * Section-Header: 9px uppercase #475569
 * Hover: via className="comm-sb-item" (CSS in useEmailCenter)
 */

import { useState } from "react";
import {
  Inbox,
  AlertTriangle,
  Send,
  Building2,
  ChevronDown,
  ChevronRight,
  Bell,
  Mail,
  Users,
} from "lucide-react";
import { s } from "./styles";
import type {
  Mailbox,
  CustomerFolder,
  SidebarFilter,
  VnbSummary,
  EscalationItem,
} from "./types";
import { getInitials, getAvatarColor, formatMailboxAddress } from "./types";

interface Props {
  mailboxes: Mailbox[];
  customerFolders: CustomerFolder[];
  counts: { total: number; unread: number; unassigned: number };
  activeFilter: SidebarFilter;
  onFilterChange: (filter: SidebarFilter) => void;
  vnbSummaries: VnbSummary[];
  escalations: EscalationItem[];
}

// Hilfsfunktion: inst-xxx@baunity.de → Kundenname auflösen
function resolveInstName(
  addr: string,
  folders: CustomerFolder[],
): string | null {
  const match = addr.match(/^inst-([^@]+)@/i);
  if (!match) return null;
  const folder = folders.find(f =>
    f.publicId?.toLowerCase() === `inst-${match[1].toLowerCase()}`
  );
  return folder?.customerName || null;
}

export function MailboxSidebar({
  mailboxes,
  customerFolders,
  counts,
  activeFilter,
  onFilterChange,
  vnbSummaries,
  escalations,
}: Props) {
  const [vnbExpanded, setVnbExpanded] = useState(true);
  const [kundenExpanded, setKundenExpanded] = useState(false);
  const [mailboxExpanded, setMailboxExpanded] = useState(false);

  const pendingEscalations = escalations.filter(e => e.status === "PENDING").length;

  const isActive = (filter: SidebarFilter) => {
    if (filter.type !== activeFilter.type) return false;
    if (filter.type === "mailbox") return filter.mailbox === activeFilter.mailbox;
    if (filter.type === "installation") return filter.installationId === activeFilter.installationId;
    if (filter.type === "vnb") return filter.netzbetreiberId === activeFilter.netzbetreiberId;
    return true;
  };

  const itemStyle = (filter: SidebarFilter) =>
    isActive(filter) ? s.sbItemActive : s.sbItem;

  // className: active items don't need hover
  const itemCls = (filter: SidebarFilter) =>
    isActive(filter) ? undefined : "comm-sb-item";

  return (
    <div style={s.colSidebar}>

      {/* ═══ 1. SMART FILTER ═══ */}
      <div style={s.sbSection}>Posteingang</div>

      <div
        className={itemCls({ type: "all" })}
        style={itemStyle({ type: "all" })}
        onClick={() => onFilterChange({ type: "all" })}
      >
        <Inbox size={14} style={{ flexShrink: 0 }} />
        <span style={s.sbLabel}>Alle Emails</span>
        <span style={s.sbCount}>{counts.total}</span>
        {counts.unread > 0 && <span style={s.sbBadge}>{counts.unread}</span>}
      </div>

      <div
        className={itemCls({ type: "unassigned" })}
        style={itemStyle({ type: "unassigned" })}
        onClick={() => onFilterChange({ type: "unassigned" })}
      >
        <AlertTriangle size={14} style={{ flexShrink: 0, color: "#f59e0b" }} />
        <span style={s.sbLabel}>Nicht zugeordnet</span>
        {counts.unassigned > 0 && (
          <span style={s.sbBadgeWarn}>{counts.unassigned}</span>
        )}
      </div>

      <div
        className={itemCls({ type: "sent" })}
        style={itemStyle({ type: "sent" })}
        onClick={() => onFilterChange({ type: "sent" })}
      >
        <Send size={14} style={{ flexShrink: 0 }} />
        <span style={s.sbLabel}>Gesendet</span>
      </div>

      <div style={s.sbDivider} />

      {/* ═══ 2. ESKALATIONEN ═══ */}
      <div
        className={itemCls({ type: "escalations" })}
        style={itemStyle({ type: "escalations" })}
        onClick={() => onFilterChange({ type: "escalations" })}
      >
        <Bell size={14} style={{ flexShrink: 0, color: pendingEscalations > 0 ? "#ef4444" : "#71717a" }} />
        <span style={s.sbLabel}>Eskalationen</span>
        {pendingEscalations > 0 && (
          <span style={{
            ...s.sbBadge,
            background: "rgba(239,68,68,0.2)",
            color: "#fca5a5",
          }}>
            {pendingEscalations}
          </span>
        )}
      </div>

      <div style={s.sbDivider} />

      {/* ═══ 3. VNB-FILTER ═══ */}
      {vnbSummaries.length > 0 && (
        <>
          <div
            style={{ ...s.sbSection, display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
            onClick={() => setVnbExpanded(p => !p)}
          >
            {vnbExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            Netzbetreiber ({vnbSummaries.length})
          </div>
          {vnbExpanded && vnbSummaries.slice(0, 25).map(vnb => {
            const filter: SidebarFilter = { type: "vnb", netzbetreiberId: vnb.id };
            return (
              <div
                key={vnb.id}
                className={itemCls(filter)}
                style={itemStyle(filter)}
                onClick={() => onFilterChange(filter)}
              >
                <Building2 size={13} style={{ flexShrink: 0, color: "#71717a" }} />
                <span style={s.sbLabel}>{vnb.kurzname || vnb.name}</span>
                <span style={s.sbCount}>{vnb.emailCount}</span>
                {vnb.unreadCount > 0 && <span style={s.sbBadge}>{vnb.unreadCount}</span>}
              </div>
            );
          })}
          <div style={s.sbDivider} />
        </>
      )}

      {/* ═══ 4. MAILBOXEN ═══ */}
      {mailboxes.length > 1 && (
        <>
          <div
            style={{ ...s.sbSection, display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
            onClick={() => setMailboxExpanded(p => !p)}
          >
            {mailboxExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            Postfächer ({mailboxes.length})
          </div>
          {mailboxExpanded && mailboxes.map(mb => {
            const { short, domain } = formatMailboxAddress(mb.address);
            const instName = resolveInstName(mb.address, customerFolders);
            const filter: SidebarFilter = { type: "mailbox", mailbox: mb.address };
            return (
              <div
                key={mb.address}
                className={itemCls(filter)}
                style={itemStyle(filter)}
                onClick={() => onFilterChange(filter)}
                title={mb.address}
              >
                <Mail size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.sbLabel}>{instName ? `${short} (${instName})` : short}</div>
                  <div style={s.sbSub}>@{domain}</div>
                </div>
                <span style={s.sbCount}>{mb.total}</span>
                {mb.unread > 0 && <span style={s.sbBadge}>{mb.unread}</span>}
              </div>
            );
          })}
          <div style={s.sbDivider} />
        </>
      )}

      {/* ═══ 5. KUNDEN A-Z ═══ */}
      {customerFolders.length > 0 && (
        <>
          <div
            style={{ ...s.sbSection, display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
            onClick={() => setKundenExpanded(p => !p)}
          >
            {kundenExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            <Users size={10} style={{ flexShrink: 0 }} />
            Kunden ({customerFolders.length})
          </div>
          {kundenExpanded && customerFolders.map(cf => {
            const name = cf.customerName || cf.publicId || "Unbekannt";
            const filter: SidebarFilter = { type: "installation", installationId: cf.installationId };
            return (
              <div
                key={cf.installationId}
                className={itemCls(filter)}
                style={itemStyle(filter)}
                onClick={() => onFilterChange(filter)}
              >
                <div style={{ ...s.sbAvatar, background: getAvatarColor(name) }}>
                  {getInitials(name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.sbLabel}>{name}</div>
                  {cf.publicId && <div style={s.sbSub}>{cf.publicId}</div>}
                </div>
                <span style={s.sbCount}>{cf.totalCount}</span>
                {cf.unreadCount > 0 && <span style={s.sbBadge}>{cf.unreadCount}</span>}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
