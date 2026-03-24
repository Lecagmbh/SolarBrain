/**
 * NETZANMELDUNGEN ENTERPRISE v3.0 - COMPLETE PREMIUM
 * ==================================================
 * - ALLE alten Features erhalten (Kanban, Table, Bulk, Export, etc.)
 * - NEUE Premium UI (Stats Dashboard, Attention Section, neue Karten)
 * - Performance für 10.000+ Anlagen
 */

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  RefreshCw, Search, X, Check, AlertTriangle, Loader2, Grid3X3, Columns3, Table2,
  Clock, Filter, ChevronDown, ChevronRight, Building2, Zap, MapPin, ExternalLink,
  Eye, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Bookmark, Archive,
  Users, MoreVertical, Trash2, UserPlus, Send, Download, Keyboard, FileSpreadsheet,
  Wifi, Sun, Battery, Car, FileText, Mail, CheckSquare, TrendingUp, TrendingDown,
  Minus, Flame, Calendar, Bell, Play, Phone, Edit2,
} from "lucide-react";
import { useNetzanmeldungenStore, clearGuestStore, checkStoreConsistency, checkUserChangeAndReset } from "./stores";
import { useAuth } from "../../pages/AuthContext";
import { api } from "./services/api";
import { useInstallationUpdates } from "./hooks";
import {
  getStatusConfig, computePriority, getPriorityConfig,
  sortItems, filterItems, groupItems, formatRelativeTime, formatCurrency,
  getInitials, getAvatarColor, computeProgress, isOverdue, getAvailableTransitions,
  getDaysOld, getWorkPriorityConfig, WORK_PRIORITY_CONFIG,
} from "./utils";
// DetailPanel: ARCHIVED — nur noch MockDetailPanelV2 + DetailPanelLive aktiv
import CrmDetailPanel from "./components/detail/CrmDetailPanel";
import { WorkPrioritySections } from "./components/WorkPrioritySections";
import "./components/WorkPrioritySections.css";
import type { InstallationListItem, GroupBy, SortBy, GroupedItems, InstallationStatus, Priority } from "./types";
import "./NetzanmeldungenPage.css";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getAgeColor(days: number, status: string): string {
  const s = (status || "").toLowerCase().replace(/-/g, "_");
  if (s === "warten_auf_nb") return "#64748b";
  if (["abgeschlossen", "storniert", "nb_genehmigt"].includes(s)) return "#22c55e";
  if (days <= 7) return "#22c55e";
  if (days <= 14) return "#f59e0b";
  if (days <= 21) return "#f97316";
  return "#ef4444";
}

