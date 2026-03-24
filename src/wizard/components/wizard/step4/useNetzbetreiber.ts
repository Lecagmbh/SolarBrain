/**
 * useNetzbetreiber - Custom Hook for Netzbetreiber selection logic
 * Extracts all NB state + logic from the monolithic Step4 component.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Netzbetreiber, WizardStep4Data } from '../../../types/wizard.types';

// Helper to safely convert any value to string (prevents React Error #525)
export const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('name' in (value as object)) return String((value as { name: unknown }).name);
    if ('label' in (value as object)) return String((value as { label: unknown }).label);
    return '';
  }
  return String(value);
};

export interface UseNetzbetreiberReturn {
  // State
  inputValue: string;
  showSuggestions: boolean;
  apiNetzbetreiber: Netzbetreiber[];
  plzMatch: Netzbetreiber | null;
  isLoadingApi: boolean;
  isLoadingPlz: boolean;
  isSyncingVNB: boolean;
  isSavingNew: boolean;
  vnbSyncResult: { success: boolean; message: string } | null;
  inputRef: React.RefObject<HTMLInputElement | null>;

  // Derived
  isExactMatch: boolean;
  showNBWarning: boolean;
  suggestions: Netzbetreiber[];

  // Handlers
  handleSyncVNBdigital: () => Promise<void>;
  handleSaveNewNetzbetreiber: () => Promise<void>;
  selectFromDB: (nb: Netzbetreiber) => void;
  saveManualEntry: () => void;
  handleInputChange: (value: string) => void;
  handleBlur: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  setShowSuggestions: (v: boolean) => void;
  setPlzMatch: (nb: Netzbetreiber | null) => void;
  setInputValue: (v: string) => void;
}

export function useNetzbetreiber(
  plz: string,
  netzbetreiberName: string | undefined,
  updateStep4: (data: Partial<WizardStep4Data>) => void
): UseNetzbetreiberReturn {
  // Autocomplete State
  const [inputValue, setInputValue] = useState(String(netzbetreiberName || ''));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [apiNetzbetreiber, setApiNetzbetreiber] = useState<Netzbetreiber[]>([]);
  const [plzMatch, setPlzMatch] = useState<Netzbetreiber | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [isLoadingPlz, setIsLoadingPlz] = useState(false);
  const [isSyncingVNB, setIsSyncingVNB] = useState(false);
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [vnbSyncResult, setVnbSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth-Token Helper
  const getAuthToken = useCallback((): string | null => {
    const tokenKeys = ['baunity_token', 'token', 'accessToken', 'access_token', 'auth_token', 'jwt'];
    for (const key of tokenKeys) {
      const token = localStorage.getItem(key);
      if (token && (token.includes('.') || token.length > 20)) {
        return token;
      }
    }
    try {
      const authStr = localStorage.getItem('auth') || localStorage.getItem('user');
      if (authStr) {
        const auth = JSON.parse(authStr);
        if (auth.token) return auth.token;
        if (auth.accessToken) return auth.accessToken;
      }
    } catch {}
    return null;
  }, []);

  // 1. Load ALL Netzbetreiber from DB on mount
  useEffect(() => {
    const loadAllNetzbetreiber = async () => {
      setIsLoadingApi(true);

      const token = getAuthToken();

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/netzbetreiber?aktiv=true&limit=1000', {
          credentials: 'include',
          headers,
        });

        if (response.ok) {
          const result = await response.json();
          const items = result?.data || result || [];

          if (Array.isArray(items) && items.length > 0) {
            const nbList: Netzbetreiber[] = items.map((nb: any) => ({
              id: String(nb.id),
              name: nb.name || '',
              kurzname: nb.kurzname,
              ort: nb.ort || '',
              bundesland: nb.bundesland || '',
              bdewCode: nb.bdewCode,
              plzBereiche: [],
            }));
            setApiNetzbetreiber(nbList);
          }
        } else {
          console.warn('[NB] API Fehler:', response.status);
        }
      } catch (e) {
        console.error('[NB] Fehler beim Laden:', e);
      } finally {
        setIsLoadingApi(false);
      }
    };

    loadAllNetzbetreiber();
  }, [getAuthToken]);

  // 2. PLZ-based search - finds the matching Netzbetreiber for the PLZ
  useEffect(() => {
    const findByPLZ = async () => {
      const trimmedPlz = plz?.trim() || '';
      if (trimmedPlz.length !== 5 || netzbetreiberName) return;

      setIsLoadingPlz(true);
      setVnbSyncResult(null);

      const token = getAuthToken();

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/netzbetreiber/by-plz/${trimmedPlz}`, {
          credentials: 'include',
          headers,
        });

        if (response.ok) {
          const result = await response.json();

          if (result.netzbetreiber && (result.confidence === 'exact' || result.confidence === 'match')) {
            const best = result.netzbetreiber;

            const matchedNb: Netzbetreiber = {
              id: String(best.id),
              name: best.name || '',
              kurzname: best.kurzname,
              ort: result.ort || '',
              bundesland: '',
              plzBereiche: [],
            };

            setPlzMatch(matchedNb);

            // Auto-Select
            if (!netzbetreiberName) {
              updateStep4({
                netzbetreiberId: String(best.id),
                netzbetreiberName: best.name,
                netzbetreiberManuell: undefined,
              });
              setInputValue(String(best.name || ''));
            }

            // Show info when from VNBdigital
            if (result.source === 'vnbdigital' && result.netzbetreiber.isNew) {
              setVnbSyncResult({
                success: true,
                message: `Netzbetreiber "${best.name}" wurde von VNBdigital abgerufen und gespeichert.`,
              });
            }
          } else {
            setPlzMatch(null);
          }
        }
      } catch (e) {
        console.error('[NB] PLZ-Suche Fehler:', e);
      } finally {
        setIsLoadingPlz(false);
      }
    };

    findByPLZ();
  }, [plz]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual VNBdigital sync
  const handleSyncVNBdigital = useCallback(async () => {
    const trimmedPlz = plz?.trim() || '';
    if (trimmedPlz.length !== 5) {
      setVnbSyncResult({ success: false, message: 'Bitte geben Sie zuerst eine gültige PLZ ein.' });
      return;
    }

    setIsSyncingVNB(true);
    setVnbSyncResult(null);

    const token = getAuthToken();

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/netzbetreiber/by-plz/${trimmedPlz}`, {
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        const result = await response.json();

        if (result.netzbetreiber) {
          const best = result.netzbetreiber;

          const matchedNb: Netzbetreiber = {
            id: String(best.id),
            name: best.name || '',
            kurzname: best.kurzname,
            ort: result.ort || '',
            bundesland: '',
            plzBereiche: [],
          };

          setPlzMatch(matchedNb);
          updateStep4({
            netzbetreiberId: String(best.id),
            netzbetreiberName: best.name,
            netzbetreiberManuell: undefined,
          });
          setInputValue(String(best.name || ''));

          setVnbSyncResult({
            success: true,
            message: `\u2705 ${best.name} (Quelle: ${result.source === 'vnbdigital' ? 'VNBdigital' : 'Datenbank'})`,
          });

          // Reload Netzbetreiber list
          setTimeout(() => {
            const loadNB = async () => {
              const res = await fetch('/api/netzbetreiber?aktiv=true&limit=1000', {
                credentials: 'include',
                headers,
              });
              if (res.ok) {
                const data = await res.json();
                const items = data?.data || data || [];
                if (Array.isArray(items)) {
                  setApiNetzbetreiber(
                    items.map((nb: any) => ({
                      id: String(nb.id),
                      name: nb.name || '',
                      kurzname: nb.kurzname,
                      ort: nb.ort || '',
                      bundesland: nb.bundesland || '',
                      bdewCode: nb.bdewCode,
                      plzBereiche: [],
                    }))
                  );
                }
              }
            };
            loadNB();
          }, 500);
        } else {
          setVnbSyncResult({
            success: false,
            message: `Kein Netzbetreiber für PLZ ${trimmedPlz} gefunden. Bitte manuell eingeben.`,
          });
        }
      } else {
        setVnbSyncResult({ success: false, message: 'API-Fehler beim Abrufen.' });
      }
    } catch (e: any) {
      console.error('[VNBdigital] Sync Fehler:', e);
      setVnbSyncResult({ success: false, message: e.message || 'Fehler beim Abrufen' });
    } finally {
      setIsSyncingVNB(false);
    }
  }, [plz, getAuthToken, updateStep4]);

  // Save new Netzbetreiber to DB
  const handleSaveNewNetzbetreiber = useCallback(async () => {
    const name = String(inputValue || '').trim();
    if (!name) return;

    setIsSavingNew(true);

    const token = getAuthToken();

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const trimmedPlz = plz?.trim() || '';

      const response = await fetch('/api/netzbetreiber', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          name,
          plzBereiche: trimmedPlz ? [trimmedPlz] : [],
          aktiv: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newId = result?.id || result?.data?.id;

        updateStep4({
          netzbetreiberId: String(newId),
          netzbetreiberName: name,
          netzbetreiberManuell: undefined,
        });

        setVnbSyncResult({
          success: true,
          message: `\u2705 "${name}" wurde zur Datenbank hinzugefügt.`,
        });

        // Add to list
        setApiNetzbetreiber((prev) => [
          ...prev,
          {
            id: String(newId),
            name,
            kurzname: undefined,
            ort: '',
            bundesland: '',
            bdewCode: undefined,
            plzBereiche: [],
          },
        ]);

        setShowSuggestions(false);
      } else {
        const err = await response.json().catch(() => ({}));
        setVnbSyncResult({
          success: false,
          message: err?.message || 'Fehler beim Speichern',
        });
      }
    } catch (e: any) {
      console.error('[NB] Create Fehler:', e);
      setVnbSyncResult({ success: false, message: e.message || 'Fehler beim Speichern' });
    } finally {
      setIsSavingNew(false);
    }
  }, [inputValue, plz, getAuthToken, updateStep4]);

  // Sync inputValue with store
  useEffect(() => {
    if (netzbetreiberName && netzbetreiberName !== inputValue) {
      setInputValue(String(netzbetreiberName || ''));
    }
  }, [netzbetreiberName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Is it an exact match?
  const isExactMatch = !!plzMatch && !!netzbetreiberName;

  // Suggestions based on input
  const suggestions = useMemo((): Netzbetreiber[] => {
    if (!inputValue || inputValue.length < 2) return apiNetzbetreiber.slice(0, 10);
    const q = String(inputValue || '').toLowerCase();
    return apiNetzbetreiber
      .filter(
        (nb) =>
          String(nb.name || '').toLowerCase().includes(q) ||
          String(nb.kurzname || '').toLowerCase().includes(q) ||
          String(nb.ort || '').toLowerCase().includes(q) ||
          String(nb.bundesland || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [inputValue, apiNetzbetreiber]);

  // Select NB from DB
  const selectFromDB = useCallback(
    (nb: Netzbetreiber) => {
      updateStep4({
        netzbetreiberId: String(nb.id),
        netzbetreiberName: nb.name,
        netzbetreiberManuell: undefined,
      });
      setInputValue(String(nb.name || ''));
      setShowSuggestions(false);
      setVnbSyncResult(null);

      // Save PLZ mapping
      try {
        if (plz) {
          const mappings = JSON.parse(localStorage.getItem('nb-plz-mappings') || '{}');
          mappings[plz] = nb.name;
          localStorage.setItem('nb-plz-mappings', JSON.stringify(mappings));
        }
      } catch (e) {}
    },
    [plz, updateStep4]
  );

  // Save manual entry (will be synced to DB)
  const saveManualEntry = useCallback(() => {
    if (!String(inputValue || '').trim()) return;

    const matches = apiNetzbetreiber.filter(
      (nb) => String(nb.name || '').toLowerCase() === String(inputValue || '').toLowerCase()
    );

    if (matches.length > 0) {
      selectFromDB(matches[0]);
    } else {
      updateStep4({
        netzbetreiberId: undefined,
        netzbetreiberName: String(inputValue || '').trim(),
        netzbetreiberManuell: 'true',
      });
      setShowSuggestions(false);
    }
  }, [inputValue, apiNetzbetreiber, selectFromDB, updateStep4]);

  // Input Handler
  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      setShowSuggestions(true);
      setVnbSyncResult(null);

      if (netzbetreiberName !== value) {
        updateStep4({
          netzbetreiberId: undefined,
          netzbetreiberName: undefined,
          netzbetreiberManuell: undefined,
        });
      }
    },
    [netzbetreiberName, updateStep4]
  );

  // Blur Handler
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setShowSuggestions(false);
      if (inputValue && !netzbetreiberName) {
        saveManualEntry();
      }
    }, 200);
  }, [inputValue, netzbetreiberName, saveManualEntry]);

  // Enter Handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveManualEntry();
        inputRef.current?.blur();
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    },
    [saveManualEntry]
  );

  // Show warning when no NB loaded
  const showNBWarning = apiNetzbetreiber.length === 0 && !isLoadingApi;

  return {
    inputValue,
    showSuggestions,
    apiNetzbetreiber,
    plzMatch,
    isLoadingApi,
    isLoadingPlz,
    isSyncingVNB,
    isSavingNew,
    vnbSyncResult,
    inputRef,
    isExactMatch,
    showNBWarning,
    suggestions,
    handleSyncVNBdigital,
    handleSaveNewNetzbetreiber,
    selectFromDB,
    saveManualEntry,
    handleInputChange,
    handleBlur,
    handleKeyDown,
    setShowSuggestions,
    setPlzMatch,
    setInputValue,
  };
}
