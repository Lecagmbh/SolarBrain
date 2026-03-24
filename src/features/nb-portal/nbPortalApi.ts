// src/features/nb-portal/nbPortalApi.ts
/**
 * NB-Portal Proxy API Client
 * ===========================
 * API client for interacting with the NB portal proxy system
 */

import { api } from '../../modules/api/client';

export interface NbPortal {
  id: string;
  name: string;
  available: boolean;
}

export interface ProxySession {
  sessionId: string;
  status: string;
}

export interface SessionInfo {
  id: string;
  kundeId: number;
  nbPortalId: string;
  installationId?: number;
  status: 'initializing' | 'ready' | 'busy' | 'error' | 'closed';
  currentUrl?: string;
  errorMessage?: string;
  createdAt: string;
  lastActivity: string;
}

// Get available NB portals
export async function getAvailablePortals(): Promise<NbPortal[]> {
  const response = await api.get('/nb-proxy/portals');
  return response.data.portals;
}

// Start a new proxy session
export async function startProxySession(
  nbPortalId: string,
  installationId?: number
): Promise<ProxySession> {
  const response = await api.post('/nb-proxy/session/start', {
    nbPortalId,
    installationId
  });
  return response.data;
}

// Get session info
export async function getSessionInfo(sessionId: string): Promise<SessionInfo> {
  const response = await api.get(`/nb-proxy/session/${sessionId}`);
  return response.data.session;
}

// Get current page HTML
export async function getCurrentPage(sessionId: string): Promise<string> {
  const response = await api.get(`/nb-proxy/${sessionId}/page`, {
    responseType: 'text',
    headers: { Accept: 'text/html' }
  });
  return response.data;
}

// Navigate to a path
export async function navigateTo(sessionId: string, path: string): Promise<string> {
  const response = await api.get(`/nb-proxy/${sessionId}/navigate`, {
    params: { path },
    responseType: 'text',
    headers: { Accept: 'text/html' }
  });
  return response.data;
}

// Send a click event
export async function sendClick(
  sessionId: string,
  x: number,
  y: number,
  options?: { mapWidth?: number; mapHeight?: number; elementId?: string }
): Promise<{ success: boolean; html?: string }> {
  const response = await api.post(`/nb-proxy/${sessionId}/click`, {
    x,
    y,
    ...options
  });
  return response.data;
}

// Click a button by text
export async function clickButton(
  sessionId: string,
  text: string
): Promise<{ success: boolean; html?: string }> {
  const response = await api.post(`/nb-proxy/${sessionId}/button`, { text });
  return response.data;
}

// Fill a form field
export async function fillField(
  sessionId: string,
  selector: string,
  value: string
): Promise<{ success: boolean }> {
  const response = await api.post(`/nb-proxy/${sessionId}/fill`, {
    selector,
    value
  });
  return response.data;
}

// Submit a form
export async function submitForm(
  sessionId: string,
  action: string,
  data: Record<string, any>
): Promise<{ success: boolean; html?: string }> {
  const response = await api.post(`/nb-proxy/${sessionId}/submit`, {
    action,
    data
  });
  return response.data;
}

// Get screenshot
export function getScreenshotUrl(sessionId: string): string {
  return `/api/nb-proxy/${sessionId}/screenshot`;
}

// Send heartbeat
export async function sendHeartbeat(sessionId: string): Promise<boolean> {
  try {
    await api.post(`/nb-proxy/${sessionId}/heartbeat`);
    return true;
  } catch {
    return false;
  }
}

// End session
export async function endSession(sessionId: string): Promise<void> {
  await api.post(`/nb-proxy/${sessionId}/end`);
}

// Get admin stats
export async function getProxyStats(): Promise<{
  totalSessions: number;
  byNb: Record<string, { name: string; active: number; max: number }>;
}> {
  const response = await api.get('/nb-proxy/admin/stats');
  return response.data.stats;
}

// ============================================
// Dynamic Form API (Stromnetz Berlin REST API)
// ============================================

