import { useState, useEffect } from "react";
import { C, cardStyle, btnPrimary, badgeStyle } from "../../crm.styles";
import { fetchProjekte } from "../../api/crmApi";
import type { CrmProjekt } from "../../types/crm.types";

export default function CrmDokumenteTab() {
  const [projekte, setProjekte] = useState<CrmProjekt[]>([]);

  useEffect(() => {
    fetchProjekte({ limit: 100 }).then(r => setProjekte(r.items)).catch(() => {});
  }, []);

  // Collect all document references from project titles (placeholder until real doc model)
  return (
    <div className="crm-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright }}>Dokumente & KI-Scan</div>
        <button style={btnPrimary}>+ Hochladen & Analysieren</button>
      </div>

      <div style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.06), rgba(251,146,60,0.06))", border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <span className="crm-ki-badge" style={{ fontSize: 13, marginBottom: 6, display: "block" }}>KI-Dokumenten-Scanner</span>
        <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6 }}>
          Dokumente werden automatisch gescannt, klassifiziert und dem richtigen Projekt + Checkliste-Item zugeordnet.
          Unterstützt: VDE-Formulare, Lagepläne, Schaltpläne, Datenblätter, Zertifikate, NB-Antworten.
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.textBright, marginBottom: 12 }}>Drag & Drop Upload</div>
        <div style={{
          border: `2px dashed ${C.border}`, borderRadius: 10, padding: 40, textAlign: "center",
          color: C.textMuted, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
        }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.primary; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = C.border; }}
          onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.border; /* TODO: handle */ }}
        >
          📄 Dateien hier ablegen oder klicken zum Auswählen<br />
          <span style={{ fontSize: 10, color: C.textMuted }}>PDF, PNG, JPG — max. 20MB pro Datei</span>
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: C.textBright, marginBottom: 10 }}>Projekte mit Dokumenten-Bedarf</div>
      {projekte.filter(p => p.stage !== "ABGESCHLOSSEN").map(p => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", ...cardStyle, marginBottom: 4 }}>
          <span style={{ fontSize: 16 }}>📁</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.titel}</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>{p.kundenName} · {p.stage}</div>
          </div>
          <span style={badgeStyle(C.yellowBg, C.yellow)}>Checkliste prüfen</span>
        </div>
      ))}
    </div>
  );
}
