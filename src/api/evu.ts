// src/api/evu.ts
// EVU (Energieversorgungsunternehmen) / Netzbetreiber API
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from "./client";

/**
 * EVU Warning - Warnung basierend auf historischen Daten eines Netzbetreibers
 */
export interface EvuWarning {
  severity: "INFO" | "WARNING" | "CRITICAL";
  category: string;
  message: string;
  recommendation?: string;
  basedOn: string;
}

/**
 * EVU Profile - Statistiken und Erfahrungen mit einem Netzbetreiber
 */
export interface EvuProfile {
  netzbetreiberId: number;
  netzbetreiberName: string;
  totalSubmissions: number;
  successRate: number | null;
  avgProcessingDays: number | null;
  commonIssues: Record<string, number>;
  tips: Array<{ category: string; tip: string; confidence: number }>;
}

/**
 * Parameter fuer EVU Warnings Abfrage
 */
export interface EvuWarningsParams {
  kwp?: number;
  hasBattery?: boolean;
  hasWallbox?: boolean;
}

/**
 * Holt Warnungen fuer einen bestimmten Netzbetreiber
 * basierend auf historischen Daten und Erfahrungen
 */
export async function getEvuWarnings(
  evuId: number,
  params?: EvuWarningsParams
): Promise<EvuWarning[]> {
  const searchParams = new URLSearchParams();
  if (params?.kwp) searchParams.set("kwp", String(params.kwp));
  if (params?.hasBattery) searchParams.set("hasBattery", "true");
  if (params?.hasWallbox) searchParams.set("hasWallbox", "true");
  const query = searchParams.toString();

  try {
    const res = await apiGet<{ warnings: EvuWarning[] }>(
      `/api/evu/${evuId}/warnings${query ? `?${query}` : ""}`
    );
    return res.warnings || [];
  } catch (error) {
    console.error("[EVU API] Fehler beim Laden der Warnungen:", error);
    return [];
  }
}

/**
 * Holt das Profil/Statistiken eines Netzbetreibers
 */
export async function getEvuProfile(evuId: number): Promise<EvuProfile | null> {
  try {
    const res = await apiGet<{ profile: EvuProfile | null }>(`/api/evu/${evuId}/profile`);
    return res.profile;
  } catch (error) {
    console.error("[EVU API] Fehler beim Laden des Profils:", error);
    return null;
  }
}

/**
 * EVU Dashboard - Übersicht über alle Netzbetreiber
 */
export interface EvuDashboard {
  totalEvus: number;
  analyzedEvus: number;
  avgSuccessRate: number | null;
  topIssues: Array<{ category: string; count: number }>;
  evusWithLowestSuccess: Array<{ id: number; name: string; successRate: number }>;
  evusWithLongestProcessing: Array<{ id: number; name: string; avgDays: number }>;
}

/**
 * Holt das Dashboard mit Statistiken über alle Netzbetreiber
 */
export async function getEvuDashboard(): Promise<EvuDashboard> {
  const res = await apiGet<{ dashboard: EvuDashboard }>("/api/evu/dashboard");
  return res.dashboard;
}

/**
 * Analysiert alle EVUs und aktualisiert deren Profile
 */
export async function analyzeAllEvus(batchSize = 10): Promise<{ analyzed: number; errors: number }> {
  const res = await apiPost<{ analyzed: number; errors: number }>("/api/evu/analyze-all", { batchSize });
  return res;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NB Workflow Teaching API
// ═══════════════════════════════════════════════════════════════════════════════

export interface NbWorkflowData {
  // Einreichung
  einreichMethode?: string | null;
  einreichEmail?: string | null;
  einreichBetreffFormat?: string | null;
  pflichtDokumente?: string[] | null;
  genehmigungsTyp?: string | null;
  nachhakSchwelleTage?: number | null;
  eskalationSchwelleTage?: number | null;
  antwortKanal?: string | null;
  // IBN
  ibnMethode?: string | null;
  ibnImGleichenPortal?: boolean | null;
  ibnPortalUrl?: string | null;
  ibnSchritte?: string[] | null;
  ibnDokumente?: string[] | null;
  zaehlerantragFormularUrl?: string | null;
  zaehlerantragEinreichMethode?: string | null;
  zaehlerantragEinreichAdresse?: string | null;
  mastrVorIbn?: boolean | null;
  // Kommunikation
  tonalitaet?: string | null;
  anrede?: string | null;
  grussformel?: string | null;
  sprachBesonderheiten?: string[] | null;
  kontakte?: Array<{ name: string; rolle?: string; email?: string; telefon?: string; notiz?: string }> | null;
  notizen?: string | null;
}

export interface FewShotExample {
  id: number;
  typ: string;
  eingehend: string;
  analyse: string | null;
  antwort: string | null;
  rating: number | null;
  erstelltAusReview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFewShotData {
  typ: string;
  eingehend: string;
  analyse?: string;
  antwort?: string;
  rating?: number | null;
}

export async function updateNbWorkflow(nbId: number, data: NbWorkflowData): Promise<void> {
  await apiPatch(`/api/netzbetreiber/${nbId}/workflow`, data);
}

export async function getFewShotExamples(nbId: number): Promise<FewShotExample[]> {
  return apiGet<FewShotExample[]>(`/api/netzbetreiber/${nbId}/few-shot-examples`);
}

export async function createFewShotExample(nbId: number, data: CreateFewShotData): Promise<FewShotExample> {
  return apiPost<FewShotExample>(`/api/netzbetreiber/${nbId}/few-shot-examples`, data);
}

export async function updateFewShotExample(nbId: number, exId: number, data: Partial<CreateFewShotData>): Promise<FewShotExample> {
  return apiPut<FewShotExample>(`/api/netzbetreiber/${nbId}/few-shot-examples/${exId}`, data);
}

export async function deleteFewShotExample(nbId: number, exId: number): Promise<void> {
  await apiDelete(`/api/netzbetreiber/${nbId}/few-shot-examples/${exId}`);
}
