// ═══════════════════════════════════════════════════════════════════════════
// ADMIN CENTER - OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════════

import { useAdminCenterStore } from "../stores";
import type { PlzMapping } from "../../shared/types";

export function OverviewTab() {
  const { getStats, setActiveTab, plzMappings } = useAdminCenterStore();
  const stats = getStats();
  
  // Berechne zusätzliche Stats
  const recentMappings: PlzMapping[] = [...plzMappings]
    .sort((a: PlzMapping, b: PlzMapping) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 5);
  
  const learnedPercentage = stats.plzMappingCount > 0 
    ? Math.round((stats.learnedMappingsCount / stats.plzMappingCount) * 100)
    : 0;
  
  return (
    <div className="admin-overview">
      {/* Stats Cards */}
      <div className="admin-overview__stats">
        <StatCard
          icon="🏢"
          label="Netzbetreiber"
          value={stats.gridOperatorCount}
          onClick={() => setActiveTab("gridOperators")}
        />
        <StatCard
          icon="📍"
          label="PLZ-Zuordnungen"
          value={stats.plzMappingCount}
          subtext={`${stats.learnedMappingsCount} automatisch gelernt`}
          onClick={() => setActiveTab("plzMappings")}
        />
        <StatCard
          icon="📄"
          label="Dokument-Regeln"
          value={stats.documentRequirementCount}
          onClick={() => setActiveTab("documents")}
        />
        <StatCard
          icon="📝"
          label="Zusatzfelder"
          value={stats.fieldRequirementCount}
          onClick={() => setActiveTab("fields")}
        />
        <StatCard
          icon="⚙️"
          label="Regeln"
          value={stats.ruleCount}
          onClick={() => setActiveTab("rules")}
        />
        <StatCard
          icon="🔐"
          label="Passwörter"
          value={stats.passwordCount}
          onClick={() => setActiveTab("passwords")}
        />
      </div>
      
      {/* Intelligence Stats */}
      <div className="admin-overview__section">
        <h2 className="admin-overview__section-title">
          <span>🧠</span> Intelligenz-System
        </h2>
        <div className="admin-overview__intelligence">
          <div className="admin-overview__progress-card">
            <div className="admin-overview__progress-header">
              <span>Automatisch gelernte PLZ-Zuordnungen</span>
              <span className="admin-overview__progress-value">{learnedPercentage}%</span>
            </div>
            <div className="admin-overview__progress-bar">
              <div 
                className="admin-overview__progress-fill"
                style={{ width: `${learnedPercentage}%` }}
              />
            </div>
            <p className="admin-overview__progress-hint">
              Das System lernt automatisch, wenn Benutzer PLZ und Netzbetreiber eingeben
            </p>
          </div>
        </div>
      </div>
      
      {/* Top Netzbetreiber */}
      {stats.topGridOperators.length > 0 && (
        <div className="admin-overview__section">
          <h2 className="admin-overview__section-title">
            <span>📈</span> Top Netzbetreiber (nach Nutzung)
          </h2>
          <div className="admin-overview__list">
            {stats.topGridOperators.map((op, index) => (
              <div key={op.id} className="admin-overview__list-item">
                <span className="admin-overview__list-rank">#{index + 1}</span>
                <span className="admin-overview__list-name">{op.name}</span>
                <span className="admin-overview__list-count">{op.usageCount} Nutzungen</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recent Mappings */}
      {recentMappings.length > 0 && (
        <div className="admin-overview__section">
          <h2 className="admin-overview__section-title">
            <span>🕐</span> Zuletzt hinzugefügte PLZ-Zuordnungen
          </h2>
          <div className="admin-overview__list">
            {recentMappings.map((mapping) => (
              <div key={mapping.id} className="admin-overview__list-item">
                <span className="admin-overview__list-plz">{mapping.plz}</span>
                <span className="admin-overview__list-arrow">→</span>
                <span className="admin-overview__list-name">{mapping.gridOperatorName}</span>
                <span className={`admin-overview__list-source admin-overview__list-source--${mapping.source}`}>
                  {mapping.source === "learned" ? "🤖 Gelernt" : 
                   mapping.source === "manual" ? "✏️ Manuell" : "📥 Import"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="admin-overview__section">
        <h2 className="admin-overview__section-title">
          <span>⚡</span> Schnellaktionen
        </h2>
        <div className="admin-overview__actions">
          <button 
            className="admin-overview__action-btn"
            onClick={() => setActiveTab("gridOperators")}
          >
            <span>➕</span>
            Netzbetreiber hinzufügen
          </button>
          <button 
            className="admin-overview__action-btn"
            onClick={() => setActiveTab("plzMappings")}
          >
            <span>📍</span>
            PLZ-Zuordnung hinzufügen
          </button>
          <button 
            className="admin-overview__action-btn"
            onClick={() => setActiveTab("documents")}
          >
            <span>📄</span>
            Dokument-Anforderung erstellen
          </button>
          <button 
            className="admin-overview__action-btn"
            onClick={() => setActiveTab("passwords")}
          >
            <span>🔐</span>
            Passwort speichern
          </button>
        </div>
      </div>
      
      {/* Empty State */}
      {stats.gridOperatorCount === 0 && (
        <div className="admin-overview__empty">
          <div className="admin-overview__empty-icon">🚀</div>
          <h3>Willkommen im Admin Center!</h3>
          <p>
            Beginnen Sie mit dem Anlegen von Netzbetreibern. Das System wird automatisch lernen,
            welche PLZ zu welchem Netzbetreiber gehört.
          </p>
          <button 
            className="admin-overview__empty-btn"
            onClick={() => setActiveTab("gridOperators")}
          >
            Ersten Netzbetreiber anlegen
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  subtext?: string;
  onClick?: () => void;
}

function StatCard({ icon, label, value, subtext, onClick }: StatCardProps) {
  return (
    <div 
      className={`admin-overview__stat-card ${onClick ? "admin-overview__stat-card--clickable" : ""}`}
      onClick={onClick}
    >
      <div className="admin-overview__stat-icon">{icon}</div>
      <div className="admin-overview__stat-content">
        <span className="admin-overview__stat-value">{value}</span>
        <span className="admin-overview__stat-label">{label}</span>
        {subtext && <span className="admin-overview__stat-subtext">{subtext}</span>}
      </div>
    </div>
  );
}
