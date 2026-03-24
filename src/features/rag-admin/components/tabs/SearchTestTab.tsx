/**
 * RAG Search Test Tab - Interactive search testing
 */

import { useState } from "react";
import { ragApi } from "../../api/rag.api";

interface SearchResult {
  content: string;
  originalContent?: string;
  similarity: number;
  originalSimilarity?: number;
  category: string;
  sourceType: string;
  sourceId: string;
  metadata?: Record<string, unknown>;
}

export function SearchTestTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [meta, setMeta] = useState<{
    mode: string;
    resultCount: number;
    totalLatencyMs: number;
    routing?: { strategy: string; categories: string[]; confidence: number; reasoning: string };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setMeta(null);

    try {
      const res = await ragApi.testSearch(query, { enterprise: true });
      setResults((res.results as SearchResult[]) || []);
      setMeta({
        mode: res.mode,
        resultCount: res.resultCount,
        totalLatencyMs: res.totalLatencyMs,
        routing: (res as Record<string, unknown>).routing as typeof meta extends null ? never : NonNullable<typeof meta>["routing"],
      });
    } catch (err) {
      console.error("Suche fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rag-tab-content">
      {/* Search Input */}
      <div className="rag-search-box">
        <div className="rag-search-input-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rag-search-icon">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="rag-search-input"
            placeholder="Enterprise RAG Suche testen..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <button
            className="rag-search-btn"
            onClick={search}
            disabled={loading || !query.trim()}
          >
            {loading ? <div className="rag-spinner-small" /> : "Suchen"}
          </button>
        </div>
      </div>

      {/* Routing Info */}
      {meta?.routing && (
        <div className="rag-routing-info">
          <div className="rag-routing-row">
            <span className="rag-routing-label">Strategie:</span>
            <span className={`rag-strategy-badge rag-strategy-${meta.routing.strategy}`}>
              {meta.routing.strategy}
            </span>
          </div>
          <div className="rag-routing-row">
            <span className="rag-routing-label">Kategorien:</span>
            <div className="rag-category-tags">
              {meta.routing.categories.map((cat, i) => (
                <span key={i} className="rag-category-tag">{cat}</span>
              ))}
            </div>
          </div>
          <div className="rag-routing-row">
            <span className="rag-routing-label">Konfidenz:</span>
            <span>{(meta.routing.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="rag-routing-row">
            <span className="rag-routing-label">Reasoning:</span>
            <span className="rag-text-dim">{meta.routing.reasoning}</span>
          </div>
          <div className="rag-routing-row">
            <span className="rag-routing-label">Latenz:</span>
            <span className="rag-latency rag-latency-fast">{meta.totalLatencyMs}ms</span>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="rag-section">
          <h3>{meta?.resultCount} Ergebnisse</h3>
          <div className="rag-results-list">
            {results.map((r, i) => (
              <div
                key={i}
                className={`rag-result-card ${expandedIdx === i ? "expanded" : ""}`}
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              >
                <div className="rag-result-header">
                  <div className="rag-result-rank">#{i + 1}</div>
                  <div className="rag-result-meta">
                    <span className="rag-category-tag">{r.category}</span>
                    <span className="rag-text-dim">{r.sourceType}:{r.sourceId}</span>
                  </div>
                  <div className="rag-result-scores">
                    <span className="rag-result-score">
                      {(r.similarity * 100).toFixed(1)}%
                    </span>
                    {r.originalSimilarity !== undefined && (
                      <span className="rag-text-dim rag-text-xs">
                        (orig: {(r.originalSimilarity * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="rag-result-content">
                  {r.content.length > 200 && expandedIdx !== i
                    ? r.content.substring(0, 200) + "..."
                    : r.content}
                </div>
                {expandedIdx === i && r.metadata && Object.keys(r.metadata).length > 0 && (
                  <div className="rag-result-metadata">
                    <strong>Metadata:</strong>
                    <pre>{JSON.stringify(r.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && meta && (
        <div className="rag-empty">Keine Ergebnisse gefunden.</div>
      )}
    </div>
  );
}
