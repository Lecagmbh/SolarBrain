// src/admin-api/anlagen.ts
import { apiGet } from "./client";
import type { AnlageListItem, AnlageDetail, Dokument } from "./types";

export function fetchAnlagenList(): Promise<AnlageListItem[]> {
  return apiGet<AnlageListItem[]>("/api/portal/anlagen");
}

export function fetchAnlageDetail(id: number): Promise<AnlageDetail> {
  return apiGet<AnlageDetail>(`/api/portal/anlagen/${id}`);
}

export function fetchAnlageDokumente(id: number): Promise<Dokument[]> {
  return apiGet<Dokument[]>(`/api/portal/anlagen/${id}/dokumente`);
}
