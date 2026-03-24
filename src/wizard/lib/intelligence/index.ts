/**
 * Baunity Intelligence Engine V2 - Enterprise Edition
 * ================================================
 * Umfassende Entscheidungslogik für Netzanmeldungen
 */

// === CORE TYPES ===
export type { AnmeldeSzenario, SzenarioConfig, AITipp, ValidationResult, NBAnforderung } from './types';

// === SZENARIO DETECTION ===
export { detectSzenario, berechneAbgeleiteteWerte } from './detector';
export { SZENARIO_CONFIGS, getSzenarioConfig } from './scenarios';

// === AI TIPPS ===
export { generiereAITipps, getSzenarioHinweise } from './tipps';

// === VALIDATION ===
export { validateWizard, validateStep, validateStringKonfiguration } from './validation';

// === NETZBETREIBER ===
export { NB_ANFORDERUNGEN, getNBAnforderungen, getNBBesonderheiten, getNBPortalUrl } from './netzbetreiber';

// === NEU: PRODUKT-KOMPATIBILITÄT ===
export { 
  pruefeKompatibilitaet, 
  schnellCheck, 
  empfehleKonfiguration,
  berechneVocBeiTemp,
  berechneVmppBeiTemp,
  type ModulDaten,
  type WechselrichterDaten,
  type StringKonfiguration,
  type KompatibilitaetsErgebnis,
} from './compatibility';

// === NEU: ERTRAGSPROGNOSE ===
export {
  berechneErtragsprognose,
  schnellschaetzung,
  type ErtragInput,
  type ErtragPrognose,
  type Verschattung,
} from './ertrag';

// === NEU: MESSKONZEPT ===
export {
  ermittleMesskonzept,
  getAlleMesskonzepte,
  getMesskonzept,
  type MesskonzeptTyp,
  type MesskonzeptInfo,
} from './messkonzept';

// === NEU: WIRTSCHAFTLICHKEIT ===
export {
  berechneWirtschaftlichkeit,
  schnellROI,
  type WirtschaftlichkeitInput,
  type WirtschaftlichkeitErgebnis,
} from './wirtschaftlichkeit';

// === NEU: FORMULARE & NB-PORTAL ===
export {
  ermittleErforderlicheFormulare,
  fuelleFormular,
  generiereAlleFormulare,
  generiereE1HTML,
  generierePortalAnleitung,
  exportiereAlsJSON,
  NB_PORTAL_INFO,
  type VDEFormular,
  type FormularDaten,
  type NBPortalInfo,
} from './formulare';

// === NEU: ANALYTICS ===
export {
  getNBStatistik,
  prognostiziereBearbeitung,
  getBeliebtesteKonfiguration,
  vergleicheMitRegion,
  analysiereOptimalenZeitpunkt,
  type NBStatistik,
  type PrognoseErgebnis,
} from './analytics';

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

import type { WizardData } from '../../types/wizard.types';
import { detectSzenario, berechneAbgeleiteteWerte } from './detector';
import { getSzenarioConfig } from './scenarios';
import { generiereAITipps } from './tipps';
import { validateStep } from './validation';
import { getNBAnforderungen } from './netzbetreiber';
import { berechneErtragsprognose, type ErtragInput } from './ertrag';
import { ermittleMesskonzept } from './messkonzept';
import { berechneWirtschaftlichkeit, type WirtschaftlichkeitInput } from './wirtschaftlichkeit';
import { prognostiziereBearbeitung } from './analytics';
import { generiereAlleFormulare } from './formulare';

/**
 * KOMPLETTE Intelligenz-Analyse für einen Wizard-Stand
 */
