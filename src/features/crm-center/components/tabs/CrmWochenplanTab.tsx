import { useState, useEffect } from "react";
import { C, cardStyle } from "../../crm.styles";
import { fetchProjekte, fetchWiedervorlagen } from "../../api/crmApi";
import { stageInfo } from "../../types/crm.types";
import type { CrmProjekt } from "../../types/crm.types";

export default function CrmWochenplanTab() {
  const [projekte, setProjekte] = useState<CrmProjekt[]>([]);
  const [wiedervorlagen, setWiedervorlagen] = useState<CrmProjekt[]>([]);

  useEffect(() => {
    fetchProjekte({ limit: 50 }).then(r => setProjekte(r.items)).catch(() => {});
    fetchWiedervorlagen().then(setWiedervorlagen).catch(() => {});
  }, []);

  const today = new Date();
  const weekDays: { label: string; date: Date }[] = [];
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDays.push({ label: ["Mo", "Di", "Mi", "Do", "Fr"][i] + " " + d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }), date: d });
  }

  // Distribute projects across days based on naechsterKontakt or creation
  const getTasksForDay = (date: Date) => {
    const dayStr = date.toISOString().split("T")[0];
    const wv = wiedervorlagen.filter(p => p.naechsterKontakt && p.naechsterKontakt.startsWith(dayStr));
    const created = projekte.filter(p => p.createdAt.startsWith(dayStr));
    return [...wv.map(p => ({ ...p, _type: "wiedervorlage" })), ...created.map(p => ({ ...p, _type: "neu" }))];
  };

  return (
    <div className="crm-fade">
      <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright, marginBottom: 16 }}>
        Wochenplan — KW {getWeekNumber(today)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {weekDays.map((wd, i) => {
          const isToday = wd.date.toDateString() === today.toDateString();
          const tasks = getTasksForDay(wd.date);
          return (
            <div key={i} style={{ ...cardStyle, borderColor: isToday ? C.borderActive : C.border, background: isToday ? "rgba(212,168,67,0.04)" : C.bgCard }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: isToday ? C.accent : C.text, marginBottom: 10 }}>{wd.label}</div>
              {tasks.length > 0 ? tasks.map((t, j) => {
                const si = stageInfo(t.stage);
                return (
                  <div key={j} style={{ padding: "8px 10px", background: "rgba(6,6,11,0.5)", borderRadius: 6, marginBottom: 4, border: `1px solid ${C.border}`, fontSize: 11, color: C.text }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.titel.substring(0, 30)}{t.titel.length > 30 ? "..." : ""}</div>
                    <div style={{ fontSize: 9, color: si.color }}>{si.icon} {si.label}</div>
                  </div>
                );
              }) : (
                <div style={{ padding: 12, textAlign: "center", color: C.textMuted, fontSize: 10, border: `1px dashed ${C.border}`, borderRadius: 6 }}>Keine Tasks</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
}
