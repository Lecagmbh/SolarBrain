import { api } from "../../../modules/api/client";
import type { CrmProjekt, PipelineStats, CrmStage, ChecklisteItem, ReadinessStatus } from "../types/crm.types";

// ── Projekte ────────────────────────────────────────────────────────
export async function fetchProjekte(params?: {
  organisationId?: number;
  stage?: CrmStage;
  search?: string;
  anlagenTyp?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.organisationId) query.set("organisationId", String(params.organisationId));
  if (params?.stage) query.set("stage", params.stage);
  if (params?.search) query.set("search", params.search);
  if (params?.anlagenTyp) query.set("anlagenTyp", params.anlagenTyp);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const { data } = await api.get(`/crm/projekte?${query}`);
  return data as { items: CrmProjekt[]; total: number; page: number; pages: number };
}

export async function fetchProjekt(id: number) {
  const { data } = await api.get(`/crm/projekte/${id}`);
  return data as CrmProjekt;
}

export async function createProjekt(body: Partial<CrmProjekt>) {
  const { data } = await api.post("/crm/projekte", body);
  return data as CrmProjekt;
}

export async function updateProjekt(id: number, body: Partial<CrmProjekt>) {
  const { data } = await api.put(`/crm/projekte/${id}`, body);
  return data as CrmProjekt;
}

export async function changeStage(id: number, stage: CrmStage) {
  const { data } = await api.post(`/crm/projekte/${id}/stage`, { stage });
  return data as CrmProjekt;
}

export async function deleteProjekt(id: number) {
  await api.delete(`/crm/projekte/${id}`);
}

// ── Pipeline ────────────────────────────────────────────────────────
export async function fetchPipelineStats(organisationId?: number) {
  const q = organisationId ? `?organisationId=${organisationId}` : "";
  const { data } = await api.get(`/crm/stats${q}`);
  return data as PipelineStats;
}

export async function fetchWiedervorlagen() {
  const { data } = await api.get("/crm/wiedervorlagen");
  return data as CrmProjekt[];
}

// ── Aktivitäten & Kommentare ────────────────────────────────────────
export async function fetchAktivitaeten(projektId: number) {
  const { data } = await api.get(`/crm/projekte/${projektId}/aktivitaeten`);
  return data;
}

export async function addAktivitaet(projektId: number, body: { typ: string; titel: string; beschreibung?: string; organisationId: number }) {
  const { data } = await api.post(`/crm/projekte/${projektId}/aktivitaeten`, body);
  return data;
}

export async function fetchKommentare(projektId: number) {
  const { data } = await api.get(`/crm/projekte/${projektId}/kommentare`);
  return data;
}

export async function addKommentar(projektId: number, body: { text: string; organisationId?: number }) {
  const { data } = await api.post(`/crm/projekte/${projektId}/kommentare`, body);
  return data;
}

// ── NB & Checkliste ─────────────────────────────────────────────────
export async function fetchCheckliste(projektId: number) {
  const { data } = await api.get(`/crm/projekte/${projektId}/checkliste`);
  return data as ChecklisteItem[];
}

export async function fetchReadiness(projektId: number) {
  const { data } = await api.get(`/crm/projekte/${projektId}/readiness`);
  return data as ReadinessStatus;
}

export async function updateChecklisteItem(itemId: number, status: string, dokumentPfad?: string) {
  const { data } = await api.put(`/crm/checkliste/${itemId}/status`, { status, dokumentPfad });
  return data;
}

export async function triggerNbAnfrage(projektId: number) {
  const { data } = await api.post(`/crm/projekte/${projektId}/trigger-nb`);
  return data;
}

// ── Zeiterfassung ───────────────────────────────────────────────────
export async function addZeiteintrag(projektId: number, body: { organisationId: number; datum: string; dauerMinuten: number; beschreibung?: string }) {
  const { data } = await api.post(`/crm/projekte/${projektId}/zeit`, body);
  return data;
}

// ── Meetings ────────────────────────────────────────────────────────
export async function fetchMeetings(organisationId: number) {
  const { data } = await api.get(`/crm/meetings?organisationId=${organisationId}`);
  return data;
}

export async function createMeeting(body: { organisationId: number; titel: string; datum: string; projektId?: number; teilnehmer?: number[] }) {
  const { data } = await api.post("/crm/meetings", body);
  return data;
}

// ── Angebote ────────────────────────────────────────────────────────
export async function fetchAngebote(params?: { organisationId?: number; projektId?: number }) {
  const query = new URLSearchParams();
  if (params?.organisationId) query.set("organisationId", String(params.organisationId));
  if (params?.projektId) query.set("projektId", String(params.projektId));
  const { data } = await api.get(`/crm/angebote?${query}`);
  return data;
}

export async function createAngebot(body: Record<string, unknown>) {
  const { data } = await api.post("/crm/angebote", body);
  return data;
}

// ── Dokumente ──────────────────────────────────────────────────────
export async function fetchDokumente(projektId: number) {
  const { data } = await api.get(`/crm/projekte/${projektId}/dokumente`);
  return data;
}

export async function uploadDokument(projektId: number, file: File, kategorie?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (kategorie) formData.append("kategorie", kategorie);
  const { data } = await api.post(`/crm/projekte/${projektId}/dokumente`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteDokument(docId: number) {
  await api.delete(`/crm/dokumente/${docId}`);
}

// ── Installation ───────────────────────────────────────────────────
export async function createInstallation(projektId: number) {
  const { data } = await api.post(`/crm/projekte/${projektId}/create-installation`);
  return data as { installationId: number; message: string };
}
