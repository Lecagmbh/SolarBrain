/**
 * useSystemValidierung - Real-time validation hook for Step 5 technical data
 * Generates warnings and errors based on current system configuration.
 */

import { useMemo } from 'react';
import type { WizardStep5Data } from '../../../types/wizard.types';

export interface Warnung {
  typ: 'error' | 'warning' | 'info';
  titel: string;
  text: string;
  betrifft: string;
}

interface DCACRatio {
  ratio: number;
  status: string;
  message: string;
}

interface SystemValidierungResult {
  warnings: Warnung[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

export function useSystemValidierung(
  step5: WizardStep5Data,
  dcAcRatio: DCACRatio | null,
): SystemValidierungResult {
  const warnings = useMemo(() => {
    const result: Warnung[] = [];

    // DC/AC > 1.5 -> Error
    if (dcAcRatio && dcAcRatio.ratio > 1.5) {
      result.push({
        typ: 'error',
        titel: 'DC/AC Verhältnis zu hoch',
        text: `Ratio von ${dcAcRatio.ratio.toFixed(2)} überschreitet 1.5. Bitte Wechselrichterleistung erhöhen.`,
        betrifft: 'wechselrichter',
      });
    }

    // DC/AC < 0.8 -> Warning
    if (dcAcRatio && dcAcRatio.ratio > 0 && dcAcRatio.ratio < 0.8) {
      result.push({
        typ: 'warning',
        titel: 'DC/AC Verhältnis niedrig',
        text: `Ratio von ${dcAcRatio.ratio.toFixed(2)} unter 0.8. Wechselrichter möglicherweise überdimensioniert.`,
        betrifft: 'wechselrichter',
      });
    }

    // WR without ZEREZ (manual entry)
    for (const wr of step5.wechselrichter || []) {
      if (wr.hersteller && wr.modell && !wr.zerezId && !wr.produktId) {
        result.push({
          typ: 'warning',
          titel: 'Wechselrichter ohne ZEREZ',
          text: 'Manuell eingetragener WR — bitte beim Netzbetreiber prüfen.',
          betrifft: `wechselrichter-${wr.id}`,
        });
      }
    }

    // Wallbox/WP > 4.2 kW without steuerbar14a
    for (const wb of step5.wallboxen || []) {
      if (wb.leistungKw > 4.2 && !wb.steuerbar14a) {
        result.push({
          typ: 'warning',
          titel: '§14a fehlt',
          text: 'Wallbox/WP über 4.2 kW muss steuerbar sein.',
          betrifft: `wallbox-${wb.id}`,
        });
      }
    }

    for (const wp of step5.waermepumpen || []) {
      if (wp.leistungKw > 4.2 && !wp.steuerbar14a) {
        result.push({
          typ: 'warning',
          titel: '§14a fehlt',
          text: 'Wallbox/WP über 4.2 kW muss steuerbar sein.',
          betrifft: `waermepumpe-${wp.id}`,
        });
      }
    }

    // WR underdimensioned (kVA < kWp * 0.7)
    const totalKwp = step5.gesamtleistungKwp || 0;
    const totalKva = step5.gesamtleistungKva || 0;
    if (totalKwp > 0 && totalKva > 0 && totalKva < totalKwp * 0.7) {
      result.push({
        typ: 'warning',
        titel: 'WR unterdimensioniert',
        text: 'WR-Leistung unter 70% der PV-Leistung.',
        betrifft: 'wechselrichter',
      });
    }

    return result;
  }, [step5, dcAcRatio]);

  const hasErrors = warnings.some(w => w.typ === 'error');
  const hasWarnings = warnings.some(w => w.typ === 'warning');

  return { warnings, hasErrors, hasWarnings };
}
