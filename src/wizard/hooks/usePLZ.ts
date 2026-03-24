/**
 * Baunity PLZ Hook - Automatische Ortserkennung
 * ==========================================
 * React Hook für PLZ → Ort Autocomplete in Formularen
 * 
 * Verwendung:
 * const { ort, bundesland, loading, error } = usePLZ(plzValue);
 */

import { useState, useEffect, useCallback } from 'react';
import { lookupPLZ, isValidPLZ, type PLZResult } from '../lib/plz';

export interface UsePLZResult {
  ort: string;
  bundesland: string;
  bundeslandKurz: string;
  loading: boolean;
  error: string | null;
  isValid: boolean;
}

/**
 * Hook für automatische PLZ → Ort Erkennung
 * 
 * @param plz - Die eingegebene PLZ
 * @param debounceMs - Verzögerung in ms (default: 300)
 * @returns PLZ-Daten mit Ort und Bundesland
 * 
 * @example
 * const [plz, setPlz] = useState('');
 * const { ort, loading } = usePLZ(plz);
 * 
 * useEffect(() => {
 *   if (ort) setFormData(prev => ({ ...prev, ort }));
 * }, [ort]);
 */
export function usePLZ(plz: string, debounceMs: number = 300): UsePLZResult {
  const [result, setResult] = useState<UsePLZResult>({
    ort: '',
    bundesland: '',
    bundeslandKurz: '',
    loading: false,
    error: null,
    isValid: false,
  });

  useEffect(() => {
    const cleanPLZ = plz.replace(/\s/g, '');
    
    // Nicht gültig oder zu kurz
    if (!cleanPLZ || cleanPLZ.length < 5) {
      setResult({
        ort: '',
        bundesland: '',
        bundeslandKurz: '',
        loading: false,
        error: null,
        isValid: false,
      });
      return;
    }

    // Validierung
    if (!isValidPLZ(cleanPLZ)) {
      setResult({
        ort: '',
        bundesland: '',
        bundeslandKurz: '',
        loading: false,
        error: 'Ungültige PLZ',
        isValid: false,
      });
      return;
    }

    // Debounce
    setResult(prev => ({ ...prev, loading: true, error: null }));
    
    const timeoutId = setTimeout(async () => {
      try {
        const data = await lookupPLZ(cleanPLZ);
        
        if (data) {
          setResult({
            ort: data.ort,
            bundesland: data.bundesland || '',
            bundeslandKurz: data.bundeslandKurz || '',
            loading: false,
            error: null,
            isValid: true,
          });
        } else {
          setResult({
            ort: '',
            bundesland: '',
            bundeslandKurz: '',
            loading: false,
            error: 'PLZ nicht gefunden',
            isValid: false,
          });
        }
      } catch (err) {
        console.error('[usePLZ] Error:', err);
        setResult({
          ort: '',
          bundesland: '',
          bundeslandKurz: '',
          loading: false,
          error: 'Fehler beim Laden',
          isValid: false,
        });
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [plz, debounceMs]);

  return result;
}

/**
 * Callback-basierte Version für mehr Kontrolle
 * 
 * @example
 * const lookupCity = usePLZCallback();
 * 
 * const handlePLZChange = async (e) => {
 *   const plz = e.target.value;
 *   setFormData(prev => ({ ...prev, plz }));
 *   
 *   if (plz.length === 5) {
 *     const result = await lookupCity(plz);
 *     if (result) {
 *       setFormData(prev => ({ ...prev, ort: result.ort }));
 *     }
 *   }
 * };
 */
export function usePLZCallback() {
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (plz: string): Promise<PLZResult | null> => {
    const cleanPLZ = plz.replace(/\s/g, '');
    
    if (!isValidPLZ(cleanPLZ)) {
      return null;
    }

    setLoading(true);
    try {
      const result = await lookupPLZ(cleanPLZ);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookup, loading };
}

export default usePLZ;
