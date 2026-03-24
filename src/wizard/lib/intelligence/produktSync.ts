/**
 * Baunity Intelligence - Produkt-Synchronisation
 * Bidirektionale Synchronisation zwischen Wizard und Produktdatenbank
 * 
 * Features:
 * - Wizard → DB: Unbekannte Produkte automatisch anlegen
 * - DB → Wizard: Autocomplete mit existierenden Produkten
 * - Datenblätter automatisch verknüpfen
 */

// API Client würde in Produktion importiert werden
// import api from '@/lib/api/client';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ProduktTyp = 'pvModule' | 'wechselrichter' | 'speicher' | 'wallboxen' | 'waermepumpen';

export interface Hersteller {
  id: number;
  name: string;
  kurzname?: string;
  website?: string;
  aktiv: boolean;
  verified: boolean;
}

export interface ProduktBase {
  id?: number;
  herstellerId: number;
  hersteller?: Hersteller;
  modell: string;
  artikelNr?: string;
  datenblattUrl?: string;
  datenblattPfad?: string;
  verified?: boolean;
  aktiv?: boolean;
}

export interface PVModul extends ProduktBase {
  leistungWp: number;
  wirkungsgradProzent?: number;
  zelltyp?: string;
  bifacial?: boolean;
  vocV?: number;
  vmppV?: number;
  iscA?: number;
  imppA?: number;
  tempKoeffPmaxProzent?: number;
  tempKoeffVocProzent?: number;
}

export interface Wechselrichter extends ProduktBase {
  acLeistungW: number;
  scheinleistungVa?: number;
  phasen: number;
  mppTrackerAnzahl?: number;
  zerezId?: string;
  dcMaxV?: number;
  mppSpannungMinV?: number;
  mppSpannungMaxV?: number;
  dcStromMaxA?: number;
  hybrid?: boolean;
  notstromfaehig?: boolean;
  wirkungsgradMaxProzent?: number;
}

export interface Speicher extends ProduktBase {
  kapazitaetBruttoKwh: number;
  kapazitaetNettoKwh?: number;
  batterietyp?: string;
  ladeleistungMaxKw?: number;
  entladeleistungMaxKw?: number;
  notstromfaehig?: boolean;
  ersatzstromfaehig?: boolean;
  modular?: boolean;
}

export interface Wallbox extends ProduktBase {
  ladeleistungKw: number;
  phasen: number;
  steckertyp?: string;
  steuerbar14a?: boolean;
  rfidLeser?: boolean;
  appSteuerung?: boolean;
}

export interface Waermepumpe extends ProduktBase {
  heizleistungKw: number;
  waermequelle?: string;
  copA7W35?: number;
  steuerbar14a?: boolean;
  sgReady?: boolean;
  bafaGefoerdert?: boolean;
}

export type Produkt = PVModul | Wechselrichter | Speicher | Wallbox | Waermepumpe;

export interface SuchErgebnis {
  typ: ProduktTyp;
  produkt: Produkt;
  matchScore: number;
  matchedFields: string[];
}

export interface SyncResult {
  action: 'found' | 'created' | 'updated' | 'error';
  produkt?: Produkt;
  message: string;
}

/** API client interface for product sync operations */
interface ApiClient {
  get(url: string): Promise<{ data: unknown }>;
  post(url: string, data?: unknown, config?: Record<string, unknown>): Promise<{ data: Record<string, unknown> }>;
  patch(url: string, data?: unknown): Promise<{ data: Record<string, unknown> }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUKT-CACHE (In-Memory für schnelle Suche)
// ═══════════════════════════════════════════════════════════════════════════

class ProduktCache {
  private cache: Record<ProduktTyp, Produkt[]> = {
    pvModule: [],
    wechselrichter: [],
    speicher: [],
    wallboxen: [],
    waermepumpen: [],
  };
  private hersteller: Hersteller[] = [];
  private lastUpdate: number = 0;
  private cacheMaxAge = 5 * 60 * 1000; // 5 Minuten
  
