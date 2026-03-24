/**
 * Baunity VDE-AR-N 4105 PREMIUM PDF Generator
 * ============================================
 * Ultra-professionelle VDE Formulare mit:
 * - Premium Design mit Gradient Header
 * - Automatische Datenübernahme aus Installation
 * - Signatur-Integration
 * - Firmenstempel
 * - QR-Code Verifikation
 *
 * @version 5.0
 * @author Baunity GmbH
 */

import { jsPDF } from 'jspdf';
import { COMPANY, INSTALLER_REGISTRATIONS, type InstallerRegistration } from '../../../../config/company';

// ═══════════════════════════════════════════════════════════════════════════
// FIRMA DATEN (aus zentraler Config)
// ═══════════════════════════════════════════════════════════════════════════

const FIRMA = {
  name: COMPANY.name,
  strasse: `${COMPANY.strasse} ${COMPANY.hausnummer}`,
  plz: COMPANY.plz,
  ort: COMPANY.ort,
  telefon: COMPANY.telefon,
  email: COMPANY.email,
  web: COMPANY.website,
  ustId: COMPANY.ustId,
  handelsregister: COMPANY.hrNr,
  geschaeftsfuehrer: COMPANY.geschaeftsfuehrer,
};

// @deprecated - Re-exports für Abwärtskompatibilität
export const LECA_FIRMA = FIRMA;
export const LECA_EINTRAGUNG: Record<string, InstallerRegistration> = INSTALLER_REGISTRATIONS;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type VDEFormularTyp = 'E1' | 'E2' | 'E3' | 'E8';

export interface InstallationData {
  // Kunde
  kundenName: string;
  vorname?: string;
  nachname?: string;
  email?: string;
  telefon?: string;
  
  // Standort
  strasse: string;
  hausNr: string;
  plz: string;
  ort: string;
  
  // Netzbetreiber
  netzbetreiber?: string;
  netzbetreiberEmail?: string;
  
  // Technik PV
  pvModule?: {
    hersteller: string;
    modell: string;
    leistungWp: number;
    anzahl: number;
  }[];
  
  // Wechselrichter
  wechselrichter?: {
    hersteller: string;
    modell: string;
    leistungKva: number;
    anzahl: number;
    zerezId?: string;
  }[];
  
  // Speicher
  speicher?: {
    hersteller: string;
    modell: string;
    kapazitaetKwh: number;
    leistungKw?: number;
    anzahl: number;
    kopplung?: 'AC' | 'DC';
    batterietyp?: string;
    notstromfaehig?: boolean;
    schwarzstartfaehig?: boolean;
  }[];
  
  // Wallbox
  wallbox?: {
    hersteller: string;
    modell: string;
    leistungKw: number;
    anzahl: number;
  }[];
  
  // Wärmepumpe
  waermepumpe?: {
    hersteller: string;
    modell: string;
    leistungKw: number;
    anzahl: number;
  }[];
  
  // Sonstiges
  geplanteIBN?: string;
  messkonzept?: string;
  anlagentyp?: string;
}

export interface GeneratorOptionen {
  isAdmin?: boolean;
  signatur?: string; // Base64 PNG der Unterschrift
  stempel?: boolean; // Firmenstempel hinzufügen
  qrCode?: boolean;  // QR-Code für Verifikation
}

export interface GeneratedPDF {
  typ: VDEFormularTyp;
  name: string;
  blob: Blob;
  base64: string;
  filename: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
  primary: { r: 16, g: 185, b: 129 },      // Emerald Green
  primaryDark: { r: 5, g: 150, b: 105 },   // Darker Green
  secondary: { r: 59, g: 130, b: 246 },    // Blue
  dark: { r: 15, g: 23, b: 42 },           // Slate 900
  gray: { r: 100, g: 116, b: 139 },        // Slate 500
  lightGray: { r: 241, g: 245, b: 249 },   // Slate 100
  white: { r: 255, g: 255, b: 255 },
  black: { r: 0, g: 0, b: 0 },
};

interface PDFContext {
  pdf: jsPDF;
  W: number;
  H: number;
  M: number;  // Margin
  currentY: number;
}

