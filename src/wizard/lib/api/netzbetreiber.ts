/**
 * Baunity Netzbetreiber API
 * =======================
 * PLZ-basiertes Lookup und bidirektionale Synchronisation
 */

import { api } from './client';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface NetzbetreiberDB {
  id: number;
  name: string;
  kurzname?: string;
  bdewCode?: string;
  email?: string;
  telefon?: string;
  website?: string;
  portalUrl?: string;
  portalHinweise?: string;
  plzBereiche?: string[]; // Parsed from JSON
  aktiv: boolean;
}

export interface NetzbetreiberLookupResult {
  confidence: 'exact' | 'multiple' | 'none';
  netzbetreiber: NetzbetreiberDB | null;
  alternatives: NetzbetreiberDB[];
  source: 'plz_mapping' | 'learned' | 'default';
}

export interface NetzbetreiberCreatePayload {
  name: string;
  kurzname?: string;
  bdewCode?: string;
  email?: string;
  telefon?: string;
  website?: string;
  portalUrl?: string;
  plzBereiche?: string[];
}

export interface PLZMappingPayload {
  netzbetreiberId: number;
  plz: string;
  source?: 'wizard' | 'admin' | 'import';
}

// ═══════════════════════════════════════════════════════════════════════════
// NETZBETREIBER API
// ═══════════════════════════════════════════════════════════════════════════