  async refresh(api: ApiClient): Promise<void> {
    try {
      const [pv, wr, sp, wb, wp, h] = await Promise.all([
        api.get('/produkte/pv-module').catch(() => ({ data: [] })),
        api.get('/produkte/wechselrichter').catch(() => ({ data: [] })),
        api.get('/produkte/speicher').catch(() => ({ data: [] })),
        api.get('/produkte/wallboxen').catch(() => ({ data: [] })),
        api.get('/produkte/waermepumpen').catch(() => ({ data: [] })),
        api.get('/produkte/hersteller').catch(() => ({ data: [] })),
      ]);
      
      this.cache.pvModule = Array.isArray(pv.data) ? pv.data : [];
      this.cache.wechselrichter = Array.isArray(wr.data) ? wr.data : [];
      this.cache.speicher = Array.isArray(sp.data) ? sp.data : [];
      this.cache.wallboxen = Array.isArray(wb.data) ? wb.data : [];
      this.cache.waermepumpen = Array.isArray(wp.data) ? wp.data : [];
      this.hersteller = Array.isArray(h.data) ? h.data : [];
      this.lastUpdate = Date.now();
    } catch (err) {
      console.error('ProduktCache refresh error:', err);
    }
  }
  
  isStale(): boolean {
    return Date.now() - this.lastUpdate > this.cacheMaxAge;
  }
  
  get(typ: ProduktTyp): Produkt[] {
    return this.cache[typ];
  }
  
  getHersteller(): Hersteller[] {
    return this.hersteller;
  }
  
  add(typ: ProduktTyp, produkt: Produkt): void {
    this.cache[typ].push(produkt);
  }
  
  update(typ: ProduktTyp, id: number, updates: Partial<Produkt>): void {
    const idx = this.cache[typ].findIndex(p => p.id === id);
    if (idx >= 0) {
      this.cache[typ][idx] = { ...this.cache[typ][idx], ...updates };
    }
  }
}

export const produktCache = new ProduktCache();

// ═══════════════════════════════════════════════════════════════════════════
// AUTOCOMPLETE SUCHE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sucht Produkte für Autocomplete
 */
export function sucheProdukte(
  typ: ProduktTyp,
  query: string,
  maxResults: number = 10
): SuchErgebnis[] {
  if (!query || query.length < 2) return [];

  const produkte = produktCache.get(typ);
  const queryLower = String(query || '').toLowerCase().trim();
  const queryParts = queryLower.split(/\s+/);
  
  const ergebnisse: SuchErgebnis[] = [];
  
  for (const produkt of produkte) {
    let score = 0;
    const matched: string[] = [];
    
    // Hersteller Match
    const herstellerName = produkt.hersteller?.name?.toLowerCase() || '';
    if (herstellerName.includes(queryLower)) {
      score += 30;
      matched.push('hersteller');
    } else if (queryParts.some(p => herstellerName.includes(p))) {
      score += 15;
      matched.push('hersteller');
    }
    
    // Modell Match (wichtigster)
    const modell = produkt.modell?.toLowerCase() || '';
    if (modell === queryLower) {
      score += 100;
      matched.push('modell');
    } else if (modell.startsWith(queryLower)) {
      score += 60;
      matched.push('modell');
    } else if (modell.includes(queryLower)) {
      score += 40;
      matched.push('modell');
    } else if (queryParts.every(p => modell.includes(p))) {
      score += 30;
      matched.push('modell');
    }
    
    // Artikel-Nr Match
    const artikelNr = produkt.artikelNr?.toLowerCase() || '';
    if (artikelNr && artikelNr.includes(queryLower)) {
      score += 50;
      matched.push('artikelNr');
    }
    
    // Verified Bonus
    if (produkt.verified) {
      score += 5;
    }
    
    // Mit Datenblatt Bonus
    if (produkt.datenblattUrl) {
      score += 3;
    }
    
    if (score > 0) {
      ergebnisse.push({
        typ,
        produkt,
        matchScore: score,
        matchedFields: matched,
      });
    }
  }
  
  // Sortieren nach Score, dann nach Modell
  ergebnisse.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return (a.produkt.modell || '').localeCompare(b.produkt.modell || '');
  });
  
  return ergebnisse.slice(0, maxResults);
}

/**
 * Sucht Hersteller für Autocomplete
 */
