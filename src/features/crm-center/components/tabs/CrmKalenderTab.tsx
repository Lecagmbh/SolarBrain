import { useState } from "react";
import { C, cardStyle } from "../../crm.styles";

export default function CrmKalenderTab() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // Mo=0

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = firstDay.toLocaleString("de-DE", { month: "long", year: "numeric" });

  const prev = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };

  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="crm-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright }}>Kalender — {monthName}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={prev} style={{ background: C.primaryGlow, color: C.accent, border: `1px solid ${C.accentDim}`, borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>← Zurück</button>
          <button onClick={next} style={{ background: C.primaryGlow, color: C.accent, border: `1px solid ${C.accentDim}`, borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Weiter →</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => (
          <div key={d} style={{ fontSize: 10, color: C.textMuted, textAlign: "center", padding: 6, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{d}</div>
        ))}
        {Array.from({ length: startOffset }, (_, i) => <div key={`empty-${i}`} />)}
        {days.map(d => (
          <div key={d} style={{
            background: isToday(d) ? C.primaryGlow : C.bgCard,
            border: `1px solid ${isToday(d) ? C.borderActive : C.border}`,
            borderRadius: 6, padding: "6px 8px", minHeight: 60,
          }}>
            <div style={{ fontSize: 11, fontWeight: isToday(d) ? 800 : 500, color: isToday(d) ? C.accent : C.text, marginBottom: 4 }}>{d}</div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, marginTop: 16, textAlign: "center", color: C.textMuted, fontSize: 12, padding: 20 }}>
        iCal-Sync und Termin-Events werden in einer späteren Version hinzugefügt.
      </div>
    </div>
  );
}
