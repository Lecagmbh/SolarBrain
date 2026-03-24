/**
 * Brain Patterns & Rules Tab - Pattern and Rule management
 */

import { useState, useEffect } from "react";
import { brainApi } from "../../api/brain.api";
import type { BrainPattern, BrainRule } from "../../types/brain.types";

export function PatternsRulesTab() {
  const [patterns, setPatterns] = useState<BrainPattern[]>([]);
  const [rules, setRules] = useState<BrainRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [patternsRes, rulesRes] = await Promise.all([
        brainApi.getPatterns(),
        brainApi.getRules(),
      ]);
      setPatterns(patternsRes.patterns || []);
      setRules(rulesRes.rules || []);
    } catch (err) {
      console.error("Patterns/Rules laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="brain-tab-loading"><div className="brain-spinner" /></div>;
  }

  return (
    <div className="brain-tab-content">
      {/* Patterns Section */}
      <div className="brain-section">
        <div className="brain-section-header">
          <h3>Erkannte Patterns ({patterns.length})</h3>
          <button className="brain-btn-ghost" onClick={loadData}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56M21 3v5h-5" />
            </svg>
            Aktualisieren
          </button>
        </div>

        {patterns.length === 0 ? (
          <div className="brain-empty">Noch keine Patterns erkannt.</div>
        ) : (
          <div className="brain-card-grid">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="brain-card">
                <div className="brain-card-header">
                  <span className="brain-card-title">{pattern.name}</span>
                  <span className={`brain-badge brain-badge-mini ${pattern.status === "active" ? "brain-status-active" : "brain-status-inactive"}`}>
                    {pattern.status === "active" ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
                <div className="brain-card-desc">{pattern.description}</div>
                <div className="brain-confidence-bar">
                  <div
                    className="brain-confidence-fill"
                    style={{ width: `${(pattern.confidence * 100).toFixed(0)}%` }}
                  />
                </div>
                <div className="brain-card-meta">
                  <span className="brain-badge brain-badge-teal">{pattern.category}</span>
                  <span>Konfidenz: {(pattern.confidence * 100).toFixed(0)}%</span>
                  <span>Vorkommen: {pattern.occurrences}</span>
                  <span>{new Date(pattern.createdAt).toLocaleDateString("de-DE")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rules Section */}
      <div className="brain-section">
        <div className="brain-section-header">
          <h3>Aktive Regeln ({rules.length})</h3>
        </div>

        {rules.length === 0 ? (
          <div className="brain-empty">Noch keine Regeln definiert.</div>
        ) : (
          <div className="brain-card-grid">
            {rules.map((rule) => (
              <div key={rule.id} className="brain-card">
                <div className="brain-card-header">
                  <span className="brain-card-title">{rule.name}</span>
                  <span className={`brain-badge brain-badge-mini ${rule.status === "active" ? "brain-status-active" : "brain-status-inactive"}`}>
                    {rule.status === "active" ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
                <div className="brain-card-desc">{rule.description}</div>
                <div style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ color: "#71717a", minWidth: "70px" }}>Bedingung:</span>
                    <span style={{ color: "#94a3b8" }}>{rule.condition}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <span style={{ color: "#71717a", minWidth: "70px" }}>Aktion:</span>
                    <span style={{ color: "#94a3b8" }}>{rule.action}</span>
                  </div>
                </div>
                <div className="brain-card-meta">
                  <span className={`brain-priority-${rule.priority >= 8 ? "high" : rule.priority >= 5 ? "medium" : "low"}`}>
                    Prioritaet: {rule.priority}
                  </span>
                  <span>Ausloesungen: {rule.triggerCount}</span>
                  <span>{new Date(rule.createdAt).toLocaleDateString("de-DE")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
