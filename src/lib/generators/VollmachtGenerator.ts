/**
 * Baunity Unified Vollmacht Generator
 * =====================================
 * Generiert professionelle Vollmacht für Netzanmeldung
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
// VOLLMACHT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

export function generateVollmacht(data: UnifiedInstallationData, options?: GeneratorOptions): GeneratedDocument {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 20;

  const datum = (options?.customDate || new Date()).toLocaleDateString('de-DE');
  const zeit = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const kundenname = `${data.kunde.vorname} ${data.kunde.nachname}`.trim() || 'Anlagenbetreiber';
  const standort = `${data.standort.strasse} ${data.standort.hausnummer}, ${data.standort.plz} ${data.standort.ort}`;

  pdf.setProperties({ title: 'Vollmacht Netzanmeldung', author: COMPANY.name });

  // Header
  pdf.setFillColor(COLORS.header);
  pdf.rect(0, 0, W, 45, 'F');

  pdf.setFillColor(COLORS.primary);
  pdf.rect(W - 55, 8, 45, 14, 'F');
  pdf.setTextColor(COLORS.white);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(COMPANY.name, W - 32.5, 17, { align: 'center' });

  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.white);
  pdf.text('VOLLMACHT', M, 25);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor('#94a3b8');
  pdf.text('zur Netzanmeldung einer Erzeugungsanlage', M, 35);

  let y = 60;

  // Vollmachtgeber
  pdf.setFillColor(COLORS.bg);
  pdf.setDrawColor(COLORS.border);
  pdf.roundedRect(M, y, W - 2 * M, 55, 3, 3, 'FD');

  pdf.setFillColor(COLORS.primary);
  pdf.roundedRect(M, y, W - 2 * M, 10, 3, 3, 'F');
  pdf.rect(M, y + 7, W - 2 * M, 3, 'F');

  pdf.setTextColor(COLORS.white);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VOLLMACHTGEBER (Anlagenbetreiber)', M + 5, y + 7);

  y += 18;
  pdf.setTextColor(COLORS.text);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(kundenname, M + 8, y);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.textLight);
  pdf.text(standort, M + 8, y + 8);
  if (data.kunde.telefon) pdf.text(`Tel: ${data.kunde.telefon}`, M + 8, y + 16);
  if (data.kunde.email) pdf.text(`E-Mail: ${data.kunde.email}`, M + 8, y + 24);
  if (data.kunde.geburtsdatum) pdf.text(`Geb.: ${data.kunde.geburtsdatum}`, M + 8, y + 32);

  y += 55;

  // Bevollmächtigter
  pdf.setFillColor(COLORS.bg);
  pdf.roundedRect(M, y, W - 2 * M, 45, 3, 3, 'FD');

  pdf.setFillColor(COLORS.accent);
  pdf.roundedRect(M, y, W - 2 * M, 10, 3, 3, 'F');
  pdf.rect(M, y + 7, W - 2 * M, 3, 'F');

  pdf.setTextColor(COLORS.white);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BEVOLLMÄCHTIGTER (Installationsunternehmen)', M + 5, y + 7);

  y += 18;
  pdf.setTextColor(COLORS.text);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(COMPANY.name, M + 8, y);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.textLight);
  pdf.text(`${COMPANY.strasse}, ${COMPANY.plz} ${COMPANY.ort}`, M + 8, y + 8);
  pdf.text(`Tel: ${COMPANY.telefon}`, M + 8, y + 16);
  if (COMPANY.installateurNr) {
    pdf.text(`Installateurausweis: ${COMPANY.installateurNr}`, M + 8, y + 24);
  }

  y += 50;

  // Umfang der Vollmacht
  pdf.setFillColor(COLORS.bg);
  pdf.roundedRect(M, y, W - 2 * M, 70, 3, 3, 'FD');

  pdf.setFillColor(COLORS.header);
  pdf.roundedRect(M, y, W - 2 * M, 10, 3, 3, 'F');
  pdf.rect(M, y + 7, W - 2 * M, 3, 'F');

  pdf.setTextColor(COLORS.white);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('UMFANG DER VOLLMACHT', M + 5, y + 7);

  y += 18;
  pdf.setTextColor(COLORS.text);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');

  const vollmachtText = [
    '☑ Anmeldung der Erzeugungsanlage beim zuständigen Netzbetreiber',
    '☑ Einreichung aller erforderlichen technischen Unterlagen',
    '☑ Kommunikation mit dem Netzbetreiber im Rahmen des Anmeldeverfahrens',
    '☑ Entgegennahme von Bescheiden und Genehmigungen',
    data.mastrRegistrierung ? '☑ Registrierung der Anlage im Marktstammdatenregister' : '☐ Registrierung im Marktstammdatenregister (nicht beauftragt)',
    '☑ Koordination des Zählerwechsels / der Zählerinstallation',
  ];

  vollmachtText.forEach((text, i) => {
    pdf.text(text, M + 8, y + i * 8);
  });

  y += 75;

  // Anlagendaten
  pdf.setFillColor('#fef3c7');
  pdf.setDrawColor('#f59e0b');
  pdf.roundedRect(M, y, W - 2 * M, 35, 3, 3, 'FD');

  pdf.setTextColor('#92400e');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ANLAGENDATEN', M + 5, y + 8);

  pdf.setFont('helvetica', 'normal');
  pdf.text(`Standort: ${standort}`, M + 5, y + 16);
  pdf.text(`Leistung: ${data.gesamtleistungKwp.toFixed(2)} kWp`, M + 5, y + 23);
  pdf.text(`Netzbetreiber: ${data.netzbetreiber?.name || 'Wird ermittelt'}`, M + 5, y + 30);

  // Digitale Signatur
  y = H - 75;
  pdf.setFillColor('#ecfdf5');
  pdf.setDrawColor(COLORS.accent);
  pdf.roundedRect(M, y, W - 2 * M, 40, 3, 3, 'FD');

  pdf.setFillColor(COLORS.accent);
  pdf.roundedRect(M + 5, y + 3, 55, 7, 2, 2, 'F');
  pdf.setTextColor(COLORS.white);
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ELEKTRONISCH SIGNIERT', M + 32.5, y + 8, { align: 'center' });

  const signaturRef = `SIG-${Date.now().toString(36).toUpperCase()}`;

  pdf.setTextColor('#065f46');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Vollmachtgeber:', M + 8, y + 18);
  pdf.setFont('helvetica', 'normal');
  pdf.text(kundenname, M + 45, y + 18);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Datum/Uhrzeit:', M + 8, y + 25);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${datum}, ${zeit} Uhr`, M + 45, y + 25);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Referenz:', M + 8, y + 32);
  pdf.setTextColor(COLORS.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.text(signaturRef, M + 45, y + 32);

  // OK Badge
  pdf.setFillColor(COLORS.accent);
  pdf.circle(W - M - 25, y + 22, 12, 'F');
  pdf.setTextColor(COLORS.white);
  pdf.setFontSize(14);
  pdf.text('OK', W - M - 25, y + 27, { align: 'center' });

  // Footer
  pdf.setDrawColor(COLORS.border);
  pdf.line(M, H - 20, W - M, H - 20);

  pdf.setTextColor(COLORS.textLight);
  pdf.setFontSize(7);
  pdf.text(`${COMPANY.name} | ${COMPANY.strasse} | ${COMPANY.plz} ${COMPANY.ort} | ${COMPANY.telefon}`, W / 2, H - 12, { align: 'center' });

  return {
    typ: 'vollmacht',
    kategorie: 'VOLLMACHT',
    name: 'Vollmacht',
    filename: `Vollmacht_${data.kunde.nachname?.replace(/\s+/g, '_') || 'Anlage'}_${datum.replace(/\./g, '-')}.pdf`,
    blob: pdf.output('blob'),
    mimeType: 'application/pdf',
  };
}
