/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ACCOUNTING API CLIENT
 * API-Funktionen für Buchhaltung, Expenses, Reports, KI-Features
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Account {
  id: number;
  code: string;
  name: string;
  nameDE?: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  category: string;
  currency: string;
  isActive: boolean;
  parentId?: number;
  balance?: number;
}

export interface JournalEntry {
  id: number;
  date: string;
  reference?: string;
  description: string;
  currency: string;
  exchangeRate?: number;
  isPosted: boolean;
  isAdjusting: boolean;
  rechnungId?: number;
  expenseId?: number;
  wiseTransactionId?: number;
  lines: JournalEntryLine[];
  createdAt: string;
}

export interface JournalEntryLine {
  id: number;
  accountId: number;
  account?: Account;
  debit: number;
  credit: number;
  originalAmount?: number;
  originalCurrency?: string;
  memo?: string;
}

export interface Expense {
  id: number;
  vendorId?: number;
  vendor?: Vendor;
  invoiceNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  description: string;
  category: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: "UNPAID" | "PAID" | "VOID";
  paidAt?: string;
  paidVia?: string;
  documentPath?: string;
  documentName?: string;
  isIntercompany: boolean;
  relatedEntityId?: number;
  relatedEntity?: LegalEntity;
  createdAt: string;
}

export interface Vendor {
  id: number;
  name: string;
  email?: string;
  taxId?: string;
  country?: string;
  address?: string;
  isIntercompany: boolean;
  defaultCategory?: string;
}

export interface LegalEntity {
  id: number;
  name: string;
  shortName: string;
  country: string;
  taxId?: string;
  currency: string;
  isActive: boolean;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  accountCode: string;
  isActive: boolean;
}

export interface IncomeStatement {
  period: { startDate: string; endDate: string };
  revenue: {
    title: string;
    accounts: Array<{ code: string; name: string; amount: number }>;
    total: number;
  };
  expenses: {
    title: string;
    accounts: Array<{ code: string; name: string; amount: number }>;
    total: number;
  };
  grossProfit: number;
  netIncome: number;
}

export interface BalanceSheet {
  asOf: string;
  assets: {
    current: {
      title: string;
      accounts: Array<{ code: string; name: string; amount: number }>;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      title: string;
      accounts: Array<{ code: string; name: string; amount: number }>;
      total: number;
    };
    total: number;
  };
  equity: {
    title: string;
    accounts: Array<{ code: string; name: string; amount: number }>;
    total: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface DashboardSummary {
  ytd: { revenue: number; expenses: number; netIncome: number };
  mtd: { revenue: number; expenses: number; netIncome: number };
  accountsReceivable: { total: number; count: number };
  accountsPayable: { total: number; count: number };
  cash: Record<string, number>;
}

export interface TrialBalance {
  accounts: Array<{
    code: string;
    name: string;
    type: string;
    debit: number;
    credit: number;
  }>;
  totals: { debit: number; credit: number };
  isBalanced: boolean;
}

export interface MatchSuggestion {
  type: "invoice" | "expense";
  id: number;
  reference: string;
  amount: number;
  date: string;
  description: string;
  confidence: number;
  matchReasons: string[];
}

export interface AIInsights {
  period: { year: number; month: number };
  summary: string;
  revenue: { total: number; change: number };
  expenses: { total: number; change: number };
  profit: { total: number; margin: number };
  highlights: string[];
  warnings: string[];
  recommendations: string[];
}

export interface Anomaly {
  id: number;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  title: string;
  description: string;
  detectedAt: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolution?: string;
}

export interface ExtractedInvoiceData {
  vendorName: string | null;
  vendorAddress: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  taxRate: number | null;
  totalAmount: number | null;
  currency: string;
  lineItems: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    amount: number;
  }>;
  suggestedCategory: string;
  categoryConfidence: number;
  rawText: string;
  extractionConfidence: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNTS API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAccounts(params?: {
  type?: string;
  withBalance?: boolean;
}): Promise<Account[]> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);
  if (params?.withBalance) searchParams.set("withBalance", "true");
  const query = searchParams.toString();
  const res = await apiGet<{ data: Account[] }>(
    `/api/accounting/accounts${query ? `?${query}` : ""}`
  );
  return res.data;
}

export async function getAccountLedger(
  accountId: number,
  startDate?: string,
  endDate?: string
): Promise<any> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const query = params.toString();
  const res = await apiGet<{ data: any }>(
    `/api/accounting/accounts/${accountId}/ledger${query ? `?${query}` : ""}`
  );
  return res.data;
}

export async function getTrialBalance(
  startDate?: string,
  endDate?: string
): Promise<TrialBalance> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const query = params.toString();
  const res = await apiGet<{ data: TrialBalance }>(
    `/api/accounting/accounts/trial-balance${query ? `?${query}` : ""}`
  );
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// JOURNAL API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getJournalEntries(params?: {
  startDate?: string;
  endDate?: string;
  accountId?: number;
  isPosted?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ entries: JournalEntry[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.accountId) searchParams.set("accountId", String(params.accountId));
  if (params?.isPosted !== undefined) searchParams.set("isPosted", String(params.isPosted));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  const query = searchParams.toString();
  const res = await apiGet<{ data: JournalEntry[]; pagination: { total: number } }>(
    `/api/accounting/journal${query ? `?${query}` : ""}`
  );
  return { entries: res.data || [], total: res.pagination?.total || 0 };
}

