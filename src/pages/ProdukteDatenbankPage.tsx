/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  PRODUKT-DATENBANK PREMIUM - VOLLSTÄNDIGE EDITION MIT DOKUMENTEN             ║
 * ║                                                                               ║
 * ║  Features:                                                                    ║
 * ║  • PV-Module, Wechselrichter, Batteriesysteme mit ALLEN Feldern              ║
 * ║  • Ausführliche Add-Modals mit mehreren Tabs                                  ║
 * ║  • Dokumente-Tab (Datenblatt, Zertifikat, ZEREZ-ID)                          ║
 * ║  • Detail-Modals mit Charts und Visualisierungen                             ║
 * ║  • CSV Import für PV*SOL Export                                               ║
 * ║  • Premium Glassmorphism UI                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import {
  Plus, Search, Check, X, Edit2, Trash2, Package, FileText,
  Upload, Sun, Zap, Battery, Car, Thermometer, Building2,
  RefreshCw, ExternalLink, CheckCircle2, AlertCircle, Loader2,
  ChevronDown, Download, Filter, BarChart3, Activity, Gauge, 
  Box, Link2, Info, TrendingUp, Clock, Plug, Settings2, 
  Database, FileSpreadsheet, Eye, Cpu, Grid3X3, Award, Image as ImageIcon,
  CheckSquare, Square, Trash
} from 'lucide-react';
import api from '../modules/api/client';
import './ProdukteDatenbankPage.css';

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Hersteller {
  id: number;
  name: string;
  kurzname?: string;
  website?: string;
  aktiv: boolean;
  verified: boolean;
  usageCount: number;
}

// PV-Modul Interface - ALLE Felder
interface PvModul {
  id?: number;
  herstellerId?: number;
  hersteller?: Hersteller;
  modell: string;
  artikelNr?: string;
  // Elektrische Daten
  leistungWp: number;
  spannungMppV?: number;
  stromMppA?: number;
  leerlaufspannungV?: number;
  kurzschlussstromA?: number;
  wirkungsgradProzent?: number;
  // Zell-Daten
  zelltyp?: string;
  zellenAnzahl?: number;
  halbzellenModul?: boolean;
  bifacial?: boolean;
  bifazialitaetsfaktorProzent?: number;
  // Temperaturkoeffizienten
  tempKoeffPmppProzentK?: number;
  tempKoeffUocProzentK?: number;
  tempKoeffIscProzentK?: number;
  noct?: number;
  // Abmessungen
  breiteMm?: number;
  hoeheMm?: number;
  tiefeMm?: number;
  flaecheM2?: number;
  gewichtKg?: number;
  // Garantie
  produktgarantieJahre?: number;
  leistungsgarantieJahre?: number;
  leistungsgarantieProzent?: number;
  // Dokumente
  datenblattUrl?: string;
  datenblattPfad?: string;
  bildUrl?: string;
  // Meta
  verified?: boolean;
}

// Wechselrichter Interface - ALLE Felder
interface Wechselrichter {
  id?: number;
  herstellerId?: number;
  hersteller?: Hersteller;
  modell: string;
  artikelNr?: string;
  // DC-Seite
  dcNennleistungKW?: number;
  dcLeistungMaxKW?: number;
  dcSpannungMaxV?: number;
  dcSpannungStartV?: number;
  dcStromMaxA?: number;
  // AC-Seite
  acNennleistungKW?: number;
  acLeistungMaxKW?: number;
  acSpannungV?: number;
  acStromMaxA?: number;
  phasen?: number;
  // MPP-Tracker
  mppTrackerAnzahl?: number;
  mppSpannungMinV?: number;
  mppSpannungMaxV?: number;
  stringsProTracker?: number;
  stringsGesamt?: number;
  // Wirkungsgrad
  wirkungsgrad5?: number;
  wirkungsgrad10?: number;
  wirkungsgrad20?: number;
  wirkungsgrad25?: number;
  wirkungsgrad30?: number;
  wirkungsgrad50?: number;
  wirkungsgrad75?: number;
  wirkungsgrad100?: number;
  wirkungsgradMaxProzent?: number;
  wirkungsgradEuroProzent?: number;
  // Features
  hybrid?: boolean;
  notstromfaehig?: boolean;
  schattenmanagement?: boolean;
  // Abmessungen
  breiteMm?: number;
  hoeheMm?: number;
  tiefeMm?: number;
  gewichtKg?: number;
  schutzartIp?: string;
  // Dokumente
  datenblattUrl?: string;
  datenblattPfad?: string;
  zertifikatUrl?: string;
  konformitaetserklaerungUrl?: string;
  zerezId?: string;
  bildUrl?: string;
  // Meta
  verified?: boolean;
}

// Batteriesystem Interface - ALLE 63+ Felder aus PV*SOL (für CSV Import)
interface Batteriesystem {
  id?: number;
  produktNr?: number;
  artDerKopplung?: string;
  batterieTypListe?: string;
  name: string;
  herstellerWebsite?: string;
  beschreibung?: string;
  lieferbar?: boolean;
  herstellerId?: number;
  hersteller?: Hersteller;
  // Leistungsdaten
  nennleistungKW?: number;
  maxLadeleistungKW?: number;
  maxEntladeleistungKW?: number;
  // Wirkungsgrad
  wirkungsgrad0?: number;
  wirkungsgrad5?: number;
  wirkungsgrad10?: number;
  wirkungsgrad20?: number;
  wirkungsgrad30?: number;
  wirkungsgrad50?: number;
  wirkungsgrad75?: number;
  wirkungsgrad100?: number;
  // Ladestrategie
  ausgleichStart?: number;
  ausgleichEnde?: number;
  ausgleichDauerH?: number;
  ausgleichZyklusD?: number;
  vollStart?: number;
  vollEnde?: number;
  vollDauerH?: number;
  vollZyklusD?: number;
  erhaltungProzent?: number;
  u0Start?: number;
  u0Ende?: number;
  u0DauerH?: number;
  iStart?: number;
  iEnde?: number;
  // Batteriesystem
  batterieNameSystem?: string;
  anzahlBatterienProStrang?: number;
  anzahlBatteriestraenge?: number;
  batteriesystemspannungDCV?: number;
  nutzbareBatterieenergieKWh?: number;
  batteriekapazitaetC10Ah?: number;
  // Batterie-Details
  battWebsite?: string;
  battName?: string;
  battBeschreibung?: string;
  battLieferbar?: boolean;
  battBatterietyp?: string;
  battZellspannungV?: number;
  battAnzahlZellen?: number;
  battNennspannungV?: number;
  battAnzahlStraenge?: number;
  battInnenwiderstandMOhm?: number;
  battSelbstentladungProzent?: number;
  // Entladezyklen
  battZyklenDoD20?: number;
  battZyklenDoD40?: number;
  battZyklenDoD60?: number;
  battZyklenDoD80?: number;
  // Kapazität
  battKap10minAh?: number;
  battKap30minAh?: number;
  battKap1hAh?: number;
  battKap5hAh?: number;
  battKap10hAh?: number;
  battKap100hAh?: number;
  // Abmessungen
  battLaengeMm?: number;
  battBreiteMm?: number;
  battHoeheMm?: number;
  battGewichtKg?: number;
  // Dokumente
  datenblattUrl?: string;
  datenblattPfad?: string;
  zertifikatUrl?: string;
  zerezId?: string;
  bildUrl?: string;
  // Meta
  verified?: boolean;
}

// Speicher Interface - aufgeteilte Daten aus speicher_db
interface Speicher {
  id?: number;
  herstellerId?: number;
  hersteller?: Hersteller;
  modell: string;
  artikelNr?: string;
  eanCode?: string;
  kapazitaetBruttoKwh: number;
  kapazitaetNettoKwh?: number;
  entladetiefeProzent?: number;
  ladeleistungMaxKw?: number;
  entladeleistungMaxKw?: number;
  dauerladeleistungKw?: number;
  dauerentladeleistungKw?: number;
  nennspannungV?: number;
  spannungsbereichMinV?: number;
  spannungsbereichMaxV?: number;
  batterietyp?: string;
  kopplung?: string;
  notstromfaehig?: boolean;
  ersatzstromfaehig?: boolean;
  inselfaehig?: boolean;
  wirkungsgradProzent?: number;
  zyklenBeiDod80?: number;
  zyklenBeiDod100?: number;
  kalendarischeLebensdauerJahre?: number;
  laengeMm?: number;
  breiteMm?: number;
  tiefeMm?: number;
  gewichtKg?: number;
  schutzartIp?: string;
  montageort?: string;
  modular?: boolean;
  garantieJahre?: number;
  garantieZyklen?: number;
  datenblattUrl?: string;
  datenblattPfad?: string;
  bildUrl?: string;
  usageCount?: number;
  verified?: boolean;
  aktiv?: boolean;
  notizen?: string;
}

type ProduktTyp = 'pvModule' | 'wechselrichter' | 'speicher' | 'wallboxen' | 'waermepumpen' | 'hersteller';

const TABS = [
  { key: 'pvModule' as ProduktTyp, label: 'PV-Module', icon: Sun, color: '#f59e0b' },
  { key: 'wechselrichter' as ProduktTyp, label: 'Wechselrichter', icon: Zap, color: '#3b82f6' },
  { key: 'speicher' as ProduktTyp, label: 'Speicher', icon: Battery, color: '#10b981' },
  { key: 'wallboxen' as ProduktTyp, label: 'Wallboxen', icon: Car, color: '#EAD068' },
  { key: 'waermepumpen' as ProduktTyp, label: 'Wärmepumpen', icon: Thermometer, color: '#ef4444' },
  { key: 'hersteller' as ProduktTyp, label: 'Hersteller', icon: Building2, color: '#64748b' },
];

