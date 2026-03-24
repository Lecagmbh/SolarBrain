/**
 * NETZANMELDUNGEN ENTERPRISE - API SERVICES
 * Version 2.0 - Complete API Layer
 */

import type {
  InstallationListItem,
  InstallationDetail,
  InstallationStatus,
  GridOperator,
  GridOperatorContact,
  PlzMapping,
  EmailTemplate,
  EmailRecord,
  Task,
  TeamMember,
  TimelineEntry,
  Comment,
  Document,
  ChecklistItem,
  AnalyticsReport,
  ApiResponse,
  PaginatedResponse,
  BulkActionResult,
  CustomerData,
  TechnicalData,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// API CLIENT - Nutzt existierendes Auth-System
// ═══════════════════════════════════════════════════════════════════════════

import { getAccessToken } from "../../../modules/auth/tokenStorage";

const API_BASE = "/api";

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  
  // Don't set Content-Type for FormData - browser will set it with boundary
  const isFormData = options.body instanceof FormData;
  
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
    credentials: "include",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export const apiGet = <T>(endpoint: string) => apiRequest<T>(endpoint);
export const apiPost = <T>(endpoint: string, data?: any) => {
  // Handle FormData separately - don't stringify
  if (data instanceof FormData) {
    return apiRequest<T>(endpoint, { method: "POST", body: data });
  }
  return apiRequest<T>(endpoint, { method: "POST", body: data ? JSON.stringify(data) : undefined });
};
export const apiPatch = <T>(endpoint: string, data: any) => apiRequest<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) });
export const apiDelete = <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "DELETE" });

// ═══════════════════════════════════════════════════════════════════════════
// INSTALLATIONS API
// ═══════════════════════════════════════════════════════════════════════════