export function sucheHersteller(query: string, maxResults: number = 10): Hersteller[] {
  if (!query || query.length < 1) return produktCache.getHersteller().slice(0, maxResults);

  const queryLower = String(query || '').toLowerCase().trim();
  const hersteller = produktCache.getHersteller();

  return hersteller
    .filter(h =>
      String(h.name || '').toLowerCase().includes(queryLower) ||
      (h.kurzname && String(h.kurzname || '').toLowerCase().includes(queryLower))
    )
    .sort((a, b) => {
      const aStart = String(a.name || '').toLowerCase().startsWith(queryLower);
      const bStart = String(b.name || '').toLowerCase().startsWith(queryLower);
      if (aStart && !bStart) return -1;
      if (!aStart && bStart) return 1;
      return String(a.name || '').localeCompare(String(b.name || ''));
    })
    .slice(0, maxResults);
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUKT MATCHING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Findet exaktes Produkt-Match
 */
export function findeExaktesProdukt(
  typ: ProduktTyp,
  hersteller: string,
  modell: string
): Produkt | null {
  const produkte = produktCache.get(typ);
  const herstellerLower = String(hersteller || '').toLowerCase().trim();
  const modellLower = String(modell || '').toLowerCase().trim();
  
  return produkte.find(p => {
    const pHersteller = p.hersteller?.name?.toLowerCase() || '';
    const pModell = p.modell?.toLowerCase() || '';
    return pHersteller === herstellerLower && pModell === modellLower;
  }) || null;
}

/**
 * Findet ähnliches Produkt (Fuzzy Match)
 */
export function findeAehnlichesProdukt(
  typ: ProduktTyp,
  hersteller: string,
  modell: string,
  schwellwert: number = 70
): Produkt | null {
  const produkte = produktCache.get(typ);
  const herstellerLower = String(hersteller || '').toLowerCase().trim();
  const modellLower = String(modell || '').toLowerCase().trim();
  
  let bestMatch: Produkt | null = null;
  let bestScore = 0;
  
  for (const p of produkte) {
    const pHersteller = p.hersteller?.name?.toLowerCase() || '';
    const pModell = p.modell?.toLowerCase() || '';
    
    // Hersteller muss passen
    if (!pHersteller.includes(herstellerLower) && !herstellerLower.includes(pHersteller)) {
      continue;
    }
    
    // Modell-Ähnlichkeit berechnen
    const score = berechneAehnlichkeit(modellLower, pModell);
    
    if (score > bestScore && score >= schwellwert) {
      bestScore = score;
      bestMatch = p;
    }
  }
  
  return bestMatch;
}

/**
 * Berechnet String-Ähnlichkeit (Levenshtein-basiert)
 */
function berechneAehnlichkeit(s1: string, s2: string): number {
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;
  
  // Längeres String als Basis
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  // Einfache Enthaltens-Prüfung
  if (longer.includes(shorter)) {
    return Math.round((shorter.length / longer.length) * 100);
  }
  
  // Wort-Match
  const words1 = s1.split(/[\s\-_]+/);
  const words2 = s2.split(/[\s\-_]+/);
  let matchedWords = 0;
  for (const w1 of words1) {
    if (words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))) {
      matchedWords++;
    }
  }
  if (matchedWords > 0) {
    return Math.round((matchedWords / Math.max(words1.length, words2.length)) * 100);
  }
  
  return 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC LOGIK: WIZARD → DB
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Synchronisiert Produkt aus Wizard mit DB
 * - Existiert → Gibt existierendes zurück (ggf. mit Update)
 * - Existiert nicht → Legt neues an
 */
