/**
 * Baunity Wizard - SmartSuggestions Komponenten
 * ==========================================
 * UI-Komponenten für intelligente Vorschläge und Insights
 */

import React, { useState } from 'react';
import { useLearning, useRegionalData, usePatternAnalysis } from '../../hooks/useLearning';
import type { SmartSuggestion, AutofillSuggestion, RegionalInsight } from '../../lib/intelligence/learningEngine';

// Helper um sicherzustellen dass nur Strings gerendert werden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('name' in (value as object)) return String((value as { name: unknown }).name);
    return '';
  }
  return String(value);
};

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  
  card: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    color: 'white',
    marginBottom: '0.75rem',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
    animation: 'slideIn 0.3s ease-out',
  } as React.CSSProperties,
  
  cardTip: {
    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  } as React.CSSProperties,
  
  cardWarning: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  } as React.CSSProperties,
  
  cardAutofill: {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  } as React.CSSProperties,
  
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  
  title: {
    fontSize: '0.95rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,
  
  badge: {
    fontSize: '0.7rem',
    background: 'rgba(255,255,255,0.2)',
    padding: '0.15rem 0.5rem',
    borderRadius: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  
  description: {
    fontSize: '0.85rem',
    opacity: 0.95,
    lineHeight: 1.5,
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  
  actions: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  } as React.CSSProperties,
  
  button: {
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  
  buttonAccept: {
    background: 'rgba(255,255,255,0.95)',
    color: '#667eea',
  } as React.CSSProperties,
  
  buttonReject: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
  } as React.CSSProperties,
  
  insightBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '1rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  
  insightTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,
  
  insightGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '0.75rem',
  } as React.CSSProperties,
  
  insightItem: {
    textAlign: 'center' as const,
  } as React.CSSProperties,
  
  insightValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#667eea',
  } as React.CSSProperties,
  
  insightLabel: {
    fontSize: '0.7rem',
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  
  patternMatch: {
    background: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: 'white',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  } as React.CSSProperties,
  
  patternIcon: {
    fontSize: '1.5rem',
  } as React.CSSProperties,
  
  patternText: {
    flex: 1,
  } as React.CSSProperties,
  
  patternTitle: {
    fontWeight: 600,
    fontSize: '0.9rem',
  } as React.CSSProperties,
  
  patternSubtitle: {
    fontSize: '0.8rem',
    opacity: 0.9,
  } as React.CSSProperties,
  
  confidenceBadge: {
    background: 'rgba(255,255,255,0.2)',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 500,
  } as React.CSSProperties,
  
  emptyState: {
    textAlign: 'center' as const,
    padding: '1.5rem',
    color: '#94a3b8',
    fontSize: '0.85rem',
  } as React.CSSProperties,
  
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    gap: '0.5rem',
    color: '#64748b',
    fontSize: '0.85rem',
  } as React.CSSProperties,
  
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #e2e8f0',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  } as React.CSSProperties,
};

// CSS Animation injection
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface SuggestionCardProps {
  suggestion: SmartSuggestion;
  onAccept: () => void;
  onReject: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onAccept, onReject }) => {
  const getCardStyle = () => {
    switch (suggestion.type) {
      case 'tip': return { ...styles.card, ...styles.cardTip };
      case 'warning': return { ...styles.card, ...styles.cardWarning };
      case 'autofill': return { ...styles.card, ...styles.cardAutofill };
      default: return styles.card;
    }
  };
  
  const getIcon = () => {
    switch (suggestion.type) {
      case 'tip': return '💡';
      case 'warning': return '⚠️';
      case 'product': return '📦';
      case 'configuration': return '⚙️';
      case 'autofill': return '✨';
      default: return '🤖';
    }
  };
  
  const getSourceLabel = () => {
    switch (suggestion.source) {
      case 'regional': return 'Regional';
      case 'personal': return 'Für Sie';
      case 'pattern': return 'Bewährt';
      case 'compatibility': return 'Kompatibel';
      default: return 'KI';
    }
  };
  
  return (
    <div style={getCardStyle()}>
      <div style={styles.header}>
        <div style={styles.title}>
          <span>{getIcon()}</span>
          <span>{suggestion.title}</span>
        </div>
        <span style={styles.badge}>{getSourceLabel()}</span>
      </div>
      
      <div style={styles.description}>
        {suggestion.description}
      </div>
      
      <div style={styles.actions}>
        <button 
          style={{ ...styles.button, ...styles.buttonReject }}
          onClick={onReject}
        >
          Ignorieren
        </button>
        <button 
          style={{ ...styles.button, ...styles.buttonAccept }}
          onClick={onAccept}
        >
          Anwenden
        </button>
      </div>
    </div>
  );
};

