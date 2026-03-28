/**
 * D2D Sales Pipeline — Gamified Lead Management + HV Leaderboard
 */
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "./hooks/useEnterpriseApi";
import { useAuth } from "../../pages/AuthContext";
import { impactMedium, notificationSuccess, notificationError } from "../../lib/haptics";

import { API_BASE as API } from "../../lib/apiBase";

// ══ Count-Up Hook ══
function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target === prev.current) return;
    const start = prev.current;
    const diff = target - start;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(start + diff * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prev.current = target;
  }, [target, duration]);
  return val;
}

function CountUp({ to, d = 1400 }: { to: number; d?: number }) {
  return <>{useCountUp(to, d).toLocaleString("de-DE")}</>;
}

// ══ Types ══
interface Lead {
  id: string; timestamp: string; status: string; name: string;
  email: string; phone: string; plz: string; ort: string;
  strasse: string; hausNr: string; hausart: string; dachform: string;
  stromverbrauch: number; notes?: string; assignedToId?: number;
  signatureStatus?: string; documentFilename?: string;
  eigentuemer?: string; waermepumpe?: string; _restricted?: boolean;
}
interface HvEntry {
  userId: number; name: string; role: string; firmenName: string | null;
  oberHvId: number | null; total: number; neu: number;
  kontaktiert: number; qualifiziert: number; disqualifiziert: number;
}

const ROLES: Record<string, { label: string; color: string }> = {
  HV_LEITER: { label: "Vice President", color: "#D4A843" },
  HV_TEAMLEITER: { label: "Director", color: "#3b82f6" },
  HV_LEADER: { label: "Leader", color: "#8b5cf6" },
  HANDELSVERTRETER: { label: "Member", color: "#64748b" },
};

const PIPE = [
  { key: "neu",             label: "Zu Kontaktieren", color: "#f59e0b", glow: "rgba(245,158,11,0.15)" },
  { key: "kontaktiert",     label: "Kontaktiert",     color: "#3b82f6", glow: "rgba(59,130,246,0.15)" },
  { key: "qualifiziert",    label: "Qualifiziert",    color: "#10b981", glow: "rgba(16,185,129,0.15)" },
  { key: "disqualifiziert", label: "Disqualifiziert", color: "#ef4444", glow: "rgba(239,68,68,0.15)" },
];

const HA: Record<string, string> = { efh: "Einfamilienhaus", mfh: "Mehrfamilienhaus", gewerbe: "Gewerbe", gewerblich: "Gewerbe" };
const DA: Record<string, string> = { satteldach: "Satteldach", flachdach: "Flachdach", pultdach: "Pultdach" };

