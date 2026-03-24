import { api } from "../../../modules/api/client";

export interface VdeFormInfo {
  id: string;
  name: string;
  norm: string;
  formType: string;
  pages: number;
  fieldCount: number;
  sections: { id: string; label: string }[];
}

export interface VdeFormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  section: string;
  value: any;
  filled: boolean;
  vdeRef?: string;
  unit?: string;
  options?: { value: string; label: string }[];
  hint?: string;
  defaultValue?: string | number | boolean;
}

export interface VdeFormData {
  formId: string;
  installationId: number;
  fields: VdeFormField[];
  completeness: { total: number; filled: number; required: number; requiredFilled: number; percent: number };
  missingRequired: VdeFormField[];
}

export interface VdeFormStatus {
  formId: string;
  name: string;
  norm: string;
  completeness: { total: number; filled: number; required: number; requiredFilled: number; percent: number };
  missingRequiredCount: number;
}

export interface VdeValidationResult {
  formId: string;
  installationId: number;
  completeness: VdeFormData["completeness"];
  missingRequired: { id: string; label: string; vdeRef?: string; section: string }[];
  ticketsCreated: number;
}

export async function fetchForms(): Promise<{ forms: VdeFormInfo[]; groups: Record<string, string[]> }> {
  const { data } = await api.get("/vde-center/forms");
  return data;
}

export async function fetchFormDef(formId: string) {
  const { data } = await api.get(`/vde-center/forms/${formId}`);
  return data;
}

export async function fetchFormData(formId: string, installationId: number): Promise<VdeFormData> {
  const { data } = await api.get(`/vde-center/forms/${formId}/installation/${installationId}`);
  return data;
}

export async function validateForm(formId: string, installationId: number, createAutoTickets = false): Promise<VdeValidationResult> {
  const { data } = await api.post(`/vde-center/forms/${formId}/validate/${installationId}`, { createAutoTickets });
  return data;
}

export async function fetchInstallationFormStatus(installationId: number): Promise<VdeFormStatus[]> {
  const { data } = await api.get(`/vde-center/status/${installationId}`);
  return data;
}

export async function fetchSignatures() {
  const { data } = await api.get("/vde-center/signatures");
  return data;
}

export async function createSignature(payload: {
  signatureType: string; name: string; betrieb?: string;
  eintragNr?: string; signatureImage: string; signatureMime: string; isDefault?: boolean;
}) {
  const { data } = await api.post("/vde-center/signatures", payload);
  return data;
}

export async function deleteSignature(id: number) {
  const { data } = await api.delete(`/vde-center/signatures/${id}`);
  return data;
}

// PDF generation
export async function generatePdfs(installationId: number, norm?: string, forms?: string[]) {
  const { data } = await api.post(`/vde-center/generate/${installationId}`, { norm, forms }, { responseType: "json" });
  return data;
}

export function getPreviewUrl(installationId: number, formType: string): string {
  return `/api/vde-center/preview/${installationId}/${formType}`;
}

// Email sending
export async function sendVdeEmail(installationId: number, payload: {
  to: string; subject?: string; message?: string; norm?: string; forms?: string[];
}) {
  const { data } = await api.post(`/vde-center/send/${installationId}`, payload);
  return data;
}
