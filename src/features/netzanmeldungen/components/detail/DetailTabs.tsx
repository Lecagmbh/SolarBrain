/**
 * Detail Tabs — Premium Design, Pill-Style, dynamisch je nach Herkunft
 */

const C = { primary: "#D4A843", accent: "#a5b4fc", muted: "#475569", border: "rgba(255,255,255,0.05)", bg: "#0a0a0f" };

interface Tab { k: string; l: string; i: string }

export function getDetailTabs(hasCrm: boolean, tickets: number): Tab[] {
  return [
    { k: "uebersicht", l: "Übersicht", i: "◉" },
    { k: "verlauf", l: "Verlauf", i: "📜" },
    ...(hasCrm ? [{ k: "angebot", l: "Angebot", i: "📝" }] : []),
    { k: "nb", l: "NB-Komm.", i: "📧" },
    { k: "vde", l: "VDE Center", i: "📋" },
    ...(hasCrm ? [{ k: "wa", l: "WhatsApp", i: "💬" }] : []),
    { k: "tix", l: `Tickets${tickets > 0 ? ` (${tickets})` : ""}`, i: "🎫" },
    { k: "docs", l: "Dokumente", i: "📄" },
    { k: "check", l: "Unterlagen", i: "✅" },
    { k: "comments", l: "Kommentare", i: "💬" },
    ...(hasCrm ? [{ k: "montage", l: "Montage", i: "🔧" }] : []),
  ];
}

export function DetailTabBar({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (k: string) => void }) {
  return (
    <div style={{
      position: "sticky", top: 100, zIndex: 9,
      background: "rgba(10,10,15,0.95)", backdropFilter: "blur(8px)",
      padding: "8px 20px", display: "flex", gap: 4,
      borderBottom: `1px solid ${C.border}`, overflowX: "auto",
    }}>
      {tabs.map(t => {
        const isActive = active === t.k;
        return (
          <button key={t.k} onClick={() => onChange(t.k)}
            style={{
              padding: "8px 14px", border: "none",
              borderRadius: 8,
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              background: isActive ? "rgba(212,168,67,0.12)" : "transparent",
              color: isActive ? C.accent : C.muted,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 5,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: 14 }}>{t.i}</span>
            {t.l}
          </button>
        );
      })}
    </div>
  );
}
