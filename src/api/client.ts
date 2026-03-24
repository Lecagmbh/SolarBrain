// src/api/client.ts
import { getAccessToken } from "../modules/auth/tokenStorage";

// Basis-URL für die API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// Hilfsfunktion zum Bauen der URL
function buildUrl(path: string): string {
  // path z.B. "/admin-api/dashboard/summary"
  // API_BASE_URL z.B. "", "https://baunity.de", "http://127.0.0.1:8000"
  if (!API_BASE_URL) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

export async function apiGet<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = buildUrl(path);
  const token = getAccessToken();

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers || {}),
  };

  const res = await fetch(url, {
    ...init,
    method: init?.method ?? "GET",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("GET " + url + " failed: " + res.status + " - " + text);
  }

  return res.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  init?: RequestInit
): Promise<T> {
  const url = buildUrl(path);
  const token = getAccessToken();

  const headers: HeadersInit = {
    ...(body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers || {}),
  };

  const res = await fetch(url, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
    headers,
    credentials: "include",
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("POST " + url + " failed: " + res.status + " - " + text);
  }

  return res.json() as Promise<T>;
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  init?: RequestInit
): Promise<T> {
  const url = buildUrl(path);
  const token = getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers || {}),
  };

  const res = await fetch(url, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers,
    credentials: "include",
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("PATCH " + url + " failed: " + res.status + " - " + text);
  }

  return res.json() as Promise<T>;
}

export async function apiPut<T>(
  path: string,
  body: unknown,
  init?: RequestInit
): Promise<T> {
  const url = buildUrl(path);
  const token = getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers || {}),
  };

  const res = await fetch(url, {
    method: "PUT",
    body: JSON.stringify(body),
    headers,
    credentials: "include",
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("PUT " + url + " failed: " + res.status + " - " + text);
  }

  return res.json() as Promise<T>;
}

export async function apiDelete(
  path: string,
  init?: RequestInit
): Promise<void> {
  const url = buildUrl(path);
  const token = getAccessToken();

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers || {}),
  };

  const res = await fetch(url, {
    method: "DELETE",
    headers,
    credentials: "include",
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("DELETE " + url + " failed: " + res.status + " - " + text);
  }
}
