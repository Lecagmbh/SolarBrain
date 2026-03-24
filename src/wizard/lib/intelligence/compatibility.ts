/**
 * Baunity Intelligence - Produkt-Kompatibilitäts-Engine
 * Prüft WR/Modul/Speicher Kompatibilität mit Temperaturkorrektur
 */

// Temperaturkoeffizienten (typische Werte)
const TEMP_KOEFF_VOC = -0.0029; // -0.29%/K für kristallin
// const TEMP_KOEFF_PMPP = -0.0037; // -0.37%/K
const STC_TEMP = 25; // Standard Test Conditions

export interface ModulDaten {
  hersteller: string;
  modell: string;
  leistungWp: number;
  voc: number;      // Leerlaufspannung
  vmpp: number;     // MPP-Spannung
  isc: number;      // Kurzschlussstrom
  impp: number;     // MPP-Strom
  tempKoeffVoc?: number;  // %/K, default -0.29
  tempKoeffPmpp?: number; // %/K, default -0.37
}

export interface WechselrichterDaten {
  hersteller: string;
  modell: string;
  leistungKva: number;
  dcLeistungMax: number;    // Max DC-Eingangsleistung
  vocMax: number;           // Max Eingangsspannung
  vmppMin: number;          // Min MPP-Spannung
  vmppMax: number;          // Max MPP-Spannung
  imppMax: number;          // Max Eingangsstrom pro MPPT
  mpptAnzahl: number;       // Anzahl MPPT-Tracker
  stringProMppt: number;    // Max Strings pro MPPT
}

export interface StringKonfiguration {
  modulAnzahl: number;
  stringAnzahl: number;
  mpptZuordnung: number[];  // Welcher String an welchem MPPT
}

export interface KompatibilitaetsErgebnis {
  kompatibel: boolean;
  score: number;  // 0-100
  pruefungen: {
    name: string;
    status: 'ok' | 'warnung' | 'fehler';
    wert: string;
    grenze: string;
    details: string;
  }[];
  empfehlungen: string[];
  optimaleStringLaenge: { min: number; max: number; optimal: number };
}

/**
 * Berechnet Voc bei gegebener Temperatur
 */
export function berechneVocBeiTemp(vocStc: number, tempCelsius: number, tempKoeff: number = TEMP_KOEFF_VOC): number {
  const deltaT = tempCelsius - STC_TEMP;
  return vocStc * (1 + tempKoeff * deltaT);
}

/**
 * Berechnet Vmpp bei gegebener Temperatur
 */
export function berechneVmppBeiTemp(vmppStc: number, tempCelsius: number, tempKoeff: number = TEMP_KOEFF_VOC): number {
  const deltaT = tempCelsius - STC_TEMP;
  return vmppStc * (1 + tempKoeff * deltaT);
}

/**
 * Hauptfunktion: Prüft Kompatibilität
 */
