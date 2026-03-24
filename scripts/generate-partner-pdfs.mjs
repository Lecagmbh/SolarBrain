/**
 * Generates Partner PDFs: Company presentation + Checklist
 * Run: node scripts/generate-partner-pdfs.mjs
 */
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public/downloads');

const BLUE = '#1e40af';
const BLUE_LIGHT = '#3b82f6';
const DARK = '#0f172a';
const GRAY = '#64748b';
const TEXT = '#1e293b';
const WHITE = '#ffffff';
const GREEN = '#16a34a';

function drawHeader(doc, title, subtitle) {
  doc.save();
  doc.rect(0, 0, doc.page.width, 90).fill(DARK);
  doc.rect(0, 86, doc.page.width, 4).fill(BLUE_LIGHT);
  doc.roundedRect(36, 20, 40, 40, 8).fill(BLUE_LIGHT);
  doc.fontSize(15).font('Helvetica-Bold').fillColor(WHITE).text('GN', 36, 32, { width: 40, align: 'center' });
  doc.fontSize(20).font('Helvetica-Bold').fillColor(WHITE).text(title, 90, 24);
  doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text(subtitle, 90, 50);
  doc.restore();
  doc.fillColor(TEXT);
  doc.y = 108;
}

function footer(doc) {
  doc.save();
  doc.fontSize(7).font('Helvetica').fillColor('#a0aec0')
    .text('GridNetz LLC  |  info@gridnetz.de  |  www.gridnetz.de', 0, doc.page.height - 28, { width: doc.page.width, align: 'center' });
  doc.restore();
}

function heading(doc, text) {
  doc.moveDown(0.4);
  const y = doc.y;
  doc.save();
  doc.rect(40, y, 3, 16).fill(BLUE_LIGHT);
  doc.restore();
  doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK).text(text, 52, y + 1);
  doc.moveDown(0.4);
}

function bullet(doc, text) {
  const y = doc.y;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BLUE_LIGHT).text('•', 48, y);
  doc.fontSize(9).font('Helvetica').fillColor(TEXT).text(text, 58, y, { width: 470 });
  doc.moveDown(0.1);
}

function check(doc, text, indent = 58) {
  const y = doc.y;
  doc.save();
  doc.roundedRect(indent - 14, y + 1, 9, 9, 1.5).lineWidth(0.7).strokeColor(BLUE_LIGHT).stroke();
  doc.fontSize(6.5).font('Helvetica-Bold').fillColor(GREEN).text('✓', indent - 13, y + 2.5);
  doc.restore();
  doc.fontSize(9).font('Helvetica').fillColor(TEXT).text(text, indent, y, { width: 460 });
  doc.moveDown(0.1);
}

function subheading(doc, text, indent = 52) {
  doc.fontSize(9).font('Helvetica-Bold').fillColor(TEXT).text(text, indent, doc.y);
  doc.moveDown(0.1);
}