export function analyzeWizardComplete(data: WizardData, currentStep: number) {
  const szenario = detectSzenario(data);
  const config = getSzenarioConfig(szenario);
  const werte = berechneAbgeleiteteWerte(data);
  const tipps = generiereAITipps(data, currentStep);
  const validation = validateStep(data, currentStep);
  const nbAnf = data.step4.netzbetreiberName ? getNBAnforderungen(data.step4.netzbetreiberId || '') : null;
  
  // Ertragsprognose
  let ertrag = null;
  if (werte.gesamtleistungKwp > 0 && data.step2.plz) {
    const ertragInput: ErtragInput = {
      leistungKwp: werte.gesamtleistungKwp,
      plz: data.step2.plz,
      azimut: 0, // Default Süd
      neigung: 30, // Default optimal
      verschattung: 'keine',
      speicherKwh: data.step5.speicher?.reduce((s, sp) => s + (sp.kapazitaetKwh * sp.anzahl), 0) || 0,
      jahresverbrauchKwh: 4500, // Default
    };
    ertrag = berechneErtragsprognose(ertragInput);
  }
  
  // Messkonzept
  const messkonzept = ermittleMesskonzept(data);
  
  // Wirtschaftlichkeit
  let wirtschaftlichkeit = null;
  if (ertrag && werte.gesamtleistungKwp > 0) {
    const wallboxKw = data.step5.wallboxen?.reduce((s, w) => s + (w.leistungKw * w.anzahl), 0) || 0;
    const wpKw = data.step5.waermepumpen?.reduce((s, w) => s + w.leistungKw, 0) || 0;
    const wirtInput: WirtschaftlichkeitInput = {
      pvLeistungKwp: werte.gesamtleistungKwp,
      speicherKwh: data.step5.speicher?.reduce((s, sp) => s + (sp.kapazitaetKwh * sp.anzahl), 0) || 0,
      wallboxKw,
      waermepumpeKw: wpKw,
      jahresertragKwh: ertrag.jahresertragKwh,
      eigenverbrauchQuote: (ertrag.eigenverbrauchMitSpeicher || ertrag.eigenverbrauchOhneSpeicher) / 100,
      jahresverbrauchKwh: 4500,
      einspeiseart: (data.step5.einspeiseart as 'ueberschuss' | 'volleinspeisung') || 'ueberschuss',
      paragraph14aGeraete: (wallboxKw > 4.2 ? 1 : 0) + (wpKw > 4.2 ? 1 : 0),
    };
    wirtschaftlichkeit = berechneWirtschaftlichkeit(wirtInput);
  }
  
  // Bearbeitungsprognose
  let prognose = null;
  if (data.step4.netzbetreiberName) {
    prognose = prognostiziereBearbeitung(
      data.step4.netzbetreiberId || data.step4.netzbetreiberName,
      data.step1.groessenklasse || 'klein',
      data.step1.komponenten.includes('speicher'),
      werte.istNaSchutzPflichtig,
      validation.valid
    );
  }
  
  // Formulare
  const formulare = generiereAlleFormulare(data);
  
  return {
    // Basis
    szenario,
    szenarioName: config.name,
    szenarioBeschreibung: config.beschreibung,
    activeSteps: config.steps,
    technikFelder: config.technikFelder,
    kundenFelder: config.kundenFelder,
    erforderlicheDokumente: config.dokumente,
    berechnet: werte,
    validation,
    tipps,
    hinweise: config.hinweise,
    warnungen: config.warnungen,
    verfahren: config.verfahren,
    finanzen: config.finanzen,
    netzbetreiber: nbAnf,
    
    // Erweitert
    ertrag,
    messkonzept,
    wirtschaftlichkeit,
    prognose,
    formulare,
  };
}

// Legacy-kompatible Funktion
export function analyzeWizard(data: WizardData, currentStep: number) {
  return analyzeWizardComplete(data, currentStep);
}

/**
 * Prüft ob ein Step übersprungen werden kann
 */
export function canSkipStep(data: WizardData, step: number): boolean {
  const config = getSzenarioConfig(detectSzenario(data));
  const stepKey = `step${step}` as keyof typeof config.steps;
  return !config.steps[stepKey];
}

/**
 * Nächster relevanter Step
 */
export function getNextRelevantStep(data: WizardData, currentStep: number): number {
  const config = getSzenarioConfig(detectSzenario(data));
  for (let s = currentStep + 1; s <= 8; s++) {
    const stepKey = `step${s}` as keyof typeof config.steps;
    if (config.steps[stepKey]) return s;
  }
  return 8;
}

/**
 * Vorheriger relevanter Step
 */
export function getPrevRelevantStep(data: WizardData, currentStep: number): number {
  const config = getSzenarioConfig(detectSzenario(data));
  for (let s = currentStep - 1; s >= 1; s--) {
    const stepKey = `step${s}` as keyof typeof config.steps;
    if (config.steps[stepKey]) return s;
  }
  return 1;
}

/**
 * Fortschritt berechnen
 */
export function calculateProgress(data: WizardData, currentStep: number): number {
  const config = getSzenarioConfig(detectSzenario(data));
  const activeSteps = Object.values(config.steps).filter(Boolean).length;
  const completedSteps = Math.min(currentStep - 1, activeSteps);
  return (completedSteps / activeSteps) * 100;
}

// === PRODUKT SYNC ===
export {
  produktCache,
  sucheProdukte,
  sucheHersteller,
  findeExaktesProdukt,
  findeAehnlichesProdukt,
  syncProduktZuDB,
  ladeProduktFuerWizard,
  produktZuWizardFormat,
  verknuepfeDatenblattMitProdukt,
  getAutocompleteOptions,
  type ProduktTyp,
  type Produkt,
  type PVModul,
  type Wechselrichter,
  type Speicher,
  type Wallbox,
  type Waermepumpe,
  type Hersteller,
  type SuchErgebnis,
  type SyncResult,
} from './produktSync';

// === LEARNING ENGINE ===
export {
  LearningEngine,
  learningSession,
  suggestionEngine,
  patternAnalyzer,
  autofillEngine,
  type LearningSession,
  type ChangeEvent,
  type SuggestionInteraction,
  type SmartSuggestion,
  type ProductSuggestion,
  type ConfigurationSuggestion,
  type AutofillSuggestion,
  type LearningContext,
  type RegionalInsight,
  type UserInsight,
} from './learningEngine';