// PV*SOL CSV Mapping - Vollständig für Batteriesysteme
const PVSOL_CSV_MAPPING: Record<string, string> = {
  // ═══════════════════════════════════════════════════════════════════════════════
  // PV-MODULE MAPPINGS (PV*SOL Export)
  // ═══════════════════════════════════════════════════════════════════════════════
  'Unternehmen': 'herstellerName',
  'Zelltyp': 'zelltyp',
  'Nennleistung_W': 'leistungWp',
  'Wirkungsgrad_Prozent': 'wirkungsgradProzent',
  'Anzahl_Zellen': 'zellenAnzahl',
  'Anzahl_Bypassdioden': 'anzahlBypassdioden',
  'Halbzellen_Modul': 'halbzellenModul',
  'Spannung_MPP_V': 'spannungMppV',
  'Strom_MPP_A': 'stromMppA',
  'Leerlaufspannung_V': 'leerlaufspannungV',
  'Kurzschlussstrom_A': 'kurzschlussstromA',
  'Temperaturkoeff_Pmpp_Prozent_K': 'tempKoeffPmppProzentK',
  'Temperaturkoeff_Uoc_mV_K': 'tempKoeffUocMvK',
  'Temperaturkoeff_Isc_mA_K': 'tempKoeffIscMaK',
  'Max_Systemspannung_V': 'maxSystemspannungV',
  'Bifazialitaetsfaktor_Prozent': 'bifazialitaetsfaktorProzent',
  'Breite_mm': 'breiteMm',
  'Hoehe_mm': 'hoeheMm',
  'Tiefe_mm': 'tiefeMm',
  'Rahmenbreite_mm': 'rahmenbreiteMm',
  'Gewicht_kg': 'gewichtKg',
  // Schwachlichtverhalten
  'Standard_Schwachlichtverhalten': 'standardSchwachlichtverhalten',
  'Einstrahlung_Schwachlicht_W_m2': 'einstrahlungSchwachlichtWM2',
  'MPP_Spannung_Schwachlicht_V': 'mppSpannungSchwachlichtV',
  'MPP_Strom_Schwachlicht_A': 'mppStromSchwachlichtA',
  'Leerlaufspannung_Schwachlicht_V': 'leerlaufspannungSchwachlichtV',
  'Kurzschlussstrom_Schwachlicht_A': 'kurzschlussstromSchwachlichtA',
  // Winkel
  'Winkelkorrekturfaktor_IAM_Prozent': 'winkelkorrekturfaktorIamProzent',
  // Sonstiges
  'Erhoehung_Leerlaufspannung_Prozent': 'erhoehungLeerlaufspannungProzent',
  'Zellstraenge_senkrecht_kurze_Seite': 'zellstraengeSenkrechtKurzeSeite',
  'Nur_Trafo_WR_geeignet': 'nurTrafoWrGeeignet',
  'Version': 'version',
  'BenutzerID': 'benutzerId',
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // WECHSELRICHTER MAPPINGS (PV*SOL Export)
  // ═══════════════════════════════════════════════════════════════════════════════
  'Verfuegbar': 'verfuegbar',
  'Anzahl_MPP_Tracker': 'anzahlMppTracker',
  'DC_Nennleistung_kW': 'dcNennleistungKW',
  'Max_DC_Leistung_kW': 'maxDcLeistungKW',
  'DC_Nennspannung_V': 'dcNennspannungV',
  'Max_Eingangsspannung_V': 'maxEingangsspannungV',
  'Max_Eingangsstrom_A': 'maxEingangsstromA',
  'Max_Kurzschlussstrom_DC_A': 'maxKurzschlussstromDcA',
  'Anzahl_DC_Eingaenge': 'anzahlDcEingaenge',
  'AC_Nennleistung_kW': 'acNennleistungKW',
  'Max_AC_Leistung_kVA': 'maxAcLeistungKVA',
  'AC_Nennspannung_V': 'acNennspannungV',
  'Anzahl_Phasen': 'anzahlPhasen',
  'Mit_Trafo': 'mitTrafo',
  'Wirkungsgrad_Aenderung_Prozent_100V': 'wirkungsgradAenderungProzent100V',
  'Min_Einspeiseleistung_W': 'minEinspeiseleistungW',
  'Standby_Verbrauch_W': 'standbyVerbrauchW',
  'Nachtverbrauch_W': 'nachtverbrauchW',
  'Leistungsbereich_unter_20_Prozent': 'leistungsbereichUnter20Prozent',
  'Leistungsbereich_ueber_20_Prozent': 'leistungsbereichUeber20Prozent',
  'Parallelbetrieb': 'parallelbetrieb',
  // MPPT Typ 1
  'Anzahl_MPPT_Typ1': 'anzahlMpptTyp1',
  'Max_Eingangsstrom_MPPT_Typ1_A': 'maxEingangsstromMpptTyp1A',
  'Max_Kurzschlussstrom_MPPT_Typ1_A': 'maxKurzschlussstromMpptTyp1A',
  'Max_Eingangsleistung_MPPT_Typ1_kW': 'maxEingangsleistungMpptTyp1KW',
  'Min_Eingangsspannung_MPPT_Typ1_V': 'minEingangsspannungMpptTyp1V',
  'Max_Eingangsspannung_MPPT_Typ1_V': 'maxEingangsspannungMpptTyp1V',
  // MPPT Typ 2
  'Anzahl_MPPT_Typ2': 'anzahlMpptTyp2',
  'Max_Eingangsstrom_MPPT_Typ2_A': 'maxEingangsstromMpptTyp2A',
  'Max_Kurzschlussstrom_MPPT_Typ2_A': 'maxKurzschlussstromMpptTyp2A',
  'Max_Eingangsleistung_MPPT_Typ2_kW': 'maxEingangsleistungMpptTyp2KW',
  'Min_Eingangsspannung_MPPT_Typ2_V': 'minEingangsspannungMpptTyp2V',
  'Max_Eingangsspannung_MPPT_Typ2_V': 'maxEingangsspannungMpptTyp2V',
  // MPPT Typ 3
  'Anzahl_MPPT_Typ3': 'anzahlMpptTyp3',
  'Max_Eingangsstrom_MPPT_Typ3_A': 'maxEingangsstromMpptTyp3A',
  'Max_Kurzschlussstrom_MPPT_Typ3_A': 'maxKurzschlussstromMpptTyp3A',
  'Max_Eingangsleistung_MPPT_Typ3_kW': 'maxEingangsleistungMpptTyp3KW',
  'Min_Eingangsspannung_MPPT_Typ3_V': 'minEingangsspannungMpptTyp3V',
  'Max_Eingangsspannung_MPPT_Typ3_V': 'maxEingangsspannungMpptTyp3V',
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // BATTERIESYSTEM MAPPINGS (PV*SOL Export)
  // ═══════════════════════════════════════════════════════════════════════════════
  'Art_der_Kopplung': 'artDerKopplung',
  'Nennleistung_kW': 'nennleistungKW',
  'Max_Ladeleistung_kW': 'maxLadeleistungKW',
  'Max_Entladeleistung_kW': 'maxEntladeleistungKW',
  'Minimaler_SOC': 'minimalerSoc',
  'SOC_Boost_Ladung_Start': 'socBoostLadungStart',
  'SOC_Boost_Ladung_Ende': 'socBoostLadungEnde',
  'SOC_Float_Ladung_Start': 'socFloatLadungStart',
  'SOC_Voll_Ladung_Ende': 'socVollLadungEnde',
  'SOC_Ausgleich_Ladung_Ende': 'socAusgleichLadungEnde',
  'Dauer_Boost_Ladung': 'dauerBoostLadung',
  'Dauer_Voll_Ladung': 'dauerVollLadung',
  'Dauer_Ausgleich_Ladung': 'dauerAusgleichLadung',
  'Zyklus_Voll_Ladung': 'zyklusVollLadung',
  'Zyklus_Ausgleich_Ladung': 'zyklusAusgleichLadung',
  'Batterie_Typ': 'batterieTyp',
  'Anzahl_Batterien_pro_Strang': 'anzahlBatterienProStrang',
  'Anzahl_Batteriestraenge': 'anzahlBatteriestraenge',
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // GEMEINSAME FELDER
  // ═══════════════════════════════════════════════════════════════════════════════
  'Produkt_Nr': 'produktNr',
  'Batterie_Typ_Liste': 'batterieTypListe',
  'Name': 'name',
  'Hersteller_Website': 'herstellerWebsite',
  'Beschreibung': 'beschreibung',
  'Lieferbar': 'lieferbar',
  // Wirkungsgrad
  'Wirkungsgrad_0': 'wirkungsgrad0',
  'Wirkungsgrad_5': 'wirkungsgrad5',
  'Wirkungsgrad_10': 'wirkungsgrad10',
  'Wirkungsgrad_20': 'wirkungsgrad20',
  'Wirkungsgrad_30': 'wirkungsgrad30',
  'Wirkungsgrad_50': 'wirkungsgrad50',
  'Wirkungsgrad_75': 'wirkungsgrad75',
  'Wirkungsgrad_100': 'wirkungsgrad100',
  // Ladestrategie Ausgleich
  'Ausgleich_Start': 'ausgleichStart',
  'Ausgleich_Ende': 'ausgleichEnde',
  'Ausgleich_Dauer_h': 'ausgleichDauerH',
  'Ausgleich_Zyklus_d': 'ausgleichZyklusD',
  // Ladestrategie Voll
  'Voll_Start': 'vollStart',
  'Voll_Ende': 'vollEnde',
  'Voll_Dauer_h': 'vollDauerH',
  'Voll_Zyklus_d': 'vollZyklusD',
  'Erhaltung_Prozent': 'erhaltungProzent',
  // U0/I
  'U0_Start': 'u0Start',
  'U0_Ende': 'u0Ende',
  'U0_Dauer_h': 'u0DauerH',
  'I_Start': 'iStart',
  'I_Ende': 'iEnde',
  // Batteriesystem (alte Felder - neue sind oben)
  'Batterie_Name_System': 'batterieNameSystem',
  'Batteriesystemspannung_DC_V': 'batteriesystemspannungDCV',
  'Nutzbare_Batterieenergie_kWh': 'nutzbareBatterieenergieKWh',
  'Batteriekapazitaet_C10_Ah': 'batteriekapazitaetC10Ah',
  // Batterie Details - WICHTIG: Batt_Name → name, Batt_Website → herstellerWebsite für CSV Import
  'Batt_Website': 'herstellerWebsite',
  'Batt_Name': 'name',
  'Batt_Beschreibung': 'beschreibung',
  'Batt_Lieferbar': 'lieferbar',
  'Batt_Batterietyp': 'battBatterietyp',
  'Batt_Zellspannung_V': 'battZellspannungV',
  'Batt_Anzahl_Zellen': 'battAnzahlZellen',
  'Batt_Nennspannung_V': 'battNennspannungV',
  'Batt_Anzahl_Straenge': 'battAnzahlStraenge',
  'Batt_Innenwiderstand_mOhm': 'battInnenwiderstandMOhm',
  'Batt_Selbstentladung_Prozent': 'battSelbstentladungProzent',
  // Zyklen
  'Batt_Zyklen_DoD20': 'battZyklenDoD20',
  'Batt_Zyklen_DoD40': 'battZyklenDoD40',
  'Batt_Zyklen_DoD60': 'battZyklenDoD60',
  'Batt_Zyklen_DoD80': 'battZyklenDoD80',
  // Kapazität
  'Batt_Kap_10min_Ah': 'battKap10minAh',
  'Batt_Kap_30min_Ah': 'battKap30minAh',
  'Batt_Kap_1h_Ah': 'battKap1hAh',
  'Batt_Kap_5h_Ah': 'battKap5hAh',
  'Batt_Kap_10h_Ah': 'battKap10hAh',
  'Batt_Kap_100h_Ah': 'battKap100hAh',
  // Abmessungen
  'Batt_Laenge_mm': 'battLaengeMm',
  'Batt_Breite_mm': 'battBreiteMm',
  'Batt_Hoehe_mm': 'battHoeheMm',
  'Batt_Gewicht_kg': 'battGewichtKg',
};

// ═══════════════════════════════════════════════════════════════════════════════
// HERSTELLER EXTRAKTION AUS URL
// ═══════════════════════════════════════════════════════════════════════════════

const HERSTELLER_URL_MAPPING: Record<string, string> = {
  '1komma5grad': '1Komma5°', '1komma5': '1Komma5°',
  'sma.de': 'SMA', 'sma-solar': 'SMA',
  'fronius': 'Fronius', 'huawei': 'Huawei',
  'solaredge': 'SolarEdge', 'kostal': 'KOSTAL',
  'byd': 'BYD', 'lg.com': 'LG', 'lgessbattery': 'LG',
  'sonnenbatterie': 'sonnen', 'sonnen.de': 'sonnen',
  'e3dc': 'E3/DC', 'senec': 'SENEC', 'rct-power': 'RCT Power',
  'goodwe': 'GoodWe', 'growatt': 'Growatt',
  'sungrow': 'Sungrow', 'fox-ess': 'Fox ESS', 'foxess': 'Fox ESS',
  'solax': 'SolaX', 'victron': 'Victron Energy',
  'pylontech': 'Pylontech', 'enphase': 'Enphase',
  'tesla': 'Tesla', 'alpha-ess': 'Alpha ESS', 'alphaess': 'Alpha ESS',
  'axitec': 'AXITEC', 'hager': 'Hager', 'solarwatt': 'SOLARWATT',
  'varta': 'VARTA', 'kaco': 'KACO', 'steca': 'Steca',
  'fenecon': 'FENECON', 'azzurro': 'Azzurro',
  'sofar': 'Sofar Solar', 'jinko': 'JinkoSolar',
  'longi': 'LONGi', 'canadian': 'Canadian Solar',
  'ja-solar': 'JA Solar', 'jasolar': 'JA Solar',
  'trina': 'Trina Solar', 'meyer': 'Meyer Burger',
  'aiko': 'Aiko Solar', 'rec-group': 'REC', 'recgroup': 'REC',
  'sunpower': 'SunPower', 'qcells': 'Q CELLS', 'q-cells': 'Q CELLS', 'hanwha': 'Q CELLS',
  'ads-tec': 'ADS-TEC', 'tesvolt': 'Tesvolt', 'intilion': 'Intilion',
  'bslbatt': 'BSLBATT', 'dyness': 'Dyness', 'pytes': 'Pytes',
  'bluetti': 'Bluetti', 'ecoflow': 'EcoFlow', 'zendure': 'Zendure',
};

