/**
 * RAG Feedback Tab - Feedback-Statistiken und Bewertungsverteilung
 */

import { useState, useEffect } from "react";
import { ragApi } from "../../api/rag.api";

interface FeedbackStats {
  avgRating: number;
  totalFeedback: number;
  ratingDistribution: Record<string, number>;
}

export function FeedbackTab() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [days]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await ragApi.getFeedbackStats(days);
      setStats({
        avgRating: res.avgRating || 0,
        totalFeedback: res.totalFeedback || 0,
        ratingDistribution: res.ratingDistribution || {},
      });
    } catch (err) {
      console.error("Feedback-Stats laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="rag-tab-loading"><div className="rag-spinner" /></div>;
  }

  const maxCount = Math.max(1, ...Object.values(stats?.ratingDistribution || {}));

  return (
    <div className="rag-tab-content">
      <div className="rag-section-header">
        <h3>Feedback-Statistiken</h3>
        <select className="rag-select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Letzte 7 Tage</option>
          <option value={30}>Letzte 30 Tage</option>
          <option value={90}>Letzte 90 Tage</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="rag-kpi-grid">
        <div className="rag-kpi-card rag-kpi-violet">
          <div className="rag-kpi-value">{stats?.totalFeedback || 0}</div>
          <div className="rag-kpi-label">Feedback Gesamt</div>
        </div>
        <div className="rag-kpi-card rag-kpi-amber">
          <div className="rag-kpi-value">{stats?.avgRating?.toFixed(1) || "0.0"}</div>
          <div className="rag-kpi-label">Durchschnittliche Bewertung</div>
          <div className="rag-kpi-subtitle">von 5.0</div>
        </div>
        <div className="rag-kpi-card rag-kpi-emerald">
          <div className="rag-kpi-value">
            {stats?.avgRating ? renderStars(stats.avgRating) : "-"}
          </div>
          <div className="rag-kpi-label">Sterne</div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="rag-section">
        <h3>Bewertungsverteilung</h3>
        {stats?.totalFeedback === 0 ? (
          <div className="rag-empty">Noch kein Feedback erhalten.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats?.ratingDistribution?.[String(rating)] || 0;
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={rating} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ minWidth: "20px", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>
                    {rating}
                  </span>
                  <span style={{ color: "#fbbf24", fontSize: "0.85rem" }}>{"★".repeat(rating)}</span>
                  <div style={{ flex: 1, height: "8px", background: "rgba(51,65,85,0.5)", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: rating >= 4 ? "#4ade80" : rating >= 3 ? "#fbbf24" : "#f87171",
                        borderRadius: "4px",
                        transition: "width 0.5s",
                      }}
                    />
                  </div>
                  <span style={{ minWidth: "30px", textAlign: "right", color: "#71717a", fontSize: "0.8rem" }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}