export function pruefeKompatibilitaet(
  modul: ModulDaten,
  wr: WechselrichterDaten,
  config: StringKonfiguration
): KompatibilitaetsErgebnis {
  const pruefungen: KompatibilitaetsErgebnis['pruefungen'] = [];
  const empfehlungen: string[] = [];
  let score = 100;
  
  const tempKoeffVoc = modul.tempKoeffVoc || TEMP_KOEFF_VOC;
  const n = config.modulAnzahl; // Module pro String
  
  // === 1. Voc bei Kälte (-10°C) ===
  const vocKalt = berechneVocBeiTemp(modul.voc, -10, tempKoeffVoc) * n;
  const vocMargin = ((wr.vocMax - vocKalt) / wr.vocMax) * 100;
  
  if (vocKalt > wr.vocMax) {
    pruefungen.push({
      name: 'Voc bei -10°C',
      status: 'fehler',
      wert: `${vocKalt.toFixed(0)}V`,
      grenze: `${wr.vocMax}V`,
      details: 'KRITISCH: Überspannung bei Kälte kann WR zerstören!'
    });
    score -= 50;
  } else if (vocMargin < 5) {
    pruefungen.push({
      name: 'Voc bei -10°C',
      status: 'warnung',
      wert: `${vocKalt.toFixed(0)}V`,
      grenze: `${wr.vocMax}V`,
      details: `Nur ${vocMargin.toFixed(1)}% Reserve - knapp!`
    });
    score -= 15;
    empfehlungen.push('Ein Modul weniger pro String für mehr Sicherheit');
  } else {
    pruefungen.push({
      name: 'Voc bei -10°C',
      status: 'ok',
      wert: `${vocKalt.toFixed(0)}V`,
      grenze: `${wr.vocMax}V`,
      details: `${vocMargin.toFixed(1)}% Reserve ✓`
    });
  }
  
  // === 2. Vmpp bei STC (25°C) ===
  const vmppStc = modul.vmpp * n;
  
  if (vmppStc < wr.vmppMin) {
    pruefungen.push({
      name: 'Vmpp bei 25°C',
      status: 'fehler',
      wert: `${vmppStc.toFixed(0)}V`,
      grenze: `${wr.vmppMin}V min`,
      details: 'String-Spannung zu niedrig für MPP-Tracking'
    });
    score -= 40;
  } else if (vmppStc > wr.vmppMax) {
    pruefungen.push({
      name: 'Vmpp bei 25°C',
      status: 'fehler',
      wert: `${vmppStc.toFixed(0)}V`,
      grenze: `${wr.vmppMax}V max`,
      details: 'String-Spannung über MPP-Bereich'
    });
    score -= 30;
  } else {
    pruefungen.push({
      name: 'Vmpp bei 25°C',
      status: 'ok',
      wert: `${vmppStc.toFixed(0)}V`,
      grenze: `${wr.vmppMin}-${wr.vmppMax}V`,
      details: 'Im optimalen MPP-Bereich ✓'
    });
  }
  
  // === 3. Vmpp bei Hitze (+70°C) ===
  const vmppHeiss = berechneVmppBeiTemp(modul.vmpp, 70, tempKoeffVoc) * n;
  
  if (vmppHeiss < wr.vmppMin) {
    pruefungen.push({
      name: 'Vmpp bei 70°C',
      status: 'warnung',
      wert: `${vmppHeiss.toFixed(0)}V`,
      grenze: `${wr.vmppMin}V min`,
      details: 'Bei extremer Hitze unter MPP-Minimum - Leistungsverlust'
    });
    score -= 10;
    empfehlungen.push('Ein Modul mehr pro String für bessere Hitze-Performance');
  } else {
    pruefungen.push({
      name: 'Vmpp bei 70°C',
      status: 'ok',
      wert: `${vmppHeiss.toFixed(0)}V`,
      grenze: `${wr.vmppMin}V min`,
      details: 'Auch bei Hitze im MPP-Bereich ✓'
    });
  }
  
  // === 4. Strom pro String ===
  if (modul.impp > wr.imppMax) {
    pruefungen.push({
      name: 'String-Strom',
      status: 'fehler',
      wert: `${modul.impp.toFixed(1)}A`,
      grenze: `${wr.imppMax}A`,
      details: 'Modulstrom überschreitet WR-Eingang'
    });
    score -= 40;
  } else if (modul.impp > wr.imppMax * 0.9) {
    pruefungen.push({
      name: 'String-Strom',
      status: 'warnung',
      wert: `${modul.impp.toFixed(1)}A`,
      grenze: `${wr.imppMax}A`,
      details: 'Nahe am Limit - wenig Reserve bei Einstrahlung >1000W/m²'
    });
    score -= 5;
  } else {
    pruefungen.push({
      name: 'String-Strom',
      status: 'ok',
      wert: `${modul.impp.toFixed(1)}A`,
      grenze: `${wr.imppMax}A`,
      details: 'Ausreichend Stromreserve ✓'
    });
  }
  
  // === 5. DC-Leistung ===
  const dcLeistung = modul.leistungWp * n * config.stringAnzahl / 1000;
  const dcRatio = dcLeistung / wr.dcLeistungMax;
  
  if (dcRatio > 1.0) {
    pruefungen.push({
      name: 'DC-Leistung',
      status: 'warnung',
      wert: `${dcLeistung.toFixed(1)}kWp`,
      grenze: `${wr.dcLeistungMax}kW`,
      details: `DC/AC=${dcRatio.toFixed(2)} - Überbelegung, Abregelung bei Spitzenleistung`
    });
    if (dcRatio > 1.5) score -= 15;
    else score -= 5;
  } else {
    pruefungen.push({
      name: 'DC-Leistung',
      status: 'ok',
      wert: `${dcLeistung.toFixed(1)}kWp`,
      grenze: `${wr.dcLeistungMax}kW`,
      details: `DC/AC=${dcRatio.toFixed(2)} ✓`
    });
  }
  
  // === 6. MPPT-Belegung ===
  if (config.stringAnzahl > wr.mpptAnzahl * wr.stringProMppt) {
    pruefungen.push({
      name: 'MPPT-Kapazität',
      status: 'fehler',
      wert: `${config.stringAnzahl} Strings`,
      grenze: `${wr.mpptAnzahl * wr.stringProMppt} max`,
      details: 'Zu viele Strings für verfügbare MPPTs'
    });
    score -= 30;
  } else {
    pruefungen.push({
      name: 'MPPT-Kapazität',
      status: 'ok',
      wert: `${config.stringAnzahl} Strings`,
      grenze: `${wr.mpptAnzahl * wr.stringProMppt} max`,
      details: `${wr.mpptAnzahl} MPPTs mit je ${wr.stringProMppt} String(s) ✓`
    });
  }
  
  // === Optimale String-Länge berechnen ===
  const minModule = Math.ceil(wr.vmppMin / berechneVmppBeiTemp(modul.vmpp, 70, tempKoeffVoc));
  const maxModule = Math.floor(wr.vocMax / berechneVocBeiTemp(modul.voc, -10, tempKoeffVoc));
  const optModule = Math.round((minModule + maxModule) / 2);
  
  // === Empfehlungen generieren ===
  if (n < minModule) {
    empfehlungen.push(`Mindestens ${minModule} Module pro String empfohlen`);
  }
  if (n > maxModule) {
    empfehlungen.push(`Maximal ${maxModule} Module pro String möglich`);
  }
  if (n !== optModule && Math.abs(n - optModule) > 2) {
    empfehlungen.push(`Optimale String-Länge: ${optModule} Module`);
  }
  
  // DC/AC Ratio Empfehlung
  if (dcRatio < 0.9) {
    empfehlungen.push('WR leicht überdimensioniert - mehr Module möglich');
  } else if (dcRatio > 1.2 && dcRatio <= 1.5) {
    empfehlungen.push('Leichte Überbelegung OK für deutsche Einstrahlungsverhältnisse');
  }
  
  return {
    kompatibel: !pruefungen.some(p => p.status === 'fehler'),
    score: Math.max(0, Math.min(100, score)),
    pruefungen,
    empfehlungen,
    optimaleStringLaenge: { min: minModule, max: maxModule, optimal: optModule }
  };
}