export async function syncProduktZuDB(
  api: ApiClient,
  typ: ProduktTyp,
  daten: Partial<Produkt>,
  datenblattFile?: File
): Promise<SyncResult> {
  try {
    // 1. Hersteller prüfen/anlegen
    let herstellerId = daten.herstellerId;
    if (!herstellerId && daten.hersteller?.name) {
      herstellerId = (await getOrCreateHersteller(api, daten.hersteller.name)) ?? undefined;
    }
    if (!herstellerId) {
      return { action: 'error', message: 'Kein Hersteller angegeben' };
    }
    
    // 2. Prüfen ob Produkt existiert
    const existierend = findeExaktesProdukt(
      typ,
      daten.hersteller?.name || '',
      daten.modell || ''
    );
    
    const endpoint = typ === 'pvModule' ? 'pv-module' : typ;
    
    if (existierend) {
      // Produkt existiert - ggf. Datenblatt ergänzen
      if (datenblattFile && !existierend.datenblattUrl) {
        const datenblattUrl = await uploadDatenblatt(api, datenblattFile);
        await api.patch(`/produkte/${endpoint}/${existierend.id}`, { datenblattUrl });
        produktCache.update(typ, existierend.id!, { datenblattUrl });
        return {
          action: 'updated',
          produkt: { ...existierend, datenblattUrl },
          message: `Datenblatt zu "${existierend.modell}" hinzugefügt`
        };
      }
      
      return {
        action: 'found',
        produkt: existierend,
        message: `Produkt "${existierend.modell}" gefunden`
      };
    }
    
    // 3. Neues Produkt anlegen
    let datenblattUrl: string | undefined;
    if (datenblattFile) {
      datenblattUrl = await uploadDatenblatt(api, datenblattFile);
    }
    
    const neuesProdukt = {
      ...daten,
      herstellerId,
      datenblattUrl,
      verified: false,
      aktiv: true,
    };
    
    const res = await api.post(`/produkte/${endpoint}`, neuesProdukt);
    const created = res.data as unknown as Produkt;

    produktCache.add(typ, created);

    return {
      action: 'created',
      produkt: created,
      message: `Produkt "${created.modell}" angelegt`
    };
    
  } catch (err) {
    console.error('syncProduktZuDB error:', err);
    return { action: 'error', message: 'Fehler beim Synchronisieren' };
  }
}

/**
 * Hersteller anlegen wenn nicht existiert
 */
async function getOrCreateHersteller(api: ApiClient, name: string): Promise<number | null> {
  const hersteller = produktCache.getHersteller();
  const existierend = hersteller.find(h =>
    String(h.name || '').toLowerCase() === String(name || '').toLowerCase()
  );
  
  if (existierend) return existierend.id;
  
  try {
    const res = await api.post('/produkte/hersteller', {
      name,
      aktiv: true,
      verified: false,
    });
    return (res.data as { id: number }).id;
  } catch {
    return null;
  }
}

/**
 * Datenblatt hochladen
 */
