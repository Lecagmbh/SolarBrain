/**
 * Baunity WIZARD API CLIENT - HARMONISIERT
 * ======================================
 * Synchronisiert mit:
 * - Netzbetreiber-Seite (über localStorage 'netzbetreiber-data')
 * - ProduktDB (über /produkte/* API)
 * - DokumentenCenter (über localStorage 'wizard-store')
 * - Netzanmeldungen (über /installations/* API)
 */

// ═══════════════════════════════════════════════════════════════════════════
// BASE API
// ═══════════════════════════════════════════════════════════════════════════

const API_BASE = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '/api';

async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }
  
  return res.json();
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint),
  post: <T>(endpoint: string, data: any) => apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data: any) => apiRequest<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

// ═══════════════════════════════════════════════════════════════════════════
// NETZBETREIBER API - OHNE SUCHE (nur localStorage)
// ═══════════════════════════════════════════════════════════════════════════

export interface NetzbetreiberData {
  id: string;
  name: string;
  bundesland?: string;
  plz?: string;
  ort?: string;
  plzMappings?: PLZMapping[];
  activeCount?: number;
}

export interface PLZMapping {
  id: string;
  type: 'single' | 'range' | 'prefix';
  value: string;
  von?: string;
  bis?: string;
  prefix?: string;
  netzbetreiberId: string;
}

/**
 * Lade Netzbetreiber aus localStorage (von Netzbetreiber-Seite synchronisiert)
 * WICHTIG: Die Netzbetreiber-Seite speichert unter 'netzbetreiber-data'
 */
export function loadNetzbetreiberFromLocalStorage(): NetzbetreiberData[] {
  try {
    const stored = localStorage.getItem('netzbetreiber-data');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Netzbetreiber loaded from localStorage
        return parsed;
      }
    }
  } catch (e) {
    console.error('[Wizard API] Fehler beim Laden der Netzbetreiber:', e);
  }
  console.warn('[Wizard API] Keine Netzbetreiber in localStorage. Bitte Netzbetreiber-Seite öffnen.');
  return [];
}

/**
 * Finde Netzbetreiber für eine PLZ (lokale Suche)
 */
export function findNetzbetreiberByPLZ(plz: string): NetzbetreiberData | null {
  const netzbetreiber = loadNetzbetreiberFromLocalStorage();
  
  for (const nb of netzbetreiber) {
    if (nb.plzMappings) {
      for (const mapping of nb.plzMappings) {
        if (matchesPLZ(plz, mapping)) {
          return nb;
        }
      }
    }
  }
  
  return null;
}