// ═══════════════════════════════════════
// PDF 1: Partnerprogramm Info
// ═══════════════════════════════════════
function generatePartnerInfo() {
  return new Promise((ok) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = createWriteStream(resolve(OUT_DIR, 'GridNetz-Partnerprogramm-Info.pdf'));
    doc.pipe(stream);

    drawHeader(doc, 'Partnerprogramm', 'Informationen für Elektrofachbetriebe & Handelsvertreter');

    doc.fontSize(9.5).font('Helvetica').fillColor(GRAY)
      .text('GridNetz übernimmt den kompletten Netzanmeldungsprozess für PV-Anlagen, Batteriespeicher und Wallboxen. Als Partner konzentrieren Sie sich auf Ihr Kerngeschäft — wir kümmern uns um den Rest.', 52, doc.y, { width: 475 });
    doc.moveDown(0.6);

    heading(doc, 'Was wir für Sie übernehmen');
    bullet(doc, 'Erstellung aller erforderlichen Dokumente (Schaltplan, Lageplan, VDE-Formulare, Vollmacht, IBN-Protokoll)');
    bullet(doc, 'Einreichung beim zuständigen Netzbetreiber');
    bullet(doc, 'Beantwortung von NB-Rückfragen und Korrekturen');
    bullet(doc, 'Aktive Statusverfolgung bis zur finalen Genehmigung');
    bullet(doc, 'MaStR-Registrierung (Marktstammdatenregister)');
    bullet(doc, 'Inbetriebnahme-Meldung');

    heading(doc, 'Abgedeckte Anlagentypen');
    bullet(doc, 'PV-Anlagen — Netzanmeldung für Photovoltaik aller Größen');
    bullet(doc, 'Batteriespeicher — Neuinstallation und Nachrüstung');
    bullet(doc, 'Wallboxen — Anmeldepflichtige Ladestationen (> 11 kW)');
    bullet(doc, 'Kombianlagen — PV + Speicher + Wallbox in einem Vorgang');

    heading(doc, 'So funktioniert die Zusammenarbeit');
    const steps = [
      ['1', 'SIE', BLUE_LIGHT, 'Anlagendaten übermitteln — per Portal, WhatsApp oder Excel-Liste'],
      ['2', 'WIR', '#6366f1', 'Alle erforderlichen Unterlagen automatisiert erstellen und prüfen'],
      ['3', 'WIR', '#6366f1', 'Beim Netzbetreiber einreichen und Rückfragen klären'],
      ['4', 'WIR', '#6366f1', 'Status aktiv nachverfolgen und Sie laufend informieren'],
      ['5', 'FERTIG', GREEN, 'Genehmigung erhalten — Dokumente stehen im Portal zum Download bereit'],
    ];
    for (const [num, badge, color, text] of steps) {
      const y = doc.y;
      doc.save();
      doc.circle(58, y + 6, 8).lineWidth(1.2).strokeColor(BLUE_LIGHT).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor(BLUE_LIGHT).text(num, 53, y + 2);
      doc.roundedRect(72, y - 1, 38, 14, 3).fill(color);
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor(WHITE).text(badge, 72, y + 3, { width: 38, align: 'center' });
      doc.restore();
      doc.fontSize(9).font('Helvetica').fillColor(TEXT).text(text, 118, y + 1, { width: 400 });
      doc.moveDown(0.35);
    }

    heading(doc, 'Ihr Portal-Zugang');
    bullet(doc, 'Echtzeit-Status aller Anlagen auf einen Blick');
    bullet(doc, 'Fertige Dokumente zum Download');
    bullet(doc, 'WhatsApp-Datenerfassung mit KI-Unterstützung');
    bullet(doc, 'Persönlicher Ansprechpartner');
    bullet(doc, 'Keine Vertragsbindung — monatliche Abrechnung');

    heading(doc, 'GridNetz in Zahlen');
    const stats = [
      ['850+', 'deutsche Netzbetreiber abgedeckt'],
      ['15.000+', 'Produkte in der Datenbank (Module, Wechselrichter, Speicher, Wallboxen)'],
      ['2–5 Tage', 'durchschnittliche Bearbeitungszeit'],
      ['98%', 'Erstgenehmigungsquote'],
    ];
    for (const [val, label] of stats) {
      const y = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').fillColor(BLUE_LIGHT).text(val, 52, y, { width: 75 });
      doc.fontSize(9).font('Helvetica').fillColor(GRAY).text(label, 132, y + 1, { width: 390 });
      doc.moveDown(0.25);
    }

    heading(doc, 'Konditionen');
    doc.fontSize(9).font('Helvetica').fillColor(GRAY)
      .text('Unsere Preise richten sich nach dem monatlichen Anlagenvolumen und werden individuell vereinbart. Es gibt keine Vertragsbindung, keine Setup-Gebühr und keine Mindestmenge. Abrechnung erfolgt monatlich.', 52, doc.y, { width: 475 });
    doc.moveDown(0.4);
    doc.fontSize(9).font('Helvetica').fillColor(GRAY).text('Für ein persönliches Angebot kontaktieren Sie uns:', 52, doc.y);
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(BLUE).text('info@gridnetz.de  |  www.gridnetz.de/partner', 52, doc.y);

    doc.end();
    stream.on('finish', () => { console.log('✓ GridNetz-Partnerprogramm-Info.pdf'); ok(); });
  });
}

