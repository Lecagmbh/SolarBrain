/**
 * Baunity Intelligence - Validation Engine
 * Intelligente Validierung basierend auf Szenario
 */

import type { WizardData } from '../../types/wizard.types';
import type { ValidationResult } from './types';
import { detectSzenario, berechneAbgeleiteteWerte } from './detector';
import { getSzenarioConfig } from './scenarios';
import { isValidEmail, isValidPLZ } from '../utils';

export function validateWizard(data: WizardData): ValidationResult {
  const szenario = detectSzenario(data);
  const config = getSzenarioConfig(szenario);
  const werte = berechneAbgeleiteteWerte(data);
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  
  // Step 1 Validierung
  if (config.steps.step1) {
    if (!data.step1.kategorie) errors['kategorie'] = 'Bitte Kategorie wählen';
    if (data.step1.komponenten.length === 0 && ['einspeiser', 'paragraph14a', 'erweiterung'].includes(data.step1.kategorie || '')) {
      errors['komponenten'] = 'Mindestens eine Komponente wählen';
    }

    // Demontage-Validierung
    if (data.step1.kategorie === 'demontage') {
      const demontage = data.step1.demontage;
      if (!demontage?.typ) errors['demontage_typ'] = 'Was soll demontiert werden?';
      if (!demontage?.grund) errors['demontage_grund'] = 'Grund für Demontage erforderlich';
    }

    // Zähler-Prozess-Validierung
    if (data.step1.kategorie === 'zaehler') {
      const zaehlerProzess = data.step1.zaehlerProzess;
      if (!zaehlerProzess?.prozessTyp) errors['zaehler_prozess'] = 'Zähler-Prozess wählen';
    }

    // Fertigmeldung-Validierung
    if (data.step1.kategorie === 'fertigmeldung') {
      const fm = data.step1.fertigmeldung;
      if (!fm?.installationAbgeschlossen) errors['fm_installation'] = 'Installation muss abgeschlossen sein';
    }
  }
  
  // Step 2 Validierung
  if (config.steps.step2) {
    if (!data.step2.strasse) errors['strasse'] = 'Straße erforderlich';
    if (!data.step2.hausnummer) errors['hausnummer'] = 'Hausnummer erforderlich';
    if (!data.step2.plz || !isValidPLZ(data.step2.plz)) errors['plz'] = 'Gültige PLZ erforderlich';
    if (!data.step2.ort) errors['ort'] = 'Ort erforderlich';
  }
  
  // Step 3 Validierung
  if (config.steps.step3) {
    if (data.step3.istEigentuemer === null) errors['eigentuemer'] = 'Bitte angeben ob Eigentümer';
    if (data.step3.istEigentuemer === false && !data.step3.zustimmungVorhanden) {
      errors['zustimmung'] = 'Eigentümer-Zustimmung erforderlich';
    }
  }
  
  // Step 4 Validierung
  if (config.steps.step4) {
    if (!data.step4.netzbetreiberName && !data.step4.netzbetreiberManuell) {
      errors['netzbetreiber'] = 'Netzbetreiber erforderlich';
    }

    // Zähler-Validierung (nur wenn Zähler vorhanden UND nicht Demontage/Fertigmeldung)
    const zaehler = data.step4.zaehler;
    if (zaehler && !['demontage', 'fertigmeldung'].includes(data.step1.kategorie || '')) {
      // Nur validieren wenn "Zähler vorhanden" angehakt ist
      if (zaehler.vorhanden) {
        // Zählernummer ist OPTIONAL - Netzbetreiber kennt sie sowieso
        // if (!zaehler.zaehlernummer) errors['zaehler_nummer'] = 'Zählernummer erforderlich';
        if (!zaehler.typ) errors['zaehler_typ'] = 'Zählertyp erforderlich';
        if (!zaehler.standort) errors['zaehler_standort'] = 'Zählerstandort erforderlich';
      }
      // Bei "kein Zähler vorhanden" (Neuanschluss): Keine Validierung nötig
    }

    // Netzanschluss-Validierung (nur bei Neuanschluss)
    const netzanschluss = data.step4.netzanschluss;
    if (netzanschluss && data.step1.kategorie === 'netzanschluss') {
      if (!netzanschluss.gewuenschteAbsicherungA) errors['netzanschluss_absicherung'] = 'Gewünschte Absicherung erforderlich';
    }

    // Multi-Zähler Validierung
    const zaehlerBestand = data.step4.zaehlerBestand || [];
    if (zaehlerBestand.length > 0) {
      // Prüfe ob Zähler zur Zusammenlegung markiert sind
      const zusammenzulegende = zaehlerBestand.filter(z => z.aktion === 'zusammenlegen');
      const abzumeldende = zaehlerBestand.filter(z => z.aktion === 'abmelden');

      // Bei Zusammenlegung: zaehlerNeu muss konfiguriert sein
      if (zusammenzulegende.length > 0) {
        const zaehlerNeu = data.step4.zaehlerNeu;
        if (!zaehlerNeu?.gewuenschterTyp) {
          errors['zaehler_neu_typ'] = 'Zählertyp für neuen Zähler wählen';
        }
        if (zusammenzulegende.length < 2) {
          warnings.push('Zusammenlegung sinnvoll erst ab 2 Zählern');
        }
      }

      // Bei Abmeldung: Zählerstand sollte erfasst sein
      for (const z of abzumeldende) {
        if (!z.letzterStand) {
          warnings.push(`Zähler ${z.zaehlernummer || '(ohne Nr.)'}: Letzter Zählerstand empfohlen`);
        }
      }

      // Prüfe auf fehlende Zählernummern
      for (const z of zaehlerBestand) {
        if (!z.zaehlernummer && z.aktion !== 'behalten') {
          errors[`zaehler_${z.id}_nummer`] = `Zählernummer für ${z.verwendung || 'Zähler'} erforderlich`;
        }
      }
    }
  }
  
  // Step 5 Validierung - Technik-spezifisch
  if (config.steps.step5) {
    const k = data.step1.komponenten;
    
    // PV Validierung
    if (k.includes('pv') && config.technikFelder.pvModule) {
      // Multi-Dachflächen prüfen
      if ((data.step5.dachflaechen?.length || 0) === 0 && !data.step5.pvModule?.hersteller) {
        errors['pv_hersteller'] = 'Mindestens eine Dachfläche mit Modulen erforderlich';
      }
      const ersteDachflaeche = data.step5.dachflaechen?.[0];
      if (ersteDachflaeche && !ersteDachflaeche.modulHersteller) errors['pv_hersteller'] = 'Modul-Hersteller erforderlich';
      if (ersteDachflaeche && (!ersteDachflaeche.modulLeistungWp || ersteDachflaeche.modulLeistungWp <= 0)) errors['pv_leistung'] = 'Modulleistung erforderlich';
      
      // Multi-Wechselrichter prüfen
      const ersterWR = data.step5.wechselrichter?.[0];
      if ((data.step5.wechselrichter?.length || 0) === 0) errors['wr_hersteller'] = 'Mindestens ein Wechselrichter erforderlich';
      if (ersterWR && !ersterWR.hersteller) errors['wr_hersteller'] = 'WR-Hersteller erforderlich';
      if (ersterWR && (!ersterWR.leistungKva || ersterWR.leistungKva <= 0)) errors['wr_leistung'] = 'WR-Leistung erforderlich';
      
      // ZEREZ-ID Hinweis (kein blockierender Fehler mehr — Smart-Match versucht automatisch ZEREZ zuzuordnen)
      // Warnung wird separat über tipps.ts angezeigt
    }
    
    // Speicher Validierung
    if (k.includes('speicher') && config.technikFelder.speicher) {
      const ersterSpeicher = data.step5.speicher?.[0];
      if (ersterSpeicher && !ersterSpeicher.hersteller) errors['speicher_hersteller'] = 'Speicher-Hersteller erforderlich';
      if (ersterSpeicher && (!ersterSpeicher.kapazitaetKwh || ersterSpeicher.kapazitaetKwh <= 0)) errors['speicher_kapazitaet'] = 'Speicherkapazität erforderlich';
    }
    
    // Wallbox Validierung
    if (k.includes('wallbox') && config.technikFelder.wallbox) {
      const ersteWallbox = data.step5.wallboxen?.[0];
      if (ersteWallbox && !ersteWallbox.hersteller) errors['wb_hersteller'] = 'Wallbox-Hersteller erforderlich';
      if (ersteWallbox && (!ersteWallbox.leistungKw || ersteWallbox.leistungKw <= 0)) errors['wb_leistung'] = 'Wallbox-Leistung erforderlich';
    }
    
    // Wärmepumpe Validierung
    if (k.includes('waermepumpe') && config.technikFelder.waermepumpe) {
      const ersteWP = data.step5.waermepumpen?.[0];
      if (ersteWP && !ersteWP.hersteller) errors['wp_hersteller'] = 'WP-Hersteller erforderlich';
      if (ersteWP && (!ersteWP.leistungKw || ersteWP.leistungKw <= 0)) errors['wp_leistung'] = 'WP-Leistung erforderlich';
    }
    
    // Einspeiseart wird automatisch aus Messkonzept abgeleitet — keine manuelle Validierung nötig
    
    // Technische Warnungen
    if (werte.dcAcRatio > 1.4) warnings.push(`DC/AC-Ratio sehr hoch (${werte.dcAcRatio.toFixed(2)}). WR evtl. unterdimensioniert.`);
    if (werte.dcAcRatio > 0 && werte.dcAcRatio < 0.9) warnings.push(`DC/AC-Ratio niedrig (${werte.dcAcRatio.toFixed(2)}). WR evtl. überdimensioniert.`);
    if (werte.istNaSchutzPflichtig && !data.step5.naSchutzErforderlich) warnings.push('NA-Schutz ist ab 30 kVA Pflicht!');
  }
  
  // Step 6 Validierung
  if (config.steps.step6) {
    if (!data.step6.vorname) errors['vorname'] = 'Vorname erforderlich';
    if (!data.step6.nachname) errors['nachname'] = 'Nachname erforderlich';
    if (!data.step6.email) errors['email'] = 'E-Mail-Adresse erforderlich';
    else if (!isValidEmail(data.step6.email)) errors['email'] = 'Ungültige E-Mail-Adresse';
    
    // Gewerbe-Felder
    if (data.step6.kundentyp && data.step6.kundentyp !== 'privat' && config.kundenFelder.firma) {
      if (!data.step6.firma) errors['firma'] = 'Firmenname erforderlich';
    }
    
    // USt-ID bei bestimmten Szenarien (optional, da ustId in types existiert)
    if (config.kundenFelder.ustId && szenario === 'KLEIN_PV_VOLLEINSPEISUNG') {
      // ustId ist optional, nur Hinweis wenn nicht vorhanden
      if (!(data.step6 as any).ustId) warnings.push('USt-ID empfohlen bei Volleinspeisung');
    }
  }
  
  // Step 7 Validierung - Fotos
  if (config.steps.step7) {
    const fotos = data.step7.fotos || [];
    const pflichtKategorien = ['zaehlerschrank', 'zaehler_nahaufnahme', 'wechselrichter', 'pv_module', 'typenschild_modul', 'typenschild_wr'];

    // Bei Inbetriebnahme/Fertigmeldung: Pflichtfotos erforderlich
    if (['inbetriebnahme', 'fertigmeldung'].includes(data.step1.kategorie || '')) {
      const vorhandenKategorien = fotos.map(f => f.kategorie);
      const fehlendePflichtfotos = pflichtKategorien.filter(k => !vorhandenKategorien.includes(k as any));
      if (fehlendePflichtfotos.length > 0) {
        errors['fotos_pflicht'] = `Pflichtfotos fehlen: ${fehlendePflichtfotos.slice(0, 3).join(', ')}${fehlendePflichtfotos.length > 3 ? '...' : ''}`;
      }
    }
  }

  // Step 8 Validierung
  if (config.steps.step8) {
    if (!data.step8.agbAkzeptiert) errors['agb'] = 'AGB müssen akzeptiert werden';
    if (!data.step8.datenschutzAkzeptiert) errors['datenschutz'] = 'Datenschutz muss akzeptiert werden';
    if (!data.step8.vollmachtErteilt) errors['vollmacht'] = 'Vollmacht muss erteilt werden';

    // IBN-Validierung bei Inbetriebnahme/Fertigmeldung
    const ibn = data.step8.inbetriebnahme;
    if (ibn && ['inbetriebnahme', 'fertigmeldung'].includes(data.step1.kategorie || '')) {
      if (!ibn.mastrNummer) warnings.push('MaStR-Nummer sollte eingetragen werden');
      if (!ibn.netzbetreiberGemeldet) errors['ibn_netzbetreiber'] = 'Netzbetreiber-Meldung erforderlich';
      if (!ibn.mastrAngemeldet) errors['ibn_mastr'] = 'MaStR-Meldung erforderlich';
    }

    // Prüfprotokoll-Validierung bei Inbetriebnahme
    const pruef = ibn?.pruefprotokoll;
    if (pruef && data.step1.kategorie === 'inbetriebnahme') {
      if (pruef.isolationsmessung?.durchgefuehrt &&
          (!pruef.isolationsmessung.wertMOhm || pruef.isolationsmessung.wertMOhm < 1)) {
        errors['pruef_isolation'] = 'Isolationswiderstand muss ≥1 MΩ sein';
      }
      if (pruef.rcdPruefung?.durchgefuehrt &&
          (pruef.rcdPruefung.ausloesezeit_ms && pruef.rcdPruefung.ausloesezeit_ms > 300)) {
        errors['pruef_rcd'] = 'RCD-Auslösezeit muss ≤300ms sein';
      }
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

export function validateStep(data: WizardData, step: number): ValidationResult {
  const fullResult = validateWizard(data);
  // const stepPrefix
  
  // Filtere nur Fehler des aktuellen Steps
  const stepErrors: Record<string, string> = {};
  const errorKeysByStep: Record<number, string[]> = {
    1: ['kategorie', 'komponenten', 'vorgangsart', 'groessenklasse', 'demontage_', 'zaehler_prozess', 'fm_'],
    2: ['strasse', 'hausnummer', 'plz', 'ort', 'bundesland'],
    3: ['eigentuemer', 'zustimmung'],
    4: ['netzbetreiber', 'zaehler_', 'netzanschluss_'],
    5: ['pv_', 'wr_', 'speicher_', 'wb_', 'wp_', 'einspeiseart', 'zerez'],
    6: ['vorname', 'nachname', 'email', 'telefon', 'firma', 'kundentyp'],
    7: ['dokument', 'fotos_'],
    8: ['agb', 'datenschutz', 'vollmacht', 'signatur', 'ibn_', 'pruef_'],
  };
  
  const relevantKeys = errorKeysByStep[step] || [];
  for (const [key, value] of Object.entries(fullResult.errors)) {
    if (relevantKeys.some(rk => key.startsWith(rk) || key === rk)) {
      stepErrors[key] = value;
    }
  }
  
  return {
    valid: Object.keys(stepErrors).length === 0,
    errors: stepErrors,
    warnings: fullResult.warnings,
  };
}

// Prüfe String-Kompatibilität
export function validateStringKonfiguration(modulVoc: number, modulVmpp: number, modulImpp: number, anzahlModule: number, wrVocMax: number, wrVmppMin: number, wrVmppMax: number, wrImppMax: number): { valid: boolean; fehler: string[]; warnungen: string[] } {
  const fehler: string[] = [];
  const warnungen: string[] = [];
  
  const stringVoc = modulVoc * anzahlModule;
  const stringVmpp = modulVmpp * anzahlModule;
  
  if (stringVoc > wrVocMax) {
    fehler.push(`String Voc (${stringVoc.toFixed(0)}V) überschreitet WR-Max (${wrVocMax}V) - GEFAHR!`);
  }
  
  if (stringVmpp < wrVmppMin) {
    fehler.push(`String Vmpp (${stringVmpp.toFixed(0)}V) unter WR-Minimum (${wrVmppMin}V)`);
  }
  
  if (stringVmpp > wrVmppMax) {
    fehler.push(`String Vmpp (${stringVmpp.toFixed(0)}V) über WR-Maximum (${wrVmppMax}V)`);
  }
  
  if (modulImpp > wrImppMax) {
    warnungen.push(`Modul Impp (${modulImpp.toFixed(1)}A) nahe WR-Grenze (${wrImppMax}A)`);
  }
  
  // Temperaturkorrektur Warnung
  const vocKalt = stringVoc * 1.15; // Ca. -10°C
  if (vocKalt > wrVocMax) {
    warnungen.push(`Bei Kälte (-10°C) könnte Voc ${vocKalt.toFixed(0)}V erreichen (Max: ${wrVocMax}V)`);
  }
  
  return {
    valid: fehler.length === 0,
    fehler,
    warnungen,
  };
}
