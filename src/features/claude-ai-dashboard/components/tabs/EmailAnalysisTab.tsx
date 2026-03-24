/**
 * Claude AI Email Analysis Tab - Batch & single email analysis
 */

import { useState } from "react";
import { claudeApi } from "../../api/claude.api";
import type { ClaudeAIDashboard, EmailAnalysis } from "../../types/claude.types";

interface Props {
  dashboard: ClaudeAIDashboard | null;
}

const EMAIL_TYPE_COLORS: Record<EmailAnalysis["type"], { bg: string; color: string; label: string }> = {
  GENEHMIGUNG: { bg: "rgba(16, 185, 129, 0.15)", color: "#10b981", label: "Genehmigung" },
  RUECKFRAGE: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", label: "Rueckfrage" },
  ABLEHNUNG: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", label: "Ablehnung" },
  INFO: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", label: "Info" },
  SONSTIGES: { bg: "rgba(107, 114, 128, 0.15)", color: "#6b7280", label: "Sonstiges" },
};

export function EmailAnalysisTab({ dashboard }: Props) {
  // Batch analysis state
  const [batchLimit, setBatchLimit] = useState(10);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<{ analyzed: number; results: EmailAnalysis[] } | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Single analysis state
  const [emailId, setEmailId] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<EmailAnalysis | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);

  const startBatchAnalysis = async () => {
    setBatchLoading(true);
    setBatchResult(null);
    setBatchError(null);

    try {
      const res = await claudeApi.batchAnalyze(batchLimit);
      setBatchResult({ analyzed: res.analyzed, results: res.results });
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "Batch-Analyse fehlgeschlagen");
    } finally {
      setBatchLoading(false);
    }
  };

  const analyzeSingleEmail = async () => {
    const id = parseInt(emailId, 10);
    if (isNaN(id) || id <= 0) {
      setSingleError("Bitte eine gueltige Email-ID eingeben");
      return;
    }

    setSingleLoading(true);
    setSingleResult(null);
    setSingleError(null);

    try {
      const res = await claudeApi.analyzeEmail(id);
      setSingleResult(res.analysis);
    } catch (err) {
      setSingleError(err instanceof Error ? err.message : "Analyse fehlgeschlagen");
    } finally {
      setSingleLoading(false);
    }
  };

  return (
    <div className="claude-tab-content">
      {/* Batch Analysis Section */}
      <div className="claude-section">
        <h3>Batch-Analyse starten</h3>
        <p className="claude-section-description">
          Analysiert unverarbeitete Emails automatisch mit Claude AI.
        </p>
        <div className="claude-input-row">
          <label className="claude-input-label">
            Limit (1-50):
            <input
              type="number"
              className="claude-input"
              min={1}
              max={50}
              value={batchLimit}
              onChange={(e) => setBatchLimit(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 1)))}
            />
          </label>
          <button
            className="claude-btn-primary"
            onClick={startBatchAnalysis}
            disabled={batchLoading}
          >
            {batchLoading ? (
              <>
                <div className="claude-spinner-small" />
                Analysiert...
              </>
            ) : (
              "Analyse starten"
            )}
          </button>
        </div>

        {batchError && (
          <div className="claude-message claude-message-error">
            {batchError}
            <button className="claude-message-close" onClick={() => setBatchError(null)}>x</button>
          </div>
        )}

        {batchResult && (
          <div className="claude-batch-result">
            <div className="claude-message claude-message-success">
              {batchResult.analyzed} Email(s) analysiert
            </div>
            {batchResult.results.length > 0 && (
              <div className="claude-analyses-list" style={{ marginTop: "0.75rem" }}>
                {batchResult.results.map((analysis) => (
                  <AnalysisCard key={analysis.id} analysis={analysis} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single Email Analysis */}
      <div className="claude-section">
        <h3>Einzelne Email analysieren</h3>
        <div className="claude-input-row">
          <label className="claude-input-label">
            Email-ID:
            <input
              type="number"
              className="claude-input"
              placeholder="z.B. 1234"
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyzeSingleEmail()}
            />
          </label>
          <button
            className="claude-btn-primary"
            onClick={analyzeSingleEmail}
            disabled={singleLoading || !emailId.trim()}
          >
            {singleLoading ? (
              <>
                <div className="claude-spinner-small" />
                Analysiert...
              </>
            ) : (
              "Analysieren"
            )}
          </button>
        </div>

        {singleError && (
          <div className="claude-message claude-message-error">
            {singleError}
            <button className="claude-message-close" onClick={() => setSingleError(null)}>x</button>
          </div>
        )}

        {singleResult && (
          <div className="claude-single-result">
            <AnalysisDetailCard analysis={singleResult} />
          </div>
        )}
      </div>

      {/* Recent Analyses from Dashboard */}
      {dashboard?.recentAnalyses && dashboard.recentAnalyses.length > 0 && (
        <div className="claude-section">
          <h3>Letzte Analysen</h3>
          <div className="claude-analyses-list">
            {dashboard.recentAnalyses.map((analysis) => (
              <AnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: EmailAnalysis }) {
  const typeConfig = EMAIL_TYPE_COLORS[analysis.type] || EMAIL_TYPE_COLORS.SONSTIGES;

  return (
    <div className="claude-analysis-card">
      <div className="claude-analysis-header">
        <span
          className="claude-type-badge"
          style={{ background: typeConfig.bg, color: typeConfig.color, border: `1px solid ${typeConfig.color}30` }}
        >
          {typeConfig.label}
        </span>
        <span className="claude-confidence">
          {(analysis.confidence * 100).toFixed(0)}%
        </span>
        <span className="claude-text-dim claude-text-xs">
          Email #{analysis.emailId}
          {analysis.installationId ? ` | Installation #${analysis.installationId}` : ""}
        </span>
        <span className="claude-text-dim claude-text-xs" style={{ marginLeft: "auto" }}>
          {new Date(analysis.createdAt).toLocaleString("de-DE")}
        </span>
      </div>
      <div className="claude-analysis-summary">{analysis.summary}</div>
    </div>
  );
}

function AnalysisDetailCard({ analysis }: { analysis: EmailAnalysis }) {
  const typeConfig = EMAIL_TYPE_COLORS[analysis.type] || EMAIL_TYPE_COLORS.SONSTIGES;

  return (
    <div className="claude-detail-card">
      <div className="claude-detail-header">
        <span
          className="claude-type-badge"
          style={{ background: typeConfig.bg, color: typeConfig.color, border: `1px solid ${typeConfig.color}30` }}
        >
          {typeConfig.label}
        </span>
        <span className="claude-confidence-large">
          Konfidenz: {(analysis.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div className="claude-detail-grid">
        <div className="claude-detail-row">
          <span className="claude-detail-label">Typ</span>
          <span className="claude-detail-value">{analysis.type}</span>
        </div>
        <div className="claude-detail-row">
          <span className="claude-detail-label">Email-ID</span>
          <span className="claude-detail-value">#{analysis.emailId}</span>
        </div>
        {analysis.installationId && (
          <div className="claude-detail-row">
            <span className="claude-detail-label">Installation</span>
            <span className="claude-detail-value">#{analysis.installationId}</span>
          </div>
        )}
        {analysis.deadline && (
          <div className="claude-detail-row">
            <span className="claude-detail-label">Frist</span>
            <span className="claude-detail-value">{new Date(analysis.deadline).toLocaleDateString("de-DE")}</span>
          </div>
        )}
      </div>

      <div className="claude-detail-section">
        <strong>Zusammenfassung</strong>
        <p>{analysis.summary}</p>
      </div>

      {analysis.requirements && analysis.requirements.length > 0 && (
        <div className="claude-detail-section">
          <strong>Anforderungen</strong>
          <ul className="claude-requirements-list">
            {analysis.requirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.suggestedAction && (
        <div className="claude-detail-section">
          <strong>Empfohlene Aktion</strong>
          <p className="claude-suggested-action">{analysis.suggestedAction}</p>
        </div>
      )}

      <div className="claude-detail-footer">
        Analysiert am {new Date(analysis.createdAt).toLocaleString("de-DE")}
      </div>
    </div>
  );
}