export async function createJournalEntry(data: {
  date: string;
  description: string;
  reference?: string;
  currency?: string;
  lines: Array<{ accountId: number; debit: number; credit: number; memo?: string }>;
}): Promise<JournalEntry> {
  const res = await apiPost<{ data: JournalEntry }>("/api/accounting/journal", data);
  return res.data;
}

export async function postJournalEntry(id: number): Promise<JournalEntry> {
  const res = await apiPost<{ data: JournalEntry }>(`/api/accounting/journal/${id}/post`, {});
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSES API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getExpenses(params?: {
  status?: string;
  vendorId?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
  isIntercompany?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ expenses: Expense[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.vendorId) searchParams.set("vendorId", String(params.vendorId));
  if (params?.category) searchParams.set("category", params.category);
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.isIntercompany !== undefined) searchParams.set("isIntercompany", String(params.isIntercompany));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  const query = searchParams.toString();
  const res = await apiGet<{ data: Expense[]; pagination: { total: number } }>(
    `/api/accounting/expenses${query ? `?${query}` : ""}`
  );
  return { expenses: res.data || [], total: res.pagination?.total || 0 };
}

export async function createExpense(data: {
  vendorId?: number;
  invoiceNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  description: string;
  category: string;
  subtotal: number;
  taxAmount?: number;
  totalAmount: number;
  currency?: string;
  isIntercompany?: boolean;
  relatedEntityId?: number;
}): Promise<Expense> {
  const res = await apiPost<{ data: Expense }>("/api/accounting/expenses", data);
  return res.data;
}

export async function updateExpense(
  id: number,
  data: Partial<Omit<Expense, "id" | "createdAt">>
): Promise<Expense> {
  const res = await apiPatch<{ data: Expense }>(`/api/accounting/expenses/${id}`, data);
  return res.data;
}

export async function markExpensePaid(
  id: number,
  data: { paidAt?: string; paidVia?: string; wiseTransactionId?: number }
): Promise<Expense> {
  const res = await apiPost<{ data: Expense }>(`/api/accounting/expenses/${id}/pay`, data);
  return res.data;
}

export async function voidExpense(id: number): Promise<Expense> {
  const res = await apiPost<{ data: Expense }>(`/api/accounting/expenses/${id}/void`, {});
  return res.data;
}

export async function uploadExpenseDocument(id: number, file: File): Promise<Expense> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiPost<{ data: Expense }>(`/api/accounting/expenses/${id}/upload`, formData);
  return res.data;
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const res = await apiGet<{ data: ExpenseCategory[] }>("/api/accounting/expenses/categories");
  return res.data || [];
}

export async function getExpenseStats(
  startDate?: string,
  endDate?: string
): Promise<any> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const query = params.toString();
  const res = await apiGet<{ data: any }>(
    `/api/accounting/expenses/stats${query ? `?${query}` : ""}`
  );
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VENDORS API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getVendors(params?: {
  search?: string;
  isIntercompany?: boolean;
}): Promise<Vendor[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.isIntercompany !== undefined) searchParams.set("isIntercompany", String(params.isIntercompany));
  const query = searchParams.toString();
  const res = await apiGet<{ data: Vendor[] }>(
    `/api/accounting/vendors${query ? `?${query}` : ""}`
  );
  return res.data || [];
}

export async function createVendor(data: {
  name: string;
  email?: string;
  taxId?: string;
  country?: string;
  address?: string;
  defaultCategory?: string;
}): Promise<Vendor> {
  const res = await apiPost<{ data: Vendor }>("/api/accounting/vendors", data);
  return res.data;
}

export async function updateVendor(
  id: number,
  data: Partial<Omit<Vendor, "id">>
): Promise<Vendor> {
  const res = await apiPatch<{ data: Vendor }>(`/api/accounting/vendors/${id}`, data);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await apiGet<{ data: DashboardSummary }>("/api/accounting/reports/dashboard");
  return res.data;
}

export async function getIncomeStatement(
  startDate: string,
  endDate: string
): Promise<IncomeStatement> {
  const res = await apiGet<{ data: IncomeStatement }>(
    `/api/accounting/reports/income-statement?startDate=${startDate}&endDate=${endDate}`
  );
  return res.data;
}

export async function getBalanceSheet(asOf: string): Promise<BalanceSheet> {
  const res = await apiGet<{ data: BalanceSheet }>(
    `/api/accounting/reports/balance-sheet?asOf=${asOf}`
  );
  return res.data;
}

export async function getIntercompanyReport(year: number): Promise<any> {
  const res = await apiGet<{ data: any }>(
    `/api/accounting/reports/intercompany?year=${year}`
  );
  return res.data;
}

export async function getCashFlowStatement(
  startDate: string,
  endDate: string
): Promise<any> {
  const res = await apiGet<{ data: any }>(
    `/api/accounting/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`
  );
  return res.data;
}

