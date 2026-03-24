/**
 * NETZANMELDUNGEN V3 — Dashboard + Activity Cards + Animated Pipeline
 * ====================================================================
 * Produktionsreife Version. Ersetzt V2 wenn live geschaltet.
 */
import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "./hooks/useEnterpriseApi";
import { useAuth } from "../../pages/AuthContext";
import { CSS_INJECT } from "../crm-center/crm.styles";
import CrmDetailPanel from "./components/detail/CrmDetailPanel";

// V3 Sub-Components
import { V3_CSS, SC } from "./v3/constants";
import type { ViewKey, V3Mode, SourceFilter, UnifiedItem } from "./v3/types";
import { useUnifiedItems } from "./v3/hooks/useUnifiedItems";
import AnimatedPipeline from "./v3/components/AnimatedPipeline";
import AdminDashboard from "./v3/components/AdminDashboard";
import ActivityCard from "./v3/components/ActivityCard";
import SmartSidebar from "./v3/components/SmartSidebar";
import DraftApprovalPanel from "./v3/components/DraftApprovalPanel";

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function NetzanmeldungenV3() {
  const { user } = useAuth();
  const userRole = ((user as any)?.role || "").toUpperCase();
  const isStaff = userRole === "ADMIN" || userRole === "MITARBEITER";

  // State
  const [mode, setMode] = useState<V3Mode>(isStaff ? "dashboard" : "list");
  const [view, setView] = useState<ViewKey>("open");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedKunde, setSelectedKunde] = useState<number | null>(null);
  const [compact, setCompact] = useState(false);
  const [sortBy, setSortBy] = useState("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("alle");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Draft Approval
  const [draftItem, setDraftItem] = useState<UnifiedItem | null>(null);

  // Detail Panel
  const [detailItem, setDetailItem] = useState<UnifiedItem | null>(null);
  const params = useParams<{ id?: string }>();

  // Data
  const { items, pipelineCounts, kundenList, isLoading, stats } = useUnifiedItems({
    view,
    activeFilter,
    search,
    selectedKunde,
    sourceFilter,
    isStaff,
    sortBy,
    sortDir,
  });

  // Deep-Link: /netzanmeldungen/:id (nach items geladen)
  useEffect(() => {
    if (!params.id || isLoading) return;
    if (detailItem) return; // bereits offen

    const isPublicId = params.id.startsWith("INST-") || params.id.startsWith("GN") || params.id.startsWith("CRM-");
    if (isPublicId) {
      const found = items.find(i => i.publicId === params.id);
      if (found) setDetailItem(found);
    } else {
      const numId = Number(params.id);
      if (numId > 0) {
        // Versuche in Items zu finden, sonst direkt öffnen
        const found = items.find(i => i.id === numId && !i._isCrm);
        setDetailItem(found || { id: numId, _isCrm: false, _installationId: numId } as any);
      }
    }
  }, [params.id, isLoading]);

  // CustomEvent-Listener (für VerknuepfungCard etc.)
  useEffect(() => {
    const handleOpenInstallation = (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      if (id) setDetailItem({ id, _isCrm: false, _installationId: id } as any);
    };
    const handleOpenCrm = (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      if (id) setDetailItem({ id: -id, _isCrm: true, _crmId: id } as any);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && detailItem) {
        setDetailItem(null);
      }
    };
    window.addEventListener("open-installation", handleOpenInstallation);
    window.addEventListener("open-crm-projekt", handleOpenCrm);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("open-installation", handleOpenInstallation);
      window.removeEventListener("open-crm-projekt", handleOpenCrm);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailItem]);

  // Handlers
  const handlePipelineFilter = useCallback((key: string) => {
    setActiveFilter(prev => prev === key ? null : key);
    setView("all");
    setMode("list");
  }, []);

  const handleViewChange = useCallback((v: ViewKey) => {
    setView(v);
    setActiveFilter(null);
  }, []);

  const v3Navigate = useNavigate();
  const handleRowClick = useCallback((item: UnifiedItem) => {
    if ((item as any)._isLead) {
      setDetailItem(item);
      return;
    }
    if (item._isCrm) {
      v3Navigate(`/netzanmeldungen/crm-${item._crmId || Math.abs(item.id)}`);
    } else {
      v3Navigate(`/netzanmeldungen/${item._installationId || item.id}`);
    }
  }, [v3Navigate]);

  const handleDrillDown = useCallback((v: ViewKey) => {
    setView(v);
    setActiveFilter(null);
    setMode("list");
  }, []);

  const handleResetAll = useCallback(() => {
    setActiveFilter(null);
    setSelectedKunde(null);
    setSearch("");
    setSourceFilter("alle");
    setView("open");
  }, []);

  const hasActiveFilters = !!(activeFilter || selectedKunde || search || sourceFilter !== "alle" || view !== "open");
  const selectedKundeName = selectedKunde ? kundenList.find(k => k.id === selectedKunde)?.name : null;

  // Detail Panel
  if (detailItem) {
    // Lead Detail Panel
    if ((detailItem as any)._isLead) {
      return <LeadDetailPanel item={detailItem} onClose={() => setDetailItem(null)} />;
    }
    const panelMode = detailItem._isCrm ? "crm" : "installation";
    const panelItem = detailItem._isCrm
      ? { id: detailItem.id, _crmId: detailItem._crmId || Math.abs(detailItem.id) }
      : { id: detailItem.id, _installationId: detailItem._installationId || detailItem.id };
    return <CrmDetailPanel item={panelItem} onClose={() => setDetailItem(null)} mode={panelMode} />;
  }

  // ═══════════════════════════════════════════════════════════════════
  // KUNDEN / HV / SUB — Eigene Ansicht (nicht Staff)
  // ═══════════════════════════════════════════════════════════════════
  const isKunde = userRole === "KUNDE" || userRole === "KUNDE_MITARBEITER";
  const isHV = userRole === "HANDELSVERTRETER";
  const isSub = userRole === "SUBUNTERNEHMER";

  if (!isStaff) {
    const STATUS_PIPELINE = [
      { key: "eingang", label: "Eingang", icon: "📥", color: "#22c55e" },
      { key: "beim_nb", label: "Beim Netzbetreiber", icon: "📨", color: "#3b82f6" },
      { key: "rueckfrage", label: "Rückfrage", icon: "❓", color: "#ef4444" },
      { key: "genehmigt", label: "Genehmigt", icon: "✅", color: "#22c55e" },
      { key: "ibn", label: "Inbetriebnahme", icon: "⚡", color: "#f0d878" },
      { key: "fertig", label: "Abgeschlossen", icon: "🏁", color: "#64748b" },
    ];

    // Items nach Status gruppieren
    const grouped: Record<string, typeof items> = {};
    items.forEach(item => {
      const key = item.status || "sonstige";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    const totalOpen = (grouped.eingang?.length || 0) + (grouped.beim_nb?.length || 0) + (grouped.rueckfrage?.length || 0);
    const totalDone = (grouped.genehmigt?.length || 0) + (grouped.ibn?.length || 0) + (grouped.fertig?.length || 0);

    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "'Inter','DM Sans', sans-serif" }}>
        <style dangerouslySetInnerHTML={{ __html: CSS_INJECT + V3_CSS }} />

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(212,168,67,0.08)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>
            {isHV ? "Meine Leads" : isSub ? "Meine Leads" : "Sales Pipeline"}
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            {isLoading ? "Laden..." : `${items.length} Projekte · ${totalOpen} offen · ${totalDone} abgeschlossen`}
          </div>
        </div>

        {/* Mini-Pipeline KPIs */}
        <div style={{ display: "flex", gap: 6, padding: "16px 24px", overflowX: "auto" }}>
          {STATUS_PIPELINE.map(s => {
            const count = grouped[s.key]?.length || 0;
            return (
              <div key={s.key} onClick={() => setActiveFilter(activeFilter === s.key ? null : s.key)}
                style={{
                  flex: "1 0 auto", minWidth: 100, padding: "12px 14px", borderRadius: 10,
                  background: activeFilter === s.key ? `${s.color}15` : "rgba(15,15,25,0.8)",
                  border: `1px solid ${activeFilter === s.key ? s.color + "30" : "rgba(212,168,67,0.06)"}`,
                  cursor: "pointer", transition: "all .15s", textAlign: "center",
                }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: count > 0 ? s.color : "#334155" }}>{count}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Suche */}
        <div style={{ padding: "0 24px 12px" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#64748b" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Suche nach Name, Ort, Netzbetreiber..."
              style={{ width: "100%", background: "rgba(15,15,25,0.9)", border: "1px solid rgba(212,168,67,0.08)", borderRadius: 10, padding: "10px 14px 10px 36px", color: "#e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* Projekte nach Status */}
        <div style={{ padding: "0 24px 24px" }}>
          {isLoading && <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Laden...</div>}

          {!isLoading && STATUS_PIPELINE.filter(s => {
            if (activeFilter) return s.key === activeFilter;
            return (grouped[s.key]?.length || 0) > 0;
          }).map(s => {
            const groupItems = grouped[s.key] || [];
            if (groupItems.length === 0) return null;
            return (
              <div key={s.key} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 3, height: 18, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.icon} {s.label}</span>
                  <span style={{ fontSize: 11, color: "#475569", background: "rgba(100,116,139,0.08)", padding: "2px 10px", borderRadius: 12 }}>{groupItems.length}</span>
                </div>
                {groupItems.map(item => (
                  <ActivityCard key={`${item.source}-${item.id}`} item={item} compact={false} onClick={handleRowClick} onDraftClick={setDraftItem} />
                ))}
              </div>
            );
          })}

          {!isLoading && items.length === 0 && (
            <div style={{ textAlign: "center", padding: 50, color: "#64748b" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8" }}>Keine Projekte vorhanden</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                {isKunde ? "Starten Sie mit einem neuen Lead." : "Noch keine Leads vorhanden."}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN / MITARBEITER — Volle Ansicht
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_INJECT + V3_CSS }} />

      {/* ═══ HEADER ═══ */}
      <div className="v3-header" style={{ padding: "16px 24px", borderBottom: "1px solid rgba(212,168,67,0.08)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.5 }}>Sales Pipeline</div>

        {/* Dashboard / Liste Toggle (nur Staff) */}
        {isStaff && (
          <div style={{ display: "flex", gap: 2, background: "rgba(12,12,20,0.7)", borderRadius: 8, padding: 3, border: "1px solid rgba(212,168,67,0.08)" }}>
            {([["dashboard", "Dashboard"], ["list", "Projekte"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setMode(k as V3Mode)} style={{
                padding: "8px 18px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: mode === k ? "rgba(212,168,67,0.15)" : "transparent", color: mode === k ? "#a5b4fc" : "#64748b",
                fontFamily: "inherit", transition: "all .15s",
              }}>{l}</button>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Suche — immer sichtbar, groß */}
        <div className="v3-search" style={{ position: "relative", width: 400 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#64748b" }}>🔍</span>
          <input value={search} onChange={e => { setSearch(e.target.value); if (e.target.value && mode === "dashboard") { setMode("list"); setView("all"); } }}
            placeholder="Suche nach Name, PLZ, Ort, Kunde, Netzbetreiber..."
            style={{ width: "100%", background: "rgba(15,15,25,0.9)", border: `1px solid ${search ? "rgba(212,168,67,0.3)" : "rgba(212,168,67,0.1)"}`, borderRadius: 10, padding: "11px 40px 11px 40px", color: "#e2e8f0", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color .15s" }} />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>✕</button>
          )}
        </div>

        {/* Kompakt/Karten Toggle + Sort */}
        {mode === "list" && (
          <div className="v3-header-controls" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 2, background: "rgba(12,12,20,0.7)", borderRadius: 8, padding: 3, border: "1px solid rgba(212,168,67,0.08)" }}>
              {([["cards", "Karten"], ["compact", "Kompakt"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setCompact(k === "compact")} style={{
                  padding: "8px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: (k === "compact") === compact ? "rgba(212,168,67,0.15)" : "transparent",
                  color: (k === "compact") === compact ? "#a5b4fc" : "#64748b", fontFamily: "inherit", transition: "all .15s",
                }}>{l}</button>
              ))}
            </div>

            {/* Sort */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                background: "rgba(15,15,25,0.9)", border: "1px solid rgba(212,168,67,0.1)", borderRadius: 8, padding: "8px 14px", color: "#a5b4fc", fontSize: 13, outline: "none", fontFamily: "inherit", cursor: "pointer",
              }}>
                <option value="status">Status</option>
                <option value="name">Name</option>
                <option value="daysAtNb">Tage beim NB</option>
                <option value="kwp">kWp</option>
                <option value="ort">Ort</option>
              </select>
              <button onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")} style={{
                background: "rgba(15,15,25,0.9)", border: "1px solid rgba(212,168,67,0.1)", borderRadius: 8,
                padding: "8px 12px", cursor: "pointer", color: "#a5b4fc", fontSize: 14, fontFamily: "inherit",
              }}>{sortDir === "asc" ? "↑" : "↓"}</button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ DASHBOARD MODE ═══ */}
      {mode === "dashboard" && <AdminDashboard onDrillDown={handleDrillDown} onPipelineFilter={handlePipelineFilter} pipelineCounts={pipelineCounts} isStaff={isStaff} />}

      {/* ═══ LIST MODE ═══ */}
      {mode === "list" && <>
        {/* Pipeline */}
        <div className="v3-pipeline-wrap">
          <div className="v3-pipeline-inner">
            <AnimatedPipeline counts={pipelineCounts} activeFilter={activeFilter} onFilter={handlePipelineFilter} isStaff={isStaff} />
          </div>
        </div>

        {/* Filter-Chips */}
        {hasActiveFilters && (
          <div style={{ padding: "0 24px 8px", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {activeFilter && (() => {
              const sc = SC[activeFilter];
              return (
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 16, background: `${sc?.c || "#D4A843"}12`, color: sc?.c || "#D4A843", border: `1px solid ${sc?.c || "#D4A843"}20`, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {sc?.i} {sc?.l || activeFilter}
                  <button onClick={() => setActiveFilter(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 12, padding: 0, marginLeft: 2, lineHeight: 1 }}>×</button>
                </span>
              );
            })()}
            {selectedKunde && (
              <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 16, background: "rgba(212,168,67,0.08)", color: "#a5b4fc", border: "1px solid rgba(212,168,67,0.15)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                🏢 {selectedKundeName}
                <button onClick={() => setSelectedKunde(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 12, padding: 0, marginLeft: 2, lineHeight: 1 }}>×</button>
              </span>
            )}
            {search && (
              <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 16, background: "rgba(212,168,67,0.08)", color: "#a5b4fc", border: "1px solid rgba(212,168,67,0.15)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                🔍 "{search}"
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 12, padding: 0, marginLeft: 2, lineHeight: 1 }}>×</button>
              </span>
            )}
            <button onClick={handleResetAll} style={{
              background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 10, fontWeight: 600, padding: "2px 6px",
            }}>Alle zurücksetzen</button>
          </div>
        )}

        {/* Mobile/Tablet Sidebar: View-Tabs */}
        <div className="v3-sidebar-mobile" style={{ display: "none", padding: "0 20px 10px", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {[
            { key: "inbox" as ViewKey, icon: "🔥", label: "Handlungsbedarf" },
            { key: "open" as ViewKey, icon: "📋", label: "Alle offenen" },
            { key: "nb" as ViewKey, icon: "🏢", label: "Beim NB" },
            { key: "done" as ViewKey, icon: "📦", label: "Archiv" },
            { key: "all" as ViewKey, icon: "📊", label: "Alle" },
          ].map(v => (
            <button key={v.key} onClick={() => handleViewChange(v.key)} style={{
              padding: "9px 18px", borderRadius: 24, border: `1px solid ${view === v.key ? "rgba(212,168,67,0.2)" : "rgba(255,255,255,0.05)"}`,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: view === v.key ? "rgba(212,168,67,0.15)" : "rgba(255,255,255,0.03)",
              color: view === v.key ? "#a5b4fc" : "#64748b", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
              transition: "all .15s",
            }}>{v.icon} {v.label}</button>
          ))}
        </div>

        {/* Main Layout */}
        <div className="v3-main-layout" style={{ display: "flex", padding: "0 24px 24px", gap: 16 }}>
          {/* Sidebar */}
          <div className="v3-sidebar">
            <SmartSidebar
              view={view} onViewChange={handleViewChange}
              sourceFilter={sourceFilter} onSourceChange={setSourceFilter}
              counts={pipelineCounts} isStaff={isStaff}
              kundenList={kundenList}
              selectedKunde={selectedKunde} onKundeChange={setSelectedKunde}
              collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)}
            />
          </div>

          {/* Items */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                {isLoading ? "Laden..." : `${items.length} Projekte`}
              </div>
            </div>

            {/* Loading Skeleton */}
            {isLoading && items.length === 0 && (
              [65, 78, 55, 72, 60, 68].map((w, i) => (
                <div key={i} style={{
                  background: "rgba(17,20,35,0.95)", border: "1px solid rgba(212,168,67,0.08)",
                  borderRadius: 10, padding: "14px 18px", marginBottom: 8,
                  animation: "slideUp .3s ease both", animationDelay: `${i * 60}ms`,
                }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 18, borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
                    <div style={{ width: 60, height: 18, borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
                  </div>
                  <div style={{ width: `${w}%`, height: 14, borderRadius: 4, background: "rgba(255,255,255,0.03)", marginBottom: 6 }} />
                  <div style={{ width: `${w - 20}%`, height: 10, borderRadius: 4, background: "rgba(255,255,255,0.02)" }} />
                </div>
              ))
            )}

            {!isLoading && (() => {
              // Status-Gruppierung immer wenn nach Status sortiert
              if (sortBy === "status") {
                const groups: Record<string, typeof items> = {};
                const ORDER = ["lead_neu", "lead_kontaktiert", "lead_qualifiziert", "rueckfrage", "beim_nb", "eingang", "genehmigt", "ibn", "fertig", "storniert", "lead_konvertiert", "lead_abgelehnt"];
                items.forEach(item => {
                  const key = item.status || "sonstige";
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(item);
                });
                return ORDER.filter(k => groups[k]?.length).map(statusKey => {
                  const groupItems = groups[statusKey];
                  const sc2 = SC[statusKey] || { l: statusKey, c: "#64748b", i: "📋" };
                  return (
                    <div key={statusKey} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "4px 0" }}>
                        <div style={{ width: 3, height: 16, borderRadius: 2, background: sc2.c }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: sc2.c }}>{sc2.i} {sc2.l}</span>
                        <span style={{ fontSize: 11, color: "#475569", background: "rgba(100,116,139,0.08)", padding: "2px 8px", borderRadius: 10 }}>{groupItems.length}</span>
                      </div>
                      {groupItems.map(item => (
                        <ActivityCard key={`${item.source}-${item.id}`} item={item} compact={compact} onClick={handleRowClick} onDraftClick={setDraftItem} />
                      ))}
                    </div>
                  );
                });
              }
              // Ohne Gruppierung
              return items.map(item => (
                <ActivityCard key={`${item.source}-${item.id}`} item={item} compact={compact} onClick={handleRowClick} onDraftClick={setDraftItem} />
              ));
            })()}

            {!isLoading && items.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 14 }}>Keine Projekte in dieser Ansicht</div>
                {hasActiveFilters && (
                  <button onClick={handleResetAll} style={{
                    marginTop: 12, background: "rgba(212,168,67,0.1)", color: "#a5b4fc",
                    border: "1px solid rgba(212,168,67,0.2)", borderRadius: 6, padding: "8px 16px",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}>Filter zurücksetzen</button>
                )}
              </div>
            )}
          </div>
        </div>
      </>}

      {/* Draft Approval Modal */}
      {draftItem && draftItem._installationId && (
        <DraftApprovalPanel
          installationId={draftItem._installationId}
          publicId={draftItem.publicId}
          customerName={draftItem.name}
          onClose={() => setDraftItem(null)}
          onApproved={() => { setDraftItem(null); window.location.reload(); }}
        />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// LEAD DETAIL PANEL — mit echten Aktionen
// ═══════════════════════════════════════════════════════════════════════════

const LEAD_STATUSES = [
  { key: "neu", label: "Neu", color: "#a855f7", icon: "🌟" },
  { key: "kontaktiert", label: "Kontaktiert", color: "#06b6d4", icon: "📞" },
  { key: "qualifiziert", label: "Qualifiziert", color: "#22c55e", icon: "✅" },
  { key: "konvertiert", label: "Konvertiert", color: "#22c55e", icon: "🎉" },
  { key: "abgelehnt", label: "Abgelehnt", color: "#64748b", icon: "🚫" },
];

const HAUSART_MAP: Record<string, string> = {
  efh: "Ein-/Zweifamilienhaus", mfh: "Mehrfamilienhaus",
  gewerbe: "Firmengebäude", sonstiges: "Sonstiges",
};
const DACH_MAP: Record<string, string> = {
  satteldach: "Satteldach", flachdach: "Flachdach",
  pultdach: "Pultdach", sonstiges_dach: "Sonstiges Dach",
};

const SCREEN_PROTECT_CSS = `
  .screen-protect{user-select:none!important;-webkit-user-select:none!important}
  .screen-protect *{user-select:none!important;-webkit-user-select:none!important}
  .screen-protect img{pointer-events:none!important}
  @media print{.screen-protect{display:none!important}.print-block{display:flex!important}}
  .print-block{display:none;position:fixed;inset:0;background:#0a0a0f;z-index:99999;align-items:center;justify-content:center;color:#ef4444;font-size:24px;font-weight:800}
  .screen-protect-watermark{position:fixed;inset:0;z-index:9998;pointer-events:none;
    background:repeating-linear-gradient(135deg,transparent,transparent 200px,rgba(255,255,255,0.012) 200px,rgba(255,255,255,0.012) 201px);
    display:flex;align-items:center;justify-content:center;overflow:hidden}
  .screen-protect-watermark::after{content:attr(data-user);font-size:60px;font-weight:900;color:rgba(255,255,255,0.03);
    transform:rotate(-35deg);white-space:nowrap;pointer-events:none;letter-spacing:20px}
  .blur-on-leave .screen-protect{filter:blur(20px)!important;transition:filter .15s}
`;

function LeadDetailPanel({ item, onClose }: { item: UnifiedItem; onClose: () => void }) {
  const leadId = (item as any)._leadId;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const authRole = ((authUser as any)?.role || "").toUpperCase();
  const isHv = ["HV_LEITER", "HV_TEAMLEITER", "HANDELSVERTRETER"].includes(authRole);
  const [blurred, setBlurred] = useState(false);

  // Blur on tab switch / focus loss (screenshot attempt)
  useEffect(() => {
    if (!isHv) return;
    const onBlur = () => setBlurred(true);
    const onFocus = () => setBlurred(false);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    // Block right-click
    const onCtx = (e: MouseEvent) => { e.preventDefault(); };
    document.addEventListener("contextmenu", onCtx);
    // Block keyboard shortcuts (PrintScreen, Ctrl+P, Ctrl+C, Ctrl+Shift+S)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && e.key === "p") || (e.ctrlKey && e.key === "c") || (e.ctrlKey && e.shiftKey && e.key === "s")) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("keydown", onKey);
    };
  }, [isHv]);

  const { data: leadData, refetch } = useQuery<{ data: any }>({
    queryKey: ["wizard-lead", leadId],
    queryFn: () => fetchApi(`/api/wizard/leads/${leadId}`),
    enabled: !!leadId,
  });

  const lead = leadData?.data;
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [converting, setConverting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Sync notes from lead data
  useEffect(() => {
    if (lead?.notes && !notes) setNotes(lead.notes);
  }, [lead?.notes]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    setError("");
    try {
      await fetchApi(`/api/wizard/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      queryClient.invalidateQueries({ queryKey: ["wizard-lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["wizard-leads"] });
      await refetch();
    } catch (e: any) {
      setError(e.message || "Fehler beim Aktualisieren");
    }
    setUpdating(false);
  };

  const saveNotes = async () => {
    setError("");
    try {
      await fetchApi(`/api/wizard/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (e: any) {
      setError(e.message || "Fehler beim Speichern");
    }
  };

  const convertToProject = async () => {
    setConverting(true);
    setError("");
    try {
      const res = await fetchApi<{ success: boolean; installationId?: number }>(`/api/wizard/leads/${leadId}/convert`, {
        method: "POST",
      });
      if (res.installationId) {
        setConvertSuccess(res.installationId);
        queryClient.invalidateQueries({ queryKey: ["wizard-leads"] });
        queryClient.invalidateQueries({ queryKey: ["installations"] });
      }
    } catch (e: any) {
      setError(e.message || "Fehler bei der Konvertierung");
    }
    setConverting(false);
  };

  const deleteLead = async () => {
    setDeleting(true);
    setError("");
    try {
      await fetchApi(`/api/wizard/leads/${leadId}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["wizard-leads"] });
      onClose();
    } catch (e: any) {
      setError(e.message || "Fehler beim Löschen");
      setDeleting(false);
    }
  };

  const currentStatus = lead?.status || "neu";
  const isConvertible = !["konvertiert", "abgelehnt"].includes(currentStatus);

  const cardBg = "rgba(17,20,35,0.95)";
  const borderColor = "rgba(212,168,67,0.08)";
  const actionBtn = (bg: string, border: string, color: string): React.CSSProperties => ({
    padding: "12px 22px", borderRadius: 10, background: bg, border: `1px solid ${border}`,
    color, textDecoration: "none", fontSize: 13, fontWeight: 700, display: "inline-flex",
    alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
  });

  // Success: Lead wurde konvertiert → Link zur Installation
  if (convertSuccess) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center" }}>
        <div style={{ fontSize: 56 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Lead konvertiert!</div>
        <div style={{ fontSize: 14, color: "#94a3b8", maxWidth: 360 }}>
          {lead?.name} wurde als Projekt INST-{convertSuccess} angelegt.
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={() => navigate(`/netzanmeldungen/${convertSuccess}`)}
            style={actionBtn("rgba(34,197,94,0.15)", "rgba(34,197,94,0.3)", "#22c55e")}>
            📋 Zum Projekt
          </button>
          <button onClick={onClose}
            style={actionBtn("rgba(255,255,255,0.04)", borderColor, "#94a3b8")}>
            ← Zurück zur Liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={blurred ? "blur-on-leave" : ""} style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_INJECT + V3_CSS + (isHv ? SCREEN_PROTECT_CSS : "") }} />

      {/* Print-Blocker */}
      {isHv && <div className="print-block">Drucken ist nicht erlaubt</div>}
      {/* Watermark */}
      {isHv && <div className="screen-protect-watermark" data-user={(authUser as any)?.email || "HV"} />}

      {/* Header */}
      <div className={isHv ? "screen-protect" : ""} style={{ padding: "16px 24px", borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.04)", border: `1px solid ${borderColor}`,
          borderRadius: 8, padding: "8px 14px", color: "#94a3b8", cursor: "pointer",
          fontSize: 13, fontWeight: 600, fontFamily: "inherit",
        }}>← Zurück</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            🌟 {lead?.name || item.name || "Lead"}
            <span style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 16, fontWeight: 700,
              background: (LEAD_STATUSES.find(s => s.key === currentStatus)?.color || "#a855f7") + "18",
              color: LEAD_STATUSES.find(s => s.key === currentStatus)?.color || "#a855f7",
            }}>
              {LEAD_STATUSES.find(s => s.key === currentStatus)?.icon} {LEAD_STATUSES.find(s => s.key === currentStatus)?.label || currentStatus}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
            {item.publicId} · eingegangen {lead?.timestamp ? new Date(lead.timestamp).toLocaleString("de-DE") : ""}
            {lead?.signatureStatus === "signed" && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(34,197,94,0.12)", color: "#22c55e", fontWeight: 700 }}>
                ✅ Unterschrieben
              </span>
            )}
            {lead?.signatureStatus === "sent" && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(245,158,11,0.12)", color: "#f59e0b", fontWeight: 700 }}>
                ✉️ Warte auf Unterschrift
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ margin: "12px 24px 0", padding: "10px 16px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      <div className={isHv ? "screen-protect" : ""} style={{ padding: "20px 24px", maxWidth: 960 }}>

        {/* ═══ AKTIONEN — das Wichtigste oben ═══ */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          {lead?.email && (
            <a href={`mailto:${lead.email}?subject=Ihre PV-Anfrage bei SolarBrain&body=Hallo ${lead.name},%0A%0Avielen Dank für Ihre Anfrage über unseren PV-Konfigurator.%0A%0A`}
              onClick={() => { if (currentStatus === "neu") updateStatus("kontaktiert"); }}
              style={actionBtn("rgba(34,197,94,0.12)", "rgba(34,197,94,0.25)", "#22c55e")}>
              📧 E-Mail schreiben
            </a>
          )}
          {lead?.phone && (
            <a href={`tel:${lead.phone}`}
              onClick={() => { if (currentStatus === "neu") updateStatus("kontaktiert"); }}
              style={actionBtn("rgba(6,182,212,0.12)", "rgba(6,182,212,0.25)", "#06b6d4")}>
              📞 Anrufen {lead.phone}
            </a>
          )}
          {isConvertible && (
            <button onClick={convertToProject} disabled={converting}
              style={actionBtn("rgba(212,168,67,0.12)", "rgba(212,168,67,0.25)", "#D4A843")}>
              {converting ? "⏳ Wird angelegt..." : "🚀 Als Projekt anlegen"}
            </button>
          )}
          <button onClick={() => setShowDeleteConfirm(true)}
            style={actionBtn("rgba(239,68,68,0.06)", "rgba(239,68,68,0.15)", "#ef4444")}>
            🗑 Löschen
          </button>
        </div>

        {/* ═══ DROPBOX SIGN STATUS ═══ */}
        {lead?.signatureRequestId && (
          <div style={{
            marginBottom: 16, padding: "14px 18px", borderRadius: 12,
            background: lead.signatureStatus === "signed" ? "rgba(34,197,94,0.06)" : "rgba(245,158,11,0.06)",
            border: `1px solid ${lead.signatureStatus === "signed" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)"}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              background: lead.signatureStatus === "signed" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
              fontSize: 18,
            }}>
              {lead.signatureStatus === "signed" ? "✅" : "✉️"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: lead.signatureStatus === "signed" ? "#22c55e" : "#f59e0b" }}>
                {lead.signatureStatus === "signed" ? "Digital unterschrieben" : "Unterschrift ausstehend"}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {lead.signatureStatus === "signed" && lead.signedAt
                  ? `Unterschrieben am ${new Date(lead.signedAt).toLocaleString("de-DE")}`
                  : "Dropbox Sign Email wurde an den Kunden gesendet"
                }
              </div>
            </div>
            {lead.signatureStatus === "signed" && lead.signatureRequestId && (
              <a href={`/api/esignature/download/${lead.signatureRequestId}`} target="_blank" rel="noopener"
                style={{ ...actionBtn("rgba(34,197,94,0.1)", "rgba(34,197,94,0.2)", "#22c55e"), padding: "8px 14px", fontSize: 12, textDecoration: "none" }}>
                📥 Signiertes PDF
              </a>
            )}
          </div>
        )}

        {/* Delete Confirm */}
        {showDeleteConfirm && (
          <div style={{ marginBottom: 16, padding: "14px 18px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#f87171" }}>Lead "{lead?.name}" wirklich löschen?</span>
            <button onClick={deleteLead} disabled={deleting}
              style={{ ...actionBtn("rgba(239,68,68,0.2)", "rgba(239,68,68,0.3)", "#ef4444"), padding: "8px 16px", fontSize: 12 }}>
              {deleting ? "..." : "Ja, löschen"}
            </button>
            <button onClick={() => setShowDeleteConfirm(false)}
              style={{ ...actionBtn("rgba(255,255,255,0.04)", borderColor, "#94a3b8"), padding: "8px 16px", fontSize: 12 }}>
              Abbrechen
            </button>
          </div>
        )}

        {/* ═══ STATUS WORKFLOW ═══ */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Status</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {LEAD_STATUSES.map((s, i) => {
              const isActive = currentStatus === s.key;
              const isPast = LEAD_STATUSES.findIndex(st => st.key === currentStatus) > i;
              return (
                <button key={s.key} onClick={() => updateStatus(s.key)} disabled={updating}
                  style={{
                    padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                    border: `1.5px solid ${isActive ? s.color + "60" : isPast ? s.color + "25" : "rgba(255,255,255,0.04)"}`,
                    background: isActive ? s.color + "18" : isPast ? s.color + "08" : "rgba(15,15,25,0.6)",
                    color: isActive ? s.color : isPast ? s.color + "90" : "#475569",
                    cursor: updating ? "wait" : "pointer", transition: "all .15s",
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                  {s.icon} {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ INFO GRID ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>

          {/* Kontaktdaten */}
          <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 14 }}>📋 Kontaktdaten</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <InfoRow label="Name" value={lead?.name} />
              <InfoRow label="E-Mail" value={lead?.email} link={lead?.email ? `mailto:${lead.email}` : undefined} />
              <InfoRow label="Telefon" value={lead?.phone} link={lead?.phone ? `tel:${lead.phone}` : undefined} />
              <InfoRow label="PLZ" value={lead?.plz} />
            </div>
          </div>

          {/* Wizard-Daten */}
          <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 14 }}>⚡ PV-Konfiguration</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <InfoRow label="Hausart" value={HAUSART_MAP[lead?.hausart] || lead?.hausart} />
              <InfoRow label="Dachform" value={DACH_MAP[lead?.dachform] || lead?.dachform} />
              <InfoRow label="Eigentümer" value={lead?.eigentuemer === "ja" ? "✅ Ja" : lead?.eigentuemer === "nein" ? "❌ Nein" : "—"} />
              <InfoRow label="Stromverbrauch" value={lead?.stromverbrauch ? `${Number(lead.stromverbrauch).toLocaleString("de-DE")} kWh/Jahr` : "—"} />
            </div>
          </div>
        </div>

        {/* ═══ NOTIZEN ═══ */}
        <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 10 }}>📝 Notizen</div>
          <textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); setNotesSaved(false); }}
            placeholder="Notizen zum Lead (z.B. Gesprächsergebnis, nächste Schritte...)"
            style={{
              width: "100%", minHeight: 100, background: "rgba(15,15,25,0.8)", border: `1px solid ${borderColor}`,
              borderRadius: 8, padding: 12, color: "#e2e8f0", fontSize: 13, fontFamily: "inherit",
              outline: "none", resize: "vertical", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <button onClick={saveNotes}
              style={{ ...actionBtn("rgba(34,197,94,0.1)", "rgba(34,197,94,0.2)", "#22c55e"), padding: "8px 16px", fontSize: 12 }}>
              💾 Speichern
            </button>
            {notesSaved && <span style={{ fontSize: 12, color: "#22c55e" }}>✓ Gespeichert</span>}
          </div>
        </div>

        {/* ═══ DOKUMENTE ═══ */}
        {lead?.documentFilename && (
          <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 12 }}>📄 Dokumente</div>
            <a href={`/api/wizard/leads/${leadId}/document`} target="_blank" rel="noopener"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                background: "rgba(212,168,67,0.06)", border: `1px solid ${borderColor}`,
                borderRadius: 8, textDecoration: "none", transition: "background .15s",
              }}>
              <span style={{ fontSize: 22 }}>📋</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Zusammenfassung mit Unterschrift</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{lead.documentFilename}</div>
              </div>
              <span style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 600 }}>Öffnen →</span>
            </a>
            {lead?.hasSignature && (
              <div style={{ marginTop: 8, fontSize: 11, color: "#22c55e", display: "flex", alignItems: "center", gap: 4 }}>
                ✅ Unterschrift vorhanden
              </div>
            )}
          </div>
        )}

        {/* ═══ META ═══ */}
        <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 14 }}>📊 Meta</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <InfoRow label="Eingegangen" value={lead?.timestamp ? new Date(lead.timestamp).toLocaleString("de-DE") : "—"} />
            <InfoRow label="Lead-ID" value={leadId} />
            <InfoRow label="IP" value={lead?.ip || "—"} />
            {lead?.updatedAt && <InfoRow label="Zuletzt geändert" value={new Date(lead.updatedAt).toLocaleString("de-DE")} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, link }: { label: string; value?: string; link?: string }) {
  const v = value || "—";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
      {link ? (
        <a href={link} style={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc", textDecoration: "none" }}>{v}</a>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{v}</span>
      )}
    </div>
  );
}
