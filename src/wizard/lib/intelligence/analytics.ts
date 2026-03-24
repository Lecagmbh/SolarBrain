/**
 * Baunity Intelligence - Historische Daten-Analyse
 * Lernt aus vergangenen Anmeldungen für bessere Vorhersagen
 */

export interface NBStatistik {
  nbId: string;
  nbName: string;
  durchschnittBearbeitungTage: number;
  medianBearbeitungTage: number;
  minTage: number;
  maxTage: number;
  erfolgsquote: number;
  haeufigsteAblehnungsgruende: string[];
  anmeldungenGesamt: number;
  trend: 'schneller' | 'gleich' | 'langsamer';
}

export interface PrognoseErgebnis {
  erwarteteBearbeitungTage: number;
  konfidenzbereich: { min: number; max: number };
  erfolgswahrscheinlichkeit: number;
  risikoFaktoren: string[];
  empfehlungen: string[];
  vergleichMitDurchschnitt: 'besser' | 'gleich' | 'schlechter';
}

// Simulierte NB-Statistiken
const NB_STATS: Record<string, NBStatistik> = {
  'bayernwerk': { nbId: 'bayernwerk', nbName: 'Bayernwerk', durchschnittBearbeitungTage: 12, medianBearbeitungTage: 10, minTage: 5, maxTage: 28, erfolgsquote: 94, haeufigsteAblehnungsgruende: ['Fehlender Installateursausweis', 'ZEREZ-ID nicht gefunden'], anmeldungenGesamt: 12450, trend: 'gleich' },
  'netze-bw': { nbId: 'netze-bw', nbName: 'Netze BW', durchschnittBearbeitungTage: 18, medianBearbeitungTage: 15, minTage: 7, maxTage: 42, erfolgsquote: 89, haeufigsteAblehnungsgruende: ['Installateursausweis abgelaufen', 'NA-Schutz Prüfer nicht akkreditiert'], anmeldungenGesamt: 9870, trend: 'langsamer' },
  'westnetz': { nbId: 'westnetz', nbName: 'Westnetz', durchschnittBearbeitungTage: 14, medianBearbeitungTage: 12, minTage: 6, maxTage: 35, erfolgsquote: 92, haeufigsteAblehnungsgruende: ['Netzverträglichkeit nicht gegeben', 'Falsches Messkonzept'], anmeldungenGesamt: 15230, trend: 'schneller' },
  'e-dis': { nbId: 'e-dis', nbName: 'E.DIS', durchschnittBearbeitungTage: 22, medianBearbeitungTage: 18, minTage: 10, maxTage: 56, erfolgsquote: 87, haeufigsteAblehnungsgruende: ['Netzausbau erforderlich', 'Trafostation überlastet'], anmeldungenGesamt: 6540, trend: 'langsamer' },
  'avacon': { nbId: 'avacon', nbName: 'Avacon', durchschnittBearbeitungTage: 16, medianBearbeitungTage: 14, minTage: 8, maxTage: 38, erfolgsquote: 90, haeufigsteAblehnungsgruende: ['Blindleistungsnachweis fehlt', 'Speicher-Datenblatt unvollständig'], anmeldungenGesamt: 7820, trend: 'gleich' },
  'mitnetz': { nbId: 'mitnetz', nbName: 'MITNETZ', durchschnittBearbeitungTage: 13, medianBearbeitungTage: 11, minTage: 6, maxTage: 32, erfolgsquote: 93, haeufigsteAblehnungsgruende: ['Zählerkonzept unklar'], anmeldungenGesamt: 5430, trend: 'schneller' },
  'sh-netz': { nbId: 'sh-netz', nbName: 'SH Netz', durchschnittBearbeitungTage: 11, medianBearbeitungTage: 9, minTage: 5, maxTage: 25, erfolgsquote: 95, haeufigsteAblehnungsgruende: ['Einspeisemanagement-Einstellung fehlt'], anmeldungenGesamt: 8920, trend: 'schneller' },
  'default': { nbId: 'default', nbName: 'Durchschnitt', durchschnittBearbeitungTage: 16, medianBearbeitungTage: 14, minTage: 7, maxTage: 42, erfolgsquote: 91, haeufigsteAblehnungsgruende: ['Unvollständige Unterlagen'], anmeldungenGesamt: 50000, trend: 'gleich' },
};

