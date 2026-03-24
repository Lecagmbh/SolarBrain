/**
 * Baunity Wizard - Inline Smart Suggestions
 * ======================================
 * Schön integrierte Vorschläge direkt im Wizard
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizardStore } from '../../stores/wizardStore';
import { getAccessToken } from '../../lib/stubs/tokenStorage';

// KRITISCH: Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('name' in (value as object)) return String((value as { name: unknown }).name);
    if ('label' in (value as object)) return String((value as { label: unknown }).label);
    return '';
  }
  return String(value);
};

// ============================================================================
// TYPES
// ============================================================================

interface Suggestion {
  id: string;
  type: 'value' | 'autofill' | 'tip' | 'pattern' | 'quick';
  field?: string;
  label: string;
  value?: any;
  description?: string;
  confidence: number;
  usageCount?: number;
  icon?: string;
}

// ============================================================================
// HOOK: useInlineSuggestions
// ============================================================================

function useInlineSuggestions() {
  const { data, currentStep } = useWizardStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const context: Record<string, any> = { step: currentStep };
      if (data.step2?.plz) context.plz = data.step2.plz;
      if (data.step2?.ort) context.ort = data.step2.ort;
      if (data.step4?.netzbetreiberName) context.netzbetreiber = data.step4.netzbetreiberName;
      if (data.step1?.kategorie) context.kategorie = data.step1.kategorie;

      const res = await fetch('/api/wizard-learning/suggestions', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          kontextTyp: `step_${currentStep}`,
          kontextWert: JSON.stringify(context),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setSuggestions(result.suggestions || []);
      }
    } catch (err) {
      console.error('[InlineSuggestions] Fehler:', err);
    } finally {
      setLoading(false);
    }
  }, [currentStep, data]);

  useEffect(() => {
    fetchSuggestions();
  }, [currentStep, data.step2?.plz, data.step4?.netzbetreiberName]);

  return { suggestions, loading, refetch: fetchSuggestions };
}

// ============================================================================
// STYLES
// ============================================================================

const injectStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('inline-suggestions-styles')) return;

  const style = document.createElement('style');
  style.id = 'inline-suggestions-styles';
  style.textContent = `
    /* Container */
    .wizard-suggestions {
      margin-bottom: 24px;
    }
    
    .wizard-suggestions__header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 12px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .wizard-suggestions__header svg {
      width: 14px;
      height: 14px;
    }
    
    .wizard-suggestions__badge {
      background: linear-gradient(135deg, #f59e0b, #ef4444);
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 8px;
      font-weight: 700;
    }
    
    /* Grid Layout */
    .wizard-suggestions__grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    /* Suggestion Chip */
    .wizard-suggestion-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: linear-gradient(145deg, rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.05));
      border: 1px solid rgba(139, 92, 246, 0.25);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    
    .wizard-suggestion-chip::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.1));
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    .wizard-suggestion-chip:hover {
      border-color: rgba(139, 92, 246, 0.5);
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.25);
    }
    
    .wizard-suggestion-chip:hover::before {
      opacity: 1;
    }
    
    .wizard-suggestion-chip:active {
      transform: translateY(0);
    }
    
    .wizard-suggestion-chip--tip {
      background: linear-gradient(145deg, rgba(6, 182, 212, 0.12), rgba(6, 182, 212, 0.05));
      border-color: rgba(6, 182, 212, 0.25);
    }
    
    .wizard-suggestion-chip--tip:hover {
      border-color: rgba(6, 182, 212, 0.5);
      box-shadow: 0 4px 20px rgba(6, 182, 212, 0.25);
    }
    
    .wizard-suggestion-chip--popular {
      background: linear-gradient(145deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.05));
      border-color: rgba(16, 185, 129, 0.25);
    }
    
    .wizard-suggestion-chip--popular:hover {
      border-color: rgba(16, 185, 129, 0.5);
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25);
    }
    
    .wizard-suggestion-chip__icon {
      font-size: 18px;
      position: relative;
      z-index: 1;
    }
    
    .wizard-suggestion-chip__content {
      position: relative;
      z-index: 1;
    }
    
    .wizard-suggestion-chip__label {
      font-size: 13px;
      font-weight: 600;
      color: #f8fafc;
      display: block;
    }
    
    .wizard-suggestion-chip__meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 2px;
    }
    
    .wizard-suggestion-chip__usage {
      font-size: 10px;
      color: rgba(139, 92, 246, 0.8);
    }
    
    .wizard-suggestion-chip__confidence {
      font-size: 10px;
      color: rgba(16, 185, 129, 0.9);
      font-weight: 600;
    }
    
    /* Quick Actions - für Step 1 */
    .wizard-quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    
    .wizard-quick-action {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(239, 68, 68, 0.05));
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.25s ease;
    }
    
    .wizard-quick-action:hover {
      border-color: rgba(245, 158, 11, 0.5);
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(245, 158, 11, 0.2);
    }
    
    .wizard-quick-action__icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.15));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    
    .wizard-quick-action__content {
      flex: 1;
    }
    
    .wizard-quick-action__label {
      font-size: 14px;
      font-weight: 600;
      color: #f8fafc;
    }
    
    .wizard-quick-action__stats {
      font-size: 11px;
      color: rgba(245, 158, 11, 0.8);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .wizard-quick-action__arrow {
      color: rgba(255, 255, 255, 0.3);
      font-size: 18px;
      transition: transform 0.2s;
    }
    
    .wizard-quick-action:hover .wizard-quick-action__arrow {
      transform: translateX(4px);
      color: rgba(245, 158, 11, 0.8);
    }
    
    /* Tip Banner */
    .wizard-tip-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05));
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 12px;
      margin-bottom: 20px;
    }
    
    .wizard-tip-banner__icon {
      width: 32px;
      height: 32px;
      background: rgba(59, 130, 246, 0.15);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }
    
    .wizard-tip-banner__content {
      flex: 1;
    }
    
    .wizard-tip-banner__title {
      font-size: 13px;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 2px;
    }
    
    .wizard-tip-banner__text {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.4;
    }
    
    /* Loading */
    .wizard-suggestions__loading {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
    }
    
    .wizard-suggestions__spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-top-color: #EAD068;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
};

