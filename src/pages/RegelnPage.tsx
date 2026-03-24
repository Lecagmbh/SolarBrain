import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../modules/api/client";

type Rule = {
  id: number;
  name: string;
  description: string;
  trigger: { type: string; config: Record<string, any> };
  conditions: { field: string; operator: string; value: string }[];
  actions: { type: string; config: Record<string, any> }[];
  isActive: boolean;
  lastTriggered?: string;
  triggerCount: number;
  createdAt?: string;
  updatedAt?: string;
};

const TRIGGER_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  status_change: { label: "Status-Änderung", icon: "🔄", color: "#38bdf8" },
  document_upload: { label: "Dokument hochgeladen", icon: "📄", color: "#22c55e" },
  deadline: { label: "Frist/Zeitpunkt", icon: "⏰", color: "#f59e0b" },
  email_received: { label: "E-Mail empfangen", icon: "📧", color: "#EAD068" },
  manual: { label: "Manuell", icon: "👆", color: "#64748b" },
};

const ACTION_CONFIG: Record<string, { label: string; icon: string }> = {
  send_email: { label: "E-Mail senden", icon: "📤" },
  change_status: { label: "Status ändern", icon: "🔄" },
  create_task: { label: "Aufgabe erstellen", icon: "✅" },
  notify: { label: "Benachrichtigung", icon: "🔔" },
  webhook: { label: "Webhook", icon: "🔗" },
};

