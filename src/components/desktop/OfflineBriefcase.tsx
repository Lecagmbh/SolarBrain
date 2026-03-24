import { useState, useEffect, useCallback } from "react";

interface BriefcaseEntry {
  id: string;
  publicId: string;
  customerName: string;
  exportedAt: string;
  path: string;
}

export default function OfflineBriefcase() {
  const [entries, setEntries] = useState<BriefcaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const isDesktop = Boolean(window.baunityDesktop?.isDesktop);

  const loadEntries = useCallback(async () => {
    if (!isDesktop) { setLoading(false); return; }
    try {
      const list = await window.baunityDesktop!.briefcase.list();
      setEntries(list);
    } catch (err) {
      console.error("Failed to load briefcases:", err);
    } finally {
      setLoading(false);
    }
  }, [isDesktop]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleOpenFolder = async (folderPath: string) => {
    if (!isDesktop) return;
    await window.baunityDesktop!.shell.openPath(folderPath);
  };

  const handleDelete = async (id: string) => {
    if (!isDesktop) return;
    if (!confirm("Offline-Akte unwiderruflich loschen?")) return;
    setDeleting(id);
    try {
      await window.baunityDesktop!.briefcase.delete({ id });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Failed to delete briefcase:", err);
    } finally {
      setDeleting(null);
    }
  };

  if (!isDesktop) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: 16 }}>
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <h3 style={{ margin: "0 0 8px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Offline-Akten</h3>
        <p style={{ fontSize: 14 }}>
          Dieses Feature ist nur in der Desktop-App verfugbar.<br />
          Damit konnen Installations-Daten und Dokumente fur Baustellen ohne Internet gespeichert werden.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "white" }}>Offline-Akten</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Installations-Daten und Dokumente fur Baustellen ohne Internet
          </p>
        </div>
        <div style={{
          padding: "6px 14px",
          background: "rgba(212,168,67,0.15)",
          borderRadius: 8,
          border: "1px solid rgba(212,168,67,0.3)",
          color: "#EAD068",
          fontSize: 13,
          fontWeight: 600,
        }}>
          {entries.length} Akte{entries.length !== 1 ? "n" : ""}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.4)" }}>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#D4A843", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          Lade Offline-Akten...
        </div>
      ) : entries.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "rgba(255,255,255,0.02)",
          borderRadius: 16,
          border: "1px dashed rgba(255,255,255,0.1)",
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.2, marginBottom: 12 }}>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>
            Noch keine Offline-Akten gespeichert.<br />
            Offne eine Installation und klicke auf "Offline speichern".
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: "16px 20px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.borderColor = "rgba(212,168,67,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "rgba(212,168,67,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EAD068" strokeWidth="1.75">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "white", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.publicId || entry.id} &mdash; {entry.customerName}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{" "}
                  {new Date(entry.exportedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => handleOpenFolder(entry.path)}
                  title="Im Explorer offnen"
                  style={{
                    padding: "8px 12px",
                    background: "rgba(212,168,67,0.12)",
                    border: "1px solid rgba(212,168,67,0.25)",
                    borderRadius: 8,
                    color: "#EAD068",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  Offnen
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleting === entry.id}
                  title="Offline-Akte loschen"
                  style={{
                    padding: "8px 12px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 8,
                    color: "#f87171",
                    cursor: deleting === entry.id ? "wait" : "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                    opacity: deleting === entry.id ? 0.5 : 1,
                  }}
                >
                  {deleting === entry.id ? "..." : "Loschen"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
