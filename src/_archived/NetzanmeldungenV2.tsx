/**
 * NETZANMELDUNGEN V2 — Pipeline + Sidebar + Tabelle
 * ===================================================
 * Design basiert auf MockNetzanmeldungen.tsx
 * Echte Daten via useStats(), useList(), useCrmProjekte()
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../pages/AuthContext";
import { useStats, useList } from "./hooks/useEnterpriseApi";
import type { ListFilters, ListItem, SubUser } from "./hooks/useEnterpriseApi";
import { useCrmProjekte } from "./components/SourceTabs";
import CrmDetailPanel from "./components/detail/CrmDetailPanel";

// ═══ Colors ═══
const C = {
  bg: "#0a0a0f", card: "rgba(17,20,35,0.95)",
  border: "rgba(255,255,255,0.06)",
  text: "#e2e8f0", dim: "#64748b", muted: "#94a3b8",
  accent: "#D4A843", blue: "#3b82f6", green: "#22c55e", orange: "#f59e0b",
  red: "#ef4444", purple: "#f0d878", cyan: "#06b6d4",
};

// ═══ Status Config ═══
const SC: Record<string, { l: string; c: string; i: string }> = {
  eingang: { l: "Eingang", c: C.dim, i: "📥" },
  beim_nb: { l: "Beim NB", c: C.blue, i: "🏢" },
  rueckfrage: { l: "Rückfrage", c: C.red, i: "❓" },
  genehmigt: { l: "Genehmigt", c: C.green, i: "✅" },
  ibn: { l: "IBN", c: C.orange, i: "🔧" },
  fertig: { l: "Fertig", c: C.green, i: "🎉" },
  storniert: { l: "Storniert", c: C.dim, i: "🚫" },
  crm_anfrage: { l: "Anfrage", c: C.purple, i: "📥" },
  crm_hv: { l: "HV", c: C.purple, i: "🤝" },
  crm_auftrag: { l: "Auftrag", c: C.accent, i: "✅" },
  crm_nb_kommunikation: { l: "NB-Komm.", c: C.orange, i: "📧" },
  crm_nb_genehmigt: { l: "Genehmigt", c: C.green, i: "✅" },
  crm_eingestellt: { l: "Eingestellt", c: C.dim, i: "⏸" },
  crm_abgelehnt: { l: "Abgelehnt", c: C.red, i: "❌" },
};

function normalizeStatus(s: string): string {
  return (s || "").toLowerCase().replace(/-/g, "_");
}

// ═══ Unified item type for the table ═══
interface TableItem {
  id: number;
  type: "crm" | "inst";
  name: string;
  kunde: string;
  kundeId: number | null;
  status: string;
  kwp: number;
  ort: string;
  nb: string;
  daysAtNb: number | null;
  linked: boolean;
  linkedId: string;
  _isCrm?: boolean;
  _crmId?: number;
  _installationId?: number;
  rueckfrage?: string;
  billed?: boolean;
  createdById: number | null;
  email?: string;
  titel?: string;
}

function wizardToTableItem(item: ListItem): TableItem {
  return {
    id: item.id,
    type: "inst",
    name: item.customerName || "—",
    kunde: item.kundeName || item.createdByCompany || "—",
    kundeId: item.kundeId || item.createdById,
    status: normalizeStatus(item.status),
    kwp: item.totalKwp || 0,
    ort: [item.plz, item.ort].filter(Boolean).join(" "),
    nb: item.gridOperator || "",
    daysAtNb: item.daysAtNb ?? null,
    linked: false,
    linkedId: "",
    _installationId: item.id,
    billed: item.isBilled,
    createdById: item.createdById,
  };
}

function crmToTableItem(item: Record<string, unknown>): TableItem {
  const hasNa = !!(item._hasNa);
  return {
    id: item.id as number,
    type: "crm",
    name: (item.customerName as string) || "—",
    kunde: (item.createdByName as string) || "CRM",
    kundeId: null,
    status: normalizeStatus(item.status as string),
    kwp: (item.technical_data as Record<string, number>)?.totalPvKwPeak || 0,
    ort: [item.plz, item.ort].filter(Boolean).join(" "),
    nb: (item.netzbetreiberName as string) || (item.gridOperator as string) || "",
    daysAtNb: null,
    linked: hasNa,
    linkedId: hasNa ? `INST-${item.id}` : "",
    _isCrm: true,
    _crmId: item._crmId as number,
    createdById: null,
    email: (item._crmEmail as string) || "",
    titel: (item._crmTitel as string) || "",
  };
}

// ═══ Main Component ═══
export default function NetzanmeldungenV2() {
  const { user } = useAuth();
  const userRole = ((user as any)?.role || "").toUpperCase();
  const isStaff = userRole === "ADMIN" || userRole === "MITARBEITER";

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKunde, setSelectedKunde] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<"alle" | "crm" | "wizard">("alle");
  const [sortBy, setSortBy] = useState<"name" | "kwp" | "daysAtNb" | "status" | "ort">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Detail panel
  const [detailItem, setDetailItem] = useState<TableItem | null>(null);
  const params = useParams<{ id?: string }>();

  // Deep-Link: /netzanmeldungen/:id oder /netzanmeldungen/crm-:id → öffne Detail-Panel
  useEffect(() => {
    if (params.id && !detailItem) {
      if (params.id.startsWith("crm-")) {
        const crmId = Number(params.id.replace("crm-", ""));
        if (Number.isFinite(crmId) && crmId > 0) {
          setDetailItem({ id: -crmId, name: "", status: "", _isCrm: true, _crmId: crmId } as TableItem);
        }
      } else {
        const numId = Number(params.id);
        if (Number.isFinite(numId) && numId > 0) {
          setDetailItem({ id: numId, name: "", status: "", _installationId: numId } as TableItem);
        }
      }
    }
  }, [params.id]);

  // CustomEvent-Listener: Panel-Wechsel zwischen CRM ↔ Installation
  useEffect(() => {
    const handleOpenInstallation = (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      if (id) setDetailItem({ id, name: "", status: "", _installationId: id } as TableItem);
    };
    const handleOpenCrm = (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      if (id) setDetailItem({ id: -id, name: "", status: "", _isCrm: true, _crmId: id } as TableItem);
    };
    window.addEventListener("open-installation", handleOpenInstallation);
    window.addEventListener("open-crm-projekt", handleOpenCrm);
    return () => {
      window.removeEventListener("open-installation", handleOpenInstallation);
      window.removeEventListener("open-crm-projekt", handleOpenCrm);
    };
  }, []);

  // Data hooks
  const { data: stats } = useStats();
  // CRM-Projekte nur für Staff laden
  const { crmItems: rawCrmItems, crmLoading } = useCrmProjekte();
  const crmItems = isStaff ? rawCrmItems : [];

  // API filters for wizard items
  const isCrmOnlyStatus = activeFilter?.startsWith("crm_") || false;
  const apiFilters: ListFilters = useMemo(() => ({
    status: isCrmOnlyStatus ? undefined : (activeFilter || undefined),
    search: searchQuery || undefined,
    createdById: selectedKunde || undefined,
    limit: 500,
    enabled: !isCrmOnlyStatus, // Skip API call for CRM-only status
  }), [activeFilter, isCrmOnlyStatus, searchQuery, selectedKunde]);

  const { data: listData, isLoading: listLoading } = useList(apiFilters);

  // SubUsers from API for Kunden dropdown
  const subUsers: SubUser[] = listData?.subUsers || [];

  // Build unified items
  const { filtered, kundenList, crmCounts, statusCounts } = useMemo(() => {
    // Wizard items
    let wizardItems: TableItem[] = isCrmOnlyStatus ? [] : (listData?.data || []).map(wizardToTableItem);
    // CRM items
    let crmFiltered: TableItem[] = crmItems.map(crmToTableItem);

    // Client-side CRM filtering
    if (activeFilter) {
      crmFiltered = crmFiltered.filter(item => item.status === activeFilter);
    }
    if (selectedKunde) {
      crmFiltered = []; // CRM has no createdById
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      crmFiltered = crmFiltered.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.ort.toLowerCase().includes(q) ||
        item.kunde.toLowerCase().includes(q) ||
        (item.titel || "").toLowerCase().includes(q) ||
        (item.email || "").toLowerCase().includes(q)
      );
    }

    // Source-Filter
    let allItems = sourceFilter === "crm" ? [...crmFiltered]
      : sourceFilter === "wizard" ? [...wizardItems]
      : [...crmFiltered, ...wizardItems];

    // Abgeschlossene aus der Hauptliste ausblenden (nur wenn kein Filter UND keine Suche aktiv)
    if (!activeFilter && !searchQuery) {
      allItems = allItems.filter(i => i.status !== "fertig" && i.status !== "storniert");
    }

    // Kunden-Liste aus subUsers + CRM extrahieren
    const kundenMap = new Map<number, { id: number; name: string; count: number }>();
    for (const su of subUsers) {
      kundenMap.set(su.id, { id: su.id, name: su.company || su.name, count: su.count });
    }

    // CRM counts (immer aus ALLEN crmItems, nicht gefiltert)
    const allCrmItems = crmItems.map(crmToTableItem);
    const crmC: Record<string, number> = {};
    for (const item of allCrmItems) {
      crmC[item.status] = (crmC[item.status] || 0) + 1;
    }

    // Status counts for sidebar (wizard from stats, crm client-side)
    const sC: Record<string, number> = {};
    const allWizard = listData?.data || [];
    for (const item of allWizard) {
      const s = normalizeStatus(item.status);
      sC[s] = (sC[s] || 0) + 1;
    }

    return {
      filtered: allItems,
      kundenList: Array.from(kundenMap.values()).sort((a, b) => b.count - a.count),
      crmCounts: crmC,
      statusCounts: sC,
    };
  }, [listData, crmItems, activeFilter, isCrmOnlyStatus, selectedKunde, searchQuery, subUsers, sourceFilter]);

  // Pipeline counts from stats API + CRM client counts
  const pipelineCounts = useMemo(() => ({
    crm_anfrage: crmCounts["crm_anfrage"] || 0,
    crm_auftrag: crmCounts["crm_auftrag"] || 0,
    crm_nb_kommunikation: crmCounts["crm_nb_kommunikation"] || 0,
    crm_nb_genehmigt: crmCounts["crm_nb_genehmigt"] || 0,
    crm_eingestellt: crmCounts["crm_eingestellt"] || 0,
    beim_nb: stats?.beimNb || 0,
    rueckfrage: stats?.rueckfrage || 0,
    genehmigt: stats?.genehmigt || 0,
    ibn: stats?.ibn || 0,
    fertig: stats?.fertig || 0,
    eingang: stats?.eingang || 0,
    avgDaysBeimNb: stats?.avgDaysBeimNb || 0,
  }), [stats, crmCounts]);

  const toggleFilter = useCallback((key: string) => {
    setActiveFilter(prev => prev === key ? null : key);
  }, []);

  // Status-Reihenfolge für Sortierung (Pipeline-Reihenfolge)
  const STATUS_ORDER: Record<string, number> = {
    crm_anfrage: 1, crm_hv: 2, crm_auftrag: 3, crm_nb_anfrage: 4, crm_nb_kommunikation: 5, crm_nb_genehmigt: 6,
    eingang: 10, beim_nb: 11, rueckfrage: 12, genehmigt: 13, ibn: 14, fertig: 15, storniert: 16, crm_eingestellt: 17,
  };

  // Sortierung
  const sorted = useMemo(() => {
    const items = [...filtered];
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "kwp": cmp = (a.kwp || 0) - (b.kwp || 0); break;
        case "daysAtNb": cmp = (a.daysAtNb ?? -1) - (b.daysAtNb ?? -1); break;
        case "status": cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99); break;
        case "ort": cmp = a.ort.localeCompare(b.ort); break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return items;
  }, [filtered, sortBy, sortDir]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const selectedKundeName = selectedKunde ? kundenList.find(k => k.id === selectedKunde)?.name : null;
  const isLoading = listLoading || crmLoading;

  // Click handler
  const handleRowClick = useCallback((item: TableItem) => {
    setDetailItem(item);
  }, []);

  // Detail panel
  if (detailItem) {
    const mode = detailItem._isCrm ? "crm" : "installation";
    const panelItem = detailItem._isCrm
      ? { id: detailItem.id, _crmId: detailItem._crmId || Math.abs(detailItem.id) }
      : { id: detailItem.id, _installationId: detailItem._installationId || detailItem.id };
    return <CrmDetailPanel item={panelItem} onClose={() => setDetailItem(null)} mode={mode} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ═══ HEADER + SOURCE TABS ═══ */}
      <div style={{ padding: "12px 24px 0", borderBottom: `1px solid ${C.border}` }}>
        {/* Source Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
          {([
            { key: "alle" as const, label: isStaff ? "Alle Projekte" : "Netzanmeldungen", icon: "📊", count: (stats?.total || 0) + crmItems.length },
            ...(isStaff ? [{ key: "wizard" as const, label: "Netzanmeldungen", icon: "⚡", count: stats?.total || 0 }] : []),
            ...(isStaff ? [{ key: "crm" as const, label: "CRM-Projekte", icon: "📊", count: crmItems.length }] : []),
          ]).map(t => (
            <button key={t.key} onClick={() => setSourceFilter(t.key)} style={{
              padding: "8px 16px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: sourceFilter === t.key ? 700 : 400,
              cursor: "pointer", background: sourceFilter === t.key ? `${C.accent}12` : "transparent",
              color: sourceFilter === t.key ? C.accent : C.dim, transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span>{t.icon}</span> {t.label}
              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8, background: sourceFilter === t.key ? `${C.accent}20` : "rgba(255,255,255,0.05)", color: sourceFilter === t.key ? C.accent : C.dim }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Pipeline */}
        {isStaff && <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          <PipelineGroup label="CRM" color={C.accent} items={[
            { key: "crm_anfrage", label: "ANFRAGE", count: pipelineCounts.crm_anfrage, color: C.purple },
            { key: "crm_auftrag", label: "AUFTRAG", count: pipelineCounts.crm_auftrag, color: C.accent },
            { key: "crm_nb_kommunikation", label: "NB-KOMM.", count: pipelineCounts.crm_nb_kommunikation, color: C.orange },
          ]} activeFilter={activeFilter} onFilter={toggleFilter} />
          <PipelineArrow />
          <PipelineGroup label="NETZANMELDUNG" color={C.blue} items={[
            { key: "beim_nb", label: "BEIM NB", count: pipelineCounts.beim_nb, color: C.blue, sub: pipelineCounts.avgDaysBeimNb > 0 ? `Ø ${pipelineCounts.avgDaysBeimNb} Tage` : undefined },
            { key: "rueckfrage", label: "RÜCKFRAGE", count: pipelineCounts.rueckfrage, color: C.red },
            { key: "genehmigt", label: "GENEHMIGT", count: pipelineCounts.genehmigt, color: C.green },
          ]} activeFilter={activeFilter} onFilter={toggleFilter} />
          <PipelineArrow />
          <PipelineGroup label="ABSCHLUSS" color={C.green} items={[
            { key: "ibn", label: "IBN", count: pipelineCounts.ibn, color: C.orange },
            { key: "fertig", label: "FERTIG", count: pipelineCounts.fertig, color: C.green },
          ]} activeFilter={activeFilter} onFilter={toggleFilter} />
        </div>}
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 100px)" }}>

        {/* ═══ SIDEBAR ═══ */}
        {sidebarOpen && (
          <div style={{ width: 220, borderRight: `1px solid ${C.border}`, padding: "12px 10px", overflowY: "auto", flexShrink: 0 }}>
            {/* Kunden-Suche */}
            <KundenPicker
              kundenList={kundenList}
              selectedKunde={selectedKunde}
              selectedKundeName={selectedKundeName}
              onSelect={setSelectedKunde}
            />

            <div style={{ height: 1, background: C.border, margin: "8px 0" }} />

            {/* Status-Filter */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Status</div>
              <SidebarBtn label="Alle offenen" count={(stats?.total || 0) + crmItems.length - (stats?.fertig || 0) - (stats?.storniert || 0)} color={C.text} active={activeFilter === null} onClick={() => setActiveFilter(null)} />
              <SidebarBtn label="Eingang" count={stats?.eingang || 0} color={C.dim} active={activeFilter === "eingang"} onClick={() => toggleFilter("eingang")} />
              <SidebarBtn label="Beim NB" count={stats?.beimNb || 0} color={C.blue} active={activeFilter === "beim_nb"} onClick={() => toggleFilter("beim_nb")} />
              <SidebarBtn label="Rückfrage" count={stats?.rueckfrage || 0} color={C.red} active={activeFilter === "rueckfrage"} onClick={() => toggleFilter("rueckfrage")} dot />
              <SidebarBtn label="Genehmigt" count={stats?.genehmigt || 0} color={C.green} active={activeFilter === "genehmigt"} onClick={() => toggleFilter("genehmigt")} />
              <SidebarBtn label="IBN" count={stats?.ibn || 0} color={C.orange} active={activeFilter === "ibn"} onClick={() => toggleFilter("ibn")} />
            </div>
            <div style={{ height: 1, background: C.border, margin: "8px 0" }} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Archiv</div>
              <SidebarBtn label="Fertig" count={stats?.fertig || 0} color={C.green} active={activeFilter === "fertig"} onClick={() => toggleFilter("fertig")} />
              <SidebarBtn label="Storniert" count={stats?.storniert || 0} color={C.dim} active={activeFilter === "storniert"} onClick={() => toggleFilter("storniert")} />
            </div>

            <div style={{ height: 1, background: C.border, margin: "8px 0" }} />

            {/* CRM-Status — nur für Staff */}
            {isStaff && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>CRM</div>
              <SidebarBtn label="Anfrage" count={crmCounts["crm_anfrage"] || 0} color={C.purple} active={activeFilter === "crm_anfrage"} onClick={() => toggleFilter("crm_anfrage")} />
              <SidebarBtn label="Auftrag" count={crmCounts["crm_auftrag"] || 0} color={C.accent} active={activeFilter === "crm_auftrag"} onClick={() => toggleFilter("crm_auftrag")} />
              <SidebarBtn label="NB-Komm." count={crmCounts["crm_nb_kommunikation"] || 0} color={C.orange} active={activeFilter === "crm_nb_kommunikation"} onClick={() => toggleFilter("crm_nb_kommunikation")} />
              <SidebarBtn label="NB-Genehmigt" count={crmCounts["crm_nb_genehmigt"] || 0} color={C.green} active={activeFilter === "crm_nb_genehmigt"} onClick={() => toggleFilter("crm_nb_genehmigt")} />
              <SidebarBtn label="Eingestellt" count={crmCounts["crm_eingestellt"] || 0} color={C.dim} active={activeFilter === "crm_eingestellt"} onClick={() => toggleFilter("crm_eingestellt")} />
            </div>
            )}

            <div style={{ height: 1, background: C.border, margin: "8px 0" }} />

            {/* Schnellfilter */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Schnellfilter</div>
              <SidebarBtn label="Handlungsbedarf" count={stats?.actionRequired?.total || 0} color={C.red} active={false} onClick={() => toggleFilter("rueckfrage")} />
              <SidebarBtn label="Überfällig >14d" count={stats?.actionRequired?.zuLangeBeimNb || 0} color={C.orange} active={false} onClick={() => {}} />
            </div>
          </div>
        )}

        {/* ═══ HAUPTBEREICH ═══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Suchleiste + Filter-Chips */}
          <div style={{ padding: "10px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Sidebar toggle (mobile) */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: C.muted, fontSize: 14, display: "none" }} className="v2-sidebar-toggle">
              {sidebarOpen ? "◀" : "▶"}
            </button>
            <div style={{ flex: 1, position: "relative", minWidth: 200 }}>
              <input
                placeholder="Suche nach Name, PLZ, Ort, Netzbetreiber, Kunde..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px 9px 34px", fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box" }}
              />
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.dim }}>🔍</span>
            </div>

            {/* Aktive Filter-Chips */}
            {activeFilter && (() => {
              const s = SC[activeFilter];
              return (
                <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 20, background: `${s?.c || C.accent}12`, color: s?.c || C.accent, border: `1px solid ${s?.c || C.accent}25`, display: "flex", alignItems: "center", gap: 4 }}>
                  {s?.i} {s?.l}
                  <button onClick={() => setActiveFilter(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 13, padding: 0, marginLeft: 2 }}>x</button>
                </span>
              );
            })()}
            {selectedKunde && (
              <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 20, background: `${C.accent}12`, color: C.accent, border: `1px solid ${C.accent}25`, display: "flex", alignItems: "center", gap: 4 }}>
                {selectedKundeName}
                <button onClick={() => setSelectedKunde(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 13, padding: 0, marginLeft: 2 }}>x</button>
              </span>
            )}
            {(activeFilter || selectedKunde || searchQuery || sourceFilter !== "alle") && (
              <button onClick={() => { setActiveFilter(null); setSelectedKunde(null); setSearchQuery(""); setSourceFilter("alle"); }}
                style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Alle zurücksetzen</button>
            )}

            <span style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>
              {isLoading ? "..." : `${sorted.length} Ergebnisse`}
            </span>
          </div>

          {/* Tabelle */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ position: "sticky", top: 0, background: C.bg, zIndex: 2 }}>
                  {([
                    { key: "name", label: "Projekt" },
                    { key: "status", label: "Status" },
                    { key: "kwp", label: "kWp" },
                    { key: null, label: "Netzbetreiber" },
                    { key: "daysAtNb", label: "Tage" },
                    { key: "ort", label: "Ort" },
                    { key: null, label: "" },
                  ] as const).map((h, i) => (
                    <th key={i}
                      onClick={() => h.key && handleSort(h.key as any)}
                      style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: sortBy === h.key ? C.accent : C.dim, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "left", borderBottom: `1px solid ${C.border}`, cursor: h.key ? "pointer" : "default", userSelect: "none" }}>
                      {h.label} {sortBy === h.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ height: 16, background: "rgba(255,255,255,0.03)", borderRadius: 4, width: `${60 + Math.random() * 30}%` }} />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px 14px", textAlign: "center", color: C.dim }}>
                      Keine Ergebnisse gefunden
                    </td>
                  </tr>
                ) : sorted.map(item => {
                  const s = SC[item.status] || { l: item.status, c: C.dim, i: "•" };
                  const hovered = hoveredId === item.id;
                  return (
                    <tr
                      key={`${item.type}-${item.id}`}
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleRowClick(item)}
                      style={{
                        background: hovered ? "rgba(212,168,67,0.04)" : "transparent",
                        cursor: "pointer",
                        borderLeft: `3px solid ${item.type === "crm" ? C.accent + "40" : "transparent"}`,
                        transition: "background 0.1s",
                      }}
                    >
                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13 }}>{item.type === "crm" ? "📊" : "⚡"}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>
                              {item.kunde}
                              {item.rueckfrage && <span style={{ color: C.red, marginLeft: 6 }}>⚠ {item.rueckfrage}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: `${s.c}12`, color: s.c }}>{s.i} {s.l}</span>
                      </td>

                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: C.green }}>
                        {item.kwp > 0 ? item.kwp.toFixed(1) : "—"}
                      </td>

                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: item.nb ? C.muted : C.dim, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.nb || "—"}
                      </td>

                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                        {item.daysAtNb != null ? (
                          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: item.daysAtNb > 10 ? C.red : item.daysAtNb > 5 ? C.orange : C.muted }}>{item.daysAtNb}d</span>
                        ) : <span style={{ color: C.dim }}>—</span>}
                      </td>

                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.muted }}>{item.ort}</td>

                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                        {item.linked ? (
                          <LinkBadge item={item} allItems={sorted} onOpenLinked={(linkedItem) => {
                            setDetailItem(linkedItem);
                          }} />
                        ) : (
                          item.type === "crm" && !item.linked ? (
                            <span style={{ fontSize: 9, color: C.dim, fontStyle: "italic" }}>Keine NA</span>
                          ) : null
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ Sub-Komponenten ═══

function PipelineGroup({ label, color, items, activeFilter, onFilter }: {
  label: string; color: string;
  items: { key: string; label: string; count: number; color: string; sub?: string }[];
  activeFilter: string | null; onFilter: (k: string) => void;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color, textAlign: "center", marginBottom: 6, background: color + "08", borderRadius: 4, padding: "2px 0" }}>{label}</div>
      <div style={{ display: "flex", gap: 3 }}>
        {items.map(st => (
          <div key={st.key} onClick={() => onFilter(st.key)}
            style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 6, cursor: "pointer", background: activeFilter === st.key ? `${st.color}15` : `${st.color}05`, border: activeFilter === st.key ? `1px solid ${st.color}30` : "1px solid transparent", transition: "all 0.15s" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: st.color }}>{st.count}</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: st.color, letterSpacing: 0.3 }}>{st.label}</div>
            {st.sub && <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{st.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineArrow() {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "16px 2px 0" }}>
      <svg width="16" height="24" viewBox="0 0 16 24"><path d="M3 4 L11 12 L3 20" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" /></svg>
    </div>
  );
}