async function uploadDatenblatt(api: ApiClient, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await api.post('/dokumente/datenblatt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return (res.data as { url: string }).url;
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC LOGIK: DB → WIZARD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lädt Produktdaten aus DB für Wizard-Vorausfüllung
 */
export function ladeProduktFuerWizard(
  typ: ProduktTyp,
  produktId: number
): Produkt | null {
  const produkte = produktCache.get(typ);
  return produkte.find(p => p.id === produktId) || null;
}

/**
 * Konvertiert DB-Produkt zu Wizard-Format
 */
export function produktZuWizardFormat(typ: ProduktTyp, produkt: Produkt): Record<string, unknown> {
  const base = {
    hersteller: produkt.hersteller?.name || '',
    modell: produkt.modell,
    artikelNr: produkt.artikelNr,
    datenblattUrl: produkt.datenblattUrl,
    _produktId: produkt.id, // Referenz zur DB
  };
  
  switch (typ) {
    case 'pvModule': {
      const pv = produkt as PVModul;
      return {
        ...base,
        leistungWp: pv.leistungWp,
        wirkungsgradProzent: pv.wirkungsgradProzent,
        zelltyp: pv.zelltyp,
        // Für Kompatibilitäts-Engine
        voc: pv.vocV,
        vmpp: pv.vmppV,
        isc: pv.iscA,
        impp: pv.imppA,
        tempKoeffVoc: pv.tempKoeffVocProzent ? pv.tempKoeffVocProzent / 100 : undefined,
      };
    }
    
    case 'wechselrichter': {
      const wr = produkt as Wechselrichter;
      return {
        ...base,
        leistungKva: wr.scheinleistungVa ? wr.scheinleistungVa / 1000 : wr.acLeistungW / 1000,
        acLeistungW: wr.acLeistungW,
        phasen: wr.phasen,
        mppTrackerAnzahl: wr.mppTrackerAnzahl,
        zerezId: wr.zerezId,
        hybrid: wr.hybrid,
        notstromfaehig: wr.notstromfaehig,
        // Für Kompatibilitäts-Engine
        vocMax: wr.dcMaxV,
        vmppMin: wr.mppSpannungMinV,
        vmppMax: wr.mppSpannungMaxV,
        imppMax: wr.dcStromMaxA,
      };
    }
    
    case 'speicher': {
      const sp = produkt as Speicher;
      return {
        ...base,
        kapazitaetKwh: sp.kapazitaetNettoKwh || sp.kapazitaetBruttoKwh,
        kapazitaetBruttoKwh: sp.kapazitaetBruttoKwh,
        leistungKw: sp.ladeleistungMaxKw,
        batterietyp: sp.batterietyp,
        notstromfaehig: sp.notstromfaehig,
        ersatzstromfaehig: sp.ersatzstromfaehig,
      };
    }
    
    case 'wallboxen': {
      const wb = produkt as Wallbox;
      return {
        ...base,
        leistungKw: wb.ladeleistungKw,
        phasen: wb.phasen,
        steckertyp: wb.steckertyp,
        steuerbar14a: wb.steuerbar14a,
      };
    }
    
    case 'waermepumpen': {
      const wp = produkt as Waermepumpe;
      return {
        ...base,
        leistungKw: wp.heizleistungKw,
        waermequelle: wp.waermequelle,
        cop: wp.copA7W35,
        steuerbar14a: wp.steuerbar14a,
        sgReady: wp.sgReady,
      };
    }
    
    default:
      return base;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATENBLATT SYNC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Findet Produkt zu Datenblatt (z.B. nach Hochladen im Wizard)
 */
export async function verknuepfeDatenblattMitProdukt(
  api: ApiClient,
  datenblattUrl: string,
  herstellerName: string,
  modellName: string
): Promise<SyncResult> {
  // Suche in allen Produkttypen
  const typen: ProduktTyp[] = ['pvModule', 'wechselrichter', 'speicher', 'wallboxen', 'waermepumpen'];
  
  for (const typ of typen) {
    const produkt = findeExaktesProdukt(typ, herstellerName, modellName);
    
    if (produkt && !produkt.datenblattUrl) {
      const endpoint = typ === 'pvModule' ? 'pv-module' : typ;
      await api.patch(`/produkte/${endpoint}/${produkt.id}`, { datenblattUrl });
      produktCache.update(typ, produkt.id!, { datenblattUrl });
      
      return {
        action: 'updated',
        produkt: { ...produkt, datenblattUrl },
        message: `Datenblatt mit "${produkt.modell}" verknüpft`
      };
    }
  }
  
  return {
    action: 'error',
    message: 'Kein passendes Produkt gefunden'
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD INTEGRATION HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook-kompatible Funktion für Autocomplete im Wizard
 */
export function getAutocompleteOptions(typ: ProduktTyp, query: string): {
  value: number;
  label: string;
  subLabel: string;
  datenblatt: boolean;
  produkt: Produkt;
}[] {
  const ergebnisse = sucheProdukte(typ, query);
  
  return ergebnisse.map(e => ({
    value: e.produkt.id!,
    label: `${e.produkt.hersteller?.name || ''} ${e.produkt.modell}`.trim(),
    subLabel: getProduktSubLabel(typ, e.produkt),
    datenblatt: !!e.produkt.datenblattUrl,
    produkt: e.produkt,
  }));
}

function getProduktSubLabel(typ: ProduktTyp, produkt: Produkt): string {
  switch (typ) {
    case 'pvModule':
      return `${(produkt as PVModul).leistungWp} Wp`;
    case 'wechselrichter':
      return `${((produkt as Wechselrichter).acLeistungW / 1000).toFixed(1)} kW`;
    case 'speicher':
      return `${(produkt as Speicher).kapazitaetBruttoKwh} kWh`;
    case 'wallboxen':
      return `${(produkt as Wallbox).ladeleistungKw} kW`;
    case 'waermepumpen':
      return `${(produkt as Waermepumpe).heizleistungKw} kW`;
    default:
      return '';
  }
}
