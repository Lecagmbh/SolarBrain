import { useEffect, useState } from "react";
import type { KundeListRow } from "./types";
import { searchKunden } from "./api";

export function useKundenSearch(query: string) {
  const [results, setResults] = useState<KundeListRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const r = await searchKunden(q);
        setResults(r.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 240);

    return () => window.clearTimeout(t);
  }, [query]);

  return { results, loading };
}
