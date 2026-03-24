/**
 * CRM Center Page — OHNE eigene Sidebar
 * Wird im normalen AdminLayout gerendert.
 * Tab-Navigation oben statt eigene Sidebar.
 */
import { useState, lazy, Suspense } from "react";
import { CSS_INJECT } from "./crm.styles";
import type { CrmProjekt } from "./types/crm.types";

const CrmDashboardTab = lazy(() => import("./components/tabs/CrmDashboardTab"));
const CrmProjekteTab = lazy(() => import("./components/tabs/CrmProjekteTab"));
const CrmPipelineTab = lazy(() => import("./components/tabs/CrmPipelineTab"));
const CrmGanttTab = lazy(() => import("./components/tabs/CrmGanttTab"));
const CrmMeetingsTab = lazy(() => import("./components/tabs/CrmMeetingsTab"));
const CrmBerichteTab = lazy(() => import("./components/tabs/CrmBerichteTab"));
const CrmZeiterfassungTab = lazy(() => import("./components/tabs/CrmZeiterfassungTab"));
const CrmFormulareTab = lazy(() => import("./components/tabs/CrmFormulareTab"));
const CrmEinstellungenTab = lazy(() => import("./components/tabs/CrmEinstellungenTab"));
const CrmProjektDetail = lazy(() => import("./components/CrmProjektDetail"));

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: "◉" },
  { key: "projekte", label: "Projekte", icon: "☰" },
  { key: "pipeline", label: "Pipeline", icon: "▥" },
  { key: "gantt", label: "Gantt", icon: "▤" },
  { key: "meetings", label: "Meetings", icon: "◎" },
  { key: "berichte", label: "Berichte", icon: "◫" },
  { key: "zeit", label: "Zeit", icon: "◷" },
  { key: "formulare", label: "Formulare", icon: "📝" },
  { key: "settings", label: "Einstellungen", icon: "⚙" },
];

const Loader = () => <div style={{ padding: 40, color: "#94a3b8", textAlign: "center" }}>Laden...</div>;

export default function CrmCenterPage() {
  const [tab, setTab] = useState("dashboard");
  const [selectedProjekt, setSelectedProjekt] = useState<CrmProjekt | null>(null);

  const openProjekt = (p: CrmProjekt) => setSelectedProjekt(p);
  const closeProjekt = () => setSelectedProjekt(null);

  return (
    <div style={{ padding: "0 0 24px" }}>
      <style>{CSS_INJECT}</style>

      {/* Header + Tab-Navigation */}
      {!selectedProjekt && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #D4A843, #EAD068)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>G</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc" }}>CRM</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>Projekt-Management</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, overflowX: "auto", paddingBottom: 2 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSelectedProjekt(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 14px", borderRadius: 6, border: "none",
                  fontSize: 12, fontWeight: tab === t.key ? 600 : 400,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: "nowrap",
                  background: tab === t.key ? "rgba(212,168,67,0.15)" : "transparent",
                  color: tab === t.key ? "#a5b4fc" : "#64748b",
                  transition: "all 0.15s",
                }}>
                <span style={{ fontSize: 12 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <Suspense fallback={<Loader />}>
        {selectedProjekt ? (
          <CrmProjektDetail projekt={selectedProjekt} onClose={closeProjekt} />
        ) : (
          <>
            {tab === "dashboard" && <CrmDashboardTab onSelect={openProjekt} />}
            {tab === "projekte" && <CrmProjekteTab onSelect={openProjekt} />}
            {tab === "pipeline" && <CrmPipelineTab onSelect={openProjekt} />}
            {tab === "gantt" && <CrmGanttTab />}
            {tab === "meetings" && <CrmMeetingsTab />}
            {tab === "berichte" && <CrmBerichteTab />}
            {tab === "zeit" && <CrmZeiterfassungTab />}
            {tab === "formulare" && <CrmFormulareTab />}
            {tab === "settings" && <CrmEinstellungenTab />}
          </>
        )}
      </Suspense>
    </div>
  );
}