function extractHerstellerFromUrl(url: string | null | undefined): string {
  if (!url) return '–';
  const urlLower = url.toLowerCase();
  for (const [key, name] of Object.entries(HERSTELLER_URL_MAPPING)) {
    if (urlLower.includes(key)) return name;
  }
  // Fallback: Domain-Name extrahieren
  try {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\.]+)/i);
    if (match?.[1]) return match[1].charAt(0).toUpperCase() + match[1].slice(1);
  } catch {}
  return '–';
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`pdb-toast pdb-toast--${type}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
    </div>
  );
}

function DokumenteSection({ item, type }: { item: any; type: string }) {
  const hasDocs = item.datenblattUrl || item.zertifikatUrl || item.konformitaetserklaerungUrl || item.zerezId;
  return (
    <div className="pdb-detail-section-full">
      <h3>Dokumente & Zertifikate</h3>
      <div className="pdb-dokumente-grid">
        {item.datenblattUrl && (
          <a href={item.datenblattUrl} target="_blank" rel="noopener noreferrer" className="pdb-dokument-card">
            <FileText size={24} />
            <span>Datenblatt</span>
            <ExternalLink size={14} />
          </a>
        )}
        {item.zertifikatUrl && (
          <a href={item.zertifikatUrl} target="_blank" rel="noopener noreferrer" className="pdb-dokument-card pdb-dokument-card--cert">
            <Award size={24} />
            <span>Einheitenzertifikat (E.4)</span>
            <ExternalLink size={14} />
          </a>
        )}
        {item.konformitaetserklaerungUrl && (
          <a href={item.konformitaetserklaerungUrl} target="_blank" rel="noopener noreferrer" className="pdb-dokument-card">
            <FileText size={24} />
            <span>Konformitätserklärung</span>
            <ExternalLink size={14} />
          </a>
        )}
        {item.zerezId && (
          <div className="pdb-dokument-card pdb-dokument-card--info">
            <Database size={24} />
            <span>ZEREZ-ID</span>
            <strong>{item.zerezId}</strong>
          </div>
        )}
        {!hasDocs && <div className="pdb-chart-empty">Keine Dokumente hinterlegt</div>}
      </div>
    </div>
  );
}

// File Upload Field Component
function FileUploadField({ 
  label, 
  field, 
  value, 
  onChange, 
  accept = '.pdf,.jpg,.jpeg,.png',
  icon: Icon = FileText,
  highlight = false
}: { 
  label: string; 
  field: string; 
  value?: string; 
  onChange: (field: string, url: string | null) => void;
  accept?: string;
  icon?: any;
  highlight?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validierung
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('Datei zu groß (max. 10MB)');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', field);
      
      const res = await api.post('/produkte/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onChange(field, res.data.url);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Upload fehlgeschlagen');
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleRemove = () => {
    onChange(field, null);
  };
  
  const getFileName = (url: string) => {
    try {
      const parts = url.split('/');
      return parts[parts.length - 1];
    } catch {
      return 'Datei';
    }
  };
  
  return (
    <div className="pdb-form-field pdb-form-field--file">
      <label>{label}</label>
      <input 
        type="file" 
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {value ? (
        <div className={`pdb-file-preview ${highlight ? 'pdb-file-preview--highlight' : ''}`}>
          <Icon size={20} />
          <span className="pdb-file-name">{getFileName(value)}</span>
          <div className="pdb-file-actions">
            <a href={value} target="_blank" rel="noopener noreferrer" className="pdb-file-view">
              <ExternalLink size={14} />
            </a>
            <button type="button" className="pdb-file-remove" onClick={handleRemove}>
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div 
          className={`pdb-file-dropzone ${uploading ? 'pdb-file-dropzone--uploading' : ''}`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="pdb-spin" />
              <span>Wird hochgeladen...</span>
            </>
          ) : (
            <>
              <Upload size={20} />
              <span>Datei auswählen</span>
              <small>{accept.replace(/\./g, '').toUpperCase()}</small>
            </>
          )}
        </div>
      )}
      
      {error && <div className="pdb-file-error">{safeString(error)}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHART COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function WirkungsgradChart({ data, color = '#10b981' }: { data: any; color?: string }) {
  const points = [
    { x: 0, y: Number(data.wirkungsgrad0) || 0 },
    { x: 5, y: Number(data.wirkungsgrad5) || 0 },
    { x: 10, y: Number(data.wirkungsgrad10) || 0 },
    { x: 20, y: Number(data.wirkungsgrad20) || 0 },
    { x: 30, y: Number(data.wirkungsgrad30) || 0 },
    { x: 50, y: Number(data.wirkungsgrad50) || 0 },
    { x: 75, y: Number(data.wirkungsgrad75) || 0 },
    { x: 100, y: Number(data.wirkungsgrad100) || 0 },
  ];
  
  const hasData = points.some(p => p.y > 0);
  if (!hasData) {
    return (
      <div className="pdb-chart-container">
        <div className="pdb-chart-header"><Gauge size={18} /><span>Wirkungsgrad</span></div>
        <div className="pdb-chart-empty">Keine Daten verfügbar</div>
      </div>
    );
  }
  
  const maxY = 100;
  const minY = Math.max(0, Math.min(...points.filter(p => p.y > 0).map(p => p.y)) - 5);
  const range = maxY - minY || 1;
  
  const pathD = points.map((p, i) => {
    const x = 40 + (p.x / 100) * 260;
    const y = 160 - ((p.y - minY) / range) * 140;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  
  return (
    <div className="pdb-chart-container">
      <div className="pdb-chart-header"><Gauge size={18} /><span>Wirkungsgrad</span></div>
      <svg viewBox="0 0 340 180" className="pdb-chart-svg">
        <defs>
          <linearGradient id={`wgGrad-${color.slice(1)}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[100, 95, 90, 85].map((val, i) => (
          <g key={val}>
            <line x1="40" y1={20 + i * 46.67} x2="300" y2={20 + i * 46.67} stroke="rgba(255,255,255,0.1)" />
            <text x="35" y={24 + i * 46.67} fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="end">{val}%</text>
          </g>
        ))}
        {[0, 25, 50, 75, 100].map(val => (
          <text key={val} x={40 + (val / 100) * 260} y="175" fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="middle">{val}%</text>
        ))}
        <path d={pathD + ' L 300 160 L 40 160 Z'} fill={`url(#wgGrad-${color.slice(1)})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" />
        {points.map((p, i) => {
          const x = 40 + (p.x / 100) * 260;
          const y = 160 - ((p.y - minY) / range) * 140;
          return <circle key={i} cx={x} cy={y} r="4" fill={color} />;
        })}
      </svg>
      <div className="pdb-chart-footer">Auslastung in %</div>
    </div>
  );
}

function EntladezyklenChart({ data }: { data: Batteriesystem }) {
  const points = [
    { x: 20, y: Number(data.battZyklenDoD20) || 0 },
    { x: 40, y: Number(data.battZyklenDoD40) || 0 },
    { x: 60, y: Number(data.battZyklenDoD60) || 0 },
    { x: 80, y: Number(data.battZyklenDoD80) || 0 },
  ];
  
  const hasData = points.some(p => p.y > 0);
  if (!hasData) {
    return (
      <div className="pdb-chart-container">
        <div className="pdb-chart-header"><Activity size={18} /><span>Entladezyklen</span></div>
        <div className="pdb-chart-empty">Keine Daten verfügbar</div>
      </div>
    );
  }
  
  const maxY = Math.max(...points.map(p => p.y)) * 1.1 || 1;
  
  return (
    <div className="pdb-chart-container">
      <div className="pdb-chart-header"><Activity size={18} /><span>Entladezyklen</span></div>
      <svg viewBox="0 0 340 180" className="pdb-chart-svg">
        <defs>
          <linearGradient id="ezGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {points.map((p, i) => {
          const barWidth = 50;
          const x = 50 + i * 70;
          const barHeight = (p.y / maxY) * 130;
          const y = 150 - barHeight;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill="url(#ezGradient)" rx="4" />
              <rect x={x} y={y} width={barWidth} height={barHeight} fill="none" stroke="#3b82f6" strokeWidth="1" rx="4" />
              <text x={x + barWidth/2} y={y - 8} fill="#fff" fontSize="11" textAnchor="middle" fontWeight="600">{p.y.toLocaleString()}</text>
              <text x={x + barWidth/2} y="168" fill="rgba(255,255,255,0.6)" fontSize="10" textAnchor="middle">{p.x}% DoD</text>
            </g>
          );
        })}
      </svg>
      <div className="pdb-chart-footer">Entladungstiefe (DoD) vs. Ladezyklen</div>
    </div>
  );
}

function LadestrategieViz({ data }: { data: Batteriesystem }) {
  const strategies = [
    { name: 'Ausgleichsladung', start: data.ausgleichStart, end: data.ausgleichEnde, duration: data.ausgleichDauerH, cycle: data.ausgleichZyklusD, color: '#10b981' },
    { name: 'Vollladung', start: data.vollStart, end: data.vollEnde, duration: data.vollDauerH, cycle: data.vollZyklusD, color: '#3b82f6' },
    { name: 'Erhaltungsladung', start: data.erhaltungProzent, end: null, duration: null, cycle: null, color: '#EAD068' },
  ];
  
  return (
    <div className="pdb-ladestrategie">
      <div className="pdb-chart-header"><Settings2 size={18} /><span>Ladestrategie</span></div>
      <div className="pdb-ladestrategie-grid">
        {strategies.map((s, i) => (
          <div key={i} className="pdb-strategie-item" style={{ '--strat-color': s.color } as React.CSSProperties}>
            <div className="pdb-strategie-header">
              <div className="pdb-strategie-dot" />
              <span>{s.name}</span>
            </div>
            <div className="pdb-strategie-values">
              {s.start != null && <div><span>Start</span><strong>{s.start}%</strong></div>}
              {s.end != null && <div><span>Ende</span><strong>{s.end}%</strong></div>}
              {s.duration != null && <div><span>Dauer</span><strong>{s.duration}h</strong></div>}
              {s.cycle != null && <div><span>Zyklus</span><strong>{s.cycle}d</strong></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BatterieMasse({ data }: { data: Batteriesystem }) {
  const l = Number(data.battLaengeMm) || 0;
  const b = Number(data.battBreiteMm) || 0;
  const h = Number(data.battHoeheMm) || 0;
  const g = Number(data.battGewichtKg) || 0;
  
  if (!l && !b && !h && !g) {
    return (
      <div className="pdb-batterie-masse">
        <div className="pdb-chart-header"><Box size={18} /><span>Abmessungen</span></div>
        <div className="pdb-chart-empty">Keine Daten verfügbar</div>
      </div>
    );
  }
  
  return (
    <div className="pdb-batterie-masse">
      <div className="pdb-chart-header"><Box size={18} /><span>Abmessungen</span></div>
      <div className="pdb-masse-content">
        <div className="pdb-masse-values">
          <div className="pdb-masse-item"><span>Länge</span><strong>{l} mm</strong></div>
          <div className="pdb-masse-item"><span>Breite</span><strong>{b} mm</strong></div>
          <div className="pdb-masse-item"><span>Höhe</span><strong>{h} mm</strong></div>
          <div className="pdb-masse-item pdb-masse-item--highlight"><span>Gewicht</span><strong>{g} kg</strong></div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETAIL MODALS
// ═══════════════════════════════════════════════════════════════════════════════

function PvModulDetailModal({ item, onClose }: { item: PvModul; onClose: () => void }) {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { k: 'overview', l: 'Übersicht', i: Eye },
    { k: 'elektrisch', l: 'Elektrisch', i: Zap },
    { k: 'temperatur', l: 'Temperatur', i: Thermometer },
    { k: 'abmessungen', l: 'Abmessungen', i: Box },
    { k: 'garantie', l: 'Garantie', i: Award },
    { k: 'dokumente', l: 'Dokumente', i: FileText },
  ];
  
  return (
    <div className="pdb-modal-backdrop" onClick={onClose}>
      <div className="pdb-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="pdb-detail-header">
          <div className="pdb-detail-header-content">
            <div className="pdb-detail-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><Sun size={28} /></div>
            <div className="pdb-detail-title">
              <h2>{item.modell}</h2>
              <div className="pdb-detail-meta">
                <span className="pdb-detail-badge">{item.hersteller?.name}</span>
                <span className="pdb-detail-badge">{item.leistungWp} Wp</span>
                {item.bifacial && <span className="pdb-detail-badge pdb-detail-badge--highlight">Bifacial</span>}
              </div>
            </div>
          </div>
          <button className="pdb-detail-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="pdb-detail-nav">
          {tabs.map(t => <button key={t.k} className={`pdb-detail-nav-item ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}><t.i size={16} /><span>{t.l}</span></button>)}
        </div>
        
        <div className="pdb-detail-content">
          {tab === 'overview' && (
            <div className="pdb-detail-overview">
              <div className="pdb-detail-key-stats">
                <div className="pdb-key-stat"><Zap size={20} /><div><span>Nennleistung</span><strong>{item.leistungWp} Wp</strong></div></div>
                <div className="pdb-key-stat"><Gauge size={20} /><div><span>Wirkungsgrad</span><strong>{item.wirkungsgradProzent}%</strong></div></div>
                <div className="pdb-key-stat"><Grid3X3 size={20} /><div><span>Zellen</span><strong>{item.zellenAnzahl} ({item.zelltyp})</strong></div></div>
                <div className="pdb-key-stat"><Box size={20} /><div><span>Fläche</span><strong>{item.flaecheM2} m²</strong></div></div>
              </div>
              <div className="pdb-detail-grid">
                <div className="pdb-detail-section">
                  <h3>Basisdaten</h3>
                  <div className="pdb-detail-fields">
                    <div><span>Hersteller</span><strong>{item.hersteller?.name}</strong></div>
                    <div><span>Artikel-Nr.</span><strong>{item.artikelNr || '-'}</strong></div>
                    <div><span>Zelltyp</span><strong>{item.zelltyp || '-'}</strong></div>
                    <div><span>Halbzellen</span><strong>{item.halbzellenModul ? 'Ja' : 'Nein'}</strong></div>
                  </div>
                </div>
                <div className="pdb-detail-section">
                  <h3>Leistungsdaten</h3>
                  <div className="pdb-detail-fields">
                    <div><span>Leistung Pmax</span><strong>{item.leistungWp} Wp</strong></div>
                    <div><span>Wirkungsgrad</span><strong>{item.wirkungsgradProzent}%</strong></div>
                    {item.bifacial && <div><span>Bifazialitätsfaktor</span><strong>{item.bifazialitaetsfaktorProzent}%</strong></div>}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {tab === 'elektrisch' && (
            <div className="pdb-detail-section-full">
              <h3>Elektrische Daten (STC)</h3>
              <div className="pdb-detail-fields-grid">
                <div><span>Leistung Pmax</span><strong>{item.leistungWp} Wp</strong></div>
                <div><span>Spannung Vmpp</span><strong>{item.spannungMppV} V</strong></div>
                <div><span>Strom Impp</span><strong>{item.stromMppA} A</strong></div>
                <div><span>Leerlaufspannung Voc</span><strong>{item.leerlaufspannungV} V</strong></div>
                <div><span>Kurzschlussstrom Isc</span><strong>{item.kurzschlussstromA} A</strong></div>
                <div><span>Wirkungsgrad</span><strong>{item.wirkungsgradProzent}%</strong></div>
              </div>
            </div>
          )}
          
          {tab === 'temperatur' && (
            <div className="pdb-detail-section-full">
              <h3>Temperaturkoeffizienten</h3>
              <div className="pdb-detail-fields-grid">
                <div><span>TK Pmax (γ)</span><strong>{item.tempKoeffPmppProzentK} %/K</strong></div>
                <div><span>TK Voc (β)</span><strong>{item.tempKoeffUocProzentK} %/K</strong></div>
                <div><span>TK Isc (α)</span><strong>{item.tempKoeffIscProzentK} %/K</strong></div>
                <div><span>NOCT</span><strong>{item.noct} °C</strong></div>
              </div>
            </div>
          )}
          
          {tab === 'abmessungen' && (
            <div className="pdb-detail-section-full">
              <h3>Abmessungen & Gewicht</h3>
              <div className="pdb-detail-fields-grid">
                <div><span>Höhe</span><strong>{item.hoeheMm} mm</strong></div>
                <div><span>Breite</span><strong>{item.breiteMm} mm</strong></div>
                <div><span>Tiefe</span><strong>{item.tiefeMm} mm</strong></div>
                <div><span>Fläche</span><strong>{item.flaecheM2} m²</strong></div>
                <div><span>Gewicht</span><strong>{item.gewichtKg} kg</strong></div>
              </div>
            </div>
          )}
          
          {tab === 'garantie' && (
            <div className="pdb-detail-section-full">
              <h3>Garantie</h3>
              <div className="pdb-detail-fields-grid">
                <div><span>Produktgarantie</span><strong>{item.produktgarantieJahre || '-'} Jahre</strong></div>
                <div><span>Leistungsgarantie</span><strong>{item.leistungsgarantieJahre || '-'} Jahre</strong></div>
                <div><span>Leistung nach Garantie</span><strong>{item.leistungsgarantieProzent || '-'}%</strong></div>
              </div>
            </div>
          )}
          
          {tab === 'dokumente' && <DokumenteSection item={item} type="pvModul" />}
        </div>
      </div>
    </div>
  );
}

