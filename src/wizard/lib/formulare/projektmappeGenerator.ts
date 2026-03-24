/**
 * Baunity Projektmappe Generator
 * ============================
 * Generiert professionelle Projektmappen wie PV*SOL
 * 
 * Inhalt:
 * - Deckblatt
 * - Projektübersicht mit Schaltplan
 * - Komponenten-Details
 * - Ertragsprognose
 * - Wirtschaftlichkeit
 * - Stückliste
 * - VDE-Formulare
 */

import type { WizardData } from '../../types/wizard.types';
import { COMPANY } from '../../types/wizard.types';
import { detectSzenario } from '../intelligence/detector';
import { ermittleMesskonzept } from '../intelligence/messkonzept';
import { schnellschaetzung } from '../intelligence/ertrag';
import { berechneWirtschaftlichkeit, type WirtschaftlichkeitInput } from '../intelligence/wirtschaftlichkeit';
import { generateSchaltplanSVG, extractSchaltplanConfig } from '../../components/wizard/generators/SchaltplanGenerator';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ProjektmappeConfig {
  includeDeckblatt: boolean;
  includeUebersicht: boolean;
  includeSchaltplan: boolean;
  includeKomponenten: boolean;
  includeErtrag: boolean;
  includeWirtschaftlichkeit: boolean;
  includeStueckliste: boolean;
  includeVDEFormulare: boolean;
}

