import { apiGet, apiPost, apiPatch } from "./client";
import { getAuthToken } from "../config/storage";
import type { Rechnung, StatusCode, User } from "./types";

/**
 * Status einer Anlage aktualisieren (Admin-Endpunkt)
 */
export function updateAnlageStatus(
  anlageId: number,
  statusCode: StatusCode,
  kommentar?: string | null
): Promise<{ ok: boolean; status: string; status_code: StatusCode }> {
  return apiPatch(`/api/admin/anlagen/${anlageId}/status`, {
    status_code: statusCode,
    kommentar: kommentar ?? null,
  });
}

/**
 * Rechnungen zu einer Anlage laden
 */
export function fetchRechnungenForAnlage(
  anlageId: number
): Promise<Rechnung[]> {
  return apiGet<Rechnung[]>(`/api/admin/anlagen/${anlageId}/rechnungen`);
}

/**
 * Neue Rechnung zu einer Anlage anlegen
 */
export function createRechnungForAnlage(
  anlageId: number,
  payload: {
    betragBrutto: number;
    faelligAm: string; // ISO-Date (YYYY-MM-DD)
    typ: string;
    notiz?: string;
  }
): Promise<Rechnung> {
  return apiPost<Rechnung>(
    `/api/admin/anlagen/${anlageId}/rechnungen`,
    payload
  );
}

/**
 * URL zum Rechnungs-PDF erzeugen
 * (wird z.B. in <a href={...}> benutzt)
 */
export function downloadRechnungPdf(
  anlageId: number,
  rechnungId: number
): string | null {
  const token = getAuthToken();
  if (!token) return null;
  return `/api/admin/anlagen/${anlageId}/rechnungen/${rechnungId}/pdf?token=${encodeURIComponent(token)}`;
}

/**
 * Benutzerliste laden
 */
export function fetchUsers(): Promise<User[]> {
  return apiGet<User[]>("/api/admin/users/");
}

/**
 * Benutzer aktiv/inaktiv schalten
 */
export function toggleUser(userId: string, active: boolean): Promise<User> {
  return apiPatch<User>(`/api/admin/users/${userId}`, { active });
}

/**
 * Benutzer anlegen
 * (erweitert um deine Billing-Felder – Backend muss die ggf. noch verarbeiten)
 */
export function createUser(data: {
  email: string;
  name: string;
  role: User["role"];
  kunde_ref?: string;
  password?: string;

  billing_company?: string;
  billing_street?: string;
  billing_postcode?: string;
  billing_city?: string;
  billing_country?: string;
  billing_vat_id?: string;
  billing_email?: string;
}): Promise<User> {
  return apiPost<User>("/api/admin/users/", data);
}
