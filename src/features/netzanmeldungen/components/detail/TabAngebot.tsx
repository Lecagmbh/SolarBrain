/**
 * Angebot-Tab — Professionell: Empty State, Header, Positionen, Summen, PDF
 */
import { useState } from "react";
import AngebotEditor from "./AngebotEditor";

interface Props { crmId: number; projekt: any }

export default function TabAngebot({ crmId, projekt }: Props) {
  const [hasAngebot, setHasAngebot] = useState(!!projekt?.geschaetzterWert);

  if (!hasAngebot) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc", marginBottom: 8 }}>Noch kein Angebot erstellt</div>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
            Erstellen Sie ein Angebot für dieses Projekt. Kundendaten werden automatisch aus dem Projekt übernommen.
          </div>
          <button onClick={() => setHasAngebot(true)} style={{
            background: "#D4A843", color: "#fff", border: "none", borderRadius: 10,
            padding: "14px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(212,168,67,0.3)",
          }}>
            + Neues Angebot erstellen
          </button>
        </div>
      </div>
    );
  }

  return <AngebotEditor crmId={crmId} projekt={projekt} />;
}
