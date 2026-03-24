/**
 * Baunity Produkte API
 * ==================
 * API für Produktdatenbank-Zugriff
 * - PV Module
 * - Wechselrichter
 * - Speichersysteme
 * - Wallboxen
 * - Wärmepumpen
 * - Hersteller
 */

import { api } from './client';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface HerstellerDB {
  id: number;
  name: string;
  kurzname?: string;
  website?: string;
  logoUrl?: string;
  aktiv: boolean;
  usageCount: number;
  verified: boolean;
}

export interface PvModulDB {
  id: number;
  herstellerId: number;
  hersteller?: HerstellerDB;
  modell: string;
  artikelNr?: string;
  leistungWp: number;
  wirkungsgradProzent?: number;
  voc?: number;
  isc?: number;
  vmpp?: number;
  impp?: number;
  laengeMm?: number;
  breiteMm?: number;
  gewichtKg?: number;
  zelltyp?: string;
  zellenAnzahl?: number;
  bifacial?: boolean;
  produktgarantieJahre?: number;
  leistungsgarantieJahre?: number;
  datenblattUrl?: string;
  bildUrl?: string;
  usageCount: number;
  verified: boolean;
  aktiv: boolean;
}

export interface WechselrichterDB {
  id: number;
  herstellerId: number;
  hersteller?: HerstellerDB;
  modell: string;
  artikelNr?: string;
  acLeistungW: number;
  acLeistungMaxW?: number;
  phasen: number;
  dcLeistungMaxW?: number;
  dcSpannungMaxV?: number;
  mppTrackerAnzahl: number;
  stringsProTracker: number;
  hybrid: boolean;
  dreiphasig: boolean;
  notstromfaehig: boolean;
  wirkungsgradMaxProzent?: number;
  gewichtKg?: number;
  schutzartIp?: string;
  zertifikatVde4105?: boolean;
  zertifikatVdeAr4110?: boolean;
  naSchutzIntegriert?: boolean;
  zerezId?: string;
  garantieJahre?: number;
  datenblattUrl?: string;
  konformitaetserklaerungUrl?: string;
  bildUrl?: string;
  usageCount: number;
  verified: boolean;
  aktiv: boolean;
}

export interface SpeicherDB {
  id: number;
  herstellerId: number;
  hersteller?: HerstellerDB;
  modell: string;
  artikelNr?: string;
  kapazitaetBruttoKwh: number;
  kapazitaetNettoKwh?: number;
  ladeleistungMaxKw?: number;
  entladeleistungMaxKw?: number;
  batterietyp?: string;
  kopplung?: string;
  notstromfaehig?: boolean;
  ersatzstromfaehig?: boolean;
  wirkungsgradProzent?: number;
  zyklenBeiDod80?: number;
  gewichtKg?: number;
  garantieJahre?: number;
  garantieZyklen?: number;
  datenblattUrl?: string;
  bildUrl?: string;
  usageCount: number;
  verified: boolean;
  aktiv: boolean;
}

export interface WallboxDB {
  id: number;
  herstellerId: number;
  hersteller?: HerstellerDB;
  modell: string;
  artikelNr?: string;
  ladeleistungKw: number;
  phasen: number;
  steckertyp?: string;
  kabellaenge?: number;
  steuerbar14a?: boolean;
  rfidFaehig?: boolean;
  appSteuerung?: boolean;
  lastmanagement?: boolean;
  gewichtKg?: number;
  schutzartIp?: string;
  garantieJahre?: number;
  datenblattUrl?: string;
  bildUrl?: string;
  usageCount: number;
  verified: boolean;
  aktiv: boolean;
}

