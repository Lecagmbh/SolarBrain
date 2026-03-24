/**
 * AI Assistant API
 *
 * API-Funktionen für die KI-Features:
 * - E-Mail-Assistent
 * - Dokument-Analyse
 * - Workflow-Prognose
 * - Chat-Assistent
 * - Semantische Suche
 * - Datenvalidierung
 */

import { apiGet, apiPost } from './client';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPEN
// ═══════════════════════════════════════════════════════════════════════════════

export interface RueckfrageAnalysis {
  success: boolean;
  urgencyLevel: 'HOCH' | 'MITTEL' | 'NIEDRIG';
  classification: {
    category: string;
    subCategory?: string;
    confidence: number;
  };
  requiredActions: Array<{
    type: string;
    description: string;
    priority: number;
  }>;
  suggestedResponse?: string;
  estimatedEffort: string;
}

export interface EmailResponse {
  success: boolean;
  subject: string;
  body: string;
  tone: string;
  confidence: number;
}

export interface DocumentAnalysis {
  success: boolean;
  documentType: string;
  confidence: number;
  extractedData: Record<string, unknown>;
  issues: string[];
  suggestions: string[];
}

export interface WorkflowInsights {
  processingEstimates: ProcessingTimeEstimate[];
  anomalies: AnomalyAlert[];
  bottlenecks: Bottleneck[];
  todaysPriorities: PriorityItem[];
  weeklyForecast: {
    expectedApprovals: number;
    expectedRueckfragen: number;
    upcomingDeadlines: number;
  };
  summary: string;
}

export interface ProcessingTimeEstimate {
  netzbetreiberId: number;
  netzbetreiberName: string;
  avgDays: number;
  minDays: number;
  maxDays: number;
  sampleSize: number;
  confidence: number;
  trend: 'FASTER' | 'STABLE' | 'SLOWER';
}

export interface AnomalyAlert {
  installationId: number;
  publicId: string;
  customerName: string;
  status: string;
  daysInStatus: number;
  expectedDays: number;
  anomalyScore: number;
  anomalyType: 'STUCK' | 'UNUSUALLY_SLOW' | 'MISSING_UPDATE' | 'ESCALATION_NEEDED';
  suggestedAction: string;
}

export interface Bottleneck {
  type: 'STATUS' | 'NETZBETREIBER' | 'DOCUMENT' | 'RUECKFRAGE';
  identifier: string;
  count: number;
  avgWaitDays: number;
  suggestion: string;
}

export interface PriorityItem {
  installationId: number;
  publicId: string;
  customerName: string;
  priorityScore: number;
  reasons: string[];
  suggestedAction: string;
  deadline?: string;
}

export interface ChatSuggestion {
  success: boolean;
  suggestions: Array<{
    text: string;
    tone: 'FREUNDLICH' | 'SACHLICH' | 'FORMAL';
    confidence: number;
  }>;
  detectedIntents: string[];
  recommendedAction?: string;
}

export interface SearchResult {
  id: number;
  publicId: string;
  customerName: string;
  status: string;
  plz: string;
  ort: string;
  totalKwp: number | null;
  gridOperator: string | null;
  matchScore: number;
  matchReason: string;
}

export interface ValidationResult {
  success: boolean;
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
  autoFixSuggestions: Array<{
    field: string;
    currentValue: unknown;
    suggestedValue: unknown;
    reason: string;
  }>;
}

export interface ValidationIssue {
  field: string;
  currentValue: unknown;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  type: string;
  message: string;
  autoFixable: boolean;
  suggestedValue?: unknown;
}

// ═══════════════════════════════════════════════════════════════════════════════
// E-MAIL ASSISTANT
// ═══════════════════════════════════════════════════════════════════════════════

export async function analyzeRueckfrage(params: {
  emailSubject: string;
  emailBody: string;
  senderName?: string;
  installationData?: unknown;
}): Promise<RueckfrageAnalysis> {
  return apiPost<RueckfrageAnalysis>('/api/ai-assistant/email/analyze-rueckfrage', params);
}

