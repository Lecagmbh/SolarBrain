/**
 * RAG Query Logs Tab - Live Query Monitoring
 */

import { useState, useEffect } from "react";
import { ragApi } from "../../api/rag.api";
import type { QueryLog } from "../../types/rag.types";

export function QueriesTab() {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 10000);
    return () => clearInterval(interval);
  }, [limit]);

  const loadLogs = async () => {
    try {
      const res = await ragApi.getQueryLogs(limit);
      setLogs(res.logs || []);
    } catch (err) {
      console.error("Query Logs laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="rag-tab-loading"><div className="rag-spinner" /></div>;
  }

  return (
    <div className="rag-tab-content">
      <div className="rag-section-header">
        <h3>Query Logs ({logs.length})</h3>
        <div className="rag-header-actions">
          <select
            className="rag-select"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={20}>20 Einträge</option>
            <option value={50}>50 Einträge</option>
            <option value={100}>100 Einträge</option>
            <option value={200}>200 Einträge</option>
          </select>
          <button className="rag-btn-ghost" onClick={loadLogs}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56M21 3v5h-5" />
            </svg>
            Aktualisieren
          </button>
        </div>
      </div>

      <div className="rag-table-wrap">
        <table className="rag-table">
          <thead>
            <tr>
              <th>Query</th>
              <th>Strategie</th>
              <th>Kategorien</th>
              <th>Ergebnisse</th>
              <th>Similarity</th>
              <th>Latenz</th>
              <th>Cache</th>
              <th>Kontext</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i}>
                <td className="rag-query-cell" title={log.queryText}>
                  {log.queryText.length > 60 ? log.queryText.substring(0, 60) + "..." : log.queryText}
                </td>
                <td>
                  <span className={`rag-strategy-badge rag-strategy-${log.strategy}`}>
                    {log.strategy}
                  </span>
                </td>
                <td>
                  <div className="rag-category-tags">
                    {log.categories?.map((cat, j) => (
                      <span key={j} className="rag-category-tag">{cat}</span>
                    ))}
                  </div>
                </td>
                <td className="rag-center">{log.resultCount}</td>
                <td className="rag-center">
                  {log.topSimilarity !== null ? `${(log.topSimilarity * 100).toFixed(1)}%` : "-"}
                </td>
                <td className="rag-center">
                  <span className={`rag-latency ${log.totalLatencyMs > 2000 ? "rag-latency-slow" : log.totalLatencyMs > 500 ? "rag-latency-medium" : "rag-latency-fast"}`}>
                    {log.totalLatencyMs}ms
                  </span>
                </td>
                <td className="rag-center">
                  {log.cachedHit ? (
                    <span className="rag-badge-mini rag-badge-green">HIT</span>
                  ) : (
                    <span className="rag-badge-mini rag-badge-dim">MISS</span>
                  )}
                </td>
                <td className="rag-text-dim">{log.context || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && (
        <div className="rag-empty">Noch keine Queries protokolliert.</div>
      )}
    </div>
  );
}
