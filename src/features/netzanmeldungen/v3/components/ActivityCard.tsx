/**
 * ActivityCard — Karten- und Kompakt-Ansicht für ein Projekt
 * Mehr Infos, Blink bei Aktion fällig, letzte Email
 */
import { badgeStyle } from "../../../crm-center/crm.styles";
import { SC } from "../constants";
import type { UnifiedItem } from "../types";

interface Props {
  item: UnifiedItem;
  compact: boolean;
  onClick: (item: UnifiedItem) => void;
  onDraftClick?: (item: UnifiedItem) => void;
}

function formatKwp(kwp: number): string {
  if (kwp >= 1000) return `${(kwp / 1000).toFixed(1)} MW`;
  if (kwp > 0) return `${kwp.toFixed(kwp < 100 ? 2 : 0)} kWp`;
  return "";
}

// Blink CSS wird einmal injected
const BLINK_CSS = `
@keyframes cardPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0),inset 0 0 0 0 rgba(239,68,68,0)}50%{box-shadow:0 0 20px 4px rgba(239,68,68,0.25),inset 0 0 30px rgba(239,68,68,0.03)}}
@keyframes cardPulseGreen{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}50%{box-shadow:0 0 24px 6px rgba(34,197,94,0.2),inset 0 0 20px rgba(34,197,94,0.02)}}
@keyframes dotPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.8);opacity:0.4}}
@keyframes borderFlash{0%,100%{border-left-color:var(--blink-color,#ef4444)}50%{border-left-color:transparent}}
@keyframes borderFlashGreen{0%,100%{border-left-color:#22c55e}50%{border-left-color:rgba(34,197,94,0.3)}}
@keyframes dcGlow{0%,100%{box-shadow:0 0 0 0 var(--gc,rgba(34,197,94,0.2))}50%{box-shadow:0 0 16px 0 var(--gc,rgba(34,197,94,0.15))}}
.v3-card-blink{animation:cardPulse 1.5s ease-in-out infinite,borderFlash 1.5s ease-in-out infinite}
.v3-card-blink-green{animation:cardPulseGreen 2s ease-in-out infinite,borderFlashGreen 2s ease-in-out infinite}
.v3-dot-blink{animation:dotPulse 1s ease-in-out infinite}
`;
let blinkInjected = false;
function injectBlink() {
  if (blinkInjected) return;
  const s = document.createElement("style");
  s.textContent = BLINK_CSS;
  document.head.appendChild(s);
  blinkInjected = true;
}

