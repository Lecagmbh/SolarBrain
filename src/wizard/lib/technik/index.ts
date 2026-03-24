/**
 * Baunity Wizard V11 - Technik Intelligenz
 * ======================================
 */

// Types not needed here

export interface StringKonfiguration {
  mppt: number;
  stringNr: number;
  module: number;
  spannungMpp: number;
  spannungOc: number;
  stromMpp: number;
  leistungKwp: number;
  ok: boolean;
  warnungen: string[];
}

export interface StringErgebnis {
  konfigurationen: StringKonfiguration[];
  gesamtKwp: number;
  gesamtModule: number;
  dcAcRatio: number;
  warnungen: string[];
  empfehlungen: string[];
}

export function berechneStringKonfiguration(
  modul: { leistungWp: number; spannungVoc?: number; spannungVmpp?: number; stromImpp?: number; stromIsc?: number },
  wr: { mpptSpannungMin?: number; mpptSpannungMax?: number; maxEingangsstrom?: number; acLeistungW: number; mppTrackerAnzahl: number },
  anzahlModule: number
): StringErgebnis {
  const vocMax = (modul.spannungVoc || 40) * 1.1;
  const vmpp = modul.spannungVmpp || 35;
  const impp = modul.stromImpp || 10;
  const mpptMin = wr.mpptSpannungMin || 200;
  const mpptMax = wr.mpptSpannungMax || 800;
  const maxStrom = wr.maxEingangsstrom || 15;
  
  const maxModProString = Math.floor(mpptMax / vocMax);
  const minModProString = Math.ceil(mpptMin / vmpp);
  const optModProString = Math.min(maxModProString, Math.ceil((maxModProString + minModProString) / 2));
  
  // const stringAnzahl = Math.ceil(anzahlModule / optModProString);
  const mpptAnzahl = wr.mppTrackerAnzahl || 2;
  
  const konfigurationen: StringKonfiguration[] = [];
  let remaining = anzahlModule;
  
  for (let mppt = 1; mppt <= mpptAnzahl && remaining > 0; mppt++) {
    const stringsThisMppt = Math.ceil(remaining / optModProString / (mpptAnzahl - mppt + 1));
    for (let s = 1; s <= stringsThisMppt && remaining > 0; s++) {
      const mods = Math.min(optModProString, remaining);
      remaining -= mods;
      
      const spannungMpp = vmpp * mods;
      const spannungOc = vocMax * mods;
      const stromMpp = impp;
      const kwp = (modul.leistungWp * mods) / 1000;
      
      const ok = spannungOc <= mpptMax && spannungMpp >= mpptMin && stromMpp <= maxStrom;
      const warns: string[] = [];
      if (spannungOc > mpptMax) warns.push(`Voc ${spannungOc.toFixed(0)}V > max ${mpptMax}V`);
      if (spannungMpp < mpptMin) warns.push(`Vmpp ${spannungMpp.toFixed(0)}V < min ${mpptMin}V`);
      
      konfigurationen.push({ mppt, stringNr: s, module: mods, spannungMpp, spannungOc, stromMpp, leistungKwp: kwp, ok, warnungen: warns });
    }
  }
  
  const gesamtKwp = (modul.leistungWp * anzahlModule) / 1000;
  const dcAcRatio = gesamtKwp / (wr.acLeistungW / 1000);
  
  const warnungen: string[] = [];
  const empfehlungen: string[] = [];
  
  if (dcAcRatio > 1.5) warnungen.push(`DC/AC Ratio ${dcAcRatio.toFixed(2)} sehr hoch (>1.5)`);
  else if (dcAcRatio > 1.3) warnungen.push(`DC/AC Ratio ${dcAcRatio.toFixed(2)} erhöht`);
  else if (dcAcRatio < 0.8) warnungen.push(`DC/AC Ratio ${dcAcRatio.toFixed(2)} niedrig - WR überdimensioniert`);
  
  if (dcAcRatio >= 1.0 && dcAcRatio <= 1.3) empfehlungen.push('✅ DC/AC Ratio optimal');
  if (konfigurationen.every(k => k.ok)) empfehlungen.push('✅ Alle Strings kompatibel');
  
  return { konfigurationen, gesamtKwp, gesamtModule: anzahlModule, dcAcRatio, warnungen, empfehlungen };
}

export function empfehleWRDimensionierung(anzahlModule: number, modulWp: number, ausrichtung: 'sued' | 'ost_west' | 'flach' = 'sued'): { kva: number; phasen: 1 | 3; begruendung: string[] } {
  const dcKwp = (anzahlModule * modulWp) / 1000;
  const ratios = { sued: 1.1, ost_west: 1.3, flach: 1.2 };
  const ratio = ratios[ausrichtung];
  const kva = dcKwp / ratio;
  const sizes = [1.5, 2.0, 2.5, 3.0, 3.6, 4.0, 4.6, 5.0, 6.0, 8.0, 10.0, 12.0, 15.0, 20.0, 25.0, 30.0];
  const rounded = sizes.find(s => s >= kva) || 30.0;
  const phasen = rounded > 4.6 ? 3 : 1;
  const begruendung = [`Ziel-Ratio: ${ratio}`, `Resultierende Ratio: ${(dcKwp / rounded).toFixed(2)}`];
  return { kva: rounded, phasen, begruendung };
}

export function schaetzeErtrag(kwp: number, bundesland: string, azimut: number = 180, neigung: number = 30, hatSpeicher: boolean = false, verbrauchKwh: number = 4000) {
  const strahlung: Record<string, number> = {
    'Baden-Württemberg': 1150, 'Bayern': 1180, 'Berlin': 1050, 'Brandenburg': 1060, 'Bremen': 980,
    'Hamburg': 990, 'Hessen': 1080, 'Mecklenburg-Vorpommern': 1040, 'Niedersachsen': 1000,
    'Nordrhein-Westfalen': 1020, 'Rheinland-Pfalz': 1100, 'Saarland': 1090, 'Sachsen': 1070,
    'Sachsen-Anhalt': 1050, 'Schleswig-Holstein': 1000, 'Thüringen': 1060,
  };
  const basis = strahlung[bundesland] || 1050;
  const aziFaktor = 1 - (Math.abs(azimut - 180) / 180) * 0.2;
  const neigFaktor = 1 - (Math.abs(neigung - 32) / 90) * 0.15;
  const pr = 0.85;
  const spez = basis * aziFaktor * neigFaktor * pr;
  const jahresertrag = kwp * spez;
  const eigenverbrauchsquote = hatSpeicher ? Math.min(0.8, verbrauchKwh / jahresertrag + 0.3) : Math.min(0.4, verbrauchKwh / jahresertrag);
  const autarkie = Math.min(1, (jahresertrag * eigenverbrauchsquote) / verbrauchKwh);
  const co2 = jahresertrag * 0.4;
  return { jahresertragKwh: Math.round(jahresertrag), spezifischKwhKwp: Math.round(spez), eigenverbrauchsquote: Math.round(eigenverbrauchsquote * 100), autarkiegrad: Math.round(autarkie * 100), co2Kg: Math.round(co2) };
}
