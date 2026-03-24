import { useState, useEffect, useCallback } from "react";
import type { TicketStats } from "../constants";
import { fetchTicketStats } from "../services/ticketApi";

export function useTicketStats() {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await fetchTicketStats());
    } catch (err) {
      console.error("Ticket stats laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { stats, loading, refresh: load };
}
