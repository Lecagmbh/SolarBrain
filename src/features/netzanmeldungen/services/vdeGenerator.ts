/**
 * NETZANMELDUNGEN VDE-AR-N 4105 PDF Generator
 * ============================================
 * Generiert VDE-Formulare als PDF aus InstallationDetail-Daten
 * Basiert auf dem Wizard PDF-Generator mit Anpassungen für Netzanmeldungen
 * 
 * Formulare:
 * - E.1 Antragstellung
 * - E.2 Datenblatt Erzeugungsanlage
 * - E.3 Datenblatt Speicher
 * - E.8 Inbetriebsetzungsprotokoll
 */

import { jsPDF } from 'jspdf';
import type { InstallationDetail } from '../types';
import { COMPANY, INSTALLER_REGISTRATIONS } from '../../../config/company';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type VDEFormularTyp = 'E1' | 'E2' | 'E3' | 'E8';

export interface GeneratedPDF {
  typ: VDEFormularTyp;
  name: string;
  blob: Blob;
  filename: string;
}

export interface GeneratorOptionen {
  /** Admin-Modus: Zeigt sensible Daten wie Installateurausweis */
  isAdmin?: boolean;
}

// Firmendaten aus zentraler Config
const FIRMA = {
  name: COMPANY.name,
  strasse: COMPANY.strasse,
  hausnummer: COMPANY.hausnummer,
  plz: COMPANY.plz,
  ort: COMPANY.ort,
  telefon: COMPANY.telefon,
  email: COMPANY.email,
};