// Saisonale Faktoren (Monat -> Multiplikator für Bearbeitungszeit)
const SAISON_FAKTOREN: Record<number, number> = {
  1: 1.0, 2: 1.0, 3: 1.2, 4: 1.3, 5: 1.4, 6: 1.3, 7: 1.1, 8: 1.0, 9: 1.2, 10: 1.1, 11: 0.9, 12: 0.8
};

// Komplexitätsfaktoren
const KOMPLEXITAETS_FAKTOREN = {
  'balkon': 0.5,
  'mini': 0.7,
  'klein': 1.0,
  'mittel': 1.3,
  'gross': 1.6,
};

/**
 * Holt NB-Statistik
 */
export function getNBStatistik(nbId: string): NBStatistik {
  const key = String(nbId || '').toLowerCase().replace(/[^a-z]/g, '');
  for (const [id, stats] of Object.entries(NB_STATS)) {
    if (id === 'default') continue;
    if (key.includes(id.replace(/-/g, ''))) return stats;
  }
  return NB_STATS.default;
}

/**
 * Prognostiziert Bearbeitungszeit und Erfolgswahrscheinlichkeit
 */
export function prognostiziereBearbeitung(
  nbId: string,
  groessenklasse: string,
  hatSpeicher: boolean,
  hatNaSchutz: boolean,
  istVollstaendig: boolean,
  monat?: number
): PrognoseErgebnis {
  const stats = getNBStatistik(nbId);
  const aktuellerMonat = monat || new Date().getMonth() + 1;
  const saisonFaktor = SAISON_FAKTOREN[aktuellerMonat] || 1.0;
  const komplexFaktor = KOMPLEXITAETS_FAKTOREN[groessenklasse as keyof typeof KOMPLEXITAETS_FAKTOREN] || 1.0;
  
  // Basis-Bearbeitungszeit
  let erwarteteTage = stats.durchschnittBearbeitungTage * saisonFaktor * komplexFaktor;
  
  // Zusätzliche Faktoren
  if (hatSpeicher) erwarteteTage *= 1.1;
  if (hatNaSchutz) erwarteteTage *= 1.2;
  if (!istVollstaendig) erwarteteTage *= 1.5;
  
  erwarteteTage = Math.round(erwarteteTage);
  
  // Konfidenzbereich
  const min = Math.round(erwarteteTage * 0.6);
  const max = Math.round(erwarteteTage * 1.5);
  
  // Erfolgswahrscheinlichkeit
  let erfolg = stats.erfolgsquote;
  if (!istVollstaendig) erfolg -= 15;
  if (hatNaSchutz) erfolg -= 3; // Komplexer, mehr Fehlerpotential
  erfolg = Math.max(50, Math.min(99, erfolg));
  
  // Risikofaktoren
  const risiken: string[] = [];
  if (!istVollstaendig) risiken.push('Unvollständige Unterlagen erhöhen Ablehnungsrisiko');
  if (hatNaSchutz) risiken.push('NA-Schutz erfordert zusätzliche Prüfung');
  if (saisonFaktor > 1.2) risiken.push(`Hohe Auslastung im ${['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][aktuellerMonat]}`);
  if (stats.trend === 'langsamer') risiken.push(`${stats.nbName} hat aktuell längere Bearbeitungszeiten`);
  
  // Empfehlungen
  const empfehlungen: string[] = [];
  stats.haeufigsteAblehnungsgruende.slice(0, 2).forEach(grund => {
    empfehlungen.push(`Häufiger Ablehnungsgrund bei ${stats.nbName}: ${grund}`);
  });
  if (stats.trend === 'schneller') empfehlungen.push(`${stats.nbName} bearbeitet aktuell schneller als üblich`);
  
  // Vergleich
  const durchschnitt = NB_STATS.default.durchschnittBearbeitungTage * saisonFaktor * komplexFaktor;
  let vergleich: 'besser' | 'gleich' | 'schlechter' = 'gleich';
  if (erwarteteTage < durchschnitt * 0.9) vergleich = 'besser';
  else if (erwarteteTage > durchschnitt * 1.1) vergleich = 'schlechter';
  
  return {
    erwarteteBearbeitungTage: erwarteteTage,
    konfidenzbereich: { min, max },
    erfolgswahrscheinlichkeit: Math.round(erfolg),
    risikoFaktoren: risiken,
    empfehlungen,
    vergleichMitDurchschnitt: vergleich,
  };
}

