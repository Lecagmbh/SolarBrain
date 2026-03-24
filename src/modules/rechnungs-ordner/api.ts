// src/modules/rechnungs-ordner/api.ts
import { apiGet } from "../api/client";
import { fetchAbrechnungOverview } from "../rechnungen/api";
import type { AbrechnungOverviewResp, RechnungListRow } from "../rechnungen/types";
import {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  getDownloadUrl,
  type DocumentListItem,
} from "../../services/documents.service";

export type { AbrechnungOverviewResp, DocumentListItem };
export { deleteDocument, getDownloadUrl };

/** Load customer folders with installation billing status */
export async function loadCustomerFolders(): Promise<AbrechnungOverviewResp> {
  return fetchAbrechnungOverview();
}

/** Fetch system-generated invoices for a specific installation */
export async function fetchInvoicesForInstallation(
  anlageId: number
): Promise<RechnungListRow[]> {
  const qs = new URLSearchParams({
    anlageId: String(anlageId),
    page: "1",
    limit: "200",
  });
  const resp: { data: RechnungListRow[] } = await apiGet(
    `/rechnungen?${qs.toString()}`
  );
  return resp.data;
}

/** Fetch uploaded invoice PDFs for an installation */
export async function fetchUploadedInvoices(
  installationId: number
): Promise<DocumentListItem[]> {
  const resp = await fetchDocuments({
    installationId,
    kategorie: "RECHNUNG",
    limit: 200,
  });
  return resp.data;
}

/** Load all invoices (system + uploaded) for an installation */
export async function loadInvoicesForInstallation(installationId: number, anlageId?: number) {
  const [systemInvoices, uploadedInvoices] = await Promise.all([
    anlageId ? fetchInvoicesForInstallation(anlageId) : Promise.resolve([]),
    fetchUploadedInvoices(installationId),
  ]);
  return { systemInvoices, uploadedInvoices };
}

/** Upload a PDF as invoice document for an installation */
export async function uploadInvoicePdf(installationId: number, file: File) {
  return uploadDocument(file, {
    installationId,
    kategorie: "RECHNUNG",
    dokumentTyp: "RECHNUNG_UPLOAD",
  });
}
