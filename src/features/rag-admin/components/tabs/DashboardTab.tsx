/**
 * RAG Dashboard Tab - KPIs, Alerts, Performance Overview
 */

import { useState, useEffect } from "react";
import { ragApi } from "../../api/rag.api";
import type { RagStatus, HealthCheck, RagMetric } from "../../types/rag.types";

interface Props {
  status: RagStatus | null;
  health: HealthCheck | null;
  onRefresh: () => void;
}

export function DashboardTab({ status, health, onRefresh }: Props) {
  const [metrics, setMetrics] = useState<RagMetric[]>([]);
  const [backupCount, setBackupCount] = useState(0);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const [metricsRes, backupsRes] = await Promise.all([
        ragApi.getMetrics("daily", 7),
        ragApi.getBackups(),
      ]);
      setMetrics(metricsRes.metrics || []);
      setBackupCount(backupsRes.backups?.length || 0);
    } catch (err) {
      console.error("Metrics laden fehlgeschlagen:", err);
    }
  };

  const m = health?.metrics;

  return (
    <div className="rag-tab-content">
      {/* Alerts */}
      {health?.alerts && health.alerts.length > 0 && (
        <div className="rag-alerts-section">
          <h3>Alerts</h3>
          <div className="rag-alerts-list">
            {health.alerts.map((alert, i) => (
              <div key={i} className={`rag-alert rag-alert-${alert.severity}`}>
                <span className="rag-alert-severity">{alert.severity.toUpperCase()}</span>
                <span className="rag-alert-message">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="rag-kpi-grid">
        <KpiCard
          label="Embeddings"
          value={status?.totalEmbeddings?.toLocaleString("de-DE") || "0"}
          icon="M12 2L2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          color="blue"
        />
        <KpiCard
          label="Queries (24h)"
          value={String(m?.queryCount24h || 0)}
          icon="M3 3v18h18M19 9l-5 5-4-4-3 3"
          color="violet"
        />
        <KpiCard
          label="Avg Latenz"
          value={`${m?.avgLatency24h || 0}ms`}
          icon="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
          color="emerald"
          subtitle={`P95: ${m?.p95Latency24h || 0}ms`}
        />
        <KpiCard
          label="Avg Similarity"
          value={`${((m?.avgSimilarity24h || 0) * 100).toFixed(1)}%`}
          icon="M22 11.08V12a10 10 0 11-5.93-9.14"
          color="amber"
        />
        <KpiCard
          label="Cache Hit Rate"
          value={`${m?.cacheHitRate24h || 0}%`}
          icon="M13 2L3 14h9l-1 8 10-12h-9l1-8"
          color="cyan"
          subtitle={`${status?.cacheStats?.entries || 0} Einträge`}
        />
        <KpiCard
          label="Error Rate"
          value={m?.queryCount24h ? `${((m?.errorCount24h || 0) / m.queryCount24h * 100).toFixed(1)}%` : "0%"}
          icon="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01"
          color={m?.errorCount24h ? "red" : "emerald"}
        />
      </div>

      {/* Category Distribution */}
      <div className="rag-section">
        <div className="rag-section-header">
          <h3>Embeddings nach Kategorie</h3>
          <button className="rag-btn-ghost" onClick={onRefresh}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56M21 3v5h-5" />
            </svg>
            Aktualisieren
          </button>
        </div>
        <div className="rag-category-grid">
          {status?.embeddingsByCategory &&
            Object.entries(status.embeddingsByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => {
                const total = status.totalEmbeddings || 1;
                const pct = ((count / total) * 100).toFixed(1);
                return (
                  <div key={category} className="rag-category-card">
                    <div className="rag-category-name">{category}</div>
                    <div className="rag-category-count">{count.toLocaleString("de-DE")}</div>
                    <div className="rag-category-bar">
                      <div className="rag-category-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="rag-category-pct">{pct}%</div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Recent Metrics */}
      {metrics.length > 0 && (
        <div className="rag-section">
          <h3>Performance (letzte 7 Tage)</h3>
          <div className="rag-table-wrap">
            <table className="rag-table">
              <thead>
                <tr>
                  <th>Zeitraum</th>
                  <th>Queries</th>
                  <th>Avg Latenz</th>
                  <th>P95 Latenz</th>
                  <th>Avg Similarity</th>
                  <th>Cache Hit</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => (
                  <tr key={i}>
                    <td>{m.period}</td>
                    <td>{m.totalQueries}</td>
                    <td>{Math.round(m.avgLatencyMs)}ms</td>
                    <td>{Math.round(m.p95LatencyMs)}ms</td>
                    <td>{(m.avgTopSimilarity * 100).toFixed(1)}%</td>
                    <td>{m.cacheHitRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Info */}
      <div className="rag-section">
        <h3>System</h3>
        <div className="rag-info-grid">
          <InfoRow label="pgvector" value={status?.pgvectorVersion || "N/A"} />
          <InfoRow label="Status" value={status?.available ? "Online" : "Offline"} />
          <InfoRow label="Embedding Model" value={status?.enterprise?.embeddingVersion?.modelName || "text-embedding-3-small"} />
          <InfoRow label="Dimensions" value={String(status?.enterprise?.embeddingVersion?.dimensions || 1536)} />
          <InfoRow label="Backups" value={`${backupCount} vorhanden`} />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color, subtitle }: {
  label: string;
  value: string;
  icon: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className={`rag-kpi-card rag-kpi-${color}`}>
      <div className="rag-kpi-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <div className="rag-kpi-value">{value}</div>
      <div className="rag-kpi-label">{label}</div>
      {subtitle && <div className="rag-kpi-subtitle">{subtitle}</div>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rag-info-row">
      <span className="rag-info-label">{label}</span>
      <span className="rag-info-value">{value}</span>
    </div>
  );
}
