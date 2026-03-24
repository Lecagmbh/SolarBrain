/**
 * Brain Dashboard Tab - KPIs, Insights, Learning Status
 */

import { useState, useEffect } from "react";
import { brainApi } from "../../api/brain.api";
import type { BrainStats, BrainInsight } from "../../types/brain.types";

interface Props {
  stats: BrainStats | null;
  onRefresh: () => void;
}

export function DashboardTab({ stats, onRefresh }: Props) {
  const [insights, setInsights] = useState<BrainInsight[]>([]);
  const [learningStatus, setLearningStatus] = useState<string>("Bereit");
  const [learningLoading, setLearningLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const res = await brainApi.getInsights();
      setInsights(res.insights || []);
    } catch (err) {
      console.error("Insights laden fehlgeschlagen:", err);
    }
  };

  const handleTriggerLearning = async () => {
    setLearningLoading(true);
    setLearningStatus("Lernzyklus aktiv...");
    setMessage(null);
    try {
      const res = await brainApi.triggerLearning();
      const d = res.data;
      setLearningStatus("Abgeschlossen");
      setMessage({
        type: "success",
        text: `Lernzyklus abgeschlossen. ${d.patternsFound} Muster gefunden, ${d.patternsCreated} neu erstellt, ${d.patternsUpdated} aktualisiert.`,
      });
      onRefresh();
      loadInsights();
    } catch (err) {
      setLearningStatus("Fehler");
      setMessage({ type: "error", text: "Lernzyklus fehlgeschlagen." });
      console.error("Lernzyklus fehlgeschlagen:", err);
    } finally {
      setLearningLoading(false);
    }
  };

  return (
    <div className="brain-tab-content">
      {/* Message */}
      {message && (
        <div className={`brain-message brain-message-${message.type}`}>
          <span>{message.text}</span>
          <button className="brain-message-close" onClick={() => setMessage(null)}>x</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="brain-kpi-grid">
        <KpiCard
          label="Wissenseintraege"
          value={stats?.knowledge?.total?.toLocaleString("de-DE") || "0"}
          icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          color="emerald"
          subtitle={`${Object.keys(stats?.knowledge?.byCategory || {}).length} Kategorien`}
        />
        <KpiCard
          label="Aktive Patterns"
          value={String(stats?.patterns?.active || 0)}
          icon="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          color="teal"
          subtitle={`${stats?.patterns?.total || 0} gesamt`}
        />
        <KpiCard
          label="Aktive Regeln"
          value={String(stats?.rules?.active || 0)}
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          color="blue"
          subtitle={`${stats?.rules?.total || 0} gesamt`}
        />
        <KpiCard
          label="Events (24h)"
          value={String(stats?.events?.last24h || 0)}
          icon="M13 10V3L4 14h7v7l9-11h-7z"
          color="amber"
          subtitle={`${stats?.events?.total?.toLocaleString("de-DE") || "0"} gesamt`}
        />
        <KpiCard
          label="Avg Feedback"
          value={stats?.feedback?.avgRating ? stats.feedback.avgRating.toFixed(1) : "0.0"}
          icon="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          color="violet"
          subtitle={`${stats?.feedback?.helpfulPercent || 0}% hilfreich`}
        />
        <KpiCard
          label="Lernstatus"
          value={learningStatus}
          icon="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          color={learningStatus === "Fehler" ? "red" : "cyan"}
        />
      </div>

      {/* Learning Trigger */}
      <div className="brain-section">
        <div className="brain-section-header">
          <h3>Lernzyklus</h3>
          <div className="brain-header-actions">
            <button
              className="brain-btn-primary"
              onClick={handleTriggerLearning}
              disabled={learningLoading}
            >
              {learningLoading && <span className="brain-spinner-small" />}
              Lernzyklus starten
            </button>
            <button className="brain-btn-ghost" onClick={() => { onRefresh(); loadInsights(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56M21 3v5h-5" />
              </svg>
              Aktualisieren
            </button>
          </div>
        </div>
        <p style={{ fontSize: "0.8rem", color: "#71717a", margin: 0 }}>
          Startet einen Lernzyklus, der neue Muster erkennt, Regeln aktualisiert und Wissen konsolidiert.
        </p>
      </div>

      {/* Knowledge by Category */}
      {stats?.knowledge?.byCategory && Object.keys(stats.knowledge.byCategory).length > 0 && (
        <div className="brain-section">
          <h3>Wissen nach Kategorie</h3>
          <div className="brain-kpi-grid">
            {Object.entries(stats.knowledge.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => {
                const total = stats.knowledge.total || 1;
                const pct = ((count / total) * 100).toFixed(1);
                return (
                  <div key={category} className="brain-card">
                    <div className="brain-card-title" style={{ textTransform: "capitalize" }}>{category}</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f1f5f9", margin: "0.25rem 0" }}>
                      {count.toLocaleString("de-DE")}
                    </div>
                    <div className="brain-confidence-bar">
                      <div className="brain-confidence-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="brain-confidence-text">{pct}%</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="brain-section">
        <h3>Insights</h3>
        {insights.length === 0 ? (
          <div className="brain-empty">Keine Insights vorhanden.</div>
        ) : (
          <div className="brain-insights-list">
            {insights.map((insight, i) => (
              <div key={i} className={`brain-insight brain-insight-${insight.severity}`}>
                <span className="brain-insight-severity">{insight.severity.toUpperCase()}</span>
                <div className="brain-insight-content">
                  <div className="brain-insight-title">{insight.title}</div>
                  <div className="brain-insight-desc">{insight.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
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
    <div className={`brain-kpi-card brain-kpi-${color}`}>
      <div className="brain-kpi-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <div className="brain-kpi-value">{value}</div>
      <div className="brain-kpi-label">{label}</div>
      {subtitle && <div className="brain-kpi-subtitle">{subtitle}</div>}
    </div>
  );
}
