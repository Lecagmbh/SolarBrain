// src/services/kunden.service.ts
import { api } from "../modules/api/client";
import type { Kunde } from "../api/types";

export interface KundenListParams {
  search?: string;
  aktiv?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface KundeListItem {
  id: number;
  name: string;
  kundenNummer?: string;
  firmenName?: string;
  email?: string;
  telefon?: string;
  adresse?: string;
  aktiv: boolean;
  anlagenCount: number;
  installationsCount: number;
  usersCount: number;
  handelsvertreterId?: number | null;
  handelsvertreterName?: string | null;
  createdAt: string;
}

export interface KundeDetail extends Kunde {
  kundenNummer?: string;
  firmenName?: string;
  ustIdNr?: string;
  email?: string;
  telefon?: string;
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  land?: string;
  aktiv: boolean;
  users?: Array<{ id: number; email: string; name?: string; role: string }>;
  anlagen?: Array<{ id: number; bezeichnung?: string; status: string }>;
  installations?: Array<{ id: number; publicId: string; status: string }>;
  rechnungen?: Array<{ id: number; rechnungsNummer: string; status: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKundeData {
  name: string;
  firmenName?: string;
  ustIdNr?: string;
  email?: string;
  telefon?: string;
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  land?: string;
}

// Kunden auflisten
export async function fetchKunden(
  params: KundenListParams = {}
): Promise<PaginatedResponse<KundeListItem>> {
  const response = await api.get("/kunden", { params });
  return response.data;
}

// Einzelnen Kunden laden
export async function fetchKundeById(id: number): Promise<KundeDetail> {
  const response = await api.get(`/kunden/${id}`);
  return response.data;
}

// Neuen Kunden erstellen
export async function createKunde(
  data: CreateKundeData
): Promise<{ success: boolean; id: number; kundenNummer: string }> {
  const response = await api.post("/kunden", data);
  return response.data;
}

// Kunden aktualisieren
export async function updateKunde(
  id: number,
  data: Partial<CreateKundeData & { aktiv?: boolean; handelsvertreterId?: number | null }>
): Promise<{ success: boolean; id: number }> {
  const response = await api.put(`/kunden/${id}`, data);
  return response.data;
}

// Alle Handelsvertreter laden (für Dropdown)
export async function fetchHandelsvertreter(): Promise<
  Array<{ id: number; userName: string; firmenName?: string; aktiv: boolean }>
> {
  const response = await api.get("/admin/hv");
  const raw = response.data.data || response.data;
  return raw.map((hv: Record<string, unknown>) => ({
    id: hv.id,
    userName: (hv as { user?: { name?: string } }).user?.name || String(hv.firmenName || `HV #${hv.id}`),
    firmenName: hv.firmenName ? String(hv.firmenName) : undefined,
    aktiv: Boolean(hv.aktiv),
  }));
}

// Kunden löschen
export async function deleteKunde(id: number): Promise<{ success: boolean }> {
  const response = await api.delete(`/kunden/${id}`);
  return response.data;
}

export default {
  fetchKunden,
  fetchKundeById,
  createKunde,
  updateKunde,
  deleteKunde
};
