/**
 * Baunity Wizard Learning Engine V1
 * ==================================
 * Intelligentes Lernsystem das mit jeder Installation schlauer wird
 *
 * Features:
 * - Speichert Nutzerverhalten (Produktwahl, Konfigurationen)
 * - Erkennt Muster (beliebte Kombinationen, regionale Präferenzen)
 * - Generiert intelligente Vorschläge
 * - Lernt kontinuierlich aus Feedback
 */

import type { WizardData } from '../../types/wizard.types';
import {
  WIZARD_LEARNING_SESSION_KEY,
  WIZARD_FAILED_SESSIONS_KEY,
  WIZARD_LAST_ADDRESS_KEY,
  WIZARD_LAST_CUSTOMER_KEY,
} from '../stubs/storage';

// ============================================================================
// TYPES
// ============================================================================

export interface LearningSession {
  sessionId: string;
  startedAt: Date;
  stepTimings: Record<number, { entered: Date; duration: number }>;
  changes: ChangeEvent[];
  suggestions: SuggestionInteraction[];
}

export interface ChangeEvent {
  timestamp: Date;
  step: number;
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface SuggestionInteraction {
  suggestionId: string;
  suggestionType: string;
  action: 'shown' | 'accepted' | 'rejected' | 'ignored';
  timestamp: Date;
}

export interface SmartSuggestion {
  id: string;
  type: 'product' | 'configuration' | 'warning' | 'tip' | 'autofill';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  confidence: number; // 0-1
  data?: Record<string, unknown>;
  source: 'regional' | 'personal' | 'pattern' | 'compatibility';
}

export interface ProductSuggestion extends SmartSuggestion {
  type: 'product';
  data: {
    produktTyp: 'modul' | 'wechselrichter' | 'speicher' | 'wallbox';
    hersteller: string;
    modell: string;
    grund: string;
    alternatives?: { hersteller: string; modell: string }[];
  };
}

export interface ConfigurationSuggestion extends SmartSuggestion {
  type: 'configuration';
  data: {
    field: string;
    suggestedValue: unknown;
    currentValue?: unknown;
    grund: string;
  };
}

export interface AutofillSuggestion extends SmartSuggestion {
  type: 'autofill';
  data: {
    fields: Record<string, unknown>;
    grund: string;
  };
}

export interface LearningContext {
  plz?: string;
  netzbetreiberId?: string;
  kategorie?: string;
  komponenten?: string[];
  currentProducts?: {
    module?: { hersteller: string; modell: string }[];
    wechselrichter?: { hersteller: string; modell: string }[];
    speicher?: { hersteller: string; modell: string }[];
  };
}

export interface RegionalInsight {
  plzPrefix: string;
  avgKwp: number;
  avgSpeicherKwh: number;
  speicherQuote: number;
  wallboxQuote: number;
  wpQuote: number;
  topProducts: {
    module: { hersteller: string; count: number }[];
    wechselrichter: { hersteller: string; count: number }[];
    speicher: { hersteller: string; count: number }[];
  };
  topCombinations: {
    wr: string;
    speicher: string;
    count: number;
    successRate: number;
  }[];
  avgProcessingDays: number;
}

export interface UserInsight {
  avgKwp: number;
  preferredManufacturers: {
    module: string[];
    wechselrichter: string[];
    speicher: string[];
  };
  successRate: number;
  totalInstallations: number;
  avgDuration: number;
  commonPatterns: string[];
}

// ============================================================================
// LEARNING SESSION MANAGER
// ============================================================================

class LearningSessionManager {
  private session: LearningSession | null = null;
  private currentStep = 1;
  private stepEnterTime: Date | null = null;
  
