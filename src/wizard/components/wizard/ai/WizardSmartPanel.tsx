/**
 * Baunity Wizard - Smart Panel (Intelligente Vorschläge)
 * ====================================================
 * Ersetzt den KI-Assistenten mit lernenden Vorschlägen
 * basierend auf Nutzerverhalten und Kontext
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizardStore } from '../../../stores/wizardStore';
import { getAccessToken } from '../../../lib/stubs/tokenStorage';

// ============================================================================
// TYPES
// ============================================================================

interface Suggestion {
  id: string;
  type: 'value' | 'autofill' | 'tip' | 'pattern';
  field?: string;
  label: string;
  value?: any; // eslint-disable-line @typescript-eslint/no-explicit-any -- dynamic step data
  description?: string;
  confidence: number;
  usageCount?: number;
  icon?: string;
}

interface StepSuggestions {
  step: number;
  suggestions: Suggestion[];
  patterns?: PatternMatch[];
}

interface PatternMatch {
  name: string;
  description: string;
  confidence: number;
  fields: Record<string, unknown>;
}

// ============================================================================
// HOOK: useSuggestions
// ============================================================================

function useSuggestions() {
  const { data, currentStep } = useWizardStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [patterns, setPatterns] = useState<PatternMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      // Kontext basierend auf aktuellem Step
      const context: Record<string, unknown> = { step: currentStep };
      
      if (data.step2?.plz) context.plz = data.step2.plz;
      if (data.step2?.ort) context.ort = data.step2.ort;
      if (data.step4?.netzbetreiberName) context.netzbetreiber = data.step4.netzbetreiberName;
      if (data.step1?.kategorie) context.kategorie = data.step1.kategorie;

      // Vorschläge vom Backend holen
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
        setPatterns(result.patterns || []);
      }

      // Stats holen
      const statsRes = await fetch('/api/wizard-learning/stats', { headers, credentials: 'include' });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('[SmartPanel] Fehler:', err);
    } finally {
      setLoading(false);
    }
  }, [currentStep, data]);

  useEffect(() => {
    fetchSuggestions();
  }, [currentStep, data.step2?.plz, data.step4?.netzbetreiberName]);

  // Lokale Vorschläge basierend auf Step
  const localSuggestions = useMemo(() => {
    const local: Suggestion[] = [];

    switch (currentStep) {
      case 1: // Kategorie
        local.push(
          { id: 'cat-1', type: 'value', field: 'kategorie', label: 'PV-Anlage', value: 'PV', confidence: 95, icon: '☀️', usageCount: 847 },
          { id: 'cat-2', type: 'value', field: 'kategorie', label: 'PV + Speicher', value: 'PV_SPEICHER', confidence: 88, icon: '🔋', usageCount: 523 },
          { id: 'cat-3', type: 'value', field: 'kategorie', label: 'PV + Wallbox', value: 'PV_WALLBOX', confidence: 72, icon: '🚗', usageCount: 312 },
        );
        break;

      case 2: // Standort
        if (!data.step2?.plz) {
          local.push(
            { id: 'tip-plz', type: 'tip', label: 'PLZ eingeben', description: 'Die PLZ bestimmt automatisch den Netzbetreiber', confidence: 100, icon: '📍' },
          );
        }
        break;

      case 3: // Eigentümer
        local.push(
          { id: 'owner-1', type: 'value', field: 'istEigentuemer', label: 'Ja, ich bin Eigentümer', value: true, confidence: 85, icon: '🏠', usageCount: 1247 },
          { id: 'owner-2', type: 'value', field: 'istEigentuemer', label: 'Nein, Mieter/Pächter', value: false, confidence: 15, icon: '📝', usageCount: 203 },
        );
        break;

      case 5: // Technik
        if (data.step1?.kategorie?.includes('PV')) {
          local.push(
            { id: 'tip-module', type: 'tip', label: 'Module auswählen', description: 'Beliebteste Module werden zuerst angezeigt', confidence: 100, icon: '📦' },
          );
        }
        break;

      case 6: // Kunde
        local.push(
          { id: 'tip-kunde', type: 'tip', label: 'Kundendaten', description: 'Speichere häufig verwendete Daten als Vorlage', confidence: 100, icon: '👤' },
        );
        break;

      case 8: // Abschluss
        local.push(
          { id: 'tip-finish', type: 'tip', label: 'Fast geschafft!', description: 'Prüfe alle Angaben und schließe die Anmeldung ab', confidence: 100, icon: '🎉' },
        );
        break;
    }

    return local;
  }, [currentStep, data]);

  const allSuggestions = useMemo(() => {
    // Kombiniere Server- und lokale Vorschläge, sortiert nach Confidence
    return [...suggestions, ...localSuggestions]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);
  }, [suggestions, localSuggestions]);

  return { suggestions: allSuggestions, patterns, loading, stats, refetch: fetchSuggestions };
}

// ============================================================================
// COMPONENT: WizardSmartPanel
// ============================================================================

export const WizardSmartPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { data, currentStep, updateStep1, updateStep2, updateStep3, updateStep4, updateStep5, updateStep6 } = useWizardStore();
  const { suggestions, patterns, loading, stats, refetch } = useSuggestions();

  useEffect(() => { injectStyles(); }, []);

  // Vorschlag anwenden
  const applySuggestion = useCallback(async (suggestion: Suggestion) => {
    if (suggestion.type !== 'value' || !suggestion.field || suggestion.value === undefined) return;

    // Step-spezifische Update-Funktion aufrufen
    switch (currentStep) {
      case 1: updateStep1(suggestion.value); break;
      case 2: updateStep2(suggestion.value); break;
      case 3: updateStep3(suggestion.value); break;
      case 4: updateStep4(suggestion.value); break;
      case 5: updateStep5(suggestion.value); break;
      case 6: updateStep6(suggestion.value); break;
    }

    // Feedback an Backend senden
    try {
      const token = getAccessToken();
      await fetch('/api/wizard-learning/feedback', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          aktion: 'akzeptiert',
        }),
      });
    } catch {}

    setDismissed(prev => new Set(prev).add(suggestion.id));
  }, [currentStep, updateStep1, updateStep2, updateStep3, updateStep4, updateStep5, updateStep6]);

  // Pattern anwenden (mehrere Felder auf einmal)
  const applyPattern = useCallback(async (pattern: PatternMatch) => {
    switch (currentStep) {
      case 1: updateStep1(pattern.fields); break;
      case 2: updateStep2(pattern.fields); break;
      case 3: updateStep3(pattern.fields); break;
      case 4: updateStep4(pattern.fields); break;
      case 5: updateStep5(pattern.fields); break;
      case 6: updateStep6(pattern.fields); break;
    }
    setIsOpen(false);
  }, [currentStep, updateStep1, updateStep2, updateStep3, updateStep4, updateStep5, updateStep6]);

  // Vorschlag ablehnen
  const dismissSuggestion = useCallback((id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  }, []);

  const visibleSuggestions = (suggestions || []).filter(s => !dismissed.has(s.id));
  const activeCount = visibleSuggestions.filter(s => s.type === 'value').length;

  // Step-Infos
  const stepInfo = useMemo(() => {
    const infos: Record<number, { title: string; icon: string }> = {
      1: { title: 'Anlagentyp', icon: '⚡' },
      2: { title: 'Standort', icon: '📍' },
      3: { title: 'Eigentümer', icon: '🏠' },
      4: { title: 'Netzbetreiber', icon: '🔌' },
      5: { title: 'Technik', icon: '🔧' },
      6: { title: 'Auftraggeber', icon: '👤' },
      7: { title: 'Dokumente', icon: '📄' },
      8: { title: 'Abschluss', icon: '✅' },
    };
    return infos[currentStep] || { title: 'Wizard', icon: '🚀' };
  }, [currentStep]);

  const progress = useMemo(() => {
    let filled = 0;
    if (data.step1?.kategorie) filled++;
    if (data.step2?.strasse && data.step2?.plz) filled++;
    if (data.step3?.istEigentuemer !== null && data.step3?.istEigentuemer !== undefined) filled++;
    if (data.step4?.netzbetreiberName) filled++;
    if (data.step6?.vorname && data.step6?.email) filled++;
    if (data.step8?.agbAkzeptiert) filled++;
    return Math.round((filled / 6) * 100);
  }, [data]);

  return (
    <>
      {/* Toggle Button */}
      <motion.button 
        className="smart-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="smart-toggle__icon">💡</span>
        {activeCount > 0 && !isOpen && (
          <span className="smart-toggle__badge">{activeCount}</span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="smart-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
          >
            {/* Header */}
            <div className="smart-panel__header">
              <div className="smart-panel__icon">💡</div>
              <div className="smart-panel__title-wrap">
                <h3 className="smart-panel__title">Intelligente Vorschläge</h3>
                <p className="smart-panel__subtitle">
                  {stepInfo.icon} Step {currentStep}: {stepInfo.title}
                </p>
              </div>
              <button className="smart-panel__close" onClick={() => setIsOpen(false)}>×</button>
            </div>

            {/* Content */}
            <div className="smart-panel__content">
              {/* Progress */}
              <div className="smart-progress">
                <div className="smart-progress__ring">
                  <svg viewBox="0 0 36 36">
                    <path
                      className="smart-progress__bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="smart-progress__bar"
                      strokeDasharray={`${progress}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="smart-progress__text">{progress}%</span>
                </div>
                <div className="smart-progress__info">
                  <span className="smart-progress__label">Fortschritt</span>
                  <span className="smart-progress__value">{progress}% ausgefüllt</span>
                </div>
              </div>

              {/* Loading */}
              {loading && (
                <div className="smart-loading">
                  <span className="smart-loading__spinner" />
                  Analysiere Muster...
                </div>
              )}

              {/* Patterns */}
              {patterns.length > 0 && (
                <div className="smart-section">
                  <h4 className="smart-section__title">🔮 Erkannte Muster</h4>
                  {patterns.map((pattern, i) => (
                    <motion.button
                      key={i}
                      className="smart-pattern"
                      onClick={() => applyPattern(pattern)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="smart-pattern__content">
                        <span className="smart-pattern__name">{pattern.name}</span>
                        <span className="smart-pattern__desc">{pattern.description}</span>
                      </div>
                      <span className="smart-pattern__confidence">{pattern.confidence}%</span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {visibleSuggestions.length > 0 && (
                <div className="smart-section">
                  <h4 className="smart-section__title">
                    ✨ Vorschläge für dich
                    {(stats as Record<string, number>)?.totalSuggestions > 0 && (
                      <span className="smart-section__count">
                        basierend auf {(stats as Record<string, number>).totalSuggestions.toLocaleString()} Anmeldungen
                      </span>
                    )}
                  </h4>
                  
                  <div className="smart-suggestions">
                    {visibleSuggestions.map((suggestion) => (
                      <motion.div
                        key={suggestion.id}
                        className={`smart-suggestion smart-suggestion--${suggestion.type}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        layout
                      >
                        <span className="smart-suggestion__icon">{suggestion.icon || '💡'}</span>
                        <div className="smart-suggestion__content">
                          <span className="smart-suggestion__label">{suggestion.label}</span>
                          {suggestion.description && (
                            <span className="smart-suggestion__desc">{suggestion.description}</span>
                          )}
                          {suggestion.usageCount && suggestion.usageCount > 10 && (
                            <span className="smart-suggestion__usage">
                              {suggestion.usageCount.toLocaleString()}× verwendet
                            </span>
                          )}
                        </div>
                        {suggestion.type === 'value' && (
                          <div className="smart-suggestion__actions">
                            <button
                              className="smart-suggestion__btn smart-suggestion__btn--apply"
                              onClick={() => applySuggestion(suggestion)}
                            >
                              Anwenden
                            </button>
                            <button
                              className="smart-suggestion__btn smart-suggestion__btn--dismiss"
                              onClick={() => dismissSuggestion(suggestion.id)}
                            >
                              ×
                            </button>
                          </div>
                        )}
                        {suggestion.confidence >= 80 && (
                          <span className="smart-suggestion__confidence">
                            {suggestion.confidence}%
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && visibleSuggestions.length === 0 && patterns.length === 0 && (
                <div className="smart-empty">
                  <span className="smart-empty__icon">🤔</span>
                  <p>Keine Vorschläge verfügbar</p>
                  <small>Fülle mehr Felder aus für personalisierte Vorschläge</small>
                </div>
              )}

              {/* Stats Footer */}
              {stats && (
                <div className="smart-stats">
                  <div className="smart-stat">
                    <span className="smart-stat__value">{(stats as Record<string, number>).totalSuggestions || 0}</span>
                    <span className="smart-stat__label">Vorschläge</span>
                  </div>
                  <div className="smart-stat">
                    <span className="smart-stat__value">{(stats as Record<string, number>).acceptRate || 0}%</span>
                    <span className="smart-stat__label">Akzeptiert</span>
                  </div>
                  <div className="smart-stat">
                    <span className="smart-stat__value">{(stats as Record<string, number>).patterns || 0}</span>
                    <span className="smart-stat__label">Muster</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const injectStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('smart-panel-styles')) return;

  const style = document.createElement('style');
  style.id = 'smart-panel-styles';
  style.textContent = `
    /* Toggle Button */
    .smart-toggle {
      position: fixed;
      bottom: 100px;
      left: 24px;
      z-index: 1000;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
      border-radius: 20px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(245, 158, 11, 0.4);
      transition: all 0.3s;
    }
    
    .smart-toggle:hover {
      transform: scale(1.08) rotate(5deg);
      box-shadow: 0 12px 40px rgba(245, 158, 11, 0.5);
    }
    
    .smart-toggle__icon {
      font-size: 28px;
    }
    
    .smart-toggle__badge {
      position: absolute;
      top: -5px;
      right: -5px;
      width: 24px;
      height: 24px;
      background: #10b981;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 700;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    /* Panel */
    .smart-panel {
      position: fixed;
      bottom: 180px;
      left: 24px;
      z-index: 999;
      width: 380px;
      max-height: calc(100vh - 220px);
      background: rgba(10, 15, 26, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    
    .smart-panel__header {
      padding: 20px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.1));
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .smart-panel__icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #f59e0b, #ef4444);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    
    .smart-panel__title {
      font-size: 18px;
      font-weight: 700;
      color: white;
      margin: 0;
    }
    
    .smart-panel__subtitle {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      margin: 2px 0 0 0;
    }
    
    .smart-panel__close {
      margin-left: auto;
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 18px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .smart-panel__close:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .smart-panel__content {
      padding: 16px;
      overflow-y: auto;
      max-height: calc(100vh - 350px);
    }
    
    /* Progress */
    .smart-progress {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      margin-bottom: 16px;
    }
    
    .smart-progress__ring {
      position: relative;
      width: 48px;
      height: 48px;
    }
    
    .smart-progress__ring svg {
      width: 48px;
      height: 48px;
      transform: rotate(-90deg);
    }
    
    .smart-progress__bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.1);
      stroke-width: 3;
    }
    
    .smart-progress__bar {
      fill: none;
      stroke: url(#smart-gradient);
      stroke-width: 3;
      stroke-linecap: round;
      transition: stroke-dasharray 0.5s ease;
    }
    
    .smart-progress__text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: white;
    }
    
    .smart-progress__info {
      display: flex;
      flex-direction: column;
    }
    
    .smart-progress__label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
    
    .smart-progress__value {
      font-size: 14px;
      font-weight: 600;
      color: white;
    }
    
    /* Loading */
    .smart-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 20px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 13px;
    }
    
    .smart-loading__spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-top-color: #f59e0b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Section */
    .smart-section {
      margin-bottom: 16px;
    }
    
    .smart-section__title {
      font-size: 12px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      margin: 0 0 10px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .smart-section__count {
      font-weight: 400;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.3);
      text-transform: none;
    }
    
    /* Pattern */
    .smart-pattern {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1));
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 12px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }
    
    .smart-pattern:hover {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.15));
      border-color: rgba(16, 185, 129, 0.5);
    }
    
    .smart-pattern__content {
      flex: 1;
    }
    
    .smart-pattern__name {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: white;
    }
    
    .smart-pattern__desc {
      display: block;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 2px;
    }
    
    .smart-pattern__confidence {
      background: rgba(16, 185, 129, 0.2);
      color: #6ee7b7;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
    }
    
    /* Suggestions */
    .smart-suggestions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .smart-suggestion {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      transition: all 0.2s;
    }
    
    .smart-suggestion:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.12);
    }
    
    .smart-suggestion--value {
      border-color: rgba(139, 92, 246, 0.3);
      background: rgba(139, 92, 246, 0.05);
    }
    
    .smart-suggestion--tip {
      border-color: rgba(6, 182, 212, 0.3);
      background: rgba(6, 182, 212, 0.05);
    }
    
    .smart-suggestion__icon {
      font-size: 20px;
      flex-shrink: 0;
    }
    
    .smart-suggestion__content {
      flex: 1;
      min-width: 0;
    }
    
    .smart-suggestion__label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: white;
    }
    
    .smart-suggestion__desc {
      display: block;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 2px;
      line-height: 1.4;
    }
    
    .smart-suggestion__usage {
      display: inline-block;
      font-size: 10px;
      color: rgba(139, 92, 246, 0.8);
      margin-top: 4px;
    }
    
    .smart-suggestion__actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    
    .smart-suggestion__btn {
      padding: 6px 10px;
      border-radius: 6px;
      border: none;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .smart-suggestion__btn--apply {
      background: linear-gradient(135deg, #EAD068, #7c3aed);
      color: white;
    }
    
    .smart-suggestion__btn--apply:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    }
    
    .smart-suggestion__btn--dismiss {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.5);
      width: 24px;
      padding: 0;
    }
    
    .smart-suggestion__btn--dismiss:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
    
    .smart-suggestion__confidence {
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    /* Empty */
    .smart-empty {
      text-align: center;
      padding: 30px 20px;
      color: rgba(255, 255, 255, 0.5);
    }
    
    .smart-empty__icon {
      font-size: 32px;
      display: block;
      margin-bottom: 8px;
    }
    
    .smart-empty p {
      margin: 0 0 4px 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }
    
    .smart-empty small {
      font-size: 12px;
    }
    
    /* Stats */
    .smart-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      margin-top: 12px;
    }
    
    .smart-stat {
      text-align: center;
    }
    
    .smart-stat__value {
      display: block;
      font-size: 16px;
      font-weight: 700;
      color: #f59e0b;
    }
    
    .smart-stat__label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
    }
    
    /* Mobile */
    @media (max-width: 480px) {
      .smart-panel {
        left: 12px;
        right: 12px;
        width: auto;
      }
      
      .smart-toggle {
        bottom: 80px;
        left: 16px;
        width: 52px;
        height: 52px;
      }
    }
  `;
  document.head.appendChild(style);
};

export default WizardSmartPanel;
