/**
 * Baunity Intelligence - Szenario Konfigurationen
 * Definiert für jedes Szenario: Steps, Felder, Dokumente, Validierung, Finanzen
 */

import type { AnmeldeSzenario, SzenarioConfig } from './types';

// Basis-Templates
const ALLE_STEPS = { step1: true, step2: true, step3: true, step4: true, step5: true, step6: true, step7: true, step8: true };
const MINIMAL_STEPS = { step1: true, step2: true, step3: true, step4: true, step5: true, step6: true, step7: false, step8: true };

const PV_TECHNIK = { pvModule: true, wechselrichter: true, speicher: false, wallbox: false, waermepumpe: false, bhkw: false, einspeiseart: true, messkonzept: true, stringPlanung: true, naSchutz: false, paragraph14a: false, direktvermarktung: false };
const PARAGRAPH14A_TECHNIK = { pvModule: false, wechselrichter: false, speicher: false, wallbox: false, waermepumpe: false, bhkw: false, einspeiseart: false, messkonzept: false, stringPlanung: false, naSchutz: false, paragraph14a: true, direktvermarktung: false };

const PRIVAT_KUNDE = { firma: false, ustId: false, handelsregister: false, bankverbindung: true, finanzamt: false, steuerberater: false };
const GEWERBE_KUNDE = { firma: true, ustId: true, handelsregister: false, bankverbindung: true, finanzamt: true, steuerberater: false };
const GROSS_KUNDE = { firma: true, ustId: true, handelsregister: true, bankverbindung: true, finanzamt: true, steuerberater: true };

const STANDARD_DOKS = { e1Anmeldung: true, e2Datenblatt: true, e3Inbetriebnahme: true, e4Einheitenzertifikat: true, e5Speicher: false, e6NaSchutz: false, schaltplan: true, lageplan: true, stringplan: true, wrDatenblatt: true, modulDatenblatt: true, speicherDatenblatt: false, paragraph14aAnmeldung: false, eigentuemerZustimmung: true, vollmacht: true, gewerbeanmeldung: false, handelsregisterauszug: false, installateursausweis: true, messkonzept: false, netzvertraeglichkeit: false, anlagenzertifikat: false, blindleistungsnachweis: false };
const MINIMAL_DOKS = { e1Anmeldung: true, e2Datenblatt: false, e3Inbetriebnahme: false, e4Einheitenzertifikat: false, e5Speicher: false, e6NaSchutz: false, schaltplan: false, lageplan: false, stringplan: false, wrDatenblatt: false, modulDatenblatt: false, speicherDatenblatt: false, paragraph14aAnmeldung: false, eigentuemerZustimmung: true, vollmacht: true, gewerbeanmeldung: false, handelsregisterauszug: false, installateursausweis: false, messkonzept: false, netzvertraeglichkeit: false, anlagenzertifikat: false, blindleistungsnachweis: false };

const STANDARD_VAL = { zerezIdPflicht: true, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: true, mastrPflicht: true, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: true };

