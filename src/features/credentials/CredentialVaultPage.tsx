/**
 * Credential Vault — Premium NB-Portal Password Management
 * AES-256-GCM verschlüsselt, Gruppiert nach NB, Glassmorphism Design
 */
import { useState, useEffect, useCallback, useRef } from "react";

// ─── Design Tokens ──────────────────────────────────────────────────────────

const css = `
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes backdropIn{from{opacity:0}to{opacity:1}}
@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes countUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes lockPulse{0%,100%{filter:drop-shadow(0 0 0 rgba(212,168,67,0))}50%{filter:drop-shadow(0 0 12px rgba(212,168,67,0.4))}}
@keyframes gradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.vault-fade{animation:fadeIn .3s ease both}
.vault-card{transition:all .2s ease;border-radius:16px}.vault-card:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,0.4)!important;border-color:rgba(212,168,67,0.25)!important}
.vault-row{transition:all .15s ease}.vault-row:hover{background:rgba(212,168,67,0.04)!important}
.vault-btn{transition:all .15s ease;cursor:pointer;font-family:'DM Sans',sans-serif}.vault-btn:hover{transform:translateY(-1px)}
.vault-btn:active{transform:scale(0.97)}
.vault-copy{transition:all .2s ease;cursor:pointer}.vault-copy:hover{background:rgba(212,168,67,0.12)!important;border-color:rgba(212,168,67,0.3)!important}
.vault-input{transition:border-color .2s ease,box-shadow .2s ease}.vault-input:focus{border-color:rgba(212,168,67,0.5)!important;box-shadow:0 0 0 3px rgba(212,168,67,0.08)!important}
.vault-shimmer{background:linear-gradient(90deg,rgba(255,255,255,0.02) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.02) 75%);background-size:800px 100%;animation:shimmer 2s infinite linear}
.vault-gradient-text{background:linear-gradient(135deg,#a5b4fc,#06b6d4,#f0d878);background-size:200% 200%;animation:gradient 4s ease infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
@media(max-width:900px){.vault-stats-grid{grid-template-columns:1fr 1fr!important}.vault-form-grid{grid-template-columns:1fr!important}.vault-cred-actions{flex-wrap:wrap}}
`;

interface Credential {
  id: number; netzbetreiberId: number; netzbetreiberName: string;
  netzbetreiberKurzname?: string; portalUrl?: string; label: string;
  username: string; password: string; notes?: string;
  createdAt: string; updatedAt: string;
}

interface Stats {
  totalCredentials: number; netzbetreiberWithCredentials: number;
  totalNetzbetreiber: number; coveragePercent: number;
}

function useAuthFetch() {
  return useCallback(async <T = any>(url: string, options?: RequestInit): Promise<T> => {
    const token = localStorage.getItem("baunity_token") || "";
    const resp = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options?.headers }, credentials: "include" });
    if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.error || `Fehler ${resp.status}`); }
    return resp.json();
  }, []);
}

// ─── Password Strength ──────────────────────────────────────────────────────

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Schwach", color: "#ef4444" };
  if (score <= 2) return { score, label: "Mäßig", color: "#f97316" };
  if (score <= 3) return { score, label: "Gut", color: "#eab308" };
  return { score, label: "Stark", color: "#22c55e" };
}

