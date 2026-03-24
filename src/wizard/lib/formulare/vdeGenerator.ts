/**
 * Baunity VDE-AR-N 4105 Formular Generator V3
 * ========================================
 * Generiert druckfertige VDE-Formulare:
 * - E.1 Antragstellung
 * - E.2 Datenblatt Erzeugungsanlage
 * - E.3 Datenblatt Speicher
 * - E.8 Inbetriebsetzungsprotokoll
 * 
 * Features:
 * - Alle Standard-Checkboxen vorausgefüllt
 * - 70% Drosselung als Standard
 * - Admin-only Felder markiert
 * - Multi-Komponenten Support
 */

import type { WizardData } from '../../types/wizard.types';
import { COMPANY } from '../../types/wizard.types';
import { detectSzenario } from '../intelligence/detector';
import { ermittleMesskonzept } from '../intelligence/messkonzept';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface GeneratedFormular {
  typ: string;
  name: string;
  html: string;
  dateiname: string;
}

export interface FormularSet {
  formulare: GeneratedFormular[];
  szenario: string;
  messkonzept: string;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const formatDatum = (date?: Date) => {
  const d = date || new Date();
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

const feld = (value: any, fallback = '_______________') => value || fallback;
const checkbox = (checked: boolean) => checked ? '☑' : '☐';

// ═══════════════════════════════════════════════════════════════════════════
// CSS STYLES
// ═══════════════════════════════════════════════════════════════════════════

const getCSSStyles = () => `
<style>
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; }
  body { 
    font-family: 'Segoe UI', Arial, sans-serif; 
    font-size: 10pt; 
    line-height: 1.4; 
    color: #1a1a1a;
    max-width: 210mm;
    margin: 0 auto;
    padding: 10mm;
    background: white;
  }
  .header { 
    display: flex; 
    justify-content: space-between; 
    align-items: flex-start;
    border-bottom: 2px solid #005b96; 
    padding-bottom: 12px; 
    margin-bottom: 20px; 
  }
  .header-left { }
  .header-right { text-align: right; font-size: 9pt; color: #666; }
  .title { font-size: 16pt; font-weight: bold; color: #005b96; margin: 0; }
  .subtitle { font-size: 10pt; color: #444; margin: 3px 0; }
  .norm { font-size: 8pt; color: #888; }
  .section { margin-bottom: 16px; }
  .section-title { 
    font-weight: bold; 
    font-size: 11pt; 
    background: #f0f4f8; 
    padding: 6px 10px; 
    border-left: 4px solid #005b96; 
    margin-bottom: 10px;
    color: #005b96;
  }
  table.form-table { width: 100%; border-collapse: collapse; }
  table.form-table td { padding: 6px 8px; border: 1px solid #ddd; vertical-align: top; }
  table.form-table td.label { width: 45%; background: #fafafa; font-weight: 500; }
  table.form-table td.value { width: 55%; }
  table.form-table td.highlight { background: #e8f4e8; font-weight: bold; }
  .checkbox-row { display: flex; flex-wrap: wrap; gap: 15px; margin: 8px 0; }
  .checkbox-item { display: flex; align-items: center; gap: 6px; }
  .checkbox { font-size: 14pt; }
  .signature-area { 
    display: flex; 
    justify-content: space-between; 
    margin-top: 40px; 
    padding-top: 20px;
    border-top: 1px solid #ccc;
  }
  .signature-block { width: 45%; }
  .signature-line { 
    border-top: 1px solid #333; 
    padding-top: 5px; 
    margin-top: 50px; 
    font-size: 9pt; 
    color: #666;
  }
  .info { font-size: 8pt; color: #888; font-style: italic; }
  .prefilled { color: #0066cc; }
  @media print { 
    body { padding: 0; }
  }
  @media screen {
    body { box-shadow: 0 0 20px rgba(0,0,0,0.1); }
  }
</style>
`;

// ═══════════════════════════════════════════════════════════════════════════
// E.1 ANTRAGSTELLUNG
// ═══════════════════════════════════════════════════════════════════════════

function generateE1(data: WizardData): GeneratedFormular {
  const { step2, step3, step4, step5, step6 } = data;
  
  const pvKwp = step5.dachflaechen?.reduce((sum, d) => sum + (d.modulLeistungWp * d.modulAnzahl) / 1000, 0) || 
                (step5.pvModule?.leistungWp || 0) * (step5.pvModule?.anzahl || 0) / 1000;
  const pvKva = step5.wechselrichter?.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0) || 0;
  const hatSpeicher = (step5.speicher?.length || 0) > 0;
  const speicherKwh = step5.speicher?.reduce((s, sp) => s + (sp.kapazitaetKwh * sp.anzahl), 0) || 0;
  
  const istNeuerrichtung = data.step1.kategorie !== 'erweiterung';

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>E.1 Antragstellung - ${step6.nachname}</title>
  ${getCSSStyles()}
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1 class="title">E.1 Antragstellung</h1>
      <p class="subtitle">Erzeugungsanlagen am Niederspannungsnetz</p>
      <p class="norm">VDE-AR-N 4105:2018-11</p>
    </div>
    <div class="header-right">
      <strong>${step4.netzbetreiberName || 'Netzbetreiber'}</strong><br>
      Erstellt: ${formatDatum()}<br>
      <span class="info">Generiert durch Baunity</span>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Anlagenanschrift</div>
    <table class="form-table">
      <tr><td class="label">Vorname, Name</td><td class="value">${feld(step6.vorname)} ${feld(step6.nachname)}</td></tr>
      <tr><td class="label">Straße, Hausnummer</td><td class="value">${feld(step2.strasse)} ${feld(step2.hausnummer)}</td></tr>
      <tr><td class="label">PLZ, Ort</td><td class="value">${feld(step2.plz)} ${feld(step2.ort)}</td></tr>
      <tr><td class="label">Telefon, E-Mail</td><td class="value">${feld(step6.telefon)} / ${feld(step6.email)}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Anschlussnehmer (Eigentümer)</div>
    <table class="form-table">
      <tr><td class="label">Vorname, Name</td><td class="value">${step3.istEigentuemer ? `${feld(step6.vorname)} ${feld(step6.nachname)}` : feld(step3.eigentuemer?.name)}</td></tr>
      <tr><td class="label">Straße, Hausnummer</td><td class="value">${step3.istEigentuemer ? `${feld(step2.strasse)} ${feld(step2.hausnummer)}` : feld(step3.eigentuemer?.adresse)}</td></tr>
      <tr><td class="label">PLZ, Ort</td><td class="value">${step3.istEigentuemer ? `${feld(step2.plz)} ${feld(step2.ort)}` : ''}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Anlagenbetreiber</div>
    <table class="form-table">
      <tr><td class="label">Vorname, Name</td><td class="value">${feld(step6.vorname)} ${feld(step6.nachname)}</td></tr>
      <tr><td class="label">Straße, Hausnummer</td><td class="value">${feld(step2.strasse)} ${feld(step2.hausnummer)}</td></tr>
      <tr><td class="label">PLZ, Ort</td><td class="value">${feld(step2.plz)} ${feld(step2.ort)}</td></tr>
      <tr><td class="label">Telefon, E-Mail</td><td class="value">${feld(step6.telefon)} / ${feld(step6.email)}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Anlagenerrichter (Elektrofachbetrieb)</div>
    <table class="form-table">
      <tr><td class="label">Firma, Ort</td><td class="value">${COMPANY.name}, ${COMPANY.ort}</td></tr>
      <tr><td class="label">Straße, Hausnummer</td><td class="value">${COMPANY.strasse} ${COMPANY.hausnummer}</td></tr>
      <tr><td class="label">Telefon, E-Mail</td><td class="value">${COMPANY.telefon} / ${COMPANY.email}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Anlagenart</div>
    <div class="checkbox-row">
      <div class="checkbox-item"><span class="checkbox">${checkbox(istNeuerrichtung)}</span> Neuerrichtung</div>
      <div class="checkbox-item"><span class="checkbox">${checkbox(!istNeuerrichtung)}</span> Erweiterung/Änderung einer bestehenden Anlage</div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Beigefügte Unterlagen</div>
    <table class="form-table">
      <tr><td colspan="2">
        <div class="checkbox-item"><span class="checkbox">☑</span> Anmeldevordruck „Anmeldung zum Netzanschluss" beigefügt</div>
        <div class="checkbox-item"><span class="checkbox">☑</span> Lageplan mit Bezeichnung und Grenzen des Grundstücks sowie Aufstellungsort beigefügt</div>
        <div class="checkbox-item"><span class="checkbox">☑</span> Datenblatt für die Erzeugungsanlage beigefügt (Vordruck E.2)</div>
        ${hatSpeicher ? '<div class="checkbox-item"><span class="checkbox">☑</span> Datenblatt für Speicher beigefügt (Vordruck E.3)</div>' : ''}
        <div class="checkbox-item"><span class="checkbox">☑</span> Einheitenzertifikate nach VDE-AR-N 4105 liegen vor</div>
        <div class="checkbox-item"><span class="checkbox">☑</span> Übersichtsschaltplan (einpolige Darstellung) beigefügt</div>
      </td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Leistungsdaten</div>
    <table class="form-table">
      <tr><td class="label">Max. Wirkleistung P<sub>Amax</sub></td><td class="value highlight">${pvKwp.toFixed(2)} kW</td></tr>
      <tr><td class="label">Max. Scheinleistung S<sub>Amax</sub></td><td class="value highlight">${pvKva.toFixed(2)} kVA</td></tr>
      ${hatSpeicher ? `<tr><td class="label">Speicherkapazität</td><td class="value">${speicherKwh} kWh</td></tr>` : ''}
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Geplanter Inbetriebsetzungstermin</div>
    <p style="font-size: 12pt; font-weight: bold;">${step5.geplanteIBN || '_______________'}</p>
  </div>
  
  <div class="signature-area">
    <div class="signature-block">
      <div class="signature-line">Ort, Datum</div>
    </div>
    <div class="signature-block">
      <div class="signature-line">Unterschrift des Anschlussnehmers</div>
    </div>
  </div>
</body>
</html>
`;

  return {
    typ: 'E1',
    name: 'E.1 Antragstellung',
    html,
    dateiname: `E1_Antragstellung_${step6.nachname}_${formatDatum().replace(/\./g, '-')}.html`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// E.2 DATENBLATT ERZEUGUNGSANLAGE
// ═══════════════════════════════════════════════════════════════════════════

function generateE2(data: WizardData): GeneratedFormular {
  const { step2, step5, step6 } = data;
  
  const pvKwp = step5.dachflaechen?.reduce((sum, d) => sum + (d.modulLeistungWp * d.modulAnzahl) / 1000, 0) || 
                (step5.pvModule?.leistungWp || 0) * (step5.pvModule?.anzahl || 0) / 1000;
  const pvKva = step5.wechselrichter?.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0) || 0;
  
  const ersteDachflaeche = step5.dachflaechen?.[0];
  const ersterWR = step5.wechselrichter?.[0];
  const gesamtModule = step5.dachflaechen?.reduce((s, d) => s + d.modulAnzahl, 0) || step5.pvModule?.anzahl || 0;
  const gesamtWR = step5.wechselrichter?.reduce((s, w) => s + w.anzahl, 0) || 1;
  
  const istPV = data.step1.komponenten.includes('pv') || data.step1.kategorie === 'einspeiser';
  const istBHKW = data.step1.komponenten.includes('bhkw');
  const istWind = data.step1.komponenten.includes('wind');
  const istDreiphasig = pvKva > 4.6;
  const einspeiseart = step5.einspeiseart || 'ueberschuss';

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>E.2 Datenblatt Erzeugungsanlage - ${step6.nachname}</title>
  ${getCSSStyles()}
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1 class="title">E.2 Datenblatt für Erzeugungsanlagen</h1>
      <p class="subtitle">Erzeugungsanlagen am Niederspannungsnetz</p>
      <p class="norm">VDE-AR-N 4105:2018-11</p>
    </div>
    <div class="header-right">
      Erstellt: ${formatDatum()}<br>
      <span class="info">Generiert durch Baunity</span>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Anlagenanschrift</div>
    <table class="form-table">
      <tr><td class="label">Vorname, Name</td><td class="value">${feld(step6.vorname)} ${feld(step6.nachname)}</td></tr>
      <tr><td class="label">Straße, Hausnummer</td><td class="value">${feld(step2.strasse)} ${feld(step2.hausnummer)}</td></tr>
      <tr><td class="label">PLZ, Ort</td><td class="value">${feld(step2.plz)} ${feld(step2.ort)}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Energieart</div>
    <div class="checkbox-row">
      <div class="checkbox-item"><span class="checkbox">${checkbox(istPV)}</span> Sonne</div>
      <div class="checkbox-item"><span class="checkbox">${checkbox(istWind)}</span> Wind</div>
      <div class="checkbox-item"><span class="checkbox">${checkbox(false)}</span> Wasser</div>
      <div class="checkbox-item"><span class="checkbox">${checkbox(istBHKW)}</span> BHKW</div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Erzeugungseinheiten (Wechselrichter)</div>
    <table class="form-table">
      <tr><td class="label">Hersteller</td><td class="value">${feld(ersterWR?.hersteller)}</td></tr>
      <tr><td class="label">Typ</td><td class="value">${feld(ersterWR?.modell)}</td></tr>
      <tr><td class="label">Nennleistung je Einheit</td><td class="value">${ersterWR?.leistungKva || '___'} kVA</td></tr>
      <tr><td class="label">Anzahl baugleicher Einheiten</td><td class="value">${gesamtWR}</td></tr>
      <tr><td class="label">Gesamtleistung WR</td><td class="value highlight">${pvKva.toFixed(2)} kVA</td></tr>
    </table>
    ${step5.wechselrichter && step5.wechselrichter.length > 1 ? `
    <p class="info" style="margin-top: 8px;">Hinweis: ${step5.wechselrichter.length} verschiedene Wechselrichter-Typen</p>
    ` : ''}
  </div>
  
  ${istPV ? `
  <div class="section">
    <div class="section-title">PV-Module</div>
    <table class="form-table">
      <tr><td class="label">Hersteller</td><td class="value">${feld(ersteDachflaeche?.modulHersteller || step5.pvModule?.hersteller)}</td></tr>
      <tr><td class="label">Typ</td><td class="value">${feld(ersteDachflaeche?.modulModell || step5.pvModule?.modell)}</td></tr>
      <tr><td class="label">Leistung je Modul</td><td class="value">${ersteDachflaeche?.modulLeistungWp || step5.pvModule?.leistungWp || '___'} Wp</td></tr>
      <tr><td class="label">Anzahl Module</td><td class="value">${gesamtModule}</td></tr>
      <tr><td class="label">Modulleistung gesamt (P<sub>gen</sub>)</td><td class="value highlight"><strong>${pvKwp.toFixed(2)} kWp</strong></td></tr>
    </table>
    ${step5.dachflaechen && step5.dachflaechen.length > 1 ? `
    <p class="info" style="margin-top: 8px;">
      <strong>${step5.dachflaechen.length} Dachflächen:</strong> 
      ${step5.dachflaechen.map(d => `${d.name} (${d.modulAnzahl} Module, ${d.ausrichtung})`).join(', ')}
    </p>
    ` : ''}
  </div>
  ` : ''}
  
  <div class="section">
    <div class="section-title">Erzeugungsanlage - Leistungsdaten</div>
    <table class="form-table">
      <tr><td class="label">Max. Wirkleistung P<sub>Amax</sub></td><td class="value highlight"><strong>${pvKwp.toFixed(2)} kW</strong></td></tr>
      <tr><td class="label">Max. Scheinleistung S<sub>Amax</sub></td><td class="value highlight"><strong>${pvKva.toFixed(2)} kVA</strong></td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Netzeinspeisung</div>
    <div class="checkbox-row">
      <div class="checkbox-item"><span class="checkbox">${checkbox(!istDreiphasig)}</span> 1-phasig</div>
      <div class="checkbox-item"><span class="checkbox">${checkbox(istDreiphasig)}</span> 3-phasig (Drehstrom)</div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Betriebsweise</div>
    <div class="checkbox-row">
      <div class="checkbox-item"><span class="checkbox">${checkbox(einspeiseart === 'ueberschuss')}</span> Überschusseinspeisung</div>
      <div class="checkbox-item"><span class="checkbox">${checkbox(einspeiseart === 'volleinspeisung')}</span> Volleinspeisung</div>
      <div class="checkbox-item"><span class="checkbox">${checkbox(einspeiseart === 'nulleinspeisung')}</span> Nulleinspeisung (kein Export)</div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">NA-Schutz / Einheitenzertifikat</div>
    <table class="form-table">
      <tr><td colspan="2">
        <div class="checkbox-item"><span class="checkbox">☑</span> Integrierter NA-Schutz im Wechselrichter</div>
        <div class="checkbox-item"><span class="checkbox">☑</span> Einheitenzertifikat nach VDE-AR-N 4105 vorhanden</div>
      </td></tr>
    </table>
  </div>
  
  <div class="signature-area">
    <div class="signature-block">
      <div class="signature-line">Ort, Datum</div>
    </div>
    <div class="signature-block">
      <div class="signature-line">Unterschrift Anlagenerrichter</div>
    </div>
  </div>
</body>
</html>
`;

  return {
    typ: 'E2',
    name: 'E.2 Datenblatt Erzeugungsanlage',
    html,
    dateiname: `E2_Datenblatt_${step6.nachname}_${formatDatum().replace(/\./g, '-')}.html`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// E.3 DATENBLATT SPEICHER
// ═══════════════════════════════════════════════════════════════════════════

function generateE3(data: WizardData): GeneratedFormular | null {
  const { step2, step5, step6 } = data;
  
  const hatSpeicher = (step5.speicher?.length || 0) > 0 || (step5.gesamtSpeicherKwh || 0) > 0;
  if (!hatSpeicher) return null;
  
  const speicher = step5.speicher?.[0];
  const gesamtKwh = step5.speicher?.reduce((s, sp) => s + (sp.kapazitaetKwh * sp.anzahl), 0) || step5.gesamtSpeicherKwh || 0;
  const gesamtAnzahl = step5.speicher?.reduce((s, sp) => s + sp.anzahl, 0) || 1;
  
  const istACGekoppelt = speicher?.kopplung === 'ac';
  const istDCGekoppelt = speicher?.kopplung === 'dc';

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>E.3 Datenblatt Speicher - ${step6.nachname}</title>
  ${getCSSStyles()}
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1 class="title">E.3 Datenblatt für Speicher</h1>
      <p class="subtitle">Erzeugungsanlagen am Niederspannungsnetz</p>
      <p class="norm">VDE-AR-N 4105:2018-11</p>
    </div>
    <div class="header-right">
      Erstellt: ${formatDatum()}<br>
      <span class="info">Generiert durch Baunity</span>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Anlagenanschrift</div>
    <table class="form-table">
      <tr><td class="label">Vorname, Name</td><td class="value">${feld(step6.vorname)} ${feld(step6.nachname)}</td></tr>
      <tr><td class="label">Straße, Hausnummer</td><td class="value">${feld(step2.strasse)} ${feld(step2.hausnummer)}</td></tr>
      <tr><td class="label">PLZ, Ort</td><td class="value">${feld(step2.plz)} ${feld(step2.ort)}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Errichter (Elektrofachbetrieb)</div>
    <table class="form-table">
      <tr><td class="label">Firma, Ort</td><td class="value">${COMPANY.name}, ${COMPANY.ort}</td></tr>
      <tr><td class="label">Straße, Hausnummer</td><td class="value">${COMPANY.strasse} ${COMPANY.hausnummer}</td></tr>
      <tr><td class="label">Telefon, E-Mail</td><td class="value">${COMPANY.telefon} / ${COMPANY.email}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Speichersystem</div>
    <table class="form-table">
      <tr><td class="label">Hersteller</td><td class="value">${feld(speicher?.hersteller)}</td></tr>
      <tr><td class="label">Typ</td><td class="value">${feld(speicher?.modell)}</td></tr>
      <tr><td class="label">Anzahl</td><td class="value">${gesamtAnzahl}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Kopplung</div>
    <div class="checkbox-row">
      <div class="checkbox-item"><span class="checkbox">${checkbox(istACGekoppelt)}</span> AC-gekoppelt (eigener Batterie-WR)</div>
      <div class="checkbox-item"><span class="checkbox">${checkbox(istDCGekoppelt)}</span> DC-gekoppelt (Hybrid-WR)</div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Technische Daten</div>
    <table class="form-table">
      <tr><td class="label">Nutzbare Speicherkapazität</td><td class="value highlight"><strong>${gesamtKwh} kWh</strong></td></tr>
      <tr><td class="label">Entladeleistung</td><td class="value">${speicher?.leistungKw || '___'} kW</td></tr>
      <tr><td class="label">Notstromfähig</td><td class="value">${speicher?.notstrom ? 'Ja' : 'Nein'}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Nachweise</div>
    <table class="form-table">
      <tr><td colspan="2">
        <div class="checkbox-item"><span class="checkbox">☑</span> Einheitenzertifikat nach VDE-AR-N 4105 liegt vor</div>
        <div class="checkbox-item"><span class="checkbox">☑</span> NA-Schutz nach VDE-AR-N 4105 vorhanden</div>
        <div class="checkbox-item"><span class="checkbox">☑</span> Allpolige Trennung vom öffentlichen Netz bei Netzersatzbetrieb gewährleistet</div>
      </td></tr>
    </table>
  </div>
  
  <div class="signature-area">
    <div class="signature-block">
      <div class="signature-line">Ort, Datum</div>
    </div>
    <div class="signature-block">
      <div class="signature-line">Unterschrift Anlagenerrichter</div>
    </div>
  </div>
</body>
</html>
`;

  return {
    typ: 'E3',
    name: 'E.3 Datenblatt Speicher',
    html,
    dateiname: `E3_Speicher_${step6.nachname}_${formatDatum().replace(/\./g, '-')}.html`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// E.8 INBETRIEBSETZUNGSPROTOKOLL
// ═══════════════════════════════════════════════════════════════════════════

function generateE8(data: WizardData): GeneratedFormular {
  const { step2, step5, step6 } = data;
  
  const pvKwp = step5.dachflaechen?.reduce((sum, d) => sum + (d.modulLeistungWp * d.modulAnzahl) / 1000, 0) || 
                step5.gesamtleistungKwp || 0;
  const pvKva = step5.wechselrichter?.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0) || 
                step5.gesamtleistungKva || 0;
  const hatSpeicher = (step5.speicher?.length || 0) > 0 || (step5.gesamtSpeicherKwh || 0) > 0;
  const speicherKwh = step5.speicher?.reduce((s, sp) => s + (sp.kapazitaetKwh * sp.anzahl), 0) || step5.gesamtSpeicherKwh || 0;
  const istDreiphasig = pvKva > 4.6;

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>E.8 Inbetriebsetzungsprotokoll - ${step6.nachname}</title>
  ${getCSSStyles()}
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1 class="title">E.8 Inbetriebsetzungsprotokoll</h1>
      <p class="subtitle">Erzeugungsanlagen/Speicher Niederspannung</p>
      <p class="norm">VDE-AR-N 4105:2018-11</p>
    </div>
    <div class="header-right">
      Erstellt: ${formatDatum()}<br>
      <span class="info">Generiert durch Baunity</span>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Anlagenanschrift</div>
    <table class="form-table">
      <tr><td class="label">Vorname, Name</td><td class="value">${feld(step6.vorname)} ${feld(step6.nachname)}</td></tr>
      <tr><td class="label">Straße, Hausnummer</td><td class="value">${feld(step2.strasse)} ${feld(step2.hausnummer)}</td></tr>
      <tr><td class="label">PLZ, Ort</td><td class="value">${feld(step2.plz)} ${feld(step2.ort)}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Anlagenerrichter</div>
    <table class="form-table">
      <tr><td class="label">Firma, Ort</td><td class="value">${COMPANY.name}, ${COMPANY.ort}</td></tr>
      <tr><td class="label">Straße, Hausnummer</td><td class="value">${COMPANY.strasse} ${COMPANY.hausnummer}</td></tr>
      <tr><td class="label">Telefon, E-Mail</td><td class="value">${COMPANY.telefon} / ${COMPANY.email}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Leistungsdaten</div>
    <table class="form-table">
      <tr><td class="label">Max. Scheinleistung S<sub>Amax</sub></td><td class="value highlight"><strong>${pvKva.toFixed(2)} kVA</strong></td></tr>
      <tr><td class="label">Max. Wirkleistung P<sub>Amax</sub></td><td class="value highlight"><strong>${pvKwp.toFixed(2)} kW</strong></td></tr>
      <tr><td class="label">Modulleistung P<sub>Agen</sub> (für PV)</td><td class="value highlight"><strong>${pvKwp.toFixed(2)} kWp</strong></td></tr>
      ${hatSpeicher ? `<tr><td class="label">Speicherkapazität</td><td class="value">${speicherKwh} kWh</td></tr>` : ''}
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Prüfungen und Nachweise</div>
    <table class="form-table">
      <tr><td colspan="2">
        <div class="checkbox-item"><span class="checkbox">☑</span> Übereinstimmung des ausgefüllten Datenblattes E.2 ${hatSpeicher ? 'und/oder E.3' : ''} mit dem Anlagenaufbau?</div>
        <div class="checkbox-item"><span class="checkbox">☑</span> Abrechnungsmessung: Vorinbetriebsetzungsprüfung + Inbetriebsetzungsprüfung erfolgt?</div>
        <div class="checkbox-item"><span class="checkbox">☑</span> Einheitenzertifikat für Erzeugungseinheiten ${hatSpeicher ? 'und/oder Speicher' : ''} vorhanden?</div>
        <div class="checkbox-item"><span class="checkbox">☑</span> Zertifikat für den NA-Schutz vorhanden?</div>
        <div class="checkbox-item"><span class="checkbox">☑</span> Übersichtsschaltplan vorhanden?</div>
      </td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">NA-Schutz Einstellungen</div>
    <table class="form-table">
      <tr><td class="label">Integrierter NA-Schutz: Spannungssteigerungsschutz U></td><td class="value">253 V (Standard)</td></tr>
      <tr><td class="label">Frequenzsteigerungsschutz f></td><td class="value">51,5 Hz (Standard)</td></tr>
      <tr><td class="label">Frequenzrückgangsschutz f<</td><td class="value">47,5 Hz (Standard)</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Einspeisemanagement</div>
    <table class="form-table">
      <tr><td colspan="2">
        <div class="checkbox-item"><span class="checkbox">☑</span> <strong>Drosselung auf 70 % im Umrichter eingestellt</strong></div>
        <div class="checkbox-item"><span class="checkbox">☑</span> Technische Einrichtung zur ferngesteuerten Leistungsreduzierung vorhanden?</div>
        ${hatSpeicher ? '<div class="checkbox-item"><span class="checkbox">☑</span> Energieflussrichtungssensor – Funktionstest durchgeführt und bestanden?</div>' : ''}
      </td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Symmetriebedingung</div>
    <div class="checkbox-row">
      <div class="checkbox-item"><span class="checkbox">${checkbox(istDreiphasig)}</span> Drehstromgenerator oder dreiphasiger Umrichter</div>
      <div class="checkbox-item"><span class="checkbox">${checkbox(!istDreiphasig)}</span> Einphasig (≤ 4,6 kVA)</div>
    </div>
    ${!istDreiphasig ? `
    <table class="form-table" style="margin-top: 10px;">
      <tr>
        <td></td>
        <td style="text-align: center;"><strong>L1</strong></td>
        <td style="text-align: center;"><strong>L2</strong></td>
        <td style="text-align: center;"><strong>L3</strong></td>
      </tr>
      <tr>
        <td class="label">Summe S<sub>Emax</sub></td>
        <td style="text-align: center;">${pvKva.toFixed(2)} kVA</td>
        <td style="text-align: center;">0 kVA</td>
        <td style="text-align: center;">0 kVA</td>
      </tr>
    </table>
    ` : ''}
  </div>
  
  <div class="section">
    <div class="section-title">Blindleistungsbereitstellung</div>
    <div class="checkbox-row">
      <div class="checkbox-item"><span class="checkbox">☑</span> <strong>Q(U)-Standard-Kennlinie</strong></div>
      <div class="checkbox-item"><span class="checkbox">☐</span> cos φ (P)-Standard-Kennlinie</div>
      <div class="checkbox-item"><span class="checkbox">☐</span> fester Verschiebungsfaktor cos φ = _____</div>
    </div>
  </div>
  
  <div class="section" style="padding: 15px; border: 2px solid #005b96; border-radius: 8px; background: #f0f4f8;">
    <p style="margin: 0;"><strong>Die Erzeugungsanlage ${hatSpeicher ? 'und/oder der Speicher ist/sind' : 'ist'} nach VDE-AR-N 4105, VDE-AR-N 4100 und den technischen Anschlussbedingungen des Netzbetreibers errichtet.</strong></p>
    <p style="margin: 10px 0 0 0; font-size: 9pt; color: #666;">Der Anlagenerrichter hat den Anlagenbetreiber einzuweisen und eine vollständige Dokumentation inkl. Schaltplan nach den jeweils gültigen VDE-Bestimmungen zu übergeben.</p>
  </div>
  
  <div class="section">
    <div class="section-title">Datum der Inbetriebsetzung</div>
    <p style="font-size: 14pt; font-weight: bold;">${step5.geplanteIBN || '_______________'}</p>
  </div>
  
  <div class="signature-area">
    <div class="signature-block">
      <div class="signature-line">Ort, Datum</div>
    </div>
    <div class="signature-block">
      <div class="signature-line">Unterschrift Anlagenbetreiber</div>
    </div>
  </div>
  
  <div class="signature-area" style="margin-top: 20px;">
    <div class="signature-block">
      <div class="signature-line">Stempel Elektrofachbetrieb</div>
    </div>
    <div class="signature-block">
      <div class="signature-line">Unterschrift Anlagenerrichter</div>
    </div>
  </div>
</body>
</html>
`;

  return {
    typ: 'E8',
    name: 'E.8 Inbetriebsetzungsprotokoll',
    html,
    dateiname: `E8_IBN_Protokoll_${step6.nachname}_${formatDatum().replace(/\./g, '-')}.html`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HAUPTFUNKTIONEN
// ═══════════════════════════════════════════════════════════════════════════

export function generateVDEFormulare(data: WizardData): FormularSet {
  const szenario = detectSzenario(data);
  const messkonzept = ermittleMesskonzept(data);
  
  const formulare: GeneratedFormular[] = [];
  
  // E.1 Antragstellung - Immer
  formulare.push(generateE1(data));
  
  // E.2 Datenblatt - Bei Erzeugungsanlagen
  if (data.step1.komponenten.includes('pv') || 
      data.step1.komponenten.includes('bhkw') ||
      data.step1.komponenten.includes('wind') ||
      data.step1.kategorie === 'einspeiser') {
    formulare.push(generateE2(data));
  }
  
  // E.3 Speicher - Nur wenn Speicher vorhanden
  const e3 = generateE3(data);
  if (e3) formulare.push(e3);
  
  // E.8 IBN-Protokoll - Immer
  formulare.push(generateE8(data));
  
  return {
    formulare,
    szenario,
    messkonzept: messkonzept.typ,
    timestamp: new Date().toISOString()
  };
}

export function generateSingleFormular(data: WizardData, typ: 'E1' | 'E2' | 'E3' | 'E8'): GeneratedFormular | null {
  switch (typ) {
    case 'E1': return generateE1(data);
    case 'E2': return generateE2(data);
    case 'E3': return generateE3(data);
    case 'E8': return generateE8(data);
    default: return null;
  }
}
