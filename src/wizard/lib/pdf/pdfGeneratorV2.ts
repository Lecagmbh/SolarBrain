/**
 * Baunity PDF Generator V2
 * =====================
 * Generiert PDFs direkt mit jsPDF (ohne SVG-Konvertierung)
 * 
 * Funktioniert zuverlässig im Browser!
 */

import { jsPDF } from 'jspdf';
import type { WizardData } from '../../types/wizard.types';
import { COMPANY } from '../../types/wizard.types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PDFConfig {
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'a3';
  title?: string;
  author?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: 'application/pdf' });
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHALTPLAN PDF
// ═══════════════════════════════════════════════════════════════════════════

export function generateSchaltplanPDF(data: WizardData): { blob: Blob; filename: string } {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210;
  const kundenname = `${data.step6.vorname || ''} ${data.step6.nachname || ''}`.trim();
  
  // Metadaten
  pdf.setProperties({
    title: `Übersichtsschaltplan - ${kundenname}`,
    author: COMPANY.name,
    creator: 'Baunity Wizard',
  });
  
  // Hintergrund
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, W, H, 'F');
  
  // Rahmen
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(0.5);
  pdf.rect(10, 10, W - 20, H - 20);
  
  // Titel
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ÜBERSICHTSSCHALTPLAN', W / 2, 25, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${data.step2.strasse} ${data.step2.hausnummer}, ${data.step2.plz} ${data.step2.ort}`, W / 2, 32, { align: 'center' });
  
  // Komponenten
  const komponenten = data.step1.komponenten;
  const hatPV = komponenten.includes('pv');
  const hatSpeicher = komponenten.includes('speicher');
  const hatWallbox = komponenten.includes('wallbox');
  const hatWP = komponenten.includes('waermepumpe');
  
  let y = 50;
  const boxW = 50, boxH = 25;
  const startX = 30;
  
  // Netz (links)
  pdf.setFillColor(200, 200, 200);
  pdf.rect(startX, y, boxW, boxH, 'FD');
  pdf.setFontSize(9);
  pdf.text('NETZ', startX + boxW/2, y + 10, { align: 'center' });
  pdf.text('230/400V', startX + boxW/2, y + 18, { align: 'center' });
  
  // HAK
  pdf.setFillColor(255, 100, 100);
  pdf.rect(startX + 60, y, 30, boxH, 'FD');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('HAK', startX + 75, y + 15, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
  
  // Zähler
  pdf.setFillColor(100, 150, 255);
  pdf.rect(startX + 100, y, 35, boxH, 'FD');
  pdf.setTextColor(255, 255, 255);
  pdf.text('ZÄHLER', startX + 117, y + 10, { align: 'center' });
  pdf.text('2-Richtung', startX + 117, y + 18, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
  
  // Verbindungslinien
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(startX + boxW, y + boxH/2, startX + 60, y + boxH/2);
  pdf.line(startX + 90, y + boxH/2, startX + 100, y + boxH/2);
  
  // Verteiler
  pdf.setFillColor(150, 150, 150);
  pdf.rect(startX + 145, y - 20, 40, boxH + 60, 'FD');
  pdf.setFontSize(9);
  pdf.text('VERTEILER', startX + 165, y + 15, { align: 'center' });
  pdf.line(startX + 135, y + boxH/2, startX + 145, y + boxH/2);
  
  // Komponenten rechts vom Verteiler
  let compY = y - 15;
  const compX = startX + 200;
  
  if (hatPV) {
    // PV
    pdf.setFillColor(255, 180, 0);
    pdf.rect(compX, compY, boxW, boxH, 'FD');
    pdf.setFontSize(8);
    pdf.text('PV-ANLAGE', compX + boxW/2, compY + 10, { align: 'center' });
    const kwp = data.step5.gesamtleistungKwp || (data.step5.dachflaechen?.reduce((s, d) => s + (d.modulAnzahl * (d.modulLeistungWp || 400) / 1000), 0) || 0);
    pdf.text(`${kwp.toFixed(2)} kWp`, compX + boxW/2, compY + 18, { align: 'center' });
    pdf.line(startX + 185, y + 5, compX, compY + boxH/2);
    compY += boxH + 10;
    
    // Wechselrichter
    pdf.setFillColor(100, 200, 100);
    pdf.rect(compX - 30, compY - 35, 25, 20, 'FD');
    pdf.setFontSize(7);
    pdf.text('WR', compX - 17, compY - 22, { align: 'center' });
  }
  
  if (hatSpeicher) {
    pdf.setFillColor(100, 200, 255);
    pdf.rect(compX, compY, boxW, boxH, 'FD');
    pdf.setFontSize(8);
    pdf.text('SPEICHER', compX + boxW/2, compY + 10, { align: 'center' });
    const kwh = data.step5.speicher?.[0]?.kapazitaetKwh || 10;
    pdf.text(`${kwh} kWh`, compX + boxW/2, compY + 18, { align: 'center' });
    pdf.line(startX + 185, y + 15, compX, compY + boxH/2);
    compY += boxH + 10;
  }
  
  if (hatWallbox) {
    pdf.setFillColor(150, 100, 255);
    pdf.rect(compX, compY, boxW, boxH, 'FD');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text('WALLBOX', compX + boxW/2, compY + 10, { align: 'center' });
    const kw = data.step5.wallboxen?.[0]?.leistungKw || 11;
    pdf.text(`${kw} kW`, compX + boxW/2, compY + 18, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    pdf.line(startX + 185, y + 25, compX, compY + boxH/2);
    compY += boxH + 10;
  }
  
  if (hatWP) {
    pdf.setFillColor(50, 150, 200);
    pdf.rect(compX, compY, boxW, boxH, 'FD');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text('WÄRMEPUMPE', compX + boxW/2, compY + 10, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    pdf.line(startX + 185, y + 35, compX, compY + boxH/2);
    compY += boxH + 10;
  }
  
  // Verbraucher
  pdf.setFillColor(220, 220, 220);
  pdf.rect(compX, compY, boxW, boxH, 'FD');
  pdf.setFontSize(8);
  pdf.text('HAUSHALT', compX + boxW/2, compY + 10, { align: 'center' });
  pdf.text('Verbraucher', compX + boxW/2, compY + 18, { align: 'center' });
  pdf.line(startX + 185, y + 45, compX, compY + boxH/2);
  
  // Schriftfeld unten
  const sfY = H - 35;
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(0.3);
  pdf.rect(10, sfY, W - 20, 25);
  pdf.line(80, sfY, 80, sfY + 25);
  pdf.line(160, sfY, 160, sfY + 25);
  pdf.line(230, sfY, 230, sfY + 25);
  
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Bauherr:', 12, sfY + 6);
  pdf.setFont('helvetica', 'bold');
  pdf.text(kundenname || '-', 12, sfY + 14);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text('Standort:', 82, sfY + 6);
  pdf.text(`${data.step2.strasse} ${data.step2.hausnummer}`, 82, sfY + 14);
  pdf.text(`${data.step2.plz} ${data.step2.ort}`, 82, sfY + 20);
  
  pdf.text('Datum:', 162, sfY + 6);
  pdf.text(new Date().toLocaleDateString('de-DE'), 162, sfY + 14);
  
  pdf.text('Erstellt von:', 232, sfY + 6);
  pdf.text(COMPANY.name, 232, sfY + 14);
  
  const blob = pdf.output('blob');
  const datum = new Date().toISOString().split('T')[0];
  return { 
    blob, 
    filename: `Uebersichtsschaltplan_${kundenname.replace(/\s+/g, '_')}_${datum}.pdf` 
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LAGEPLAN PDF
// ═══════════════════════════════════════════════════════════════════════════

export function generateLageplanPDF(data: WizardData): { blob: Blob; filename: string } {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210;
  const kundenname = `${data.step6.vorname || ''} ${data.step6.nachname || ''}`.trim();
  
  pdf.setProperties({
    title: `Lageplan - ${data.step2.strasse} ${data.step2.hausnummer}`,
    author: COMPANY.name,
  });
  
  // Titel
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LAGEPLAN', 15, 20);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${data.step2.strasse} ${data.step2.hausnummer}, ${data.step2.plz} ${data.step2.ort}`, 15, 28);
  
  // Grundstück
  const gX = 30, gY = 45, gW = 150, gH = 110;
  pdf.setFillColor(200, 230, 200);
  pdf.setDrawColor(50, 120, 50);
  pdf.setLineWidth(1);
  pdf.rect(gX, gY, gW, gH, 'FD');
  
  // Grundstücksmaße
  pdf.setFontSize(8);
  pdf.setTextColor(80, 80, 80);
  pdf.text('20 m', gX + gW/2, gY + gH + 8, { align: 'center' });
  pdf.text('35 m', gX + gW + 5, gY + gH/2, { align: 'center', angle: 90 });
  
  // Gebäude
  const gebX = gX + 30, gebY = gY + 25, gebW = 80, gebH = 50;
  pdf.setFillColor(200, 200, 200);
  pdf.setDrawColor(100, 100, 100);
  pdf.rect(gebX, gebY, gebW, gebH, 'FD');
  pdf.setFontSize(10);
  pdf.setTextColor(50, 50, 50);
  pdf.text('Wohngebäude', gebX + gebW/2, gebY + gebH/2 + 3, { align: 'center' });
  
  // PV-Fläche auf Dach
  const pvX = gebX + 10, pvY = gebY + 8, pvW = 60, pvH = 25;
  pdf.setFillColor(255, 150, 0);
  pdf.setDrawColor(200, 100, 0);
  pdf.rect(pvX, pvY, pvW, pvH, 'FD');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('PV-ANLAGE', pvX + pvW/2, pvY + 10, { align: 'center' });
  const modulAnzahl = data.step5.dachflaechen?.reduce((s, d) => s + d.modulAnzahl, 0) || 0;
  const kwp = data.step5.gesamtleistungKwp || (modulAnzahl * 0.4);
  pdf.text(`${modulAnzahl} Module / ${kwp.toFixed(2)} kWp`, pvX + pvW/2, pvY + 18, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
  
  // HAK
  const hakX = gX + gW/2, hakY = gY + gH - 5;
  pdf.setFillColor(200, 50, 50);
  pdf.rect(hakX - 5, hakY - 5, 10, 10, 'F');
  pdf.setFontSize(6);
  pdf.setTextColor(255, 255, 255);
  pdf.text('HAK', hakX, hakY + 2, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
  
  // Zähler im Gebäude
  const zX = gebX + 5, zY = gebY + gebH - 15;
  pdf.setFillColor(50, 100, 200);
  pdf.rect(zX, zY, 8, 10, 'F');
  pdf.setFontSize(5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Z', zX + 4, zY + 7, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
  
  // Straße
  pdf.setFillColor(120, 120, 120);
  pdf.rect(gX - 10, gY + gH + 2, gW + 20, 20, 'F');
  pdf.setFillColor(180, 180, 180);
  pdf.rect(gX - 10, gY + gH + 2, gW + 20, 5, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text(data.step2.strasse || 'Straße', gX + gW/2, gY + gH + 16, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
  
  // Nordpfeil
  const nX = W - 50, nY = 50;
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(0.5);
  pdf.circle(nX, nY, 12);
  pdf.setFillColor(200, 50, 50);
  pdf.triangle(nX, nY - 10, nX - 5, nY + 2, nX + 5, nY + 2, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(200, 50, 50);
  pdf.text('N', nX, nY - 15, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
  
  // Legende
  const legX = W - 80, legY = 80;
  pdf.setFillColor(250, 250, 250);
  pdf.setDrawColor(150, 150, 150);
  pdf.rect(legX, legY, 65, 70, 'FD');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Legende', legX + 32, legY + 10, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  
  // Legende Items
  pdf.setFillColor(255, 150, 0);
  pdf.rect(legX + 5, legY + 18, 12, 6, 'F');
  pdf.text('PV-Anlage', legX + 20, legY + 23);
  
  pdf.setFillColor(200, 50, 50);
  pdf.rect(legX + 5, legY + 30, 8, 6, 'F');
  pdf.text('HAK', legX + 20, legY + 35);
  
  pdf.setFillColor(50, 100, 200);
  pdf.rect(legX + 5, legY + 42, 8, 6, 'F');
  pdf.text('Zähler', legX + 20, legY + 47);
  
  pdf.setDrawColor(50, 120, 50);
  pdf.setLineWidth(1);
  pdf.setLineDashPattern([2, 1], 0);
  pdf.rect(legX + 5, legY + 54, 12, 6);
  pdf.setLineDashPattern([], 0);
  pdf.text('Grundstück', legX + 20, legY + 59);
  
  // Schriftfeld
  const sfY = H - 30;
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(0.3);
  pdf.rect(10, sfY, W - 20, 20);
  pdf.line(70, sfY, 70, sfY + 20);
  pdf.line(150, sfY, 150, sfY + 20);
  pdf.line(220, sfY, 220, sfY + 20);
  
  pdf.setFontSize(7);
  pdf.text('Bauherr:', 12, sfY + 6);
  pdf.setFont('helvetica', 'bold');
  pdf.text(kundenname || '-', 12, sfY + 14);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text('Standort:', 72, sfY + 6);
  pdf.text(`${data.step2.strasse} ${data.step2.hausnummer}, ${data.step2.plz} ${data.step2.ort}`, 72, sfY + 14);
  
  pdf.text('Maßstab:', 152, sfY + 6);
  pdf.text('ca. 1:200', 152, sfY + 14);
  
  pdf.text('Datum / Erstellt:', 222, sfY + 6);
  pdf.text(`${new Date().toLocaleDateString('de-DE')} / ${COMPANY.name}`, 222, sfY + 14);
  
  const blob = pdf.output('blob');
  const datum = new Date().toISOString().split('T')[0];
  return { 
    blob, 
    filename: `Lageplan_${kundenname.replace(/\s+/g, '_')}_${datum}.pdf` 
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HTML TO PDF (für Vollmacht, Projektmappe, VDE)
// ═══════════════════════════════════════════════════════════════════════════

export function htmlToPdf(
  htmlContent: string,
  config: { title: string; filename: string }
): { blob: Blob; filename: string } {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  pdf.setProperties({
    title: config.title,
    author: COMPANY.name,
  });
  
  // HTML zu Text extrahieren
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const text = doc.body.innerText || doc.body.textContent || '';
  
  // Text formatieren
  pdf.setFontSize(10);
  const lines = pdf.splitTextToSize(text, 180);
  let y = 20;
  
  for (const line of lines) {
    if (y > 280) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(line, 15, y);
    y += 5;
  }
  
  const blob = pdf.output('blob');
  return { blob, filename: config.filename };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { blobToFile };

export default {
  generateSchaltplanPDF,
  generateLageplanPDF,
  htmlToPdf,
  blobToFile,
};
