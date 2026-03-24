/**
 * Baunity Projektmappe PDF Generator - ENDLEVEL PREMIUM
 * ===================================================
 * Professionelle Projektdokumentation
 */

import { jsPDF } from 'jspdf';
import type { WizardData } from '../../types/wizard.types';
import { COMPANY } from '../../types/wizard.types';

export function generateProjektmappePDF(data: WizardData): { blob: Blob; filename: string } {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const M = 18;
  const kundenname = `${data.step6?.vorname || ''} ${data.step6?.nachname || ''}`.trim();
  const adresse = `${data.step2?.strasse || ''} ${data.step2?.hausnummer || ''}, ${data.step2?.plz || ''} ${data.step2?.ort || ''}`;
  const datum = new Date().toLocaleDateString('de-DE');
  
  pdf.setProperties({
    title: `Projektmappe - ${kundenname}`,
    author: COMPANY.name,
    subject: 'PV-Anlage Projektdokumentation',
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SEITE 1: DECKBLATT - PREMIUM DESIGN
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Dunkelblauer Header (volle Breite)
  pdf.setFillColor(15, 35, 60);
  pdf.rect(0, 0, W, 85, 'F');
  
  // Diagonaler Akzent
  pdf.setFillColor(0, 180, 120);
  pdf.triangle(W - 80, 0, W, 0, W, 50, 'F');
  
  // Baunity Logo
  pdf.setFontSize(42);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Baunity', M, 40);
  
  // Tagline
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(150, 180, 200);
  pdf.text('Netzanmeldung • Service • Dokumentation', M, 55);
  
  // Dokumenttyp Badge
  pdf.setFillColor(0, 180, 120);
  pdf.roundedRect(M, 65, 55, 10, 2, 2, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('PROJEKTMAPPE', M + 27.5, 72, { align: 'center' });
  
  // Akzentlinie
  pdf.setFillColor(0, 180, 120);
  pdf.rect(0, 85, W, 4, 'F');

  // Kunden-Info Card
  let y = 100;
  
  pdf.setFillColor(250, 252, 255);
  pdf.setDrawColor(220, 230, 240);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(M, y, W - 2*M, 45, 4, 4, 'FD');
  
  // Kundenname groß
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 50, 70);
  pdf.text(kundenname, W/2, y + 18, { align: 'center' });
  
  // Adresse
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 100, 120);
  pdf.text(adresse, W/2, y + 30, { align: 'center' });
  
  // Datum
  pdf.setFontSize(9);
  pdf.setTextColor(120, 140, 160);
  pdf.text(`Erstellt am ${datum}`, W/2, y + 40, { align: 'center' });

  y += 60;

  // ═══════════════════════════════════════════════════════════════════════════
  // ANLAGEN-HIGHLIGHTS (4 Kacheln)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const modulAnzahl = data.step5?.dachflaechen?.reduce((s, d) => s + (Number(d.modulAnzahl) || 0), 0) || 0;
  const kwp = Number(data.step5?.gesamtleistungKwp) || 
    (data.step5?.dachflaechen?.reduce((s, d) => s + ((Number(d.modulAnzahl) || 0) * (Number(d.modulLeistungWp) || 400) / 1000), 0)) || 0;
  const speicherKwh = data.step5?.speicher?.reduce((s, sp) => s + (Number(sp.kapazitaetKwh) || 0) * (Number(sp.anzahl) || 1), 0) || 0;
  const einspeiseart = data.step5?.einspeiseart === 'volleinspeisung' ? 'Volleinspeisung' : 'Überschusseinspeisung';
  
  const tileW = (W - 2*M - 10) / 2;
  const tileH = 35;
  
  // Tile 1: PV-Leistung
  pdf.setFillColor(0, 180, 120);
  pdf.roundedRect(M, y, tileW, tileH, 3, 3, 'F');
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(`${kwp.toFixed(2)}`, M + 10, y + 22);
  pdf.setFontSize(12);
  pdf.text('kWp', M + tileW - 20, y + 22);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('PV-Leistung', M + 10, y + 30);
  
  // Tile 2: Module
  pdf.setFillColor(15, 35, 60);
  pdf.roundedRect(M + tileW + 10, y, tileW, tileH, 3, 3, 'F');
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(`${modulAnzahl}`, M + tileW + 20, y + 22);
  pdf.setFontSize(12);
  pdf.text('Stk', M + 2*tileW - 5, y + 22);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('PV-Module', M + tileW + 20, y + 30);
  
  y += tileH + 8;
  
  // Tile 3: Speicher
  if (speicherKwh > 0) {
    pdf.setFillColor(60, 100, 140);
  } else {
    pdf.setFillColor(200, 210, 220);
  }
  pdf.roundedRect(M, y, tileW, tileH, 3, 3, 'F');
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(speicherKwh > 0 ? `${speicherKwh.toFixed(1)}` : '—', M + 10, y + 22);
  pdf.setFontSize(12);
  if (speicherKwh > 0) pdf.text('kWh', M + tileW - 20, y + 22);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Speicher', M + 10, y + 30);
  
  // Tile 4: Einspeiseart
  pdf.setFillColor(100, 80, 140);
  pdf.roundedRect(M + tileW + 10, y, tileW, tileH, 3, 3, 'F');
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(einspeiseart, M + tileW + 20, y + 20);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Einspeiseart', M + tileW + 20, y + 30);

  y += tileH + 15;

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER DECKBLATT
  // ═══════════════════════════════════════════════════════════════════════════
  
  pdf.setDrawColor(200, 210, 220);
  pdf.setLineWidth(0.3);
  pdf.line(M, H - 25, W - M, H - 25);
  
  pdf.setFontSize(9);
  pdf.setTextColor(100, 120, 140);
  pdf.setFont('helvetica', 'bold');
  pdf.text(COMPANY.name, W/2, H - 18, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text(`${COMPANY.strasse} | ${COMPANY.plz} ${COMPANY.ort} | ${COMPANY.telefon}`, W/2, H - 12, { align: 'center' });

  // ═══════════════════════════════════════════════════════════════════════════
  // SEITE 2: TECHNISCHE DATEN
  // ═══════════════════════════════════════════════════════════════════════════
  
  pdf.addPage();
  
  // Header
  pdf.setFillColor(15, 35, 60);
  pdf.rect(0, 0, W, 25, 'F');
  pdf.setFillColor(0, 180, 120);
  pdf.rect(0, 25, W, 2, 'F');
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('TECHNISCHE DATEN', M, 17);
  
  pdf.setFontSize(8);
  pdf.setTextColor(0, 180, 120);
  pdf.text(`${kundenname}`, W - M, 17, { align: 'right' });
  
  y = 38;

  // ═══════════════════════════════════════════════════════════════════════════
  // PV-MODULE
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Section Header
  pdf.setFillColor(240, 248, 255);
  pdf.setDrawColor(0, 180, 120);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(M, y, W - 2*M, 10, 2, 2, 'FD');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 35, 60);
  pdf.text('PV-MODULE', M + 5, y + 7);
  
  y += 14;
  
  // Dachflächen
  const dachflaechen = data.step5?.dachflaechen || [];
  dachflaechen.forEach((df, i) => {
    const dfName = df.name || `Dachfläche ${i + 1}`;
    const wp = Number(df.modulLeistungWp) || 400;
    const anzahl = Number(df.modulAnzahl) || 0;
    const dfKwp = (wp * anzahl / 1000).toFixed(2);
    
    pdf.setFillColor(250, 252, 255);
    pdf.setDrawColor(230, 235, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(M, y, W - 2*M, 28, 2, 2, 'FD');
    
    // Name
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 50, 70);
    pdf.text(dfName, M + 5, y + 8);
    
    // Details
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 100, 120);
    
    const hersteller = df.modulHersteller || 'N/A';
    const modell = df.modulModell || '';
    pdf.text(`${hersteller} ${modell}`.trim(), M + 5, y + 16);
    pdf.text(`${wp} Wp × ${anzahl} = ${dfKwp} kWp`, M + 5, y + 23);
    
    // Ausrichtung
    const ausrichtung = df.ausrichtung || 'S';
    const neigung = df.neigung || 35;
    pdf.setTextColor(0, 180, 120);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${ausrichtung} / ${neigung}°`, W - M - 5, y + 16, { align: 'right' });
    
    y += 32;
  });
  
  if (dachflaechen.length === 0) {
    pdf.setFontSize(9);
    pdf.setTextColor(150, 160, 170);
    pdf.text('Keine Dachflächen definiert', M + 5, y + 5);
    y += 15;
  }

  y += 5;

  // ═══════════════════════════════════════════════════════════════════════════
  // WECHSELRICHTER
  // ═══════════════════════════════════════════════════════════════════════════
  
  pdf.setFillColor(240, 248, 255);
  pdf.setDrawColor(15, 35, 60);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(M, y, W - 2*M, 10, 2, 2, 'FD');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 35, 60);
  pdf.text('WECHSELRICHTER', M + 5, y + 7);
  
  y += 14;
  
  const wechselrichter = data.step5?.wechselrichter || [];
  wechselrichter.forEach((wr, i) => {
    const kva = Number(wr.leistungKva) || 0;
    const anzahl = Number(wr.anzahl) || 1;
    
    pdf.setFillColor(250, 252, 255);
    pdf.setDrawColor(230, 235, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(M, y, W - 2*M, 18, 2, 2, 'FD');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 50, 70);
    pdf.text(`${i + 1}. ${wr.hersteller || 'N/A'} ${wr.modell || ''}`, M + 5, y + 8);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 100, 120);
    pdf.text(`${kva} kVA × ${anzahl}`, M + 5, y + 14);
    
    y += 22;
  });
  
  if (wechselrichter.length === 0) {
    pdf.setFontSize(9);
    pdf.setTextColor(150, 160, 170);
    pdf.text('Keine Wechselrichter definiert', M + 5, y + 5);
    y += 15;
  }

  y += 5;

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEICHER
  // ═══════════════════════════════════════════════════════════════════════════
  
  const speicher = data.step5?.speicher || [];
  if (speicher.length > 0) {
    pdf.setFillColor(240, 248, 255);
    pdf.setDrawColor(60, 100, 140);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(M, y, W - 2*M, 10, 2, 2, 'FD');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 35, 60);
    pdf.text('BATTERIESPEICHER', M + 5, y + 7);
    
    y += 14;
    
    speicher.forEach((sp, i) => {
      const kwh = Number(sp.kapazitaetKwh) || 0;
      const anzahl = Number(sp.anzahl) || 1;
      
      pdf.setFillColor(250, 252, 255);
      pdf.setDrawColor(230, 235, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(M, y, W - 2*M, 18, 2, 2, 'FD');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 50, 70);
      pdf.text(`${i + 1}. ${sp.hersteller || 'N/A'} ${sp.modell || ''}`, M + 5, y + 8);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 100, 120);
      pdf.text(`${kwh} kWh × ${anzahl}`, M + 5, y + 14);
      
      y += 22;
    });
    
    y += 5;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NETZANSCHLUSS
  // ═══════════════════════════════════════════════════════════════════════════
  
  pdf.setFillColor(240, 248, 255);
  pdf.setDrawColor(100, 80, 140);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(M, y, W - 2*M, 10, 2, 2, 'FD');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 35, 60);
  pdf.text('NETZANSCHLUSS', M + 5, y + 7);
  
  y += 14;
  
  pdf.setFillColor(250, 252, 255);
  pdf.setDrawColor(230, 235, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(M, y, W - 2*M, 35, 2, 2, 'FD');
  
  const netzbetreiber = data.step4?.netzbetreiberName || 'N/A';
  const zaehler = data.step4?.zaehlernummer || 'Wird vom NB vergeben';
  const maxEinspeisung = (kwp * 0.7).toFixed(2);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 100, 120);
  
  pdf.text('Netzbetreiber:', M + 5, y + 8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 50, 70);
  pdf.text(netzbetreiber, M + 45, y + 8);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 100, 120);
  pdf.text('Zählernummer:', M + 5, y + 16);
  pdf.setTextColor(30, 50, 70);
  pdf.text(zaehler, M + 45, y + 16);
  
  pdf.setTextColor(80, 100, 120);
  pdf.text('Anschlussart:', M + 5, y + 24);
  pdf.setTextColor(30, 50, 70);
  pdf.text('3-phasig, 400V/230V', M + 45, y + 24);
  
  pdf.setTextColor(80, 100, 120);
  pdf.text('Max. Einspeisung:', M + 5, y + 32);
  pdf.setTextColor(0, 180, 120);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${maxEinspeisung} kW (70% Abregelung)`, M + 45, y + 32);

  // Footer Seite 2
  pdf.setFontSize(7);
  pdf.setTextColor(150, 160, 170);
  pdf.text(`Projektmappe ${kundenname} | Seite 2`, W/2, H - 10, { align: 'center' });

  // ═══════════════════════════════════════════════════════════════════════════
  // SEITE 3: WIRTSCHAFTLICHKEIT
  // ═══════════════════════════════════════════════════════════════════════════
  
  pdf.addPage();
  
  // Header
  pdf.setFillColor(15, 35, 60);
  pdf.rect(0, 0, W, 25, 'F');
  pdf.setFillColor(0, 180, 120);
  pdf.rect(0, 25, W, 2, 'F');
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('WIRTSCHAFTLICHKEIT & ERTRAG', M, 17);
  
  pdf.setFontSize(8);
  pdf.setTextColor(0, 180, 120);
  pdf.text(`${kundenname}`, W - M, 17, { align: 'right' });
  
  y = 40;

  // Berechnungen
  const spezErtrag = 950; // kWh/kWp
  const jahresertrag = Math.round(kwp * spezErtrag);
  const eigenverbrauch = 0.30;
  const netzeinspeisung = 0.70;
  const strompreis = 0.35; // €/kWh
  const verguetung = 0.081; // €/kWh
  
  const ersparnisEigen = Math.round(jahresertrag * eigenverbrauch * strompreis);
  const ersparnisEinspeisung = Math.round(jahresertrag * netzeinspeisung * verguetung);
  const gesamtErsparnis = ersparnisEigen + ersparnisEinspeisung;
  const investition = Math.round(kwp * 1400);
  const amortisation = (investition / gesamtErsparnis).toFixed(1);

  // ═══════════════════════════════════════════════════════════════════════════
  // ERTRAGSPROGNOSE
  // ═══════════════════════════════════════════════════════════════════════════
  
  pdf.setFillColor(240, 255, 245);
  pdf.setDrawColor(0, 180, 120);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(M, y, W - 2*M, 10, 2, 2, 'FD');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 35, 60);
  pdf.text('ERTRAGSPROGNOSE', M + 5, y + 7);
  
  y += 15;
  
  // 3 Highlight-Boxen
  const boxW = (W - 2*M - 20) / 3;
  
  // Box 1: Jahresertrag
  pdf.setFillColor(0, 180, 120);
  pdf.roundedRect(M, y, boxW, 40, 3, 3, 'F');
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(`${jahresertrag.toLocaleString('de-DE')}`, M + boxW/2, y + 20, { align: 'center' });
  pdf.setFontSize(10);
  pdf.text('kWh/Jahr', M + boxW/2, y + 30, { align: 'center' });
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Erwarteter Ertrag', M + boxW/2, y + 37, { align: 'center' });
  
  // Box 2: Eigenverbrauch
  pdf.setFillColor(60, 100, 140);
  pdf.roundedRect(M + boxW + 10, y, boxW, 40, 3, 3, 'F');
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(`${Math.round(eigenverbrauch * 100)}%`, M + boxW + 10 + boxW/2, y + 20, { align: 'center' });
  pdf.setFontSize(10);
  pdf.text(`${Math.round(jahresertrag * eigenverbrauch).toLocaleString('de-DE')} kWh`, M + boxW + 10 + boxW/2, y + 30, { align: 'center' });
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Eigenverbrauch', M + boxW + 10 + boxW/2, y + 37, { align: 'center' });
  
  // Box 3: Einspeisung
  pdf.setFillColor(100, 80, 140);
  pdf.roundedRect(M + 2*boxW + 20, y, boxW, 40, 3, 3, 'F');
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(`${Math.round(netzeinspeisung * 100)}%`, M + 2*boxW + 20 + boxW/2, y + 20, { align: 'center' });
  pdf.setFontSize(10);
  pdf.text(`${Math.round(jahresertrag * netzeinspeisung).toLocaleString('de-DE')} kWh`, M + 2*boxW + 20 + boxW/2, y + 30, { align: 'center' });
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Netzeinspeisung', M + 2*boxW + 20 + boxW/2, y + 37, { align: 'center' });
  
  y += 55;

  // ═══════════════════════════════════════════════════════════════════════════
  // WIRTSCHAFTLICHKEIT
  // ═══════════════════════════════════════════════════════════════════════════
  
  pdf.setFillColor(240, 248, 255);
  pdf.setDrawColor(15, 35, 60);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(M, y, W - 2*M, 10, 2, 2, 'FD');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 35, 60);
  pdf.text('WIRTSCHAFTLICHKEITSBERECHNUNG', M + 5, y + 7);
  
  y += 15;
  
  // Tabelle
  pdf.setFillColor(250, 252, 255);
  pdf.setDrawColor(230, 235, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(M, y, W - 2*M, 60, 3, 3, 'FD');
  
  const rowH = 12;
  let rowY = y + 5;
  
  const drawRow = (label: string, value: string, highlight = false) => {
    if (highlight) {
      pdf.setFillColor(240, 255, 245);
      pdf.rect(M + 2, rowY - 3, W - 2*M - 4, rowH, 'F');
    }
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 100, 120);
    pdf.text(label, M + 8, rowY + 4);
    pdf.setFont('helvetica', 'bold');
    if (highlight) {
      pdf.setTextColor(0, 150, 100);
    } else {
      pdf.setTextColor(30, 50, 70);
    }
    pdf.text(value, W - M - 8, rowY + 4, { align: 'right' });
    rowY += rowH;
  };
  
  drawRow('Ersparnis Eigenverbrauch', `${ersparnisEigen.toLocaleString('de-DE')} €/Jahr`);
  drawRow('Einspeisevergütung', `${ersparnisEinspeisung.toLocaleString('de-DE')} €/Jahr`);
  drawRow('Jährliche Ersparnis gesamt', `${gesamtErsparnis.toLocaleString('de-DE')} €/Jahr`, true);
  drawRow('Geschätzte Investition', `${investition.toLocaleString('de-DE')} €`);
  drawRow('Amortisationszeit', `ca. ${amortisation} Jahre`, true);
  
  y += 70;

  // Hinweis
  pdf.setFillColor(255, 250, 240);
  pdf.setDrawColor(255, 200, 100);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(M, y, W - 2*M, 25, 2, 2, 'FD');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(150, 100, 50);
  pdf.text('Hinweis', M + 5, y + 8);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('Die Berechnungen sind Schätzungen basierend auf Durchschnittswerten. Tatsächliche Erträge können je nach', M + 5, y + 14);
  pdf.text('Standort, Wetter und Verbrauchsverhalten abweichen. Strompreisänderungen wurden nicht berücksichtigt.', M + 5, y + 20);

  // Footer
  pdf.setFontSize(7);
  pdf.setTextColor(150, 160, 170);
  pdf.text(`Projektmappe ${kundenname} | Seite 3`, W/2, H - 10, { align: 'center' });
  pdf.text(`${COMPANY.name} | ${datum}`, W/2, H - 5, { align: 'center' });

  const blob = pdf.output('blob');
  return { 
    blob, 
    filename: `Projektmappe_${kundenname.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf` 
  };
}
