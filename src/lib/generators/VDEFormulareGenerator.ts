/**
 * Baunity Unified VDE-Formulare Generator
 * =========================================
 * Generiert VDE-AR-N 4105 konforme Formulare:
 * - E.1 Antragstellung Erzeugungsanlage
 * - E.2 Datenblatt Erzeugungsanlage
 * - E.3 Datenblatt Speicher
 * - E.8 Inbetriebnahmeprotokoll
 */

import { jsPDF } from 'jspdf';
import type { UnifiedInstallationData, GeneratedDocument, GeneratorOptions } from './types';
import { COMPANY } from '../../config/company';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
  primary: '#1565c0',
  header: '#0f172a',
  text: '#212121',
  textLight: '#64748b',
  border: '#cbd5e1',
  bg: '#f8fafc',
  accent: '#10b981',
  white: '#ffffff',
};

// ═══════════════════════════════════════════════════════════════════════════
// E.1 - ANTRAGSTELLUNG ERZEUGUNGSANLAGE
// ═══════════════════════════════════════════════════════════════════════════

export function generateE1(data: UnifiedInstallationData, options?: GeneratorOptions): GeneratedDocument {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 15;
  const datum = (options?.customDate || new Date()).toLocaleDateString('de-DE');

  pdf.setProperties({ title: 'E.1 Antragstellung', author: COMPANY.name });

  // Header
  drawHeader(pdf, W, M, 'E.1 Antragstellung Erzeugungsanlage', 'nach VDE-AR-N 4105');

  let y = 45;

  // Anlagenbetreiber
  y = drawSection(pdf, M, y, W - 2 * M, 'Anlagenbetreiber / Antragsteller', [
    ['Anrede/Titel', data.kunde.anrede || '-'],
    ['Vorname', data.kunde.vorname || '-'],
    ['Nachname', data.kunde.nachname || '-'],
    ['Firma', data.kunde.firma || '-'],
    ['Geburtsdatum', data.kunde.geburtsdatum || '-'],
    ['Telefon', data.kunde.telefon || '-'],
    ['E-Mail', data.kunde.email || '-'],
  ]);

  // Anlagenstandort
  y = drawSection(pdf, M, y + 5, W - 2 * M, 'Anlagenstandort', [
    ['Straße, Hausnummer', `${data.standort.strasse} ${data.standort.hausnummer}`],
    ['PLZ, Ort', `${data.standort.plz} ${data.standort.ort}`],
    ['Bundesland', data.standort.bundesland || '-'],
    ['Gemarkung / Flur / Flurstück', [data.standort.gemarkung, data.standort.flur, data.standort.flurstueck].filter(Boolean).join(' / ') || '-'],
  ]);

  // Technische Angaben
  y = drawSection(pdf, M, y + 5, W - 2 * M, 'Technische Angaben zur Erzeugungsanlage', [
    ['Anlagentyp', 'Photovoltaikanlage'],
    ['Gesamtleistung', `${data.gesamtleistungKwp.toFixed(2)} kWp`],
    ['Wechselrichterleistung', `${data.gesamtleistungKva.toFixed(1)} kVA`],
    ['Speicher vorhanden', data.speicherKapazitaetKwh > 0 ? `Ja (${data.speicherKapazitaetKwh.toFixed(1)} kWh)` : 'Nein'],
    ['Messkonzept', data.messkonzept || 'Zweirichtungszähler'],
    ['Geplantes IBN-Datum', data.geplantesIBNDatum || '-'],
  ]);

  // Netzbetreiber
  if (data.netzbetreiber) {
    y = drawSection(pdf, M, y + 5, W - 2 * M, 'Netzbetreiber', [
      ['Name', data.netzbetreiber.name || '-'],
      ['Zählernummer', data.zaehlernummer || '-'],
      ['Zählpunktbezeichnung', data.zaehlpunktbezeichnung || '-'],
    ]);
  }

  // Installateur
  y = drawSection(pdf, M, y + 5, W - 2 * M, 'Installationsunternehmen', [
    ['Firma', COMPANY.name],
    ['Adresse', `${COMPANY.strasse}, ${COMPANY.plz} ${COMPANY.ort}`],
    ['Installateurausweis', COMPANY.installateurNr || '-'],
  ]);

  // Unterschriften
  drawSignatureArea(pdf, M, H - 55, W - 2 * M, datum, data.kunde.nachname);

  // Footer
  drawFooter(pdf, W, H, M);

  return {
    typ: 'vde_e1',
    kategorie: 'VDE_E1',
    name: 'E.1 Antragstellung',
    filename: `E1_Antragstellung_${data.kunde.nachname?.replace(/\s+/g, '_') || 'Anlage'}_${datum.replace(/\./g, '-')}.pdf`,
    blob: pdf.output('blob'),
    mimeType: 'application/pdf',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// E.2 - DATENBLATT ERZEUGUNGSANLAGE
// ═══════════════════════════════════════════════════════════════════════════

export function generateE2(data: UnifiedInstallationData, options?: GeneratorOptions): GeneratedDocument {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 15;
  const datum = (options?.customDate || new Date()).toLocaleDateString('de-DE');

  pdf.setProperties({ title: 'E.2 Datenblatt Erzeugungsanlage', author: COMPANY.name });

  // Header
  drawHeader(pdf, W, M, 'E.2 Datenblatt Erzeugungsanlage', 'nach VDE-AR-N 4105');

  let y = 45;

  // Anlagenübersicht
  y = drawSection(pdf, M, y, W - 2 * M, 'Anlagenübersicht', [
    ['Betreiber', `${data.kunde.vorname} ${data.kunde.nachname}`.trim()],
    ['Standort', `${data.standort.strasse} ${data.standort.hausnummer}, ${data.standort.plz} ${data.standort.ort}`],
    ['Gesamtleistung PV', `${data.gesamtleistungKwp.toFixed(2)} kWp`],
    ['Gesamtleistung WR', `${data.gesamtleistungKva.toFixed(1)} kVA`],
  ]);

  // PV-Module
  if (data.pvModule.length > 0) {
    const moduleRows: [string, string][] = [];
    data.pvModule.forEach((m, i) => {
      moduleRows.push([`Modulfläche ${i + 1}`, m.name || `Dachfläche ${i + 1}`]);
      moduleRows.push([`  Hersteller/Modell`, `${m.hersteller} ${m.modell}`.trim() || '-']);
      moduleRows.push([`  Anzahl × Leistung`, `${m.anzahl} × ${m.leistungWp} Wp = ${((m.anzahl * m.leistungWp) / 1000).toFixed(2)} kWp`]);
      moduleRows.push([`  Ausrichtung/Neigung`, `${m.ausrichtung || 'S'} / ${m.neigung || 30}°`]);
    });
    y = drawSection(pdf, M, y + 5, W - 2 * M, 'PV-Module', moduleRows);
  }

  // Wechselrichter
  if (data.wechselrichter.length > 0) {
    const wrRows: [string, string][] = [];
    data.wechselrichter.forEach((w, i) => {
      wrRows.push([`Wechselrichter ${i + 1}`, `${w.hersteller} ${w.modell}`.trim() || '-']);
      wrRows.push([`  Leistung × Anzahl`, `${w.leistungKva} kVA × ${w.anzahl}`]);
      if (w.zerezId) wrRows.push([`  ZEREZ-ID`, w.zerezId]);
    });
    y = drawSection(pdf, M, y + 5, W - 2 * M, 'Wechselrichter', wrRows);
  }

  // Netzanschluss
  y = drawSection(pdf, M, y + 5, W - 2 * M, 'Netzanschluss', [
    ['Netzform', '3-phasig, TN-C-S'],
    ['Nennspannung', '400/230 V'],
    ['Nennfrequenz', '50 Hz'],
    ['NA-Schutz erforderlich', data.napiErforderlich ? 'Ja (> 30 kVA)' : 'Nein'],
    ['Messkonzept', data.messkonzept || 'Zweirichtungszähler'],
  ]);

  // Unterschriften
  drawSignatureArea(pdf, M, H - 55, W - 2 * M, datum, data.kunde.nachname);

  // Footer
  drawFooter(pdf, W, H, M);

  return {
    typ: 'vde_e2',
    kategorie: 'VDE_E2',
    name: 'E.2 Datenblatt Erzeugungsanlage',
    filename: `E2_Datenblatt_${data.kunde.nachname?.replace(/\s+/g, '_') || 'Anlage'}_${datum.replace(/\./g, '-')}.pdf`,
    blob: pdf.output('blob'),
    mimeType: 'application/pdf',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// E.3 - DATENBLATT SPEICHER
// ═══════════════════════════════════════════════════════════════════════════

export function generateE3(data: UnifiedInstallationData, options?: GeneratorOptions): GeneratedDocument | null {
  // E.3 nur wenn Speicher vorhanden
  if (data.speicher.length === 0 && data.speicherKapazitaetKwh <= 0) {
    return null;
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 15;
  const datum = (options?.customDate || new Date()).toLocaleDateString('de-DE');

  pdf.setProperties({ title: 'E.3 Datenblatt Speicher', author: COMPANY.name });

  // Header
  drawHeader(pdf, W, M, 'E.3 Datenblatt Speicher', 'nach VDE-AR-N 4105');

  let y = 45;

  // Anlagenübersicht
  y = drawSection(pdf, M, y, W - 2 * M, 'Anlagenübersicht', [
    ['Betreiber', `${data.kunde.vorname} ${data.kunde.nachname}`.trim()],
    ['Standort', `${data.standort.strasse} ${data.standort.hausnummer}, ${data.standort.plz} ${data.standort.ort}`],
    ['Speicher-Gesamtkapazität', `${data.speicherKapazitaetKwh.toFixed(1)} kWh`],
  ]);

  // Speicherdetails
  if (data.speicher.length > 0) {
    const speicherRows: [string, string][] = [];
    data.speicher.forEach((s, i) => {
      speicherRows.push([`Speicher ${i + 1}`, `${s.hersteller} ${s.modell}`.trim() || '-']);
      speicherRows.push([`  Kapazität × Anzahl`, `${s.kapazitaetKwh} kWh × ${s.anzahl}`]);
      speicherRows.push([`  Kopplung`, s.kopplung === 'ac' ? 'AC-gekoppelt' : 'DC-gekoppelt']);
      if (s.leistungKw) speicherRows.push([`  Leistung`, `${s.leistungKw} kW`]);
      if (s.zerezId) speicherRows.push([`  ZEREZ-ID`, s.zerezId]);
    });
    y = drawSection(pdf, M, y + 5, W - 2 * M, 'Speichereinheiten', speicherRows);
  }

  // Technische Daten
  y = drawSection(pdf, M, y + 5, W - 2 * M, 'Technische Daten', [
    ['Speichertechnologie', 'Lithium-Ionen'],
    ['Betriebsmodus', 'Eigenverbrauchsoptimierung'],
    ['Notstromfähig', 'Je nach Konfiguration'],
    ['Integrierter Wechselrichter', data.speicher[0]?.kopplung === 'ac' ? 'Ja' : 'Nein'],
  ]);

  // Unterschriften
  drawSignatureArea(pdf, M, H - 55, W - 2 * M, datum, data.kunde.nachname);

  // Footer
  drawFooter(pdf, W, H, M);

  return {
    typ: 'vde_e3',
    kategorie: 'VDE_E3',
    name: 'E.3 Datenblatt Speicher',
    filename: `E3_Speicher_${data.kunde.nachname?.replace(/\s+/g, '_') || 'Anlage'}_${datum.replace(/\./g, '-')}.pdf`,
    blob: pdf.output('blob'),
    mimeType: 'application/pdf',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// E.8 - INBETRIEBNAHMEPROTOKOLL
// ═══════════════════════════════════════════════════════════════════════════

export function generateE8(data: UnifiedInstallationData, options?: GeneratorOptions): GeneratedDocument {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 15;
  const datum = (options?.customDate || new Date()).toLocaleDateString('de-DE');
  const ibnDatum = data.geplantesIBNDatum || datum;

  pdf.setProperties({ title: 'E.8 Inbetriebnahmeprotokoll', author: COMPANY.name });

  // Header
  drawHeader(pdf, W, M, 'E.8 Inbetriebnahmeprotokoll', 'nach VDE-AR-N 4105');

  let y = 45;

  // Anlagendaten
  y = drawSection(pdf, M, y, W - 2 * M, 'Anlagendaten', [
    ['Betreiber', `${data.kunde.vorname} ${data.kunde.nachname}`.trim()],
    ['Standort', `${data.standort.strasse} ${data.standort.hausnummer}, ${data.standort.plz} ${data.standort.ort}`],
    ['Anlagenleistung', `${data.gesamtleistungKwp.toFixed(2)} kWp / ${data.gesamtleistungKva.toFixed(1)} kVA`],
    ['Zählernummer', data.zaehlernummer || '-'],
    ['Netzbetreiber', data.netzbetreiber?.name || '-'],
  ]);

  // Prüfungen
  y = drawSection(pdf, M, y + 5, W - 2 * M, 'Durchgeführte Prüfungen', [
    ['Sichtprüfung', '☑ durchgeführt'],
    ['Funktionsprüfung Wechselrichter', '☑ durchgeführt'],
    ['Isolationsmessung', '☑ durchgeführt'],
    ['Erdungsmessung', '☑ durchgeführt'],
    ['Inbetriebnahme NA-Schutz', data.napiErforderlich ? '☑ durchgeführt' : '☐ nicht erforderlich'],
    ['Einspeisetest', '☑ durchgeführt'],
  ]);

  // Messwerte
  y = drawSection(pdf, M, y + 5, W - 2 * M, 'Messwerte bei Inbetriebnahme', [
    ['DC-Spannung String 1', '- V'],
    ['DC-Strom String 1', '- A'],
    ['AC-Spannung L1-N', '230 V'],
    ['Isolationswiderstand', '> 1 MΩ'],
    ['Erdungswiderstand', '< 2 Ω'],
  ]);

  // Inbetriebnahme
  y = drawSection(pdf, M, y + 5, W - 2 * M, 'Inbetriebnahme', [
    ['Datum der Inbetriebnahme', ibnDatum],
    ['Installationsunternehmen', COMPANY.name],
    ['Installateurausweis-Nr.', COMPANY.installateurNr || '-'],
  ]);

  // Erklärung
  y += 10;
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.textLight);
  pdf.text(
    'Hiermit wird bestätigt, dass die oben genannte Erzeugungsanlage gemäß den geltenden\nVorschriften (VDE-AR-N 4105, TAR) installiert und in Betrieb genommen wurde.',
    M,
    y,
    { maxWidth: W - 2 * M }
  );

  // Unterschriften
  drawSignatureArea(pdf, M, H - 55, W - 2 * M, datum, data.kunde.nachname);

  // Footer
  drawFooter(pdf, W, H, M);

  return {
    typ: 'vde_e8',
    kategorie: 'VDE_E8',
    name: 'E.8 Inbetriebnahmeprotokoll',
    filename: `E8_IBN-Protokoll_${data.kunde.nachname?.replace(/\s+/g, '_') || 'Anlage'}_${datum.replace(/\./g, '-')}.pdf`,
    blob: pdf.output('blob'),
    mimeType: 'application/pdf',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function drawHeader(pdf: jsPDF, W: number, M: number, title: string, subtitle: string): void {
  // Header-Hintergrund
  pdf.setFillColor(COLORS.header);
  pdf.rect(0, 0, W, 35, 'F');

  // Baunity Logo/Name
  pdf.setFillColor(COLORS.primary);
  pdf.rect(W - 50, 5, 40, 12, 'F');
  pdf.setTextColor(COLORS.white);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(COMPANY.name, W - 30, 13, { align: 'center' });

  // Titel
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.white);
  pdf.text(title, M, 15);

  // Untertitel
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor('#94a3b8');
  pdf.text(subtitle, M, 25);
}

function drawSection(pdf: jsPDF, x: number, y: number, w: number, title: string, rows: [string, string][]): number {
  const rowHeight = 7;
  const headerHeight = 8;
  const totalHeight = headerHeight + rows.length * rowHeight + 4;

  // Section-Hintergrund
  pdf.setFillColor(COLORS.bg);
  pdf.setDrawColor(COLORS.border);
  pdf.roundedRect(x, y, w, totalHeight, 2, 2, 'FD');

  // Section-Header
  pdf.setFillColor(COLORS.primary);
  pdf.roundedRect(x, y, w, headerHeight, 2, 2, 'F');
  pdf.rect(x, y + headerHeight - 2, w, 2, 'F'); // Untere Ecken füllen

  pdf.setTextColor(COLORS.white);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, x + 5, y + 5.5);

  // Rows
  let rowY = y + headerHeight + 5;
  rows.forEach(([label, value]) => {
    pdf.setTextColor(COLORS.textLight);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label, x + 5, rowY);

    pdf.setTextColor(COLORS.text);
    pdf.setFont('helvetica', 'bold');
    pdf.text(value || '-', x + w - 5, rowY, { align: 'right' });

    rowY += rowHeight;
  });

  return y + totalHeight;
}

function drawSignatureArea(pdf: jsPDF, x: number, y: number, w: number, datum: string, kundenname: string): void {
  const halfW = (w - 20) / 2;

  pdf.setDrawColor(COLORS.border);
  pdf.setLineWidth(0.3);

  // Linke Unterschrift (Betreiber)
  pdf.line(x, y + 20, x + halfW, y + 20);
  pdf.setTextColor(COLORS.textLight);
  pdf.setFontSize(7);
  pdf.text('Ort, Datum', x, y + 25);
  pdf.text('Unterschrift Anlagenbetreiber', x, y + 30);

  // Rechte Unterschrift (Installateur)
  pdf.line(x + halfW + 20, y + 20, x + w, y + 20);
  pdf.text('Ort, Datum', x + halfW + 20, y + 25);
  pdf.text('Unterschrift Installateur', x + halfW + 20, y + 30);

  // Datum vorausgefüllt
  pdf.setTextColor(COLORS.text);
  pdf.setFontSize(8);
  pdf.text(datum, x + 5, y + 17);
  pdf.text(datum, x + halfW + 25, y + 17);
}

function drawFooter(pdf: jsPDF, W: number, H: number, M: number): void {
  pdf.setDrawColor(COLORS.border);
  pdf.setLineWidth(0.3);
  pdf.line(M, H - 15, W - M, H - 15);

  pdf.setTextColor(COLORS.textLight);
  pdf.setFontSize(7);
  pdf.text(`${COMPANY.name} | ${COMPANY.strasse} | ${COMPANY.plz} ${COMPANY.ort}`, W / 2, H - 10, { align: 'center' });
  pdf.text(`Tel: ${COMPANY.telefon} | E-Mail: ${COMPANY.email}`, W / 2, H - 6, { align: 'center' });
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE: Alle VDE-Formulare generieren
// ═══════════════════════════════════════════════════════════════════════════

export function generateAllVDEFormulare(
  data: UnifiedInstallationData,
  options?: GeneratorOptions
): GeneratedDocument[] {
  const docs: GeneratedDocument[] = [];

  docs.push(generateE1(data, options));
  docs.push(generateE2(data, options));

  const e3 = generateE3(data, options);
  if (e3) docs.push(e3);

  docs.push(generateE8(data, options));

  return docs;
}
