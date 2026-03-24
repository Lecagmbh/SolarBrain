/**
 * Baunity Wizard API Client
 * Einfacher API Client für Produktdatenbank-Integration
 * Nutzt automatisch den Auth-Token aus dem Admin-Bereich
 */

import {
  AUTH_TOKEN_KEY,
  LEGACY_TOKEN_KEYS,
  WINDOW_API_URL_KEY,
  WINDOW_API_KEY,
} from '../stubs/storage';

// API Base URL - kann per Environment Variable überschrieben werden
function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const windowUrl = (window as unknown as Record<string, unknown>)[WINDOW_API_URL_KEY] as string;
    if (windowUrl) return windowUrl;
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return '/api';
}
const API_BASE = getApiBase();

// Token Keys die im Admin-Bereich verwendet werden könnten
const TOKEN_KEYS = [AUTH_TOKEN_KEY, ...LEGACY_TOKEN_KEYS];

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

/**
 * Versucht den Auth-Token aus localStorage zu holen
 */
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Versuche verschiedene Token-Keys
  for (const key of TOKEN_KEYS) {
    const token = localStorage.getItem(key);
    if (token) {
      // Prüfe ob es ein JWT-ähnlicher Token ist
      if (token.includes('.') || token.length > 20) {
        return token;
      }
    }
  }
  
  // Versuche aus einem Auth-Object zu lesen
  const authStr = localStorage.getItem('auth') || localStorage.getItem('user');
  if (authStr) {
    try {
      const auth = JSON.parse(authStr);
      if (auth.token) return auth.token;
      if (auth.accessToken) return auth.accessToken;
    } catch {}
  }
  
  return null;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  
  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
    // Automatisch Token laden beim Start
    this.token = getStoredToken();
  }
  
  setToken(token: string | null) {
    this.token = token;
  }
  
  getToken(): string | null {
    // Bei jedem Aufruf prüfen ob Token noch aktuell
    if (!this.token) {
      this.token = getStoredToken();
    }
    return this.token;
  }
  
  setBaseUrl(url: string) {
    this.baseUrl = url;
  }
  
  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Token bei jedem Request neu holen (falls zwischenzeitlich eingeloggt)
    const currentToken = this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include',
        ...options,
      });
      
      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
      
      // Bei 401 Unauthorized - Session abgelaufen
      if (response.status === 401) {
        console.warn('[API] 401 Unauthorized - Sitzung abgelaufen');
        this.token = null;

        // Nicht redirecten bei Auth-Check-Endpoints
        const isAuthCheck = endpoint.includes('/auth/');
        if (!isAuthCheck && typeof window !== 'undefined') {
          // Session abgelaufen → User informieren und zum Login schicken
          const isLoginPage = window.location.pathname.includes('/login');
          if (!isLoginPage) {
            alert('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
            window.location.href = '/app/login?expired=1';
            // Leeres Result zurückgeben um Folgefehler zu vermeiden
            return { data: null as T, status: 401 };
          }
        }
      }
      
      return {
        data: responseData,
        status: response.status,
      };
    } catch (error) {
      console.error(`API ${method} ${endpoint} failed:`, error);
      throw error;
    }
  }
  
  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  }
  
  async post<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data);
  }
  
  async patch<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data);
  }
  
  async put<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data);
  }
  
  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }
  
  // File Upload
  async uploadFile(endpoint: string, file: File, fieldName = 'file'): Promise<ApiResponse<Record<string, unknown>>> {
    const url = `${this.baseUrl}${endpoint}`;
    const formData = new FormData();
    formData.append(fieldName, file);
    
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
    
    return {
      data: await response.json(),
      status: response.status,
    };
  }
}

// Singleton instance
export const api = new ApiClient();

// Named export for compatibility
export default api;

// ═══════════════════════════════════════════════════════════════════════════
// DEBUG & TOKEN HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Debug-Funktion: Zeigt alle möglichen Tokens im localStorage
 */
export function debugTokens(): void {
  if (typeof window === 'undefined') return;
  
  console.group('[Baunity API] Token Debug');
  // Debug: display current token and localStorage keys
  
  for (const key of Object.keys(localStorage)) {
    const val = localStorage.getItem(key);
    if (val && (val.includes('.') || val.length > 50)) {
      console.log(`  ${key}:`, val.substring(0, 30) + '...');
    }
  }
  console.groupEnd();
}

/**
 * Manuell Token setzen (falls automatische Erkennung fehlschlägt)
 */
export function setApiToken(token: string): void {
  api.setToken(token);
  // Token manually set
}

/**
 * Token aus dem Admin-Auth-System holen
 * Kann vom Admin-Frontend aufgerufen werden um den Wizard zu initialisieren
 */
export function initWizardWithToken(token: string): void {
  api.setToken(token);
}

