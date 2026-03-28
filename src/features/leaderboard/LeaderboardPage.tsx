/**
 * Gamified Leaderboard — HV Rangliste
 * Motivierend, animiert, kein Verdienst sichtbar
 */
import { useState, useEffect, useRef } from "react";
import { Trophy, Flame, Star, Zap, Crown, Medal, RefreshCw, ArrowUp, Target, TrendingUp, Rocket } from "lucide-react";
import { api } from "../../modules/api/client";

interface Entry {
  hvId: number; name: string; firmenName: string | null;
  leadsTotal: number; leadsMonat: number; leadsWoche: number;
  qualifiziert: number; rang: number;
  badge: "gold" | "silber" | "bronze" | null;
  level: number; streak: boolean;
}

const BADGE = {
  gold:   { icon: Crown, color: "#FFD700", glow: "rgba(255,215,0,0.4)" },
  silber: { icon: Medal, color: "#C0C0C0", glow: "rgba(192,192,192,0.3)" },
  bronze: { icon: Medal, color: "#CD7F32", glow: "rgba(205,127,50,0.3)" },
};

function useCountUp(target: number, dur = 1400) {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const s = ref.current, d = target - s;
    if (!d) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const c = Math.round(s + d * (1 - Math.pow(1 - p, 3)));
      setV(c); ref.current = c;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, dur]);
  return v;
}

const CSS = `
@keyframes lbSlide { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
@keyframes lbFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
@keyframes lbGlow { 0%,100% { box-shadow: 0 0 30px rgba(212,168,67,0.1) } 50% { box-shadow: 0 0 80px rgba(212,168,67,0.35) } }
@keyframes lbSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes lbRing { 0% { transform: scale(0.8); opacity: 0.6 } 50% { transform: scale(1.2); opacity: 0 } 100% { transform: scale(0.8); opacity: 0 } }
@keyframes lbShimmer { 0% { background-position: -200% center } 100% { background-position: 200% center } }
@keyframes lbFirework { 0% { transform: scale(0); opacity: 1 } 50% { transform: scale(1); opacity: 0.6 } 100% { transform: scale(1.5); opacity: 0 } }
`;

/* ═══ HERO HEADER ═══ */
function HeroHeader({ total, myRang, onRefresh }: { total: number; myRang: number | null; onRefresh: () => void }) {
  const animTotal = useCountUp(total, 2200);

  return (
    <div style={{
      position: "relative", textAlign: "center", padding: "40px 20px 36px",
      background: "linear-gradient(180deg, rgba(212,168,67,0.06) 0%, transparent 80%)",
      borderBottom: "1px solid rgba(212,168,67,0.08)",
      marginBottom: 32, overflow: "hidden",
    }}>
      {/* Animated rings behind trophy */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            width: 140 + i * 60, height: 140 + i * 60,
            marginTop: -(70 + i * 30), marginLeft: -(70 + i * 30),
            borderRadius: "50%", border: "1px solid rgba(212,168,67,0.08)",
            animation: `lbRing ${3 + i}s ease ${i * 0.8}s infinite`,
          }} />
        ))}
      </div>

      {/* Refresh */}
      <button onClick={onRefresh} style={{
        position: "absolute", right: 20, top: 20,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        color: "#506080", padding: 10, borderRadius: 10, cursor: "pointer",
      }}>
        <RefreshCw size={15} />
      </button>

      {/* Trophy */}
      <div style={{
        position: "relative", width: 88, height: 88, margin: "0 auto 20px",
        animation: "lbSlide 0.4s ease",
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: 22,
          background: "linear-gradient(135deg, #D4A843, #f59e0b, #D4A843)",
          backgroundSize: "200% 200%", animation: "lbShimmer 3s linear infinite, lbGlow 4s ease infinite",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 40px rgba(212,168,67,0.3)",
        }}>
          <Trophy size={42} color="#060b18" strokeWidth={2.5} />
        </div>
      </div>

      {/* Title */}
      <h1 style={{
        margin: "0 0 8px", fontSize: "2.2rem", fontWeight: 900, letterSpacing: -2,
        background: "linear-gradient(135deg, #D4A843, #f59e0b, #EAD068, #D4A843)",
        backgroundSize: "300% 100%", animation: "lbShimmer 4s linear infinite",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>
        LEADERBOARD
      </h1>

      <p style={{
        margin: "0 0 20px", fontSize: "1rem",
        background: "linear-gradient(90deg, #506080, #8b9cc0, #506080)",
        backgroundSize: "200% 100%", animation: "lbShimmer 5s linear infinite",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        fontWeight: 600, letterSpacing: 0.5,
      }}>
        Wer holt sich die Krone?
      </p>

      {/* Stats Badges */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {total > 0 && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 20px", borderRadius: 24,
            background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.15)",
          }}>
            <Zap size={16} style={{ color: "#D4A843" }} />
            <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "#D4A843", letterSpacing: -1 }}>
              {animTotal}
            </span>
            <span style={{ color: "#71717a", fontSize: "0.75rem", fontWeight: 600 }}>Leads</span>
          </div>
        )}
        {myRang && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 18px", borderRadius: 24,
            background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)",
          }}>
            <Star size={15} style={{ color: "#22c55e" }} />
            <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "0.85rem" }}>
              Dein Platz: #{myRang}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ EMPTY STATE ═══ */
