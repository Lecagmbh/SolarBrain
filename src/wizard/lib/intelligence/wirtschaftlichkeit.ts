/**
 * Baunity Intelligence - Dynamische Kosten-Nutzen-Rechnung
 * Berechnet ROI, Amortisation, Cashflow über 25 Jahre
 */

// Aktuelle Preise (Stand 2024)
const STROMPREIS_CT_KWH = 35;           // Haushaltsstrom
const STROMPREIS_STEIGERUNG_JAHR = 0.03; // 3% p.a.
const EEG_VERGUETUNG_UEBERSCHUSS = 8.11; // ct/kWh bis 10 kWp
const EEG_VERGUETUNG_VOLLEINSPEISUNG = 12.87;
const PARAGRAPH_14A_RABATT = 190;       // €/Jahr pro Gerät
const INFLATION = 0.02;                 // 2% p.a.

// Typische Kosten (€/kWp bzw. €/kWh)
const KOSTEN_PV_KWP = {
  'klein': 1400,    // bis 5 kWp
  'mittel': 1250,   // 5-10 kWp
  'gross': 1100,    // 10-30 kWp
  'sehr_gross': 950, // >30 kWp
};

const KOSTEN_SPEICHER_KWH = {
  'klein': 800,     // bis 5 kWh
  'mittel': 650,    // 5-10 kWh
  'gross': 550,     // >10 kWh
};

const KOSTEN_WALLBOX = {
  '11kw': 800,
  '22kw': 1200,
  'mit_lastmanagement': 1500,
};

const KOSTEN_INSTALLATION = {
  'pv_basis': 1500,
  'speicher': 500,
  'wallbox': 400,
  'wp_anbindung': 300,
};

export interface WirtschaftlichkeitInput {
  // Anlage
  pvLeistungKwp: number;
  speicherKwh: number;
  wallboxKw: number;
  waermepumpeKw: number;
  
  // Ertrag
  jahresertragKwh: number;
  eigenverbrauchQuote: number; // 0-1
  
  // Kunde
  jahresverbrauchKwh: number;
  strompreisCtKwh?: number;
  
  // Optionen
  einspeiseart: 'ueberschuss' | 'volleinspeisung';
  paragraph14aGeraete: number; // 0, 1, oder 2
  
  // Zusätzliche Kosten
  zusatzkosten?: number;
}

export interface WirtschaftlichkeitErgebnis {
  // Investition
  investitionGesamt: number;
  investitionPV: number;
  investitionSpeicher: number;
  investitionWallbox: number;
  investitionInstallation: number;
  
  // Jährliche Erträge
  stromkostenErsparnis: number;    // durch Eigenverbrauch
  einspeiseverguetung: number;
  paragraph14aRabatt: number;
  gesamtertragJahr1: number;
  
  // Rendite
  amortisationJahre: number;
  renditeProJahr: number;         // %
  kapitalwert25Jahre: number;     // NPV
  
  // Cashflow 25 Jahre
  cashflow: {
    jahr: number;
    einnahmen: number;
    kosten: number;               // Wartung, Versicherung
    netto: number;
    kumuliert: number;
  }[];
  
  // Vergleiche
  ohneAnlage25JahreKosten: number;
  mitAnlage25JahreKosten: number;
  ersparnis25Jahre: number;
  
  // Kennzahlen
  stromgestehungskosten: number;  // ct/kWh (LCOE)
  co2EingespartTonnen25Jahre: number;
}

/**
 * Berechnet Investitionskosten
 */
