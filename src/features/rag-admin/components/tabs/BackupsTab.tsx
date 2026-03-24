/**
 * RAG Backups Tab - Backup Management
 */

import { useState, useEffect } from "react";
import { ragApi } from "../../api/rag.api";
import type { BackupInfo } from "../../types/rag.types";

export function BackupsTab() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const res = await ragApi.getBackups();
      setBackups(res.backups || []);
    } catch (err) {
      console.error("Backups laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    setMessage(null);
    try {
      const res = await ragApi.createBackup();
      setMessage({ type: "success", text: `Backup erstellt${res.sizeKb ? ` (${res.sizeKb} KB)` : ""}` });
      loadBackups();
    } catch (err) {
      setMessage({ type: "error", text: "Backup fehlgeschlagen" });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="rag-tab-loading"><div className="rag-spinner" /></div>;
  }

  const totalSizeKb = backups.reduce((sum, b) => sum + b.sizeKb, 0);

  return (
    <div className="rag-tab-content">
      {message && (
        <div className={`rag-message rag-message-${message.type}`}>
          {message.text}
          <button className="rag-message-close" onClick={() => setMessage(null)}>x</button>
        </div>
      )}

      <div className="rag-section-header">
        <h3>pgvector Backups ({backups.length})</h3>
        <button
          className="rag-btn-ghost"
          onClick={createBackup}
          disabled={creating}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          {creating ? "Erstellt..." : "Neues Backup"}
        </button>
      </div>

      {/* Summary */}
      <div className="rag-kpi-grid">
        <div className="rag-kpi-card rag-kpi-blue">
          <div className="rag-kpi-value">{backups.length}</div>
          <div className="rag-kpi-label">Backups</div>
        </div>
        <div className="rag-kpi-card rag-kpi-cyan">
          <div className="rag-kpi-value">
            {totalSizeKb > 1024 ? `${(totalSizeKb / 1024).toFixed(1)} MB` : `${totalSizeKb} KB`}
          </div>
          <div className="rag-kpi-label">Gesamtgröße</div>
        </div>
        <div className="rag-kpi-card rag-kpi-emerald">
          <div className="rag-kpi-value">7 Tage</div>
          <div className="rag-kpi-label">Retention</div>
        </div>
      </div>

      {/* Backup List */}
      {backups.length === 0 ? (
        <div className="rag-empty">Noch keine Backups vorhanden.</div>
      ) : (
        <div className="rag-section">
          <div className="rag-table-wrap">
            <table className="rag-table">
              <thead>
                <tr>
                  <th>Dateiname</th>
                  <th>Größe</th>
                  <th>Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup, i) => (
                  <tr key={i}>
                    <td className="rag-fw-medium" style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                      {backup.fileName}
                    </td>
                    <td>
                      {backup.sizeKb > 1024
                        ? `${(backup.sizeKb / 1024).toFixed(1)} MB`
                        : `${backup.sizeKb} KB`}
                    </td>
                    <td className="rag-text-dim">
                      {new Date(backup.createdAt).toLocaleString("de-DE")}
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
