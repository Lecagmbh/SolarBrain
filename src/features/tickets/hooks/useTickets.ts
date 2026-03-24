import { useState, useEffect, useCallback } from "react";
import type { FieldTicket } from "../constants";
import type { TicketListParams, PaginatedTickets } from "../services/ticketApi";
import * as ticketApi from "../services/ticketApi";

export function useTickets(initialParams?: TicketListParams) {
  const [tickets, setTickets] = useState<FieldTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<TicketListParams>(initialParams || {});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ticketApi.fetchTickets(params);
      setTickets(res.data);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error("Tickets laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(() => load(), [load]);

  return { tickets, total, loading, params, setParams, refresh };
}

export function useMyTickets() {
  const [tickets, setTickets] = useState<FieldTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTickets(await ticketApi.fetchMyTickets());
    } catch (err) {
      console.error("Meine Tickets laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { tickets, loading, refresh: load };
}

export function useInstallationTickets(installationId: number | undefined) {
  const [tickets, setTickets] = useState<FieldTicket[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!installationId) return;
    setLoading(true);
    try {
      setTickets(await ticketApi.fetchInstallationTickets(installationId));
    } catch (err) {
      console.error("Installation Tickets laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => { load(); }, [load]);
  return { tickets, loading, refresh: load };
}
