/**
 * ENTERPRISE LIST v5.0 - Table + Card Views with Sub-Filter
 * ===========================================================
 * - Sub-User Filter für WhiteLabel-Kunden
 * - "Erstellt von" Spalte zeigt Sub/Firma
 * - Toggle: Tabelle ↔ Karten (nach Status gruppiert)
 * - Status-Tabs, Sortierung, Pagination
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useList } from "../hooks/useEnterpriseApi";
import type { ListFilters, ListItem, SubUser } from "../hooks/useEnterpriseApi";
import { useAuth } from "../../../pages/AuthContext";
import {
  ChevronLeft, ChevronRight, Search, X, AlertTriangle,
  ArrowUpDown, ArrowUp, ArrowDown, Clock, Building2, Zap,
  ExternalLink, Calendar, Trash2, Loader2,
  LayoutGrid, LayoutList, Users, Filter
} from "lucide-react";
import { api } from "../services/api";
import "./EnterpriseList.css";

interface EnterpriseListProps {
  statusFilter: string | null;
  onItemClick: (id: number | string) => void;
  createdByFilter?: number | null;
  sourceFilter?: string;
  crmItems?: any[];
  onStatusFilterChange?: (status: string | null) => void;
  onActiveFiltersChange?: (filters: { status: string | null; search: string; subUser: number | null }) => void;
}

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; icon: string;
}> = {
  eingang: { label: "Eingang", color: "#3b82f6", bg: "rgba(59,130,246,0.15)", icon: "📥" },
  "beim-nb": { label: "Beim NB", color: "#eab308", bg: "rgba(234,179,8,0.15)", icon: "🏢" },
  beim_nb: { label: "Beim NB", color: "#eab308", bg: "rgba(234,179,8,0.15)", icon: "🏢" },
  rueckfrage: { label: "Rückfrage", color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: "❓" },
  genehmigt: { label: "Genehmigt", color: "#22c55e", bg: "rgba(34,197,94,0.15)", icon: "✅" },
  ibn: { label: "IBN", color: "#a855f7", bg: "rgba(168,85,247,0.15)", icon: "🔧" },
  fertig: { label: "Fertig", color: "#10b981", bg: "rgba(16,185,129,0.15)", icon: "🎉" },
  storniert: { label: "Storniert", color: "#64748b", bg: "rgba(100,116,139,0.15)", icon: "❌" },
  // CRM-Stages (mit _ weil normalizeStatus - zu _ macht)
  crm_anfrage: { label: "Anfrage", color: "#38bdf8", bg: "rgba(56,189,248,0.15)", icon: "📥" },
  crm_hv: { label: "HV vermittelt", color: "#f0d878", bg: "rgba(167,139,250,0.15)", icon: "🤝" },
  crm_auftrag: { label: "Auftrag", color: "#D4A843", bg: "rgba(212,168,67,0.15)", icon: "✅" },
  crm_abgelehnt: { label: "Abgelehnt", color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: "❌" },
  crm_eingestellt: { label: "Eingestellt", color: "#f97316", bg: "rgba(249,115,22,0.15)", icon: "⏸" },
  crm_nb_kommunikation: { label: "NB-Komm.", color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: "📧" },
  crm_nb_genehmigt: { label: "Genehmigt", color: "#22c55e", bg: "rgba(34,197,94,0.15)", icon: "✅" },
};

const STATUS_TABS_WIZARD = [
  { key: null, label: "Alle", icon: "📊" },
  { key: "eingang", label: "Eingang", icon: "📥" },
  { key: "beim_nb", label: "Beim NB", icon: "🏢" },
  { key: "rueckfrage", label: "Rückfrage", icon: "❓" },
  { key: "genehmigt", label: "Genehmigt", icon: "✅" },
  { key: "ibn", label: "IBN", icon: "🔧" },
  { key: "fertig", label: "Fertig", icon: "🎉" },
];

const STATUS_TABS_CRM = [
  { key: null, label: "Alle", icon: "📊" },
  { key: "crm_anfrage", label: "Anfrage", icon: "📥" },
  { key: "crm_hv", label: "HV", icon: "🤝" },
  { key: "crm_auftrag", label: "Auftrag", icon: "✅" },
  { key: "beim_nb", label: "Beim NB", icon: "🏢" },
  { key: "crm_nb_kommunikation", label: "NB-Komm.", icon: "📧" },
  { key: "crm_nb_genehmigt", label: "Genehmigt", icon: "✅" },
  { key: "crm_eingestellt", label: "Eingestellt", icon: "⏸" },
  { key: "fertig", label: "Fertig", icon: "🎉" },
];

// Status-Reihenfolge für Karten-Ansicht
const STATUS_ORDER = ["eingang", "beim_nb", "rueckfrage", "genehmigt", "ibn", "fertig"];

type SortField = "createdAt" | "customerName" | "status" | "gridOperator" | "daysOld" | "daysAtNb" | "totalKwp" | "plz";
type ViewMode = "table" | "cards";

function formatDays(days: number | null | undefined): string {
  if (days == null) return "-";
  if (days === 0) return "heute";
  if (days === 1) return "1 Tag";
  return `${days} Tage`;
}

function getAgeColor(days: number | null | undefined, status: string): string | undefined {
  if (days == null) return undefined;
  const s = status?.toLowerCase().replace(/-/g, "_");
  if (s === "eingang" && days > 7) return days > 14 ? "#ef4444" : "#f59e0b";
  if ((s === "beim_nb" || s === "beim-nb") && days > 14) return days > 30 ? "#ef4444" : "#f59e0b";
  return undefined;
}

function normalizeStatus(status: string): string {
  return status?.toLowerCase().replace(/-/g, "_") || "eingang";
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function EnterpriseList({ statusFilter: externalStatusFilter, onItemClick, createdByFilter, sourceFilter, crmItems = [], onStatusFilterChange, onActiveFiltersChange }: EnterpriseListProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "MITARBEITER";

  // State
  const [search, setSearch] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedSubUser, setSelectedSubUser] = useState<number | null>(null);
  const limit = 100;

  // Bulk-Delete
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const selectAllVisible = useCallback((items: ListItem[]) => setSelectedIds(new Set(items.map(i => i.id))), []);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const activeStatusFilter = externalStatusFilter || localStatusFilter;

  // Filter-Änderungen nach oben melden
  useEffect(() => {
    onActiveFiltersChange?.({ status: localStatusFilter, search, subUser: selectedSubUser });
  }, [localStatusFilter, search, selectedSubUser]);

  // ═══════════════════════════════════════════════════════════════════
  // FILTER-LOGIK: Wizard-Items via API, CRM-Items via Client-Filter
  // ═══════════════════════════════════════════════════════════════════

  // CRM-Status-Keys (crm_anfrage, crm_hv, etc.) dürfen NICHT an die Installations-API
  const isCrmOnlyStatus = activeStatusFilter?.startsWith("crm_") || false;

  // API-Filter: Nur für Wizard-Items relevante Status, nicht CRM-Only-Status
  const effectiveCreatedBy = createdByFilter || selectedSubUser || undefined;
  const filters: ListFilters = useMemo(() => ({
    // Bei CRM-Only-Status: KEIN Status an API → Wizard-Items werden ungefiltert geladen
    // Bei normalem Status (eingang, beim_nb etc.): Status an API schicken
    status: isCrmOnlyStatus ? undefined : (activeStatusFilter || undefined),
    search: search || undefined,
    createdById: effectiveCreatedBy,
    sortBy,
    sortOrder,
    page,
    limit,
  }), [activeStatusFilter, isCrmOnlyStatus, search, effectiveCreatedBy, sortBy, sortOrder, page, limit]);

  const { data, isLoading, error } = useList(filters);

  // Sub-Users aus API-Response
  const subUsers: SubUser[] = data?.subUsers || [];
  const hasSubUsers = subUsers.length > 1;

  // ═══════════════════════════════════════════════════════════════════
  // ITEMS ZUSAMMENBAUEN: Client-Side Filter für CRM + Wizard mischen
  // ═══════════════════════════════════════════════════════════════════
  const sortedItems = useMemo(() => {
    let wizardItems = data?.data || [];
    let crmFiltered = [...crmItems];

    // --- CRM-Items client-seitig filtern ---

    // 1. Status-Filter auf CRM-Items
    if (activeStatusFilter) {
      crmFiltered = crmFiltered.filter(item => {
        const s = (item.status || "").toLowerCase().replace(/-/g, "_");
        return s === activeStatusFilter;
      });
    }

    // 2. SubUser/CreatedBy-Filter: CRM hat keinen createdById → ausblenden
    if (effectiveCreatedBy) {
      crmFiltered = [];
    }

    // 3. Suche auf CRM-Items
    if (search) {
      const q = search.toLowerCase();
      crmFiltered = crmFiltered.filter(item =>
        (item.customerName || "").toLowerCase().includes(q) ||
        (item.plz || "").includes(q) ||
        (item.ort || "").toLowerCase().includes(q) ||
        (item.publicId || "").toLowerCase().includes(q) ||
        (item._crmTitel || "").toLowerCase().includes(q) ||
        (item._crmEmail || "").toLowerCase().includes(q)
      );
    }

    // --- Wizard-Items: Bei CRM-Only-Status müssen sie AUCH client-seitig gefiltert werden ---
    // Wenn crm_eingestellt aktiv ist, soll kein einziges Wizard-Item angezeigt werden
    if (isCrmOnlyStatus) {
      wizardItems = [];
    }

    // --- Source-Filter ---
    let items: any[];
    if (sourceFilter === "crm") items = [...crmFiltered];
    else if (sourceFilter === "wizard") items = [...wizardItems];
    else items = [...crmFiltered, ...wizardItems];

    // --- Sortierung für berechnete Felder ---
    if (sortBy === "daysOld" || sortBy === "daysAtNb" || sortBy === "totalKwp") {
      items.sort((a, b) => {
        const valA = sortBy === "daysOld" ? (a.daysOld ?? 0) : sortBy === "daysAtNb" ? (a.daysAtNb ?? -1) : (a.totalKwp ?? 0);
        const valB = sortBy === "daysOld" ? (b.daysOld ?? 0) : sortBy === "daysAtNb" ? (b.daysAtNb ?? -1) : (b.totalKwp ?? 0);
        if (sortBy === "daysAtNb") { if (valA === -1 && valB !== -1) return 1; if (valB === -1 && valA !== -1) return -1; }
        return sortOrder === "desc" ? valB - valA : valA - valB;
      });
    }

    return items;
  }, [data, sortBy, sortOrder, sourceFilter, crmItems, activeStatusFilter, isCrmOnlyStatus, effectiveCreatedBy, search]);

  // Karten-Gruppen (nach Status)
  const cardGroups = useMemo(() => {
    const groups: Record<string, ListItem[]> = {};
    for (const s of STATUS_ORDER) groups[s] = [];
    for (const item of sortedItems) {
      const key = normalizeStatus(item.status);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [sortedItems]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("desc"); }
    setPage(1);
  };

  const handleStatusTab = (status: string | null) => {
    setLocalStatusFilter(status);
    setPage(1);
    onStatusFilterChange?.(status);
  };

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      const result = await api.installations.bulkDelete(Array.from(selectedIds));
      alert(result.deletedCount > 0 ? `${result.deletedCount} Anlage(n) gelöscht` : result.message || "Keine gelöscht");
      clearSelection();
    } catch (err: any) { alert(err.message || "Fehler"); }
    finally { setIsDeleting(false); setShowDeleteConfirm(false); }
  }, [selectedIds, clearSelection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="el-sort-icon--inactive" />;
    return sortOrder === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  // Total = tatsächlich angezeigte Items (nach allen Filtern)
  const effectiveTotal = sortedItems.length;
  const totalPages = Math.ceil(effectiveTotal / limit) || 1;

  if (error) return <div className="el-error"><AlertTriangle size={24} /><span>Fehler beim Laden</span></div>;

  return (
    <div className="el-container">
      {/* Status Tabs mit Counts */}
      {!externalStatusFilter && (() => {
        const tabs = sourceFilter === "crm" ? STATUS_TABS_CRM : sourceFilter === "wizard" ? STATUS_TABS_WIZARD : [...STATUS_TABS_WIZARD, ...STATUS_TABS_CRM.filter(t => t.key && !STATUS_TABS_WIZARD.some(w => w.key === t.key))];

        // Count-Basis: Alle Items OHNE Status-Filter aber MIT anderen aktiven Filtern
        let countCrm = [...crmItems];
        let countWizard = [...(data?.data || [])];
        // SubUser → kein CRM
        if (effectiveCreatedBy) countCrm = [];
        // Suche auf CRM
        if (search) { const q = search.toLowerCase(); countCrm = countCrm.filter(i => (i.customerName||"").toLowerCase().includes(q) || (i.plz||"").includes(q) || (i.ort||"").toLowerCase().includes(q) || ((i as any)._crmTitel||"").toLowerCase().includes(q)); }

        const countAll = sourceFilter === "crm" ? countCrm : sourceFilter === "wizard" ? countWizard : [...countCrm, ...countWizard];

        const getCount = (key: string | null) => {
          if (key === null) return countAll.length;
          // CRM-Only Status → nur CRM zählen, Wizard=0
          if (key.startsWith("crm_")) return countCrm.filter(i => (i.status||"").toLowerCase().replace(/-/g,"_") === key).length;
          // Wizard-Status → CRM mit diesem Status + Wizard von API (nicht nochmal client-filtern da API schon filtert)
          const crmMatch = countCrm.filter(i => (i.status||"").toLowerCase().replace(/-/g,"_") === key).length;
          // Wizard-Count: Da die API nur bei aktivem Filter filtert, müssen wir hier die ungefilterten Items zählen
          const wizMatch = countWizard.filter(i => (i.status||"").toLowerCase().replace(/-/g,"_") === key).length;
          return crmMatch + wizMatch;
        };

        const showCrm = sourceFilter !== "wizard";
        const showWizard = sourceFilter !== "crm";
        const wizardTabs = STATUS_TABS_WIZARD;
        const crmTabs = STATUS_TABS_CRM.filter(t => t.key !== null); // "Alle" nur einmal

        const TabBtn = ({ tab }: { tab: typeof wizardTabs[0] }) => {
          const count = getCount(tab.key);
          const isActive = localStatusFilter === tab.key;
          return (
            <button
              className={`el-tab ${isActive ? "el-tab--active" : ""}`}
              onClick={() => handleStatusTab(tab.key)}
              style={count === 0 && !isActive ? { opacity: 0.4 } : undefined}
            >
              <span className="el-tab__icon">{tab.icon}</span>
              <span className="el-tab__label">{tab.label}</span>
              <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.6, marginLeft: 2 }}>{count}</span>
            </button>
          );
        };

        return (
          <div>
            {/* Wizard Status-Zeile */}
            {showWizard && (
              <div className="el-tabs">
                {wizardTabs.map(tab => <TabBtn key={tab.key || "all"} tab={tab} />)}
              </div>
            )}
            {/* CRM Status-Zeile */}
            {showCrm && crmTabs.length > 0 && (
              <div className="el-tabs" style={{ marginTop: 2 }}>
                <span style={{ fontSize: 10, color: "#D4A843", fontWeight: 700, padding: "0 8px", display: "flex", alignItems: "center" }}>CRM</span>
                {crmTabs.map(tab => <TabBtn key={tab.key || "crm-all"} tab={tab} />)}
              </div>
            )}
          </div>
        );
      })()}

      {/* Toolbar */}
      <div className="el-toolbar">
        <div className="el-toolbar__search">
          <Search size={16} />
          <input type="text" placeholder="Suchen (Name, PLZ, Ort, ID)..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && <button className="el-toolbar__clear" onClick={() => { setSearch(""); setPage(1); }}><X size={14} /></button>}
        </div>

        {/* Sub-User Filter (nur für WhiteLabel) */}
        {hasSubUsers && (
          <div className="el-toolbar__sub-filter">
            <Filter size={14} />
            <select value={selectedSubUser || ""} onChange={e => { setSelectedSubUser(e.target.value ? Number(e.target.value) : null); setPage(1); }}>
              <option value="">Alle Mitarbeiter/Subs</option>
              {subUsers.map(su => (
                <option key={su.id} value={su.id}>{su.company || su.name} ({su.count})</option>
              ))}
            </select>
          </div>
        )}

        <div className="el-toolbar__right">
          <span className="el-toolbar__count">{effectiveTotal.toLocaleString()} Ergebnis{effectiveTotal !== 1 ? "se" : ""}</span>

          {/* View Toggle */}
          <div className="el-toolbar__view-toggle">
            <button className={`el-view-btn ${viewMode === "table" ? "el-view-btn--active" : ""}`}
              onClick={() => setViewMode("table")} title="Tabellenansicht">
              <LayoutList size={16} />
            </button>
            <button className={`el-view-btn ${viewMode === "cards" ? "el-view-btn--active" : ""}`}
              onClick={() => setViewMode("cards")} title="Kartenansicht">
              <LayoutGrid size={16} />
            </button>
          </div>

          {isAdmin && selectedIds.size > 0 && (
            <button className="el-toolbar__delete" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}>
              {isDeleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
              <span>{selectedIds.size} löschen</span>
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      {isAdmin && showDeleteConfirm && (
        <div className="el-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="el-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="el-confirm-icon"><Trash2 size={24} /></div>
            <h3>{selectedIds.size} Anlage{selectedIds.size > 1 ? "n" : ""} löschen?</h3>
            <p>Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="el-confirm-actions">
              <button className="el-confirm-cancel" onClick={() => setShowDeleteConfirm(false)}>Abbrechen</button>
              <button className="el-confirm-delete" onClick={handleBulkDelete} disabled={isDeleting}>{isDeleting ? "Lösche..." : "Löschen"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TABELLENANSICHT ═══ */}
      {viewMode === "table" && (
        <div className="el-table-wrapper">
          <table className="el-table">
            <thead>
              <tr>
                {isAdmin && <th className="el-th--checkbox"><input type="checkbox"
                  checked={sortedItems.length > 0 && selectedIds.size === sortedItems.length}
                  onChange={() => selectedIds.size === sortedItems.length ? clearSelection() : selectAllVisible(sortedItems)} /></th>}
                <th onClick={() => handleSort("status")} className="el-th--sortable">Status <SortIcon field="status" /></th>
                <th onClick={() => handleSort("customerName")} className="el-th--sortable">Kunde <SortIcon field="customerName" /></th>
                {hasSubUsers && <th>Erstellt von</th>}
                <th onClick={() => handleSort("plz")} className="el-th--sortable">Standort <SortIcon field="plz" /></th>
                <th onClick={() => handleSort("gridOperator")} className="el-th--sortable">NB <SortIcon field="gridOperator" /></th>
                <th onClick={() => handleSort("totalKwp")} className="el-th--sortable el-th--number">kWp <SortIcon field="totalKwp" /></th>
                <th onClick={() => handleSort("daysOld")} className="el-th--sortable el-th--number">Alter <SortIcon field="daysOld" /></th>
                <th onClick={() => handleSort("daysAtNb")} className="el-th--sortable el-th--number">Beim NB <SortIcon field="daysAtNb" /></th>
                <th className="el-th--actions"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(8)].map((_, i) => (
                <tr key={i} className="el-row--loading">
                  {isAdmin && <td><div className="el-skeleton" style={{ width: 20 }} /></td>}
                  <td><div className="el-skeleton" style={{ width: 80 }} /></td>
                  <td><div className="el-skeleton" style={{ width: 150 }} /></td>
                  {hasSubUsers && <td><div className="el-skeleton" style={{ width: 100 }} /></td>}
                  <td><div className="el-skeleton" style={{ width: 120 }} /></td>
                  <td><div className="el-skeleton" style={{ width: 120 }} /></td>
                  <td><div className="el-skeleton" style={{ width: 50 }} /></td>
                  <td><div className="el-skeleton" style={{ width: 60 }} /></td>
                  <td><div className="el-skeleton" style={{ width: 60 }} /></td>
                  <td><div className="el-skeleton" style={{ width: 30 }} /></td>
                </tr>
              )) : sortedItems.length === 0 ? (
                <tr><td colSpan={hasSubUsers ? 10 : 9} className="el-empty-row">
                  <div className="el-empty"><span className="el-empty__icon">🔍</span><span>Keine Anlagen gefunden</span></div>
                </td></tr>
              ) : sortedItems.map(item => {
                const status = STATUS_CONFIG[normalizeStatus(item.status)] || STATUS_CONFIG.eingang;
                return (
                  <tr key={item.id} className={`el-row ${selectedIds.has(item.id) ? "el-row--selected" : ""}`} onClick={() => onItemClick(item.id)}>
                    {isAdmin && <td className="el-td--checkbox" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} /></td>}
                    <td><span className="el-status-badge" style={{ background: status.bg, color: status.color }}>{status.icon} {status.label}</span></td>
                    <td><div className="el-customer"><span className="el-customer__name">{item.customerName}</span><span className="el-customer__id">{item.publicId}</span></div></td>
                    {hasSubUsers && <td><span className="el-created-by" title={item.createdByName || undefined}>
                      <Users size={12} />{item.createdByCompany || item.createdByName || item.kundeName || "—"}</span></td>}
                    <td><div className="el-location"><span className="el-location__plz">{item.plz}</span><span className="el-location__ort">{item.ort}</span></div></td>
                    <td><span className="el-nb" title={item.gridOperator || "Nicht zugewiesen"}>
                      {item.gridOperator ? <><Building2 size={12} />{item.gridOperator.length > 20 ? item.gridOperator.substring(0, 20) + "…" : item.gridOperator}</> :
                        <span className="el-nb--missing"><AlertTriangle size={12} />—</span>}</span></td>
                    <td className="el-td--number">{item.totalKwp ? <span className="el-kwp"><Zap size={12} />{item.totalKwp.toFixed(1)}</span> : "—"}</td>
                    <td className="el-td--number"><span className="el-days" style={{ color: getAgeColor(item.daysOld, item.status) }}><Clock size={12} />{formatDays(item.daysOld)}</span></td>
                    <td className="el-td--number">{item.daysAtNb != null ?
                      <span className="el-days" style={{ color: getAgeColor(item.daysAtNb, "beim_nb") }}><Calendar size={12} />{formatDays(item.daysAtNb)}</span> :
                      <span className="el-days el-days--na">—</span>}</td>
                    <td className="el-td--actions"><button className="el-action-btn" onClick={e => { e.stopPropagation(); onItemClick(item.id); }}><ExternalLink size={14} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ KARTENANSICHT (nach Status gruppiert) ═══ */}
      {viewMode === "cards" && (
        <div className="el-cards-container">
          {isLoading ? (
            <div className="el-cards-loading"><Loader2 size={24} className="spin" /> Lade Anlagen...</div>
          ) : (
            STATUS_ORDER.filter(s => !activeStatusFilter || s === activeStatusFilter).map(statusKey => {
              const items = cardGroups[statusKey] || [];
              if (items.length === 0 && activeStatusFilter) return null;
              const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.eingang;
              return (
                <div key={statusKey} className="el-cards-group">
                  <div className="el-cards-group__header">
                    <span className="el-cards-group__icon">{cfg.icon}</span>
                    <span className="el-cards-group__label">{cfg.label}</span>
                    <span className="el-cards-group__count" style={{ background: cfg.bg, color: cfg.color }}>{items.length}</span>
                  </div>
                  {items.length === 0 ? (
                    <div className="el-cards-group__empty">Keine Anlagen</div>
                  ) : (
                    <div className="el-cards-group__grid">
                      {items.map(item => (
                        <div key={item.id} className="el-card" onClick={() => onItemClick(item.id)}>
                          <div className="el-card__header">
                            <span className="el-card__name">{item.customerName}</span>
                            <span className="el-card__id">{item.publicId}</span>
                          </div>
                          <div className="el-card__body">
                            <div className="el-card__row"><span className="el-card__label">Standort</span><span>{item.plz} {item.ort}</span></div>
                            {item.gridOperator && <div className="el-card__row"><span className="el-card__label">NB</span><span>{item.gridOperator}</span></div>}
                            {item.totalKwp > 0 && <div className="el-card__row"><span className="el-card__label">Leistung</span><span><Zap size={12} /> {item.totalKwp.toFixed(1)} kWp</span></div>}
                            {hasSubUsers && (item.createdByCompany || item.createdByName) && (
                              <div className="el-card__row"><span className="el-card__label">Erstellt von</span><span><Users size={12} /> {item.createdByCompany || item.createdByName}</span></div>
                            )}
                          </div>
                          <div className="el-card__footer">
                            <span className="el-card__age" style={{ color: getAgeColor(item.daysOld, item.status) }}>
                              <Clock size={12} /> {formatDays(item.daysOld)}
                            </span>
                            {item.daysAtNb != null && (
                              <span className="el-card__nb-age" style={{ color: getAgeColor(item.daysAtNb, "beim_nb") }}>
                                NB: {formatDays(item.daysAtNb)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && viewMode === "table" && (
        <div className="el-pagination">
          <button className="el-pagination__btn" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /> Zurück</button>
          <div className="el-pagination__pages">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
              return <button key={p} className={`el-pagination__page ${page === p ? "el-pagination__page--active" : ""}`} onClick={() => setPage(p)}>{p}</button>;
            })}
          </div>
          <button className="el-pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Weiter <ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}

export default EnterpriseList;
