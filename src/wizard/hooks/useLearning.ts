/**
 * Baunity Wizard - useLearning Hook
 * ===============================
 * React Hook für einfache Integration des Lernsystems in Wizard-Komponenten
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useWizardStore } from '../stores/wizardStore';
import {
  LearningEngine,
  learningSession,
  suggestionEngine,
  patternAnalyzer,
  autofillEngine,
  type SmartSuggestion,
  type RegionalInsight,
  type UserInsight,
  type LearningContext,
  type AutofillSuggestion,
} from '../lib/intelligence/learningEngine';

// ============================================================================
// HOOK: useLearning
// ============================================================================

export interface UseLearningResult {
  // Session
  sessionId: string | null;
  isSessionActive: boolean;
  startSession: () => void;
  endSession: (success: boolean) => Promise<void>;
  
  // Suggestions
  suggestions: SmartSuggestion[];
  isLoadingSuggestions: boolean;
  refreshSuggestions: () => Promise<void>;
  acceptSuggestion: (suggestion: SmartSuggestion) => void;
  rejectSuggestion: (suggestion: SmartSuggestion) => void;
  
  // Insights
  regionalInsight: RegionalInsight | null;
  userInsight: UserInsight | null;
  isLoadingInsights: boolean;
  
  // Autofill
  autofillSuggestions: AutofillSuggestion[];
  applyAutofill: (suggestion: AutofillSuggestion) => void;
  
  // Pattern
  patternMatch: {
    matchesPattern: boolean;
    patternName?: string;
    confidence: number;
    suggestions: string[];
  } | null;
  
  // Tracking
  trackChange: (field: string, oldValue: unknown, newValue: unknown) => void;
}

export function useLearning(): UseLearningResult {
  const { data, currentStep, updateStep2, updateStep5, updateStep6 } = useWizardStore();
  
  // State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [regionalInsight, setRegionalInsight] = useState<RegionalInsight | null>(null);
  const [userInsight, setUserInsight] = useState<UserInsight | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [autofillSuggestions, setAutofillSuggestions] = useState<AutofillSuggestion[]>([]);
  const [patternMatch, setPatternMatch] = useState<UseLearningResult['patternMatch']>(null);
  
  const lastStepRef = useRef(currentStep);
  const isInitializedRef = useRef(false);
  
  // Kontext für Vorschläge
  const context: LearningContext = useMemo(() => ({
    plz: data.step2.plz,
    netzbetreiberId: data.step4.netzbetreiberId,
    kategorie: data.step1.kategorie ?? undefined,
    komponenten: data.step1.komponenten || [],
    currentProducts: {
      module: (data.step5.dachflaechen || []).map(d => ({
        hersteller: d.modulHersteller,
        modell: d.modulModell,
      })),
      wechselrichter: (data.step5.wechselrichter || []).map(w => ({
        hersteller: w.hersteller,
        modell: w.modell,
      })),
      speicher: (data.step5.speicher || []).map(s => ({
        hersteller: s.hersteller,
        modell: s.modell,
      })),
    },
  }), [data]);
  
  // Session starten
  const startSession = useCallback(() => {
    const id = learningSession.startSession();
    setSessionId(id);
  }, []);
  
  // Session beenden
  const endSession = useCallback(async (success: boolean) => {
    await learningSession.endSession(data, success, success ? undefined : currentStep);
    setSessionId(null);
  }, [data, currentStep]);
  
  // Vorschläge laden
  const refreshSuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    try {
      const [smartSuggestions, autofills] = await Promise.all([
        suggestionEngine.getSuggestions(context, currentStep),
        autofillEngine.getAutofillSuggestions(context, currentStep),
      ]);
      setSuggestions(smartSuggestions);
      setAutofillSuggestions(autofills);
    } catch (error) {
      console.warn('[useLearning] Fehler beim Laden der Vorschläge:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [context, currentStep]);
  
  // Insights laden
  const loadInsights = useCallback(async () => {
    setIsLoadingInsights(true);
    try {
      const [regional, user] = await Promise.all([
        data.step2.plz ? suggestionEngine.getRegionalInsights(data.step2.plz) : null,
        suggestionEngine.getUserInsights(),
      ]);
      setRegionalInsight(regional);
      setUserInsight(user);
    } catch (error) {
      console.warn('[useLearning] Fehler beim Laden der Insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [data.step2.plz]);
  
  // Pattern-Analyse
  const analyzePatterns = useCallback(async () => {
    if (currentStep === 5 && (data.step5.wechselrichter?.length || 0) > 0) {
      const result = await patternAnalyzer.analyzeConfiguration(data);
      setPatternMatch(result);
    }
  }, [currentStep, data]);
  
  // Suggestion akzeptieren
  const acceptSuggestion = useCallback((suggestion: SmartSuggestion) => {
    learningSession.trackSuggestion(suggestion.id, suggestion.type, 'accepted');
    suggestionEngine.sendFeedback(suggestion.id, 'accepted');
    
    // Suggestion aus Liste entfernen
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }, []);
  
  // Suggestion ablehnen
  const rejectSuggestion = useCallback((suggestion: SmartSuggestion) => {
    learningSession.trackSuggestion(suggestion.id, suggestion.type, 'rejected');
    suggestionEngine.sendFeedback(suggestion.id, 'rejected');
    
    // Suggestion aus Liste entfernen
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }, []);
  
  // Autofill anwenden
  const applyAutofill = useCallback((suggestion: AutofillSuggestion) => {
    const fields = suggestion.data.fields;
    
    // Je nach aktuellem Step die Daten anwenden
    if (currentStep === 2) {
      updateStep2(fields as Parameters<typeof updateStep2>[0]);
    } else if (currentStep === 5) {
      updateStep5(fields as Parameters<typeof updateStep5>[0]);
    } else if (currentStep === 6) {
      updateStep6(fields as Parameters<typeof updateStep6>[0]);
    }
    
    // Tracking
    learningSession.trackSuggestion(suggestion.id, 'autofill', 'accepted');
    
    // Aus Liste entfernen
    setAutofillSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }, [currentStep, updateStep2, updateStep5, updateStep6]);
  
  // Änderung tracken
  const trackChange = useCallback((field: string, oldValue: unknown, newValue: unknown) => {
    learningSession.trackChange(currentStep, field, oldValue, newValue);
  }, [currentStep]);
  
  // Initialisierung
  useEffect(() => {
    if (!isInitializedRef.current) {
      LearningEngine.initialize();
      isInitializedRef.current = true;
    }
  }, []);
  
  // Step-Wechsel tracken
  useEffect(() => {
    if (lastStepRef.current !== currentStep) {
      learningSession.enterStep(currentStep);
      lastStepRef.current = currentStep;
      
      // Neue Vorschläge für neuen Step laden
      refreshSuggestions();
    }
  }, [currentStep, refreshSuggestions]);
  
  // Insights laden wenn PLZ sich ändert
  useEffect(() => {
    if (data.step2.plz && data.step2.plz.length >= 2) {
      loadInsights();
    }
  }, [data.step2.plz, loadInsights]);
  
  // Pattern-Analyse bei Produkt-Änderungen
  useEffect(() => {
    analyzePatterns();
  }, [analyzePatterns]);
  
  // Autofill-Daten speichern bei Step-Wechsel
  useEffect(() => {
    if (currentStep === 3 && data.step2.plz) {
      autofillEngine.saveForAutofill(2, data.step2 as unknown as Record<string, unknown>);
    }
    if (currentStep === 7 && data.step6.vorname) {
      autofillEngine.saveForAutofill(6, data.step6 as unknown as Record<string, unknown>);
    }
  }, [currentStep, data.step2, data.step6]);
  
  return {
    sessionId,
    isSessionActive: sessionId !== null,
    startSession,
    endSession,
    
    suggestions,
    isLoadingSuggestions,
    refreshSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    
    regionalInsight,
    userInsight,
    isLoadingInsights,
    
    autofillSuggestions,
    applyAutofill,
    
    patternMatch,
    
    trackChange,
  };
}

// ============================================================================
// HOOK: useSuggestions (vereinfacht)
// ============================================================================

export function useSuggestions() {
  const { suggestions, isLoadingSuggestions, acceptSuggestion, rejectSuggestion } = useLearning();
  
  const highPriority = suggestions.filter(s => s.priority === 'high');
  const mediumPriority = suggestions.filter(s => s.priority === 'medium');
  const lowPriority = suggestions.filter(s => s.priority === 'low');
  
  return {
    suggestions,
    highPriority,
    mediumPriority,
    lowPriority,
    isLoading: isLoadingSuggestions,
    accept: acceptSuggestion,
    reject: rejectSuggestion,
    count: suggestions.length,
  };
}

// ============================================================================
// HOOK: useRegionalData
// ============================================================================

export function useRegionalData(plz?: string) {
  const [insight, setInsight] = useState<RegionalInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!plz || plz.length < 2) {
      setInsight(null);
      return;
    }
    
    setIsLoading(true);
    suggestionEngine.getRegionalInsights(plz)
      .then(setInsight)
      .finally(() => setIsLoading(false));
  }, [plz]);
  
  return { insight, isLoading };
}

// ============================================================================
// HOOK: usePatternAnalysis
// ============================================================================

export function usePatternAnalysis() {
  const { data } = useWizardStore();
  const [result, setResult] = useState<{
    matchesPattern: boolean;
    patternName?: string;
    confidence: number;
    suggestions: string[];
  } | null>(null);
  
  useEffect(() => {
    if ((data.step5.wechselrichter?.length || 0) > 0 || (data.step5.speicher?.length || 0) > 0) {
      patternAnalyzer.analyzeConfiguration(data).then(setResult);
    }
  }, [data]);
  
  return result;
}

export default useLearning;
