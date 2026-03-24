/**
 * Baunity PDF Generator
 * ==================
 * Konvertiert SVG/HTML Dokumente zu PDF
 * 
 * Nutzt jsPDF mit Canvas-Rendering für SVG
 */

import { jsPDF } from 'jspdf';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PDFConfig {
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'a3' | 'letter';
  margin?: number;
  title?: string;
  author?: string;
  subject?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SVG TO IMAGE (Canvas-basiert)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Konvertiert SVG zu Base64 PNG über Canvas
 */
async function svgToImageBase64(svgContent: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    // Hochauflösend für bessere PDF-Qualität
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);
    
    const img = new Image();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    };
    
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG: ' + e));
    };
    
    img.src = url;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SVG TO PDF
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Konvertiert SVG-String zu PDF Blob
 */
export async function svgToPdf(
  svgContent: string,
  config: PDFConfig = {}
): Promise<Blob> {
  const {
    orientation = 'landscape',
    format = 'a4',
    title = 'Baunity Dokument',
    author = 'LeCa GmbH & Co. KG',
  } = config;
  
  // PDF erstellen
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });
  
  // Metadaten setzen
  pdf.setProperties({
    title,
    author,
    subject: config.subject || 'Technische Dokumentation',
    creator: 'Baunity Wizard',
  });
  
  // SVG-Dimensionen aus Content extrahieren
  const widthMatch = svgContent.match(/width="(\d+)"/);
  const heightMatch = svgContent.match(/height="(\d+)"/);
  const svgWidth = widthMatch ? parseInt(widthMatch[1]) : 842;
  const svgHeight = heightMatch ? parseInt(heightMatch[1]) : 595;
  
  // PDF-Dimensionen (A4 Landscape in mm: 297 x 210)
  const pdfWidth = orientation === 'landscape' ? 297 : 210;
  const pdfHeight = orientation === 'landscape' ? 210 : 297;
  
  try {
    // SVG zu Bild konvertieren
    const imageDataUrl = await svgToImageBase64(svgContent, svgWidth, svgHeight);
    
    // Skalierung berechnen
    const margin = 5;
    const availableWidth = pdfWidth - 2 * margin;
    const availableHeight = pdfHeight - 2 * margin;
    
    const scaleX = availableWidth / (svgWidth / 2.835);  // px zu mm
    const scaleY = availableHeight / (svgHeight / 2.835);
    const scale = Math.min(scaleX, scaleY);
    
    const imgWidth = (svgWidth / 2.835) * scale;
    const imgHeight = (svgHeight / 2.835) * scale;
    
    // Zentriert platzieren
    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;
    
    // Bild einfügen
    pdf.addImage(imageDataUrl, 'PNG', x, y, imgWidth, imgHeight);
  } catch (e) {
    console.warn('SVG to image conversion failed:', e);
    // Fallback: Nur Text
    pdf.setFontSize(12);
    pdf.text('Dokument konnte nicht gerendert werden.', 10, 20);
    pdf.text('Bitte SVG-Datei direkt öffnen.', 10, 30);
  }
  
  return pdf.output('blob');
}

/**
 * Konvertiert SVG zu PDF und gibt als Base64 zurück
 */
export async function svgToPdfBase64(
  svgContent: string,
  config: PDFConfig = {}
): Promise<string> {
  const blob = await svgToPdf(svgContent, config);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// HTML TO PDF
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Konvertiert HTML zu PDF (einfache Text-Version)
 */
export async function htmlToPdf(
  htmlContent: string,
  config: PDFConfig = {}
): Promise<Blob> {
  const {
    orientation = 'portrait',
    format = 'a4',
    margin = 10,
    title = 'Baunity Dokument',
    author = 'LeCa GmbH & Co. KG',
  } = config;
  
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });
  
  pdf.setProperties({
    title,
    author,
    subject: config.subject || 'Dokumentation',
    creator: 'Baunity Wizard',
  });
  
  // HTML zu Text extrahieren
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const text = doc.body.innerText || doc.body.textContent || '';
  
  // PDF-Dimensionen
  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const pageHeight = orientation === 'landscape' ? 210 : 297;
  const contentWidth = pageWidth - 2 * margin;
  
  pdf.setFontSize(10);
  
  // Text umbrechen und einfügen
  const lines = pdf.splitTextToSize(text, contentWidth);
  let y = margin;
  const lineHeight = 5;
  
  for (const line of lines) {
    if (y > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += lineHeight;
  }
  
  return pdf.output('blob');
}

// ═══════════════════════════════════════════════════════════════════════════
// MULTI-PAGE PDF
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Erstellt PDF mit mehreren SVG-Seiten
 */
export async function multiPageSvgToPdf(
  svgPages: string[],
  config: PDFConfig = {}
): Promise<Blob> {
  const {
    orientation = 'landscape',
    format = 'a4',
    title = 'Baunity Dokumentation',
    author = 'LeCa GmbH & Co. KG',
  } = config;
  
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });
  
  pdf.setProperties({
    title,
    author,
    subject: config.subject,
    creator: 'Baunity Wizard',
  });
  
  const pdfWidth = orientation === 'landscape' ? 297 : 210;
  const pdfHeight = orientation === 'landscape' ? 210 : 297;
  const margin = 5;
  
  for (let i = 0; i < svgPages.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }
    
    const svgContent = svgPages[i];
    
    // SVG-Dimensionen extrahieren
    const widthMatch = svgContent.match(/width="(\d+)"/);
    const heightMatch = svgContent.match(/height="(\d+)"/);
    const svgWidth = widthMatch ? parseInt(widthMatch[1]) : 842;
    const svgHeight = heightMatch ? parseInt(heightMatch[1]) : 595;
    
    try {
      const imageDataUrl = await svgToImageBase64(svgContent, svgWidth, svgHeight);
      
      const availableWidth = pdfWidth - 2 * margin;
      const availableHeight = pdfHeight - 2 * margin;
      
      const scaleX = availableWidth / (svgWidth / 2.835);
      const scaleY = availableHeight / (svgHeight / 2.835);
      const scale = Math.min(scaleX, scaleY);
      
      const imgWidth = (svgWidth / 2.835) * scale;
      const imgHeight = (svgHeight / 2.835) * scale;
      
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;
      
      pdf.addImage(imageDataUrl, 'PNG', x, y, imgWidth, imgHeight);
    } catch (e) {
      console.warn(`Page ${i + 1} conversion failed:`, e);
      pdf.setFontSize(12);
      pdf.text(`Seite ${i + 1} konnte nicht gerendert werden.`, 10, 20);
    }
  }
  
  return pdf.output('blob');
}

// ═══════════════════════════════════════════════════════════════════════════
// FILE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Blob zu File konvertieren
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: 'application/pdf' });
}

/**
 * PDF herunterladen
 */
export async function downloadPdf(blob: Blob, filename: string): Promise<void> {
  const { downloadFile } = await import('@/utils/desktopDownload');
  await downloadFile({ filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`, blob, fileType: 'pdf' });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  svgToPdf,
  svgToPdfBase64,
  htmlToPdf,
  multiPageSvgToPdf,
  blobToFile,
  downloadPdf,
};
