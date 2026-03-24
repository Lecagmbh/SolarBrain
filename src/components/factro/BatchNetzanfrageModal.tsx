/**
 * BatchNetzanfrageModal – Massenversand von Netzanfragen für Groß-/Schwarmspeicher
 *
 * 4 Phasen: Laden → Übersicht/Auswahl → Versand → Ergebnis
 */

import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "../../modules/api/client";
import {
  X, Loader2, Send, CheckCircle2, AlertTriangle,
  Mail, MapPin, Zap, ChevronDown, ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BatchPreviewItem {
  projectId: number;
  factroNumber: number | null;
  title: string;
  customerName: string | null;
  plz: string | null;
  ort: string | null;
  category: string;
  vnbEmail: string | null;
  vnbName: string | null;
  leistungKw: number | null;
  missingFields: string[];
  canSend: boolean;
}

interface BatchPreviewResult {
  items: BatchPreviewItem[];
  totalFound: number;
  sendableCount: number;
}

interface BatchSendResultItem {
  projectId: number;
  title: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BatchSendResult {
  results: BatchSendResultItem[];
  totalSent: number;
  totalFailed: number;
  durationMs: number;
}

interface Props {
  onClose: () => void;
  onComplete: () => void;
}

type Phase = "loading" | "preview" | "sending" | "result";

// ─── Component ───────────────────────────────────────────────────────────────

export default function BatchNetzanfrageModal({ onClose, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);

  // Preview
  const [previewData, setPreviewData] = useState<BatchPreviewResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showUnsendable, setShowUnsendable] = useState(false);

  // Result
  const [sendResult, setSendResult] = useState<BatchSendResult | null>(null);

  // ─── Load Preview ────────────────────────────────────────────────────────

  const loadPreview = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const data: BatchPreviewResult = await apiGet("/factro/netzanfrage/batch/preview");
      setPreviewData(data);
      // Pre-select all sendable
      const sendableIds = new Set(data.items.filter((i) => i.canSend).map((i) => i.projectId));
      setSelected(sendableIds);
      setPhase("preview");
    } catch (err: any) {
      setError(err?.message || "Fehler beim Laden der Vorschau");
      setPhase("preview");
    }
  }, []);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  // ─── Selection Handlers ──────────────────────────────────────────────────

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!previewData) return;
    const sendable = previewData.items.filter((i) => i.canSend);
    if (selected.size === sendable.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sendable.map((i) => i.projectId)));
    }
  };

  // ─── Send Batch ──────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (selected.size === 0) return;

    setPhase("sending");
    try {
      const result: BatchSendResult = await apiPost("/factro/netzanfrage/batch/send", {
        projectIds: Array.from(selected),
      });
      setSendResult(result);
      setPhase("result");
    } catch (err: any) {
      setError(err?.message || "Fehler beim Senden");
      setPhase("result");
    }
  };

  // ─── Close Handler ───────────────────────────────────────────────────────

  const handleClose = () => {
    if (phase === "result" && sendResult && sendResult.totalSent > 0) {
      onComplete();
    }
    onClose();
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const formatLeistung = (kw: number) => {
    if (kw >= 1000) return `${(kw / 1000).toFixed(kw % 1000 === 0 ? 0 : 1)} MW`;
    return `${kw} kW`;
  };

  const sendableItems = previewData?.items.filter((i) => i.canSend) || [];
  const unsendableItems = previewData?.items.filter((i) => !i.canSend) || [];

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="factro-batch-overlay" onClick={(e) => { if (e.target === e.currentTarget && phase !== "sending") handleClose(); }}>
      <div className="factro-batch-modal">
        {/* Header */}
        <div className="factro-batch-header">
          <div>
            <h2>Batch-Netzanfrage</h2>
            <p className="factro-batch-subtitle">Groß- &amp; Schwarmspeicher – Massenversand</p>
          </div>
          {phase !== "sending" && (
            <button className="factro-batch-close" onClick={handleClose}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Phase: Loading */}
        {phase === "loading" && (
          <div className="factro-batch-loading">
            <Loader2 size={32} className="spin" />
            <span>Lade Projekte & prüfe VNB-Emails...</span>
          </div>
        )}

        {/* Phase: Preview */}
        {phase === "preview" && previewData && (
          <>
            {/* Summary */}
            <div className="factro-batch-summary">
              <div className="factro-batch-stat factro-batch-stat--ok">
                <CheckCircle2 size={16} />
                <span>{previewData.sendableCount} sendbar</span>
              </div>
              <div className="factro-batch-stat factro-batch-stat--warn">
                <AlertTriangle size={16} />
                <span>{previewData.totalFound - previewData.sendableCount} unvollständig</span>
              </div>
              <div className="factro-batch-stat">
                <Send size={16} />
                <span>{selected.size} ausgewählt</span>
              </div>
            </div>

            {/* Sendable Table */}
            <div className="factro-batch-table-wrap">
              <table className="factro-batch-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        checked={sendableItems.length > 0 && selected.size === sendableItems.length}
                        onChange={toggleAll}
                      />
                    </th>
                    <th style={{ width: 70 }}>#</th>
                    <th>Kunde</th>
                    <th style={{ width: 130 }}>PLZ / Ort</th>
                    <th>VNB-Email</th>
                    <th style={{ width: 90 }}>Leistung</th>
                  </tr>
                </thead>
                <tbody>
                  {sendableItems.map((item) => (
                    <tr
                      key={item.projectId}
                      className={`factro-batch-row ${selected.has(item.projectId) ? "factro-batch-row--selected" : ""}`}
                      onClick={() => toggleSelect(item.projectId)}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(item.projectId)}
                          onChange={() => toggleSelect(item.projectId)}
                        />
                      </td>
                      <td className="factro-batch-num">{item.factroNumber || "–"}</td>
                      <td>{item.customerName || item.title}</td>
                      <td>
                        <span className="factro-batch-location">
                          <MapPin size={12} />
                          {item.plz} {item.ort}
                        </span>
                      </td>
                      <td>
                        <span className="factro-batch-email">
                          <Mail size={12} />
                          {item.vnbEmail}
                        </span>
                      </td>
                      <td>
                        {item.leistungKw ? (
                          <span className="factro-batch-leistung">
                            <Zap size={12} />
                            {formatLeistung(item.leistungKw)}
                          </span>
                        ) : "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Unsendable Section */}
            {unsendableItems.length > 0 && (
              <div className="factro-batch-unsendable">
                <button
                  className="factro-batch-unsendable-toggle"
                  onClick={() => setShowUnsendable(!showUnsendable)}
                >
                  {showUnsendable ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {unsendableItems.length} unvollständige Projekte
                </button>
                {showUnsendable && (
                  <div className="factro-batch-unsendable-list">
                    {unsendableItems.map((item) => (
                      <div key={item.projectId} className="factro-batch-row factro-batch-row--disabled">
                        <span className="factro-batch-num">{item.factroNumber || "–"}</span>
                        <span>{item.customerName || item.title}</span>
                        <span className="factro-batch-missing">
                          Fehlt: {item.missingFields.join(", ") || (item.vnbEmail ? "–" : "VNB-Email")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="factro-batch-footer">
              <button className="factro-btn" onClick={handleClose}>
                Abbrechen
              </button>
              <button
                className="factro-btn factro-btn-primary"
                disabled={selected.size === 0}
                onClick={handleSend}
              >
                <Send size={16} />
                {selected.size} Netzanfrage{selected.size !== 1 ? "n" : ""} senden
              </button>
            </div>
          </>
        )}

        {/* Phase: Sending */}
        {phase === "sending" && (
          <div className="factro-batch-loading">
            <div className="factro-batch-progress">
              <div className="factro-batch-progress-bar" />
            </div>
            <span>Sende {selected.size} Netzanfragen... Bitte warten.</span>
            <p className="factro-batch-hint">Dies kann einige Minuten dauern.</p>
          </div>
        )}

        {/* Phase: Result */}
        {phase === "result" && (
          <div className="factro-batch-results">
            {error && !sendResult && (
              <div className="factro-batch-result-error">
                <AlertTriangle size={24} />
                <span>{error}</span>
              </div>
            )}

            {sendResult && (
              <>
                <div className="factro-batch-result-summary">
                  <div className="factro-batch-stat factro-batch-stat--ok">
                    <CheckCircle2 size={20} />
                    <span><strong>{sendResult.totalSent}</strong> erfolgreich gesendet</span>
                  </div>
                  {sendResult.totalFailed > 0 && (
                    <div className="factro-batch-stat factro-batch-stat--error">
                      <AlertTriangle size={20} />
                      <span><strong>{sendResult.totalFailed}</strong> fehlgeschlagen</span>
                    </div>
                  )}
                  <div className="factro-batch-stat">
                    <span>Dauer: {(sendResult.durationMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>

                {/* Failed items */}
                {sendResult.results.filter((r) => !r.success).length > 0 && (
                  <div className="factro-batch-failed-list">
                    <h4>Fehlgeschlagene Projekte:</h4>
                    {sendResult.results
                      .filter((r) => !r.success)
                      .map((r) => (
                        <div key={r.projectId} className="factro-batch-failed-item">
                          <span>{r.title}</span>
                          <span className="factro-batch-failed-reason">{r.error}</span>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}

            <div className="factro-batch-footer">
              <button className="factro-btn factro-btn-primary" onClick={handleClose}>
                Schließen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
