/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  🚀 Baunity USER MANAGEMENT - ENDLEVEL 3D ANIMATED EDITION                     ║
 * ║  Features: Particles, 3D Tilt, Glassmorphism, Glow Effects, Animations      ║
 * ║  + Vollständige Firmendaten für Rechnungserstellung                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../modules/api/client";
import { useAuth } from "../modules/auth/AuthContext";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type Role = "ADMIN" | "MITARBEITER" | "KUNDE" | "SUBUNTERNEHMER" | "DEMO";
type ViewMode = "table" | "grid" | "tree";
type Toast = { type: "ok" | "error"; msg: string } | null;

interface WhiteLabelConfig {
  enabled: boolean;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
}

// NEU: Erweiterte Billing/Rechnungsdaten
interface BillingInfo {
  strasse: string | null;
  hausNr: string | null;
  plz: string | null;
  ort: string | null;
  land: string | null;
  ustId: string | null;
  steuernummer: string | null;
  telefon: string | null;
  ansprechpartner: string | null;
}

// NEU: Service-Preise Interface
interface ServicePrice {
  serviceKey: string;
  label: string;
  priceNet: number;
  vatRate: number;
}

const DEFAULT_SERVICES: ServicePrice[] = [
  { serviceKey: "NETZANMELDUNG", label: "Netzanmeldung", priceNet: 49.00, vatRate: 19 },
  { serviceKey: "LAGEPLAN", label: "Lageplan-Erstellung", priceNet: 29.00, vatRate: 19 },
  { serviceKey: "SCHALTPLAN", label: "Schaltplan-Erstellung", priceNet: 39.00, vatRate: 19 },
];

interface Kunde {
  id: number;
  name: string;
  firmenName?: string | null;
  // NEU: Rechnungsdaten
  strasse?: string | null;
  hausNr?: string | null;
  plz?: string | null;
  ort?: string | null;
  land?: string | null;
  ustId?: string | null;
  steuernummer?: string | null;
  telefon?: string | null;
  ansprechpartner?: string | null;
  whiteLabelConfig?: WhiteLabelConfig | null;
}

interface UserRow {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  active: boolean;
  kundeId: number | null;
  kunde: Kunde | null;
  parentUserId: number | null;
  subUsers?: UserRow[];
  createdAt: string;
  lastLoginAt: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const Icon = {
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  tree: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v6m0 0l-3 3m3-3l3 3M6 12v6m12-6v6M6 18h12"/>
    </svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ban: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  ),
  key: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  save: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  palette: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="11.5" r="2.5"/>
      <circle cx="17.5" cy="17.5" r="2.5"/><circle cx="9" cy="18.5" r="2.5"/>
      <circle cx="6" cy="12" r="2.5"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.75-.64 1.9-1.55.08-.48-.02-.97-.28-1.37-.26-.4-.38-.89-.28-1.37.15-.91.98-1.55 1.9-1.55H18c2.21 0 4-1.79 4-4 0-5.5-4.5-10-10-10z"/>
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  sparkles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/>
    </svg>
  ),
  // NEU: Icon für Rechnungsdaten
  fileText: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  mapPin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  euro: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 10h12M4 14h12M6 6a8 8 0 1 1 0 12"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 ENDLEVEL FEATURES: Command Palette, Keyboard Nav, Animated Stats
// ═══════════════════════════════════════════════════════════════════════════════

// Animated Counter Hook
function useCountUp(end: number, duration = 800) {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(0);
  useEffect(() => {
    if (end === prevEnd.current) return;
    const start = prevEnd.current;
    prevEnd.current = end;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  return count;
}

// Command Palette Component
function CommandPalette({ open, onClose, actions }: { 
  open: boolean; 
  onClose: () => void; 
  actions: Array<{ id: string; label: string; icon: React.ReactNode; shortcut?: string; action: () => void; category: string }> 
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query) return actions;
    const q = query.toLowerCase();
    return actions.filter(a => a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
  }, [actions, query]);

  useEffect(() => {
    if (open) { setQuery(""); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && filtered[selectedIndex]) { filtered[selectedIndex].action(); onClose(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose, filtered, selectedIndex]);

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-modal" onClick={e => e.stopPropagation()}>
        <div className="cmd-glow" />
        <div className="cmd-search">
          <span className="cmd-search__icon">{Icon.search}</span>
          <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }} placeholder="Suchen oder Befehl eingeben..." />
          <kbd>ESC</kbd>
        </div>
        <div className="cmd-results">
          {filtered.map((item, idx) => (
            <div key={item.id} className={`cmd-item ${idx === selectedIndex ? "cmd-item--active" : ""}`} onClick={() => { item.action(); onClose(); }} onMouseEnter={() => setSelectedIndex(idx)}>
              <span className="cmd-item__icon">{item.icon}</span>
              <span className="cmd-item__label">{item.label}</span>
              {item.shortcut && <kbd>{item.shortcut}</kbd>}
            </div>
          ))}
          {filtered.length === 0 && <div className="cmd-empty">Keine Ergebnisse für "{query}"</div>}
        </div>
        <div className="cmd-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigieren</span>
          <span><kbd>↵</kbd> Auswählen</span>
        </div>
      </div>
    </div>
  );
}