function ago(ts: string) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 60) return `${m || 1}m`; const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`; const d = Math.floor(h / 24);
  return d < 30 ? `${d}d` : `${Math.floor(d / 30)}mo`;
}

// ══ Component ══
type Tab = "pipeline" | "ranking";

export default function D2DLeadsPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  // Filter aus URL lesen (funktioniert mit HashRouter + BrowserRouter)
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get("filter") || new URLSearchParams(window.location.hash.split("?")[1] || "").get("filter");
  const [tab, setTab] = useState<Tab>("pipeline");
  const [filter, setFilter] = useState<string | null>(initialFilter);

  // Filter aktualisieren wenn sich URL ändert (z.B. von Dashboard-KPI Klick)
  useEffect(() => {
    const f = searchParams.get("filter") || new URLSearchParams(window.location.hash.split("?")[1] || "").get("filter");
    if (f && f !== filter) { setFilter(f); setTab("pipeline"); }
  }, [searchParams]);
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: ld, isLoading } = useQuery<{ data: Lead[]; stats: any }>({
    queryKey: ["d2d-leads"], queryFn: () => fetchApi(`${API}/wizard/leads`),
    staleTime: 15_000, refetchInterval: 30_000,
  });
  const leads = ld?.data || [];
  const st = ld?.stats || {};

  const { data: bd } = useQuery<{ data: HvEntry[]; unassigned: number }>({
    queryKey: ["d2d-board"], queryFn: () => fetchApi(`${API}/wizard/leads-leaderboard`),
    staleTime: 30_000,
  });
  const hvs = bd?.data || [];
  const unassigned = bd?.unassigned || 0;

  const filtered = useMemo(() => {
    let r = [...leads];
    if (filter) r = r.filter(l => (l.status || "neu") === filter);
    if (search) { const q = search.toLowerCase(); r = r.filter(l => [l.name, l.plz, l.email, l.phone, l.ort].some(f => (f || "").toLowerCase().includes(q))); }
    return r;
  }, [leads, filter, search]);

  const [celebration, setCelebration] = useState<{ type: string; color: string } | null>(null);

  const mut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetchApi(`${API}/wizard/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["d2d-leads"] });
      qc.invalidateQueries({ queryKey: ["d2d-board"] });
      // Haptics + Celebration
      if (vars.status === "qualifiziert") {
        notificationSuccess();
        setCelebration({ type: "qualifiziert", color: "#10b981" });
      } else if (vars.status === "disqualifiziert") {
        notificationError();
        setCelebration({ type: "disqualifiziert", color: "#ef4444" });
      } else {
        impactMedium();
        setCelebration({ type: vars.status, color: PIPE.find(p => p.key === vars.status)?.color || "#D4A843" });
      }
      setTimeout(() => setCelebration(null), 2000);
    },
  });

  const detail = detailId ? leads.find(l => l.id === detailId) : null;
  const counts = PIPE.map(p => ({ ...p, n: p.key === "disqualifiziert" ? (st.disqualifiziert || 0) + (st.abgelehnt || 0) : (st[p.key] || 0) }));

  return (
    <div className="sp">
      <style>{CSS}</style>

      {/* ══ Celebration Overlay ══ */}
      {celebration && (
        <div className="sp-celebrate" style={{ "--cc": celebration.color } as any}>
          <div className="sp-celebrate-inner">
            {celebration.type === "qualifiziert" && <>
              <div className="sp-celebrate-icon">🎉</div>
              <div className="sp-celebrate-text">Qualifiziert!</div>
              <div className="sp-celebrate-sub">Lead erfolgreich qualifiziert</div>
            </>}
            {celebration.type === "disqualifiziert" && <>
              <div className="sp-celebrate-icon">✕</div>
              <div className="sp-celebrate-text">Disqualifiziert</div>
            </>}
            {celebration.type === "kontaktiert" && <>
              <div className="sp-celebrate-icon">📞</div>
              <div className="sp-celebrate-text">Kontaktiert!</div>
              <div className="sp-celebrate-sub">Weiter so — qualifizieren!</div>
            </>}
            {celebration.type === "neu" && <>
              <div className="sp-celebrate-icon">⚡</div>
              <div className="sp-celebrate-text">Zuruck in Pipeline</div>
            </>}
            {/* Confetti particles for qualifiziert */}
            {celebration.type === "qualifiziert" && Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="sp-confetti" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                background: ["#D4A843", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"][i % 5],
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ══ Hero Header ══ */}
      <div className="sp-hero">
        <div className="sp-hero-left">
          <div className="sp-hero-icon">
            <div className="sp-ring sp-ring1" />
            <div className="sp-ring sp-ring2" />
            <span>⚡</span>
          </div>
          <div>
            <h1 className="sp-title">Sales Pipeline</h1>
            <p className="sp-sub"><CountUp to={st.total || 0} d={1800} /> Leads · {hvs.length} Handelsvertreter</p>
          </div>
        </div>
        <div className="sp-hero-right">
          <div className="sp-tab-toggle">
            {([["pipeline", "Pipeline"], ["ranking", "HV Ranking"]] as const).map(([k, l]) => (
              <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
          {tab === "pipeline" && (
            <div className="sp-search-w">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sp-search-i"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input className="sp-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..." />
              {search && <button className="sp-search-x" onClick={() => setSearch("")}>x</button>}
            </div>
          )}
          <button className="sp-cta" onClick={() => nav("/lead/new")}>+ Neuer Lead</button>
        </div>
      </div>

      {/* ══ FUNNEL PIPELINE ══ */}
      <div className="sp-funnel">
        {/* Total bar */}
        <div className="sp-funnel-total" onClick={() => { setFilter(null); setTab("pipeline"); }}>
          <div className="sp-funnel-total-inner">
            <div className="sp-funnel-total-n"><CountUp to={st.total || 0} d={2000} /></div>
            <div className="sp-funnel-total-l">Leads gesamt</div>
          </div>
          <div className="sp-funnel-total-glow" />
        </div>

        {/* Stage cards */}
        <div className="sp-stages">
          {counts.map((c, i) => {
            const total = st.total || 1;
            const pct = total > 0 ? Math.round((c.n / total) * 100) : 0;
            const prevN = i > 0 ? counts[i - 1].n : total;
            const convRate = prevN > 0 && i > 0 ? Math.round((c.n / prevN) * 100) : null;
            const barW = total > 0 ? Math.max((c.n / total) * 100, 2) : 2;
            const isActive = filter === c.key;

            return (
              <div key={c.key} className="sp-stage-wrap" style={{ animationDelay: `${i * 80}ms` } as any}>
                {/* Conversion arrow */}
                {i > 0 && (
                  <div className="sp-conv">
                    <svg width="24" height="32" viewBox="0 0 24 32"><path d="M12 0v24m0 0l-6-6m6 6l6-6" stroke={c.color} strokeWidth="1.5" fill="none" opacity="0.3" /></svg>
                    {convRate !== null && <span className="sp-conv-rate" style={{ color: c.color }}>{convRate}%</span>}
                  </div>
                )}

                <div className={`sp-stage${isActive ? " on" : ""}`} style={{ "--sc": c.color, "--sg": c.glow } as any}
                  onClick={() => { setFilter(f => f === c.key ? null : c.key); setTab("pipeline"); }}>

                  {/* Left: color indicator */}
                  <div className="sp-stage-ind" />

                  {/* Main content */}
                  <div className="sp-stage-body">
                    <div className="sp-stage-top">
                      <span className="sp-stage-label">{c.label}</span>
                      <span className="sp-stage-pct">{pct}%</span>
                    </div>
                    <div className="sp-stage-n"><CountUp to={c.n} d={1600} /></div>

                    {/* Progress bar */}
                    <div className="sp-stage-bar-bg">
                      <div className="sp-stage-bar-fill" style={{ width: `${barW}%` }} />
                    </div>
                  </div>

                  {/* Pulse for first stage */}
                  {i === 0 && c.n > 0 && <div className="sp-stage-pulse" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ TAB: PIPELINE ══ */}
      {tab === "pipeline" && (
        <div className="sp-body">
          <div className="sp-list-area">
            {filter && <div className="sp-chip">{PIPE.find(p => p.key === filter)?.label} ({filtered.length}) <button onClick={() => setFilter(null)}>x</button></div>}

            {isLoading && <div className="sp-empty"><div className="sp-spinner" /> Leads werden geladen...</div>}
            {!isLoading && filtered.length === 0 && (
              <div className="sp-empty">
                <div className="sp-empty-icon">📭</div>
                {filter ? "Keine Leads mit diesem Status" : "Noch keine Leads erfasst"}
                {filter && <button className="sp-reset" onClick={() => setFilter(null)}>Filter aufheben</button>}
              </div>
            )}

            {!isLoading && filtered.map((lead, i) => {
              const p = PIPE.find(x => x.key === (lead.status || "neu")) || PIPE[0];
              const active = detailId === lead.id;
              return (
                <div key={lead.id} className={`sp-card${active ? " on" : ""}`} style={{ animationDelay: `${Math.min(i, 20) * 30}ms` } as any}
                  onClick={() => setDetailId(active ? null : lead.id)}>
                  <div className="sp-card-indicator" style={{ background: p.color }} />
                  <div className="sp-card-body">
                    <div className="sp-card-top">
                      <span className="sp-card-name">{lead.name || "–"}</span>
                      <span className="sp-card-badge" style={{ color: p.color, background: p.glow }}>{p.label}</span>
                    </div>
                    <div className="sp-card-bot">
                      <span>{[lead.plz, lead.ort].filter(Boolean).join(" ") || "–"}</span>
                      {lead.hausart && <span className="sp-card-tag">{HA[lead.hausart] || lead.hausart}</span>}
                      <span className="sp-card-ago">{ago(lead.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Side Panel */}
          <div className="sp-detail-desktop">
            <div className={`sp-detail${detail ? " open" : ""}`}>
              {detail && <Detail lead={detail} onStatus={(id, s) => mut.mutate({ id, status: s })} onClose={() => setDetailId(null)} />}
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Full-Screen Sheet */}
      {detail && (
        <div className="sp-sheet-overlay" onClick={() => setDetailId(null)}>
          <div className="sp-sheet" onClick={e => e.stopPropagation()}>
            <div className="sp-sheet-handle" />
            <Detail lead={detail} onStatus={(id, s) => mut.mutate({ id, status: s })} onClose={() => setDetailId(null)} />
          </div>
        </div>
      )}

      {/* ══ TAB: HV RANKING ══ */}
      {tab === "ranking" && (
        <div className="sp-ranking">
          {unassigned > 0 && (
            <div className="sp-warn">
              <div className="sp-warn-icon">⚠</div>
              <div><strong>{unassigned} Leads</strong> noch keinem HV zugewiesen</div>
            </div>
          )}

          {/* Podium (Top 3) */}
          {hvs.length >= 3 && (
            <div className="sp-podium">
              {[1, 0, 2].map(idx => {
                const hv = hvs[idx];
                if (!hv) return null;
                const rc = ROLES[hv.role] || ROLES.HANDELSVERTRETER;
                const isFirst = idx === 0;
                const heights = ["140px", "100px", "80px"];
                const initials = (hv.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={hv.userId} className="sp-pod" style={{ animationDelay: `${[200, 0, 400][idx]}ms` } as any}>
                    <div className="sp-pod-avatar" style={{ "--rc": rc.color } as any}>
                      {isFirst && <div className="sp-pod-crown">👑</div>}
                      <div className="sp-pod-ring" />
                      <div className="sp-pod-initials">{initials}</div>
                    </div>
                    <div className="sp-pod-name">{hv.name}</div>
                    <div className="sp-pod-role" style={{ color: rc.color }}>{rc.label}</div>
                    {hv.firmenName && <div className="sp-pod-firm">{hv.firmenName}</div>}
                    <div className="sp-pod-leads"><CountUp to={hv.total} d={1800} /></div>
                    <div className="sp-pod-label">Leads</div>
                    <div className="sp-pod-base" style={{ height: heights[idx], background: `linear-gradient(180deg, ${rc.color}20, ${rc.color}05)`, borderColor: `${rc.color}30` }}>
                      <div className="sp-pod-rank">#{idx + 1}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full List */}
          <div className="sp-hv-list">
            {hvs.map((hv, i) => {
              const rc = ROLES[hv.role] || ROLES.HANDELSVERTRETER;
              return (
                <div key={hv.userId} className="sp-hv" style={{ animationDelay: `${i * 50}ms` } as any}>
                  <div className="sp-hv-rank" style={{ color: i < 3 ? "#D4A843" : "#475569" }}>#{i + 1}</div>
                  <div className="sp-hv-avatar" style={{ background: `${rc.color}15`, borderColor: `${rc.color}30` }}>
                    {(hv.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="sp-hv-info">
                    <div className="sp-hv-name">{hv.name}</div>
                    <div className="sp-hv-meta">
                      <span className="sp-hv-role-badge" style={{ color: rc.color, background: `${rc.color}12` }}>{rc.label}</span>
                      {hv.firmenName && <span className="sp-hv-firm">{hv.firmenName}</span>}
                    </div>
                  </div>
                  <div className="sp-hv-counts">
                    {[
                      { n: hv.neu, c: "#f59e0b", l: "Neu" },
                      { n: hv.kontaktiert, c: "#3b82f6", l: "Kont." },
                      { n: hv.qualifiziert, c: "#10b981", l: "Qual." },
                    ].map(b => (
                      <div key={b.l} className="sp-hv-count">
                        <div style={{ color: b.c, fontWeight: 800, fontSize: 16 }}>{b.n}</div>
                        <div style={{ fontSize: 8, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{b.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="sp-hv-total">
                    <div className="sp-hv-total-n">{hv.total}</div>
                    <div className="sp-hv-total-l">Leads</div>
                  </div>
                </div>
              );
            })}
            {hvs.length === 0 && <div className="sp-empty" style={{ padding: 40 }}>Keine Handelsvertreter registriert</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ══ Detail Panel ══
type DetTab = "info" | "dokumente";

function Detail({ lead, onStatus, onClose }: { lead: Lead; onStatus: (id: string, s: string) => void; onClose: () => void }) {
  const p = PIPE.find(x => x.key === (lead.status || "neu")) || PIPE[0];
  const [tab, setTab] = useState<DetTab>("info");
  const hasPdf = !!lead.documentFilename;
  const isRestricted = !!(lead as any)._restricted;
  const pdfUrl = `${API}/wizard/leads/${lead.id}/document`;

  return (
    <div className="sp-det">
      {/* Header with gradient */}
      <div className="sp-det-hero" style={{ "--dc": p.color } as any}>
        <button className="sp-det-x" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div className="sp-det-avatar" style={{ background: `${p.color}20`, borderColor: `${p.color}40` }}>
          {(lead.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <h2 className="sp-det-name">{lead.name || "–"}</h2>
        <div className="sp-det-meta">
          <span className="sp-det-badge" style={{ color: p.color, background: `${p.color}18`, borderColor: `${p.color}30` }}>{p.label}</span>
          {lead.signatureStatus === "signed" && <span className="sp-det-badge" style={{ color: "#10b981", background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.25)" }}>Unterschrieben</span>}
          {isRestricted && <span className="sp-det-badge" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.25)" }}>Eingeschrankt</span>}
        </div>
        <div className="sp-det-time">{new Date(lead.timestamp).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
      </div>

      {/* Quick Actions */}
      <div className="sp-det-actions">
        {PIPE.filter(x => x.key !== (lead.status || "neu")).map(x => (
          <button key={x.key} className="sp-act" style={{ "--ac": x.color } as any} onClick={() => onStatus(lead.id, x.key)}>{x.label}</button>
        ))}
      </div>

      {/* Tabs */}
      <div className="sp-det-tabs">
        <button className={tab === "info" ? "on" : ""} onClick={() => setTab("info")}>Informationen</button>
        <button className={tab === "dokumente" ? "on" : ""} onClick={() => setTab("dokumente")}>
          Dokumente {hasPdf && <span className="sp-det-tab-dot" />}
        </button>
      </div>

      {/* Tab: Info */}
      {tab === "info" && (
        <div className="sp-det-body">
          {/* Kontakt */}
          {!isRestricted && (lead.email || lead.phone) && (
            <div className="sp-det-section">
              <div className="sp-det-section-title">Kontakt</div>
              {lead.email && (
                <div className="sp-det-field">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>
                  <a href={`mailto:${lead.email}`} className="sp-det-link">{lead.email}</a>
                </div>
              )}
              {lead.phone && (
                <div className="sp-det-field">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  <a href={`tel:${lead.phone}`} className="sp-det-link">{lead.phone}</a>
                </div>
              )}
            </div>
          )}

          {/* Adresse */}
          <div className="sp-det-section">
            <div className="sp-det-section-title">Standort</div>
            <div className="sp-det-grid">
              {!isRestricted && lead.strasse && <R l="Strasse" v={[lead.strasse, lead.hausNr].filter(Boolean).join(" ")} />}
              <R l="PLZ / Ort" v={[lead.plz, lead.ort].filter(Boolean).join(" ") || "–"} />
              {lead.eigentuemer && <R l="Eigentumer" v={lead.eigentuemer === "ja" ? "Ja" : "Nein"} />}
            </div>
          </div>

          {/* Gebaude */}
          <div className="sp-det-section">
            <div className="sp-det-section-title">Gebaude & Verbrauch</div>
            <div className="sp-det-grid">
              <R l="Hausart" v={HA[lead.hausart] || lead.hausart || "–"} />
              <R l="Dachform" v={DA[lead.dachform] || lead.dachform || "–"} />
              {lead.stromverbrauch > 0 && <R l="Stromverbrauch" v={`${lead.stromverbrauch.toLocaleString("de-DE")} kWh/Jahr`} />}
              {lead.waermepumpe && <R l="Warmepumpe" v={lead.waermepumpe === "ja" ? "Ja" : lead.waermepumpe === "nein" ? "Nein" : lead.waermepumpe} />}
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="sp-det-section">
              <div className="sp-det-section-title">Notizen</div>
              <div className="sp-det-notes-body">{lead.notes}</div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Dokumente */}
      {tab === "dokumente" && (
        <div className="sp-det-body">
          {hasPdf ? (
            <div className="sp-det-section">
              <div className="sp-det-doc">
                <div className="sp-det-doc-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M10 13h4M10 17h4M8 9h2"/></svg>
                </div>
                <div className="sp-det-doc-info">
                  <div className="sp-det-doc-name">Zusammenfassung</div>
                  <div className="sp-det-doc-meta">{lead.documentFilename}</div>
                </div>
                <a href={pdfUrl} target="_blank" rel="noopener" className="sp-det-doc-dl">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
                  PDF
                </a>
              </div>

              {lead.signatureStatus === "signed" && (
                <div className="sp-det-doc" style={{ marginTop: 8 }}>
                  <div className="sp-det-doc-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9 12l2 2 4-4"/></svg>
                  </div>
                  <div className="sp-det-doc-info">
                    <div className="sp-det-doc-name">Unterschrift</div>
                    <div className="sp-det-doc-meta">Digital signiert</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="sp-empty" style={{ padding: 40 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
              Keine Dokumente vorhanden
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function R({ l, v }: { l: string; v: string }) {
  return <div className="sp-r"><span className="sp-r-l">{l}</span><span className="sp-r-v">{v}</span></div>;
}

// ══ Styles ══
const CSS = `
.sp{min-height:100vh;background:#060b18;color:#e2e8f0;font-family:'Inter','DM Sans',sans-serif}

/* ── Hero ── */
.sp-hero{display:flex;align-items:center;justify-content:space-between;padding:24px 28px 16px;flex-wrap:wrap;gap:16px}
.sp-hero-left{display:flex;align-items:center;gap:16px}
.sp-hero-icon{position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:24px}
.sp-ring{position:absolute;inset:-4px;border-radius:50%;border:2px solid transparent}
.sp-ring1{border-color:rgba(212,168,67,0.3);animation:spRing 3s linear infinite}
.sp-ring2{border-color:rgba(212,168,67,0.15);animation:spRing 5s linear infinite reverse;inset:-10px}
@keyframes spRing{to{transform:rotate(360deg)}}
.sp-title{font-size:24px;font-weight:900;color:#f1f5f9;letter-spacing:-0.04em;margin:0;background:linear-gradient(135deg,#f1f5f9,#D4A843);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-size:200% 200%;animation:spShimmer 4s ease infinite}
@keyframes spShimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.sp-sub{font-size:12px;color:#64748b;margin:4px 0 0;font-variant-numeric:tabular-nums}
.sp-hero-right{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.sp-tab-toggle{display:flex;gap:2px;background:rgba(255,255,255,0.03);border-radius:10px;padding:3px;border:1px solid rgba(255,255,255,0.06)}
.sp-tab-toggle button{padding:8px 20px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;color:#64748b;background:transparent;font-family:inherit;transition:all .15s}
.sp-tab-toggle button.on{background:rgba(212,168,67,0.12);color:#D4A843;box-shadow:0 0 12px rgba(212,168,67,0.1)}
.sp-search-w{position:relative;width:260px}
.sp-search-i{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#475569}
.sp-search{width:100%;padding:9px 32px 9px 36px;background:rgba(15,15,25,0.9);border:1px solid rgba(255,255,255,0.06);border-radius:10px;color:#e2e8f0;font-size:13px;outline:none;font-family:inherit;box-sizing:border-box}
.sp-search:focus{border-color:rgba(212,168,67,0.25)}
.sp-search-x{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.15);color:#ef4444;border-radius:6px;padding:2px 8px;font-size:11px;cursor:pointer;font-weight:700}
.sp-cta{padding:10px 22px;background:linear-gradient(135deg,#D4A843,#EAD068);border:none;border-radius:10px;color:#060b18;font-size:13px;font-weight:800;cursor:pointer;text-decoration:none;font-family:inherit;box-shadow:0 4px 20px rgba(212,168,67,0.25);transition:all .2s}
.sp-cta:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(212,168,67,0.35)}

/* ── Funnel Pipeline ── */
.sp-funnel{padding:0 28px 20px}
.sp-funnel-total{position:relative;text-align:center;padding:20px;border-radius:16px;background:linear-gradient(135deg,rgba(212,168,67,0.06),rgba(212,168,67,0.02));border:1px solid rgba(212,168,67,0.12);cursor:pointer;transition:all .2s;overflow:hidden;margin-bottom:8px}
.sp-funnel-total:hover{border-color:rgba(212,168,67,0.25);transform:translateY(-1px)}
.sp-funnel-total-inner{position:relative;z-index:1}
.sp-funnel-total-n{font-size:52px;font-weight:900;color:#D4A843;letter-spacing:-2px;line-height:1;font-variant-numeric:tabular-nums;text-shadow:0 0 40px rgba(212,168,67,0.25)}
.sp-funnel-total-l{font-size:11px;font-weight:700;color:#D4A843;opacity:0.7;margin-top:6px;letter-spacing:2px;text-transform:uppercase}
.sp-funnel-total-glow{position:absolute;top:50%;left:50%;width:200px;height:200px;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(212,168,67,0.08) 0%,transparent 70%);pointer-events:none}

.sp-stages{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
@keyframes spSlide{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.sp-stage-wrap{display:flex;flex-direction:column;align-items:center;animation:spSlide .5s ease both}

/* Conversion arrows */
.sp-conv{display:flex;flex-direction:column;align-items:center;gap:0;padding:4px 0;height:48px;justify-content:center}
.sp-conv-rate{font-size:11px;font-weight:800;font-variant-numeric:tabular-nums;margin-top:-4px}

/* Stage card */
.sp-stage{position:relative;display:flex;gap:0;width:100%;border-radius:14px;cursor:pointer;transition:all .25s;border:1.5px solid rgba(255,255,255,0.04);background:rgba(15,23,42,0.5);overflow:hidden}
.sp-stage:hover{border-color:color-mix(in srgb,var(--sc) 30%,transparent);transform:translateY(-2px);box-shadow:0 8px 28px var(--sg)}
.sp-stage.on{border-color:var(--sc);background:var(--sg);box-shadow:0 0 28px var(--sg)}

.sp-stage-ind{width:5px;flex-shrink:0;background:var(--sc);border-radius:14px 0 0 14px}
.sp-stage-body{flex:1;padding:16px 16px 14px}
.sp-stage-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.sp-stage-label{font-size:11px;font-weight:800;color:var(--sc);letter-spacing:0.5px;text-transform:uppercase}
.sp-stage-pct{font-size:20px;font-weight:900;color:var(--sc);opacity:0.5;font-variant-numeric:tabular-nums}
.sp-stage-n{font-size:38px;font-weight:900;color:#f1f5f9;letter-spacing:-1.5px;line-height:1;font-variant-numeric:tabular-nums;margin-bottom:10px;text-shadow:0 0 20px color-mix(in srgb,var(--sc) 15%,transparent)}

/* Progress bar */
.sp-stage-bar-bg{height:6px;border-radius:3px;background:rgba(255,255,255,0.04);overflow:hidden}
.sp-stage-bar-fill{height:100%;border-radius:3px;background:var(--sc);box-shadow:0 0 8px var(--sc);transition:width 1.2s cubic-bezier(.22,1,.36,1)}

.sp-stage-pulse{position:absolute;top:10px;right:10px;width:10px;height:10px;border-radius:50%;background:var(--sc);box-shadow:0 0 10px var(--sc);animation:spPulse 2s infinite}
@keyframes spPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.4)}}

/* ── Body (Pipeline tab) ── */
.sp-body{display:flex;padding:0 28px 28px;gap:0;min-height:calc(100vh - 280px)}
.sp-list-area{flex:1;min-width:0;padding-right:16px}
.sp-detail-desktop{display:block}
.sp-detail{width:0;overflow:hidden;transition:width .25s;flex-shrink:0}
.sp-detail.open{width:440px;padding-left:0;border-left:1px solid rgba(255,255,255,0.04)}

/* Mobile Sheet */
.sp-sheet-overlay{display:none}
@media(max-width:768px){
  .sp-detail-desktop{display:none!important}
  .sp-sheet-overlay{display:flex;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);align-items:flex-end;animation:spSheetBgIn .2s ease}
  .sp-sheet{width:100%;max-height:92vh;background:#0d1321;border-radius:20px 20px 0 0;overflow-y:auto;animation:spSheetUp .3s cubic-bezier(.22,1,.36,1);padding-bottom:env(safe-area-inset-bottom)}
  .sp-sheet-handle{width:40px;height:4px;border-radius:2px;background:rgba(255,255,255,0.15);margin:10px auto 6px}
}
@keyframes spSheetBgIn{from{opacity:0}to{opacity:1}}
@keyframes spSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sp-chip{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.15);border-radius:20px;font-size:12px;color:#D4A843;font-weight:600;margin-bottom:12px}
.sp-chip button{background:none;border:none;color:#D4A843;cursor:pointer;font-size:14px;padding:0 2px;font-weight:700}

.sp-card{display:flex;align-items:stretch;gap:0;border-radius:12px;cursor:pointer;transition:all .15s;margin-bottom:5px;border:1px solid rgba(255,255,255,0.03);background:rgba(15,23,42,0.5);overflow:hidden;animation:spSlide .4s ease both}
.sp-card:hover{background:rgba(15,23,42,0.7);border-color:rgba(212,168,67,0.08);transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,0.2)}
.sp-card.on{background:rgba(212,168,67,0.06);border-color:rgba(212,168,67,0.15)}
.sp-card-indicator{width:4px;flex-shrink:0;border-radius:4px 0 0 4px}
.sp-card-body{flex:1;padding:14px 16px;min-width:0}
.sp-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px}
.sp-card-name{font-size:14px;font-weight:700;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sp-card-badge{font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;flex-shrink:0;letter-spacing:0.2px}
.sp-card-bot{display:flex;gap:10px;font-size:11px;color:#64748b}
.sp-card-tag{color:#94a3b8;font-weight:500}
.sp-card-ago{margin-left:auto;flex-shrink:0;font-variant-numeric:tabular-nums;font-family:'DM Mono',monospace;font-size:10px}

/* ── Detail Panel ── */
.sp-det{display:flex;flex-direction:column;height:100%;overflow-y:auto}
.sp-det::-webkit-scrollbar{width:3px}.sp-det::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:3px}

.sp-det-hero{position:relative;padding:24px 20px 20px;background:linear-gradient(180deg,color-mix(in srgb,var(--dc) 8%,transparent),transparent);border-bottom:1px solid rgba(255,255,255,0.04)}
.sp-det-x{position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#94a3b8;border-radius:10px;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.sp-det-x:hover{background:rgba(239,68,68,0.1);color:#ef4444;border-color:rgba(239,68,68,0.2)}
.sp-det-avatar{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#e2e8f0;border:2px solid;margin-bottom:12px}
.sp-det-name{font-size:20px;font-weight:900;color:#f1f5f9;margin:0 0 8px;letter-spacing:-0.03em}
.sp-det-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.sp-det-badge{font-size:10px;font-weight:700;padding:3px 12px;border-radius:20px;border:1px solid}
.sp-det-time{font-size:11px;color:#475569;font-variant-numeric:tabular-nums}

.sp-det-actions{display:flex;flex-wrap:wrap;gap:6px;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.04)}
.sp-act{padding:8px 16px;border-radius:10px;border:1px solid color-mix(in srgb,var(--ac) 25%,transparent);background:color-mix(in srgb,var(--ac) 6%,transparent);color:var(--ac);font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit}
.sp-act:hover{background:color-mix(in srgb,var(--ac) 14%,transparent);transform:translateY(-1px);box-shadow:0 4px 12px color-mix(in srgb,var(--ac) 15%,transparent)}

.sp-det-tabs{display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,0.04)}
.sp-det-tabs button{flex:1;padding:12px 16px;background:none;border:none;border-bottom:2px solid transparent;color:#64748b;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px}
.sp-det-tabs button.on{color:#D4A843;border-bottom-color:#D4A843}
.sp-det-tabs button:hover:not(.on){color:#94a3b8}
.sp-det-tab-dot{width:6px;height:6px;border-radius:50%;background:#10b981}

.sp-det-body{padding:16px 20px;flex:1}
.sp-det-section{margin-bottom:20px}
.sp-det-section-title{font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.04)}
.sp-det-grid{display:flex;flex-direction:column}
.sp-det-field{display:flex;align-items:center;gap:10px;padding:8px 0}
.sp-det-link{color:#D4A843;text-decoration:none;font-size:13px;font-weight:500}
.sp-det-link:hover{text-decoration:underline}

.sp-r{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.025)}
.sp-r-l{font-size:12px;color:#64748b;font-weight:500}
.sp-r-v{font-size:13px;color:#e2e8f0;font-weight:600;text-align:right;max-width:60%;word-break:break-all}

.sp-det-notes-body{font-size:13px;color:#cbd5e1;line-height:1.6;padding:12px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid rgba(255,255,255,0.04)}

/* Document card */
.sp-det-doc{display:flex;align-items:center;gap:14px;padding:14px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;transition:all .15s}
.sp-det-doc:hover{background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.1)}
.sp-det-doc-icon{flex-shrink:0;width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:rgba(239,68,68,0.06);border-radius:10px}
.sp-det-doc-info{flex:1;min-width:0}
.sp-det-doc-name{font-size:13px;font-weight:700;color:#e2e8f0}
.sp-det-doc-meta{font-size:10px;color:#64748b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sp-det-doc-dl{display:flex;align-items:center;gap:6px;padding:8px 14px;background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.2);border-radius:8px;color:#D4A843;font-size:11px;font-weight:700;text-decoration:none;flex-shrink:0;transition:all .15s}
.sp-det-doc-dl:hover{background:rgba(212,168,67,0.15);transform:translateY(-1px)}

/* ── Ranking Tab ── */
.sp-ranking{padding:0 28px 28px}
.sp-warn{display:flex;align-items:center;gap:12px;padding:14px 20px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:12px;margin-bottom:20px;font-size:13px;color:#f59e0b}
.sp-warn-icon{font-size:20px}

/* Podium */
.sp-podium{display:flex;align-items:flex-end;justify-content:center;gap:12px;padding:20px 0 32px;margin-bottom:20px}
.sp-pod{display:flex;flex-direction:column;align-items:center;animation:spSlide .6s ease both;min-width:120px}
.sp-pod-avatar{position:relative;width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:10px}
.sp-pod-ring{position:absolute;inset:-4px;border-radius:50%;border:2px solid var(--rc,#D4A843);animation:spRing 4s linear infinite;opacity:0.5}
.sp-pod-initials{font-size:20px;font-weight:900;color:var(--rc,#D4A843);z-index:1}
.sp-pod-crown{position:absolute;top:-18px;font-size:22px;filter:drop-shadow(0 0 6px rgba(255,215,0,0.5));animation:spFloat 2.5s ease-in-out infinite}
@keyframes spFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.sp-pod-name{font-size:14px;font-weight:800;color:#f1f5f9;margin-bottom:2px;text-align:center}
.sp-pod-role{font-size:10px;font-weight:700;margin-bottom:2px}
.sp-pod-firm{font-size:10px;color:#64748b;margin-bottom:6px}
.sp-pod-leads{font-size:28px;font-weight:900;color:#D4A843;line-height:1;text-shadow:0 0 16px rgba(212,168,67,0.3)}
.sp-pod-label{font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.sp-pod-base{width:100%;border-radius:12px 12px 0 0;border:1px solid;border-bottom:none;display:flex;align-items:flex-end;justify-content:center;padding-bottom:12px}
.sp-pod-rank{font-size:32px;font-weight:900;color:rgba(255,255,255,0.08)}

/* HV List */
.sp-hv-list{display:flex;flex-direction:column;gap:6px}
.sp-hv{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:14px;background:rgba(15,23,42,0.5);border:1px solid rgba(255,255,255,0.04);transition:all .15s;animation:spSlide .4s ease both}
.sp-hv:hover{background:rgba(15,23,42,0.7);border-color:rgba(212,168,67,0.08);transform:translateY(-1px)}
.sp-hv-rank{font-size:16px;font-weight:900;width:32px;text-align:center;font-variant-numeric:tabular-nums}
.sp-hv-avatar{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#94a3b8;border:1px solid;flex-shrink:0}
.sp-hv-info{flex:1;min-width:0}
.sp-hv-name{font-size:14px;font-weight:700;color:#f1f5f9;margin-bottom:3px}
.sp-hv-meta{display:flex;gap:8px;align-items:center}
.sp-hv-role-badge{font-size:9px;font-weight:700;padding:2px 10px;border-radius:20px}
.sp-hv-firm{font-size:11px;color:#64748b}
.sp-hv-counts{display:flex;gap:14px}
.sp-hv-count{text-align:center;min-width:32px}
.sp-hv-total{text-align:center;min-width:56px;padding-left:14px;border-left:1px solid rgba(255,255,255,0.06)}
.sp-hv-total-n{font-size:24px;font-weight:900;color:#D4A843;line-height:1;text-shadow:0 0 12px rgba(212,168,67,0.2)}
.sp-hv-total-l{font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;margin-top:2px}

/* Empty */
.sp-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;color:#475569;font-size:13px;text-align:center;gap:12px}
.sp-empty-icon{font-size:36px;opacity:0.5}
.sp-spinner{width:24px;height:24px;border:2px solid rgba(212,168,67,0.2);border-top-color:#D4A843;border-radius:50%;animation:spSpin .6s linear infinite}
.sp-reset{margin-top:8px;padding:6px 16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#94a3b8;font-size:11px;cursor:pointer;font-weight:600}
@keyframes spSpin{to{transform:rotate(360deg)}}

/* ── Celebration Overlay ── */
.sp-celebrate{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(6,11,24,0.85);backdrop-filter:blur(8px);animation:spCelebIn .3s ease}
@keyframes spCelebIn{from{opacity:0}to{opacity:1}}
.sp-celebrate-inner{text-align:center;position:relative;animation:spCelebPop .5s cubic-bezier(.68,-.55,.27,1.55)}
@keyframes spCelebPop{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}
.sp-celebrate-icon{font-size:64px;margin-bottom:16px;animation:spCelebBounce .6s ease}
@keyframes spCelebBounce{0%{transform:translateY(20px) scale(0.5)}50%{transform:translateY(-10px) scale(1.1)}100%{transform:translateY(0) scale(1)}}
.sp-celebrate-text{font-size:28px;font-weight:900;color:var(--cc,#D4A843);letter-spacing:-0.03em;text-shadow:0 0 30px color-mix(in srgb,var(--cc) 30%,transparent)}
.sp-celebrate-sub{font-size:14px;color:#94a3b8;margin-top:6px}

/* Confetti */
.sp-confetti{position:absolute;width:8px;height:8px;border-radius:2px;top:0;animation:spConfetti 1.5s ease forwards}
@keyframes spConfetti{
  0%{transform:translateY(0) rotate(0deg);opacity:1}
  100%{transform:translateY(200px) translateX(var(--dx,30px)) rotate(720deg);opacity:0}
}
.sp-confetti:nth-child(odd){--dx:40px;width:6px;height:10px;border-radius:50%}
.sp-confetti:nth-child(even){--dx:-35px;width:10px;height:6px}
.sp-confetti:nth-child(3n){--dx:60px}
.sp-confetti:nth-child(4n){--dx:-55px}

/* ── Card Animation on status change ── */
.sp-card{animation:spSlide .4s ease both}

/* ── Responsive ── */
@media(max-width:1024px){.sp-detail.open{width:340px}.sp-search-w{width:220px}.sp-hv-counts{gap:8px}.sp-podium{gap:8px}.sp-stages{grid-template-columns:repeat(2,1fr);gap:8px}.sp-conv{height:32px}}
@media(max-width:768px){
  .sp-hero{padding:16px}.sp-funnel{padding:0 16px 16px}.sp-funnel-total-n{font-size:36px}.sp-stages{grid-template-columns:1fr 1fr;gap:6px}.sp-stage-n{font-size:28px}.sp-conv{display:none}
  .sp-body{padding:0 16px 16px}.sp-list-area{padding-right:0}
  .sp-search-w{width:100%;order:10}.sp-hero-right{width:100%}
  .sp-ranking{padding:0 16px 16px}.sp-podium{gap:6px;padding:12px 0 20px}.sp-pod{min-width:90px}.sp-pod-avatar{width:48px;height:48px}.sp-pod-initials{font-size:16px}
  .sp-hv{flex-wrap:wrap;gap:10px;padding:12px}.sp-hv-counts{width:100%;justify-content:space-around;padding-top:8px;border-top:1px solid rgba(255,255,255,0.04)}
  /* Capacitor: Extra bottom padding for BottomTabNav */
  .capacitor-app .sp{padding-bottom:72px}
  .capacitor-app .sp-hero{padding-top:calc(env(safe-area-inset-top) + 12px)}
}
`;
