import { apiDelete } from "../api/client";

export async function deleteInstallationById(id: number): Promise<void> {
  await apiDelete(`/installations/${id}`);
}