// Animated Stat Card
function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  const displayValue = useCountUp(value);
  return (
    <div className="stat-card" style={{ borderColor: `${color}30` }}>
      <div className="stat-card__icon" style={{ background: `${color}20`, color }}>{icon}</div>
      <div className="stat-card__content">
        <div className="stat-card__value">{displayValue}</div>
        <div className="stat-card__label">{label}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const getRoleIcon = (role: Role): React.ReactNode => {
  const icons: Record<Role, React.ReactNode> = {
    ADMIN: Icon.crown,
    MITARBEITER: Icon.shield,
    KUNDE: Icon.user,
    SUBUNTERNEHMER: Icon.building,
    DEMO: Icon.user,
  };
  return icons[role] || Icon.user;
};

const getRoleLabel = (role: Role): string => {
  const labels: Record<Role, string> = {
    ADMIN: "Admin",
    MITARBEITER: "Mitarbeiter",
    KUNDE: "Kunde",
    SUBUNTERNEHMER: "Subunternehmer",
    DEMO: "Demo",
  };
  return labels[role] || role;
};

const formatDate = (dt: string | null): string => {
  if (!dt) return "—";
  try {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dt));
  } catch {
    return dt;
  }
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLE BACKGROUND COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; hue: number;
    }> = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const initParticles = () => {
      particles = [];
      const count = Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 18000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          hue: Math.random() * 60 + 220,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.offsetWidth;
        if (p.x > canvas.offsetWidth) p.x = 0;
        if (p.y < 0) p.y = canvas.offsetHeight;
        if (p.y > canvas.offsetHeight) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${p.hue}, 80%, 60%, ${0.12 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animationId = requestAnimationFrame(animate);
    };

    resize();
    initParticles();
    animate();
    window.addEventListener("resize", () => { resize(); initParticles(); });
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: 0.5,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3D TILT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function TiltCard({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = (y - rect.height / 2) / 15;
    const rotateY = (rect.width / 2 - x) / 15;
    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
    });
  };

  const handleLeave = () => {
    setStyle({ transform: "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)" });
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        transition: "transform 0.15s ease-out",
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="um-modalOverlay" onClick={onClose}>
      <div className="um-modal" onClick={(e) => e.stopPropagation()}>
        <div className="um-modal__glow" />
        <div className="um-modal__head">
          <h3>{title}</h3>
          <button className="um-modal__close" onClick={onClose}>
            <span style={{ width: 18, height: 18 }}>{Icon.x}</span>
          </button>
        </div>
        <div className="um-modal__body">{children}</div>
        {footer && <div className="um-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TREE NODE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function TreeNode({
  user,
  selectedId,
  onSelect,
  depth = 0,
}: {
  user: UserRow;
  selectedId: number | null;
  onSelect: (id: number) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = user.subUsers && user.subUsers.length > 0;

  return (
    <div style={{ marginLeft: depth > 0 ? 24 : 0 }}>
      <TiltCard
        className={`um-treeNode ${user.id === selectedId ? "um-treeNode--active" : ""}`}
        onClick={() => onSelect(user.id)}
      >
        <div
          className="um-treeNode__toggle"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {hasChildren && (
            <span style={{ width: 16, height: 16, transform: expanded ? "rotate(90deg)" : "", transition: "0.2s" }}>
              {Icon.chevronRight}
            </span>
          )}
        </div>
        <div className={`um-avatar um-avatar--${user.role.toLowerCase()}`}>
          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
        </div>
        <div className="um-treeNode__info">
          <div className="um-treeNode__name">{user.name || user.email}</div>
          <div className="um-treeNode__email">{user.email}</div>
        </div>
        <span className={`um-badge um-badge--${user.role.toLowerCase()}`}>
          <span style={{ width: 12, height: 12 }}>{getRoleIcon(user.role)}</span>
          {getRoleLabel(user.role)}
        </span>
        {user.kunde?.whiteLabelConfig?.enabled && (
          <span className="um-badge um-badge--wl">
            <span style={{ width: 12, height: 12 }}>{Icon.globe}</span>
          </span>
        )}
      </TiltCard>
      {hasChildren && expanded && (
        <div className="um-treeChildren">
          {user.subUsers!.map((sub) => (
            <TreeNode key={sub.id} user={sub} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function UserManagementPage() {
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role?.toUpperCase() === "ADMIN";

  // Data
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [canCreateRoles, setCanCreateRoles] = useState<Role[]>([]);

  // UI
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | Role>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  // 🚀 ENDLEVEL: Command Palette State
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Create Modal - Grunddaten
  const [createOpen, setCreateOpen] = useState(false);
  const [cEmail, setCEmail] = useState("");
  const [cName, setCName] = useState("");
  const [cRole, setCRole] = useState<Role>("SUBUNTERNEHMER");
  const [cFirma, setCFirma] = useState("");
  // Create Modal - NEU: Rechnungsdaten
  const [cStrasse, setCStrasse] = useState("");
  const [cHausnummer, setCHausnummer] = useState("");
  const [cPlz, setCPlz] = useState("");
  const [cOrt, setCOrt] = useState("");
  const [cLand, setCLand] = useState("Deutschland");
  const [cUstId, setCUstId] = useState("");
  const [cSteuernummer, setCSteuernummer] = useState("");
  const [cTelefon, setCTelefon] = useState("");
  const [cAnsprechpartner, setCAnsprechpartner] = useState("");
  // Create Modal - White-Label
  const [cWLEnabled, setCWLEnabled] = useState(false);
  const [cWLCompany, setCWLCompany] = useState("");
  const [cWLPrimary, setCWLPrimary] = useState("#D4A843");
  const [cWLAccent, setCWLAccent] = useState("#EAD068");

  // Temp Password Modal
  const [tempOpen, setTempOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [tempEmail, setTempEmail] = useState("");

  // Selected User
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) || null, [rows, selectedId]);

  // Edit Fields - Grunddaten
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [eRole, setERole] = useState<Role>("KUNDE");
  const [eActive, setEActive] = useState(true);
  const [eFirma, setEFirma] = useState("");
  // Edit Fields - NEU: Rechnungsdaten
  const [eStrasse, setEStrasse] = useState("");
  const [eHausnummer, setEHausnummer] = useState("");
  const [ePlz, setEPlz] = useState("");
  const [eOrt, setEOrt] = useState("");
  const [eLand, setELand] = useState("");
  const [eUstId, setEUstId] = useState("");
  const [eSteuernummer, setESteuernummer] = useState("");
  const [eTelefon, setETelefon] = useState("");
  const [eAnsprechpartner, setEAnsprechpartner] = useState("");
  // Edit Fields - White-Label
  const [eWLEnabled, setEWLEnabled] = useState(false);
  const [eWLCompany, setEWLCompany] = useState("");
  const [eWLPrimary, setEWLPrimary] = useState("#D4A843");
  const [eWLAccent, setEWLAccent] = useState("#EAD068");

  // NEU: Service-Preise
  const [ePrices, setEPrices] = useState<ServicePrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesSaving, setPricesSaving] = useState(false);

  // ─── Toast ─────────────────────────────────────────────────────────────────

  const showToast = useCallback((type: "ok" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ─── Load Data ─────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "24");
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (viewMode === "tree") params.set("tree", "true");

      const res = await apiGet(`/admin/users?${params}`);
      setRows(res.data || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
      setCanCreateRoles(res.meta?.canCreateRoles || []);
      // Default-Rolle auf ersten erlaubten Wert setzen
      if (res.meta?.canCreateRoles?.length > 0) {
        setCRole(res.meta.canCreateRoles[0]);
      }

      if (!selectedId && res.data?.[0]?.id) {
        setSelectedId(res.data[0].id);
      }
    } catch (err) {
      console.error("Load failed:", err);
      showToast("error", "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, viewMode, selectedId, showToast]);

  useEffect(() => { load(); }, [page]);

  // ─── Sync Selected ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!selected) return;
    setEName(selected.name || "");
    setEEmail(selected.email);
    setERole(selected.role);
    setEActive(selected.active);
    // Firmendaten
    setEFirma(selected.kunde?.firmenName || "");
    setEStrasse(selected.kunde?.strasse || "");
    setEHausnummer(selected.kunde?.hausNr || "");
    setEPlz(selected.kunde?.plz || "");
    setEOrt(selected.kunde?.ort || "");
    setELand(selected.kunde?.land || "Deutschland");
    setEUstId(selected.kunde?.ustId || "");
    setESteuernummer(selected.kunde?.steuernummer || "");
    setETelefon(selected.kunde?.telefon || "");
    setEAnsprechpartner(selected.kunde?.ansprechpartner || "");
    // White-Label
    const wl = selected.kunde?.whiteLabelConfig;
    setEWLEnabled(wl?.enabled || false);
    setEWLCompany(wl?.companyName || "");
    setEWLPrimary(wl?.primaryColor || "#D4A843");
    setEWLAccent(wl?.accentColor || "#EAD068");
  }, [selectedId, selected]);

  // ─── Reset Create Form ─────────────────────────────────────────────────────

  const resetCreateForm = () => {
    setCEmail("");
    setCName("");
    setCRole(canCreateRoles[0] || "SUBUNTERNEHMER");
    setCFirma("");
    setCStrasse("");
    setCHausnummer("");
    setCPlz("");
    setCOrt("");
    setCLand("Deutschland");
    setCUstId("");
    setCSteuernummer("");
    setCTelefon("");
    setCAnsprechpartner("");
    setCWLEnabled(false);
    setCWLCompany("");
    setCWLPrimary("#D4A843");
    setCWLAccent("#EAD068");
  };

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  const createUser = async () => {
    if (!cEmail.trim()) return showToast("error", "E-Mail erforderlich");
    try {
      const payload: any = {
        email: cEmail.trim(),
        name: cName.trim() || null,
        role: cRole,
        kunde: {
          name: cName.trim() || cEmail.trim(),
          email: cEmail.trim(),  // 🔥 FIX: Email für Rechnungsversand
          firmenName: cFirma.trim() || null,
          // NEU: Rechnungsdaten
          strasse: cStrasse.trim() || null,
          hausNr: cHausnummer.trim() || null,
          plz: cPlz.trim() || null,
          ort: cOrt.trim() || null,
          land: cLand.trim() || null,
          ustId: cUstId.trim() || null,
          steuernummer: cSteuernummer.trim() || null,
          telefon: cTelefon.trim() || null,
          ansprechpartner: cAnsprechpartner.trim() || null,
          whiteLabelConfig: cWLEnabled
            ? { enabled: true, companyName: cWLCompany || cFirma, primaryColor: cWLPrimary, accentColor: cWLAccent, logoUrl: null }
            : null,
        },
      };
      const res = await apiPost("/admin/users", payload);
      setCreateOpen(false);
      resetCreateForm();
      if (res.tempPassword) {
        setTempPassword(res.tempPassword);
        setTempEmail(cEmail);
        setTempOpen(true);
      }
      showToast("ok", "Benutzer erstellt");
      load();
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Fehler");
    }
  };

  const saveUser = async () => {
    if (!selected) return;
    try {
      await apiPatch(`/admin/users/${selected.id}`, {
        email: eEmail.trim(),
        name: eName.trim() || null,
        role: eRole,
        active: eActive,
        kunde: {
          email: eEmail.trim(),  // 🔥 FIX: Email für Rechnungsversand
          firmenName: eFirma.trim() || null,
          // NEU: Rechnungsdaten
          strasse: eStrasse.trim() || null,
          hausNr: eHausnummer.trim() || null,
          plz: ePlz.trim() || null,
          ort: eOrt.trim() || null,
          land: eLand.trim() || null,
          ustId: eUstId.trim() || null,
          steuernummer: eSteuernummer.trim() || null,
          telefon: eTelefon.trim() || null,
          ansprechpartner: eAnsprechpartner.trim() || null,
          whiteLabelConfig: eWLEnabled
            ? { enabled: true, companyName: eWLCompany || eFirma, primaryColor: eWLPrimary, accentColor: eWLAccent, logoUrl: selected.kunde?.whiteLabelConfig?.logoUrl || null }
            : { enabled: false },
        },
      });
      showToast("ok", "Gespeichert");
      load();
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Fehler");
    }
  };

  const resetPassword = async () => {
    if (!selected || !confirm(`Passwort für ${selected.email} zurücksetzen?`)) return;
    try {
      const res = await apiPost(`/admin/users/${selected.id}/reset-password`, {});
      if (res.tempPassword) {
        setTempPassword(res.tempPassword);
        setTempEmail(selected.email);
        setTempOpen(true);
      }
      showToast("ok", "Passwort zurückgesetzt");
    } catch { showToast("error", "Fehler"); }
  };

  const deleteUser = async () => {
    if (!selected || !confirm(`${selected.email} wirklich löschen?`)) return;
    try {
      await apiDelete(`/admin/users/${selected.id}`);
      showToast("ok", "Gelöscht");
      setSelectedId(null);
      load();
    } catch { showToast("error", "Fehler"); }
  };

  // NEU: Service-Preise laden
  const loadPrices = useCallback(async (kundeId: number) => {
    setPricesLoading(true);
    try {
      const res = await apiGet(`/admin/kunden/${kundeId}/prices`);
      if (res.data && res.data.length > 0) {
        setEPrices(res.data.map((p: any) => ({
          serviceKey: p.serviceKey,
          label: DEFAULT_SERVICES.find(s => s.serviceKey === p.serviceKey)?.label || p.serviceKey,
          priceNet: p.priceNet,
          vatRate: p.vatRate,
        })));
      } else {
        // Standardpreise verwenden wenn keine kundenspezifischen vorhanden
        setEPrices([...DEFAULT_SERVICES]);
      }
    } catch {
      // Bei Fehler Standardpreise
      setEPrices([...DEFAULT_SERVICES]);
    } finally {
      setPricesLoading(false);
    }
  }, []);

  // NEU: Service-Preise speichern
  const savePrices = async () => {
    // 🔒 Nur Admins dürfen Preise speichern
    if (!isAdmin) {
      showToast("error", "Keine Berechtigung");
      return;
    }
    if (!selected?.kundeId) {
      showToast("error", "Kein Kunde verknüpft");
      return;
    }
    setPricesSaving(true);
    try {
      await apiPatch(`/admin/kunden/${selected.kundeId}/prices`, {
        prices: ePrices.map(p => ({
          serviceKey: p.serviceKey,
          priceNet: p.priceNet,
          vatRate: p.vatRate,
        })),
      });
      showToast("ok", "Preise gespeichert");
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Fehler beim Speichern");
    } finally {
      setPricesSaving(false);
    }
  };

  // NEU: Preise laden wenn Kunde ausgewählt wird (NUR FÜR ADMINS)
  useEffect(() => {
    if (isAdmin && selected?.kundeId) {
      loadPrices(selected.kundeId);
    } else {
      setEPrices([]);
    }
  }, [isAdmin, selected?.kundeId, loadPrices]);

  // 🚀 ENDLEVEL: Global Keyboard Shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setCmdOpen(true); }
      if (e.key === "?" && !cmdOpen && !createOpen) { e.preventDefault(); setShortcutsOpen(true); }
      if (e.key === "n" && (e.metaKey || e.ctrlKey) && canCreateRoles.length > 0) { e.preventDefault(); setCreateOpen(true); }
      if (e.key === "j" && !cmdOpen && !createOpen) { 
        e.preventDefault(); 
        const idx = rows.findIndex(r => r.id === selectedId); 
        if (idx < rows.length - 1) setSelectedId(rows[idx + 1].id); 
      }
      if (e.key === "k" && !e.metaKey && !e.ctrlKey && !cmdOpen && !createOpen) { 
        e.preventDefault(); 
        const idx = rows.findIndex(r => r.id === selectedId); 
        if (idx > 0) setSelectedId(rows[idx - 1].id); 
      }
      if (e.key === "r" && !cmdOpen && !createOpen && !e.metaKey && !e.ctrlKey) { e.preventDefault(); load(); }
      if (e.key === "1" && !cmdOpen && !createOpen) setViewMode("grid");
      if (e.key === "2" && !cmdOpen && !createOpen) setViewMode("table");
      if (e.key === "3" && !cmdOpen && !createOpen) { setViewMode("tree"); load(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [cmdOpen, createOpen, canCreateRoles, rows, selectedId, load]);

  // 🚀 ENDLEVEL: Command Actions
  const commandActions = useMemo(() => [
    { id: "new", label: "Neuer Benutzer", icon: Icon.plus, shortcut: "⌘N", action: () => setCreateOpen(true), category: "Aktionen" },
    { id: "refresh", label: "Aktualisieren", icon: Icon.refresh, shortcut: "R", action: () => load(), category: "Aktionen" },
    { id: "grid", label: "Grid-Ansicht", icon: Icon.grid, shortcut: "1", action: () => setViewMode("grid"), category: "Ansicht" },
    { id: "table", label: "Tabellen-Ansicht", icon: Icon.list, shortcut: "2", action: () => setViewMode("table"), category: "Ansicht" },
    { id: "tree", label: "Baum-Ansicht", icon: Icon.tree, shortcut: "3", action: () => { setViewMode("tree"); load(); }, category: "Ansicht" },
    { id: "shortcuts", label: "Tastenkürzel anzeigen", icon: Icon.sparkles, shortcut: "?", action: () => setShortcutsOpen(true), category: "Hilfe" },
    ...(selected ? [
      { id: "save", label: `${selected.name || selected.email} speichern`, icon: Icon.save, action: () => saveUser(), category: "Ausgewählt" },
      { id: "reset-pw", label: "Passwort zurücksetzen", icon: Icon.key, action: () => resetPassword(), category: "Ausgewählt" },
      { id: "delete", label: "Benutzer löschen", icon: Icon.trash, action: () => deleteUser(), category: "Ausgewählt" },
    ] : []),
  ], [selected, load, saveUser, resetPassword, deleteUser]);

  // Stats
  const stats = useMemo(() => ({
    total: rows.length,
    admins: rows.filter(u => u.role === "ADMIN").length,
    mitarbeiter: rows.filter(u => u.role === "MITARBEITER").length,
    subunternehmer: rows.filter(u => u.role === "SUBUNTERNEHMER").length,
    whitelabel: rows.filter(u => u.kunde?.whiteLabelConfig?.enabled).length,
  }), [rows]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{CSS}</style>
      <div className="um-page">
        <ParticleBackground />

        {/* 🚀 ENDLEVEL: Command Palette */}
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} actions={commandActions} />

        {/* 🚀 ENDLEVEL: Shortcuts Modal */}
        {shortcutsOpen && (
          <div className="um-modalOverlay" onClick={() => setShortcutsOpen(false)}>
            <div className="um-modal" style={{ width: "min(420px, 95vw)" }} onClick={e => e.stopPropagation()}>
              <div className="um-modal__glow" />
              <div className="um-modal__head">
                <h3>⌨️ Tastenkürzel</h3>
                <button className="um-modal__close" onClick={() => setShortcutsOpen(false)}><span style={{ width: 18, height: 18 }}>{Icon.x}</span></button>
              </div>
              <div className="um-modal__body">
                <div className="shortcuts-list">
                  <div className="shortcut"><kbd>⌘</kbd><kbd>K</kbd><span>Befehlspalette</span></div>
                  <div className="shortcut"><kbd>⌘</kbd><kbd>N</kbd><span>Neuer Benutzer</span></div>
                  <div className="shortcut"><kbd>R</kbd><span>Aktualisieren</span></div>
                  <div className="shortcut"><kbd>J</kbd><span>Nächster Benutzer</span></div>
                  <div className="shortcut"><kbd>K</kbd><span>Vorheriger Benutzer</span></div>
                  <div className="shortcut"><kbd>1</kbd><span>Grid-Ansicht</span></div>
                  <div className="shortcut"><kbd>2</kbd><span>Tabellen-Ansicht</span></div>
                  <div className="shortcut"><kbd>3</kbd><span>Baum-Ansicht</span></div>
                  <div className="shortcut"><kbd>?</kbd><span>Diese Hilfe</span></div>
                  <div className="shortcut"><kbd>ESC</kbd><span>Schließen</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="um-header">
          <div>
            <h1><span style={{ width: 32, height: 32 }}>{Icon.users}</span> Benutzerverwaltung</h1>
            <div className="um-headerSub">{isAdmin ? "Alle Benutzer" : "Ihre Mitarbeiter & Partner"} · {total} Einträge</div>
          </div>
          <div className="um-headerActions">
            {/* 🚀 ENDLEVEL: Command Palette Button */}
            <button className="um-btn um-btn--ghost" onClick={() => setCmdOpen(true)} title="Befehlspalette (⌘K)">
              <span style={{ width: 18, height: 18 }}>{Icon.sparkles}</span>
              <kbd style={{ marginLeft: 4, padding: "2px 6px", background: "rgba(255,255,255,0.1)", borderRadius: 4, fontSize: 10 }}>⌘K</kbd>
            </button>
            <button className="um-btn" onClick={load}>
              <span style={{ width: 18, height: 18 }}>{Icon.refresh}</span> Aktualisieren
            </button>
            {canCreateRoles.length > 0 && (
              <button className="um-btn um-btn--primary" onClick={() => setCreateOpen(true)}>
                <span style={{ width: 18, height: 18 }}>{Icon.plus}</span> Neuer Benutzer
              </button>
            )}
          </div>
        </div>

        {/* 🚀 ENDLEVEL: Animated Stats Row */}
        <div className="um-stats-row">
          <StatCard icon={Icon.users} value={stats.total} label="Gesamt" color="#D4A843" />
          <StatCard icon={Icon.crown} value={stats.admins} label="Admins" color="#f59e0b" />
          <StatCard icon={Icon.shield} value={stats.mitarbeiter} label="Mitarbeiter" color="#3b82f6" />
          <StatCard icon={Icon.building} value={stats.subunternehmer} label="Subunternehmer" color="#a855f7" />
          <StatCard icon={Icon.globe} value={stats.whitelabel} label="White-Label" color="#06b6d4" />
        </div>

        {/* Shell */}
        <div className="um-shell">
          {/* Left: List */}
          <div className="um-glass">
            <div className="um-toolbar">
              <div className="um-searchBox">
                {Icon.search}
                <input placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
              </div>
              {/* 🔒 Rollenfilter nur für Admins */}
              {isAdmin && (
                <select className="um-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)}>
                  <option value="">Alle Rollen</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MITARBEITER">Mitarbeiter</option>
                  <option value="KUNDE">Kunde</option>
                  <option value="SUBUNTERNEHMER">Subunternehmer</option>
                  <option value="DEMO">Demo</option>
                </select>
              )}
              <button className="um-btn" onClick={load}>Filtern</button>
              <div className="um-viewToggle">
                <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>{Icon.grid}</button>
                <button className={viewMode === "table" ? "active" : ""} onClick={() => setViewMode("table")}>{Icon.list}</button>
                <button className={viewMode === "tree" ? "active" : ""} onClick={() => { setViewMode("tree"); load(); }}>{Icon.tree}</button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 20 }}>{[...Array(5)].map((_, i) => <div key={i} className="um-skeleton" />)}</div>
            ) : rows.length === 0 ? (
              <div className="um-empty">{Icon.users}<div>Keine Benutzer gefunden</div></div>
            ) : viewMode === "tree" ? (
              <div className="um-treeWrap">
                {rows.filter((u) => !u.parentUserId).map((u) => (
                  <TreeNode key={u.id} user={u} selectedId={selectedId} onSelect={setSelectedId} />
                ))}
              </div>
            ) : viewMode === "grid" ? (
              <div className="um-grid">
                {rows.map((u) => (
                  <TiltCard key={u.id} className={`um-gridCard ${u.id === selectedId ? "um-gridCard--active" : ""}`} onClick={() => setSelectedId(u.id)}>
                    <div className="um-gridCard__head">
                      <div className={`um-avatar um-avatar--${u.role.toLowerCase()}`}>{u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="um-gridCard__name">{u.name || u.email}</div>
                        <div className="um-gridCard__email">{u.email}</div>
                      </div>
                    </div>
                    <div className="um-gridCard__meta">
                      <span className={`um-badge um-badge--${u.role.toLowerCase()}`}>
                        <span style={{ width: 12, height: 12 }}>{getRoleIcon(u.role)}</span>{getRoleLabel(u.role)}
                      </span>
                      {u.active ? <span className="um-badge um-badge--ok"><span style={{ width: 12, height: 12 }}>{Icon.check}</span></span> : <span className="um-badge um-badge--bad"><span style={{ width: 12, height: 12 }}>{Icon.ban}</span></span>}
                      {u.kunde?.whiteLabelConfig?.enabled && <span className="um-badge um-badge--wl"><span style={{ width: 12, height: 12 }}>{Icon.globe}</span></span>}
                    </div>
                  </TiltCard>
                ))}
              </div>
            ) : (
              <div className="um-tableWrap">
                <table className="um-table">
                  <thead><tr><th>Benutzer</th><th>Rolle</th><th>Status</th><th>Firma</th></tr></thead>
                  <tbody>
                    {rows.map((u) => (
                      <tr key={u.id} className={u.id === selectedId ? "active" : ""} onClick={() => setSelectedId(u.id)}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div className={`um-avatar um-avatar--${u.role.toLowerCase()}`} style={{ width: 40, height: 40, fontSize: 14 }}>{u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}</div>
                            <div><div style={{ fontWeight: 600 }}>{u.name || u.email}</div><div style={{ fontSize: 12, opacity: 0.5 }}>{u.email}</div></div>
                          </div>
                        </td>
                        <td><span className={`um-badge um-badge--${u.role.toLowerCase()}`}>{getRoleLabel(u.role)}</span></td>
                        <td>{u.active ? <span className="um-badge um-badge--ok">Aktiv</span> : <span className="um-badge um-badge--bad">Inaktiv</span>}</td>
                        <td style={{ opacity: 0.7 }}>{u.kunde?.firmenName || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="um-pagination">
              <span>Seite {page} von {totalPages}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="um-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Zurück</button>
                <button className="um-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Weiter</button>
              </div>
            </div>
          </div>

          {/* Right: Detail */}
          <div className="um-glass um-detailPanel">
            {!selected ? (
              <div className="um-empty" style={{ minHeight: 500 }}>{Icon.user}<div>Benutzer auswählen</div></div>
            ) : (
              <div className="um-detail">
                <div className="um-detailHead">
                  <div className={`um-avatar um-avatar--lg um-avatar--${selected.role.toLowerCase()}`}>{selected.name?.charAt(0) || selected.email.charAt(0).toUpperCase()}</div>
                  <div>
                    <h2>{selected.name || selected.email}</h2>
                    <p>{selected.email}</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <span className={`um-badge um-badge--${selected.role.toLowerCase()}`}><span style={{ width: 12, height: 12 }}>{getRoleIcon(selected.role)}</span>{getRoleLabel(selected.role)}</span>
                      {selected.active ? <span className="um-badge um-badge--ok">Aktiv</span> : <span className="um-badge um-badge--bad">Inaktiv</span>}
                    </div>
                  </div>
                </div>

                <div className="um-stats">
                  <div className="um-stat"><div className="um-stat__value">#{selected.id}</div><div className="um-stat__label">User-ID</div></div>
                  <div className="um-stat"><div className="um-stat__value">{formatDate(selected.lastLoginAt)}</div><div className="um-stat__label">Letzter Login</div></div>
                </div>

                {/* White-Label */}
                <div className="um-wlSection">
                  <div className="um-wlHeader">
                    <h4><span style={{ width: 18, height: 18 }}>{Icon.palette}</span> White-Label</h4>
                    <label className="um-toggle"><input type="checkbox" checked={eWLEnabled} onChange={(e) => setEWLEnabled(e.target.checked)} /><span className="um-toggle__slider" /></label>
                  </div>
                  {eWLEnabled && (
                    <>
                      <div className="um-field"><label>Firmenname im Dashboard</label><input value={eWLCompany} onChange={(e) => setEWLCompany(e.target.value)} placeholder="z.B. Solarfirma GmbH" /></div>
                      <div className="um-grid2">
                        <div className="um-field"><label>Primärfarbe</label><div className="um-colorPicker"><input type="color" value={eWLPrimary} onChange={(e) => setEWLPrimary(e.target.value)} /><input type="text" value={eWLPrimary} onChange={(e) => setEWLPrimary(e.target.value)} /></div></div>
                        <div className="um-field"><label>Akzentfarbe</label><div className="um-colorPicker"><input type="color" value={eWLAccent} onChange={(e) => setEWLAccent(e.target.value)} /><input type="text" value={eWLAccent} onChange={(e) => setEWLAccent(e.target.value)} /></div></div>
                      </div>
                      <div className="um-wlPreview" style={{ background: `linear-gradient(135deg, ${eWLPrimary}20, ${eWLAccent}20)`, border: `1px solid ${eWLPrimary}40` }}>
                        <div className="um-wlPreview__icon" style={{ background: `linear-gradient(135deg, ${eWLPrimary}, ${eWLAccent})` }}>{Icon.building}</div>
                        <span style={{ fontWeight: 700 }}>{eWLCompany || eFirma || "Dashboard"}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Profile */}
                <div className="um-section">
                  <div className="um-sectionTitle"><span style={{ width: 14, height: 14 }}>{Icon.user}</span> Profil</div>
                  <div className="um-grid2">
                    <div className="um-field"><label>E-Mail</label><input value={eEmail} onChange={(e) => setEEmail(e.target.value)} /></div>
                    <div className="um-field"><label>Name</label><input value={eName} onChange={(e) => setEName(e.target.value)} /></div>
                  </div>
                  <div className="um-grid2">
                    <div className="um-field"><label>Rolle</label><select value={eRole} onChange={(e) => setERole(e.target.value as Role)} disabled={!isAdmin}><option value="ADMIN">Admin</option><option value="MITARBEITER">Mitarbeiter</option><option value="KUNDE">Kunde</option><option value="SUBUNTERNEHMER">Subunternehmer</option><option value="DEMO">Demo</option></select></div>
                    <div className="um-field"><label>Status</label><select value={eActive ? "true" : "false"} onChange={(e) => setEActive(e.target.value === "true")}><option value="true">Aktiv</option><option value="false">Inaktiv</option></select></div>
                  </div>
                </div>

                {/* Firma - Grunddaten */}
                <div className="um-section">
                  <div className="um-sectionTitle"><span style={{ width: 14, height: 14 }}>{Icon.building}</span> Firmendaten</div>
                  <div className="um-field"><label>Firmenname</label><input value={eFirma} onChange={(e) => setEFirma(e.target.value)} placeholder="z.B. Mustermann Solar GmbH" /></div>
                  <div className="um-field"><label>Ansprechpartner</label><input value={eAnsprechpartner} onChange={(e) => setEAnsprechpartner(e.target.value)} placeholder="z.B. Max Mustermann" /></div>
                  <div className="um-field"><label>Telefon</label><input value={eTelefon} onChange={(e) => setETelefon(e.target.value)} placeholder="z.B. +49 123 456789" /></div>
                </div>

                {/* NEU: Rechnungsadresse */}
                <div className="um-section">
                  <div className="um-sectionTitle"><span style={{ width: 14, height: 14 }}>{Icon.mapPin}</span> Rechnungsadresse</div>
                  <div className="um-grid2">
                    <div className="um-field" style={{ flex: 3 }}><label>Straße</label><input value={eStrasse} onChange={(e) => setEStrasse(e.target.value)} placeholder="z.B. Musterstraße" /></div>
                    <div className="um-field" style={{ flex: 1 }}><label>Nr.</label><input value={eHausnummer} onChange={(e) => setEHausnummer(e.target.value)} placeholder="z.B. 123" /></div>
                  </div>
                  <div className="um-grid2">
                    <div className="um-field" style={{ flex: 1 }}><label>PLZ</label><input value={ePlz} onChange={(e) => setEPlz(e.target.value)} placeholder="z.B. 12345" /></div>
                    <div className="um-field" style={{ flex: 2 }}><label>Ort</label><input value={eOrt} onChange={(e) => setEOrt(e.target.value)} placeholder="z.B. Musterstadt" /></div>
                  </div>
                  <div className="um-field"><label>Land</label><input value={eLand} onChange={(e) => setELand(e.target.value)} placeholder="z.B. Deutschland" /></div>
                </div>

                {/* NEU: Steuerdaten */}
                <div className="um-section">
                  <div className="um-sectionTitle"><span style={{ width: 14, height: 14 }}>{Icon.fileText}</span> Steuerdaten (für Rechnungen)</div>
                  <div className="um-grid2">
                    <div className="um-field"><label>USt-IdNr.</label><input value={eUstId} onChange={(e) => setEUstId(e.target.value)} placeholder="z.B. DE123456789" /></div>
                    <div className="um-field"><label>Steuernummer</label><input value={eSteuernummer} onChange={(e) => setESteuernummer(e.target.value)} placeholder="z.B. 123/456/78901" /></div>
                  </div>
                </div>

                {/* NEU: Service-Preise (nur für Kunden mit kundeId) - NUR FÜR ADMINS */}
                {isAdmin && selected.kundeId && (
                  <div className="um-section">
                    <div className="um-sectionTitle"><span style={{ width: 14, height: 14 }}>{Icon.euro}</span> Service-Preise (kundenspezifisch)</div>
                    {pricesLoading ? (
                      <div style={{ padding: 20, textAlign: "center", opacity: 0.5 }}>Lade Preise...</div>
                    ) : (
                      <>
                        {ePrices.map((price, idx) => (
                          <div key={price.serviceKey} className="um-grid2" style={{ marginBottom: 12, alignItems: "center" }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{price.label}</div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={price.priceNet}
                                onChange={(e) => {
                                  const newPrices = [...ePrices];
                                  newPrices[idx].priceNet = parseFloat(e.target.value) || 0;
                                  setEPrices(newPrices);
                                }}
                                style={{
                                  width: 100,
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  background: "rgba(255,255,255,0.05)",
                                  color: "#fff",
                                  textAlign: "right",
                                }}
                              />
                              <span style={{ opacity: 0.5, fontSize: 13 }}>€ netto</span>
                              <select
                                value={price.vatRate}
                                onChange={(e) => {
                                  const newPrices = [...ePrices];
                                  newPrices[idx].vatRate = parseInt(e.target.value);
                                  setEPrices(newPrices);
                                }}
                                style={{
                                  width: 70,
                                  padding: "8px",
                                  borderRadius: 8,
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  background: "rgba(255,255,255,0.05)",
                                  color: "#fff",
                                }}
                              >
                                <option value="19">19%</option>
                                <option value="7">7%</option>
                                <option value="0">0%</option>
                              </select>
                            </div>
                          </div>
                        ))}
                        <button
                          className="um-btn"
                          onClick={savePrices}
                          disabled={pricesSaving}
                          style={{ marginTop: 12 }}
                        >
                          <span style={{ width: 16, height: 16 }}>{Icon.save}</span>
                          {pricesSaving ? "Speichert..." : "Preise speichern"}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="um-actions">
                  <button className="um-btn um-btn--primary" onClick={saveUser}><span style={{ width: 16, height: 16 }}>{Icon.save}</span> Speichern</button>
                  <button className="um-btn" onClick={resetPassword}><span style={{ width: 16, height: 16 }}>{Icon.key}</span> Reset PW</button>
                  <button className="um-btn um-btn--danger" onClick={deleteUser}><span style={{ width: 16, height: 16 }}>{Icon.trash}</span> Löschen</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal - Erweitert mit Rechnungsdaten */}
        <Modal 
          open={createOpen} 
          title="Neuen Benutzer anlegen" 
          onClose={() => setCreateOpen(false)} 
          footer={
            <>
              <button className="um-btn" onClick={() => setCreateOpen(false)}>Abbrechen</button>
              <button className="um-btn um-btn--primary" onClick={createUser}>
                <span style={{ width: 16, height: 16 }}>{Icon.sparkles}</span> Erstellen
              </button>
            </>
          }
        >
          {/* Grunddaten */}
          <div className="um-section">
            <div className="um-sectionTitle"><span style={{ width: 14, height: 14 }}>{Icon.user}</span> Grunddaten</div>
            <div className="um-grid2">
              <div className="um-field"><label>E-Mail *</label><input value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="benutzer@firma.de" /></div>
              <div className="um-field"><label>Name</label><input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Max Mustermann" /></div>
            </div>
            <div className="um-field"><label>Rolle</label><select value={cRole} onChange={(e) => setCRole(e.target.value as Role)}>{canCreateRoles.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}</select></div>
          </div>

          {/* Firmendaten */}
          <div className="um-section">
            <div className="um-sectionTitle"><span style={{ width: 14, height: 14 }}>{Icon.building}</span> Firmendaten</div>
            <div className="um-field"><label>Firmenname</label><input value={cFirma} onChange={(e) => setCFirma(e.target.value)} placeholder="z.B. Mustermann Solar GmbH" /></div>
            <div className="um-grid2">
              <div className="um-field"><label>Ansprechpartner</label><input value={cAnsprechpartner} onChange={(e) => setCAnsprechpartner(e.target.value)} placeholder="z.B. Max Mustermann" /></div>
              <div className="um-field"><label>Telefon</label><input value={cTelefon} onChange={(e) => setCTelefon(e.target.value)} placeholder="z.B. +49 123 456789" /></div>
            </div>
          </div>

          {/* Rechnungsadresse */}
          <div className="um-section">
            <div className="um-sectionTitle"><span style={{ width: 14, height: 14 }}>{Icon.mapPin}</span> Rechnungsadresse</div>
            <div className="um-grid2">
              <div className="um-field" style={{ flex: 3 }}><label>Straße</label><input value={cStrasse} onChange={(e) => setCStrasse(e.target.value)} placeholder="z.B. Musterstraße" /></div>
              <div className="um-field" style={{ flex: 1 }}><label>Nr.</label><input value={cHausnummer} onChange={(e) => setCHausnummer(e.target.value)} placeholder="123" /></div>
            </div>
            <div className="um-grid2">
              <div className="um-field" style={{ flex: 1 }}><label>PLZ</label><input value={cPlz} onChange={(e) => setCPlz(e.target.value)} placeholder="12345" /></div>
              <div className="um-field" style={{ flex: 2 }}><label>Ort</label><input value={cOrt} onChange={(e) => setCOrt(e.target.value)} placeholder="Musterstadt" /></div>
            </div>
            <div className="um-field"><label>Land</label><input value={cLand} onChange={(e) => setCLand(e.target.value)} placeholder="Deutschland" /></div>
          </div>

          {/* Steuerdaten */}
          <div className="um-section">
            <div className="um-sectionTitle"><span style={{ width: 14, height: 14 }}>{Icon.fileText}</span> Steuerdaten (für Rechnungen)</div>
            <div className="um-grid2">
              <div className="um-field"><label>USt-IdNr.</label><input value={cUstId} onChange={(e) => setCUstId(e.target.value)} placeholder="z.B. DE123456789" /></div>
              <div className="um-field"><label>Steuernummer</label><input value={cSteuernummer} onChange={(e) => setCSteuernummer(e.target.value)} placeholder="z.B. 123/456/78901" /></div>
            </div>
          </div>

          {/* White-Label - Nur für Admins */}
          {authUser?.role?.toUpperCase() === "ADMIN" && (
            <div className="um-wlSection">
              <div className="um-wlHeader">
                <h4><span style={{ width: 18, height: 18 }}>{Icon.globe}</span> White-Label aktivieren</h4>
                <label className="um-toggle">
                  <input type="checkbox" checked={cWLEnabled} onChange={(e) => setCWLEnabled(e.target.checked)} />
                  <span className="um-toggle__slider" />
                </label>
              </div>
              {cWLEnabled && (
                <>
                  <div className="um-field" style={{ marginTop: 16 }}>
                    <label>Firmenname im Dashboard</label>
                    <input value={cWLCompany} onChange={(e) => setCWLCompany(e.target.value)} placeholder="z.B. Solarfirma GmbH" />
                  </div>
                  <div className="um-grid2">
                    <div className="um-field">
                      <label>Primärfarbe</label>
                      <div className="um-colorPicker">
                        <input type="color" value={cWLPrimary} onChange={(e) => setCWLPrimary(e.target.value)} />
                        <input type="text" value={cWLPrimary} onChange={(e) => setCWLPrimary(e.target.value)} />
                      </div>
                    </div>
                    <div className="um-field">
                      <label>Akzentfarbe</label>
                      <div className="um-colorPicker">
                        <input type="color" value={cWLAccent} onChange={(e) => setCWLAccent(e.target.value)} />
                        <input type="text" value={cWLAccent} onChange={(e) => setCWLAccent(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal>

        {/* Temp Password Modal */}
        <Modal open={tempOpen} title="Temporäres Passwort" onClose={() => setTempOpen(false)} footer={<button className="um-btn" onClick={() => setTempOpen(false)}>Schließen</button>}>
          <div style={{ textAlign: "center" }}>
            <span className="um-badge" style={{ marginBottom: 16 }}><span style={{ width: 14, height: 14 }}>{Icon.key}</span> {tempEmail}</span>
            <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 16, padding: 24, margin: "20px 0" }}>
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 10 }}>Temporäres Passwort</div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "monospace", color: "#fbbf24", letterSpacing: 3 }}>{tempPassword}</div>
            </div>
            <button className="um-btn um-btn--primary" onClick={async () => { const ok = await copyToClipboard(tempPassword); showToast(ok ? "ok" : "error", ok ? "Kopiert!" : "Fehler"); }}>
              <span style={{ width: 16, height: 16 }}>{Icon.copy}</span> Kopieren
            </button>
          </div>
        </Modal>

        {/* Toast */}
        {toast && <div className={`um-toast um-toast--${toast.type}`}><div className="um-toast__dot" /><span className="um-toast__msg">{toast.msg}</span></div>}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const CSS = `
.um-page{position:relative;min-height:100vh;padding:24px;overflow:hidden}
.um-page::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 20% 0%,rgba(212,168,67,0.15) 0%,transparent 50%),radial-gradient(ellipse at 80% 100%,rgba(139,92,246,0.15) 0%,transparent 50%),radial-gradient(ellipse at 50% 50%,rgba(6,6,12,1) 0%,rgba(6,6,12,1) 100%);z-index:-2}

.um-header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px;animation:umFadeIn 0.6s ease}
@keyframes umFadeIn{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
.um-header h1{margin:0;font-size:28px;font-weight:800;background:linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.7) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:flex;align-items:center;gap:12px}
.um-header h1 svg{width:32px;height:32px;stroke:#EAD068}
.um-headerSub{font-size:14px;opacity:0.6;margin-top:4px}
.um-headerActions{display:flex;gap:12px}

.um-btn{position:relative;display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border:1px solid rgba(255,255,255,0.1);border-radius:14px;background:rgba(255,255,255,0.08);color:#fff;font-weight:700;font-size:13px;cursor:pointer;transition:all 0.25s ease;overflow:hidden}
.um-btn::before{content:'';position:absolute;inset:-2px;background:rgba(212,168,67,0.4);border-radius:16px;opacity:0;filter:blur(12px);transition:opacity 0.3s;z-index:-1}
.um-btn:hover::before{opacity:1}
.um-btn:hover{transform:translateY(-2px);border-color:rgba(255,255,255,0.2)}
.um-btn:active{transform:translateY(0)}
.um-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none!important}
.um-btn svg{width:18px;height:18px}
.um-btn--primary{background:rgba(212,168,67,0.25);border-color:rgba(212,168,67,0.35)}
.um-btn--primary::before{background:rgba(212,168,67,0.6)}
.um-btn--danger{background:rgba(239,68,68,0.2);border-color:rgba(239,68,68,0.3)}
.um-btn--danger::before{background:rgba(239,68,68,0.5)}

.um-shell{display:grid;grid-template-columns:1fr 480px;gap:20px;animation:umSlideUp 0.5s ease 0.1s both}
@keyframes umSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:1200px){.um-shell{grid-template-columns:1fr}}

.um-glass{position:relative;border-radius:24px;border:1px solid rgba(255,255,255,0.08);background:rgba(15,15,25,0.6);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 4px 30px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.05);overflow:hidden}
.um-glass::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)}

.um-detailPanel{max-height:calc(100vh - 180px);overflow-y:auto}

.um-toolbar{display:flex;gap:12px;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);flex-wrap:wrap;align-items:center}
.um-searchBox{position:relative;flex:1;min-width:200px}
.um-searchBox svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:18px;height:18px;opacity:0.4}
.um-searchBox input{width:100%;padding:12px 16px 12px 44px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#fff;font-size:14px;outline:none;transition:all 0.2s}
.um-searchBox input:focus{border-color:rgba(212,168,67,0.5);box-shadow:0 0 0 4px rgba(212,168,67,0.15)}
.um-select{padding:12px 16px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#fff;font-size:14px;outline:none;cursor:pointer}
.um-select option{background:#1a1a2e;color:#fff}

.um-select option{background:#1a1a2e;color:#fff}
.um-viewToggle{display:flex;background:rgba(255,255,255,0.04);border-radius:12px;padding:4px;gap:4px}
.um-viewToggle button{padding:8px 12px;border:none;background:transparent;color:rgba(255,255,255,0.5);border-radius:8px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center}
.um-viewToggle button svg{width:18px;height:18px}
.um-viewToggle button:hover{color:rgba(255,255,255,0.8)}
.um-viewToggle button.active{background:linear-gradient(135deg,rgba(212,168,67,0.4),rgba(139,92,246,0.4));color:#fff}

.um-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;padding:20px}
.um-gridCard{border-radius:18px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);padding:20px;cursor:pointer;transition:all 0.3s ease}
.um-gridCard:hover{border-color:rgba(212,168,67,0.3);background:rgba(212,168,67,0.05)}
.um-gridCard--active{border-color:rgba(212,168,67,0.5)!important;background:rgba(212,168,67,0.1)!important;box-shadow:0 0 30px rgba(212,168,67,0.2)}
.um-gridCard__head{display:flex;align-items:center;gap:14px;margin-bottom:16px}
.um-gridCard__name{font-weight:700;font-size:15px}
.um-gridCard__email{font-size:12px;opacity:0.5;margin-top:2px}
.um-gridCard__meta{display:flex;gap:8px;flex-wrap:wrap}

.um-avatar{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;color:#fff;background:linear-gradient(135deg,#D4A843,#EAD068);box-shadow:0 4px 15px rgba(212,168,67,0.4);flex-shrink:0;position:relative;overflow:hidden}
.um-avatar::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.2),transparent)}
.um-avatar--lg{width:72px;height:72px;font-size:28px;border-radius:20px}
.um-avatar--admin{background:linear-gradient(135deg,#f59e0b,#ef4444);box-shadow:0 4px 15px rgba(245,158,11,0.4)}
.um-avatar--mitarbeiter{background:linear-gradient(135deg,#3b82f6,#06b6d4);box-shadow:0 4px 15px rgba(59,130,246,0.4)}
.um-avatar--subunternehmer{background:linear-gradient(135deg,#a855f7,#ec4899);box-shadow:0 4px 15px rgba(168,85,247,0.4)}

.um-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05)}
.um-badge svg{width:12px;height:12px}
.um-badge--admin{background:linear-gradient(135deg,rgba(245,158,11,0.2),rgba(239,68,68,0.2));border-color:rgba(245,158,11,0.3);color:#fbbf24}
.um-badge--mitarbeiter{background:rgba(59,130,246,0.15);border-color:rgba(59,130,246,0.25);color:#60a5fa}
.um-badge--kunde{background:rgba(34,197,94,0.15);border-color:rgba(34,197,94,0.25);color:#4ade80}
.um-badge--subunternehmer{background:rgba(168,85,247,0.15);border-color:rgba(168,85,247,0.25);color:#c084fc}
.um-badge--ok{background:rgba(34,197,94,0.15);border-color:rgba(34,197,94,0.25);color:#4ade80}
.um-badge--bad{background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.25);color:#f87171}
.um-badge--wl{background:linear-gradient(135deg,rgba(212,168,67,0.2),rgba(139,92,246,0.2));border-color:rgba(212,168,67,0.3);color:#a5b4fc}

.um-treeWrap{padding:20px}
.um-treeNode{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);margin-bottom:8px;cursor:pointer}
.um-treeNode:hover{border-color:rgba(212,168,67,0.3)}
.um-treeNode--active{border-color:rgba(212,168,67,0.5)!important;background:rgba(212,168,67,0.1)!important}
.um-treeNode__toggle{width:24px;height:24px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.4)}
.um-treeNode__info{flex:1;min-width:0}
.um-treeNode__name{font-weight:600;font-size:14px}
.um-treeNode__email{font-size:12px;opacity:0.5}
.um-treeChildren{margin-left:36px;padding-left:16px;border-left:2px solid rgba(212,168,67,0.2)}

.um-tableWrap{overflow:auto;max-height:600px}
.um-table{width:100%;border-collapse:collapse}
.um-table th{text-align:left;padding:14px 16px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;opacity:0.5;background:rgba(0,0,0,0.2);position:sticky;top:0;z-index:1}
.um-table td{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04)}
.um-table tr{cursor:pointer;transition:background 0.2s}
.um-table tr:hover{background:rgba(255,255,255,0.03)}
.um-table tr.active{background:rgba(212,168,67,0.1)}

.um-pagination{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-top:1px solid rgba(255,255,255,0.06);font-size:13px;opacity:0.7}

.um-detail{padding:24px}
.um-detailHead{display:flex;align-items:center;gap:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:20px}
.um-detailHead h2{margin:0;font-size:20px;font-weight:800}
.um-detailHead p{margin:4px 0 0;font-size:13px;opacity:0.5}

.um-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px}
.um-stat{background:rgba(255,255,255,0.03);border-radius:14px;padding:16px;text-align:center}
.um-stat__value{font-size:20px;font-weight:800;background:linear-gradient(135deg,#fff,rgba(255,255,255,0.7));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.um-stat__label{font-size:11px;opacity:0.5;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em}

.um-section{margin-bottom:20px}
.um-sectionTitle{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;opacity:0.5;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.um-sectionTitle svg{width:14px;height:14px}

.um-field{margin-bottom:14px}
.um-field label{display:block;font-size:11px;font-weight:700;opacity:0.6;margin-bottom:6px}
.um-field input,.um-field select{width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#fff;font-size:14px;outline:none;transition:all 0.2s}
.um-field select option{background:#1a1a2e;color:#fff}
.um-field input:focus,.um-field select:focus{border-color:rgba(212,168,67,0.5);box-shadow:0 0 0 4px rgba(212,168,67,0.15)}
.um-field select option{background:#1a1a2e;color:#fff}
.um-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}

.um-wlSection{background:linear-gradient(135deg,rgba(212,168,67,0.1),rgba(139,92,246,0.1));border:1px solid rgba(212,168,67,0.2);border-radius:16px;padding:20px;margin-bottom:20px}
.um-wlHeader{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.um-wlHeader h4{margin:0;font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px}
.um-wlHeader h4 svg{width:18px;height:18px}

.um-toggle{position:relative;width:52px;height:28px}
.um-toggle input{opacity:0;width:0;height:0}
.um-toggle__slider{position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.1);border-radius:28px;transition:0.3s}
.um-toggle__slider::before{position:absolute;content:'';height:22px;width:22px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:0.3s;box-shadow:0 2px 8px rgba(0,0,0,0.3)}
.um-toggle input:checked+.um-toggle__slider{background:linear-gradient(135deg,#D4A843,#EAD068)}
.um-toggle input:checked+.um-toggle__slider::before{transform:translateX(24px)}

.um-colorPicker{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:8px 12px}
.um-colorPicker input[type=color]{width:32px;height:32px;border:none;border-radius:8px;cursor:pointer;background:transparent;padding:0}
.um-colorPicker input[type=text]{flex:1;background:transparent;border:none;color:#fff;font-size:13px;outline:none;font-family:monospace}

.um-wlPreview{display:flex;align-items:center;gap:14px;padding:16px;border-radius:12px;margin-top:16px}
.um-wlPreview__icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center}
.um-wlPreview__icon svg{width:24px;height:24px;color:#fff}

.um-actions{display:flex;gap:10px;flex-wrap:wrap;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06)}

.um-empty{padding:60px 20px;text-align:center;opacity:0.6}
.um-empty svg{width:64px;height:64px;opacity:0.3;margin-bottom:16px}

.um-skeleton{height:80px;border-radius:16px;background:rgba(255,255,255,0.03);margin-bottom:12px;position:relative;overflow:hidden}
.um-skeleton::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);animation:umShimmer 1.5s infinite}
@keyframes umShimmer{100%{transform:translateX(100%)}}

.um-modalOverlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;animation:umFadeIn 0.2s ease}
.um-modal{position:relative;width:min(650px,100%);max-height:90vh;display:flex;flex-direction:column;border-radius:24px;border:1px solid rgba(255,255,255,0.1);background:rgba(15,15,25,0.98);box-shadow:0 25px 80px rgba(0,0,0,0.5);overflow:hidden;animation:umScaleIn 0.3s ease}
@keyframes umScaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
.um-modal__glow{position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:300px;height:200px;background:radial-gradient(ellipse,rgba(212,168,67,0.3),transparent 70%);pointer-events:none}
.um-modal__head{padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between}
.um-modal__head h3{margin:0;font-size:18px;font-weight:800}
.um-modal__close{width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
.um-modal__close:hover{background:rgba(239,68,68,0.2);border-color:rgba(239,68,68,0.3)}
.um-modal__body{padding:24px;overflow-y:auto;flex:1}
.um-modal__foot{padding:16px 24px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:flex-end;gap:12px;background:rgba(0,0,0,0.2)}

.um-toast{position:fixed;bottom:24px;right:24px;padding:16px 24px;border-radius:16px;border:1px solid rgba(255,255,255,0.1);background:rgba(15,15,25,0.95);backdrop-filter:blur(10px);display:flex;align-items:center;gap:12px;box-shadow:0 10px 40px rgba(0,0,0,0.4);z-index:99999;animation:umSlideIn 0.3s ease}
@keyframes umSlideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
.um-toast__dot{width:12px;height:12px;border-radius:50%;background:#D4A843}
.um-toast--ok .um-toast__dot{background:#22c55e}
.um-toast--error .um-toast__dot{background:#ef4444}
.um-toast__msg{font-weight:700;font-size:14px}

/* 🚀 ENDLEVEL: Stats Row */
.um-stats-row{position:relative;z-index:10;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:20px}
.stat-card{display:flex;align-items:center;gap:12px;padding:16px 18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;backdrop-filter:blur(10px);transition:all 0.3s ease}
.stat-card:hover{background:rgba(255,255,255,0.05);transform:translateY(-2px)}
.stat-card__icon{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:12px}
.stat-card__icon svg{width:20px;height:20px}
.stat-card__value{font-size:22px;font-weight:800;background:linear-gradient(135deg,#fff,rgba(255,255,255,0.7));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat-card__label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;opacity:0.5}

/* 🚀 ENDLEVEL: Command Palette */
.cmd-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding-top:15vh;z-index:99999;animation:umFadeIn 0.15s ease}
.cmd-modal{position:relative;width:min(520px,95vw);border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:rgba(15,15,25,0.98);box-shadow:0 25px 80px rgba(0,0,0,0.5);overflow:hidden;animation:umScaleIn 0.2s ease}
.cmd-glow{position:absolute;top:-80px;left:50%;transform:translateX(-50%);width:200px;height:160px;background:radial-gradient(ellipse,rgba(212,168,67,0.4),transparent 70%);pointer-events:none}
.cmd-search{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06)}
.cmd-search__icon{width:20px;height:20px;opacity:0.4;flex-shrink:0}
.cmd-search input{flex:1;background:transparent;border:none;color:#fff;font-size:16px;outline:none}
.cmd-search input::placeholder{color:rgba(255,255,255,0.4)}
.cmd-search kbd{padding:4px 8px;background:rgba(255,255,255,0.1);border-radius:6px;font-size:11px;font-family:inherit;opacity:0.6}
.cmd-results{max-height:360px;overflow-y:auto;padding:8px}
.cmd-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;cursor:pointer;transition:all 0.15s}
.cmd-item:hover,.cmd-item--active{background:rgba(212,168,67,0.15)}
.cmd-item__icon{width:18px;height:18px;opacity:0.6;flex-shrink:0}
.cmd-item__label{flex:1;font-weight:500}
.cmd-item kbd{padding:3px 7px;background:rgba(255,255,255,0.08);border-radius:5px;font-size:10px;font-family:inherit;opacity:0.5}
.cmd-empty{padding:40px 20px;text-align:center;opacity:0.5}
.cmd-footer{display:flex;align-items:center;justify-content:center;gap:20px;padding:12px 16px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;opacity:0.5}
.cmd-footer kbd{padding:2px 6px;background:rgba(255,255,255,0.1);border-radius:4px;font-size:10px;font-family:inherit;margin-right:4px}

/* 🚀 ENDLEVEL: Shortcuts List */
.shortcuts-list{display:flex;flex-direction:column;gap:8px}
.shortcut{display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:10px}
.shortcut kbd{padding:4px 8px;background:rgba(212,168,67,0.2);border:1px solid rgba(212,168,67,0.3);border-radius:6px;font-size:11px;font-family:inherit;font-weight:600;color:#a5b4fc}
.shortcut span{flex:1;font-size:13px;opacity:0.8}

/* Ghost Button */
.um-btn--ghost{background:transparent;border-color:transparent}
.um-btn--ghost:hover:not(:disabled){background:rgba(255,255,255,0.05)}
`;