function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "50px 20px", animation: "lbSlide 0.5s ease" }}>
      <div style={{
        width: 110, height: 110, borderRadius: "50%", margin: "0 auto 24px",
        background: "linear-gradient(135deg, rgba(212,168,67,0.1), rgba(212,168,67,0.03))",
        border: "2px dashed rgba(212,168,67,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "lbFloat 4s ease infinite",
      }}>
        <Rocket size={44} style={{ color: "#D4A843", opacity: 0.5 }} />
      </div>
      <h2 style={{
        margin: "0 0 10px", fontSize: "1.6rem", fontWeight: 800,
        background: "linear-gradient(135deg, #D4A843, #f59e0b)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>
        Das Rennen beginnt!
      </h2>
      <p style={{ color: "#506080", fontSize: "0.9rem", maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.7 }}>
        Sammle deinen ersten Lead und starte auf der Rangliste durch.
        Jeder qualifizierte Lead bringt dich dem Podium näher!
      </p>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        {[
          { icon: Zap, label: "Leads sammeln", sub: "Geh raus und überzeuge", color: "#D4A843" },
          { icon: Target, label: "Qualifizieren", sub: "Nur Quali-Leads zählen", color: "#22c55e" },
          { icon: Crown, label: "Krone holen", sub: "Platz 1 wartet auf dich", color: "#FFD700" },
        ].map(s => (
          <div key={s.label} style={{
            padding: "20px", borderRadius: 16, width: 155,
            background: `linear-gradient(135deg, ${s.color}08, transparent)`,
            border: `1px solid ${s.color}15`,
          }}>
            <s.icon size={24} style={{ color: s.color, marginBottom: 10 }} />
            <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.85rem", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: "0.7rem", color: "#506080" }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ PODIUM ═══ */
function Podium({ entry, height, delay }: { entry: Entry; height: number; delay: number }) {
  const b = entry.badge ? BADGE[entry.badge] : null;
  const isFirst = entry.rang === 1;
  const sz = isFirst ? 80 : 60;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      animation: `lbSlide 0.6s ease ${delay}s both`,
    }}>
      {isFirst && (
        <div style={{ marginBottom: -6, animation: "lbFloat 2.5s ease infinite" }}>
          <Crown size={30} style={{ color: "#FFD700", filter: "drop-shadow(0 0 10px rgba(255,215,0,0.6))" }} />
        </div>
      )}

      <div style={{ position: "relative", marginBottom: 12 }}>
        {/* Spinning ring */}
        <div style={{
          width: sz + 8, height: sz + 8, borderRadius: "50%", position: "absolute", top: -4, left: -4,
          border: `2px solid transparent`,
          borderTopColor: b?.color || "#64748b", borderRightColor: `${b?.color || "#64748b"}40`,
          animation: isFirst ? "lbSpin 4s linear infinite" : `lbSpin 8s linear infinite`,
          opacity: 0.6,
        }} />
        <div style={{
          width: sz, height: sz, borderRadius: "50%",
          background: `linear-gradient(135deg, ${b?.color || "#64748b"}25, ${b?.color || "#64748b"}08)`,
          border: `2px solid ${b?.color || "#64748b"}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 30px ${b?.glow || "transparent"}`,
        }}>
          <span style={{
            fontSize: isFirst ? "1.8rem" : "1.3rem", fontWeight: 900,
            background: `linear-gradient(135deg, ${b?.color || "#64748b"}, ${b?.color || "#64748b"}cc)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {entry.name.charAt(0)}
          </span>
        </div>
        {entry.streak && (
          <Flame size={16} style={{
            position: "absolute", top: -4, right: -4, color: "#f97316",
            filter: "drop-shadow(0 0 6px rgba(249,115,22,0.6))",
          }} />
        )}
      </div>

      <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: isFirst ? "1rem" : "0.85rem", textAlign: "center", marginBottom: 6 }}>
        {entry.name}
      </div>

      <div style={{
        fontSize: isFirst ? "2.2rem" : "1.6rem", fontWeight: 900, letterSpacing: -1, lineHeight: 1,
        background: `linear-gradient(135deg, ${b?.color || "#D4A843"}, ${b?.color || "#D4A843"}cc)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        textShadow: "none",
      }}>
        {entry.leadsTotal}
      </div>
      <div style={{
        fontSize: "0.55rem", fontWeight: 800, color: `${b?.color || "#64748b"}80`,
        letterSpacing: 2, textTransform: "uppercase", marginBottom: 12,
      }}>
        LEADS
      </div>

      {/* Podium Block */}
      <div style={{
        width: "100%", height, borderRadius: "16px 16px 0 0",
        background: `linear-gradient(180deg, ${b?.color || "#64748b"}18 0%, ${b?.color || "#64748b"}04 100%)`,
        border: `1px solid ${b?.color || "#64748b"}12`, borderBottom: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <span style={{ fontSize: "3rem", fontWeight: 900, color: `${b?.color || "#64748b"}0a` }}>
          {entry.rang}
        </span>
        <div style={{
          position: "absolute", bottom: 0, left: "10%", right: "10%", height: 2,
          background: `linear-gradient(90deg, transparent, ${b?.color || "#64748b"}60, transparent)`,
          boxShadow: `0 0 16px ${b?.color || "#64748b"}40`,
        }} />
      </div>
    </div>
  );
}

/* ═══ ROW ═══ */
function Row({ entry, isMe, idx }: { entry: Entry; isMe: boolean; idx: number }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "48px 1fr 80px 50px",
      alignItems: "center", padding: "14px 20px",
      background: isMe ? "rgba(212,168,67,0.06)" : "transparent",
      borderBottom: "1px solid rgba(255,255,255,0.03)",
      borderLeft: isMe ? "3px solid #D4A843" : "3px solid transparent",
      animation: `lbSlide 0.35s ease ${0.04 * idx}s both`,
      transition: "background 0.15s",
    }}
      onMouseEnter={e => { if (!isMe) (e.currentTarget.style.background = "rgba(212,168,67,0.02)"); }}
      onMouseLeave={e => { if (!isMe) (e.currentTarget.style.background = "transparent"); }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: isMe ? "rgba(212,168,67,0.12)" : "rgba(255,255,255,0.04)",
        border: isMe ? "1.5px solid rgba(212,168,67,0.3)" : "1.5px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: "0.85rem", color: isMe ? "#D4A843" : "#506080",
      }}>
        {entry.rang}
      </div>

      <div style={{ paddingLeft: 4 }}>
        <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
          {entry.name}
          {entry.streak && <Flame size={12} style={{ color: "#f97316" }} />}
          {isMe && <span style={{
            fontSize: "0.55rem", color: "#D4A843",
            background: "rgba(212,168,67,0.12)", padding: "2px 8px",
            borderRadius: 4, fontWeight: 700, letterSpacing: 0.5,
          }}>DU</span>}
        </div>
        {entry.leadsMonat > 0 && (
          <div style={{ fontSize: "0.65rem", color: "#22c55e", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
            <ArrowUp size={10} /> {entry.leadsMonat} diesen Monat
          </div>
        )}
      </div>

      <div style={{ textAlign: "center" }}>
        <span style={{ color: "#D4A843", fontWeight: 800, fontSize: "1.1rem" }}>{entry.leadsTotal}</span>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))",
          border: "1px solid rgba(212,168,67,0.15)",
          color: "#D4A843", fontWeight: 900, fontSize: 11,
        }}>
          {entry.level}
        </div>
      </div>
    </div>
  );
}

