import type { WizardData } from '../../../types/wizard.types';
import { COMPANY } from '../../../types/wizard.types';

export interface VollmachtData {
  betreiberName: string; betreiberAdresse: string; anlagenAdresse: string; anlagenTyp: string;
  anlagenLeistung: string; netzbetreiberName: string; ist14aRelevant: boolean; signaturBase64?: string; ort: string; datum: string;
}

export function extractVollmachtData(data: WizardData): VollmachtData {
  const k = data.step1.komponenten;
  const typen: string[] = [];
  if (k.includes('pv')) typen.push('PV');
  if (k.includes('speicher')) typen.push('Speicher');
  if (k.includes('wallbox')) typen.push('Wallbox');
  if (k.includes('waermepumpe')) typen.push('Wärmepumpe');
  return {
    betreiberName: `${data.step6.vorname} ${data.step6.nachname}`,
    betreiberAdresse: `${data.step2.strasse} ${data.step2.hausnummer}, ${data.step2.plz} ${data.step2.ort}`,
    anlagenAdresse: `${data.step2.strasse} ${data.step2.hausnummer}, ${data.step2.plz} ${data.step2.ort}`,
    anlagenTyp: typen.join(' + ') || 'Anlage', anlagenLeistung: data.step5.gesamtleistungKwp ? `${data.step5.gesamtleistungKwp.toFixed(2)} kWp` : '-',
    netzbetreiberName: data.step4.netzbetreiberName || 'Netzbetreiber', ist14aRelevant: data.step5.paragraph14a?.relevant || false,
    signaturBase64: data.step8.signatur, ort: data.step2.ort, datum: new Date().toLocaleDateString('de-DE'),
  };
}

export function generateVollmachtHTML(d: VollmachtData): string {
  // Zeitstempel für E-Signatur
  const now = new Date();
  const timestamp = now.toLocaleString('de-DE', { 
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const signaturId = `BAUNITY-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
  
  const hasSignature = !!d.signaturBase64;
  
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Vollmacht</title>
<style>
body{font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.6;color:#333;}
h1{text-align:center;color:#1e40af;margin-bottom:5px;}
.subtitle{text-align:center;color:#666;margin-bottom:30px;}
.box{background:#f0fdf9;border-left:4px solid #10b981;padding:15px;margin:15px 0;border-radius:0 8px 8px 0;}
.section-title{font-weight:bold;color:#059669;margin-bottom:10px;}
.signature-area{margin-top:30px;padding:20px;background:#fafafa;border-radius:8px;}
.signature-img{max-width:250px;max-height:100px;border-bottom:2px solid #333;}
.signature-line{border-bottom:2px solid #333;width:250px;height:60px;}
.signature-label{font-size:11px;color:#666;margin-top:5px;}
.e-signature-notice{margin-top:20px;padding:15px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #93c5fd;border-radius:8px;}
.e-signature-notice h4{margin:0 0 10px 0;color:#1e40af;font-size:13px;}
.e-signature-notice p{margin:0;font-size:11px;color:#1e3a8a;line-height:1.5;}
.e-signature-id{font-family:monospace;background:#bfdbfe;padding:2px 6px;border-radius:4px;}
.legal-notice{margin-top:30px;padding:15px;background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;font-size:10px;color:#92400e;}
.footer{margin-top:40px;text-align:center;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:20px;}
</style></head><body>

<h1>VOLLMACHT</h1>
<p class="subtitle">zur Netzanmeldung einer Erzeugungsanlage</p>

<p>Hiermit bevollmächtige ich,</p>

<div class="box">
  <div class="section-title">Vollmachtgeber (Anlagenbetreiber):</div>
  <strong>${d.betreiberName}</strong><br>
  ${d.betreiberAdresse}
</div>

<p>die nachstehend genannte Firma,</p>

<div class="box">
  <div class="section-title">Bevollmächtigter:</div>
  <strong>${COMPANY.name}</strong><br>
  ${COMPANY.strasse}<br>
  ${COMPANY.plz} ${COMPANY.ort}
</div>

<p>zur vollständigen Durchführung der Netzanmeldung für folgende Anlage:</p>

<div class="box">
  <div class="section-title">Anlageninformationen:</div>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:5px 0;width:140px;"><strong>Standort:</strong></td><td>${d.anlagenAdresse}</td></tr>
    <tr><td style="padding:5px 0;"><strong>Anlagentyp:</strong></td><td>${d.anlagenTyp}</td></tr>
    <tr><td style="padding:5px 0;"><strong>Leistung:</strong></td><td>${d.anlagenLeistung}</td></tr>
    <tr><td style="padding:5px 0;"><strong>Netzbetreiber:</strong></td><td>${d.netzbetreiberName}</td></tr>
  </table>
</div>

<p><strong>Umfang der Vollmacht:</strong></p>
<ul style="margin:10px 0;padding-left:20px;">
  <li>Anmeldung beim Netzbetreiber ${d.netzbetreiberName}</li>
  <li>Registrierung im Marktstammdatenregister (MaStR)</li>
  <li>Beantragung des Zählerwechsels</li>
  ${d.ist14aRelevant ? '<li>Anmeldung nach §14a EnWG (steuerbare Verbrauchseinrichtung)</li>' : ''}
  <li>Sämtliche erforderliche Kommunikation mit dem Netzbetreiber</li>
</ul>

<div class="signature-area">
  <p><strong>Ort, Datum:</strong> ${d.ort}, ${d.datum}</p>
  
  <div style="margin-top:20px;">
    <p><strong>Unterschrift des Vollmachtgebers:</strong></p>
    ${hasSignature 
      ? `<img src="${d.signaturBase64}" class="signature-img" alt="Elektronische Unterschrift"/>` 
      : '<div class="signature-line"></div>'
    }
    <p class="signature-label">${d.betreiberName}</p>
  </div>
  
  ${hasSignature ? `
  <div class="e-signature-notice">
    <h4>✓ Elektronisch signiertes Dokument</h4>
    <p>
      Dieses Dokument wurde am <strong>${timestamp}</strong> elektronisch signiert.<br>
      Die Unterschrift wurde vom Vollmachtgeber digital erstellt und ist rechtsgültig gemäß eIDAS-Verordnung (EU) Nr. 910/2014.<br><br>
      <strong>Signatur-ID:</strong> <span class="e-signature-id">${signaturId}</span><br>
      <strong>Signiert von:</strong> ${d.betreiberName}<br>
      <strong>Erstellungszeit:</strong> ${timestamp}
    </p>
  </div>
  ` : ''}
</div>

<div class="legal-notice">
  <strong>Rechtlicher Hinweis:</strong> Diese Vollmacht berechtigt den Bevollmächtigten zur Vertretung des Vollmachtgebers 
  gegenüber dem Netzbetreiber und anderen relevanten Stellen im Rahmen der Netzanmeldung. Die Vollmacht kann jederzeit 
  schriftlich widerrufen werden. Der Bevollmächtigte handelt im Auftrag und im Interesse des Vollmachtgebers.
</div>

<div class="footer">
  Erstellt mit Baunity Wizard | ${COMPANY.name} | ${COMPANY.email}
</div>

</body></html>`;
}
