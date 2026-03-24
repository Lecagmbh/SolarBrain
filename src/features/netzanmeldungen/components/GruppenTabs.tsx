/**
 * GruppenTabs — Kunden-definierte Projekt-Gruppen als Filter-Tabs
 * Mit Modal-Dialog zum Erstellen neuer Gruppen.
 */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface Gruppe { id: number; name: string; farbe: string | null; _count?: { zuordnungen: number } }

const FARBEN = ["#D4A843", "#3b82f6", "#06b6d4", "#22c55e", "#eab308", "#f97316", "#ef4444", "#ec4899", "#EAD068", "#64748b"];

interface Props {
  activeGruppeId: number | null;
  onChange: (gruppeId: number | null) => void;
  organisationId: number;
}

export function GruppenTabs({ activeGruppeId, onChange, organisationId }: Props) {
  const [gruppen, setGruppen] = useState<Gruppe[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFarbe, setNewFarbe] = useState(FARBEN[0]);

  useEffect(() => {
    if (!organisationId) return;
    fetch(`/api/crm/gruppen?organisationId=${organisationId}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : []).then(setGruppen).catch(() => {});
  }, [organisationId]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/crm/gruppen", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ organisationId, name: newName.trim(), farbe: newFarbe }),
    });
    if (res.ok) {
      const g = await res.json();
      setGruppen(prev => [...prev, g]);
      setNewName(""); setNewFarbe(FARBEN[0]); setShowModal(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Gruppe löschen? Projekte bleiben erhalten.")) return;
    await fetch(`/api/crm/gruppen/${id}`, { method: "DELETE", credentials: "include" });
    setGruppen(prev => prev.filter(g => g.id !== id));
    if (activeGruppeId === id) onChange(null);
  };

  return (
    <div style={{ margin: "0 0 8px" }}>
      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => onChange(null)} style={{
          padding: "5px 12px", borderRadius: 5, border: "none", fontSize: 11,
          fontWeight: !activeGruppeId ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
          background: !activeGruppeId ? "rgba(212,168,67,0.12)" : "rgba(255,255,255,0.03)",
          color: !activeGruppeId ? "#a5b4fc" : "#64748b",
        }}>Alle</button>

        {gruppen.map(g => {
          const active = activeGruppeId === g.id;
          const f = g.farbe || "#D4A843";
          return (
            <button key={g.id} onClick={() => onChange(active ? null : g.id)} style={{
              padding: "5px 10px", borderRadius: 5, border: "none", fontSize: 11,
              fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
              background: active ? f + "18" : "rgba(255,255,255,0.03)", color: active ? f : "#64748b",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: f, flexShrink: 0 }} />
              {g.name}
              {g._count?.zuordnungen !== undefined && (
                <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7 }}>{g._count.zuordnungen}</span>
              )}
              <span onClick={(e) => handleDelete(g.id, e)} title="Löschen"
                style={{ fontSize: 9, opacity: 0.4, marginLeft: 2 }}>✕</span>
            </button>
          );
        })}

        <button onClick={() => setShowModal(true)} style={{
          padding: "5px 10px", borderRadius: 5, border: "1px dashed rgba(255,255,255,0.1)",
          background: "none", fontSize: 11, color: "#64748b", cursor: "pointer", fontFamily: "inherit",
        }}>+ Neue Gruppe</button>
      </div>

      {/* ── Modal via Portal auf body ── */}
      {showModal && createPortal(
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }}
          onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#1a1f2e", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 16,
            padding: "32px 36px", width: 420, maxWidth: "90vw", boxShadow: "0 30px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(212,168,67,0.1)",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc", marginBottom: 4 }}>Neue Gruppe erstellen</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Gruppen helfen dir, Projekte zu organisieren. Du kannst sie benennen wie du willst.</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>Name</div>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="z.B. Projekte Süddeutschland, Großprojekte 2026..."
                autoFocus
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
                  color: "#e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit",
                }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>Farbe</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {FARBEN.map(c => (
                  <button key={c} onClick={() => setNewFarbe(c)} style={{
                    width: 28, height: 28, borderRadius: 6, background: c, border: "none", cursor: "pointer",
                    outline: newFarbe === c ? "2px solid #fff" : "2px solid transparent",
                    outlineOffset: 2, transition: "outline 0.15s",
                  }} />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: newFarbe }} />
              <span style={{ fontSize: 12, color: newName ? "#e2e8f0" : "#64748b", fontWeight: 500 }}>
                {newName || "Gruppenname..."}
              </span>
              <span style={{ fontSize: 9, color: "#475569", marginLeft: "auto" }}>0 Projekte</span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCreate} disabled={!newName.trim()} style={{
                flex: 1, padding: "10px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
                cursor: newName.trim() ? "pointer" : "not-allowed", fontFamily: "inherit",
                background: newName.trim() ? "#D4A843" : "#1e1e3a", color: newName.trim() ? "#fff" : "#475569",
              }}>Erstellen</button>
              <button onClick={() => setShowModal(false)} style={{
                padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
                background: "none", fontSize: 13, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit",
              }}>Abbrechen</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default GruppenTabs;
