import { useEffect, useRef } from 'react';
import { apiGet } from '../../../services/api';
import { fuzzyMatch } from '../utils/fuzzyMatch';
import type { MatchCandidate, ParsedTermin, ZwcAction } from '../types';

interface SearchResult {
  id: number;
  publicId?: string;
  customerName: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  status: string;
}

const AUTO_SELECT_THRESHOLD = 0.7;

/**
 * After parsing, automatically searches installations for each customer name
 * and dispatches match candidates + auto-selects high-confidence matches.
 */
export function useInstallationMatch(
  termine: ParsedTermin[],
  dispatch: React.Dispatch<ZwcAction>
) {
  // Track which termin IDs we've already searched to avoid duplicate calls
  const searchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const pending = termine.filter(
      t => t.status === 'parsed' && t.matchCandidates.length === 0 && !searchedRef.current.has(t.id)
    );

    if (pending.length === 0) return;

    // Mark as searched immediately to prevent duplicate calls
    for (const t of pending) {
      searchedRef.current.add(t.id);
    }

    // Deduplicate by customer name to minimize API calls
    const uniqueNames = new Map<string, string[]>(); // name → terminIds[]
    for (const t of pending) {
      const name = t.customerName.trim();
      if (!name) continue;
      const ids = uniqueNames.get(name) || [];
      ids.push(t.id);
      uniqueNames.set(name, ids);
    }

    async function searchAll() {
      for (const [name, terminIds] of uniqueNames) {
        try {
          const params = new URLSearchParams({ q: name, limit: '10' });
          const res = await apiGet<{ data: SearchResult[] }>(
            `/email-inbox/search-installations?${params}`
          );
          const results = res.data || [];

          // Run fuzzy matching for scoring
          const fuzzyCandidates = results.map(r => ({
            id: r.id,
            name: r.customerName,
            status: r.status,
            plz: r.plz,
            ort: r.ort,
          }));

          const matched = fuzzyMatch(name, fuzzyCandidates, 5, 0.3);

          const candidates: MatchCandidate[] = matched.map(m => ({
            installationId: m.candidate.id,
            customerName: m.candidate.name,
            status: m.candidate.status as string,
            plz: m.candidate.plz as string | undefined,
            ort: m.candidate.ort as string | undefined,
            score: m.score,
          }));

          // Dispatch candidates for all termins with this name
          for (const terminId of terminIds) {
            dispatch({ type: 'SET_MATCH_CANDIDATES', payload: { terminId, candidates } });

            // Auto-select best match if score is high enough
            if (candidates.length > 0 && candidates[0].score >= AUTO_SELECT_THRESHOLD) {
              dispatch({
                type: 'SELECT_MATCH',
                payload: {
                  terminId,
                  installationId: candidates[0].installationId,
                  customerName: candidates[0].customerName,
                },
              });
            }
          }
        } catch (err) {
          // Search failed — leave candidates empty, user can still manually search
          console.warn(`Installation search failed for "${name}":`, err);
        }
      }
    }

    searchAll();
  }, [termine, dispatch]);

  // Reset searched set on full reset (no termine)
  useEffect(() => {
    if (termine.length === 0) {
      searchedRef.current.clear();
    }
  }, [termine.length]);
}
