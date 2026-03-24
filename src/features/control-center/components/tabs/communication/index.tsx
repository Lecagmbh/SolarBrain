/**
 * EMAIL CENTER — Haupt-Container (Erweitert)
 *
 * 3-Spalten Layout:
 *   Sidebar (230px) | Email-Liste/Eskalationen (380px) | Detail (flex)
 *
 * Logik ist komplett in useEmailCenter() ausgelagert.
 * Diese Datei kümmert sich nur um Layout und Wiring.
 */

import { useRef, useMemo } from "react";
import {
  Mail,
  RefreshCw,
  Plus,
  Search,
  AlertTriangle,
} from "lucide-react";
import type { VirtuosoHandle } from "react-virtuoso";
import { s } from "./styles";
import { useEmailCenter } from "./useEmailCenter";
import { useKeyboardNav } from "./useKeyboardNav";

import { MailboxSidebar } from "./MailboxSidebar";
import { InboxTable } from "./InboxTable";
import { SentTable } from "./SentTable";
import { EmailDetailPanel } from "./EmailDetailPanel";
import { EmailComposeModal } from "./EmailComposeModal";
import { AssignmentModal } from "./AssignmentModal";
import { EmailListToolbar } from "./EmailListToolbar";
import { FilterChips } from "./FilterChips";
import { BatchToolbar } from "./BatchToolbar";
import { EscalationPanel } from "./EscalationPanel";

// ═══════════════════════════════════════════════════════════════════════════════