function needsAttention(item: InstallationListItem): { needs: boolean; reason: string; priority: number } {
  const status = (item.status || "").toLowerCase().replace(/-/g, "_");
  const days = getDaysOld(item.createdAt);
  
  if (status === "nachbesserung") return { needs: true, reason: "Rückfrage vom NB", priority: 1 };
  if (!["warten_auf_nb", "abgeschlossen", "storniert", "nb_genehmigt"].includes(status) && days > 14) {
    return { needs: true, reason: `${days} Tage alt`, priority: 2 };
  }
  if ((item.documentsCount || 0) === 0 && !["entwurf", "abgeschlossen", "storniert"].includes(status)) {
    return { needs: true, reason: "Dokumente fehlen", priority: 3 };
  }
  
  return { needs: false, reason: "", priority: 99 };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRM MODAL
// ═══════════════════════════════════════════════════════════════════════════

function ConfirmModal({ 
  isOpen, title, message, confirmText = "Bestätigen", cancelText = "Abbrechen",
  variant = "danger", onConfirm, onCancel, loading = false 
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: { color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: <Trash2 size={24} /> },
    warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: <AlertTriangle size={24} /> },
    info: { color: "#3b82f6", bg: "rgba(59,130,246,0.15)", icon: <AlertCircle size={24} /> },
  };
  const style = variantStyles[variant];

  return (
    <div className="ne-modal-overlay" onClick={onCancel}>
      <div className="ne-modal" onClick={e => e.stopPropagation()}>
        <div className="ne-modal__icon" style={{ background: style.bg, color: style.color }}>{style.icon}</div>
        <h3 className="ne-modal__title">{title}</h3>
        <p className="ne-modal__message">{message}</p>
        <div className="ne-modal__actions">
          <button className="ne-modal__btn ne-modal__btn--cancel" onClick={onCancel} disabled={loading}>{cancelText}</button>
          <button className={`ne-modal__btn ne-modal__btn--confirm ne-modal__btn--${variant}`} onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CRM STAGE → INSTALLATION STATUS MAPPING
// ═══════════════════════════════════════════════════════════════════════════

function mapCrmStageToInstStatus(stage: string): string {
  const map: Record<string, string> = {
    ANFRAGE: "EINGANG", HV_VERMITTELT: "EINGANG", AUFTRAG: "EINGANG",
    NB_ANFRAGE: "BEIM_NB", NB_KOMMUNIKATION: "RUECKFRAGE",
    NB_GENEHMIGT: "GENEHMIGT", ABGESCHLOSSEN: "FERTIG",
  };
  return map[stage] || "EINGANG";
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS DASHBOARD - NEU
// ═══════════════════════════════════════════════════════════════════════════

function StatsDashboard({ items }: { items: InstallationListItem[] }) {
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = items.filter(i => new Date(i.createdAt) >= weekAgo);
    
    const byStatus = items.reduce((acc, i) => {
      const s = (i.status || "entwurf").toLowerCase().replace(/-/g, "_");
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const genehmigt = items.filter(i => (i.status || "").toLowerCase().includes("genehmigt"));
    const avgDays = genehmigt.length > 0 
      ? Math.round(genehmigt.reduce((sum, i) => sum + getDaysOld(i.createdAt), 0) / genehmigt.length)
      : 0;

    const totalKwp = items.reduce((sum, i) => sum + (i.totalKwp || 0), 0);
    const overdue = items.filter(i => isOverdue(i)).length;

    return {
      newThisWeek: thisWeek.length,
      beimNB: byStatus.warten_auf_nb || 0,
      genehmigt: byStatus.nb_genehmigt || 0,
      avgDays,
      totalKwp,
      overdue,
      total: items.length,
    };
  }, [items]);

  return (
    <div className="ne-stats-dashboard">
      <div className="ne-stat">
        <div className="ne-stat__icon ne-stat__icon--blue"><FileSpreadsheet size={20} /></div>
        <div className="ne-stat__content">
          <span className="ne-stat__value">{stats.newThisWeek}</span>
          <span className="ne-stat__label">Diese Woche</span>
        </div>
      </div>
      <div className="ne-stat">
        <div className="ne-stat__icon ne-stat__icon--orange"><Clock size={20} /></div>
        <div className="ne-stat__content">
          <span className="ne-stat__value">{stats.beimNB}</span>
          <span className="ne-stat__label">Beim NB</span>
        </div>
      </div>
      <div className="ne-stat">
        <div className="ne-stat__icon ne-stat__icon--green"><Check size={20} /></div>
        <div className="ne-stat__content">
          <span className="ne-stat__value">{stats.genehmigt}</span>
          <span className="ne-stat__label">Genehmigt</span>
        </div>
      </div>
      <div className="ne-stat">
        <div className="ne-stat__icon ne-stat__icon--purple"><Clock size={20} /></div>
        <div className="ne-stat__content">
          <span className="ne-stat__value">Ø {stats.avgDays}d</span>
          <span className="ne-stat__label">bis Genehmigung</span>
        </div>
      </div>
      <div className={`ne-stat ${stats.overdue > 0 ? "ne-stat--danger" : ""}`}>
        <div className={`ne-stat__icon ${stats.overdue > 0 ? "ne-stat__icon--red" : "ne-stat__icon--gray"}`}>
          <AlertTriangle size={20} />
        </div>
        <div className="ne-stat__content">
          <span className="ne-stat__value">{stats.overdue}</span>
          <span className="ne-stat__label">Überfällig</span>
        </div>
      </div>
      <div className="ne-stat ne-stat--highlight">
        <div className="ne-stat__icon ne-stat__icon--yellow"><Sun size={20} /></div>
        <div className="ne-stat__content">
          <span className="ne-stat__value">{(stats.totalKwp / 1000).toFixed(1)} MWp</span>
          <span className="ne-stat__label">Gesamt</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ATTENTION SECTION - NEU
// ═══════════════════════════════════════════════════════════════════════════

function AttentionSection({ items, onOpen }: { items: InstallationListItem[]; onOpen: (id: number) => void }) {
  const attentionItems = useMemo(() => {
    return items
      .map(item => ({ item, ...needsAttention(item) }))
      .filter(x => x.needs)
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 6);
  }, [items]);

  if (attentionItems.length === 0) return null;

  const getReasonColor = (priority: number) => {
    if (priority === 1) return "#ef4444";
    if (priority === 2) return "#f97316";
    return "#f59e0b";
  };

  return (
    <div className="ne-attention">
      <div className="ne-attention__header">
        <AlertTriangle size={20} />
        <h3>Braucht Aufmerksamkeit</h3>
        <span className="ne-attention__count">{attentionItems.length}</span>
      </div>
      <div className="ne-attention__grid">
        {attentionItems.map(({ item, reason, priority }) => (
          <div 
            key={item.id} 
            className="ne-attention__card"
            style={{ "--attention-color": getReasonColor(priority) } as React.CSSProperties}
            onClick={() => onOpen(item.id)}
          >
            <div className="ne-attention__card-icon" style={{ background: getReasonColor(priority) }}>
              {priority === 1 ? <AlertCircle size={16} /> : priority === 2 ? <Clock size={16} /> : <FileText size={16} />}
            </div>
            <div className="ne-attention__card-content">
              <span className="ne-attention__card-reason">{reason}</span>
              <span className="ne-attention__card-name">{item.customerName}</span>
              <span className="ne-attention__card-id">{item.publicId}</span>
            </div>
            <button className="ne-attention__card-action">
              <Play size={14} /> Bearbeiten
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QUICK FILTER CHIPS - NEU
// ═══════════════════════════════════════════════════════════════════════════

function QuickFilterChips({
  items, activeFilter, onFilterChange, userId,
}: {
  items: InstallationListItem[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  userId?: number;
}) {
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      all: items.length,
      mine: userId ? items.filter(i => i.assignedToId === userId || i.createdById === userId).length : 0,
      today: items.filter(i => new Date(i.createdAt) >= today).length,
      thisWeek: items.filter(i => new Date(i.createdAt) >= weekAgo).length,
      needsAction: items.filter(i => needsAttention(i).needs).length,
      overdue: items.filter(i => isOverdue(i)).length,
    };
  }, [items, userId]);

  const filters = [
    { key: "all", label: "Alle", count: stats.all, icon: Grid3X3 },
    { key: "mine", label: "Meine", count: stats.mine, icon: Users, highlight: true },
    { key: "today", label: "Heute", count: stats.today, icon: Calendar },
    { key: "week", label: "Diese Woche", count: stats.thisWeek, icon: Clock },
    { key: "action", label: "Braucht Aktion", count: stats.needsAction, icon: AlertCircle, warning: true },
    { key: "overdue", label: "Überfällig", count: stats.overdue, icon: AlertTriangle, danger: true },
  ];

  return (
    <div className="ne-quick-chips">
      {filters.map(f => (
        <button
          key={f.key}
          className={`ne-quick-chip ${activeFilter === f.key ? "ne-quick-chip--active" : ""} ${(f as any).danger ? "ne-quick-chip--danger" : ""} ${(f as any).warning ? "ne-quick-chip--warning" : ""}`}
          onClick={() => onFilterChange(f.key)}
        >
          <f.icon size={14} />
          <span>{f.label}</span>
          <span className="ne-quick-chip__count">{f.count}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBUNTERNEHMER STATS - NEU
// ═══════════════════════════════════════════════════════════════════════════

interface SubUserStatsProps {
  items: InstallationListItem[];
  subUsers: Array<{ id: number; name: string; email: string; company?: string; parentUserId?: number; parentUserName?: string }>;
  onFilterByUser: (userId: number | null) => void;
  selectedUserId: number | null;
}

interface UserStatsEntry {
  id: number;
  name: string;
  company?: string;
  total: number;
  thisWeek: number;
  thisMonth: number;
  genehmigt: number;
  beimNB: number;
  totalKwp: number;
  avgDays: number;
  subMembers?: { id: number; name: string; count: number }[];
  memberIds?: number[];
}

function SubUserStats({ items, subUsers, onFilterByUser, selectedUserId }: SubUserStatsProps) {
  const stats = useMemo(() => {
    const byUser = new Map<number, UserStatsEntry>();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Initialize all subUsers
    subUsers.forEach(u => {
      byUser.set(u.id, {
        id: u.id,
        name: u.name,
        company: u.company,
        total: 0,
        thisWeek: 0,
        thisMonth: 0,
        genehmigt: 0,
        beimNB: 0,
        totalKwp: 0,
        avgDays: 0,
      });
    });

    // Count items
    items.forEach(item => {
      const creatorId = item.createdById;
      if (!creatorId) return;

      let userStats = byUser.get(creatorId);
      if (!userStats) {
        userStats = {
          id: creatorId,
          name: item.createdByName || "Unbekannt",
          company: item.createdByCompany,
          total: 0,
          thisWeek: 0,
          thisMonth: 0,
          genehmigt: 0,
          beimNB: 0,
          totalKwp: 0,
          avgDays: 0,
        };
        byUser.set(creatorId, userStats);
      }

      userStats.total++;
      userStats.totalKwp += item.totalKwp || 0;

      const createdAt = new Date(item.createdAt);
      if (createdAt >= weekAgo) userStats.thisWeek++;
      if (createdAt >= monthAgo) userStats.thisMonth++;

      const status = (item.status || "").toLowerCase().replace(/-/g, "_");
      if (status === "nb_genehmigt" || status === "abgeschlossen") userStats.genehmigt++;
      if (status === "warten_auf_nb") userStats.beimNB++;
    });

    // Subunternehmer unter Parent-User gruppieren
    const subToParent = new Map<number, number>();
    for (const u of subUsers) {
      if (u.parentUserId) {
        subToParent.set(u.id, u.parentUserId);
      }
    }

    if (subToParent.size > 0) {
      for (const [subId, parentId] of subToParent) {
        const subStats = byUser.get(subId);
        if (!subStats || subStats.total === 0) continue;

        let parentStats = byUser.get(parentId);
        if (!parentStats) {
          // Parent existiert nicht als eigener Creator → Karte anlegen
          const parentUser = subUsers.find(u => u.id === parentId);
          parentStats = {
            id: parentId,
            name: parentUser?.name || subStats.company || "Unbekannt",
            company: parentUser?.company,
            total: 0,
            thisWeek: 0,
            thisMonth: 0,
            genehmigt: 0,
            beimNB: 0,
            totalKwp: 0,
            avgDays: 0,
            subMembers: [],
            memberIds: [parentId],
          };
          byUser.set(parentId, parentStats);
        }

        // Stats aggregieren
        parentStats.total += subStats.total;
        parentStats.thisWeek += subStats.thisWeek;
        parentStats.thisMonth += subStats.thisMonth;
        parentStats.genehmigt += subStats.genehmigt;
        parentStats.beimNB += subStats.beimNB;
        parentStats.totalKwp += subStats.totalKwp;

        // Sub-Member tracken
        if (!parentStats.subMembers) parentStats.subMembers = [];
        if (!parentStats.memberIds) parentStats.memberIds = [parentId];
        parentStats.subMembers.push({ id: subId, name: subStats.name, count: subStats.total });
        parentStats.memberIds.push(subId);

        // Sub-Eintrag entfernen
        byUser.delete(subId);
      }
    }

    // Sort by total descending
    return Array.from(byUser.values())
      .filter(u => u.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [items, subUsers]);

  const totalAll = stats.reduce((sum, s) => sum + s.total, 0);
  const totalKwpAll = stats.reduce((sum, s) => sum + s.totalKwp, 0);

  if (stats.length === 0) return null;

  return (
    <div className="ne-subuser-stats">
      <div className="ne-subuser-stats__header">
        <div className="ne-subuser-stats__title">
          <Users size={20} />
          <h3>Subunternehmer Übersicht</h3>
          <span className="ne-subuser-stats__count">{stats.length} Subunternehmer</span>
        </div>
        <div className="ne-subuser-stats__summary">
          <span>{totalAll} Anmeldungen</span>
          <span>•</span>
          <span>{(totalKwpAll / 1000).toFixed(1)} MWp</span>
        </div>
      </div>

      <div className="ne-subuser-stats__grid">
        {stats.map(s => {
          const isSelected = selectedUserId === s.id ||
            (s.memberIds ? s.memberIds.includes(selectedUserId || 0) : false);
          const successRate = s.total > 0 ? Math.round((s.genehmigt / s.total) * 100) : 0;

          return (
            <div
              key={s.id}
              className={`ne-subuser-card ${isSelected ? "ne-subuser-card--selected" : ""}`}
              onClick={() => onFilterByUser(isSelected ? null : s.id)}
            >
              <div className="ne-subuser-card__header">
                <div className="ne-subuser-card__avatar" style={{ background: getAvatarColor(s.name) }}>
                  {getInitials(s.name)}
                </div>
                <div className="ne-subuser-card__info">
                  <span className="ne-subuser-card__name">{s.name}</span>
                  {s.company && <span className="ne-subuser-card__company">{s.company}</span>}
                </div>
                {isSelected && <Check size={18} className="ne-subuser-card__check" />}
              </div>

              {s.subMembers && s.subMembers.length > 0 && (
                <div className="ne-subuser-card__submembers">
                  {s.subMembers.map(sub => (
                    <span key={sub.id} className="ne-subuser-card__submember-badge">
                      {sub.name} ({sub.count})
                    </span>
                  ))}
                </div>
              )}

              <div className="ne-subuser-card__stats">
                <div className="ne-subuser-card__stat">
                  <span className="ne-subuser-card__stat-value">{s.total}</span>
                  <span className="ne-subuser-card__stat-label">Gesamt</span>
                </div>
                <div className="ne-subuser-card__stat">
                  <span className="ne-subuser-card__stat-value">{s.thisWeek}</span>
                  <span className="ne-subuser-card__stat-label">Diese Woche</span>
                </div>
                <div className="ne-subuser-card__stat">
                  <span className="ne-subuser-card__stat-value">{s.beimNB}</span>
                  <span className="ne-subuser-card__stat-label">Beim NB</span>
                </div>
                <div className="ne-subuser-card__stat">
                  <span className="ne-subuser-card__stat-value ne-subuser-card__stat-value--success">{s.genehmigt}</span>
                  <span className="ne-subuser-card__stat-label">Genehmigt</span>
                </div>
              </div>

              <div className="ne-subuser-card__footer">
                <div className="ne-subuser-card__progress">
                  <div className="ne-subuser-card__progress-bar">
                    <div
                      className="ne-subuser-card__progress-fill"
                      style={{ width: `${successRate}%` }}
                    />
                  </div>
                  <span className="ne-subuser-card__progress-text">{successRate}% Erfolgsquote</span>
                </div>
                <span className="ne-subuser-card__kwp">
                  <Sun size={14} />
                  {s.totalKwp.toFixed(1)} kWp
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBUNTERNEHMER FILTER DROPDOWN
// ═══════════════════════════════════════════════════════════════════════════

function SubUserFilter({ 
  subUsers, 
  selectedUserId, 
  onSelect,
  itemCounts,
}: { 
  subUsers: Array<{ id: number; name: string; company?: string }>;
  selectedUserId: number | null;
  onSelect: (id: number | null) => void;
  itemCounts: Map<number, number>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedUser = selectedUserId ? subUsers.find(u => u.id === selectedUserId) : null;

  if (subUsers.length === 0) return null;

  return (
    <div className="ne-subuser-filter">
      <button 
        className={`ne-subuser-filter__trigger ${selectedUserId ? "ne-subuser-filter__trigger--active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Users size={16} />
        <span>{selectedUser ? selectedUser.name : "Alle Subunternehmer"}</span>
        <ChevronDown size={16} className={isOpen ? "rotate-180" : ""} />
      </button>
      
      {isOpen && (
        <>
          <div className="ne-subuser-filter__backdrop" onClick={() => setIsOpen(false)} />
          <div className="ne-subuser-filter__dropdown">
            <button 
              className={`ne-subuser-filter__option ${!selectedUserId ? "ne-subuser-filter__option--active" : ""}`}
              onClick={() => { onSelect(null); setIsOpen(false); }}
            >
              <span>Alle Subunternehmer</span>
              <span className="ne-subuser-filter__count">{Array.from(itemCounts.values()).reduce((a, b) => a + b, 0)}</span>
            </button>
            {subUsers.map(u => (
              <button 
                key={u.id}
                className={`ne-subuser-filter__option ${selectedUserId === u.id ? "ne-subuser-filter__option--active" : ""}`}
                onClick={() => { onSelect(u.id); setIsOpen(false); }}
              >
                <div className="ne-subuser-filter__option-avatar" style={{ background: getAvatarColor(u.name) }}>
                  {getInitials(u.name)}
                </div>
                <div className="ne-subuser-filter__option-info">
                  <span>{u.name}</span>
                  {u.company && <small>{u.company}</small>}
                </div>
                <span className="ne-subuser-filter__count">{itemCounts.get(u.id) || 0}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM INSTALLATION CARD - NEU (memoized)
// ═══════════════════════════════════════════════════════════════════════════

const InstallationCardPremium = memo(function InstallationCardPremium({ 
  item, isSelected, isPinned, onSelect, onOpen, onPin, onQuickStatusChange,
}: {
  item: InstallationListItem;
  isSelected: boolean;
  isPinned: boolean;
  onSelect?: () => void;
  onOpen: () => void;
  onPin?: () => void;
  onQuickStatusChange?: (id: number, status: InstallationStatus) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  const status = getStatusConfig(item.status);
  const priority = computePriority(item);
  const priorityConfig = getPriorityConfig(priority);
  const progress = computeProgress(item.status);
  const days = getDaysOld(item.createdAt);
  const ageColor = getAgeColor(days, item.status);
  const attention = needsAttention(item);
  const transitions = getAvailableTransitions(item.status as InstallationStatus);

  return (
    <div
      className={`ne-card-v2 ${isSelected ? "ne-card-v2--selected" : ""} ${isPinned ? "ne-card-v2--pinned" : ""} ${attention.needs ? "ne-card-v2--attention" : ""}`}
      onClick={onOpen}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowStatusMenu(false); }}
    >
      {/* Header */}
      <div className="ne-card-v2__header">
        <div className="ne-card-v2__header-left">
          {onSelect && (
            <input type="checkbox" checked={isSelected}
              onChange={(e) => { e.stopPropagation(); onSelect(); }}
              onClick={(e) => e.stopPropagation()}
              className="ne-card-v2__checkbox"
            />
          )}
          <span className="ne-card-v2__id">{item.publicId}</span>
        </div>
        <div className="ne-card-v2__header-right">
          {attention.needs && (
            <span className="ne-card-v2__attention-badge" title={attention.reason}><AlertCircle size={14} /></span>
          )}
          <span className="ne-card-v2__priority" style={{ background: priorityConfig.color }}>
            {priority === "critical" ? "!" : priority === "high" ? "↑" : ""}
          </span>
          {onPin && (
            <button className={`ne-card-v2__pin ${isPinned ? "ne-card-v2__pin--active" : ""}`}
              onClick={(e) => { e.stopPropagation(); onPin(); }}>
              <Bookmark size={14} fill={isPinned ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>

      {/* Customer */}
      <div className="ne-card-v2__customer">
        <div className="ne-card-v2__avatar" style={{ background: getAvatarColor(item.customerName || "") }}>
          {getInitials(item.customerName || "?")}
        </div>
        <div className="ne-card-v2__customer-info">
          <span className="ne-card-v2__name">{item.customerName}</span>
          <span className="ne-card-v2__location"><MapPin size={12} />{item.plz || item.zipCode} {item.ort}</span>
        </div>
      </div>

      {/* Tech Stats */}
      <div className="ne-card-v2__tech">
        {item.totalKwp && item.totalKwp > 0 && (
          <span className="ne-card-v2__tech-item ne-card-v2__tech-item--pv" title="PV-Leistung">
            <Sun size={14} />{item.totalKwp.toFixed(1)} kWp
          </span>
        )}
        {(item as any).storageKwh && (item as any).storageKwh > 0 && (
          <span className="ne-card-v2__tech-item ne-card-v2__tech-item--storage" title="Speicher">
            <Battery size={14} />{(item as any).storageKwh} kWh
          </span>
        )}
        {(item as any).hasWallbox && (
          <span className="ne-card-v2__tech-item ne-card-v2__tech-item--wallbox" title="Wallbox"><Car size={14} /></span>
        )}
      </div>

      {/* Progress */}
      <div className="ne-card-v2__progress-container">
        <div className="ne-card-v2__progress-bar">
          <div className="ne-card-v2__progress-fill" style={{ width: `${progress}%`, background: status.color }} />
        </div>
        <span className="ne-card-v2__progress-text">{progress}%</span>
      </div>

      {/* Status */}
      <div className="ne-card-v2__status" style={{ "--status-color": status.color } as React.CSSProperties}
        onClick={(e) => { if (transitions.length > 0) { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); } }}>
        <span className="ne-card-v2__status-dot" />
        <span className="ne-card-v2__status-label">{status.label}</span>
        {transitions.length > 0 && <ChevronDown size={14} />}
      </div>

      {/* Status Dropdown */}
      {showStatusMenu && onQuickStatusChange && (
        <div className="ne-card-v2__status-menu" onClick={(e) => e.stopPropagation()}>
          {transitions.map(t => {
            const ts = getStatusConfig(t.to);
            return (
              <button key={t.to} onClick={() => { onQuickStatusChange(item.id, t.to); setShowStatusMenu(false); }}
                style={{ "--menu-color": ts.color } as React.CSSProperties}>
                <span className="ne-card-v2__status-menu-dot" />{t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Meta */}
      <div className="ne-card-v2__meta">
        <span className="ne-card-v2__meta-item" title="Netzbetreiber">
          <Building2 size={12} /><span className="ne-card-v2__meta-text">{item.gridOperator || "Kein NB"}</span>
        </span>
        <span className="ne-card-v2__meta-item ne-card-v2__meta-item--age" style={{ color: ageColor }}>
          <Clock size={12} />{formatRelativeTime(item.createdAt)}
        </span>
      </div>

      {/* Stats */}
      <div className="ne-card-v2__stats">
        <span className="ne-card-v2__stat" title="Dokumente"><FileText size={12} />{item.documentsCount || 0}</span>
        <span className="ne-card-v2__stat" title="E-Mails"><Mail size={12} />{(item as any).emailsCount || 0}</span>
        <span className="ne-card-v2__stat" title="Fortschritt"><CheckSquare size={12} />{item.currentChecklistProgress || 0}%</span>
      </div>

      {/* Hover Actions */}
      {showActions && (
        <div className="ne-card-v2__actions">
          <button onClick={(e) => { e.stopPropagation(); /* email */ }} title="E-Mail"><Mail size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); onOpen(); }} title="Dokumente"><FileText size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); onOpen(); }} title="Details"><ExternalLink size={16} /></button>
        </div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// GROUP HEADER MIT STATS - NEU
// ═══════════════════════════════════════════════════════════════════════════

function GroupHeaderPremium({ group, isCollapsed, onToggle }: { 
  group: GroupedItems; isCollapsed: boolean; onToggle: () => void;
}) {
  const stats = useMemo(() => {
    const items = group.items;
    const totalKwp = items.reduce((sum, i) => sum + (i.totalKwp || 0), 0);
    const avgDays = items.length > 0 
      ? Math.round(items.reduce((sum, i) => sum + getDaysOld(i.createdAt), 0) / items.length) : 0;
    const oldest = items.reduce((max, i) => {
      const days = getDaysOld(i.createdAt);
      return days > max.days ? { days } : max;
    }, { days: 0 });
    return { totalKwp, avgDays, oldestDays: oldest.days };
  }, [group.items]);

  const statusConfig = getStatusConfig(group.key as InstallationStatus);

  return (
    <div className="ne-group-header" onClick={onToggle}>
      <div className="ne-group-header__left">
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
        <span className="ne-group-header__dot" style={{ background: statusConfig?.color || "#64748b" }} />
        <span className="ne-group-header__title">{group.label}</span>
        <span className="ne-group-header__count">{group.items.length}</span>
      </div>
      <div className="ne-group-header__stats">
        <span className="ne-group-header__stat"><Sun size={14} />{stats.totalKwp.toFixed(1)} kWp</span>
        <span className="ne-group-header__stat"><Clock size={14} />Ø {stats.avgDays}d</span>
        {stats.oldestDays > 14 && (
          <span className="ne-group-header__stat ne-group-header__stat--warning">
            <AlertTriangle size={14} />Älteste: {stats.oldestDays}d
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TABLE VIEW
// ═══════════════════════════════════════════════════════════════════════════

function TableView({ items, selectedIds, pinnedIds, onSelect, onOpen, onPin, sortBy, sortOrder, onSort }: {
  items: InstallationListItem[];
  selectedIds: Set<number>;
  pinnedIds: Set<number>;
  onSelect?: (id: number) => void;
  onOpen: (id: number) => void;
  onPin: (id: number) => void;
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  onSort: (by: SortBy) => void;
}) {
  const SortIcon = ({ column }: { column: SortBy }) => {
    if (sortBy !== column) return <ArrowUpDown size={14} className="ne-table__sort-icon" />;
    return sortOrder === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  return (
    <div className="ne-table-container">
      <table className="ne-table">
        <thead>
          <tr>
            {onSelect && <th style={{ width: 40 }}><input type="checkbox" /></th>}
            <th onClick={() => onSort("createdAt")} style={{ cursor: "pointer" }}>ID <SortIcon column="createdAt" /></th>
            <th onClick={() => onSort("customerName")} style={{ cursor: "pointer" }}>Kunde <SortIcon column="customerName" /></th>
            <th onClick={() => onSort("plz")} style={{ cursor: "pointer" }}>Standort <SortIcon column="plz" /></th>
            <th onClick={() => onSort("value")} style={{ cursor: "pointer" }}>kWp <SortIcon column="value" /></th>
            <th onClick={() => onSort("status")} style={{ cursor: "pointer" }}>Status <SortIcon column="status" /></th>
            <th onClick={() => onSort("gridOperator")} style={{ cursor: "pointer" }}>Netzbetreiber <SortIcon column="gridOperator" /></th>
            <th onClick={() => onSort("daysOld")} style={{ cursor: "pointer", minWidth: 70 }} title="Tage seit Erstellung">Tage <SortIcon column="daysOld" /></th>
            <th onClick={() => onSort("daysAtNb")} style={{ cursor: "pointer", minWidth: 70 }} title="Tage beim Netzbetreiber">Beim NB <SortIcon column="daysAtNb" /></th>
            <th style={{ width: 80 }}>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const status = getStatusConfig(item.status);
            const days = getDaysOld(item.createdAt);
            const ageColor = getAgeColor(days, item.status);
            const daysAtNb = item.daysAtNb;
            const nbAgeColor = daysAtNb && daysAtNb > 14 ? "#f59e0b" : daysAtNb && daysAtNb > 30 ? "#ef4444" : undefined;
            return (
              <tr key={item.id} className={selectedIds.has(item.id) ? "ne-table__row--selected" : ""} onClick={() => onOpen(item.id)}>
                {onSelect && (
                  <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => onSelect(item.id)} />
                  </td>
                )}
                <td><code className="ne-table__id">{item.publicId}</code></td>
                <td>
                  <div className="ne-table__customer">
                    <div className="ne-table__avatar" style={{ background: getAvatarColor(item.customerName || "") }}>
                      {getInitials(item.customerName || "?")}
                    </div>
                    {item.customerName}
                  </div>
                </td>
                <td>{item.plz || item.zipCode} {item.ort}</td>
                <td>{item.totalKwp?.toFixed(1) || "-"}</td>
                <td>
                  <span className="ne-table__status" style={{ background: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                </td>
                <td style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.gridOperator || "-"}>
                  {item.gridOperator || "-"}
                </td>
                <td style={{ color: ageColor, textAlign: "center" }}>{days}d</td>
                <td style={{ color: nbAgeColor, textAlign: "center" }}>{daysAtNb != null ? `${daysAtNb}d` : "-"}</td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="ne-table__action" onClick={() => onPin(item.id)}>
                    <Bookmark size={14} fill={pinnedIds.has(item.id) ? "currentColor" : "none"} />
                  </button>
                  <button className="ne-table__action" onClick={() => onOpen(item.id)}>
                    <ExternalLink size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KANBAN VIEW
// ═══════════════════════════════════════════════════════════════════════════

function KanbanView({ groups, onOpen, onQuickStatusChange }: {
  groups: GroupedItems[];
  onOpen: (id: number) => void;
  onQuickStatusChange?: (id: number, status: InstallationStatus) => void;
}) {
  const [draggedItem, setDraggedItem] = useState<InstallationListItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    if (draggedItem && onQuickStatusChange && draggedItem.status !== columnKey) {
      onQuickStatusChange(draggedItem.id, columnKey as InstallationStatus);
    }
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  return (
    <div className="ne-kanban">
      {groups.map(group => {
        const statusConfig = getStatusConfig(group.key as InstallationStatus);
        return (
          <div 
            key={group.key} 
            className={`ne-kanban__column ${dragOverColumn === group.key ? "ne-kanban__column--dragover" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverColumn(group.key); }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDrop(e, group.key)}
          >
            <div className="ne-kanban__header" style={{ "--column-color": statusConfig?.color } as React.CSSProperties}>
              <span className="ne-kanban__dot" />
              <span className="ne-kanban__title">{group.label}</span>
              <span className="ne-kanban__count">{group.items.length}</span>
            </div>
            <div className="ne-kanban__cards">
              {group.items.slice(0, 50).map(item => (
                <div
                  key={item.id}
                  className="ne-kanban__card"
                  draggable
                  onDragStart={() => setDraggedItem(item)}
                  onDragEnd={() => { setDraggedItem(null); setDragOverColumn(null); }}
                  onClick={() => onOpen(item.id)}
                >
                  <span className="ne-kanban__card-id">{item.publicId}</span>
                  <span className="ne-kanban__card-name">{item.customerName}</span>
                  <span className="ne-kanban__card-location">{item.ort}</span>
                  {item.totalKwp && <span className="ne-kanban__card-kwp">{item.totalKwp.toFixed(1)} kWp</span>}
                </div>
              ))}
              {group.items.length > 50 && (
                <div className="ne-kanban__more">+{group.items.length - 50} weitere</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function NetzanmeldungenPage() {
  const { user } = useAuth();
  const userId = (user as any)?.id;
  const userRole = ((user as any)?.role || (user as any)?.rolle || "").toUpperCase();
  const isKunde = userRole === "KUNDE";
  const isAdmin = userRole === "ADMIN";
  const isWhitelabel = userRole === "WHITELABEL" || userRole === "PARTNER";
  const isStaff = isAdmin; // Nur ADMIN hat Staff-Rechte (MITARBEITER existiert nicht)
  const canSeeSubunternehmer = isAdmin || isKunde || isWhitelabel; // Admin, Kunden, Whitelabel-Partner
  
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Subunternehmer State
  const [subUsers, setSubUsers] = useState<Array<{ id: number; name: string; email: string; company?: string; parentUserId?: number; parentUserName?: string }>>([]);
  const [selectedSubUser, setSelectedSubUser] = useState<number | null>(null);
  const [showSubUserStats, setShowSubUserStats] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  
  const {
    items, totalCount, loading, error,
    viewMode, groupBy, sortBy, sortOrder,
    search, statusFilter, gridOperatorFilter, priorityFilter,
    selectedId, selectedIds, pinnedIds, collapsedGroups,
    setItems, setLoading, setError, setSearch, setViewMode, setGroupBy, setSortBy,
    toggleSortOrder, setSelectedId, toggleSelect, selectAll,
    clearSelection, togglePin, toggleGroupCollapse, clearAllFilters,
    addToast, toasts, removeToast,
  } = useNetzanmeldungenStore();

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; variant: "danger" | "warning" | "info"; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", variant: "danger", onConfirm: () => {} });

  // Init
  useEffect(() => {
    clearGuestStore();
    checkUserChangeAndReset();
  }, []);

  useEffect(() => { setSearch(debouncedSearch); }, [debouncedSearch, setSearch]);

  // Source-Tab State (Alle / CRM / Wizard / API)
  const [sourceTab, setSourceTab] = useState<"alle" | "crm" | "wizard">("alle");
  const [crmCount, setCrmCount] = useState(0);
  const [wizardCount, setWizardCount] = useState(0);

  // Load data — Installations + optional CRM-Projekte
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.installations.getAll({ limit: 500 }) as any;
      const wizardData = Array.isArray(res.data || res || []) ? (res.data || res || []) : [];

      // CRM-Projekte parallel laden
      let crmAsInstallations: any[] = [];
      try {
        const resp = await fetch("/api/crm/projekte?limit=500", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("baunity_token") || ""}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (resp.ok) {
          const crmRes = await resp.json();
          const crmItems = crmRes?.items || [];
          setCrmCount(crmItems.length);
          crmAsInstallations = crmItems.map((p: any) => ({
            id: `crm-${p.id}`,
            _isCrm: true,
            _crmProjektId: p.id,
            customerName: p.kundenName || p.titel,
            customer_name: p.kundenName || p.titel,
            status: mapCrmStageToInstStatus(p.stage),
            plz: p.plz || "",
            ort: p.ort || "",
            netzbetreiberName: "",
            technical_data: { totalPvKwPeak: p.totalKwp ? Number(p.totalKwp) : null },
            createdAt: p.createdAt,
            _source: "crm",
            _crmStage: p.stage,
            _crmTitel: p.titel,
            _crmAnsprechpartner: p.ansprechpartner,
            _crmEmail: p.kontaktEmail,
            _crmWert: p.geschaetzterWert,
            _hasNa: !!p.installationId,
          }));
        }
      } catch (e) { console.warn("CRM-Projekte nicht geladen:", e); }

      // Wizard items markieren
      const markedWizard = wizardData.map((i: any) => ({ ...i, _source: "wizard" }));
      setWizardCount(markedWizard.length);

      // Je nach Source-Tab filtern oder alles zusammen zeigen
      let combined: any[];
      if (sourceTab === "crm") combined = crmAsInstallations;
      else if (sourceTab === "wizard") combined = markedWizard;
      else combined = [...crmAsInstallations, ...markedWizard];

      setItems(combined, combined.length);
      
      // Subunternehmer aus Response extrahieren (falls vorhanden)
      if (res.subUsers && Array.isArray(res.subUsers)) {
        setSubUsers(res.subUsers);
      } else {
        // Fallback: Subunternehmer aus Items extrahieren
        const uniqueCreators = new Map<number, { id: number; name: string; email: string; company?: string }>();
        (Array.isArray(wizardData) ? wizardData : []).forEach((item: any) => {
          if (item.createdById && item.createdByName && !uniqueCreators.has(item.createdById)) {
            uniqueCreators.set(item.createdById, {
              id: item.createdById,
              name: item.createdByName,
              email: item.createdByEmail || "",
              company: item.createdByCompany,
            });
          }
        });
        if (uniqueCreators.size > 0) {
          setSubUsers(Array.from(uniqueCreators.values()));
        }
      }
    } catch (err) {
      console.error("Error loading installations:", err);
      setError("Fehler beim Laden");
      addToast({ message: "Fehler beim Laden", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [setItems, setLoading, setError, addToast, sourceTab]);

  useEffect(() => { loadData(); }, [loadData]);

  // WebSocket
  useInstallationUpdates({
    onRefreshNeeded: loadData,
    enabled: true,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (selectedId) setSelectedId(null);
        else if (searchInput) setSearchInput("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, searchInput, setSelectedId]);

  // Subunternehmer item counts (für Filter-Dropdown)
  const subUserItemCounts = useMemo(() => {
    const counts = new Map<number, number>();
    items.forEach(item => {
      if (item.createdById) {
        counts.set(item.createdById, (counts.get(item.createdById) || 0) + 1);
      }
    });
    return counts;
  }, [items]);

  // Filter by quick filter AND subuser
  const filteredByQuickFilter = useMemo(() => {
    let result = items;
    
    // Erst Subunternehmer-Filter (inkl. Sub-Mitglieder bei Parent-User)
    if (selectedSubUser) {
      const childIds = subUsers
        .filter(u => u.parentUserId === selectedSubUser)
        .map(u => u.id);
      const memberIds = new Set([selectedSubUser, ...childIds]);
      // CRM-Projekte haben kein createdById — bei User-Filter ausblenden
      result = result.filter(i => {
        if ((i as any)._isCrm) return false;
        return i.createdById != null && memberIds.has(i.createdById);
      });
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    switch (quickFilter) {
      case "mine": result = result.filter(i => i.assignedToId === userId || i.createdById === userId); break;
      case "today": result = result.filter(i => new Date(i.createdAt) >= today); break;
      case "week": result = result.filter(i => new Date(i.createdAt) >= weekAgo); break;
      case "action": result = result.filter(i => needsAttention(i).needs); break;
      case "overdue": result = result.filter(i => isOverdue(i)); break;
    }
    return result;
  }, [items, quickFilter, userId, selectedSubUser, subUsers]);

  // Apply search/filters
  const filteredItems = useMemo(() => {
    return filterItems(filteredByQuickFilter, {
      search: debouncedSearch,
      statuses: statusFilter.length > 0 ? statusFilter : undefined,
      gridOperators: gridOperatorFilter.length > 0 ? gridOperatorFilter : undefined,
      priorities: priorityFilter.length > 0 ? priorityFilter : undefined,
    });
  }, [filteredByQuickFilter, debouncedSearch, statusFilter, gridOperatorFilter, priorityFilter]);

  // Sort & group
  const sortedItems = useMemo(() => sortItems(filteredItems, sortBy, sortOrder), [filteredItems, sortBy, sortOrder]);
  const groupedItems = useMemo(() => groupItems(sortedItems, groupBy), [sortedItems, groupBy]);

  // Handlers
  const pageNavigate = useNavigate();
  const handleOpen = useCallback((id: number | string) => {
    // CRM-Projekte: altes Panel
    if (typeof id === "string" && String(id).startsWith("crm-")) {
      setSelectedId(id);
      return;
    }
    // Installationen → neues Detail-Panel V2
    pageNavigate(`/netzanmeldungen/${id}`);
  }, [setSelectedId, pageNavigate]);
  
  const handleQuickStatusChange = useCallback(async (id: number, newStatus: InstallationStatus) => {
    try {
      await api.installations.updateStatus(id, newStatus);
      addToast({ message: "Status geändert", type: "success" });
      loadData();
    } catch (err) {
      addToast({ message: "Fehler beim Status-Wechsel", type: "error" });
    }
  }, [addToast, loadData]);

  const handleExport = useCallback(async () => {
    const csv = [
      ["ID", "Kunde", "PLZ", "Ort", "kWp", "Status", "Netzbetreiber", "Erstellt"].join(";"),
      ...filteredItems.map(i => [
        i.publicId, i.customerName, i.plz || i.zipCode, i.ort,
        i.totalKwp?.toFixed(1) || "", i.status, i.gridOperator || "",
        new Date(i.createdAt).toLocaleDateString("de-DE")
      ].join(";"))
    ].join("\n");
    
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const { downloadFile } = await import("@/utils/desktopDownload");
    await downloadFile({ filename: `netzanmeldungen-${new Date().toISOString().split("T")[0]}.csv`, blob, fileType: 'csv' });
    addToast({ message: "Export erstellt", type: "success" });
  }, [filteredItems, addToast]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;

    // Prüfe, ob Nicht-Eingang-Status dabei sind (für Nicht-Admins)
    const selectedItems = sortedItems.filter(i => selectedIds.has(i.id));
    const nonEingangItems = selectedItems.filter(i =>
      (i.status || "").toLowerCase().replace(/-/g, "_") !== "eingang"
    );

    let warningMessage = "Diese Aktion kann nicht rückgängig gemacht werden.";
    if (!isStaff && nonEingangItems.length > 0) {
      warningMessage = `Hinweis: ${nonEingangItems.length} Anlage(n) sind nicht im Status "Eingang" und können von Ihnen nicht gelöscht werden. ${warningMessage}`;
    }

    setConfirmModal({
      isOpen: true,
      title: `${selectedIds.size} Anmeldung${selectedIds.size > 1 ? "en" : ""} löschen?`,
      message: warningMessage,
      variant: "danger",
      onConfirm: async () => {
        try {
          const result = await api.installations.bulkDelete(Array.from(selectedIds));

          if (result.deletedCount === result.requestedCount) {
            addToast({ message: `${result.deletedCount} Anlage(n) gelöscht`, type: "success" });
          } else if (result.deletedCount > 0) {
            addToast({
              message: `${result.deletedCount} von ${result.requestedCount} gelöscht`,
              type: "info"
            });
            if (result.errors && result.errors.length > 0) {
              const reasons = [...new Set(result.errors.map(e => e.reason))].join(", ");
              addToast({ message: `Nicht gelöscht: ${reasons}`, type: "error" });
            }
          } else {
            addToast({ message: result.message || "Keine Anlagen gelöscht", type: "error" });
          }

          clearSelection();
          loadData();
        } catch (err: any) {
          addToast({ message: err.message || "Fehler beim Löschen", type: "error" });
        }
        setConfirmModal(m => ({ ...m, isOpen: false }));
      },
    });
  }, [selectedIds, sortedItems, isStaff, addToast, clearSelection, loadData]);

  return (
    <div className="ne-page-v2">
      {/* Stats Dashboard */}
      <StatsDashboard items={items} />

      {/* Source-Tabs: Alle / CRM / Wizard */}
      <div style={{ display: "flex", gap: 2, margin: "0 0 12px", background: "rgba(15,15,28,0.5)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: 3 }}>
        {([
          { k: "alle" as const, l: "Alle Projekte", icon: "📊", c: "#a5b4fc", count: crmCount + wizardCount },
          { k: "crm" as const, l: "CRM-Projekte", icon: "📊", c: "#D4A843", count: crmCount },
          { k: "wizard" as const, l: "Netzanmeldungen", icon: "🧙", c: "#f97316", count: wizardCount },
        ]).map(t => (
          <button key={t.k} onClick={() => setSourceTab(t.k)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px", borderRadius: 6, border: "none",
              fontSize: 12, fontWeight: sourceTab === t.k ? 700 : 400,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              background: sourceTab === t.k ? t.c + "15" : "transparent",
              color: sourceTab === t.k ? t.c : "#64748b",
              borderBottom: sourceTab === t.k ? `2px solid ${t.c}` : "2px solid transparent",
            }}>
            {t.icon} {t.l}
            <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: 10 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="ne-toolbar-v2">
        <div className="ne-toolbar-v2__left">
          <h1 className="ne-toolbar-v2__title">
            <Zap size={24} />
            Projekte
            <span className="ne-toolbar-v2__count">{filteredItems.length}</span>
          </h1>
        </div>

        <div className="ne-toolbar-v2__search">
          <Search size={18} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Suchen... (drücke /)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && <button onClick={() => setSearchInput("")}><X size={16} /></button>}
        </div>

        {/* Subunternehmer Filter - nur für Admin/Whitelabel */}
        {canSeeSubunternehmer && subUsers.length > 0 && (
          <SubUserFilter
            subUsers={subUsers}
            selectedUserId={selectedSubUser}
            onSelect={setSelectedSubUser}
            itemCounts={subUserItemCounts}
          />
        )}

        <div className="ne-toolbar-v2__right">
          {/* Subunternehmer Stats Toggle */}
          {canSeeSubunternehmer && subUsers.length > 0 && (
            <button 
              className={`ne-toolbar-v2__btn ${showSubUserStats ? "ne-toolbar-v2__btn--active" : ""}`}
              onClick={() => setShowSubUserStats(!showSubUserStats)}
              title="Subunternehmer Statistiken"
            >
              <Users size={18} />
            </button>
          )}

          {/* View Toggle */}
          <div className="ne-view-toggle">
            <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} title="Karten">
              <Grid3X3 size={18} />
            </button>
            <button className={viewMode === "kanban" ? "active" : ""} onClick={() => setViewMode("kanban")} title="Kanban">
              <Columns3 size={18} />
            </button>
            <button className={viewMode === "table" ? "active" : ""} onClick={() => setViewMode("table")} title="Tabelle">
              <Table2 size={18} />
            </button>
          </div>

          {/* GroupBy Toggle */}
          <div className="ne-view-toggle">
            <button
              className={groupBy === "workPriority" ? "active" : ""}
              onClick={() => setGroupBy("workPriority")}
              title="Nach Arbeitspriorität gruppieren"
            >
              🎯
            </button>
            <button
              className={groupBy === "status" ? "active" : ""}
              onClick={() => setGroupBy("status")}
              title="Nach Status gruppieren"
            >
              📊
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            className="ne-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            title="Sortierung"
          >
            <option value="smart">🎯 Smart (Dringlichkeit)</option>
            <option value="status">📊 Status</option>
            <option value="createdAt">📅 Erstellt</option>
            <option value="updatedAt">🔄 Aktualisiert</option>
            <option value="daysOld">⏱️ Tage offen</option>
            <option value="daysAtNb">🏢 Tage beim NB</option>
            <option value="customerName">👤 Kundenname</option>
            <option value="gridOperator">⚡ Netzbetreiber</option>
            <option value="plz">📍 PLZ</option>
            <option value="value">💰 kWp</option>
          </select>
          <button
            className="ne-toolbar-v2__btn"
            onClick={toggleSortOrder}
            title={sortOrder === "desc" ? "Absteigend" : "Aufsteigend"}
          >
            {sortOrder === "desc" ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
          </button>

          {/* Export */}
          <button className="ne-toolbar-v2__btn" onClick={handleExport} title="Exportieren">
            <Download size={18} />
          </button>

          {/* Bulk Delete - nur für Admin */}
          {isAdmin && selectedIds.size > 0 && (
            <button className="ne-toolbar-v2__btn ne-toolbar-v2__btn--danger" onClick={handleBulkDelete}>
              <Trash2 size={18} />
              <span>{selectedIds.size}</span>
            </button>
          )}

          {/* Filter zurücksetzen — sichtbar wenn Filter aktiv */}
          {(debouncedSearch || statusFilter.length > 0 || gridOperatorFilter.length > 0 || priorityFilter.length > 0 || sourceTab !== "alle" || quickFilter !== "all" || selectedSubUser) && (
            <button
              className="ne-toolbar-v2__btn"
              onClick={() => {
                clearAllFilters();
                setSearchInput("");
                setDebouncedSearch("");
                setSourceTab("alle");
                setQuickFilter("all");
                setSelectedSubUser(null);
              }}
              title="Alle Filter zurücksetzen"
              style={{ color: "#ef4444", gap: 4 }}
            >
              <X size={16} /> Filter
            </button>
          )}

          {/* Refresh */}
          <button className="ne-toolbar-v2__btn" onClick={loadData} disabled={loading}>
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {/* Subunternehmer Stats - ausklappbar */}
      {canSeeSubunternehmer && showSubUserStats && subUsers.length > 0 && (
        <SubUserStats
          items={items}
          subUsers={subUsers}
          onFilterByUser={setSelectedSubUser}
          selectedUserId={selectedSubUser}
        />
      )}

      {/* Main Content */}
      <div className="ne-content-v2">
        {loading && items.length === 0 ? (
          <div className="ne-loading">
            <Loader2 size={32} className="spin" />
            <span>Lade Anmeldungen...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="ne-empty">
            <Search size={48} />
            <h3>Keine Anmeldungen gefunden</h3>
            <p>Versuche andere Filtereinstellungen</p>
            <button onClick={() => { clearAllFilters(); setSearchInput(""); }}>
              Filter zurücksetzen
            </button>
          </div>
        ) : viewMode === "table" ? (
          <TableView
            items={sortedItems}
            selectedIds={selectedIds}
            pinnedIds={pinnedIds}
            onSelect={isAdmin ? toggleSelect : undefined}
            onOpen={handleOpen}
            onPin={togglePin}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(by) => { if (sortBy === by) toggleSortOrder(); else setSortBy(by); }}
          />
        ) : viewMode === "kanban" ? (
          <KanbanView groups={groupedItems} onOpen={handleOpen} onQuickStatusChange={handleQuickStatusChange} />
        ) : groupBy === "workPriority" ? (
          /* NEUE ARBEITS-PRIORITÄTS-ANSICHT */
          <WorkPrioritySections
            items={filteredItems}
            onOpen={handleOpen}
            onQuickAction={(id, action) => {
              if (action === "submit_to_nb") {
                handleQuickStatusChange(id, "beim_nb" as InstallationStatus);
              } else if (action === "start_ibn") {
                handleQuickStatusChange(id, "ibn" as InstallationStatus);
              } else if (action === "view_query") {
                handleOpen(id);
              } else if (action === "inform_customer") {
                // Customer notification handled via Netzanmeldung detail view
                handleOpen(id);
              }
            }}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        ) : (
          <div className="ne-groups">
            {groupedItems.map(group => (
              <div key={group.key} className="ne-group">
                <GroupHeaderPremium
                  group={group}
                  isCollapsed={collapsedGroups.has(group.key)}
                  onToggle={() => toggleGroupCollapse(group.key)}
                />
                {!collapsedGroups.has(group.key) && (
                  <div className="ne-group__cards">
                    {group.items.map(item => (
                      <InstallationCardPremium
                        key={item.id}
                        item={item}
                        isSelected={selectedIds.has(item.id)}
                        isPinned={pinnedIds.has(item.id)}
                        onSelect={isAdmin ? () => toggleSelect(item.id) : undefined}
                        onOpen={() => handleOpen(item.id)}
                        onPin={() => togglePin(item.id)}
                        onQuickStatusChange={handleQuickStatusChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Panel — nur noch CRM (Installationen nutzen /netzanmeldungen/:id Route) */}
      {selectedId && typeof selectedId === "string" && String(selectedId).startsWith("crm-") && (
        <CrmDetailPanel
          item={{ id: selectedId, _crmId: Number(String(selectedId).replace("crm-", "")) }}
          onClose={() => setSelectedId(null)}
          mode="crm"
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
      />

      {/* Toasts */}
      <div className="ne-toasts">
        {toasts.map(toast => (
          <div key={toast.id} className={`ne-toast ne-toast--${toast.type}`}>
            {toast.type === "success" && <Check size={18} />}
            {toast.type === "error" && <AlertCircle size={18} />}
            {toast.type === "info" && <Bell size={18} />}
            <span>{safeString(toast.message)}</span>
            <button onClick={() => removeToast(toast.id)}><X size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
