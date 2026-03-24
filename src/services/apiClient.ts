// apiClient.ts – unified authenticated API GET/POST wrapper

import { getAccessToken } from "../modules/auth/tokenStorage";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new Error("Kein access_token vorhanden");

  const res = await fetch(`${API_BASE}/api${url}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`HTTP ${res.status}: ${message}`);
  }

  return res.json();
}

export const apiGet = <T>(url: string) => request<T>("GET", url);
export const apiPost = <T>(url: string, body: unknown) => request<T>("POST", url, body);