function WechselrichterDetailModal({ item, onClose }: { item: Wechselrichter; onClose: () => void }) {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { k: 'overview', l: 'Übersicht', i: Eye },
    { k: 'dc', l: 'DC-Seite', i: Sun },
    { k: 'ac', l: 'AC-Seite', i: Plug },
    { k: 'mpp', l: 'MPP-Tracker', i: Cpu },
    { k: 'wirkungsgrad', l: 'Wirkungsgrad', i: Gauge },
    { k: 'abmessungen', l: 'Abmessungen', i: Box },
    { k: 'dokumente', l: 'Dokumente', i: FileText },
  ];
  
  return (
    <div className="pdb-modal-backdrop" onClick={onClose}>
      <div className="pdb-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="pdb-detail-header">
          <div className="pdb-detail-header-content">
            <div className="pdb-detail-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}><Zap size={28} /></div>
            <div className="pdb-detail-title">
              <h2>{item.modell}</h2>
              <div className="pdb-detail-meta">
                <span className="pdb-detail-badge">{item.hersteller?.name}</span>
                <span className="pdb-detail-badge">{item.phasen}P</span>
                {item.hybrid && <span className="pdb-detail-badge pdb-detail-badge--highlight">Hybrid</span>}
                {item.notstromfaehig && <span className="pdb-detail-badge pdb-detail-badge--highlight">Notstrom</span>}
              </div>
            </div>
          </div>
          <button className="pdb-detail-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="pdb-detail-nav">
          {tabs.map(t => <button key={t.k} className={`pdb-detail-nav-item ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}><t.i size={16} /><span>{t.l}</span></button>)}
        </div>
        
        <div className="pdb-detail-content">
          {tab === 'overview' && (
            <div className="pdb-detail-overview">
              <div className="pdb-detail-key-stats">
                <div className="pdb-key-stat"><Zap size={20} /><div><span>AC Nennleistung</span><strong>{item.acNennleistungKW} kW</strong></div></div>
                <div className="pdb-key-stat"><Sun size={20} /><div><span>DC Max</span><strong>{item.dcLeistungMaxKW} kW</strong></div></div>
                <div className="pdb-key-stat"><Cpu size={20} /><div><span>MPP-Tracker</span><strong>{item.mppTrackerAnzahl}</strong></div></div>
                <div className="pdb-key-stat"><Gauge size={20} /><div><span>Max η</span><strong>{item.wirkungsgradMaxProzent}%</strong></div></div>
              </div>
            </div>
          )}
          
          {tab === 'dc' && (
            <div className="pdb-detail-section-full">
              <h3>DC-Seite (Eingang)</h3>
              <div className="pdb-detail-fields-grid">
                <div><span>DC Nennleistung</span><strong>{item.dcNennleistungKW} kW</strong></div>
                <div><span>DC Max Leistung</span><strong>{item.dcLeistungMaxKW} kW</strong></div>
                <div><span>DC Max Spannung</span><strong>{item.dcSpannungMaxV} V</strong></div>
                <div><span>DC Startspannung</span><strong>{item.dcSpannungStartV} V</strong></div>
                <div><span>DC Max Strom</span><strong>{item.dcStromMaxA} A</strong></div>
              </div>
            </div>
          )}
          
          {tab === 'ac' && (
            <div className="pdb-detail-section-full">
              <h3>AC-Seite (Ausgang)</h3>
              <div className="pdb-detail-fields-grid">
                <div><span>AC Nennleistung</span><strong>{item.acNennleistungKW} kW</strong></div>
                <div><span>AC Max Leistung</span><strong>{item.acLeistungMaxKW} kW</strong></div>
                <div><span>AC Nennspannung</span><strong>{item.acSpannungV} V</strong></div>
                <div><span>AC Max Strom</span><strong>{item.acStromMaxA} A</strong></div>
                <div><span>Phasen</span><strong>{item.phasen}</strong></div>
              </div>
            </div>
          )}
          
          {tab === 'mpp' && (
            <div className="pdb-detail-section-full">
              <h3>MPP-Tracker</h3>
              <div className="pdb-detail-fields-grid">
                <div><span>Anzahl MPP-Tracker</span><strong>{item.mppTrackerAnzahl}</strong></div>
                <div><span>MPP Spannung Min</span><strong>{item.mppSpannungMinV} V</strong></div>
                <div><span>MPP Spannung Max</span><strong>{item.mppSpannungMaxV} V</strong></div>
                <div><span>Strings pro Tracker</span><strong>{item.stringsProTracker}</strong></div>
                <div><span>Strings gesamt</span><strong>{item.stringsGesamt}</strong></div>
              </div>
            </div>
          )}
          
          {tab === 'wirkungsgrad' && <WirkungsgradChart data={item} color="#3b82f6" />}
          
          {tab === 'abmessungen' && (
            <div className="pdb-detail-section-full">
              <h3>Abmessungen & Gewicht</h3>
              <div className="pdb-detail-fields-grid">
                <div><span>Höhe</span><strong>{item.hoeheMm} mm</strong></div>
                <div><span>Breite</span><strong>{item.breiteMm} mm</strong></div>
                <div><span>Tiefe</span><strong>{item.tiefeMm} mm</strong></div>
                <div><span>Gewicht</span><strong>{item.gewichtKg} kg</strong></div>
                <div><span>Schutzart</span><strong>{item.schutzartIp}</strong></div>
              </div>
            </div>
          )}
          
          {tab === 'dokumente' && <DokumenteSection item={item} type="wechselrichter" />}
        </div>
      </div>
    </div>
  );
}

function BatteriesystemDetailModal({ item, onClose }: { item: Batteriesystem; onClose: () => void }) {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { k: 'overview', l: 'Übersicht', i: Eye },
    { k: 'wirkungsgrad', l: 'Wirkungsgrad', i: Gauge },
    { k: 'zyklen', l: 'Entladezyklen', i: Activity },
    { k: 'ladestrategie', l: 'Ladestrategie', i: Settings2 },
    { k: 'batterie', l: 'Batterie', i: Battery },
    { k: 'dokumente', l: 'Dokumente', i: FileText },
  ];
  
  return (
    <div className="pdb-modal-backdrop" onClick={onClose}>
      <div className="pdb-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="pdb-detail-header">
          <div className="pdb-detail-header-content">
            <div className="pdb-detail-icon"><Battery size={28} /></div>
            <div className="pdb-detail-title">
              <h2>{item.name}</h2>
              <div className="pdb-detail-meta">
                <span className="pdb-detail-badge pdb-detail-badge--hersteller">{extractHerstellerFromUrl(item.herstellerWebsite)}</span>
                <span className="pdb-detail-badge">{item.artDerKopplung}</span>
                <span className="pdb-detail-badge">{item.nutzbareBatterieenergieKWh} kWh</span>
              </div>
            </div>
          </div>
          <button className="pdb-detail-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="pdb-detail-nav">
          {tabs.map(t => <button key={t.k} className={`pdb-detail-nav-item ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}><t.i size={16} /><span>{t.l}</span></button>)}
        </div>
        
        <div className="pdb-detail-content">
          {tab === 'overview' && (
            <div className="pdb-detail-overview">
              <div className="pdb-detail-key-stats">
                <div className="pdb-key-stat"><Zap size={20} /><div><span>Nennleistung</span><strong>{item.nennleistungKW} kW</strong></div></div>
                <div className="pdb-key-stat"><Battery size={20} /><div><span>Energie</span><strong>{item.nutzbareBatterieenergieKWh} kWh</strong></div></div>
                <div className="pdb-key-stat"><Activity size={20} /><div><span>Max Zyklen</span><strong>{item.battZyklenDoD20?.toLocaleString()}</strong></div></div>
                <div className="pdb-key-stat"><Gauge size={20} /><div><span>Wirkungsgrad</span><strong>{item.wirkungsgrad100}%</strong></div></div>
              </div>
              <div className="pdb-detail-grid">
                <div className="pdb-detail-section">
                  <h3>Leistungsdaten</h3>
                  <div className="pdb-detail-fields">
                    <div><span>Nennleistung</span><strong>{item.nennleistungKW} kW</strong></div>
                    <div><span>Max. Ladeleistung</span><strong>{item.maxLadeleistungKW} kW</strong></div>
                    <div><span>Max. Entladeleistung</span><strong>{item.maxEntladeleistungKW} kW</strong></div>
                  </div>
                </div>
                <div className="pdb-detail-section">
                  <h3>Batteriesystem</h3>
                  <div className="pdb-detail-fields">
                    <div><span>Spannung DC</span><strong>{item.batteriesystemspannungDCV} V</strong></div>
                    <div><span>Nutzbare Energie</span><strong>{item.nutzbareBatterieenergieKWh} kWh</strong></div>
                    <div><span>Kapazität C10</span><strong>{item.batteriekapazitaetC10Ah} Ah</strong></div>
                    <div><span>Batterietyp</span><strong>{item.battBatterietyp}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {tab === 'wirkungsgrad' && <WirkungsgradChart data={item} color="#10b981" />}
          {tab === 'zyklen' && <EntladezyklenChart data={item} />}
          {tab === 'ladestrategie' && <LadestrategieViz data={item} />}
          
          {tab === 'batterie' && (
            <div className="pdb-detail-batterie">
              <div className="pdb-batterie-header">
                <h3>{item.battName}</h3>
                {item.battWebsite && <a href={item.battWebsite} target="_blank" rel="noopener noreferrer" className="pdb-detail-link"><ExternalLink size={14} />Website</a>}
              </div>
              <div className="pdb-batterie-grid">
                <div className="pdb-detail-section">
                  <h4>Elektrische Daten</h4>
                  <div className="pdb-detail-fields">
                    <div><span>Batterietyp</span><strong>{item.battBatterietyp}</strong></div>
                    <div><span>Zellspannung</span><strong>{item.battZellspannungV} V</strong></div>
                    <div><span>Anzahl Zellen</span><strong>{item.battAnzahlZellen}</strong></div>
                    <div><span>Nennspannung</span><strong>{item.battNennspannungV} V</strong></div>
                    <div><span>Stränge</span><strong>{item.battAnzahlStraenge}</strong></div>
                    <div><span>Innenwiderstand</span><strong>{item.battInnenwiderstandMOhm} mΩ</strong></div>
                    <div><span>Selbstentladung</span><strong>{item.battSelbstentladungProzent}%/M</strong></div>
                  </div>
                </div>
                <BatterieMasse data={item} />
              </div>
            </div>
          )}
          
          {tab === 'dokumente' && <DokumenteSection item={item} type="batteriesystem" />}
        </div>
      </div>
    </div>
  );
}

function SpeicherDetailModal({ item, onClose }: { item: Speicher; onClose: () => void }) {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { k: 'overview', l: 'Übersicht', i: Eye },
    { k: 'tech', l: 'Technische Daten', i: Settings2 },
    { k: 'dokumente', l: 'Dokumente', i: FileText },
  ];
  
  return (
    <div className="pdb-modal-backdrop" onClick={onClose}>
      <div className="pdb-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="pdb-detail-header">
          <div className="pdb-detail-header-content">
            <div className="pdb-detail-icon"><Battery size={28} /></div>
            <div className="pdb-detail-title">
              <h2>{item.modell}</h2>
              <div className="pdb-detail-meta">
                <span className="pdb-detail-badge pdb-detail-badge--hersteller">{item.hersteller?.name || '–'}</span>
                <span className="pdb-detail-badge">{item.kopplung || '–'}</span>
                <span className="pdb-detail-badge">{item.kapazitaetBruttoKwh} kWh</span>
              </div>
            </div>
          </div>
          <button className="pdb-detail-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="pdb-detail-nav">
          {tabs.map(t => <button key={t.k} className={`pdb-detail-nav-item ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}><t.i size={16} /><span>{t.l}</span></button>)}
        </div>
        
        <div className="pdb-detail-content">
          {tab === 'overview' && (
            <div className="pdb-detail-overview">
              <div className="pdb-detail-key-stats">
                <div className="pdb-key-stat"><Battery size={20} /><div><span>Kapazität Brutto</span><strong>{item.kapazitaetBruttoKwh} kWh</strong></div></div>
                <div className="pdb-key-stat"><Battery size={20} /><div><span>Kapazität Netto</span><strong>{item.kapazitaetNettoKwh || '–'} kWh</strong></div></div>
                <div className="pdb-key-stat"><Zap size={20} /><div><span>Max. Ladeleistung</span><strong>{item.ladeleistungMaxKw || '–'} kW</strong></div></div>
                <div className="pdb-key-stat"><Gauge size={20} /><div><span>Wirkungsgrad</span><strong>{item.wirkungsgradProzent || '–'}%</strong></div></div>
              </div>
              <div className="pdb-detail-grid">
                <div className="pdb-detail-section">
                  <h3>Leistungsdaten</h3>
                  <div className="pdb-detail-fields">
                    <div><span>Max. Ladeleistung</span><strong>{item.ladeleistungMaxKw || '–'} kW</strong></div>
                    <div><span>Max. Entladeleistung</span><strong>{item.entladeleistungMaxKw || '–'} kW</strong></div>
                    <div><span>Dauerladeleistung</span><strong>{item.dauerladeleistungKw || '–'} kW</strong></div>
                    <div><span>Dauerentladeleistung</span><strong>{item.dauerentladeleistungKw || '–'} kW</strong></div>
                  </div>
                </div>
                <div className="pdb-detail-section">
                  <h3>Lebensdauer</h3>
                  <div className="pdb-detail-fields">
                    <div><span>Zyklen bei DoD 80%</span><strong>{item.zyklenBeiDod80?.toLocaleString() || '–'}</strong></div>
                    <div><span>Zyklen bei DoD 100%</span><strong>{item.zyklenBeiDod100?.toLocaleString() || '–'}</strong></div>
                    <div><span>Lebensdauer</span><strong>{item.kalendarischeLebensdauerJahre || '–'} Jahre</strong></div>
                    <div><span>Garantie</span><strong>{item.garantieJahre || '–'} Jahre</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {tab === 'tech' && (
            <div className="pdb-detail-overview">
              <div className="pdb-detail-grid">
                <div className="pdb-detail-section">
                  <h3>Spannung</h3>
                  <div className="pdb-detail-fields">
                    <div><span>Nennspannung</span><strong>{item.nennspannungV || '–'} V</strong></div>
                    <div><span>Spannungsbereich Min</span><strong>{item.spannungsbereichMinV || '–'} V</strong></div>
                    <div><span>Spannungsbereich Max</span><strong>{item.spannungsbereichMaxV || '–'} V</strong></div>
                  </div>
                </div>
                <div className="pdb-detail-section">
                  <h3>Typ & Features</h3>
                  <div className="pdb-detail-fields">
                    <div><span>Batterietyp</span><strong>{item.batterietyp || '–'}</strong></div>
                    <div><span>Kopplung</span><strong>{item.kopplung || '–'}</strong></div>
                    <div><span>Notstromfähig</span><strong>{item.notstromfaehig ? '✓ Ja' : '✗ Nein'}</strong></div>
                    <div><span>Ersatzstromfähig</span><strong>{item.ersatzstromfaehig ? '✓ Ja' : '✗ Nein'}</strong></div>
                    <div><span>Inselfähig</span><strong>{item.inselfaehig ? '✓ Ja' : '✗ Nein'}</strong></div>
                    <div><span>Modular</span><strong>{item.modular ? '✓ Ja' : '✗ Nein'}</strong></div>
                  </div>
                </div>
                <div className="pdb-detail-section">
                  <h3>Abmessungen</h3>
                  <div className="pdb-detail-fields">
                    <div><span>Länge</span><strong>{item.laengeMm || '–'} mm</strong></div>
                    <div><span>Breite</span><strong>{item.breiteMm || '–'} mm</strong></div>
                    <div><span>Tiefe</span><strong>{item.tiefeMm || '–'} mm</strong></div>
                    <div><span>Gewicht</span><strong>{item.gewichtKg || '–'} kg</strong></div>
                    <div><span>Schutzart</span><strong>{item.schutzartIp || '–'}</strong></div>
                    <div><span>Montageort</span><strong>{item.montageort || '–'}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {tab === 'dokumente' && (
            <div className="pdb-detail-dokumente">
              <div className="pdb-dokumente-grid">
                {item.datenblattUrl && (
                  <a href={item.datenblattUrl} target="_blank" rel="noopener noreferrer" className="pdb-dokument-card">
                    <FileText size={24} />
                    <span>Datenblatt</span>
                    <ExternalLink size={14} />
                  </a>
                )}
                {item.bildUrl && (
                  <a href={item.bildUrl} target="_blank" rel="noopener noreferrer" className="pdb-dokument-card">
                    <ImageIcon size={24} />
                    <span>Produktbild</span>
                    <ExternalLink size={14} />
                  </a>
                )}
                {!item.datenblattUrl && !item.bildUrl && (
                  <p className="pdb-no-docs">Keine Dokumente verfügbar</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD PRODUCT MODAL - AUSFÜHRLICH MIT ALLEN FELDERN
// ═══════════════════════════════════════════════════════════════════════════════

function AddProductModal({ 
  productType, 
  onClose, 
  onSave, 
  hersteller,
  editingItem 
}: { 
  productType: ProduktTyp; 
  onClose: () => void; 
  onSave: () => void; 
  hersteller: Hersteller[];
  editingItem?: any;
}) {
  const [formData, setFormData] = useState<any>(editingItem || {});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basis');
  const [error, setError] = useState('');
  
  const set = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }));
  
  // Reusable input component
  const inp = (label: string, field: string, type: 'text' | 'number' | 'checkbox' | 'select' | 'textarea' = 'text', options?: { v: any; l: string }[], placeholder?: string) => (
    <div className="pdb-form-field">
      <label>{label}</label>
      {type === 'checkbox' ? (
        <input type="checkbox" checked={formData[field] || false} onChange={e => set(field, e.target.checked)} />
      ) : type === 'select' ? (
        <select value={formData[field] || ''} onChange={e => set(field, e.target.value === '' ? '' : isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}>
          <option value="">-- Auswählen --</option>
          {options?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={formData[field] || ''} onChange={e => set(field, e.target.value)} placeholder={placeholder} rows={3} />
      ) : (
        <input 
          type={type} 
          value={formData[field] ?? ''} 
          onChange={e => set(field, type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value)} 
          placeholder={placeholder}
          step={type === 'number' ? 'any' : undefined}
        />
      )}
    </div>
  );
  
  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const endpoint = productType === 'pvModule' ? 'pv-module' : productType;
      if (editingItem?.id) {
        await api.put(`/produkte/${endpoint}/${editingItem.id}`, formData);
      } else {
        await api.post(`/produkte/${endpoint}`, formData);
      }
      onSave();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Fehler beim Speichern');
    }
    setSaving(false);
  };
  
  const title = productType === 'speicher' ? 'Batteriesystem' : 
                productType === 'wechselrichter' ? 'Wechselrichter' : 
                productType === 'pvModule' ? 'PV-Modul' : 
                productType === 'hersteller' ? 'Hersteller' : 'Produkt';
  
  const action = editingItem ? 'bearbeiten' : 'hinzufügen';
  
  return (
    <div className="pdb-modal-backdrop" onClick={onClose}>
      <div className="pdb-add-modal pdb-add-modal--large" onClick={e => e.stopPropagation()}>
        <div className="pdb-add-header">
          <h2>{title} {action}</h2>
          <button className="pdb-detail-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="pdb-add-body">
          {/* ═══════════════════════════════════════════════════════════════════
              PV-MODULE FORMULAR - AUSFÜHRLICH
          ═══════════════════════════════════════════════════════════════════ */}
          {productType === 'pvModule' && (
            <>
              <div className="pdb-form-tabs">
                {[
                  { k: 'basis', l: 'Basisdaten' },
                  { k: 'elektrisch', l: 'Elektrisch' },
                  { k: 'zellen', l: 'Zellen' },
                  { k: 'temperatur', l: 'Temperatur' },
                  { k: 'abmessungen', l: 'Abmessungen' },
                  { k: 'garantie', l: 'Garantie' },
                  { k: 'dokumente', l: 'Dokumente' },
                ].map(t => (
                  <button key={t.k} className={activeTab === t.k ? 'active' : ''} onClick={() => setActiveTab(t.k)}>{t.l}</button>
                ))}
              </div>
              
              <div className="pdb-form-content">
                {activeTab === 'basis' && (
                  <div className="pdb-form-grid">
                    {inp('Hersteller *', 'herstellerId', 'select', hersteller.map(h => ({ v: h.id, l: h.name })))}
                    {inp('Modell *', 'modell', 'text', undefined, 'z.B. Trina Vertex S+')}
                    {inp('Artikel-Nr.', 'artikelNr', 'text', undefined, 'z.B. TSM-430NEG9R.28')}
                    {inp('Leistung (Wp) *', 'leistungWp', 'number', undefined, 'z.B. 430')}
                  </div>
                )}
                
                {activeTab === 'elektrisch' && (
                  <div className="pdb-form-grid">
                    {inp('Leistung Pmax (Wp)', 'leistungWp', 'number', undefined, '430')}
                    {inp('Spannung Vmpp (V)', 'spannungMppV', 'number', undefined, '34.4')}
                    {inp('Strom Impp (A)', 'stromMppA', 'number', undefined, '12.51')}
                    {inp('Leerlaufspannung Voc (V)', 'leerlaufspannungV', 'number', undefined, '41.5')}
                    {inp('Kurzschlussstrom Isc (A)', 'kurzschlussstromA', 'number', undefined, '13.38')}
                    {inp('Wirkungsgrad (%)', 'wirkungsgradProzent', 'number', undefined, '21.8')}
                  </div>
                )}
                
                {activeTab === 'zellen' && (
                  <div className="pdb-form-grid">
                    {inp('Zelltyp', 'zelltyp', 'select', [
                      { v: 'Mono-PERC', l: 'Mono-PERC' },
                      { v: 'Mono-TOPCon', l: 'Mono-TOPCon' },
                      { v: 'Mono-HJT', l: 'Mono-HJT (Heterojunction)' },
                      { v: 'Mono-IBC', l: 'Mono-IBC' },
                      { v: 'Poly-PERC', l: 'Poly-PERC' },
                      { v: 'Poly', l: 'Polykristallin' },
                      { v: 'Dünnschicht CdTe', l: 'Dünnschicht CdTe' },
                      { v: 'Dünnschicht CIGS', l: 'Dünnschicht CIGS' },
                    ])}
                    {inp('Anzahl Zellen', 'zellenAnzahl', 'number', undefined, '108')}
                    {inp('Halbzellen-Modul', 'halbzellenModul', 'checkbox')}
                    {inp('Bifacial', 'bifacial', 'checkbox')}
                    {inp('Bifazialitätsfaktor (%)', 'bifazialitaetsfaktorProzent', 'number', undefined, '70')}
                  </div>
                )}
                
                {activeTab === 'temperatur' && (
                  <div className="pdb-form-grid">
                    {inp('TK Pmax (%/K)', 'tempKoeffPmppProzentK', 'number', undefined, '-0.34')}
                    {inp('TK Voc (%/K)', 'tempKoeffUocProzentK', 'number', undefined, '-0.25')}
                    {inp('TK Isc (%/K)', 'tempKoeffIscProzentK', 'number', undefined, '0.04')}
                    {inp('NOCT (°C)', 'noct', 'number', undefined, '45')}
                  </div>
                )}
                
                {activeTab === 'abmessungen' && (
                  <div className="pdb-form-grid">
                    {inp('Höhe (mm)', 'hoeheMm', 'number', undefined, '1762')}
                    {inp('Breite (mm)', 'breiteMm', 'number', undefined, '1134')}
                    {inp('Tiefe (mm)', 'tiefeMm', 'number', undefined, '30')}
                    {inp('Fläche (m²)', 'flaecheM2', 'number', undefined, '1.998')}
                    {inp('Gewicht (kg)', 'gewichtKg', 'number', undefined, '21.8')}
                  </div>
                )}
                
                {activeTab === 'garantie' && (
                  <div className="pdb-form-grid">
                    {inp('Produktgarantie (Jahre)', 'produktgarantieJahre', 'number', undefined, '12')}
                    {inp('Leistungsgarantie (Jahre)', 'leistungsgarantieJahre', 'number', undefined, '25')}
                    {inp('Leistung nach Garantie (%)', 'leistungsgarantieProzent', 'number', undefined, '84.8')}
                  </div>
                )}
                
                {activeTab === 'dokumente' && (
                  <div className="pdb-form-grid pdb-form-grid--docs">
                    <FileUploadField 
                      label="Datenblatt (PDF)" 
                      field="datenblattUrl" 
                      value={formData.datenblattUrl}
                      onChange={set}
                      accept=".pdf"
                      icon={FileText}
                    />
                    <FileUploadField 
                      label="Produktbild" 
                      field="bildUrl" 
                      value={formData.bildUrl}
                      onChange={set}
                      accept=".jpg,.jpeg,.png,.webp"
                      icon={Sun}
                    />
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* ═══════════════════════════════════════════════════════════════════
              WECHSELRICHTER FORMULAR - AUSFÜHRLICH
          ═══════════════════════════════════════════════════════════════════ */}
          {productType === 'wechselrichter' && (
            <>
              <div className="pdb-form-tabs">
                {[
                  { k: 'basis', l: 'Basisdaten' },
                  { k: 'dc', l: 'DC-Seite' },
                  { k: 'ac', l: 'AC-Seite' },
                  { k: 'mpp', l: 'MPP-Tracker' },
                  { k: 'wirkungsgrad', l: 'Wirkungsgrad' },
                  { k: 'features', l: 'Features' },
                  { k: 'abmessungen', l: 'Abmessungen' },
                  { k: 'dokumente', l: 'Dokumente' },
                ].map(t => (
                  <button key={t.k} className={activeTab === t.k ? 'active' : ''} onClick={() => setActiveTab(t.k)}>{t.l}</button>
                ))}
              </div>
              
              <div className="pdb-form-content">
                {activeTab === 'basis' && (
                  <div className="pdb-form-grid">
                    {inp('Hersteller *', 'herstellerId', 'select', hersteller.map(h => ({ v: h.id, l: h.name })))}
                    {inp('Modell *', 'modell', 'text', undefined, 'z.B. STP 10.0-3AV-40')}
                    {inp('Artikel-Nr.', 'artikelNr', 'text', undefined, 'z.B. STP10-3AV-40')}
                    {inp('Phasen', 'phasen', 'select', [{ v: 1, l: '1-phasig' }, { v: 3, l: '3-phasig' }])}
                  </div>
                )}
                
                {activeTab === 'dc' && (
                  <div className="pdb-form-grid">
                    {inp('DC Nennleistung (kW)', 'dcNennleistungKW', 'number', undefined, '10.35')}
                    {inp('DC Max Leistung (kW)', 'dcLeistungMaxKW', 'number', undefined, '15.5')}
                    {inp('DC Max Spannung (V)', 'dcSpannungMaxV', 'number', undefined, '1000')}
                    {inp('DC Startspannung (V)', 'dcSpannungStartV', 'number', undefined, '150')}
                    {inp('DC Max Strom (A)', 'dcStromMaxA', 'number', undefined, '22')}
                  </div>
                )}
                
                {activeTab === 'ac' && (
                  <div className="pdb-form-grid">
                    {inp('AC Nennleistung (kW)', 'acNennleistungKW', 'number', undefined, '10')}
                    {inp('AC Max Leistung (kW)', 'acLeistungMaxKW', 'number', undefined, '10')}
                    {inp('AC Nennspannung (V)', 'acSpannungV', 'number', undefined, '400')}
                    {inp('AC Max Strom (A)', 'acStromMaxA', 'number', undefined, '14.5')}
                    {inp('Phasen', 'phasen', 'select', [{ v: 1, l: '1-phasig' }, { v: 3, l: '3-phasig' }])}
                  </div>
                )}
                
                {activeTab === 'mpp' && (
                  <div className="pdb-form-grid">
                    {inp('Anzahl MPP-Tracker', 'mppTrackerAnzahl', 'number', undefined, '2')}
                    {inp('MPP Spannung Min (V)', 'mppSpannungMinV', 'number', undefined, '160')}
                    {inp('MPP Spannung Max (V)', 'mppSpannungMaxV', 'number', undefined, '800')}
                    {inp('Strings pro Tracker', 'stringsProTracker', 'number', undefined, '2')}
                    {inp('Strings gesamt', 'stringsGesamt', 'number', undefined, '4')}
                  </div>
                )}
                
                {activeTab === 'wirkungsgrad' && (
                  <div className="pdb-form-grid">
                    {inp('η bei 5%', 'wirkungsgrad5', 'number', undefined, '91.5')}
                    {inp('η bei 10%', 'wirkungsgrad10', 'number', undefined, '94.2')}
                    {inp('η bei 20%', 'wirkungsgrad20', 'number', undefined, '96.1')}
                    {inp('η bei 25%', 'wirkungsgrad25', 'number', undefined, '96.5')}
                    {inp('η bei 30%', 'wirkungsgrad30', 'number', undefined, '96.8')}
                    {inp('η bei 50%', 'wirkungsgrad50', 'number', undefined, '97.5')}
                    {inp('η bei 75%', 'wirkungsgrad75', 'number', undefined, '97.8')}
                    {inp('η bei 100%', 'wirkungsgrad100', 'number', undefined, '97.5')}
                    {inp('η Max (%)', 'wirkungsgradMaxProzent', 'number', undefined, '98.1')}
                    {inp('η Euro (%)', 'wirkungsgradEuroProzent', 'number', undefined, '97.2')}
                  </div>
                )}
                
                {activeTab === 'features' && (
                  <div className="pdb-form-grid">
                    {inp('Hybrid-Wechselrichter', 'hybrid', 'checkbox')}
                    {inp('Notstromfähig', 'notstromfaehig', 'checkbox')}
                    {inp('Schattenmanagement', 'schattenmanagement', 'checkbox')}
                  </div>
                )}
                
                {activeTab === 'abmessungen' && (
                  <div className="pdb-form-grid">
                    {inp('Höhe (mm)', 'hoeheMm', 'number', undefined, '661')}
                    {inp('Breite (mm)', 'breiteMm', 'number', undefined, '410')}
                    {inp('Tiefe (mm)', 'tiefeMm', 'number', undefined, '198')}
                    {inp('Gewicht (kg)', 'gewichtKg', 'number', undefined, '32')}
                    {inp('Schutzart (IP)', 'schutzartIp', 'text', undefined, 'IP65')}
                  </div>
                )}
                
                {activeTab === 'dokumente' && (
                  <div className="pdb-form-grid pdb-form-grid--docs">
                    <FileUploadField 
                      label="Datenblatt (PDF)" 
                      field="datenblattUrl" 
                      value={formData.datenblattUrl}
                      onChange={set}
                      accept=".pdf"
                      icon={FileText}
                    />
                    <FileUploadField 
                      label="Einheitenzertifikat E.4 (PDF)" 
                      field="zertifikatUrl" 
                      value={formData.zertifikatUrl}
                      onChange={set}
                      accept=".pdf"
                      icon={Award}
                      highlight
                    />
                    <FileUploadField 
                      label="Konformitätserklärung (PDF)" 
                      field="konformitaetserklaerungUrl" 
                      value={formData.konformitaetserklaerungUrl}
                      onChange={set}
                      accept=".pdf"
                      icon={FileText}
                    />
                    <div className="pdb-form-field">
                      <label>ZEREZ-ID</label>
                      <input 
                        type="text" 
                        value={formData.zerezId || ''} 
                        onChange={e => set('zerezId', e.target.value)}
                        placeholder="z.B. Z123456789"
                      />
                    </div>
                    <FileUploadField 
                      label="Produktbild" 
                      field="bildUrl" 
                      value={formData.bildUrl}
                      onChange={set}
                      accept=".jpg,.jpeg,.png,.webp"
                      icon={Zap}
                    />
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* ═══════════════════════════════════════════════════════════════════
              BATTERIESYSTEME FORMULAR - AUSFÜHRLICH
          ═══════════════════════════════════════════════════════════════════ */}
          {productType === 'speicher' && (
            <>
              <div className="pdb-form-tabs">
                {[
                  { k: 'basis', l: 'Basisdaten' },
                  { k: 'leistung', l: 'Leistung' },
                  { k: 'wirkungsgrad', l: 'Wirkungsgrad' },
                  { k: 'ladestrategie', l: 'Ladestrategie' },
                  { k: 'batterie', l: 'Batterie' },
                  { k: 'zyklen', l: 'Zyklen' },
                  { k: 'kapazitaet', l: 'Kapazität' },
                  { k: 'abmessungen', l: 'Abmessungen' },
                  { k: 'dokumente', l: 'Dokumente' },
                ].map(t => (
                  <button key={t.k} className={activeTab === t.k ? 'active' : ''} onClick={() => setActiveTab(t.k)}>{t.l}</button>
                ))}
              </div>
              
              <div className="pdb-form-content">
                {activeTab === 'basis' && (
                  <div className="pdb-form-grid">
                    {inp('Name *', 'name', 'text', undefined, 'z.B. Fronius GEN24 + BYD HVS')}
                    {inp('Art der Kopplung', 'artDerKopplung', 'select', [
                      { v: 'DC Zwischenkreis-Kopplung', l: 'DC-Kopplung (Zwischenkreis)' },
                      { v: 'AC-Kopplung', l: 'AC-Kopplung' },
                    ])}
                    {inp('Beschreibung', 'beschreibung', 'textarea', undefined, 'Optionale Beschreibung...')}
                  </div>
                )}
                
                {activeTab === 'leistung' && (
                  <div className="pdb-form-grid">
                    {inp('Nennleistung (kW)', 'nennleistungKW', 'number', undefined, '5.0')}
                    {inp('Max. Ladeleistung (kW)', 'maxLadeleistungKW', 'number', undefined, '5.12')}
                    {inp('Max. Entladeleistung (kW)', 'maxEntladeleistungKW', 'number', undefined, '5.12')}
                    {inp('DC Systemspannung (V)', 'batteriesystemspannungDCV', 'number', undefined, '400')}
                    {inp('Nutzbare Energie (kWh)', 'nutzbareBatterieenergieKWh', 'number', undefined, '10.24')}
                    {inp('Kapazität C10 (Ah)', 'batteriekapazitaetC10Ah', 'number', undefined, '256')}
                  </div>
                )}
                
                {activeTab === 'wirkungsgrad' && (
                  <div className="pdb-form-grid">
                    {inp('η bei 0%', 'wirkungsgrad0', 'number', undefined, '0')}
                    {inp('η bei 5%', 'wirkungsgrad5', 'number', undefined, '90')}
                    {inp('η bei 10%', 'wirkungsgrad10', 'number', undefined, '93')}
                    {inp('η bei 20%', 'wirkungsgrad20', 'number', undefined, '95')}
                    {inp('η bei 30%', 'wirkungsgrad30', 'number', undefined, '96')}
                    {inp('η bei 50%', 'wirkungsgrad50', 'number', undefined, '96.5')}
                    {inp('η bei 75%', 'wirkungsgrad75', 'number', undefined, '96')}
                    {inp('η bei 100%', 'wirkungsgrad100', 'number', undefined, '95')}
                  </div>
                )}
                
                {activeTab === 'ladestrategie' && (
                  <div className="pdb-form-grid">
                    <div className="pdb-form-section-header">Ausgleichsladung</div>
                    {inp('Start SOC (%)', 'ausgleichStart', 'number', undefined, '80')}
                    {inp('Ende SOC (%)', 'ausgleichEnde', 'number', undefined, '100')}
                    {inp('Dauer (h)', 'ausgleichDauerH', 'number', undefined, '2')}
                    {inp('Zyklus (Tage)', 'ausgleichZyklusD', 'number', undefined, '7')}
                    <div className="pdb-form-section-header">Vollladung</div>
                    {inp('Start SOC (%)', 'vollStart', 'number', undefined, '90')}
                    {inp('Ende SOC (%)', 'vollEnde', 'number', undefined, '100')}
                    {inp('Dauer (h)', 'vollDauerH', 'number', undefined, '1')}
                    {inp('Zyklus (Tage)', 'vollZyklusD', 'number', undefined, '14')}
                    <div className="pdb-form-section-header">Erhaltung</div>
                    {inp('Erhaltung (%)', 'erhaltungProzent', 'number', undefined, '95')}
                  </div>
                )}
                
                {activeTab === 'batterie' && (
                  <div className="pdb-form-grid">
                    {inp('Batterie Name', 'battName', 'text', undefined, 'z.B. BYD HVS 10.2')}
                    {inp('Batterietyp', 'battBatterietyp', 'select', [
                      { v: 'Lithium-Eisen-Phosphat', l: 'LiFePO4 (Lithium-Eisenphosphat)' },
                      { v: 'Lithium-NMC', l: 'Li-NMC (Nickel-Mangan-Cobalt)' },
                      { v: 'Lithium-NCA', l: 'Li-NCA (Nickel-Cobalt-Aluminium)' },
                      { v: 'Blei-Säure', l: 'Blei-Säure' },
                      { v: 'Blei-Gel', l: 'Blei-Gel' },
                    ])}
                    {inp('Zellspannung (V)', 'battZellspannungV', 'number', undefined, '3.2')}
                    {inp('Anzahl Zellen', 'battAnzahlZellen', 'number', undefined, '128')}
                    {inp('Nennspannung (V)', 'battNennspannungV', 'number', undefined, '409.6')}
                    {inp('Anzahl Stränge', 'battAnzahlStraenge', 'number', undefined, '1')}
                    {inp('Innenwiderstand (mΩ)', 'battInnenwiderstandMOhm', 'number', undefined, '50')}
                    {inp('Selbstentladung (%/M)', 'battSelbstentladungProzent', 'number', undefined, '3')}
                  </div>
                )}
                
                {activeTab === 'zyklen' && (
                  <div className="pdb-form-grid">
                    {inp('Zyklen bei 20% DoD', 'battZyklenDoD20', 'number', undefined, '15000')}
                    {inp('Zyklen bei 40% DoD', 'battZyklenDoD40', 'number', undefined, '10000')}
                    {inp('Zyklen bei 60% DoD', 'battZyklenDoD60', 'number', undefined, '7000')}
                    {inp('Zyklen bei 80% DoD', 'battZyklenDoD80', 'number', undefined, '5000')}
                  </div>
                )}
                
                {activeTab === 'kapazitaet' && (
                  <div className="pdb-form-grid">
                    {inp('Kapazität 10min (Ah)', 'battKap10minAh', 'number', undefined, '200')}
                    {inp('Kapazität 30min (Ah)', 'battKap30minAh', 'number', undefined, '220')}
                    {inp('Kapazität 1h (Ah)', 'battKap1hAh', 'number', undefined, '240')}
                    {inp('Kapazität 5h (Ah)', 'battKap5hAh', 'number', undefined, '250')}
                    {inp('Kapazität 10h (Ah)', 'battKap10hAh', 'number', undefined, '256')}
                    {inp('Kapazität 100h (Ah)', 'battKap100hAh', 'number', undefined, '260')}
                  </div>
                )}
                
                {activeTab === 'abmessungen' && (
                  <div className="pdb-form-grid">
                    {inp('Länge (mm)', 'battLaengeMm', 'number', undefined, '585')}
                    {inp('Breite (mm)', 'battBreiteMm', 'number', undefined, '298')}
                    {inp('Höhe (mm)', 'battHoeheMm', 'number', undefined, '1408')}
                    {inp('Gewicht (kg)', 'battGewichtKg', 'number', undefined, '164')}
                  </div>
                )}
                
                {activeTab === 'dokumente' && (
                  <div className="pdb-form-grid pdb-form-grid--docs">
                    <FileUploadField 
                      label="Datenblatt (PDF)" 
                      field="datenblattUrl" 
                      value={formData.datenblattUrl}
                      onChange={set}
                      accept=".pdf"
                      icon={FileText}
                    />
                    <FileUploadField 
                      label="Einheitenzertifikat E.4 (PDF)" 
                      field="zertifikatUrl" 
                      value={formData.zertifikatUrl}
                      onChange={set}
                      accept=".pdf"
                      icon={Award}
                      highlight
                    />
                    <div className="pdb-form-field">
                      <label>ZEREZ-ID</label>
                      <input 
                        type="text" 
                        value={formData.zerezId || ''} 
                        onChange={e => set('zerezId', e.target.value)}
                        placeholder="z.B. Z123456789"
                      />
                    </div>
                    <FileUploadField 
                      label="Produktbild" 
                      field="bildUrl" 
                      value={formData.bildUrl}
                      onChange={set}
                      accept=".jpg,.jpeg,.png,.webp"
                      icon={Battery}
                    />
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* ═══════════════════════════════════════════════════════════════════
              HERSTELLER FORMULAR
          ═══════════════════════════════════════════════════════════════════ */}
          {productType === 'hersteller' && (
            <div className="pdb-form-content">
              <div className="pdb-form-grid">
                {inp('Name *', 'name', 'text', undefined, 'z.B. SMA Solar Technology AG')}
                {inp('Kurzname', 'kurzname', 'text', undefined, 'z.B. SMA')}
                {inp('Website', 'website', 'text', undefined, 'https://www.sma.de')}
              </div>
            </div>
          )}
          
          {error && (
            <div className="pdb-form-error">
              <AlertCircle size={16} />
              {safeString(error)}
            </div>
          )}
        </div>
        
        <div className="pdb-add-footer">
          <button className="pdb-btn pdb-btn--secondary" onClick={onClose}>Abbrechen</button>
          <button className="pdb-btn pdb-btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 size={16} className="pdb-spin" /> : <Plus size={16} />}
            <span>{saving ? 'Speichern...' : (editingItem ? 'Aktualisieren' : 'Speichern')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSV IMPORT MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function CSVImportModal({ onClose, onImport, productType }: { onClose: () => void; onImport: () => void; productType: ProduktTyp }) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; errors: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    setFile(f);
    setError(null);
    
    try {
      let text = await f.text();
      
      // Remove BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }
      
      // Normalize line endings (CRLF -> LF)
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      const lines = text.split('\n').filter(l => l.trim());
      
      if (lines.length < 2) {
        setError('CSV-Datei enthält keine Daten');
        return;
      }
      
      const headers = lines[0].split(';').map(h => h.trim());
      // CSV headers parsed
      
      const data: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map(v => v.trim());
        const item: any = {};
        
        headers.forEach((header, idx) => {
          const mappedKey = PVSOL_CSV_MAPPING[header] || header;
          const rawValue = values[idx];
          if (mappedKey && rawValue !== undefined && rawValue !== '') {
            let value: any = rawValue;
            const valueStr = String(value);
            // Bestimmte Felder NIEMALS zu Number konvertieren
            const keepAsString = ['name', 'Name', 'beschreibung', 'battBeschreibung', 'battName', 
              'batterieNameSystem', 'herstellerWebsite', 'battWebsite', 'batterieTypListe', 'artDerKopplung'];
            
            if (value === 'True' || value === 'true') value = true;
            else if (value === 'False' || value === 'false') value = false;
            else if (!keepAsString.includes(mappedKey) && !isNaN(parseFloat(valueStr)) && !valueStr.includes('http') && !valueStr.includes('www')) {
              value = parseFloat(valueStr);
            }
            item[mappedKey] = value;
          }
        });
        
        // Accept items with 'name' or 'Name' field
        const itemName = item.name || item.Name;
        const itemNameStr = String(itemName || '');
        if (itemName && !itemNameStr.includes('ValentinSoftware')) {
          if (!item.name && item.Name) item.name = item.Name;
          data.push(item);
        }
      }
      
      // CSV data parsed
      
      if (data.length === 0) {
        setError('Keine gültigen Einträge gefunden. Prüfe ob "Name" Spalte vorhanden ist.');
        return;
      }
      
      setParsedData(data);
      setStep('preview');
    } catch (err: any) {
      console.error('[CSV Import] Error:', err);
      setError(`Fehler beim Lesen der CSV-Datei: ${err.message || 'Unbekannter Fehler'}`);
    }
  };
  
  const handleImport = async () => {
    setStep('importing');
    
    try {
      const endpoint = productType === 'pvModule' ? 'pv-module' : productType;
      const res = await api.post(`/produkte/${endpoint}/import`, { items: parsedData });
      setResult(res.data);
      setStep('done');
    } catch (err) {
      setError('Fehler beim Import');
      setStep('upload');
    }
  };
  
  return (
    <div className="pdb-modal-backdrop" onClick={onClose}>
      <div className="pdb-import-modal" onClick={e => e.stopPropagation()}>
        <div className="pdb-import-header">
          <div className="pdb-import-header-icon"><FileSpreadsheet size={24} /></div>
          <div>
            <h2>CSV Import</h2>
            <p>Importiere Produktdaten aus CSV-Export</p>
          </div>
          <button className="pdb-import-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="pdb-import-content">
          {step === 'upload' && (
            <div className="pdb-import-upload">
              <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileSelect} style={{ display: 'none' }} />
              <div className="pdb-import-dropzone" onClick={() => fileInputRef.current?.click()}>
                <Upload size={48} />
                <h3>CSV-Datei auswählen</h3>
                <p>Klicke hier oder ziehe eine Datei hierher</p>
                <span className="pdb-import-hint">Format: PV*SOL Export (*.csv) mit Semikolon-Trennung</span>
              </div>
              {error && <div className="pdb-import-error">{safeString(error)}</div>}
            </div>
          )}
          
          {step === 'preview' && (
            <div className="pdb-import-preview">
              <div className="pdb-import-stats">
                <div className="pdb-import-stat"><Database size={20} /><span>{parsedData.length} Produkte erkannt</span></div>
                <div className="pdb-import-stat"><FileText size={20} /><span>{file?.name}</span></div>
              </div>
              
              <div className="pdb-import-table-wrap">
                <table className="pdb-import-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Typ/Kopplung</th>
                      <th>Leistung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{(item.name || item.modell)?.substring(0, 40)}...</td>
                        <td>{item.artDerKopplung || item.zelltyp || item.anzahlPhasen ? `${item.anzahlPhasen}P` : '-'}</td>
                        <td>{item.nennleistungKW || item.leistungWp || item.acNennleistungKW || item.dcNennleistungKW || '-'}{item.acNennleistungKW ? ' kW' : item.leistungWp ? ' Wp' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && <div className="pdb-import-more">... und {parsedData.length - 10} weitere</div>}
              </div>
              
              <div className="pdb-import-actions">
                <button className="pdb-btn pdb-btn--secondary" onClick={() => setStep('upload')}>Zurück</button>
                <button className="pdb-btn pdb-btn--primary" onClick={handleImport}>
                  <Database size={16} />
                  {parsedData.length} Produkte importieren
                </button>
              </div>
            </div>
          )}
          
          {step === 'importing' && (
            <div className="pdb-import-progress">
              <Loader2 size={48} className="pdb-spin" />
              <p>Importiere {parsedData.length} Produkte...</p>
            </div>
          )}
          
          {step === 'done' && (
            <div className="pdb-import-done">
              <CheckCircle2 size={64} className="pdb-import-done-icon" />
              <h3>Import abgeschlossen!</h3>
              {result && (
                <div className="pdb-import-result">
                  <div><span>Erstellt</span><strong>{result.created}</strong></div>
                  {result.errors > 0 && <div><span>Fehler</span><strong>{result.errors}</strong></div>}
                </div>
              )}
              <button className="pdb-btn pdb-btn--primary" onClick={() => { onImport(); onClose(); }}>Schließen</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProdukteDatenbankPage() {
  const [activeTab, setActiveTab] = useState<ProduktTyp>('speicher');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [hersteller, setHersteller] = useState<Hersteller[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ pvModule: 0, wechselrichter: 0, speicher: 0, wallboxen: 0, waermepumpen: 0, hersteller: 0 });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Filter states
  const [filterKopplung, setFilterKopplung] = useState<string>('');
  const [filterMinEnergy, setFilterMinEnergy] = useState<string>('');
  const [filterMaxEnergy, setFilterMaxEnergy] = useState<string>('');
  const [filterHersteller, setFilterHersteller] = useState<string>('');
  
  useEffect(() => { loadHersteller(); loadAllStats(); }, []);
  useEffect(() => { loadData(); }, [activeTab]);
  
  const loadHersteller = async () => {
    try {
      const res = await api.get('/produkte/hersteller');
      setHersteller(res.data || []);
    } catch (e) {
      console.error('Fehler beim Laden der Hersteller:', e);
    }
  };
  
  const loadAllStats = async () => {
    try {
      const [pv, wr, bs, wb, wp, h] = await Promise.all([
        api.get('/produkte/pv-module').catch(() => ({ data: [] })),
        api.get('/produkte/wechselrichter').catch(() => ({ data: [] })),
        api.get('/produkte/speicher').catch(() => ({ data: [] })),
        api.get('/produkte/wallboxen').catch(() => ({ data: [] })),
        api.get('/produkte/waermepumpen').catch(() => ({ data: [] })),
        api.get('/produkte/hersteller').catch(() => ({ data: [] })),
      ]);
      setStats({
        pvModule: pv.data?.length || 0,
        wechselrichter: wr.data?.length || 0,
        speicher: bs.data?.length || 0,
        wallboxen: wb.data?.length || 0,
        waermepumpen: wp.data?.length || 0,
        hersteller: h.data?.length || 0,
      });
    } catch (e) {
      console.error('Fehler beim Laden der Stats:', e);
    }
  };
  
  const loadData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'pvModule' ? 'pv-module' : activeTab;
      const res = await api.get(`/produkte/${endpoint}`);
      setData(res.data || []);
    } catch (e) {
      console.error('Fehler beim Laden:', e);
      setData([]);
    }
    setLoading(false);
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm('Produkt wirklich löschen?')) return;
    try {
      const endpoint = activeTab === 'pvModule' ? 'pv-module' : activeTab;
      await api.delete(`/produkte/${endpoint}/${id}`);
      setToast({ message: 'Produkt gelöscht', type: 'success' });
      loadData();
      loadAllStats();
    } catch (e) {
      setToast({ message: 'Fehler beim Löschen', type: 'error' });
    }
  };
  
  const handleRowClick = (item: any) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };
  
  const handleEdit = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setShowModal(true);
  };
  
  // Bulk Selection Functions
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(filtered.map((item: any) => item.id).filter(Boolean));
      setSelectedIds(allIds);
    }
  };
  
  const toggleSelectItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };
  
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const count = selectedIds.size;
    if (!confirm(`${count} Produkte wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;
    
    setBulkDeleting(true);
    const endpoint = activeTab === 'pvModule' ? 'pv-module' : activeTab;
    let successCount = 0;
    let errorCount = 0;
    
    for (const id of selectedIds) {
      try {
        await api.delete(`/produkte/${endpoint}/${id}`);
        successCount++;
      } catch (e) {
        console.error(`Fehler beim Löschen von ID ${id}:`, e);
        errorCount++;
      }
    }
    
    setBulkDeleting(false);
    setSelectedIds(new Set());
    
    if (errorCount === 0) {
      setToast({ message: `${successCount} Produkte erfolgreich gelöscht`, type: 'success' });
    } else {
      setToast({ message: `${successCount} gelöscht, ${errorCount} Fehler`, type: 'error' });
    }
    
    loadData();
    loadAllStats();
  };
  
  // Clear selection when tab changes
  useEffect(() => { setSelectedIds(new Set()); }, [activeTab]);
  
  // Filtered data
  const debouncedSearch = useDebounce(searchQuery, 250);

  const filtered = useMemo(() => {
    let result = data;

    // Search filter
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((item: any) =>
        item.name?.toLowerCase().includes(q) ||
        item.modell?.toLowerCase().includes(q) ||
        item.hersteller?.name?.toLowerCase().includes(q) ||
        item.artikelNr?.toLowerCase().includes(q)
      );
    }
    
    // Kopplung filter (Batteriesysteme)
    if (activeTab === 'speicher' && filterKopplung) {
      result = result.filter((item: any) => item.kopplung === filterKopplung || item.artDerKopplung === filterKopplung);
    }
    
    // Energy range filter (Batteriesysteme)
    if (activeTab === 'speicher') {
      if (filterMinEnergy) {
        result = result.filter((item: any) => (item.kapazitaetBruttoKwh || item.nutzbareBatterieenergieKWh || 0) >= parseFloat(filterMinEnergy));
      }
      if (filterMaxEnergy) {
        result = result.filter((item: any) => (item.kapazitaetBruttoKwh || item.nutzbareBatterieenergieKWh || 0) <= parseFloat(filterMaxEnergy));
      }
    }
    
    // Hersteller filter
    if (filterHersteller && (activeTab === 'pvModule' || activeTab === 'wechselrichter')) {
      result = result.filter((item: any) => item.herstellerId === parseInt(filterHersteller));
    }
    
    return result;
  }, [data, debouncedSearch, filterKopplung, filterMinEnergy, filterMaxEnergy, filterHersteller, activeTab]);
  
  // Get unique values for filters
  const uniqueKopplungen = useMemo(() => {
    if (activeTab !== 'speicher') return [];
    return Array.from(new Set(data.map((d: any) => d.kopplung || d.artDerKopplung).filter(Boolean)));
  }, [data, activeTab]);
  
  const total = stats.pvModule + stats.wechselrichter + stats.speicher + stats.wallboxen + stats.waermepumpen;
  
  return (
    <div className="pdb-container">
      {/* Header */}
      <header className="pdb-header">
        <div className="pdb-header-bg">
          <div className="pdb-orb pdb-orb--1" />
          <div className="pdb-orb pdb-orb--2" />
          <div className="pdb-orb pdb-orb--3" />
        </div>
        <div className="pdb-header-content">
          <div className="pdb-header-left">
            <div className="pdb-header-icon"><Package size={28} /></div>
            <div>
              <h1>Produkt-Datenbank</h1>
              <p>{total.toLocaleString()} Produkte • {stats.hersteller} Hersteller</p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Stats Grid */}
      <div className="pdb-stats-grid">
        {TABS.map((tab, idx) => {
          const Icon = tab.icon;
          const count = stats[tab.key as keyof typeof stats];
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={`pdb-stat-card ${isActive ? 'pdb-stat-card--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              style={{ '--stat-color': tab.color, animationDelay: `${idx * 50}ms` } as React.CSSProperties}
            >
              <div className="pdb-stat-icon"><Icon size={22} /></div>
              <div className="pdb-stat-info">
                <span className="pdb-stat-value">{count?.toLocaleString() || 0}</span>
                <span className="pdb-stat-label">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Toolbar */}
      <div className="pdb-toolbar">
        <div className="pdb-search">
          <Search size={18} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Suchen nach Name, Modell, Hersteller..."
          />
          {searchQuery && (
            <button className="pdb-search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
        
        {/* Filters */}
        {activeTab === 'speicher' && (
          <div className="pdb-filters">
            <select value={filterKopplung} onChange={e => setFilterKopplung(e.target.value)} className="pdb-filter-select">
              <option value="">Alle Kopplungsarten</option>
              {uniqueKopplungen.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <div className="pdb-filter-range">
              <input type="number" placeholder="Min kWh" value={filterMinEnergy} onChange={e => setFilterMinEnergy(e.target.value)} />
              <span>-</span>
              <input type="number" placeholder="Max kWh" value={filterMaxEnergy} onChange={e => setFilterMaxEnergy(e.target.value)} />
            </div>
          </div>
        )}
        
        {(activeTab === 'pvModule' || activeTab === 'wechselrichter') && (
          <div className="pdb-filters">
            <select value={filterHersteller} onChange={e => setFilterHersteller(e.target.value)} className="pdb-filter-select">
              <option value="">Alle Hersteller</option>
              {hersteller.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}
        
        <button className="pdb-btn pdb-btn--secondary" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'pdb-spin' : ''} />
          <span>Aktualisieren</span>
        </button>
        
        {selectedIds.size > 0 && (
          <button 
            className="pdb-btn pdb-btn--danger" 
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
          >
            {bulkDeleting ? <Loader2 size={16} className="pdb-spin" /> : <Trash size={16} />}
            <span>{bulkDeleting ? 'Lösche...' : `${selectedIds.size} löschen`}</span>
          </button>
        )}
        
        {['speicher', 'wechselrichter', 'pvModule'].includes(activeTab) && (
          <button className="pdb-btn pdb-btn--secondary" onClick={() => setShowImportModal(true)}>
            <Upload size={16} />
            <span>CSV Import</span>
          </button>
        )}
        
        <button className="pdb-btn pdb-btn--primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>
          <Plus size={18} />
          <span>Hinzufügen</span>
        </button>
      </div>
      
      {/* Results Info */}
      <div className="pdb-results-info">
        <span>{filtered.length.toLocaleString()} Ergebnisse</span>
        {selectedIds.size > 0 && (
          <span className="pdb-selection-info">
            <CheckSquare size={14} />
            {selectedIds.size} ausgewählt
          </span>
        )}
        {(filterKopplung || filterMinEnergy || filterMaxEnergy || filterHersteller) && (
          <button className="pdb-clear-filters" onClick={() => { setFilterKopplung(''); setFilterMinEnergy(''); setFilterMaxEnergy(''); setFilterHersteller(''); }}>
            Filter zurücksetzen
          </button>
        )}
      </div>
      
      {/* Table */}
      <div className="pdb-table-container">
        {loading ? (
          <div className="pdb-loading">
            <Loader2 size={32} className="pdb-spin" />
            <span>Lade Daten...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pdb-empty">
            <Package size={48} />
            <h3>Keine Produkte gefunden</h3>
            <p>Füge ein neues Produkt hinzu oder ändere die Filter.</p>
          </div>
        ) : activeTab === 'speicher' ? (
          <table className="pdb-table">
            <thead>
              <tr>
                <th className="pdb-th-checkbox">
                  <button 
                    className="pdb-checkbox-btn"
                    onClick={toggleSelectAll}
                    title={selectedIds.size === filtered.length ? 'Alle abwählen' : 'Alle auswählen'}
                  >
                    {selectedIds.size === filtered.length && filtered.length > 0 ? (
                      <CheckSquare size={18} className="pdb-checkbox-checked" />
                    ) : selectedIds.size > 0 ? (
                      <CheckSquare size={18} className="pdb-checkbox-partial" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th>Modell</th>
                <th>Hersteller</th>
                <th>Kopplung</th>
                <th>Kapazität</th>
                <th>Ladeleistung</th>
                <th>η</th>
                <th>Zyklen</th>
                <th>Dokumente</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: Speicher, idx: number) => (
                <tr key={item.id || idx} className={`pdb-table-row ${selectedIds.has(item.id!) ? 'pdb-row-selected' : ''}`} onClick={() => handleRowClick(item)}>
                  <td className="pdb-td-checkbox" onClick={e => e.stopPropagation()}>
                    <button 
                      className="pdb-checkbox-btn"
                      onClick={(e) => item.id && toggleSelectItem(item.id, e)}
                    >
                      {selectedIds.has(item.id!) ? (
                        <CheckSquare size={18} className="pdb-checkbox-checked" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </td>
                  <td>
                    <div className="pdb-product-name">
                      <span>{item.modell}</span>
                      {item.notstromfaehig && <span className="pdb-badge pdb-badge--small">Notstrom</span>}
                    </div>
                  </td>
                  <td>{item.hersteller?.name || '–'}</td>
                  <td><span className="pdb-badge pdb-badge--kopplung">{item.kopplung || '–'}</span></td>
                  <td><strong className="pdb-energy">{item.kapazitaetBruttoKwh} kWh</strong></td>
                  <td>{item.ladeleistungMaxKw ? `${item.ladeleistungMaxKw} kW` : '–'}</td>
                  <td><div className="pdb-efficiency"><span>{item.wirkungsgradProzent ? `${item.wirkungsgradProzent}%` : '–'}</span></div></td>
                  <td>{item.zyklenBeiDod80?.toLocaleString() || '–'}</td>
                  <td>
                    <div className="pdb-doc-icons">
                      {item.datenblattUrl && <span title="Datenblatt"><FileText size={14} className="pdb-doc-icon" /></span>}
                      {item.bildUrl && <span title="Produktbild"><ImageIcon size={14} className="pdb-doc-icon" /></span>}
                    </div>
                  </td>
                  <td>
                    <div className="pdb-actions" onClick={e => e.stopPropagation()}>
                      <button className="pdb-action-btn pdb-action-btn--view" onClick={() => handleRowClick(item)}><Eye size={16} /></button>
                      <button className="pdb-action-btn pdb-action-btn--edit" onClick={(e) => handleEdit(item, e)}><Edit2 size={16} /></button>
                      <button className="pdb-action-btn pdb-action-btn--delete" onClick={() => item.id && handleDelete(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeTab === 'wechselrichter' ? (
          <table className="pdb-table">
            <thead>
              <tr>
                <th className="pdb-th-checkbox">
                  <button 
                    className="pdb-checkbox-btn"
                    onClick={toggleSelectAll}
                    title={selectedIds.size === filtered.length ? 'Alle abwählen' : 'Alle auswählen'}
                  >
                    {selectedIds.size === filtered.length && filtered.length > 0 ? (
                      <CheckSquare size={18} className="pdb-checkbox-checked" />
                    ) : selectedIds.size > 0 ? (
                      <CheckSquare size={18} className="pdb-checkbox-partial" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th>Modell</th>
                <th>Hersteller</th>
                <th>AC Leistung</th>
                <th>Phasen</th>
                <th>MPP-Tracker</th>
                <th>η Max</th>
                <th>Dokumente</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: Wechselrichter) => (
                <tr key={item.id} className={`pdb-table-row ${selectedIds.has(item.id!) ? 'pdb-row-selected' : ''}`} onClick={() => handleRowClick(item)}>
                  <td className="pdb-td-checkbox" onClick={e => e.stopPropagation()}>
                    <button 
                      className="pdb-checkbox-btn"
                      onClick={(e) => item.id && toggleSelectItem(item.id, e)}
                    >
                      {selectedIds.has(item.id!) ? (
                        <CheckSquare size={18} className="pdb-checkbox-checked" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </td>
                  <td>
                    <div className="pdb-product-name">
                      <span>{item.modell}</span>
                      {item.hybrid && <span className="pdb-badge pdb-badge--small">Hybrid</span>}
                    </div>
                  </td>
                  <td>{item.hersteller?.name}</td>
                  <td><strong>{item.acNennleistungKW} kW</strong></td>
                  <td>{item.phasen}P</td>
                  <td>{item.mppTrackerAnzahl}</td>
                  <td><div className="pdb-efficiency"><span>{item.wirkungsgradMaxProzent}%</span></div></td>
                  <td>
                    <div className="pdb-doc-icons">
                      {item.datenblattUrl && <span title="Datenblatt"><FileText size={14} className="pdb-doc-icon" /></span>}
                      {item.zertifikatUrl && <span title="Zertifikat"><Award size={14} className="pdb-doc-icon pdb-doc-icon--cert" /></span>}
                      {item.zerezId && <span title="ZEREZ"><Database size={14} className="pdb-doc-icon" /></span>}
                    </div>
                  </td>
                  <td>
                    <div className="pdb-actions" onClick={e => e.stopPropagation()}>
                      <button className="pdb-action-btn pdb-action-btn--view" onClick={() => handleRowClick(item)}><Eye size={16} /></button>
                      <button className="pdb-action-btn pdb-action-btn--edit" onClick={(e) => handleEdit(item, e)}><Edit2 size={16} /></button>
                      <button className="pdb-action-btn pdb-action-btn--delete" onClick={() => item.id && handleDelete(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeTab === 'pvModule' ? (
          <table className="pdb-table">
            <thead>
              <tr>
                <th className="pdb-th-checkbox">
                  <button 
                    className="pdb-checkbox-btn"
                    onClick={toggleSelectAll}
                    title={selectedIds.size === filtered.length ? 'Alle abwählen' : 'Alle auswählen'}
                  >
                    {selectedIds.size === filtered.length && filtered.length > 0 ? (
                      <CheckSquare size={18} className="pdb-checkbox-checked" />
                    ) : selectedIds.size > 0 ? (
                      <CheckSquare size={18} className="pdb-checkbox-partial" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th>Modell</th>
                <th>Hersteller</th>
                <th>Leistung</th>
                <th>Zelltyp</th>
                <th>Wirkungsgrad</th>
                <th>Bifacial</th>
                <th>Dokumente</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: PvModul) => (
                <tr key={item.id} className={`pdb-table-row ${selectedIds.has(item.id!) ? 'pdb-row-selected' : ''}`} onClick={() => handleRowClick(item)}>
                  <td className="pdb-td-checkbox" onClick={e => e.stopPropagation()}>
                    <button 
                      className="pdb-checkbox-btn"
                      onClick={(e) => item.id && toggleSelectItem(item.id, e)}
                    >
                      {selectedIds.has(item.id!) ? (
                        <CheckSquare size={18} className="pdb-checkbox-checked" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </td>
                  <td><div className="pdb-product-name"><span>{item.modell}</span></div></td>
                  <td>{item.hersteller?.name}</td>
                  <td><strong>{item.leistungWp} Wp</strong></td>
                  <td>{item.zelltyp || '-'}</td>
                  <td><div className="pdb-efficiency"><span>{item.wirkungsgradProzent}%</span></div></td>
                  <td>{item.bifacial ? <Check size={16} className="text-green-500" /> : '-'}</td>
                  <td>
                    <div className="pdb-doc-icons">
                      {item.datenblattUrl && <span title="Datenblatt"><FileText size={14} className="pdb-doc-icon" /></span>}
                    </div>
                  </td>
                  <td>
                    <div className="pdb-actions" onClick={e => e.stopPropagation()}>
                      <button className="pdb-action-btn pdb-action-btn--view" onClick={() => handleRowClick(item)}><Eye size={16} /></button>
                      <button className="pdb-action-btn pdb-action-btn--edit" onClick={(e) => handleEdit(item, e)}><Edit2 size={16} /></button>
                      <button className="pdb-action-btn pdb-action-btn--delete" onClick={() => item.id && handleDelete(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeTab === 'hersteller' ? (
          <table className="pdb-table">
            <thead>
              <tr>
                <th className="pdb-th-checkbox">
                  <button 
                    className="pdb-checkbox-btn"
                    onClick={toggleSelectAll}
                    title={selectedIds.size === filtered.length ? 'Alle abwählen' : 'Alle auswählen'}
                  >
                    {selectedIds.size === filtered.length && filtered.length > 0 ? (
                      <CheckSquare size={18} className="pdb-checkbox-checked" />
                    ) : selectedIds.size > 0 ? (
                      <CheckSquare size={18} className="pdb-checkbox-partial" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th>Name</th>
                <th>Website</th>
                <th>Produkte</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: Hersteller) => (
                <tr key={item.id} className={`pdb-table-row ${selectedIds.has(item.id) ? 'pdb-row-selected' : ''}`}>
                  <td className="pdb-td-checkbox" onClick={e => e.stopPropagation()}>
                    <button 
                      className="pdb-checkbox-btn"
                      onClick={(e) => toggleSelectItem(item.id, e)}
                    >
                      {selectedIds.has(item.id) ? (
                        <CheckSquare size={18} className="pdb-checkbox-checked" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </td>
                  <td><strong>{item.name}</strong></td>
                  <td>
                    {item.website ? (
                      <a href={item.website} target="_blank" rel="noopener noreferrer" className="pdb-detail-link">
                        <ExternalLink size={14} />
                        {new URL(item.website).hostname}
                      </a>
                    ) : '-'}
                  </td>
                  <td>{item.usageCount}</td>
                  <td>
                    {item.verified ? (
                      <span className="pdb-badge pdb-badge--verified"><Check size={12} /> Verifiziert</span>
                    ) : (
                      <span className="pdb-badge pdb-badge--pending">Ausstehend</span>
                    )}
                  </td>
                  <td>
                    <div className="pdb-actions">
                      <button className="pdb-action-btn pdb-action-btn--edit" onClick={(e) => handleEdit(item, e)}><Edit2 size={16} /></button>
                      <button className="pdb-action-btn pdb-action-btn--delete" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="pdb-table">
            <thead><tr><th>Name/Modell</th><th>Status</th><th>Aktionen</th></tr></thead>
            <tbody>
              {filtered.map((item: any) => (
                <tr key={item.id} className="pdb-table-row">
                  <td>{item.modell || item.name}</td>
                  <td>{item.verified ? <span className="pdb-badge pdb-badge--verified">Verifiziert</span> : <span className="pdb-badge pdb-badge--pending">Ausstehend</span>}</td>
                  <td><div className="pdb-actions"><button className="pdb-action-btn pdb-action-btn--delete" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Detail Modals */}
      {showDetailModal && selectedItem && (
        activeTab === 'speicher' ? <SpeicherDetailModal item={selectedItem as Speicher} onClose={() => { setShowDetailModal(false); setSelectedItem(null); }} /> :
        activeTab === 'wechselrichter' ? <WechselrichterDetailModal item={selectedItem} onClose={() => { setShowDetailModal(false); setSelectedItem(null); }} /> :
        activeTab === 'pvModule' ? <PvModulDetailModal item={selectedItem} onClose={() => { setShowDetailModal(false); setSelectedItem(null); }} /> : null
      )}
      
      {/* Add/Edit Modal */}
      {showModal && (
        <AddProductModal
          productType={activeTab}
          hersteller={hersteller}
          editingItem={editingItem}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          onSave={() => {
            loadData();
            loadAllStats();
            setToast({ message: editingItem ? 'Produkt aktualisiert!' : 'Produkt gespeichert!', type: 'success' });
          }}
        />
      )}
      
      {/* Import Modal */}
      {showImportModal && (
        <CSVImportModal
          onClose={() => setShowImportModal(false)}
          onImport={() => {
            loadData();
            loadAllStats();
            setToast({ message: 'Import erfolgreich!', type: 'success' });
          }}
          productType={activeTab}
        />
      )}
      
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