interface AutofillCardProps {
  suggestion: AutofillSuggestion;
  onApply: () => void;
}

const AutofillCard: React.FC<AutofillCardProps> = ({ suggestion, onApply }) => {
  return (
    <div style={{ ...styles.card, ...styles.cardAutofill }}>
      <div style={styles.header}>
        <div style={styles.title}>
          <span>✨</span>
          <span>{suggestion.title}</span>
        </div>
        <span style={styles.badge}>Schnelleingabe</span>
      </div>
      
      <div style={styles.description}>
        {suggestion.description}
      </div>
      
      <div style={styles.actions}>
        <button 
          style={{ ...styles.button, ...styles.buttonAccept }}
          onClick={onApply}
        >
          Übernehmen
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENTS
// ============================================================================

/**
 * Zeigt alle Vorschläge für den aktuellen Step
 */
export const SmartSuggestions: React.FC = () => {
  const { 
    suggestions, 
    isLoadingSuggestions, 
    acceptSuggestion, 
    rejectSuggestion,
    autofillSuggestions,
    applyAutofill,
  } = useLearning();
  
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  
  const visibleSuggestions = suggestions.filter(s => !dismissed.has(s.id));
  const visibleAutofills = autofillSuggestions.filter(s => !dismissed.has(s.id));
  
  const handleAccept = (suggestion: SmartSuggestion) => {
    acceptSuggestion(suggestion);
    setDismissed(prev => new Set(prev).add(suggestion.id));
  };
  
  const handleReject = (suggestion: SmartSuggestion) => {
    rejectSuggestion(suggestion);
    setDismissed(prev => new Set(prev).add(suggestion.id));
  };
  
  const handleApplyAutofill = (suggestion: AutofillSuggestion) => {
    applyAutofill(suggestion);
    setDismissed(prev => new Set(prev).add(suggestion.id));
  };
  
  if (isLoadingSuggestions) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <span>Lade Vorschläge...</span>
      </div>
    );
  }
  
  if (visibleSuggestions.length === 0 && visibleAutofills.length === 0) {
    return null; // Nichts anzeigen wenn keine Vorschläge
  }
  
  return (
    <div style={styles.container}>
      {/* Autofill zuerst (höchste Priorität) */}
      {visibleAutofills.map(suggestion => (
        <AutofillCard
          key={suggestion.id}
          suggestion={suggestion}
          onApply={() => handleApplyAutofill(suggestion)}
        />
      ))}
      
      {/* Smart Suggestions */}
      {visibleSuggestions.map(suggestion => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onAccept={() => handleAccept(suggestion)}
          onReject={() => handleReject(suggestion)}
        />
      ))}
    </div>
  );
};

/**
 * Zeigt regionale Insights an
 */
