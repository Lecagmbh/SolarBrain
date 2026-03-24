/**
 * Baunity Intelligence - AI Tipp Generator
 */

import type { WizardData } from '../../types/wizard.types';
import type { AITipp, AnmeldeSzenario } from './types';
import { detectSzenario, berechneAbgeleiteteWerte } from './detector';
import { getSzenarioConfig } from './scenarios';
import { getNBAnforderungen } from './netzbetreiber';

export function generiereAITipps(data: WizardData, currentStep: number): AITipp[] {
  const tipps: AITipp[] = [];
  const szenario = detectSzenario(data);
  const config = getSzenarioConfig(szenario);
  const werte = berechneAbgeleiteteWerte(data);
  const k = data.step1.komponenten;
  
  // === STEP 1: Art der Anmeldung ===
  if (currentStep === 1) {
    if (szenario === 'BALKON_PV') {
      tipps.push({ id: 'balkon', typ: 'erfolg', titel: 'Vereinfachtes Verfahren', text: 'Keine Genehmigung nötig - nur MaStR-Anmeldung.', prioritaet: 100 });
    }
    if (k.includes('wallbox') || k.includes('waermepumpe')) {
      const betrag = k.includes('wallbox') && k.includes('waermepumpe') ? 380 : 190;
      tipps.push({ id: '14a', typ: 'geld', titel: '§14a Ersparnis', text: `Bis zu ${betrag}€/Jahr Netzentgelt sparen!`, prioritaet: 95 });
    }
    if (k.includes('pv') && !k.includes('speicher')) {
      tipps.push({ id: 'speicher-tipp', typ: 'info', titel: 'Speicher erwägen?', text: 'Erhöht Eigenverbrauch um 20-30%.', prioritaet: 50 });
    }
  }
  
  // === STEP 2: Standort ===
  if (currentStep === 2 && !data.step2.flurstueck) {
    tipps.push({ id: 'flur', typ: 'info', titel: 'Flurstück', text: 'Im Grundbuch oder Liegenschaftskataster zu finden.', prioritaet: 30 });
  }
  
  // === STEP 3: Eigentum ===
  if (currentStep === 3 && data.step3.istEigentuemer === false && !data.step3.zustimmungVorhanden) {
    tipps.push({ id: 'zustimmung', typ: 'fehler', titel: 'Zustimmung fehlt', text: 'Ohne Eigentümer-Zustimmung keine Anmeldung möglich.', prioritaet: 100 });
  }
  
  // === STEP 4: Netzbetreiber ===
  if (currentStep === 4 && data.step4.netzbetreiberName) {
    const nb = getNBAnforderungen(data.step4.netzbetreiberId || '');
    tipps.push({ id: 'nb-zeit', typ: 'info', titel: 'Bearbeitungszeit', text: nb.bearbeitungszeit, prioritaet: 60 });
    if (nb.portalUrl) {
      tipps.push({ id: 'nb-portal', typ: 'info', titel: 'Online-Portal', text: 'Digitale Einreichung ist meist schneller.', prioritaet: 55 });
    }
  }
  
  // === STEP 5: Technik ===
  if (currentStep === 5) {
    if (werte.dcAcRatio > 0 && werte.dcAcRatio >= 1.0 && werte.dcAcRatio <= 1.2) {
      tipps.push({ id: 'dcac', typ: 'erfolg', titel: 'Gute Dimensionierung', text: `DC/AC: ${werte.dcAcRatio.toFixed(2)} - optimal.`, prioritaet: 50 });
    } else if (werte.dcAcRatio > 1.3) {
      tipps.push({ id: 'dcac-warn', typ: 'warnung', titel: 'WR evtl. unterdimensioniert', text: `DC/AC: ${werte.dcAcRatio.toFixed(2)}`, prioritaet: 75 });
    }
    if (werte.istNaSchutzPflichtig) {
      tipps.push({ id: 'naschutz', typ: 'warnung', titel: 'NA-Schutz Pflicht', text: `Ab 30 kVA erforderlich (${werte.gesamtleistungKva.toFixed(1)} kVA).`, prioritaet: 95 });
    }
    if (werte.istDirektvermarktungPflichtig) {
      tipps.push({ id: 'direkt', typ: 'warnung', titel: 'Direktvermarktung', text: 'Ab 100 kWp keine EEG-Vergütung. Vertrag VOR IBN!', prioritaet: 100 });
    }
    if (config.validierung.zerezIdPflicht && !data.step5.wechselrichter?.[0]?.zerezId) {
      tipps.push({ id: 'zerez', typ: 'warnung', titel: 'ZEREZ-ID fehlt', text: 'Wechselrichter muss im ZEREZ eingetragen sein.', prioritaet: 80 });
    }
  }
  
  // === STEP 6: Kunde ===
  if (currentStep === 6) {
    if (szenario === 'KLEIN_PV_VOLLEINSPEISUNG') {
      tipps.push({ id: 'voll-steuer', typ: 'warnung', titel: 'Regelbesteuerung', text: 'Bei Volleinspeisung keine Kleinunternehmer-Regelung möglich.', prioritaet: 85 });
    }
    if (config.finanzen.eegVerguetung && !data.step6.iban) {
      tipps.push({ id: 'iban', typ: 'info', titel: 'Bankverbindung', text: 'Für EEG-Vergütung erforderlich.', prioritaet: 50 });
    }
  }
  
  // === STEP 7: Dokumente ===
  if (currentStep === 7) {
    tipps.push({ id: 'auto-docs', typ: 'erfolg', titel: 'Auto-Generierung', text: 'Schaltplan und Vollmacht werden automatisch erstellt.', prioritaet: 70 });
    if (config.dokumente.e6NaSchutz) {
      tipps.push({ id: 'naschutz-cert', typ: 'warnung', titel: 'NA-Schutz-Zertifikat', text: 'Muss vor Inbetriebnahme vorliegen.', prioritaet: 90 });
    }
  }
  
  // === STEP 8: Abschluss ===
  if (currentStep === 8) {
    tipps.push({ id: 'verfahren', typ: 'info', titel: `${config.verfahren.typ}-Verfahren`, text: `${config.verfahren.fristWochen} Wochen Bearbeitung. ${config.verfahren.genehmigungPflicht ? 'Genehmigung nötig.' : ''}`, prioritaet: 80 });
    if (config.validierung.mastrPflicht) {
      tipps.push({ id: 'mastr', typ: 'info', titel: 'MaStR', text: 'Registrierung binnen 1 Monat nach IBN.', prioritaet: 75 });
    }
    const fin: string[] = [];
    if (config.finanzen.eegVerguetungCent) fin.push(`EEG: ${config.finanzen.eegVerguetungCent} ct/kWh`);
    if (config.finanzen.paragraph14aEuroJahr) fin.push(`§14a: ${config.finanzen.paragraph14aEuroJahr}€/Jahr`);
    if (fin.length) tipps.push({ id: 'finanzen', typ: 'geld', titel: 'Vorteile', text: fin.join(' | '), prioritaet: 90 });
  }
  
  return tipps.sort((a, b) => (b.prioritaet || 0) - (a.prioritaet || 0));
}

export function getSzenarioHinweise(szenario: AnmeldeSzenario): { hinweise: string[]; warnungen: string[] } {
  const config = getSzenarioConfig(szenario);
  return { hinweise: config.hinweise, warnungen: config.warnungen };
}