export interface ProjektmappeResult {
  html: string;
  titel: string;
  dateiname: string;
  seiten: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const formatDatum = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const formatNumber = (num: number, decimals = 2) => 
  num.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// ═══════════════════════════════════════════════════════════════════════════
// CSS STYLES
// ═══════════════════════════════════════════════════════════════════════════

const getProjektmappeCSS = () => `
<style>
  @page { 
    size: A4; 
    margin: 20mm 15mm; 
  }
  @page :first {
    margin-top: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    font-size: 10pt; 
    line-height: 1.5; 
    color: #333;
    background: white;
  }
  
  /* Cover Page */
  .cover {
    height: 100vh;
    display: flex;
    flex-direction: column;
    page-break-after: always;
  }
  .cover-header {
    padding: 40px;
    background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
    color: white;
  }
  .cover-logo {
    font-size: 24pt;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .cover-subtitle {
    font-size: 11pt;
    opacity: 0.8;
  }
  .cover-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 60px 40px;
  }
  .cover-title {
    font-size: 28pt;
    font-weight: 300;
    color: #1e3a5f;
    margin-bottom: 20px;
  }
  .cover-project {
    font-size: 16pt;
    color: #666;
    margin-bottom: 40px;
  }
  .cover-image {
    width: 300px;
    height: 200px;
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1e3a5f;
    font-size: 60pt;
  }
  .cover-footer {
    padding: 30px 40px;
    background: #f5f5f5;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .cover-date {
    font-size: 14pt;
    color: #1e3a5f;
  }
  .cover-company {
    text-align: right;
    font-size: 9pt;
    color: #666;
  }
  
  /* Page Header */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 2px solid #1e3a5f;
    margin-bottom: 20px;
  }
  .page-header-title {
    font-size: 10pt;
    font-weight: 600;
    color: #1e3a5f;
  }
  .page-header-right {
    font-size: 8pt;
    color: #999;
  }
  
  /* Page Footer */
  .page-footer {
    position: fixed;
    bottom: 10mm;
    left: 15mm;
    right: 15mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid #ddd;
    font-size: 8pt;
    color: #999;
  }
  
  /* Section */
  .section {
    page-break-inside: avoid;
    margin-bottom: 25px;
  }
  .section-title {
    font-size: 18pt;
    font-weight: 300;
    color: #1e3a5f;
    margin-bottom: 5px;
    padding-bottom: 8px;
    border-bottom: 2px solid #1e3a5f;
  }
  .section-subtitle {
    font-size: 14pt;
    font-weight: 400;
    color: #1e3a5f;
    margin: 20px 0 10px 0;
  }
  
  /* Tables */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
  }
  .data-table th,
  .data-table td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  .data-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #1e3a5f;
  }
  .data-table tr:hover {
    background: #f8f9fa;
  }
  .data-table .value {
    text-align: right;
    font-weight: 500;
  }
  .data-table .highlight {
    background: #e3f2fd;
    font-weight: 600;
  }
  
  /* Info Box */
  .info-box {
    background: #e3f2fd;
    border-left: 4px solid #1e3a5f;
    padding: 15px 20px;
    margin: 15px 0;
    border-radius: 0 4px 4px 0;
  }
  .info-box-title {
    font-weight: 600;
    color: #1e3a5f;
    margin-bottom: 5px;
  }
  
  /* Schaltplan Container */
  .schaltplan-container {
    background: #fff;
    border: 1px solid #ddd;
    padding: 10px;
    margin: 15px 0;
    text-align: center;
  }
  .schaltplan-container svg {
    max-width: 100%;
    height: auto;
  }
  .schaltplan-caption {
    font-size: 9pt;
    color: #666;
    margin-top: 10px;
    text-align: right;
  }
  
  /* Component Card */
  .component-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
    margin: 10px 0;
    background: #fafafa;
  }
  .component-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .component-icon {
    width: 40px;
    height: 40px;
    background: #1e3a5f;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  .component-name {
    font-size: 12pt;
    font-weight: 600;
    color: #1e3a5f;
  }
  .component-details {
    font-size: 10pt;
    color: #666;
  }
  
  /* Grid */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  /* Stückliste */
  .stueckliste-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
  }
  .stueckliste-table th {
    background: #1e3a5f;
    color: white;
    padding: 10px;
    text-align: left;
  }
  .stueckliste-table td {
    padding: 8px 10px;
    border-bottom: 1px solid #eee;
  }
  .stueckliste-table tr:nth-child(even) {
    background: #f8f9fa;
  }
  
  /* Print */
  @media print {
    .page-break { page-break-before: always; }
    .no-break { page-break-inside: avoid; }
  }
</style>
`;

// ═══════════════════════════════════════════════════════════════════════════
// PAGE GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

function generateDeckblatt(data: WizardData): string {
  const kundenname = `${data.step6.vorname || ''} ${data.step6.nachname || ''}`.trim() || 'Kunde';
  const standort = `${data.step2.strasse || ''} ${data.step2.hausnummer || ''}, ${data.step2.plz || ''} ${data.step2.ort || ''}`.trim();
  
  return `
<div class="cover">
  <div class="cover-header">
    <div class="cover-logo">${COMPANY.name}</div>
    <div class="cover-subtitle">Netzanmeldung & Dokumentation</div>
  </div>
  <div class="cover-main">
    <h1 class="cover-title">Ihre PV-Anlage</h1>
    <div class="cover-project">
      <strong>Projekttitel:</strong> ${kundenname}<br>
      <strong>Standort:</strong> ${standort}
    </div>
    <div class="cover-image">☀️</div>
  </div>
  <div class="cover-footer">
    <div class="cover-date">${formatDatum()}</div>
    <div class="cover-company">
      Erstellt mit Baunity Wizard<br>
      ${COMPANY.name}
    </div>
  </div>
</div>
`;
}

function generateUebersicht(data: WizardData): string {
  const pvKwp = data.step5.dachflaechen?.reduce((sum, d) => sum + (d.modulLeistungWp * d.modulAnzahl) / 1000, 0) || 
                data.step5.gesamtleistungKwp || 0;
  const pvKva = data.step5.wechselrichter?.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0) || 0;
  const speicherKwh = data.step5.speicher?.reduce((s, sp) => s + (sp.kapazitaetKwh * sp.anzahl), 0) || 0;
  const modulAnzahl = data.step5.dachflaechen?.reduce((s, d) => s + d.modulAnzahl, 0) || 0;
  const wrAnzahl = data.step5.wechselrichter?.reduce((s, w) => s + w.anzahl, 0) || 0;
  const speicherAnzahl = data.step5.speicher?.reduce((s, sp) => s + sp.anzahl, 0) || 0;
  
  const szenario = detectSzenario(data);
  const mk = ermittleMesskonzept(data);
  
  return `
<div class="page-break"></div>
<div class="page-header">
  <div class="page-header-title">${data.step6.nachname || 'Projekt'}</div>
  <div class="page-header-right">${formatDatum()}</div>
</div>

<div class="section">
  <h2 class="section-title">Projektübersicht</h2>
  <h3 class="section-subtitle">PV-Anlage</h3>
  
  <div class="info-box">
    <div class="info-box-title">${szenario.replace(/_/g, ' ')}</div>
    Messkonzept: ${mk.typ} - ${mk.name}
  </div>
  
  <table class="data-table">
    <tr><td>PV-Generatorleistung</td><td class="value">${formatNumber(pvKwp)} kWp</td></tr>
    <tr><td>Wechselrichterleistung</td><td class="value">${formatNumber(pvKva)} kVA</td></tr>
    <tr><td>Anzahl PV-Module</td><td class="value">${modulAnzahl}</td></tr>
    <tr><td>Anzahl Wechselrichter</td><td class="value">${wrAnzahl}</td></tr>
    ${speicherKwh > 0 ? `<tr><td>Speicherkapazität</td><td class="value">${formatNumber(speicherKwh)} kWh</td></tr>` : ''}
    ${speicherAnzahl > 0 ? `<tr><td>Anzahl Batteriesysteme</td><td class="value">${speicherAnzahl}</td></tr>` : ''}
  </table>
</div>
`;
}