export const SZENARIO_CONFIGS: Record<AnmeldeSzenario, SzenarioConfig> = {
  'BALKON_PV': {
    name: 'Balkonkraftwerk', beschreibung: '≤800W / ≤2kWp - Vereinfachtes Verfahren',
    steps: MINIMAL_STEPS,
    technikFelder: { ...PV_TECHNIK, einspeiseart: false, messkonzept: false, stringPlanung: false },
    kundenFelder: { ...PRIVAT_KUNDE, bankverbindung: true },
    dokumente: { ...MINIMAL_DOKS },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: false, mastrPflicht: true, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: true },
    verfahren: { typ: 'vereinfacht', fristWochen: 0, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 8.11, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Vereinfachtes Verfahren - keine Genehmigung', '✅ Nur MaStR-Registrierung nötig', '💡 Schuko oder Wieland-Stecker möglich'],
    warnungen: ['⚠️ Max. 800W WR / 2000Wp Module', '⚠️ Nur ein BKW pro Wohneinheit'],
  },

  'MINI_PV_EINPHASIG': {
    name: 'Mini-PV einphasig', beschreibung: '≤4,6 kVA an einer Phase',
    steps: ALLE_STEPS,
    technikFelder: { ...PV_TECHNIK, speicher: true },
    kundenFelder: PRIVAT_KUNDE,
    dokumente: STANDARD_DOKS,
    validierung: STANDARD_VAL,
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 8.11, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Einphasig bis 4,6 kVA erlaubt', '✅ Installation durch Elektriker', '💡 ZEREZ-Eintrag prüfen'],
    warnungen: ['⚠️ Schieflastgrenze beachten'],
  },

  'KLEIN_PV_STANDARD': {
    name: 'Standard-PV', beschreibung: '≤30 kVA Überschusseinspeisung',
    steps: ALLE_STEPS,
    technikFelder: PV_TECHNIK,
    kundenFelder: PRIVAT_KUNDE,
    dokumente: STANDARD_DOKS,
    validierung: STANDARD_VAL,
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 8.11, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Vereinfachtes Verfahren (4 Wochen)', '✅ Dreiphasig empfohlen', '💡 MwSt-Option prüfen'],
    warnungen: [],
  },

  'KLEIN_PV_MIT_SPEICHER': {
    name: 'PV + Speicher', beschreibung: '≤30 kVA mit Batterie',
    steps: ALLE_STEPS,
    technikFelder: { ...PV_TECHNIK, speicher: true },
    kundenFelder: PRIVAT_KUNDE,
    dokumente: { ...STANDARD_DOKS, e5Speicher: true, speicherDatenblatt: true },
    validierung: STANDARD_VAL,
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 8.11, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Speicher separat im MaStR', '✅ DC-Kopplung effizienter', '💡 Eigenverbrauch bis 80%'],
    warnungen: ['⚠️ Entladeleistung in Gesamtleistung'],
  },

  'KLEIN_PV_VOLLEINSPEISUNG': {
    name: 'Volleinspeisung', beschreibung: '≤30 kVA 100% Einspeisung',
    steps: ALLE_STEPS,
    technikFelder: { ...PV_TECHNIK, messkonzept: true },
    kundenFelder: { ...PRIVAT_KUNDE, ustId: true, finanzamt: true },
    dokumente: { ...STANDARD_DOKS, messkonzept: true },
    validierung: STANDARD_VAL,
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 12.87, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Höhere Vergütung (12,87 ct/kWh)', '✅ Kaskadenmessung nötig', '💡 Zweite Anlage für Eigenverbrauch'],
    warnungen: ['⚠️ Regelbesteuerung Pflicht', '⚠️ USt-Voranmeldung nötig'],
  },

  'MITTEL_PV_NA_SCHUTZ': {
    name: 'Mittlere PV + NA-Schutz', beschreibung: '30-100 kVA',
    steps: ALLE_STEPS,
    technikFelder: { ...PV_TECHNIK, speicher: true, naSchutz: true },
    kundenFelder: GEWERBE_KUNDE,
    dokumente: { ...STANDARD_DOKS, e6NaSchutz: true, messkonzept: true, gewerbeanmeldung: true },
    validierung: { ...STANDARD_VAL, naSchutzPflicht: true },
    verfahren: { typ: 'erweitert', fristWochen: 8, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 8.11, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ NA-Schutz ab 30 kVA Pflicht', '💡 Zentral oder WR-integriert', '💡 Blindleistung Q(U) konfigurieren'],
    warnungen: ['⚠️ NA-Schutz-Zertifikat VOR IBN', '⚠️ Längere Bearbeitung (8 Wochen)'],
  },

  'GROSS_PV_DIREKTVERMARKTUNG': {
    name: 'Große PV Direktvermarktung', beschreibung: '>100 kWp',
    steps: ALLE_STEPS,
    technikFelder: { ...PV_TECHNIK, speicher: true, naSchutz: true, direktvermarktung: true },
    kundenFelder: GROSS_KUNDE,
    dokumente: { ...STANDARD_DOKS, e6NaSchutz: true, messkonzept: true, gewerbeanmeldung: true, handelsregisterauszug: true, blindleistungsnachweis: true },
    validierung: { ...STANDARD_VAL, naSchutzPflicht: true, direktvermarktungPflicht: true, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'erweitert', fristWochen: 8, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: true },
    hinweise: ['✅ Direktvermarktung Pflicht ab 100 kWp', '✅ Marktprämienmodell', '💡 RLM-Zähler nötig'],
    warnungen: ['⚠️ Keine EEG-Vergütung möglich', '⚠️ Vertrag VOR IBN abschließen'],
  },

  'GROSS_PV_MITTELSPANNUNG': {
    name: 'MS-Anschluss', beschreibung: '>135 kVA Mittelspannung',
    steps: ALLE_STEPS,
    technikFelder: { ...PV_TECHNIK, speicher: true, naSchutz: true, direktvermarktung: true },
    kundenFelder: GROSS_KUNDE,
    dokumente: { ...STANDARD_DOKS, e6NaSchutz: true, messkonzept: true, gewerbeanmeldung: true, handelsregisterauszug: true, netzvertraeglichkeit: true, anlagenzertifikat: true, blindleistungsnachweis: true },
    validierung: { ...STANDARD_VAL, naSchutzPflicht: true, anlagenzertifikatPflicht: true, direktvermarktungPflicht: true, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'ms_anschluss', fristWochen: 16, genehmigungPflicht: true, vdeNorm: 'VDE-AR-N 4110' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: true },
    hinweise: ['✅ Anschluss an 10/20 kV', '✅ VDE-AR-N 4110', '💡 Anlagenzertifikat Typ B'],
    warnungen: ['⚠️ Eigene Trafostation', '⚠️ 4-6 Monate Vorlauf', '⚠️ Baugenehmigung prüfen'],
  },

  'SPEICHER_NACHRUESTUNG_DC': {
    name: 'Speicher DC-Nachrüstung', beschreibung: 'DC-gekoppelt zu bestehender PV',
    steps: { ...ALLE_STEPS, step3: false },
    technikFelder: { pvModule: false, wechselrichter: true, speicher: true, wallbox: false, waermepumpe: false, bhkw: false, einspeiseart: false, messkonzept: false, stringPlanung: false, naSchutz: false, paragraph14a: false, direktvermarktung: false },
    kundenFelder: { ...PRIVAT_KUNDE, bankverbindung: false },
    dokumente: { ...MINIMAL_DOKS, e2Datenblatt: true, e3Inbetriebnahme: true, e5Speicher: true, schaltplan: true, wrDatenblatt: true, speicherDatenblatt: true, installateursausweis: true },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: true, mastrPflicht: true, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Hybrid-WR erforderlich', '✅ Höhere Effizienz', '💡 WR-Tausch oft sinnvoll'],
    warnungen: ['⚠️ Bestandsschutz EEG prüfen'],
  },

  'SPEICHER_NACHRUESTUNG_AC': {
    name: 'Speicher AC-Nachrüstung', beschreibung: 'AC-gekoppelt zu bestehender PV',
    steps: { ...ALLE_STEPS, step3: false },
    technikFelder: { pvModule: false, wechselrichter: false, speicher: true, wallbox: false, waermepumpe: false, bhkw: false, einspeiseart: false, messkonzept: false, stringPlanung: false, naSchutz: false, paragraph14a: false, direktvermarktung: false },
    kundenFelder: { ...PRIVAT_KUNDE, bankverbindung: false },
    dokumente: { ...MINIMAL_DOKS, e2Datenblatt: true, e3Inbetriebnahme: true, e5Speicher: true, schaltplan: true, speicherDatenblatt: true, installateursausweis: true },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: true, mastrPflicht: true, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Unabhängig vom WR', '✅ Einfache Nachrüstung', '💡 Notstrom einfacher'],
    warnungen: ['⚠️ Mehr Umwandlungsverluste'],
  },

  'SPEICHER_STANDALONE': {
    name: 'Standalone-Speicher', beschreibung: 'Ohne PV (Arbitrage/Notstrom)',
    steps: ALLE_STEPS,
    technikFelder: { pvModule: false, wechselrichter: false, speicher: true, wallbox: false, waermepumpe: false, bhkw: false, einspeiseart: false, messkonzept: true, stringPlanung: false, naSchutz: false, paragraph14a: false, direktvermarktung: false },
    kundenFelder: PRIVAT_KUNDE,
    dokumente: { ...MINIMAL_DOKS, e2Datenblatt: true, e3Inbetriebnahme: true, e5Speicher: true, schaltplan: true, speicherDatenblatt: true, installateursausweis: true },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: true, mastrPflicht: true, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Notstrom/USV möglich', '✅ Arbitrage mit dyn. Tarifen', '💡 Mit WP kombinieren'],
    warnungen: ['⚠️ Wirtschaftlichkeit prüfen'],
  },

  'WALLBOX_UNTER_4KW': {
    name: 'Wallbox ≤4,2kW', beschreibung: 'Ohne §14a-Pflicht',
    steps: MINIMAL_STEPS,
    technikFelder: { ...PARAGRAPH14A_TECHNIK, wallbox: true, paragraph14a: false },
    kundenFelder: { ...PRIVAT_KUNDE, bankverbindung: false },
    dokumente: MINIMAL_DOKS,
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: true, mastrPflicht: false, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'vereinfacht', fristWochen: 2, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4100' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Nur Anmeldung nötig', '✅ Keine MaStR-Pflicht', '💡 3,7kW einphasig meist ausreichend'],
    warnungen: ['⚠️ Kein §14a-Rabatt'],
  },

  'WALLBOX_STEUERBAR': {
    name: 'Wallbox §14a', beschreibung: '>4,2kW steuerbar',
    steps: ALLE_STEPS,
    technikFelder: { ...PARAGRAPH14A_TECHNIK, wallbox: true },
    kundenFelder: PRIVAT_KUNDE,
    dokumente: { ...MINIMAL_DOKS, e2Datenblatt: true, e3Inbetriebnahme: true, schaltplan: true, paragraph14aAnmeldung: true, installateursausweis: true },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: true, mastrPflicht: false, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4100' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: true, paragraph14aEuroJahr: 190, direktvermarktungPflicht: false },
    hinweise: ['✅ §14a: Bis 190€/Jahr sparen', '✅ Modul 1/2/3 wählbar', '💡 11kW Standard'],
    warnungen: ['⚠️ NB kann auf 4,2kW dimmen', '⚠️ Max. 2h Dimmung am Stück'],
  },

  'WAERMEPUMPE_STEUERBAR': {
    name: 'Wärmepumpe §14a', beschreibung: '>4,2kW steuerbar',
    steps: ALLE_STEPS,
    technikFelder: { ...PARAGRAPH14A_TECHNIK, waermepumpe: true },
    kundenFelder: PRIVAT_KUNDE,
    dokumente: { ...MINIMAL_DOKS, e2Datenblatt: true, e3Inbetriebnahme: true, schaltplan: true, paragraph14aAnmeldung: true, installateursausweis: true },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: true, mastrPflicht: false, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4100' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: true, paragraph14aEuroJahr: 190, direktvermarktungPflicht: false },
    hinweise: ['✅ §14a: Bis 190€/Jahr', '✅ SG-Ready Schnittstelle', '💡 Pufferspeicher empfohlen'],
    warnungen: ['⚠️ NB kann Leistung reduzieren'],
  },

  'WALLBOX_UND_WP_STEUERBAR': {
    name: 'WB + WP §14a', beschreibung: 'Beide steuerbar',
    steps: ALLE_STEPS,
    technikFelder: { ...PARAGRAPH14A_TECHNIK, wallbox: true, waermepumpe: true },
    kundenFelder: PRIVAT_KUNDE,
    dokumente: { ...MINIMAL_DOKS, e2Datenblatt: true, e3Inbetriebnahme: true, schaltplan: true, paragraph14aAnmeldung: true, installateursausweis: true },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: true, mastrPflicht: false, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4100' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: true, paragraph14aEuroJahr: 380, direktvermarktungPflicht: false },
    hinweise: ['✅ Doppelter §14a-Rabatt (380€/Jahr)', '✅ Gemeinsame Steuerbox möglich', '💡 EMS empfohlen'],
    warnungen: ['⚠️ Hausanschluss-Kapazität beachten'],
  },

  'WALLBOX_MIT_PV': {
    name: 'PV + Wallbox', beschreibung: 'PV-Überschussladen',
    steps: ALLE_STEPS,
    technikFelder: { ...PV_TECHNIK, wallbox: true, paragraph14a: true },
    kundenFelder: PRIVAT_KUNDE,
    dokumente: { ...STANDARD_DOKS, paragraph14aAnmeldung: true },
    validierung: STANDARD_VAL,
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 8.11, paragraph14aRabatt: true, paragraph14aEuroJahr: 190, direktvermarktungPflicht: false },
    hinweise: ['✅ PV-Überschussladen', '✅ §14a zusätzlich zur EEG', '💡 100% Solarstrom laden'],
    warnungen: [],
  },

  'WP_MIT_PV': {
    name: 'PV + Wärmepumpe', beschreibung: 'PV-optimiert heizen',
    steps: ALLE_STEPS,
    technikFelder: { ...PV_TECHNIK, waermepumpe: true, paragraph14a: true },
    kundenFelder: PRIVAT_KUNDE,
    dokumente: { ...STANDARD_DOKS, paragraph14aAnmeldung: true },
    validierung: STANDARD_VAL,
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 8.11, paragraph14aRabatt: true, paragraph14aEuroJahr: 190, direktvermarktungPflicht: false },
    hinweise: ['✅ Sektorenkopplung', '✅ WP als therm. Speicher', '💡 SG-Ready nutzen'],
    warnungen: [],
  },

  'KOMPLETT_SYSTEM': {
    name: 'Komplettsystem', beschreibung: 'PV+Speicher+WB+WP',
    steps: ALLE_STEPS,
    technikFelder: { pvModule: true, wechselrichter: true, speicher: true, wallbox: true, waermepumpe: true, bhkw: false, einspeiseart: true, messkonzept: true, stringPlanung: true, naSchutz: false, paragraph14a: true, direktvermarktung: false },
    kundenFelder: PRIVAT_KUNDE,
    dokumente: { ...STANDARD_DOKS, e5Speicher: true, speicherDatenblatt: true, paragraph14aAnmeldung: true, messkonzept: true },
    validierung: STANDARD_VAL,
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 8.11, paragraph14aRabatt: true, paragraph14aEuroJahr: 380, direktvermarktungPflicht: false },
    hinweise: ['✅ Maximale Autarkie (>80%)', '✅ Doppelter §14a-Bonus', '💡 Hybrid-WR ideal'],
    warnungen: ['⚠️ NA-Schutz ab 30 kVA', '⚠️ Hausanschluss prüfen'],
  },

  'HAUSANSCHLUSS_NEU': {
    name: 'Neuer Hausanschluss', beschreibung: 'Neubau-Anschluss',
    steps: { step1: true, step2: true, step3: true, step4: true, step5: false, step6: true, step7: true, step8: true },
    technikFelder: { pvModule: false, wechselrichter: false, speicher: false, wallbox: false, waermepumpe: false, bhkw: false, einspeiseart: false, messkonzept: false, stringPlanung: false, naSchutz: false, paragraph14a: false, direktvermarktung: false },
    kundenFelder: { ...PRIVAT_KUNDE, firma: true },
    dokumente: { ...MINIMAL_DOKS, lageplan: true },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: false, mastrPflicht: false, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'standard', fristWochen: 8, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4100' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Frühzeitig beantragen (8-12 Wo)', '💡 PV + Speicher mitplanen', '💡 Größeren Anschluss für E-Mob'],
    warnungen: ['⚠️ Kosten je nach Entfernung'],
  },

  'BAUSTROM_TEMPORAER': {
    name: 'Baustrom', beschreibung: 'Temporärer Anschluss',
    steps: { step1: true, step2: true, step3: false, step4: true, step5: false, step6: true, step7: false, step8: true },
    technikFelder: { pvModule: false, wechselrichter: false, speicher: false, wallbox: false, waermepumpe: false, bhkw: false, einspeiseart: false, messkonzept: false, stringPlanung: false, naSchutz: false, paragraph14a: false, direktvermarktung: false },
    kundenFelder: { ...GEWERBE_KUNDE, handelsregister: false },
    dokumente: { ...MINIMAL_DOKS, lageplan: true, gewerbeanmeldung: true },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: false, mastrPflicht: false, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'vereinfacht', fristWochen: 2, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4100' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Schnell (1-2 Wochen)', '💡 Max. 2 Jahre Laufzeit'],
    warnungen: ['⚠️ Höhere Netzentgelte', '⚠️ Kaution nötig'],
  },

  'BHKW_KLEIN': {
    name: 'Klein-BHKW', beschreibung: '<50 kW',
    steps: ALLE_STEPS,
    technikFelder: { pvModule: false, wechselrichter: false, speicher: false, wallbox: false, waermepumpe: false, bhkw: true, einspeiseart: true, messkonzept: true, stringPlanung: false, naSchutz: false, paragraph14a: false, direktvermarktung: false },
    kundenFelder: GEWERBE_KUNDE,
    dokumente: { ...STANDARD_DOKS, gewerbeanmeldung: true, messkonzept: true },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: true, mastrPflicht: true, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: true },
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ KWK-Zuschlag', '✅ >90% Wirkungsgrad', '💡 Wärmegeführt'],
    warnungen: ['⚠️ Wartungsintensiv'],
  },

  'BHKW_GROSS': {
    name: 'Groß-BHKW', beschreibung: '≥50 kW',
    steps: ALLE_STEPS,
    technikFelder: { pvModule: false, wechselrichter: false, speicher: false, wallbox: false, waermepumpe: false, bhkw: true, einspeiseart: true, messkonzept: true, stringPlanung: false, naSchutz: true, paragraph14a: false, direktvermarktung: true },
    kundenFelder: GROSS_KUNDE,
    dokumente: { ...STANDARD_DOKS, e6NaSchutz: true, gewerbeanmeldung: true, handelsregisterauszug: true, messkonzept: true, netzvertraeglichkeit: true, anlagenzertifikat: true, blindleistungsnachweis: true },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: true, anlagenzertifikatPflicht: true, installateursEintragung: true, mastrPflicht: true, direktvermarktungPflicht: true, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'erweitert', fristWochen: 12, genehmigungPflicht: true, vdeNorm: 'VDE-AR-N 4110' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: true },
    hinweise: ['✅ Gewerbe/Industrie/Nahwärme', '💡 BAFA-Förderung'],
    warnungen: ['⚠️ BImSchG-Genehmigung', '⚠️ 3-6 Monate Vorlauf'],
  },

  'WINDKRAFT_KLEIN': {
    name: 'Kleinwindanlage', beschreibung: 'Eigenversorgung',
    steps: ALLE_STEPS,
    technikFelder: { pvModule: false, wechselrichter: true, speicher: true, wallbox: false, waermepumpe: false, bhkw: false, einspeiseart: true, messkonzept: true, stringPlanung: false, naSchutz: false, paragraph14a: false, direktvermarktung: false },
    kundenFelder: PRIVAT_KUNDE,
    dokumente: { ...STANDARD_DOKS },
    validierung: STANDARD_VAL,
    verfahren: { typ: 'erweitert', fristWochen: 8, genehmigungPflicht: true, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 8.0, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Windreiche Standorte', '✅ Ergänzung zu PV', '💡 <10m oft genehmigungsfrei'],
    warnungen: ['⚠️ Baugenehmigung', '⚠️ Nachbarrecht', '⚠️ Ertrag kritisch prüfen'],
  },

  'INSELANLAGE': {
    name: 'Inselanlage', beschreibung: 'Off-Grid autark',
    steps: { step1: true, step2: true, step3: true, step4: false, step5: true, step6: true, step7: false, step8: true },
    technikFelder: { pvModule: true, wechselrichter: true, speicher: true, wallbox: false, waermepumpe: false, bhkw: false, einspeiseart: false, messkonzept: false, stringPlanung: true, naSchutz: false, paragraph14a: false, direktvermarktung: false },
    kundenFelder: PRIVAT_KUNDE,
    dokumente: MINIMAL_DOKS,
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: true, mastrPflicht: false, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'vereinfacht', fristWochen: 0, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Keine Netzanmeldung nötig', '✅ 100% autark', '💡 Insel-WR + großer Speicher'],
    warnungen: ['⚠️ Keine EEG-Vergütung', '⚠️ Backup (Generator) empfohlen'],
  },

  'NULLEINSPEISUNG': {
    name: 'Nulleinspeisung', beschreibung: 'Mit Rundsteuerempfänger',
    steps: ALLE_STEPS,
    technikFelder: { ...PV_TECHNIK, speicher: true },
    kundenFelder: PRIVAT_KUNDE,
    dokumente: { ...STANDARD_DOKS, messkonzept: true },
    validierung: STANDARD_VAL,
    verfahren: { typ: 'standard', fristWochen: 4, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Kein Netz-Export', '✅ 100% Eigenverbrauch', '💡 RSE oder dynamische Regelung'],
    warnungen: ['⚠️ Keine Vergütung', '⚠️ Überschuss wird abgeregelt'],
  },

  'MEHRERE_ANLAGEN': {
    name: 'Anlagenzusammenfassung', beschreibung: 'Mehrere Anlagen am Standort',
    steps: ALLE_STEPS,
    technikFelder: { ...PV_TECHNIK, speicher: true, naSchutz: true },
    kundenFelder: GEWERBE_KUNDE,
    dokumente: { ...STANDARD_DOKS, messkonzept: true },
    validierung: { ...STANDARD_VAL, naSchutzPflicht: true },
    verfahren: { typ: 'erweitert', fristWochen: 8, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 8.11, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Anlagen werden zusammengefasst', '💡 Separate MaStR-Einträge'],
    warnungen: ['⚠️ Gesamtleistung für Grenzwerte', '⚠️ Komplexe Vergütung'],
  },

  'MIETERSTROMMODELL': {
    name: 'Mieterstrom', beschreibung: 'Stromlieferung an Mieter',
    steps: ALLE_STEPS,
    technikFelder: { ...PV_TECHNIK, speicher: true, messkonzept: true },
    kundenFelder: GEWERBE_KUNDE,
    dokumente: { ...STANDARD_DOKS, messkonzept: true, gewerbeanmeldung: true },
    validierung: STANDARD_VAL,
    verfahren: { typ: 'erweitert', fristWochen: 8, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 8.11, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Mieterstromzuschlag', '✅ Max. Preis = 90% Grundversorgung', '💡 Summenzählermodell'],
    warnungen: ['⚠️ Stromliefervertrag nötig', '⚠️ Energieversorger-Pflichten'],
  },

  'EIGENVERBRAUCHSGEMEINSCHAFT': {
    name: 'Eigenverbrauchsgemeinschaft', beschreibung: 'Energy Sharing EEG 2024',
    steps: ALLE_STEPS,
    technikFelder: { ...PV_TECHNIK, speicher: true, messkonzept: true },
    kundenFelder: GEWERBE_KUNDE,
    dokumente: { ...STANDARD_DOKS, messkonzept: true },
    validierung: STANDARD_VAL,
    verfahren: { typ: 'erweitert', fristWochen: 8, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 8.11, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Neues EEG 2024 Modell', '✅ Virtuelle Stromlieferung', '💡 Smart Meter Pflicht'],
    warnungen: ['⚠️ Details noch in Klärung', '⚠️ Netzbetreiber-Abstimmung'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: NEUE PROZESSE (Demontage, Zähler, Fertigmeldung)
  // ═══════════════════════════════════════════════════════════════════════════

  'DEMONTAGE_ANLAGE': {
    name: 'Demontage/Stilllegung', beschreibung: 'Abbau bestehender Anlage',
    steps: { step1: true, step2: true, step3: false, step4: true, step5: false, step6: true, step7: true, step8: true },
    technikFelder: { pvModule: false, wechselrichter: false, speicher: false, wallbox: false, waermepumpe: false, bhkw: false, einspeiseart: false, messkonzept: false, stringPlanung: false, naSchutz: false, paragraph14a: false, direktvermarktung: false },
    kundenFelder: { ...PRIVAT_KUNDE, bankverbindung: false },
    dokumente: { ...MINIMAL_DOKS, e1Anmeldung: true },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: true, mastrPflicht: true, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'vereinfacht', fristWochen: 2, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ MaStR-Stilllegung melden', '✅ Zähler-Rückbau beim NB anmelden', '💡 EEG-Vergütung endet'],
    warnungen: ['⚠️ Anlage spannungsfrei schalten', '⚠️ Netzbetreiber VOR Demontage informieren'],
  },

  'ZAEHLER_PROZESS': {
    name: 'Zähler-Prozess', beschreibung: 'Zählerwechsel/Neusetzung',
    steps: { step1: true, step2: true, step3: false, step4: true, step5: false, step6: true, step7: false, step8: true },
    technikFelder: { pvModule: false, wechselrichter: false, speicher: false, wallbox: false, waermepumpe: false, bhkw: false, einspeiseart: false, messkonzept: false, stringPlanung: false, naSchutz: false, paragraph14a: false, direktvermarktung: false },
    kundenFelder: { ...PRIVAT_KUNDE, bankverbindung: false },
    dokumente: { ...MINIMAL_DOKS, e1Anmeldung: false },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: false, mastrPflicht: false, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: false },
    verfahren: { typ: 'vereinfacht', fristWochen: 2, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4100' },
    finanzen: { eegVerguetung: false, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ Schneller Prozess (1-2 Wochen)', '✅ Zählernummer dokumentieren', '💡 Smart Meter Pflicht ab 2025'],
    warnungen: ['⚠️ Alten Zählerstand notieren', '⚠️ Termin beim NB/MSB abstimmen'],
  },

  'FERTIGMELDUNG': {
    name: 'Fertigmeldung', beschreibung: 'Abschluss nach Installation',
    steps: { step1: true, step2: true, step3: false, step4: true, step5: false, step6: true, step7: true, step8: true },
    technikFelder: { pvModule: false, wechselrichter: false, speicher: false, wallbox: false, waermepumpe: false, bhkw: false, einspeiseart: false, messkonzept: false, stringPlanung: false, naSchutz: false, paragraph14a: false, direktvermarktung: false },
    kundenFelder: { ...PRIVAT_KUNDE, bankverbindung: false },
    dokumente: { ...MINIMAL_DOKS, e3Inbetriebnahme: true, installateursausweis: true },
    validierung: { zerezIdPflicht: false, naSchutzPflicht: false, anlagenzertifikatPflicht: false, installateursEintragung: true, mastrPflicht: true, direktvermarktungPflicht: false, einspeiseverguetungMoeglich: true },
    verfahren: { typ: 'vereinfacht', fristWochen: 1, genehmigungPflicht: false, vdeNorm: 'VDE-AR-N 4105' },
    finanzen: { eegVerguetung: true, eegVerguetungCent: 8.11, paragraph14aRabatt: false, direktvermarktungPflicht: false },
    hinweise: ['✅ IBN-Protokoll E.8 erstellen', '✅ MaStR-Meldung abschließen', '✅ Pflichtfotos hochladen'],
    warnungen: ['⚠️ Alle Prüfungen dokumentieren', '⚠️ Netzbetreiber-Bestätigung abwarten'],
  },
};

export function getSzenarioConfig(szenario: AnmeldeSzenario): SzenarioConfig {
  return SZENARIO_CONFIGS[szenario];
}