function createPDF(landscape = false): PDFContext {
  const pdf = new jsPDF({
    orientation: landscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  return {
    pdf,
    W: landscape ? 297 : 210,
    H: landscape ? 210 : 297,
    M: 15,
    currentY: 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM DRAWING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function drawPremiumHeader(ctx: PDFContext, formularNr: string, titel: string): number {
  const { pdf, W, M } = ctx;
  
  // Gradient Header Background (simulated with rectangles)
  const headerH = 28;
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const r = Math.round(COLORS.dark.r + (COLORS.primaryDark.r - COLORS.dark.r) * t * 0.3);
    const g = Math.round(COLORS.dark.g + (COLORS.primaryDark.g - COLORS.dark.g) * t * 0.3);
    const b = Math.round(COLORS.dark.b + (COLORS.primaryDark.b - COLORS.dark.b) * t * 0.3);
    pdf.setFillColor(r, g, b);
    pdf.rect(0, (headerH / steps) * i, W, headerH / steps + 0.5, 'F');
  }
  
  // VDE|FNN Logo Text
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VDE|FNN', M, 10);
  
  // Formular Nummer (rechts)
  pdf.setFontSize(24);
  pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.text(formularNr, W - M, 14, { align: 'right' });
  
  // Titel
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.text(titel, M, 20);
  
  // Untertitel
  pdf.setFontSize(7);
  pdf.setTextColor(200, 200, 200);
  pdf.text('VDE-AR-N 4105 Erzeugungsanlagen am Niederspannungsnetz', M, 25);
  
  // Baunity Logo/Name (rechts unten im Header)
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.text('Baunity', W - M, 24, { align: 'right' });
  
  return headerH + 5;
}

function drawSectionHeader(ctx: PDFContext, y: number, titel: string, icon?: string): number {
  const { pdf, W, M } = ctx;
  
  // Section background
  pdf.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  pdf.roundedRect(M, y, W - 2 * M, 7, 1, 1, 'F');
  
  // Left accent bar
  pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.rect(M, y, 2, 7, 'F');
  
  // Title
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  pdf.text(titel.toUpperCase(), M + 5, y + 5);
  
  return y + 10;
}

function drawFieldRow(ctx: PDFContext, y: number, label: string, value: string, width?: number): number {
  const { pdf, W, M } = ctx;
  const fieldW = width || (W - 2 * M);
  
  // Label
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  pdf.text(label, M, y);
  
  // Value with underline
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  pdf.text(value || '–', M, y + 5);
  
  // Underline
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.line(M, y + 7, M + fieldW, y + 7);
  
  return y + 12;
}

function drawTwoColumnFields(ctx: PDFContext, y: number, fields: [string, string][]): number {
  const { pdf, W, M } = ctx;
  const colW = (W - 2 * M - 10) / 2;
  
  for (let i = 0; i < fields.length; i += 2) {
    const [label1, value1] = fields[i];
    const [label2, value2] = fields[i + 1] || ['', ''];
    
    // Left column
    pdf.setFontSize(7);
    pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    pdf.text(label1, M, y);
    pdf.setFontSize(9);
    pdf.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    pdf.text(value1 || '–', M, y + 5);
    pdf.setDrawColor(220, 220, 220);
    pdf.line(M, y + 7, M + colW, y + 7);
    
    // Right column
    if (label2) {
      pdf.setFontSize(7);
      pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
      pdf.text(label2, M + colW + 10, y);
      pdf.setFontSize(9);
      pdf.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      pdf.text(value2 || '–', M + colW + 10, y + 5);
      pdf.line(M + colW + 10, y + 7, W - M, y + 7);
    }
    
    y += 12;
  }
  
  return y;
}

function drawCheckboxRow(ctx: PDFContext, y: number, checked: boolean, label: string): number {
  const { pdf, M } = ctx;
  
  // Checkbox
  const boxSize = 4;
  pdf.setDrawColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  pdf.setLineWidth(0.3);
  pdf.rect(M, y - 3, boxSize, boxSize);
  
  if (checked) {
    pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.rect(M + 0.5, y - 2.5, boxSize - 1, boxSize - 1, 'F');
    // Checkmark
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    pdf.line(M + 1, y - 1, M + 1.8, y + 0.3);
    pdf.line(M + 1.8, y + 0.3, M + 3.2, y - 2);
  }
  
  // Label
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  pdf.text(label, M + 7, y);
  
  return y + 6;
}

function drawSignatureArea(ctx: PDFContext, y: number, label: string, signatur?: string): number {
  const { pdf, M, W } = ctx;
  const sigW = 55;
  const sigH = 20;
  
  // Box
  pdf.setDrawColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  pdf.setLineWidth(0.3);
  pdf.setLineDashPattern([1, 1], 0);
  pdf.rect(M, y, sigW, sigH);
  pdf.setLineDashPattern([], 0);
  
  // Signature image if provided
  if (signatur) {
    try {
      pdf.addImage(signatur, 'PNG', M + 2, y + 2, sigW - 4, sigH - 6);
    } catch (e) {
      console.warn('Signatur konnte nicht eingefügt werden');
    }
  }
  
  // Label below
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  pdf.text(label, M, y + sigH + 4);
  
  // Date field
  pdf.text('Datum:', M + sigW + 10, y + sigH + 4);
  pdf.line(M + sigW + 22, y + sigH + 4, M + sigW + 50, y + sigH + 4);
  
  return y + sigH + 10;
}

function drawStempel(ctx: PDFContext, x: number, y: number): void {
  const { pdf } = ctx;
  const size = 25;
  
  // Outer circle
  pdf.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.setLineWidth(1);
  pdf.circle(x + size/2, y + size/2, size/2);
  
  // Inner circle
  pdf.setLineWidth(0.5);
  pdf.circle(x + size/2, y + size/2, size/2 - 3);
  
  // Baunity text
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.text('Baunity', x + size/2, y + size/2, { align: 'center' });
  
  // Certified text around
  pdf.setFontSize(4);
  pdf.text('ZERTIFIZIERT', x + size/2, y + size/2 + 6, { align: 'center' });
}

function drawFooter(ctx: PDFContext, pageNum?: number, totalPages?: number): void {
  const { pdf, W, H, M } = ctx;
  
  // Footer line
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.line(M, H - 15, W - M, H - 15);
  
  // Baunity info
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  pdf.text(`${FIRMA.name} | ${FIRMA.strasse}, ${FIRMA.plz} ${FIRMA.ort}`, M, H - 10);
  pdf.text(`Tel: ${FIRMA.telefon} | ${FIRMA.email} | ${FIRMA.web}`, M, H - 6);
  
  // Page number
  if (pageNum && totalPages) {
    pdf.text(`Seite ${pageNum} von ${totalPages}`, W - M, H - 8, { align: 'right' });
  }
  
  // Generation date
  const now = new Date();
  pdf.text(`Erstellt: ${now.toLocaleDateString('de-DE')} ${now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`, W - M, H - 12, { align: 'right' });
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function feld(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function feldNum(val: any, decimals = 2): string {
  const num = Number(val);
  if (isNaN(num)) return '–';
  return num.toFixed(decimals).replace('.', ',');
}

function formatDatum(date?: string | Date): string {
  if (!date) return new Date().toLocaleDateString('de-DE');
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('de-DE');
}

function getInstallateurNr(netzbetreiber?: string): string {
  if (!netzbetreiber) return INSTALLER_REGISTRATIONS.DEFAULT.nr;
  const key = Object.keys(INSTALLER_REGISTRATIONS).find(k => 
    netzbetreiber.toLowerCase().includes(k.toLowerCase())
  );
  return INSTALLER_REGISTRATIONS[key || 'DEFAULT']?.nr || INSTALLER_REGISTRATIONS.DEFAULT.nr;
}

// ═══════════════════════════════════════════════════════════════════════════
// E.1 ANTRAGSTELLUNG
// ═══════════════════════════════════════════════════════════════════════════

export function generateE1PDF(data: InstallationData, optionen?: GeneratorOptionen): GeneratedPDF {
  const ctx = createPDF();
  const { pdf, W, M } = ctx;
  
  // Calculate totals
  const pvKwp = data.pvModule?.reduce((sum, m) => sum + (m.leistungWp * m.anzahl) / 1000, 0) || 0;
  const wrKva = data.wechselrichter?.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0) || 0;
  const speicherKwh = data.speicher?.reduce((sum, s) => sum + (s.kapazitaetKwh * s.anzahl), 0) || 0;
  
  pdf.setProperties({ title: 'E.1 Antragstellung', author: FIRMA.name });
  
  let y = drawPremiumHeader(ctx, 'E.1', 'Antragstellung Erzeugungsanlagen');
  
  // Anlagenbetreiber
  y = drawSectionHeader(ctx, y, 'Anlagenbetreiber');
  y = drawTwoColumnFields(ctx, y, [
    ['Vorname', feld(data.vorname)],
    ['Nachname', feld(data.nachname)],
    ['Straße, Hausnummer', `${feld(data.strasse)} ${feld(data.hausNr)}`],
    ['PLZ, Ort', `${feld(data.plz)} ${feld(data.ort)}`],
    ['E-Mail', feld(data.email)],
    ['Telefon', feld(data.telefon)],
  ]);
  
  // Anlagenanschrift
  y = drawSectionHeader(ctx, y + 3, 'Anlagenanschrift (falls abweichend)');
  y = drawTwoColumnFields(ctx, y, [
    ['Straße, Hausnummer', `${feld(data.strasse)} ${feld(data.hausNr)}`],
    ['PLZ, Ort', `${feld(data.plz)} ${feld(data.ort)}`],
  ]);
  
  // Anlagenerrichter
  y = drawSectionHeader(ctx, y + 3, 'Anlagenerrichter');
  y = drawTwoColumnFields(ctx, y, [
    ['Firma', FIRMA.name],
    ['Anschrift', `${FIRMA.strasse}, ${FIRMA.plz} ${FIRMA.ort}`],
    ['E-Mail', FIRMA.email],
    ['Telefon', FIRMA.telefon],
  ]);
  
  // Anlagentyp
  y = drawSectionHeader(ctx, y + 3, 'Anlagentyp');
  y = drawCheckboxRow(ctx, y, pvKwp > 0, `Photovoltaik ${pvKwp > 0 ? `(${feldNum(pvKwp)} kWp)` : ''}`);
  y = drawCheckboxRow(ctx, y, speicherKwh > 0, `Speicher ${speicherKwh > 0 ? `(${feldNum(speicherKwh)} kWh)` : ''}`);
  y = drawCheckboxRow(ctx, y, (data.wallbox?.length || 0) > 0, 'Ladeeinrichtung für Elektrofahrzeuge');
  y = drawCheckboxRow(ctx, y, (data.waermepumpe?.length || 0) > 0, 'Wärmepumpe');
  
  // Leistungsdaten
  y = drawSectionHeader(ctx, y + 3, 'Leistungsdaten');
  y = drawTwoColumnFields(ctx, y, [
    ['Modulleistung (Σ PAgen)', `${feldNum(pvKwp)} kWp`],
    ['Wechselrichterleistung (Σ SAmax)', `${feldNum(wrKva)} kVA`],
    ['Speicherkapazität', speicherKwh > 0 ? `${feldNum(speicherKwh)} kWh` : '–'],
    ['Geplante Inbetriebnahme', formatDatum(data.geplanteIBN)],
  ]);
  
  // Antragsart
  y = drawSectionHeader(ctx, y + 3, 'Antragsart');
  y = drawCheckboxRow(ctx, y, true, 'Neuanlage');
  y = drawCheckboxRow(ctx, y, false, 'Erweiterung bestehender Anlage');
  y = drawCheckboxRow(ctx, y, false, 'Änderung bestehender Anlage');
  
  // Unterschriften
  y = drawSectionHeader(ctx, y + 5, 'Unterschriften');
  
  // Anlagenbetreiber Unterschrift
  y = drawSignatureArea(ctx, y + 2, 'Unterschrift Anlagenbetreiber');
  
  // Errichter Unterschrift mit Signatur und Stempel
  y = drawSignatureArea(ctx, y + 5, 'Unterschrift Anlagenerrichter', optionen?.signatur);
  
  if (optionen?.stempel) {
    drawStempel(ctx, W - M - 30, y - 35);
  }
  
  drawFooter(ctx, 1, 1);
  
  const blob = pdf.output('blob');
  const base64 = pdf.output('datauristring').split(',')[1];
  const datum = formatDatum().replace(/\./g, '-');
  
  return {
    typ: 'E1',
    name: 'E.1 Antragstellung',
    blob,
    base64,
    filename: `E1_Antragstellung_${feld(data.nachname) || 'VDE'}_${datum}.pdf`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// E.2 DATENBLATT ERZEUGUNGSANLAGEN
// ═══════════════════════════════════════════════════════════════════════════

export function generateE2PDF(data: InstallationData, optionen?: GeneratorOptionen): GeneratedPDF {
  const ctx = createPDF();
  const { pdf, W, M } = ctx;
  
  const pvKwp = data.pvModule?.reduce((sum, m) => sum + (m.leistungWp * m.anzahl) / 1000, 0) || 0;
  const wrKva = data.wechselrichter?.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0) || 0;
  const wr = data.wechselrichter?.[0];
  const modul = data.pvModule?.[0];
  
  pdf.setProperties({ title: 'E.2 Datenblatt Erzeugungsanlagen', author: FIRMA.name });
  
  let y = drawPremiumHeader(ctx, 'E.2', 'Datenblatt Erzeugungsanlagen');
  
  // Anlagenanschrift
  y = drawSectionHeader(ctx, y, 'Anlagenanschrift');
  y = drawTwoColumnFields(ctx, y, [
    ['Anlagenbetreiber', data.kundenName],
    ['Anschrift', `${feld(data.strasse)} ${feld(data.hausNr)}, ${feld(data.plz)} ${feld(data.ort)}`],
  ]);
  
  // Anlagenerrichter
  y = drawSectionHeader(ctx, y + 2, 'Anlagenerrichter');
  y = drawTwoColumnFields(ctx, y, [
    ['Firma', FIRMA.name],
    ['Tel/E-Mail', `${FIRMA.telefon} / ${FIRMA.email}`],
  ]);
  
  // Nachweis Errichter (nur Admin)
  if (optionen?.isAdmin) {
    y = drawSectionHeader(ctx, y + 2, 'Nachweis Errichter');
    y = drawTwoColumnFields(ctx, y, [
      ['Ausweis-Nr.', getInstallateurNr(data.netzbetreiber)],
      ['bei Netzbetreiber', feld(data.netzbetreiber)],
    ]);
  }
  
  // Anlagenleistung
  y = drawSectionHeader(ctx, y + 2, 'Anlagenleistung');
  y = drawTwoColumnFields(ctx, y, [
    ['max. Scheinleistung SAmax', `${feldNum(wrKva)} kVA`],
    ['max. Wirkleistung PAmax', `${feldNum(pvKwp)} kW`],
    ['Modulleistung PAgen (PV)', `${feldNum(pvKwp)} kWp`],
    ['cos φ', '1,00'],
  ]);
  
  // PV-Module
  if (modul) {
    y = drawSectionHeader(ctx, y + 2, 'PV-Generator');
    y = drawTwoColumnFields(ctx, y, [
      ['Hersteller', feld(modul.hersteller)],
      ['Typ', feld(modul.modell)],
      ['Nennleistung', `${feldNum(modul.leistungWp, 0)} Wp`],
      ['Anzahl Module', String(modul.anzahl)],
    ]);
  }
  
  // Wechselrichter
  if (wr) {
    y = drawSectionHeader(ctx, y + 2, 'Wechselrichter');
    y = drawTwoColumnFields(ctx, y, [
      ['Hersteller', feld(wr.hersteller)],
      ['Typ', feld(wr.modell)],
      ['Scheinleistung', `${feldNum(wr.leistungKva)} kVA`],
      ['Anzahl', String(wr.anzahl)],
      ['ZeREZ-ID', feld(wr.zerezId) || '–'],
      ['Anzahl', String(wr.anzahl)],
    ]);
  }
  
  // Einspeisemanagement
  y = drawSectionHeader(ctx, y + 2, 'Einspeisemanagement');
  y = drawCheckboxRow(ctx, y, true, 'Ferngesteuerte Leistungsreduzierung vorhanden');
  y = drawCheckboxRow(ctx, y, pvKwp <= 25, 'Dauerhafte Begrenzung auf 70% der Modulleistung');
  
  // NA-Schutz
  y = drawSectionHeader(ctx, y + 2, 'NA-Schutz');
  y = drawCheckboxRow(ctx, y, true, 'integrierter NA-Schutz im Wechselrichter');
  y = drawFieldRow(ctx, y + 2, 'U> Einstellung', '253,0 V / 0,1 s');
  
  // Unterschrift
  y = drawSectionHeader(ctx, y + 5, 'Bestätigung Errichter');
  
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  pdf.text('Der Errichter bestätigt die Richtigkeit der Angaben.', M, y + 3);
  
  y = drawSignatureArea(ctx, y + 8, 'Unterschrift Anlagenerrichter', optionen?.signatur);
  
  if (optionen?.stempel) {
    drawStempel(ctx, W - M - 30, y - 30);
  }
  
  drawFooter(ctx, 1, 1);
  
  const blob = pdf.output('blob');
  const base64 = pdf.output('datauristring').split(',')[1];
  const datum = formatDatum().replace(/\./g, '-');
  
  return {
    typ: 'E2',
    name: 'E.2 Datenblatt Erzeugungsanlagen',
    blob,
    base64,
    filename: `E2_Datenblatt_${feld(data.nachname) || 'VDE'}_${datum}.pdf`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// E.3 DATENBLATT SPEICHER
// ═══════════════════════════════════════════════════════════════════════════

export function generateE3PDF(data: InstallationData, optionen?: GeneratorOptionen): GeneratedPDF | null {
  if (!data.speicher?.length) return null;
  
  const ctx = createPDF();
  const { pdf, W, M } = ctx;
  
  const sp = data.speicher[0];
  const totalKwh = data.speicher.reduce((sum, s) => sum + (s.kapazitaetKwh * s.anzahl), 0);
  const totalKw = data.speicher.reduce((sum, s) => sum + ((s.leistungKw || 0) * s.anzahl), 0);
  
  pdf.setProperties({ title: 'E.3 Datenblatt Speicher', author: FIRMA.name });
  
  let y = drawPremiumHeader(ctx, 'E.3', 'Datenblatt Speicher');
  
  // Anlagenanschrift
  y = drawSectionHeader(ctx, y, 'Anlagenanschrift');
  y = drawTwoColumnFields(ctx, y, [
    ['Anlagenbetreiber', data.kundenName],
    ['Anschrift', `${feld(data.strasse)} ${feld(data.hausNr)}, ${feld(data.plz)} ${feld(data.ort)}`],
  ]);
  
  // Anlagenerrichter
  y = drawSectionHeader(ctx, y + 2, 'Anlagenerrichter');
  y = drawTwoColumnFields(ctx, y, [
    ['Firma', FIRMA.name],
    ['Tel/E-Mail', `${FIRMA.telefon} / ${FIRMA.email}`],
  ]);
  
  // Nachweis Errichter (nur Admin)
  if (optionen?.isAdmin) {
    y = drawSectionHeader(ctx, y + 2, 'Nachweis Errichter');
    y = drawTwoColumnFields(ctx, y, [
      ['Ausweis-Nr.', getInstallateurNr(data.netzbetreiber)],
      ['bei Netzbetreiber', feld(data.netzbetreiber)],
    ]);
  }
  
  // Speicherdaten
  y = drawSectionHeader(ctx, y + 2, 'Speichersystem');
  y = drawTwoColumnFields(ctx, y, [
    ['Hersteller', feld(sp.hersteller)],
    ['Typ/Modell', feld(sp.modell)],
    ['Speicherkapazität (netto)', `${feldNum(totalKwh)} kWh`],
    ['max. Entladeleistung', `${feldNum(totalKw || totalKwh * 0.5)} kW`],
    ['Batterietechnologie', feld(sp.batterietyp) || 'Lithium-Ionen'],
    ['Kopplung', sp.kopplung === 'AC' ? 'AC-gekoppelt' : 'DC-gekoppelt'],
    ['Anzahl Speichereinheiten', String(sp.anzahl)],
  ]);
  
  // Betriebsarten
  y = drawSectionHeader(ctx, y + 2, 'Betriebsarten');
  y = drawCheckboxRow(ctx, y, sp.notstromfaehig || false, 'Notstromfähig (Ersatzstrom)');
  y = drawCheckboxRow(ctx, y, sp.schwarzstartfaehig || false, 'Schwarzstartfähig');
  y = drawCheckboxRow(ctx, y, true, 'Eigenverbrauchsoptimierung');
  y = drawCheckboxRow(ctx, y, true, 'Netzparallelbetrieb');
  
  // NA-Schutz
  y = drawSectionHeader(ctx, y + 2, 'NA-Schutz');
  y = drawCheckboxRow(ctx, y, true, 'integrierter NA-Schutz');
  y = drawFieldRow(ctx, y + 2, 'U> Einstellung', '253,0 V / 0,1 s');
  
  // Blindleistung
  y = drawSectionHeader(ctx, y + 2, 'Blindleistungsbereitstellung');
  y = drawCheckboxRow(ctx, y, true, 'Q(U)-Standard-Kennlinie');
  y = drawCheckboxRow(ctx, y, false, 'cos φ (P)-Kennlinie');
  
  // Unterschrift
  y = drawSectionHeader(ctx, y + 5, 'Bestätigung Errichter');
  
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  pdf.text('Der Errichter bestätigt die Richtigkeit der Angaben.', M, y + 3);
  
  y = drawSignatureArea(ctx, y + 8, 'Unterschrift Anlagenerrichter', optionen?.signatur);
  
  if (optionen?.stempel) {
    drawStempel(ctx, W - M - 30, y - 30);
  }
  
  drawFooter(ctx, 1, 1);
  
  const blob = pdf.output('blob');
  const base64 = pdf.output('datauristring').split(',')[1];
  const datum = formatDatum().replace(/\./g, '-');
  
  return {
    typ: 'E3',
    name: 'E.3 Datenblatt Speicher',
    blob,
    base64,
    filename: `E3_Speicher_${feld(data.nachname) || 'VDE'}_${datum}.pdf`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// E.8 INBETRIEBSETZUNGSPROTOKOLL
// ═══════════════════════════════════════════════════════════════════════════

export function generateE8PDF(data: InstallationData, optionen?: GeneratorOptionen): GeneratedPDF {
  const ctx = createPDF();
  const { pdf, W, M } = ctx;
  
  const pvKwp = data.pvModule?.reduce((sum, m) => sum + (m.leistungWp * m.anzahl) / 1000, 0) || 0;
  const wrKva = data.wechselrichter?.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0) || 0;
  const hatSpeicher = (data.speicher?.length || 0) > 0;
  const istDreiphasig = wrKva > 4.6;
  
  pdf.setProperties({ title: 'E.8 Inbetriebsetzungsprotokoll', author: FIRMA.name });
  
  let y = drawPremiumHeader(ctx, 'E.8', 'Inbetriebsetzungsprotokoll');
  
  // Anlagenanschrift
  y = drawSectionHeader(ctx, y, 'Anlagenanschrift');
  y = drawTwoColumnFields(ctx, y, [
    ['Anlagenbetreiber', data.kundenName],
    ['Anschrift', `${feld(data.strasse)} ${feld(data.hausNr)}, ${feld(data.plz)} ${feld(data.ort)}`],
  ]);
  
  // Anlagenerrichter
  y = drawSectionHeader(ctx, y + 2, 'Anlagenerrichter');
  y = drawTwoColumnFields(ctx, y, [
    ['Firma', FIRMA.name],
    ['Tel/E-Mail', `${FIRMA.telefon} / ${FIRMA.email}`],
  ]);
  
  // Leistungsdaten
  y = drawSectionHeader(ctx, y + 2, 'Leistungsdaten');
  y = drawTwoColumnFields(ctx, y, [
    ['max. Scheinleistung SAmax', `${feldNum(wrKva)} kVA`],
    ['max. Wirkleistung PAmax', `${feldNum(pvKwp)} kW`],
    ['Modulleistung PAgen', `${feldNum(pvKwp)} kWp`],
    ['cos φ', '1,00'],
  ]);
  
  // Prüfungen
  y = drawSectionHeader(ctx, y + 2, 'Prüfungen und Nachweise');
  y = drawCheckboxRow(ctx, y, true, `Übereinstimmung Datenblatt E.2 ${hatSpeicher ? 'und E.3 ' : ''}mit Anlagenaufbau`);
  y = drawCheckboxRow(ctx, y, true, 'Abrechnungsmessung: IBN-Prüfung erfolgt');
  y = drawCheckboxRow(ctx, y, true, `Einheitenzertifikat ${hatSpeicher ? 'für Erzeuger/Speicher ' : ''}vorhanden`);
  y = drawCheckboxRow(ctx, y, true, 'Zertifikat für NA-Schutz vorhanden');
  y = drawCheckboxRow(ctx, y, true, 'Dokumentation an Betreiber übergeben');
  
  // NA-Schutz
  y = drawSectionHeader(ctx, y + 2, 'NA-Schutz Einstellungen');
  y = drawFieldRow(ctx, y, 'Integrierter NA-Schutz: U>', '253,0 V / 0,1 s');
  
  // Einspeisemanagement
  y = drawSectionHeader(ctx, y + 2, 'Einspeisemanagement');
  y = drawCheckboxRow(ctx, y, pvKwp <= 25, 'Dauerhafte Begrenzung auf 70% der Modulleistung');
  y = drawCheckboxRow(ctx, y, true, 'Ferngesteuerte Leistungsreduzierung vorhanden');
  
  if (hatSpeicher) {
    y = drawCheckboxRow(ctx, y, true, 'Energieflussrichtungssensor – Funktionstest bestanden');
  }
  
  // Symmetrie
  y = drawSectionHeader(ctx, y + 2, 'Symmetriebedingung');
  y = drawCheckboxRow(ctx, y, istDreiphasig, 'durch Drehstrom-Umrichter');
  y = drawCheckboxRow(ctx, y, !istDreiphasig, 'durch Aufteilung einphasiger Erzeugungseinheiten');
  
  // Blindleistung
  y = drawSectionHeader(ctx, y + 2, 'Blindleistungsbereitstellung');
  y = drawCheckboxRow(ctx, y, true, 'Q(U)-Standard-Kennlinie aktiviert');
  
  // IBN Datum
  y = drawSectionHeader(ctx, y + 2, 'Inbetriebsetzung');
  y = drawFieldRow(ctx, y, 'Datum der Inbetriebsetzung', formatDatum(data.geplanteIBN));
  
  // Bestätigung Box
  pdf.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  pdf.roundedRect(M, y + 3, W - 2 * M, 12, 2, 2, 'F');
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  pdf.text('Die Erzeugungsanlage ist nach VDE-AR-N 4105, VDE-AR-N 4100 und den TAB des Netzbetreibers errichtet.', M + 3, y + 8);
  pdf.text('Der Anlagenerrichter hat den Anlagenbetreiber einzuweisen und die Dokumentation zu übergeben.', M + 3, y + 12);
  y += 20;
  
  // Unterschriften
  y = drawSectionHeader(ctx, y, 'Unterschriften');
  
  // Drei Unterschriftsfelder nebeneinander
  const sigW = (W - 2 * M - 20) / 3;
  
  // Ort, Datum
  pdf.setDrawColor(180, 180, 180);
  pdf.line(M, y + 15, M + sigW, y + 15);
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  pdf.text('Ort, Datum', M, y + 20);
  
  // Anlagenbetreiber
  pdf.line(M + sigW + 10, y + 15, M + 2 * sigW + 10, y + 15);
  pdf.text('Unterschrift Anlagenbetreiber', M + sigW + 10, y + 20);
  
  // Anlagenerrichter
  if (optionen?.signatur) {
    try {
      pdf.addImage(optionen.signatur, 'PNG', M + 2 * sigW + 20, y, sigW - 5, 14);
    } catch (e) {
      console.warn('Signatur konnte nicht eingefügt werden');
    }
  }
  pdf.line(M + 2 * sigW + 20, y + 15, W - M, y + 15);
  pdf.text('Unterschrift Anlagenerrichter', M + 2 * sigW + 20, y + 20);
  
  if (optionen?.stempel) {
    drawStempel(ctx, W - M - 28, y - 8);
  }
  
  drawFooter(ctx, 1, 1);
  
  const blob = pdf.output('blob');
  const base64 = pdf.output('datauristring').split(',')[1];
  const datum = formatDatum().replace(/\./g, '-');
  
  return {
    typ: 'E8',
    name: 'E.8 Inbetriebsetzungsprotokoll',
    blob,
    base64,
    filename: `E8_IBN_Protokoll_${feld(data.nachname) || 'VDE'}_${datum}.pdf`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generiert alle relevanten VDE-Formulare
 */
export function generateAllVDEPDFs(data: InstallationData, optionen?: GeneratorOptionen): GeneratedPDF[] {
  const pdfs: GeneratedPDF[] = [];
  
  // E.1 Antragstellung - Immer
  pdfs.push(generateE1PDF(data, optionen));
  
  // E.2 Datenblatt - Bei PV vorhanden
  if (data.pvModule?.length || data.wechselrichter?.length) {
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
 * Konvertiert InstallationDetail zu InstallationData
 */
export function installationToData(installation: any): InstallationData {
  // Parse wizardContext if available
  let wizardData: any = {};
  if (installation.wizardContext) {
    try {
      wizardData = typeof installation.wizardContext === 'string' 
        ? JSON.parse(installation.wizardContext) 
        : installation.wizardContext;
    } catch (e) {
      console.warn('Could not parse wizardContext');
    }
  }
  
  return {
    kundenName: installation.customerName || `${installation.customer?.vorname || ''} ${installation.customer?.nachname || ''}`.trim(),
    vorname: installation.customer?.vorname || wizardData.step6?.vorname,
    nachname: installation.customer?.nachname || wizardData.step6?.nachname,
    email: installation.contactEmail || installation.customer?.email,
    telefon: installation.contactPhone || installation.customer?.telefon,
    strasse: installation.strasse || installation.customer?.strasse || wizardData.step2?.strasse || '',
    hausNr: installation.hausNr || installation.customer?.hausNr || wizardData.step2?.hausnummer || '',
    plz: installation.plz || installation.zipCode || wizardData.step2?.plz || '',
    ort: installation.ort || wizardData.step2?.ort || '',
    netzbetreiber: installation.gridOperator,
    netzbetreiberEmail: installation.gridOperatorEmail,
    pvModule: wizardData.step5?.dachflaechen?.map((d: any) => ({
      hersteller: d.modulHersteller,
      modell: d.modulModell,
      leistungWp: d.modulLeistungWp,
      anzahl: d.modulAnzahl,
    })),
    wechselrichter: wizardData.step5?.wechselrichter?.map((w: any) => ({
      hersteller: w.hersteller,
      modell: w.modell,
      leistungKva: w.leistungKva,
      anzahl: w.anzahl,
    })),
    speicher: wizardData.step5?.speicher?.map((s: any) => ({
      hersteller: s.hersteller,
      modell: s.modell,
      kapazitaetKwh: s.kapazitaetKwh,
      leistungKw: s.leistungKw,
      anzahl: s.anzahl,
      kopplung: s.kopplung?.toUpperCase() as 'AC' | 'DC',
      batterietyp: s.batterietyp,
      notstromfaehig: s.notstromfaehig,
      schwarzstartfaehig: s.schwarzstartfaehig,
    })),
    wallbox: wizardData.step5?.wallboxen?.map((w: any) => ({
      hersteller: w.hersteller,
      modell: w.modell,
      leistungKw: w.leistungKw,
      anzahl: w.anzahl || 1,
    })),
    waermepumpe: wizardData.step5?.waermepumpen?.map((w: any) => ({
      hersteller: w.hersteller,
      modell: w.modell,
      leistungKw: w.leistungKw,
      anzahl: w.anzahl || 1,
    })),
    geplanteIBN: wizardData.step5?.geplanteIBN || installation.geplantesIBNDatum,
    messkonzept: wizardData.step5?.messkonzept,
    anlagentyp: installation.caseType,
  };
}

export default {
  generateE1PDF,
  generateE2PDF,
  generateE3PDF,
  generateE8PDF,
  generateAllVDEPDFs,
  installationToData,
  LECA_FIRMA,
  LECA_EINTRAGUNG,
};
