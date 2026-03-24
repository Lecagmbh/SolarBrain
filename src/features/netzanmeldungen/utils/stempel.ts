/**
 * Baunity FIRMENSTEMPEL GENERATOR
 * ================================
 * Generiert einen professionellen Firmenstempel als Canvas/Base64
 */

export interface StempelOptions {
  size?: number;
  color?: string;
  text?: {
    firma?: string;
    zusatz?: string;
    untertitel?: string;
  };
}

const DEFAULT_OPTIONS: Required<StempelOptions> = {
  size: 200,
  color: '#10b981',
  text: {
    firma: 'Baunity',
    zusatz: '',
    untertitel: 'ZERTIFIZIERT',
  },
};

/**
 * Generiert einen Firmenstempel als Base64 PNG
 */
export function generateStempel(options: StempelOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options, text: { ...DEFAULT_OPTIONS.text, ...options.text } };
  const { size, color, text } = opts;
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Canvas context not available');
  
  const cx = size / 2;
  const cy = size / 2;
  const r1 = size * 0.45; // Outer ring
  const r2 = size * 0.38; // Inner ring
  const r3 = size * 0.28; // Innermost ring
  
  // Clear canvas (transparent)
  ctx.clearRect(0, 0, size, size);
  
  // Draw outer ring
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.arc(cx, cy, r1, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw inner ring
  ctx.lineWidth = size * 0.01;
  ctx.beginPath();
  ctx.arc(cx, cy, r2, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw innermost ring
  ctx.lineWidth = size * 0.008;
  ctx.beginPath();
  ctx.arc(cx, cy, r3, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw curved text on top arc
  ctx.fillStyle = color;
  ctx.font = `bold ${size * 0.055}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawCurvedText(ctx, 'ZERTIFIZIERTER FACHBETRIEB', cx, cy, r1 - size * 0.04, Math.PI * 1.25, Math.PI * 0.5);
  
  // Draw curved text on bottom arc
  ctx.font = `bold ${size * 0.05}px Arial, sans-serif`;
  drawCurvedText(ctx, 'VDE-AR-N 4105 KONFORM', cx, cy, r1 - size * 0.04, Math.PI * 1.75, -Math.PI * 0.5, true);
  
  // Draw main company name
  ctx.font = `bold ${size * 0.16}px Arial Black, sans-serif`;
  ctx.fillText(text.firma!, cx, cy - size * 0.05);
  
  // Draw company addition
  ctx.font = `${size * 0.055}px Arial, sans-serif`;
  ctx.fillText(text.zusatz!, cx, cy + size * 0.07);
  
  // Draw line
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.2, cy + size * 0.13);
  ctx.lineTo(cx + size * 0.2, cy + size * 0.13);
  ctx.stroke();
  
  // Draw subtitle
  ctx.font = `${size * 0.045}px Arial, sans-serif`;
  ctx.fillText(text.untertitel!, cx, cy + size * 0.2);
  
  // Draw decorative stars
  ctx.font = `${size * 0.07}px Arial, sans-serif`;
  ctx.fillText('★', cx - size * 0.25, cy + size * 0.01);
  ctx.fillText('★', cx + size * 0.25, cy + size * 0.01);
  
  return canvas.toDataURL('image/png');
}

/**
 * Zeichnet Text entlang eines Kreisbogens
 */
function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  arcLength: number,
  inward: boolean = false
) {
  const chars = text.split('');
  const angleStep = arcLength / chars.length;
  
  ctx.save();
  ctx.translate(cx, cy);
  
  chars.forEach((char, i) => {
    const angle = startAngle + angleStep * i + angleStep / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + (inward ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(char, 0, 0);
    ctx.restore();
  });
  
  ctx.restore();
}

/**
 * Generiert einen Stempel als SVG String
 */
export function generateStempelSVG(options: StempelOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options, text: { ...DEFAULT_OPTIONS.text, ...options.text } };
  const { size, color, text } = opts;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="stempelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustColor(color, -30)};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Outer ring -->
  <circle cx="100" cy="100" r="95" fill="none" stroke="${color}" stroke-width="4"/>
  
  <!-- Inner ring -->
  <circle cx="100" cy="100" r="82" fill="none" stroke="${color}" stroke-width="2"/>
  
  <!-- Innermost ring -->
  <circle cx="100" cy="100" r="55" fill="none" stroke="${color}" stroke-width="1.5"/>
  
  <!-- Top arc text -->
  <path id="topArc" d="M 30,100 A 70,70 0 0,1 170,100" fill="none"/>
  <text fill="${color}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" letter-spacing="3">
    <textPath href="#topArc" startOffset="50%" text-anchor="middle">
      ZERTIFIZIERTER FACHBETRIEB
    </textPath>
  </text>
  
  <!-- Bottom arc text -->
  <path id="bottomArc" d="M 30,100 A 70,70 0 0,0 170,100" fill="none"/>
  <text fill="${color}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" letter-spacing="2">
    <textPath href="#bottomArc" startOffset="50%" text-anchor="middle">
      VDE-AR-N 4105 KONFORM
    </textPath>
  </text>
  
  <!-- Center content -->
  <text x="100" y="85" text-anchor="middle" fill="${color}" font-family="Arial Black, sans-serif" font-size="32" font-weight="bold">${text.firma}</text>
  <text x="100" y="105" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-size="11">${text.zusatz}</text>
  
  <!-- Divider line -->
  <line x1="60" y1="115" x2="140" y2="115" stroke="${color}" stroke-width="1"/>
  
  <!-- Registration info -->
  <text x="100" y="130" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-size="9">Eingetragen bei</text>
  <text x="100" y="142" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-size="10" font-weight="bold">Netzbetreibern</text>
  
  <!-- Stars decoration -->
  <text x="50" y="102" fill="${color}" font-size="14">★</text>
  <text x="150" y="102" fill="${color}" font-size="14">★</text>
</svg>`;
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default { generateStempel, generateStempelSVG };