export const netzbetreiberApi = {
  /**
   * Alle Netzbetreiber laden
   */
  getAll: async (): Promise<NetzbetreiberDB[]> => {
    const response = await api.get<{ data: NetzbetreiberDB[] }>('/netzbetreiber');
    return response.data.data || [];
  },
  
  /**
   * Netzbetreiber nach ID
   */
  getById: async (id: number): Promise<NetzbetreiberDB | null> => {
    try {
      const response = await api.get<NetzbetreiberDB>(`/netzbetreiber/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },
  
  /**
   * Netzbetreiber nach PLZ suchen (mit Confidence)
   */
  getByPLZ: async (plz: string): Promise<NetzbetreiberLookupResult> => {
    try {
      const response = await api.get<NetzbetreiberLookupResult>(`/netzbetreiber/plz/${plz}`);
      return response.data;
    } catch {
      return {
        confidence: 'none',
        netzbetreiber: null,
        alternatives: [],
        source: 'default',
      };
    }
  },
  
  /**
   * Netzbetreiber suchen (Name, Ort, etc.)
   */
  search: async (query: string): Promise<NetzbetreiberDB[]> => {
    if (!query || query.length < 2) return [];
    const response = await api.get<{ data: NetzbetreiberDB[] }>(
      `/netzbetreiber/search?q=${encodeURIComponent(query)}`
    );
    return response.data.data || [];
  },
  
  /**
   * Neuen Netzbetreiber anlegen (aus Wizard)
   */
  create: async (payload: NetzbetreiberCreatePayload): Promise<NetzbetreiberDB> => {
    const response = await api.post<NetzbetreiberDB>('/netzbetreiber', payload);
    return response.data;
  },
  
  /**
   * Netzbetreiber aktualisieren
   */
  update: async (id: number, payload: Partial<NetzbetreiberCreatePayload>): Promise<NetzbetreiberDB> => {
    const response = await api.patch<NetzbetreiberDB>(`/netzbetreiber/${id}`, payload);
    return response.data;
  },
  
  /**
   * PLZ-Mapping hinzufügen (lernen)
   */
  addPLZMapping: async (payload: PLZMappingPayload): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>('/netzbetreiber/plz-mapping', payload);
    return response.data;
  },
  
  /**
   * Sync: Wizard-Eingabe mit DB abgleichen
   * - Wenn NB existiert: ID zurückgeben
   * - Wenn neu: NB anlegen und PLZ-Mapping speichern
   * 
   * HINWEIS: Diese Funktion ist OPTIONAL und nicht kritisch für den Wizard.
   * Fehler werden geloggt aber nicht weitergereicht.
   */
  syncFromWizard: async (
    name: string,
    plz: string,
    isNew: boolean
  ): Promise<{ netzbetreiberId: number; created: boolean } | null> => {
    try {
      // Erst prüfen ob NB mit diesem Namen existiert
      let searchResults: NetzbetreiberDB[] = [];
      try {
        searchResults = await netzbetreiberApi.search(name);
      } catch (searchError) {
        console.warn('[NB Sync] Search API nicht verfügbar, überspringe Sync:', searchError);
        return null; // Nicht kritisch - Wizard funktioniert auch ohne
      }
      
      const nameLower = String(name || '').toLowerCase();
      const exactMatch = searchResults.find(
        nb => String(nb.name || '').toLowerCase() === nameLower
      );
    
      if (exactMatch) {
        // Existiert -> PLZ-Mapping lernen falls neu
        if (plz) {
          await netzbetreiberApi.addPLZMapping({
            netzbetreiberId: exactMatch.id,
            plz,
            source: 'wizard',
          }).catch(() => {}); // Ignore if mapping exists
        }
        return { netzbetreiberId: exactMatch.id, created: false };
      }
    
      if (isNew) {
        // Neu anlegen
        try {
          const newNB = await netzbetreiberApi.create({
            name,
            plzBereiche: plz ? [plz] : [],
          });
          return { netzbetreiberId: newNB.id, created: true };
        } catch (createError) {
          console.warn('[NB Sync] Create API nicht verfügbar:', createError);
          return null;
        }
      }
    
      // Kein Match und nicht als neu markiert
      console.warn(`[NB Sync] Netzbetreiber "${name}" nicht gefunden, aber nicht als neu markiert`);
      return null;
      
    } catch (error) {
      console.warn('[NB Sync] Fehler (nicht kritisch):', error);
      return null;
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL FALLBACK (wenn API nicht erreichbar)
// ═══════════════════════════════════════════════════════════════════════════

// Basis-Liste der wichtigsten Netzbetreiber (Fallback)
const FALLBACK_NETZBETREIBER: Partial<NetzbetreiberDB>[] = [
  { id: 1, name: 'Netze BW GmbH', kurzname: 'Netze BW' },
  { id: 2, name: 'Westnetz GmbH', kurzname: 'Westnetz' },
  { id: 3, name: 'Bayernwerk Netz GmbH', kurzname: 'Bayernwerk' },
  { id: 4, name: 'E.DIS Netz GmbH', kurzname: 'E.DIS' },
  { id: 5, name: 'Mitteldeutsche Netzgesellschaft Strom mbH', kurzname: 'MITNETZ' },
  { id: 6, name: 'Stromnetz Hamburg GmbH', kurzname: 'SNH' },
  { id: 7, name: 'Schleswig-Holstein Netz AG', kurzname: 'SH Netz' },
  { id: 8, name: 'Avacon Netz GmbH', kurzname: 'Avacon' },
  { id: 9, name: 'EWE NETZ GmbH', kurzname: 'EWE Netz' },
  { id: 10, name: 'Enexis Netze GmbH', kurzname: 'Enexis' },
  { id: 11, name: 'Syna GmbH', kurzname: 'Syna' },
  { id: 12, name: 'bnNETZE GmbH', kurzname: 'bnNETZE' },
  { id: 13, name: 'Netze Mitteldeutschland GmbH', kurzname: 'Netze MD' },
  { id: 14, name: 'TenneT TSO GmbH', kurzname: 'TenneT' },
  { id: 15, name: '50Hertz Transmission GmbH', kurzname: '50Hertz' },
];

/**
 * Fallback-Suche wenn API nicht erreichbar
 */
export function searchNetzbetreiberLocal(query: string): Partial<NetzbetreiberDB>[] {
  const q = String(query || '').toLowerCase();
  return FALLBACK_NETZBETREIBER.filter(
    nb => String(nb.name || '').toLowerCase().includes(q) || String(nb.kurzname || '').toLowerCase().includes(q)
  );
}

export default netzbetreiberApi;