export interface WaermepumpeDB {
  id: number;
  herstellerId: number;
  hersteller?: HerstellerDB;
  modell: string;
  artikelNr?: string;
  nennleistungKw: number;
  maxLeistungKw?: number;
  typ: string; // Luft, Sole, Wasser
  copA7W35?: number;
  copA2W35?: number;
  scopKalt?: number;
  scopWarm?: number;
  vorlaufTempMax?: number;
  kaeltemittel?: string;
  schallleistungDb?: number;
  steuerbar14a?: boolean;
  smartgridReady?: boolean;
  gewichtKg?: number;
  garantieJahre?: number;
  datenblattUrl?: string;
  bildUrl?: string;
  usageCount: number;
  verified: boolean;
  aktiv: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUKTE API
// ═══════════════════════════════════════════════════════════════════════════

export const produkteApi = {
  // ─────────────────────────────────────────────────────────────────────────
  // HERSTELLER
  // ─────────────────────────────────────────────────────────────────────────
  
  hersteller: {
    getAll: async (): Promise<HerstellerDB[]> => {
      const response = await api.get<{ data: HerstellerDB[] }>('/produkte/hersteller');
      return response.data.data || [];
    },
    
    search: async (query: string): Promise<HerstellerDB[]> => {
      if (!query || query.length < 1) return [];
      const response = await api.get<{ data: HerstellerDB[] }>(
        `/produkte/hersteller/search?q=${encodeURIComponent(query)}`
      );
      return response.data.data || [];
    },
    
    create: async (name: string, website?: string): Promise<HerstellerDB> => {
      const response = await api.post<HerstellerDB>('/produkte/hersteller', { name, website });
      return response.data;
    },
    
    incrementUsage: async (id: number): Promise<void> => {
      await api.post(`/produkte/hersteller/${id}/usage`);
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // PV MODULE
  // ─────────────────────────────────────────────────────────────────────────
  
  pvModule: {
    getAll: async (params?: { herstellerId?: number; aktiv?: boolean }): Promise<PvModulDB[]> => {
      const query = new URLSearchParams();
      if (params?.herstellerId) query.set('herstellerId', String(params.herstellerId));
      if (params?.aktiv !== undefined) query.set('aktiv', String(params.aktiv));
      
      const response = await api.get<{ data: PvModulDB[] }>(`/produkte/pv-module?${query}`);
      return response.data.data || [];
    },
    
    search: async (query: string): Promise<PvModulDB[]> => {
      if (!query || query.length < 2) return [];
      const response = await api.get<{ data: PvModulDB[] }>(
        `/produkte/pv-module/search?q=${encodeURIComponent(query)}`
      );
      return response.data.data || [];
    },
    
    getById: async (id: number): Promise<PvModulDB | null> => {
      try {
        const response = await api.get<PvModulDB>(`/produkte/pv-module/${id}`);
        return response.data;
      } catch {
        return null;
      }
    },
    
    create: async (data: Partial<PvModulDB>): Promise<PvModulDB> => {
      const response = await api.post<PvModulDB>('/produkte/pv-module', data);
      return response.data;
    },
    
    update: async (id: number, data: Partial<PvModulDB>): Promise<PvModulDB> => {
      const response = await api.patch<PvModulDB>(`/produkte/pv-module/${id}`, data);
      return response.data;
    },
    
    incrementUsage: async (id: number): Promise<void> => {
      await api.post(`/produkte/pv-module/${id}/usage`);
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // WECHSELRICHTER
  // ─────────────────────────────────────────────────────────────────────────
  
  wechselrichter: {
    getAll: async (params?: { herstellerId?: number; hybrid?: boolean }): Promise<WechselrichterDB[]> => {
      const query = new URLSearchParams();
      if (params?.herstellerId) query.set('herstellerId', String(params.herstellerId));
      if (params?.hybrid !== undefined) query.set('hybrid', String(params.hybrid));
      
      const response = await api.get<{ data: WechselrichterDB[] }>(`/produkte/wechselrichter?${query}`);
      return response.data.data || [];
    },
    
    search: async (query: string): Promise<WechselrichterDB[]> => {
      if (!query || query.length < 2) return [];
      const response = await api.get<{ data: WechselrichterDB[] }>(
        `/produkte/wechselrichter/search?q=${encodeURIComponent(query)}`
      );
      return response.data.data || [];
    },
    
    getById: async (id: number): Promise<WechselrichterDB | null> => {
      try {
        const response = await api.get<WechselrichterDB>(`/produkte/wechselrichter/${id}`);
        return response.data;
      } catch {
        return null;
      }
    },
    
    create: async (data: Partial<WechselrichterDB>): Promise<WechselrichterDB> => {
      const response = await api.post<WechselrichterDB>('/produkte/wechselrichter', data);
      return response.data;
    },
    
    update: async (id: number, data: Partial<WechselrichterDB>): Promise<WechselrichterDB> => {
      const response = await api.patch<WechselrichterDB>(`/produkte/wechselrichter/${id}`, data);
      return response.data;
    },
    
    incrementUsage: async (id: number): Promise<void> => {
      await api.post(`/produkte/wechselrichter/${id}/usage`);
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // SPEICHER
  // ─────────────────────────────────────────────────────────────────────────
  
  speicher: {
    getAll: async (params?: { herstellerId?: number; kopplung?: string }): Promise<SpeicherDB[]> => {
      const query = new URLSearchParams();
      if (params?.herstellerId) query.set('herstellerId', String(params.herstellerId));
      if (params?.kopplung) query.set('kopplung', params.kopplung);
      
      const response = await api.get<{ data: SpeicherDB[] }>(`/produkte/speicher?${query}`);
      return response.data.data || [];
    },
    
    search: async (query: string): Promise<SpeicherDB[]> => {
      if (!query || query.length < 2) return [];
      const response = await api.get<{ data: SpeicherDB[] }>(
        `/produkte/speicher/search?q=${encodeURIComponent(query)}`
      );
      return response.data.data || [];
    },
    
    getById: async (id: number): Promise<SpeicherDB | null> => {
      try {
        const response = await api.get<SpeicherDB>(`/produkte/speicher/${id}`);
        return response.data;
      } catch {
        return null;
      }
    },
    
    create: async (data: Partial<SpeicherDB>): Promise<SpeicherDB> => {
      const response = await api.post<SpeicherDB>('/produkte/speicher', data);
      return response.data;
    },
    
    incrementUsage: async (id: number): Promise<void> => {
      await api.post(`/produkte/speicher/${id}/usage`);
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // WALLBOXEN
  // ─────────────────────────────────────────────────────────────────────────
  
  wallboxen: {
    getAll: async (): Promise<WallboxDB[]> => {
      const response = await api.get<{ data: WallboxDB[] }>('/produkte/wallboxen');
      return response.data.data || [];
    },
    
    search: async (query: string): Promise<WallboxDB[]> => {
      if (!query || query.length < 2) return [];
      const response = await api.get<{ data: WallboxDB[] }>(
        `/produkte/wallboxen/search?q=${encodeURIComponent(query)}`
      );
      return response.data.data || [];
    },
    
    create: async (data: Partial<WallboxDB>): Promise<WallboxDB> => {
      const response = await api.post<WallboxDB>('/produkte/wallboxen', data);
      return response.data;
    },
    
    incrementUsage: async (id: number): Promise<void> => {
      await api.post(`/produkte/wallboxen/${id}/usage`);
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // WÄRMEPUMPEN
  // ─────────────────────────────────────────────────────────────────────────
  
  waermepumpen: {
    getAll: async (): Promise<WaermepumpeDB[]> => {
      const response = await api.get<{ data: WaermepumpeDB[] }>('/produkte/waermepumpen');
      return response.data.data || [];
    },
    
    search: async (query: string): Promise<WaermepumpeDB[]> => {
      if (!query || query.length < 2) return [];
      const response = await api.get<{ data: WaermepumpeDB[] }>(
        `/produkte/waermepumpen/search?q=${encodeURIComponent(query)}`
      );
      return response.data.data || [];
    },
    
    create: async (data: Partial<WaermepumpeDB>): Promise<WaermepumpeDB> => {
      const response = await api.post<WaermepumpeDB>('/produkte/waermepumpen', data);
      return response.data;
    },
    
    incrementUsage: async (id: number): Promise<void> => {
      await api.post(`/produkte/waermepumpen/${id}/usage`);
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Usage Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tracked Usage für alle ausgewählten Produkte nach Wizard-Submit
 */
export async function trackProductUsage(technical: {
  pvEntries?: { productDbId?: number }[];
  inverterEntries?: { productDbId?: number }[];
  batteryEntries?: { productDbId?: number }[];
  wallboxEntries?: { productDbId?: number }[];
}): Promise<void> {
  const promises: Promise<void>[] = [];
  
  // PV Module
  technical.pvEntries?.forEach(entry => {
    if (entry.productDbId) {
      promises.push(produkteApi.pvModule.incrementUsage(entry.productDbId));
    }
  });
  
  // Wechselrichter
  technical.inverterEntries?.forEach(entry => {
    if (entry.productDbId) {
      promises.push(produkteApi.wechselrichter.incrementUsage(entry.productDbId));
    }
  });
  
  // Speicher
  technical.batteryEntries?.forEach(entry => {
    if (entry.productDbId) {
      promises.push(produkteApi.speicher.incrementUsage(entry.productDbId));
    }
  });
  
  // Wallboxen
  technical.wallboxEntries?.forEach(entry => {
    if (entry.productDbId) {
      promises.push(produkteApi.wallboxen.incrementUsage(entry.productDbId));
    }
  });
  
  await Promise.allSettled(promises);
}

// ═══════════════════════════════════════════════════════════════════════════
// KOMPATIBILITÄT API
// ═══════════════════════════════════════════════════════════════════════════

export interface KompatiblerSpeicher {
  id: number;
  hersteller: string;
  modell: string;
  kapazitaetKwh: number;
  kopplung: string | null;
  konfidenz: number;
  originalKombination?: string;
  maxAnzahl?: number;
}

export interface KompatiblerWechselrichter {
  id: number;
  hersteller: string;
  modell: string;
  leistungKw: number;
  konfidenz: number;
}

export const kompatibilitaetApi = {
  /**
   * Findet kompatible Speicher für einen Wechselrichter
   */
  getSpeicherFuerWR: async (wrId: number) => {
    type Result = {
      wechselrichter: { id: number; hersteller: string; modell: string; leistungKw: number; hybrid: boolean };
      kompatibleSpeicher: KompatiblerSpeicher[];
      anzahl: number;
    };
    try {
      const response = await api.get<Result>(`/produkte/wechselrichter/${wrId}/kompatible-speicher`);
      // KRITISCH: Bei 404/500 leere Struktur zurückgeben
      if (response.status >= 200 && response.status < 300 && response.data) {
        return response.data;
      }
      return { wechselrichter: { id: wrId, hersteller: '', modell: '', leistungKw: 0, hybrid: false }, kompatibleSpeicher: [], anzahl: 0 };
    } catch {
      return { wechselrichter: { id: wrId, hersteller: '', modell: '', leistungKw: 0, hybrid: false }, kompatibleSpeicher: [], anzahl: 0 };
    }
  },

  /**
   * Findet kompatible Wechselrichter für einen Speicher
   */
  getWRFuerSpeicher: async (speicherId: number) => {
    type Result = {
      speicher: { id: number; hersteller: string; modell: string; kapazitaetKwh: number };
      kompatibleWechselrichter: KompatiblerWechselrichter[];
      anzahl: number;
    };
    try {
      const response = await api.get<Result>(`/produkte/speicher/${speicherId}/kompatible-wechselrichter`);
      // KRITISCH: Bei 404/500 leere Struktur zurückgeben
      if (response.status >= 200 && response.status < 300 && response.data) {
        return response.data;
      }
      return { speicher: { id: speicherId, hersteller: '', modell: '', kapazitaetKwh: 0 }, kompatibleWechselrichter: [], anzahl: 0 };
    } catch {
      return { speicher: { id: speicherId, hersteller: '', modell: '', kapazitaetKwh: 0 }, kompatibleWechselrichter: [], anzahl: 0 };
    }
  },
};

export default produkteApi;
