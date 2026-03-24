/**
 * Baunity Wizard - Produkt Suche Utilities
 *
 * Reine Hilfsfunktionen ohne UI-Abhängigkeiten.
 */

import { api } from '../../../../lib/api/client';
import type {
  ProduktTyp,
  ProduktDBItem,
  ZerezComponent,
  SpecItem,
} from './produktSuche.types';
import { API_ENDPOINTS } from './produktSuche.types';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY PARSING: "Huawei SUN2000-10KTL" -> { hersteller: "Huawei", modell: "SUN2000-10KTL" }
// ═══════════════════════════════════════════════════════════════════════════

export function parseQuery(query: string): { hersteller: string; modell: string } {
  const trimmed = query.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) {
    return { hersteller: trimmed, modell: '' };
  }
  return { hersteller: parts[0], modell: parts.slice(1).join(' ') };
}

// ═══════════════════════════════════════════════════════════════════════════
// DETAIL LABEL (for dropdown items)
// ═══════════════════════════════════════════════════════════════════════════

export function getDetailLabel(typ: ProduktTyp, p: ProduktDBItem): string {
  switch (typ) {
    case 'pvModule':
      return `${p.leistungWp || 0} Wp${p.zelltyp ? ` · ${p.zelltyp}` : ''}`;
    case 'wechselrichter':
      return `${((p.acLeistungW || 0) / 1000).toFixed(1)} kW · ${p.phasen || 3}P${p.hybrid ? ' · Hybrid' : ''}`;
    case 'speicher':
      return `${p.kapazitaetBruttoKwh || 0} kWh${p.batterietyp ? ` · ${p.batterietyp}` : ''}`;
    case 'wallboxen':
      return `${p.ladeleistungKw || 0} kW${p.steuerbar14a ? ' · §14a' : ''}`;
    case 'waermepumpen':
      return `${p.nennleistungKw || 0} kW${p.typ ? ` · ${p.typ}` : ''}`;
    default: return '';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TECH SPECS
// ═══════════════════════════════════════════════════════════════════════════

export function filterSpecs(specs: SpecItem[]): SpecItem[] {
  return specs.filter(s => s.value != null && s.value !== '' && s.value !== 0 && s.value !== false);
}

export function getSpecsForType(typ: ProduktTyp, p: ProduktDBItem): SpecItem[] {
  switch (typ) {
    case 'pvModule':
      return filterSpecs([
        { label: 'Leistung', value: p.leistungWp, unit: 'Wp', highlight: true },
        { label: 'Zelltyp', value: p.zelltyp },
      ]);
    case 'wechselrichter': {
      const kw = (p.acLeistungW || 0) / 1000;
      const kva = (p.scheinleistungVa || 0) / 1000;
      return filterSpecs([
        { label: 'Wirkleistung', value: kw > 0 ? kw.toFixed(1) : undefined, unit: 'kW', highlight: true },
        { label: 'Scheinleistung', value: kva > 0 ? kva.toFixed(1) : undefined, unit: 'kVA' },
        { label: 'Phasen', value: p.phasen },
        { label: 'Hybrid', value: p.hybrid },
        { label: 'MPP-Tracker', value: p.mppTrackerAnzahl },
        { label: 'ZEREZ', value: p.zerezId },
        { label: 'NA-Schutz', value: p.naSchutzIntegriert },
      ]);
    }
    case 'speicher': {
      const kap = p.kapazitaetBruttoKwh || p.kapazitaetNettoKwh;
      return filterSpecs([
        { label: 'Kapazität', value: kap, unit: 'kWh', highlight: true },
        { label: 'Kopplung', value: p.kopplung ? p.kopplung.toUpperCase() : undefined },
        { label: 'Leistung', value: p.wirkleistungPsmaxKw || p.ladeleistungMaxKw, unit: 'kW' },
        { label: 'Scheinleistung', value: p.scheinleistungSsmaxKva, unit: 'kVA' },
        { label: 'Batterietyp', value: p.batterietyp },
        { label: 'Notstrom', value: p.notstromfaehig },
        { label: 'Ersatzstrom', value: p.ersatzstromfaehig },
        { label: 'Inselnetz', value: p.inselnetzfaehig },
      ]);
    }
    case 'wallboxen':
      return filterSpecs([
        { label: 'Ladeleistung', value: p.ladeleistungKw, unit: 'kW', highlight: true },
        { label: '§14a steuerbar', value: p.steuerbar14a },
      ]);
    case 'waermepumpen':
      return filterSpecs([
        { label: 'Heizleistung', value: p.nennleistungKw, unit: 'kW', highlight: true },
        { label: 'Typ', value: p.typ },
      ]);
    default: return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD DATA CONVERTER
// ═══════════════════════════════════════════════════════════════════════════

export function produktToWizardData(typ: ProduktTyp, produkt: ProduktDBItem): any {
  const base = {
    produktId: produkt.id,
    hersteller: produkt.hersteller?.name || '',
    modell: produkt.modell,
    _fromDb: true,
  };
  switch (typ) {
    case 'pvModule':
      return { ...base, modulHersteller: produkt.hersteller?.name || '', modulModell: produkt.modell, modulLeistungWp: produkt.leistungWp || 0 };
    case 'wechselrichter': {
      const kw = (produkt.acLeistungW || 0) / 1000;
      const kva = (produkt.scheinleistungVa || 0) / 1000 || Math.round(kw / 0.9 * 10) / 10;
      const isStorageInv = produkt.zerezCategory === 'STORAGE_INVERTER';
      return { ...base, leistungKw: kw, leistungKva: kva, hybrid: produkt.hybrid || isStorageInv, zerezId: produkt.zerezId, mpptAnzahl: produkt.mppTrackerAnzahl, maxDcEingangsstromA: produkt.maxDcEingangsstromA, maxDcSpannungV: produkt.maxDcSpannungV, acNennstromA: produkt.acNennstromA, verschiebungsfaktorCos: produkt.verschiebungsfaktorCos, naSchutzIntegriert: produkt.naSchutzIntegriert, isStorageInverter: isStorageInv };
    }
    case 'speicher': {
      const kap = produkt.kapazitaetBruttoKwh || produkt.kapazitaetNettoKwh || 0;
      const fbKw = kap > 0 ? Math.round(kap * 0.5 * 10) / 10 : 0;
      const fbKva = fbKw > 0 ? Math.round(fbKw * 1.1 * 10) / 10 : 0;
      const fbA = fbKva > 0 ? Math.round(fbKva * 1000 / 230 * 10) / 10 : 0;
      const mL = (produkt.modell || '').toLowerCase();
      const hL = (produkt.hersteller?.name || '').toLowerCase();
      const c = `${hL} ${mL}`;
      let kopp: 'ac' | 'dc' = 'dc';
      if (produkt.kopplung && (produkt.kopplung.toLowerCase() === 'ac' || produkt.kopplung.toLowerCase() === 'dc')) {
        kopp = produkt.kopplung.toLowerCase() as 'ac' | 'dc';
      } else {
        const isAC = / ac /i.test(` ${mL} `) || / ac$/i.test(mL) || /\.ac/i.test(mL) || /-ac/i.test(mL) || /^ac[ \-]/i.test(mL) || /\bac\d/i.test(mL);
        const isDC = /hybrid/i.test(c) || / dc /i.test(` ${mL} `) || /\.dc/i.test(mL) || /-dc/i.test(mL) || /\bhvs\b/i.test(mL) || /\bhvm\b/i.test(mL);
        if (isAC && !isDC) kopp = 'ac';
      }
      return { ...base, kapazitaetKwh: kap, kopplung: kopp, leistungKw: produkt.wirkleistungPsmaxKw || produkt.ladeleistungMaxKw || fbKw, scheinleistungKva: produkt.scheinleistungSsmaxKva || fbKva, bemessungsstromA: produkt.bemessungsstromIrA || fbA, notstrom: produkt.notstromfaehig || false, ersatzstrom: produkt.ersatzstromfaehig || false, inselnetzBildend: produkt.inselnetzfaehig || false, allpoligeTrennung: produkt.allpoligeTrennung ?? true, naSchutzVorhanden: produkt.naSchutzVorhanden ?? true, anschlussPhase: produkt.phasen === 1 ? 'L1' : 'drehstrom' };
    }
    case 'wallboxen':
      return { ...base, leistungKw: produkt.ladeleistungKw || 0, steuerbar14a: produkt.steuerbar14a || false };
    case 'waermepumpen':
      return { ...base, leistungKw: produkt.nennleistungKw || 0 };
    default:
      return base;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ZEREZ CONVERTER
// ═══════════════════════════════════════════════════════════════════════════

export function zerezToProduktDBItem(zerez: ZerezComponent): ProduktDBItem {
  const kw = zerez.maxActivePowerKw || 0;
  const kva = kw > 0 ? Math.round(kw / 0.9 * 10) / 10 : 0;
  return {
    id: zerez.id,
    modell: zerez.modelName,
    hersteller: { id: 0, name: zerez.manufacturerName },
    acLeistungW: kw * 1000,
    scheinleistungVa: kva * 1000,
    zerezId: zerez.zerezId,
    phasen: 3,
    verified: zerez.isVde4105 || false,
    zerezCategory: zerez.category,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC: Neue Produkte zur DB hinzufuegen
// ═══════════════════════════════════════════════════════════════════════════

export async function syncProduktToDb(
  typ: ProduktTyp,
  data: { hersteller: string; modell: string; leistung?: number; produktId?: number; _fromDb?: boolean }
): Promise<{ success: boolean; produktId?: number }> {
  if (data._fromDb || data.produktId) return { success: true, produktId: data.produktId };

  let herstellerId: number | undefined;
  try {
    const herstellerRes = await api.get<any[]>('/produkte/hersteller');
    const existing = (herstellerRes.data || []).find(
      (h: any) => String(h.name || '').toLowerCase() === String(data.hersteller || '').toLowerCase()
    );
    if (existing) { herstellerId = existing.id; }
    else {
      const created = await api.post<any>('/produkte/hersteller', { name: data.hersteller, aktiv: true, verified: false });
      herstellerId = created.data?.id;
    }
  } catch { return { success: false }; }
  if (!herstellerId) return { success: false };

  try {
    const body: any = { herstellerId, modell: data.modell, aktiv: true, verified: false };
    switch (typ) {
      case 'pvModule': body.leistungWp = data.leistung || 0; break;
      case 'wechselrichter': body.acLeistungW = (data.leistung || 0) * 1000; body.phasen = 3; break;
      case 'speicher': body.kapazitaetBruttoKwh = data.leistung || 0; break;
      case 'wallboxen': body.ladeleistungKw = data.leistung || 0; body.phasen = 3; break;
      case 'waermepumpen': body.nennleistungKw = data.leistung || 0; break;
    }
    const result = await api.post<any>(API_ENDPOINTS[typ], body);
    return { success: true, produktId: result.data?.id };
  } catch { return { success: false }; }
}
