/**
 * NETZANMELDUNGEN ENTERPRISE PAGE
 * ================================
 * Optimiert für 10.000+ Einträge mit React Query
 * - Server-seitige Filterung & Pagination
 * - Caching & Background Refetch
 * - Klare, übersichtliche UI
 * - Detail-Panel Slide-in
 * - Keyboard Shortcuts
 */

import { useState, useCallback, useEffect, useRef, lazy, Suspense, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { WorkflowOverview } from "./components/WorkflowOverview";
import { ActionRequired } from "./components/ActionRequired";
import { EnterpriseList } from "./components/EnterpriseList";
// ARCHIVIERT: DetailModal nicht mehr verwendet — CrmDetailPanel ist das aktive Detail-Panel
// import { DetailModal } from "./components/DetailModal";
import { Zap, RefreshCw, Keyboard, X, LayoutList, Users, Building2, ChevronRight } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useTracking } from "../../contexts/TrackingContext";
import { useAuth } from "../../pages/AuthContext";
import { fetchApi } from "./hooks/useEnterpriseApi";
import { SourceTabs, useCrmProjekte, type SourceFilter } from "./components/SourceTabs";
import { GruppenTabs } from "./components/GruppenTabs";
import { useStats } from "./hooks/useEnterpriseApi";
import CrmDetailPanel from "./components/detail/CrmDetailPanel";
// ARCHIVIERT: DetailPanel (altes Slide-In) nicht mehr verwendet — CrmDetailPanel ist aktiv
// import DetailPanel from "./components/DetailPanel";
import "./NetzanmeldungenEnterprise.css";

// Unified Panel (lazy loaded, feature-flagged)
// ARCHIVIERT: UnifiedDetailPanel nicht mehr verwendet — CrmDetailPanel ist aktiv
// const UnifiedDetailPanel = lazy(() =>
//   import("../../core/panels/UnifiedDetailPanel").then(m => ({ default: m.UnifiedDetailPanel }))
// );
// const USE_UNIFIED_PANEL = import.meta.env.VITE_UNIFIED_PANEL_ENTERPRISE === 'true';

// Status shortcuts mapping
const filterChipStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
  background: "rgba(212,168,67,0.1)", color: "#a5b4fc", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid rgba(212,168,67,0.2)",
};

const STATUS_SHORTCUTS: Record<string, string | null> = {
  "0": null,        // Alle
  "1": "eingang",
  "2": "beim-nb",
  "3": "rueckfrage",
  "4": "genehmigt",
  "5": "ibn",
  "6": "fertig",
};

type MainView = "alle" | "kunden" | "subs";

interface KundeOrSub {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  role: string;
  count: number;
}

