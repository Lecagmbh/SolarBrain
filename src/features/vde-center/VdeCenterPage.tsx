import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FormSelector } from "./components/FormSelector";
import { FormRenderer } from "./components/FormRenderer";
import { InstallationSearch } from "./components/InstallationSearch";
import { SignatureManager } from "./components/SignatureManager";
import { TicketSidebarPanel } from "../tickets/components/TicketSidebarPanel";

const C = {
  bg: "#06060b", bgPanel: "#0a0a12", bgCard: "rgba(12,12,20,0.85)",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  text: "#e2e8f0", textMuted: "#64748b", textBright: "#f1f5f9",
  primary: "#D4A843", primaryLight: "#EAD068", primaryGlow: "rgba(212,168,67,0.15)",
};

type MainTab = "formulare" | "unterschriften";

export default function VdeCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const instParam = searchParams.get("installationId");

  const [installationId, setInstallationId] = useState<number | undefined>(instParam ? Number(instParam) : undefined);
  const [installationLabel, setInstallationLabel] = useState("");
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFormName, setSelectedFormName] = useState("");
  const [showTickets, setShowTickets] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>("formulare");

  const handleSelectInstallation = (inst: { id: number; publicId: string; customerName?: string }) => {
    setInstallationId(inst.id);
    setInstallationLabel(`${inst.publicId} — ${inst.customerName || ""}`);
    setSearchParams({ installationId: String(inst.id) });
    setSelectedFormId(null);
  };

  const handleSelectForm = (formId: string, formName: string) => {
    setSelectedFormId(formId);
    setSelectedFormName(formName);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.bg, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Top bar */}
      <div style={{ padding: "10px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>VDE</div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: C.textBright, margin: 0 }}>VDE Center</h1>
        </div>

        {/* Main tabs */}
        <div style={{ display: "flex", gap: 2, marginLeft: 16 }}>
          {([
            { id: "formulare" as MainTab, label: "Formulare" },
            { id: "unterschriften" as MainTab, label: "Unterschriften" },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setMainTab(tab.id)} style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${mainTab === tab.id ? C.primary + "40" : "transparent"}`,
              background: mainTab === tab.id ? C.primaryGlow : "transparent",
              color: mainTab === tab.id ? C.primary : C.textMuted,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Installation search (only in Formulare tab) */}
        {mainTab === "formulare" && (
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <InstallationSearch selectedId={installationId} onSelect={handleSelectInstallation} />
          </div>
        )}

        {/* Tickets toggle */}
        {mainTab === "formulare" && installationId && (
          <button onClick={() => setShowTickets(!showTickets)} style={{
            padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0,
            border: `1px solid ${showTickets ? C.primary : C.border}`,
            background: showTickets ? C.primaryGlow : "transparent",
            color: showTickets ? C.primary : C.textMuted,
          }}>
            Tickets {showTickets ? "▸" : "▸"}
          </button>
        )}
      </div>

      {/* Unterschriften Tab */}
      {mainTab === "unterschriften" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <SignatureManager />
        </div>
      )}

      {/* Formulare Tab */}
      {mainTab === "formulare" && (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left: Form selector */}
          <div style={{ width: 240, minWidth: 240, borderRight: `1px solid ${C.border}`, overflowY: "auto", background: C.bgPanel }}>
            <FormSelector installationId={installationId} selectedFormId={selectedFormId} onSelect={handleSelectForm} />
          </div>

          {/* Center: Form content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {!installationId ? (
              <EmptyState
                title="Installation suchen"
                message="Nutze die Suche oben, um eine Installation auszuwählen. Du kannst nach Kundenname, ID, PLZ oder Ort suchen."
              />
            ) : !selectedFormId ? (
              <EmptyState title="Formular wählen" message="Wähle links ein VDE-Formular aus, um es zu bearbeiten." />
            ) : (
              <FormRenderer formId={selectedFormId} installationId={installationId} formName={selectedFormName} />
            )}
          </div>

          {/* Right: Tickets sidebar */}
          {installationId && showTickets && (
            <div style={{ width: 320, minWidth: 320, borderLeft: `1px solid ${C.border}`, background: C.bgPanel, overflowY: "auto" }}>
              <TicketSidebarPanel installationId={installationId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, lineHeight: 1.5 }}>{message}</div>
      </div>
    </div>
  );
}
