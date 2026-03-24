// Hook für HV-Vertragsstatus

import { useState, useEffect, useCallback } from "react";
import { fetchCurrentContract, type ContractCurrentResponse } from "../api/hv-contract.api";

export function useHvContract() {
  const [data, setData] = useState<ContractCurrentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchCurrentContract();
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Laden des Vertragsstatus";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    contract: data?.template || null,
    acceptance: data?.acceptance || null,
    needsAcceptance: data?.needsAcceptance ?? false,
    hvProfil: data?.hvProfil || null,
    loading,
    error,
    refetch: fetch,
  };
}