export function CommunicationTab() {
  const ec = useEmailCenter();
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Keyboard Navigation
  const { showHelp, setShowHelp } = useKeyboardNav({
    flatEmails: ec.flatFiltered,
    selectedEmail: ec.selectedEmail,
    onSelect: ec.selectEmail,
    onArchive: ec.archiveEmail,
    onReply: ec.reply,
    onClearSelection: ec.clearSelection,
    virtuosoRef,
  });

  // ─── View-Label für Header ──────────────────────────────────
  const viewLabel = (() => {
    switch (ec.activeFilter.type) {
      case "all":        return `${ec.emails.length} Emails`;
      case "mailbox":    return ec.activeFilter.mailbox || "Postfach";
      case "installation": {
        const f = ec.customerFolders.find(f => f.installationId === ec.activeFilter.installationId);
        return f?.customerName || f?.publicId || "Kunde";
      }
      case "unassigned": return `${ec.emails.length} nicht zugeordnet`;
      case "sent":       return `${ec.sentEmails.length} gesendet`;
      case "vnb": {
        const vnb = ec.vnbSummaries.find(v => v.id === ec.activeFilter.netzbetreiberId);
        return vnb ? `${vnb.kurzname || vnb.name} (${vnb.emailCount})` : "Netzbetreiber";
      }
      case "escalations": return `${ec.escalations.filter(e => e.status === "PENDING").length} Eskalationen`;
      default:           return "Email Center";
    }
  })();

  const isEscalationView = ec.activeFilter.type === "escalations";

  // ─── Überfällig-Count ─────────────────────────────────────────
  const pendingEscalations = useMemo(
    () => ec.escalations.filter(e => e.status === "PENDING").length,
    [ec.escalations]
  );

  // ─── Action-Needed Count ──────────────────────────────────────
  const actionNeededCount = useMemo(
    () => ec.emails.filter(e =>
      e.aiType === "RUECKFRAGE" || e.aiType === "FRISTABLAUF" || e.aiType === "FEHLENDE_DATEN"
    ).length,
    [ec.emails]
  );

  // ─── Assign from Detail-Panel ───────────────────────────────
  const handleAssignFromDetail = () => {
    if (ec.selectedEmail) ec.setAssignTarget(ec.selectedEmail);
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="comm-center" style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.title}>
          <Mail size={24} />
          <div>
            <h2 style={s.h2}>Email Center</h2>
            <p style={s.subtitle}>{viewLabel}</p>
          </div>
        </div>

        <div style={s.headerChips}>
          {/* Ungelesen */}
          {ec.sidebarCounts.unread > 0 && (
            <div
              className="comm-hchip"
              style={s.headerChip}
              onClick={() => ec.setActiveFilter({ type: "all" })}
            >
              <span style={s.headerChipValue}>{ec.sidebarCounts.unread}</span>
              ungelesen
            </div>
          )}

          {/* Nicht zugeordnet */}
          {ec.sidebarCounts.unassigned > 0 && (
            <div
              className="comm-hchip"
              style={{ ...s.headerChip, borderColor: "rgba(245,158,11,0.3)", color: "#fbbf24" }}
              onClick={() => ec.setActiveFilter({ type: "unassigned" })}
            >
              <span style={s.headerChipValue}>{ec.sidebarCounts.unassigned}</span>
              offen
            </div>
          )}

          {/* Aktion nötig */}
          {actionNeededCount > 0 && (
            <div
              className="comm-hchip"
              style={{ ...s.headerChip, borderColor: "rgba(249,115,22,0.3)", color: "#fb923c" }}
              onClick={() => ec.toggleChip("actionNeeded")}
            >
              <span style={s.headerChipValue}>{actionNeededCount}</span>
              Aktion nötig
            </div>
          )}

          {/* Überfällig */}
          {pendingEscalations > 0 && (
            <div
              className="comm-hchip"
              style={s.headerChipOverdue}
              onClick={() => ec.setActiveFilter({ type: "escalations" })}
            >
              <AlertTriangle size={12} />
              <span style={s.headerChipValue}>{pendingEscalations}</span>
              Überfällig
            </div>
          )}
        </div>

        <div style={s.headerActions}>
          <button className="comm-btn" style={s.btnPrimary} onClick={ec.composeNew}>
            <Plus size={16} />
            Neue Email
          </button>
          <button className="comm-btn" style={s.btnIcon} onClick={ec.refresh} disabled={ec.loading}>
            <RefreshCw
              size={16}
              style={ec.loading ? { animation: "comm-spin 1s linear infinite" } : undefined}
            />
          </button>
        </div>
      </div>

      {/* 3-Spalten Layout */}
      <div style={s.threeCol}>
        {/* Spalte 1: Sidebar */}
        <MailboxSidebar
          mailboxes={ec.mailboxes}
          customerFolders={ec.customerFolders}
          counts={ec.sidebarCounts}
          activeFilter={ec.activeFilter}
          onFilterChange={ec.setActiveFilter}
          vnbSummaries={ec.vnbSummaries}
          escalations={ec.escalations}
        />

        {/* Spalte 2: Email-Liste oder Eskalationen */}
        <div style={s.colList}>
          {isEscalationView ? (
            <EscalationPanel
              escalations={ec.escalations}
              loading={ec.escalationsLoading}
              onExecute={ec.executeEscalation}
              onSkip={ec.skipEscalation}
            />
          ) : !ec.isSentView ? (
            <>
              {/* Toolbar: Sort + Group + Count */}
              <EmailListToolbar
                sortBy={ec.sortBy}
                sortOrder={ec.sortOrder}
                groupMode={ec.groupMode}
                emailCount={ec.chipFiltered.length}
                totalCount={ec.emails.length}
                onSortByChange={ec.setSortBy}
                onSortOrderToggle={() => ec.setSortOrder(ec.sortOrder === "desc" ? "asc" : "desc")}
                onGroupModeChange={ec.setGroupMode}
              />

              {/* Filter Chips */}
              <FilterChips
                activeChips={ec.activeChips}
                counts={ec.chipCounts}
                onToggle={ec.toggleChip}
              />

              {/* Batch Toolbar */}
              {ec.selectedIds.size > 0 && (
                <BatchToolbar
                  count={ec.selectedIds.size}
                  onMarkRead={() => ec.batchMarkRead(true)}
                  onArchive={ec.batchArchive}
                  onDelete={ec.batchDelete}
                  onClear={ec.clearSelection}
                />
              )}

              {/* Suchleiste */}
              <div style={s.listSearch}>
                <Search size={14} style={{ color: "#52525b", flexShrink: 0 }} />
                <input
                  style={s.listSearchInput}
                  placeholder="Emails durchsuchen..."
                  value={ec.search}
                  onChange={e => ec.setSearch(e.target.value)}
                />
              </div>

              {/* Email-Liste */}
              <InboxTable
                groups={ec.grouped}
                loading={ec.loading}
                loadingMore={ec.loadingMore}
                hasMore={ec.hasMore}
                selectedId={ec.selectedEmail?.id ?? null}
                selectedIds={ec.selectedIds}
                onSelect={ec.selectEmail}
                onToggleSelect={ec.toggleSelect}
                onLoadMore={ec.loadMore}
                virtuosoRef={virtuosoRef}
              />
            </>
          ) : (
            <SentTable emails={ec.sentEmails} loading={ec.loading} />
          )}
        </div>

        {/* Spalte 3: Detail */}
        {!ec.isSentView && !isEscalationView && (
          <div style={s.colDetail}>
            <EmailDetailPanel
              email={ec.emailDetail}
              loading={ec.loadingDetail}
              onReply={ec.reply}
              onAssign={handleAssignFromDetail}
              onArchive={ec.archiveEmail}
              onDelete={ec.deleteEmail}
              autoReplyDraft={ec.autoReplyDraft}
              autoReplyLoading={ec.autoReplyLoading}
              onApproveAutoReply={ec.approveAutoReply}
            />
          </div>
        )}
      </div>

      {/* Keyboard Help Overlay */}
      {showHelp && (
        <div style={s.kbdHelp}>
          <div style={{ marginBottom: "8px", fontWeight: 600, fontSize: "0.8rem", color: "#e2e8f0" }}>
            Tastenkürzel
          </div>
          {[
            ["j / k", "Navigieren"],
            ["Enter", "Öffnen"],
            ["e", "Archivieren"],
            ["r", "Antworten"],
            ["Esc", "Abbrechen"],
            ["?", "Hilfe"],
          ].map(([key, label]) => (
            <div key={key} style={s.kbdRow}>
              <span style={s.kbdKey}>{key}</span>
              <span style={{ color: "#a1a1aa" }}>{label}</span>
            </div>
          ))}
          <button
            style={{ ...s.batchClose, marginTop: "8px" }}
            onClick={() => setShowHelp(false)}
          >
            Schließen
          </button>
        </div>
      )}

      {/* Modals */}
      {ec.assignTarget && (
        <AssignmentModal
          email={ec.assignTarget}
          onAssign={ec.assignToInstallation}
          onClose={() => ec.setAssignTarget(null)}
        />
      )}
      {ec.compose && (
        <EmailComposeModal
          compose={ec.compose}
          onClose={() => ec.setCompose(null)}
          onSent={ec.afterSend}
        />
      )}
    </div>
  );
}

export default CommunicationTab;
