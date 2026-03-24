/**
 * Baunity PLZ Service - Deutsche Postleitzahlen
 * ==========================================
 * Schneller PLZ → Ort Lookup über Backend-API
 * Backend cached OpenPLZ-Daten permanent im Memory
 */

export interface PLZPlace {
  ort: string;
  gemeinde?: string;
  bundesland: string;
  bundeslandKurz: string;
}

export interface PLZResult {
  plz: string;
  ort: string;
  bundesland?: string;
  bundeslandKurz?: string;
  orte: PLZPlace[];
  hatMehrereOrte: boolean;
}

// Client-seitiger Cache (Session-permanent)
const plzCache: Map<string, PLZResult> = new Map();

// Backend-API Base URL
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * PLZ → Ort Lookup über Backend (mit Cache)
 */
export async function lookupPLZ(plz: string): Promise<PLZResult | null> {
  const cleanPLZ = plz.replace(/\s/g, '');
  if (!/^\d{5}$/.test(cleanPLZ)) return null;

  // Client-Cache
  if (plzCache.has(cleanPLZ)) {
    return plzCache.get(cleanPLZ)!;
  }

  try {
    const response = await fetch(`${API_BASE}/plz/${cleanPLZ}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (!data.success || !data.found) return null;

    const orte: PLZPlace[] = (data.orte || []).map((o: any) => ({
      ort: o.ort || '',
      gemeinde: o.gemeinde || '',
      bundesland: o.bundesland || '',
      bundeslandKurz: o.bundeslandKurz || '',
    }));

    const result: PLZResult = {
      plz: cleanPLZ,
      ort: data.hauptort || orte[0]?.ort || '',
      bundesland: data.bundesland || orte[0]?.bundesland,
      bundeslandKurz: data.bundeslandKurz || orte[0]?.bundeslandKurz,
      orte,
      hatMehrereOrte: data.hatMehrereOrte || orte.length > 1,
    };

    plzCache.set(cleanPLZ, result);
    return result;
  } catch (error) {
    console.error('[PLZ] Backend-Fehler, Fallback auf Zippopotam:', error);
    // Fallback: Zippopotam.us direkt
    return lookupPLZFallback(cleanPLZ);
  }
}

/**
 * Fallback: Zippopotam.us API (falls Backend nicht erreichbar)
 */
async function lookupPLZFallback(plz: string): Promise<PLZResult | null> {
  try {
    const response = await fetch(`https://api.zippopotam.us/de/${plz}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.places?.length) return null;

    const orte: PLZPlace[] = data.places.map((p: any) => ({
      ort: p['place name'] || '',
      bundesland: p['state'] || '',
      bundeslandKurz: p['state abbreviation'] || '',
    }));

    const unique = orte.filter((o, i, arr) => arr.findIndex(x => x.ort === o.ort) === i);

    const result: PLZResult = {
      plz,
      ort: unique[0].ort,
      bundesland: unique[0].bundesland,
      bundeslandKurz: unique[0].bundeslandKurz,
      orte: unique,
      hatMehrereOrte: unique.length > 1,
    };

    plzCache.set(plz, result);
    return result;
  } catch {
    return null;
  }
}

export function lookupPLZSync(plz: string): PLZResult | null {
  const cleanPLZ = plz.replace(/\s/g, '');
  return plzCache.get(cleanPLZ) || null;
}

export function isValidPLZ(plz: string): boolean {
  const cleanPLZ = plz.replace(/\s/g, '');
  if (!/^\d{5}$/.test(cleanPLZ)) return false;
  const num = parseInt(cleanPLZ, 10);
  return num >= 1000 && num <= 99999;
}

export function formatPLZ(plz: string): string {
  return plz.replace(/\s/g, '').padStart(5, '0').slice(0, 5);
}

export default { lookupPLZ, lookupPLZSync, isValidPLZ, formatPLZ };