// ═══════════════════════════════════════
// PDF 2: Unterlagen-Checkliste
// ═══════════════════════════════════════
function generateCheckliste() {
  return new Promise((ok) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = createWriteStream(resolve(OUT_DIR, 'GridNetz-Unterlagen-Checkliste.pdf'));
    doc.pipe(stream);

    drawHeader(doc, 'Unterlagen-Checkliste', 'Diese Daten benötigen wir für die Netzanmeldung');

    doc.fontSize(9).font('Helvetica').fillColor(GRAY)
      .text('Je vollständiger Ihre Angaben, desto schneller die Bearbeitung. Pflichtangaben sind mit (*) gekennzeichnet.', 52, doc.y, { width: 475 });
    doc.moveDown(0.6);

    heading(doc, 'Kundendaten (Anlagenbetreiber)');
    check(doc, 'Name, Vorname *');
    check(doc, 'Firma (falls gewerblich)');
    check(doc, 'Straße, Hausnummer des Installationsorts *');
    check(doc, 'PLZ, Ort *');
    check(doc, 'Telefon *');
    check(doc, 'E-Mail-Adresse *');
    check(doc, 'Geburtsdatum (bei natürlichen Personen, für MaStR)');
    check(doc, 'Zählernummer / Zählpunkt (falls vorhanden)');
    check(doc, 'Marktlokations-ID (falls bekannt)');

    heading(doc, 'Anlagenkomponenten');
    subheading(doc, 'PV-Module:');
    check(doc, 'Hersteller *', 68);
    check(doc, 'Typ / Modellbezeichnung *', 68);
    check(doc, 'Leistung pro Modul in Wp *', 68);
    check(doc, 'Anzahl Module *', 68);
    doc.moveDown(0.15);

    subheading(doc, 'Wechselrichter:');
    check(doc, 'Hersteller *', 68);
    check(doc, 'Typ / Modellbezeichnung *', 68);
    check(doc, 'Anzahl *', 68);
    check(doc, 'AC-Leistung in kW (falls bekannt)', 68);
    doc.moveDown(0.15);

    subheading(doc, 'Batteriespeicher (falls vorhanden):');
    check(doc, 'Hersteller', 68);
    check(doc, 'Typ / Modellbezeichnung', 68);
    check(doc, 'Nutzbare Kapazität in kWh', 68);
    check(doc, 'Lade-/Entladeleistung in kW', 68);
    doc.moveDown(0.15);

    subheading(doc, 'Wallbox / Ladestation (falls vorhanden):');
    check(doc, 'Hersteller', 68);
    check(doc, 'Typ / Modellbezeichnung', 68);
    check(doc, 'Ladeleistung in kW', 68);

    heading(doc, 'Technische Angaben');
    check(doc, 'Art der Einspeisung: Volleinspeisung oder Überschusseinspeisung *');
    check(doc, 'Gewünschter Inbetriebnahme-Termin *');
    check(doc, 'Zählerplatz-Situation (z.B. Zählerschrank-Typ, Platz für Zähler)');
    check(doc, 'Vorhandene Erzeugungsanlagen (falls Erweiterung / Zubau)');
    check(doc, 'Netzanschluss-Situation (z.B. HAK-Lage, Absicherung)');
    check(doc, 'Unterzähler vorhanden? (für Eigenverbrauch / Wallbox)');

    heading(doc, 'Optional (beschleunigt die Bearbeitung)');
    check(doc, 'Lageplan / Grundriss mit eingezeichneter Anlage');
    check(doc, 'Foto Zählerschrank (frontal, geöffnet)');
    check(doc, 'Foto Hausanschlusskasten (HAK)');
    check(doc, 'Bisherige Korrespondenz mit dem Netzbetreiber');
    check(doc, 'Angebots- oder Planungsdokument mit Stringbelegung');
    check(doc, 'EFK-Unterschrift (digital als PNG/JPEG)');

    // Info box
    doc.moveDown(0.5);
    const bx = 42, by = doc.y, bw = doc.page.width - 84, bh = 45;
    doc.save();
    doc.roundedRect(bx, by, bw, bh, 5).lineWidth(0.8).strokeColor(BLUE_LIGHT).stroke();
    doc.restore();
    doc.fontSize(9).font('Helvetica-Bold').fillColor(BLUE).text('Datenübermittlung', 55, by + 8);
    doc.fontSize(8).font('Helvetica').fillColor(GRAY)
      .text('Sie können die Daten über unser Web-Portal, per WhatsApp oder als Excel-Liste an uns übermitteln. Bei Fragen hilft Ihnen Ihr persönlicher Ansprechpartner: info@gridnetz.de', 55, by + 22, { width: bw - 30 });

    doc.end();
    stream.on('finish', () => { console.log('✓ GridNetz-Unterlagen-Checkliste.pdf'); ok(); });
  });
}

await generatePartnerInfo();
await generateCheckliste();
console.log('\nFertig!');
