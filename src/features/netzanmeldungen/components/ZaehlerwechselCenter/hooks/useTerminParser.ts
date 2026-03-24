import { useCallback } from 'react';
import { parseTerminLines } from '../utils/terminParser';
import type { ParsedTermin, ZwcAction } from '../types';

/**
 * Pure text parsing hook. NO database, NO API, NO matching.
 * Converts raw text into ParsedTermin[] with status "parsed".
 */
export function useTerminParser(dispatch: React.Dispatch<ZwcAction>) {
  const parse = useCallback((rawText: string) => {
    const { termine: parsed, errors } = parseTerminLines(rawText);

    const termine: ParsedTermin[] = parsed.map((p, idx) => ({
      id: `termin-${Date.now()}-${idx}`,
      rawLine: `${p.customerName} ${p.datum} ${p.uhrzeit}`,
      customerName: p.customerName,
      datum: p.datum,
      uhrzeit: p.uhrzeit,
      status: 'parsed' as const,
      matchCandidates: [],
      selectedInstallationId: null,
      selectedCustomerName: null,
    }));

    dispatch({ type: 'PARSE_RESULT', payload: { termine, errors } });
  }, [dispatch]);

  return { parse };
}