// ─── Modal ──────────────────────────────────────────────────────────────────

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", animation: "backdropIn .2s ease" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", background: "rgba(15,15,30,0.98)", border: "1px solid rgba(212,168,67,0.15)", borderRadius: 20, boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,168,67,0.05)", animation: "modalIn .25s ease", padding: 0 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, delay }: { icon: string; label: string; value: string | number; color: string; delay: number }) {
  return (
    <div className="vault-card" style={{ background: "rgba(17,20,35,0.95)", border: "1px solid rgba(212,168,67,0.08)", padding: "20px 24px", animation: `countUp .5s ease ${delay}ms both`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${color}06`, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, color, letterSpacing: -1, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    </div>
  );
}

// ─── Credential Row ─────────────────────────────────────────────────────────

function CredRow({ c, onEdit, onDelete }: { c: Credential; onEdit: () => void; onDelete: () => void }) {
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const strength = getStrength(c.password);

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val); setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const age = Math.floor((Date.now() - new Date(c.updatedAt).getTime()) / 86400000);
  const ageLabel = age === 0 ? "Heute" : age === 1 ? "Gestern" : `Vor ${age} Tagen`;
  const ageColor = age > 180 ? "#ef4444" : age > 90 ? "#f97316" : "#64748b";

  return (
    <div className="vault-row vault-fade" style={{ display: "flex", alignItems: "stretch", gap: 0, background: "rgba(17,20,35,0.95)", border: "1px solid rgba(212,168,67,0.08)", borderRadius: 14, overflow: "hidden" }}>
      {/* Left: Color-Accent */}
      <div style={{ width: 4, background: `linear-gradient(180deg, #06b6d4, #D4A843)`, flexShrink: 0 }} />

      {/* Content */}
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        {/* Icon */}
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, rgba(6,182,212,0.1), rgba(212,168,67,0.1))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, border: "1px solid rgba(6,182,212,0.1)" }}>
          🏢
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>{c.netzbetreiberName}</span>
            {c.label !== "default" && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(167,139,250,0.1)", color: "#f0d878", border: "1px solid rgba(167,139,250,0.15)" }}>{c.label}</span>}
          </div>

          {/* Credentials Display */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {/* Username */}
            <div onClick={() => copy(c.username, "u")} className="vault-copy" style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: 10, color: "#64748b" }}>User</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc", fontFamily: "'JetBrains Mono', monospace" }}>{copied === "u" ? "Kopiert!" : c.username}</span>
            </div>

            {/* Password */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div onClick={() => copy(c.password, "p")} className="vault-copy" style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 10, color: "#64748b" }}>PW</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc", fontFamily: "'JetBrains Mono', monospace", letterSpacing: showPw ? 0 : 3 }}>
                  {copied === "p" ? "Kopiert!" : showPw ? c.password : "••••••••"}
                </span>
              </div>
              <button onClick={() => setShowPw(!showPw)} className="vault-btn" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "5px 8px", fontSize: 13, color: "#64748b" }}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>

            {/* Strength Dot */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= strength.score ? strength.color : "rgba(255,255,255,0.06)", transition: "background .2s" }} />
              ))}
              <span style={{ fontSize: 9, color: strength.color, fontWeight: 600, marginLeft: 2 }}>{strength.label}</span>
            </div>
          </div>

          {/* Meta */}
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "#475569" }}>
            {c.notes && <span>💡 {c.notes}</span>}
            <span style={{ color: ageColor }}>Aktualisiert: {ageLabel}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="vault-cred-actions" style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          {c.portalUrl && (
            <a href={c.portalUrl} target="_blank" rel="noopener" className="vault-btn" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(6,182,212,0.06))", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 10, padding: "8px 16px", fontSize: 12, color: "#06b6d4", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              🌐 Portal ↗
            </a>
          )}
          <button onClick={onEdit} className="vault-btn" style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.12)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#a5b4fc" }}>✏️</button>
          <button onClick={onDelete} className="vault-btn" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#ef4444" }}>🗑</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function CredentialVaultPage() {
  const authFetch = useAuthFetch();
  const [creds, setCreds] = useState<Credential[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  // Form
  const [form, setForm] = useState({ netzbetreiberId: "", label: "default", username: "", password: "", notes: "", portalUrl: "" });
  const [nbSearch, setNbSearch] = useState("");
  const [nbSuggestions, setNbSuggestions] = useState<{ id: number; name: string }[]>([]);
  const [showFormPw, setShowFormPw] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: "ok" | "err" = "ok") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [credData, statsData] = await Promise.all([
        authFetch<{ data: Credential[] }>("/api/credentials"),
        authFetch<Stats>("/api/credentials/stats"),
      ]);
      setCreds(credData.data || []);
      setStats(statsData);
    } catch (e: any) {
      showToast(e.message, "err");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  // Keyboard: / to focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !modalOpen && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault(); searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  // NB-Autocomplete
  useEffect(() => {
    if (nbSearch.length < 2) { setNbSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const token = localStorage.getItem("baunity_token") || "";
        const resp = await fetch(`/api/netzbetreiber?search=${encodeURIComponent(nbSearch)}&limit=8`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
        if (resp.ok) {
          const data = await resp.json();
          setNbSuggestions((data.data || data || []).map((n: any) => ({ id: n.id, name: n.name })));
        }
      } catch { /* */ }
    }, 250);
    return () => clearTimeout(t);
  }, [nbSearch]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ netzbetreiberId: "", label: "default", username: "", password: "", notes: "", portalUrl: "" });
    setNbSearch(""); setShowFormPw(false); setModalOpen(true);
  };

  const openEdit = (c: Credential) => {
    setEditingId(c.id);
    setForm({ netzbetreiberId: String(c.netzbetreiberId), label: c.label, username: c.username, password: c.password, notes: c.notes || "", portalUrl: c.portalUrl || "" });
    setNbSearch(c.netzbetreiberName); setShowFormPw(false); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.netzbetreiberId || !form.username || !form.password) { showToast("NB, Benutzer und Passwort sind Pflicht", "err"); return; }
    setSaving(true);
    try {
      if (editingId) {
        await authFetch(`/api/credentials/${editingId}`, { method: "PATCH", body: JSON.stringify(form) });
        showToast("Zugangsdaten aktualisiert");
      } else {
        await authFetch("/api/credentials", { method: "POST", body: JSON.stringify(form) });
        showToast("Neuer Zugang gespeichert");
      }
      setModalOpen(false); load();
    } catch (e: any) { showToast(e.message, "err"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Diesen Zugang wirklich löschen? Das kann nicht rückgängig gemacht werden.")) return;
    try { await authFetch(`/api/credentials/${id}`, { method: "DELETE" }); load(); showToast("Zugang gelöscht"); }
    catch (e: any) { showToast(e.message, "err"); }
  };

  const filtered = creds.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.netzbetreiberName.toLowerCase().includes(q) || c.username.toLowerCase().includes(q) || (c.notes || "").toLowerCase().includes(q);
  });

  const formPwStrength = getStrength(form.password);

  const inputS: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 16px",
    fontSize: 14, color: "#e2e8f0", outline: "none", fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0a0a0f", color: "#e2e8f0", minHeight: "100vh" }}>
      <style>{css}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 2000, padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: toast.type === "ok" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${toast.type === "ok" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, color: toast.type === "ok" ? "#22c55e" : "#ef4444", backdropFilter: "blur(12px)", animation: "fadeIn .2s ease", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          {toast.type === "ok" ? "✓" : "✗"} {toast.text}
        </div>
      )}

      {/* ═══ Hero Header ═══ */}
      <div style={{ position: "relative", overflow: "hidden", padding: "40px 40px 32px", borderBottom: "1px solid rgba(212,168,67,0.08)" }}>
        {/* BG Gradient */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 50%, rgba(212,168,67,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(6,182,212,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1400, margin: "0 auto" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(6,182,212,0.15))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, animation: "lockPulse 3s ease infinite" }}>🔐</div>
              <div>
                <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
                  <span className="vault-gradient-text">Credential Vault</span>
                </h1>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>NB-Portal Zugangsdaten — AES-256-GCM verschlüsselt</div>
              </div>
            </div>
          </div>
          <button onClick={openAdd} className="vault-btn" style={{
            background: "linear-gradient(135deg, #D4A843, #b8942e)", color: "#fff", border: "none", borderRadius: 14,
            padding: "14px 28px", fontSize: 15, fontWeight: 700,
            boxShadow: "0 4px 24px rgba(212,168,67,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>+</span> Neuer Zugang
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 40px 60px" }}>
        {/* ═══ Stats ═══ */}
        {stats && (
          <div className="vault-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            <StatCard icon="🔑" label="Gespeicherte Zugänge" value={stats.totalCredentials} color="#D4A843" delay={0} />
            <StatCard icon="🏢" label="NB mit Credentials" value={stats.netzbetreiberWithCredentials} color="#06b6d4" delay={80} />
            <StatCard icon="📊" label="Gesamt Netzbetreiber" value={stats.totalNetzbetreiber} color="#94a3b8" delay={160} />
            <StatCard icon="📈" label="Abdeckung" value={`${stats.coveragePercent}%`} color={stats.coveragePercent > 20 ? "#22c55e" : "#f97316"} delay={240} />
          </div>
        )}

        {/* ═══ Search ═══ */}
        <div style={{ position: "relative", marginBottom: 24, maxWidth: 480 }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#475569", pointerEvents: "none" }}>🔍</span>
          <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Suchen... ( / )"
            className="vault-input" style={{ ...inputS, paddingLeft: 44, paddingRight: 60, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 15 }} />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#94a3b8", cursor: "pointer" }}>Esc</button>}
          <span style={{ position: "absolute", right: search ? 60 : 14, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#374151", fontFamily: "monospace", padding: "2px 6px", background: "rgba(255,255,255,0.03)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.05)" }}>/</span>
        </div>

        {/* ═══ Credential List ═══ */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} className="vault-shimmer" style={{ height: 90, borderRadius: 14, background: "rgba(17,20,35,0.95)", border: "1px solid rgba(212,168,67,0.05)" }} />)}
          </div>
        ) : filtered.length === 0 && creds.length === 0 ? (
          <div className="vault-fade" style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg, rgba(212,168,67,0.1), rgba(6,182,212,0.1))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 20px", animation: "lockPulse 3s ease infinite" }}>🔐</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#f8fafc", marginBottom: 8 }}>Vault ist leer</div>
            <div style={{ fontSize: 14, color: "#64748b", maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.7 }}>
              Legen Sie Zugangsdaten für Netzbetreiber-Portale an. Passwörter werden mit AES-256-GCM verschlüsselt gespeichert.
            </div>
            <button onClick={openAdd} className="vault-btn" style={{ background: "linear-gradient(135deg, #D4A843, #b8942e)", color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px", fontSize: 15, fontWeight: 700, boxShadow: "0 4px 24px rgba(212,168,67,0.3)" }}>
              + Ersten Zugang anlegen
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="vault-fade" style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 16, color: "#64748b" }}>Keine Treffer für "{search}"</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 4 }}>{filtered.length} Zugang{filtered.length !== 1 ? "sdaten" : ""}</div>
            {filtered.map((c, i) => (
              <div key={c.id} style={{ animationDelay: `${i * 40}ms` }}>
                <CredRow c={c} onEdit={() => openEdit(c)} onDelete={() => handleDelete(c.id)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Add/Edit Modal ═══ */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div style={{ padding: "28px 32px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>{editingId ? "Zugang bearbeiten" : "Neuer Zugang"}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Zugangsdaten werden verschlüsselt gespeichert</div>
        </div>
        <div style={{ padding: "24px 32px" }}>
          <div className="vault-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* NB */}
            <div style={{ position: "relative", gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>Netzbetreiber *</label>
              <input value={nbSearch} onChange={e => { setNbSearch(e.target.value); setForm(f => ({ ...f, netzbetreiberId: "" })); }} placeholder="Netzbetreiber suchen..." className="vault-input" style={inputS} />
              {nbSuggestions.length > 0 && !form.netzbetreiberId && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "rgba(15,15,30,0.98)", border: "1px solid rgba(212,168,67,0.15)", borderRadius: 12, zIndex: 10, maxHeight: 220, overflowY: "auto", marginTop: 4, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                  {nbSuggestions.map(nb => (
                    <div key={nb.id} onClick={() => { setForm(f => ({ ...f, netzbetreiberId: String(nb.id) })); setNbSearch(nb.name); setNbSuggestions([]); }}
                      style={{ padding: "10px 16px", fontSize: 14, color: "#e2e8f0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10, transition: "background .1s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.06)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <span style={{ fontSize: 14 }}>🏢</span> {nb.name}
                    </div>
                  ))}
                </div>
              )}
              {form.netzbetreiberId && <div style={{ fontSize: 11, color: "#22c55e", marginTop: 4, fontWeight: 600 }}>✓ {nbSearch} (ID: {form.netzbetreiberId})</div>}
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>Benutzername *</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Portal-Login" className="vault-input" style={{ ...inputS, fontFamily: "'JetBrains Mono', monospace" }} />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>Passwort *</label>
              <div style={{ position: "relative" }}>
                <input type={showFormPw ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Passwort" className="vault-input" style={{ ...inputS, fontFamily: "'JetBrains Mono', monospace", paddingRight: 44 }} />
                <button onClick={() => setShowFormPw(!showFormPw)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#64748b", padding: 4 }}>{showFormPw ? "🙈" : "👁"}</button>
              </div>
              {form.password && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${(formPwStrength.score / 5) * 100}%`, height: "100%", background: formPwStrength.color, borderRadius: 2, transition: "width .3s, background .3s" }} />
                  </div>
                  <span style={{ fontSize: 10, color: formPwStrength.color, fontWeight: 600 }}>{formPwStrength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>Portal-URL</label>
              <input value={form.portalUrl} onChange={e => setForm(f => ({ ...f, portalUrl: e.target.value }))} placeholder="https://portal.netzbetreiber.de" className="vault-input" style={inputS} />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>Label</label>
              <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="default" className="vault-input" style={inputS} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>Notizen</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="z.B. 2FA aktiv, VPN nötig, Ansprechpartner..." className="vault-input" style={inputS} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 32px 24px", display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <button onClick={() => setModalOpen(false)} className="vault-btn" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 24px", fontSize: 14, color: "#94a3b8" }}>Abbrechen</button>
          <button onClick={handleSave} disabled={saving} className="vault-btn" style={{
            background: saving ? "#475569" : "linear-gradient(135deg, #D4A843, #b8942e)", color: "#fff", border: "none",
            borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700,
            opacity: saving ? 0.6 : 1, boxShadow: saving ? "none" : "0 4px 20px rgba(212,168,67,0.3)",
          }}>
            {saving ? "Speichere..." : editingId ? "Aktualisieren" : "Verschlüsselt speichern"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