function berechneInvestition(input: WirtschaftlichkeitInput): {
  gesamt: number;
  pv: number;
  speicher: number;
  wallbox: number;
  installation: number;
} {
  // PV
  let pvKosten = 0;
  if (input.pvLeistungKwp > 0) {
    let preisProKwp = KOSTEN_PV_KWP.klein;
    if (input.pvLeistungKwp > 30) preisProKwp = KOSTEN_PV_KWP.sehr_gross;
    else if (input.pvLeistungKwp > 10) preisProKwp = KOSTEN_PV_KWP.gross;
    else if (input.pvLeistungKwp > 5) preisProKwp = KOSTEN_PV_KWP.mittel;
    pvKosten = input.pvLeistungKwp * preisProKwp;
  }
  
  // Speicher
  let speicherKosten = 0;
  if (input.speicherKwh > 0) {
    let preisProKwh = KOSTEN_SPEICHER_KWH.klein;
    if (input.speicherKwh > 10) preisProKwh = KOSTEN_SPEICHER_KWH.gross;
    else if (input.speicherKwh > 5) preisProKwh = KOSTEN_SPEICHER_KWH.mittel;
    speicherKosten = input.speicherKwh * preisProKwh;
  }
  
  // Wallbox
  let wallboxKosten = 0;
  if (input.wallboxKw > 0) {
    wallboxKosten = input.wallboxKw > 11 ? KOSTEN_WALLBOX['22kw'] : KOSTEN_WALLBOX['11kw'];
  }
  
  // Installation
  let installationKosten = 0;
  if (input.pvLeistungKwp > 0) installationKosten += KOSTEN_INSTALLATION.pv_basis;
  if (input.speicherKwh > 0) installationKosten += KOSTEN_INSTALLATION.speicher;
  if (input.wallboxKw > 0) installationKosten += KOSTEN_INSTALLATION.wallbox;
  if (input.waermepumpeKw > 0) installationKosten += KOSTEN_INSTALLATION.wp_anbindung;
  
  const gesamt = pvKosten + speicherKosten + wallboxKosten + installationKosten + (input.zusatzkosten || 0);
  
  return { gesamt, pv: pvKosten, speicher: speicherKosten, wallbox: wallboxKosten, installation: installationKosten };
}

/**
 * Hauptberechnung
 */