export async function generateEmailResponse(params: {
  originalEmail: { subject: string; body: string };
  installationData: unknown;
  responseType: 'REPLY_TO_RUECKFRAGE' | 'SEND_DOCUMENTS' | 'STATUS_UPDATE' | 'NACHFRAGE';
}): Promise<EmailResponse> {
  return apiPost<EmailResponse>('/api/ai-assistant/email/generate-response', params);
}

export async function suggestEmailTemplate(params: {
  context: string;
  recipientType: 'kunde' | 'netzbetreiber';
  situation: string;
}): Promise<{ templates: Array<{ name: string; subject: string; bodyPreview: string }> }> {
  return apiPost<{ templates: Array<{ name: string; subject: string; bodyPreview: string }> }>('/api/ai-assistant/email/suggest-template', params);
}

export async function getQuickActions(
  installationId: number,
  rueckfrageText?: string
): Promise<{ actions: Array<{ type: string; label: string; description: string; priority: number }> }> {
  const params = new URLSearchParams();
  if (rueckfrageText) params.set('rueckfrageText', rueckfrageText);

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiGet<{ actions: Array<{ type: string; label: string; description: string; priority: number }> }>(`/api/ai-assistant/email/quick-actions/${installationId}${query}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT ASSISTANT
// ═══════════════════════════════════════════════════════════════════════════════

export async function analyzeDocument(params: {
  documentContent: string;
  fileName: string;
  mimeType: string;
  installationContext?: unknown;
}): Promise<DocumentAnalysis> {
  return apiPost<DocumentAnalysis>('/api/ai-assistant/document/analyze', params);
}

export async function checkDocumentQuality(params: {
  documentType: string;
  fileName: string;
  installationData: unknown;
}): Promise<{ score: number; issues: string[]; suggestions: string[] }> {
  return apiPost<{ score: number; issues: string[]; suggestions: string[] }>('/api/ai-assistant/document/check-quality', params);
}

export async function categorizeDocument(params: {
  fileName: string;
  fileContent?: string;
}): Promise<{ category: string; confidence: number; suggestedName: string }> {
  return apiPost<{ category: string; confidence: number; suggestedName: string }>('/api/ai-assistant/document/categorize', params);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOW PREDICTOR
// ═══════════════════════════════════════════════════════════════════════════════

export async function getWorkflowInsights(): Promise<WorkflowInsights> {
  return apiGet<WorkflowInsights>('/api/ai-assistant/workflow/insights');
}

export async function getAnomalies(): Promise<{ anomalies: AnomalyAlert[] }> {
  return apiGet<{ anomalies: AnomalyAlert[] }>('/api/ai-assistant/workflow/anomalies');
}

export async function getBottlenecks(): Promise<{ bottlenecks: Bottleneck[] }> {
  return apiGet<{ bottlenecks: Bottleneck[] }>('/api/ai-assistant/workflow/bottlenecks');
}

export async function getTodaysPriorities(limit?: number): Promise<{ priorities: PriorityItem[] }> {
  const query = limit ? `?limit=${limit}` : '';
  return apiGet<{ priorities: PriorityItem[] }>(`/api/ai-assistant/workflow/priorities${query}`);
}

export async function getProcessingTimes(): Promise<{ estimates: ProcessingTimeEstimate[] }> {
  return apiGet<{ estimates: ProcessingTimeEstimate[] }>('/api/ai-assistant/workflow/processing-times');
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT ASSISTANT
// ═══════════════════════════════════════════════════════════════════════════════

export async function suggestChatResponse(params: {
  customerMessage: string;
  chatHistory?: Array<{ role: string; content: string }>;
  installationData?: unknown;
}): Promise<ChatSuggestion> {
  return apiPost<ChatSuggestion>('/api/ai-assistant/chat/suggest-response', params);
}

export async function matchFAQ(message: string): Promise<{
  matches: Array<{ question: string; answer: string; score: number; category: string }>;
}> {
  return apiPost<{ matches: Array<{ question: string; answer: string; score: number; category: string }> }>('/api/ai-assistant/chat/match-faq', { message });
}

export async function summarizeChat(params: {
  installationId: number;
  messages: Array<{ role: string; content: string; timestamp: string }>;
}): Promise<{ summary: string; keyPoints: string[]; openIssues: string[] }> {
  return apiPost<{ summary: string; keyPoints: string[]; openIssues: string[] }>('/api/ai-assistant/chat/summarize', params);
}

export async function checkEscalation(params: {
  messages: Array<{ role: string; content: string }>;
}): Promise<{ needsEscalation: boolean; reason?: string; urgency: number }> {
  return apiPost<{ needsEscalation: boolean; reason?: string; urgency: number }>('/api/ai-assistant/chat/check-escalation', params);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEMANTIC SEARCH
// ═══════════════════════════════════════════════════════════════════════════════

export async function semanticSearch(query: string, limit?: number): Promise<{
  query: string;
  count: number;
  results: SearchResult[];
}> {
  const params = new URLSearchParams({ q: query });
  if (limit) params.set('limit', limit.toString());

  return apiGet<{ query: string; count: number; results: SearchResult[] }>(`/api/ai-assistant/search?${params.toString()}`);
}

export async function parseSearchQuery(query: string): Promise<{
  success: boolean;
  filters: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  explanation: string;
}> {
  return apiPost<{ success: boolean; filters: Record<string, unknown>; sortBy?: string; sortOrder?: 'asc' | 'desc'; explanation: string }>('/api/ai-assistant/search/parse-query', { query });
}

export async function findSimilarInstallations(
  installationId: number,
  limit?: number
): Promise<{
  installationId: number;
  similar: Array<{
    id: number;
    publicId: string;
    customerName: string;
    status: string;
    similarityScore: number;
    commonFactors: string[];
  }>;
}> {
  const query = limit ? `?limit=${limit}` : '';
  return apiGet<{
    installationId: number;
    similar: Array<{
      id: number;
      publicId: string;
      customerName: string;
      status: string;
      similarityScore: number;
      commonFactors: string[];
    }>;
  }>(`/api/ai-assistant/search/similar/${installationId}${query}`);
}

export async function getSearchSuggestions(): Promise<{ suggestions: string[] }> {
  return apiGet<{ suggestions: string[] }>('/api/ai-assistant/search/suggestions');
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

export async function validateInstallation(installationId: number): Promise<ValidationResult> {
  return apiGet<ValidationResult>(`/api/ai-assistant/validate/${installationId}`);
}

export async function quickPlausibilityCheck(params: {
  totalKwp?: number;
  moduleCount?: number;
  moduleWp?: number;
  inverterKw?: number;
  storageKwh?: number;
  roofAreaM2?: number;
}): Promise<{
  checks: Array<{
    field: string;
    isValid: boolean;
    message: string;
    suggestion?: unknown;
  }>;
}> {
  return apiPost<{
    checks: Array<{
      field: string;
      isValid: boolean;
      message: string;
      suggestion?: unknown;
    }>;
  }>('/api/ai-assistant/validate/plausibility', params);
}

export async function suggestCorrections(params: {
  field: string;
  currentValue: unknown;
  context: Record<string, unknown>;
}): Promise<{
  suggestions: Array<{
    value: unknown;
    confidence: number;
    reason: string;
  }>;
}> {
  return apiPost<{
    suggestions: Array<{
      value: unknown;
      confidence: number;
      reason: string;
    }>;
  }>('/api/ai-assistant/validate/suggest-corrections', params);
}

export async function batchValidate(installationIds: number[]): Promise<{
  count: number;
  results: Array<{
    installationId: number;
    isValid: boolean;
    score: number;
    issues: ValidationIssue[];
  }>;
}> {
  return apiPost<{
    count: number;
    results: Array<{
      installationId: number;
      isValid: boolean;
      score: number;
      issues: ValidationIssue[];
    }>;
  }>('/api/ai-assistant/validate/batch', { installationIds });
}