/**
 * Schnellcheck: Ist diese Kombination grundsätzlich möglich?
 */
export function schnellCheck(modul: ModulDaten, wr: WechselrichterDaten): {
  moeglich: boolean;
  minModule: number;
  maxModule: number;
  maxStrings: number;
} {
  const tempKoeff = modul.tempKoeffVoc || TEMP_KOEFF_VOC;
  const minModule = Math.ceil(wr.vmppMin / berechneVmppBeiTemp(modul.vmpp, 70, tempKoeff));
  const maxModule = Math.floor(wr.vocMax / berechneVocBeiTemp(modul.voc, -10, tempKoeff));
  const maxStrings = wr.mpptAnzahl * wr.stringProMppt;
  
  return {
    moeglich: maxModule >= minModule && modul.impp <= wr.imppMax,
    minModule,
    maxModule,
    maxStrings
  };
}

/**
 * Empfiehlt optimale Konfiguration
 */
export function empfehleKonfiguration(
  modul: ModulDaten,
  wr: WechselrichterDaten,
  gewuenschteLeistungKwp: number
): { modulAnzahl: number; stringAnzahl: number; stringLaenge: number; erpieltekWp: number } | null {
  const check = schnellCheck(modul, wr);
  if (!check.moeglich) return null;
  
  const optStringLaenge = Math.round((check.minModule + check.maxModule) / 2);
  const moduleGesamt = Math.round((gewuenschteLeistungKwp * 1000) / modul.leistungWp);
  
  // Versuche verschiedene String-Längen
  for (let len = optStringLaenge; len >= check.minModule; len--) {
    const strings = Math.round(moduleGesamt / len);
    if (strings <= check.maxStrings && strings > 0) {
      return {
        stringLaenge: len,
        stringAnzahl: strings,
        modulAnzahl: len * strings,
        erpieltekWp: (len * strings * modul.leistungWp) / 1000
      };
    }
  }
  
  return null;
}
