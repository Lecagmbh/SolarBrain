/**
 * useSolarAnalyse — Auto-Berechnung Hook
 * Triggert automatisch Neuberechnung bei Änderungen (debounced 800ms).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWizardStore } from '../../../stores/wizardStore';
import { solarApi, type SolarBerechnung } from '../../../lib/api/client';

export interface SolarAnalyseState {
  daten: SolarBerechnung | null;
  loading: boolean;
  error: string | null;
}

export function useSolarAnalyse() {
  const { data } = useWizardStore();
  const { step2, step5 } = data;

  const [state, setState] = useState<SolarAnalyseState>({
    daten: null,
    loading: false,
    error: null,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchAnalyse = useCallback(async () => {
    const dachflaechen = (step5.dachflaechen || [])
      .filter(d => d.modulLeistungWp > 0 && d.modulAnzahl > 0)
      .map(d => ({
        kwp: (d.modulLeistungWp * d.modulAnzahl) / 1000,
        neigung: d.neigung || 30,
        ausrichtung: d.ausrichtung || 'S',
      }));

    if (dachflaechen.length === 0) {
      setState({ daten: null, loading: false, error: null });
      return;
    }

    // Speicher kWh
    const speicherKwh = (step5.speicher || []).reduce(
      (s, sp) => s + (sp.kapazitaetKwh || 0) * (sp.anzahl || 1), 0
    );

    // Wallbox kW
    const wallboxKw = (step5.wallboxen || []).reduce(
      (s, w) => s + (w.leistungKw || 0), 0
    );

    // Wärmepumpe kW
    const wpKw = (step5.waermepumpen || []).reduce(
      (s, w) => s + (w.leistungKw || 0), 0
    );

    const einspeiseart = step5.einspeiseart === 'volleinspeisung'
      ? 'volleinspeisung' as const
      : 'ueberschuss' as const;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await solarApi.berechnung({
        lat: step2.gpsLat || 0,
        lng: step2.gpsLng || 0,
        dachflaechen,
        speicherKwh: speicherKwh > 0 ? speicherKwh : undefined,
        wallboxKw: wallboxKw > 0 ? wallboxKw : undefined,
        wpKw: wpKw > 0 ? wpKw : undefined,
        einspeiseart,
      });

      setState({
        daten: result.data,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Berechnung fehlgeschlagen',
      }));
    }
  }, [
    step2.gpsLat,
    step2.gpsLng,
    step5.dachflaechen,
    step5.speicher,
    step5.wallboxen,
    step5.waermepumpen,
    step5.einspeiseart,
  ]);

  // Debounced auto-calculation
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchAnalyse();
    }, 800);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchAnalyse]);

  const neuBerechnen = useCallback(() => {
    fetchAnalyse();
  }, [fetchAnalyse]);

  return {
    ...state,
    neuBerechnen,
    hatKoordinaten: !!(step2.gpsLat && step2.gpsLng),
  };
}
