/**
 * Baunity Lageplan Editor
 * ====================
 * Interaktiver Editor für NB-konforme Lagepläne
 * 
 * Features:
 * - Google Maps Screenshot Upload
 * - PV-Fläche einzeichnen (Polygon)
 * - HAK Position markieren
 * - Nordpfeil, Maßstab, Legende
 * - PDF Export
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { jsPDF } from 'jspdf';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Point {
  x: number;
  y: number;
}

interface PVFlaeche {
  id: string;
  points: Point[];
  name: string;
  color: string;
}

interface Marker {
  id: string;
  type: 'hak' | 'zaehler' | 'wechselrichter' | 'speicher';
  position: Point;
  label: string;
}

interface LageplanData {
  backgroundImage: string | null;
  pvFlaechen: PVFlaeche[];
  markers: Marker[];
  nordpfeilRotation: number;
  masstab: string;
  adresse: string;
  anlagenleistung: string;
}

interface LageplanEditorProps {
  adresse?: string;
  plz?: string;
  ort?: string;
  anlagenleistungKwp?: number;
  onSave?: (data: LageplanData, pdfBlob: Blob) => void;
  onClose?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const PV_COLORS = ['#FF9800', '#4CAF50', '#2196F3', '#9C27B0', '#F44336'];

const MARKER_ICONS: Record<string, { icon: string; label: string; color: string }> = {
  hak: { icon: '⚡', label: 'HAK', color: '#d32f2f' },
  zaehler: { icon: '📊', label: 'Zähler', color: '#1976d2' },
  wechselrichter: { icon: '🔄', label: 'WR', color: '#7b1fa2' },
  speicher: { icon: '🔋', label: 'Speicher', color: '#388e3c' },
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = `
.lageplan-editor {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.lageplan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.lageplan-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
}

.lageplan-title-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #10b981, #06b6d4);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.lageplan-actions {
  display: flex;
  gap: 12px;
}

.lageplan-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lageplan-btn--primary {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.lageplan-btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16,185,129,0.4);
}

.lageplan-btn--secondary {
  background: rgba(255,255,255,0.1);
  color: white;
  border: 1px solid rgba(255,255,255,0.2);
}

.lageplan-btn--secondary:hover {
  background: rgba(255,255,255,0.15);
}

.lageplan-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.lageplan-sidebar {
  width: 280px;
  background: rgba(255,255,255,0.03);
  border-right: 1px solid rgba(255,255,255,0.1);
  padding: 20px;
  overflow-y: auto;
}

.lageplan-section {
  margin-bottom: 24px;
}

.lageplan-section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 12px;
}

.lageplan-upload {
  border: 2px dashed rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.lageplan-upload:hover {
  border-color: #10b981;
  background: rgba(16,185,129,0.1);
}

.lageplan-upload-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.lageplan-upload-text {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}

.lageplan-upload-hint {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  margin-top: 8px;
}

.lageplan-tool-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.lageplan-tool {
  padding: 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.lageplan-tool:hover {
  background: rgba(255,255,255,0.1);
}

.lageplan-tool.active {
  background: rgba(16,185,129,0.2);
  border-color: #10b981;
}

.lageplan-tool-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.lageplan-tool-label {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
}

.lageplan-canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  position: relative;
  overflow: hidden;
}

.lageplan-canvas-wrapper {
  position: relative;
  background: white;
  box-shadow: 0 0 40px rgba(0,0,0,0.5);
}

.lageplan-canvas {
  display: block;
  cursor: crosshair;
}

.lageplan-placeholder {
  width: 800px;
  height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%);
  border-radius: 12px;
  color: rgba(255,255,255,0.5);
}

.lageplan-placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.lageplan-placeholder-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.lageplan-placeholder-hint {
  font-size: 13px;
  color: rgba(255,255,255,0.3);
}

.lageplan-google-hint {
  margin-top: 20px;
  padding: 16px;
  background: rgba(66,133,244,0.1);
  border: 1px solid rgba(66,133,244,0.3);
  border-radius: 8px;
}

.lageplan-google-hint-title {
  font-size: 13px;
  font-weight: 600;
  color: #4285f4;
  margin-bottom: 8px;
}

.lageplan-google-hint-steps {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  line-height: 1.6;
}

.lageplan-google-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 16px;
  background: #4285f4;
  color: white;
  border-radius: 6px;
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
}

.lageplan-google-link:hover {
  background: #3367d6;
}

.lageplan-legende {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255,255,255,0.95);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 11px;
  color: #333;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.lageplan-legende-title {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 12px;
}

.lageplan-legende-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.lageplan-legende-color {
  width: 16px;
  height: 12px;
  border-radius: 2px;
}

.lageplan-nordpfeil {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 50px;
  height: 50px;
  background: rgba(255,255,255,0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  cursor: pointer;
}

.lageplan-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.05);
  color: white;
  font-size: 13px;
  margin-bottom: 8px;
}

.lageplan-input:focus {
  outline: none;
  border-color: #10b981;
}

.lageplan-flaechen-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lageplan-flaeche-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
}

.lageplan-flaeche-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.lageplan-flaeche-name {
  flex: 1;
  font-size: 12px;
}

.lageplan-flaeche-delete {
  padding: 4px;
  cursor: pointer;
  opacity: 0.5;
}

.lageplan-flaeche-delete:hover {
  opacity: 1;
}
`;

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const LageplanEditor: React.FC<LageplanEditorProps> = ({
  adresse = '',
  plz = '',
  ort = '',
  anlagenleistungKwp = 0,
  onSave,
  onClose,
}) => {
  // State
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [pvFlaechen, setPvFlaechen] = useState<PVFlaeche[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [activeTool, setActiveTool] = useState<'pv' | 'hak' | 'zaehler' | 'wechselrichter' | 'speicher' | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [nordpfeilRotation, _setNordpfeilRotation] = useState(0);
  const [masstab, setMasstab] = useState('ca. 1:500');
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Inject styles
  useEffect(() => {
    if (document.getElementById('lageplan-editor-styles')) return;
    const style = document.createElement('style');
    style.id = 'lageplan-editor-styles';
    style.textContent = styles;
    document.head.appendChild(style);
  }, []);
  
  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background image
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawOverlays(ctx);
      };
      img.src = backgroundImage;
    } else {
      // Placeholder
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawOverlays(ctx);
    }
  }, [backgroundImage, pvFlaechen, markers, currentPoints]);
  
  const drawOverlays = (ctx: CanvasRenderingContext2D) => {
    // Draw PV-Flächen
    pvFlaechen.forEach(pv => {
      if (pv.points.length < 3) return;
      
      ctx.beginPath();
      ctx.moveTo(pv.points[0].x, pv.points[0].y);
      pv.points.forEach((p, i) => {
        if (i > 0) ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      
      ctx.fillStyle = pv.color + '60';
      ctx.fill();
      ctx.strokeStyle = pv.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Label
      const centerX = pv.points.reduce((s, p) => s + p.x, 0) / pv.points.length;
      const centerY = pv.points.reduce((s, p) => s + p.y, 0) / pv.points.length;
      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(pv.name, centerX, centerY);
    });
    
    // Draw current polygon being drawn
    if (currentPoints.length > 0 && activeTool === 'pv') {
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      currentPoints.forEach((p, i) => {
        if (i > 0) ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = PV_COLORS[pvFlaechen.length % PV_COLORS.length];
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Points
      currentPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = PV_COLORS[pvFlaechen.length % PV_COLORS.length];
        ctx.stroke();
      });
    }
    
    // Draw markers
    markers.forEach(m => {
      const markerInfo = MARKER_ICONS[m.type];
      
      // Circle background
      ctx.beginPath();
      ctx.arc(m.position.x, m.position.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = markerInfo.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Icon
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(markerInfo.icon, m.position.x, m.position.y);
      
      // Label
      ctx.font = 'bold 10px Arial';
      ctx.fillStyle = '#000';
      ctx.fillText(markerInfo.label, m.position.x, m.position.y + 26);
    });
  };
  
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 800x600 while keeping aspect ratio
        let width = img.width;
        let height = img.height;
        const maxWidth = 800;
        const maxHeight = 600;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        setImageSize({ width: Math.round(width), height: Math.round(height) });
        setBackgroundImage(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !activeTool) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeTool === 'pv') {
      // Add point to current polygon
      setCurrentPoints([...currentPoints, { x, y }]);
    } else {
      // Add marker
      const newMarker: Marker = {
        id: Date.now().toString(),
        type: activeTool,
        position: { x, y },
        label: MARKER_ICONS[activeTool].label,
      };
      setMarkers([...markers, newMarker]);
      setActiveTool(null);
    }
  };
  
  // Handle double click to finish polygon
  const handleCanvasDoubleClick = () => {
    if (activeTool === 'pv' && currentPoints.length >= 3) {
      const newFlaeche: PVFlaeche = {
        id: Date.now().toString(),
        points: currentPoints,
        name: `PV ${pvFlaechen.length + 1}`,
        color: PV_COLORS[pvFlaechen.length % PV_COLORS.length],
      };
      setPvFlaechen([...pvFlaechen, newFlaeche]);
      setCurrentPoints([]);
    }
  };
  
  // Delete PV Fläche
  const deleteFlaeche = (id: string) => {
    setPvFlaechen(pvFlaechen.filter(f => f.id !== id));
  };
  
  // Open Google Maps
  const openGoogleMaps = () => {
    const query = encodeURIComponent(`${adresse}, ${plz} ${ort}`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };
  
  // Export PDF
  const exportPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
    
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 15;
    
    // Header
    pdf.setFillColor(0, 90, 150);
    pdf.rect(0, 0, pageWidth, 20, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('LAGEPLAN', pageWidth / 2, 10, { align: 'center' });
    pdf.setFontSize(9);
    pdf.text(`${adresse}, ${plz} ${ort}`, pageWidth / 2, 16, { align: 'center' });
    
    // Canvas image
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - 2 * margin - 60;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;
    pdf.addImage(imgData, 'PNG', margin, 25, imgWidth, Math.min(imgHeight, pageHeight - 60));
    
    // Legende
    const legendX = pageWidth - margin - 55;
    let legendY = 30;
    
    pdf.setFillColor(245, 245, 245);
    pdf.rect(legendX - 5, legendY - 5, 55, 70, 'F');
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LEGENDE', legendX, legendY);
    legendY += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    pvFlaechen.forEach((pv) => {
      const color = pv.color.replace('#', '');
      const r = parseInt(color.substring(0, 2), 16);
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      pdf.setFillColor(r, g, b);
      pdf.rect(legendX, legendY - 2, 8, 4, 'F');
      pdf.text(pv.name, legendX + 12, legendY);
      legendY += 6;
    });
    
    Object.entries(MARKER_ICONS).forEach(([key, info]) => {
      if (markers.some(m => m.type === key)) {
        const color = info.color.replace('#', '');
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);
        pdf.setFillColor(r, g, b);
        pdf.circle(legendX + 4, legendY - 1, 3, 'F');
        pdf.text(info.label, legendX + 12, legendY);
        legendY += 6;
      }
    });
    
    // Nordpfeil
    pdf.setFillColor(255, 255, 255);
    pdf.circle(margin + 10, 35, 8, 'F');
    pdf.setDrawColor(0, 0, 0);
    pdf.circle(margin + 10, 35, 8, 'S');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('N', margin + 10, 33, { align: 'center' });
    pdf.setFontSize(6);
    pdf.text('↑', margin + 10, 38, { align: 'center' });
    
    // Schriftfeld
    const sfY = pageHeight - 25;
    pdf.setDrawColor(150, 150, 150);
    pdf.rect(margin, sfY, pageWidth - 2 * margin, 20);
    
    pdf.line(margin + 60, sfY, margin + 60, sfY + 20);
    pdf.line(margin + 140, sfY, margin + 140, sfY + 20);
    pdf.line(margin + 200, sfY, margin + 200, sfY + 20);
    pdf.line(margin, sfY + 8, pageWidth - margin, sfY + 8);
    
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Standort', margin + 2, sfY + 5);
    pdf.text('Anlagenleistung', margin + 62, sfY + 5);
    pdf.text('Maßstab', margin + 142, sfY + 5);
    pdf.text('Datum / Erstellt', margin + 202, sfY + 5);
    
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${adresse}`, margin + 2, sfY + 14);
    pdf.text(`${plz} ${ort}`, margin + 2, sfY + 18);
    pdf.text(`${anlagenleistungKwp.toFixed(2)} kWp`, margin + 62, sfY + 14);
    pdf.text(masstab, margin + 142, sfY + 14);
    pdf.text(new Date().toLocaleDateString('de-DE'), margin + 202, sfY + 14);
    pdf.text('Baunity', margin + 202, sfY + 18);
    
    // Save
    const blob = pdf.output('blob');
    const filename = `Lageplan_${adresse.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    if (onSave) {
      onSave({
        backgroundImage,
        pvFlaechen,
        markers,
        nordpfeilRotation,
        masstab,
        adresse: `${adresse}, ${plz} ${ort}`,
        anlagenleistung: `${anlagenleistungKwp} kWp`,
      }, blob);
    }
    
    // Download
    const { downloadFile } = await import('@/utils/desktopDownload');
    await downloadFile({ filename, blob });
  };
  
  return (
    <div className="lageplan-editor">
      <div className="lageplan-header">
        <div className="lageplan-title">
          <div className="lageplan-title-icon">📍</div>
          <div>
            <div>Lageplan Editor</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{adresse}, {plz} {ort}</div>
          </div>
        </div>
        <div className="lageplan-actions">
          <button className="lageplan-btn lageplan-btn--secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button className="lageplan-btn lageplan-btn--primary" onClick={exportPDF} disabled={!backgroundImage}>
            📄 PDF Exportieren
          </button>
        </div>
      </div>
      
      <div className="lageplan-main">
        <div className="lageplan-sidebar">
          {/* Upload Section */}
          <div className="lageplan-section">
            <div className="lageplan-section-title">1. Satellitenbild hochladen</div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <div className="lageplan-upload" onClick={() => fileInputRef.current?.click()}>
              <div className="lageplan-upload-icon">🖼️</div>
              <div className="lageplan-upload-text">
                {backgroundImage ? 'Anderes Bild hochladen' : 'Bild hochladen'}
              </div>
              <div className="lageplan-upload-hint">PNG, JPG oder Screenshot</div>
            </div>
            
            <div className="lageplan-google-hint">
              <div className="lageplan-google-hint-title">💡 So geht's:</div>
              <div className="lageplan-google-hint-steps">
                1. Google Maps öffnen<br/>
                2. Adresse eingeben<br/>
                3. Auf "Satellit" umschalten<br/>
                4. Screenshot machen (Windows: Win+Shift+S)<br/>
                5. Hier hochladen
              </div>
              <div className="lageplan-google-link" onClick={openGoogleMaps}>
                🗺️ Google Maps öffnen
              </div>
            </div>
          </div>
          
          {/* Tools Section */}
          <div className="lageplan-section">
            <div className="lageplan-section-title">2. Einzeichnen</div>
            <div className="lageplan-tool-grid">
              <div 
                className={`lageplan-tool ${activeTool === 'pv' ? 'active' : ''}`}
                onClick={() => setActiveTool(activeTool === 'pv' ? null : 'pv')}
              >
                <div className="lageplan-tool-icon">☀️</div>
                <div className="lageplan-tool-label">PV-Fläche</div>
              </div>
              <div 
                className={`lageplan-tool ${activeTool === 'hak' ? 'active' : ''}`}
                onClick={() => setActiveTool(activeTool === 'hak' ? null : 'hak')}
              >
                <div className="lageplan-tool-icon">⚡</div>
                <div className="lageplan-tool-label">HAK</div>
              </div>
              <div 
                className={`lageplan-tool ${activeTool === 'zaehler' ? 'active' : ''}`}
                onClick={() => setActiveTool(activeTool === 'zaehler' ? null : 'zaehler')}
              >
                <div className="lageplan-tool-icon">📊</div>
                <div className="lageplan-tool-label">Zähler</div>
              </div>
              <div 
                className={`lageplan-tool ${activeTool === 'wechselrichter' ? 'active' : ''}`}
                onClick={() => setActiveTool(activeTool === 'wechselrichter' ? null : 'wechselrichter')}
              >
                <div className="lageplan-tool-icon">🔄</div>
                <div className="lageplan-tool-label">WR</div>
              </div>
            </div>
            
            {activeTool === 'pv' && (
              <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                Klicken Sie Punkte für die PV-Fläche. Doppelklick zum Abschließen.
              </div>
            )}
          </div>
          
          {/* Flächen List */}
          {pvFlaechen.length > 0 && (
            <div className="lageplan-section">
              <div className="lageplan-section-title">PV-Flächen</div>
              <div className="lageplan-flaechen-list">
                {pvFlaechen.map(f => (
                  <div key={f.id} className="lageplan-flaeche-item">
                    <div className="lageplan-flaeche-color" style={{ background: f.color }} />
                    <div className="lageplan-flaeche-name">{f.name}</div>
                    <div className="lageplan-flaeche-delete" onClick={() => deleteFlaeche(f.id)}>🗑️</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Settings */}
          <div className="lageplan-section">
            <div className="lageplan-section-title">3. Einstellungen</div>
            <input
              className="lageplan-input"
              placeholder="Maßstab (z.B. ca. 1:500)"
              value={masstab}
              onChange={e => setMasstab(e.target.value)}
            />
          </div>
        </div>
        
        <div className="lageplan-canvas-container">
          {backgroundImage ? (
            <div className="lageplan-canvas-wrapper">
              <canvas
                ref={canvasRef}
                className="lageplan-canvas"
                width={imageSize.width}
                height={imageSize.height}
                onClick={handleCanvasClick}
                onDoubleClick={handleCanvasDoubleClick}
              />
              
              {/* Nordpfeil */}
              <div className="lageplan-nordpfeil" title="Nordpfeil">
                <span style={{ transform: `rotate(${nordpfeilRotation}deg)`, display: 'block', fontSize: 24 }}>
                  ⬆️
                </span>
                <span style={{ position: 'absolute', top: 2, fontSize: 10, fontWeight: 'bold' }}>N</span>
              </div>
              
              {/* Legende */}
              {(pvFlaechen.length > 0 || markers.length > 0) && (
                <div className="lageplan-legende">
                  <div className="lageplan-legende-title">LEGENDE</div>
                  {pvFlaechen.map(f => (
                    <div key={f.id} className="lageplan-legende-item">
                      <div className="lageplan-legende-color" style={{ background: f.color }} />
                      <span>{f.name}</span>
                    </div>
                  ))}
                  {markers.map(m => (
                    <div key={m.id} className="lageplan-legende-item">
                      <div className="lageplan-legende-color" style={{ background: MARKER_ICONS[m.type].color, borderRadius: '50%' }} />
                      <span>{MARKER_ICONS[m.type].label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="lageplan-placeholder">
              <div className="lageplan-placeholder-icon">🗺️</div>
              <div className="lageplan-placeholder-text">Kein Bild hochgeladen</div>
              <div className="lageplan-placeholder-hint">
                Laden Sie einen Google Maps Screenshot hoch
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LageplanEditor;
