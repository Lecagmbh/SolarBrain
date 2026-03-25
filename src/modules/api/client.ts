import axios from "axios";
import { getAccessToken } from "../auth/tokenStorage";

/**
 * Baunity API Client (Axios)
 * ===========================
 * - Cookie-basierte Auth (httpOnly)
 * - CSRF Token für mutating requests
 * - Legacy Token-Support für Migration
 */

// CSRF Token Management (sessionStorage)
const CSRF_STORAGE_KEY = 'baunity_csrf';

export function setCsrfToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
  }
}

export function getCsrfToken(): string | null {
  return sessionStorage.getItem(CSRF_STORAGE_KEY);
}

export function clearCsrfToken(): void {
  sessionStorage.removeItem(CSRF_STORAGE_KEY);
}

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,  // WICHTIG: Cookies mitsenden
});

// Request Interceptor
api.interceptors.request.use((config) => {
  // CSRF Token für mutating requests
  const method = config.method?.toUpperCase();
  if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers.set('x-csrf-token', csrfToken);
    }
  }

  // Legacy: Token aus localStorage (wird nach Migration entfernt)
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

// Guard: Nur einmal redirecten (parallele 401s vermeiden)
let isRedirecting = false;

// Response Interceptor für 401 Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // NICHT redirecten bei:
      // - Login-Seite
      // - Auth-Check Endpoints
      // - Bereits am Redirecten
      const url = error.config?.url || '';
      const isAuthCheck = url.includes('/auth/v2/me') || url.includes('/auth/v2/login') || url.includes('/auth/me') || url.includes('/auth/refresh');
      const isLoginPage = window.location.pathname.includes('/login');

      if (!isAuthCheck && !isLoginPage && !isRedirecting) {
        isRedirecting = true;
        clearCsrfToken();
        const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
        window.location.href = isCapacitor ? '/login?expired=1' : '/app/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

// Wrapper functions
export function apiGet(url: string) {
  return api.get(url).then((res) => res.data);
}

export function apiPost(url: string, data: unknown) {
  return api.post(url, data).then((res) => res.data);
}

export function apiPatch(url: string, data: unknown) {
  return api.patch(url, data).then((res) => res.data);
}

export function apiDelete(url: string) {
  return api.delete(url).then((res) => res.data);
}

// Named export für neue Module
export { api };

// Default export für alte Module
export default api;