// Expose für Browser-Konsole debugging
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>)[WINDOW_API_KEY] = {
    debugTokens,
    setToken: setApiToken,
    api,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SOLAR API (PVGIS, Wirtschaftlichkeit)
// ═══════════════════════════════════════════════════════════════════════════

export interface SolarBerechnungRequest {
  lat: number;
  lng: number;
  dachflaechen: { kwp: number; neigung: number; ausrichtung: string }[];
  speicherKwh?: number;
  wallboxKw?: number;
  wpKw?: number;
  einspeiseart?: 'ueberschuss' | 'volleinspeisung';
  investition?: number;
  stromverbrauch?: number;
}

export interface SolarBerechnung {
  jahresertragKwh: number;
  monatlicheErtraege: { monat: string; kwh: number }[];
  spezifischerErtrag: number;
  eigenverbrauchAnteil: number;
  autarkiegrad: number;
  einspeisemenge: number;
  eigenverbrauchMenge: number;
  strompreisErsparnis: number;
  einspeiseverguetung: number;
  jaehrlicheErsparnis: number;
  amortisationJahre: number | null;
  rendite20Jahre: number;
  co2EinsparungKg: number;
  baeume: number;
  strompreis: number;
  eegVerguetungCtKwh: number;
  pvgisVerfuegbar: boolean;
}

export const solarApi = {
  berechnung: (data: SolarBerechnungRequest) =>
    api.post<SolarBerechnung>('/solar/berechnung', data),
  pvgis: (lat: number, lng: number, kwp: number, angle: number, aspect: string) =>
    api.get(`/solar/pvgis?lat=${lat}&lng=${lng}&kwp=${kwp}&angle=${angle}&aspect=${encodeURIComponent(aspect)}`),
  strompreis: () => api.get('/solar/strompreis'),
};

// ═══════════════════════════════════════════════════════════════════════════
// PRODUKT API HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export const produktApi = {
  // PV Module
  getPVModule: () => api.get('/produkte/pv-module'),
  createPVModul: (data: Record<string, unknown>) => api.post('/produkte/pv-module', data),
  updatePVModul: (id: number, data: Record<string, unknown>) => api.patch(`/produkte/pv-module/${id}`, data),
  deletePVModul: (id: number) => api.delete(`/produkte/pv-module/${id}`),
  
  // Wechselrichter
  getWechselrichter: () => api.get('/produkte/wechselrichter'),
  createWechselrichter: (data: Record<string, unknown>) => api.post('/produkte/wechselrichter', data),
  updateWechselrichter: (id: number, data: Record<string, unknown>) => api.patch(`/produkte/wechselrichter/${id}`, data),
  deleteWechselrichter: (id: number) => api.delete(`/produkte/wechselrichter/${id}`),
  
  // Speicher
  getSpeicher: () => api.get('/produkte/speicher'),
  createSpeicher: (data: Record<string, unknown>) => api.post('/produkte/speicher', data),
  updateSpeicher: (id: number, data: Record<string, unknown>) => api.patch(`/produkte/speicher/${id}`, data),
  deleteSpeicher: (id: number) => api.delete(`/produkte/speicher/${id}`),
  
  // Wallboxen
  getWallboxen: () => api.get('/produkte/wallboxen'),
  createWallbox: (data: Record<string, unknown>) => api.post('/produkte/wallboxen', data),
  updateWallbox: (id: number, data: Record<string, unknown>) => api.patch(`/produkte/wallboxen/${id}`, data),
  deleteWallbox: (id: number) => api.delete(`/produkte/wallboxen/${id}`),
  
  // Wärmepumpen
  getWaermepumpen: () => api.get('/produkte/waermepumpen'),
  createWaermepumpe: (data: Record<string, unknown>) => api.post('/produkte/waermepumpen', data),
  updateWaermepumpe: (id: number, data: Record<string, unknown>) => api.patch(`/produkte/waermepumpen/${id}`, data),
  deleteWaermepumpe: (id: number) => api.delete(`/produkte/waermepumpen/${id}`),
  
  // Hersteller
  getHersteller: () => api.get('/produkte/hersteller'),
  createHersteller: (data: Record<string, unknown>) => api.post('/produkte/hersteller', data),
  updateHersteller: (id: number, data: Record<string, unknown>) => api.patch(`/produkte/hersteller/${id}`, data),
  deleteHersteller: (id: number) => api.delete(`/produkte/hersteller/${id}`),
  
  // Datenblatt Upload
  uploadDatenblatt: (file: File) => api.uploadFile('/dokumente/datenblatt', file),
};

// ═══════════════════════════════════════════════════════════════════════════
// NETZBETREIBER API
// ═══════════════════════════════════════════════════════════════════════════

export const netzbetreiberApi = {
  getAll: () => api.get('/netzbetreiber'),
  getByPLZ: (plz: string) => api.get(`/netzbetreiber/plz/${plz}`),
  search: (query: string) => api.get(`/netzbetreiber/search?q=${encodeURIComponent(query)}`),
};

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD SUBMISSION API
// ═══════════════════════════════════════════════════════════════════════════

export const wizardApi = {
  submit: (data: Record<string, unknown>) => api.post('/wizard/submit', data),
  saveDraft: (data: Record<string, unknown>) => api.post('/wizard/draft', data),
  getDraft: (id: string) => api.get(`/wizard/draft/${id}`),
};