export const RegionalInsights: React.FC<{ plz?: string }> = ({ plz }) => {
  const { insight, isLoading } = useRegionalData(plz);
  
  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <span>Lade regionale Daten...</span>
      </div>
    );
  }
  
  if (!insight) return null;
  
  return (
    <div style={styles.insightBox}>
      <div style={styles.insightTitle}>
        <span>📊</span>
        <span>Ihre Region (PLZ {insight.plzPrefix}xxx)</span>
      </div>
      
      <div style={styles.insightGrid}>
        <div style={styles.insightItem}>
          <div style={styles.insightValue}>{insight.avgKwp.toFixed(1)}</div>
          <div style={styles.insightLabel}>∅ kWp</div>
        </div>
        <div style={styles.insightItem}>
          <div style={styles.insightValue}>{insight.speicherQuote}%</div>
          <div style={styles.insightLabel}>mit Speicher</div>
        </div>
        <div style={styles.insightItem}>
          <div style={styles.insightValue}>{insight.wallboxQuote}%</div>
          <div style={styles.insightLabel}>mit Wallbox</div>
        </div>
        <div style={styles.insightItem}>
          <div style={styles.insightValue}>{insight.avgProcessingDays}</div>
          <div style={styles.insightLabel}>Tage Bearbeitung</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Zeigt Pattern-Match an (z.B. "Fronius + BYD ist bewährt")
 */
export const PatternMatchBadge: React.FC = () => {
  const pattern = usePatternAnalysis();
  
  if (!pattern || !pattern.matchesPattern) return null;
  
  return (
    <div style={styles.patternMatch}>
      <div style={styles.patternIcon}>✅</div>
      <div style={styles.patternText}>
        <div style={styles.patternTitle}>{pattern.patternName}</div>
        <div style={styles.patternSubtitle}>Bewährte Kombination</div>
      </div>
      <div style={styles.confidenceBadge}>
        {Math.round(pattern.confidence * 100)}% Erfolgsquote
      </div>
    </div>
  );
};

/**
 * Beliebte Produkte in der Region
 */
export const PopularProducts: React.FC<{ 
  plz?: string;
  productType: 'module' | 'wechselrichter' | 'speicher';
}> = ({ plz, productType }) => {
  const { insight } = useRegionalData(plz);
  
  if (!insight) return null;
  
  const products = insight.topProducts[productType];
  if (!products || products.length === 0) return null;
  
  const labels: Record<string, string> = {
    module: 'Beliebte Module',
    wechselrichter: 'Beliebte Wechselrichter',
    speicher: 'Beliebte Speicher',
  };
  
  return (
    <div style={styles.insightBox}>
      <div style={styles.insightTitle}>
        <span>🏆</span>
        <span>{labels[productType]} in Ihrer Region</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {products.slice(0, 3).map((p, i) => (
          <div
            key={safeString(p.hersteller) || String(i)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem 0',
              borderBottom: i < 2 ? '1px solid #e2e8f0' : 'none',
            }}
          >
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#334155',
              fontWeight: 500,
            }}>
              <span style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: ['#fbbf24', '#94a3b8', '#cd7f32'][i],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                color: 'white',
                fontWeight: 700,
              }}>
                {i + 1}
              </span>
              {safeString(p.hersteller) || 'Unbekannt'}
            </span>
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
              {p.count} Installationen
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Beliebte Kombinationen
 */
export const PopularCombinations: React.FC<{ plz?: string }> = ({ plz }) => {
  const { insight } = useRegionalData(plz);
  
  if (!insight || !insight.topCombinations?.length) return null;
  
  return (
    <div style={styles.insightBox}>
      <div style={styles.insightTitle}>
        <span>🔗</span>
        <span>Bewährte Kombinationen</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {insight.topCombinations.slice(0, 3).map((combo, i) => (
          <div 
            key={i}
            style={{
              padding: '0.75rem',
              background: '#f1f5f9',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 500, color: '#334155', fontSize: '0.85rem' }}>
                {combo.wr}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                + {combo.speicher}
              </div>
            </div>
            <div style={{ 
              background: '#dcfce7', 
              color: '#166534',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}>
              {combo.successRate}% Erfolg
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Kompakte Intelligenz-Anzeige für Step-Header
 */
export const IntelligenceIndicator: React.FC = () => {
  const { suggestions, patternMatch, isLoadingSuggestions } = useLearning();
  const [expanded, setExpanded] = useState(false);
  
  const count = suggestions?.length || 0;
  const hasPattern = patternMatch?.matchesPattern;
  
  if (isLoadingSuggestions || (count === 0 && !hasPattern)) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        zIndex: 1000,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        🤖
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#f43f5e',
            color: 'white',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {count}
          </span>
        )}
      </button>
      
      {expanded && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          right: 0,
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          padding: '1rem',
        }}>
          <div style={{ 
            fontWeight: 600, 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span>🤖</span>
            <span>KI-Assistent</span>
          </div>
          <SmartSuggestions />
          {suggestions.length === 0 && (
            <div style={styles.emptyState}>
              Keine Vorschläge für diesen Schritt
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSuggestions;
