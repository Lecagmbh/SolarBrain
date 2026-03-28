/**
 * HV DASHBOARD TAB — Gamified
 * Name, Rang, Stufen-Fortschritt, Verdienst, Lead-Pipeline
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { CSSProperties } from "react";
import {
  Trophy, Flame, Star, Zap, Target, ChevronUp, RefreshCw,
  TrendingUp, Crown, Shield, Award, Users, Phone, CheckCircle,
  XCircle, Search, UserCheck, UserX, ArrowRight,
  Calendar, MapPin, Clock, Bell, AlertTriangle, Megaphone, UserPlus, Check, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../../../modules/api/client";

const formatEur = (v: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v);

// ═══════════════════════════════════════════════════════════════════
// STUFEN-SYSTEM
// ═══════════════════════════════════════════════════════════════════

const STUFEN = [
  { name: "Starter", min: 0, icon: Zap, color: "#64748b", next: 2500 },
  { name: "Bronze", min: 2500, icon: Shield, color: "#CD7F32", next: 7500 },
  { name: "Silber", min: 7500, icon: Award, color: "#C0C0C0", next: 15000 },
  { name: "Gold", min: 15000, icon: Star, color: "#FFD700", next: 30000 },
  { name: "Platin", min: 30000, icon: Crown, color: "#E5E4E2", next: 50000 },
  { name: "Diamond", min: 50000, icon: Trophy, color: "#b9f2ff", next: 100000 },
  { name: "Legend", min: 100000, icon: Flame, color: "#D4A843", next: null },
];

function getStufe(verdienst: number) {
  for (let i = STUFEN.length - 1; i >= 0; i--) {
    if (verdienst >= STUFEN[i].min) return { ...STUFEN[i], index: i };
  }
  return { ...STUFEN[0], index: 0 };
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════════════

function useCountUp(target: number, duration = 1400): number {
  const [val, setVal] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const start = ref.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setVal(current);
      ref.current = current;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS BANNER
// ═══════════════════════════════════════════════════════════════════

const PRIO_STYLE: Record<string, { bg: string; border: string; icon: any; color: string }> = {
  URGENT:   { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", icon: AlertTriangle, color: "#ef4444" },
  HIGH:     { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", icon: Bell, color: "#f59e0b" },
  NORMAL:   { bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.15)", icon: Megaphone, color: "#3b82f6" },
  LOW:      { bg: "rgba(100,116,139,0.06)", border: "rgba(100,116,139,0.15)", icon: Megaphone, color: "#64748b" },
};

function AnnouncementsBanner() {
  const [items, setItems] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.get("/announcements").then(r => setItems(r.data?.data || [])).catch(() => {});
  }, []);

  const markRead = (id: number) => {
    api.post(`/announcements/${id}/read`).catch(() => {});
    setDismissed(prev => new Set([...prev, id]));
  };

  const visible = items.filter(a => !a.isRead && !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, animation: "hvSlide 0.8s ease" }}>
      {visible.map(a => {
        const s = PRIO_STYLE[a.priority] || PRIO_STYLE.NORMAL;
        const Icon = s.icon;
        return (
          <div key={a.id} style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            padding: "16px 20px", borderRadius: 14,
            background: s.bg, border: `1px solid ${s.border}`,
          }}>
            <Icon size={20} style={{ color: s.color, flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem", marginBottom: 3 }}>{a.title}</div>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.5 }}>{a.content}</div>
              <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: 6 }}>
                {a.createdBy?.name} • {new Date(a.createdAt).toLocaleDateString("de-DE")}
              </div>
            </div>
            <button onClick={() => markRead(a.id)} style={{
              background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4, flexShrink: 0,
            }}>
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// UPCOMING EVENTS
// ═══════════════════════════════════════════════════════════════════

const EVENT_ICONS: Record<string, { icon: any; color: string }> = {
  SCHULUNG: { icon: Award, color: "#8b5cf6" },
  TEAM_MEETING: { icon: Users, color: "#3b82f6" },
  MESSE: { icon: MapPin, color: "#22c55e" },
  WEBINAR: { icon: Phone, color: "#06b6d4" },
  AKTION: { icon: Zap, color: "#f59e0b" },
  SONSTIGES: { icon: Calendar, color: "#64748b" },
};

function UpcomingEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [registering, setRegistering] = useState<number | null>(null);

  const load = () => {
    api.get("/events").then(r => setEvents(r.data?.data || [])).catch(() => {});
  };
  useEffect(load, []);

  const toggleRegister = async (event: any) => {
    setRegistering(event.id);
    try {
      if (event.isRegistered) {
        await api.delete(`/events/${event.id}/register`);
      } else {
        await api.post(`/events/${event.id}/register`);
      }
      load();
    } catch {} finally {
      setRegistering(null);
    }
  };

  if (events.length === 0) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: 20, marginBottom: 20, animation: "hvSlide 0.9s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Calendar size={18} style={{ color: "#D4A843" }} />
        <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>Kommende Events</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {events.slice(0, 5).map(e => {
          const cfg = EVENT_ICONS[e.type] || EVENT_ICONS.SONSTIGES;
          const Icon = cfg.icon;
          const dateStr = new Date(e.startAt).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" });
          const timeStr = new Date(e.startAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

          return (
            <div key={e.id} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              borderRadius: 12, background: `${cfg.color}06`, border: `1px solid ${cfg.color}12`,
              transition: "all 0.15s",
            }}>
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${cfg.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={20} style={{ color: cfg.color }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem", marginBottom: 2 }}>{e.title}</div>
                <div style={{ display: "flex", gap: 12, fontSize: "0.7rem", color: "#71717a" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock size={11} /> {dateStr}, {timeStr}
                  </span>
                  {e.location && <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <MapPin size={11} /> {e.location}
                  </span>}
                  {e.isOnline && <span style={{ color: "#22c55e" }}>Online</span>}
                </div>
                {e.maxParticipants && (
                  <div style={{ fontSize: "0.65rem", color: e.isFull ? "#ef4444" : "#64748b", marginTop: 3 }}>
                    {e.participantCount}/{e.maxParticipants} Plätze {e.isFull ? "(voll)" : ""}
                  </div>
                )}
              </div>

              {/* Register Button */}
              <button
                onClick={() => toggleRegister(e)}
                disabled={registering === e.id || (e.isFull && !e.isRegistered)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: "0.75rem", flexShrink: 0, transition: "all 0.15s",
                  background: e.isRegistered ? "rgba(34,197,94,0.12)" : `${cfg.color}12`,
                  color: e.isRegistered ? "#22c55e" : cfg.color,
                }}
              >
                {registering === e.id ? (
                  <RefreshCw size={13} style={{ animation: "hvSpin 1s linear infinite" }} />
                ) : e.isRegistered ? (
                  <><Check size={13} /> Angemeldet</>
                ) : (
                  <><UserPlus size={13} /> Anmelden</>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════

interface DashData {
  rang: number; totalHvs: number; verdienst: number; verdienstMonat: number;
  leads: { zuKontaktieren: number; kontaktiert: number; qualifiziert: number; disqualifiziert: number; gesamt: number };
  streak: number; leadsHeute: number; leadsWoche: number;
  trendWoche: number[]; conversionRate: number; kundenCount: number;
}

const EMPTY_DATA: DashData = {
  rang: 0, totalHvs: 0, verdienst: 0, verdienstMonat: 0,
  leads: { zuKontaktieren: 0, kontaktiert: 0, qualifiziert: 0, disqualifiziert: 0, gesamt: 0 },
  streak: 0, leadsHeute: 0, leadsWoche: 0, trendWoche: [0,0,0,0,0,0,0], conversionRate: 0, kundenCount: 0,
};

export function HvDashboardTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashData>(EMPTY_DATA);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [earningsRes, lbRes] = await Promise.allSettled([
          api.get("/hv/my-earnings"),
          api.get("/hv/leaderboard"),
        ]);

        const e = earningsRes.status === "fulfilled" ? (earningsRes.value?.data?.data || null) : null;
        const lb = lbRes.status === "fulfilled" ? (lbRes.value?.data?.data || []) : [];

        // Find own rank
        const stored = localStorage.getItem("baunity_user") || localStorage.getItem("user");
        const myId = stored ? JSON.parse(stored).id : null;
        const myLb = lb?.find((h: any) => h.hvId === myId);

        const sc = e?.statusCounts || {};
        const qualCount = (sc.QUALIFIZIERT || 0) + (sc.VERKAUFT || 0) + (sc.INSTALLATION || 0) + (sc.FERTIG || 0);
        const disqCount = sc.DISQUALIFIZIERT || 0;
        const total = e?.leadsTotal || 0;

        // Build trend from API or zeros
        const trend = e?.trend
          ? e.trend.map((t: any) => t.leads || 0)
          : [0,0,0,0,0,0,0];
        // Pad to 7 entries
        while (trend.length < 7) trend.unshift(0);

        setData({
          rang: myLb?.rang || 0,
          totalHvs: lb?.length || 0,
          verdienst: e?.verdienstGesamt || 0,
          verdienstMonat: e?.verdienstMonat || 0,
          leads: {
            zuKontaktieren: sc.LEAD || sc.EINGANG || 0,
            kontaktiert: sc.KONTAKTIERT || 0,
            qualifiziert: qualCount,
            disqualifiziert: disqCount,
            gesamt: total,
          },
          streak: myLb?.streak ? 1 : 0,
          leadsHeute: 0, // TODO: Backend tagesbasiert
          leadsWoche: myLb?.leadsWoche || 0,
          trendWoche: trend.slice(-7),
          conversionRate: e?.conversionRate || 0,
          kundenCount: myLb?.kundenCount || 0,
        });
      } catch (err: any) {
        setError(err?.message || "Fehler");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stored = localStorage.getItem("baunity_user") || localStorage.getItem("user");
  const userName = stored ? (JSON.parse(stored).name || "").split(" ")[0] : "User";
  const fullName = stored ? JSON.parse(stored).name || "User" : "User";

  const d = data;
  const stufe = getStufe(d.verdienst);
  const nextStufe = STUFEN[stufe.index + 1];
  const bisZurNaechsten = nextStufe ? nextStufe.min - d.verdienst : 0;
  const stufenProgress = nextStufe ? ((d.verdienst - stufe.min) / (nextStufe.min - stufe.min)) * 100 : 100;

  const StufeIcon = stufe.icon;

  const animVerdienst = useCountUp(d.verdienst, 2000);
  const animMonat = useCountUp(d.verdienstMonat, 1500);
  const animLeadsHeute = useCountUp(d.leadsHeute, 1200);
  const animQualifiziert = useCountUp(d.leads.qualifiziert, 1400);
  const animDisqualifiziert = useCountUp(d.leads.disqualifiziert, 1400);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "#71717a" }}>
        <style>{`@keyframes hvSpin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ width: 24, height: 24, border: "2px solid rgba(212,168,67,0.3)", borderTopColor: "#D4A843", borderRadius: "50%", animation: "hvSpin 1s linear infinite", marginRight: 12 }} />
        Dashboard wird geladen...
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        @keyframes hvGlow { 0%,100% { box-shadow: 0 0 20px rgba(212,168,67,0.1) } 50% { box-shadow: 0 0 40px rgba(212,168,67,0.25) } }
        @keyframes hvPulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.05) } }
        @keyframes hvSlide { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes hvShine { 0% { left: -100% } 100% { left: 200% } }
        @keyframes hvFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
      `}</style>

      {/* ═══ HERO SECTION — Name + Rang + Stufe ═══ */}
      <div style={{
        background: "linear-gradient(135deg, rgba(212,168,67,0.08) 0%, rgba(139,92,246,0.05) 50%, rgba(16,185,129,0.05) 100%)",
        border: "1px solid rgba(212,168,67,0.2)", borderRadius: 20, padding: "28px 32px",
        marginBottom: 20, position: "relative", overflow: "hidden",
        animation: "hvSlide 0.5s ease",
      }}>
        {/* Shine effect */}
        <div style={{ position: "absolute", top: 0, width: "60%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.03), transparent)", animation: "hvShine 4s ease infinite", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", flexWrap: "wrap" }}>
          {/* Avatar + Stufe Badge */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: `linear-gradient(135deg, ${stufe.color}, ${stufe.color}88)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 30px ${stufe.color}40`,
              animation: "hvFloat 3s ease infinite",
            }}>
              <StufeIcon size={36} style={{ color: "#000" }} />
            </div>
            <div style={{
              position: "absolute", bottom: -4, right: -4, background: "#060b18",
              borderRadius: "50%", width: 28, height: 28, display: "flex",
              alignItems: "center", justifyContent: "center",
              border: `2px solid ${stufe.color}`,
              fontSize: 12, fontWeight: 900, color: stufe.color,
            }}>
              #{d.rang}
            </div>
          </div>

          {/* Name + Stufe */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.7rem", color: "#71717a", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>
              Willkommen zurück
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff", letterSpacing: -1, marginBottom: 6 }}>
              {fullName}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 14px", borderRadius: 20,
                background: `${stufe.color}18`, border: `1px solid ${stufe.color}40`,
                color: stufe.color, fontSize: "0.8rem", fontWeight: 700,
              }}>
                <StufeIcon size={14} /> {stufe.name}
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 12px", borderRadius: 20,
                background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.25)",
                color: "#D4A843", fontSize: "0.75rem", fontWeight: 600,
              }}>
                Rang {d.rang} von {d.totalHvs}
              </span>
              {d.streak > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 12px", borderRadius: 20,
                  background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)",
                  color: "#f97316", fontSize: "0.75rem", fontWeight: 600,
                }}>
                  <Flame size={13} /> {d.streak} Wochen-Streak
                </span>
              )}
            </div>
          </div>

          {/* Verdienst Highlight */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "0.65rem", color: "#71717a", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>
              Gesamtverdienst
            </div>
            <div style={{
              fontSize: "2.2rem", fontWeight: 900, letterSpacing: -2, lineHeight: 1,
              background: "linear-gradient(135deg, #D4A843, #22c55e)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {formatEur(animVerdienst)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#22c55e", fontWeight: 600, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
              <ChevronUp size={14} /> {formatEur(animMonat)} diesen Monat
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STUFEN-FORTSCHRITT ═══ */}
      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "20px 24px", marginBottom: 20,
        animation: "hvSlide 0.6s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TrendingUp size={18} style={{ color: stufe.color }} />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>Fortschritt zur nächsten Stufe</span>
          </div>
          {nextStufe && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.8rem", color: stufe.color, fontWeight: 700 }}>{stufe.name}</span>
              <ArrowRight size={14} style={{ color: "#64748b" }} />
              <span style={{ fontSize: "0.8rem", color: nextStufe.color || "#fff", fontWeight: 700 }}>{nextStufe.name}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{ position: "relative", height: 14, borderRadius: 10, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 10 }}>
          <div style={{
            height: "100%", borderRadius: 10,
            width: `${Math.min(stufenProgress, 100)}%`,
            background: `linear-gradient(90deg, ${stufe.color}, ${nextStufe?.color || stufe.color})`,
            boxShadow: `0 0 16px ${stufe.color}50`,
            transition: "width 1.5s ease",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              animation: "hvShine 2s ease infinite",
            }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
          <span style={{ color: "#71717a" }}>{formatEur(d.verdienst)} verdient</span>
          {nextStufe ? (
            <span style={{ color: nextStufe.color, fontWeight: 700 }}>
              Noch {formatEur(bisZurNaechsten)} bis {nextStufe.name}
            </span>
          ) : (
            <span style={{ color: "#D4A843", fontWeight: 700 }}>Höchste Stufe erreicht!</span>
          )}
        </div>

        {/* Alle Stufen Mini-Anzeige */}
        <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
          {STUFEN.map((s, i) => {
            const reached = d.verdienst >= s.min;
            const Icon = s.icon;
            return (
              <div key={s.name} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                opacity: reached ? 1 : 0.3,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: reached ? `${s.color}25` : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${reached ? s.color : "rgba(255,255,255,0.1)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={13} style={{ color: reached ? s.color : "#64748b" }} />
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, color: reached ? s.color : "#64748b" }}>{s.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ HEUTE GESAMMELT — Hero Animation ═══ */}
      <div style={{
        background: "linear-gradient(135deg, rgba(212,168,67,0.06) 0%, rgba(212,168,67,0.02) 100%)",
        border: "1px solid rgba(212,168,67,0.15)", borderRadius: 20,
        padding: "28px 32px", marginBottom: 20, position: "relative", overflow: "hidden",
        animation: "hvSlide 0.7s ease",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none" }}>
          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2,
              borderRadius: "50%", background: "#D4A843",
              opacity: 0.15 + (i % 3) * 0.1,
              left: `${10 + i * 12}%`, top: `${20 + (i % 4) * 18}%`,
              animation: `hvFloat ${2 + (i % 3)}s ease ${i * 0.3}s infinite`,
            }} />
          ))}
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 28 }}>
          {/* Animated Leads Heute Counter */}
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(212,168,67,0.05))",
              border: "2px solid rgba(212,168,67,0.3)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 40px rgba(212,168,67,0.15)",
              animation: "hvGlow 3s ease infinite",
            }}>
              <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "#D4A843", lineHeight: 1, letterSpacing: -2 }}>
                {animLeadsHeute}
              </div>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#D4A843", opacity: 0.7, textTransform: "uppercase", letterSpacing: 1.5 }}>HEUTE</div>
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", marginBottom: 6 }}>
              {d.leadsHeute > 0 ? (
                <>{d.leadsHeute} Lead{d.leadsHeute > 1 ? "s" : ""} heute eingesammelt!</>
              ) : (
                <>Noch keine Leads heute — los geht's!</>
              )}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#71717a", marginBottom: 12 }}>
              {d.leadsWoche} diese Woche • {d.leads.gesamt} insgesamt
            </div>

            {/* Mini-Trend Balken (letzte 7 Tage) */}
            <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 32 }}>
              {d.trendWoche.map((v: number, i: number) => {
                const maxH = Math.max(...d.trendWoche, 1);
                const h = Math.max((v / maxH) * 28, 3);
                const isToday = i === d.trendWoche.length - 1;
                return (
                  <div key={i} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{
                      width: isToday ? 18 : 14, height: h, borderRadius: 4,
                      background: isToday
                        ? "linear-gradient(180deg, #D4A843, #D4A84380)"
                        : "rgba(212,168,67,0.2)",
                      boxShadow: isToday ? "0 0 12px rgba(212,168,67,0.3)" : "none",
                      transition: "height 0.8s ease",
                    }} />
                    <span style={{ fontSize: 7, color: isToday ? "#D4A843" : "#64748b", fontWeight: isToday ? 800 : 500 }}>
                      {["Mo","Di","Mi","Do","Fr","Sa","So"][i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Streak Badge */}
          {d.streak > 0 && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "16px 20px", borderRadius: 14,
              background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)",
            }}>
              <Flame size={28} style={{ color: "#f97316", animation: "hvPulse 1.5s ease infinite" }} />
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#f97316" }}>{d.streak}</div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#f97316", opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>STREAK</div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ QUALIFIZIERT / DISQUALIFIZIERT — Großanzeige ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20, animation: "hvSlide 0.8s ease" }}>
        {/* Qualifiziert */}
        <div style={{
          background: "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, transparent 100%)",
          border: "1px solid rgba(34,197,94,0.2)", borderRadius: 18, padding: "18px",
          display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", right: -20, bottom: -20, width: 120, height: 120,
            borderRadius: "50%", background: "rgba(34,197,94,0.04)",
          }} />
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 24px rgba(34,197,94,0.25)",
          }}>
            <CheckCircle size={30} style={{ color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: "2.6rem", fontWeight: 900, color: "#22c55e", letterSpacing: -2, lineHeight: 1 }}>
              {animQualifiziert}
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", marginTop: 4 }}>Qualifiziert</div>
            <div style={{ fontSize: "0.7rem", color: "#71717a" }}>{d.conversionRate}% Conversion Rate</div>
          </div>
        </div>

        {/* Disqualifiziert */}
        <div style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, transparent 100%)",
          border: "1px solid rgba(239,68,68,0.15)", borderRadius: 18, padding: "18px",
          display: "flex", alignItems: "center", gap: 20, position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", right: -20, bottom: -20, width: 120, height: 120,
            borderRadius: "50%", background: "rgba(239,68,68,0.04)",
          }} />
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 24px rgba(239,68,68,0.2)",
          }}>
            <XCircle size={30} style={{ color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: "2.6rem", fontWeight: 900, color: "#ef4444", letterSpacing: -2, lineHeight: 1 }}>
              {animDisqualifiziert}
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", marginTop: 4 }}>Disqualifiziert</div>
            <div style={{ fontSize: "0.7rem", color: "#71717a" }}>{d.leads.gesamt} Gesamt</div>
          </div>
        </div>
      </div>

      {/* ═══ ANKÜNDIGUNGEN ═══ */}
      <AnnouncementsBanner />

      {/* ═══ EVENTS ═══ */}
      <UpcomingEvents />

      {/* ═══ LEADERBOARD TEASER ═══ */}
      <Link to="/leaderboard" style={{
        display: "flex", alignItems: "center", gap: 16, padding: "16px 24px",
        background: "linear-gradient(135deg, rgba(212,168,67,0.06) 0%, rgba(139,92,246,0.04) 100%)",
        border: "1px solid rgba(212,168,67,0.2)", borderRadius: 16,
        textDecoration: "none", color: "#e2e8f0", transition: "all 0.2s",
        animation: "hvSlide 1s ease",
      }}>
        <Trophy size={24} style={{ color: "#D4A843", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Leaderboard — Rangliste der Handelsvertreter</div>
          <div style={{ fontSize: "0.78rem", color: "#71717a" }}>
            Du bist auf Platz {d.rang} von {d.totalHvs} — kämpfe dich nach oben!
          </div>
        </div>
        <ArrowRight size={18} style={{ color: "#D4A843" }} />
      </Link>
    </div>
  );
}

export default HvDashboardTab;