export async function generateTaxPackage(year: number): Promise<Blob> {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`/api/accounting/year-end/tax-package/${year}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to generate tax package");
  return res.blob();
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI FEATURES API
// ═══════════════════════════════════════════════════════════════════════════════

export async function extractInvoiceData(file: File): Promise<{
  extracted: ExtractedInvoiceData;
  vendor: { vendorId: number | null; vendorName: string | null; isNew: boolean; defaultCategory: string | null };
  filePath: string;
  fileName: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiPost<{
    data: {
      extracted: ExtractedInvoiceData;
      vendor: any;
      filePath: string;
      fileName: string;
    };
  }>("/api/accounting/ai/extract-invoice", formData);
  return res.data;
}

export async function getMatchSuggestions(transactionId: number): Promise<{
  transaction: any;
  suggestions: MatchSuggestion[];
  bestMatch: MatchSuggestion | null;
}> {
  const res = await apiGet<{ data: any }>(
    `/api/accounting/ai/match-suggestions/${transactionId}`
  );
  return res.data;
}

export async function getUnmatchedWithSuggestions(limit?: number): Promise<any[]> {
  const res = await apiGet<{ data: any[] }>(
    `/api/accounting/ai/unmatched-with-suggestions${limit ? `?limit=${limit}` : ""}`
  );
  return res.data;
}

export async function runAutoMatching(minConfidence?: number): Promise<{
  matched: number;
  skipped: number;
  details: any[];
}> {
  const res = await apiPost<{ data: any }>("/api/accounting/ai/auto-match", {
    minConfidence: minConfidence || 90,
  });
  return res.data;
}

export async function getMatchingStats(): Promise<{
  total: number;
  matched: number;
  unmatched: number;
  autoMatched: number;
  manualMatched: number;
  matchRate: number;
}> {
  const res = await apiGet<{ data: any }>("/api/accounting/ai/matching-stats");
  return res.data;
}

export async function getAIInsights(year?: number, month?: number): Promise<AIInsights> {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (month) params.set("month", String(month));
  const query = params.toString();
  const res = await apiGet<{ data: AIInsights }>(
    `/api/accounting/ai/insights${query ? `?${query}` : ""}`
  );
  return res.data;
}

export async function getAnomalies(): Promise<Anomaly[]> {
  const res = await apiGet<{ data: Anomaly[] }>("/api/accounting/ai/anomalies");
  return res.data;
}

export async function detectAnomalies(): Promise<Anomaly[]> {
  const res = await apiPost<{ data: Anomaly[] }>("/api/accounting/ai/anomalies/detect", {});
  return res.data;
}

export async function resolveAnomaly(id: number, resolution: string): Promise<Anomaly> {
  const res = await apiPost<{ data: Anomaly }>(`/api/accounting/ai/anomalies/${id}/resolve`, {
    resolution,
  });
  return res.data;
}

export async function getTopExpenseCategories(
  startDate?: string,
  endDate?: string,
  limit?: number
): Promise<Array<{ category: string; total: number; count: number; percentage: number }>> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (limit) params.set("limit", String(limit));
  const query = params.toString();
  const res = await apiGet<{ data: any[] }>(
    `/api/accounting/ai/top-expenses${query ? `?${query}` : ""}`
  );
  return res.data;
}

export async function getTopCustomers(
  startDate?: string,
  endDate?: string,
  limit?: number
): Promise<Array<{ kundeId: number; name: string; total: number; count: number }>> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (limit) params.set("limit", String(limit));
  const query = params.toString();
  const res = await apiGet<{ data: any[] }>(
    `/api/accounting/ai/top-customers${query ? `?${query}` : ""}`
  );
  return res.data;
}

export async function sendChatMessage(
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<{
  response: string;
  context?: any;
  suggestions?: string[];
}> {
  const res = await apiPost<{ data: any }>("/api/accounting/ai/chat", {
    message,
    history: history || [],
  });
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGAL ENTITIES API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getLegalEntities(): Promise<LegalEntity[]> {
  const res = await apiGet<{ data: LegalEntity[] }>("/api/accounting/legal-entities");
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXCHANGE RATES API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getExchangeRate(
  from: string,
  to: string,
  date?: string
): Promise<{ rate: number; date: string; source: string }> {
  const params = new URLSearchParams({ from, to });
  if (date) params.set("date", date);
  const res = await apiGet<{ data: any }>(
    `/api/accounting/exchange-rates?${params.toString()}`
  );
  return res.data;
}

export async function syncExchangeRates(): Promise<{ synced: number }> {
  const res = await apiPost<{ data: any }>("/api/accounting/exchange-rates/sync", {});
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FISCAL YEARS API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getFiscalYears(): Promise<Array<{
  id: number;
  year: number;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  closedAt?: string;
}>> {
  const res = await apiGet<{ data: any[] }>("/api/accounting/fiscal-years");
  return res.data;
}

export async function closeFiscalYear(year: number): Promise<any> {
  const res = await apiPost<{ data: any }>("/api/accounting/year-end/close", { year });
  return res.data;
}
