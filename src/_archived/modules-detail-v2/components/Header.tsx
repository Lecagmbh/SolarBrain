// ============================================================================
// Baunity Installation Detail V2 - Header Component
// ============================================================================

import { useDetail } from "../context/DetailContext";
import { useAuth } from "../../../auth/AuthContext";
import {
  STATUS_CONFIG,
} from "../types";
import {
  formatRelativeTime,
  getStatusProgress,
  getNextStatus,
  canProgressStatus,
  getModifierKey,
  isAdmin,
} from "../utils";

interface HeaderProps {
  onClose: () => void;
}

export default function Header({ onClose }: HeaderProps) {
  const { detail, loading, updateStatus, setCommandPaletteOpen, reload } =
    useDetail();
  const { user } = useAuth();
  const role = (user?.role ?? "mitarbeiter") as "admin" | "mitarbeiter" | "kunde";

  if (loading || !detail) {
    return (
      <header className="ld-header">
        <div className="ld-header__top">
          <div style={{ flex: 1 }}>
            <div className="ld-skeleton ld-skeleton--text" style={{ width: 80 }} />
            <div className="ld-skeleton ld-skeleton--title" />
            <div className="ld-skeleton ld-skeleton--text" style={{ width: 200 }} />
          </div>
          <button className="ld-header__close" onClick={onClose}>
            ✕
          </button>
        </div>
      </header>
    );
  }

  const statusConfig = STATUS_CONFIG[detail.status] ?? STATUS_CONFIG.entwurf;
  const progress = getStatusProgress(detail.status);
  const nextStatus = getNextStatus(detail.status);
  const canProgress = nextStatus && canProgressStatus(detail.status, nextStatus, role);

  async function handleNextStatus() {
    if (nextStatus && canProgress) {
      await updateStatus(nextStatus);
    }
  }

  return (
    <header className="ld-header">
      {/* Top Row */}
      <div className="ld-header__top">
        <div style={{ flex: 1 }}>
          {/* Meta */}
          <div className="ld-header__meta">
            <span className="ld-header__id">#{detail.id}</span>
            {detail.gridOperator && (
              <span className="ld-header__operator">
                {detail.gridOperator}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="ld-header__title">{detail.customerName}</h1>

          {/* Location */}
          <div className="ld-header__location">{detail.location}</div>
        </div>

        {/* Close Button */}
        <div className="ld-header__actions">
          <button
            className="ld-header__close"
            onClick={onClose}
            title="Schließen (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="ld-status-bar">
        {/* Status Badge */}
        <div className="ld-status-badge">
          <div
            className="ld-status-badge__dot"
            style={{ background: statusConfig.color }}
          />
          <span className="ld-status-badge__label">
            {statusConfig.icon} {statusConfig.label}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="ld-progress">
          <div className="ld-progress__bar">
            <div
              className="ld-progress__fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="ld-progress__label">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="ld-quick-actions">
        {canProgress && nextStatus && (
          <button
            className="ld-quick-btn ld-quick-btn--primary"
            onClick={handleNextStatus}
          >
            <span className="ld-quick-btn__icon">→</span>
            {STATUS_CONFIG[nextStatus]?.label ?? "Weiter"}
          </button>
        )}

        <button
          className="ld-quick-btn"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <span className="ld-quick-btn__icon">⌘</span>
          Aktionen
          <span className="ld-quick-btn__kbd">{getModifierKey()}K</span>
        </button>

        <button className="ld-quick-btn" onClick={() => reload()}>
          <span className="ld-quick-btn__icon">↻</span>
          Aktualisieren
        </button>

        {isAdmin(role) && (
          <button
            className="ld-quick-btn"
            onClick={() => updateStatus("freigegeben", "Admin-Override")}
            style={{ marginLeft: "auto" }}
          >
            <span className="ld-quick-btn__icon">✓</span>
            Sofort freigeben
          </button>
        )}

        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "var(--ld-text-tertiary)",
          }}
        >
          Aktualisiert {formatRelativeTime(detail.updatedAt)}
        </span>
      </div>
    </header>
  );
}