import type {
  FormDefinition,
  FormValues,
  FormSubmissionResponse,
  UploadedFile
} from './forms/types/form.types';

/**
 * Fetch form definition for a product type
 * Returns the complete form schema including groups, components, and validation rules
 */
export async function getFormDefinition(
  portalId: string,
  productId: string
): Promise<FormDefinition> {
  const response = await api.get(`/nb-proxy/form-definition/${portalId}/${productId}`);
  return response.data;
}

/**
 * Submit completed form data to the portal and save to database
 */
export async function submitFormData(
  portalId: string,
  productId: string,
  data: FormValues,
  options?: {
    installationId?: number;
    variant?: string;
  }
): Promise<FormSubmissionResponse> {
  const response = await api.post(`/nb-proxy/form-submit/${portalId}/${productId}`, {
    data,
    installationId: options?.installationId,
    variant: options?.variant
  });
  return response.data;
}

/**
 * Save form data as draft (without submitting to the portal)
 */
export async function saveFormDraft(
  portalId: string,
  productId: string,
  data: FormValues,
  options?: {
    installationId?: number;
    variant?: string;
    submissionId?: number;
  }
): Promise<{ success: boolean; submissionId: number; message: string }> {
  const response = await api.post(`/nb-proxy/form-draft/${portalId}/${productId}`, {
    data,
    installationId: options?.installationId,
    variant: options?.variant,
    submissionId: options?.submissionId
  });
  return response.data;
}

/**
 * NB Portal Submission record (as returned from backend)
 */
export interface NbPortalSubmissionRecord {
  id: number;
  portalId: string;
  productId: string;
  variant: string | null;
  status: string;
  nbVorgangsNummer: string | null;
  nbSubmittedAt: string | null;
  nbResponseAt: string | null;
  nbResponseStatus: string | null;
  modulleistungKwp: number | null;
  speicherKapazitaetKwh: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  installationId: number | null;
}

/**
 * Fetch own submissions list
 */
export async function getSubmissions(
  options?: {
    status?: string;
    portalId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ submissions: NbPortalSubmissionRecord[]; total: number }> {
  const response = await api.get('/nb-proxy/submissions', {
    params: options
  });
  return response.data;
}

/**
 * Fetch a single submission by ID (includes full formData)
 */
export async function getSubmission(
  submissionId: number
): Promise<NbPortalSubmissionRecord & { formData: Record<string, unknown> }> {
  const response = await api.get(`/nb-proxy/submissions/${submissionId}`);
  return response.data.submission;
}

/**
 * Upload a file for a form field
 */
export async function uploadFormFile(
  portalId: string,
  productId: string,
  fieldKey: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fieldKey', fieldKey);

  const response = await api.post(
    `/nb-proxy/form-upload/${portalId}/${productId}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            onProgress(progress);
          }
        : undefined
    }
  );

  return {
    id: response.data.fileId,
    name: file.name,
    size: file.size,
    type: file.type,
    url: response.data.url,
    status: 'complete'
  };
}

/**
 * Delete an uploaded file
 */
export async function deleteFormFile(
  portalId: string,
  productId: string,
  fileId: string
): Promise<void> {
  await api.delete(`/nb-proxy/form-upload/${portalId}/${productId}/${fileId}`);
}

/**
 * Get address autocomplete suggestions (for floorplan/address fields)
 */
export async function getAddressSuggestions(
  portalId: string,
  query: string
): Promise<Array<{
  street: string;
  houseNumber?: string;
  postalCode: string;
  city: string;
  displayText: string;
}>> {
  const response = await api.get(`/nb-proxy/address-autocomplete/${portalId}`, {
    params: { q: query }
  });
  return response.data.suggestions || [];
}

/**
 * Validate form data server-side before submission
 */
export async function validateFormData(
  portalId: string,
  productId: string,
  data: FormValues
): Promise<{
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
}> {
  const response = await api.post(`/nb-proxy/form-validate/${portalId}/${productId}`, {
    data
  });
  return response.data;
}
