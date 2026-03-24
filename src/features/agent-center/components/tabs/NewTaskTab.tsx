/**
 * New Task Tab - Create Agent Tasks
 */

import { useState } from "react";
import { agentApi } from "../../api/agent.api";

const AGENT_TYPES = [
  { value: "email_analyze", label: "Email Analyse", desc: "E-Mail-Inhalt analysieren und kategorisieren" },
  { value: "email_respond", label: "Email Antwort", desc: "Automatische E-Mail-Antwort generieren" },
  { value: "nb_submit", label: "NB Einreichung", desc: "Netzbetreiber-Formular einreichen" },
  { value: "nb_status_check", label: "NB Status Check", desc: "Netzbetreiber-Status abfragen" },
  { value: "nb_form_fill", label: "NB Formular", desc: "Netzbetreiber-Formular ausfüllen" },
  { value: "nb_portal", label: "NB Portal", desc: "Netzbetreiber-Portal Navigation" },
  { value: "smart_import", label: "Smart Import", desc: "Intelligenter Datenimport" },
  { value: "data_process", label: "Datenverarbeitung", desc: "Daten transformieren und verarbeiten" },
  { value: "report_generate", label: "Report Generator", desc: "Berichte automatisch erstellen" },
  { value: "db_health", label: "DB Health Check", desc: "Datenbank-Gesundheitsprüfung" },
  { value: "code_analysis", label: "Code Analyse", desc: "Quellcode analysieren und bewerten" },
  { value: "duplicate_finder", label: "Duplikat-Finder", desc: "Doppelte Einträge finden" },
  { value: "captcha_workflow", label: "Captcha Workflow", desc: "Captcha-Erkennung und Verarbeitung" },
  { value: "system_admin", label: "System Admin", desc: "Systemadministrationsaufgaben" },
] as const;

const DEFAULT_INPUT: Record<string, string> = {
  email_analyze: '{\n  "emailId": 123,\n  "content": ""\n}',
  email_respond: '{\n  "emailId": 123,\n  "tone": "professional"\n}',
  nb_submit: '{\n  "projectId": 1,\n  "netzbetreiber": ""\n}',
  nb_status_check: '{\n  "projectId": 1\n}',
  nb_form_fill: '{\n  "formType": "",\n  "data": {}\n}',
  nb_portal: '{\n  "portal": "",\n  "action": "login"\n}',
  smart_import: '{\n  "source": "",\n  "format": "csv"\n}',
  data_process: '{\n  "operation": "",\n  "target": ""\n}',
  report_generate: '{\n  "reportType": "",\n  "period": "monthly"\n}',
  db_health: '{\n  "database": "gridnetz_db"\n}',
  code_analysis: '{\n  "path": "",\n  "language": "typescript"\n}',
  duplicate_finder: '{\n  "table": "",\n  "fields": []\n}',
  captcha_workflow: '{\n  "url": "",\n  "type": "recaptcha"\n}',
  system_admin: '{\n  "command": "",\n  "target": ""\n}',
};

interface Props {
  onCreated: () => void;
}

export function NewTaskTab({ onCreated }: Props) {
  const [selectedType, setSelectedType] = useState<string>(AGENT_TYPES[0].value);
  const [inputJson, setInputJson] = useState(DEFAULT_INPUT[AGENT_TYPES[0].value] || "{}");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setInputJson(DEFAULT_INPUT[type] || "{}");
    setJsonError(null);
    setResult(null);
    setMessage(null);
  };

  const validateJson = (value: string): boolean => {
    try {
      JSON.parse(value);
      setJsonError(null);
      return true;
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Ungültiges JSON");
      return false;
    }
  };

  const handleInputChange = (value: string) => {
    setInputJson(value);
    if (value.trim()) {
      validateJson(value);
    } else {
      setJsonError(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateJson(inputJson)) return;

    setSubmitting(true);
    setMessage(null);
    setResult(null);

    try {
      const parsedInput = JSON.parse(inputJson);
      const res = await agentApi.createTask(selectedType, parsedInput);
      setResult(res as unknown as Record<string, unknown>);
      setMessage({
        type: "success",
        text: `Task #${res.taskId} erfolgreich erstellt (Typ: ${selectedType})`,
      });
      onCreated();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Task konnte nicht erstellt werden";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAgent = AGENT_TYPES.find((t) => t.value === selectedType);

  return (
    <div className="agent-tab-content">
      {/* Message */}
      {message && (
        <div className={`agent-message agent-message-${message.type}`}>
          {message.text}
          <button className="agent-message-close" onClick={() => setMessage(null)}>
            x
          </button>
        </div>
      )}

      <div className="agent-section">
        <h3>Neuen Task erstellen</h3>

        <div className="agent-form">
          {/* Type Selection */}
          <div className="agent-form-group">
            <label className="agent-form-label">Agent-Typ</label>
            <select
              className="agent-select"
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              style={{ maxWidth: "400px" }}
            >
              {AGENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} ({type.value})
                </option>
              ))}
            </select>
            {selectedAgent && (
              <span className="agent-form-hint">{selectedAgent.desc}</span>
            )}
          </div>

          {/* JSON Input */}
          <div className="agent-form-group">
            <label className="agent-form-label">Task-Input (JSON)</label>
            <textarea
              className="agent-textarea"
              value={inputJson}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder='{"key": "value"}'
              spellCheck={false}
            />
            {jsonError && (
              <span style={{ fontSize: "0.75rem", color: "#f87171" }}>
                JSON-Fehler: {jsonError}
              </span>
            )}
            <span className="agent-form-hint">
              Gib die Eingabedaten als JSON-Objekt ein. Das Template wird automatisch
              für den gewählten Agent-Typ geladen.
            </span>
          </div>

          {/* Submit */}
          <div>
            <button
              className="agent-btn-submit"
              onClick={handleSubmit}
              disabled={submitting || !!jsonError}
            >
              {submitting ? (
                <>
                  <span className="agent-spinner-small" />
                  Wird erstellt...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Task erstellen
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="agent-section">
          <h3>Ergebnis</h3>
          <div className="agent-result-display">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Agent Type Reference */}
      <div className="agent-section">
        <h3>Verfügbare Agenten</h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "0.75rem",
        }}>
          {AGENT_TYPES.map((type) => (
            <div
              key={type.value}
              style={{
                background: selectedType === type.value
                  ? "rgba(245, 158, 11, 0.08)"
                  : "rgba(30, 41, 59, 0.3)",
                border: `1px solid ${
                  selectedType === type.value
                    ? "rgba(245, 158, 11, 0.3)"
                    : "rgba(51, 65, 85, 0.4)"
                }`,
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => handleTypeChange(type.value)}
            >
              <div style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: selectedType === type.value ? "#fbbf24" : "#e2e8f0",
              }}>
                {type.label}
              </div>
              <div style={{
                fontSize: "0.7rem",
                color: "#71717a",
                marginTop: "0.15rem",
                fontFamily: "monospace",
              }}>
                {type.value}
              </div>
              <div style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                marginTop: "0.35rem",
              }}>
                {type.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
