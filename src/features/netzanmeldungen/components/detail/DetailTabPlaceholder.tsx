/**
 * Placeholder für noch nicht implementierte Detail-Tabs
 */

const C = { dim: "#94a3b8", muted: "#64748b" };

const INFO: Record<string, { icon: string; text: string }> = {
  timeline: { icon: "📖", text: "Chronologische Projekt-Timeline" },
  angebot: { icon: "📝", text: "Angebot erstellen, PDF, versenden" },
  nb: { icon: "📧", text: "NB-Kommunikation mit KI-Analyse" },
  wa: { icon: "💬", text: "WhatsApp-Chat mit dem Kunden" },
  docs: { icon: "📄", text: "Alle Dokumente dieser Installation" },
  check: { icon: "✅", text: "NB-Unterlagen Checkliste" },
  montage: { icon: "🔧", text: "Montage-Planung & IBN" },
};

export default function DetailTabPlaceholder({ tab, hasCrm }: { tab: string; hasCrm: boolean }) {
  const info = INFO[tab] || { icon: "📋", text: tab };
  return (
    <div className="f" style={{ padding: 24, textAlign: "center", color: C.muted }}>
      <div style={{ fontSize: 18, marginBottom: 6 }}>{info.icon}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.dim }}>{info.text}</div>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>
        {hasCrm ? "CRM-Projekt: Voller Funktionsumfang" : "Wizard: Klassische Netzanmeldung"}
      </div>
    </div>
  );
}
