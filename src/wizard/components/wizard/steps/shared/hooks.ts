/**
 * Wizard Steps - Shared Hooks
 */

import { useCallback } from 'react';
import { useStepValidation } from '../../../../hooks/useValidation';

/**
 * Hook zum Abrufen von Feld-Fehlern aus der Validierung
 */
export const useFieldErrors = (step: number) => {
  const validation = useStepValidation(step);

  const getError = useCallback((fieldKey: string): string | undefined => {
    const error = validation.errors.find(
      e => e.field === fieldKey || e.field.startsWith(fieldKey)
    );
    return error?.message;
  }, [validation.errors]);

  return {
    getError,
    touched: validation.errors.length > 0,
    errors: validation.errors,
  };
};
