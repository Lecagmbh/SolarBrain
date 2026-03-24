// ============================================================================
// Baunity Installation Detail V2 - Admin Tab (FINAL, CLEAN)
// - Status Override
// - System Infos + Copy
// - Danger Zone: Delete all documents + delete installation (real)
// - Debug block
// ============================================================================

import { useState } from "react";
import { useDetail } from "../context/DetailContext";
import { useAuth } from "../../../auth/AuthContext";
import { getAccessToken } from "../../../auth/tokenStorage";
import { STATUS_CONFIG, STATUS_ORDER, type InstallationStatus } from "../types";
import { formatDateTime, formatRelativeTime, isAdmin, copyToClipboard } from "../utils";

export default function AdminTab() {
  const { detail, updateStatus, reload, loading } = useDetail();
  const { user } = useAuth();
  const role = user?.role ?? "mitarbeiter";

  const [statusOverride, setStatusOverride] = useState<InstallationStatus | "">("");
  const [overrideComment, setOverrideComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Only admins
  if (!isAdmin(role as any)) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 48,
          color: "var(--ld-text-muted)",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div>Dieser Bereich ist nur für Administratoren zugänglich.</div>
      </div>
    );
  }

  if (loading || !detail) {
    return (
      <div>
        <div className="ld-skeleton ld-skeleton--card" />
        <div className="ld-skeleton ld-skeleton--card" />
      </div>
    );
  }

  const installationId = detail.id;

  async function handleStatusOverride() {
    if (!statusOverride) return;

    setSaving(true);
    try {
      await updateStatus(statusOverride, overrideComment || "Admin-Override");
      setStatusOverride("");
      setOverrideComment("");
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy(text: string, key: string) {
    await copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function deleteAllDocuments() {
    const token = getAccessToken();
    if (!token) {
      alert("Kein Auth-Token");
      return;
    }

    const ok = confirm("Sind Sie sicher, dass Sie alle Dokumente löschen möchten?");
    if (!ok) return;

    try {
      const listRes = await fetch(
        `/api/documents?installationId=${installationId}&limit=500&_=${Date.now()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      if (!listRes.ok) {
        const t = await listRes.text().catch(() => "");
        throw new Error(`List HTTP ${listRes.status} ${t}`);
      }

      const listJson = await listRes.json();
      const docs: Array<{ id: number | string }> = listJson?.data || [];

      for (const d of docs) {
        await fetch(`/api/documents/${d.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      alert(`Dokumente gelöscht (${docs.length})`);
      await reload();
    } catch (e) {
      console.error(e);
      alert("Fehler beim Löschen der Dokumente");
    }
  }

  async function deleteInstallation() {
    const token = getAccessToken();
    if (!token) {
      alert("Kein Auth-Token");
      return;
    }

    const ok = confirm(
      "Sind Sie sicher, dass Sie diese Installation löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/installations/${installationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${t}`);
      }

      alert("Installation gelöscht");
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Fehler beim Löschen der Installation");
    }
  }

  return (
    <div className="ld-grid ld-grid--2">
      {/* Status Override */}
      <div className="ld-card">
        <div className="ld-card__header">
          <h3 className="ld-card__title">
            <span className="ld-card__title-icon">⚡</span>
            Status-Override
          </h3>
        </div>

        <p
          style={{
            fontSize: 12,
            color: "var(--ld-text-secondary)",
            marginBottom: 16,
          }}
        >
          Als Admin können Sie den Status direkt ändern, ohne die normalen Workflow-Regeln zu befolgen.
        </p>

        <div className="ld-form-group">
          <label className="ld-label">Neuer Status</label>
          <select
            className="ld-input ld-select"
            value={statusOverride}
            onChange={(e) => setStatusOverride(e.target.value as InstallationStatus)}
          >
            <option value="">Status auswählen...</option>
            {STATUS_ORDER.map((status) => {
              const config = STATUS_CONFIG[status];
              const isCurrent = status === detail.status;
              return (
                <option key={status} value={status} disabled={isCurrent}>
                  {config.icon} {config.label} {isCurrent ? "(aktuell)" : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div className="ld-form-group">
          <label className="ld-label">Kommentar (optional)</label>
          <input
            type="text"
            className="ld-input"
            placeholder="Grund für Override..."
            value={overrideComment}
            onChange={(e) => setOverrideComment(e.target.value)}
          />
        </div>

        <button
          className="ld-btn ld-btn--primary"
          onClick={handleStatusOverride}
          disabled={saving || !statusOverride}
        >
          {saving ? "Speichern..." : "Status überschreiben"}
        </button>

        {/* Quick Actions */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid var(--ld-border-subtle)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ld-text-muted)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Schnellaktionen
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="ld-btn ld-btn--sm ld-btn--default"
              onClick={() => {
                setStatusOverride("freigegeben");
                setOverrideComment("Admin-Sofortfreigabe");
              }}
            >
              ✅ Sofort freigeben
            </button>
            <button
              className="ld-btn ld-btn--sm ld-btn--default"
              onClick={() => {
                setStatusOverride("entwurf");
                setOverrideComment("Zurückgesetzt auf Entwurf");
              }}
            >
              ↩️ Auf Entwurf zurücksetzen
            </button>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="ld-card">
        <div className="ld-card__header">
          <h3 className="ld-card__title">
            <span className="ld-card__title-icon">🔧</span>
            System-Informationen
          </h3>
        </div>

        <ul className="ld-data-list">
          <li className="ld-data-item">
            <span className="ld-data-label">Installation ID</span>
            <span className="ld-data-value ld-data-value--mono">
              {detail.id}
              <CopyIcon onClick={() => handleCopy(String(detail.id), "id")} copied={copied === "id"} />
            </span>
          </li>

          <li className="ld-data-item">
            <span className="ld-data-label">Erstellt am</span>
            <span className="ld-data-value">{formatDateTime(detail.createdAt)}</span>
          </li>

          <li className="ld-data-item">
            <span className="ld-data-label">Letzte Änderung</span>
            <span className="ld-data-value">
              {formatDateTime(detail.updatedAt)}
              <span style={{ color: "var(--ld-text-muted)", marginLeft: 8 }}>
                ({formatRelativeTime(detail.updatedAt)})
              </span>
            </span>
          </li>

          <li className="ld-data-item">
            <span className="ld-data-label">Erstellt von</span>
            <span className="ld-data-value">
              {detail.createdByName || "–"}
              {detail.createdByEmail && (
                <span style={{ color: "var(--ld-text-muted)", marginLeft: 8 }}>
                  ({detail.createdByEmail})
                </span>
              )}
            </span>
          </li>

          <li className="ld-data-item">
            <span className="ld-data-label">Statusänderungen</span>
            <span className="ld-data-value">{detail.statusHistory?.length || 0}</span>
          </li>

          <li className="ld-data-item">
            <span className="ld-data-label">Dokumente</span>
            <span className="ld-data-value">{detail.documents?.length ?? 0}</span>
          </li>

          <li className="ld-data-item">
            <span className="ld-data-label">E-Mails</span>
            <span className="ld-data-value">{detail.emails?.length || 0}</span>
          </li>

          <li className="ld-data-item">
            <span className="ld-data-label">Kommentare</span>
            <span className="ld-data-value">{detail.comments?.length || 0}</span>
          </li>
        </ul>

        <div style={{ marginTop: 16 }}>
          <button className="ld-btn ld-btn--sm ld-btn--default" onClick={() => reload()}>
            ↻ Daten neu laden
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="ld-card" style={{ borderColor: "rgba(239, 68, 68, 0.3)", gridColumn: "1 / -1" }}>
        <div className="ld-card__header">
          <h3 className="ld-card__title" style={{ color: "var(--ld-error)" }}>
            <span className="ld-card__title-icon">⚠️</span>
            Gefahrenzone
          </h3>
        </div>

        <p style={{ fontSize: 12, color: "var(--ld-text-secondary)", marginBottom: 16 }}>
          Diese Aktionen können nicht rückgängig gemacht werden. Bitte mit Vorsicht verwenden.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="ld-btn ld-btn--danger" onClick={deleteAllDocuments}>
            🗑️ Alle Dokumente löschen
          </button>
          <button className="ld-btn ld-btn--danger" onClick={deleteInstallation}>
            ❌ Installation löschen
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div className="ld-card" style={{ gridColumn: "1 / -1" }}>
        <div className="ld-card__header">
          <h3 className="ld-card__title">
            <span className="ld-card__title-icon">🐛</span>
            Debug-Informationen
          </h3>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: 12,
              background: "var(--ld-bg-deep)",
              borderRadius: 8,
              fontFamily: "var(--ld-font-mono)",
              fontSize: 11,
            }}
          >
            <div style={{ color: "var(--ld-text-muted)", marginBottom: 4 }}>Raw Data Keys</div>
            <div style={{ color: "var(--ld-text-secondary)" }}>
              {Object.keys(detail.raw || {}).length} Felder
            </div>
          </div>

          <div
            style={{
              padding: 12,
              background: "var(--ld-bg-deep)",
              borderRadius: 8,
              fontFamily: "var(--ld-font-mono)",
              fontSize: 11,
            }}
          >
            <div style={{ color: "var(--ld-text-muted)", marginBottom: 4 }}>Aktueller User</div>
            <div style={{ color: "var(--ld-text-secondary)" }}>
              {user?.email || "–"} ({user?.role || "–"})
            </div>
          </div>

          <div
            style={{
              padding: 12,
              background: "var(--ld-bg-deep)",
              borderRadius: 8,
              fontFamily: "var(--ld-font-mono)",
              fontSize: 11,
            }}
          >
            <div style={{ color: "var(--ld-text-muted)", marginBottom: 4 }}>Browser</div>
            <div style={{ color: "var(--ld-text-secondary)", wordBreak: "break-all" }}>
              {typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 50) + "..." : "–"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyIcon({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        marginLeft: 8,
        padding: "2px 6px",
        background: copied ? "rgba(16, 185, 129, 0.2)" : "var(--ld-bg-hover)",
        border: "none",
        borderRadius: 4,
        color: copied ? "var(--ld-success)" : "var(--ld-text-muted)",
        fontSize: 10,
        cursor: "pointer",
      }}
      title={copied ? "Kopiert" : "Kopieren"}
    >
      {copied ? "✓" : "📋"}
    </button>
  );
}