function generateSchaltplanSeite(data: WizardData): string {
  const config = extractSchaltplanConfig(data);
  const svgContent = generateSchaltplanSVG(config);
  
  return `
<div class="section">
  <h3 class="section-subtitle">Schaltschema</h3>
  <div class="schaltplan-container">
    ${svgContent}
  </div>
  <div class="schaltplan-caption">Abbildung: Schaltschema</div>
</div>
`;
}

function generateKomponenten(data: WizardData): string {
  let html = `
<div class="page-break"></div>
<div class="section">
  <h2 class="section-title">Aufbau der Anlage</h2>
`;

  // Dachflächen / Module
  if (data.step5.dachflaechen?.length) {
    html += `<h3 class="section-subtitle">Modulflächen</h3>`;
    
    data.step5.dachflaechen.forEach((dach, idx) => {
      const kwp = (dach.modulLeistungWp * dach.modulAnzahl) / 1000;
      html += `
      <div class="component-card">
        <div class="component-header">
          <div class="component-icon">☀️</div>
          <div>
            <div class="component-name">${idx + 1}. ${dach.name}</div>
            <div class="component-details">${formatNumber(kwp)} kWp</div>
          </div>
        </div>
        <table class="data-table">
          <tr><td>PV-Module</td><td class="value">${dach.modulAnzahl} x ${dach.modulHersteller} ${dach.modulModell}</td></tr>
          <tr><td>Modulleistung</td><td class="value">${dach.modulLeistungWp} Wp</td></tr>
          <tr><td>Neigung</td><td class="value">${dach.neigung}°</td></tr>
          <tr><td>Ausrichtung</td><td class="value">${dach.ausrichtung}</td></tr>
        </table>
      </div>
      `;
    });
  }

  // Wechselrichter
  if (data.step5.wechselrichter?.length) {
    html += `<h3 class="section-subtitle">Wechselrichter</h3>`;
    
    data.step5.wechselrichter.forEach((wr, idx) => {
      html += `
      <div class="component-card">
        <div class="component-header">
          <div class="component-icon">⚡</div>
          <div>
            <div class="component-name">Wechselrichter ${idx + 1}</div>
            <div class="component-details">${wr.hersteller} ${wr.modell}</div>
          </div>
        </div>
        <table class="data-table">
          <tr><td>Hersteller</td><td class="value">${wr.hersteller}</td></tr>
          <tr><td>Modell</td><td class="value">${wr.modell}</td></tr>
          <tr><td>Leistung</td><td class="value">${wr.leistungKva} kVA</td></tr>
          <tr><td>Anzahl</td><td class="value">${wr.anzahl}</td></tr>
          ${wr.zerezId ? `<tr><td>ZEREZ-ID</td><td class="value">${wr.zerezId}</td></tr>` : ''}
        </table>
      </div>
      `;
    });
  }

  // Speicher
  if (data.step5.speicher?.length) {
    html += `<h3 class="section-subtitle">Batteriesysteme</h3>`;
    
    data.step5.speicher.forEach((sp, idx) => {
      html += `
      <div class="component-card">
        <div class="component-header">
          <div class="component-icon">🔋</div>
          <div>
            <div class="component-name">Batteriesystem ${idx + 1}</div>
            <div class="component-details">${sp.hersteller} ${sp.modell}</div>
          </div>
        </div>
        <table class="data-table">
          <tr><td>Hersteller</td><td class="value">${sp.hersteller}</td></tr>
          <tr><td>Modell</td><td class="value">${sp.modell}</td></tr>
          <tr><td>Kapazität</td><td class="value">${sp.kapazitaetKwh} kWh</td></tr>
          <tr><td>Kopplung</td><td class="value">${sp.kopplung === 'dc' ? 'DC-gekoppelt' : 'AC-gekoppelt'}</td></tr>
          <tr><td>Anzahl</td><td class="value">${sp.anzahl}</td></tr>
        </table>
      </div>
      `;
    });
  }

  html += `</div>`;
  return html;
}

