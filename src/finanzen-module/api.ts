// ============================================
// FINANZEN MODULE - API
// ============================================

import { apiGet, apiPost } from "../api/client";
import { getAuthToken } from "../config/storage";
import type { Invoice, InvoiceDetail, ListResponse } from "./types";

// ============================================
// INVOICE API
// ============================================

export const fetchInvoices = async (
  page = 1,
  limit = 100
): Promise<ListResponse> => {
  return apiGet<ListResponse>(`/api/rechnungen?page=${page}&limit=${limit}`);
};

export const fetchInvoiceDetail = async (id: number): Promise<InvoiceDetail> => {
  return apiGet<InvoiceDetail>(`/api/rechnungen/${id}`);
};

export const createInvoice = async (
  data: Partial<Invoice>
): Promise<Invoice> => {
  return apiPost<Invoice>(`/api/rechnungen`, data);
};

export const markInvoicePaid = async (id: number): Promise<Invoice> => {
  return apiPost<Invoice>(`/api/rechnungen/${id}/mark-paid`, {});
};

export const finalizeInvoice = async (id: number): Promise<Invoice> => {
  return apiPost<Invoice>(`/api/rechnungen/${id}/finalize`, {});
};

export const sendInvoice = async (id: number): Promise<void> => {
  await apiPost(`/api/rechnungen/${id}/send`, {});
};

export const getInvoicePdfUrl = (id: number): string | null => {
  const token = getAuthToken();
  if (!token) return null;
  return `/api/rechnungen/${id}/pdf?token=${encodeURIComponent(token)}`;
};

// ============================================
// BULK OPERATIONS
// ============================================

export const bulkMarkPaid = async (ids: number[]): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;
  
  for (const id of ids) {
    try {
      await markInvoicePaid(id);
      success++;
    } catch {
      failed++;
    }
  }
  
  return { success, failed };
};

// ============================================
// CUSTOMERS (for invoice creation)
// ============================================

export const fetchCustomers = async (): Promise<Array<{ id: number; firma?: string; name?: string; email?: string }>> => {
  const response = await apiGet<{ data: Array<{ id: number; firma?: string; name?: string; email?: string }> }>(`/api/kunden?limit=500`);
  return response.data || [];
};
