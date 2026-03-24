import { api } from "../../../api/client";

const BASE = "/admin-api/installations";

export async function fetchInstallationDetail(id: number) {
  const res = await api.get(`${BASE}/${id}`);
  return res.data;
}

export async function patchInstallationStatus(
  id: number,
  payload: any
) {
  const res = await api.patch(`${BASE}/${id}`, payload);
  return res.data;
}
