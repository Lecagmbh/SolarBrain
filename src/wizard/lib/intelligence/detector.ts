/**
 * Baunity Intelligence - Szenario Detector V4
 * =========================================
 * Intelligente Erkennung basierend auf:
 * 1. Kategorie (was will der Kunde)
 * 2. Komponenten (was wird installiert)
 * 3. Größenklasse/Leistung
 * 4. Einspeiseart
 * 5. Besonderheiten (Mieterstrom, etc.)
 */

import type { WizardData } from '../../types/wizard.types';
import type { AnmeldeSzenario } from './types';

/**
 * Hauptfunktion: Erkennt das passende Szenario
 */
export function detectSzenario(data: WizardData): AnmeldeSzenario {
  const { step1, step5 } = data;
  const { kategorie, komponenten, groessenklasse } = step1;
  
  // Flags aus Komponenten
  const hatPV = komponenten.includes('pv');
  const hatSpeicher = komponenten.includes('speicher');
  const hatWallbox = komponenten.includes('wallbox');
  const hatWP = komponenten.includes('waermepumpe');
  const hatBHKW = komponenten.includes('bhkw');
  const hatWind = komponenten.includes('wind');
  
  // Leistungsberechnung - Multi-Komponenten Support
  const pvKwp = step5.dachflaechen?.reduce((sum, d) => sum + (d.modulLeistungWp * d.modulAnzahl) / 1000, 0) || 
                (step5.pvModule?.leistungWp || 0) * (step5.pvModule?.anzahl || 0) / 1000;
  const pvKva = step5.wechselrichter?.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0) || 
                step5.gesamtleistungKva || 0;
  const wallboxKw = step5.wallboxen?.reduce((sum, w) => sum + w.leistungKw, 0) || 
                    step5.wallbox?.leistungKw || 0;
  const bhkwKw = step5.bhkw?.[0]?.leistungElektrischKw || 0;
  
  // Einspeiseart
  const einspeiseart = step5.einspeiseart || 'ueberschuss';
  
  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: NEUE PROZESSE (höchste Priorität)
  // ═══════════════════════════════════════════════════════════════════════

  // Demontage/Stilllegung
  if (kategorie === 'demontage') {
    return 'DEMONTAGE_ANLAGE';
  }

  // Zähler-Prozesse
  if (kategorie === 'zaehler') {
    return 'ZAEHLER_PROZESS';
  }

  // Fertigmeldung
  if (kategorie === 'fertigmeldung') {
    return 'FERTIGMELDUNG';
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SPEZIAL-KATEGORIEN (haben Vorrang)
  // ═══════════════════════════════════════════════════════════════════════

  // Inselanlage
  if (kategorie === 'inselanlage' || einspeiseart === 'insel') {
    return 'INSELANLAGE';
  }

  // Baustrom
  if (kategorie === 'baustrom') {
    return 'BAUSTROM_TEMPORAER';
  }

  // Netzanschluss
  if (kategorie === 'netzanschluss') {
    return 'HAUSANSCHLUSS_NEU';
  }
  
  // Mittelspannung (Kategorie oder >135 kVA)
  if (kategorie === 'mittelspannung' || pvKva > 135) {
    return 'GROSS_PV_MITTELSPANNUNG';
  }
  
  // Nulleinspeisung
  if (einspeiseart === 'nulleinspeisung') {
    return 'NULLEINSPEISUNG';
  }
  
  // Mieterstrom
  if (step5.mieterstrom) {
    return 'MIETERSTROMMODELL';
  }
  
  // Energy Sharing
  if (step5.energySharing) {
    return 'EIGENVERBRAUCHSGEMEINSCHAFT';
  }
  
  // Mehrere Anlagen
  if (step5.mehrereAnlagen) {
    return 'MEHRERE_ANLAGEN';
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // KATEGORIE: SPEICHER (nur Speicher, keine PV)
  // ═══════════════════════════════════════════════════════════════════════
  
  if (kategorie === 'speicher') {
    if (step1.vorgangsart === 'erweiterung') {
      return step5.speicher?.[0]?.kopplung === 'dc' ? 'SPEICHER_NACHRUESTUNG_DC' : 'SPEICHER_NACHRUESTUNG_AC';
    }
    return 'SPEICHER_STANDALONE';
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // KATEGORIE: §14a (Wallbox/WP ohne PV)
  // ═══════════════════════════════════════════════════════════════════════
  
  if (kategorie === 'paragraph14a') {
    // Beide Geräte
    if (hatWallbox && hatWP) {
      return 'WALLBOX_UND_WP_STEUERBAR';
    }
    // Nur Wallbox
    if (hatWallbox) {
      return wallboxKw <= 4.2 ? 'WALLBOX_UNTER_4KW' : 'WALLBOX_STEUERBAR';
    }
    // Nur Wärmepumpe
    if (hatWP) {
      return 'WAERMEPUMPE_STEUERBAR';
    }
    // Fallback
    return 'WALLBOX_STEUERBAR';
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // KATEGORIE: ERWEITERUNG
  // ═══════════════════════════════════════════════════════════════════════
  
  if (kategorie === 'erweiterung') {
    if (hatSpeicher && !hatPV) {
      return step5.speicher?.[0]?.kopplung === 'dc' ? 'SPEICHER_NACHRUESTUNG_DC' : 'SPEICHER_NACHRUESTUNG_AC';
    }
    // PV-Erweiterung behandeln wie neue PV
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // BHKW
  // ═══════════════════════════════════════════════════════════════════════
  
  if (hatBHKW) {
    return bhkwKw >= 50 ? 'BHKW_GROSS' : 'BHKW_KLEIN';
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // WINDKRAFT
  // ═══════════════════════════════════════════════════════════════════════
  
  if (hatWind) {
    return 'WINDKRAFT_KLEIN';
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PV-ANLAGEN (Hauptlogik)
  // ═══════════════════════════════════════════════════════════════════════
  
  if (hatPV || kategorie === 'einspeiser' || kategorie === 'inbetriebnahme') {
    const leistung = Math.max(pvKwp, pvKva);
    
    // Komplettsystem (PV + Speicher + §14a)
    if (hatSpeicher && (hatWallbox || hatWP)) {
      return 'KOMPLETT_SYSTEM';
    }
    
    // PV + Wallbox
    if (hatWallbox) {
      return 'WALLBOX_MIT_PV';
    }
    
    // PV + Wärmepumpe
    if (hatWP) {
      return 'WP_MIT_PV';
    }
    
    // Volleinspeisung
    if (einspeiseart === 'volleinspeisung') {
      return 'KLEIN_PV_VOLLEINSPEISUNG';
    }
    
    // Nach Größenklasse oder Leistung
    const effectiveSize = groessenklasse || detectGroessenklasse(leistung);
    
    switch (effectiveSize) {
      case 'balkon':
        return 'BALKON_PV';
      case 'mini':
        return hatSpeicher ? 'KLEIN_PV_MIT_SPEICHER' : 'MINI_PV_EINPHASIG';
      case 'klein':
      case 'mittel':
        if (leistung > 30 || pvKva > 30) return 'MITTEL_PV_NA_SCHUTZ';
        return hatSpeicher ? 'KLEIN_PV_MIT_SPEICHER' : 'KLEIN_PV_STANDARD';
      case 'gross':
        if (leistung > 100) return 'GROSS_PV_DIREKTVERMARKTUNG';
        return 'MITTEL_PV_NA_SCHUTZ';
      case 'gewerbe':
        if (leistung > 135) return 'GROSS_PV_MITTELSPANNUNG';
        return 'GROSS_PV_DIREKTVERMARKTUNG';
      default:
        return hatSpeicher ? 'KLEIN_PV_MIT_SPEICHER' : 'KLEIN_PV_STANDARD';
    }
  }
  
  // Default
  return 'KLEIN_PV_STANDARD';
}

/**
 * Größenklasse aus Leistung ableiten
 */
function detectGroessenklasse(leistungKw: number): string {
  if (leistungKw <= 0) return 'klein';
  if (leistungKw <= 0.8) return 'balkon';
  if (leistungKw <= 4.6) return 'mini';
  if (leistungKw <= 10) return 'klein';
  if (leistungKw <= 30) return 'mittel';
  if (leistungKw <= 100) return 'gross';
  return 'gewerbe';
}

/**
 * Ermittelt welche Technik-Felder basierend auf KOMPONENTEN angezeigt werden sollen
 * WICHTIG: Basiert auf den tatsächlich gewählten Komponenten, NICHT auf dem Szenario!
 */
export function getTechnikFelder(data: WizardData): Record<string, boolean> {
  const { step1 } = data;
  const { kategorie, komponenten } = step1;
  
  // Basis: Alle Felder aus
  const felder = {
    pvModule: false,
    wechselrichter: false,
    speicher: false,
    wallbox: false,
    waermepumpe: false,
    bhkw: false,
    einspeiseart: false,
  };
  
  // Kategorie-basierte Defaults
  switch (kategorie) {
    case 'einspeiser':
    case 'inbetriebnahme':
      // Bei Einspeiser: PV als Default wenn keine Komponenten gewählt
      if (komponenten.length === 0) {
        felder.pvModule = true;
        felder.wechselrichter = true;
        felder.einspeiseart = true;
      }
      break;
    case 'speicher':
      // Bei Speicher-Kategorie immer Speicher anzeigen
      felder.speicher = true;
      break;
    case 'paragraph14a':
      // Bei §14a: Wenn keine Komponenten, beide anzeigen zur Auswahl
      if (komponenten.length === 0) {
        felder.wallbox = true;
        felder.waermepumpe = true;
      }
      break;
    case 'mittelspannung':
      felder.pvModule = true;
      felder.wechselrichter = true;
      felder.einspeiseart = true;
      break;
    case 'inselanlage':
      felder.pvModule = true;
      felder.wechselrichter = true;
      felder.speicher = true;
      break;
    // Phase 2: Keine Technik-Felder für neue Prozesse
    case 'demontage':
    case 'zaehler':
    case 'fertigmeldung':
      // Alle Technik-Felder bleiben aus - diese Prozesse brauchen keine Technik-Eingabe
      break;
  }
  
  // Komponenten-basierte Aktivierung (überschreibt Defaults)
  if (komponenten.includes('pv')) {
    felder.pvModule = true;
    felder.wechselrichter = true;
    felder.einspeiseart = true;
  }
  if (komponenten.includes('speicher')) {
    felder.speicher = true;
  }
  if (komponenten.includes('wallbox')) {
    felder.wallbox = true;
  }
  if (komponenten.includes('waermepumpe')) {
    felder.waermepumpe = true;
  }
  if (komponenten.includes('bhkw')) {
    felder.bhkw = true;
  }
  
  return felder;
}

/**
 * Berechnet abgeleitete Werte aus den technischen Daten
 */
export function berechneAbgeleiteteWerte(data: WizardData) {
  const { step5 } = data;
  
  // Multi-Komponenten Support
  const pvModulLeistung = step5.dachflaechen?.reduce((sum, d) => sum + (d.modulLeistungWp * d.modulAnzahl), 0) || 
                          (step5.pvModule?.leistungWp || 0) * (step5.pvModule?.anzahl || 0);
  const gesamtleistungKwp = pvModulLeistung / 1000;
  const gesamtleistungKva = step5.wechselrichter?.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0) || 0;
  const dcAcRatio = gesamtleistungKva > 0 ? gesamtleistungKwp / gesamtleistungKva : 0;
  const speicherKwh = step5.speicher?.reduce((sum, s) => sum + (s.kapazitaetKwh * s.anzahl), 0) || 0;
  const wallboxKw = step5.wallboxen?.reduce((sum, w) => sum + (w.leistungKw * w.anzahl), 0) || 0;
  const waermepumpeKw = step5.waermepumpen?.reduce((sum, w) => sum + w.leistungKw, 0) || 0;
  const bhkwKw = step5.bhkw?.[0]?.leistungElektrischKw || 0;
  
  // Grenzwert-Flags
  const istBalkon = gesamtleistungKwp <= 2 && gesamtleistungKva <= 0.8;
  const istEinphasig = gesamtleistungKva <= 4.6;
  const istNaSchutzPflichtig = gesamtleistungKva > 30;
  const istAnlagenzertifikatPflichtig = gesamtleistungKva > 135;
  const istDirektvermarktungPflichtig = gesamtleistungKwp > 100;
  
  // EEG Vergütung
  let eegVerguetungCent = 0;
  if (step5.einspeiseart === 'volleinspeisung') {
    eegVerguetungCent = gesamtleistungKwp <= 10 ? 12.87 : 10.79;
  } else if (step5.einspeiseart !== 'nulleinspeisung' && step5.einspeiseart !== 'insel') {
    if (gesamtleistungKwp <= 10) eegVerguetungCent = 8.11;
    else if (gesamtleistungKwp <= 40) eegVerguetungCent = 7.03;
    else eegVerguetungCent = 5.74;
  }
  
  // §14a Ersparnis
  const paragraph14aGeraete: Array<{ typ: string; kw: number }> = [];
  if (wallboxKw > 4.2) paragraph14aGeraete.push({ typ: 'Wallbox', kw: wallboxKw });
  if (waermepumpeKw > 4.2) paragraph14aGeraete.push({ typ: 'Wärmepumpe', kw: waermepumpeKw });
  const paragraph14aErsparnis = paragraph14aGeraete.length * 190;
  
  return {
    gesamtleistungKwp,
    gesamtleistungKva,
    dcAcRatio,
    speicherKwh,
    wallboxKw,
    waermepumpeKw,
    bhkwKw,
    istBalkon,
    istEinphasig,
    istNaSchutzPflichtig,
    istAnlagenzertifikatPflichtig,
    istDirektvermarktungPflichtig,
    paragraph14aGeraete,
    paragraph14aErsparnis,
    eegVerguetungCent,
    pvString: gesamtleistungKwp > 0 ? `${gesamtleistungKwp.toFixed(2)} kWp` : '-',
    wrString: gesamtleistungKva > 0 ? `${gesamtleistungKva.toFixed(2)} kVA` : '-',
    speicherString: speicherKwh > 0 ? `${speicherKwh.toFixed(1)} kWh` : '-',
  };
}