// Default Installer-Eintragung
const DEFAULT_EINTRAGUNG = {
  nummer: INSTALLER_REGISTRATIONS['DEFAULT']?.nr || '',
  netzbetreiber: INSTALLER_REGISTRATIONS['DEFAULT']?.netzbetreiber || '',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const formatDatum = (date?: Date | string) => {
  const d = date ? new Date(date) : new Date();
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

const feld = (value: unknown, fallback = '') => 
  value !== undefined && value !== null && value !== '' ? String(value) : fallback;

const feldNum = (value: number | string | undefined | null, dezimalen = 2): string => {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toFixed(dezimalen);
};

function getInstallateurNr(isAdmin?: boolean): string {
  if (!isAdmin) return '';
  return DEFAULT_EINTRAGUNG.nummer;
}

function getEingetragenerNetzbetreiber(isAdmin?: boolean): string {
  if (!isAdmin) return '';
  return DEFAULT_EINTRAGUNG.netzbetreiber;
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF HELPERS
// ═══════════════════════════════════════════════════════════════════════════

interface PDFContext {
  pdf: jsPDF;
  M: number;  // Margin
  W: number;  // Width
  H: number;  // Height
}

function createPDF(): PDFContext {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  return { pdf, M: 20, W: 210, H: 297 };
}

function drawHeader(ctx: PDFContext, formNr: string, title: string): number {
  const { pdf, M, W } = ctx;
  
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.line(M, 15, W - M, 15);
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('VDE-AR-N 4105', M, 12);
  pdf.text(formNr, W - M, 12, { align: 'right' });
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(title, M, 25);
  
  return 32;
}

function drawSubtitle(ctx: PDFContext, y: number, text: string): number {
  const { pdf, M } = ctx;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(80, 80, 80);
  pdf.text(text, M, y);
  pdf.setTextColor(0, 0, 0);
  return y + 6;
}

function drawSectionLabel(ctx: PDFContext, y: number, label: string): number {
  const { pdf, M } = ctx;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(label, M, y);
  return y + 5;
}

function drawFieldRow(ctx: PDFContext, y: number, label: string, value: string, labelWidth = 55): number {
  const { pdf, M, W } = ctx;
  const valueX = M + labelWidth;
  const lineEnd = W - M;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text(label, M, y);
  
  pdf.text(value || '', valueX, y);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.2);
  pdf.line(valueX, y + 1, lineEnd, y + 1);
  
  return y + 7;
}

function drawCheckbox(ctx: PDFContext, x: number, y: number, checked: boolean, label: string): void {
  const { pdf } = ctx;
  
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.rect(x, y - 3, 3.5, 3.5);
  
  if (checked) {
    pdf.setLineWidth(0.5);
    pdf.line(x + 0.5, y - 2.5, x + 3, y + 0.2);
    pdf.line(x + 0.5, y + 0.2, x + 3, y - 2.5);
  }
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(label, x + 5, y);
}

function drawCheckboxRow(ctx: PDFContext, y: number, checked: boolean, label: string): number {
  drawCheckbox(ctx, ctx.M + 3, y, checked, label);
  return y + 6;
}

function drawSignatureArea(ctx: PDFContext, y: number, rightLabel = 'Unterschrift'): number {
  const { pdf, M, W } = ctx;
  
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.line(M, y + 12, M + 60, y + 12);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Ort, Datum', M, y + 17);
  
  pdf.line(W - M - 60, y + 12, W - M, y + 12);
  pdf.text(rightLabel, W - M - 60, y + 17);
  
  return y + 25;
}

function drawFooter(ctx: PDFContext): void {
  const { pdf, M, H } = ctx;
  
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    'Dieses Formular ist zur Vervielfältigung durch den Anwender dieser VDE-Anwendungsregel bestimmt.',
    M, H - 12
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// E.1 ANTRAGSTELLUNG
// ═══════════════════════════════════════════════════════════════════════════

function generateE1PDF(data: InstallationDetail, optionen?: GeneratorOptionen): GeneratedPDF {
  const ctx = createPDF();
  const { pdf, M } = ctx;
  const { customer, technicalData } = data;
  const { isAdmin } = optionen || {};
  
  const kundenVorname = feld(customer?.vorname);
  const kundenNachname = feld(customer?.nachname, data.customerName);
  const kundenname = `${kundenVorname} ${kundenNachname}`.trim();
  const installateurNr = getInstallateurNr(isAdmin);
  const eingetragenerNB = getEingetragenerNetzbetreiber(isAdmin);
  
  const hatSpeicher = (technicalData?.storage?.length || 0) > 0;
  const pvKwp = data.totalKwp || technicalData?.totalPvKwPeak || 0;
  const pvKva = technicalData?.inverters?.reduce((sum, w) => sum + (w.powerKw || 0) * (w.count || 1), 0) || pvKwp;
  const speicherKwh = technicalData?.storage?.reduce((s, sp) => s + (sp.capacityKwh || 0) * (sp.count || 1), 0) || 0;
  
  pdf.setProperties({ title: 'E.1 Antragstellung', author: FIRMA.name });
  
  let y = drawHeader(ctx, 'E.1', 'Antragstellung für Erzeugungsanlagen am Niederspannungsnetz');
  y = drawSubtitle(ctx, y, 'vom Anschlussnehmer auszufüllen');
  
  // Anlagenanschrift
  y = drawSectionLabel(ctx, y + 3, 'Anlagenanschrift');
  y = drawFieldRow(ctx, y, 'Vorname, Name', kundenname);
  y = drawFieldRow(ctx, y, 'Straße, Hausnummer', `${feld(data.strasse)} ${feld(data.hausNr)}`);
  y = drawFieldRow(ctx, y, 'PLZ, Ort', `${feld(data.plz)} ${feld(data.ort)}`);
  y = drawFieldRow(ctx, y, 'Telefon, E-Mail', `${feld(customer?.telefon)} / ${feld(customer?.email)}`);
  
  // Anschlussnehmer (Eigentümer)
  y = drawSectionLabel(ctx, y + 3, 'Anschlussnehmer (Eigentümer)');
  y = drawFieldRow(ctx, y, 'Vorname, Name', kundenname);
  y = drawFieldRow(ctx, y, 'Straße, Hausnummer', `${feld(data.strasse)} ${feld(data.hausNr)}`);
  y = drawFieldRow(ctx, y, 'PLZ, Ort', `${feld(data.plz)} ${feld(data.ort)}`);
  
  // Anlagenbetreiber
  y = drawSectionLabel(ctx, y + 3, 'Anlagenbetreiber');
  y = drawFieldRow(ctx, y, 'Vorname, Name', kundenname);
  y = drawFieldRow(ctx, y, 'Straße, Hausnummer', `${feld(data.strasse)} ${feld(data.hausNr)}`);
  y = drawFieldRow(ctx, y, 'PLZ, Ort', `${feld(data.plz)} ${feld(data.ort)}`);
  
  // Anlagenerrichter
  y = drawSectionLabel(ctx, y + 3, 'Anlagenerrichter (Elektrofachbetrieb)');
  y = drawFieldRow(ctx, y, 'Firma, Ort', `${FIRMA.name}, ${FIRMA.ort}`);
  y = drawFieldRow(ctx, y, 'Eintragungsnummer', installateurNr ? `${installateurNr} bei ${eingetragenerNB}` : '');
  
  // Anlagenart
  y = drawSectionLabel(ctx, y + 3, 'Anlagenart');
  drawCheckbox(ctx, M + 3, y, true, 'Neuerrichtung');
  drawCheckbox(ctx, M + 50, y, false, 'Erweiterung');
  drawCheckbox(ctx, M + 100, y, false, 'Rückbau');
  y += 8;
  
  // Beigefügte Unterlagen
  y = drawSectionLabel(ctx, y + 2, 'Beigefügte Unterlagen');
  y = drawCheckboxRow(ctx, y, true, 'Anmeldevordruck „Anmeldung zum Netzanschluss" beigefügt');
  y = drawCheckboxRow(ctx, y, true, 'Lageplan mit Bezeichnung und Grenzen des Grundstücks beigefügt');
  y = drawCheckboxRow(ctx, y, true, 'Datenblatt für die Erzeugungsanlage beigefügt (siehe Vordruck E.2)');
  if (hatSpeicher) {
    y = drawCheckboxRow(ctx, y, true, 'Datenblatt für Speicher beigefügt (siehe Vordruck E.3)');
  }
  y = drawCheckboxRow(ctx, y, true, 'Einheitenzertifikate nach VDE-AR-N 4105 liegen vor');
  y = drawCheckboxRow(ctx, y, true, 'Zertifikat für den NA-Schutz beigefügt (siehe Vordruck E.6)');
  y = drawCheckboxRow(ctx, y, true, 'Übersichtsschaltplan (einpolig) ab Netzanschluss beigefügt');
  
  // Geplanter IBN-Termin
  y = drawSectionLabel(ctx, y + 3, 'Geplanter Inbetriebsetzungstermin');
  y = drawFieldRow(ctx, y, '', feld(data.geplantesIBNDatum ? formatDatum(data.geplantesIBNDatum) : ''));
  
  y = drawSignatureArea(ctx, y + 5, 'Unterschrift des Anschlussnehmers');
  drawFooter(ctx);
  
  const blob = pdf.output('blob');
  const datum = formatDatum().replace(/\./g, '-');
  
  return {
    typ: 'E1',
    name: 'E.1 Antragstellung',
    blob,
    filename: `E1_Antragstellung_${kundenNachname.replace(/\s+/g, '_') || 'VDE'}_${datum}.pdf`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// E.2 DATENBLATT FÜR ERZEUGUNGSANLAGEN
// ═══════════════════════════════════════════════════════════════════════════

function generateE2PDF(data: InstallationDetail, optionen?: GeneratorOptionen): GeneratedPDF {
  const ctx = createPDF();
  const { pdf, M, W } = ctx;
  const { customer, technicalData } = data;
  
  const kundenVorname = feld(customer?.vorname);
  const kundenNachname = feld(customer?.nachname, data.customerName);
  const kundenname = `${kundenVorname} ${kundenNachname}`.trim();
  
  const pvKwp = data.totalKwp || technicalData?.totalPvKwPeak || 0;
  const inverters = technicalData?.inverters || [];
  const pvModules = technicalData?.pvModules || [];
  
  const pvKva = inverters.reduce((sum, w) => sum + (w.powerKw || 0) * (w.count || 1), 0) || pvKwp;
  const pvKw = pvKva || pvKwp;
  
  const ersterWR = inverters[0];
  const gesamtWR = inverters.reduce((s, w) => s + (w.count || 1), 0) || 1;
  
  const istDreiphasig = pvKva > 4.6;
  
  pdf.setProperties({ title: 'E.2 Datenblatt Erzeugungsanlagen', author: FIRMA.name });
  
  let y = drawHeader(ctx, 'E.2', 'Datenblatt – Erzeugungsanlagen am Niederspannungsnetz');
  y = drawSubtitle(ctx, y, 'vom Anschlussnehmer auszufüllen, für jede Erzeugungseinheit ein Datenblatt');
  
  // Anlagenanschrift
  y = drawSectionLabel(ctx, y + 3, 'Anlagenanschrift');
  y = drawFieldRow(ctx, y, 'Vorname, Name', kundenname);
  y = drawFieldRow(ctx, y, 'Straße, Hausnummer', `${feld(data.strasse)} ${feld(data.hausNr)}`);
  y = drawFieldRow(ctx, y, 'PLZ, Ort', `${feld(data.plz)} ${feld(data.ort)}`);
  
  // Energieart
  y = drawSectionLabel(ctx, y + 3, 'Energieart');
  drawCheckbox(ctx, M + 3, y, true, 'Sonne');
  drawCheckbox(ctx, M + 35, y, false, 'Wind');
  drawCheckbox(ctx, M + 65, y, false, 'Wasser');
  drawCheckbox(ctx, M + 100, y, false, 'BHKW');
  y += 8;
  
  // Erzeugungseinheiten (Wechselrichter)
  y = drawSectionLabel(ctx, y + 2, 'Erzeugungseinheiten (bei PV: Wechselrichter)');
  y = drawFieldRow(ctx, y, 'Hersteller', feld(ersterWR?.manufacturer));
  y = drawFieldRow(ctx, y, 'Typ', feld(ersterWR?.model));
  y = drawFieldRow(ctx, y, 'Anzahl baugleicher Einheiten', String(gesamtWR));
  
  // Erzeugungsanlage Leistungsdaten
  y = drawSectionLabel(ctx, y + 3, 'Erzeugungsanlage');
  y = drawFieldRow(ctx, y, 'max. Wirkleistung PAmax', `${feldNum(pvKw)} kW`);
  y = drawFieldRow(ctx, y, 'max. Scheinleistung SAmax', `${feldNum(pvKva)} kVA`);
  y = drawFieldRow(ctx, y, 'Modulleistung Pinst', `${feldNum(pvKwp)} kWp`);
  
  // Netzeinspeisung
  y = drawSectionLabel(ctx, y + 3, 'Netzeinspeisung');
  drawCheckbox(ctx, M + 3, y, !istDreiphasig, '1-phasig');
  drawCheckbox(ctx, M + 35, y, false, '2-phasig');
  drawCheckbox(ctx, M + 65, y, istDreiphasig, '3-phasig');
  y += 8;
  
  // Betriebsweise
  y = drawSectionLabel(ctx, y + 2, 'Betriebsweise');
  pdf.setFontSize(9);
  pdf.text('Inselbetrieb vorgesehen?', M, y);
  drawCheckbox(ctx, M + 70, y, false, 'ja');
  drawCheckbox(ctx, M + 90, y, true, 'nein');
  y += 6;
  
  pdf.text('Überschusseinspeisung?', M, y);
  drawCheckbox(ctx, M + 70, y, true, 'ja');
  drawCheckbox(ctx, M + 90, y, false, 'nein');
  y += 6;
  
  pdf.text('Volleinspeisung?', M, y);
  drawCheckbox(ctx, M + 70, y, false, 'ja');
  drawCheckbox(ctx, M + 90, y, true, 'nein');
  y += 10;
  
  // Bemerkungen
  y = drawSectionLabel(ctx, y, 'Bemerkungen');
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(M, y, W - 2*M, 15);
  
  drawFooter(ctx);
  
  const blob = pdf.output('blob');
  const datum = formatDatum().replace(/\./g, '-');
  
  return {
    typ: 'E2',
    name: 'E.2 Datenblatt Erzeugungsanlagen',
    blob,
    filename: `E2_Datenblatt_${kundenNachname.replace(/\s+/g, '_') || 'VDE'}_${datum}.pdf`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// E.3 DATENBLATT FÜR SPEICHER
// ═══════════════════════════════════════════════════════════════════════════

function generateE3PDF(data: InstallationDetail, optionen?: GeneratorOptionen): GeneratedPDF | null {
  const { customer, technicalData } = data;
  const { isAdmin } = optionen || {};
  
  const storage = technicalData?.storage || [];
  if (storage.length === 0) return null;
  
  const speicher = storage[0];
  const ctx = createPDF();
  const { pdf, M } = ctx;
  
  const kundenVorname = feld(customer?.vorname);
  const kundenNachname = feld(customer?.nachname, data.customerName);
  const kundenname = `${kundenVorname} ${kundenNachname}`.trim();
  const installateurNr = getInstallateurNr(isAdmin);
  const eingetragenerNB = getEingetragenerNetzbetreiber(isAdmin);
  
  const gesamtKwh = storage.reduce((s, sp) => s + (sp.capacityKwh || 0) * (sp.count || 1), 0);
  const gesamtKw = storage.reduce((s, sp) => s + (sp.powerKw || 0) * (sp.count || 1), 0);
  const gesamtAnzahl = storage.reduce((s, sp) => s + (sp.count || 1), 0);
  
  pdf.setProperties({ title: 'E.3 Datenblatt Speicher', author: FIRMA.name });
  
  let y = drawHeader(ctx, 'E.3', 'Datenblatt für Speicher');
  y = drawSubtitle(ctx, y, 'vom Errichter (eingetragener Elektrofachbetrieb) auszufüllen');
  
  // Anlagenanschrift
  y = drawSectionLabel(ctx, y + 3, 'Anlagenanschrift');
  y = drawFieldRow(ctx, y, 'Vorname, Name', kundenname);
  y = drawFieldRow(ctx, y, 'Straße, Hausnummer', `${feld(data.strasse)} ${feld(data.hausNr)}`);
  y = drawFieldRow(ctx, y, 'PLZ, Ort', `${feld(data.plz)} ${feld(data.ort)}`);
  
  // Errichter
  y = drawSectionLabel(ctx, y + 3, 'Errichter (eingetragener Elektrofachbetrieb)');
  y = drawFieldRow(ctx, y, 'Firma, Ort', `${FIRMA.name}, ${FIRMA.ort}`);
  y = drawFieldRow(ctx, y, 'Straße', `${FIRMA.strasse} ${FIRMA.hausnummer}`);
  y = drawFieldRow(ctx, y, 'Telefon, E-Mail', `${FIRMA.telefon} / ${FIRMA.email}`);
  
  // Speichersystem
  y = drawSectionLabel(ctx, y + 3, 'Speichersystem');
  y = drawFieldRow(ctx, y, 'Hersteller, Typ', `${feld(speicher.manufacturer)} ${feld(speicher.model)}`);
  y = drawFieldRow(ctx, y, 'Anzahl', String(gesamtAnzahl));
  y = drawFieldRow(ctx, y, 'Batterietechnologie', 'Lithium-Ionen');
  
  // Anschluss
  y = drawSectionLabel(ctx, y + 3, 'Anschluss des Speichersystems');
  drawCheckbox(ctx, M + 3, y, true, 'AC-gekoppelt');
  drawCheckbox(ctx, M + 50, y, false, 'DC-gekoppelt');
  y += 6;
  
  drawCheckbox(ctx, M + 3, y, false, 'L1');
  drawCheckbox(ctx, M + 25, y, false, 'L2');
  drawCheckbox(ctx, M + 45, y, false, 'L3');
  drawCheckbox(ctx, M + 70, y, true, 'Drehstrom');
  y += 8;
  
  // Technische Daten
  y = drawFieldRow(ctx, y, 'Nutzbare Speicherkapazität', `${feldNum(gesamtKwh, 1)} kWh`);
  y = drawFieldRow(ctx, y, 'Max. Lade-/Entladeleistung', `${feldNum(gesamtKw)} kW`);
  
  y = drawCheckboxRow(ctx, y + 2, true, 'Allpolige Trennung vom öffentlichen Netz bei Netzersatzbetrieb');
  y = drawCheckboxRow(ctx, y, true, 'NA-Schutz nach VDE-AR-N 4105 vorhanden');
  
  // Einspeisemanagement
  y = drawSectionLabel(ctx, y + 3, 'Einspeisemanagement');
  y = drawCheckboxRow(ctx, y, true, 'ferngesteuert');
  y = drawCheckboxRow(ctx, y, true, 'dauerhaft auf 70 % begrenzt');
  
  // Nachweis Errichter
  y = drawSectionLabel(ctx, y + 3, 'Nachweis Errichter');
  y = drawFieldRow(ctx, y, 'Ausweis-Nr.', installateurNr);
  y = drawFieldRow(ctx, y, 'bei Netzbetreiber', eingetragenerNB);
  
  pdf.setFontSize(8);
  pdf.text('Der Errichter bestätigt mit seiner Unterschrift die Richtigkeit der Angaben.', M, y + 5);
  
  y = drawSignatureArea(ctx, y + 10, 'Errichter');
  drawFooter(ctx);
  
  const blob = pdf.output('blob');
  const datum = formatDatum().replace(/\./g, '-');
  
  return {
    typ: 'E3',
    name: 'E.3 Datenblatt Speicher',
    blob,
    filename: `E3_Speicher_${kundenNachname.replace(/\s+/g, '_') || 'VDE'}_${datum}.pdf`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// E.8 INBETRIEBSETZUNGSPROTOKOLL
// ═══════════════════════════════════════════════════════════════════════════

function generateE8PDF(data: InstallationDetail, optionen?: GeneratorOptionen): GeneratedPDF {
  const ctx = createPDF();
  const { pdf, M, W } = ctx;
  const { customer, technicalData } = data;
  
  const kundenVorname = feld(customer?.vorname);
  const kundenNachname = feld(customer?.nachname, data.customerName);
  const kundenname = `${kundenVorname} ${kundenNachname}`.trim();
  
  const pvKwp = data.totalKwp || technicalData?.totalPvKwPeak || 0;
  const pvKva = technicalData?.inverters?.reduce((sum, w) => sum + (w.powerKw || 0) * (w.count || 1), 0) || pvKwp;
  
  const hatSpeicher = (technicalData?.storage?.length || 0) > 0;
  const istDreiphasig = pvKva > 4.6;
  
  pdf.setProperties({ title: 'E.8 Inbetriebsetzungsprotokoll', author: FIRMA.name });
  
  let y = drawHeader(ctx, 'E.8', 'Inbetriebsetzungsprotokoll');
  y = drawSubtitle(ctx, y, 'Erzeugungsanlagen/Speicher Niederspannung - vom Anlagenerrichter auszufüllen');
  
  // Anlagenanschrift
  y = drawSectionLabel(ctx, y + 3, 'Anlagenanschrift');
  y = drawFieldRow(ctx, y, 'Vorname, Name', kundenname);
  y = drawFieldRow(ctx, y, 'Straße, Hausnummer', `${feld(data.strasse)} ${feld(data.hausNr)}`);
  y = drawFieldRow(ctx, y, 'PLZ, Ort', `${feld(data.plz)} ${feld(data.ort)}`);
  
  // Anlagenerrichter
  y = drawSectionLabel(ctx, y + 3, 'Anlagenerrichter');
  y = drawFieldRow(ctx, y, 'Firma, Ort', `${FIRMA.name}, ${FIRMA.ort}`);
  y = drawFieldRow(ctx, y, 'Telefon, E-Mail', `${FIRMA.telefon} / ${FIRMA.email}`);
  
  // Leistungsdaten
  y = drawSectionLabel(ctx, y + 3, 'Leistungsdaten');
  y = drawFieldRow(ctx, y, 'max. Scheinleistung SAmax', `${feldNum(pvKva)} kVA`);
  y = drawFieldRow(ctx, y, 'max. Wirkleistung PAmax', `${feldNum(pvKwp)} kW`);
  y = drawFieldRow(ctx, y, 'Modulleistung PAgen (PV)', `${feldNum(pvKwp)} kWp`);
  
  // Prüfungen
  y = drawSectionLabel(ctx, y + 3, 'Prüfungen und Nachweise');
  y = drawCheckboxRow(ctx, y, true, `Übereinstimmung Datenblatt E.2 ${hatSpeicher ? 'und/oder E.3 ' : ''}mit Anlagenaufbau?`);
  y = drawCheckboxRow(ctx, y, true, 'Abrechnungsmessung: IBN-Prüfung erfolgt?');
  y = drawCheckboxRow(ctx, y, true, `Einheitenzertifikat ${hatSpeicher ? 'für Erzeuger/Speicher ' : ''}vorhanden?`);
  y = drawCheckboxRow(ctx, y, true, 'Zertifikat für NA-Schutz vorhanden?');
  
  // NA-Schutz
  y = drawSectionLabel(ctx, y + 3, 'NA-Schutz Einstellungen');
  y = drawFieldRow(ctx, y, 'Integrierter NA-Schutz: U>', '253,0 V');
  
  // Einspeisemanagement
  y = drawSectionLabel(ctx, y + 3, 'Technische Einrichtung zur Reduzierung der Einspeiseleistung');
  y = drawCheckboxRow(ctx, y, true, 'Drosselung auf 70 % eingestellt');
  y = drawCheckboxRow(ctx, y, true, 'Ferngesteuerte Leistungsreduzierung vorhanden');
  
  if (hatSpeicher) {
    y = drawCheckboxRow(ctx, y, true, 'Energieflussrichtungssensor – Funktionstest bestanden');
  }
  
  // Symmetrie
  y = drawSectionLabel(ctx, y + 3, 'Symmetriebedingung');
  y = drawCheckboxRow(ctx, y, istDreiphasig, 'durch Drehstrom-Umrichter');
  y = drawCheckboxRow(ctx, y, !istDreiphasig, 'durch Aufteilung einphasiger Erzeugungseinheiten');
  
  // Blindleistung
  y = drawSectionLabel(ctx, y + 3, 'Blindleistungsbereitstellung');
  drawCheckbox(ctx, M + 3, y, true, 'Q(U)-Standard-Kennlinie');
  drawCheckbox(ctx, M + 60, y, false, 'cos φ (P)');
  y += 10;
  
  // Bestätigung
  pdf.setFillColor(245, 245, 245);
  pdf.rect(M, y, W - 2*M, 12, 'F');
  pdf.setFontSize(8);
  pdf.text('Die Erzeugungsanlage ist nach VDE-AR-N 4105, VDE-AR-N 4100 und den TAB errichtet.', M + 2, y + 5);
  pdf.text('Der Anlagenerrichter hat den Anlagenbetreiber einzuweisen und Dokumentation zu übergeben.', M + 2, y + 10);
  y += 17;
  
  // IBN Datum
  y = drawSectionLabel(ctx, y, 'Datum der Inbetriebsetzung');
  y = drawFieldRow(ctx, y, '', feld(data.geplantesIBNDatum ? formatDatum(data.geplantesIBNDatum) : ''));
  
  // Unterschriften
  pdf.setDrawColor(0, 0, 0);
  pdf.line(M, y + 10, M + 45, y + 10);
  pdf.setFontSize(7);
  pdf.text('Ort, Datum', M, y + 14);
  
  pdf.line(M + 55, y + 10, M + 100, y + 10);
  pdf.text('Unterschrift Anlagenbetreiber', M + 55, y + 14);
  
  pdf.line(M + 110, y + 10, W - M, y + 10);
  pdf.text('Unterschrift Anlagenerrichter', M + 110, y + 14);
  
  drawFooter(ctx);
  
  const blob = pdf.output('blob');
  const datum = formatDatum().replace(/\./g, '-');
  
  return {
    typ: 'E8',
    name: 'E.8 Inbetriebsetzungsprotokoll',
    blob,
    filename: `E8_IBN_Protokoll_${kundenNachname.replace(/\s+/g, '_') || 'VDE'}_${datum}.pdf`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HAUPTFUNKTIONEN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generiert alle relevanten VDE-Formulare als PDF
 */
export function generateAllVDEPDFs(data: InstallationDetail, optionen?: GeneratorOptionen): GeneratedPDF[] {
  const pdfs: GeneratedPDF[] = [];
  
  // E.1 Antragstellung - Immer
  pdfs.push(generateE1PDF(data, optionen));
  
  // E.2 Datenblatt Erzeugungsanlagen - Bei PV
  if (data.totalKwp && data.totalKwp > 0) {
    pdfs.push(generateE2PDF(data, optionen));
  }
  
  // E.3 Speicher - Nur wenn Speicher vorhanden
  const e3 = generateE3PDF(data, optionen);
  if (e3) pdfs.push(e3);
  
  // E.8 IBN-Protokoll - Immer
  pdfs.push(generateE8PDF(data, optionen));
  
  return pdfs;
}

/**
 * Generiert ein einzelnes VDE-Formular als PDF
 */
export function generateSingleVDEPDF(
  data: InstallationDetail,
  typ: VDEFormularTyp,
  optionen?: GeneratorOptionen
): GeneratedPDF | null {
  switch (typ) {
    case 'E1': return generateE1PDF(data, optionen);
    case 'E2': return generateE2PDF(data, optionen);
    case 'E3': return generateE3PDF(data, optionen);
    case 'E8': return generateE8PDF(data, optionen);
    default: return null;
  }
}

/**
 * Öffnet ein VDE-Formular zum Drucken
 * Desktop: Nativer Druckdialog, Web: Neuer Tab
 */
export async function openVDEFormularForPrint(formular: GeneratedPDF): Promise<void> {
  const isDesktop = Boolean(window.baunityDesktop?.isDesktop);

  if (isDesktop) {
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(formular.blob);
      });
      await window.baunityDesktop!.print.pdf({ base64Data: base64 });
      return;
    } catch (err) {
      console.warn('[vdeGenerator] Native print failed, falling back:', err);
    }
  }

  const url = URL.createObjectURL(formular.blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Download VDE-Formular
 * Desktop: Nativer OS-Dialog, Web: Browser-Download
 */
export async function downloadVDEFormular(formular: GeneratedPDF): Promise<void> {
  const { downloadFile } = await import('@/utils/desktopDownload');
  await downloadFile({ filename: formular.filename, blob: formular.blob, fileType: 'pdf' });
}