function timeAgo(iso?: string) {
  if (!iso) return "Nie";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tagen`;
}

export default function RegelnPage() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<Rule[]>([]);
  const [query, setQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  // Modals (simple MVP – kann später premium)
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

  async function loadRules() {
    setLoading(true);
    try {
      const r: any = await apiGet("/rules");
      setRules((r?.data || []) as Rule[]);
    } catch (e) {
      console.error(e);
      setRules([]);
      alert("Regeln konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  const filtered = useMemo(() => {
    let result = [...rules];
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(r => (r.name || "").toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q));
    }
    if (filterActive === "active") result = result.filter(r => r.isActive);
    if (filterActive === "inactive") result = result.filter(r => !r.isActive);
    return result.sort((a, b) => (b.triggerCount || 0) - (a.triggerCount || 0));
  }, [rules, query, filterActive]);

  const stats = useMemo(() => ({
    total: rules.length,
    active: rules.filter(r => r.isActive).length,
    totalTriggers: rules.reduce((s, r) => s + (r.triggerCount || 0), 0),
  }), [rules]);

  async function toggleActive(rule: Rule, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const updated = { ...rule, isActive: !rule.isActive };
      await apiPatch(`/rules/${rule.id}`, { isActive: updated.isActive });
      setRules(prev => prev.map(r => (r.id === rule.id ? updated : r)));
    } catch (err) {
      console.error(err);
      alert("Aktivierung fehlgeschlagen.");
    }
  }

  async function testTrigger(rule: Rule, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await apiPost(`/rules/${rule.id}/test-trigger`, {});
      await loadRules();
      alert("✅ Test-Trigger ausgeführt.");
    } catch (err) {
      console.error(err);
      alert("Test-Trigger fehlgeschlagen.");
    }
  }

  async function deleteRule(rule: Rule, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Regel wirklich löschen?\n\n${rule.name}`)) return;
    try {
      await apiDelete(`/rules/${rule.id}`);
      setRules(prev => prev.filter(r => r.id !== rule.id));
    } catch (err) {
      console.error(err);
      alert("Löschen fehlgeschlagen.");
    }
  }

  return (
    <div className="admin-page" style={{ paddingTop: 12 }}>
      {/* HERO HEADER (ENDLVL) */}
      <div style={{
        padding: "18px 18px 16px",
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
        marginBottom: 14,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 320 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 14,
                background: "rgba(245,158,11,0.14)",
                border: "1px solid rgba(245,158,11,0.28)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18
              }}>⚡</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 850, letterSpacing: "-0.02em" }}>Regeln</div>
                <div style={{ fontSize: 13, opacity: 0.88, marginTop: 3 }}>
                  Automatisierungsregeln (live) – aktivieren, testen, verwalten.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <div style={kpiPill}><div style={kpiLabel}>Regeln</div><div style={kpiValue}>{loading ? "…" : stats.total}</div></div>
              <div style={kpiPill}><div style={kpiLabel}>Aktiv</div><div style={{ ...kpiValue, color: stats.active ? "#22c55e" : "#e5e7eb" }}>{loading ? "…" : stats.active}</div></div>
              <div style={kpiPill}><div style={kpiLabel}>Ausgeführt</div><div style={kpiValue}>{loading ? "…" : stats.totalTriggers}</div></div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: "auto" }}>
            <button className="btn-primary" onClick={() => loadRules()} style={{ padding: "10px 16px", borderRadius: 14, minWidth: 160 }}>
              🔄 Aktualisieren
            </button>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="dash-card" style={{ padding: "12px 16px", marginBottom: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Regeln suchen…"
          style={inputStyle}
        />

        <div style={{ display: "flex", gap: 2, padding: 4, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["all", "active", "inactive"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "none",
                background: filterActive === f ? "rgba(56,189,248,0.20)" : "transparent",
                color: filterActive === f ? "#38bdf8" : "#94a3b8",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {f === "all" ? "Alle" : f === "active" ? "Aktiv" : "Inaktiv"}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.75 }}>
          {filtered.length} Regeln
        </div>
      </div>

      {/* LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div className="dash-card" style={{ padding: 40, textAlign: "center", opacity: 0.6 }}>Lade…</div>
        ) : filtered.length === 0 ? (
          <div className="dash-card" style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⚡</div>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Keine Regeln gefunden</div>
          </div>
        ) : (
          filtered.map(rule => {
            const trig = TRIGGER_CONFIG[rule.trigger?.type] || TRIGGER_CONFIG.manual;
            return (
              <div
                key={rule.id}
                onClick={() => setSelectedRule(rule)}
                className="dash-card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  cursor: "pointer",
                  opacity: rule.isActive ? 1 : 0.65,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <div style={{
                    width: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${trig.color}18`,
                    borderRight: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <span style={{ fontSize: 24 }}>{trig.icon}</span>
                  </div>

                  <div style={{ flex: 1, padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 850, fontSize: 14, marginBottom: 6 }}>{rule.name}</div>
                        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 10 }}>{rule.description}</div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: `${trig.color}20`, color: trig.color }}>
                            {trig.icon} {trig.label}
                          </span>
                          <span style={{ opacity: 0.35 }}>→</span>
                          {(rule.actions || []).slice(0, 3).map((a, idx) => {
                            const ac = ACTION_CONFIG[a.type] || { label: a.type, icon: "⚙️" };
                            return (
                              <span key={idx} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
                                {ac.icon} {ac.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, opacity: 0.55 }}>Ausgeführt</div>
                          <div style={{ fontWeight: 900, fontSize: 16 }}>{rule.triggerCount || 0}×</div>
                          <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{timeAgo(rule.lastTriggered)}</div>
                        </div>

                        <button
                          onClick={(e) => toggleActive(rule, e)}
                          style={{
                            width: 52,
                            height: 28,
                            borderRadius: 14,
                            border: "none",
                            background: rule.isActive ? "#22c55e" : "rgba(255,255,255,0.15)",
                            cursor: "pointer",
                            position: "relative",
                          }}
                          title="Aktiv/Inaktiv"
                        >
                          <div style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "white",
                            position: "absolute",
                            top: 3,
                            left: rule.isActive ? 27 : 3,
                            transition: "left 0.18s",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                          }} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button className="btn-ghost" onClick={(e) => testTrigger(rule, e)} style={{ padding: "8px 12px" }}>🧪 Test</button>
                      <button className="btn-ghost" onClick={(e) => deleteRule(rule, e)} style={{ padding: "8px 12px", color: "#ef4444" }}>🗑️ Löschen</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Simple Detail Modal (optional) */}
      {selectedRule && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px 16px", overflowY: "auto" }}
          onClick={() => setSelectedRule(null)}
        >
          <div className="dash-card" style={{ width: "min(760px, 96vw)", padding: 18 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{selectedRule.name}</div>
                <div style={{ marginTop: 6, opacity: 0.75 }}>{selectedRule.description}</div>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedRule(null)}>Schließen</button>
            </div>

            <div style={{ marginTop: 14, fontFamily: "monospace", fontSize: 12, opacity: 0.85, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(selectedRule, null, 2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: 260,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(2,6,23,0.9)",
  color: "#e5e7eb",
  padding: "10px 12px",
  fontSize: 13,
};

const kpiPill: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 120,
};

const kpiLabel: React.CSSProperties = {
  fontSize: 10,
  opacity: 0.7,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const kpiValue: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 850,
  marginTop: 2,
};