export function berechneWirtschaftlichkeit(input: WirtschaftlichkeitInput): WirtschaftlichkeitErgebnis {
  const strompreis = input.strompreisCtKwh || STROMPREIS_CT_KWH;
  
  // Investition
  const inv = berechneInvestition(input);
  
  // Jährlicher Ertrag (Jahr 1)
  const eigenverbrauchKwh = input.jahresertragKwh * input.eigenverbrauchQuote;
  const einspeisungKwh = input.jahresertragKwh - eigenverbrauchKwh;
  
  const stromkostenErsparnis = (eigenverbrauchKwh * strompreis) / 100;
  
  const eegSatz = input.einspeiseart === 'volleinspeisung' ? EEG_VERGUETUNG_VOLLEINSPEISUNG : EEG_VERGUETUNG_UEBERSCHUSS;
  const einspeiseverguetung = (einspeisungKwh * eegSatz) / 100;
  
  const paragraph14aRabatt = input.paragraph14aGeraete * PARAGRAPH_14A_RABATT;
  
  const gesamtertragJahr1 = stromkostenErsparnis + einspeiseverguetung + paragraph14aRabatt;
  
  // Cashflow 25 Jahre
  const cashflow: WirtschaftlichkeitErgebnis['cashflow'] = [];
  let kumuliert = -inv.gesamt;
  let kapitalwert = -inv.gesamt;
  let amortisationJahre = 25;
  const diskontRate = 0.03; // 3%
  
  const wartungProJahr = inv.pv * 0.015 + inv.speicher * 0.01; // 1.5% PV, 1% Speicher
  const degradation = 0.005; // 0.5% p.a.
  
  for (let jahr = 1; jahr <= 25; jahr++) {
    const degradationFaktor = Math.pow(1 - degradation, jahr - 1);
    const strompreisJahr = strompreis * Math.pow(1 + STROMPREIS_STEIGERUNG_JAHR, jahr - 1);
    
    // Ertrag im Jahr
    const ertragJahr = input.jahresertragKwh * degradationFaktor;
    const evJahr = ertragJahr * input.eigenverbrauchQuote;
    const einspJahr = ertragJahr - evJahr;
    
    const ersparnis = (evJahr * strompreisJahr) / 100;
    const einspeis = (einspJahr * eegSatz) / 100; // EEG bleibt 20 Jahre konstant
    const p14a = jahr <= 20 ? paragraph14aRabatt : 0; // Nur 20 Jahre
    
    const einnahmen = ersparnis + (jahr <= 20 ? einspeis : einspJahr * 0.05) + p14a; // Nach 20 Jahren: 5ct Marktwert
    const kosten = wartungProJahr * Math.pow(1 + INFLATION, jahr - 1);
    
    // Speicher-Ersatz nach 15 Jahren?
    const speicherErsatz = jahr === 15 && input.speicherKwh > 0 ? inv.speicher * 0.5 : 0;
    
    const netto = einnahmen - kosten - speicherErsatz;
    kumuliert += netto;
    
    // Kapitalwert (NPV)
    kapitalwert += netto / Math.pow(1 + diskontRate, jahr);
    
    // Amortisation
    if (kumuliert >= 0 && amortisationJahre === 25) {
      amortisationJahre = jahr - (kumuliert - netto < 0 ? (kumuliert / netto) : 0);
    }
    
    cashflow.push({ jahr, einnahmen, kosten: kosten + speicherErsatz, netto, kumuliert });
  }
  
  // Vergleich ohne Anlage
  let ohneAnlage = 0;
  for (let j = 1; j <= 25; j++) {
    ohneAnlage += input.jahresverbrauchKwh * (strompreis * Math.pow(1 + STROMPREIS_STEIGERUNG_JAHR, j - 1)) / 100;
  }
  
  const mitAnlage = inv.gesamt + cashflow.reduce((sum, cf) => sum + cf.kosten, 0) - cashflow.reduce((sum, cf) => sum + cf.einnahmen, 0) + (input.jahresverbrauchKwh - eigenverbrauchKwh) * strompreis / 100 * 25;
  
  // Stromgestehungskosten (LCOE)
  const gesamtErtrag25 = cashflow.reduce((sum, _cf, i) => sum + input.jahresertragKwh * Math.pow(1 - degradation, i), 0);
  const gesamtKosten25 = inv.gesamt + cashflow.reduce((sum, cf) => sum + cf.kosten, 0);
  const stromgestehungskosten = (gesamtKosten25 / gesamtErtrag25) * 100;
  
  // CO2
  const co2 = gesamtErtrag25 * 0.4 / 1000; // 400g/kWh, in Tonnen
  
  return {
    investitionGesamt: Math.round(inv.gesamt),
    investitionPV: Math.round(inv.pv),
    investitionSpeicher: Math.round(inv.speicher),
    investitionWallbox: Math.round(inv.wallbox),
    investitionInstallation: Math.round(inv.installation),
    
    stromkostenErsparnis: Math.round(stromkostenErsparnis),
    einspeiseverguetung: Math.round(einspeiseverguetung),
    paragraph14aRabatt: Math.round(paragraph14aRabatt),
    gesamtertragJahr1: Math.round(gesamtertragJahr1),
    
    amortisationJahre: Math.round(amortisationJahre * 10) / 10,
    renditeProJahr: Math.round((gesamtertragJahr1 / inv.gesamt) * 1000) / 10,
    kapitalwert25Jahre: Math.round(kapitalwert),
    
    cashflow,
    
    ohneAnlage25JahreKosten: Math.round(ohneAnlage),
    mitAnlage25JahreKosten: Math.round(mitAnlage),
    ersparnis25Jahre: Math.round(ohneAnlage - mitAnlage),
    
    stromgestehungskosten: Math.round(stromgestehungskosten * 10) / 10,
    co2EingespartTonnen25Jahre: Math.round(co2),
  };
}

/**
 * Schnelle ROI-Schätzung
 */
export function schnellROI(investition: number, jahresertrag: number, eigenverbrauchQuote: number): {
  amortisation: number;
  rendite: number;
} {
  const evKwh = jahresertrag * eigenverbrauchQuote;
  const einspKwh = jahresertrag - evKwh;
  const ertrag = (evKwh * STROMPREIS_CT_KWH + einspKwh * EEG_VERGUETUNG_UEBERSCHUSS) / 100;
  
  return {
    amortisation: Math.round(investition / ertrag * 10) / 10,
    rendite: Math.round(ertrag / investition * 1000) / 10,
  };
}