/**
 * Gibt häufigste Konfiguration für PLZ-Bereich zurück
 */
export function getBeliebtesteKonfiguration(plzBereich: string): {
  durchschnittKwp: number;
  speicherQuote: number;
  wallboxQuote: number;
  wpQuote: number;
  beliebtesterWR: string;
  beliebtestesSpeicherModell: string;
} {
  // Simulierte regionale Unterschiede
  const plz1 = plzBereich.charAt(0);
  
  const basisKwp = {
    '0': 9.5, '1': 8.5, '2': 9.0, '3': 10.0, '4': 9.5, '5': 9.0, '6': 10.5, '7': 11.0, '8': 11.5, '9': 10.5
  }[plz1] || 10.0;
  
  const speicherQuote = plz1 >= '7' ? 72 : plz1 >= '5' ? 65 : 58; // Süden mehr Speicher
  const wallboxQuote = plz1 >= '7' ? 45 : plz1 >= '5' ? 40 : 35;
  const wpQuote = plz1 >= '7' ? 28 : plz1 >= '5' ? 22 : 18;
  
  return {
    durchschnittKwp: basisKwp,
    speicherQuote,
    wallboxQuote,
    wpQuote,
    beliebtesterWR: 'Fronius Symo GEN24',
    beliebtestesSpeicherModell: 'BYD HVS',
  };
}

/**
 * Vergleicht Anlage mit regionalen Durchschnitt
 */
export function vergleicheMitRegion(plz: string, kwp: number, hatSpeicher: boolean): {
  groesserAlsDurchschnitt: boolean;
  differenzProzent: number;
  bewertung: string;
} {
  const regional = getBeliebtesteKonfiguration(plz);
  const differenz = ((kwp - regional.durchschnittKwp) / regional.durchschnittKwp) * 100;
  
  let bewertung = '';
  if (differenz > 50) bewertung = 'Deutlich größer als regional üblich - prüfen Sie ob Dachfläche/Verbrauch das rechtfertigt';
  else if (differenz > 20) bewertung = 'Überdurchschnittlich groß für Ihre Region';
  else if (differenz < -30) bewertung = 'Kleiner als regional üblich - evtl. Erweiterung sinnvoll?';
  else bewertung = 'Typische Größe für Ihre Region';
  
  if (hatSpeicher && regional.speicherQuote < 60) {
    bewertung += ' | Mit Speicher sind Sie vorne dabei!';
  }
  
  return {
    groesserAlsDurchschnitt: kwp > regional.durchschnittKwp,
    differenzProzent: Math.round(differenz),
    bewertung,
  };
}

/**
 * Analysiert optimalen Zeitpunkt für Anmeldung
 */
export function analysiereOptimalenZeitpunkt(): {
  besterMonat: number;
  besterMonatName: string;
  schlechtesterMonat: number;
  aktuellerMonatBewertung: string;
} {
  const jetzt = new Date().getMonth() + 1;
  
  // Finde besten/schlechtesten Monat
  let bester = 1, schlechtester = 1;
  for (let m = 1; m <= 12; m++) {
    if (SAISON_FAKTOREN[m] < SAISON_FAKTOREN[bester]) bester = m;
    if (SAISON_FAKTOREN[m] > SAISON_FAKTOREN[schlechtester]) schlechtester = m;
  }
  
  const monatsnamen = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  
  let bewertung = '';
  if (SAISON_FAKTOREN[jetzt] <= 1.0) bewertung = '✅ Guter Zeitpunkt - niedrige Auslastung bei NB';
  else if (SAISON_FAKTOREN[jetzt] <= 1.2) bewertung = '⚠️ Durchschnittliche Auslastung';
  else bewertung = '❌ Hohe Auslastung - längere Bearbeitungszeiten wahrscheinlich';
  
  return {
    besterMonat: bester,
    besterMonatName: monatsnamen[bester],
    schlechtesterMonat: schlechtester,
    aktuellerMonatBewertung: bewertung,
  };
}
