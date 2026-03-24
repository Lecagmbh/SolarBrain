import { api } from "../../../modules/api/client";
import type { FieldTicket, FieldTicketReply, TicketStats } from "../constants";

export interface TicketListParams {
  status?: string;
  context?: string;
  priority?: string;
  assignedTo?: number;
  installationId?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedTickets {
  data: FieldTicket[];
  pagination: { total: number; page: number; limit: number };
}

export async function fetchTickets(params: TicketListParams): Promise<PaginatedTickets> {
  const { data } = await api.get("/tickets", { params });
  return data;
}

export async function fetchTicketStats(): Promise<TicketStats> {
  const { data } = await api.get("/tickets/stats");
  return data;
}

export async function fetchMyTickets(): Promise<FieldTicket[]> {
  const { data } = await api.get("/tickets/my");
  return data;
}

export async function fetchTicket(id: number): Promise<FieldTicket> {
  const { data } = await api.get(`/tickets/${id}`);
  return data;
}

export async function createTicket(payload: {
  installationId: number;
  context: string;
  contextRef?: string;
  fieldId?: string;
  title: string;
  message: string;
  priority?: string;
  assignedToId?: number;
  assignedToName?: string;
  dueDate?: string;
}): Promise<FieldTicket> {
  const { data } = await api.post("/tickets", payload);
  return data;
}

export async function updateTicket(id: number, payload: {
  status?: string;
  priority?: string;
  assignedToId?: number | null;
  assignedToName?: string | null;
  dueDate?: string | null;
  title?: string;
  message?: string;
}): Promise<FieldTicket> {
  const { data } = await api.put(`/tickets/${id}`, payload);
  return data;
}

export async function deleteTicket(id: number): Promise<void> {
  await api.delete(`/tickets/${id}`);
}

export async function addReply(ticketId: number, message: string): Promise<FieldTicketReply> {
  const { data } = await api.post(`/tickets/${ticketId}/replies`, { message });
  return data;
}

export async function fetchInstallationTickets(installationId: number): Promise<FieldTicket[]> {
  const { data } = await api.get(`/tickets/installation/${installationId}`);
  return data;
}

export async function fetchInstallationTicketCounts(installationId: number): Promise<{ total: number; byContext: Record<string, number> }> {
  const { data } = await api.get(`/tickets/installation/${installationId}/counts`);
  return data;
}
