/**
 * useValidation Hook
 * ==================
 * Zentrale Validierungslogik für den Wizard
 * - Inline-Validierung pro Feld
 * - Step-Validierung
 * - Fehlermeldungen für UI
 */

import { useMemo, useCallback } from 'react';
import { useWizardStore } from '../stores/wizardStore';
import { validateStep, validateWizard } from '../lib/intelligence/validation';
import type { WizardData } from '../types/wizard.types';

export interface FieldError {
  field: string;
  message: string;
}

export interface StepValidation {
  isValid: boolean;
  errors: FieldError[];
  warnings: string[];
  missingFields: string[];
  errorSummary: string;
}

// Mapping von Error-Keys zu deutschen Feldnamen
const FIELD_LABELS: Record<string, string> = {
  kategorie: 'Kategorie',
  komponenten: 'Komponenten',
  strasse: 'Straße',
  hausnummer: 'Hausnummer',
  plz: 'PLZ',
  ort: 'Ort',
  bundesland: 'Bundesland',
  eigentuemer: 'Eigentümer',
  zustimmung: 'Zustimmung',
  netzbetreiber: 'Netzbetreiber',
  pv_hersteller: 'Modul-Hersteller',
  pv_leistung: 'Modulleistung',
  wr_hersteller: 'Wechselrichter-Hersteller',
  wr_leistung: 'Wechselrichter-Leistung',
  zerez: 'ZEREZ-ID',
  speicher_hersteller: 'Speicher-Hersteller',
  speicher_kapazitaet: 'Speicherkapazität',
  wb_hersteller: 'Wallbox-Hersteller',
  wb_leistung: 'Wallbox-Leistung',
  wp_hersteller: 'Wärmepumpen-Hersteller',
  wp_leistung: 'Wärmepumpen-Leistung',
  einspeiseart: 'Einspeiseart',
  vorname: 'Vorname',
  nachname: 'Nachname',
  email: 'E-Mail',
  telefon: 'Telefon',
  firma: 'Firmenname',
  kundentyp: 'Kundentyp',
  agb: 'AGB',
  datenschutz: 'Datenschutz',
  vollmacht: 'Vollmacht',
  // Phase 1-2: Neue Felder
  zaehler_nummer: 'Zählernummer',
  zaehler_typ: 'Zählertyp',
  zaehler_standort: 'Zählerstandort',
  netzanschluss_absicherung: 'Absicherung',
  fotos_pflicht: 'Pflichtfotos',
  ibn_netzbetreiber: 'NB-Meldung',
  ibn_mastr: 'MaStR-Meldung',
  pruef_isolation: 'Isolationswiderstand',
  pruef_rcd: 'RCD-Auslösezeit',
  demontage_typ: 'Demontage-Typ',
  demontage_grund: 'Demontage-Grund',
  zaehler_prozess: 'Zähler-Prozess',
  fm_installation: 'Installation',
};

// Mapping welche Felder zu welchem Step gehören
const STEP_FIELDS: Record<number, string[]> = {
  1: ['kategorie', 'komponenten', 'demontage_', 'zaehler_prozess', 'fm_'],
  2: ['strasse', 'hausnummer', 'plz', 'ort', 'bundesland'],
  3: ['eigentuemer', 'zustimmung'],
  4: ['netzbetreiber', 'zaehler_', 'netzanschluss_'],
  5: ['pv_hersteller', 'pv_leistung', 'wr_hersteller', 'wr_leistung', 'zerez',
      'speicher_hersteller', 'speicher_kapazitaet', 'wb_hersteller', 'wb_leistung',
      'wp_hersteller', 'wp_leistung', 'einspeiseart'],
  6: ['vorname', 'nachname', 'email', 'telefon', 'firma', 'kundentyp'],
  7: ['fotos_', 'dokument'],
  8: ['agb', 'datenschutz', 'vollmacht', 'ibn_', 'pruef_'],
};

/**
 * Hook für Step-Validierung
 */
export function useStepValidation(step: number): StepValidation {
  const data = useWizardStore((state) => state.data);

  return useMemo(() => {
    const result = validateStep(data, step);

    const errors: FieldError[] = Object.entries(result.errors).map(([field, message]) => ({
      field,
      message,
    }));

    const missingFields = errors.map(e => FIELD_LABELS[e.field] || e.field);

    let errorSummary = '';
    if (errors.length === 1) {
      errorSummary = `Bitte "${missingFields[0]}" ausfüllen`;
    } else if (errors.length > 1) {
      errorSummary = `${errors.length} Felder ausfüllen: ${missingFields.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`;
    }

    return {
      isValid: result.valid,
      errors,
      warnings: result.warnings,
      missingFields,
      errorSummary,
    };
  }, [data, step]);
}

/**
 * Hook für Feld-Validierung (für Inline-Errors)
 */
export function useFieldError(fieldKey: string): string | undefined {
  const data = useWizardStore((state) => state.data);
  const currentStep = useWizardStore((state) => state.currentStep);

  return useMemo(() => {
    // Finde welcher Step dieses Feld enthält
    let fieldStep = 0;
    for (const [step, fields] of Object.entries(STEP_FIELDS)) {
      if (fields.some(f => fieldKey.startsWith(f) || f === fieldKey)) {
        fieldStep = parseInt(step);
        break;
      }
    }

    // Nur validieren wenn wir im gleichen oder späteren Step sind
    if (fieldStep > currentStep) return undefined;

    const result = validateStep(data, fieldStep || currentStep);
    return result.errors[fieldKey];
  }, [data, currentStep, fieldKey]);
}

/**
 * Hook für gesamte Wizard-Validierung
 */
export function useWizardValidation() {
  const data = useWizardStore((state) => state.data);

  return useMemo(() => {
    const result = validateWizard(data);

    const errorsByStep: Record<number, FieldError[]> = {};

    for (const [field, message] of Object.entries(result.errors)) {
      // Finde den Step für dieses Feld
      let stepNum = 0;
      for (const [step, fields] of Object.entries(STEP_FIELDS)) {
        if (fields.some(f => field.startsWith(f) || f === field)) {
          stepNum = parseInt(step);
          break;
        }
      }

      if (!errorsByStep[stepNum]) errorsByStep[stepNum] = [];
      errorsByStep[stepNum].push({ field, message });
    }

    return {
      isValid: result.valid,
      totalErrors: Object.keys(result.errors).length,
      errorsByStep,
      warnings: result.warnings,
    };
  }, [data]);
}

/**
 * Hook für "touched" Felder - zeigt Fehler erst nach Interaktion
 */
export function useTouchedFields() {
  const touchedFields = useWizardStore((state) => (state as unknown as Record<string, unknown>).touchedFields as Set<string> || new Set<string>());
  const setTouchedField = useCallback((field: string) => {
    useWizardStore.setState((state) => ({
      ...state,
      touchedFields: new Set([...((state as unknown as Record<string, unknown>).touchedFields as Set<string> || []), field]),
    }));
  }, []);

  return { touchedFields, setTouchedField };
}

/**
 * Prüft ob ein Step vollständig ist (für Navigation)
 */
export function useCanProceed(step: number): { canProceed: boolean; reason: string } {
  const validation = useStepValidation(step);

  return useMemo(() => {
    if (validation.isValid) {
      return { canProceed: true, reason: '' };
    }

    return {
      canProceed: false,
      reason: validation.errorSummary || 'Bitte alle Pflichtfelder ausfüllen',
    };
  }, [validation]);
}