export const installationsApi = {
  async getAll(params?: { page?: number; limit?: number; status?: InstallationStatus[]; gridOperatorId?: number; assignedToId?: number; search?: string }): Promise<PaginatedResponse<InstallationListItem>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.status?.length) query.set("status", params.status.join(","));
    if (params?.gridOperatorId) query.set("gridOperatorId", String(params.gridOperatorId));
    if (params?.assignedToId) query.set("assignedToId", String(params.assignedToId));
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    // Nutzt den /enterprise Endpoint für erweiterte Liste mit KPIs
    return apiGet(`/installations/enterprise${qs ? `?${qs}` : ""}`);
  },
  
  async getById(id: number): Promise<InstallationDetail> {
    const res = await apiGet<any>(`/installations/${id}`);
    return res.data || res;
  },
  
  async updateStatus(id: number, newStatus: InstallationStatus, reason?: string): Promise<ApiResponse<InstallationDetail>> {
    return apiPost(`/installations/${id}/status`, { status: newStatus, reason });
  },
  
  async updateNbCaseNumber(id: number, nbCaseNumber: string): Promise<ApiResponse<any>> {
    return apiPatch(`/installations/${id}/nb-case-number`, { nbCaseNumber });
  },
  async updateCustomer(id: number, data: Partial<CustomerData>): Promise<ApiResponse<InstallationDetail>> {
    return apiPatch(`/installations/${id}/customer`, data);
  },
  
  async updateTechnical(id: number, data: Partial<TechnicalData>): Promise<ApiResponse<InstallationDetail>> {
    return apiPatch(`/installations/${id}/technical`, data);
  },
  
  async assignGridOperator(id: number, gridOperatorId: number): Promise<ApiResponse<InstallationDetail>> {
    return apiPost(`/installations/${id}/grid-operator`, { gridOperatorId });
  },
  
  async assignTo(id: number, userId: number): Promise<ApiResponse<InstallationDetail>> {
    return apiPost(`/installations/${id}/assign`, { userId });
  },
  
  async unassign(id: number): Promise<ApiResponse<InstallationDetail>> {
    return apiPost(`/installations/${id}/unassign`);
  },
  
  async setDeadline(id: number, deadline: string | null): Promise<ApiResponse<InstallationDetail>> {
    return apiPatch(`/installations/${id}`, { deadline });
  },

  // Zählerwechsel-Terminmanagement
  async scheduleZaehlerwechsel(id: number, data: { datum: string; uhrzeit: string; kommentar?: string }): Promise<{
    success: boolean;
    appointment: { id: number; confirmToken: string; status: string };
    notificationsSent: { errichterEmail: boolean; endkundeEmail: boolean; endkundeWhatsapp: boolean };
  }> {
    return apiPost(`/installations/${id}/zaehlerwechsel-termin`, data);
  },

  async cancelZaehlerwechsel(id: number): Promise<{ success: boolean }> {
    return apiDelete(`/installations/${id}/zaehlerwechsel-termin`);
  },

  async getZaehlerwechselTermin(id: number): Promise<{
    success: boolean;
    appointment: {
      id: number;
      status: string;
      scheduledAt: string;
      confirmedAt: string | null;
      createdAt: string;
      description: string | null;
    } | null;
  }> {
    return apiGet(`/installations/${id}/zaehlerwechsel-termin`);
  },
  
  async bulkUpdateStatus(ids: number[], newStatus: InstallationStatus, reason?: string): Promise<BulkActionResult> {
    return apiPost("/installations/bulk/status", { ids, status: newStatus, reason });
  },
  
  async bulkAssign(ids: number[], userId: number): Promise<BulkActionResult> {
    return apiPost("/installations/bulk/assign", { ids, userId });
  },
  
  async bulkAssignGridOperator(ids: number[], gridOperatorId: number): Promise<BulkActionResult> {
    return apiPost("/installations/bulk/grid-operator", { ids, gridOperatorId });
  },
  
  async delete(id: number): Promise<ApiResponse<void>> {
    return apiDelete(`/installations/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
    requestedCount: number;
    deletedIds: number[];
    errors?: Array<{ id: number; publicId?: string; reason: string }>;
  }> {
    return apiPost("/installations/bulk/remove", { ids });
  },

  // Correspondence / NB-Kommunikation
  async getCorrespondence(id: number): Promise<any[]> {
    try {
      const res = await apiGet<any>(`/nb-communication/installation/${id}`);
      return res.data || res || [];
    } catch {
      return [];
    }
  },

  async getNBStats(id: number): Promise<any> {
    try {
      const res = await apiGet<any>(`/nb-communication/stats`);
      return res.data || res || null;
    } catch {
      return null;
    }
  },

  async recordNBResponse(correspondenceId: number, data: { responseType: string; notes?: string; hasDocument?: boolean }): Promise<any> {
    return apiPost(`/nb-communication/response/${correspondenceId}`, {
      responseType: data.responseType.toUpperCase(),
      responseNote: data.notes,
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE API
// ═══════════════════════════════════════════════════════════════════════════

export const timelineApi = {
  async getForInstallation(installationId: number): Promise<TimelineEntry[]> {
    const res = await apiGet<any>(`/installations/${installationId}/timeline`);
    return res.data || res || [];
  },
  
  async addNote(installationId: number, note: string): Promise<TimelineEntry> {
    return apiPost(`/installations/${installationId}/timeline`, { eventType: "manual_note", title: "Notiz hinzugefügt", description: note });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMMENTS API
// ═══════════════════════════════════════════════════════════════════════════

export const commentsApi = {
  async getForInstallation(installationId: number): Promise<Comment[]> {
    const res = await apiGet<any>(`/installations/${installationId}/comments`);
    // Map backend response (message -> text) to frontend type
    const comments = res.data || res || [];
    return comments.map((c: any) => ({
      id: c.id,
      installationId: c.installationId,
      text: c.message || c.text, // Backend uses 'message', frontend uses 'text'
      authorId: c.authorId || c.author?.id,
      authorName: c.authorName || c.author?.name || c.author?.email || 'Unbekannt',
      authorEmail: c.author?.email,
      isInternal: c.isInternal ?? false,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  },

  async add(installationId: number, text: string, isInternal = false): Promise<Comment> {
    // Backend expects 'message', not 'text'
    const res = await apiPost<any>(`/installations/${installationId}/comments`, { message: text, isInternal });
    return {
      id: res.data?.id || res.id,
      installationId,
      text: res.data?.message || res.message || text,
      authorId: res.data?.authorId || res.authorId,
      authorName: res.data?.authorName || res.authorName || 'Du',
      isInternal,
      createdAt: res.data?.createdAt || res.createdAt || new Date().toISOString(),
    };
  },

  async update(installationId: number, commentId: number, text: string): Promise<Comment> {
    const res = await apiPatch<any>(`/installations/${installationId}/comments/${commentId}`, { message: text });
    return {
      ...res.data || res,
      text: res.data?.message || res.message || text,
    };
  },

  async delete(installationId: number, commentId: number): Promise<void> {
    return apiDelete(`/installations/${installationId}/comments/${commentId}`);
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTS API
// ═══════════════════════════════════════════════════════════════════════════

export const documentsApi = {
  async getForInstallation(installationId: number): Promise<Document[]> {
    const res = await apiGet<any>(`/installations/${installationId}/documents`);
    return res.data || res || [];
  },
  
  async upload(installationId: number, file: File, kategorie: string, dokumentTyp?: string): Promise<Document> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kategorie", kategorie);
    if (dokumentTyp) formData.append("dokumentTyp", dokumentTyp);
    
    const token = getAccessToken();
    const response = await fetch(`${API_BASE}/installations/${installationId}/documents`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      credentials: "include",
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Upload fehlgeschlagen");
    }
    return response.json();
  },
  
  async delete(installationId: number, documentId: number): Promise<void> {
    return apiDelete(`/installations/${installationId}/documents/${documentId}`);
  },
  
  async download(document: Document): Promise<Blob> {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(document.url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error("Download fehlgeschlagen");
    return response.blob();
  },
  
  async generate(installationId: number, documentType: string): Promise<Document> {
    // VDE-Dokumente über den VDE-Generator
    if (documentType.startsWith("vde_")) {
      return apiPost(`/vde/generate/${installationId}`, { formType: documentType.replace("vde_", "") });
    }
    // Andere Dokumente (z.B. Vollmacht, Projektmappe)
    return apiPost(`/installations/${installationId}/documents/generate`, { documentType });
  },
  
  async requestFromCustomer(installationId: number, documentType: string): Promise<void> {
    return apiPost(`/installations/${installationId}/documents/request`, { documentType });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CHECKLIST API
// ═══════════════════════════════════════════════════════════════════════════

export const checklistApi = {
  async getForInstallation(installationId: number): Promise<ChecklistItem[]> {
    const res = await apiGet<any>(`/installations/${installationId}/checklist`);
    return res.data || res || [];
  },
  
  async toggleItem(installationId: number, itemId: string, completed: boolean): Promise<ChecklistItem> {
    return apiPatch(`/installations/${installationId}/checklist/${itemId}`, { isCompleted: completed });
  },
  
  async initializeForStatus(installationId: number, status: InstallationStatus): Promise<ChecklistItem[]> {
    return apiPost(`/installations/${installationId}/checklist/initialize`, { status });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// GRID OPERATORS API - Nutzt existierende /api/netzbetreiber Endpoints
// ═══════════════════════════════════════════════════════════════════════════

export const gridOperatorsApi = {
  async getAll(): Promise<GridOperator[]> {
    const res = await apiGet<any>("/netzbetreiber");
    return res.data || res || [];
  },
  
  async getById(id: number): Promise<GridOperator> {
    const res = await apiGet<any>(`/netzbetreiber/${id}`);
    return res.data || res;
  },
  
  async create(data: Partial<GridOperator>): Promise<GridOperator> {
    return apiPost("/netzbetreiber", data);
  },
  
  async update(id: number, data: Partial<GridOperator>): Promise<GridOperator> {
    return apiPatch(`/netzbetreiber/${id}`, data);
  },
  
  async delete(id: number): Promise<void> {
    return apiDelete(`/netzbetreiber/${id}`);
  },
  
  async getContacts(gridOperatorId: number): Promise<GridOperatorContact[]> {
    try {
      const res = await apiGet<any>(`/netzbetreiber/${gridOperatorId}/contacts`);
      return res.data || res || [];
    } catch { return []; }
  },
  
  async addContact(gridOperatorId: number, data: Partial<GridOperatorContact>): Promise<GridOperatorContact> {
    return apiPost(`/netzbetreiber/${gridOperatorId}/contacts`, data);
  },
  
  async findByPlz(plz: string): Promise<GridOperator | null> {
    try {
      // Nutze den Enterprise-Endpoint für PLZ-Suche
      const res = await apiGet<any>(`/installations/grid-operators/by-plz/${plz}`);
      const data = res.data || res;
      return Array.isArray(data) ? data[0] : data;
    } catch { return null; }
  },
  
  async getPlzMappings(): Promise<PlzMapping[]> {
    try {
      const res = await apiGet<any>("/netzbetreiber/plz-mappings");
      return res.data || res || [];
    } catch { return []; }
  },
  
  async savePlzMapping(plz: string, gridOperatorId: number): Promise<PlzMapping> {
    return apiPost("/netzbetreiber/plz-mappings", { plz, gridOperatorId });
  },
  
  async getStatistics(id: number): Promise<{ activeCount: number; completedCount: number; avgProcessingDays: number; approvalRate: number }> {
    try {
      const res = await apiGet<any>(`/netzbetreiber/${id}/statistics`);
      return res.data || res || { activeCount: 0, completedCount: 0, avgProcessingDays: 0, approvalRate: 0 };
    } catch {
      return { activeCount: 0, completedCount: 0, avgProcessingDays: 0, approvalRate: 0 };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL API
// ═══════════════════════════════════════════════════════════════════════════

export const emailApi = {
  async getTemplates(): Promise<EmailTemplate[]> {
    const res = await apiGet<any>("/email-templates");
    return res.data || res || [];
  },
  
  async getTemplate(id: number): Promise<EmailTemplate> {
    return apiGet(`/email-templates/${id}`);
  },
  
  async createTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    return apiPost("/email-templates", data);
  },
  
  async updateTemplate(id: number, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    return apiPatch(`/email-templates/${id}`, data);
  },
  
  async deleteTemplate(id: number): Promise<void> {
    return apiDelete(`/email-templates/${id}`);
  },
  
  async send(installationId: number, data: { templateId?: number; to: string; cc?: string; subject: string; body: string; attachDocumentIds?: number[] }): Promise<EmailRecord> {
    return apiPost(`/installations/${installationId}/emails`, data);
  },
  
  async preview(installationId: number, templateId: number): Promise<{ subject: string; body: string }> {
    return apiGet(`/installations/${installationId}/emails/preview/${templateId}`);
  },
  
  async getHistory(installationId: number): Promise<EmailRecord[]> {
    const res = await apiGet<any>(`/installations/${installationId}/emails`);
    return res.data || res || [];
  },

  async sendToNB(installationId: number, data: { type: string; subject: string; message: string; to: string }): Promise<EmailRecord> {
    // Map frontend types to backend NB-Communication types
    const typeMap: Record<string, string> = {
      erstanmeldung: "ERSTANMELDUNG",
      nachfrage: "NACHFRAGE_1",
      email: "RUECKFRAGE_ANTWORT",
    };
    return apiPost(`/nb-communication/send`, {
      installationId,
      type: typeMap[data.type] || data.type.toUpperCase(),
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TASKS API
// ═══════════════════════════════════════════════════════════════════════════

export const tasksApi = {
  async getAll(params?: { assignedToId?: number; installationId?: number; status?: string }): Promise<Task[]> {
    if (params?.installationId) {
      const res = await apiGet<any>(`/installations/${params.installationId}/tasks`);
      return res.data || res || [];
    }
    // Fallback für alle Tasks (wenn Backend das unterstützt)
    const query = new URLSearchParams();
    if (params?.assignedToId) query.set("assignedToId", String(params.assignedToId));
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    const res = await apiGet<any>(`/tasks${qs ? `?${qs}` : ""}`);
    return res.data || res || [];
  },

  async getById(id: number): Promise<Task> {
    return apiGet(`/tasks/${id}`);
  },

  async create(installationId: number, data: Partial<Task>): Promise<Task> {
    return apiPost(`/installations/${installationId}/tasks`, data);
  },

  async update(id: number, data: Partial<Task>): Promise<Task> {
    return apiPatch(`/installations/tasks/${id}`, data);
  },

  async complete(id: number): Promise<Task> {
    return apiPost(`/installations/tasks/${id}/complete`, {});
  },

  async delete(id: number): Promise<void> {
    return apiDelete(`/installations/tasks/${id}`);
  },
};
// ═══════════════════════════════════════════════════════════════════════════
// TEAM API
// ═══════════════════════════════════════════════════════════════════════════

export const teamApi = {
  async getMembers(): Promise<TeamMember[]> {
    const res = await apiGet<any>("/team/members");
    return res.data || res || [];
  },
  
  async getMember(id: number): Promise<TeamMember> {
    return apiGet(`/team/members/${id}`);
  },
  
  async getWorkload(): Promise<Array<{ userId: number; userName: string; activeCount: number; capacity: number; utilizationPercent: number }>> {
    return apiGet("/team/workload");
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS API
// ═══════════════════════════════════════════════════════════════════════════

export const analyticsApi = {
  async getDashboard(): Promise<{ kpis: any; trendsWeekly: any[]; trendsMonthly: any[]; topGridOperators: any[]; bottlenecks: any[] }> {
    return apiGet("/analytics/dashboard");
  },
  
  async getReport(params: { period: "week" | "month" | "quarter" | "year" | "custom"; startDate?: string; endDate?: string }): Promise<AnalyticsReport> {
    const query = new URLSearchParams();
    query.set("period", params.period);
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    return apiGet(`/analytics/report?${query.toString()}`);
  },
  
  async exportReport(params: { period: string; format: "pdf" | "excel" }): Promise<Blob> {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_BASE}/analytics/export?period=${params.period}&format=${params.format}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error("Export fehlgeschlagen");
    return response.blob();
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PRODUKT-DB API - Produktdatenbank für Speicher, Wechselrichter, etc.
// ═══════════════════════════════════════════════════════════════════════════

export interface SpeicherDB {
  id: number;
  herstellerId: number;
  hersteller?: { id: number; name: string };
  modell: string;
  artikelNr?: string;
  kapazitaetBruttoKwh: number;
  kapazitaetNettoKwh?: number;
  ladeleistungMaxKw?: number;
  entladeleistungMaxKw?: number;
  batterietyp?: string;
  kopplung?: string;
  notstromfaehig?: boolean;
  ersatzstromfaehig?: boolean;
  wirkungsgradProzent?: number;
  zyklenBeiDod80?: number;
  gewichtKg?: number;
  garantieJahre?: number;
  garantieZyklen?: number;
  datenblattUrl?: string;
  bildUrl?: string;
  usageCount: number;
  verified: boolean;
  aktiv: boolean;
}

export interface WechselrichterDB {
  id: number;
  herstellerId: number;
  hersteller?: { id: number; name: string };
  modell: string;
  artikelNr?: string;
  acLeistungW: number;
  acLeistungMaxW?: number;
  phasen: number;
  dcLeistungMaxW?: number;
  dcSpannungMaxV?: number;
  mppTrackerAnzahl: number;
  stringsProTracker: number;
  hybrid: boolean;
  dreiphasig: boolean;
  notstromfaehig: boolean;
  wirkungsgradMaxProzent?: number;
  gewichtKg?: number;
  schutzartIp?: string;
  zertifikatVde4105?: boolean;
  zertifikatVdeAr4110?: boolean;
  naSchutzIntegriert?: boolean;
  zerezId?: string;
  garantieJahre?: number;
  datenblattUrl?: string;
  konformitaetserklaerungUrl?: string;
  bildUrl?: string;
  usageCount: number;
  verified: boolean;
  aktiv: boolean;
}

export interface PvModulDB {
  id: number;
  herstellerId: number;
  hersteller?: { id: number; name: string };
  modell: string;
  artikelNr?: string;
  leistungWp: number;
  wirkungsgradProzent?: number;
  voc?: number;
  isc?: number;
  vmpp?: number;
  impp?: number;
  laengeMm?: number;
  breiteMm?: number;
  gewichtKg?: number;
  zelltyp?: string;
  zellenAnzahl?: number;
  bifacial?: boolean;
  produktgarantieJahre?: number;
  leistungsgarantieJahre?: number;
  datenblattUrl?: string;
  bildUrl?: string;
  usageCount: number;
  verified: boolean;
  aktiv: boolean;
}

export const produkteApi = {
  speicher: {
    async search(query: string): Promise<SpeicherDB[]> {
      if (!query || query.length < 2) return [];
      try {
        const response = await apiGet<{ data: SpeicherDB[] }>(
          `/produkte/speicher/search?q=${encodeURIComponent(query)}`
        );
        return response.data || [];
      } catch {
        return [];
      }
    },
    
    async getAll(): Promise<SpeicherDB[]> {
      try {
        const response = await apiGet<{ data: SpeicherDB[] }>('/produkte/speicher');
        return response.data || [];
      } catch {
        return [];
      }
    },
    
    async getById(id: number): Promise<SpeicherDB | null> {
      try {
        return await apiGet<SpeicherDB>(`/produkte/speicher/${id}`);
      } catch {
        return null;
      }
    },
    
    /** Sucht Speicher nach Hersteller und Modellname (fuzzy match) */
    async findByName(hersteller: string, modell: string): Promise<SpeicherDB | null> {
      if (!hersteller && !modell) return null;
      try {
        // Normalisiere Namen für besseren Match
        const normalize = (s: string) => s.toLowerCase()
          .replace(/gmbh|co\.?\s*kg|inc|ltd|ag/gi, '')
          .replace(/[,\-_\.]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        const herstellerNorm = normalize(hersteller);
        const modellNorm = normalize(modell);
        
        // Extrahiere Kernbegriffe aus Modell (z.B. "Home V3" aus "SENEC.Home V3, 10 kWh")
        const modellWords = modellNorm.split(' ').filter(w => w.length > 1);
        
        // Suche mit verschiedenen Kombinationen
        const searchTerms = [
          `${hersteller} ${modell}`,
          modell,
          modellWords.slice(0, 3).join(' '), // Erste 3 Wörter
          `${hersteller} ${modellWords[0] || ''}`,
        ].filter(t => t.trim().length >= 2);
        
        let allResults: SpeicherDB[] = [];
        for (const term of searchTerms) {
          const results = await this.search(term);
          allResults = [...allResults, ...results];
          if (results.length > 0) break; // Stoppe bei erstem Treffer
        }
        
        // Deduplizieren
        const uniqueResults = allResults.filter((r, i, arr) => 
          arr.findIndex(x => x.id === r.id) === i
        );
        
        if (uniqueResults.length === 0) return null;
        
        // Score-basierter Match
        const scored = uniqueResults.map(s => {
          let score = 0;
          const dbHersteller = normalize(s.hersteller?.name || '');
          const dbModell = normalize(s.modell || '');
          
          // Hersteller Match
          if (dbHersteller === herstellerNorm) score += 50;
          else if (dbHersteller.includes(herstellerNorm) || herstellerNorm.includes(dbHersteller)) score += 30;
          
          // Modell Match - prüfe einzelne Wörter
          for (const word of modellWords) {
            if (word.length > 2 && dbModell.includes(word)) score += 10;
          }
          
          // Exakter Modell Match
          if (dbModell === modellNorm) score += 100;
          else if (dbModell.includes(modellNorm) || modellNorm.includes(dbModell)) score += 40;
          
          return { speicher: s, score };
        });
        
        // Sortiere nach Score und nimm besten
        scored.sort((a, b) => b.score - a.score);
        return scored[0]?.speicher || null;
      } catch {
        return null;
      }
    },
  },
  
  wechselrichter: {
    async search(query: string): Promise<WechselrichterDB[]> {
      if (!query || query.length < 2) return [];
      try {
        const response = await apiGet<{ data: WechselrichterDB[] }>(
          `/produkte/wechselrichter/search?q=${encodeURIComponent(query)}`
        );
        return response.data || [];
      } catch {
        return [];
      }
    },
    
    async getAll(): Promise<WechselrichterDB[]> {
      try {
        const response = await apiGet<{ data: WechselrichterDB[] }>('/produkte/wechselrichter');
        return response.data || [];
      } catch {
        return [];
      }
    },
    
    async findByName(hersteller: string, modell: string): Promise<WechselrichterDB | null> {
      if (!hersteller || !modell) return null;
      try {
        const searchTerm = `${hersteller} ${modell}`.trim();
        const results = await this.search(searchTerm);
        
        const exactMatch = results.find(w => 
          w.hersteller?.name?.toLowerCase() === hersteller.toLowerCase() &&
          w.modell?.toLowerCase() === modell.toLowerCase()
        );
        if (exactMatch) return exactMatch;
        
        const fuzzyMatch = results.find(w =>
          w.hersteller?.name?.toLowerCase().includes(hersteller.toLowerCase()) ||
          hersteller.toLowerCase().includes(w.hersteller?.name?.toLowerCase() || '')
        );
        return fuzzyMatch || results[0] || null;
      } catch {
        return null;
      }
    },
  },
  
  pvModule: {
    async search(query: string): Promise<PvModulDB[]> {
      if (!query || query.length < 2) return [];
      try {
        const response = await apiGet<{ data: PvModulDB[] }>(
          `/produkte/pv-module/search?q=${encodeURIComponent(query)}`
        );
        return response.data || [];
      } catch {
        return [];
      }
    },
    
    async findByName(hersteller: string, modell: string): Promise<PvModulDB | null> {
      if (!hersteller || !modell) return null;
      try {
        const searchTerm = `${hersteller} ${modell}`.trim();
        const results = await this.search(searchTerm);
        
        const exactMatch = results.find(m => 
          m.hersteller?.name?.toLowerCase() === hersteller.toLowerCase() &&
          m.modell?.toLowerCase() === modell.toLowerCase()
        );
        return exactMatch || results[0] || null;
      } catch {
        return null;
      }
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// VDE GENERATOR API
// ═══════════════════════════════════════════════════════════════════════════

export const vdeGeneratorApi = {
  async extract(file: File): Promise<{ success: boolean; data?: any; provider?: string; error?: string }> {
    const formData = new FormData();
    formData.append("datenblatt", file);

    const token = getAccessToken();
    const response = await fetch(`${API_BASE}/vde-generator/extract`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      credentials: "include",
    });

    return response.json();
  },

  async generate(installationId: number, data?: { file?: File; manualData?: any }): Promise<{
    success: boolean;
    documents?: { name: string; type: string; base64: string; filename: string }[];
    email?: { to: string; subject: string; body: string };
    extractedData?: any;
    error?: string;
  }> {
    const formData = new FormData();
    if (data?.file) formData.append("datenblatt", data.file);
    if (data?.manualData) formData.append("manualData", JSON.stringify(data.manualData));

    const token = getAccessToken();
    const response = await fetch(`${API_BASE}/vde-generator/generate/${installationId}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      credentials: "include",
    });

    return response.json();
  },

  async sendEmail(installationId: number, emailData: { to: string; subject: string; body: string; attachments?: any[] }): Promise<{ success: boolean; error?: string }> {
    return apiPost(`/vde-generator/send-email/${installationId}`, emailData);
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// VDE FORMULAR API (NB-konforme Formulare mit Signatur)
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// VDE-AR-N 4110 API (Mittelspannung)
// ═══════════════════════════════════════════════════════════════════════════

export const vde4110Api = {
  async getData(installationId: number | string) {
    return apiGet<{
      success: boolean;
      data: Record<string, any>;
      meta: {
        installationId: number;
        publicId: string;
        kundenName: string;
        nbEmail: string;
        nbName: string;
        hatSpeicher: boolean;
        vollmachtDoc: { id: number; name: string; url: string } | null;
        vdeVersion: string;
        source?: string;
      };
    }>(`/vde4110/${installationId}/data`);
  },

  async createSet(installationId: number | string, formulare: string[], edits?: Record<string, any>, source?: string) {
    return apiPost<{ success: boolean; set: any }>(`/vde4110/${installationId}/create`, { formulare, edits, source });
  },

  async sign(setId: number, signatur: string, vollmachtDocId?: number) {
    return apiPost<{ success: boolean; set: any }>(`/vde4110/sets/${setId}/sign`, { signatur, vollmachtDocId });
  },

  async generate(setId: number) {
    return apiPost<{
      success: boolean;
      documents: { type: string; filename: string; base64: string; documentId?: number }[];
    }>(`/vde4110/sets/${setId}/generate`);
  },

  getPreviewUrl(setId: number, formType: string) {
    return `${API_BASE}/vde4110/sets/${setId}/preview/${formType}`;
  },

  async send(setId: number, emailData: { to: string; subject: string; body: string; attachVollmacht?: boolean }) {
    return apiPost<{ success: boolean; messageId?: string }>(`/vde4110/sets/${setId}/send`, emailData);
  },
};

export const vdeFormularApi = {
  async getData(installationId: number | string) {
    return apiGet<{
      success: boolean;
      data: Record<string, any>;
      meta: {
        installationId: number;
        publicId: string;
        kundenName: string;
        nbEmail: string;
        nbName: string;
        hatSpeicher: boolean;
        vollmachtDoc: { id: number; name: string; url: string } | null;
      };
    }>(`/vde/${installationId}/data`);
  },

  async getSets(installationId: number) {
    return apiGet<{ success: boolean; sets: any[] }>(`/vde/${installationId}/sets`);
  },

  async createSet(installationId: number, formulare: string[], edits?: Record<string, any>) {
    return apiPost<{ success: boolean; set: any }>(`/vde/${installationId}/create`, { formulare, edits });
  },

  async updateSet(setId: number, data: { formulare?: string[]; edits?: Record<string, any> }) {
    return apiRequest<{ success: boolean; set: any }>(`/vde/sets/${setId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async sign(setId: number, signatur: string, vollmachtDocId?: number) {
    return apiPost<{ success: boolean; set: any }>(`/vde/sets/${setId}/sign`, { signatur, vollmachtDocId });
  },

  async generate(setId: number) {
    return apiPost<{
      success: boolean;
      documents: { type: string; filename: string; base64: string; documentId?: number }[];
    }>(`/vde/sets/${setId}/generate`);
  },

  getPreviewUrl(setId: number, formType: string) {
    return `${API_BASE}/vde/sets/${setId}/preview/${formType}`;
  },

  async send(setId: number, emailData: { to: string; subject: string; body: string; attachVollmacht?: boolean }) {
    return apiPost<{ success: boolean; messageId?: string }>(`/vde/sets/${setId}/send`, emailData);
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════

export const api = {
  installations: installationsApi,
  timeline: timelineApi,
  comments: commentsApi,
  documents: documentsApi,
  checklist: checklistApi,
  gridOperators: gridOperatorsApi,
  email: emailApi,
  tasks: tasksApi,
  team: teamApi,
  analytics: analyticsApi,
  produkte: produkteApi,
  vdeGenerator: vdeGeneratorApi,
  vdeFormular: vdeFormularApi,
  vde4110: vde4110Api,
  // Direct methods for legacy code
  post: apiPost,
  delete: apiDelete,
  get: apiGet,
  patch: apiPatch,
};

export default api;
