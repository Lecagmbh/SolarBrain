/**
 * Claude AI Assistant Tab - Natural language commands for installations
 */

import { useState } from "react";
import { claudeApi } from "../../api/claude.api";
import type { AssistantResponse } from "../../types/claude.types";

const QUICK_COMMANDS = [
  { label: "Status zusammenfassen", command: "Fasse den aktuellen Status dieser Installation zusammen." },
  { label: "Was fehlt fuer Genehmigung?", command: "Was fehlt noch fuer die Genehmigung dieser Installation?" },
  { label: "Qualitaet pruefen", command: "Pruefe die Datenqualitaet dieser Installation." },
  { label: "Welche Dokumente fehlen?", command: "Welche Dokumente fehlen bei dieser Installation?" },
  { label: "Naechste Schritte?", command: "Was sind die naechsten Schritte fuer diese Installation?" },
];

export function AssistantTab() {
  const [installationId, setInstallationId] = useState("");
  const [command, setCommand] = useState("");
  const [execute, setExecute] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendCommand = async (cmdOverride?: string) => {
    const id = parseInt(installationId, 10);
    if (isNaN(id) || id <= 0) {
      setError("Bitte eine gueltige Installations-ID eingeben");
      return;
    }

    const cmd = cmdOverride || command;
    if (!cmd.trim()) {
      setError("Bitte einen Befehl eingeben");
      return;
    }

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const res = await claudeApi.executeAssistant(id, cmd, execute);
      setResponse(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Befehl fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCommand = (cmd: string) => {
    setCommand(cmd);
    sendCommand(cmd);
  };

  return (
    <div className="claude-tab-content">
      {/* Installation ID Input */}
      <div className="claude-section">
        <h3>Installations-Assistent</h3>
        <p className="claude-section-description">
          Stellen Sie natuerlichsprachliche Fragen oder geben Sie Befehle fuer eine bestimmte Installation.
        </p>
        <div className="claude-input-row">
          <label className="claude-input-label">
            Installations-ID:
            <input
              type="number"
              className="claude-input"
              placeholder="z.B. 42"
              value={installationId}
              onChange={(e) => setInstallationId(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="claude-section">
        <h3>Schnellbefehle</h3>
        <div className="claude-quick-commands">
          {QUICK_COMMANDS.map((qc) => (
            <button
              key={qc.label}
              className="claude-quick-cmd-btn"
              onClick={() => handleQuickCommand(qc.command)}
              disabled={loading || !installationId.trim()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8" />
              </svg>
              {qc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Free Text Command */}
      <div className="claude-section">
        <h3>Freier Befehl</h3>
        <div className="claude-command-area">
          <div className="claude-search-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="claude-search-icon">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <input
              type="text"
              className="claude-search-input"
              placeholder="Frage oder Befehl eingeben..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendCommand()}
            />
          </div>
          <div className="claude-command-controls">
            <label className="claude-checkbox-label">
              <input
                type="checkbox"
                checked={execute}
                onChange={(e) => setExecute(e.target.checked)}
              />
              Aktionen ausfuehren
            </label>
            <button
              className="claude-btn-primary"
              onClick={() => sendCommand()}
              disabled={loading || !installationId.trim() || !command.trim()}
            >
              {loading ? (
                <>
                  <div className="claude-spinner-small" />
                  Verarbeitet...
                </>
              ) : (
                "Senden"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="claude-message claude-message-error">
          {error}
          <button className="claude-message-close" onClick={() => setError(null)}>x</button>
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="claude-section claude-response-section">
          <h3>Antwort</h3>
          <div className="claude-response-text">{response.response}</div>

          {/* Pending Actions */}
          {response.actions && response.actions.length > 0 && (
            <div className="claude-actions-section">
              <h4>
                {response.executed ? "Ausgefuehrte Aktionen" : "Vorgeschlagene Aktionen"}
              </h4>
              <div className="claude-actions-list">
                {response.actions.map((action, i) => (
                  <div key={i} className="claude-action-item">
                    <div className="claude-action-header">
                      <span className={`claude-action-status ${response.executed ? "claude-action-executed" : "claude-action-pending"}`}>
                        {response.executed ? "Ausgefuehrt" : "Ausstehend"}
                      </span>
                      <span className="claude-action-type">{action.type}</span>
                    </div>
                    <div className="claude-action-description">{action.description}</div>
                    {action.data && Object.keys(action.data).length > 0 && (
                      <pre className="claude-action-data">
                        {JSON.stringify(action.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