function matchesPLZ(plz: string, mapping: PLZMapping): boolean {
  switch (mapping.type) {
    case 'single':
      return plz === mapping.value;
    case 'prefix':
      return plz.startsWith(mapping.prefix || mapping.value.replace('*', ''));
    case 'range':
      const num = parseInt(plz);
      const von = parseInt(mapping.von || '0');
      const bis = parseInt(mapping.bis || '99999');
      return num >= von && num <= bis;
    default:
      return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUKTE API - Für ProduktAutocomplete
// ═══════════════════════════════════════════════════════════════════════════

export interface ProduktHersteller {
  id: number;
  name: string;
  kurzname?: string;
}

export interface ProduktBase {
  id: number;
  herstellerId: number;
  hersteller?: ProduktHersteller;
  modell: string;
  aktiv: boolean;
  verified: boolean;
  datenblattUrl?: string;
  datenblattPfad?: string;
}

export interface PVModul extends ProduktBase {
  leistungWp: number;
  zellentyp?: string;
  laengeM?: number;
  breiteM?: number;
}

export interface Wechselrichter extends ProduktBase {
  acLeistungW: number;
  hybrid: boolean;
  phasen: number;
  dcEingaenge?: number;
  mpptAnzahl?: number;
}

export interface Speicher extends ProduktBase {
  kapazitaetBruttoKwh: number;
  kapazitaetNettoKwh?: number;
  ladeleistungMaxKw?: number;
  kopplung?: 'ac' | 'dc';
}

export interface Wallbox extends ProduktBase {
  ladeleistungKw: number;
  steuerbar14a: boolean;
  phasen?: number;
}

export interface Waermepumpe extends ProduktBase {
  heizleistungKw: number;
  steuerbar14a: boolean;
  typ?: string;
}

export const produkteApi = {
  // Hersteller
  getHersteller: () => api.get<ProduktHersteller[]>('/produkte/hersteller'),
  
  // PV-Module
  getPVModule: () => api.get<PVModul[]>('/produkte/pv-module'),
  searchPVModule: async (query: string): Promise<PVModul[]> => {
    const all = await produkteApi.getPVModule();
    const q = String(query || '').toLowerCase();
    return all.filter(p =>
      String(p.modell || '').toLowerCase().includes(q) ||
      String(p.hersteller?.name || '').toLowerCase().includes(q)
    );
  },

  // Wechselrichter
  getWechselrichter: () => api.get<Wechselrichter[]>('/produkte/wechselrichter'),
  searchWechselrichter: async (query: string): Promise<Wechselrichter[]> => {
    const all = await produkteApi.getWechselrichter();
    const q = String(query || '').toLowerCase();
    return all.filter(p =>
      String(p.modell || '').toLowerCase().includes(q) ||
      String(p.hersteller?.name || '').toLowerCase().includes(q)
    );
  },

  // Speicher
  getSpeicher: () => api.get<Speicher[]>('/produkte/speicher'),
  searchSpeicher: async (query: string): Promise<Speicher[]> => {
    const all = await produkteApi.getSpeicher();
    const q = String(query || '').toLowerCase();
    return all.filter(p =>
      String(p.modell || '').toLowerCase().includes(q) ||
      String(p.hersteller?.name || '').toLowerCase().includes(q)
    );
  },

  // Wallboxen
  getWallboxen: () => api.get<Wallbox[]>('/produkte/wallboxen'),
  searchWallboxen: async (query: string): Promise<Wallbox[]> => {
    const all = await produkteApi.getWallboxen();
    const q = String(query || '').toLowerCase();
    return all.filter(p =>
      String(p.modell || '').toLowerCase().includes(q) ||
      String(p.hersteller?.name || '').toLowerCase().includes(q)
    );
  },
  
  // Wärmepumpen
  getWaermepumpen: () => api.get<Waermepumpe[]>('/produkte/waermepumpen'),
  searchWaermepumpen: async (query: string): Promise<Waermepumpe[]> => {
    const all = await produkteApi.getWaermepumpen();
    const q = String(query || '').toLowerCase();
    return all.filter(p =>
      String(p.modell || '').toLowerCase().includes(q) ||
      String(p.hersteller?.name || '').toLowerCase().includes(q)
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD SUBMIT API
// ═══════════════════════════════════════════════════════════════════════════

export interface WizardSubmitResult {
  success: boolean;
  publicId?: string;
  installationId?: number;
  error?: string;
}

export const wizardApi = {
  /**
   * Wizard-Daten einreichen → Neue Installation erstellen
   */
  submit: async (wizardData: any): Promise<WizardSubmitResult> => {
    try {
      const result = await api.post<{ 
        success: boolean; 
        publicId?: string;
        data?: { id: number; publicId: string };
      }>('/wizard/submit', wizardData);
      
      return {
        success: result.success,
        publicId: result.publicId || result.data?.publicId,
        installationId: result.data?.id,
      };
    } catch (error: any) {
      console.error('[Wizard API] Submit failed:', error);
      return {
        success: false,
        error: error.message || 'Unbekannter Fehler',
      };
    }
  },
  
  /**
   * Installation mit Wizard-Daten aktualisieren
   */
  update: async (installationId: number, wizardData: any): Promise<WizardSubmitResult> => {
    try {
      const result = await api.patch<{ success: boolean }>(`/installations/${installationId}/wizard`, wizardData);
      return { success: result.success };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DOKUMENTE API - Für DokumentenCenter Sync
// ═══════════════════════════════════════════════════════════════════════════

export interface DokumentUpload {
  installationId: number;
  kategorie: string;
  dokumentTyp: string;
  file: File;
}

export const dokumenteApi = {
  /**
   * Dokument hochladen
   */
  upload: async (data: DokumentUpload): Promise<{ success: boolean; documentId?: number }> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('kategorie', data.kategorie);
    formData.append('dokumentTyp', data.dokumentTyp);
    
    const res = await fetch(`${API_BASE}/installations/${data.installationId}/documents`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status}`);
    }
    
    return res.json();
  },
  
  /**
   * Dokumente einer Installation abrufen
   */
  getByInstallation: async (installationId: number) => {
    return api.get<any[]>(`/installations/${installationId}/documents`);
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER - LocalStorage Keys
// ═══════════════════════════════════════════════════════════════════════════

export const STORAGE_KEYS = {
  WIZARD_DATA: 'wizard-store',
  NETZBETREIBER: 'netzbetreiber-data',
  PLZ_MAPPINGS: 'plz-mappings',
  CACHED_PRODUCTS: 'wizard-products-cache',
};

/**
 * Wizard-Daten für DokumentenCenter zugänglich machen
 * Wird automatisch vom Zustand gespeichert
 */
export function getWizardDocumentsForDokumentenCenter(): any[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WIZARD_DATA);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.data?.step7?.dokumente || [];
    }
  } catch (e) {
    console.error('[Wizard API] Fehler beim Lesen der Wizard-Dokumente:', e);
  }
  return [];
}

export default {
  api,
  produkteApi,
  wizardApi,
  dokumenteApi,
  loadNetzbetreiberFromLocalStorage,
  findNetzbetreiberByPLZ,
  getWizardDocumentsForDokumentenCenter,
  STORAGE_KEYS,
};