/* ═══ MAIN ═══ */
export default function LeaderboardPage() {
  const [data, setData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const stored = localStorage.getItem("baunity_user") || localStorage.getItem("user");
  const myUserId = stored ? JSON.parse(stored).id : null;

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await api.get("/hv/leaderboard");
      setData(res.data?.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const myEntry = data.find(e => e.hvId === myUserId);
  const totalLeads = data.reduce((s, e) => s + e.leadsTotal, 0);
  const top3 = data.slice(0, 3);
  const rest = data.slice(3);
  const hasData = data.length > 0 && totalLeads > 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", color: "#e2e8f0" }}>
      <style>{CSS}</style>

      <HeroHeader total={totalLeads} myRang={myEntry?.rang || null} onRefresh={fetch_} />

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#506080" }}>
          <div style={{
            width: 36, height: 36, margin: "0 auto 16px",
            border: "2.5px solid rgba(212,168,67,0.1)", borderTopColor: "#D4A843",
            borderRadius: "50%", animation: "lbSpin 0.8s linear infinite",
          }} />
          <span style={{ fontSize: "0.85rem" }}>Leaderboard wird geladen...</span>
        </div>
      ) : !hasData ? (
        <EmptyState />
      ) : (
        <div style={{ padding: "0 28px 40px" }}>
          {/* Podium */}
          {top3.length >= 3 && (
            <div style={{
              display: "flex", gap: 14, justifyContent: "center", alignItems: "flex-end",
              marginBottom: 36,
            }}>
              <div style={{ flex: 1, maxWidth: 180 }}><Podium entry={top3[1]} height={120} delay={0.15} /></div>
              <div style={{ flex: 1, maxWidth: 200 }}><Podium entry={top3[0]} height={160} delay={0} /></div>
              <div style={{ flex: 1, maxWidth: 180 }}><Podium entry={top3[2]} height={90} delay={0.3} /></div>
            </div>
          )}

          {/* List */}
          {rest.length > 0 && (
            <div style={{
              background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 16, overflow: "hidden",
            }}>
              <div style={{
                display: "grid", gridTemplateColumns: "48px 1fr 80px 50px",
                padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                fontSize: "0.55rem", fontWeight: 700, color: "#354168", textTransform: "uppercase", letterSpacing: 1.5,
              }}>
                <div style={{ textAlign: "center" }}>RANG</div>
                <div>NAME</div>
                <div style={{ textAlign: "center" }}>LEADS</div>
                <div style={{ textAlign: "center" }}>LVL</div>
              </div>
              {rest.map((e, i) => (
                <Row key={e.hvId} entry={e} isMe={e.hvId === myUserId} idx={i} />
              ))}
            </div>
          )}

          {rest.length === 0 && top3.length > 0 && (
            <div style={{
              textAlign: "center", padding: "24px", color: "#506080",
              fontSize: "0.85rem",
              background: "rgba(212,168,67,0.03)", borderRadius: 14,
              border: "1px solid rgba(212,168,67,0.08)",
            }}>
              <Rocket size={20} style={{ color: "#D4A843", marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
              Noch wenige Teilnehmer — sammle Leads und dominiere das Ranking!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
