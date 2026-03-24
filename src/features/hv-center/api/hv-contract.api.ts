// API Client für HV-Vertragssystem

import { api } from "../../../modules/api/client";

export interface ContractTemplate {
  id: number;
  version: string;
  title: string;
  description: string | null;
  pdfHash: string;
  clauses: Array<{ id: string; title: string; text: string; required: boolean }>;
  requiredCheckboxes: Array<{ id: string; label: string; legalRef?: string }>;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ContractAcceptance {
  id: number;
  acceptedAt: string;
  contractVersionAtAcceptance: string;
}

export interface HvProfilData {
  name: string | null;
  email: string;
  firmenName: string | null;
  provisionssatz: number;
  steuerNr: string | null;
  ustIdNr: string | null;
  iban: string | null;
  bankName: string | null;
}

export interface ContractCurrentResponse {
  template: ContractTemplate | null;
  acceptance: ContractAcceptance | null;
  needsAcceptance: boolean;
  hvProfil: HvProfilData | null;
}

export async function fetchCurrentContract(): Promise<ContractCurrentResponse> {
  const res = await api.get("/hv/contract/current");
  return res.data.data;
}

export function getContractPdfUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : "/api";
  return `${base}/hv/contract/pdf`;
}

export interface AcceptContractPayload {
  templateId: number;
  checkboxes: Array<{ id: string; label: string; checked: boolean; timestamp: string }>;
  signatureData?: string;
  metadata?: Record<string, unknown>;
}

export async function acceptContract(payload: AcceptContractPayload) {
  const res = await api.post("/hv/contract/accept", payload);
  return res.data;
}

export async function logContractAudit(action: string, templateId: number, details?: Record<string, unknown>) {
  await api.post("/hv/contract/audit", { action, templateId, details }).catch(() => {
    // Silent fail for audit events
  });
}

export async function fetchContractHistory() {
  const res = await api.get("/hv/contract/history");
  return res.data.data;
}
