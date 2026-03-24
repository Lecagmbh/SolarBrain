/**
 * Baunity Intelligence Tab
 * KI-gestützte Vorschläge und Analysen für einzelne Installationen
 */

import { useState, useEffect } from "react";
import { useDetail } from "../context/DetailContext";
import { getAccessToken } from "../../../auth/tokenStorage";
import "./IntelligenceTab.css";

interface Suggestion {
  type: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  action?: string;
  data?: any;
}

interface DocumentCompleteness {
  completeness: number;
  missingRequired: string[];
  missingRecommended: string[];
  documents: Array<{ type: string; present: boolean; required: boolean }>;
}

interface IntelligenceData {
  approvalProbability?: number;
  rejectionRisk?: number;
  predictedApprovalDate?: string;
  documentCompleteness?: number;
}

interface GridOperatorData {
  avgProcessingDays?: number;
  approvalRate?: number;
  firstTimeApproval?: number;
  rejectionReasons?: Array<{ reason: string; count: number }>;
}

interface VorgangsnummerMapping {
  id: number;
  vorgangsnummer: string;
  source: string;
  createdAt: string;
}

export default function IntelligenceTab() {
  const { detail } = useDetail();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [docCompleteness, setDocCompleteness] = useState<DocumentCompleteness | null>(null);
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null);
  const [gridOperator, setGridOperator] = useState<GridOperatorData | null>(null);
  const [vorgangsnummern, setVorgangsnummern] = useState<VorgangsnummerMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVorgangsnummer, setNewVorgangsnummer] = useState("");
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  const token = getAccessToken();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!detail?.id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Suggestions und Intelligence laden
        const suggestionsRes = await fetch(`/api/intelligence/suggestions/${detail.id}`, { headers });
        if (suggestionsRes.ok) {
          const data = await suggestionsRes.json();
          setSuggestions(data.suggestions || []);
          setDocCompleteness(data.documentCompleteness || null);
          setIntelligence(data.intelligence || null);
          setGridOperator(data.gridOperator || null);
        }

        // Vorgangsnummern laden
        const vnRes = await fetch(`/api/intelligence/vorgangsnummer/${detail.id}`, { headers });
        if (vnRes.ok) {
          setVorgangsnummern(await vnRes.json());
        }
      } catch (error) {
        console.error("Intelligence-Daten konnten nicht geladen werden:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [detail?.id]);

  const addVorgangsnummer = async () => {
    if (!newVorgangsnummer.trim() || !detail?.id) return;

    try {
      await fetch("/api/intelligence/vorgangsnummer", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          vorgangsnummer: newVorgangsnummer.trim(),
          installationId: detail.id
        })
      });

      setVorgangsnummern([...vorgangsnummern, {
        id: Date.now(),
        vorgangsnummer: newVorgangsnummer.trim(),
        source: "MANUAL",
        createdAt: new Date().toISOString()
      }]);
      setNewVorgangsnummer("");
    } catch (error) {
      console.error("Vorgangsnummer konnte nicht hinzugefügt werden:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "#ef4444";
      case "MEDIUM": return "#f59e0b";
      case "LOW": return "#22c55e";
      default: return "#64748b";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "HIGH": return "Hoch";
      case "MEDIUM": return "Mittel";
      case "LOW": return "Niedrig";
      default: return priority;
    }
  };

  if (loading) {
    return (
      <div className="intel-tab-loading">
        <div className="intel-tab-spinner" />
        <span>Lade Intelligence-Daten...</span>
      </div>
    );
  }

  return (
    <div className="intel-tab">
      {/* Header mit Hauptmetriken */}
      <div className="intel-tab-header">
        <div className="intel-tab-metric">
          <div className="intel-tab-metric-circle" style={{ 
            background: `conic-gradient(#22c55e ${(docCompleteness?.completeness || 0) * 360}deg, #e2e8f0 0deg)` 
          }}>
            <span>{Math.round((docCompleteness?.completeness || 0) * 100)}%</span>
          </div>
          <div className="intel-tab-metric-label">Dokumenten-Vollständigkeit</div>
        </div>

        <div className="intel-tab-metric">
          <div className="intel-tab-metric-circle" style={{ 
            background: `conic-gradient(#D4A843 ${(intelligence?.approvalProbability || 0) * 360}deg, #e2e8f0 0deg)` 
          }}>
            <span>{Math.round((intelligence?.approvalProbability || 0) * 100)}%</span>
          </div>
          <div className="intel-tab-metric-label">Genehmigungswahrscheinlichkeit</div>
        </div>

        <div className="intel-tab-metric">
          <div className="intel-tab-metric-circle" style={{ 
            background: `conic-gradient(#ef4444 ${(intelligence?.rejectionRisk || 0) * 360}deg, #e2e8f0 0deg)` 
          }}>
            <span>{Math.round((intelligence?.rejectionRisk || 0) * 100)}%</span>
          </div>
          <div className="intel-tab-metric-label">Ablehnungsrisiko</div>
        </div>
      </div>

      {/* Prognostiziertes Genehmigungsdatum */}
      {intelligence?.predictedApprovalDate && (
        <div className="intel-tab-prediction">
          <span className="intel-tab-prediction-icon">📅</span>
          <div>
            <div className="intel-tab-prediction-label">Prognostiziertes Genehmigungsdatum</div>
            <div className="intel-tab-prediction-date">
              {new Date(intelligence.predictedApprovalDate).toLocaleDateString("de-DE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fehlende Dokumente */}
      {docCompleteness && (docCompleteness.missingRequired.length > 0 || docCompleteness.missingRecommended.length > 0) && (
        <div className="intel-tab-section">
          <h3>📄 Fehlende Dokumente</h3>
          
          {docCompleteness.missingRequired.length > 0 && (
            <div className="intel-tab-doc-list required">
              <div className="intel-tab-doc-label">⚠️ Erforderlich:</div>
              <div className="intel-tab-doc-items">
                {docCompleteness.missingRequired.map(doc => (
                  <span key={doc} className="intel-tab-doc-item required">{doc}</span>
                ))}
              </div>
            </div>
          )}

          {docCompleteness.missingRecommended.length > 0 && (
            <div className="intel-tab-doc-list recommended">
              <div className="intel-tab-doc-label">💡 Empfohlen:</div>
              <div className="intel-tab-doc-items">
                {docCompleteness.missingRecommended.map(doc => (
                  <span key={doc} className="intel-tab-doc-item recommended">{doc}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vorgangsnummern */}
      <div className="intel-tab-section">
        <h3>🔢 Vorgangsnummern</h3>
        
        {vorgangsnummern.length > 0 ? (
          <div className="intel-tab-vn-list">
            {vorgangsnummern.map(vn => (
              <div key={vn.id} className="intel-tab-vn-item">
                <span className="intel-tab-vn-number">{vn.vorgangsnummer}</span>
                <span className={`intel-tab-vn-source ${vn.source.toLowerCase()}`}>
                  {vn.source === "EMAIL" ? "📧 E-Mail" : vn.source === "MANUAL" ? "✏️ Manuell" : vn.source}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="intel-tab-empty">Keine Vorgangsnummern erfasst</div>
        )}

        <div className="intel-tab-vn-add">
          <input
            type="text"
            placeholder="Neue Vorgangsnummer eingeben..."
            value={newVorgangsnummer}
            onChange={(e) => setNewVorgangsnummer(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addVorgangsnummer()}
          />
          <button onClick={addVorgangsnummer} disabled={!newVorgangsnummer.trim()}>
            Hinzufügen
          </button>
        </div>
      </div>

      {/* Netzbetreiber-Insights */}
      {gridOperator && (
        <div className="intel-tab-section">
          <h3>🏢 Netzbetreiber-Insights</h3>
          
          <div className="intel-tab-nb-grid">
            {gridOperator.avgProcessingDays && (
              <div className="intel-tab-nb-stat">
                <div className="intel-tab-nb-value">{Math.round(gridOperator.avgProcessingDays)} Tage</div>
                <div className="intel-tab-nb-label">Ø Bearbeitungszeit</div>
              </div>
            )}
            {gridOperator.approvalRate && (
              <div className="intel-tab-nb-stat">
                <div className="intel-tab-nb-value">{Math.round(gridOperator.approvalRate * 100)}%</div>
                <div className="intel-tab-nb-label">Genehmigungsquote</div>
              </div>
            )}
            {gridOperator.firstTimeApproval && (
              <div className="intel-tab-nb-stat">
                <div className="intel-tab-nb-value">{Math.round(gridOperator.firstTimeApproval * 100)}%</div>
                <div className="intel-tab-nb-label">First-Time Approval</div>
              </div>
            )}
          </div>

          {gridOperator.rejectionReasons && gridOperator.rejectionReasons.length > 0 && (
            <div className="intel-tab-nb-reasons">
              <div className="intel-tab-nb-reasons-title">Häufigste Ablehnungsgründe:</div>
              <ul>
                {gridOperator.rejectionReasons.slice(0, 5).map((r, i) => (
                  <li key={i}>{r.reason} ({r.count}x)</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* KI-Vorschläge */}
      <div className="intel-tab-section">
        <h3>💡 KI-Vorschläge</h3>
        
        {suggestions.length === 0 ? (
          <div className="intel-tab-empty">
            ✨ Alles in Ordnung! Keine Vorschläge vorhanden.
          </div>
        ) : (
          <div className="intel-tab-suggestions">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className={`intel-tab-suggestion ${expandedSuggestion === `${index}` ? "expanded" : ""}`}
                onClick={() => setExpandedSuggestion(expandedSuggestion === `${index}` ? null : `${index}`)}
              >
                <div className="intel-tab-suggestion-header">
                  <span 
                    className="intel-tab-suggestion-priority"
                    style={{ backgroundColor: getPriorityColor(suggestion.priority) }}
                  >
                    {getPriorityLabel(suggestion.priority)}
                  </span>
                  <span className="intel-tab-suggestion-title">{suggestion.title}</span>
                  <span className="intel-tab-suggestion-toggle">
                    {expandedSuggestion === `${index}` ? "▲" : "▼"}
                  </span>
                </div>
                
                {expandedSuggestion === `${index}` && (
                  <div className="intel-tab-suggestion-body">
                    <p>{suggestion.description}</p>
                    {suggestion.action && (
                      <button className="intel-tab-suggestion-action">
                        {suggestion.action === "UPLOAD_DOCUMENT" && "📤 Dokumente hochladen"}
                        {suggestion.action === "CONTACT_NB" && "📞 NB kontaktieren"}
                        {suggestion.action === "CHECK_REQUIREMENTS" && "📋 Anforderungen prüfen"}
                        {suggestion.action === "COMPLETE_DRAFT" && "✏️ Entwurf fertigstellen"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
