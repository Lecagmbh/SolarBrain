/**
 * SIGNATURE PAD COMPONENT
 * =======================
 * Canvas-basierte Unterschrift mit:
 * - Touch & Maus Support
 * - Glättung der Linien
 * - Export als PNG Base64
 * - Clear/Undo Funktionen
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2, Undo2, Check, Pen } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureBase64: string) => void;
  onCancel: () => void;
  width?: number;
  height?: number;
}

export function SignaturePad({ onSave, onCancel, width = 400, height = 200 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [paths, setPaths] = useState<{ x: number; y: number }[][]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    // Initial styling
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw signature line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();
    
    // Reset stroke style
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
  }, [width, height]);

  // Redraw all paths
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw signature line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();
    
    // Draw all paths
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    paths.forEach(path => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    });
  }, [paths, width, height]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Get coordinates from event
  const getCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Start drawing
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoords(e);
    setCurrentPath([coords]);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  // Continue drawing
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const coords = getCoords(e);
    setCurrentPath(prev => [...prev, coords]);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    
    setHasSignature(true);
  };

  // Stop drawing
  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentPath.length > 1) {
      setPaths(prev => [...prev, currentPath]);
    }
    setCurrentPath([]);
  };

  // Clear canvas
  const handleClear = () => {
    setPaths([]);
    setCurrentPath([]);
    setHasSignature(false);
  };

  // Undo last stroke
  const handleUndo = () => {
    if (paths.length === 0) return;
    setPaths(prev => prev.slice(0, -1));
    if (paths.length === 1) {
      setHasSignature(false);
    }
  };

  // Save signature
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    
    // Create a clean canvas for export (without the line)
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;
    
    exportCanvas.width = width;
    exportCanvas.height = height;
    
    // Transparent background
    ctx.clearRect(0, 0, width, height);
    
    // Draw only the signature
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    paths.forEach(path => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    });
    
    const base64 = exportCanvas.toDataURL('image/png');
    onSave(base64);
  };

  return (
    <div className="signature-pad">
      <div className="signature-pad__header">
        <Pen size={16} />
        <span>Unterschrift</span>
      </div>
      
      <div className="signature-pad__canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none' }}
        />
        
        {!hasSignature && (
          <div className="signature-pad__placeholder">
            Hier unterschreiben
          </div>
        )}
      </div>
      
      <div className="signature-pad__actions">
        <button className="sig-btn sig-btn--secondary" onClick={handleClear} disabled={!hasSignature}>
          <Trash2 size={14} />
          Löschen
        </button>
        <button className="sig-btn sig-btn--secondary" onClick={handleUndo} disabled={paths.length === 0}>
          <Undo2 size={14} />
          Rückgängig
        </button>
        <div style={{ flex: 1 }} />
        <button className="sig-btn" onClick={onCancel}>
          Abbrechen
        </button>
        <button className="sig-btn sig-btn--primary" onClick={handleSave} disabled={!hasSignature}>
          <Check size={14} />
          Übernehmen
        </button>
      </div>
      
      <style>{`
        .signature-pad {
          background: #1e293b;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .signature-pad__header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.875rem;
          font-weight: 500;
          color: #fff;
        }
        
        .signature-pad__canvas-container {
          position: relative;
          padding: 1rem;
        }
        
        .signature-pad__canvas-container canvas {
          display: block;
          width: 100%;
          border-radius: 8px;
          cursor: crosshair;
          background: #fff;
        }
        
        .signature-pad__placeholder {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #94a3b8;
          font-size: 0.875rem;
          pointer-events: none;
        }
        
        .signature-pad__actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sig-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #e2e8f0;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .sig-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .sig-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .sig-btn--primary {
          background: linear-gradient(135deg, #10b981, #059669);
          border-color: transparent;
          color: #fff;
        }
        
        .sig-btn--primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #34d399, #10b981);
        }
        
        .sig-btn--secondary {
          background: transparent;
          border-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

export default SignaturePad;
