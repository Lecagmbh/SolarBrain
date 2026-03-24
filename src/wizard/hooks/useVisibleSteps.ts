/**
 * useVisibleSteps Hook
 * ====================
 * Berechnet die sichtbaren Steps basierend auf dem erkannten Szenario.
 * Ermöglicht dynamische Navigation für verschiedene Prozesse:
 * - Standard-PV: Steps 1-6, 8 (Step 7 global deaktiviert)
 * - Demontage: Steps 1, 2, 4, 6, 8 (ohne Eigentümer und Technik)
 * - Zähler: Steps 1, 2, 4, 6, 8 (minimal)
 * - Fertigmeldung: Steps 1, 2, 4, 6, 8
 *
 * Step 7 (Dokumente & Formulare) ist global deaktiviert.
 */

import { useMemo } from 'react';
import { useWizardStore } from '../stores/wizardStore';
import { detectSzenario } from '../lib/intelligence/detector';
import { getSzenarioConfig } from '../lib/intelligence/scenarios';

export interface VisibleStep {
  number: number;
  label: string;
  shortLabel: string;
  active: boolean;
}

// Step 7 (Dokumente & Formulare) global deaktiviert — verwirrt nur
const GLOBALLY_DISABLED_STEPS = new Set([7]);

// Step-Definitionen
const STEP_DEFINITIONS: Record<number, { label: string; shortLabel: string }> = {
  1: { label: 'Kategorie', shortLabel: 'Kat' },
  2: { label: 'Standort', shortLabel: 'Ort' },
  3: { label: 'Eigentümer', shortLabel: 'Eig' },
  4: { label: 'Netz', shortLabel: 'Netz' },
  5: { label: 'Technik', shortLabel: 'Tech' },
  6: { label: 'Kontakt', shortLabel: 'Kont' },
  7: { label: 'Dokumente', shortLabel: 'Dok' },
  8: { label: 'Abschluss', shortLabel: 'Ende' },
};

/**
 * Hook: Gibt die Liste der sichtbaren Steps zurück
 */
export function useVisibleSteps(): VisibleStep[] {
  const data = useWizardStore((state) => state.data);

  return useMemo(() => {
    const szenario = detectSzenario(data);
    const config = getSzenarioConfig(szenario);

    const visibleSteps: VisibleStep[] = [];

    for (let i = 1; i <= 8; i++) {
      // Global deaktivierte Steps überspringen
      if (GLOBALLY_DISABLED_STEPS.has(i)) continue;

      const stepKey = `step${i}` as keyof typeof config.steps;
      const isActive = config.steps[stepKey] ?? true;

      if (isActive) {
        visibleSteps.push({
          number: i,
          label: STEP_DEFINITIONS[i].label,
          shortLabel: STEP_DEFINITIONS[i].shortLabel,
          active: true,
        });
      }
    }

    return visibleSteps;
  }, [data]);
}

/**
 * Hook: Prüft ob ein bestimmter Step sichtbar ist
 */
export function useIsStepVisible(stepNumber: number): boolean {
  const data = useWizardStore((state) => state.data);

  return useMemo(() => {
    // Global deaktivierte Steps sind nie sichtbar
    if (GLOBALLY_DISABLED_STEPS.has(stepNumber)) return false;

    const szenario = detectSzenario(data);
    const config = getSzenarioConfig(szenario);
    const stepKey = `step${stepNumber}` as keyof typeof config.steps;
    return config.steps[stepKey] ?? true;
  }, [data, stepNumber]);
}

/**
 * Hook: Berechnet den nächsten sichtbaren Step
 */
export function useNextVisibleStep(currentStep: number): number {
  const visibleSteps = useVisibleSteps();

  return useMemo(() => {
    const currentIndex = visibleSteps.findIndex(s => s.number === currentStep);
    if (currentIndex === -1 || currentIndex >= visibleSteps.length - 1) {
      // Letzter Step oder nicht gefunden
      return visibleSteps[visibleSteps.length - 1]?.number ?? 8;
    }
    return visibleSteps[currentIndex + 1].number;
  }, [visibleSteps, currentStep]);
}

/**
 * Hook: Berechnet den vorherigen sichtbaren Step
 */
export function usePrevVisibleStep(currentStep: number): number {
  const visibleSteps = useVisibleSteps();

  return useMemo(() => {
    const currentIndex = visibleSteps.findIndex(s => s.number === currentStep);
    if (currentIndex <= 0) {
      // Erster Step oder nicht gefunden
      return visibleSteps[0]?.number ?? 1;
    }
    return visibleSteps[currentIndex - 1].number;
  }, [visibleSteps, currentStep]);
}

/**
 * Hook: Gibt den Index des aktuellen Steps in den sichtbaren Steps zurück
 */
export function useVisibleStepIndex(currentStep: number): { index: number; total: number } {
  const visibleSteps = useVisibleSteps();

  return useMemo(() => {
    const index = visibleSteps.findIndex(s => s.number === currentStep);
    return {
      index: index >= 0 ? index : 0,
      total: visibleSteps.length,
    };
  }, [visibleSteps, currentStep]);
}

/**
 * Hook: Gibt das aktuelle Szenario und seine Konfiguration zurück
 */
export function useCurrentSzenario() {
  const data = useWizardStore((state) => state.data);

  return useMemo(() => {
    const szenario = detectSzenario(data);
    const config = getSzenarioConfig(szenario);
    return { szenario, config };
  }, [data]);
}
