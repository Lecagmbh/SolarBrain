/**
 * Admin: Events + Announcements Management — Premium Design
 */
import { useState, useEffect } from "react";
import {
  Calendar, Plus, Trash2, Users, MapPin, Clock, Award, Phone, Zap,
  Bell, AlertTriangle, Megaphone, X, RefreshCw, Globe, Send,
  Sparkles, PartyPopper, ChevronRight, Eye,
} from "lucide-react";
import { api } from "../../../modules/api/client";

const CSS = `
@keyframes evSlide { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
@keyframes evGlow { 0%,100% { box-shadow: 0 0 20px rgba(139,92,246,0.08) } 50% { box-shadow: 0 0 40px rgba(139,92,246,0.2) } }
@keyframes evShimmer { 0% { background-position: -200% center } 100% { background-position: 200% center } }
@keyframes evPulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.03) } }
.ev-card { transition: all 0.2s; cursor: default }
.ev-card:hover { border-color: rgba(255,255,255,0.12) !important; transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.3) }
.ev-del { opacity: 0; transition: opacity 0.15s }
.ev-card:hover .ev-del { opacity: 0.6 }
.ev-del:hover { opacity: 1 !important }
`;

const EVENT_TYPES = [
  { value: "SCHULUNG", label: "Schulung", emoji: "🎓", icon: Award, color: "#8b5cf6" },
  { value: "TEAM_MEETING", label: "Team-Meeting", emoji: "🤝", icon: Users, color: "#3b82f6" },
  { value: "MESSE", label: "Messe", emoji: "🏢", icon: MapPin, color: "#22c55e" },
  { value: "WEBINAR", label: "Webinar", emoji: "💻", icon: Phone, color: "#06b6d4" },
  { value: "AKTION", label: "Aktion", emoji: "⚡", icon: Zap, color: "#f59e0b" },
  { value: "SONSTIGES", label: "Sonstiges", emoji: "📌", icon: Calendar, color: "#64748b" },
];

const PRIORITIES = [
  { value: "LOW", label: "Niedrig", color: "#64748b", icon: Megaphone },
  { value: "NORMAL", label: "Normal", color: "#3b82f6", icon: Bell },
  { value: "HIGH", label: "Wichtig", color: "#f59e0b", icon: AlertTriangle },
  { value: "URGENT", label: "Dringend", color: "#ef4444", icon: AlertTriangle },
];

const inp: React.CSSProperties = {
  width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
  color: "#e2e8f0", fontSize: "0.85rem", outline: "none", boxSizing: "border-box",
  transition: "border-color 0.15s",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "gerade eben";
  if (h < 24) return `vor ${h}h`;
  return `vor ${Math.floor(h / 24)}d`;
}

/* ═══════════════════════════════════════════════════════════════════
   CREATE EVENT MODAL
   ═══════════════════════════════════════════════════════════════════ */
function CreateEventForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", type: "SCHULUNG",
    startAt: "", endAt: "", location: "", isOnline: false,
    meetingUrl: "", maxParticipants: "",
  });
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.startAt) return;
    setSaving(true);
    try {
      await api.post("/events", { ...form, maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null });
      setForm({ title: "", description: "", type: "SCHULUNG", startAt: "", endAt: "", location: "", isOnline: false, meetingUrl: "", maxParticipants: "" });
      setOpen(false);
      onCreated();
    } catch (err: any) { alert(err?.response?.data?.error || "Fehler"); }
    finally { setSaving(false); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "14px 24px",
      background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))",
      border: "1px solid rgba(139,92,246,0.3)", borderRadius: 14,
      color: "#a78bfa", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
      transition: "all 0.2s",
    }}>
      <Plus size={18} /> Neues Event erstellen
    </button>
  );

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(139,92,246,0.02))",
      border: "1px solid rgba(139,92,246,0.2)", borderRadius: 18, padding: 24,
      animation: "evSlide 0.3s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={20} style={{ color: "#8b5cf6" }} />
          <span style={{ fontWeight: 800, color: "#fff", fontSize: "1.05rem" }}>Neues Event</span>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#64748b", cursor: "pointer", padding: 6, borderRadius: 8 }}><X size={16} /></button>
      </div>

      {/* Event Type Selector — Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 18 }}>
        {EVENT_TYPES.map(t => (
          <button key={t.value} onClick={() => f("type", t.value)} style={{
            padding: "12px 8px", borderRadius: 10, border: "none", cursor: "pointer",
            background: form.type === t.value ? `${t.color}18` : "rgba(255,255,255,0.03)",
            outline: form.type === t.value ? `2px solid ${t.color}50` : "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.15s",
          }}>
            <span style={{ fontSize: "1.3rem" }}>{t.emoji}</span>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: form.type === t.value ? t.color : "#64748b" }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <input style={inp} value={form.title} onChange={e => f("title", e.target.value)} placeholder="Titel des Events *" onFocus={e => e.target.style.borderColor = "rgba(139,92,246,0.5)"} onBlur={e => e.target.style.borderColor = ""} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <textarea style={{ ...inp, minHeight: 60, resize: "vertical" }} value={form.description} onChange={e => f("description", e.target.value)} placeholder="Beschreibung (optional)" />
        </div>
        <div>
          <label style={{ fontSize: "0.7rem", color: "#506080", fontWeight: 600, marginBottom: 4, display: "block" }}>Start *</label>
          <input style={inp} type="datetime-local" value={form.startAt} onChange={e => f("startAt", e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: "0.7rem", color: "#506080", fontWeight: 600, marginBottom: 4, display: "block" }}>Ende</label>
          <input style={inp} type="datetime-local" value={form.endAt} onChange={e => f("endAt", e.target.value)} />
        </div>
        <div>
          <input style={inp} value={form.location} onChange={e => f("location", e.target.value)} placeholder="Ort (z.B. Büro Lahr)" />
        </div>
        <div>
          <input style={inp} type="number" value={form.maxParticipants} onChange={e => f("maxParticipants", e.target.value)} placeholder="Max. Teilnehmer (leer = ∞)" />
        </div>
        <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#e2e8f0", cursor: "pointer" }}>
            <input type="checkbox" checked={form.isOnline} onChange={e => f("isOnline", e.target.checked)} style={{ accentColor: "#22c55e", width: 18, height: 18 }} />
            <Globe size={15} style={{ color: "#22c55e" }} /> Online-Event
          </label>
          {form.isOnline && (
            <input style={{ ...inp, flex: 1 }} value={form.meetingUrl} onChange={e => f("meetingUrl", e.target.value)} placeholder="Meeting-URL" />
          )}
        </div>
      </div>

      <button onClick={submit} disabled={saving || !form.title || !form.startAt} style={{
        marginTop: 18, width: "100%", padding: "14px", borderRadius: 12, border: "none",
        background: saving ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
        color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        boxShadow: "0 4px 20px rgba(139,92,246,0.25)",
      }}>
        {saving ? <RefreshCw size={16} style={{ animation: "evPulse 1s infinite" }} /> : <PartyPopper size={16} />}
        {saving ? "Wird erstellt..." : "Event veröffentlichen"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CREATE ANNOUNCEMENT
   ═══════════════════════════════════════════════════════════════════ */
function CreateAnnouncementForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "NORMAL", type: "INFO" });
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    try {
      await api.post("/announcements", form);
      setForm({ title: "", content: "", priority: "NORMAL", type: "INFO" });
      setOpen(false);
      onCreated();
    } catch (err: any) { alert(err?.response?.data?.error || "Fehler"); }
    finally { setSaving(false); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "14px 24px",
      background: "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(212,168,67,0.05))",
      border: "1px solid rgba(212,168,67,0.3)", borderRadius: 14,
      color: "#D4A843", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
    }}>
      <Megaphone size={18} /> Neue Ankündigung
    </button>
  );

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(212,168,67,0.06), rgba(212,168,67,0.02))",
      border: "1px solid rgba(212,168,67,0.2)", borderRadius: 18, padding: 24,
      animation: "evSlide 0.3s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Megaphone size={20} style={{ color: "#D4A843" }} />
          <span style={{ fontWeight: 800, color: "#fff", fontSize: "1.05rem" }}>Neue Ankündigung</span>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#64748b", cursor: "pointer", padding: 6, borderRadius: 8 }}><X size={16} /></button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input style={inp} value={form.title} onChange={e => f("title", e.target.value)} placeholder="Titel der Ankündigung *" />
        <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={form.content} onChange={e => f("content", e.target.value)} placeholder="Nachricht an alle HVs..." />

        {/* Priority Pills */}
        <div>
          <label style={{ fontSize: "0.7rem", color: "#506080", fontWeight: 600, marginBottom: 8, display: "block" }}>Priorität</label>
          <div style={{ display: "flex", gap: 8 }}>
            {PRIORITIES.map(p => {
              const Icon = p.icon;
              const active = form.priority === p.value;
              return (
                <button key={p.value} onClick={() => f("priority", p.value)} style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: active ? `${p.color}15` : "rgba(255,255,255,0.03)",
                  outline: active ? `2px solid ${p.color}40` : "1px solid rgba(255,255,255,0.06)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.15s",
                }}>
                  <Icon size={16} style={{ color: active ? p.color : "#506080" }} />
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: active ? p.color : "#506080" }}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button onClick={submit} disabled={saving || !form.title || !form.content} style={{
        marginTop: 18, width: "100%", padding: "14px", borderRadius: 12, border: "none",
        background: saving ? "rgba(212,168,67,0.3)" : "linear-gradient(135deg, #D4A843, #f59e0b)",
        color: "#060b18", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        boxShadow: "0 4px 20px rgba(212,168,67,0.25)",
      }}>
        {saving ? <RefreshCw size={16} style={{ animation: "evPulse 1s infinite" }} /> : <Send size={16} />}
        {saving ? "Wird gesendet..." : "An alle HVs senden"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function EventsAdminPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tab, setTab] = useState<"events" | "announcements">("events");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [ev, an] = await Promise.all([api.get("/events?past=true"), api.get("/announcements")]);
      setEvents(ev.data?.data || []);
      setAnnouncements(an.data?.data || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const del = async (type: "events" | "announcements", id: number) => {
    if (!confirm("Wirklich löschen?")) return;
    await api.delete(`/${type}/${id}`);
    load();
  };

  const upcoming = events.filter(e => new Date(e.startAt) >= new Date());
  const past = events.filter(e => new Date(e.startAt) < new Date());

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1000, margin: "0 auto", color: "#e2e8f0" }}>
      <style>{CSS}</style>

      {/* ═══ HEADER ═══ */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 28, animation: "evSlide 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "linear-gradient(135deg, #8b5cf6, #D4A843)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
            animation: "evGlow 4s ease infinite",
          }}>
            <Calendar size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{
              margin: 0, fontSize: "1.6rem", fontWeight: 900, letterSpacing: -1,
              background: "linear-gradient(135deg, #fff, #a78bfa)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Events & Ankündigungen
            </h1>
            <p style={{ color: "#506080", fontSize: "0.8rem", margin: "2px 0 0", fontWeight: 500 }}>
              {upcoming.length} kommende Events • {announcements.length} Ankündigungen aktiv
            </p>
          </div>
        </div>
        <button onClick={load} style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          color: "#506080", padding: 10, borderRadius: 10, cursor: "pointer",
        }}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ═══ TABS ═══ */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 24,
        background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 4,
        border: "1px solid rgba(255,255,255,0.05)",
      }}>
        {([
          { key: "events" as const, label: "Events", icon: Calendar, count: events.length, color: "#8b5cf6" },
          { key: "announcements" as const, label: "Ankündigungen", icon: Megaphone, count: announcements.length, color: "#D4A843" },
        ]).map(t => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: "0.85rem", transition: "all 0.15s",
              background: active ? `${t.color}12` : "transparent",
              color: active ? t.color : "#506080",
              boxShadow: active ? `0 0 20px ${t.color}10` : "none",
            }}>
              <Icon size={17} />
              {t.label}
              <span style={{
                fontSize: "0.7rem", padding: "2px 10px", borderRadius: 10,
                background: active ? `${t.color}15` : "rgba(255,255,255,0.04)",
                color: active ? t.color : "#506080", fontWeight: 800,
              }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ EVENTS TAB ═══ */}
      {tab === "events" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <CreateEventForm onCreated={load} />

          {upcoming.length > 0 && (
            <div style={{ fontSize: "0.7rem", color: "#506080", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, padding: "8px 0 0" }}>
              Kommende Events
            </div>
          )}

          {upcoming.map((e, i) => {
            const cfg = EVENT_TYPES.find(t => t.value === e.type) || EVENT_TYPES[5];
            return (
              <div key={e.id} className="ev-card" style={{
                display: "flex", alignItems: "center", gap: 16, padding: "18px 20px",
                borderRadius: 16, border: `1px solid ${cfg.color}15`,
                background: `linear-gradient(135deg, ${cfg.color}06, transparent)`,
                animation: `evSlide 0.4s ease ${i * 0.05}s both`,
              }}>
                {/* Date Badge */}
                <div style={{
                  width: 56, flexShrink: 0, textAlign: "center",
                  padding: "8px 0", borderRadius: 12,
                  background: `${cfg.color}10`, border: `1px solid ${cfg.color}20`,
                }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 900, color: cfg.color, lineHeight: 1 }}>
                    {new Date(e.startAt).getDate()}
                  </div>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: cfg.color, opacity: 0.7, textTransform: "uppercase" }}>
                    {new Date(e.startAt).toLocaleDateString("de-DE", { month: "short" })}
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: "1rem" }}>{cfg.emoji}</span>
                    <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{e.title}</span>
                  </div>
                  {e.description && <div style={{ fontSize: "0.78rem", color: "#71717a", marginBottom: 4, lineHeight: 1.4 }}>{e.description.slice(0, 100)}{e.description.length > 100 ? "..." : ""}</div>}
                  <div style={{ display: "flex", gap: 14, fontSize: "0.7rem", color: "#506080", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} /> {formatTime(e.startAt)} Uhr</span>
                    {e.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {e.location}</span>}
                    {e.isOnline && <span style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: 4 }}><Globe size={11} /> Online</span>}
                  </div>
                </div>

                {/* Participants */}
                <div style={{
                  textAlign: "center", flexShrink: 0, padding: "8px 14px",
                  borderRadius: 10, background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                    <Users size={13} style={{ color: "#D4A843" }} />
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#D4A843" }}>{e.participantCount}</span>
                  </div>
                  <div style={{ fontSize: "0.55rem", color: "#506080", fontWeight: 600 }}>
                    {e.maxParticipants ? `von ${e.maxParticipants}` : "Anmeld."}
                  </div>
                </div>

                {/* Delete */}
                <button className="ev-del" onClick={() => del("events", e.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 6 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}

          {past.length > 0 && (
            <>
              <div style={{ fontSize: "0.7rem", color: "#354168", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, padding: "12px 0 0" }}>
                Vergangene Events
              </div>
              {past.map(e => {
                const cfg = EVENT_TYPES.find(t => t.value === e.type) || EVENT_TYPES[5];
                return (
                  <div key={e.id} className="ev-card" style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                    borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)",
                    background: "rgba(255,255,255,0.01)", opacity: 0.5,
                  }}>
                    <span style={{ fontSize: "1rem" }}>{cfg.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, color: "#94a3b8", fontSize: "0.85rem" }}>{e.title}</span>
                      <span style={{ fontSize: "0.7rem", color: "#354168", marginLeft: 10 }}>{formatDate(e.startAt)}</span>
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "#354168" }}>{e.participantCount} Teilnehmer</span>
                    <button className="ev-del" onClick={() => del("events", e.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 6 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {events.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#354168" }}>
              <Calendar size={40} style={{ margin: "0 auto 12px", opacity: 0.3, display: "block" }} />
              <div style={{ fontWeight: 700, color: "#506080" }}>Noch keine Events</div>
              <div style={{ fontSize: "0.8rem", marginTop: 4 }}>Erstelle dein erstes Event für das Team</div>
            </div>
          )}
        </div>
      )}

      {/* ═══ ANNOUNCEMENTS TAB ═══ */}
      {tab === "announcements" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <CreateAnnouncementForm onCreated={load} />

          {announcements.map((a, i) => {
            const prio = PRIORITIES.find(p => p.value === a.priority) || PRIORITIES[1];
            const PIcon = prio.icon;
            return (
              <div key={a.id} className="ev-card" style={{
                padding: "18px 20px", borderRadius: 16,
                background: `linear-gradient(135deg, ${prio.color}06, transparent)`,
                border: `1px solid ${prio.color}15`,
                borderLeft: `4px solid ${prio.color}`,
                animation: `evSlide 0.4s ease ${i * 0.05}s both`,
                position: "relative",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: `${prio.color}12`, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <PIcon size={18} style={{ color: prio.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{a.title}</span>
                      <span style={{
                        fontSize: "0.6rem", fontWeight: 800, padding: "2px 10px", borderRadius: 6,
                        background: `${prio.color}12`, color: prio.color, letterSpacing: 0.5,
                      }}>
                        {prio.label.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.6 }}>{a.content}</div>
                    <div style={{ display: "flex", gap: 12, fontSize: "0.68rem", color: "#354168", marginTop: 8 }}>
                      <span>{a.createdBy?.name}</span>
                      <span>{timeAgo(a.createdAt)}</span>
                    </div>
                  </div>
                  <button className="ev-del" onClick={() => del("announcements", a.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 6 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {announcements.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#354168" }}>
              <Megaphone size={40} style={{ margin: "0 auto 12px", opacity: 0.3, display: "block" }} />
              <div style={{ fontWeight: 700, color: "#506080" }}>Keine Ankündigungen</div>
              <div style={{ fontSize: "0.8rem", marginTop: 4 }}>Sende eine Nachricht an dein HV-Team</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
