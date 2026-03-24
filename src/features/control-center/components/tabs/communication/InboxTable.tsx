/**
 * INBOX TABLE — GroupedVirtuoso
 *
 * Virtual-scrolled Email-Liste mit Sticky Group-Headers,
 * Checkboxen für Batch-Aktionen.
 *
 * Jede Zeile hat 3 Zeilen:
 *   1. Absender + Status-Badge + Uhrzeit
 *   2. Betreff (fett wenn ungelesen)
 *   3. Anlage-Link oder "Nicht zugeordnet" + Attachment-Icon
 */

import { useState, forwardRef } from "react";
import { GroupedVirtuoso } from "react-virtuoso";
import type { VirtuosoHandle } from "react-virtuoso";
import {
  Inbox,
  Loader2,
  Paperclip,
} from "lucide-react";
import { s } from "./styles";
import type { InboxEmail, EmailGroup } from "./types";
import { formatDate } from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// Status-Badge Mapping nach aiType
// ═══════════════════════════════════════════════════════════════════════════════

interface BadgeConfig {
  label: string;
  bg: string;
  color: string;
}

const STATUS_BADGE_MAP: Record<string, BadgeConfig> = {
  RUECKFRAGE:          { label: "⚡ Aktion nötig",  bg: "#451a03", color: "#f59e0b" },
  FEHLENDE_DATEN:      { label: "⚡ Aktion nötig",  bg: "#451a03", color: "#f59e0b" },
  FRISTABLAUF:         { label: "🔴 Dringend",      bg: "#450a0a", color: "#fca5a5" },
  GENEHMIGUNG:         { label: "✅ Genehmigt",     bg: "#022c22", color: "#10b981" },
  ABLEHNUNG:           { label: "❌ Abgelehnt",     bg: "#450a0a", color: "#fca5a5" },
  EINGANGSBESTAETIGUNG:{ label: "📋 Bestätigt",     bg: "#1e1b4b", color: "#f0d878" },
  BESTAETIGUNG:        { label: "📋 Bestätigt",     bg: "#1e1b4b", color: "#f0d878" },
  KUNDE_RUECKFRAGE:    { label: "👤 Kunde",         bg: "#1e293b", color: "#94a3b8" },
  KUNDE_UNTERLAGEN:    { label: "👤 Unterlagen",    bg: "#1e293b", color: "#94a3b8" },
  ZAEHLERANTRAG:       { label: "📄 Zähler",        bg: "#083344", color: "#06b6d4" },
  INBETRIEBSETZUNG:    { label: "⚡ IBN",           bg: "#083344", color: "#06b6d4" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════════

interface Props {
  groups: EmailGroup[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  selectedId: number | null;
  selectedIds: Set<number>;
  onSelect: (email: InboxEmail) => void;
  onToggleSelect: (id: number) => void;
  onLoadMore: () => void;
  virtuosoRef: React.RefObject<VirtuosoHandle | null>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Einzelnes Email-Item (3-Zeilen Layout)
// ═══════════════════════════════════════════════════════════════════════════════

function EmailItem({
  email,
  selected,
  checked,
  onSelect,
  onToggleCheck,
}: {
  email: InboxEmail;
  selected: boolean;
  checked: boolean;
  onSelect: () => void;
  onToggleCheck: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const badge = email.aiType ? STATUS_BADGE_MAP[email.aiType] || null : null;
  const isUnread = !email.isRead;
  const showCheckbox = hovered || checked;

  // Anlage-Info: installationPublicId + factroProjectTitle oder "Nicht zugeordnet"
  const hasAnlage = !!(email.installationPublicId || email.assigned);
  const anlageLabel = email.installationPublicId || null;
  const anlageDetail = email.factroProjectTitle || email.netzbetreiberName || null;

  // Style-Priorisierung: selected > checked > unread > hover > default
  const bgStyle: React.CSSProperties = selected
    ? { background: "#131b2e", borderLeft: "3px solid #EAD068" }
    : checked
      ? { background: "rgba(212, 168, 67, 0.08)" }
      : isUnread
        ? { background: "#0c1222" }
        : hovered
          ? { background: "#0f1420" }
          : {};

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        padding: selected ? "10px 14px 10px 11px" : "10px 14px",
        cursor: "pointer",
        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
        transition: "background 0.12s, border-color 0.12s",
        ...bgStyle,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      {/* Checkbox area */}
      <div
        style={s.emailItemCheckbox}
        onClick={e => { e.stopPropagation(); onToggleCheck(); }}
      >
        {showCheckbox ? (
          <input
            type="checkbox"
            checked={checked}
            onChange={() => {}}
            style={{ accentColor: "#D4A843", cursor: "pointer" }}
          />
        ) : (
          isUnread ? (
            <span style={{ color: "#D4A843", fontSize: "8px" }}>●</span>
          ) : (
            <span style={{ width: "14px" }} />
          )
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const, gap: "3px" }}>

        {/* ─── Zeile 1: Absender + Status-Badge + Uhrzeit ─── */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontSize: "0.8rem",
            color: "#e2e8f0",
            fontWeight: isUnread ? 600 : 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap" as const,
            flex: 1,
            minWidth: 0,
          }}>
            {email.fromName || email.fromAddress.split("@")[0]}
          </span>

          {/* Status Badge */}
          {badge && (
            <span style={{
              fontSize: "8px",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: "3px",
              whiteSpace: "nowrap" as const,
              background: badge.bg,
              color: badge.color,
              flexShrink: 0,
            }}>
              {badge.label}
            </span>
          )}

          {/* Uhrzeit */}
          <span style={{
            fontSize: "0.7rem",
            color: "#71717a",
            flexShrink: 0,
            whiteSpace: "nowrap" as const,
          }}>
            {formatDate(email.receivedAt)}
          </span>
        </div>

        {/* ─── Zeile 2: Betreff ─── */}
        <div style={{
          fontSize: "0.75rem",
          color: isUnread ? "#c8d0da" : "#71717a",
          fontWeight: isUnread ? 500 : 400,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap" as const,
        }}>
          {email.subject || "(Kein Betreff)"}
        </div>

        {/* ─── Zeile 3: Anlage-Link oder "Nicht zugeordnet" + Attachment ─── */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", minHeight: "16px" }}>
          {hasAnlage && anlageLabel ? (
            <>
              <span style={{
                fontSize: "9px",
                color: "#60a5fa",
                background: "#0f1d32",
                border: "1px solid #1e3a5f",
                borderRadius: "3px",
                padding: "1px 6px",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}>
                🔗 {anlageLabel}
              </span>
              {anlageDetail && (
                <span style={{
                  fontSize: "9px",
                  color: "#64748b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap" as const,
                }}>
                  {anlageDetail}
                </span>
              )}
            </>
          ) : (
            <span style={{
              fontSize: "9px",
              color: "#475569",
            }}>
              ⚠️ Nicht zugeordnet
            </span>
          )}

          {/* Attachment Icon rechts */}
          {email.hasAttachments && (
            <Paperclip size={10} style={{ color: "#475569", marginLeft: "auto", flexShrink: 0 }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Liste mit GroupedVirtuoso
// ═══════════════════════════════════════════════════════════════════════════════

export const InboxTable = forwardRef<VirtuosoHandle, Props>(function InboxTable(
  {
    groups,
    loading,
    loadingMore,
    hasMore,
    selectedId,
    selectedIds,
    onSelect,
    onToggleSelect,
    onLoadMore,
    virtuosoRef,
  },
  _ref,
) {
  if (loading) {
    return (
      <div style={s.loading}>
        <Loader2 size={20} style={{ animation: "comm-spin 1s linear infinite" }} />
        Lade Emails...
      </div>
    );
  }

  const totalEmails = groups.reduce((sum, g) => sum + g.emails.length, 0);

  if (totalEmails === 0) {
    return (
      <div style={s.empty}>
        <Inbox size={32} />
        <span>Keine Emails gefunden</span>
      </div>
    );
  }

  // For GroupedVirtuoso: groupCounts = number of items in each group
  const groupCounts = groups.map(g => g.emails.length);
  const noGroups = groups.length === 1 && groups[0].label === "";

  // Flatten emails in group order
  const flatEmails = groups.flatMap(g => g.emails);

  return (
    <div style={{ flex: 1, minHeight: 0 }}>
      <GroupedVirtuoso
        ref={virtuosoRef}
        groupCounts={groupCounts}
        groupContent={index => {
          if (noGroups) return null;
          const group = groups[index];
          return (
            <div style={s.groupHeader}>
              <span style={s.groupLabel}>{group.label}</span>
              <span style={s.groupCount}>{group.emails.length}</span>
            </div>
          );
        }}
        itemContent={(index) => {
          const email = flatEmails[index];
          if (!email) return null;
          return (
            <EmailItem
              email={email}
              selected={selectedId === email.id}
              checked={selectedIds.has(email.id)}
              onSelect={() => onSelect(email)}
              onToggleCheck={() => onToggleSelect(email.id)}
            />
          );
        }}
        endReached={() => {
          if (hasMore && !loadingMore) onLoadMore();
        }}
        overscan={200}
        components={{
          Footer: () =>
            loadingMore ? (
              <div style={{ ...s.loadMore, justifyContent: "center" }}>
                <Loader2 size={16} style={{ animation: "comm-spin 1s linear infinite", color: "#71717a" }} />
                <span style={{ color: "#71717a", fontSize: "0.8rem", marginLeft: "8px" }}>Lade mehr...</span>
              </div>
            ) : null,
        }}
        style={{ height: "100%" }}
      />
    </div>
  );
});
