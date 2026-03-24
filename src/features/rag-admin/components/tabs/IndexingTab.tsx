/**
 * RAG Indexing Tab - Indexierung verwalten, Changes erkennen
 */

import { useState, useEffect } from "react";
import { ragApi } from "../../api/rag.api";
import type { RagStatus, ChangeDetection } from "../../types/rag.types";

interface Props {
  status: RagStatus | null;
  onRefresh: () => void;
}

export function IndexingTab({ status, onRefresh }: Props) {
  const [changes, setChanges] = useState<ChangeDetection[]>([]);
  const [indexingCategory, setIndexingCategory] = useState<string | null>(null);
  const [indexingAll, setIndexingAll] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChanges();
  }, []);

  const loadChanges = async () => {
    try {
      const res = await ragApi.getChanges();
      setChanges(res.changes || []);
    } catch (err) {
      console.error("Changes laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  };

  const startIndex = async (category?: string) => {
    if (category) setIndexingCategory(category);
    else setIndexingAll(true);
    setMessage(null);

    try {
      const res = await ragApi.startIndex(category, true);
      setMessage({ type: "success", text: `Indexierung gestartet${res.jobId ? ` (Job: ${res.jobId})` : ""}` });
      setTimeout(() => {
        onRefresh();
        loadChanges();
      }, 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Indexierung fehlgeschlagen" });
    } finally {
      setIndexingCategory(null);
      setIndexingAll(false);
    }
  };

  const startReindex = async () => {
    setReindexing(true);
    setMessage(null);
    try {
      const res = await ragApi.startReindex();
      setMessage({ type: "success", text: `Inkrementeller Reindex: ${res.reindexedCategories} Kategorien aktualisiert` });
      onRefresh();
      loadChanges();
    } catch (err) {
      setMessage({ type: "error", text: "Reindex fehlgeschlagen" });
    } finally {
      setReindexing(false);
    }
  };

  const createBackup = async () => {
    setBackingUp(true);
    setMessage(null);
    try {
      const res = await ragApi.createBackup();
      setMessage({ type: "success", text: `Backup erstellt${res.sizeKb ? ` (${res.sizeKb} KB)` : ""}` });
    } catch (err) {
      setMessage({ type: "error", text: "Backup fehlgeschlagen" });
    } finally {
      setBackingUp(false);
    }
  };

  const clearCache = async () => {
    try {
      await ragApi.clearCache();
      setMessage({ type: "success", text: "Cache geleert" });
    } catch (err) {
      setMessage({ type: "error", text: "Cache leeren fehlgeschlagen" });
    }
  };

  const pendingChanges = changes.filter((c) => c.hasChanges);

  return (
    <div className="rag-tab-content">
      {/* Message */}
      {message && (
        <div className={`rag-message rag-message-${message.type}`}>
          {message.text}
          <button className="rag-message-close" onClick={() => setMessage(null)}>x</button>
        </div>
      )}

      {/* Actions */}
      <div className="rag-section">
        <h3>Aktionen</h3>
        <div className="rag-action-grid">
          <button
            className="rag-action-btn"
            onClick={() => startIndex()}
            disabled={indexingAll}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M21 12a9 9 0 11-6.219-8.56M21 3v5h-5" />
            </svg>
            <span>{indexingAll ? "Indexiert..." : "Alle indexieren"}</span>
          </button>

          <button
            className="rag-action-btn"
            onClick={startReindex}
            disabled={reindexing}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
            </svg>
            <span>{reindexing ? "Reindexiert..." : "Inkrementeller Reindex"}</span>
            {pendingChanges.length > 0 && (
              <span className="rag-action-badge">{pendingChanges.length}</span>
            )}
          </button>

          <button
            className="rag-action-btn"
            onClick={createBackup}
            disabled={backingUp}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span>{backingUp ? "Backup..." : "Backup erstellen"}</span>
          </button>

          <button className="rag-action-btn rag-action-danger" onClick={clearCache}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            <span>Cache leeren</span>
          </button>
        </div>
      </div>

      {/* Change Detection */}
      <div className="rag-section">
        <div className="rag-section-header">
          <h3>Change Detection</h3>
          <button className="rag-btn-ghost" onClick={loadChanges}>Prüfen</button>
        </div>

        {loading ? (
          <div className="rag-tab-loading"><div className="rag-spinner" /></div>
        ) : (
          <div className="rag-table-wrap">
            <table className="rag-table">
              <thead>
                <tr>
                  <th>Kategorie</th>
                  <th>Status</th>
                  <th>Aktuell</th>
                  <th>Indexiert</th>
                  <th>Letzte Indexierung</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((c, i) => (
                  <tr key={i}>
                    <td className="rag-fw-medium">{c.category}</td>
                    <td>
                      {c.hasChanges ? (
                        <span className="rag-badge-mini rag-badge-yellow">Geändert</span>
                      ) : (
                        <span className="rag-badge-mini rag-badge-green">Aktuell</span>
                      )}
                    </td>
                    <td className="rag-center">{c.currentCount ?? "-"}</td>
                    <td className="rag-center">{c.indexedCount ?? "-"}</td>
                    <td className="rag-text-dim">
                      {c.lastIndexedAt ? new Date(c.lastIndexedAt).toLocaleString("de-DE") : "Nie"}
                    </td>
                    <td>
                      <button
                        className="rag-btn-small"
                        onClick={() => startIndex(c.category)}
                        disabled={indexingCategory === c.category}
                      >
                        {indexingCategory === c.category ? "..." : "Indexieren"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Last Jobs */}
      {status?.lastIndexingJobs && status.lastIndexingJobs.length > 0 && (
        <div className="rag-section">
          <h3>Letzte Jobs</h3>
          <div className="rag-table-wrap">
            <table className="rag-table">
              <thead>
                <tr>
                  <th>Kategorie</th>
                  <th>Status</th>
                  <th>Verarbeitet</th>
                  <th>Fehler</th>
                  <th>Gestartet</th>
                </tr>
              </thead>
              <tbody>
                {status.lastIndexingJobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.category}</td>
                    <td>
                      <span className={`rag-badge-mini ${job.status === "COMPLETED" ? "rag-badge-green" : job.status === "FAILED" ? "rag-badge-red" : "rag-badge-yellow"}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>{job.processedItems}/{job.totalItems}</td>
                    <td className={job.failedItems > 0 ? "rag-text-red" : ""}>{job.failedItems}</td>
                    <td className="rag-text-dim">
                      {job.startedAt ? new Date(job.startedAt).toLocaleString("de-DE") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
