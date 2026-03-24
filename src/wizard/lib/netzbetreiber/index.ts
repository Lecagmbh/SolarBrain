/**
 * Baunity Wizard V12 - Netzbetreiber
 * ================================
 * PLZ-basierte Netzbetreiber-Erkennung
 * - Statische Fallback-Daten
 * - Dynamische Daten aus Backend/LocalStorage
 */

import type { Netzbetreiber } from '../../types/wizard.types';

// ═══════════════════════════════════════════════════════════════════════════
// STATISCHE FALLBACK-DATEN (für Offline-Betrieb)
// ═══════════════════════════════════════════════════════════════════════════

const NETZBETREIBER_FALLBACK: Netzbetreiber[] = [
  {
    id: 'bayernwerk',
    mastrNr: 'SNB900005715767',
    name: 'Bayernwerk Netz GmbH',
    ort: 'Regensburg',
    bundesland: 'Bayern',
    website: 'https://www.bayernwerk-netz.de',
    portalUrl: 'https://www.bayernwerk-netz.de/de/energie-service/anschluesse-und-netz/einspeiser.html',
    plzBereiche: ['80', '81', '82', '83', '84', '85', '86', '90', '91', '92', '93', '94', '95', '96', '97'],
  },
  {
    id: 'netze-bw',
    mastrNr: 'SNB927718824448',
    name: 'Netze BW GmbH',
    ort: 'Stuttgart',
    bundesland: 'Baden-Württemberg',
    website: 'https://www.netze-bw.de',
    portalUrl: 'https://www.netze-bw.de/einspeiser',
    plzBereiche: ['70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '88', '89'],
  },
  {
    id: 'westnetz',
    mastrNr: 'SNB911264295001',
    name: 'Westnetz GmbH',
    ort: 'Dortmund',
    bundesland: 'Nordrhein-Westfalen',
    website: 'https://www.westnetz.de',
    portalUrl: 'https://www.westnetz.de/de/energiedienstleistungen/einspeiser.html',
    plzBereiche: ['40', '41', '42', '44', '45', '46', '47', '50', '51', '52', '53', '57', '58', '59'],
  },
  {
    id: 'edis',
    mastrNr: 'SNB910979898004',
    name: 'E.DIS Netz GmbH',
    ort: 'Fürstenwalde',
    bundesland: 'Brandenburg',
    website: 'https://www.e-dis-netz.de',
    portalUrl: 'https://www.e-dis-netz.de/de/einspeiser.html',
    plzBereiche: ['10', '12', '13', '14', '15', '16', '17', '18', '19'],
  },
  {
    id: 'avacon',
    mastrNr: 'SNB932176556063',
    name: 'Avacon Netz GmbH',
    ort: 'Helmstedt',
    bundesland: 'Niedersachsen',
    website: 'https://www.avacon-netz.de',
    portalUrl: 'https://www.avacon-netz.de/de/fuer-einspeiser.html',
    plzBereiche: ['29', '30', '31', '34', '37', '38', '39'],
  },
  {
    id: 'mitnetz',
    mastrNr: 'SNB916571697917',
    name: 'Mitteldeutsche Netzgesellschaft Strom mbH',
    ort: 'Kabelsketal',
    bundesland: 'Sachsen-Anhalt',
    website: 'https://www.mitnetz-strom.de',
    portalUrl: 'https://www.mitnetz-strom.de/Einspeiser',
    plzBereiche: ['01', '02', '03', '04', '06', '07', '08', '09'],
  },
  {
    id: 'sh-netz',
    mastrNr: 'SNB909178656693',
    name: 'Schleswig-Holstein Netz AG',
    ort: 'Quickborn',
    bundesland: 'Schleswig-Holstein',
    website: 'https://www.sh-netz.com',
    portalUrl: 'https://www.sh-netz.com/de/einspeiser.html',
    plzBereiche: ['22', '23', '24', '25'],
  },
  {
    id: 'enso',
    mastrNr: 'SNB931009619219',
    name: 'ENSO Netz GmbH',
    ort: 'Dresden',
    bundesland: 'Sachsen',
    website: 'https://www.enso-netz.de',
    portalUrl: 'https://www.enso-netz.de/einspeiser',
    plzBereiche: ['01'],
  },
  {
    id: 'stromnetz-berlin',
    mastrNr: 'SNB907829706583',
    name: 'Stromnetz Berlin GmbH',
    ort: 'Berlin',
    bundesland: 'Berlin',
    website: 'https://www.stromnetz-berlin.de',
    portalUrl: 'https://www.stromnetz.berlin/einspeisen',
    plzBereiche: ['10', '12', '13', '14'],
  },
  {
    id: 'stromnetz-hamburg',
    mastrNr: 'SNB914825403098',
    name: 'Stromnetz Hamburg GmbH',
    ort: 'Hamburg',
    bundesland: 'Hamburg',
    website: 'https://www.stromnetz-hamburg.de',
    portalUrl: 'https://www.stromnetz.hamburg/einspeisen',
    plzBereiche: ['20', '21', '22'],
  },
  {
    id: 'syna',
    mastrNr: 'SNB941247829753',
    name: 'Syna GmbH',
    ort: 'Frankfurt',
    bundesland: 'Hessen',
    website: 'https://www.syna.de',
    portalUrl: 'https://www.syna.de/einspeiser',
    plzBereiche: ['60', '61', '63', '64', '65'],
  },
  {
    id: 'ewe-netz',
    mastrNr: 'SNB917384506723',
    name: 'EWE NETZ GmbH',
    ort: 'Oldenburg',
    bundesland: 'Niedersachsen',
    website: 'https://www.ewe-netz.de',
    portalUrl: 'https://www.ewe-netz.de/einspeiser',
    plzBereiche: ['26', '27', '28', '49'],
  },
  {
    id: 'enercity',
    mastrNr: 'SNB926758413290',
    name: 'enercity Netz GmbH',
    ort: 'Hannover',
    bundesland: 'Niedersachsen',
    website: 'https://www.enercity-netz.de',
    portalUrl: 'https://www.enercity-netz.de/einspeisen',
    plzBereiche: ['30', '31'],
  },
  {
    id: 'bnnetze',
    mastrNr: 'SNB929374652187',
    name: 'bnNETZE GmbH',
    ort: 'Freiburg',
    bundesland: 'Baden-Württemberg',
    website: 'https://www.bnnetze.de',
    portalUrl: 'https://www.bnnetze.de/einspeiser',
    plzBereiche: ['77', '79'],
  },
  {
    id: 'netz-suedwest',
    mastrNr: 'SNB918472659831',
    name: 'Netz Südwest GmbH',
    ort: 'Ettlingen',
    bundesland: 'Baden-Württemberg',
    website: 'https://www.netz-suedwest.de',
    portalUrl: 'https://www.netz-suedwest.de/einspeiser',
    plzBereiche: ['76'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DYNAMISCHE NETZBETREIBER AUS BACKEND/LOCALSTORAGE
// ═══════════════════════════════════════════════════════════════════════════

// Cache für dynamische Netzbetreiber
let dynamicNetzbetreiber: Netzbetreiber[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

/**
 * Lädt Netzbetreiber aus dem Netzanmeldungen-Store (LocalStorage)
 */
function loadFromNetzanmeldungenStore(): Netzbetreiber[] {
  try {
    // Versuche aus dem Netzanmeldungen-Store zu laden
    const storeData = localStorage.getItem('netzanmeldungen-store');
    if (!storeData) return [];
    
    const parsed = JSON.parse(storeData);
    const plzMappings = parsed?.state?.plzMappings || {};
    
    // Konvertiere PLZ-Mappings zu Netzbetreiber-Objekten
    const nbMap = new Map<string, { name: string; plzSet: Set<string> }>();
    
    Object.entries(plzMappings).forEach(([plz, nbName]) => {
      if (typeof nbName !== 'string') return;
      if (!nbMap.has(nbName)) {
        nbMap.set(nbName, { name: nbName, plzSet: new Set() });
      }
      nbMap.get(nbName)!.plzSet.add(plz.substring(0, 2));
    });
    
    const result: Netzbetreiber[] = [];
    nbMap.forEach((entry, name) => {
      result.push({
        id: String(name || '').toLowerCase().replace(/\s+/g, '-'),
        name,
        ort: '',
        bundesland: '',
        plzBereiche: Array.from(entry.plzSet),
      });
    });
    
    return result;
  } catch (e) {
    console.warn('Fehler beim Laden der Netzbetreiber aus Store:', e);
    return [];
  }
}

/**
 * Lädt Netzbetreiber aus der API (falls verfügbar)
 */
async function loadFromAPI(): Promise<Netzbetreiber[]> {
  try {
    // Prüfe ob wir im Browser sind und API verfügbar
    if (typeof window === 'undefined') return [];
    
    // Versuche verschiedene API-Endpoints
    const endpoints = [
      '/api/netzbetreiber',
      '/api/installations', // Fallback: Aus Installationen extrahieren
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        if (!Array.isArray(data)) continue;
        
        // Falls /api/installations, extrahiere Netzbetreiber
        if (endpoint.includes('installations')) {
          const nbMap = new Map<string, { name: string; plzSet: Set<string>; bundesland?: string }>();
          
          data.forEach((inst: Record<string, unknown>) => {
            const nbName = (inst.gridOperator || inst.netzbetreiber || inst.netzbetreiberName) as string | undefined;
            if (!nbName) return;

            const plz = String(inst.plz || inst.postalCode || '');
            
            if (!nbMap.has(nbName)) {
              nbMap.set(nbName, {
                name: nbName,
                plzSet: new Set(),
                bundesland: (inst.bundesland as string) || ''
              });
            }
            if (plz) {
              nbMap.get(nbName)!.plzSet.add(plz.substring(0, 2));
            }
          });
          
          const result: Netzbetreiber[] = [];
          nbMap.forEach((entry) => {
            result.push({
              id: String(entry.name || '').toLowerCase().replace(/\s+/g, '-'),
              name: entry.name,
              ort: '',
              bundesland: entry.bundesland || '',
              plzBereiche: Array.from(entry.plzSet),
            });
          });
          
          if (result.length > 0) {
            return result;
          }
        }
        
        // Standard /api/netzbetreiber Response
        if (!Array.isArray(data)) return [];
        return data.map((nb: Record<string, unknown>) => ({
          id: (nb.id as string) || String(nb.name || '').toLowerCase().replace(/\s+/g, '-'),
          mastrNr: (nb.mastrNr as string) || '',
          name: nb.name as string,
          ort: (nb.ort as string) || (nb.plz as string) || '',
          bundesland: (nb.bundesland as string) || '',
          website: (nb.website as string) || '',
          portalUrl: (nb.portalUrl as string) || '',
          plzBereiche: (nb.plzMappings as Array<Record<string, string>> | undefined)?.map((m) =>
            m.type === 'prefix' ? m.prefix : m.value?.substring(0, 2)
          ).filter(Boolean) || (nb.plzBereiche as string[]) || [],
        }));
      } catch (e) {
        console.warn(`[Netzbetreiber] API ${endpoint} failed:`, e);
        continue;
      }
    }
    
    return [];
  } catch (e) {
    // API nicht verfügbar - ignorieren
    console.warn('[Netzbetreiber] All APIs failed');
    return [];
  }
}

/**
 * Holt alle Netzbetreiber (dynamisch + statisch)
 */
export async function fetchNetzbetreiber(): Promise<Netzbetreiber[]> {
  const now = Date.now();
  
  // Cache noch gültig?
  if (dynamicNetzbetreiber.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
    return [...dynamicNetzbetreiber, ...NETZBETREIBER_FALLBACK];
  }
  
  // Versuche dynamische Daten zu laden
  const fromStore = loadFromNetzanmeldungenStore();
  const fromAPI = await loadFromAPI();
  
  // Merge und deduplizieren
  const allDynamic = [...fromAPI, ...fromStore];
  const seen = new Set<string>();
  dynamicNetzbetreiber = allDynamic.filter(nb => {
    const key = String(nb.name || '').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  lastFetchTime = now;

  // Dynamische Daten haben Priorität, dann Fallback
  return [...dynamicNetzbetreiber, ...NETZBETREIBER_FALLBACK.filter(fb =>
    !seen.has(String(fb.name || '').toLowerCase())
  )];
}

/**
 * Synchrone Version - verwendet Cache oder Fallback
 */
export function getAllNetzbetreiber(): Netzbetreiber[] {
  if (dynamicNetzbetreiber.length > 0) {
    const seen = new Set(dynamicNetzbetreiber.map(nb => String(nb.name || '').toLowerCase()));
    return [...dynamicNetzbetreiber, ...NETZBETREIBER_FALLBACK.filter(fb =>
      !seen.has(String(fb.name || '').toLowerCase())
    )];
  }

  // Versuche synchron aus Store zu laden
  const fromStore = loadFromNetzanmeldungenStore();
  if (fromStore.length > 0) {
    dynamicNetzbetreiber = fromStore;
    const seen = new Set(fromStore.map(nb => String(nb.name || '').toLowerCase()));
    return [...fromStore, ...NETZBETREIBER_FALLBACK.filter(fb =>
      !seen.has(String(fb.name || '').toLowerCase())
    )];
  }

  return NETZBETREIBER_FALLBACK;
}

// Legacy export für Kompatibilität
export const NETZBETREIBER = NETZBETREIBER_FALLBACK;

// ═══════════════════════════════════════════════════════════════════════════
// SUCH-FUNKTIONEN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Findet Netzbetreiber basierend auf PLZ
 */
export function findNetzbetreiberByPLZ(plz: string): Netzbetreiber[] {
  if (!plz || plz.length < 2) return [];
  const prefix2 = plz.substring(0, 2);
  const allNB = getAllNetzbetreiber();
  return allNB.filter(nb => nb.plzBereiche?.includes(prefix2));
}

/**
 * Findet den wahrscheinlichsten Netzbetreiber mit Confidence
 */
export function getPrimaryNetzbetreiber(plz: string): Netzbetreiber | null {
  const matches = findNetzbetreiberByPLZ(plz);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Ermittelt Netzbetreiber mit Confidence-Level
 */
export function getNetzbetreiberWithConfidence(plz: string): {
  netzbetreiber: Netzbetreiber | null;
  confidence: 'exact' | 'likely' | 'multiple' | 'none';
  alternatives: Netzbetreiber[];
  message: string;
} {
  if (!plz || plz.length < 5) {
    return { netzbetreiber: null, confidence: 'none', alternatives: [], message: 'PLZ unvollständig' };
  }
  
  const prefix2 = plz.substring(0, 2);
  const allNB = getAllNetzbetreiber();
  const matches = allNB.filter(nb => nb.plzBereiche?.includes(prefix2));
  
  if (matches.length === 0) {
    return { 
      netzbetreiber: null, 
      confidence: 'none', 
      alternatives: allNB.slice(0, 5), 
      message: 'Kein Netzbetreiber für diese PLZ gefunden' 
    };
  }
  
  if (matches.length === 1) {
    return { 
      netzbetreiber: matches[0], 
      confidence: 'exact', 
      alternatives: [], 
      message: `${matches[0].name} ist für PLZ ${plz} zuständig` 
    };
  }
  
  return { 
    netzbetreiber: matches[0], 
    confidence: 'multiple', 
    alternatives: matches.slice(1), 
    message: `Mehrere mögliche Netzbetreiber für PLZ ${plz}` 
  };
}

/**
 * Sucht Netzbetreiber nach Name
 */
export function searchNetzbetreiber(query: string): Netzbetreiber[] {
  const q = String(query || '').toLowerCase();
  const allNB = getAllNetzbetreiber();
  return allNB.filter(nb =>
    String(nb.name || '').toLowerCase().includes(q) ||
    String(nb.ort || '').toLowerCase().includes(q) ||
    String(nb.bundesland || '').toLowerCase().includes(q)
  );
}
