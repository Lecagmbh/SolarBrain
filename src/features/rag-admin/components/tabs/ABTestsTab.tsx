/**
 * RAG A/B Tests Tab - A/B Test Management
 */

import { useState, useEffect } from "react";
import { ragApi } from "../../api/rag.api";
import type { ABTest } from "../../types/rag.types";

export function ABTestsTab() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New test form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formVarA, setFormVarA] = useState('{"strategy": "semantic", "topK": 5}');
  const [formVarB, setFormVarB] = useState('{"strategy": "hybrid", "topK": 5}');
  const [formSplit, setFormSplit] = useState(50);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const res = await ragApi.getABTests();
      setTests(res.tests || []);
    } catch (err) {
      console.error("A/B Tests laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  };

  const createTest = async () => {
    if (!formName.trim()) return;
    setCreating(true);
    setMessage(null);
    try {
      const varA = JSON.parse(formVarA);
      const varB = JSON.parse(formVarB);
      await ragApi.createABTest({
        name: formName,
        description: formDesc,
        variantA: varA,
        variantB: varB,
        trafficSplitPercent: formSplit,
      });
      setMessage({ type: "success", text: `A/B Test "${formName}" erstellt` });
      setShowForm(false);
      setFormName("");
      setFormDesc("");
      loadTests();
    } catch (err) {
      setMessage({ type: "error", text: "Test erstellen fehlgeschlagen - JSON prüfen" });
    } finally {
      setCreating(false);
    }
  };

  const stopTest = async (id: number) => {
    try {
      await ragApi.stopABTest(id);
      setMessage({ type: "success", text: "Test gestoppt" });
      loadTests();
    } catch (err) {
      setMessage({ type: "error", text: "Test stoppen fehlgeschlagen" });
    }
  };

  if (loading) {
    return <div className="rag-tab-loading"><div className="rag-spinner" /></div>;
  }

  return (
    <div className="rag-tab-content">
      {message && (
        <div className={`rag-message rag-message-${message.type}`}>
          {message.text}
          <button className="rag-message-close" onClick={() => setMessage(null)}>x</button>
        </div>
      )}

      <div className="rag-section-header">
        <h3>A/B Tests ({tests.length})</h3>
        <button className="rag-btn-ghost" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Abbrechen" : "+ Neuer Test"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rag-section">
          <h3>Neuer A/B Test</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              className="rag-search-input"
              style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.5)", borderRadius: "6px", padding: "0.5rem 0.75rem", color: "#e2e8f0" }}
              placeholder="Test Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <input
              className="rag-search-input"
              style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.5)", borderRadius: "6px", padding: "0.5rem 0.75rem", color: "#e2e8f0" }}
              placeholder="Beschreibung (optional)"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", color: "#71717a", marginBottom: "0.25rem", display: "block" }}>Variante A (JSON)</label>
                <textarea
                  style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.5)", borderRadius: "6px", padding: "0.5rem", color: "#e2e8f0", fontSize: "0.8rem", fontFamily: "monospace", minHeight: "80px", resize: "vertical" }}
                  value={formVarA}
                  onChange={(e) => setFormVarA(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "#71717a", marginBottom: "0.25rem", display: "block" }}>Variante B (JSON)</label>
                <textarea
                  style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.5)", borderRadius: "6px", padding: "0.5rem", color: "#e2e8f0", fontSize: "0.8rem", fontFamily: "monospace", minHeight: "80px", resize: "vertical" }}
                  value={formVarB}
                  onChange={(e) => setFormVarB(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#71717a" }}>Traffic Split: {formSplit}% / {100 - formSplit}%</label>
              <input
                type="range"
                min={10}
                max={90}
                value={formSplit}
                onChange={(e) => setFormSplit(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
            <button
              className="rag-search-btn"
              style={{ alignSelf: "flex-start" }}
              onClick={createTest}
              disabled={creating || !formName.trim()}
            >
              {creating ? "Erstellt..." : "Test starten"}
            </button>
          </div>
        </div>
      )}

      {/* Tests List */}
      {tests.length === 0 ? (
        <div className="rag-empty">Noch keine A/B Tests erstellt.</div>
      ) : (
        <div className="rag-table-wrap">
          <table className="rag-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Beschreibung</th>
                <th>Split</th>
                <th>Status</th>
                <th>Erstellt</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id}>
                  <td className="rag-fw-medium">{test.name}</td>
                  <td className="rag-text-dim">{test.description || "-"}</td>
                  <td>{test.trafficSplitPercent}% / {100 - test.trafficSplitPercent}%</td>
                  <td>
                    {test.isActive ? (
                      <span className="rag-badge-mini rag-badge-green">Aktiv</span>
                    ) : (
                      <span className="rag-badge-mini rag-badge-dim">Inaktiv</span>
                    )}
                  </td>
                  <td className="rag-text-dim">
                    {new Date(test.createdAt).toLocaleDateString("de-DE")}
                  </td>
                  <td>
                    {test.isActive && (
                      <button className="rag-btn-small" onClick={() => stopTest(test.id)}>
                        Stoppen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