export function NetzanmeldungenEnterprise() {
  const navigate = useNavigate();
  const { id: urlId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { trackInstallation, trackEvent, trackClick } = useTracking();
  const { user } = useAuth();
  const isStaff = user?.role === "ADMIN" || user?.role === "MITARBEITER";

  // CRM Integration — nur wenn User CRM-Zugang hat
  const hasCrmAccess = user?.role === "ADMIN" || user?.role === "MITARBEITER" || (user as any)?.permissions?.crmAccess === true;
  const { crmItems } = useCrmProjekte();
  const { data: wfStats } = useStats();
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("alle");
  const [activeGruppeId, setActiveGruppeId] = useState<number | null>(null);
  const [gruppeProjektIds, setGruppeProjektIds] = useState<Set<number> | null>(null);
  const crmOrgId = (user as any)?.permissions?.crmOrganisationId || 1;

  // Wenn Gruppe ausgewählt → Projekt-IDs dieser Gruppe laden
  useEffect(() => {
    if (!activeGruppeId) { setGruppeProjektIds(null); return; }
    fetch(`/api/crm/gruppen/${activeGruppeId}/projekte`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then((ids: number[]) => setGruppeProjektIds(new Set(ids)))
      .catch(() => setGruppeProjektIds(new Set()));
  }, [activeGruppeId]);

  // CRM-Items nach Gruppe filtern
  const filteredCrmItems = useMemo(() => {
    if (!gruppeProjektIds) return crmItems; // Keine Gruppe → alle
    return crmItems.filter(item => gruppeProjektIds.has(Math.abs(item.id))); // id ist negativ (-crmId)
  }, [crmItems, gruppeProjektIds]);

  // State
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mainView, setMainView] = useState<MainView>("alle");
  const [listResetKey, setListResetKey] = useState(0);
  const [listSearch, setListSearch] = useState("");
  const [listSubUser, setListSubUser] = useState<number | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [selectedEntityName, setSelectedEntityName] = useState<string>("");

  // Lade Kunden/Subs für Tabs — DIREKTE SQL-basierte Daten aus Enterprise-Endpoint
  // Wir holen ALLE Installationen (limit=9999) und gruppieren client-seitig nach kundeId
  const { data: allData } = useQuery<any>({
    queryKey: ["installations", "enterprise-all"],
    queryFn: () => fetchApi<any>(`/api/installations/enterprise?limit=500&page=1`),
    staleTime: 60_000,
    enabled: mainView !== "alle",
  });

  const kundenList = useMemo(() => {
    if (!allData?.data) return [];
    const items = allData.data as any[];

    // Gruppiere nach kundeId/createdByCompany
    const grouped = new Map<string, { id: number; name: string; company: string; email: string; count: number; role: string; parentName: string }>();

    for (const item of items) {
      const key = item.createdByCompany || item.kundeName || item.createdByName || "Unbekannt";
      const existing = grouped.get(key);
      if (existing) {
        existing.count++;
      } else {
        grouped.set(key, {
          id: item.createdById || item.kundeId || 0,
          name: item.createdByName || "Unbekannt",
          company: item.createdByCompany || item.kundeName || "",
          email: item.createdByEmail || "",
          count: 1,
          role: "KUNDE",
          parentName: "",
        });
      }
    }

    const list = Array.from(grouped.values()).sort((a, b) => b.count - a.count);

    // Für "subs" Tab: nur Einträge die NICHT der aktuelle User sind
    if (mainView === "subs") {
      return list.filter(k => k.id !== user?.id);
    }

    return list;
  }, [allData, mainView, user]);

  // Safeguard: Reset body overflow on page load/mount
  useEffect(() => {
    // Reset body overflow on mount
    document.body.style.overflow = "";
  }, []);

  // Handle URL-based detail panel opening
  useEffect(() => {
    if (urlId) {
      const numId = parseInt(urlId, 10);
      if (!isNaN(numId)) {
        setSelectedId(numId);
      }
    }
  }, [urlId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input or detail panel is open
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Allow Escape in inputs
        if (e.key === "Escape") {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      // If detail panel is open, let it handle shortcuts
      if (selectedId) {
        if (e.key === "Escape") {
          handleDetailClose();
        }
        return;
      }

      // Global shortcuts
      switch (e.key) {
        case "/":
          e.preventDefault();
          // Focus search input in EnterpriseList
          const searchInput = document.querySelector(".el-toolbar__search input") as HTMLInputElement;
          searchInput?.focus();
          break;
        case "r":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleRefresh();
          }
          break;
        case "?":
          e.preventDefault();
          setShowShortcuts(s => !s);
          break;
        case "Escape":
          setActiveStatus(null);
          setShowShortcuts(false);
          break;
        default:
          // Number keys for status filter
          if (e.key in STATUS_SHORTCUTS && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setActiveStatus(STATUS_SHORTCUTS[e.key]);
          }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  // Handlers
  const handleStatusClick = useCallback((status: string | null) => {
    setActiveStatus(status);
    trackEvent("status_filter_change", "navigation", {
      properties: { status: status || "all" },
      componentName: "NetzanmeldungenEnterprise"
    });
  }, [trackEvent]);

  const [crmDetailItem, setCrmDetailItem] = useState<any>(null);

  const handleItemClick = useCallback((id: number | string) => {
    const idStr = String(id);
    // CRM-Projekte: noch altes Panel (TODO: auch migrieren)
    if (idStr.startsWith("crm-")) {
      setSelectedId(id);
      window.history.pushState({}, "", `/netzanmeldungen/${id}`);
      return;
    }
    if (typeof id === "number" && id < 0) {
      const crmItem = filteredCrmItems.find(i => i.id === id);
      if (crmItem) { setCrmDetailItem(crmItem); return; }
    }
    // Installation → Neues Detail-Panel V2 (eigene Seite)
    trackInstallation(Number(id), "view", { source: "list_click" });
    navigate(`/netzanmeldungen/${id}`);
  }, [trackInstallation, filteredCrmItems, navigate]);

  const handleDetailClose = useCallback(() => {
    setSelectedId(null);
    trackClick("close_detail_panel", { componentName: "NetzanmeldungenEnterprise" });
    // Ensure body scroll is restored
    document.body.style.overflow = "";
    // Reset URL
    window.history.pushState({}, "", "/netzanmeldungen");
  }, [trackClick]);

  const handleDetailUpdate = useCallback(() => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["installations"] });
  }, [queryClient]);

  const handleShowAll = useCallback((type: "rueckfrage" | "eingang" | "zaehler") => {
    // Map to status filter
    const statusMap: Record<string, string> = {
      rueckfrage: "rueckfrage",
      eingang: "eingang",
      zaehler: "genehmigt",
    };
    setActiveStatus(statusMap[type] || null);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["installations"] });
    setTimeout(() => setIsRefreshing(false), 500);
  }, [queryClient]);

  // CRM Detail-Panel (Vollbild)
  if (crmDetailItem) {
    return <CrmDetailPanel item={crmDetailItem} onClose={() => setCrmDetailItem(null)} />;
  }

  return (
    <div className="ne-enterprise">
      {/* Header */}
      <header className="ne-enterprise__header">
        <div className="ne-enterprise__title">
          <div className="ne-enterprise__icon">
            <Zap size={24} />
          </div>
          <h1>Projekte</h1>
          <span className="ne-enterprise__badge">Enterprise</span>
        </div>

        <div className="ne-enterprise__actions">
          <button
            className="ne-enterprise__shortcuts-btn"
            onClick={() => setShowShortcuts(true)}
            title="Tastaturkürzel (?)"
          >
            <Keyboard size={16} />
          </button>
          <button
            className={`ne-enterprise__refresh ${isRefreshing ? "ne-enterprise__refresh--loading" : ""}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} />
            {isRefreshing ? "Aktualisiere..." : "Aktualisieren"}
          </button>
        </div>
      </header>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="ne-shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="ne-shortcuts-modal" onClick={e => e.stopPropagation()}>
            <div className="ne-shortcuts-header">
              <h3><Keyboard size={18} /> Tastaturkürzel</h3>
              <button onClick={() => setShowShortcuts(false)}><X size={18} /></button>
            </div>
            <div className="ne-shortcuts-content">
              <div className="ne-shortcuts-group">
                <h4>Navigation</h4>
                <div className="ne-shortcut"><kbd>/</kbd> <span>Suche fokussieren</span></div>
                <div className="ne-shortcut"><kbd>Esc</kbd> <span>Filter zurücksetzen / Schließen</span></div>
                <div className="ne-shortcut"><kbd>?</kbd> <span>Diese Hilfe anzeigen</span></div>
              </div>
              <div className="ne-shortcuts-group">
                <h4>Aktionen</h4>
                <div className="ne-shortcut"><kbd>R</kbd> <span>Daten aktualisieren</span></div>
              </div>
              <div className="ne-shortcuts-group">
                <h4>Status-Filter</h4>
                <div className="ne-shortcut"><kbd>0</kbd> <span>Alle anzeigen</span></div>
                <div className="ne-shortcut"><kbd>1</kbd> <span>Eingang</span></div>
                <div className="ne-shortcut"><kbd>2</kbd> <span>Beim NB</span></div>
                <div className="ne-shortcut"><kbd>3</kbd> <span>Rückfrage</span></div>
                <div className="ne-shortcut"><kbd>4</kbd> <span>Genehmigt</span></div>
                <div className="ne-shortcut"><kbd>5</kbd> <span>IBN</span></div>
                <div className="ne-shortcut"><kbd>6</kbd> <span>Fertig</span></div>
              </div>
              <div className="ne-shortcuts-group">
                <h4>Im Detail-Panel</h4>
                <div className="ne-shortcut"><kbd>1-6</kbd> <span>Tab wechseln</span></div>
                <div className="ne-shortcut"><kbd>Esc</kbd> <span>Panel schließen</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Overview — CRM-Stages nur für CRM-User */}
      <WorkflowOverview
        onStatusClick={handleStatusClick}
        activeStatus={activeStatus}
        showCrmStages={hasCrmAccess}
      />

      {/* Aktive Filter Banner */}
      {(activeStatus || sourceFilter !== "alle" || activeGruppeId || selectedEntityId || mainView !== "alle" || listSearch || listSubUser) && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
          background: "rgba(212,168,67,0.06)", borderRadius: 8, margin: "8px 0",
          border: "1px solid rgba(212,168,67,0.15)",
        }}>
          <span style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 600 }}>Aktive Filter:</span>
          {activeStatus && (
            <span style={filterChipStyle} onClick={() => setActiveStatus(null)}>
              Status: {activeStatus.replace(/_/g, " ").replace("crm ", "CRM ")} <X size={12} />
            </span>
          )}
          {sourceFilter !== "alle" && (
            <span style={filterChipStyle} onClick={() => setSourceFilter("alle")}>
              Quelle: {sourceFilter === "crm" ? "CRM" : "Wizard"} <X size={12} />
            </span>
          )}
          {activeGruppeId && (
            <span style={filterChipStyle} onClick={() => setActiveGruppeId(null)}>
              Gruppe aktiv <X size={12} />
            </span>
          )}
          {mainView !== "alle" && (
            <span style={filterChipStyle} onClick={() => { setMainView("alle"); setSelectedEntityId(null); setSelectedEntityName(""); }}>
              Ansicht: {mainView === "kunden" ? "Kunden" : "Subs"}{selectedEntityName ? `: ${selectedEntityName}` : ""} <X size={12} />
            </span>
          )}
          {listSearch && (
            <span style={filterChipStyle} onClick={() => { setListSearch(""); setListResetKey(k => k + 1); }}>
              Suche: "{listSearch}" <X size={12} />
            </span>
          )}
          {listSubUser && (
            <span style={filterChipStyle} onClick={() => { setListSubUser(null); setListResetKey(k => k + 1); }}>
              Subunternehmer-Filter <X size={12} />
            </span>
          )}
          <button
            onClick={() => {
              setActiveStatus(null);
              setSourceFilter("alle");
              setSelectedEntityId(null);
              setSelectedEntityName("");
              setListSearch("");
              setListSubUser(null);
              setActiveGruppeId(null);
              setMainView("alle");
              setListResetKey(k => k + 1);
            }}
            style={{
              marginLeft: "auto", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 600,
              color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <X size={12} /> Alle zurücksetzen
          </button>
        </div>
      )}

      {/* Source-Tabs + Gruppen — NUR für CRM-User sichtbar */}
      {hasCrmAccess && (
        <>
          <SourceTabs
            active={sourceFilter}
            onChange={(t) => { setSourceFilter(t); setActiveGruppeId(null); }}
            crmCount={filteredCrmItems.length}
            wizardCount={(wfStats as any)?.total || 0}
            apiCount={0}
          />
          {sourceFilter !== "wizard" && (
            <GruppenTabs
              activeGruppeId={activeGruppeId}
              onChange={setActiveGruppeId}
              organisationId={crmOrgId}
            />
          )}
        </>
      )}

      {/* Action Required – temporär deaktiviert */}
      {/* <ActionRequired
        onItemClick={handleItemClick}
        onShowAll={handleShowAll}
      /> */}

      {/* ═══ Haupt-View Tabs: Alle | Kunden | Subunternehmer ═══ */}
      <div className="ne-view-tabs">
        <button className={`ne-view-tab ${mainView === "alle" ? "ne-view-tab--active" : ""}`}
          onClick={() => { setMainView("alle"); setSelectedEntityId(null); setSelectedEntityName(""); }}>
          <LayoutList size={16} /> Alle Anlagen
        </button>

        {/* Filter-Reset ist jetzt im Banner oben */}
        <button className={`ne-view-tab ${mainView === "kunden" ? "ne-view-tab--active" : ""}`}
          onClick={() => { setMainView("kunden"); setSelectedEntityId(null); setSelectedEntityName(""); }}>
          <Building2 size={16} /> Kunden
        </button>
        <button className={`ne-view-tab ${mainView === "subs" ? "ne-view-tab--active" : ""}`}
          onClick={() => { setMainView("subs"); setSelectedEntityId(null); setSelectedEntityName(""); }}>
          <Users size={16} /> Subunternehmer
        </button>
      </div>

      {/* ═══ View: Alle ═══ */}
      {mainView === "alle" && (
        <EnterpriseList
          key={listResetKey}
          statusFilter={activeStatus}
          onItemClick={handleItemClick}
          sourceFilter={hasCrmAccess ? sourceFilter : "wizard"}
          crmItems={hasCrmAccess && sourceFilter !== "wizard" ? filteredCrmItems : []}
          onStatusFilterChange={(status) => setActiveStatus(status)}
          onActiveFiltersChange={({ search, subUser }) => { setListSearch(search); setListSubUser(subUser); }}
        />
      )}

      {/* ═══ View: Kunden / Subs ═══ */}
      {(mainView === "kunden" || mainView === "subs") && !selectedEntityId && (
        <div className="ne-entity-list">
          {kundenList.length === 0 ? (
            <div className="ne-entity-empty">
              {mainView === "kunden" ? "Keine Kunden gefunden" : "Keine Subunternehmer gefunden"}
            </div>
          ) : (
            kundenList.map((entity: any) => (
              <div key={entity.id} className="ne-entity-card"
                onClick={() => { setSelectedEntityId(entity.id); setSelectedEntityName(entity.company || entity.name); }}>
                <div className="ne-entity-card__left">
                  <div className="ne-entity-card__icon">
                    {mainView === "kunden" ? <Building2 size={20} /> : <Users size={20} />}
                  </div>
                  <div className="ne-entity-card__info">
                    <span className="ne-entity-card__name">{entity.company || entity.name}</span>
                    <span className="ne-entity-card__email">{entity.email}</span>
                    {mainView === "subs" && entity.parentName && (
                      <span className="ne-entity-card__parent">gehört zu: {entity.parentName}</span>
                    )}
                    {mainView === "kunden" && entity.subCount > 0 && (
                      <span className="ne-entity-card__parent">{entity.subCount} Subunternehmer</span>
                    )}
                  </div>
                </div>
                <div className="ne-entity-card__right">
                  <span className="ne-entity-card__count">{entity.count} Anlagen</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ View: Kunden/Sub ausgewählt → deren Installationen ═══ */}
      {(mainView === "kunden" || mainView === "subs") && selectedEntityId && (
        <>
          <div className="ne-entity-selected">
            <button className="ne-back-btn" onClick={() => { setSelectedEntityId(null); setSelectedEntityName(""); }}>
              ← Zurück
            </button>
            <span className="ne-entity-selected__name">{selectedEntityName}</span>
          </div>
          <EnterpriseList statusFilter={activeStatus} onItemClick={handleItemClick} createdByFilter={selectedEntityId} />
        </>
      )}

      {/* Detail Panel — nur noch für CRM-Projekte (Installationen nutzen /netzanmeldungen/:id Route) */}
      {selectedId && typeof selectedId === "string" && String(selectedId).startsWith("crm-") && (
        <CrmDetailPanel
          item={{ id: selectedId, _crmId: Number(String(selectedId).replace("crm-", "")) }}
          onClose={handleDetailClose}
          mode="crm"
        />
      )}
    </div>
  );
}

export default NetzanmeldungenEnterprise;
