/**
 * Baunity Intelligence - Intelligente Ertragsprognose
 * Berechnet Ertrag basierend auf Standort, Ausrichtung, Verschattung
 */

// Globalstrahlung nach PLZ-Bereich (kWh/m²/Jahr) - DWD Durchschnittswerte
const GLOBALSTRAHLUNG_REGION: Record<string, number> = {
  // Süddeutschland (höchste Strahlung)
  '7': 1180, '8': 1200, '9': 1150,
  // Mitteldeutschland
  '3': 1050, '4': 1020, '5': 1080, '6': 1100,
  // Norddeutschland
  '0': 1000, '1': 1010, '2': 980,
};

// Detaillierte Werte für ausgewählte Regionen
const GLOBALSTRAHLUNG_PLZ: Record<string, number> = {
  '79': 1220, // Freiburg - Spitzenreiter
  '78': 1190, // Konstanz
  '88': 1180, // Bodensee
  '80': 1170, // München
  '93': 1160, // Regensburg
  '70': 1150, // Stuttgart
  '97': 1140, // Würzburg
  '90': 1130, // Nürnberg
  '60': 1100, // Frankfurt
  '50': 1090, // Köln
  '40': 1070, // Düsseldorf
  '30': 1050, // Hannover
  '20': 1000, // Hamburg
  '10': 1010, // Berlin
  '01': 1020, // Dresden
  '04': 1030, // Leipzig
};

// Ausrichtungsfaktoren (Azimut: 0=Süd, -90=Ost, +90=West, 180=Nord)
const AZIMUT_FAKTOREN: Record<number, number> = {
  0: 1.00,    // Süd
  15: 0.99,
  30: 0.96,
  45: 0.92,   // Südost/Südwest
  60: 0.87,
  75: 0.81,
  90: 0.74,   // Ost/West
  105: 0.66,
  120: 0.57,
  135: 0.47,
  150: 0.37,
  165: 0.28,
  180: 0.20,  // Nord
};

// Neigungsfaktoren (für Süd-Ausrichtung in Deutschland)
const NEIGUNGS_FAKTOREN: Record<number, number> = {
  0: 0.87,    // Flachdach
  10: 0.93,
  15: 0.95,
  20: 0.97,
  25: 0.98,
  30: 1.00,   // Optimal für D
  35: 1.00,
  40: 0.99,
  45: 0.97,
  50: 0.94,
  60: 0.87,
  70: 0.78,
  80: 0.67,
  90: 0.55,   // Fassade
};

// Verschattungskategorien
export type Verschattung = 'keine' | 'minimal' | 'leicht' | 'mittel' | 'stark' | 'sehr_stark';
const VERSCHATTUNGS_FAKTOREN: Record<Verschattung, number> = {
  'keine': 1.00,
  'minimal': 0.97,     // Einzelner Kamin
  'leicht': 0.93,      // Nachbargebäude in Entfernung
  'mittel': 0.85,      // Bäume, Gauben
  'stark': 0.75,       // Hohe Nachbargebäude
  'sehr_stark': 0.60,  // Starke Teilverschattung
};

// Degradation
const DEGRADATION_JAHR_1 = 0.02;  // 2% im ersten Jahr (LID)
const DEGRADATION_JAEHRLICH = 0.004; // 0.4%/Jahr danach

export interface ErtragInput {
  leistungKwp: number;
  plz: string;
  azimut: number;           // -180 bis +180 (0=Süd)
  neigung: number;          // 0-90°
  verschattung: Verschattung;
  speicherKwh?: number;
  jahresverbrauchKwh?: number;
}

export interface ErtragPrognose {
  // Jahresertrag
  spezifischerErtrag: number;      // kWh/kWp/Jahr
  jahresertragKwh: number;         // kWh/Jahr
  
  // Faktoren
  standortFaktor: number;
  ausrichtungsFaktor: number;
  neigungsFaktor: number;
  verschattungsFaktor: number;
  gesamtFaktor: number;
  
