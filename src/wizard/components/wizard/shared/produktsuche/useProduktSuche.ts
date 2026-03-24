/**
 * Baunity Wizard - useProduktSuche Hook
 *
 * Extrahiert die gesamte Such-Logik (State, Refs, Callbacks, Effects)
 * aus der ProduktAutocomplete-Komponente in einen wiederverwendbaren Hook.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../../../lib/api/client';
import type {
  ProduktAutocompleteProps,
  ProduktDBItem,
  SmartMatchResponse,
  ZerezComponent,
} from './produktSuche.types';
import {
  API_ENDPOINTS,
  SERVER_AUTOCOMPLETE_TYPES,
  ZEREZ_CATEGORIES,
  SMART_MATCH_TYPE_MAP,
} from './produktSuche.types';
import {
  parseQuery,
  zerezToProduktDBItem,
  produktToWizardData,
} from './produktSuche.utils';

export function useProduktSuche(props: ProduktAutocompleteProps) {
  const {
    typ,
    herstellerValue,
    modellValue,
    onHerstellerChange,
    onModellChange,
    onProduktSelect,
    onManualChange,
    onHybridDetected,
  } = props;

  // Internal query: combines hersteller + modell
  const buildQuery = (h: string, m: string) => {
    const parts = [h, m].filter(Boolean);
    return parts.join(' ');
  };

  // ─── STATE ──────────────────────────────────────────────────────────────
  const [query, setQuery] = useState(() => buildQuery(herstellerValue, modellValue));
  const [suggestions, setSuggestions] = useState<ProduktDBItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [localSearching, setLocalSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedProdukt, setSelectedProdukt] = useState<ProduktDBItem | null>(null);
  const [smartSearching, setSmartSearching] = useState(false);
  const [matchSource, setMatchSource] = useState<SmartMatchResponse['match']>(null);
  const [alternativeReason, setAlternativeReason] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // ─── REFS ───────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const smartDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSmartSearchRef = useRef('');
  const justSelectedRef = useRef(false);
  const localCountRef = useRef(0);

  // Sync external values to query (only on mount or when parent resets)
  const prevExternalRef = useRef(`${herstellerValue}|${modellValue}`);
  useEffect(() => {
    const extKey = `${herstellerValue}|${modellValue}`;
    if (extKey !== prevExternalRef.current && !justSelectedRef.current) {
      const newQuery = buildQuery(herstellerValue, modellValue);
      if (newQuery !== query) setQuery(newQuery);
      prevExternalRef.current = extKey;
    }
  }, [herstellerValue, modellValue]);

  // ─── LOCAL SEARCH ───────────────────────────────────────────────────────
  const searchLocal = useCallback(async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      // Keine Vorschläge bei leerem/kurzem Input — erst ab 2 Zeichen suchen
      setSuggestions([]);
      setIsOpen(false);
      localCountRef.current = 0;
      return;
    }

    setLocalSearching(true);
    const { hersteller: h, modell: m } = parseQuery(q);
    const hLow = h.toLowerCase();
    const mLow = m.toLowerCase();

    try {
      const zerezCat = ZEREZ_CATEGORIES[typ];
      const serverAutocomplete = SERVER_AUTOCOMPLETE_TYPES[typ];

      if (zerezCat) {
        // ZEREZ-basierte Suche (Wechselrichter, Speicher)
        const res = await api.get<{ success: boolean; suggestions: ZerezComponent[] }>(
          `/zerez/autocomplete?q=${encodeURIComponent(q)}&category=${zerezCat}&limit=15`
        );
        if (res.data?.success && Array.isArray(res.data.suggestions)) {
          const items = res.data.suggestions.map(zerezToProduktDBItem);
          setSuggestions(items);
          setIsOpen(items.length > 0);
          localCountRef.current = items.length;
        } else {
          setSuggestions([]);
          localCountRef.current = 0;
        }
      } else if (serverAutocomplete) {
        // Server-seitiges Autocomplete (PV-Module)
        const res = await api.get<{ success: boolean; suggestions: ProduktDBItem[] }>(
          `${API_ENDPOINTS[typ]}?q=${encodeURIComponent(q)}&limit=15`
        );
        if (res.data?.success && Array.isArray(res.data.suggestions)) {
          setSuggestions(res.data.suggestions);
          setIsOpen(res.data.suggestions.length > 0);
          localCountRef.current = res.data.suggestions.length;
        } else {
          setSuggestions([]);
          localCountRef.current = 0;
        }
      } else {
        // Client-seitige Suche (Wallboxen, Waermepumpen -- kleine Datenmengen)
        const res = await api.get<ProduktDBItem[]>(API_ENDPOINTS[typ]);
        const all = (res.status >= 200 && res.status < 300 && Array.isArray(res.data)) ? res.data : [];

        const scored = all.map(p => {
          const pH = (p.hersteller?.name || '').toLowerCase();
          const pM = (p.modell || '').toLowerCase();
          let score = 0;
          if (hLow.length >= 2) {
            if (pH === hLow) score += 100;
            else if (pH.startsWith(hLow)) score += 80;
            else if (pH.includes(hLow)) score += 50;
          }
          if (mLow.length >= 1) {
            if (pM === mLow) score += 100;
            else if (pM.startsWith(mLow)) score += 70;
            else if (pM.includes(mLow)) score += 40;
            for (const part of mLow.split(/[\s\-\.]+/).filter(x => x.length >= 2)) {
              if (pM.includes(part)) score += 20;
            }
          }
          if (q.length >= 3 && (pM.includes(q.toLowerCase()) || pH.includes(q.toLowerCase()))) {
            score += 30;
          }
          return { p, score };
        });

        const filtered = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 15).map(s => s.p);
        setSuggestions(filtered);
        setIsOpen(filtered.length > 0);
        localCountRef.current = filtered.length;
      }
    } catch (e) {
      console.error('Lokale Suche fehlgeschlagen:', e);
      setSuggestions([]);
      localCountRef.current = 0;
    } finally {
      setLocalSearching(false);
    }
  }, [typ]);

  // ─── PRODUCT SELECTION ──────────────────────────────────────────────────
  const handleSelect = useCallback((produkt: ProduktDBItem, match?: SmartMatchResponse['match']) => {
    justSelectedRef.current = true;
    setTimeout(() => { justSelectedRef.current = false; }, 200);

    setSelectedProdukt(produkt);
    if (match) setMatchSource(match);
    setSearchError(null);
    setIsOpen(false);
    setSuggestions([]);

    const name = `${produkt.hersteller?.name || ''} ${produkt.modell}`.trim();
    setQuery(name);

    onHerstellerChange(produkt.hersteller?.name || '');
    onModellChange(produkt.modell);

    const wizardData = produktToWizardData(typ, produkt);
    onProduktSelect?.(produkt, wizardData);

    // Hybrid-Erkennung: STORAGE_INVERTER als WR oder Speicher mit Leistung
    if (onHybridDetected) {
      if (typ === 'wechselrichter' && produkt.zerezCategory === 'STORAGE_INVERTER') {
        onHybridDetected({ direction: 'wr-is-hybrid', produkt, wizardData });
      } else if (typ === 'speicher' && (produkt.ladeleistungMaxKw || 0) > 0) {
        onHybridDetected({ direction: 'speicher-is-hybrid', produkt, wizardData });
      }
    }

    // Background: Usage tracken + GPT-Enrichment fuer unverifizierte Produkte
    if (produkt.id && SERVER_AUTOCOMPLETE_TYPES[typ]) {
      const baseRoute = typ === 'speicher' ? '/produkte/speicher' : '/produkte/pv-module';
      api.post(`${baseRoute}/${produkt.id}/track-usage`, {}).catch(() => {});
      if (!produkt.verified) {
        api.post<{ success: boolean; enriched: boolean; modul?: ProduktDBItem; speicher?: ProduktDBItem }>(
          `${baseRoute}/${produkt.id}/enrich`, {}
        ).then(res => {
          const enriched = res.data?.modul || res.data?.speicher;
          if (res.data?.enriched && enriched) {
            setSelectedProdukt(enriched);
            const updatedWizardData = produktToWizardData(typ, enriched);
            onProduktSelect?.(enriched, updatedWizardData);
          }
        }).catch(() => {});
      }
    }
  }, [typ, onHerstellerChange, onModellChange, onProduktSelect, onHybridDetected]);

  // ─── SMART MATCH (RAG + KI) ────────────────────────────────────────────
  const searchSmart = useCallback(async (searchQuery: string, auto = true) => {
    if (smartSearching) return;
    const q = searchQuery.trim();
    if (q.length < 3) return;

    const { hersteller: h, modell: m } = parseQuery(q);
    if (h.length < 2) return;

    const key = `${h}|${m}`;
    if (auto && key === lastSmartSearchRef.current) return;
    lastSmartSearchRef.current = key;

    setSmartSearching(true);
    setSearchError(null);

    try {
      const res = await api.post<SmartMatchResponse>('/produkte/smart-match', {
        hersteller: h,
        modell: m || h, // Fallback: Wenn nur 1 Wort, beides als Hersteller + Modell
        typ: SMART_MATCH_TYPE_MAP[typ],
      });
      const data = res.data;

      if (data?.success && data.match) {
        const p = data.match.produkt;

        // Pruefe ob Alternative vorhanden (Produkt ohne ZEREZ -> zertifizierte Alternative)
        if (data.alternative && data.alternative.produkt && data.alternative.zerezId) {
          const alt = data.alternative;
          const altProdukt = alt.produkt;
          altProdukt.zerezId = alt.zerezId;
          setAlternativeReason(alt.reason);
          const altMatch: SmartMatchResponse['match'] = {
            source: 'zerez',
            confidence: alt.confidence,
            produkt: altProdukt,
            zerezId: alt.zerezId,
            created: false,
          };
          setMatchSource(altMatch);
          handleSelect(altProdukt, altMatch);
        } else if (p) {
          setAlternativeReason(null);
          if (data.match.zerezId) p.zerezId = data.match.zerezId;
          setMatchSource(data.match);
          handleSelect(p, data.match);
        }
      } else if (data?.alternative && data.alternative.produkt && data.alternative.zerezId) {
        // Kein direkter Match, aber ZEREZ-Alternative gefunden
        const alt = data.alternative;
        const altProdukt = alt.produkt;
        altProdukt.zerezId = alt.zerezId;
        setAlternativeReason(alt.reason);
        const altMatch: SmartMatchResponse['match'] = {
          source: 'zerez',
          confidence: alt.confidence,
          produkt: altProdukt,
          zerezId: alt.zerezId,
          created: false,
        };
        setMatchSource(altMatch);
        handleSelect(altProdukt, altMatch);
      } else if (data?.suggestions?.length) {
        setSuggestions(data.suggestions);
        setIsOpen(true);
      } else if (!auto) {
        setSearchError('Kein Produkt gefunden — manuelle Eingabe möglich');
      }
    } catch (e) {
      console.error('Smart-Match Fehler:', e);
      if (!auto) setSearchError('Suche fehlgeschlagen');
    } finally {
      setSmartSearching(false);
    }
  }, [typ, smartSearching, handleSelect]);

  // ─── INPUT HANDLER ──────────────────────────────────────────────────────
  const handleInput = useCallback((value: string) => {
    setQuery(value);
    setSelectedProdukt(null);
    setMatchSource(null);
    setAlternativeReason(null);
    setSearchError(null);
    lastSmartSearchRef.current = '';

    // Sync to parent
    const { hersteller, modell } = parseQuery(value);
    onHerstellerChange(hersteller);
    onModellChange(modell);
    onManualChange?.(hersteller, modell);
  }, [onHerstellerChange, onModellChange, onManualChange]);

  // ─── CLEAR ──────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setSelectedProdukt(null);
    setMatchSource(null);
    setAlternativeReason(null);
    setSearchError(null);
    setQuery('');
    lastSmartSearchRef.current = '';
    onHerstellerChange('');
    onModellChange('');
    onProduktSelect?.(null, null);
    onManualChange?.('', '');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [onHerstellerChange, onModellChange, onProduktSelect, onManualChange]);

  // ─── KEYBOARD ──────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isOpen && query.trim().length >= 3 && !selectedProdukt) {
      e.preventDefault();
      searchSmart(query, false);
      return;
    }
    if (!isOpen) return;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, -1)); break;
      case 'Enter': e.preventDefault(); if (selectedIndex >= 0 && suggestions[selectedIndex]) handleSelect(suggestions[selectedIndex]); break;
      case 'Escape': setIsOpen(false); break;
    }
  }, [isOpen, query, selectedProdukt, selectedIndex, suggestions, searchSmart, handleSelect]);

  // ─── FOCUS HANDLER ─────────────────────────────────────────────────────
  const handleFocus = useCallback(() => {
    if (selectedProdukt) return;
    // Nur bestehende Suggestions wieder anzeigen, KEINE neuen laden
    if (suggestions.length > 0 && query.trim().length >= 2) {
      setIsOpen(true);
    }
  }, [selectedProdukt, suggestions.length, query]);

  // ─── DEBOUNCED SEARCH EFFECTS ──────────────────────────────────────────

  // 1) Local search: 300ms debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (justSelectedRef.current || selectedProdukt) return;

    debounceRef.current = setTimeout(() => searchLocal(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchLocal, selectedProdukt]);

  // 2) Smart-Match nur manuell via Enter-Taste (kein Auto-Trigger mehr)

  // ─── CLICK OUTSIDE ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── COMPUTED ──────────────────────────────────────────────────────────
  const isSearching = localSearching || smartSearching;

  return {
    // State
    query,
    suggestions,
    isOpen,
    localSearching,
    selectedIndex,
    selectedProdukt,
    smartSearching,
    matchSource,
    alternativeReason,
    searchError,
    isSearching,

    // Refs
    containerRef,
    inputRef,
    localCountRef,

    // Handlers
    handleInput,
    handleSelect,
    handleClear,
    handleKeyDown,
    handleFocus,
    setSelectedIndex,
  };
}