function SidebarBtn({ label, count, color, active, onClick, dot }: {
  label: string; count: number; color: string; active: boolean; onClick: () => void; dot?: boolean;
}) {
  return (
    <button onClick={onClick} style={{
      display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
      padding: "6px 8px", borderRadius: 5, border: "none", cursor: "pointer",
      background: active ? `${color}12` : "transparent",
      color: active ? color : C.muted, fontSize: 12, fontWeight: active ? 600 : 400,
      marginBottom: 1, textAlign: "left", transition: "all 0.1s",
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: dot ? `0 0 6px ${color}` : "none" }} />
        {label}
      </span>
      <span style={{ fontWeight: 700, fontSize: 12, fontFamily: "monospace" }}>{count}</span>
    </button>
  );
}

function LinkBadge({ item, allItems, onOpenLinked }: { item: TableItem; allItems: TableItem[]; onOpenLinked: (item: TableItem) => void }) {
  const [hover, setHover] = useState(false);

  // Finde das verknüpfte Item
  const linkedItem = useMemo(() => {
    if (item.type === "crm") {
      // CRM → suche Installation mit gleicher ID (negative CRM-ID → positive INST-ID)
      return allItems.find(i => i.type === "inst" && i._installationId === Math.abs(item.id));
    }
    // Installation → suche CRM-Projekt
    return allItems.find(i => i.type === "crm" && i.linked && Math.abs(i.id) === item._installationId);
  }, [item, allItems]);

  const badgeColor = item.type === "crm" ? C.blue : C.accent;
  const badgeIcon = item.type === "crm" ? "⚡" : "📊";
  const sc = linkedItem ? SC[linkedItem.status] : null;

  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span style={{
        fontSize: 9, fontWeight: 600, padding: "3px 10px", borderRadius: 10,
        background: `${badgeColor}12`, color: badgeColor, cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 3,
        border: hover ? `1px solid ${badgeColor}40` : "1px solid transparent",
        transition: "all 0.15s",
      }} onClick={(e) => { e.stopPropagation(); if (linkedItem) onOpenLinked(linkedItem); }}>
        {badgeIcon} {item.linkedId}
      </span>

      {/* Hover-Card */}
      {hover && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", right: 0, zIndex: 50,
          width: 280, background: "#111827", border: `1px solid ${badgeColor}30`,
          borderRadius: 10, padding: "12px 14px", boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${badgeColor}10`,
          pointerEvents: "auto",
        }}>
          {/* Pfeil */}
          <div style={{
            position: "absolute", bottom: -6, right: 20, width: 12, height: 12,
            background: "#111827", border: `1px solid ${badgeColor}30`,
            borderTop: "none", borderLeft: "none",
            transform: "rotate(45deg)",
          }} />

          {linkedItem ? (
            <>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{badgeIcon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: badgeColor, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {item.type === "crm" ? "Verknüpfte Netzanmeldung" : "Verknüpftes CRM-Projekt"}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 1 }}>{item.linkedId}</div>
                </div>
                {sc && (
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: `${sc.c}15`, color: sc.c }}>
                    {sc.i} {sc.l}
                  </span>
                )}
              </div>

              {/* Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 11 }}>
                <div style={{ color: C.dim }}>Kunde</div>
                <div style={{ color: C.text, fontWeight: 500 }}>{linkedItem.name}</div>

                {linkedItem.nb && <>
                  <div style={{ color: C.dim }}>Netzbetreiber</div>
                  <div style={{ color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{linkedItem.nb}</div>
                </>}

                {linkedItem.kwp > 0 && <>
                  <div style={{ color: C.dim }}>Leistung</div>
                  <div style={{ color: C.green, fontWeight: 600, fontFamily: "monospace" }}>{linkedItem.kwp.toFixed(1)} kWp</div>
                </>}

                {linkedItem.daysAtNb != null && <>
                  <div style={{ color: C.dim }}>Beim NB seit</div>
                  <div style={{ color: linkedItem.daysAtNb > 10 ? C.red : linkedItem.daysAtNb > 5 ? C.orange : C.text, fontWeight: 600 }}>{linkedItem.daysAtNb} Tage</div>
                </>}

                {linkedItem.ort && <>
                  <div style={{ color: C.dim }}>Standort</div>
                  <div style={{ color: C.text }}>{linkedItem.ort}</div>
                </>}
              </div>

              {/* Action */}
              <button onClick={(e) => { e.stopPropagation(); onOpenLinked(linkedItem); }} style={{
                width: "100%", marginTop: 10, padding: "6px", borderRadius: 6,
                background: `${badgeColor}15`, border: `1px solid ${badgeColor}25`,
                color: badgeColor, fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}>
                → {item.type === "crm" ? "Installation" : "CRM-Projekt"} öffnen
              </button>
            </>
          ) : (
            // Kein Match in aktueller Liste (z.B. weil gefiltert)
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>
                {item.type === "crm" ? "Verknüpfte Netzanmeldung" : "Verknüpftes CRM-Projekt"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: badgeColor }}>{item.linkedId}</div>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>Klicken zum Öffnen</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KundenPicker({ kundenList, selectedKunde, selectedKundeName, onSelect }: {
  kundenList: { id: number; name: string; count: number }[];
  selectedKunde: number | null;
  selectedKundeName: string | null | undefined;
  onSelect: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = q
    ? kundenList.filter(k => k.name.toLowerCase().includes(q.toLowerCase())).slice(0, 7)
    : kundenList.slice(0, 7);

  // Ausgewählter Kunde → als Chip anzeigen
  if (selectedKunde && !open) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Kunde</div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 10px", borderRadius: 6, background: `${C.accent}10`,
          border: `1px solid ${C.accent}30`,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            🏢 {selectedKundeName}
          </span>
          <button onClick={() => onSelect(null)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 14, padding: "0 0 0 8px", flexShrink: 0 }}>×</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12, position: "relative" }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Kunde</div>
      <input
        placeholder="🔍 Kunde suchen..."
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        style={{
          width: "100%", background: "rgba(255,255,255,0.03)", border: `1px solid ${open ? C.accent + "40" : C.border}`,
          borderRadius: 6, padding: "8px 10px", fontSize: 12, color: C.text, outline: "none", boxSizing: "border-box",
        }}
      />
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => { setOpen(false); setQ(""); }} />
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 11,
            background: "#111827", border: `1px solid ${C.accent}25`, borderRadius: 8,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden",
          }}>
            {/* "Alle" Option */}
            <button onClick={() => { onSelect(null); setOpen(false); setQ(""); }} style={{
              display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
              padding: "8px 12px", border: "none", cursor: "pointer", textAlign: "left",
              background: !selectedKunde ? `${C.accent}10` : "transparent",
              color: !selectedKunde ? C.accent : C.muted, fontSize: 12, borderBottom: `1px solid ${C.border}`,
            }}>
              <span>Alle Kunden</span>
              <span style={{ fontFamily: "monospace", fontSize: 11 }}>{kundenList.reduce((s, k) => s + k.count, 0)}</span>
            </button>

            {filtered.length === 0 && (
              <div style={{ padding: "12px", textAlign: "center", color: C.dim, fontSize: 11 }}>Kein Kunde gefunden</div>
            )}

            {filtered.map(k => (
              <button key={k.id} onClick={() => { onSelect(k.id); setOpen(false); setQ(""); }} style={{
                display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", border: "none", cursor: "pointer", textAlign: "left",
                background: selectedKunde === k.id ? `${C.accent}10` : "transparent",
                color: selectedKunde === k.id ? C.accent : C.text, fontSize: 12,
                borderBottom: `1px solid ${C.border}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = `${C.accent}08`}
                onMouseLeave={e => e.currentTarget.style.background = selectedKunde === k.id ? `${C.accent}10` : "transparent"}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.name}</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: C.dim, flexShrink: 0, marginLeft: 8 }}>{k.count}</span>
              </button>
            ))}

            {kundenList.length > 7 && !q && (
              <div style={{ padding: "6px 12px", fontSize: 10, color: C.dim, textAlign: "center" }}>Tippen zum Filtern... ({kundenList.length} Kunden)</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
