import { useState, useEffect } from "react";
import { C, cardStyle, btnPrimary, badgeStyle, inputStyle } from "../../crm.styles";
import { fetchMeetings, createMeeting } from "../../api/crmApi";

interface Meeting { id: number; titel: string; datum: string; dauerMinuten?: number; teilnehmer?: number[]; notizen?: string; kiProtokoll?: string; projektId?: number }

export default function CrmMeetingsTab() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newTitel, setNewTitel] = useState("");
  const [newDatum, setNewDatum] = useState("");

  const load = () => { fetchMeetings(1).then(setMeetings).catch(() => {}); };
  useEffect(load, []);

  const handleCreate = async () => {
    if (!newTitel || !newDatum) return;
    await createMeeting({ organisationId: 1, titel: newTitel, datum: newDatum });
    setNewTitel(""); setNewDatum(""); setShowNew(false); load();
  };

  return (
    <div className="crm-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright }}>Meetings & Protokolle</div>
        <button onClick={() => setShowNew(!showNew)} style={btnPrimary}>+ Neues Meeting</button>
      </div>

      {showNew && (
        <div style={{ ...cardStyle, marginBottom: 16, display: "flex", gap: 10, alignItems: "end" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Titel</div>
            <input value={newTitel} onChange={e => setNewTitel(e.target.value)} style={{ ...inputStyle, width: "100%" }} placeholder="Meeting-Titel" />
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Datum</div>
            <input type="datetime-local" value={newDatum} onChange={e => setNewDatum(e.target.value)} style={{ ...inputStyle }} />
          </div>
          <button onClick={handleCreate} style={btnPrimary}>Erstellen</button>
        </div>
      )}

      {meetings.map(m => (
        <div key={m.id} style={{ ...cardStyle, marginBottom: 10, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.textBright }}>{m.titel}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>
                {new Date(m.datum).toLocaleString("de-DE")}
                {m.dauerMinuten && ` · ${m.dauerMinuten} Min`}
              </div>
            </div>
            {m.kiProtokoll ? (
              <span style={badgeStyle(C.greenBg, C.green)}>Protokoll vorhanden</span>
            ) : (
              <span style={badgeStyle(C.yellowBg, C.yellow)}>Ausstehend</span>
            )}
          </div>
          {m.kiProtokoll && (
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 10, padding: "10px 12px", background: "rgba(6,6,11,0.5)", borderRadius: 6, lineHeight: 1.5, border: `1px solid ${C.border}` }}>
              {m.kiProtokoll}
            </div>
          )}
          {m.notizen && !m.kiProtokoll && (
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 8 }}>{m.notizen}</div>
          )}
        </div>
      ))}
      {meetings.length === 0 && <div style={{ color: C.textMuted, textAlign: "center", padding: 40 }}>Noch keine Meetings angelegt.</div>}
    </div>
  );
}
