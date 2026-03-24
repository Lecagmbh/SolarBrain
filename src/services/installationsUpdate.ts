import { apiPatch } from "../api/client";

export async function updateInstallation(id: number, payload: Record<string, unknown>) {
  return apiPatch(`/installations/${id}`, payload);
}