  /**
   * Startet eine neue Lern-Session
   */
  startSession(): string {
    const sessionId = `wizard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.session = {
      sessionId,
      startedAt: new Date(),
      stepTimings: {},
      changes: [],
      suggestions: [],
    };
    this.enterStep(1);
    
    // Session im localStorage speichern für Wiederherstellung
    this.saveToLocalStorage();
    
    return sessionId;
  }
  
  /**
   * Beendet die Session und sendet Daten ans Backend
   */
  async endSession(wizardData: WizardData, success: boolean, abortStep?: number): Promise<void> {
    if (!this.session) return;
    
    // Letzten Step beenden
    this.leaveStep(this.currentStep);
    
    const sessionData = {
      ...this.session,
      completedAt: new Date(),
      success,
      abortStep,
      wizardData: this.extractLearningData(wizardData),
    };
    
    try {
      await this.sendToBackend(sessionData);
    } catch (error) {
      console.error('[LearningEngine] Fehler beim Speichern:', error);
      // Fallback: Lokal speichern für späteren Sync
      this.saveFailedSession(sessionData);
    }
    
    this.clearLocalStorage();
    this.session = null;
  }
  
  /**
   * Notiert Eintritt in einen Step
   */
  enterStep(step: number): void {
    if (!this.session) return;
    
    // Vorherigen Step beenden
    if (this.currentStep !== step) {
      this.leaveStep(this.currentStep);
    }
    
    this.currentStep = step;
    this.stepEnterTime = new Date();
    
    if (!this.session.stepTimings[step]) {
      this.session.stepTimings[step] = { entered: this.stepEnterTime, duration: 0 };
    }
  }
  
  /**
   * Notiert Verlassen eines Steps
   */
  leaveStep(step: number): void {
    if (!this.session || !this.stepEnterTime) return;
    
    const duration = (Date.now() - this.stepEnterTime.getTime()) / 1000;
    if (this.session.stepTimings[step]) {
      this.session.stepTimings[step].duration += duration;
    }
    
    this.saveToLocalStorage();
  }
  
  /**
   * Trackt eine Änderung
   */
  trackChange(step: number, field: string, oldValue: unknown, newValue: unknown): void {
    if (!this.session) return;
    
    // Ignoriere identische Werte
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
    
    this.session.changes.push({
      timestamp: new Date(),
      step,
      field,
      oldValue,
      newValue,
    });
    
    this.saveToLocalStorage();
  }
  
  /**
   * Trackt Suggestion-Interaktion
   */
  trackSuggestion(suggestionId: string, type: string, action: SuggestionInteraction['action']): void {
    if (!this.session) return;
    
    this.session.suggestions.push({
      suggestionId,
      suggestionType: type,
      action,
      timestamp: new Date(),
    });
    
    this.saveToLocalStorage();
  }
  
  /**
   * Extrahiert relevante Lern-Daten aus dem Wizard
   */
  private extractLearningData(data: WizardData) {
    return {
      // Standort
      plz: data.step2.plz,
      bundesland: data.step2.bundesland,
      
      // Netzbetreiber
      netzbetreiberId: data.step4.netzbetreiberId,
      netzbetreiberName: data.step4.netzbetreiberName,
      
      // Anlagentyp
      kategorie: data.step1.kategorie,
      vorgangsart: data.step1.vorgangsart,
      komponenten: data.step1.komponenten,
      groessenklasse: data.step1.groessenklasse,
      
      // Technik
      gesamtleistungKwp: data.step5.gesamtleistungKwp,
      gesamtleistungKva: data.step5.gesamtleistungKva,
      speicherKwh: data.step5.gesamtSpeicherKwh,
      
      // Produkte (für Pattern-Erkennung)
      produkte: {
        module: (data.step5.dachflaechen || []).map(d => ({
          hersteller: d.modulHersteller,
          modell: d.modulModell,
          leistungWp: d.modulLeistungWp,
          anzahl: d.modulAnzahl,
        })),
        wechselrichter: (data.step5.wechselrichter || []).map(w => ({
          hersteller: w.hersteller,
          modell: w.modell,
          leistungKva: w.leistungKva,
          anzahl: w.anzahl,
        })),
        speicher: (data.step5.speicher || []).map(s => ({
          hersteller: s.hersteller,
          modell: s.modell,
          kapazitaetKwh: s.kapazitaetKwh,
          anzahl: s.anzahl,
        })),
        wallboxen: data.step5.wallboxen?.length || 0,
        waermepumpen: data.step5.waermepumpen?.length || 0,
      },
      
      // Konfiguration
      messkonzept: data.step5.messkonzept,
      einspeiseart: data.step5.einspeiseart,
      kundentyp: data.step6.kundentyp,
    };
  }
  
  /**
   * Sendet Daten ans Backend
   */
  private async sendToBackend(sessionData: unknown): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/wizard/learning', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(sessionData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }
  
  private saveToLocalStorage(): void {
    if (this.session) {
      try {
        localStorage.setItem(WIZARD_LEARNING_SESSION_KEY, JSON.stringify(this.session));
      } catch (e) {
        console.warn('[LearningEngine] LocalStorage voll');
      }
    }
  }
  
  private clearLocalStorage(): void {
    localStorage.removeItem(WIZARD_LEARNING_SESSION_KEY);
  }
  
  private saveFailedSession(data: unknown): void {
    try {
      const failed = JSON.parse(localStorage.getItem(WIZARD_FAILED_SESSIONS_KEY) || '[]');
      failed.push(data);
      // Max 10 failed sessions behalten
      if (failed.length > 10) failed.shift();
      localStorage.setItem(WIZARD_FAILED_SESSIONS_KEY, JSON.stringify(failed));
    } catch (e) {
      console.warn('[LearningEngine] Konnte failed session nicht speichern');
    }
  }
  
  /**
   * Versucht fehlgeschlagene Sessions erneut zu senden
   */
  async syncFailedSessions(): Promise<void> {
    try {
      const failed = JSON.parse(localStorage.getItem(WIZARD_FAILED_SESSIONS_KEY) || '[]');
      if (failed.length === 0) return;
      
      const remaining = [];
      for (const session of failed) {
        try {
          await this.sendToBackend(session);
        } catch {
          remaining.push(session);
        }
      }
      
      if (remaining.length > 0) {
        localStorage.setItem(WIZARD_FAILED_SESSIONS_KEY, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(WIZARD_FAILED_SESSIONS_KEY);
      }
    } catch (e) {
      // Ignore
    }
  }
  
  getSessionId(): string | null {
    return this.session?.sessionId || null;
  }
  
  getCurrentStep(): number {
    return this.currentStep;
  }
}

// ============================================================================
// SUGGESTION ENGINE
// ============================================================================

class SuggestionEngine {
  private cache: Map<string, { suggestions: SmartSuggestion[]; expires: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 Minuten
  
  /**
   * Holt intelligente Vorschläge basierend auf Kontext
   */
  async getSuggestions(context: LearningContext, step: number): Promise<SmartSuggestion[]> {
    const cacheKey = this.getCacheKey(context, step);
    
    // Cache prüfen
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.suggestions;
    }
    
    try {
      // Vom Backend holen
      const suggestions = await this.fetchSuggestions(context, step);
      
      // Cachen
      this.cache.set(cacheKey, {
        suggestions,
        expires: Date.now() + this.CACHE_TTL,
      });
      
      return suggestions;
    } catch (error) {
      console.warn('[SuggestionEngine] Fehler beim Laden der Vorschläge:', error);
      // Fallback: Lokale Vorschläge generieren
      return this.generateLocalSuggestions(context, step);
    }
  }
  
  /**
   * Holt regionale Insights
   */
  async getRegionalInsights(plz: string): Promise<RegionalInsight | null> {
    if (!plz || plz.length < 2) return null;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/wizard/learning/regional/${plz.substring(0, 2)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return this.generateLocalRegionalInsight(plz);
    }
  }
  
  /**
   * Holt Benutzer-spezifische Insights
   */
  async getUserInsights(): Promise<UserInsight | null> {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const response = await fetch('/api/wizard/learning/user-insights', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }
  
  /**
   * Holt kompatible Produkt-Empfehlungen
   */
  async getCompatibleProducts(
    produktTyp: 'wechselrichter' | 'speicher',
    baseProduct: { hersteller: string; modell: string },
    context: LearningContext
  ): Promise<ProductSuggestion[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wizard/learning/compatible-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ produktTyp, baseProduct, context }),
      });
      
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }
  
  /**
   * Sendet Feedback zu einem Vorschlag
   */
  async sendFeedback(
    suggestionId: string, 
    action: 'accepted' | 'rejected' | 'ignored'
  ): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/wizard/learning/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ suggestionId, action }),
      });
    } catch {
      // Fehler ignorieren
    }
  }
  
  private async fetchSuggestions(context: LearningContext, step: number): Promise<SmartSuggestion[]> {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/wizard/learning/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ context, step }),
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }
  
  /**
   * Generiert lokale Vorschläge wenn Backend nicht erreichbar
   */
  private generateLocalSuggestions(context: LearningContext, step: number): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    // Step 5: Produkt-Vorschläge
    if (step === 5) {
      // Regionale Durchschnittswerte als Orientierung
      if (context.plz) {
        const regional = this.generateLocalRegionalInsight(context.plz);
        if (regional) {
          suggestions.push({
            id: `local-kwp-hint-${context.plz}`,
            type: 'tip',
            priority: 'low',
            title: 'Regionale Orientierung',
            description: `In Ihrer Region (PLZ ${context.plz.substring(0, 2)}xxx) werden durchschnittlich ${regional.avgKwp.toFixed(1)} kWp installiert. ${regional.speicherQuote}% haben einen Speicher.`,
            confidence: 0.7,
            source: 'regional',
          });
        }
      }
      
      // Wechselrichter + Speicher Kompatibilität
      if (context.currentProducts?.wechselrichter?.length && !context.currentProducts?.speicher?.length) {
        const wr = context.currentProducts.wechselrichter[0];
        if (wr.hersteller) {
          suggestions.push({
            id: `local-speicher-hint-${wr.hersteller}`,
            type: 'tip',
            priority: 'medium',
            title: 'Passender Speicher',
            description: `Für ${wr.hersteller} Wechselrichter werden oft Speicher desselben Herstellers verwendet für optimale Integration.`,
            confidence: 0.6,
            source: 'pattern',
          });
        }
      }
    }
    
    return suggestions;
  }
  
  /**
   * Generiert lokale regionale Insights basierend auf PLZ
   */
  private generateLocalRegionalInsight(plz: string): RegionalInsight {
    const plz1 = plz.charAt(0);
    
    // Regionale Unterschiede simulieren
    const baseKwp: Record<string, number> = {
      '0': 9.5, '1': 8.5, '2': 9.0, '3': 10.0, '4': 9.5, 
      '5': 9.0, '6': 10.5, '7': 11.0, '8': 11.5, '9': 10.5
    };
    
    const avgKwp = baseKwp[plz1] || 10.0;
    const isSouth = ['7', '8'].includes(plz1);
    
    return {
      plzPrefix: plz.substring(0, 2),
      avgKwp,
      avgSpeicherKwh: avgKwp * 0.9, // Typisch ~1 kWh pro kWp
      speicherQuote: isSouth ? 72 : 60,
      wallboxQuote: isSouth ? 45 : 38,
      wpQuote: isSouth ? 28 : 20,
      topProducts: {
        module: [
          { hersteller: 'JA Solar', count: 45 },
          { hersteller: 'Trina Solar', count: 32 },
          { hersteller: 'Longi', count: 28 },
        ],
        wechselrichter: [
          { hersteller: 'Fronius', count: 38 },
          { hersteller: 'Huawei', count: 35 },
          { hersteller: 'SMA', count: 27 },
        ],
        speicher: [
          { hersteller: 'BYD', count: 42 },
          { hersteller: 'Huawei', count: 28 },
          { hersteller: 'Tesla', count: 15 },
        ],
      },
      topCombinations: [
        { wr: 'Fronius Symo GEN24', speicher: 'BYD HVS', count: 156, successRate: 96 },
        { wr: 'Huawei SUN2000', speicher: 'Huawei LUNA', count: 134, successRate: 94 },
        { wr: 'SMA Sunny Tripower', speicher: 'BYD HVM', count: 98, successRate: 95 },
      ],
      avgProcessingDays: 14,
    };
  }
  
  private getCacheKey(context: LearningContext, step: number): string {
    return `${step}-${context.plz || ''}-${context.kategorie || ''}-${JSON.stringify(context.komponenten || [])}`;
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// PATTERN ANALYZER
// ============================================================================

class PatternAnalyzer {
  /**
   * Analysiert ob aktuelle Konfiguration einem bekannten erfolgreichen Muster entspricht
   */
  async analyzeConfiguration(data: WizardData): Promise<{
    matchesPattern: boolean;
    patternName?: string;
    confidence: number;
    suggestions: string[];
  }> {
    // Lokale Analyse basierend auf bekannten guten Mustern
    const patterns = this.getKnownPatterns();
    
    const wrHersteller = String(data.step5.wechselrichter[0]?.hersteller || '').toLowerCase();
    const spHersteller = String(data.step5.speicher[0]?.hersteller || '').toLowerCase();

    for (const pattern of patterns) {
      if (wrHersteller.includes(String(pattern.wr || '').toLowerCase()) &&
          spHersteller.includes(String(pattern.speicher || '').toLowerCase())) {
        return {
          matchesPattern: true,
          patternName: pattern.name,
          confidence: pattern.successRate / 100,
          suggestions: [`${pattern.name} ist eine bewährte Kombination mit ${pattern.successRate}% Erfolgsquote`],
        };
      }
    }
    
    // Keine bekannte Kombination
    if (wrHersteller && spHersteller) {
      return {
        matchesPattern: false,
        confidence: 0.5,
        suggestions: [
          'Diese Produkt-Kombination ist uns noch nicht bekannt.',
          'Prüfen Sie die Kompatibilität der Komponenten.',
        ],
      };
    }
    
    return {
      matchesPattern: false,
      confidence: 0,
      suggestions: [],
    };
  }
  
  /**
   * Gibt bekannte erfolgreiche Muster zurück
   */
  private getKnownPatterns(): { name: string; wr: string; speicher: string; successRate: number }[] {
    return [
      { name: 'Fronius + BYD', wr: 'fronius', speicher: 'byd', successRate: 96 },
      { name: 'Huawei Komplettsystem', wr: 'huawei', speicher: 'huawei', successRate: 94 },
      { name: 'SMA + BYD', wr: 'sma', speicher: 'byd', successRate: 95 },
      { name: 'Kostal + BYD', wr: 'kostal', speicher: 'byd', successRate: 93 },
      { name: 'SolarEdge + LG', wr: 'solaredge', speicher: 'lg', successRate: 92 },
      { name: 'Fronius + Huawei LUNA', wr: 'fronius', speicher: 'luna', successRate: 91 },
      { name: 'GoodWe Komplettsystem', wr: 'goodwe', speicher: 'goodwe', successRate: 90 },
    ];
  }
}

// ============================================================================
// AUTOFILL ENGINE
// ============================================================================

class AutofillEngine {
  /**
   * Generiert Autofill-Vorschläge basierend auf Benutzerhistorie
   */
  async getAutofillSuggestions(
    context: LearningContext, 
    step: number
  ): Promise<AutofillSuggestion[]> {
    const suggestions: AutofillSuggestion[] = [];
    
    // Step 2: Adresse aus letzter Installation
    if (step === 2) {
      const lastAddress = this.getLastUsedAddress();
      if (lastAddress) {
        suggestions.push({
          id: 'autofill-address',
          type: 'autofill',
          priority: 'high',
          title: 'Letzte Adresse verwenden',
          description: `${lastAddress.strasse} ${lastAddress.hausnummer}, ${lastAddress.plz} ${lastAddress.ort}`,
          confidence: 0.9,
          source: 'personal',
          data: {
            fields: lastAddress,
            grund: 'Basierend auf Ihrer letzten Installation',
          },
        });
      }
    }
    
    // Step 6: Kundendaten wiederverwenden
    if (step === 6) {
      const lastCustomer = this.getLastCustomerData();
      if (lastCustomer) {
        suggestions.push({
          id: 'autofill-customer',
          type: 'autofill',
          priority: 'high',
          title: 'Kundendaten wiederverwenden',
          description: `${lastCustomer.vorname} ${lastCustomer.nachname}`,
          confidence: 0.8,
          source: 'personal',
          data: {
            fields: lastCustomer,
            grund: 'Basierend auf Ihrer letzten Installation',
          },
        });
      }
    }
    
    return suggestions;
  }
  
  private getLastUsedAddress(): Record<string, string> | null {
    try {
      const data = localStorage.getItem(WIZARD_LAST_ADDRESS_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  
  private getLastCustomerData(): Record<string, string> | null {
    try {
      const data = localStorage.getItem(WIZARD_LAST_CUSTOMER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  
  /**
   * Speichert Daten für zukünftige Autofills
   */
  saveForAutofill(step: number, data: Record<string, unknown>): void {
    try {
      if (step === 2) {
        const address = {
          strasse: data.strasse,
          hausnummer: data.hausnummer,
          plz: data.plz,
          ort: data.ort,
          bundesland: data.bundesland,
        };
        localStorage.setItem(WIZARD_LAST_ADDRESS_KEY, JSON.stringify(address));
      }
      
      if (step === 6) {
        const customer = {
          kundentyp: data.kundentyp,
          vorname: data.vorname,
          nachname: data.nachname,
          email: data.email,
          telefon: data.telefon,
        };
        localStorage.setItem(WIZARD_LAST_CUSTOMER_KEY, JSON.stringify(customer));
      }
    } catch {
      // LocalStorage voll - ignorieren
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Singleton-Instanzen
export const learningSession = new LearningSessionManager();
export const suggestionEngine = new SuggestionEngine();
export const patternAnalyzer = new PatternAnalyzer();
export const autofillEngine = new AutofillEngine();

// Convenience-Export
export const LearningEngine = {
  session: learningSession,
  suggestions: suggestionEngine,
  patterns: patternAnalyzer,
  autofill: autofillEngine,
  
  /**
   * Initialisiert das Lernsystem beim App-Start
   */
  async initialize(): Promise<void> {
    // Fehlgeschlagene Sessions synchronisieren
    await learningSession.syncFailedSessions();
    
    // LearningEngine initialized
  },
};

export default LearningEngine;