  // Mit Speicher
  eigenverbrauchOhneSpeicher: number;  // %
  eigenverbrauchMitSpeicher: number;   // %
  autarkiegradOhneSpeicher: number;    // %
  autarkiegradMitSpeicher: number;     // %
  
  // Finanziell
  eingespeistKwh: number;
  selbstVerbrauchtKwh: number;
  
  // Langzeit (25 Jahre)
  ertrag25Jahre: number;
  co2Ersparnis25JahreKg: number;
  
  // Monatliche Verteilung
  monatsverteilung: number[];  // 12 Werte, Summe = 1
  
  // Details
  globalstrahlung: number;
  regionName: string;
}

/**
 * Ermittelt Globalstrahlung für PLZ
 */
function getGlobalstrahlung(plz: string): { wert: number; region: string } {
  // Erst detaillierte PLZ prüfen
  const plz2 = plz.substring(0, 2);
  if (GLOBALSTRAHLUNG_PLZ[plz2]) {
    return { wert: GLOBALSTRAHLUNG_PLZ[plz2], region: `PLZ ${plz2}xxx` };
  }
  
  // Dann Region
  const plz1 = plz.substring(0, 1);
  const wert = GLOBALSTRAHLUNG_REGION[plz1] || 1050;
  return { wert, region: `Region ${plz1}xxxx` };
}

/**
 * Interpoliert Faktor aus Tabelle
 */
function interpoliereFaktor(wert: number, tabelle: Record<number, number>): number {
  const keys = Object.keys(tabelle).map(Number).sort((a, b) => a - b);
  
  // Exakter Treffer
  if (tabelle[wert] !== undefined) return tabelle[wert];
  
  // Außerhalb des Bereichs
  if (wert <= keys[0]) return tabelle[keys[0]];
  if (wert >= keys[keys.length - 1]) return tabelle[keys[keys.length - 1]];
  
  // Interpolieren
  for (let i = 0; i < keys.length - 1; i++) {
    if (wert > keys[i] && wert < keys[i + 1]) {
      const ratio = (wert - keys[i]) / (keys[i + 1] - keys[i]);
      return tabelle[keys[i]] + ratio * (tabelle[keys[i + 1]] - tabelle[keys[i]]);
    }
  }
  
  return 1.0;
}

/**
 * Berechnet Eigenverbrauchsquote (vereinfachtes Modell)
 */
function berechneEigenverbrauch(
  jahresertragKwh: number,
  jahresverbrauchKwh: number,
  speicherKwh: number
): { eigenverbrauch: number; autarkie: number } {
  if (jahresverbrauchKwh <= 0) {
    return { eigenverbrauch: 0, autarkie: 0 };
  }
  
  const pvAnteil = jahresertragKwh / jahresverbrauchKwh;
  
  // Empirische Formel für Eigenverbrauch ohne Speicher
  // Basierend auf HTW Berlin Studie
  let evOhne = 1 - Math.exp(-1.0 / pvAnteil);
  evOhne = Math.min(evOhne, 1.0);
  
  // Mit Speicher: +20-30% je nach Speichergröße
  const speicherFaktor = speicherKwh > 0 
    ? Math.min(0.30, speicherKwh / jahresverbrauchKwh * 20)
    : 0;
  let evMit = evOhne + speicherFaktor;
  evMit = Math.min(evMit, 0.95); // Max 95% realistisch
  
  // Autarkie
  // autarkieOhne berechnet
  const autarkieMit = evMit * pvAnteil;
  
  return {
    eigenverbrauch: evMit,
    autarkie: Math.min(autarkieMit, 0.95)
  };
}

/**
 * Monatliche Ertragsverteilung für Deutschland
 */
const MONATSVERTEILUNG = [
  0.04,  // Jan
  0.05,  // Feb
  0.08,  // Mär
  0.10,  // Apr
  0.12,  // Mai
  0.13,  // Jun
  0.13,  // Jul
  0.12,  // Aug
  0.09,  // Sep
  0.07,  // Okt
  0.04,  // Nov
  0.03,  // Dez
];

/**
 * Hauptfunktion: Berechnet komplette Ertragsprognose
 */
