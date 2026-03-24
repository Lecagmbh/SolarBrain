/**
 * HANDELSVERTRETER CENTER API
 * API client for HV self-service and admin management
 */

import { api } from "../../../modules/api/client";
import type {
  HvProfilFormData,
  HvBenutzerFormData,
  HvFormData,
  InviteUnterHvData,
} from "../types";

// ─── HV Self-Service API ─────────────────────────────────────────────────────
export const hvCenterApi = {
  getDashboard: () =>
    api.get("/hv/dashboard").then((r) => r.data?.data || r.data),

  getProfil: () =>
    api.get("/hv/profil").then((r) => r.data?.data || r.data),

  updateProfil: (data: HvProfilFormData) =>
    api.put("/hv/profil", data).then((r) => r.data?.data || r.data),

  getKunden: (params?: Record<string, any>) =>
    api.get("/hv/kunden", { params }).then((r) => r.data),

  getProvisionen: (params?: Record<string, any>) =>
    api.get("/hv/provisionen", { params }).then((r) => r.data),

  getProvisionenStats: () =>
    api.get("/hv/provisionen/stats").then((r) => r.data?.data || r.data),

  getAuszahlungen: (params?: Record<string, any>) =>
    api.get("/hv/auszahlungen", { params }).then((r) => r.data),

  getBenutzer: () =>
    api.get("/hv/benutzer").then((r) => r.data?.data || r.data),

  createBenutzer: (data: HvBenutzerFormData) =>
    api.post("/hv/benutzer", data).then((r) => r.data),

  createDemoAccount: (data?: Record<string, any>) =>
    api.post("/hv/demo-account", data || {}).then((r) => r.data),

  // Ober-HV Team
  getTeamStats: () =>
    api.get("/hv/team-stats").then((r) => r.data?.data || r.data),

  getUnterHvs: () =>
    api.get("/hv/unter-hvs").then((r) => r.data?.data || r.data),

  createUnterHv: (data: InviteUnterHvData) =>
    api.post("/hv/unter-hvs", data).then((r) => r.data),

  updateUnterHvSatz: (id: number, weitergabeSatz: number) =>
    api.put(`/hv/unter-hvs/${id}`, { weitergabeSatz }).then((r) => r.data),

  deleteUnterHv: (id: number) =>
    api.delete(`/hv/unter-hvs/${id}`).then((r) => r.data),

  getUnterHvProvisionen: (id: number, params?: Record<string, any>) =>
    api.get(`/hv/unter-hvs/${id}/provisionen`, { params }).then((r) => r.data),

  getTeamProvisionen: (params?: Record<string, any>) =>
    api.get("/hv/team-provisionen", { params }).then((r) => r.data),
};

// ─── Admin API ───────────────────────────────────────────────────────────────
export const adminHvApi = {
  // Handelsvertreter CRUD
  getAll: (params?: Record<string, any>) =>
    api.get("/admin/hv", { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get(`/admin/hv/${id}`).then((r) => r.data?.data || r.data),

  create: (data: Partial<HvFormData>) =>
    api.post("/admin/hv", data).then((r) => r.data),

  update: (id: number, data: Partial<HvFormData>) =>
    api.put(`/admin/hv/${id}`, data).then((r) => r.data),

  deactivate: (id: number) =>
    api.delete(`/admin/hv/${id}`).then((r) => r.data),

  getKunden: (hvId: number, params?: Record<string, any>) =>
    api.get(`/admin/hv/${hvId}/kunden`, { params }).then((r) => r.data),

  getProvisionen: (hvId: number, params?: Record<string, any>) =>
    api.get(`/admin/hv/${hvId}/provisionen`, { params }).then((r) => r.data),

  getAuszahlungen: (hvId: number, params?: Record<string, any>) =>
    api.get(`/admin/hv/${hvId}/auszahlungen`, { params }).then((r) => r.data),

  // Provisionen management
  getAllProvisionen: (params?: Record<string, any>) =>
    api.get("/admin/provisionen", { params }).then((r) => r.data),

  getProvisionenStats: (params?: Record<string, any>) =>
    api.get("/admin/provisionen/summary", { params }).then((r) => r.data?.data || r.data),

  getProvision: (id: number) =>
    api.get(`/admin/provisionen/${id}`).then((r) => r.data?.data || r.data),

  batchFreigeben: (provisionIds: number[]) =>
    api.post("/admin/provisionen/batch-freigeben", { ids: provisionIds }).then((r) => r.data),

  stornoProvision: (id: number, grund?: string) =>
    api.post(`/admin/provisionen/stornieren/${id}`, { grund }).then((r) => r.data),

  // Auszahlungen management
  getAllAuszahlungen: (params?: Record<string, any>) =>
    api.get("/admin/auszahlungen", { params }).then((r) => r.data),

  createAuszahlung: (handelsvertreterId: number, provisionIds: number[]) =>
    api.post(`/admin/hv/${handelsvertreterId}/auszahlungen`, { provisionIds }).then((r) => r.data),

  getAuszahlung: (id: number) =>
    api.get(`/admin/auszahlungen/${id}`).then((r) => r.data?.data || r.data),

  exportAuszahlung: (id: number, format: "SEPA_XML" | "CSV") =>
    api.post(`/admin/auszahlungen/${id}/export`, { format }).then((r) => r.data),

  markAuszahlungPaid: (id: number, zahlungsreferenz?: string) =>
    api.post(`/admin/auszahlungen/${id}/mark-paid`, { zahlungsreferenz }).then((r) => r.data),
};