function generateErtragsprognose(data: WizardData): string {
  const pvKwp = data.step5.dachflaechen?.reduce((sum, d) => sum + (d.modulLeistungWp * d.modulAnzahl) / 1000, 0) || 
                data.step5.gesamtleistungKwp || 0;
  
  // Berechne Ertrag (Schnellschätzung)
  const plz = data.step2.plz || '50';
  const gesamtErtragKwh = schnellschaetzung(pvKwp, plz);
  const spezErtrag = pvKwp > 0 ? gesamtErtragKwh / pvKwp : 0;
  const eigenverbrauch = 30; // Standard 30%
  const netzeinspeisung = 70;
  const co2Ersparnis = gesamtErtragKwh * 0.4; // ca. 400g CO2/kWh
  
  return `
<div class="page-break"></div>
<div class="section">
  <h2 class="section-title">Ertragsprognose</h2>
  
  <table class="data-table">
    <tr><td>PV-Generatorleistung</td><td class="value">${formatNumber(pvKwp)} kWp</td></tr>
    <tr><td>Spez. Jahresertrag</td><td class="value">${formatNumber(spezErtrag)} kWh/kWp</td></tr>
    <tr><td>Anlagennutzungsgrad (PR)</td><td class="value">~85 %</td></tr>
    <tr class="highlight"><td>PV-Generatorenergie (AC-Netz)</td><td class="value"><strong>${formatNumber(gesamtErtragKwh, 0)} kWh/Jahr</strong></td></tr>
    <tr><td>&nbsp;&nbsp;Direkter Eigenverbrauch</td><td class="value">~${eigenverbrauch} %</td></tr>
    <tr><td>&nbsp;&nbsp;Netzeinspeisung</td><td class="value">~${netzeinspeisung} %</td></tr>
    <tr><td>Vermiedene CO₂-Emissionen</td><td class="value">${formatNumber(co2Ersparnis, 0)} kg/Jahr</td></tr>
  </table>
  
  <div class="info-box">
    <div class="info-box-title">Hinweis</div>
    Die Ergebnisse sind durch eine mathematische Modellrechnung ermittelt worden. Die tatsächlichen Erträge können aufgrund von Schwankungen des Wetters, der Wirkungsgrade von Modulen und Wechselrichtern sowie anderer Faktoren abweichen.
  </div>
</div>
`;
}

function generateWirtschaftlichkeit(data: WizardData): string {
  const pvKwp = data.step5.dachflaechen?.reduce((sum, d) => sum + (d.modulLeistungWp * d.modulAnzahl) / 1000, 0) || 
                data.step5.gesamtleistungKwp || 0;
  const speicherKwh = data.step5.speicher?.reduce((s, sp) => s + (sp.kapazitaetKwh * sp.anzahl), 0) || 0;
  const wallboxKw = data.step5.wallboxen?.reduce((s, w) => s + (w.leistungKw * w.anzahl), 0) || 0;
  const wpKw = data.step5.waermepumpen?.reduce((s, w) => s + w.leistungKw, 0) || 0;
  const plz = data.step2.plz || '50';
  const jahresertragKwh = schnellschaetzung(pvKwp, plz);
  
  // Wirtschaftlichkeit Input erstellen
  const wirtInput: WirtschaftlichkeitInput = {
    pvLeistungKwp: pvKwp,
    speicherKwh,
    wallboxKw,
    waermepumpeKw: wpKw,
    jahresertragKwh,
    eigenverbrauchQuote: speicherKwh > 0 ? 0.6 : 0.3,
    jahresverbrauchKwh: 4000,
    einspeiseart: 'ueberschuss',
    paragraph14aGeraete: (wallboxKw > 0 ? 1 : 0) + (wpKw > 0 ? 1 : 0),
  };
  
  const wirt = berechneWirtschaftlichkeit(wirtInput);
  
  return `
<div class="section">
  <h2 class="section-title">Wirtschaftlichkeitsanalyse</h2>
  <h3 class="section-subtitle">Ihr Gewinn</h3>
  
  <table class="data-table">
    <tr><td>Geschätzte Investitionskosten</td><td class="value">${formatNumber(wirt.investitionGesamt, 0)} €</td></tr>
    <tr><td>Amortisationsdauer</td><td class="value">~${formatNumber(wirt.amortisationJahre, 1)} Jahre</td></tr>
    <tr><td>Stromgestehungskosten</td><td class="value">~${formatNumber(wirt.stromgestehungskosten / 100, 4)} €/kWh</td></tr>
    <tr class="highlight"><td>Ersparnis über 25 Jahre</td><td class="value"><strong>${formatNumber(wirt.ersparnis25Jahre, 0)} €</strong></td></tr>
  </table>
  
  <h3 class="section-subtitle">Vergütung und Ersparnisse</h3>
  <table class="data-table">
    <tr><td>Einspeisevergütung (aktuell)</td><td class="value">0,0811 €/kWh</td></tr>
    <tr><td>Jährliche Einspeisevergütung (ca.)</td><td class="value">${formatNumber(wirt.einspeiseverguetung, 0)} €/Jahr</td></tr>
    <tr><td>Jährliche Ersparnis Eigenverbrauch</td><td class="value">${formatNumber(wirt.stromkostenErsparnis, 0)} €/Jahr</td></tr>
  </table>
</div>
`;
}