export function berechneErtragsprognose(input: ErtragInput): ErtragPrognose {
  const { leistungKwp, plz, azimut, neigung, verschattung, speicherKwh = 0, jahresverbrauchKwh = 4500 } = input;
  
  // Globalstrahlung
  const { wert: globalstrahlung, region } = getGlobalstrahlung(plz);
  
  // Faktoren berechnen
  const standortFaktor = globalstrahlung / 1100; // Normiert auf Durchschnitt
  const azimutAbs = Math.abs(azimut);
  const ausrichtungsFaktor = interpoliereFaktor(azimutAbs, AZIMUT_FAKTOREN);
  const neigungsFaktor = interpoliereFaktor(neigung, NEIGUNGS_FAKTOREN);
  const verschattungsFaktor = VERSCHATTUNGS_FAKTOREN[verschattung];
  
  // Azimut-Neigung-Korrektur (Ost-West profitiert mehr von flacherer Neigung)
  let kombiKorrektur = 1.0;
  if (azimutAbs > 60) {
    // Bei Ost/West ist flachere Neigung besser
    const optNeigung = 25 - (azimutAbs - 60) * 0.3;
    if (neigung > optNeigung) {
      kombiKorrektur = 0.98;
    }
  }
  
  const gesamtFaktor = standortFaktor * ausrichtungsFaktor * neigungsFaktor * verschattungsFaktor * kombiKorrektur;
  
  // Basis-Ertrag (950 kWh/kWp als Referenz für optimale Südanlage in D)
  const basisErtrag = 950;
  const spezifischerErtrag = Math.round(basisErtrag * gesamtFaktor);
  const jahresertragKwh = Math.round(leistungKwp * spezifischerErtrag);
  
  // Eigenverbrauch
  const evOhne = berechneEigenverbrauch(jahresertragKwh, jahresverbrauchKwh, 0);
  const evMit = berechneEigenverbrauch(jahresertragKwh, jahresverbrauchKwh, speicherKwh);
  
  // Einspeisung/Eigenverbrauch
  const selbstVerbrauchtKwh = Math.round(jahresertragKwh * evMit.eigenverbrauch);
  const eingespeistKwh = jahresertragKwh - selbstVerbrauchtKwh;
  
  // 25-Jahre-Ertrag mit Degradation
  let ertrag25Jahre = jahresertragKwh * (1 - DEGRADATION_JAHR_1); // Jahr 1
  for (let j = 2; j <= 25; j++) {
    ertrag25Jahre += jahresertragKwh * Math.pow(1 - DEGRADATION_JAEHRLICH, j - 1);
  }
  ertrag25Jahre = Math.round(ertrag25Jahre);
  
  // CO2-Ersparnis (ca. 400g CO2/kWh Strommix Deutschland)
  const co2Ersparnis25JahreKg = Math.round(ertrag25Jahre * 0.4);
  
  return {
    spezifischerErtrag,
    jahresertragKwh,
    standortFaktor,
    ausrichtungsFaktor,
    neigungsFaktor,
    verschattungsFaktor,
    gesamtFaktor,
    eigenverbrauchOhneSpeicher: Math.round(evOhne.eigenverbrauch * 100),
    eigenverbrauchMitSpeicher: Math.round(evMit.eigenverbrauch * 100),
    autarkiegradOhneSpeicher: Math.round(evOhne.autarkie * 100),
    autarkiegradMitSpeicher: Math.round(evMit.autarkie * 100),
    eingespeistKwh,
    selbstVerbrauchtKwh,
    ertrag25Jahre,
    co2Ersparnis25JahreKg,
    monatsverteilung: MONATSVERTEILUNG,
    globalstrahlung,
    regionName: region,
  };
}

/**
 * Schnelle Schätzung ohne viele Parameter
 */
export function schnellschaetzung(leistungKwp: number, plz: string): number {
  const { wert } = getGlobalstrahlung(plz);
  const faktor = wert / 1100;
  return Math.round(leistungKwp * 950 * faktor);
}
