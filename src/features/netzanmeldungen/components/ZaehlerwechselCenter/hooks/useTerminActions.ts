import { useCallback, useRef } from 'react';
import { installationsApi } from '../../../services/api';
import type { ParsedTermin, ZwcAction } from '../types';

/**
 * Hook for sequential API calls with progress tracking.
 * Sends Zählerwechsel notifications one by one with a 300ms pause.
 */
export function useTerminActions(dispatch: React.Dispatch<ZwcAction>) {
  const abortRef = useRef(false);

  const processAll = useCallback(async (termine: ParsedTermin[]) => {
    abortRef.current = false;
    const confirmed = termine.filter(t => t.status === 'confirmed');
    if (confirmed.length === 0) return;

    dispatch({ type: 'START_PROCESSING' });

    for (let i = 0; i < confirmed.length; i++) {
      if (abortRef.current) break;

      const termin = confirmed[i];
      dispatch({ type: 'SET_PROCESSING_INDEX', payload: i });

      try {
        const result = await installationsApi.scheduleZaehlerwechsel(
          termin.selectedInstallationId!,
          {
            datum: termin.datum,
            uhrzeit: termin.uhrzeit,
            kommentar: termin.kommentar,
          }
        );

        dispatch({
          type: 'TERMIN_NOTIFIED',
          payload: {
            terminId: termin.id,
            email: result.notificationsSent?.errichterEmail || result.notificationsSent?.endkundeEmail || false,
            whatsapp: result.notificationsSent?.endkundeWhatsapp ?? false,
          },
        });
      } catch (err: any) {
        dispatch({
          type: 'TERMIN_ERROR',
          payload: {
            terminId: termin.id,
            error: err.message || 'Unbekannter Fehler',
          },
        });
      }

      // Pause between calls to avoid overwhelming the API
      if (i < confirmed.length - 1 && !abortRef.current) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    dispatch({ type: 'PROCESSING_DONE' });
  }, [dispatch]);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { processAll, abort };
}