function generateStueckliste(data: WizardData): string {
  let items: { nr: number; typ: string; hersteller: string; name: string; menge: number; einheit: string }[] = [];
  let nr = 1;

  // Module
  data.step5.dachflaechen?.forEach(d => {
    items.push({
      nr: nr++,
      typ: 'PV-Modul',
      hersteller: d.modulHersteller,
      name: d.modulModell,
      menge: d.modulAnzahl,
      einheit: 'Stück'
    });
  });

  // Wechselrichter
  data.step5.wechselrichter?.forEach(w => {
    items.push({
      nr: nr++,
      typ: 'Wechselrichter',
      hersteller: w.hersteller,
      name: w.modell,
      menge: w.anzahl,
      einheit: 'Stück'
    });
  });

  // Speicher
  data.step5.speicher?.forEach(s => {
    items.push({
      nr: nr++,
      typ: 'Batteriesystem',
      hersteller: s.hersteller,
      name: s.modell,
      menge: s.anzahl,
      einheit: 'Stück'
    });
  });

  // Standard-Komponenten
  items.push({ nr: nr++, typ: 'Komponenten', hersteller: '', name: 'Zweirichtungszähler', menge: 1, einheit: 'Stück' });
  items.push({ nr: nr++, typ: 'Komponenten', hersteller: '', name: 'Hausanschluss', menge: 1, einheit: 'Stück' });

  return `
<div class="page-break"></div>
<div class="section">
  <h2 class="section-title">Stückliste</h2>
  
  <table class="stueckliste-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Typ</th>
        <th>Hersteller</th>
        <th>Name</th>
        <th>Menge</th>
        <th>Einheit</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.nr}</td>
          <td>${item.typ}</td>
          <td>${item.hersteller}</td>
          <td>${item.name}</td>
          <td>${item.menge}</td>
          <td>${item.einheit}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

export function generateProjektmappe(
  data: WizardData,
  config: Partial<ProjektmappeConfig> = {}
): ProjektmappeResult {
  const defaultConfig: ProjektmappeConfig = {
    includeDeckblatt: true,
    includeUebersicht: true,
    includeSchaltplan: true,
    includeKomponenten: true,
    includeErtrag: true,
    includeWirtschaftlichkeit: true,
    includeStueckliste: true,
    includeVDEFormulare: false,
  };
  
  const cfg = { ...defaultConfig, ...config };
  const kundenname = `${data.step6.vorname || ''} ${data.step6.nachname || ''}`.trim() || 'Projekt';
  
  let html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Projektmappe - ${kundenname}</title>
  ${getProjektmappeCSS()}
</head>
<body>
`;

  let seiten = 0;

  if (cfg.includeDeckblatt) {
    html += generateDeckblatt(data);
    seiten++;
  }

  if (cfg.includeUebersicht) {
    html += generateUebersicht(data);
    seiten++;
  }

  if (cfg.includeSchaltplan) {
    html += generateSchaltplanSeite(data);
  }

  if (cfg.includeKomponenten) {
    html += generateKomponenten(data);
    seiten++;
  }

  if (cfg.includeErtrag) {
    html += generateErtragsprognose(data);
    seiten++;
  }

  if (cfg.includeWirtschaftlichkeit) {
    html += generateWirtschaftlichkeit(data);
  }

  if (cfg.includeStueckliste) {
    html += generateStueckliste(data);
    seiten++;
  }

  html += `
</body>
</html>
`;

  return {
    html,
    titel: `Projektmappe ${kundenname}`,
    dateiname: `Projektmappe_${kundenname.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`,
    seiten: seiten + 2,
  };
}

export default generateProjektmappe;
