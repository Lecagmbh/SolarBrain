// src/services/anlagen.service.ts
import { api } from "../modules/api/client";
import type { AnlageListItem, AnlageDetail } from "../api/types";

export interface AnlagenListParams {
  status?: string;
  kundeId?: number;
  search?: string;
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

export interface CreateAnlageData {
  bezeichnung?: string;
  kundeId?: number;
  betreiberName?: string;
  betreiberTyp?: string;
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  netzbetreiberId?: number;
  zaehlpunktNummer?: string;
  leistungKwp?: number;
  messkonzept?: string;
  inbetriebnahme?: string;
  technik?: {
    module?: Array<{ hersteller?: string; modell?: string; leistungWp?: number; anzahl?: number }>;
    wechselrichter?: Array<{ hersteller?: string; modell?: string; leistungKw?: number; anzahl?: number; hybrid?: boolean }>;
    speicher?: Array<{ hersteller?: string; modell?: string; kapazitaetKwh?: number; leistungKw?: number }>;
  };
}

// Anlagen auflisten
export async function fetchAnlagen(
  params: AnlagenListParams = {}
): Promise<PaginatedResponse<AnlageListItem>> {
  const response = await api.get("/anlagen", { params });
  return response.data;
}

// Einzelne Anlage laden
export async function fetchAnlageById(id: number): Promise<AnlageDetail> {
  const response = await api.get(`/anlagen/${id}`);
  return response.data;
}

// Neue Anlage erstellen
export async function createAnlage(
  data: CreateAnlageData
): Promise<{ success: boolean; id: number }> {
  const response = await api.post("/anlagen", data);
  return response.data;
}

// Anlage aktualisieren
export async function updateAnlage(
  id: number,
  data: Partial<CreateAnlageData>
): Promise<{ success: boolean; id: number }> {
  const response = await api.put(`/anlagen/${id}`, data);
  return response.data;
}

// Anlage löschen
export async function deleteAnlage(id: number): Promise<{ success: boolean }> {
  const response = await api.delete(`/anlagen/${id}`);
  return response.data;
}

export default {
  fetchAnlagen,
  fetchAnlageById,
  createAnlage,
  updateAnlage,
  deleteAnlage
};