export default function ActivityCard({ item, compact, onClick, onDraftClick }: Props) {
  injectBlink();

  const sc = SC[item.status] || { l: item.status, c: "#64748b", i: "📋" };
  const daysAtNb = item.daysAtNb ?? 0;
  const daysColor = daysAtNb > 14 ? "#ef4444" : daysAtNb > 7 ? "#f97316" : daysAtNb > 0 ? "#3b82f6" : "#64748b";
  const isNewLead = item.status === "lead_neu";
  const isUrgent = item.status === "rueckfrage" || (item.status === "beim_nb" && daysAtNb > 14) || isNewLead;
  const needsAction = isUrgent || item.status === "eingang";
  const kwpStr = formatKwp(item.kwp);
  const docsCount = item.documentsCount || 0;
  const emailsCount = item.emailsCount || 0;
  const commentsCount = item.commentsCount || 0;
  const lastAct = item.lastActivity;
  const waitingForReply = (item as any).waitingForReply;
  const pendingDrafts = (item as any).pendingDrafts || 0;

  if (compact) {
    return (
      <div className={`v3-card ${needsAction ? "v3-card-blink" : ""}`} onClick={() => onClick(item)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "rgba(12,15,28,0.95)", border: `1px solid ${isUrgent ? sc.c + "25" : "rgba(212,168,67,0.06)"}`, borderRadius: 10, marginBottom: 3, borderLeft: `3px solid ${sc.c}`, cursor: "pointer", transition: "all .15s" }}>
        {needsAction && <span className="v3-dot-blink" style={{ width: 6, height: 6, borderRadius: "50%", background: sc.c, flexShrink: 0 }} />}
        <span style={badgeStyle(sc.c + "15", sc.c)}>{sc.i} {sc.l}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", minWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
        <span style={{ fontSize: 11, color: "#64748b", minWidth: 80 }}>{item.plz} {item.ort}</span>
        <span style={{ fontSize: 11, color: "#64748b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nb || "—"}</span>
        {kwpStr && <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", minWidth: 70, textAlign: "right" }}>{kwpStr}</span>}
        {daysAtNb > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: daysColor, minWidth: 30, textAlign: "right" }}>{daysAtNb}d</span>}
        {pendingDrafts > 0 && <span onClick={e => { e.stopPropagation(); onDraftClick?.(item); }} style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, #22c55e, #16a34a)", padding: "2px 10px", borderRadius: 10, boxShadow: "0 0 10px rgba(34,197,94,0.4)", cursor: "pointer", animation: "dotPulse 2s infinite" }}>Freigeben</span>}
        {emailsCount > 0 && <span style={{ fontSize: 10, color: "#38bdf8" }}>📨{emailsCount}</span>}
        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#475569" }}>{item.publicId}</span>
      </div>
    );
  }

  return (
    <div className={`v3-card ${isNewLead ? "v3-card-blink-green" : needsAction ? "v3-card-blink" : ""}`} onClick={() => onClick(item)}
      style={{ background: isNewLead ? "rgba(10,20,15,0.95)" : needsAction ? "rgba(20,12,15,0.95)" : "rgba(12,15,28,0.95)", border: `1px solid ${isNewLead ? "rgba(34,197,94,0.25)" : isUrgent ? sc.c + "30" : "rgba(212,168,67,0.06)"}`, borderRadius: 12, padding: 0, marginBottom: 8, overflow: "hidden", cursor: "pointer", transition: "all .15s", borderLeft: `4px solid ${isNewLead ? "#22c55e" : sc.c}`, "--blink-color": sc.c } as any}>

      {/* Header: Status + Az + kWp + Tage */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px 8px", flexWrap: "wrap" }}>
        {needsAction && <span className="v3-dot-blink" style={{ width: 8, height: 8, borderRadius: "50%", background: sc.c, flexShrink: 0, boxShadow: `0 0 10px ${sc.c}80, 0 0 20px ${sc.c}40` }} />}
        <span style={{ ...badgeStyle(sc.c + "12", sc.c), fontSize: 10, padding: "3px 10px", borderRadius: 20 }}>{sc.i} {sc.l}</span>
        {item.azNb && <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#64748b", background: "rgba(100,116,139,0.08)", padding: "2px 8px", borderRadius: 4 }}>Az: {item.azNb}</span>}
        {waitingForReply && <span style={{ fontSize: 9, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "2px 8px", borderRadius: 12, border: "1px solid rgba(245,158,11,0.15)" }}>📤 Wartet auf Antwort</span>}
        {pendingDrafts > 0 && (
          <span onClick={e => { e.stopPropagation(); onDraftClick?.(item); }} style={{ fontSize: 9, fontWeight: 800, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "3px 10px", borderRadius: 12, border: "1px solid rgba(34,197,94,0.2)", boxShadow: "0 0 12px rgba(34,197,94,0.2)", animation: "dotPulse 2s infinite", cursor: "pointer" }}>
            ✉️ Entwurf bereit — Freigabe
          </span>
        )}
        <div style={{ flex: 1 }} />
        {kwpStr && <span style={{ fontSize: 13, fontWeight: 800, color: "#22c55e", letterSpacing: "-0.02em" }}>{kwpStr}</span>}
        {daysAtNb > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: daysColor, background: daysColor + "0d", padding: "3px 10px", borderRadius: 20, border: `1px solid ${daysColor}15` }}>
            {daysAtNb}d
          </span>
        )}
      </div>

      {/* Name + Standort + NB */}
      <div style={{ padding: "0 16px 10px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
          {item.plz && <span>{item.plz} {item.ort}</span>}
          {item.nb && <><span style={{ color: "#334155" }}>·</span><span style={{ color: "#94a3b8" }}>⚡ {item.nb}</span></>}
          {item.kunde && item.kunde !== "—" && item.kunde !== item.name && (
            <><span style={{ color: "#334155" }}>·</span><span style={{ color: "#475569" }}>🏢 {item.kunde}</span></>
          )}
        </div>
      </div>

      {/* Letzte Aktivität */}
      {lastAct?.text && (
        <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(212,168,67,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, background: lastAct.type === "email_in" ? "#38bdf8" : lastAct.type === "email_out" ? "#34d399" : lastAct.type === "status" ? "#f0d878" : "#64748b", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastAct.text}</span>
          {lastAct.time && <span style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>{lastAct.time}</span>}
        </div>
      )}

      {/* Footer: Counts + PublicId */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 16px", borderTop: "1px solid rgba(212,168,67,0.04)", background: "rgba(0,0,0,0.12)" }}>
        <span style={{ fontSize: 10, color: docsCount > 0 ? "#64748b" : "#334155" }}>📄 {docsCount}</span>
        <span style={{ fontSize: 10, color: emailsCount > 0 ? "#38bdf8" : "#334155", fontWeight: emailsCount > 0 ? 600 : 400 }}>📨 {emailsCount}</span>
        <span style={{ fontSize: 10, color: commentsCount > 0 ? "#64748b" : "#334155" }}>💬 {commentsCount}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "#334155" }}>{item.publicId}</span>
      </div>

      {/* Nächste Aktion — hervorgehoben wenn fällig */}
      {item.nextAction && !pendingDrafts && (
        <div style={{ padding: "8px 16px", background: needsAction ? `${sc.c}08` : "rgba(212,168,67,0.03)", borderTop: `1px solid ${needsAction ? sc.c + "12" : "rgba(212,168,67,0.04)"}`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: needsAction ? sc.c : "#D4A843" }}>→</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: needsAction ? sc.c : "#EAD068" }}>{item.nextAction}</span>
        </div>
      )}

      {/* NEUER LEAD BANNER — grün pulsierend */}
      {isNewLead && (
        <div style={{
            padding: "10px 16px", borderTop: "1px solid rgba(34,197,94,0.2)",
            background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.04) 100%)",
            display: "flex", alignItems: "center", gap: 10,
            animation: "dcGlow 2s ease-in-out infinite",
            // @ts-ignore
            "--gc": "rgba(34,197,94,0.3)",
          }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 10px #22c55e80, 0 0 20px #22c55e40", animation: "dotPulse 1.2s infinite", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#22c55e" }}>Jetzt kontaktieren</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{item.email || "Lead wartet auf Kontaktaufnahme"}</div>
          </div>
          <div style={{ fontSize: 18 }}>📞</div>
        </div>
      )}

      {/* DRAFT BANNER — prominent wenn Entwurf bereit */}
      {pendingDrafts > 0 && (
        <div onClick={e => { e.stopPropagation(); onDraftClick?.(item); }}
          style={{
            padding: "10px 16px", borderTop: "1px solid rgba(34,197,94,0.15)",
            background: "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)",
            display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
            animation: "slideUp .3s ease",
          }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e80", animation: "dotPulse 1.5s infinite", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>Antwort-Entwurf bereit</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>Klicken zum Prüfen und Freigeben</div>
          </div>
          <div style={{
            padding: "6px 16px", borderRadius: 8, fontSize: 11, fontWeight: 800,
            background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff",
            boxShadow: "0 0 16px rgba(34,197,94,0.3)", letterSpacing: 0.3,
          }}>
            Freigeben
          </div>
        </div>
      )}
    </div>
  );
}
