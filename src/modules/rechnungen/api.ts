import { apiGet, apiPost } from "../api/client";
import type { CompanySettings, KundeDetail, KundeListRow, AnlageRow, PricesResp, ListResp, RechnungDetail, UnbilledResp, BillingOverview, AbrechnungOverviewResp } from "./types";

export async function fetchInvoices(page: number, limit: number, hasProvision?: boolean): Promise<ListResp> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (hasProvision) qs.set("hasProvision", "true");
  return apiGet(`/rechnungen?${qs.toString()}`);
}

export async function fetchInvoiceDetail(id: number): Promise<RechnungDetail> {
  return apiGet(`/rechnungen/${id}`);
}

export async function searchKunden(q: string): Promise<{ data: KundeListRow[] }> {
  const qs = new URLSearchParams({ search: q, limit: "10" });
  return apiGet(`/kunden?${qs.toString()}`);
}

export async function fetchKundeDetail(id: number): Promise<KundeDetail> {
  return apiGet(`/kunden/${id}`);
}

export async function fetchAnlagenForKunde(kundeId: number): Promise<{ data: AnlageRow[] }> {
  const qs = new URLSearchParams({ kundeId: String(kundeId), limit: "200" });
  return apiGet(`/anlagen?${qs.toString()}`);
}

export async function fetchKundePrices(kundeId: number): Promise<PricesResp> {
  return apiGet(`/admin/kunden/${kundeId}/prices`);
}

export async function fetchCompanySettings(): Promise<{ data: CompanySettings | null }> {
  return apiGet(`/settings/company`);
}

export async function createInvoiceDraft(payload: Record<string, unknown>): Promise<RechnungDetail> {
  return apiPost(`/rechnungen`, payload);
}

export async function finalizeInvoice(id: number): Promise<RechnungDetail> {
  return apiPost(`/rechnungen/${id}/finalize`, {});
}

export async function markPaid(id: number): Promise<RechnungDetail> {
  return apiPost(`/rechnungen/${id}/mark-paid`, { zahlungsreferenz: "" });
}

export async function setInvoiceStatus(id: number, status: string): Promise<{ success: boolean; data: { id: number; rechnungsNummer: string; status: string } }> {
  return apiPost(`/rechnungen/${id}/set-status`, { status });
}

export async function fetchInstallationsForKunde(kundeId: number): Promise<{ data: Array<{ id: number; publicId?: string; customerName?: string; strasse?: string; plz?: string; ort?: string }> }> {
  const qs = new URLSearchParams({ kundeId: String(kundeId) });
  return apiGet(`/installations?${qs.toString()}`);
}

// Sammelrechnung API
export async function createSammelrechnung(rechnungIds: number[]): Promise<Record<string, unknown>> {
  return apiPost(`/rechnungen/sammelrechnung`, { rechnungIds });
}

// Unbilled Installations
export async function fetchUnbilledInstallations(): Promise<UnbilledResp> {
  return apiGet(`/rechnungen/unbilled-installations`);
}

// Billing Overview KPIs
export async function fetchBillingOverview(): Promise<BillingOverview> {
  return apiGet(`/rechnungen/billing-overview`);
}

// WhatsApp / Email Versand
export async function sendWhatsApp(id: number, opts?: { phone?: string; email?: string }): Promise<{ success: boolean; results: Record<string, boolean> }> {
  return apiPost(`/rechnungen/${id}/send-whatsapp`, opts || {});
}

// Abrechnungsübersicht
export async function fetchAbrechnungOverview(params?: { kundeId?: number; onlyUnbilled?: boolean }): Promise<AbrechnungOverviewResp> {
  const q = new URLSearchParams();
  if (params?.kundeId) q.set("kundeId", String(params.kundeId));
  if (params?.onlyUnbilled) q.set("onlyUnbilled", "true");
  const qs = q.toString();
  return apiGet(`/rechnungen/abrechnung-overview${qs ? `?${qs}` : ""}`);
}
