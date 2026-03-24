// src/services/rechnungen.service.ts
import { api } from "../modules/api/client";

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------

export interface RechnungFilter {
  kundeId?: number;
  anlageId?: number;
  status?: string;
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

export interface RechnungListItem {
  id: number;
  rechnungsnummer: string;
  kunde_id: number;
  kunde_name: string;
  kunde_nummer?: string;
  anlage_id?: number;
  anlage_bezeichnung?: string;
  beschreibung?: string;
  betrag_netto: number;
  mwst_satz: number;
  betrag_mwst: number;
  betrag_brutto: number;
  status: string;
  status_label: string;
  rechnungs_datum: string;
  faellig_am: string;
  bezahlt_am?: string;
  erstellt_am: string;
}

export interface RechnungPosition {
  bezeichnung: string;
  menge: number;
  einzelpreis: number;
  gesamt: number;
}

export interface RechnungDetail extends RechnungListItem {
  positionen: RechnungPosition[];
  zahlungsart?: string;
  zahlungsreferenz?: string;
  kunde: {
    id: number;
    name: string;
    kundenNummer?: string;
    firmenName?: string;
    adresse?: string;
  };
  anlage?: {
    id: number;
    bezeichnung?: string;
  };
  createdBy?: {
    id: number;
    name?: string;
    email: string;
  };
  aktualisiert_am: string;
}

export interface RechnungCreateInput {
  kundeId: number;
  anlageId?: number;
  beschreibung?: string;
  positionen?: RechnungPosition[];
  betragNetto: number;
  mwstSatz?: number;
  rechnungsDatum?: string;
  faelligAm?: string;
  zahlungsart?: string;
}

export interface RechnungUpdateInput {
  zahlungsreferenz?: string;
  bezahltAm?: string;
}

// ------------------------------------------------------
// API SERVICE
// ------------------------------------------------------

// Liste mit Filtern
export async function listRechnungen(
  params: RechnungFilter = {}
): Promise<PaginatedResponse<RechnungListItem>> {
  const res = await api.get("/rechnungen", { params });
  return res.data;
}

// Zusammenfassung
export async function getRechnungenSummary() {
  const res = await api.get("/rechnungen/summary");
  return res.data;
}

// Details
export async function getRechnung(id: number): Promise<RechnungDetail> {
  const res = await api.get(`/rechnungen/${id}`);
  return res.data;
}

// Neue Rechnung erstellen
export async function createRechnung(
  data: RechnungCreateInput
): Promise<{ success: boolean; id: number; rechnungsnummer: string }> {
  const res = await api.post("/rechnungen", data);
  return res.data;
}

// Rechnung aktualisieren
export async function updateRechnung(
  id: number,
  data: Partial<RechnungCreateInput>
): Promise<{ success: boolean; id: number; status?: string }> {
  const res = await api.put(`/rechnungen/${id}`, data);
  return res.data;
}

// Rechnung versenden
export async function sendRechnung(id: number) {
  const res = await api.post(`/rechnungen/${id}/send`);
  return res.data;
}

// Rechnung als bezahlt markieren
export async function markRechnungPaid(
  id: number,
  data: RechnungUpdateInput = {}
): Promise<{ success: boolean; id: number }> {
  const res = await api.post(`/rechnungen/${id}/mark-paid`, data);
  return res.data;
}

// Rechnung stornieren
export async function cancelRechnung(id: number) {
  const res = await api.post(`/rechnungen/${id}/cancel`);
  return res.data;
}

// Rechnung löschen
export async function deleteRechnung(id: number) {
  const res = await api.delete(`/rechnungen/${id}`);
  return res.data;
}

export default {
  listRechnungen,
  getRechnungenSummary,
  getRechnung,
  createRechnung,
  updateRechnung,
  sendRechnung,
  markRechnungPaid,
  cancelRechnung,
  deleteRechnung,
};