// ============================================================================
// COMPONENT: WizardInlineSuggestions
// ============================================================================

export const WizardInlineSuggestions: React.FC = () => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { data, currentStep, updateStep1, updateStep2, updateStep3, updateStep4, updateStep5, updateStep6,
    addDachflaeche, updateDachflaeche, addWechselrichter, updateWechselrichter } = useWizardStore();
  const { suggestions, loading } = useInlineSuggestions();

  useEffect(() => { injectStyles(); }, []);

  // Reset dismissed when step changes
  useEffect(() => {
    setDismissed(new Set());
  }, [currentStep]);

  const applySuggestion = useCallback(async (suggestion: Suggestion) => {
    if (!suggestion.value) return;

    if (currentStep === 5) {
      // Step 5: suggestion.value hat {modulHersteller, modulModell} oder {wrHersteller, wrModell}
      // Diese Felder gehören zu DachflaecheData/WechselrichterData, nicht zu Step5Data
      const val = suggestion.value;
      if (val.modulHersteller || val.modulModell) {
        const store = useWizardStore.getState();
        let dachflaechen = store.data.step5.dachflaechen;
        if (!dachflaechen || dachflaechen.length === 0) {
          addDachflaeche();
          dachflaechen = useWizardStore.getState().data.step5.dachflaechen;
        }
        const dfId = dachflaechen[0]?.id;
        if (dfId) {
          updateDachflaeche(dfId, {
            ...(val.modulHersteller ? { modulHersteller: val.modulHersteller } : {}),
            ...(val.modulModell ? { modulModell: val.modulModell } : {}),
          });
        }
      } else if (val.wrHersteller || val.wrModell) {
        const store = useWizardStore.getState();
        let wechselrichter = store.data.step5.wechselrichter;
        if (!wechselrichter || wechselrichter.length === 0) {
          addWechselrichter();
          wechselrichter = useWizardStore.getState().data.step5.wechselrichter;
        }
        const wrId = wechselrichter[0]?.id;
        if (wrId) {
          updateWechselrichter(wrId, {
            ...(val.wrHersteller ? { hersteller: val.wrHersteller } : {}),
            ...(val.wrModell ? { modell: val.wrModell } : {}),
          });
        }
      } else {
        // Fallback für andere Step-5-Werte
        updateStep5(val);
      }
    } else {
      switch (currentStep) {
        case 1: updateStep1(suggestion.value); break;
        case 2: updateStep2(suggestion.value); break;
        case 3: updateStep3(suggestion.value); break;
        case 4: updateStep4(suggestion.value); break;
        case 6: updateStep6(suggestion.value); break;
      }
    }

    // Feedback senden
    try {
      const token = getAccessToken();
      await fetch('/api/wizard-learning/feedback', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId: suggestion.id, aktion: 'akzeptiert' }),
      });
    } catch {}

    setDismissed(prev => new Set(prev).add(suggestion.id));
  }, [currentStep, updateStep1, updateStep2, updateStep3, updateStep4, updateStep5, updateStep6,
    addDachflaeche, updateDachflaeche, addWechselrichter, updateWechselrichter]);

  // Lokale Vorschläge - nur Tips, keine fake Zahlen
  const localSuggestions = useMemo((): Suggestion[] => {
    switch (currentStep) {
      case 1:
        // Keine hardcoded Vorschläge - nur die echten aus der DB anzeigen
        return [];
      case 2:
        if (!data.step2?.plz) {
          return [{ id: 'tip-plz', type: 'tip', label: 'PLZ eingeben', description: 'Die PLZ bestimmt automatisch Ort, Bundesland und Netzbetreiber', confidence: 100, icon: '💡' }];
        }
        return [];
      case 4:
        if (!data.step4?.netzbetreiberName) {
          return [{ id: 'tip-nb', type: 'tip', label: 'Netzbetreiber wird automatisch ermittelt', description: 'Basierend auf der eingegebenen PLZ', confidence: 100, icon: '⚡' }];
        }
        return [];
      case 5:
        return [{ id: 'tip-produkte', type: 'tip', label: 'Beliebte Produkte zuerst', description: 'Die Produktlisten sind nach Beliebtheit sortiert', confidence: 100, icon: '📦' }];
      default:
        return [];
    }
  }, [currentStep, data]);

  const allSuggestions = useMemo(() => {
    const merged = [...suggestions, ...localSuggestions]
      .filter(s => !dismissed.has(s.id))
      .sort((a, b) => b.confidence - a.confidence);
    return merged.slice(0, 6);
  }, [suggestions, localSuggestions, dismissed]);

  const quickActions = allSuggestions.filter(s => s.type === 'quick');
  const tips = allSuggestions.filter(s => s.type === 'tip');
  const chips = allSuggestions.filter(s => s.type === 'value' || s.type === 'autofill');

  // Nichts anzeigen wenn keine Vorschläge
  if (!loading && allSuggestions.length === 0) return null;

  return (
    <div className="wizard-suggestions">
      {/* Loading */}
      {loading && (
        <div className="wizard-suggestions__loading">
          <span className="wizard-suggestions__spinner" />
          Lade Vorschläge...
        </div>
      )}

      {/* Tips als Banner */}
      <AnimatePresence>
        {tips.map(tip => (
          <motion.div
            key={tip.id}
            className="wizard-tip-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="wizard-tip-banner__icon">{safeString(tip.icon) || '💡'}</div>
            <div className="wizard-tip-banner__content">
              <div className="wizard-tip-banner__title">{safeString(tip.label)}</div>
              {tip.description && <div className="wizard-tip-banner__text">{safeString(tip.description)}</div>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Quick Actions für Step 1 */}
      {quickActions.length > 0 && (
        <>
          <div className="wizard-suggestions__header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Schnellauswahl
            <span className="wizard-suggestions__badge">Beliebt</span>
          </div>
          <div className="wizard-quick-actions">
            {quickActions.map(action => (
              <motion.div
                key={action.id}
                className="wizard-quick-action"
                onClick={() => applySuggestion(action)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="wizard-quick-action__icon">{safeString(action.icon)}</div>
                <div className="wizard-quick-action__content">
                  <div className="wizard-quick-action__label">{safeString(action.label)}</div>
                  {action.usageCount && (
                    <div className="wizard-quick-action__stats">
                      {action.usageCount.toLocaleString()}× verwendet
                    </div>
                  )}
                </div>
                <span className="wizard-quick-action__arrow">→</span>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Value/Autofill Chips */}
      {chips.length > 0 && (
        <>
          <div className="wizard-suggestions__header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            Vorschläge basierend auf {chips[0].usageCount ? 'Nutzerdaten' : 'Kontext'}
          </div>
          <div className="wizard-suggestions__grid">
            {chips.map(chip => (
              <motion.div
                key={chip.id}
                className={`wizard-suggestion-chip ${chip.usageCount && chip.usageCount > 50 ? 'wizard-suggestion-chip--popular' : ''}`}
                onClick={() => applySuggestion(chip)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="wizard-suggestion-chip__icon">{chip.icon || '✨'}</span>
                <div className="wizard-suggestion-chip__content">
                  <span className="wizard-suggestion-chip__label">{chip.label}</span>
                  <div className="wizard-suggestion-chip__meta">
                    {chip.usageCount && chip.usageCount > 10 && (
                      <span className="wizard-suggestion-chip__usage">{chip.usageCount}× verwendet</span>
                    )}
                    {chip.confidence >= 75 && (
                      <span className="wizard-suggestion-chip__confidence">{chip.confidence}%</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default WizardInlineSuggestions;
